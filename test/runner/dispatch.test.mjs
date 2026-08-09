import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync, execFileSync } from 'node:child_process';
import {
  buildPrompt,
  loadRunnerConfig,
  loadRunnerConfigFromDir,
  ensureRunnerConfigForDir,
  DEFAULT_RUNNER_CONFIG,
  detectAssistantCli,
  modelForTier,
  resolveExecutorCommand,
  resolveCapacityCli,
  decideDispatchMechanism,
  decideCapacityDispatchMechanism,
  decideCapacityCli,
  spawnWorker,
  RunnerConfigError,
  DispatchError,
  EXECUTOR_ADAPTERS,
  DEFAULT_ADAPTER,
  CAPACITY_KINDS,
} from '../../src/runner/dispatch.mjs';
import { initStore, registerTool } from '../../src/state/store.mjs';
import { writeLocalStatus, findExecutableOnPath } from '../../src/state/tool-registry.mjs';
import { resolveMainCheckoutRoot } from '../../src/runner/paths.mjs';

// Fake executors only — every "command" spawned here is a node script this
// file writes to a mkdtemp directory at test time. No real agent CLI is
// ever invoked, and nothing here writes `.fgos/` or touches the main repo.

function mkTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-dispatch-test-'));
}

/** tsk-2ig: a real, minimal git repo (not just a bare tmpdir) — `fgosDir`
 * returned is `<repoRoot>/.fgos`, matching `paths.mjs`'s real
 * `fgosDirFromRoot` shape, so `captureDispatchAttestation`'s
 * `path.dirname(fgosDir)` resolves to a real repo root with a real HEAD. */
function mkTempGitRepo() {
  const repoRoot = mkTempDir();
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: repoRoot });
  fs.writeFileSync(path.join(repoRoot, 'seed.txt'), 'seed\n');
  execFileSync('git', ['add', 'seed.txt'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-q', '-m', 'seed'], { cwd: repoRoot });
  const headCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).trim();
  const fgosDir = path.join(repoRoot, '.fgos');
  fs.mkdirSync(fgosDir);
  return { repoRoot, fgosDir, headCommit };
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

test('buildPrompt for a coding-domain (or no-domain) work item also contains a new "# Agent skill" section naming the fgos-code-implement SKILL.md', () => {
  const prompt = buildPrompt(sampleWork());
  assert.match(prompt, /# Agent skill/);
  assert.ok(prompt.includes('.claude/skills/fgos-code-implement/SKILL.md'));
});

// --- tsk-5mj D1/D6/D7: stage-aware buildPrompt (discovery dispatch) ------

test('buildPrompt omitting stage defaults to "executing", byte-identical to every pre-tsk-5mj call', () => {
  assert.equal(buildPrompt(sampleWork()), buildPrompt(sampleWork(), undefined, 'executing'));
});

test('buildPrompt with stage:"discovery" points the Agent skill section at fgos-researching\'s SKILL.md and selects the discovery template', () => {
  const prompt = buildPrompt(sampleWork(), undefined, 'discovery');
  assert.match(prompt, /# Agent skill/);
  assert.ok(prompt.includes('.claude/skills/fgos-researching/SKILL.md'));
  assert.match(prompt, /discovery stage/);
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

// tsk-3xd D1/D3 (docs/history/tsk-3xd-decompose-child-directive-prose/
// CONTEXT.md): `action`/`readFirst` render into a new "# Directive" section
// -- `action` from the item's own new field, `readFirst` derived from the
// existing `footprint` field (not a stored field of its own, D1).

test('buildPrompt includes a "# Directive" section naming action and files to read first', () => {
  const prompt = buildPrompt(sampleWork());
  assert.match(prompt, /# Directive/);
  assert.match(prompt, /# Files to read first/);
});

test('buildPrompt embeds work.action verbatim under the Directive section', () => {
  const action = 'D1: implement the parser per the locked format.';
  const prompt = buildPrompt(sampleWork({ action }));
  assert.match(prompt, /# Directive\nD1: implement the parser per the locked format\./);
});

test('buildPrompt degrades action to "(không có)" when the work item has no action', () => {
  const prompt = buildPrompt(sampleWork());
  assert.match(prompt, /# Directive\n\(không có\)/);
});

test('buildPrompt renders readFirst from the item\'s own footprint, joined, under "Files to read first"', () => {
  const prompt = buildPrompt(sampleWork({ footprint: ['src/parser.mjs', 'test/parser.test.mjs'] }));
  assert.match(prompt, /# Files to read first\nsrc\/parser\.mjs, test\/parser\.test\.mjs/);
});

test('buildPrompt degrades readFirst to "(không có)" when the work item has no footprint', () => {
  const prompt = buildPrompt(sampleWork());
  assert.match(prompt, /# Files to read first\n\(không có\)/);
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
  const configPath = path.join(dir, 'runner-config.json');
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
  assert.throws(() => loadRunnerConfig('/nonexistent/runner-config.json'), RunnerConfigError);
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

// --- tsk-4eu: "executors" keys must be tiers — a non-tier key (e.g. a
// capacity id like "judge") silently fell through to the global executor
// with no error, which is the live bug this pins.
test('loadRunnerConfig rejects an "executors" key that is not a tier, naming the bad key and the valid tier set', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'non-tier-executors-key.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      executors: { judge: { command: 'claude', args: ['{prompt}'] } },
      models: {},
      timeoutMs: 1000,
    }),
  );
  assert.throws(
    () => loadRunnerConfig(configPath),
    (err) =>
      err instanceof RunnerConfigError &&
      err.message.includes('judge') &&
      err.message.includes('light') &&
      err.message.includes('standard') &&
      err.message.includes('heavy'),
  );
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

// --- tsk-62v: capacity-aware `capacities` schema (D1/D2) -----------------

test('CAPACITY_KINDS reuses tool-registry\'s KINDS verbatim plus "task" (D2) — never a separate vocabulary', () => {
  assert.deepEqual(CAPACITY_KINDS, ['cli', 'binary', 'mcp', 'skill', 'http', 'task']);
});

test('loadRunnerConfig accepts a config with no "capacities" block at all — pre-tsk-62v shape, unchanged', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'no-capacities.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      models: { standard: 'sonnet' },
      timeoutMs: 1000,
    }),
  );
  const cfg = loadRunnerConfig(configPath);
  assert.equal(cfg.capacities, undefined);
});

test('loadRunnerConfig accepts a well-formed "capacities" entry carrying its own executor', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'with-capacities.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      capacities: { 'fgos-code-implement': { kind: 'cli', command: 'agy', args: ['{prompt}'] } },
      models: { standard: 'sonnet' },
      timeoutMs: 1000,
    }),
  );
  const cfg = loadRunnerConfig(configPath);
  assert.equal(cfg.capacities['fgos-code-implement'].command, 'agy');
});

test('loadRunnerConfig accepts a "capacities" entry naming only "kind" (metadata-only, falls through for its executor)', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'metadata-only-capacity.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      capacities: { distill: { kind: 'task', target: 'general-purpose', tier: 'standard' } },
      models: { standard: 'sonnet' },
      timeoutMs: 1000,
    }),
  );
  assert.doesNotThrow(() => loadRunnerConfig(configPath));
});

test('loadRunnerConfig rejects a "capacities" block that is not an object', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'bad-capacities-shape.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      capacities: 'nope',
      models: {},
      timeoutMs: 1000,
    }),
  );
  assert.throws(() => loadRunnerConfig(configPath), RunnerConfigError);
});

test('loadRunnerConfig rejects a "capacities.<id>" entry with an unknown "kind"', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'bad-capacity-kind.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      capacities: { distill: { kind: 'not-a-real-kind' } },
      models: {},
      timeoutMs: 1000,
    }),
  );
  assert.throws(() => loadRunnerConfig(configPath), RunnerConfigError);
});

test('loadRunnerConfig accepts "task" as a "capacities.<id>.kind" value (the one kind fgos tool never sees)', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'task-kind-capacity.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      capacities: { distill: { kind: 'task', target: 'general-purpose' } },
      models: {},
      timeoutMs: 1000,
    }),
  );
  assert.doesNotThrow(() => loadRunnerConfig(configPath));
});

