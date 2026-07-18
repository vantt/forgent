import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  buildPrompt,
  loadRunnerConfig,
  modelForTier,
  resolveExecutorCommand,
  spawnWorker,
  RunnerConfigError,
  DispatchError,
  EXECUTOR_ADAPTERS,
  DEFAULT_ADAPTER,
} from '../../src/runner/dispatch.mjs';

// Fake executors only — every "command" spawned here is a node script this
// file writes to a mkdtemp directory at test time. No real agent CLI is
// ever invoked, and nothing here writes `.fgos/` or touches the main repo.

function mkTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-dispatch-test-'));
}

/** Write a fake executor node script that dumps its argv + cwd as JSON to
 * stdout and exits 0. Returns the absolute script path. */
function writeEchoExecutor(dir) {
  const scriptPath = path.join(dir, 'echo-executor.mjs');
  fs.writeFileSync(
    scriptPath,
    `
    const args = process.argv.slice(2);
    process.stdout.write(JSON.stringify({ args, cwd: process.cwd() }));
    process.exit(0);
    `,
  );
  return scriptPath;
}

/** Write a fake executor node script that blocks past any reasonable test
 * timeout (busy-wait, so spawnSync's timeout/SIGTERM path is exercised). */
function writeHangingExecutor(dir) {
  const scriptPath = path.join(dir, 'hanging-executor.mjs');
  fs.writeFileSync(
    scriptPath,
    `
    const until = Date.now() + 30000;
    while (Date.now() < until) { /* busy-wait past any test timeout */ }
    process.exit(0);
    `,
  );
  return scriptPath;
}

/** Write a fake executor that writes to stdout/stderr, then hangs past any
 * reasonable test timeout — for asserting the timeout path still captures
 * whatever was buffered before the kill. */
function writeHangingExecutorWithOutput(dir) {
  const scriptPath = path.join(dir, 'hanging-executor-with-output.mjs');
  fs.writeFileSync(
    scriptPath,
    `
    process.stdout.write('partial stdout before hang');
    process.stderr.write('partial stderr before hang');
    const until = Date.now() + 30000;
    while (Date.now() < until) { /* busy-wait past any test timeout */ }
    process.exit(0);
    `,
  );
  return scriptPath;
}

/** Write a fake executor that writes stdout and stderr as several SEPARATE
 * writes (not one flush), so onChunk observes multiple 'data' events instead
 * of collapsing to a single chunk. */
function writeMultiChunkExecutor(dir) {
  const scriptPath = path.join(dir, 'multi-chunk-executor.mjs');
  fs.writeFileSync(
    scriptPath,
    `
    process.stdout.write('out-chunk-1\\n');
    process.stdout.write('out-chunk-2\\n');
    process.stderr.write('err-chunk-1\\n');
    process.exit(0);
    `,
  );
  return scriptPath;
}

/** Write a fake executor that writes stdout well past a small maxBuffer,
 * so spawnWorker's manual maxBuffer-exceeded kill path is exercised. */
function writeChattyExecutor(dir) {
  const scriptPath = path.join(dir, 'chatty-executor.mjs');
  fs.writeFileSync(
    scriptPath,
    `
    const chunk = 'x'.repeat(1024);
    let i = 0;
    const interval = setInterval(() => {
      process.stdout.write(chunk);
      i += 1;
      if (i > 200) clearInterval(interval);
    }, 5);
    `,
  );
  return scriptPath;
}

function sampleWork(overrides = {}) {
  return {
    id: 'sample-work',
    title: 'Add the widget',
    kind: 'behavior_change',
    status: 'doing',
    deps: [],
    risk: 'low',
    refs: ['src/widget.mjs', 'docs/specs/widget.md'],
    verify: 'npm test',
    ...overrides,
  };
}

function baseConfig(executorArgs) {
  return {
    executor: { command: process.execPath, args: executorArgs },
    models: { light: 'haiku', standard: 'sonnet', heavy: 'opus' },
    timeoutMs: 5000,
  };
}

// --- buildPrompt: four framing sections + item fields -----------------

