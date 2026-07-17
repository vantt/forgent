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

test('spawnWorker surfaces a non-zero exit status without throwing (goal-check is the runner\'s job, not dispatch\'s)', async () => {
  const dir = mkTempDir();
  const scriptPath = path.join(dir, 'failing-executor.mjs');
  fs.writeFileSync(scriptPath, 'process.exit(7);');
  const cfg = baseConfig([scriptPath, '{prompt}']);
  const result = await spawnWorker(sampleWork(), cfg, mkTempDir());
  assert.equal(result.status, 7);
});