test('loadRunnerConfig rejects a "capacities.<id>" entry declaring "command" without "args"', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'bad-capacity-entry.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      capacities: { 'fgos-code-implement': { kind: 'cli', command: 'agy' } },
      models: {},
      timeoutMs: 1000,
    }),
  );
  assert.throws(() => loadRunnerConfig(configPath), RunnerConfigError);
});

// --- capacities.<id>.allowCrossProvider (D1, tsk-32n) --------------------

test('loadRunnerConfig accepts a "capacities.<id>" entry with allowCrossProvider: true', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'allow-cross-provider.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      capacities: { 'fgos-code-implement': { kind: 'cli', command: 'agy', args: ['{prompt}'], allowCrossProvider: true } },
      models: { standard: 'sonnet' },
      timeoutMs: 1000,
    }),
  );
  assert.doesNotThrow(() => loadRunnerConfig(configPath));
});

test('loadRunnerConfig rejects a "capacities.<id>" entry whose allowCrossProvider is not a boolean', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'bad-allow-cross-provider.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      capacities: { 'fgos-code-implement': { kind: 'cli', command: 'agy', args: ['{prompt}'], allowCrossProvider: 'yes' } },
      models: { standard: 'sonnet' },
      timeoutMs: 1000,
    }),
  );
  assert.throws(() => loadRunnerConfig(configPath), RunnerConfigError);
});

test('EXECUTOR_ADAPTERS registers exactly one adapter today: cli-spawn (the RPC/app-server adapter is deferred per D a4fe4c2b)', () => {
  assert.deepEqual(Object.keys(EXECUTOR_ADAPTERS), ['cli-spawn']);
  assert.equal(DEFAULT_ADAPTER, 'cli-spawn');
});

/** Read the committed `.fgos/config.json`'s `runner` section directly
 * (never through `loadRunnerConfigFromDir`, which also merges in
 * `~/.fgos/config.json` -- these tests assert the REPO's own committed
 * content, not whatever a given test machine's global config adds). */
function committedRunnerConfig() {
  // Main-checkout-resolved, not `import.meta.dirname`-relative: this test
  // suite itself may be running from inside a worktree, whose `.fgos/` is
  // unconditionally wiped (ADR0020) -- only the main checkout carries the
  // real committed `.fgos/config.json`.
  const repoRoot = resolveMainCheckoutRoot(path.resolve(import.meta.dirname, '..', '..'));
  const parsed = JSON.parse(fs.readFileSync(path.join(repoRoot, '.fgos', 'config.json'), 'utf8'));
  return parsed.runner;
}

test('the committed .fgos/config.json runner section loads and is well-formed', () => {
  const cfg = committedRunnerConfig();
  assert.deepEqual(Object.keys(cfg.models).sort(), ['heavy', 'light', 'standard']);
});

test('the committed .fgos/config.json runner section grants the worker exactly acceptEdits + git add/commit — no wider (per spike B)', () => {
  const cfg = committedRunnerConfig();
  const { args } = cfg.executor;
  assert.ok(args.includes('--permission-mode'));
  assert.equal(args[args.indexOf('--permission-mode') + 1], 'acceptEdits');
  assert.ok(args.includes('--allowedTools'));
  assert.equal(args[args.indexOf('--allowedTools') + 1], 'Bash(git add:*),Bash(git commit:*)');
  assert.ok(!args.includes('--dangerously-skip-permissions'));
});

test('the committed .fgos/config.json runner section declares the submit-assist-classify capacity per CONTEXT.md D1/D7 (tsk-5l2-2): kind cli, adapter cli-spawn, tier light, allowCrossProvider true (tsk-32n D1 -- supersedes the earlier sensitiveData field name, which had inverted polarity against the restrictive-by-default requirement), and its args are a well-formed {prompt}/{model} template', () => {
  const cfg = committedRunnerConfig();
  const capacity = cfg.capacities?.['submit-assist-classify'];
  assert.ok(capacity, 'capacities.submit-assist-classify must exist');
  assert.equal(capacity.kind, 'cli');
  assert.equal(capacity.adapter, 'cli-spawn');
  assert.equal(capacity.tier, 'light');
  assert.equal(capacity.allowCrossProvider, true);
  assert.ok(typeof capacity.command === 'string' && capacity.command.length > 0);
  assert.ok(Array.isArray(capacity.args) && capacity.args.includes('{prompt}') && capacity.args.includes('{model}'));
});

/** Capture what's written to process.stderr during `fn()`; restores the
 * original `write` afterward even if `fn` throws. */
function captureStderr(fn) {
  const original = process.stderr.write.bind(process.stderr);
  let captured = '';
  process.stderr.write = (chunk) => {
    captured += chunk;
    return true;
  };
  try {
    fn();
  } finally {
    process.stderr.write = original;
  }
  return captured;
}

/** Create a temp PATH dir containing empty, executable (mode 0o755) files
 * named `names`, prepend it to `process.env.PATH` for the duration of
 * `fn()`, and always restore the original PATH afterward (even if `fn`
 * throws) — same restore-in-finally pattern as `captureStderr`. Used so
 * `ensureRunnerConfigForDir`'s PATH-dependent `detectAssistantCli()` call
 * inside these tests is deterministic regardless of what's actually
 * installed on the host machine running the suite (str82). */
function withKnownCliOnPath(names, fn) {
  const dir = mkTempDir();
  for (const name of names) {
    fs.writeFileSync(path.join(dir, name), '#!/bin/sh\nexit 0\n', { mode: 0o755 });
  }
  const originalPath = process.env.PATH;
  process.env.PATH = `${dir}${path.delimiter}${originalPath ?? ''}`;
  try {
    return fn();
  } finally {
    process.env.PATH = originalPath;
  }
}

// --- loadRunnerConfigFromDir / ensureRunnerConfigForDir: shared config ---
// file (tsk-2ta D1 amended / tsk-5vf D1/D2/D4; legacy fallback retired
// per tsk-5hv D1) ----------------------------------------------------------

test('loadRunnerConfigFromDir throws RunnerConfigError when the shared file does not exist', () => {
  const dir = mkTempDir();
  assert.throws(() => loadRunnerConfigFromDir(dir), RunnerConfigError);
});

test('loadRunnerConfigFromDir reads the runner section of the shared file', () => {
  const dir = mkTempDir();
  fs.mkdirSync(path.join(dir, '.fgos'), { recursive: true });
  fs.writeFileSync(
    path.join(dir, '.fgos', 'config.json'),
    JSON.stringify({ runner: { executor: { command: 'claude', args: ['{prompt}'] }, models: { standard: 'sonnet' }, timeoutMs: 5000 } }),
  );
  const cfg = loadRunnerConfigFromDir(dir);
  assert.equal(cfg.executor.command, 'claude');
  assert.equal(cfg.timeoutMs, 5000);
});