test('buildPrompt includes all five framing sections', () => {
  const prompt = buildPrompt(sampleWork());
  assert.match(prompt, /# Goal/);
  assert.match(prompt, /# Description/);
  assert.match(prompt, /# Worktree boundary/);
  assert.match(prompt, /# Expected proof/);
  assert.match(prompt, /# Constraints/);
});

test('buildPrompt describes the fgos-discovered report-not-write channel while keeping the never-call-fgos constraint (wgi-8)', () => {
  const prompt = buildPrompt(sampleWork());
  assert.match(prompt, /# Reporting discovered work/);
  assert.match(prompt, /```fgos-discovered/);
  assert.match(prompt, /"title"/);
  // the channel is a REPORT, never a write — the D3 write constraint stays intact
  assert.match(prompt, /Never call `fgos` yourself/);
  assert.match(prompt, /report, not a write/);
});

test('buildPrompt embeds work.description verbatim under the Description section', () => {
  const description = 'Line one.\nLine two with detail: do X, then Y — no truncation expected.';
  const prompt = buildPrompt(sampleWork({ description }));
  assert.match(prompt, /# Description\nLine one\.\nLine two with detail: do X, then Y — no truncation expected\./);
});

test('buildPrompt degrades to "(không có)" when the work item has no description', () => {
  const prompt = buildPrompt(sampleWork());
  assert.match(prompt, /# Description\n\(không có\)/);
});

test('buildPrompt with no feedback stays byte-identical to the pre-feedback shape (no Human feedback section)', () => {
  assert.equal(buildPrompt(sampleWork()), buildPrompt(sampleWork(), undefined));
  assert.doesNotMatch(buildPrompt(sampleWork(), {}), /# Human feedback/);
});

test('buildPrompt embeds the human answer and latest rejection reason verbatim under Human feedback', () => {
  const feedback = {
    answer: 'CHỐT (a): detectTrunk — origin/HEAD rồi HEAD, fallback main.',
    reason: 'Thiếu test master-trunk; giữ code, chỉ bổ sung test.',
  };
  const prompt = buildPrompt(sampleWork(), feedback);
  assert.match(prompt, /# Human feedback/);
  assert.ok(prompt.includes(feedback.answer));
  assert.ok(prompt.includes(feedback.reason));
  assert.match(prompt, /fix THIS before anything else/);
});

test('buildPrompt renders a reason-only feedback without an answer block', () => {
  const prompt = buildPrompt(sampleWork(), { reason: 'only the objection' });
  assert.match(prompt, /# Human feedback/);
  assert.ok(prompt.includes('only the objection'));
  assert.doesNotMatch(prompt, /Human answer/);
});

test('buildPrompt embeds title, kind, refs, and verify from the work item', () => {
  const work = sampleWork();
  const prompt = buildPrompt(work);
  assert.match(prompt, /Add the widget/);
  assert.match(prompt, /behavior_change/);
  assert.match(prompt, /src\/widget\.mjs/);
  assert.match(prompt, /docs\/specs\/widget\.md/);
  assert.match(prompt, /npm test/);
});

test('buildPrompt forbids the worker from calling fgos itself', () => {
  const prompt = buildPrompt(sampleWork());
  assert.match(prompt, /never call `fgos`/i);
});

test('buildPrompt handles a work item with empty refs', () => {
  const prompt = buildPrompt(sampleWork({ refs: [] }));
  assert.match(prompt, /\(none\)/);
});

// --- loadRunnerConfig: valid + malformed shapes -------------------------

test('loadRunnerConfig parses a valid committed-shaped config', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, '.fgos-runner.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['-p', '{prompt}', '--model', '{model}'] },
      models: { light: 'haiku', standard: 'sonnet', heavy: 'opus' },
      timeoutMs: 120000,
    }),
  );
  const cfg = loadRunnerConfig(configPath);
  assert.equal(cfg.executor.command, 'claude');
  assert.equal(cfg.models.standard, 'sonnet');
  assert.equal(cfg.timeoutMs, 120000);
});

test('loadRunnerConfig rejects a missing file', () => {
  assert.throws(() => loadRunnerConfig('/nonexistent/.fgos-runner.json'), RunnerConfigError);
});

test('loadRunnerConfig rejects invalid JSON', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'bad.json');
  fs.writeFileSync(configPath, '{ not valid json');
  assert.throws(() => loadRunnerConfig(configPath), RunnerConfigError);
});

test('loadRunnerConfig rejects a config missing executor.args', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'missing-args.json');
  fs.writeFileSync(configPath, JSON.stringify({ executor: { command: 'claude' }, models: {}, timeoutMs: 1000 }));
  assert.throws(() => loadRunnerConfig(configPath), RunnerConfigError);
});

test('loadRunnerConfig rejects a config missing models', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'missing-models.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({ executor: { command: 'claude', args: ['{prompt}'] }, timeoutMs: 1000 }),
  );
  assert.throws(() => loadRunnerConfig(configPath), RunnerConfigError);
});

test('loadRunnerConfig rejects a non-positive timeoutMs', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'bad-timeout.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({ executor: { command: 'claude', args: ['{prompt}'] }, models: {}, timeoutMs: 0 }),
  );
  assert.throws(() => loadRunnerConfig(configPath), RunnerConfigError);
});

// --- P41: per-tier `executors` override + C9 v2 named adapter -----------

test('loadRunnerConfig accepts a config with no "executors" block at all — pre-P41 shape, unchanged', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'no-executors.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      models: { standard: 'sonnet' },
      timeoutMs: 1000,
    }),
  );
  const cfg = loadRunnerConfig(configPath);
  assert.equal(cfg.executors, undefined);
});

test('loadRunnerConfig accepts a well-formed per-tier "executors" override', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'with-executors.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      executors: { light: { command: 'cheap-cli', args: ['{prompt}'] } },
      models: { light: 'haiku', standard: 'sonnet' },
      timeoutMs: 1000,
    }),
  );
  const cfg = loadRunnerConfig(configPath);
  assert.equal(cfg.executors.light.command, 'cheap-cli');
});

test('loadRunnerConfig rejects an "executors" block that is not an object', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'bad-executors-shape.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      executors: 'nope',
      models: {},
      timeoutMs: 1000,
    }),
  );
  assert.throws(() => loadRunnerConfig(configPath), RunnerConfigError);
});

test('loadRunnerConfig rejects an "executors.<tier>" entry missing args', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'bad-executors-entry.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      executors: { light: { command: 'cheap-cli' } },
      models: {},
      timeoutMs: 1000,
    }),
  );
  assert.throws(() => loadRunnerConfig(configPath), RunnerConfigError);
});

test('loadRunnerConfig rejects an unknown "adapter" value on the global executor', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'bad-adapter-global.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'], adapter: 'rpc' },
      models: {},
      timeoutMs: 1000,
    }),
  );
  assert.throws(() => loadRunnerConfig(configPath), RunnerConfigError);
});

test('loadRunnerConfig rejects an unknown "adapter" value on a per-tier executor', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'bad-adapter-tier.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      executors: { light: { command: 'cheap-cli', args: ['{prompt}'], adapter: 'app-server' } },
      models: {},
      timeoutMs: 1000,
    }),
  );
  assert.throws(() => loadRunnerConfig(configPath), RunnerConfigError);
});

test('EXECUTOR_ADAPTERS registers exactly one adapter today: cli-spawn (the RPC/app-server adapter is deferred per D a4fe4c2b)', () => {
  assert.deepEqual(Object.keys(EXECUTOR_ADAPTERS), ['cli-spawn']);
  assert.equal(DEFAULT_ADAPTER, 'cli-spawn');
});

test('the committed .fgos-runner.json at repo root loads and is well-formed', () => {
  const repoRoot = path.resolve(import.meta.dirname, '..', '..');
  const cfg = loadRunnerConfig(path.join(repoRoot, '.fgos-runner.json'));
  assert.deepEqual(Object.keys(cfg.models).sort(), ['heavy', 'light', 'standard']);
});

test('the committed .fgos-runner.json grants the worker exactly acceptEdits + git add/commit — no wider (per spike B)', () => {
  const repoRoot = path.resolve(import.meta.dirname, '..', '..');
  const cfg = loadRunnerConfig(path.join(repoRoot, '.fgos-runner.json'));
  const { args } = cfg.executor;
  assert.ok(args.includes('--permission-mode'));
  assert.equal(args[args.indexOf('--permission-mode') + 1], 'acceptEdits');
  assert.ok(args.includes('--allowedTools'));
  assert.equal(args[args.indexOf('--allowedTools') + 1], 'Bash(git add:*),Bash(git commit:*)');
  assert.ok(!args.includes('--dangerously-skip-permissions'));
});

// --- modelForTier: tier -> model, unknown tier is a validation error ----

test('modelForTier resolves each declared tier to its configured model', () => {
  const cfg = baseConfig(['{prompt}']);
  assert.equal(modelForTier(cfg, 'light'), 'haiku');
  assert.equal(modelForTier(cfg, 'standard'), 'sonnet');
  assert.equal(modelForTier(cfg, 'heavy'), 'opus');
});

test('modelForTier throws a validation error for an unknown tier', () => {
  const cfg = baseConfig(['{prompt}']);
  assert.throws(() => modelForTier(cfg, 'ultra-mega'), (err) => {
    assert.ok(err instanceof RunnerConfigError);
    assert.equal(err.category, 'validation');
    return true;
  });
});

// --- resolveExecutorCommand: per-element argv substitution, never shell -

test('resolveExecutorCommand substitutes {prompt} and {model} per array element', () => {
  const cfg = baseConfig(['-p', '{prompt}', '--model', '{model}']);
  const { command, args } = resolveExecutorCommand(cfg, { prompt: 'do the thing', model: 'sonnet' });
  assert.equal(command, process.execPath);
  assert.deepEqual(args, ['-p', 'do the thing', '--model', 'sonnet']);
});

test('resolveExecutorCommand keeps shell metacharacters and newlines in the prompt literal (argv, never a shell string)', () => {
  const cfg = baseConfig(['-p', '{prompt}']);
  const trickyPrompt = 'line one\nline two; rm -rf / && echo $(whoami) `id` | cat > /tmp/x';
  const { args } = resolveExecutorCommand(cfg, { prompt: trickyPrompt, model: 'sonnet' });
  assert.equal(args[1], trickyPrompt);
});

test('resolveExecutorCommand substitutes both placeholders even inside the same argv element', () => {
  const cfg = baseConfig(['{model}:{prompt}']);
  const { args } = resolveExecutorCommand(cfg, { prompt: 'p', model: 'm' });
  assert.deepEqual(args, ['m:p']);
});

test('resolveExecutorCommand defaults to the "cli-spawn" adapter when the executor block omits one', () => {
  const cfg = baseConfig(['{prompt}']);
  const { adapter } = resolveExecutorCommand(cfg, { prompt: 'p', model: 'm' });
  assert.equal(adapter, 'cli-spawn');
});

test('resolveExecutorCommand falls back to the global executor when no tier is given — every pre-P41 call site keeps working', () => {
  const cfg = baseConfig(['{prompt}']);
  const { command } = resolveExecutorCommand(cfg, { prompt: 'p', model: 'm' });
  assert.equal(command, process.execPath);
});

test('resolveExecutorCommand honors an executors.<tier> override ahead of the global executor for that tier', () => {
  const cfg = {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    executors: { heavy: { command: '/heavy/executor', args: ['{prompt}'] } },
    models: { light: 'haiku', standard: 'sonnet', heavy: 'opus' },
    timeoutMs: 5000,
  };
  const heavy = resolveExecutorCommand(cfg, { prompt: 'p', model: 'opus', tier: 'heavy' });
  assert.equal(heavy.command, '/heavy/executor');
  const standard = resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard' });
  assert.equal(standard.command, '/global/executor');
});

test('resolveExecutorCommand throws for an unknown adapter even on a raw config object that skipped loadRunnerConfig validation', () => {
  const cfg = { executor: { command: 'x', args: ['{prompt}'], adapter: 'not-a-real-adapter' }, models: {}, timeoutMs: 5000 };
  assert.throws(() => resolveExecutorCommand(cfg, { prompt: 'p', model: 'm' }), RunnerConfigError);
});

// --- spawnWorker: fake executor, tier->model, cwd, timeout, spawn-fail --

test('spawnWorker resolves tier -> model, runs in cwd, and passes the prompt via argv', async () => {
  const dir = mkTempDir();
  const scriptPath = writeEchoExecutor(dir);
  const cfg = baseConfig([scriptPath, '{prompt}', '--model', '{model}']);
  const runCwd = mkTempDir();

  const result = await spawnWorker(sampleWork({ tier: 'heavy' }), cfg, runCwd);

  assert.equal(result.status, 0);
  assert.equal(result.tier, 'heavy');
  assert.equal(result.model, 'opus');
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.args[0], buildPrompt(sampleWork({ tier: 'heavy' })));
  assert.equal(payload.args[1], '--model');
  assert.equal(payload.args[2], 'opus');
  assert.equal(fs.realpathSync(payload.cwd), fs.realpathSync(runCwd));
});

test('spawnWorker defaults to the standard tier when the work item omits tier', async () => {
  const dir = mkTempDir();
  const scriptPath = writeEchoExecutor(dir);
  const cfg = baseConfig([scriptPath, '{prompt}']);
  const result = await spawnWorker(sampleWork(), cfg, mkTempDir());
  assert.equal(result.tier, 'standard');
  assert.equal(result.model, 'sonnet');
});

test('spawnWorker (P41): light and heavy each dispatch through their own per-tier executor, standard falls back to the global one — all three resolved from ONE cfg object, proving mixed-tier dispatch within a single drain batch', async () => {
  const dir = mkTempDir();
  const lightScript = writeEchoExecutor(dir);
  const heavyDir = mkTempDir();
  const heavyScript = path.join(heavyDir, 'heavy-echo-executor.mjs');
  fs.writeFileSync(
    heavyScript,
    `
    const args = process.argv.slice(2);
    process.stdout.write(JSON.stringify({ args, cwd: process.cwd(), marker: 'heavy-executor' }));
    process.exit(0);
    `,
  );
  const globalScript = writeEchoExecutor(mkTempDir());

  const cfg = {
    executor: { command: process.execPath, args: [globalScript, '{prompt}', 'via-global'] },
    executors: {
      light: { command: process.execPath, args: [lightScript, '{prompt}', 'via-light'] },
      heavy: { command: process.execPath, args: [heavyScript, '{prompt}', 'via-heavy'] },
    },
    models: { light: 'haiku', standard: 'sonnet', heavy: 'opus' },
    timeoutMs: 5000,
  };

  const lightResult = await spawnWorker(sampleWork({ tier: 'light' }), cfg, mkTempDir());
  const heavyResult = await spawnWorker(sampleWork({ tier: 'heavy' }), cfg, mkTempDir());
  const standardResult = await spawnWorker(sampleWork({ tier: 'standard' }), cfg, mkTempDir());

  assert.deepEqual(JSON.parse(lightResult.stdout).args.slice(-1), ['via-light']);
  const heavyPayload = JSON.parse(heavyResult.stdout);
  assert.deepEqual(heavyPayload.args.slice(-1), ['via-heavy']);
  assert.equal(heavyPayload.marker, 'heavy-executor');
  assert.deepEqual(JSON.parse(standardResult.stdout).args.slice(-1), ['via-global']);
});

test('spawnWorker throws worker-timeout and kills the process when it runs past the time budget', async () => {
  const dir = mkTempDir();
  const scriptPath = writeHangingExecutor(dir);
  const cfg = baseConfig([scriptPath]);

  await assert.rejects(
    () => spawnWorker(sampleWork(), cfg, mkTempDir(), { timeoutMs: 200 }),
    (err) => {
      assert.ok(err instanceof DispatchError);
      assert.equal(err.errorClass, 'worker-timeout');
      // Zero output captured before the kill still yields empty strings,
      // not undefined/missing fields (per D2's must-have).
      assert.equal(err.stdout, '');
      assert.equal(err.stderr, '');
      return true;
    },
  );
});

test('spawnWorker attaches stdout/stderr captured before a worker-timeout kill', async () => {
  const dir = mkTempDir();
  const scriptPath = writeHangingExecutorWithOutput(dir);
  const cfg = baseConfig([scriptPath]);

  await assert.rejects(
    () => spawnWorker(sampleWork(), cfg, mkTempDir(), { timeoutMs: 200 }),
    (err) => {
      assert.ok(err instanceof DispatchError);
      assert.equal(err.errorClass, 'worker-timeout');
      assert.equal(err.stdout, 'partial stdout before hang');
      assert.equal(err.stderr, 'partial stderr before hang');
      return true;
    },
  );
});

test('spawnWorker throws worker-spawn-fail when the configured command does not exist', async () => {
  const cfg = {
    executor: { command: '/no/such/executor-binary-xyz', args: ['{prompt}'] },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
  await assert.rejects(
    () => spawnWorker(sampleWork(), cfg, mkTempDir()),
    (err) => {
      assert.ok(err instanceof DispatchError);
      assert.equal(err.errorClass, 'worker-spawn-fail');
      // The process never started, so nothing was ever buffered — still
      // empty strings, not undefined/missing fields.
      assert.equal(err.stdout, '');
      assert.equal(err.stderr, '');
      return true;
    },
  );
});

test('spawnWorker throws worker-spawn-fail with stdout captured up to a maxBuffer kill', async () => {
  const dir = mkTempDir();
  const scriptPath = writeChattyExecutor(dir);
  const cfg = baseConfig([scriptPath]);

  await assert.rejects(
    () => spawnWorker(sampleWork(), cfg, mkTempDir(), { maxBuffer: 2048 }),
    (err) => {
      assert.ok(err instanceof DispatchError);
      assert.equal(err.errorClass, 'worker-spawn-fail');
      assert.equal(err.cause, 'maxBuffer exceeded');
      assert.equal(typeof err.stdout, 'string');
      assert.ok(err.stdout.length > 0, 'expected some stdout captured before the maxBuffer kill');
      assert.equal(err.stderr, '');
      return true;
    },
  );
});

test('spawnWorker throws a RunnerConfigError (not DispatchError) for an unconfigured tier, before any spawn', () => {
  const dir = mkTempDir();
  const scriptPath = writeEchoExecutor(dir);
  const cfg = { executor: { command: scriptPath, args: ['{prompt}'] }, models: {}, timeoutMs: 5000 };
  assert.throws(() => spawnWorker(sampleWork({ tier: 'standard' }), cfg, mkTempDir()), RunnerConfigError);
});

// --- spawnWorker: opts.onChunk live tee (P39) ---------------------------

test('spawnWorker calls opts.onChunk for every stdout/stderr data event, tagged by stream, as they arrive', async () => {
  const dir = mkTempDir();
  const scriptPath = writeMultiChunkExecutor(dir);
  const cfg = baseConfig([scriptPath]);
  const seen = [];

  const result = await spawnWorker(sampleWork(), cfg, mkTempDir(), {
    onChunk: (stream, chunk) => seen.push([stream, chunk.toString()]),
  });

  assert.equal(result.status, 0);
  // every observed chunk concatenates back to exactly the accumulated stdout/stderr
  const stdoutSeen = seen.filter(([s]) => s === 'stdout').map(([, c]) => c).join('');
  const stderrSeen = seen.filter(([s]) => s === 'stderr').map(([, c]) => c).join('');
  assert.equal(stdoutSeen, result.stdout);
  assert.equal(stderrSeen, result.stderr);
  assert.ok(stdoutSeen.includes('out-chunk-1') && stdoutSeen.includes('out-chunk-2'));
  assert.ok(stderrSeen.includes('err-chunk-1'));
});

test('spawnWorker never throws when opts.onChunk itself throws (observability must not crash dispatch)', async () => {
  const dir = mkTempDir();
  const scriptPath = writeMultiChunkExecutor(dir);
  const cfg = baseConfig([scriptPath]);

  const result = await spawnWorker(sampleWork(), cfg, mkTempDir(), {
    onChunk: () => {
      throw new Error('a broken logging callback');
    },
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /out-chunk-1/);
});

test('spawnWorker still tees a chunk that crosses the maxBuffer threshold, before the kill', async () => {
  const dir = mkTempDir();
  const scriptPath = writeChattyExecutor(dir);
  const cfg = baseConfig([scriptPath]);
  const seen = [];

  await assert.rejects(
    () =>
      spawnWorker(sampleWork(), cfg, mkTempDir(), {
        maxBuffer: 2048,
        onChunk: (stream, chunk) => seen.push(chunk),
      }),
    (err) => {
      assert.equal(err.errorClass, 'worker-spawn-fail');
      return true;
    },
  );
  assert.ok(seen.length > 0, 'onChunk observed at least the chunks before the kill');
});

test('spawnWorker with no opts.onChunk behaves exactly as before (optional hook, default no-op)', async () => {
  const dir = mkTempDir();
  const scriptPath = writeMultiChunkExecutor(dir);
  const cfg = baseConfig([scriptPath]);
  const result = await spawnWorker(sampleWork(), cfg, mkTempDir());
  assert.equal(result.status, 0);
  assert.match(result.stdout, /out-chunk-1/);
});

test('spawnWorker surfaces a non-zero exit status without throwing (goal-check is the runner\'s job, not dispatch\'s)', async () => {
  const dir = mkTempDir();
  const scriptPath = path.join(dir, 'failing-executor.mjs');
  fs.writeFileSync(scriptPath, 'process.exit(7);');
  const cfg = baseConfig([scriptPath, '{prompt}']);
  const result = await spawnWorker(sampleWork(), cfg, mkTempDir());
  assert.equal(result.status, 7);
});