test('loadRunnerConfigFromDir throws RunnerConfigError on invalid JSON in the shared file', () => {
  const dir = mkTempDir();
  fs.mkdirSync(path.join(dir, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.fgos', 'config.json'), '{ not valid json');
  assert.throws(() => loadRunnerConfigFromDir(dir), RunnerConfigError);
});

test('loadRunnerConfigFromDir merges a project runner section against ~/.fgos/config.json, project winning per key', () => {
  const dir = mkTempDir();
  fs.mkdirSync(path.join(dir, '.fgos'), { recursive: true });
  fs.writeFileSync(
    path.join(dir, '.fgos', 'config.json'),
    JSON.stringify({ runner: { executor: { command: 'claude', args: ['{prompt}'] }, models: { standard: 'sonnet' }, timeoutMs: 5000 } }),
  );
  const homeDir = mkTempDir();
  fs.mkdirSync(path.join(homeDir, '.fgos'), { recursive: true });
  fs.writeFileSync(
    path.join(homeDir, '.fgos', 'config.json'),
    JSON.stringify({ runner: { timeoutMs: 999999, retries: 3 } }),
  );
  const prevHome = process.env.HOME;
  process.env.HOME = homeDir;
  let cfg;
  try {
    cfg = loadRunnerConfigFromDir(dir);
  } finally {
    process.env.HOME = prevHome;
  }
  // Project's own timeoutMs wins over global's.
  assert.equal(cfg.timeoutMs, 5000);
  // Global fills a key the project never set.
  assert.equal(cfg.retries, 3);
});

test('ensureRunnerConfigForDir bootstraps straight into the shared file on a true first run', () => {
  withKnownCliOnPath(['claude'], () => {
    const dir = mkTempDir();
    assert.equal(fs.existsSync(path.join(dir, '.fgos', 'config.json')), false);

    const cfg = ensureRunnerConfigForDir(dir);

    assert.equal(fs.existsSync(path.join(dir, '.fgos', 'config.json')), true);
    const written = JSON.parse(fs.readFileSync(path.join(dir, '.fgos', 'config.json'), 'utf8'));
    assert.deepEqual(written.runner, cfg);
    assert.equal(cfg.executor.command, 'claude');
  });
});

test('ensureRunnerConfigForDir fills missing default keys into an existing shared file\'s runner section and rewrites only that section', () => {
  const dir = mkTempDir();
  fs.mkdirSync(path.join(dir, '.fgos'), { recursive: true });
  const sharedPath = path.join(dir, '.fgos', 'config.json');
  fs.writeFileSync(
    sharedPath,
    JSON.stringify({
      runner: { executor: { command: 'claude', args: ['{prompt}'] }, models: { standard: 'sonnet' }, timeoutMs: 1000 },
      unrelatedSection: { keep: 'me' },
    }),
  );

  const cfg = ensureRunnerConfigForDir(dir);

  assert.deepEqual(cfg.parallel, DEFAULT_RUNNER_CONFIG.parallel);
  assert.equal(cfg.models.standard, 'sonnet');
  const written = JSON.parse(fs.readFileSync(sharedPath, 'utf8'));
  // A sibling section this item never touches survives untouched.
  assert.deepEqual(written.unrelatedSection, { keep: 'me' });
  assert.deepEqual(written.runner.parallel, DEFAULT_RUNNER_CONFIG.parallel);
});

test('ensureRunnerConfigForDir on an already-complete shared file does not rewrite it', () => {
  const dir = mkTempDir();
  fs.mkdirSync(path.join(dir, '.fgos'), { recursive: true });
  const sharedPath = path.join(dir, '.fgos', 'config.json');
  fs.writeFileSync(sharedPath, JSON.stringify({ runner: DEFAULT_RUNNER_CONFIG }));
  const before = fs.statSync(sharedPath).mtimeMs;

  const cfg = ensureRunnerConfigForDir(dir);

  assert.deepEqual(cfg, DEFAULT_RUNNER_CONFIG);
  assert.equal(fs.statSync(sharedPath).mtimeMs, before);
});

// --- detectAssistantCli: pure PATH scan, injected inputs (str82) --------

test('detectAssistantCli finds a candidate on an injected PATH without touching the real environment', () => {
  const dir = mkTempDir();
  fs.writeFileSync(path.join(dir, 'claude'), '#!/bin/sh\nexit 0\n', { mode: 0o755 });
  const realPathBefore = process.env.PATH;

  const found = detectAssistantCli(['claude', 'codex'], dir);

  assert.equal(found, 'claude');
  assert.equal(process.env.PATH, realPathBefore);
});

test('detectAssistantCli returns null when none of the candidates are present on the injected PATH', () => {
  const dir = mkTempDir();
  const found = detectAssistantCli(['claude', 'codex'], dir);
  assert.equal(found, null);
});

test('detectAssistantCli delegates to tool-registry.mjs\'s shared findExecutableOnPath (D5) — same result, one implementation', () => {
  const dir = mkTempDir();
  fs.writeFileSync(path.join(dir, 'claude'), '#!/bin/sh\nexit 0\n', { mode: 0o755 });
  assert.equal(detectAssistantCli(['claude', 'codex'], dir), findExecutableOnPath(['claude', 'codex'], dir));
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

// --- tsk-2ig: worktree-dispatch attestation (baseCommit/headRef) ---------

test('resolveExecutorCommand captures a real baseCommit/headRef when fgosDir points at a real repo', () => {
  const cfg = baseConfig(['-p', '{prompt}']);
  const { repoRoot, fgosDir, headCommit } = mkTempGitRepo();
  const resolved = resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', fgosDir });
  assert.equal(resolved.baseCommit, headCommit);
  assert.equal(resolved.headRef, 'main');
  fs.rmSync(repoRoot, { recursive: true, force: true });
});

test('resolveExecutorCommand: baseCommit/headRef are both null when fgosDir is omitted (no attempt made)', () => {
  const cfg = baseConfig(['-p', '{prompt}']);
  const resolved = resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet' });
  assert.equal(resolved.baseCommit, null);
  assert.equal(resolved.headRef, null);
});

test('resolveExecutorCommand: baseCommit/headRef fail closed to null (never throw) when fgosDir does not point at a git repo', () => {
  const cfg = baseConfig(['-p', '{prompt}']);
  const dir = mkTempDir(); // plain tmpdir, no .git anywhere in its ancestry assumed by the read
  const resolved = resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', fgosDir: dir });
  assert.equal(resolved.baseCommit, null);
  assert.equal(resolved.headRef, null);
});

// --- tsk-4hl (post-tsk-2ig independent review): attestRoot overrides
// fgosDir's own root -- a worker dispatches inside its OWN worktree
// (loop.mjs's wt.path), a different checkout than fgosDir's root (always
// the main checkout, ADR0020). Two unrelated real repos here (different
// HEAD commits, different branch names) makes "which root actually got
// read" unambiguous. ---

test('resolveExecutorCommand: attestRoot, when given, is read INSTEAD of fgosDir\'s own root (tsk-4hl fix)', () => {
  const cfg = baseConfig(['-p', '{prompt}']);
  const mainRepo = mkTempGitRepo(); // fgosDir points here
  const workerRepo = mkTempGitRepo(); // attestRoot points here -- a different repo entirely
  // mkTempGitRepo's single seed commit is fully deterministic (same tree,
  // message, author, second-precision timestamp) -- two independently
  // created repos can legitimately hash to the SAME commit. One extra
  // commit here makes workerRepo's HEAD genuinely distinct, so this test
  // proves attestRoot was actually read, not a coincidental hash collision.
  fs.writeFileSync(path.join(workerRepo.repoRoot, 'second.txt'), 'second\n');
  execFileSync('git', ['add', 'second.txt'], { cwd: workerRepo.repoRoot });
  execFileSync('git', ['commit', '-q', '-m', 'second'], { cwd: workerRepo.repoRoot });
  workerRepo.headCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: workerRepo.repoRoot, encoding: 'utf8' }).trim();
  const resolved = resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', fgosDir: mainRepo.fgosDir, attestRoot: workerRepo.repoRoot });
  assert.equal(resolved.baseCommit, workerRepo.headCommit, 'must attest the attestRoot repo, never fgosDir\'s own root');
  assert.notEqual(resolved.baseCommit, mainRepo.headCommit);
  fs.rmSync(mainRepo.repoRoot, { recursive: true, force: true });
  fs.rmSync(workerRepo.repoRoot, { recursive: true, force: true });
});

test('resolveExecutorCommand: attestRoot works even when fgosDir is omitted entirely', () => {
  const cfg = baseConfig(['-p', '{prompt}']);
  const { repoRoot, headCommit } = mkTempGitRepo();
  const resolved = resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', attestRoot: repoRoot });
  assert.equal(resolved.baseCommit, headCommit);
  fs.rmSync(repoRoot, { recursive: true, force: true });
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

// --- tsk-62v: capacity-aware resolve precedence (D4) — capacities > executors.<tier> > global executor

test('resolveExecutorCommand honors a capacities.<capacityId> override ahead of executors.<tier> and the global executor', () => {
  const cfg = {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    executors: { heavy: { command: '/heavy/executor', args: ['{prompt}'] } },
    capacities: { 'fgos-code-implement': { kind: 'cli', command: '/capacity/executor', args: ['{prompt}'], allowCrossProvider: true } },
    models: { heavy: 'opus' },
    timeoutMs: 5000,
  };
  const byCapacity = resolveExecutorCommand(cfg, { prompt: 'p', model: 'opus', tier: 'heavy', capacityId: 'fgos-code-implement' });
  assert.equal(byCapacity.command, '/capacity/executor');
  // no capacityId at all -> falls back to today's tier/global precedence, unaffected
  const byTierOnly = resolveExecutorCommand(cfg, { prompt: 'p', model: 'opus', tier: 'heavy' });
  assert.equal(byTierOnly.command, '/heavy/executor');
});

test('resolveExecutorCommand falls back to executors.<tier> when the capacities entry names no executor of its own (metadata-only)', () => {
  const cfg = {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    executors: { heavy: { command: '/heavy/executor', args: ['{prompt}'] } },
    capacities: { 'fgos-code-implement': { kind: 'task', target: 'general-purpose', tier: 'heavy' } },
    models: { heavy: 'opus' },
    timeoutMs: 5000,
  };
  const resolved = resolveExecutorCommand(cfg, { prompt: 'p', model: 'opus', tier: 'heavy', capacityId: 'fgos-code-implement' });
  assert.equal(resolved.command, '/heavy/executor');
});

// --- tsk-4eu: regression proof for the live symptom — "judge-decompose"
// used to fall through to the global executor (no "Read"), because its
// old home (executors.judge, a non-tier key) was never reachable by the
// tier-keyed lookup. Its own command/args (mirroring judge-discovery's
// already-correct shape) must now resolve directly via capacities.
test('resolveExecutorCommand resolves "judge-decompose" through its own capacities entry, args containing "Read"', () => {
  const cfg = {
    executor: { command: 'claude', args: ['{prompt}', '--allowedTools', 'Bash(git add:*),Bash(git commit:*)'] },
    capacities: {
      'judge-decompose': {
        kind: 'task',
        command: 'claude',
        args: ['{prompt}', '--allowedTools', 'Task,WebSearch,WebFetch,Read,Bash(rg:*),Bash(git add:*),Bash(git commit:*)'],
      },
    },
    models: { light: 'haiku', standard: 'sonnet', heavy: 'opus' },
    timeoutMs: 5000,
  };
  const resolved = resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', capacityId: 'judge-decompose' });
  assert.ok(resolved.args.some((arg) => arg.includes('Read')));
});

test('resolveExecutorCommand with a capacities block present but no matching capacityId stays on today\'s tier/global behavior, byte-identical', () => {
  const cfg = {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    capacities: { 'some-other-capacity': { kind: 'cli', command: '/other/executor', args: ['{prompt}'] } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
  const resolved = resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', capacityId: 'fgos-code-implement' });
  assert.equal(resolved.command, '/global/executor');
});

test('resolveExecutorCommand result carries "provider", defaulting to "command" when the executor block declares no explicit provider alias', () => {
  const cfg = { executor: { command: '/global/executor', args: ['{prompt}'] }, models: {}, timeoutMs: 5000 };
  const resolved = resolveExecutorCommand(cfg, { prompt: 'p', model: 'm' });
  assert.equal(resolved.provider, '/global/executor');
});

test('resolveExecutorCommand result carries an explicit "provider" alias when the executor block declares one', () => {
  const cfg = { executor: { command: '/usr/local/bin/agy-cli', provider: 'agy', args: ['{prompt}'] }, models: {}, timeoutMs: 5000 };
  const resolved = resolveExecutorCommand(cfg, { prompt: 'p', model: 'm' });
  assert.equal(resolved.provider, 'agy');
  assert.equal(resolved.command, '/usr/local/bin/agy-cli');
});

test('resolveExecutorCommand throws a RunnerConfigError when a kind:"cli" capacity is not registered and fgosDir is given', () => {
  const dir = mkTempDir();
  initStore(dir);
  const cfg = {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    capacities: { 'fgos-code-implement': { kind: 'cli', target: 'agy' } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
  assert.throws(
    () => resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', capacityId: 'fgos-code-implement', fgosDir: dir }),
    RunnerConfigError,
  );
});

test('resolveExecutorCommand throws a RunnerConfigError when a kind:"cli" capacity is registered but not present on this machine', () => {
  const dir = mkTempDir();
  initStore(dir);
  registerTool(dir, { name: 'fgos-code-implement', kind: 'cli', capability: 'coding', command: 'agy-definitely-not-on-path-xyz' });
  writeLocalStatus(dir, { 'fgos-code-implement': { status: 'missing', checkedAt: new Date().toISOString() } });
  const cfg = {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    capacities: { 'fgos-code-implement': { kind: 'cli', target: 'agy-definitely-not-on-path-xyz' } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
  assert.throws(
    () => resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', capacityId: 'fgos-code-implement', fgosDir: dir }),
    RunnerConfigError,
  );
});

test('resolveExecutorCommand resolves a kind:"cli" capacity through fgos-tool-query presence, falling through to executors.<tier> for the command, when registered and present', () => {
  const dir = mkTempDir();
  initStore(dir);
  registerTool(dir, { name: 'fgos-code-implement', kind: 'cli', capability: 'coding', command: 'agy' });
  writeLocalStatus(dir, { 'fgos-code-implement': { status: 'present', checkedAt: new Date().toISOString() } });
  const cfg = {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    executors: { standard: { command: '/standard/executor', args: ['{prompt}'] } },
    capacities: { 'fgos-code-implement': { kind: 'cli', target: 'agy', tier: 'standard', allowCrossProvider: true } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
  const resolved = resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', capacityId: 'fgos-code-implement', fgosDir: dir });
  assert.equal(resolved.command, '/standard/executor');
});

test('resolveExecutorCommand skips the fgos-tool-query presence check entirely when fgosDir is omitted, even with a kind:"cli" capacity present', () => {
  const cfg = {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    capacities: { 'fgos-code-implement': { kind: 'cli', target: 'agy-not-registered-anywhere', allowCrossProvider: true } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
  assert.doesNotThrow(() =>
    resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', capacityId: 'fgos-code-implement' }),
  );
});

// --- capacities.<id>.needs/for (D5/D6, tsk-1o7): US-027 -- binding matches
// by capability promise, never by tool name. A capacity that declares
// `needs` resolves its presence check against the tools registry's own
// `capability` field, not against whether the capacity's own id happens to
// match a registered tool's name ---

test('resolveExecutorCommand resolves a kind:"cli" capacity declaring needs+for through capability match, with no name coincidence between the capacity id and the registered tool name', () => {
  const dir = mkTempDir();
  initStore(dir);
  registerTool(dir, { name: 'agy-classify', kind: 'cli', capability: 'classification', command: 'agy' });
  writeLocalStatus(dir, { 'agy-classify': { status: 'present', checkedAt: new Date().toISOString() } });
  const cfg = {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    capacities: {
      'submit-assist-classify': { kind: 'cli', needs: 'classification', for: 'judge', command: 'agy', args: ['{prompt}'], allowCrossProvider: true },
    },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
  // Old tools[capacityId] lookup would fail here: no tool is registered
  // under the name "submit-assist-classify" at all.
  assert.equal(Object.prototype.hasOwnProperty.call(cfg.capacities['submit-assist-classify'], 'needs'), true);
  assert.doesNotThrow(() =>
    resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', capacityId: 'submit-assist-classify', fgosDir: dir }),
  );
});

test('resolveExecutorCommand resolves a needs-declaring capacity when a second provider is registered under the same capability but a different name', () => {
  const dir = mkTempDir();
  initStore(dir);
  registerTool(dir, { name: 'agy', kind: 'cli', capability: 'classification', command: 'agy' });
  registerTool(dir, { name: 'gemini-cli', kind: 'cli', capability: 'classification', command: 'gemini' });
  writeLocalStatus(dir, {
    agy: { status: 'missing', checkedAt: new Date().toISOString() },
    'gemini-cli': { status: 'present', checkedAt: new Date().toISOString() },
  });
  const cfg = {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    capacities: {
      'submit-assist-classify': { kind: 'cli', needs: 'classification', command: 'gemini', args: ['{prompt}'], allowCrossProvider: true },
    },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
  // The first-registered provider ("agy") is missing; the second one under
  // the SAME capability ("gemini-cli") is present -- the capacity itself
  // never had to be renamed or repointed to pick that up.
  assert.doesNotThrow(() =>
    resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', capacityId: 'submit-assist-classify', fgosDir: dir }),
  );
});

// --- capacities.<id>.agentType (D1/D2, tsk-3sw): kind:"task" capacity with
// no own command/args resolves via a synthesized executor, Claude-only ---

function agentTypeCfg() {
  return {
    executor: {
      command: 'claude',
      args: ['-p', '{prompt}', '--model', '{model}', '--permission-mode', 'acceptEdits', '--allowedTools', 'Bash(git add:*),Bash(git commit:*)'],
    },
    capacities: { 'my-agent-capacity': { kind: 'task', agentType: 'code-simplifier' } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
}

test('resolveExecutorCommand resolves a kind:"task" capacity naming only agentType into the global executor\'s own command, args minus --model, plus --agent <agentType>', () => {
  const cfg = agentTypeCfg();
  const resolved = resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', capacityId: 'my-agent-capacity' });
  assert.equal(resolved.command, 'claude');
  assert.deepEqual(resolved.args, [
    '-p', 'p', '--permission-mode', 'acceptEdits', '--allowedTools', 'Bash(git add:*),Bash(git commit:*)', '--agent', 'code-simplifier',
  ]);
  assert.ok(!resolved.args.includes('--model'));
});

test('resolveExecutorCommand resolves an agentType capacity identically whether fgosDir is given (cli-dispatch/spawnWorker-style) or omitted (task-dispatch/resolveCapacityCli-style)', () => {
  const cfg = agentTypeCfg();
  const dir = mkTempDir();
  initStore(dir);
  const withFgosDir = resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', capacityId: 'my-agent-capacity', fgosDir: dir });
  const withoutFgosDir = resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', capacityId: 'my-agent-capacity' });
  // command/args/adapter/provider (the actual agentType-resolution shape this
  // test is about) stay identical regardless of fgosDir. baseCommit/headRef
  // (tsk-2ig attestation) are deliberately excluded here: they are ONLY
  // attempted when fgosDir is given (mkTempDir() is not a git repo, so both
  // happen to read back null today, but that is not this test's concern).
  const { baseCommit: _bc1, headRef: _hr1, ...withFgosDirShape } = withFgosDir;
  const { baseCommit: _bc2, headRef: _hr2, ...withoutFgosDirShape } = withoutFgosDir;
  assert.deepEqual(withFgosDirShape, withoutFgosDirShape);
});

test('resolveExecutorCommand still prefers a capacity\'s own command/args over agentType when both are declared (judge-discovery\'s real shape) — agentType is never consulted', () => {
  const cfg = {
    executor: { command: 'claude', args: ['-p', '{prompt}', '--model', '{model}'] },
    capacities: {
      'judge-discovery': {
        kind: 'task',
        agentType: 'should-never-be-used',
        command: 'claude',
        args: ['-p', '{prompt}', '--model', '{model}', '--allowedTools', 'Task,Bash(rg:*)'],
      },
    },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
  const resolved = resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', capacityId: 'judge-discovery' });
  assert.deepEqual(resolved.args, ['-p', 'p', '--model', 'sonnet', '--allowedTools', 'Task,Bash(rg:*)']);
  assert.ok(!resolved.args.includes('--agent'));
});

test('resolveExecutorCommand falls through to executors.<tier>/global (unaffected) for a capacity with neither command/args nor agentType', () => {
  const cfg = {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    capacities: { 'fgos-code-implement': { kind: 'task', tier: 'standard' } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
  const resolved = resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', capacityId: 'fgos-code-implement' });
  assert.equal(resolved.command, '/global/executor');
});

// --- capacities.<id>.agentType static shape (D1/D2, tsk-3sw), mirrors the
// existing "model" field validation pattern ---------------------------

test('loadRunnerConfig accepts a "capacities.<id>" entry with a non-empty agentType', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'agent-type.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      capacities: { 'my-agent-capacity': { kind: 'task', agentType: 'code-simplifier' } },
      models: { standard: 'sonnet' },
      timeoutMs: 1000,
    }),
  );
  assert.doesNotThrow(() => loadRunnerConfig(configPath));
});

test('loadRunnerConfig rejects a "capacities.<id>" entry whose agentType is not a non-empty string', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'bad-agent-type.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      capacities: { 'my-agent-capacity': { kind: 'task', agentType: '' } },
      models: { standard: 'sonnet' },
      timeoutMs: 1000,
    }),
  );
  assert.throws(() => loadRunnerConfig(configPath), RunnerConfigError);
});

// --- capacities.<id>.forceCliSpawn static shape (tsk-3ik-1), mirrors the
// existing agentType/allowCrossProvider boolean-field validation pattern ---

test('loadRunnerConfig accepts a "capacities.<id>" entry with a boolean forceCliSpawn', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'force-cli-spawn.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      capacities: { 'my-task-capacity': { kind: 'task', agentType: 'code-simplifier', forceCliSpawn: true } },
      models: { standard: 'sonnet' },
      timeoutMs: 1000,
    }),
  );
  assert.doesNotThrow(() => loadRunnerConfig(configPath));
});

test('loadRunnerConfig rejects a "capacities.<id>" entry whose forceCliSpawn is not a boolean', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'bad-force-cli-spawn.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      capacities: { 'my-task-capacity': { kind: 'task', forceCliSpawn: 'yes' } },
      models: { standard: 'sonnet' },
      timeoutMs: 1000,
    }),
  );
  assert.throws(() => loadRunnerConfig(configPath), RunnerConfigError);
});

// --- decideDispatchMechanism (tsk-3ik-1, Native-First Dispatch Doctrine
// rules 1/2/4, docs/decisions/0026-...md) — pure decision, no cfg lookup ---

test('decideDispatchMechanism: no native mechanism always cli-spawns, regardless of live access or force flag (rule 1)', () => {
  assert.equal(decideDispatchMechanism({ hasNativeMechanism: false, hasLiveTaskAccess: true, forceCliSpawn: false }), 'cli-spawn');
  assert.equal(decideDispatchMechanism({ hasNativeMechanism: false, hasLiveTaskAccess: false, forceCliSpawn: false }), 'cli-spawn');
  assert.equal(decideDispatchMechanism({}), 'cli-spawn');
});

test('decideDispatchMechanism: native mechanism + live Task access + no force -> native (rule 2)', () => {
  assert.equal(decideDispatchMechanism({ hasNativeMechanism: true, hasLiveTaskAccess: true, forceCliSpawn: false }), 'native');
});

test('decideDispatchMechanism: native mechanism but no live Task access -> cli-spawn (safe fallback, never assumes access)', () => {
  assert.equal(decideDispatchMechanism({ hasNativeMechanism: true, hasLiveTaskAccess: false, forceCliSpawn: false }), 'cli-spawn');
});

test('decideDispatchMechanism: forceCliSpawn wins over native mechanism + live Task access (rule 4 exception)', () => {
  assert.equal(decideDispatchMechanism({ hasNativeMechanism: true, hasLiveTaskAccess: true, forceCliSpawn: true }), 'cli-spawn');
});

// --- decideCapacityDispatchMechanism — capacities.<id>-specific convenience,
// derives hasNativeMechanism/forceCliSpawn from cfg.capacities[capacityId]
// without touching resolveExecutorConfig's own resolution path ---

test('decideCapacityDispatchMechanism resolves to native for a kind:"task" capacity when the caller declares live Task access', () => {
  const cfg = {
    executor: { command: 'claude', args: ['{prompt}'] },
    capacities: { 'judge-discovery': { kind: 'task', agentType: 'judge' } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
  assert.equal(decideCapacityDispatchMechanism(cfg, 'judge-discovery', { hasLiveTaskAccess: true }), 'native');
});

test('decideCapacityDispatchMechanism falls back to cli-spawn for a kind:"task" capacity when the caller has no live Task access', () => {
  const cfg = {
    executor: { command: 'claude', args: ['{prompt}'] },
    capacities: { 'judge-discovery': { kind: 'task', agentType: 'judge' } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
  assert.equal(decideCapacityDispatchMechanism(cfg, 'judge-discovery', { hasLiveTaskAccess: false }), 'cli-spawn');
  assert.equal(decideCapacityDispatchMechanism(cfg, 'judge-discovery'), 'cli-spawn');
});

test('decideCapacityDispatchMechanism respects a capacity\'s own forceCliSpawn override even with live Task access', () => {
  const cfg = {
    executor: { command: 'claude', args: ['{prompt}'] },
    capacities: { 'judge-discovery': { kind: 'task', agentType: 'judge', forceCliSpawn: true } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
  assert.equal(decideCapacityDispatchMechanism(cfg, 'judge-discovery', { hasLiveTaskAccess: true }), 'cli-spawn');
});

test('decideCapacityDispatchMechanism always cli-spawns for a kind:"cli" capacity, regardless of live Task access', () => {
  const cfg = {
    executor: { command: 'claude', args: ['{prompt}'] },
    capacities: { 'submit-assist-classify': { kind: 'cli', command: 'agy', args: ['{prompt}'], allowCrossProvider: true } },
    models: { light: 'flash-3.5' },
    timeoutMs: 5000,
  };
  assert.equal(decideCapacityDispatchMechanism(cfg, 'submit-assist-classify', { hasLiveTaskAccess: true }), 'cli-spawn');
});

test('decideCapacityDispatchMechanism cli-spawns for an unconfigured capacity, regardless of live Task access', () => {
  const cfg = { executor: { command: 'claude', args: ['{prompt}'] }, models: { standard: 'sonnet' }, timeoutMs: 5000 };
  assert.equal(decideCapacityDispatchMechanism(cfg, 'no-such-capacity', { hasLiveTaskAccess: true }), 'cli-spawn');
});

// --- decideCapacityCli — the "decide <capacityId>" CLI-facing async
// function, mirrors resolveCapacityCli's own repoRoot-skips-git-lookup
// test style ---

test('decideCapacityCli rejects with a usage RunnerConfigError when capacityId is missing', async () => {
  await assert.rejects(() => decideCapacityCli(undefined, { repoRoot: mkTempDir() }), RunnerConfigError);
  await assert.rejects(() => decideCapacityCli('', { repoRoot: mkTempDir() }), RunnerConfigError);
});

test('decideCapacityCli resolves "native" for a kind:"task" capacity when hasLiveTaskAccess is passed true, alongside its agentType', async () => {
  const root = mkTempDir();
  writeRunnerConfigFixture(root, {
    executor: { command: 'claude', args: ['{prompt}'] },
    capacities: { 'judge-discovery': { kind: 'task', agentType: 'judge' } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const decided = await decideCapacityCli('judge-discovery', { repoRoot: root, hasLiveTaskAccess: true });
  assert.deepEqual(decided, { mechanism: 'native', agentType: 'judge' });
});

test('decideCapacityCli resolves "cli-spawn" for the same kind:"task" capacity when hasLiveTaskAccess is omitted (safe default), still reporting its agentType', async () => {
  const root = mkTempDir();
  writeRunnerConfigFixture(root, {
    executor: { command: 'claude', args: ['{prompt}'] },
    capacities: { 'judge-discovery': { kind: 'task', agentType: 'judge' } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const decided = await decideCapacityCli('judge-discovery', { repoRoot: root });
  assert.deepEqual(decided, { mechanism: 'cli-spawn', agentType: 'judge' });
});

test('decideCapacityCli omits agentType entirely for a kind:"cli" capacity that declares none (tsk-3ik-3)', async () => {
  const root = mkTempDir();
  writeRunnerConfigFixture(root, {
    executor: { command: 'claude', args: ['{prompt}'] },
    capacities: { 'submit-assist-classify': { kind: 'cli', command: 'agy', args: ['{prompt}'], allowCrossProvider: true } },
    models: { light: 'flash-3.5' },
    timeoutMs: 5000,
  });
  const decided = await decideCapacityCli('submit-assist-classify', { repoRoot: root, hasLiveTaskAccess: true });
  assert.deepEqual(decided, { mechanism: 'cli-spawn' });
  assert.ok(!('agentType' in decided));
});

test('the "decide" CLI entry point (node src/runner/dispatch.mjs decide <capacityId>) prints {mechanism} JSON to stdout for a real invocation against this repo\'s own .fgos/config.json', () => {
  const dispatchPath = path.resolve('src/runner/dispatch.mjs');
  const result = spawnSync(process.execPath, [dispatchPath, 'decide', 'no-such-capacity-configured'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.mechanism, 'cli-spawn');
});

test('the "decide" CLI entry point exits non-zero with a usage message when capacityId is omitted', () => {
  const dispatchPath = path.resolve('src/runner/dispatch.mjs');
  const result = spawnSync(process.execPath, [dispatchPath, 'decide'], { encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /usage: node src\/runner\/dispatch\.mjs decide/);
});

test('an unknown CLI subcommand still exits non-zero with a usage message naming both resolve and decide', () => {
  const dispatchPath = path.resolve('src/runner/dispatch.mjs');
  const result = spawnSync(process.execPath, [dispatchPath, 'bogus'], { encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /unknown subcommand/);
  assert.match(result.stderr, /resolve <capacityId>/);
  assert.match(result.stderr, /decide <capacityId>/);
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

test('spawnWorker logs the same templateName that buildPrompt actually rendered for the same item — never a diverging pick between the two call sites', async () => {
  const dir = mkTempDir();
  const scriptPath = writeEchoExecutor(dir);
  const cfg = baseConfig([scriptPath, '{prompt}']);
  const work = sampleWork();

  const result = await spawnWorker(work, cfg, mkTempDir());

  assert.equal(result.templateName, 'worker-prompt-skill-pointer.txt');
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.args[0], buildPrompt(work));
});

// tsk-5mj D1/D6/D7: opts.stage threads through spawnWorker into buildPrompt,
// picking the discovery-flavored prompt/template instead of the default
// executing one — same "never a diverging pick" proof as the test above,
// now for the new stage-aware path.
test('spawnWorker with opts.stage:"discovery" logs the discovery templateName and sends the fgos-researching-pointed prompt — never a diverging pick between the two call sites', async () => {
  const dir = mkTempDir();
  const scriptPath = writeEchoExecutor(dir);
  const cfg = baseConfig([scriptPath, '{prompt}']);
  const work = sampleWork();

  const result = await spawnWorker(work, cfg, mkTempDir(), { stage: 'discovery' });

  assert.equal(result.templateName, 'worker-prompt-discovery.txt');
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.args[0], buildPrompt(work, undefined, 'discovery'));
  assert.ok(payload.args[0].includes('.claude/skills/fgos-researching/SKILL.md'));
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

// --- tsk-62v: spawnWorker's additive capacityId/provider result fields (D7) ---

test('spawnWorker result carries capacityId and provider alongside every existing field, unaffected by tier/config unrelated to capacities', async () => {
  const dir = mkTempDir();
  const scriptPath = writeEchoExecutor(dir);
  const cfg = baseConfig([scriptPath, '{prompt}', '--model', '{model}']);

  const result = await spawnWorker(sampleWork(), cfg, mkTempDir());

  assert.equal(result.capacityId, 'fgos-code-implement');
  assert.equal(result.provider, process.execPath);
  // every pre-tsk-62v field still present, unchanged
  assert.equal(result.tier, 'standard');
  assert.equal(result.model, 'sonnet');
  assert.equal(typeof result.templateName, 'string');
  assert.equal(typeof result.templateHash, 'string');
});

// --- tsk-33w D9: spawnWorker's additive command result field ---

test('spawnWorker result carries command (the real spawned executable) alongside every existing field, additive only', async () => {
  const dir = mkTempDir();
  const scriptPath = writeEchoExecutor(dir);
  const cfg = baseConfig([scriptPath, '{prompt}', '--model', '{model}']);

  const result = await spawnWorker(sampleWork(), cfg, mkTempDir());

  assert.equal(result.command, process.execPath);
  // every pre-tsk-33w field still present, unchanged
  assert.equal(result.capacityId, 'fgos-code-implement');
  assert.equal(result.provider, process.execPath);
  assert.equal(result.tier, 'standard');
  assert.equal(result.model, 'sonnet');
  assert.equal(typeof result.templateName, 'string');
  assert.equal(typeof result.templateHash, 'string');
});

test('spawnWorker attests its OWN cwd (the dispatch worktree), never opts.fgosDir\'s root (tsk-4hl fix)', async () => {
  const dir = mkTempDir();
  const scriptPath = writeEchoExecutor(dir);
  const cfg = baseConfig([scriptPath, '{prompt}']);
  const mainRepo = mkTempGitRepo(); // opts.fgosDir points here
  const workerRepo = mkTempGitRepo(); // cwd points here -- the "dispatch worktree"
  // see the resolveExecutorCommand attestRoot test above for why this
  // extra commit matters: two independently created mkTempGitRepo()
  // fixtures can legitimately hash to the same HEAD commit.
  fs.writeFileSync(path.join(workerRepo.repoRoot, 'second.txt'), 'second\n');
  execFileSync('git', ['add', 'second.txt'], { cwd: workerRepo.repoRoot });
  execFileSync('git', ['commit', '-q', '-m', 'second'], { cwd: workerRepo.repoRoot });
  workerRepo.headCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: workerRepo.repoRoot, encoding: 'utf8' }).trim();

  const result = await spawnWorker(sampleWork(), cfg, workerRepo.repoRoot, { fgosDir: mainRepo.fgosDir });

  assert.equal(result.baseCommit, workerRepo.headCommit, 'must attest the cwd it actually ran in, never opts.fgosDir\'s own root');
  assert.notEqual(result.baseCommit, mainRepo.headCommit);
  assert.equal(result.headRef, 'main');
  fs.rmSync(mainRepo.repoRoot, { recursive: true, force: true });
  fs.rmSync(workerRepo.repoRoot, { recursive: true, force: true });
});

test('spawnWorker threads opts.fgosDir into a kind:"cli" capacity\'s presence check end-to-end, resolving through fgos tool query', async () => {
  const dir = mkTempDir();
  const fgosDir = mkTempDir();
  initStore(fgosDir);
  registerTool(fgosDir, { name: 'fgos-code-implement', kind: 'cli', capability: 'coding', command: 'agy' });
  writeLocalStatus(fgosDir, { 'fgos-code-implement': { status: 'present', checkedAt: new Date().toISOString() } });
  const scriptPath = writeEchoExecutor(dir);
  const cfg = {
    executor: { command: process.execPath, args: [scriptPath, '{prompt}'] },
    capacities: { 'fgos-code-implement': { kind: 'cli', tier: 'standard', allowCrossProvider: true } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };

  const result = await spawnWorker(sampleWork(), cfg, mkTempDir(), { fgosDir });
  assert.equal(result.capacityId, 'fgos-code-implement');

  const cfgUnregistered = {
    executor: { command: process.execPath, args: [scriptPath, '{prompt}'] },
    capacities: { 'fgos-code-implement': { kind: 'cli', target: 'not-registered' } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
  const emptyFgosDir = mkTempDir();
  initStore(emptyFgosDir);
  assert.throws(
    () => spawnWorker(sampleWork(), cfgUnregistered, mkTempDir(), { fgosDir: emptyFgosDir }),
    RunnerConfigError,
  );
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

  // 2000ms (not the 200ms the companion test above uses): that test only
  // asserts on an EMPTY stdout/stderr, which a too-fast kill still
  // satisfies either way. This test asserts the captured content is the
  // real 'partial stdout/stderr before hang' string, which requires the
  // budget to survive a full child-process cold start (fork/exec + Node
  // runtime init) PLUS the two synchronous writes reaching the parent's
  // pipe before SIGTERM fires — 200ms was tight enough to flake under load
  // (a slow/contended machine can blow past it before the child ever
  // writes), killing the child before any output was captured.
  await assert.rejects(
    () => spawnWorker(sampleWork(), cfg, mkTempDir(), { timeoutMs: 2000 }),
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

// --- cross-provider governance (D2/D3, tsk-32n) --------------------------
// fgosDir omitted on purpose in most of these (mirroring the existing
// precedence tests above): the D6 tool-registration check only fires when
// fgosDir is given, and these tests isolate the D2/D3 governance check from
// that unrelated existing behavior. The one test that exercises both
// together registers+marks-present the capacity first, same as the
// existing D6 tests do.

test('resolveExecutorCommand throws when a kind:"cli" capacity resolves to a non-Claude command with no allowCrossProvider', () => {
  const cfg = {
    executor: { command: 'claude', args: ['{prompt}'] },
    capacities: { 'fgos-code-implement': { kind: 'cli', command: 'agy', args: ['{prompt}'] } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
  assert.throws(
    () => resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', capacityId: 'fgos-code-implement' }),
    RunnerConfigError,
  );
});

test('resolveExecutorCommand dispatches normally when the same non-Claude capacity sets allowCrossProvider: true', () => {
  const cfg = {
    executor: { command: 'claude', args: ['{prompt}'] },
    capacities: { 'fgos-code-implement': { kind: 'cli', command: 'agy', args: ['{prompt}'], allowCrossProvider: true } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
  const resolved = resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', capacityId: 'fgos-code-implement' });
  assert.equal(resolved.command, 'agy');
});

test('resolveExecutorCommand never requires allowCrossProvider for a kind:"cli" capacity naming no command of its own, falling through to the global Claude executor', () => {
  // The exact false-positive D2 was written to rule out: kind:"cli" alone
  // (metadata-only, no command/adapter override) must NOT gate on
  // allowCrossProvider when the final resolved command is Claude's own.
  const cfg = {
    executor: { command: 'claude', args: ['{prompt}'] },
    capacities: { 'fgos-code-implement': { kind: 'cli' } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
  const resolved = resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', capacityId: 'fgos-code-implement' });
  assert.equal(resolved.command, 'claude');
});

test('resolveExecutorCommand never requires allowCrossProvider for a kind:"cli" capacity that resolves to Claude\'s own CLI', () => {
  const cfg = {
    executor: { command: 'claude', args: ['{prompt}'] },
    capacities: { 'fgos-code-implement': { kind: 'cli', command: 'claude', args: ['{prompt}'] } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
  const resolved = resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', capacityId: 'fgos-code-implement' });
  assert.equal(resolved.command, 'claude');
});

test('resolveExecutorCommand never triggers cross-provider governance for a non-"cli" kind, even with a non-Claude command', () => {
  const cfg = {
    executor: { command: 'claude', args: ['{prompt}'] },
    capacities: { distill: { kind: 'task', target: 'general-purpose' } },
    executors: { standard: { command: 'agy', args: ['{prompt}'] } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
  const resolved = resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', capacityId: 'distill' });
  assert.equal(resolved.command, 'agy');
});

test('resolveExecutorCommand with no capacities block at all never triggers cross-provider governance, byte-identical to pre-tsk-32n behavior', () => {
  const cfg = {
    executor: { command: 'agy', args: ['{prompt}'] },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
  const resolved = resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard' });
  assert.equal(resolved.command, 'agy');
});

test('resolveExecutorCommand throws for a non-Claude "cli" capacity even when fgosDir is given and the D6 registration/presence check already passed', () => {
  const dir = mkTempDir();
  initStore(dir);
  registerTool(dir, { name: 'fgos-code-implement', kind: 'cli', capability: 'coding', command: 'agy' });
  writeLocalStatus(dir, { 'fgos-code-implement': { status: 'present', checkedAt: new Date().toISOString() } });
  const cfg = {
    executor: { command: 'claude', args: ['{prompt}'] },
    capacities: { 'fgos-code-implement': { kind: 'cli', command: 'agy', args: ['{prompt}'] } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
  assert.throws(
    () =>
      resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', capacityId: 'fgos-code-implement', fgosDir: dir }),
    RunnerConfigError,
  );
});

// --- tsk-5l2-1: `resolveCapacityCli` — task-dispatch's "resolve <capacityId>"
// helper, reusing resolveExecutorConfig/resolveExecutorCommand/
// modelForTier verbatim (design doc §4.2). `repoRoot` is passed explicitly
// in every test here to skip the git-based lookup, the same way every
// other test in this file points fgosDir/config paths at a temp dir
// instead of a real git checkout.

function writeRunnerConfigFixture(root, cfg) {
  fs.mkdirSync(path.join(root, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(root, '.fgos', 'config.json'), JSON.stringify({ runner: cfg }, null, 2));
}

test('resolveCapacityCli rejects with a usage RunnerConfigError when capacityId is missing', async () => {
  await assert.rejects(() => resolveCapacityCli(undefined, { repoRoot: mkTempDir() }), RunnerConfigError);
  await assert.rejects(() => resolveCapacityCli('', { repoRoot: mkTempDir() }), RunnerConfigError);
});

test('resolveCapacityCli falls back to the global executor when the capacityId is not in cfg.capacities at all', async () => {
  const root = mkTempDir();
  writeRunnerConfigFixture(root, {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const resolved = await resolveCapacityCli('submit-assist-classify', { prompt: 'classify this', repoRoot: root });
  assert.deepEqual(resolved, { command: '/global/executor', args: ['classify this'], provider: '/global/executor', model: 'sonnet' });
});

test('resolveCapacityCli resolves a kind:"cli" capacity through its own tier and command once registered+present', async () => {
  const root = mkTempDir();
  const fgosDir = path.join(root, '.fgos');
  initStore(fgosDir);
  registerTool(fgosDir, { name: 'submit-assist-classify', kind: 'cli', capability: 'submit-assist-classify', command: 'agy' });
  writeLocalStatus(fgosDir, { 'submit-assist-classify': { status: 'present', checkedAt: new Date().toISOString() } });
  writeRunnerConfigFixture(root, {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    capacities: { 'submit-assist-classify': { kind: 'cli', command: 'agy', provider: 'agy', args: ['{prompt}'], tier: 'light', allowCrossProvider: true } },
    models: { light: 'flash-3.5' },
    timeoutMs: 5000,
  });
  const resolved = await resolveCapacityCli('submit-assist-classify', { prompt: 'classify this', repoRoot: root });
  assert.deepEqual(resolved, { command: 'agy', args: ['classify this'], provider: 'agy', model: 'flash-3.5' });
});

test('resolveCapacityCli honors a caller-supplied model override over both the capacity\'s own model and modelForTier (tsk-2k1, D10)', async () => {
  const root = mkTempDir();
  const fgosDir = path.join(root, '.fgos');
  initStore(fgosDir);
  registerTool(fgosDir, { name: 'submit-assist-classify', kind: 'cli', capability: 'submit-assist-classify', command: 'agy' });
  writeLocalStatus(fgosDir, { 'submit-assist-classify': { status: 'present', checkedAt: new Date().toISOString() } });
  writeRunnerConfigFixture(root, {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    capacities: { 'submit-assist-classify': { kind: 'cli', command: 'agy', provider: 'agy', args: ['{model}:{prompt}'], tier: 'light', model: 'flash-3.5', allowCrossProvider: true } },
    models: { light: 'flash-3.5', standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const resolved = await resolveCapacityCli('submit-assist-classify', { prompt: 'classify this', repoRoot: root, model: 'opus' });
  assert.deepEqual(resolved, { command: 'agy', args: ['opus:classify this'], provider: 'agy', model: 'opus' });
});

test('resolveCapacityCli honors a caller-supplied tier override, feeding it into modelForTier when no model is also supplied (tsk-2k1, D10)', async () => {
  const root = mkTempDir();
  initStore(path.join(root, '.fgos'));
  writeRunnerConfigFixture(root, {
    executor: { command: '/global/executor', args: ['{model}:{prompt}'] },
    models: { light: 'flash-3.5', standard: 'sonnet' },
    timeoutMs: 5000,
  });
  // 'light', deliberately NOT `DEFAULTS.tier` ('standard', work.mjs) — a
  // tier equal to the default would pass even with no override plumbing
  // at all (the pre-existing `capacity?.tier ?? DEFAULTS.tier` fallback
  // already lands on 'standard' with no capacity match), so it would not
  // actually prove the override path works.
  const resolved = await resolveCapacityCli('no-such-capacity', { prompt: 'x', repoRoot: root, tier: 'light' });
  assert.deepEqual(resolved, { command: '/global/executor', args: ['flash-3.5:x'], provider: '/global/executor', model: 'flash-3.5' });
});

test('resolveCapacityCli propagates resolveExecutorConfig\'s own RunnerConfigError for a kind:"cli" capacity that is not registered', async () => {
  const root = mkTempDir();
  initStore(path.join(root, '.fgos'));
  writeRunnerConfigFixture(root, {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    capacities: { 'submit-assist-classify': { kind: 'cli', command: 'agy', args: ['{prompt}'] } },
    models: { light: 'flash-3.5' },
    timeoutMs: 5000,
  });
  await assert.rejects(() => resolveCapacityCli('submit-assist-classify', { prompt: 'x', repoRoot: root }), RunnerConfigError);
});

test('the "resolve" CLI entry point (node src/runner/dispatch.mjs resolve <capacityId>) prints {command,args,provider,model} JSON to stdout for a real invocation against this repo\'s own .fgos/config.json', () => {
  const dispatchPath = path.resolve('src/runner/dispatch.mjs');
  const result = spawnSync(process.execPath, [dispatchPath, 'resolve', 'no-such-capacity-configured', '--prompt', 'hello'], {
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
  const parsed = JSON.parse(result.stdout);
  assert.ok(typeof parsed.command === 'string' && parsed.command.length > 0);
  assert.ok(Array.isArray(parsed.args));
  assert.ok(typeof parsed.provider === 'string');
  assert.ok(typeof parsed.model === 'string');
});

test('the "resolve" CLI entry point honors --model, overriding the computed default (tsk-2k1, D10)', () => {
  const dispatchPath = path.resolve('src/runner/dispatch.mjs');
  const result = spawnSync(
    process.execPath,
    [dispatchPath, 'resolve', 'no-such-capacity-configured', '--prompt', 'hello', '--model', 'a-specific-override-model'],
    { encoding: 'utf8' },
  );
  assert.equal(result.status, 0, result.stderr);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.model, 'a-specific-override-model');
});

test('the "resolve" CLI entry point honors --tier, changing which configured model resolves (tsk-2k1, D10)', () => {
  const dispatchPath = path.resolve('src/runner/dispatch.mjs');
  // The MAIN CHECKOUT's committed runner config is the same file the
  // spawned CLI process below will resolve against (`resolveCapacityCli`
  // resolves via `resolveMainCheckoutRoot`, not this test's own cwd), so
  // read the expected model from there directly rather than hardcoding a
  // value that would silently drift from the real config.
  const cfg = committedRunnerConfig();
  const lightModel = cfg.models.light;
  const result = spawnSync(
    process.execPath,
    [dispatchPath, 'resolve', 'no-such-capacity-configured', '--prompt', 'hello', '--tier', 'light'],
    { encoding: 'utf8' },
  );
  assert.equal(result.status, 0, result.stderr);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.model, lightModel);
});

test('the "resolve" CLI entry point exits non-zero with a usage message when capacityId is omitted', () => {
  const dispatchPath = path.resolve('src/runner/dispatch.mjs');
  const result = spawnSync(process.execPath, [dispatchPath, 'resolve'], { encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /usage: node src\/runner\/dispatch\.mjs resolve/);
});
