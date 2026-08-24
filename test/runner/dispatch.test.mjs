import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync, execFileSync } from 'node:child_process';
import http from 'node:http';
import {
  buildPrompt,
  loadRunnerConfig,
  loadRunnerConfigFromDir,
  ensureRunnerConfigForDir,
  DEFAULT_RUNNER_CONFIG,
  detectAssistantCli,
  modelForTier,
  resolveExecutorCommand,
  resolveExecutorEnv,
  executeExecutorCli,
  resolveExecutorIdForPurpose,
  resolveExecutorAndOverrides,
  logExecutorDispatch,
  decideDispatchMechanism,
  decideExecutorDispatchMechanism,
  decideExecutorCli,
  fanoutBatchExecutorCli,
  spawnWorker,
  RunnerConfigError,
  DispatchError,
  EXECUTOR_ADAPTERS,
  DEFAULT_ADAPTER,
  DISPATCH_DEPTH_ENV,
  MAX_DISPATCH_DEPTH,
  EXECUTOR_KINDS,
  EXECUTOR_CARRIES,
  INVOCATION_VIA,
  executorIdForWork,
  resolveAgentTypeForTaskSpec,
  resolveAgentTypeForWork,
} from '../../src/runner/dispatch.mjs';
import { initStore, addWork, listWork, readRawEvents } from '../../src/state/store.mjs';
import { findExecutableOnPath } from '../../src/state/tool-registry.mjs';
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

/** Write a fake executor that delays for a specified time (ms) before returning JSON. */
function writeSlowExecutor(dir, delayMs = 300) {
  const scriptPath = path.join(dir, 'slow-executor.mjs');
  fs.writeFileSync(
    scriptPath,
    `
    setTimeout(() => {
      process.stdout.write(JSON.stringify({ ok: true }));
      process.exit(0);
    }, ${delayMs});
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

/** Write a fake executor that spawns its OWN detached grandchild (never
 * managing it), writes the grandchild's pid to `markerPath`, then busy-waits
 * past any reasonable test timeout itself -- for proving a process-GROUP
 * kill reaches the grandchild too, not just the directly-spawned child. */
function writeGrandchildSpawningExecutor(dir) {
  const scriptPath = path.join(dir, 'grandchild-spawning-executor.mjs');
  const markerPath = path.join(dir, 'grandchild-pid.txt');
  fs.writeFileSync(
    scriptPath,
    `
    import { spawn } from 'node:child_process';
    import fs from 'node:fs';
    // Deliberately NOT detached: this is the realistic "an executor CLI
    // shells out further" shape (a plain child_process call with no special
    // flag) -- it stays in the SAME process group as this script itself
    // (which cliSpawnAdapter spawned as the group leader), so the fix under
    // test is process.kill(-pid) reaching it via that shared group, not via
    // any detach/undetach choice this fake executor makes on its own.
    const grandchild = spawn(process.execPath, ['-e', 'setTimeout(() => {}, 30000);'], { stdio: 'ignore' });
    grandchild.unref();
    fs.writeFileSync(${JSON.stringify(markerPath)}, String(grandchild.pid));
    const until = Date.now() + 30000;
    while (Date.now() < until) { /* busy-wait past any test timeout, never exiting on its own */ }
    `,
  );
  return { scriptPath, markerPath };
}

/** Write a fake executor that writes one line, then goes completely silent
 * (busy-waits) past any reasonable idle-timeout test budget -- for
 * exercising the idle-timeout kill path distinct from the hard timeoutMs
 * cap (the hard cap in these tests is set far larger than the idle budget). */
function writeGoesSilentExecutor(dir) {
  const scriptPath = path.join(dir, 'goes-silent-executor.mjs');
  fs.writeFileSync(
    scriptPath,
    `
    process.stdout.write('alive\\n');
    const until = Date.now() + 30000;
    while (Date.now() < until) { /* busy-wait, no more output */ }
    `,
  );
  return scriptPath;
}

/** Write a fake executor that writes `count` lines spaced `intervalMs` apart,
 * then exits 0 -- total runtime exceeds a small idle budget, but the GAP
 * between any two writes never does, proving the idle timer resets per
 * chunk instead of firing on cumulative elapsed time. */
function writePeriodicWriterExecutor(dir, { intervalMs = 150, count = 5 } = {}) {
  const scriptPath = path.join(dir, 'periodic-writer-executor.mjs');
  fs.writeFileSync(
    scriptPath,
    `
    let i = 0;
    const interval = setInterval(() => {
      process.stdout.write('tick-' + i + '\\n');
      i += 1;
      if (i >= ${count}) {
        clearInterval(interval);
        process.exit(0);
      }
    }, ${intervalMs});
    `,
  );
  return scriptPath;
}

/** Write a fake executor that echoes its own FGOS_DISPATCH_DEPTH env var
 * (or "0" when absent) as JSON to stdout -- for proving the depth counter
 * is threaded to the child's environment, incremented by one. */
function writeDepthEchoExecutor(dir) {
  const scriptPath = path.join(dir, 'depth-echo-executor.mjs');
  fs.writeFileSync(
    scriptPath,
    `
    process.stdout.write(JSON.stringify({ depth: process.env.FGOS_DISPATCH_DEPTH ?? '0' }));
    process.exit(0);
    `,
  );
  return scriptPath;
}

function sampleWork(overrides = {}) {
  return {
    id: 'sample-work',
    title: 'Add the widget',
    kind: 'feature',
    status: 'doing',
    deps: [],
    risk: 'light',
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

test('buildPrompt for a coding-domain (or no-domain) work item also contains a new "# Agent skill" section naming the fgos-coding-implement SKILL.md', () => {
  const prompt = buildPrompt(sampleWork());
  assert.match(prompt, /# Agent skill/);
  assert.ok(prompt.includes('.claude/skills/fgos-coding-implement/SKILL.md'));
});

// --- tsk-5mj D1/D6/D7: stage-aware buildPrompt (discovery dispatch) ------

test('buildPrompt omitting stage defaults to "executing", byte-identical to every pre-tsk-5mj call', () => {
  assert.equal(buildPrompt(sampleWork()), buildPrompt(sampleWork(), undefined, 'executing'));
});

test('buildPrompt with stage:"discovery" points the Agent skill section at fgos-coding-discovering\'s SKILL.md and selects the discovery template', () => {
  const prompt = buildPrompt(sampleWork(), undefined, 'discovery');
  assert.match(prompt, /# Agent skill/);
  assert.ok(prompt.includes('.claude/skills/fgos-coding-discovering/SKILL.md'));
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

test('buildPrompt renders docsRefPointer under "Files to read first" when docsRef is set on work item', () => {
  const prompt = buildPrompt(sampleWork({ docsRef: 'docs/history/my-feature' }));
  assert.match(prompt, /# Files to read first\n\(không có\)\ndocs\/history\/my-feature\/plan\.md and \.\.\.\/CONTEXT\.md \(if present\) — the locked decisions and chosen approach for this item/);
});

test('buildPrompt normalizes trailing slash in docsRef when rendering docsRefPointer', () => {
  const prompt1 = buildPrompt(sampleWork({ docsRef: 'docs/history/my-feature/' }));
  const prompt2 = buildPrompt(sampleWork({ docsRef: 'docs/history/my-feature' }));
  assert.equal(prompt1, prompt2);
  assert.ok(prompt1.includes('docs/history/my-feature/plan.md'));
});

test('buildPrompt renders "(none)" for docsRefPointer when work.docsRef is absent or empty', () => {
  const prompt = buildPrompt(sampleWork());
  assert.match(prompt, /# Files to read first\n\(không có\)\n\(none\)/);
});

test('buildPrompt for non-executing stage (e.g. discovery) does not leak literal {docsRefPointer} template variable', () => {
  const prompt = buildPrompt(sampleWork({ docsRef: 'docs/history/my-feature' }), undefined, 'discovery');
  assert.doesNotMatch(prompt, /\{docsRefPointer\}/);
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
  assert.match(prompt, /feature/);
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

test('loadRunnerConfig accepts a config with no "idleTimeoutMs" at all -- absent keeps the idle-timeout disarmed, byte-identical to before this field existed', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'no-idle-timeout.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({ executor: { command: 'claude', args: ['{prompt}'] }, models: { standard: 'sonnet' }, timeoutMs: 1000 }),
  );
  const cfg = loadRunnerConfig(configPath);
  assert.equal(cfg.idleTimeoutMs, undefined);
});

test('loadRunnerConfig accepts a well-formed positive "idleTimeoutMs"', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'good-idle-timeout.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({ executor: { command: 'claude', args: ['{prompt}'] }, models: { standard: 'sonnet' }, timeoutMs: 1000, idleTimeoutMs: 30000 }),
  );
  const cfg = loadRunnerConfig(configPath);
  assert.equal(cfg.idleTimeoutMs, 30000);
});

test('loadRunnerConfig rejects a non-positive "idleTimeoutMs" when present', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'bad-idle-timeout.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({ executor: { command: 'claude', args: ['{prompt}'] }, models: { standard: 'sonnet' }, timeoutMs: 1000, idleTimeoutMs: 0 }),
  );
  assert.throws(() => loadRunnerConfig(configPath), RunnerConfigError);
});

// --- tsk-in1-2 D6: the OLD `executors.<tier>` (a per-tier override block,
// a genuinely different, unrelated field) was retired — 0 live entries,
// had already caused a real bug (tsk-4eu, tsk-5tm D10: a non-tier key
// like "judge" silently fell through to the global executor with no
// error). tsk-225 (D1) later renamed the SEPARATE `capacities.<id>` named
// catalog to `executors.<id>`, reusing the same top-level key name for a
// real, validated concept going forward — the two `executors` are not the
// same field across time, just the same string. See
// `resolveExecutorConfig`'s own dedicated coverage for the resolve-side
// confirmation (a global `executors` D6 test elsewhere in this file).

test('loadRunnerConfig accepts a config with no "executors" block at all', () => {
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

test('loadRunnerConfig rejects a non-object "executors" block (tsk-225 D1: the renamed catalog is real and validated, unlike the unrelated retired executors.<tier> rung above)', () => {
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

// --- tsk-62v: executor-aware `executors` schema (D1/D2) -----------------

test('EXECUTOR_KINDS is exactly the agent/tool BAN CHAT axis (D5, tsk-in1-4) — no longer reuses tool-registry\'s own KINDS', () => {
  assert.deepEqual(EXECUTOR_KINDS, ['agent', 'tool']);
});

test('loadRunnerConfig accepts a config with no "executors" block at all — pre-tsk-62v shape, unchanged', () => {
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

test('loadRunnerConfig accepts a well-formed "executors" entry carrying its own executor', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'with-executors.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      executors: { 'fgos-code-implement': { kind: 'agent', command: 'agy', args: ['{prompt}'] } },
      models: { standard: 'sonnet' },
      timeoutMs: 1000,
    }),
  );
  const cfg = loadRunnerConfig(configPath);
  assert.equal(cfg.executors['fgos-code-implement'].command, 'agy');
});

// --- tsk-in1-3: capabilities catalog (D4/D14) — curated, shared between
// the tool-registry's own free-text `capability` field and, later,
// executors.<id>.for -- deliberately a DIFFERENT field from `executors`
// above (D3 kept that name for the executor registry; `capabilities` is
// the catalog of WHAT a executor can promise) --------------------------

test('loadRunnerConfig accepts a config with no "capabilities" block at all', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'no-capabilities.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      models: { standard: 'sonnet' },
      timeoutMs: 1000,
    }),
  );
  const cfg = loadRunnerConfig(configPath);
  assert.equal(cfg.capabilities, undefined);
});

test('loadRunnerConfig accepts a well-formed "capabilities" catalog entry with description and aliases', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'with-capabilities.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      capabilities: { 'impact-analysis': { description: 'Code-graph blast radius', aliases: ['impact_analysis', 'Impact Analysis'] } },
      models: { standard: 'sonnet' },
      timeoutMs: 1000,
    }),
  );
  const cfg = loadRunnerConfig(configPath);
  assert.equal(cfg.capabilities['impact-analysis'].description, 'Code-graph blast radius');
  assert.deepEqual(cfg.capabilities['impact-analysis'].aliases, ['impact_analysis', 'Impact Analysis']);
});

test('loadRunnerConfig accepts a "capabilities" entry naming neither description nor aliases (bare {})', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'bare-capabilities.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      capabilities: { 'pane-labeling': {} },
      models: { standard: 'sonnet' },
      timeoutMs: 1000,
    }),
  );
  const cfg = loadRunnerConfig(configPath);
  assert.deepEqual(cfg.capabilities['pane-labeling'], {});
});

test('loadRunnerConfig rejects a "capabilities" block that is not an object', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'bad-capabilities-shape.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      capabilities: 'nope',
      models: {},
      timeoutMs: 1000,
    }),
  );
  assert.throws(() => loadRunnerConfig(configPath), RunnerConfigError);
});

test('loadRunnerConfig rejects a "capabilities.<name>" entry that is not an object', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'bad-capabilities-entry.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      capabilities: { 'impact-analysis': 'nope' },
      models: {},
      timeoutMs: 1000,
    }),
  );
  assert.throws(() => loadRunnerConfig(configPath), RunnerConfigError);
});

test('loadRunnerConfig rejects a "capabilities.<name>" entry with an empty-string description', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'bad-capabilities-description.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      capabilities: { 'impact-analysis': { description: '' } },
      models: {},
      timeoutMs: 1000,
    }),
  );
  assert.throws(() => loadRunnerConfig(configPath), RunnerConfigError);
});

test('loadRunnerConfig rejects a "capabilities.<name>" entry whose aliases is not an array of non-empty strings', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'bad-capabilities-aliases.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      capabilities: { 'impact-analysis': { aliases: ['ok', ''] } },
      models: {},
      timeoutMs: 1000,
    }),
  );
  assert.throws(() => loadRunnerConfig(configPath), RunnerConfigError);
});

// --- executors.<id>.invocations[] (tsk-5tm-4 D11): executor-keyed
// alternative to flat command/args, ADDITIVE -- executors field name
// itself stays unchanged (cfg.executors already means something else,
// tier-keyed, tsk-4eu) -----------------------------------------------

test('INVOCATION_VIA is exactly the CO CHE GOI axis (D11 tsk-5tm-4, widened D8 tsk-in1-4, "api" restored D13 tsk-in1-5) — cli/task/mcp/api', () => {
  assert.deepEqual(INVOCATION_VIA, ['cli', 'task', 'mcp', 'api']);
});

test('loadRunnerConfig accepts a "executors.<id>" entry using the invocations[] shape instead of flat command/args', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'invocations-ok.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      executors: {
        agy: {
          kind: 'agent',
          allowCrossProvider: true,
          invocations: [{ via: 'cli', adapter: 'cli-spawn', command: 'agy', args: ['-p', '{prompt}', '--model', '{model}'] }],
        },
      },
      models: { standard: 'sonnet' },
      timeoutMs: 1000,
    }),
  );
  assert.doesNotThrow(() => loadRunnerConfig(configPath));
});

test('loadRunnerConfig rejects a "executors.<id>.invocations" that is not a non-empty array', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'bad-invocations-empty.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      executors: { agy: { kind: 'agent', invocations: [] } },
      models: { standard: 'sonnet' },
      timeoutMs: 1000,
    }),
  );
  assert.throws(() => loadRunnerConfig(configPath), RunnerConfigError);
});

test('loadRunnerConfig rejects a "executors.<id>.invocations[]" entry with an unknown "via"', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'bad-invocations-via.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      executors: {
        agy: { kind: 'agent', allowCrossProvider: true, invocations: [{ via: 'api', command: 'agy', args: ['{prompt}'] }] },
      },
      models: { standard: 'sonnet' },
      timeoutMs: 1000,
    }),
  );
  assert.throws(() => loadRunnerConfig(configPath), RunnerConfigError);
});

test('loadRunnerConfig rejects a "executors.<id>.invocations[]" entry with a malformed command/args shape (reuses validateExecutorShape)', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'bad-invocations-shape.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      executors: { agy: { kind: 'agent', allowCrossProvider: true, invocations: [{ via: 'cli', command: 'agy' }] } },
      models: { standard: 'sonnet' },
      timeoutMs: 1000,
    }),
  );
  assert.throws(() => loadRunnerConfig(configPath), RunnerConfigError);
});

test('resolveExecutorCommand resolves command/args/provider from invocations[0] for an invocations[]-shaped executor', () => {
  const cfg = {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    executors: {
      agy: {
        kind: 'agent',
        allowCrossProvider: true,
        invocations: [{ via: 'cli', adapter: 'cli-spawn', command: 'agy', args: ['-p', '{prompt}', '--model', '{model}'] }],
      },
    },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
  const resolved = resolveExecutorCommand(cfg, { prompt: 'hello', model: 'sonnet', tier: 'standard', executorId: 'agy' });
  assert.equal(resolved.command, 'agy');
  assert.deepEqual(resolved.args, ['-p', 'hello', '--model', 'sonnet']);
  assert.equal(resolved.adapter, 'cli-spawn');
  assert.equal(resolved.provider, 'agy');
});

test('resolveExecutorCommand picks the invocation whose "via" is "cli" even when it is not invocations[0] (D9 Gate B2 — never invocations[0] blindly)', () => {
  const cfg = {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    executors: {
      agy: {
        kind: 'agent',
        invocations: [
          { via: 'mcp', command: 'mcp:agy' },
          { via: 'cli', command: 'claude', args: ['-p', '{prompt}'] },
        ],
      },
    },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
  const resolved = resolveExecutorCommand(cfg, { prompt: 'hello', model: 'sonnet', tier: 'standard', executorId: 'agy' });
  assert.equal(resolved.command, 'claude');
  assert.deepEqual(resolved.args, ['-p', 'hello']);
});

test('resolveExecutorCommand throws when a executor declares "invocations" but none is dispatchable via "cli" (D9 Gate B3 — never silently falls through to the global executor)', () => {
  const cfg = {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    executors: {
      agy: {
        kind: 'tool',
        invocations: [{ via: 'mcp', command: 'mcp:agy' }],
      },
    },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
  assert.throws(
    () => resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'agy' }),
    /declares "invocations" but none is dispatchable via "cli"/,
  );
});

test('resolveExecutorCommand still enforces cross-provider governance for an invocations[]-shaped executor — allowCrossProvider stays required', () => {
  const cfg = {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    executors: {
      agy: { kind: 'agent', invocations: [{ via: 'cli', adapter: 'cli-spawn', command: 'agy', args: ['{prompt}'] }] },
    },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
  assert.throws(
    () => resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'agy' }),
    RunnerConfigError,
  );
});

test('the committed .fgos/config.json runner section declares the agy reference executor (tsk-5tm-4 D11): invocations[]-shaped, kind agent (migrated at tsk-in1-4 D5), allowCrossProvider true, resolves to the real installed agy binary', () => {
  const cfg = committedRunnerConfig();
  const executor = cfg.executors?.agy;
  assert.ok(executor, 'executors.agy must exist');
  assert.equal(executor.kind, 'agent');
  assert.equal(executor.allowCrossProvider, true);
  assert.ok(Array.isArray(executor.invocations) && executor.invocations.length === 1);
  const invocation = executor.invocations[0];
  assert.equal(invocation.via, 'cli');
  assert.equal(invocation.adapter, 'cli-spawn');
  assert.equal(invocation.command, 'agy');
  assert.ok(invocation.args.includes('{prompt}') && invocation.args.includes('{model}'));
  // tsk-1xm: replaced the unconditional --dangerously-skip-permissions
  // bypass with --mode accept-edits + a settings.json command denylist
  // (src/setup/agy-permissions.mjs) — the boundary is now capability-
  // enforced (agy's own permission engine), not just prompt prose.
  assert.ok(!invocation.args.includes('--dangerously-skip-permissions'));
  assert.ok(invocation.args.includes('--mode') && invocation.args.includes('accept-edits'));
});

// Synthetic cfg, not committedRunnerConfig() (tsk-1cn): committedRunnerConfig()
// resolves against the MAIN CHECKOUT's own committed HEAD (see its own
// docstring above) -- a feature branch's own .fgos/config.json edit is
// invisible to it until merge, so a test asserting a branch's own change
// through that helper would fail here and only start passing post-merge.
// This mirrors the entry actually added to runner.executors.claude.
function claudeExecutorCfg() {
  return {
    executor: { command: 'claude', args: ['-p', '{prompt}', '--model', '{model}', '--permission-mode', 'acceptEdits'] },
    executors: {
      claude: {
        kind: 'agent',
        invocations: [{ via: 'cli', adapter: 'cli-spawn', command: 'claude', args: ['-p', '{prompt}', '--model', '{model}', '--permission-mode', 'acceptEdits'] }],
      },
    },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
}

test('resolveExecutorCommand resolves the named "claude" executor to the same command/args the top-level "executor" default already produces (tsk-1cn: addressability, not new behavior)', () => {
  const cfg = claudeExecutorCfg();
  const named = resolveExecutorCommand(cfg, { prompt: 'hello', model: 'sonnet', tier: 'standard', executorId: 'claude' });
  const unnamed = resolveExecutorCommand(cfg, { prompt: 'hello', model: 'sonnet', tier: 'standard' });
  assert.equal(named.command, unnamed.command);
  assert.deepEqual(named.args, unnamed.args);
});

test('resolveExecutorCommand never requires allowCrossProvider for the named "claude" executor, since its resolved command is already in CLAUDE_CLI_COMMANDS (tsk-1cn, unlike agy/codex/pi)', () => {
  const cfg = claudeExecutorCfg();
  assert.equal(cfg.executors.claude.allowCrossProvider, undefined);
  assert.doesNotThrow(() => resolveExecutorCommand(cfg, { prompt: 'hello', model: 'sonnet', tier: 'standard', executorId: 'claude' }));
});

test('resolveExecutorAndOverrides resolves "claude" as a literal registered executor id (tsk-1cn: no longer configured:false)', () => {
  const cfg = claudeExecutorCfg();
  const resolved = resolveExecutorAndOverrides(cfg, 'claude');
  assert.equal(resolved.configured, true);
  assert.equal(resolved.executorId, 'claude');
});

test('loadRunnerConfig accepts a "executors" entry naming only "kind" (metadata-only, falls through for its executor)', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'metadata-only-executor.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      executors: { distill: { kind: 'agent', target: 'general-purpose', tier: 'standard' } },
      models: { standard: 'sonnet' },
      timeoutMs: 1000,
    }),
  );
  assert.doesNotThrow(() => loadRunnerConfig(configPath));
});

test('loadRunnerConfig rejects a "executors" block that is not an object', () => {
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

test('loadRunnerConfig rejects a "executors.<id>" entry with an unknown "kind"', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'bad-executor-kind.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      executors: { distill: { kind: 'not-a-real-kind' } },
      models: {},
      timeoutMs: 1000,
    }),
  );
  assert.throws(() => loadRunnerConfig(configPath), RunnerConfigError);
});

test('loadRunnerConfig accepts "task" as a "executors.<id>.kind" value (the one kind fgos tool never sees)', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'task-kind-executor.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      executors: { distill: { kind: 'agent', target: 'general-purpose' } },
      models: {},
      timeoutMs: 1000,
    }),
  );
  assert.doesNotThrow(() => loadRunnerConfig(configPath));
});

test('loadRunnerConfig rejects a "executors.<id>" entry declaring "command" without "args"', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'bad-executor-entry.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      executors: { 'fgos-code-implement': { kind: 'agent', command: 'agy' } },
      models: {},
      timeoutMs: 1000,
    }),
  );
  assert.throws(() => loadRunnerConfig(configPath), RunnerConfigError);
});

// --- executors.<id>.allowCrossProvider (D1, tsk-32n) --------------------

test('loadRunnerConfig accepts a "executors.<id>" entry with allowCrossProvider: true', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'allow-cross-provider.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      executors: { 'fgos-code-implement': { kind: 'agent', command: 'agy', args: ['{prompt}'], allowCrossProvider: true } },
      models: { standard: 'sonnet' },
      timeoutMs: 1000,
    }),
  );
  assert.doesNotThrow(() => loadRunnerConfig(configPath));
});

test('loadRunnerConfig rejects a "executors.<id>" entry whose allowCrossProvider is not a boolean', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'bad-allow-cross-provider.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      executors: { 'fgos-code-implement': { kind: 'agent', command: 'agy', args: ['{prompt}'], allowCrossProvider: 'yes' } },
      models: { standard: 'sonnet' },
      timeoutMs: 1000,
    }),
  );
  assert.throws(() => loadRunnerConfig(configPath), RunnerConfigError);
});

test('EXECUTOR_ADAPTERS registers exactly two adapters (D13, tsk-in1-5): cli-spawn (default) and http (the D13 pluggability precedent) — the RPC/app-server adapter stays deferred per D a4fe4c2b', () => {
  assert.deepEqual(Object.keys(EXECUTOR_ADAPTERS), ['cli-spawn', 'http']);
  assert.equal(DEFAULT_ADAPTER, 'cli-spawn');
});

// --- httpAdapter (D13, tsk-in1-5): real requests against a real local test
// server -- proves EXECUTOR_ADAPTERS' generalized (invocation, opts)
// signature is genuinely pluggable, independent of any executor actually
// registering a "via":"api" invocation (0 producer today, same as
// cli-spawn before agy existed). ---------------------------------------

function withTestServer(handler, fn) {
  const server = http.createServer(handler);
  return new Promise((resolve, reject) => {
    server.listen(0, '127.0.0.1', async () => {
      const { port } = server.address();
      try {
        await fn(`http://127.0.0.1:${port}`);
        resolve();
      } catch (err) {
        reject(err);
      } finally {
        server.close();
      }
    });
  });
}

test('EXECUTOR_ADAPTERS.http (httpAdapter) makes a real GET request and returns {status, body, headers, tier, model}', async () => {
  await withTestServer(
    (req, res) => {
      res.writeHead(200, { 'content-type': 'text/plain' });
      res.end('hello from test server');
    },
    async (url) => {
      const result = await EXECUTOR_ADAPTERS.http({ url }, { tier: 'standard', model: 'sonnet' });
      assert.equal(result.status, 200);
      assert.equal(result.body, 'hello from test server');
      assert.equal(result.headers['content-type'], 'text/plain');
      assert.equal(result.tier, 'standard');
      assert.equal(result.model, 'sonnet');
    },
  );
});

test('EXECUTOR_ADAPTERS.http sends method/headers/body verbatim to the real server (invocation shape, never command/args)', async () => {
  await withTestServer(
    (req, res) => {
      let received = '';
      req.on('data', (chunk) => { received += chunk; });
      req.on('end', () => {
        res.writeHead(201, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ method: req.method, xTest: req.headers['x-test'], received }));
      });
    },
    async (url) => {
      const result = await EXECUTOR_ADAPTERS.http(
        { method: 'POST', url, headers: { 'x-test': 'abc' }, body: 'payload' },
        {},
      );
      assert.equal(result.status, 201);
      const parsed = JSON.parse(result.body);
      assert.equal(parsed.method, 'POST');
      assert.equal(parsed.xTest, 'abc');
      assert.equal(parsed.received, 'payload');
    },
  );
});

test('EXECUTOR_ADAPTERS.http treats a non-2xx status as a normal result, never a thrown error (mirrors cli-spawn\'s "non-zero exit is not an error" stance, D3)', async () => {
  await withTestServer(
    (req, res) => {
      res.writeHead(500, { 'content-type': 'text/plain' });
      res.end('server broke');
    },
    async (url) => {
      const result = await EXECUTOR_ADAPTERS.http({ url }, {});
      assert.equal(result.status, 500);
      assert.equal(result.body, 'server broke');
    },
  );
});

test('EXECUTOR_ADAPTERS.http throws DispatchError("worker-timeout") when the request exceeds opts.timeoutMs', async () => {
  await withTestServer(
    (req, res) => {
      setTimeout(() => res.end('too late'), 500);
    },
    async (url) => {
      await assert.rejects(
        () => EXECUTOR_ADAPTERS.http({ url }, { timeoutMs: 50, workId: 'w1' }),
        (err) => err instanceof DispatchError && err.errorClass === 'worker-timeout',
      );
    },
  );
});

test('EXECUTOR_ADAPTERS.http throws DispatchError("worker-spawn-fail") when the request cannot reach a server at all', async () => {
  await assert.rejects(
    () => EXECUTOR_ADAPTERS.http({ url: 'http://127.0.0.1:1' }, { workId: 'w1' }),
    (err) => err instanceof DispatchError && err.errorClass === 'worker-spawn-fail',
  );
});

test('loadRunnerConfig accepts a "executors.<id>.invocations[]" entry with "via":"api" and a non-empty "url"', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'api-invocation-ok.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      executors: {
        webhook: { kind: 'tool', invocations: [{ via: 'api', adapter: 'http', url: 'http://example.invalid/hook' }] },
      },
      models: { standard: 'sonnet' },
      timeoutMs: 1000,
    }),
  );
  assert.doesNotThrow(() => loadRunnerConfig(configPath));
});

test('loadRunnerConfig rejects a "executors.<id>.invocations[]" entry with "via":"api" and no "url"', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'api-invocation-no-url.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      executors: { webhook: { kind: 'tool', invocations: [{ via: 'api', adapter: 'http' }] } },
      models: { standard: 'sonnet' },
      timeoutMs: 1000,
    }),
  );
  assert.throws(() => loadRunnerConfig(configPath), RunnerConfigError);
});

/** Read the committed `.fgos/config.json`'s `runner` section directly
 * (never through `loadRunnerConfigFromDir`, which also merges in
 * `~/.fgos/config.json` -- these tests assert the REPO's own committed
 * content, not whatever a given test machine's global config adds).
 *
 * Reads via `git show HEAD:...`, NEVER `fs.readFileSync` off the working
 * tree (tsk-5tm-6 fix, found by a real-dispatch review pass): a working-tree
 * read only proves whatever happens to be sitting on THIS machine's disk --
 * a contributor with an uncommitted edit to `.fgos/config.json` (or a stale
 * one from before a revert) would make these tests pass while the repo's
 * actual git history disagrees, exactly the gap that let D9's own
 * `modelPolicies`/`agy.providerModel` config change ship as an uncommitted
 * local edit with this test suite green the entire time.
 *
 * Known remaining scope limit (found in the same review pass): `HEAD`
 * resolves inside `resolveMainCheckoutRoot`'s directory -- the ONE shared
 * main checkout every `fgos <verb>` call and worktree resolves against
 * (ADR0020) -- so this reads whichever branch the MAIN CHECKOUT currently
 * has checked out (typically `main`), never this test file's own branch's
 * HEAD when run from inside a feature worktree. These tests prove "the
 * config the main checkout currently has committed is well-formed," not
 * "this branch's own `.fgos/config.json` change (if any) is correct" --
 * a feature branch that touches `.fgos/config.json` still needs its own
 * independent proof (e.g. a real merge/catchup dry-run) that its content
 * agrees with what will actually land, since these tests cannot see it. */
function committedRunnerConfig() {
  // Main-checkout-resolved, not `import.meta.dirname`-relative: this test
  // suite itself may be running from inside a worktree, whose `.fgos/` is
  // unconditionally wiped (ADR0020) -- only the main checkout carries the
  // real committed `.fgos/config.json`.
  const repoRoot = resolveMainCheckoutRoot(path.resolve(import.meta.dirname, '..', '..'));
  const raw = execFileSync('git', ['show', 'HEAD:.fgos/config.json'], { cwd: repoRoot, encoding: 'utf8' });
  const parsed = JSON.parse(raw);
  return parsed.runner;
}

test('the committed .fgos/config.json runner section loads and is well-formed', () => {
  const cfg = committedRunnerConfig();
  assert.deepEqual(Object.keys(cfg.modelPolicies.claude).sort(), ['analytical', 'creative', 'critical', 'lightweight', 'standard']);
});

test('the committed .fgos/config.json runner section wires the agy executor to gemini\'s own modelPolicies, not claude\'s (D9, tsk-5tm-5 — the bug this piece fixes)', () => {
  const cfg = committedRunnerConfig();
  assert.equal(cfg.executors?.agy?.providerModel, 'gemini');
  assert.equal(typeof cfg.modelPolicies?.gemini?.lightweight, 'string');
  assert.ok(cfg.modelPolicies.gemini.lightweight.length > 0);
});

test('the committed .fgos/config.json runner section grants the worker exactly acceptEdits + git add/commit (bare and rtk-wrapped) — no wider (per spike B, doubled tsk-1dsr)', () => {
  const cfg = committedRunnerConfig();
  const { args } = cfg.executor;
  assert.ok(args.includes('--permission-mode'));
  assert.equal(args[args.indexOf('--permission-mode') + 1], 'acceptEdits');
  assert.ok(args.includes('--allowedTools'));
  const allowedTools = args[args.indexOf('--allowedTools') + 1];
  // tsk-1dsr: a personal PreToolUse hook (e.g. rtk) can rewrite `git ...` to
  // `rtk git ...` before the allowlist match runs, so both the bare and
  // rtk-wrapped forms are named — this is a strict superset, never a
  // widening to any git subcommand beyond add/commit.
  assert.equal(allowedTools, 'Bash(git add:*),Bash(git commit:*),Bash(rtk git add:*),Bash(rtk git commit:*)');
  assert.ok(!allowedTools.includes('Bash(git *)'), 'must stay scoped to add/commit, never widen to any git subcommand');
  assert.ok(!allowedTools.includes('Bash(rtk git *)'), 'must stay scoped to add/commit, never widen to any rtk git subcommand');
  assert.ok(!args.includes('--dangerously-skip-permissions'));
});

test('the committed .fgos/config.json runner section no longer declares a coding-classify-intake executor (tsk-49u): tsk-4ns already stripped its only consumer (fgos-submit-assist\'s dispatch-fallback branch), leaving the config entry orphaned, so it was removed via the same ADR0020 hand-commit-to-main path its own rename (tsk-3fj) originally used', () => {
  const cfg = committedRunnerConfig();
  assert.equal(cfg.executors?.['coding-classify-intake'], undefined, 'executors.coding-classify-intake should no longer exist -- retired after tsk-4ns removed its only consumer');
});

test('the committed .fgos/config.json runner section no longer declares a gather executor (tsk-5tm-2 D6): the one cross-provider path, retired -- no architectural reason on record for cross-provider, and native Task-tool dispatch already met the one documented reason (parallelizing wall-clock)', () => {
  const cfg = committedRunnerConfig();
  assert.equal(cfg.executors?.gather, undefined, 'executors.gather should no longer exist -- retired per D6');
});

test('the committed .fgos/config.json runner section declares "impact-analysis"/"pane-labeling" in its capabilities catalog (D4/D14, tsk-in1-3)', () => {
  const cfg = committedRunnerConfig();
  assert.equal(typeof cfg.capabilities?.['impact-analysis']?.description, 'string');
  assert.ok(cfg.capabilities['impact-analysis'].description.length > 0);
  assert.equal(typeof cfg.capabilities?.['pane-labeling']?.description, 'string');
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

  // Isolate from this machine's real global config (~/.fgos/config.json) —
  // otherwise a stale real-world `models` shape gets merged in and this
  // fixture stops looking "already complete".
  const homeDir = mkTempDir();
  const prevHome = process.env.HOME;
  process.env.HOME = homeDir;
  let cfg;
  try {
    cfg = ensureRunnerConfigForDir(dir);
  } finally {
    process.env.HOME = prevHome;
  }

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

// --- modelForTier: modelPolicies (D9, tsk-5tm-5) -------------------------

function modelPoliciesConfig() {
  return {
    executor: { command: process.execPath, args: ['{prompt}'] },
    modelPolicies: {
      claude: { lightweight: 'haiku', standard: 'sonnet', creative: 'sonnet', analytical: 'sonnet', critical: 'opus' },
      gemini: { lightweight: 'gemini-flash', standard: 'gemini-pro', creative: 'gemini-pro', analytical: 'gemini-pro', critical: 'gemini-ultra' },
    },
    timeoutMs: 5000,
  };
}

test('modelForTier resolves the default provider (claude) when no providerModel is given, same tier->model mapping as before', () => {
  const cfg = modelPoliciesConfig();
  assert.equal(modelForTier(cfg, 'light'), 'haiku');
  assert.equal(modelForTier(cfg, 'standard'), 'sonnet');
  assert.equal(modelForTier(cfg, 'heavy'), 'opus');
});

test('modelForTier resolves a non-Claude provider (e.g. agy/gemini) to that provider\'s own model name, not Claude\'s (D9\'s reported bug: executor non-Claude nhan sai ten)', () => {
  const cfg = modelPoliciesConfig();
  assert.equal(modelForTier(cfg, 'light', { providerModel: 'gemini' }), 'gemini-flash');
  assert.equal(modelForTier(cfg, 'standard', { providerModel: 'gemini' }), 'gemini-pro');
  assert.equal(modelForTier(cfg, 'heavy', { providerModel: 'gemini' }), 'gemini-ultra');
});

test('modelForTier throws when providerModel names a provider with no modelPolicies entry', () => {
  const cfg = modelPoliciesConfig();
  assert.throws(() => modelForTier(cfg, 'light', { providerModel: 'mistral' }), (err) => {
    assert.ok(err instanceof RunnerConfigError);
    assert.match(err.message, /mistral/);
    return true;
  });
});

test('modelForTier honors rigorOverrides, routing a work tier to a different model-policy tier than DEFAULT_TIER_TO_POLICY', () => {
  const cfg = modelPoliciesConfig();
  // Default: 'standard' work-tier -> 'standard' policy tier -> sonnet.
  assert.equal(modelForTier(cfg, 'standard'), 'sonnet');
  // Override routes 'standard' work-tier -> 'critical' policy tier -> opus.
  assert.equal(modelForTier(cfg, 'standard', { rigorOverrides: { standard: 'critical' } }), 'opus');
});

test('modelForTier prefers modelPolicies over a legacy flat models map when both are present', () => {
  const cfg = { ...modelPoliciesConfig(), models: { light: 'legacy-light', standard: 'legacy-standard', heavy: 'legacy-heavy' } };
  assert.equal(modelForTier(cfg, 'standard'), 'sonnet');
});

test('modelForTier still resolves the legacy flat models map when modelPolicies is absent (backward compatible)', () => {
  const cfg = baseConfig(['{prompt}']);
  assert.equal(modelForTier(cfg, 'standard'), 'sonnet');
});

test('loadRunnerConfig accepts a runner config declaring modelPolicies instead of models', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'model-policies.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      modelPolicies: { claude: { standard: 'sonnet' } },
      timeoutMs: 1000,
    }),
  );
  const cfg = loadRunnerConfig(configPath);
  assert.equal(cfg.modelPolicies.claude.standard, 'sonnet');
});

test('loadRunnerConfig rejects a config declaring neither models nor modelPolicies', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'no-models.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({ executor: { command: 'claude', args: ['{prompt}'] }, timeoutMs: 1000 }),
  );
  assert.throws(() => loadRunnerConfig(configPath), RunnerConfigError);
});

test('loadRunnerConfig rejects a modelPolicies entry with an unknown policy tier key', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'bad-tier-key.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      modelPolicies: { claude: { 'ultra-mega': 'opus' } },
      timeoutMs: 1000,
    }),
  );
  assert.throws(() => loadRunnerConfig(configPath), (err) => {
    assert.ok(err instanceof RunnerConfigError);
    assert.match(err.message, /ultra-mega/);
    return true;
  });
});

test('loadRunnerConfig rejects a modelPolicies entry whose model value is not a non-empty string', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'bad-model-value.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      modelPolicies: { claude: { standard: '' } },
      timeoutMs: 1000,
    }),
  );
  assert.throws(() => loadRunnerConfig(configPath), RunnerConfigError);
});

test('loadRunnerConfig rejects a "executors.<id>" entry whose providerModel is not a non-empty string', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'bad-provider-model.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      executors: { agy: { kind: 'agent', command: 'agy', args: ['{prompt}'], providerModel: '' } },
      modelPolicies: { claude: { standard: 'sonnet' } },
      timeoutMs: 1000,
    }),
  );
  assert.throws(() => loadRunnerConfig(configPath), RunnerConfigError);
});

test('loadRunnerConfig rejects a "executors.<id>" entry whose rigorOverrides key is not a valid tier', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'bad-rigor-key.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      executors: { agy: { kind: 'agent', command: 'agy', args: ['{prompt}'], rigorOverrides: { 'not-a-tier': 'critical' } } },
      modelPolicies: { claude: { standard: 'sonnet' } },
      timeoutMs: 1000,
    }),
  );
  assert.throws(() => loadRunnerConfig(configPath), RunnerConfigError);
});

test('loadRunnerConfig rejects a "executors.<id>" entry whose rigorOverrides value is not one of MODEL_POLICY_TIERS', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'bad-rigor-value.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      executors: { agy: { kind: 'agent', command: 'agy', args: ['{prompt}'], rigorOverrides: { standard: 'ultra-mega' } } },
      modelPolicies: { claude: { standard: 'sonnet' } },
      timeoutMs: 1000,
    }),
  );
  assert.throws(() => loadRunnerConfig(configPath), RunnerConfigError);
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

test('resolveExecutorCommand throws for an unknown adapter even on a raw config object that skipped loadRunnerConfig validation', () => {
  const cfg = { executor: { command: 'x', args: ['{prompt}'], adapter: 'not-a-real-adapter' }, models: {}, timeoutMs: 5000 };
  assert.throws(() => resolveExecutorCommand(cfg, { prompt: 'p', model: 'm' }), RunnerConfigError);
});

// --- tsk-62v: executor-aware resolve precedence (D4) — executors > global
// executor (tsk-in1-2 D6 retired the intermediate executors.<tier> rung)

test('resolveExecutorCommand honors a executors.<executorId> override ahead of the global executor', () => {
  const cfg = {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    executors: { 'fgos-code-implement': { kind: 'agent', command: '/executor/executor', args: ['{prompt}'], allowCrossProvider: true } },
    models: { heavy: 'opus' },
    timeoutMs: 5000,
  };
  const byExecutor = resolveExecutorCommand(cfg, { prompt: 'p', model: 'opus', tier: 'heavy', executorId: 'fgos-code-implement' });
  assert.equal(byExecutor.command, '/executor/executor');
  // no executorId at all -> falls back to the global executor, unaffected
  const noExecutorId = resolveExecutorCommand(cfg, { prompt: 'p', model: 'opus', tier: 'heavy' });
  assert.equal(noExecutorId.command, '/global/executor');
});

test('resolveExecutorCommand falls back to the global executor when the executors entry names no executor of its own (metadata-only) — executors.<tier> is retired, no intermediate stop', () => {
  // Global executor command is Claude's own here (unlike a same-named test
  // predating D5) deliberately -- this test's own purpose is metadata-only
  // fallback resolution, not cross-provider governance (D5, tsk-in1-4:
  // governance is no longer exempted by "kind" alone, so a non-Claude
  // placeholder here would trip an unrelated throw; see the dedicated
  // cross-provider-governance tests above for that boundary instead).
  const cfg = {
    executor: { command: 'claude', args: ['{prompt}'] },
    executors: { 'fgos-code-implement': { kind: 'agent', target: 'general-purpose', tier: 'heavy' } },
    models: { heavy: 'opus' },
    timeoutMs: 5000,
  };
  const resolved = resolveExecutorCommand(cfg, { prompt: 'p', model: 'opus', tier: 'heavy', executorId: 'fgos-code-implement' });
  assert.equal(resolved.command, 'claude');
});

// --- tsk-4eu: regression proof for the live symptom — "judge-decompose"
// used to fall through to the global executor (no "Read"), because its
// old home (executors.judge, a non-tier key) was never reachable by the
// tier-keyed lookup. Its own command/args (mirroring judge-discovery's
// already-correct shape) must now resolve directly via executors.
test('resolveExecutorCommand resolves "judge-decompose" through its own executors entry, args containing "Read"', () => {
  const cfg = {
    executor: { command: 'claude', args: ['{prompt}', '--allowedTools', 'Bash(git add:*),Bash(git commit:*)'] },
    executors: {
      'judge-decompose': {
        kind: 'agent',
        command: 'claude',
        args: ['{prompt}', '--allowedTools', 'Task,WebSearch,WebFetch,Read,Bash(rg:*),Bash(git add:*),Bash(git commit:*)'],
      },
    },
    models: { light: 'haiku', standard: 'sonnet', heavy: 'opus' },
    timeoutMs: 5000,
  };
  const resolved = resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'judge-decompose' });
  assert.ok(resolved.args.some((arg) => arg.includes('Read')));
});

test('resolveExecutorCommand with a executors block present but no matching executorId stays on today\'s tier/global behavior, byte-identical', () => {
  const cfg = {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    executors: { 'some-other-executor': { kind: 'agent', command: '/other/executor', args: ['{prompt}'] } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
  const resolved = resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'fgos-code-implement' });
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

test('resolveExecutorCommand throws a RunnerConfigError when a kind:"cli" executor is not registered and fgosDir is given', () => {
  const dir = mkTempDir();
  initStore(dir);
  const cfg = {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    executors: { 'fgos-code-implement': { kind: 'agent', target: 'agy' } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
  assert.throws(
    () => resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'fgos-code-implement', fgosDir: dir }),
    RunnerConfigError,
  );
});

test('resolveExecutorCommand throws a RunnerConfigError when a kind:"cli" executor is registered but not present on this machine', () => {
  const dir = mkTempDir();
  initStore(dir);
  const cfg = {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    executors: { 'fgos-code-implement': { kind: 'agent', target: 'agy-definitely-not-on-path-xyz' } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
  assert.throws(
    () => resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'fgos-code-implement', fgosDir: dir }),
    RunnerConfigError,
  );
});

test('resolveExecutorCommand resolves a metadata-only kind:"cli" executor straight through to the global executor for the command (executors.<tier> is retired, no intermediate stop)', () => {
  const dir = mkTempDir();
  initStore(dir);
  const cfg = {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    executors: { 'fgos-code-implement': { kind: 'agent', target: 'agy', tier: 'standard', allowCrossProvider: true } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
  const resolved = resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'fgos-code-implement', fgosDir: dir });
  assert.equal(resolved.command, '/global/executor');
});

test('resolveExecutorCommand skips the fgos-tool-query presence check entirely when fgosDir is omitted, even with a kind:"cli" executor present', () => {
  const cfg = {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    executors: { 'fgos-code-implement': { kind: 'agent', target: 'agy-not-registered-anywhere', allowCrossProvider: true } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
  assert.doesNotThrow(() =>
    resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'fgos-code-implement' }),
  );
});

// --- presence/cross-provider gate predicate (D13, tsk-592):
// kind === 'cli' -> kind !== 'task' -- mcp/skill/http/binary executors are
// now gated the same way a kind:"cli" executor always has been ------------

for (const kind of ['mcp', 'skill', 'http', 'binary']) {
  test(`resolveExecutorCommand throws a RunnerConfigError when a kind:"${kind}" executor is not registered and fgosDir is given (D13)`, () => {
    const dir = mkTempDir();
    initStore(dir);
    const cfg = {
      executor: { command: '/global/executor', args: ['{prompt}'] },
      executors: { 'fgos-code-implement': { kind, target: 'agy' } },
      models: { standard: 'sonnet' },
      timeoutMs: 5000,
    };
    assert.throws(
      () => resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'fgos-code-implement', fgosDir: dir }),
      RunnerConfigError,
    );
  });

  test(`resolveExecutorCommand throws a RunnerConfigError when a kind:"${kind}" executor is registered but not present on this machine (D13)`, () => {
    const dir = mkTempDir();
    initStore(dir);
    const scanTarget = ['mcp', 'skill'].includes(kind) ? mkTempDir() : undefined;
    const cfg = {
      executor: { command: '/global/executor', args: ['{prompt}'] },
      executors: { 'fgos-code-implement': { kind, target: 'agy-definitely-not-on-path-xyz' } },
      models: { standard: 'sonnet' },
      timeoutMs: 5000,
    };
    assert.throws(
      () => resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'fgos-code-implement', fgosDir: dir }),
      RunnerConfigError,
    );
  });

  test(`resolveExecutorCommand throws when a kind:"${kind}" executor resolves to a non-Claude command with no allowCrossProvider (D13)`, () => {
    const cfg = {
      executor: { command: 'claude', args: ['{prompt}'] },
      executors: { 'fgos-code-implement': { kind, command: 'agy', args: ['{prompt}'] } },
      models: { standard: 'sonnet' },
      timeoutMs: 5000,
    };
    assert.throws(
      () => resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'fgos-code-implement' }),
      RunnerConfigError,
    );
  });
}

test('resolveExecutorCommand still skips both the presence check and the cross-provider check for a kind:"task" executor, even unregistered and non-Claude-shaped (D13: kind !== "task" excludes task by construction)', () => {
  const dir = mkTempDir();
  initStore(dir);
  const cfg = {
    executor: { command: 'claude', args: ['{prompt}'] },
    executors: { 'my-agent-executor': { kind: 'agent', agentType: 'code-simplifier' } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
  assert.doesNotThrow(() =>
    resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'my-agent-executor', fgosDir: dir }),
  );
});

// executors.<id>.needs/for presence-matching (D5/D6, tsk-1o7, US-027) was
// retired at tsk-5tm-1 D1: resolveExecutorConfig no longer runs any
// presence/staleness gate at all (dead code -- 2/3 real entries were
// kind:"task", the third's needs added no signal beyond the OS's own
// ENOENT). The 2 tests that lived here asserted that gate's own
// capability-match behavior, which no longer exists to test -- removed
// rather than left passing for the wrong reason (trivial doesNotThrow with
// no gate underneath it).

// --- executors.<id>.agentType (D1/D2, tsk-3sw): kind:"task" executor with
// no own command/args resolves via a synthesized executor, Claude-only ---

function agentTypeCfg() {
  return {
    executor: {
      command: 'claude',
      args: ['-p', '{prompt}', '--model', '{model}', '--permission-mode', 'acceptEdits', '--allowedTools', 'Bash(git add:*),Bash(git commit:*)'],
    },
    executors: { 'my-agent-executor': { kind: 'agent', agentType: 'code-simplifier' } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
}

test('resolveExecutorCommand resolves a kind:"task" executor naming only agentType into the global executor\'s own command, args minus --model, plus --agent <agentType>', () => {
  const cfg = agentTypeCfg();
  const resolved = resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'my-agent-executor' });
  assert.equal(resolved.command, 'claude');
  assert.deepEqual(resolved.args, [
    '-p', 'p', '--permission-mode', 'acceptEdits', '--allowedTools', 'Bash(git add:*),Bash(git commit:*)', '--agent', 'code-simplifier',
  ]);
  assert.ok(!resolved.args.includes('--model'));
});

test('resolveExecutorCommand resolves an agentType executor identically whether fgosDir is given (cli-dispatch/spawnWorker-style) or omitted (task-dispatch/executeExecutorCli-style)', () => {
  const cfg = agentTypeCfg();
  const dir = mkTempDir();
  initStore(dir);
  const withFgosDir = resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'my-agent-executor', fgosDir: dir });
  const withoutFgosDir = resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'my-agent-executor' });
  // command/args/adapter/provider (the actual agentType-resolution shape this
  // test is about) stay identical regardless of fgosDir. baseCommit/headRef
  // (tsk-2ig attestation) are deliberately excluded here: they are ONLY
  // attempted when fgosDir is given (mkTempDir() is not a git repo, so both
  // happen to read back null today, but that is not this test's concern).
  const { baseCommit: _bc1, headRef: _hr1, ...withFgosDirShape } = withFgosDir;
  const { baseCommit: _bc2, headRef: _hr2, ...withoutFgosDirShape } = withoutFgosDir;
  assert.deepEqual(withFgosDirShape, withoutFgosDirShape);
});

// --- D20/D22 resolvedAgentType wiring (review finding H1, tsk-397): a
// caller-supplied dynamic resolution (resolveAgentTypeForTaskSpec, via
// spawnWorker/executeExecutorCli's own resolveAgentTypeForWork) fills in
// ONLY when the executor is command-less/agent-type-shaped and declares no
// static agentType of its own -- exactly the same branch the static
// agentTypeCfg() tests above exercise, just fed dynamically instead of
// from static config ---

test('resolveExecutorCommand uses a caller-supplied resolvedAgentType when the executor is command-less and declares no static agentType of its own', () => {
  const cfg = {
    executor: { command: 'claude', args: ['-p', '{prompt}', '--model', '{model}'] },
    executors: { 'my-agent-executor': { kind: 'agent' } }, // no static agentType
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
  const resolved = resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'my-agent-executor', resolvedAgentType: 'fgos-placeholder' });
  assert.deepEqual(resolved.args, ['-p', 'p', '--agent', 'fgos-placeholder']);
});

test('resolveExecutorCommand prefers a static agentType over a caller-supplied resolvedAgentType — an executor\'s own config always wins first (D2 precedence, unchanged)', () => {
  const cfg = agentTypeCfg(); // executors['my-agent-executor'].agentType = 'code-simplifier'
  const resolved = resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'my-agent-executor', resolvedAgentType: 'a-different-agent' });
  assert.ok(resolved.args.includes('code-simplifier'));
  assert.ok(!resolved.args.includes('a-different-agent'));
});

test('resolveExecutorCommand ignores resolvedAgentType entirely for an executor with its own command/args (agy/claude/codex/pi\'s real shape) — the D20 wiring never changes dispatch for any executor this repo actually configures today', () => {
  const cfg = {
    executor: { command: 'claude', args: ['{prompt}'] },
    executors: { agy: { kind: 'agent', command: 'agy', args: ['-p', '{prompt}'], allowCrossProvider: true } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
  const resolved = resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'agy', resolvedAgentType: 'fgos-placeholder' });
  assert.equal(resolved.command, 'agy');
  assert.ok(!resolved.args.includes('--agent'));
  assert.ok(!resolved.args.includes('fgos-placeholder'));
});

test('resolveExecutorCommand omitting resolvedAgentType is byte-identical to every pre-D20-wiring caller', () => {
  const cfg = {
    executor: { command: 'claude', args: ['-p', '{prompt}', '--model', '{model}'] },
    executors: { 'my-agent-executor': { kind: 'agent' } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
  const resolved = resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'my-agent-executor' });
  assert.ok(!resolved.args.includes('--agent'));
  // Falls through to the global executor (no adapter/command resolved via agentType) unchanged.
  assert.equal(resolved.command, 'claude');
  assert.deepEqual(resolved.args, ['-p', 'p', '--model', 'sonnet']);
});

test('resolveExecutorCommand still prefers a executor\'s own command/args over agentType when both are declared (judge-discovery\'s real shape) — agentType is never consulted', () => {
  const cfg = {
    executor: { command: 'claude', args: ['-p', '{prompt}', '--model', '{model}'] },
    executors: {
      'judge-discovery': {
        kind: 'agent',
        agentType: 'should-never-be-used',
        command: 'claude',
        args: ['-p', '{prompt}', '--model', '{model}', '--allowedTools', 'Task,Bash(rg:*)'],
      },
    },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
  const resolved = resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'judge-discovery' });
  assert.deepEqual(resolved.args, ['-p', 'p', '--model', 'sonnet', '--allowedTools', 'Task,Bash(rg:*)']);
  assert.ok(!resolved.args.includes('--agent'));
});

test('resolveExecutorCommand falls through to the global executor for a executor with neither command/args nor agentType', () => {
  // Claude command here, same reason as the sibling metadata-only test
  // above (D5, tsk-in1-4): unrelated to cross-provider governance.
  const cfg = {
    executor: { command: 'claude', args: ['{prompt}'] },
    executors: { 'fgos-code-implement': { kind: 'agent', tier: 'standard' } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
  const resolved = resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'fgos-code-implement' });
  assert.equal(resolved.command, 'claude');
});

// --- executors.<id>.agentType static shape (D1/D2, tsk-3sw), mirrors the
// existing "model" field validation pattern ---------------------------

test('loadRunnerConfig accepts a "executors.<id>" entry with a non-empty agentType', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'agent-type.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      executors: { 'my-agent-executor': { kind: 'agent', agentType: 'code-simplifier' } },
      models: { standard: 'sonnet' },
      timeoutMs: 1000,
    }),
  );
  assert.doesNotThrow(() => loadRunnerConfig(configPath));
});

test('loadRunnerConfig rejects a "executors.<id>" entry whose agentType is not a non-empty string', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'bad-agent-type.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      executors: { 'my-agent-executor': { kind: 'agent', agentType: '' } },
      models: { standard: 'sonnet' },
      timeoutMs: 1000,
    }),
  );
  assert.throws(() => loadRunnerConfig(configPath), RunnerConfigError);
});

// --- executors.<id>.forceCliSpawn static shape (tsk-3ik-1), mirrors the
// existing agentType/allowCrossProvider boolean-field validation pattern ---

test('loadRunnerConfig accepts a "executors.<id>" entry with a boolean forceCliSpawn', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'force-cli-spawn.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      executors: { 'my-task-executor': { kind: 'agent', agentType: 'code-simplifier', forceCliSpawn: true } },
      models: { standard: 'sonnet' },
      timeoutMs: 1000,
    }),
  );
  assert.doesNotThrow(() => loadRunnerConfig(configPath));
});

test('loadRunnerConfig rejects a "executors.<id>" entry whose forceCliSpawn is not a boolean', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'bad-force-cli-spawn.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      executors: { 'my-task-executor': { kind: 'agent', forceCliSpawn: 'yes' } },
      models: { standard: 'sonnet' },
      timeoutMs: 1000,
    }),
  );
  assert.throws(() => loadRunnerConfig(configPath), RunnerConfigError);
});

// --- decideDispatchMechanism (tsk-3ik-1, Native-First Dispatch Doctrine
// rules 1/2/4, docs/decisions/0026-...md) — pure decision, no cfg lookup ---

test('decideDispatchMechanism: no native mechanism always resolves out-of-process, regardless of live access or force flag (rule 1)', () => {
  assert.equal(decideDispatchMechanism({ hasNativeMechanism: false, hasLiveTaskAccess: true, forceCliSpawn: false }), 'out-of-process');
  assert.equal(decideDispatchMechanism({ hasNativeMechanism: false, hasLiveTaskAccess: false, forceCliSpawn: false }), 'out-of-process');
  assert.equal(decideDispatchMechanism({}), 'out-of-process');
});

test('decideDispatchMechanism: native mechanism + live Task access + no force -> in-process (rule 2)', () => {
  assert.equal(decideDispatchMechanism({ hasNativeMechanism: true, hasLiveTaskAccess: true, forceCliSpawn: false }), 'in-process');
});

test('decideDispatchMechanism: native mechanism but no live Task access -> out-of-process (safe fallback, never assumes access)', () => {
  assert.equal(decideDispatchMechanism({ hasNativeMechanism: true, hasLiveTaskAccess: false, forceCliSpawn: false }), 'out-of-process');
});

test('decideDispatchMechanism: forceCliSpawn wins over native mechanism + live Task access (rule 4 exception)', () => {
  assert.equal(decideDispatchMechanism({ hasNativeMechanism: true, hasLiveTaskAccess: true, forceCliSpawn: true }), 'out-of-process');
});

// --- decideExecutorDispatchMechanism — executors.<id>-specific convenience,
// derives hasNativeMechanism/forceCliSpawn from cfg.executors[executorId]
// without touching resolveExecutorConfig's own resolution path ---

test('decideExecutorDispatchMechanism resolves to in-process for a kind:"task" executor when the caller declares live Task access', () => {
  const cfg = {
    executor: { command: 'claude', args: ['{prompt}'] },
    executors: { 'judge-discovery': { kind: 'agent', agentType: 'judge' } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
  assert.equal(decideExecutorDispatchMechanism(cfg, 'judge-discovery', { hasLiveTaskAccess: true }), 'in-process');
});

test('decideExecutorDispatchMechanism falls back to out-of-process for a kind:"task" executor when the caller has no live Task access', () => {
  const cfg = {
    executor: { command: 'claude', args: ['{prompt}'] },
    executors: { 'judge-discovery': { kind: 'agent', agentType: 'judge' } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
  assert.equal(decideExecutorDispatchMechanism(cfg, 'judge-discovery', { hasLiveTaskAccess: false }), 'out-of-process');
  assert.equal(decideExecutorDispatchMechanism(cfg, 'judge-discovery'), 'out-of-process');
});

test('decideExecutorDispatchMechanism respects a executor\'s own forceCliSpawn override even with live Task access', () => {
  const cfg = {
    executor: { command: 'claude', args: ['{prompt}'] },
    executors: { 'judge-discovery': { kind: 'agent', agentType: 'judge', forceCliSpawn: true } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
  assert.equal(decideExecutorDispatchMechanism(cfg, 'judge-discovery', { hasLiveTaskAccess: true }), 'out-of-process');
});

test('decideExecutorDispatchMechanism always resolves out-of-process for a kind:"tool" executor, regardless of live Task access (D5, tsk-in1-4: mechanical/never-native, even one that DOES dispatch via a real command — "agent" is the only native-eligible kind)', () => {
  const cfg = {
    executor: { command: 'claude', args: ['{prompt}'] },
    executors: { 'submit-assist-classify': { kind: 'tool', command: 'agy', args: ['{prompt}'], allowCrossProvider: true } },
    models: { light: 'flash-3.5' },
    timeoutMs: 5000,
  };
  assert.equal(decideExecutorDispatchMechanism(cfg, 'submit-assist-classify', { hasLiveTaskAccess: true }), 'out-of-process');
});

test('decideExecutorDispatchMechanism resolves out-of-process for an unconfigured executor, regardless of live Task access', () => {
  const cfg = { executor: { command: 'claude', args: ['{prompt}'] }, models: { standard: 'sonnet' }, timeoutMs: 5000 };
  assert.equal(decideExecutorDispatchMechanism(cfg, 'no-such-executor', { hasLiveTaskAccess: true }), 'out-of-process');
});

// --- decideExecutorCli — the "decide <executorId>" CLI-facing async
// function, mirrors executeExecutorCli's own repoRoot-skips-git-lookup
// test style ---

test('decideExecutorCli rejects with a usage RunnerConfigError when executorId is missing', async () => {
  await assert.rejects(() => decideExecutorCli(undefined, { repoRoot: mkTempDir() }), RunnerConfigError);
  await assert.rejects(() => decideExecutorCli('', { repoRoot: mkTempDir() }), RunnerConfigError);
});

test('decideExecutorCli resolves "in-process" for a kind:"task" executor when hasLiveTaskAccess is passed true, alongside its agentType', async () => {
  const root = mkTempDir();
  writeRunnerConfigFixture(root, {
    executor: { command: 'claude', args: ['{prompt}'] },
    executors: { 'judge-discovery': { kind: 'agent', agentType: 'judge' } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const decided = await decideExecutorCli('judge-discovery', { repoRoot: root, hasLiveTaskAccess: true });
  assert.deepEqual(decided, { mechanism: 'in-process', agentType: 'judge', configured: true });
});

test('decideExecutorCli resolves "out-of-process" for the same kind:"task" executor when hasLiveTaskAccess is omitted (safe default), still reporting its agentType', async () => {
  const root = mkTempDir();
  writeRunnerConfigFixture(root, {
    executor: { command: 'claude', args: ['{prompt}'] },
    executors: { 'judge-discovery': { kind: 'agent', agentType: 'judge' } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const decided = await decideExecutorCli('judge-discovery', { repoRoot: root });
  assert.deepEqual(decided, { mechanism: 'out-of-process', agentType: 'judge', configured: true });
});

test('decideExecutorCli omits agentType entirely for a kind:"tool" executor that declares none (tsk-3ik-3)', async () => {
  const root = mkTempDir();
  writeRunnerConfigFixture(root, {
    executor: { command: 'claude', args: ['{prompt}'] },
    executors: { 'submit-assist-classify': { kind: 'tool', command: 'agy', args: ['{prompt}'], allowCrossProvider: true } },
    models: { light: 'flash-3.5' },
    timeoutMs: 5000,
  });
  const decided = await decideExecutorCli('submit-assist-classify', { repoRoot: root, hasLiveTaskAccess: true });
  assert.deepEqual(decided, { mechanism: 'out-of-process', configured: true });
  assert.ok(!('agentType' in decided));
});

// --- decideExecutorCli: --needs-soul (tsk-60f D2) — the caller's own
// self-declaration that it is about to fire its own Agent/Task tool with
// no executor or work item to name; only consulted once executorId/purpose/
// work all come up empty, and generalizes --work's own pre-existing
// hasExplicitExecutor===false default (below) to every door ------------------

test('decideExecutorCli defaults to native dispatch for a bare --needs-soul call with no executor/purpose/work to name, honoring hasLiveTaskAccess', async () => {
  const root = mkTempDir();
  writeRunnerConfigFixture(root, {
    executor: { command: 'claude', args: ['{prompt}'] },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const withAccess = await decideExecutorCli(undefined, { repoRoot: root, needsSoul: true, hasLiveTaskAccess: true });
  assert.deepEqual(withAccess, { mechanism: 'in-process', configured: false });
  const withoutAccess = await decideExecutorCli(undefined, { repoRoot: root, needsSoul: true });
  assert.deepEqual(withoutAccess, { mechanism: 'out-of-process', configured: false });
});

test('decideExecutorCli --needs-soul defaults to native dispatch for an unregistered --for purpose, instead of "unavailable"', async () => {
  const root = mkTempDir();
  writeRunnerConfigFixture(root, {
    executor: { command: 'claude', args: ['{prompt}'] },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const decided = await decideExecutorCli(undefined, { repoRoot: root, for: 'general-purpose', needsSoul: true, hasLiveTaskAccess: true });
  assert.deepEqual(decided, { mechanism: 'in-process', configured: false });
});

test('decideExecutorCli --needs-soul never overrides a real registered purpose match -- a real executor still wins', async () => {
  const root = mkTempDir();
  writeRunnerConfigFixture(root, {
    executor: { command: 'claude', args: ['{prompt}'] },
    capabilities: { judge: {} },
    executors: { gather: { kind: 'tool', for: ['judge'], command: 'agy', args: ['{prompt}'], allowCrossProvider: true } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const decided = await decideExecutorCli(undefined, { repoRoot: root, for: 'judge', needsSoul: true, hasLiveTaskAccess: true });
  assert.deepEqual(decided, { mechanism: 'out-of-process', executorId: 'gather', configured: true });
});

test('decideExecutorCli throws a usage RunnerConfigError when executorId/--for/--work/--needs-soul are all missing', async () => {
  await assert.rejects(() => decideExecutorCli(undefined, { repoRoot: mkTempDir() }), RunnerConfigError);
});

// --- decideExecutorCli: MCP hand-back (tsk-45f D10) -- a tool-kind executor
// with an mcp invocation's own "tools" map hands back mcpTool instead of
// resolving out-of-process -------------------------------------------------

test('decideExecutorCli hands back mcpTool (mechanism upgraded to in-process) for a --for purpose matching an mcp invocation\'s tools map -- the real gitnexus/impact-analysis case', async () => {
  const root = mkTempDir();
  writeRunnerConfigFixture(root, {
    executor: { command: 'claude', args: ['{prompt}'] },
    capabilities: { 'impact-analysis': {} },
    executors: {
      gitnexus: {
        kind: 'tool',
        for: ['impact-analysis'],
        invocations: [{ via: 'mcp', command: 'mcp:gitnexus', tools: { 'impact-analysis': 'mcp__gitnexus__impact' } }],
      },
    },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const decided = await decideExecutorCli(undefined, { repoRoot: root, for: 'impact-analysis', hasLiveTaskAccess: true });
  assert.deepEqual(decided, { mechanism: 'in-process', mcpTool: 'mcp__gitnexus__impact', configured: true, executorId: 'gitnexus' });
});

test('decideExecutorCli hands back mcpTool for a direct executorId call with no --for, using the executor\'s own sole "for" entry', async () => {
  const root = mkTempDir();
  writeRunnerConfigFixture(root, {
    executor: { command: 'claude', args: ['{prompt}'] },
    capabilities: { 'impact-analysis': {} },
    executors: {
      gitnexus: {
        kind: 'tool',
        for: ['impact-analysis'],
        invocations: [{ via: 'mcp', command: 'mcp:gitnexus', tools: { 'impact-analysis': 'mcp__gitnexus__impact' } }],
      },
    },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const decided = await decideExecutorCli('gitnexus', { repoRoot: root, hasLiveTaskAccess: true });
  assert.deepEqual(decided, { mechanism: 'in-process', mcpTool: 'mcp__gitnexus__impact', configured: true });
});

test('decideExecutorCli never hands back mcpTool when the requested purpose has no entry in the invocation\'s tools map -- stays out-of-process', async () => {
  const root = mkTempDir();
  writeRunnerConfigFixture(root, {
    executor: { command: 'claude', args: ['{prompt}'] },
    capabilities: { 'impact-analysis': {}, other: {} },
    executors: {
      gitnexus: {
        kind: 'tool',
        for: ['impact-analysis', 'other'],
        invocations: [{ via: 'mcp', command: 'mcp:gitnexus', tools: { 'impact-analysis': 'mcp__gitnexus__impact' } }],
      },
    },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const decided = await decideExecutorCli(undefined, { repoRoot: root, for: 'other', hasLiveTaskAccess: true });
  assert.deepEqual(decided, { mechanism: 'out-of-process', executorId: 'gitnexus', configured: true });
});

test('decideExecutorCli never hands back mcpTool for a direct executorId call when the executor names more than one "for" entry -- ambiguous, no purpose to disambiguate', async () => {
  const root = mkTempDir();
  writeRunnerConfigFixture(root, {
    executor: { command: 'claude', args: ['{prompt}'] },
    capabilities: { 'impact-analysis': {}, other: {} },
    executors: {
      gitnexus: {
        kind: 'tool',
        for: ['impact-analysis', 'other'],
        invocations: [{ via: 'mcp', command: 'mcp:gitnexus', tools: { 'impact-analysis': 'mcp__gitnexus__impact' } }],
      },
    },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const decided = await decideExecutorCli('gitnexus', { repoRoot: root, hasLiveTaskAccess: true });
  assert.deepEqual(decided, { mechanism: 'out-of-process', configured: true });
});

test('decideExecutorCli never hands back mcpTool for an agent-kind executor -- agentType always wins, mcpTool and agentType are mutually exclusive', async () => {
  const root = mkTempDir();
  writeRunnerConfigFixture(root, {
    executor: { command: 'claude', args: ['{prompt}'] },
    capabilities: { judge: {} },
    executors: { 'judge-discovery': { kind: 'agent', agentType: 'judge', for: ['judge'] } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const decided = await decideExecutorCli(undefined, { repoRoot: root, for: 'judge', hasLiveTaskAccess: true });
  assert.deepEqual(decided, { mechanism: 'in-process', agentType: 'judge', configured: true, executorId: 'judge-discovery' });
  assert.equal('mcpTool' in decided, false);
});

test('the "decide" CLI entry point hands back mcpTool for --for impact-analysis against a real mcp tools map', () => {
  const { repoRoot } = mkTempGitRepo();
  writeRunnerConfigFixture(repoRoot, {
    executor: { command: 'claude', args: ['{prompt}'] },
    capabilities: { 'impact-analysis': {} },
    executors: {
      gitnexus: {
        kind: 'tool',
        for: ['impact-analysis'],
        invocations: [{ via: 'mcp', command: 'mcp:gitnexus', tools: { 'impact-analysis': 'mcp__gitnexus__impact' } }],
      },
    },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const dispatchPath = path.resolve('src/runner/dispatch.mjs');
  const result = spawnSync(
    process.execPath,
    [dispatchPath, 'decide', '--for', 'impact-analysis', '--has-live-task-access'],
    { encoding: 'utf8', cwd: repoRoot },
  );
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), { mechanism: 'in-process', mcpTool: 'mcp__gitnexus__impact', configured: true, executorId: 'gitnexus' });
});

test('the "decide" CLI entry point parses --needs-soul', () => {
  const { repoRoot } = mkTempGitRepo();
  writeRunnerConfigFixture(repoRoot, { executor: { command: 'claude', args: ['{prompt}'] }, models: { standard: 'sonnet' }, timeoutMs: 5000 });
  const dispatchPath = path.resolve('src/runner/dispatch.mjs');
  const result = spawnSync(
    process.execPath,
    [dispatchPath, 'decide', '--for', 'general-purpose', '--needs-soul', '--has-live-task-access'],
    { encoding: 'utf8', cwd: repoRoot },
  );
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), { mechanism: 'in-process', configured: false });
});

// tsk-in1-4: these CLI-spawn tests used to run against THIS repo's own
// live main-checkout `.fgos/config.json` (resolved via `resolveMainCheckoutRoot`,
// unaffected by `cwd` unless `cwd` itself sits in an isolated git repo) —
// coupling a unit test to the real, evolving config was always fragile,
// and became untenable the moment `kind` stopped being backward-compatible
// (D5): the main checkout's own config cannot be migrated to `agent`/`tool`
// ahead of this item's own code landing there (ADR0020: a config change
// lands as a direct main commit, independently of the code's own branch
// merge — doing so here would leave `main` unable to load its runner
// config at all until a human decides to merge this item's code too,
// breaking every OTHER concurrent session's `fgos` calls in the meantime).
// Spawned with `cwd` inside a throwaway `mkTempGitRepo()` instead, carrying
// its own self-contained, NEW-schema config — same end-to-end CLI-process
// proof, zero coupling to the live main checkout either direction.
test('the "decide" CLI entry point (node src/runner/dispatch.mjs decide <executorId>) prints {mechanism} JSON to stdout for a real spawned invocation against an isolated repo\'s own .fgos/config.json', () => {
  const { repoRoot } = mkTempGitRepo();
  writeRunnerConfigFixture(repoRoot, { executor: { command: 'claude', args: ['{prompt}'] }, models: { standard: 'sonnet' }, timeoutMs: 5000 });
  const dispatchPath = path.resolve('src/runner/dispatch.mjs');
  const result = spawnSync(process.execPath, [dispatchPath, 'decide', 'no-such-executor-configured'], { encoding: 'utf8', cwd: repoRoot });
  assert.equal(result.status, 0, result.stderr);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.mechanism, 'out-of-process');
});

test('the "decide" CLI entry point exits non-zero with a usage message when executorId is omitted', () => {
  const dispatchPath = path.resolve('src/runner/dispatch.mjs');
  const result = spawnSync(process.execPath, [dispatchPath, 'decide'], { encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /usage: node src\/runner\/dispatch\.mjs decide/);
});

test('an unknown CLI subcommand still exits non-zero with a usage message naming execute and decide, never resolve', () => {
  const dispatchPath = path.resolve('src/runner/dispatch.mjs');
  const result = spawnSync(process.execPath, [dispatchPath, 'bogus'], { encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /unknown subcommand/);
  assert.doesNotMatch(result.stderr, /resolve <executorId>/);
  assert.match(result.stderr, /execute <executorId>/);
  assert.match(result.stderr, /decide <executorId>/);
});

// --- tsk-129: the "execute" CLI entry point tees live chunks to stderr ---
// (P39's onChunk mechanism already existed and was already tested at the
// spawnWorker/adapter layer; the CLI entrypoint's `execute` branch simply
// never wired it in, so a real spawned `execute` call stayed silent from
// the one "fgos: dispatch ..." line until the final JSON, however long the
// child actually ran -- RESEARCH.md's own finding for this item.)

test('the "execute" CLI entry point tees the spawned executor\'s own stdout/stderr chunks live to this process\'s stderr, and stdout still carries exactly one parseable JSON line', () => {
  const { repoRoot } = mkTempGitRepo();
  const scriptPath = writeMultiChunkExecutor(repoRoot);
  writeRunnerConfigFixture(repoRoot, {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    executors: { probe: { kind: 'agent', command: process.execPath, args: [scriptPath], allowCrossProvider: true } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const dispatchPath = path.resolve('src/runner/dispatch.mjs');
  const result = spawnSync(process.execPath, [dispatchPath, 'execute', 'probe'], { encoding: 'utf8', cwd: repoRoot });
  assert.equal(result.status, 0, result.stderr);
  // Live-teed chunks from the spawned child arrive on THIS process's own
  // stderr, alongside the pre-existing "fgos: dispatch ..." chokepoint line.
  assert.match(result.stderr, /out-chunk-1/);
  assert.match(result.stderr, /out-chunk-2/);
  assert.match(result.stderr, /err-chunk-1/);
  // stdout keeps carrying exactly one line -- the final JSON result --
  // untouched by the live tee, so a scripted caller's JSON.parse still works.
  const lines = result.stdout.trim().split('\n');
  assert.equal(lines.length, 1);
  const parsed = JSON.parse(lines[0]);
  assert.equal(parsed.status, 0);
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
test('spawnWorker with opts.stage:"discovery" logs the discovery templateName and sends the fgos-coding-discovering-pointed prompt — never a diverging pick between the two call sites', async () => {
  const dir = mkTempDir();
  const scriptPath = writeEchoExecutor(dir);
  const cfg = baseConfig([scriptPath, '{prompt}']);
  const work = sampleWork();

  const result = await spawnWorker(work, cfg, mkTempDir(), { stage: 'discovery' });

  assert.equal(result.templateName, 'worker-prompt-discovery.txt');
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.args[0], buildPrompt(work, undefined, 'discovery'));
  assert.ok(payload.args[0].includes('.claude/skills/fgos-coding-discovering/SKILL.md'));
});

test('spawnWorker defaults to the standard tier when the work item omits tier', async () => {
  const dir = mkTempDir();
  const scriptPath = writeEchoExecutor(dir);
  const cfg = baseConfig([scriptPath, '{prompt}']);
  const result = await spawnWorker(sampleWork(), cfg, mkTempDir());
  assert.equal(result.tier, 'standard');
  assert.equal(result.model, 'sonnet');
});

// --- tsk-62v: spawnWorker's additive executorId/provider result fields (D7) ---

test('spawnWorker prints a "fgos: dispatch ..." chokepoint line to stderr before spawning, naming job/executor/via/provider/model/tier', async () => {
  const dir = mkTempDir();
  const scriptPath = writeEchoExecutor(dir);
  const cfg = baseConfig([scriptPath, '{prompt}']);

  const original = process.stderr.write.bind(process.stderr);
  let captured = '';
  process.stderr.write = (chunk) => {
    captured += chunk;
    return true;
  };
  let result;
  try {
    result = await spawnWorker(sampleWork(), cfg, mkTempDir());
  } finally {
    process.stderr.write = original;
  }
  assert.match(captured, /fgos: dispatch job=fgos-coding-implement executor=\(global executor\) via=cli-spawn provider=.+ model=sonnet tier=standard/);
  assert.equal(result.status, 0);
});

test('spawnWorker result carries executorId and provider alongside every existing field, unaffected by tier/config unrelated to executors', async () => {
  const dir = mkTempDir();
  const scriptPath = writeEchoExecutor(dir);
  const cfg = baseConfig([scriptPath, '{prompt}', '--model', '{model}']);

  const result = await spawnWorker(sampleWork(), cfg, mkTempDir());

  assert.equal(result.executorId, 'fgos-coding-implement');
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
  assert.equal(result.executorId, 'fgos-coding-implement');
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

test('spawnWorker threads opts.fgosDir into a kind:"cli" executor\'s presence check end-to-end, resolving through fgos tool query', async () => {
  const dir = mkTempDir();
  const fgosDir = mkTempDir();
  initStore(fgosDir);
  const scriptPath = writeEchoExecutor(dir);
  const cfg = {
    executor: { command: process.execPath, args: [scriptPath, '{prompt}'] },
    executors: { 'fgos-coding-implement': { kind: 'agent', tier: 'standard', allowCrossProvider: true } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };

  const result = await spawnWorker(sampleWork(), cfg, mkTempDir(), { fgosDir });
  assert.equal(result.executorId, 'fgos-coding-implement');

  const cfgUnregistered = {
    executor: { command: process.execPath, args: [scriptPath, '{prompt}'] },
    executors: { 'fgos-coding-implement': { kind: 'agent', target: 'not-registered' } },
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

// --- process-group kill, idle-timeout, nested-dispatch-depth cap
// (dispatch-execute optimization pass) --------------------------------

test('cliSpawnAdapter kills the whole process GROUP on timeout, not just the directly-spawned child -- a grandchild the executor itself spawned does not survive', async () => {
  const dir = mkTempDir();
  const { scriptPath, markerPath } = writeGrandchildSpawningExecutor(dir);
  const cfg = baseConfig([scriptPath]);

  await assert.rejects(
    () => spawnWorker(sampleWork(), cfg, mkTempDir(), { timeoutMs: 500 }),
    (err) => {
      assert.ok(err instanceof DispatchError);
      assert.equal(err.errorClass, 'worker-timeout');
      return true;
    },
  );

  // Give the OS a moment to actually reap the grandchild after the SIGTERM.
  await new Promise((r) => setTimeout(r, 300));
  const grandchildPid = Number(fs.readFileSync(markerPath, 'utf8').trim());
  let alive = true;
  try {
    process.kill(grandchildPid, 0);
  } catch {
    alive = false;
  }
  assert.equal(alive, false, 'grandchild process must be dead after the parent was killed via process-group SIGTERM');
});

test('spawnWorker: idleTimeoutMs kills a worker that has gone silent, well before the much-larger hard timeoutMs cap fires', async () => {
  const dir = mkTempDir();
  const scriptPath = writeGoesSilentExecutor(dir);
  const cfg = baseConfig([scriptPath]);
  const start = Date.now();

  await assert.rejects(
    () => spawnWorker(sampleWork(), cfg, mkTempDir(), { timeoutMs: 10000, idleTimeoutMs: 300 }),
    (err) => {
      assert.ok(err instanceof DispatchError);
      assert.equal(err.errorClass, 'worker-timeout');
      assert.match(err.message, /idle timeout/);
      assert.equal(err.stdout, 'alive\n');
      return true;
    },
  );

  const elapsed = Date.now() - start;
  assert.ok(elapsed < 5000, `expected the idle timeout (300ms) to fire well before the 10000ms hard cap, took ${elapsed}ms`);
});

test('spawnWorker: idleTimeoutMs is disarmed by default (absent from cfg/opts) -- a silent worker only ever hits the hard timeoutMs cap, byte-identical to before this field existed', async () => {
  const dir = mkTempDir();
  const scriptPath = writeGoesSilentExecutor(dir);
  const cfg = baseConfig([scriptPath]);

  await assert.rejects(
    () => spawnWorker(sampleWork(), cfg, mkTempDir(), { timeoutMs: 400 }),
    (err) => {
      assert.ok(err instanceof DispatchError);
      assert.equal(err.errorClass, 'worker-timeout');
      // No idle timeout configured -- the message names the hard cap, never "idle timeout".
      assert.doesNotMatch(err.message, /idle timeout/);
      return true;
    },
  );
});

test('spawnWorker: idleTimeoutMs resets on every chunk -- a worker producing periodic output past the idle budget still completes normally', async () => {
  const dir = mkTempDir();
  const scriptPath = writePeriodicWriterExecutor(dir, { intervalMs: 150, count: 5 });
  const cfg = baseConfig([scriptPath]);

  // idleTimeoutMs (700ms) is smaller than the total runtime (~750ms) but
  // larger than the gap between any two ticks (150ms) -- only passes if the
  // idle timer truly resets per chunk instead of firing on total elapsed time.
  const result = await spawnWorker(sampleWork(), cfg, mkTempDir(), { timeoutMs: 10000, idleTimeoutMs: 700 });
  assert.equal(result.status, 0);
  assert.match(result.stdout, /tick-4/);
});

test('spawnWorker threads a FGOS_DISPATCH_DEPTH of "1" into a fresh (non-nested) dispatch -- the child sees itself one level deep', async () => {
  const dir = mkTempDir();
  const scriptPath = writeDepthEchoExecutor(dir);
  const cfg = baseConfig([scriptPath]);
  const priorDepth = process.env[DISPATCH_DEPTH_ENV];
  delete process.env[DISPATCH_DEPTH_ENV];
  try {
    const result = await spawnWorker(sampleWork(), cfg, mkTempDir());
    assert.deepEqual(JSON.parse(result.stdout), { depth: '1' });
  } finally {
    if (priorDepth !== undefined) process.env[DISPATCH_DEPTH_ENV] = priorDepth;
    else delete process.env[DISPATCH_DEPTH_ENV];
  }
});

test('spawnWorker refuses with DispatchError(dispatch-depth-exceeded) once FGOS_DISPATCH_DEPTH already sits at the cap -- never spawns', async () => {
  const dir = mkTempDir();
  const scriptPath = writeDepthEchoExecutor(dir);
  const cfg = baseConfig([scriptPath]);
  const prior = process.env[DISPATCH_DEPTH_ENV];
  process.env[DISPATCH_DEPTH_ENV] = String(MAX_DISPATCH_DEPTH);
  try {
    await assert.rejects(
      () => spawnWorker(sampleWork(), cfg, mkTempDir()),
      (err) => {
        assert.ok(err instanceof DispatchError);
        assert.equal(err.errorClass, 'dispatch-depth-exceeded');
        assert.equal(err.depth, MAX_DISPATCH_DEPTH);
        return true;
      },
    );
  } finally {
    if (prior === undefined) delete process.env[DISPATCH_DEPTH_ENV];
    else process.env[DISPATCH_DEPTH_ENV] = prior;
  }
});

test('spawnWorker refused with dispatch-depth-exceeded classifies to "park" via the recovery matrix, never blindly retried', async () => {
  const dir = mkTempDir();
  const scriptPath = writeDepthEchoExecutor(dir);
  const cfg = baseConfig([scriptPath]);
  const prior = process.env[DISPATCH_DEPTH_ENV];
  process.env[DISPATCH_DEPTH_ENV] = String(MAX_DISPATCH_DEPTH + 5);
  try {
    let caughtErrorClass;
    try {
      await spawnWorker(sampleWork(), cfg, mkTempDir());
    } catch (err) {
      caughtErrorClass = err.errorClass;
    }
    const { resolveAction } = await import('../../src/runner/recovery.mjs');
    assert.deepEqual(resolveAction(caughtErrorClass, 1), { action: 'park', errorClass: 'dispatch-depth-exceeded' });
  } finally {
    if (prior === undefined) delete process.env[DISPATCH_DEPTH_ENV];
    else process.env[DISPATCH_DEPTH_ENV] = prior;
  }
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
// together registers+marks-present the executor first, same as the
// existing D6 tests do.

test('resolveExecutorCommand throws when a kind:"cli" executor resolves to a non-Claude command with no allowCrossProvider', () => {
  const cfg = {
    executor: { command: 'claude', args: ['{prompt}'] },
    executors: { 'fgos-code-implement': { kind: 'agent', command: 'agy', args: ['{prompt}'] } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
  assert.throws(
    () => resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'fgos-code-implement' }),
    RunnerConfigError,
  );
});

test('resolveExecutorCommand dispatches normally when the same non-Claude executor sets allowCrossProvider: true', () => {
  const cfg = {
    executor: { command: 'claude', args: ['{prompt}'] },
    executors: { 'fgos-code-implement': { kind: 'agent', command: 'agy', args: ['{prompt}'], allowCrossProvider: true } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
  const resolved = resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'fgos-code-implement' });
  assert.equal(resolved.command, 'agy');
});

test('resolveExecutorCommand never requires allowCrossProvider for a kind:"cli" executor naming no command of its own, falling through to the global Claude executor', () => {
  // The exact false-positive D2 was written to rule out: kind:"cli" alone
  // (metadata-only, no command/adapter override) must NOT gate on
  // allowCrossProvider when the final resolved command is Claude's own.
  const cfg = {
    executor: { command: 'claude', args: ['{prompt}'] },
    executors: { 'fgos-code-implement': { kind: 'agent' } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
  const resolved = resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'fgos-code-implement' });
  assert.equal(resolved.command, 'claude');
});

test('resolveExecutorCommand never requires allowCrossProvider for a kind:"cli" executor that resolves to Claude\'s own CLI', () => {
  const cfg = {
    executor: { command: 'claude', args: ['{prompt}'] },
    executors: { 'fgos-code-implement': { kind: 'agent', command: 'claude', args: ['{prompt}'] } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
  const resolved = resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'fgos-code-implement' });
  assert.equal(resolved.command, 'claude');
});

test('resolveExecutorCommand cross-provider governance is kind-independent (D5, tsk-in1-4): a kind:"tool" executor resolving to a non-Claude command via its own flat command/args still needs allowCrossProvider — no kind alone ever exempts it, only an agentType-resolved path does (kind:"task" used to be the exempt-by-kind value; retired)', () => {
  const cfg = {
    executor: { command: 'claude', args: ['{prompt}'] },
    executors: { distill: { kind: 'tool', command: 'agy', args: ['{prompt}'] } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
  assert.throws(
    () => resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'distill' }),
    RunnerConfigError,
  );
  cfg.executors.distill.allowCrossProvider = true;
  const resolved = resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'distill' });
  assert.equal(resolved.command, 'agy');
});

test('resolveExecutorCommand exempts an agentType-resolved executor from cross-provider governance regardless of kind — it always reuses the global executor\'s own command (always Claude in practice), never a real non-Claude backend', () => {
  const cfg = {
    executor: { command: 'claude', args: ['{prompt}'] },
    executors: { 'my-agent': { kind: 'agent', agentType: 'general-purpose' } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
  const resolved = resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'my-agent' });
  assert.equal(resolved.command, 'claude');
});

test('resolveExecutorCommand with no executors block at all never triggers cross-provider governance, byte-identical to pre-tsk-32n behavior', () => {
  const cfg = {
    executor: { command: 'agy', args: ['{prompt}'] },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
  const resolved = resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard' });
  assert.equal(resolved.command, 'agy');
});

test('resolveExecutorCommand throws for a non-Claude "cli" executor even when fgosDir is given (cross-provider governance is independent of the retired presence gate, tsk-5tm-1 D1)', () => {
  const dir = mkTempDir();
  initStore(dir);
  const cfg = {
    executor: { command: 'claude', args: ['{prompt}'] },
    executors: { 'fgos-code-implement': { kind: 'agent', command: 'agy', args: ['{prompt}'] } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
  assert.throws(
    () =>
      resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'fgos-code-implement', fgosDir: dir }),
    RunnerConfigError,
  );
});

// --- tsk-60f D4: `resolveExecutorCli` / the "resolve <executorId>" CLI
// subcommand (tsk-5l2-1) were retired -- 0 production consumers (confirmed
// live via `impact({target:"resolveExecutorCli",direction:"upstream"})`:
// LOW risk, 1 direct caller, the CLI branch itself). The behavior these
// tests used to prove that has no `executeExecutorCli` equivalent yet
// (providerModel via modelForTier, D9 tsk-5tm; --tier/--model override,
// tsk-2k1 D10; gate-carries propagation) is ported below onto
// `executeExecutorCli`/the "execute" CLI subcommand -- everything else this
// cluster used to test (usage errors, purpose-not-registered, the
// cross-provider-gate RunnerConfigError, a real spawn printing JSON, the
// CLI's own usage-error exit) already has an `executeExecutorCli`-native
// test of its own (below, and the "tsk-5tm-3 D5" cluster right after this
// one) -- ported once, not duplicated.

function writeRunnerConfigFixture(root, cfg) {
  fs.mkdirSync(path.join(root, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(root, '.fgos', 'config.json'), JSON.stringify({ runner: cfg }, null, 2));
}

test('executeExecutorCli resolves a cross-provider executor\'s own providerModel through modelForTier, picking that provider\'s model over the default (claude) policy (D9\'s reported agy/Gemini bug)', async () => {
  const dir = mkTempDir();
  const scriptPath = writeEchoExecutor(dir);
  const root = mkTempDir();
  writeRunnerConfigFixture(root, {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    executors: {
      agy: { kind: 'agent', command: process.execPath, provider: 'agy', args: [scriptPath, '--model', '{model}', '{prompt}'], allowCrossProvider: true, providerModel: 'gemini' },
    },
    modelPolicies: {
      claude: { standard: 'sonnet' },
      gemini: { standard: 'gemini-pro' },
    },
    timeoutMs: 5000,
  });
  const result = await executeExecutorCli('agy', { prompt: 'classify this', repoRoot: root, tier: 'standard' });
  assert.equal(result.mechanism, 'out-of-process');
  assert.equal(result.provider, 'agy');
  assert.equal(result.model, 'gemini-pro');
  const payload = JSON.parse(result.stdout);
  assert.deepEqual(payload.args, ['--model', 'gemini-pro', 'classify this']);
});

test('executeExecutorCli falls back to the global executor when the executorId is not in cfg.executors at all — never throws', async () => {
  const dir = mkTempDir();
  const scriptPath = writeEchoExecutor(dir);
  const root = mkTempDir();
  writeRunnerConfigFixture(root, {
    executor: { command: process.execPath, args: [scriptPath, '{prompt}'] },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const result = await executeExecutorCli('submit-assist-classify', { prompt: 'classify this', repoRoot: root });
  assert.equal(result.mechanism, 'out-of-process');
  assert.equal(result.provider, process.execPath);
  assert.equal(result.model, 'sonnet');
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.args[0], 'classify this');
});

test('executeExecutorCli honors a caller-supplied model override over both the executor\'s own model and the computed modelForTier default', async () => {
  const dir = mkTempDir();
  const scriptPath = writeEchoExecutor(dir);
  const root = mkTempDir();
  writeRunnerConfigFixture(root, {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    executors: { 'submit-assist-classify': { kind: 'agent', command: process.execPath, provider: 'agy', args: [scriptPath, '{model}:{prompt}'], tier: 'light', model: 'flash-3.5', allowCrossProvider: true } },
    models: { light: 'flash-3.5', standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const result = await executeExecutorCli('submit-assist-classify', { prompt: 'classify this', repoRoot: root, model: 'opus' });
  assert.equal(result.model, 'opus');
  const payload = JSON.parse(result.stdout);
  assert.deepEqual(payload.args, ['opus:classify this']);
});

test('executeExecutorCli honors a caller-supplied tier override, feeding it into modelForTier when no model is also supplied', async () => {
  const dir = mkTempDir();
  const scriptPath = writeEchoExecutor(dir);
  const root = mkTempDir();
  writeRunnerConfigFixture(root, {
    executor: { command: process.execPath, args: [scriptPath, '{model}:{prompt}'] },
    models: { light: 'flash-3.5', standard: 'sonnet' },
    timeoutMs: 5000,
  });
  // 'light', deliberately NOT `DEFAULTS.tier` ('standard', work.mjs) — a
  // tier equal to the default would pass even with no override plumbing
  // at all (the pre-existing `executor?.tier ?? DEFAULTS.tier` fallback
  // already lands on 'standard' with no executor match), so it would not
  // actually prove the override path works.
  const result = await executeExecutorCli('no-such-executor', { prompt: 'x', repoRoot: root, tier: 'light' });
  assert.equal(result.model, 'flash-3.5');
  const payload = JSON.parse(result.stdout);
  assert.deepEqual(payload.args, ['flash-3.5:x']);
});

test('the "execute" CLI entry point honors --model, overriding the computed default', () => {
  const { repoRoot } = mkTempGitRepo();
  const dir = mkTempDir();
  const scriptPath = writeEchoExecutor(dir);
  writeRunnerConfigFixture(repoRoot, { executor: { command: process.execPath, args: [scriptPath, '{model}', '{prompt}'] }, models: { standard: 'sonnet' }, timeoutMs: 5000 });
  const dispatchPath = path.resolve('src/runner/dispatch.mjs');
  const result = spawnSync(
    process.execPath,
    [dispatchPath, 'execute', 'no-such-executor-configured', '--prompt', 'hello', '--model', 'a-specific-override-model'],
    { encoding: 'utf8', cwd: repoRoot },
  );
  assert.equal(result.status, 0, result.stderr);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.model, 'a-specific-override-model');
  const payload = JSON.parse(parsed.stdout);
  assert.equal(payload.args[0], 'a-specific-override-model');
});

test('the "execute" CLI entry point honors --tier, changing which configured model resolves', () => {
  const { repoRoot } = mkTempGitRepo();
  const dir = mkTempDir();
  const scriptPath = writeEchoExecutor(dir);
  writeRunnerConfigFixture(repoRoot, {
    executor: { command: process.execPath, args: [scriptPath, '{model}', '{prompt}'] },
    modelPolicies: { claude: { lightweight: 'haiku', standard: 'sonnet' } },
    timeoutMs: 5000,
  });
  // tsk-5tm-5 D9: the flat cfg.models map was replaced by cfg.modelPolicies
  // -- 'light' work-tier maps to the default provider's 'lightweight'
  // policy tier (DEFAULT_TIER_TO_POLICY, dispatch.mjs) -- 'haiku' here,
  // named explicitly in the fixture above rather than read back from it,
  // since this test now owns its own isolated config.
  const dispatchPath = path.resolve('src/runner/dispatch.mjs');
  const result = spawnSync(
    process.execPath,
    [dispatchPath, 'execute', 'no-such-executor-configured', '--prompt', 'hello', '--tier', 'light'],
    { encoding: 'utf8', cwd: repoRoot },
  );
  assert.equal(result.status, 0, result.stderr);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.model, 'haiku');
});

test('the "execute" CLI entry point honors --repo-root, decoupling spawn cwd from config root', () => {
  const { repoRoot } = mkTempGitRepo();
  const worktreeDir = mkTempDir();
  const scriptPath = writeEchoExecutor(worktreeDir);
  writeRunnerConfigFixture(repoRoot, {
    executor: { command: process.execPath, args: [scriptPath, '{prompt}'] },
    timeoutMs: 5000,
  });
  const dispatchPath = path.resolve('src/runner/dispatch.mjs');
  const result = spawnSync(
    process.execPath,
    [
      dispatchPath,
      'execute',
      'no-such-executor-configured',
      '--prompt',
      'hello',
      '--cwd',
      worktreeDir,
      '--repo-root',
      repoRoot,
    ],
    { encoding: 'utf8', cwd: process.cwd() },
  );
  assert.equal(result.status, 0, result.stderr);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.mechanism, 'out-of-process');
  const payload = JSON.parse(parsed.stdout);
  assert.equal(fs.realpathSync(payload.cwd), fs.realpathSync(worktreeDir));
});

// --- tsk-5tm-3 D5: `executeExecutorCli` / `execute <executorId>` — the
// self-execute counterpart to `resolve` above, matching marketing-cockpit's
// `run_task()`: self-execute every adapter-resolvable case via
// EXECUTOR_ADAPTERS, hand back {mechanism,agentType,prompt} only for the
// one case dispatch (a passive CLI) cannot do itself (native, live
// session) -------------------------------------------------------------

test('executeExecutorCli rejects with a usage RunnerConfigError when both executorId and --for are missing', async () => {
  await assert.rejects(() => executeExecutorCli(undefined, { repoRoot: mkTempDir() }), RunnerConfigError);
  await assert.rejects(() => executeExecutorCli('', { repoRoot: mkTempDir() }), RunnerConfigError);
});

test('executeExecutorCli hands back {mechanism:"in-process",agentType,prompt} for a kind:"task" executor when the caller declares live Task access — self-executes nothing, since dispatch has no Task tool of its own to call', async () => {
  const root = mkTempDir();
  writeRunnerConfigFixture(root, {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    executors: { 'my-agent-executor': { kind: 'agent', agentType: 'code-simplifier' } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const result = await executeExecutorCli('my-agent-executor', { repoRoot: root, prompt: 'do the thing', hasLiveTaskAccess: true });
  assert.deepEqual(result, { mechanism: 'in-process', agentType: 'code-simplifier', prompt: 'do the thing' });
});

test('executeExecutorCli falls to out-of-process and self-executes (never hands back) for a kind:"task" executor with no live Task access — the safe default', async () => {
  const dir = mkTempDir();
  const scriptPath = writeEchoExecutor(dir);
  const root = mkTempDir();
  writeRunnerConfigFixture(root, {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    executors: { 'my-agent-executor': { kind: 'agent', command: process.execPath, args: [scriptPath, '{prompt}'], allowCrossProvider: true } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const result = await executeExecutorCli('my-agent-executor', { repoRoot: root, prompt: 'hello' });
  assert.equal(result.mechanism, 'out-of-process');
  assert.equal(result.status, 0);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.args[0], 'hello');
});

test('executeExecutorCli self-executes a kind:"cli" executor via EXECUTOR_ADAPTERS and returns the real result — never the bare {command,args} shape `resolve` hands back for the caller to run itself', async () => {
  const dir = mkTempDir();
  const scriptPath = writeEchoExecutor(dir);
  const root = mkTempDir();
  writeRunnerConfigFixture(root, {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    executors: { 'submit-assist-classify': { kind: 'agent', command: process.execPath, args: [scriptPath, '{prompt}'], allowCrossProvider: true } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const result = await executeExecutorCli('submit-assist-classify', { repoRoot: root, prompt: 'classify this' });
  assert.equal(result.mechanism, 'out-of-process');
  assert.equal(result.status, 0);
  assert.equal(result.signal, null);
  assert.equal(result.tier, 'standard');
  assert.equal(result.model, 'sonnet');
  assert.equal(result.provider, process.execPath);
  assert.equal(result.command, process.execPath);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.args[0], 'classify this');
  // No bare {command,args} shape leaking through -- this is a real result.
  assert.equal(result.args, undefined);
});

test('executeExecutorCli prints a "fgos: dispatch ..." chokepoint line to stderr for the in-process branch, naming capability/executor/via/agentType', async () => {
  const root = mkTempDir();
  writeRunnerConfigFixture(root, {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    capabilities: { review: {} },
    executors: { 'my-agent-executor': { kind: 'agent', agentType: 'code-simplifier', for: ['review'] } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const original = process.stderr.write.bind(process.stderr);
  let captured = '';
  process.stderr.write = (chunk) => { captured += chunk; return true; };
  try {
    await executeExecutorCli('my-agent-executor', { repoRoot: root, prompt: 'do the thing', hasLiveTaskAccess: true });
  } finally {
    process.stderr.write = original;
  }
  assert.match(captured, /fgos: dispatch capability=review executor=my-agent-executor via=in-process agentType=code-simplifier provider=n\/a model=n\/a tier=n\/a/);
});

test('executeExecutorCli prints a "fgos: dispatch ..." chokepoint line to stderr for the out-of-process (real spawn) branch, naming capability/executor/via/provider/model/tier', async () => {
  const dir = mkTempDir();
  const scriptPath = writeEchoExecutor(dir);
  const root = mkTempDir();
  writeRunnerConfigFixture(root, {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    capabilities: { classification: {} },
    executors: { 'submit-assist-classify': { kind: 'agent', command: process.execPath, args: [scriptPath, '{prompt}'], allowCrossProvider: true, for: ['classification'] } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const original = process.stderr.write.bind(process.stderr);
  let captured = '';
  process.stderr.write = (chunk) => { captured += chunk; return true; };
  try {
    await executeExecutorCli('submit-assist-classify', { repoRoot: root, prompt: 'classify this' });
  } finally {
    process.stderr.write = original;
  }
  assert.match(captured, new RegExp(`fgos: dispatch capability=classification executor=submit-assist-classify via=cli-spawn provider=${process.execPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} model=sonnet tier=standard`));
});

test('executeExecutorCli resolves purpose-based (--for) the same way a positional executorId does, plus the resolved executorId, whether the result is self-executed or handed back', async () => {
  const dir = mkTempDir();
  const scriptPath = writeEchoExecutor(dir);
  const root = mkTempDir();
  writeRunnerConfigFixture(root, {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    capabilities: { judge: {} },
    executors: { 'judge-decompose': { kind: 'agent', for: ['judge'], command: process.execPath, args: [scriptPath, '{prompt}'], allowCrossProvider: true } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const byPurpose = await executeExecutorCli(undefined, { repoRoot: root, for: 'judge', prompt: 'p' });
  const byName = await executeExecutorCli('judge-decompose', { repoRoot: root, prompt: 'p' });
  assert.equal(byPurpose.executorId, 'judge-decompose');
  assert.equal(byPurpose.status, 0);
  assert.equal(byName.executorId, undefined);
});

test('executeExecutorCli returns outcome:"unsignaled" with headBefore and headAfter when stdout lacks [DONE] or [BLOCKED]', async () => {
  const dir = mkTempDir();
  const scriptPath = writeEchoExecutor(dir);
  const root = mkTempDir();
  writeRunnerConfigFixture(root, {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    executors: { 'test-executor': { kind: 'agent', command: process.execPath, args: [scriptPath, '{prompt}'], allowCrossProvider: true } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const result = await executeExecutorCli('test-executor', { repoRoot: root, cwd: process.cwd(), prompt: 'test' });
  assert.equal(result.mechanism, 'out-of-process');
  assert.equal(result.outcome, 'unsignaled');
  assert.equal(typeof result.headBefore, 'string');
  assert.equal(typeof result.headAfter, 'string');
});

test('executeExecutorCli omits outcome and head shas when stdout contains [DONE] or [BLOCKED]', async () => {
  const dir = mkTempDir();
  const scriptDonePath = path.join(dir, 'done-executor.mjs');
  fs.writeFileSync(scriptDonePath, 'process.stdout.write("task complete [DONE]\\n"); process.exit(0);');
  const scriptBlockedPath = path.join(dir, 'blocked-executor.mjs');
  fs.writeFileSync(scriptBlockedPath, 'process.stdout.write("task stuck [BLOCKED]\\n"); process.exit(0);');

  const root = mkTempDir();
  writeRunnerConfigFixture(root, {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    executors: {
      'done-executor': { kind: 'agent', command: process.execPath, args: [scriptDonePath, '{prompt}'], allowCrossProvider: true },
      'blocked-executor': { kind: 'agent', command: process.execPath, args: [scriptBlockedPath, '{prompt}'], allowCrossProvider: true },
    },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });

  const resDone = await executeExecutorCli('done-executor', { repoRoot: root, cwd: process.cwd(), prompt: 'p' });
  assert.equal(resDone.outcome, undefined);
  assert.equal(resDone.headBefore, undefined);
  assert.equal(resDone.headAfter, undefined);

  const resBlocked = await executeExecutorCli('blocked-executor', { repoRoot: root, cwd: process.cwd(), prompt: 'p' });
  assert.equal(resBlocked.outcome, undefined);
  assert.equal(resBlocked.headBefore, undefined);
  assert.equal(resBlocked.headAfter, undefined);
});

test('executeExecutorCli includes verifiedSha on [DONE] when cwd is a git repo, and omits verifiedSha on [BLOCKED]', async () => {
  const dir = mkTempDir();
  const scriptDonePath = path.join(dir, 'done-executor.mjs');
  fs.writeFileSync(scriptDonePath, 'process.stdout.write("task complete [DONE]\\n"); process.exit(0);');
  const scriptBlockedPath = path.join(dir, 'blocked-executor.mjs');
  fs.writeFileSync(scriptBlockedPath, 'process.stdout.write("task stuck [BLOCKED]\\n"); process.exit(0);');

  const { repoRoot: gitRepo, headCommit } = mkTempGitRepo();
  writeRunnerConfigFixture(gitRepo, {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    executors: {
      'done-executor': { kind: 'agent', command: process.execPath, args: [scriptDonePath, '{prompt}'], allowCrossProvider: true },
      'blocked-executor': { kind: 'agent', command: process.execPath, args: [scriptBlockedPath, '{prompt}'], allowCrossProvider: true },
    },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });

  const resDone = await executeExecutorCli('done-executor', { repoRoot: gitRepo, cwd: gitRepo, prompt: 'p' });
  assert.equal(resDone.verifiedSha, headCommit);

  const resBlocked = await executeExecutorCli('blocked-executor', { repoRoot: gitRepo, cwd: gitRepo, prompt: 'p' });
  assert.equal(resBlocked.verifiedSha, undefined);
});

test('executeExecutorCli returns outcome:"unsignaled" when [DONE] or [BLOCKED] appears only inside backtick-quoted text', async () => {
  const dir = mkTempDir();
  const scriptQuotedPath = path.join(dir, 'quoted-executor.mjs');
  fs.writeFileSync(
    scriptQuotedPath,
    'process.stdout.write("implemented the `[DONE]` and `[BLOCKED]` token scan\\n"); process.exit(0);',
  );
  const scriptQuotedAndDonePath = path.join(dir, 'quoted-and-done-executor.mjs');
  fs.writeFileSync(
    scriptQuotedAndDonePath,
    'process.stdout.write("implemented `[DONE]` scan\\n\\n[DONE]\\n"); process.exit(0);',
  );

  const root = mkTempDir();
  writeRunnerConfigFixture(root, {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    executors: {
      'quoted-executor': { kind: 'agent', command: process.execPath, args: [scriptQuotedPath, '{prompt}'], allowCrossProvider: true },
      'quoted-and-done-executor': { kind: 'agent', command: process.execPath, args: [scriptQuotedAndDonePath, '{prompt}'], allowCrossProvider: true },
    },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });

  const resQuoted = await executeExecutorCli('quoted-executor', { repoRoot: root, cwd: process.cwd(), prompt: 'p' });
  assert.equal(resQuoted.outcome, 'unsignaled');
  assert.equal(typeof resQuoted.headBefore, 'string');
  assert.equal(typeof resQuoted.headAfter, 'string');

  const resQuotedAndDone = await executeExecutorCli('quoted-and-done-executor', { repoRoot: root, cwd: process.cwd(), prompt: 'p' });
  assert.equal(resQuotedAndDone.outcome, undefined);
});

test('executeExecutorCli throws when no executor is registered for the given purpose — nothing left to execute', async () => {
  const root = mkTempDir();
  writeRunnerConfigFixture(root, {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  await assert.rejects(() => executeExecutorCli(undefined, { repoRoot: root, for: 'judge', prompt: 'x' }), RunnerConfigError);
});

test('executeExecutorCli propagates resolveExecutorConfig\'s own RunnerConfigError for a kind:"cli" executor resolving cross-provider with no allowCrossProvider', async () => {
  const dir = mkTempDir();
  const scriptPath = writeEchoExecutor(dir);
  const root = mkTempDir();
  writeRunnerConfigFixture(root, {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    executors: { 'submit-assist-classify': { kind: 'agent', command: scriptPath, args: ['{prompt}'] } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  await assert.rejects(() => executeExecutorCli('submit-assist-classify', { repoRoot: root, prompt: 'x' }), RunnerConfigError);
});

test('executeExecutorCli refuses a concurrent dispatch for the same cwd with DispatchError(dispatch-in-flight) (tsk-64hk)', async () => {
  const { repoRoot } = mkTempGitRepo();
  const dir = mkTempDir();
  const scriptPath = writeSlowExecutor(dir, 300);
  writeRunnerConfigFixture(repoRoot, {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    executors: { 'slow-executor': { kind: 'agent', command: process.execPath, args: [scriptPath, '{prompt}'], allowCrossProvider: true } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });

  const testCwd = repoRoot;

  // Start first dispatch
  const firstPromise = executeExecutorCli('slow-executor', { repoRoot, cwd: testCwd, prompt: 'first' });

  // Give first dispatch a brief moment to acquire the lock
  await new Promise((r) => setTimeout(r, 50));

  // Second dispatch for the SAME cwd must be refused with dispatch-in-flight
  let caughtError = null;
  try {
    await executeExecutorCli('slow-executor', { repoRoot, cwd: testCwd, prompt: 'second' });
  } catch (err) {
    caughtError = err;
  }

  assert.ok(caughtError instanceof DispatchError, 'expected DispatchError');
  assert.equal(caughtError.errorClass, 'dispatch-in-flight');
  assert.ok(caughtError.message.includes('already in flight'));
  assert.equal(caughtError.cwd, testCwd);

  // Wait for first dispatch to finish cleanly
  const firstResult = await firstPromise;
  assert.equal(firstResult.status, 0);

  // Subsequent dispatch for the SAME cwd succeeds now that the lock was released
  const thirdResult = await executeExecutorCli('slow-executor', { repoRoot, cwd: testCwd, prompt: 'third' });
  assert.equal(thirdResult.status, 0);
});

test('executeExecutorCli attaches lostUncommittedPaths and prints stderr warning when out-of-process dispatch reverts uncommitted changes', async () => {
  const dir = mkTempDir();
  const scriptWipePath = path.join(dir, 'wipe-executor.mjs');
  fs.writeFileSync(
    scriptWipePath,
    'import fs from "node:fs";\n' +
    'if (fs.existsSync("plan.md")) fs.unlinkSync("plan.md");\n' +
    'process.stdout.write("[DONE]\\n");\n' +
    'process.exit(0);\n',
  );

  const { repoRoot: gitRepo } = mkTempGitRepo();
  writeRunnerConfigFixture(gitRepo, {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    executors: {
      'wipe-executor': { kind: 'agent', command: process.execPath, args: [scriptWipePath, '{prompt}'], allowCrossProvider: true },
    },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });

  fs.writeFileSync(path.join(gitRepo, 'plan.md'), 'uncommitted plan edit\n');

  let stderrOutput = '';
  const origWrite = process.stderr.write;
  process.stderr.write = (chunk, ...args) => {
    stderrOutput += chunk.toString();
    return origWrite.call(process.stderr, chunk, ...args);
  };

  try {
    const res = await executeExecutorCli('wipe-executor', { repoRoot: gitRepo, cwd: gitRepo, prompt: 'p' });
    assert.deepEqual(res.lostUncommittedPaths, ['plan.md']);
    assert.ok(stderrOutput.includes('uncommitted path(s) lost across out-of-process dispatch: plan.md'));
  } finally {
    process.stderr.write = origWrite;
  }
});

test('executeExecutorCli omits lostUncommittedPaths when dispatch is clean or adapter commits changes', async () => {
  const dir = mkTempDir();
  const scriptCommitPath = path.join(dir, 'commit-executor.mjs');
  fs.writeFileSync(
    scriptCommitPath,
    'import { execFileSync } from "node:child_process";\n' +
    'execFileSync("git", ["add", "plan.md"]);\n' +
    'execFileSync("git", ["commit", "-q", "-m", "worker commit"]);\n' +
    'process.stdout.write("[DONE]\\n");\n' +
    'process.exit(0);\n',
  );

  const { repoRoot: gitRepo } = mkTempGitRepo();
  writeRunnerConfigFixture(gitRepo, {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    executors: {
      'commit-executor': { kind: 'agent', command: process.execPath, args: [scriptCommitPath, '{prompt}'], allowCrossProvider: true },
    },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });

  // Clean cwd case
  const resClean = await executeExecutorCli('commit-executor', { repoRoot: gitRepo, cwd: gitRepo, prompt: 'p' });
  assert.equal(resClean.lostUncommittedPaths, undefined);

  // Dirty file that is committed by the executor case
  fs.writeFileSync(path.join(gitRepo, 'plan.md'), 'uncommitted plan edit\n');
  const resCommit = await executeExecutorCli('commit-executor', { repoRoot: gitRepo, cwd: gitRepo, prompt: 'p' });
  assert.equal(resCommit.lostUncommittedPaths, undefined);
});

test('executeExecutorCli refuses with DispatchError(dispatch-in-flight) when lock file content is corrupt/ambiguous (tsk-64hk)', async () => {
  const { repoRoot, fgosDir } = mkTempGitRepo();
  const dir = mkTempDir();
  const scriptPath = writeEchoExecutor(dir);
  writeRunnerConfigFixture(repoRoot, {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    executors: { 'cli-executor': { kind: 'agent', command: process.execPath, args: [scriptPath, '{prompt}'], allowCrossProvider: true } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });

  const testCwd = repoRoot;
  const { dispatchLockFile } = await import('../../src/runner/main-checkout-lock.mjs');
  const lockPath = path.join(fgosDir, dispatchLockFile(testCwd));
  fs.writeFileSync(lockPath, 'INVALID-JSON-CORRUPT-LOCK');

  let caughtError = null;
  try {
    await executeExecutorCli('cli-executor', { repoRoot, cwd: testCwd, prompt: 'test' });
  } catch (err) {
    caughtError = err;
  }

  assert.ok(caughtError instanceof DispatchError, 'expected DispatchError');
  assert.equal(caughtError.errorClass, 'dispatch-in-flight');
  assert.ok(caughtError.message.includes('ambiguous'));
});


test('the "execute" CLI entry point prints a structured {error,errorClass} JSON line on stdout when dispatch fails, alongside the human-readable message on stderr (dispatch-execute optimization pass)', async () => {
  const { repoRoot, fgosDir } = mkTempGitRepo();
  const dir = mkTempDir();
  const scriptPath = writeEchoExecutor(dir);
  writeRunnerConfigFixture(repoRoot, {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    executors: { 'cli-executor': { kind: 'agent', command: process.execPath, args: [scriptPath, '{prompt}'], allowCrossProvider: true } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const testCwd = repoRoot;
  const { dispatchLockFile } = await import('../../src/runner/main-checkout-lock.mjs');
  const lockPath = path.join(fgosDir, dispatchLockFile(testCwd));
  fs.writeFileSync(lockPath, 'INVALID-JSON-CORRUPT-LOCK');

  const dispatchPath = path.resolve('src/runner/dispatch.mjs');
  const result = spawnSync(
    process.execPath,
    [dispatchPath, 'execute', 'cli-executor', '--prompt', 'x', '--cwd', testCwd],
    { encoding: 'utf8', cwd: repoRoot },
  );
  assert.notEqual(result.status, 0);
  const parsed = JSON.parse(result.stdout.trim());
  assert.equal(parsed.errorClass, 'dispatch-in-flight');
  assert.match(parsed.error, /ambiguous/);
  assert.match(result.stderr, /ambiguous/);
});

test('the "execute" CLI entry point omits errorClass from the structured stdout line for a non-DispatchError failure (RunnerConfigError, e.g.)', () => {
  const dispatchPath = path.resolve('src/runner/dispatch.mjs');
  const result = spawnSync(process.execPath, [dispatchPath, 'execute'], { encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  const parsed = JSON.parse(result.stdout.trim());
  assert.equal(parsed.errorClass, undefined);
  assert.match(parsed.error, /usage: node src\/runner\/dispatch\.mjs execute/);
});

test('the "execute" CLI entry point self-executes a real adapter-resolvable executor and prints the real result as JSON, never bare {command,args}', () => {
  const { repoRoot } = mkTempGitRepo();
  const dir = mkTempDir();
  const scriptPath = writeEchoExecutor(dir);
  writeRunnerConfigFixture(repoRoot, {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    executors: { 'cli-executor': { kind: 'agent', command: process.execPath, args: [scriptPath, '{prompt}'], allowCrossProvider: true } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const dispatchPath = path.resolve('src/runner/dispatch.mjs');
  const result = spawnSync(process.execPath, [dispatchPath, 'execute', 'cli-executor', '--prompt', 'hello-from-cli'], {
    encoding: 'utf8',
    cwd: repoRoot,
  });
  assert.equal(result.status, 0, result.stderr);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.mechanism, 'out-of-process');
  assert.equal(parsed.status, 0);
  const payload = JSON.parse(parsed.stdout);
  assert.equal(payload.args[0], 'hello-from-cli');
});

test('the "execute" CLI entry point accepts --prompt-file, overrides --prompt when both given, and structured-errors on bad file path', () => {
  const { repoRoot } = mkTempGitRepo();
  const dir = mkTempDir();
  const scriptPath = writeEchoExecutor(dir);
  writeRunnerConfigFixture(repoRoot, {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    executors: { 'cli-executor': { kind: 'agent', command: process.execPath, args: [scriptPath, '{prompt}'], allowCrossProvider: true } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const dispatchPath = path.resolve('src/runner/dispatch.mjs');
  const promptFilePath = path.join(dir, 'prompt.txt');
  fs.writeFileSync(promptFilePath, 'content-from-file');

  // --prompt-file alone
  const res1 = spawnSync(process.execPath, [dispatchPath, 'execute', 'cli-executor', '--prompt-file', promptFilePath], {
    encoding: 'utf8',
    cwd: repoRoot,
  });
  assert.equal(res1.status, 0, res1.stderr);
  const parsed1 = JSON.parse(res1.stdout);
  assert.equal(parsed1.status, 0);
  const payload1 = JSON.parse(parsed1.stdout);
  assert.equal(payload1.args[0], 'content-from-file');

  // --prompt-file overriding --prompt when both given
  const res2 = spawnSync(
    process.execPath,
    [dispatchPath, 'execute', 'cli-executor', '--prompt', 'inline-prompt', '--prompt-file', promptFilePath],
    {
      encoding: 'utf8',
      cwd: repoRoot,
    },
  );
  assert.equal(res2.status, 0, res2.stderr);
  const parsed2 = JSON.parse(res2.stdout);
  assert.equal(parsed2.status, 0);
  const payload2 = JSON.parse(parsed2.stdout);
  assert.equal(payload2.args[0], 'content-from-file');

  // nonexistent --prompt-file path producing structured error JSON on stdout with exit code 1
  const badFilePath = path.join(dir, 'nonexistent-prompt-file.txt');
  const res3 = spawnSync(process.execPath, [dispatchPath, 'execute', 'cli-executor', '--prompt-file', badFilePath], {
    encoding: 'utf8',
    cwd: repoRoot,
  });
  assert.equal(res3.status, 1);
  const parsed3 = JSON.parse(res3.stdout.trim());
  assert.equal(parsed3.errorClass, undefined);
  assert.match(parsed3.error, /ENOENT|no such file or directory/i);
});

test('the "execute" CLI entry point hands back {mechanism:"in-process",...} for a live-task-access native executor, never spawning anything', () => {
  const { repoRoot } = mkTempGitRepo();
  writeRunnerConfigFixture(repoRoot, {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    executors: { 'native-executor': { kind: 'agent', agentType: 'code-simplifier' } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const dispatchPath = path.resolve('src/runner/dispatch.mjs');
  const result = spawnSync(
    process.execPath,
    [dispatchPath, 'execute', 'native-executor', '--prompt', 'do it', '--has-live-task-access'],
    { encoding: 'utf8', cwd: repoRoot },
  );
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), { mechanism: 'in-process', agentType: 'code-simplifier', prompt: 'do it' });
});

test('the "execute" CLI entry point exits non-zero with a usage message when executorId is omitted', () => {
  const dispatchPath = path.resolve('src/runner/dispatch.mjs');
  const result = spawnSync(process.execPath, [dispatchPath, 'execute'], { encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /usage: node src\/runner\/dispatch\.mjs execute/);
});

// --- executors.<id>.carries (D15, tsk-5td; first real consumer tsk-2ie5/
// tsk-2c1) — closed enum at config-load, plus a real pre-dispatch gate on
// the ACTUAL content class a caller declares it's sending ------------------

test('EXECUTOR_CARRIES is exactly the two D15-locked values, never a free string vocabulary', () => {
  assert.deepEqual(EXECUTOR_CARRIES, ['user-text', 'repo-content']);
});

test('loadRunnerConfig accepts a "executors.<id>" entry with a valid carries value', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'carries-ok.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      capabilities: { judge: {} },
      executors: { gather: { kind: 'agent', command: 'agy', args: ['{prompt}'], for: ['judge'], carries: 'repo-content', allowCrossProvider: true } },
      models: { standard: 'sonnet' },
      timeoutMs: 1000,
    }),
  );
  assert.doesNotThrow(() => loadRunnerConfig(configPath));
});

// --- tsk-34n: the legacy "capability" (singular) field on a executor is no
// longer read or validated at all -- "for" is the only recognized field ----

test('loadRunnerConfig ignores a "executors.<id>" entry\'s stray "capability" field entirely -- no longer validated against "capabilities", never throws', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'stray-capability.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      executors: { gitnexus: { kind: 'tool', capability: 'not-declared-anywhere', invocations: [{ via: 'mcp', command: 'mcp:gitnexus' }] } },
      models: { standard: 'sonnet' },
      timeoutMs: 1000,
    }),
  );
  assert.doesNotThrow(() => loadRunnerConfig(configPath));
});

test('loadRunnerConfig accepts a "executors.<id>" entry naming neither "for" nor the legacy "capability" (a plain dispatch executor)', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'no-capability.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      executors: { agy: { kind: 'agent', command: 'agy', args: ['{prompt}'], allowCrossProvider: true } },
      models: { standard: 'sonnet' },
      timeoutMs: 1000,
    }),
  );
  assert.doesNotThrow(() => loadRunnerConfig(configPath));
});

// --- tsk-45f piece 3: an mcp invocation's optional "tools" capability->tool map --

test('loadRunnerConfig accepts an mcp invocation\'s "tools" map when every key is declared in "capabilities"', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'tools-map-ok.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      capabilities: { 'impact-analysis': {} },
      executors: {
        gitnexus: {
          kind: 'tool',
          for: ['impact-analysis'],
          invocations: [{ via: 'mcp', command: 'mcp:gitnexus', tools: { 'impact-analysis': 'mcp__gitnexus__impact' } }],
        },
      },
      models: { standard: 'sonnet' },
      timeoutMs: 1000,
    }),
  );
  assert.doesNotThrow(() => loadRunnerConfig(configPath));
});

test('loadRunnerConfig rejects an mcp invocation\'s "tools" map whose key is not declared in "capabilities"', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'tools-map-bad-key.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      executors: {
        gitnexus: {
          kind: 'tool',
          invocations: [{ via: 'mcp', command: 'mcp:gitnexus', tools: { 'not-declared-anywhere': 'mcp__gitnexus__impact' } }],
        },
      },
      models: { standard: 'sonnet' },
      timeoutMs: 1000,
    }),
  );
  assert.throws(() => loadRunnerConfig(configPath), RunnerConfigError);
});

test('loadRunnerConfig rejects an mcp invocation\'s "tools" map whose value is not a non-empty string', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'tools-map-bad-value.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      capabilities: { 'impact-analysis': {} },
      executors: {
        gitnexus: {
          kind: 'tool',
          invocations: [{ via: 'mcp', command: 'mcp:gitnexus', tools: { 'impact-analysis': '' } }],
        },
      },
      models: { standard: 'sonnet' },
      timeoutMs: 1000,
    }),
  );
  assert.throws(() => loadRunnerConfig(configPath), RunnerConfigError);
});

test('loadRunnerConfig accepts an mcp invocation naming no "tools" at all -- purely additive field', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'no-tools-map.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      executors: { gitnexus: { kind: 'tool', invocations: [{ via: 'mcp', command: 'mcp:gitnexus' }] } },
      models: { standard: 'sonnet' },
      timeoutMs: 1000,
    }),
  );
  assert.doesNotThrow(() => loadRunnerConfig(configPath));
});

test('loadRunnerConfig rejects a "executors.<id>" entry whose carries is not one of EXECUTOR_CARRIES', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'bad-carries.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      executors: { gather: { kind: 'agent', command: 'agy', args: ['{prompt}'], carries: 'secrets' } },
      models: { standard: 'sonnet' },
      timeoutMs: 1000,
    }),
  );
  assert.throws(() => loadRunnerConfig(configPath), RunnerConfigError);
});

function carriesCfg(carries) {
  return {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    executors: { gather: { kind: 'agent', command: 'agy', args: ['{prompt}'], for: ['judge'], carries, allowCrossProvider: true } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
}

test('resolveExecutorCommand throws when a executor declares carries but the caller declares no contentCarries at all (fail closed, never silently allow)', () => {
  const cfg = carriesCfg('user-text');
  assert.throws(
    () => resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'gather' }),
    RunnerConfigError,
  );
});

test('resolveExecutorCommand throws when contentCarries is not one of EXECUTOR_CARRIES', () => {
  const cfg = carriesCfg('repo-content');
  assert.throws(
    () => resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'gather', contentCarries: 'nonsense' }),
    RunnerConfigError,
  );
});

test('resolveExecutorCommand refuses a "carries: user-text" executor handed repo-content — refused before spawn (D15 verify item 8)', () => {
  const cfg = carriesCfg('user-text');
  assert.throws(
    () => resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'gather', contentCarries: 'repo-content' }),
    RunnerConfigError,
  );
});

test('resolveExecutorCommand accepts a "carries: user-text" executor handed user-text (exact match)', () => {
  const cfg = carriesCfg('user-text');
  assert.doesNotThrow(() =>
    resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'gather', contentCarries: 'user-text' }),
  );
});

test('resolveExecutorCommand accepts a "carries: repo-content" executor handed EITHER content class — the wider permission covers both', () => {
  const cfg = carriesCfg('repo-content');
  assert.doesNotThrow(() =>
    resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'gather', contentCarries: 'user-text' }),
  );
  assert.doesNotThrow(() =>
    resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'gather', contentCarries: 'repo-content' }),
  );
});

test('resolveExecutorCommand never triggers the carries gate for a executor that declares no carries at all — byte-identical to every pre-D15 executor', () => {
  const cfg = {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    executors: { 'submit-assist-classify': { kind: 'agent', command: 'agy', args: ['{prompt}'], allowCrossProvider: true } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
  assert.doesNotThrow(() =>
    resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'submit-assist-classify' }),
  );
});

// --- resolveExecutorIdForPurpose (D5/D6, tsk-1o7; first real consumer
// tsk-2ie5/tsk-2c1) — purpose-based binding, never by name ------------------

test('resolveExecutorIdForPurpose finds the executor whose own "for" matches the purpose, regardless of the executor id\'s own name', () => {
  // resolveExecutorIdForPurpose is a pure string-match over `for` -- it never
  // validates against EXECUTOR_PURPOSES itself (that enum check only runs at
  // config-load time, validateExecutorEntryShape) -- so a synthetic purpose value
  // ("review") proves the real invariant (match by field, not by id name)
  // without reviving "gather" as if it were still a live purpose (tsk-5tm-2
  // D6: retired, EXECUTOR_PURPOSES is down to its one real value, "judge").
  const cfg = {
    executors: {
      'totally-unrelated-name': { kind: 'agent', for: ['review'], command: 'agy' },
      'judge-decompose': { kind: 'agent', for: ['judge'] },
    },
  };
  assert.equal(resolveExecutorIdForPurpose(cfg, 'review'), 'totally-unrelated-name');
});

test('resolveExecutorIdForPurpose finds the executor via a multi-value "for" array (D15, tsk-in1-4) — one executor serving several purposes at once', () => {
  const cfg = { executors: { multi: { kind: 'agent', for: ['review', 'judge'], command: 'agy' } } };
  assert.equal(resolveExecutorIdForPurpose(cfg, 'review'), 'multi');
  assert.equal(resolveExecutorIdForPurpose(cfg, 'judge'), 'multi');
});

test('resolveExecutorIdForPurpose returns null when no executor declares that purpose — a legitimate state, never thrown', () => {
  const cfg = { executors: { 'judge-decompose': { kind: 'agent', for: ['judge'] } } };
  assert.equal(resolveExecutorIdForPurpose(cfg, 'no-such-purpose-configured'), null);
});

test('resolveExecutorIdForPurpose returns null against an empty/missing executors block', () => {
  assert.equal(resolveExecutorIdForPurpose({}, 'no-such-purpose-configured'), null);
  assert.equal(resolveExecutorIdForPurpose({ executors: {} }, 'no-such-purpose-configured'), null);
});

// --- resolveExecutorAndOverrides (D1-D4, docs/history/capability-capacity-
// remodel/CONTEXT.md) -- the shared resolver every real cfg.executors[id]
// lookup in this file now goes through: literal key first, then
// capabilities.<name>.prefer (D5, supersedes D2's "for"-symmetry
// requirement), then the plain "for" scan, then unconfigured ------------

test('resolveExecutorAndOverrides resolves a literal executorId directly, unchanged from pre-this-item behavior -- the deep-customization escape hatch', () => {
  const cfg = { executors: { agy: { kind: 'agent', command: 'agy' } } };
  const result = resolveExecutorAndOverrides(cfg, 'agy');
  assert.equal(result.executorId, 'agy');
  assert.equal(result.executor, cfg.executors.agy);
  assert.equal(result.overrides, undefined);
  assert.equal(result.configured, true);
});

test('resolveExecutorAndOverrides resolves via capabilities.<name>.prefer when the preferred executor declares a matching "for"', () => {
  const cfg = {
    executors: { agy: { kind: 'agent', command: 'agy', for: ['fgos-coding-implement'] } },
    capabilities: { 'fgos-coding-implement': { prefer: 'agy' } },
  };
  const result = resolveExecutorAndOverrides(cfg, 'fgos-coding-implement');
  assert.equal(result.executorId, 'agy');
  assert.equal(result.executor, cfg.executors.agy);
  assert.equal(result.configured, true);
});

test('resolveExecutorAndOverrides carries capabilities.<name>.overrides through, unapplied, for the caller to merge itself', () => {
  const cfg = {
    executors: { agy: { kind: 'agent', command: 'agy', for: ['fgos-coding-implement'] } },
    capabilities: { 'fgos-coding-implement': { prefer: 'agy', overrides: { rigorOverrides: { standard: 'creative' } } } },
  };
  const result = resolveExecutorAndOverrides(cfg, 'fgos-coding-implement');
  assert.deepEqual(result.overrides, { rigorOverrides: { standard: 'creative' } });
});

test('resolveExecutorAndOverrides resolves via "prefer" even when the preferred executor declares no "for" at all (D5 -- supersedes D2\'s own symmetry requirement)', () => {
  const cfg = {
    executors: { agy: { kind: 'agent', command: 'agy' } }, // no "for" at all
    capabilities: { 'fgos-coding-implement': { prefer: 'agy' } },
  };
  const result = resolveExecutorAndOverrides(cfg, 'fgos-coding-implement');
  assert.equal(result.executorId, 'agy');
  assert.equal(result.executor, cfg.executors.agy);
  assert.equal(result.configured, true);
});

test('resolveExecutorAndOverrides throws when "prefer" names a executor id that does not exist at all', () => {
  const cfg = { capabilities: { 'fgos-coding-implement': { prefer: 'no-such-executor' } } };
  assert.throws(() => resolveExecutorAndOverrides(cfg, 'fgos-coding-implement'), RunnerConfigError);
});

test('resolveExecutorAndOverrides falls back to the plain "for" scan when no "prefer" is set -- unchanged resolveExecutorIdForPurpose behavior, wrapped', () => {
  const cfg = { executors: { 'totally-unrelated-name': { kind: 'agent', command: 'agy', for: ['review'] } } };
  const result = resolveExecutorAndOverrides(cfg, 'review');
  assert.equal(result.executorId, 'totally-unrelated-name');
  assert.equal(result.overrides, undefined);
});

test('resolveExecutorAndOverrides returns configured:false, executorId:null when nothing resolves -- a legitimate state, never thrown', () => {
  const result = resolveExecutorAndOverrides({}, 'no-such-purpose-or-id');
  assert.equal(result.executorId, null);
  assert.equal(result.configured, false);
});

test('resolveExecutorCommand\'s allowCrossProvider error names the REAL resolved executor id (via prefer), not just the requested purpose -- a self-review fix: the requested purpose is never a real "executors.<id>" key to set the flag on', () => {
  const cfg = {
    executor: { command: 'claude', args: ['{prompt}'] },
    executors: { agy: { kind: 'agent', command: 'agy', args: ['{prompt}'], for: ['fgos-coding-implement'] } }, // no allowCrossProvider
    capabilities: { 'fgos-coding-implement': { prefer: 'agy' } },
    models: { standard: 'sonnet' },
  };
  assert.throws(
    () => resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', executorId: 'fgos-coding-implement' }),
    (err) => {
      assert.match(err.message, /executor "fgos-coding-implement"/);
      assert.match(err.message, /resolved via capabilities\."fgos-coding-implement"\.prefer to executor "agy"/);
      assert.match(err.message, /Set executors\.agy\.allowCrossProvider: true/);
      return true;
    },
  );
});

// --- capabilities.<name>.prefer/overrides shape validation (D2) -----------

test('loadRunnerConfig rejects capabilities.<name>.prefer that is not a non-empty string', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'bad-prefer.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      capabilities: { 'fgos-coding-implement': { prefer: '' } },
      modelPolicies: { claude: { standard: 'sonnet' } },
      timeoutMs: 1000,
    }),
  );
  assert.throws(() => loadRunnerConfig(configPath), RunnerConfigError);
});

test('loadRunnerConfig rejects capabilities.<name>.overrides with a key outside the allowed 4 fields -- command/args/adapter are never override-able', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'bad-overrides-key.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      executors: { agy: { kind: 'agent', command: 'agy', for: ['fgos-coding-implement'] } },
      capabilities: { 'fgos-coding-implement': { prefer: 'agy', overrides: { command: 'not-allowed' } } },
      modelPolicies: { claude: { standard: 'sonnet' } },
      timeoutMs: 1000,
    }),
  );
  assert.throws(() => loadRunnerConfig(configPath), RunnerConfigError);
});

test('loadRunnerConfig rejects capabilities.<name>.overrides.rigorOverrides via the SAME rule a executor\'s own rigorOverrides already uses', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'bad-overrides-rigor.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      executors: { agy: { kind: 'agent', command: 'agy', for: ['fgos-coding-implement'] } },
      capabilities: { 'fgos-coding-implement': { prefer: 'agy', overrides: { rigorOverrides: { standard: 'ultra-mega' } } } },
      modelPolicies: { claude: { standard: 'sonnet' } },
      timeoutMs: 1000,
    }),
  );
  assert.throws(() => loadRunnerConfig(configPath), RunnerConfigError);
});

test('loadRunnerConfig accepts a well-formed capabilities.<name>.prefer/overrides pair', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'good-prefer-overrides.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      executors: { agy: { kind: 'agent', command: 'agy', args: ['{prompt}'], for: ['fgos-coding-implement'] } },
      capabilities: { 'fgos-coding-implement': { description: 'code-implement work', prefer: 'agy', overrides: { rigorOverrides: { standard: 'creative' } } } },
      modelPolicies: { claude: { standard: 'sonnet' } },
      timeoutMs: 1000,
    }),
  );
  assert.doesNotThrow(() => loadRunnerConfig(configPath));
});

test('loadRunnerConfig accepts "prefer" naming a real executor that declares no matching "for" (D5 -- supersedes D2\'s own load-time symmetry check)', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'prefer-no-for.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      executors: { agy: { kind: 'agent' } }, // no "command"/"args"/"for" at all
      capabilities: { 'fgos-coding-implement': { prefer: 'agy' } },
      modelPolicies: { claude: { standard: 'sonnet' } },
      timeoutMs: 1000,
    }),
  );
  assert.doesNotThrow(() => loadRunnerConfig(configPath));
});

test('loadRunnerConfig rejects "prefer" naming an executor id that does not exist at all', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'prefer-missing-executor.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      capabilities: { 'fgos-coding-implement': { prefer: 'no-such-executor' } },
      modelPolicies: { claude: { standard: 'sonnet' } },
      timeoutMs: 1000,
    }),
  );
  assert.throws(() => loadRunnerConfig(configPath), RunnerConfigError);
});

// --- End-to-end: spawnWorker/executeExecutorCli/decideExecutorCli all
// resolve a purpose name via capabilities.<name>.prefer the same way a
// literal executorId already did (D3's own real migration case) ----------

test('spawnWorker resolves model via capabilities.<name>.prefer + overrides -- the exact D4 gap (spawnWorker used to have its own separate lookup, distinct from resolveExecutorConfig)', async () => {
  const dir = mkTempDir();
  const scriptPath = writeEchoExecutor(dir);
  const cfg = {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    executors: {
      agy: { kind: 'agent', command: process.execPath, args: [scriptPath, '{prompt}', '--model', '{model}'], for: ['fgos-coding-implement'], providerModel: 'gemini', allowCrossProvider: true },
    },
    capabilities: { 'fgos-coding-implement': { prefer: 'agy', overrides: { rigorOverrides: { standard: 'lightweight' } } } },
    modelPolicies: { claude: { standard: 'sonnet' }, gemini: { lightweight: 'gemini-flash' } },
    timeoutMs: 5000,
  };

  const result = await spawnWorker(sampleWork({ domain: 'coding' }), cfg, mkTempDir());
  assert.equal(result.model, 'gemini-flash');
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.args[1], '--model');
  assert.equal(payload.args[2], 'gemini-flash');
});

test('executeExecutorCli resolves a purpose-named executorId via capabilities.<name>.prefer, spawning the real preferred executor', async () => {
  const dir = mkTempDir();
  const scriptPath = writeEchoExecutor(dir);
  const root = mkTempDir();
  writeRunnerConfigFixture(root, {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    executors: { agy: { kind: 'agent', command: process.execPath, args: [scriptPath, '{prompt}'], for: ['fgos-coding-implement'], allowCrossProvider: true } },
    capabilities: { 'fgos-coding-implement': { prefer: 'agy' } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const result = await executeExecutorCli('fgos-coding-implement', { repoRoot: root, prompt: 'do the thing' });
  assert.equal(result.mechanism, 'out-of-process');
  assert.equal(result.status, 0);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.args[0], 'do the thing');
});

test('executeExecutorCli applies capabilities.<name>.overrides identically whether the purpose is resolved via --for or named positionally -- both doors share ONE resolveExecutorAndOverrides call, never a second one on the already-resolved id that would silently drop overrides', async () => {
  const dir = mkTempDir();
  const scriptPath = writeEchoExecutor(dir);
  const root = mkTempDir();
  writeRunnerConfigFixture(root, {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    executors: { agy: { kind: 'agent', command: process.execPath, args: [scriptPath, '{model}:{prompt}'], for: ['fgos-coding-implement'], providerModel: 'gemini', allowCrossProvider: true } },
    capabilities: { 'fgos-coding-implement': { prefer: 'agy', overrides: { rigorOverrides: { standard: 'creative' } } } },
    modelPolicies: { claude: { standard: 'sonnet' }, gemini: { standard: 'flash', creative: 'flash-creative' } },
    timeoutMs: 5000,
  });

  const viaFor = await executeExecutorCli(undefined, { repoRoot: root, for: 'fgos-coding-implement', prompt: 'p' });
  assert.equal(viaFor.model, 'flash-creative');

  const viaPositional = await executeExecutorCli('fgos-coding-implement', { repoRoot: root, prompt: 'p' });
  assert.equal(viaPositional.model, 'flash-creative');
});

test('executeExecutorCli honors capabilities.<name>.overrides.tier/model directly -- found by self-review: these two fields validated as legal (validateCapabilitiesShape) but were never actually consulted anywhere until this fix', async () => {
  const dir = mkTempDir();
  const scriptPath = writeEchoExecutor(dir);
  const root = mkTempDir();
  writeRunnerConfigFixture(root, {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    executors: { agy: { kind: 'agent', command: process.execPath, args: [scriptPath, '{model}:{prompt}'], for: ['fgos-coding-implement'], providerModel: 'gemini', allowCrossProvider: true } },
    // Deliberately give agy its own tier/model so the assertions below can
    // only pass if capabilityOverrides genuinely wins -- executor.tier/
    // .model alone would resolve to 'standard'/'agy-standard-model'.
    capabilities: { 'fgos-coding-implement': { prefer: 'agy', overrides: { tier: 'heavy', model: 'agy-override-model' } } },
    modelPolicies: { claude: { standard: 'sonnet' }, gemini: { standard: 'agy-standard-model', critical: 'agy-heavy-model' } },
    timeoutMs: 5000,
  });
  const result = await executeExecutorCli('fgos-coding-implement', { repoRoot: root, prompt: 'p' });
  // overrides.model wins outright (no modelForTier computation at all).
  assert.equal(result.model, 'agy-override-model');
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.args[0], 'agy-override-model:p');
});

test('executeExecutorCli: an explicit caller-supplied --tier/--model always wins over capabilities.<name>.overrides -- overrides are a config default, never allowed to shadow a real caller request', async () => {
  const dir = mkTempDir();
  const scriptPath = writeEchoExecutor(dir);
  const root = mkTempDir();
  writeRunnerConfigFixture(root, {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    executors: { agy: { kind: 'agent', command: process.execPath, args: [scriptPath, '{model}:{prompt}'], for: ['fgos-coding-implement'], allowCrossProvider: true } },
    capabilities: { 'fgos-coding-implement': { prefer: 'agy', overrides: { model: 'should-never-win' } } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const result = await executeExecutorCli('fgos-coding-implement', { repoRoot: root, prompt: 'p', model: 'caller-explicit-model' });
  assert.equal(result.model, 'caller-explicit-model');
});

test('decideExecutorCli resolves a purpose-named executorId via capabilities.<name>.prefer -- "configured" reads true even though no literal executors entry of that name exists', async () => {
  const root = mkTempDir();
  writeRunnerConfigFixture(root, {
    executor: { command: 'claude', args: ['{prompt}'] },
    executors: { agy: { kind: 'agent', command: 'agy', args: ['{prompt}'], for: ['fgos-coding-implement'] } },
    capabilities: { 'fgos-coding-implement': { prefer: 'agy' } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const decided = await decideExecutorCli('fgos-coding-implement', { repoRoot: root, hasLiveTaskAccess: false });
  assert.deepEqual(decided, { mechanism: 'out-of-process', configured: true });
});

// --- executeExecutorCli / decideExecutorCli: purpose-based (--for) binding,
// the mechanism a runtime-composed gather prompt actually resolves through
// since it has no pre-registered executorId to name (tsk-2c1) --------------

test('decideExecutorCli resolves "unavailable" when nothing is registered for the given purpose — the expected default state before any gather executor exists', async () => {
  const root = mkTempDir();
  writeRunnerConfigFixture(root, {
    executor: { command: 'claude', args: ['{prompt}'] },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const decided = await decideExecutorCli(undefined, { repoRoot: root, for: 'judge', hasLiveTaskAccess: true });
  assert.deepEqual(decided, { mechanism: 'unavailable', configured: false });
});

test('decideExecutorCli resolves purpose-based (--for) to the same result a positional executorId would, plus the resolved executorId', async () => {
  const root = mkTempDir();
  writeRunnerConfigFixture(root, {
    executor: { command: 'claude', args: ['{prompt}'] },
    capabilities: { judge: {} },
    executors: { gather: { kind: 'tool', for: ['judge'], command: 'agy', args: ['{prompt}'], allowCrossProvider: true } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const byPurpose = await decideExecutorCli(undefined, { repoRoot: root, for: 'judge', hasLiveTaskAccess: true });
  const byName = await decideExecutorCli('gather', { repoRoot: root, hasLiveTaskAccess: true });
  assert.deepEqual(byPurpose, { mechanism: 'out-of-process', executorId: 'gather', configured: true });
  // Positional-id path stays byte-identical (no executorId field) — every
  // pre-tsk-2c1 caller/test already asserts this exact shape.
  assert.deepEqual(byName, { mechanism: 'out-of-process', configured: true });
});

// --- decideExecutorCli: work-item-shaped lookup (--work, D4/D12(iii),
// tsk-5tm-6) -- the lookup fgos-fanout needs to consult this protocol
// per-candidate before firing an Agent, instead of assuming native
// dispatch unconditionally --------------------------------------------------

test('executorIdForWork is exported and resolves a coding-domain (or no-domain) work item to fgos-coding-implement, the same lookup spawnWorker already applies internally', () => {
  assert.equal(executorIdForWork(sampleWork()), 'fgos-coding-implement');
});

test('executorIdForWork respects stage parameter and work.stage property, and has length 2 (dead role param removed)', () => {
  assert.equal(executorIdForWork.length, 2);
  assert.equal(executorIdForWork(sampleWork(), 'discovery'), 'fgos-coding-discovering');
  assert.equal(executorIdForWork(sampleWork(), 'planning'), 'fgos-coding-planning');
  assert.equal(executorIdForWork({ domain: 'coding', stage: 'exploring' }), 'fgos-coding-exploring');
  assert.equal(executorIdForWork({ domain: 'coding', stage: 'planning' }), 'fgos-coding-planning');
});

test('resolveAgentTypeForTaskSpec implements D32 tie-break scenarios correctly', () => {
  const agentDefs = [
    { name: 'agent-alpha', skills: ['code-review', 'implementation'] },
    { name: 'agent-beta', skills: ['implementation', 'planning'] },
    { name: 'agent-gamma', skills: ['code-review'] },
  ];

  // (a) agent: pin in taskSpec header wins outright, skipping skill matching
  assert.equal(
    resolveAgentTypeForTaskSpec(
      { agent: ['agent-gamma'], 'requires-skill': ['implementation'] },
      agentDefs,
      'agent-alpha',
    ),
    'agent-gamma',
  );

  // (b) no pin, currentAgentType matches requires-skill -> stay with currentAgentType
  assert.equal(
    resolveAgentTypeForTaskSpec(
      { 'requires-skill': ['implementation'] },
      agentDefs,
      'agent-beta',
    ),
    'agent-beta',
  );

  // (c) no pin, currentAgentType doesn't match -> select first matching agent in declaration order
  assert.equal(
    resolveAgentTypeForTaskSpec(
      { 'requires-skill': ['implementation'] },
      agentDefs,
      'agent-gamma',
    ),
    'agent-alpha',
  );
});

test('resolveAgentTypeForTaskSpec refuses (returns null) across all 4 unvalidated/mismatched fail-close sites', () => {
  const agentDefs = [
    { name: 'agent-alpha', skills: ['code-review', 'implementation'] },
    { name: 'agent-beta', skills: ['implementation', 'planning'] },
  ];

  // 1. null/falsy taskSpecHeader -> returns null
  assert.equal(resolveAgentTypeForTaskSpec(null, agentDefs, 'agent-alpha'), null);
  assert.equal(resolveAgentTypeForTaskSpec(undefined, agentDefs, 'agent-alpha'), null);

  // 2. pinned agent not in roster -> returns null (refuses unvalidated pinned name)
  assert.equal(
    resolveAgentTypeForTaskSpec({ agent: ['nonexistent-agent'] }, agentDefs, 'agent-alpha'),
    null,
  );

  // 3. no requires-skill & no pin -> returns null
  assert.equal(resolveAgentTypeForTaskSpec({}, agentDefs, 'agent-alpha'), null);
  assert.equal(resolveAgentTypeForTaskSpec({ 'requires-skill': [] }, agentDefs, 'agent-alpha'), null);
  assert.equal(resolveAgentTypeForTaskSpec({ 'requires-skill': '  ' }, agentDefs, 'agent-alpha'), null);

  // 4. no agent in roster matches required skills -> returns null
  assert.equal(
    resolveAgentTypeForTaskSpec(
      { 'requires-skill': ['nonexistent-skill'] },
      agentDefs,
      'agent-alpha',
    ),
    null,
  );
});

test('decideExecutorCli resolves work-item-based (--work) to the same result a positional executorId would, plus the resolved executorId -- explicit executors.<id> override case', async () => {
  const root = mkTempDir();
  const fgosDir = path.join(root, '.fgos');
  addWork(fgosDir, {
    id: 'tsk-fanout-candidate',
    title: 'Fanout candidate',
    kind: 'task',
    status: 'todo',
    deps: [],
    risk: 'light',
    refs: [],
    verify: 'npm test',
  });
  writeRunnerConfigFixture(root, {
    executor: { command: 'claude', args: ['{prompt}'] },
    executors: { 'fgos-coding-implement': { kind: 'agent', agentType: 'general-purpose' } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const byWork = await decideExecutorCli(undefined, { repoRoot: root, work: 'tsk-fanout-candidate', hasLiveTaskAccess: true });
  const byName = await decideExecutorCli('fgos-coding-implement', { repoRoot: root, hasLiveTaskAccess: true });
  assert.deepEqual(byWork, { mechanism: 'in-process', agentType: 'general-purpose', executorId: 'fgos-coding-implement', configured: true });
  // Positional-id path stays byte-identical (no executorId field) -- every
  // pre-D4 caller/test already asserts this exact shape.
  assert.deepEqual(byName, { mechanism: 'in-process', agentType: 'general-purpose', configured: true });
});

test('decideExecutorCli resolves work-item-based (--work) via capabilities.fgos-coding-implement.prefer -- the real tsk-34n/D3 migration shape (no literal executors.fgos-coding-implement entry, only agy declaring "for")', async () => {
  const root = mkTempDir();
  const fgosDir = path.join(root, '.fgos');
  addWork(fgosDir, {
    id: 'tsk-fanout-prefer-candidate',
    title: 'Fanout candidate resolved via prefer',
    kind: 'task',
    status: 'todo',
    deps: [],
    risk: 'light',
    refs: [],
    verify: 'npm test',
  });
  writeRunnerConfigFixture(root, {
    executor: { command: 'claude', args: ['{prompt}'] },
    executors: { agy: { kind: 'agent', command: 'agy', args: ['{prompt}'], for: ['fgos-coding-implement'], allowCrossProvider: true } },
    capabilities: { 'fgos-coding-implement': { prefer: 'agy' } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  // hasLiveTaskAccess:true (a live/native session) -- must still resolve
  // out-of-process, since agy is cli-spawn-shaped (tsk-pdg D1): this is
  // the exact real gap tsk-1m8 found live before tsk-pdg fixed it.
  const withLiveAccess = await decideExecutorCli(undefined, { repoRoot: root, work: 'tsk-fanout-prefer-candidate', hasLiveTaskAccess: true });
  assert.deepEqual(withLiveAccess, { mechanism: 'out-of-process', executorId: 'fgos-coding-implement', configured: true });
  // hasLiveTaskAccess:false (the real fgos loop headless runner) --
  // byte-identical mechanism/configured shape either way, matching
  // tsk-pdg's own live evidence against the real repo before this item's
  // migration.
  const headless = await decideExecutorCli(undefined, { repoRoot: root, work: 'tsk-fanout-prefer-candidate', hasLiveTaskAccess: false });
  assert.deepEqual(headless, { mechanism: 'out-of-process', executorId: 'fgos-coding-implement', configured: true });
});

test('decideExecutorCli resolves work-item-based (--work) to "in-process" by default when the resolved executorId has NO explicit cfg.executors entry -- the real, common fgos-fanout case (D4 fix): a coding-domain work item is a same-provider, soul-needing rootTask (0026 rule 2), never the generic "no executor -> out-of-process" fallback a NAMED executorId lookup keeps unchanged', async () => {
  const root = mkTempDir();
  const fgosDir = path.join(root, '.fgos');
  addWork(fgosDir, {
    id: 'tsk-fanout-unregistered',
    title: 'Fanout candidate with no executors.<id> override',
    kind: 'task',
    status: 'todo',
    deps: [],
    risk: 'light',
    refs: [],
    verify: 'npm test',
  });
  writeRunnerConfigFixture(root, {
    executor: { command: 'claude', args: ['{prompt}'] },
    // No `executors` block at all -- matches this repo's own real
    // .fgos/config.json, where none of the 14 fgos-coding-* skills are
    // registered as a executors.<id> entry.
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const byWork = await decideExecutorCli(undefined, { repoRoot: root, work: 'tsk-fanout-unregistered', hasLiveTaskAccess: true });
  assert.deepEqual(byWork, { mechanism: 'in-process', executorId: 'fgos-coding-implement', configured: false });
  // The SAME unregistered executorId, looked up by NAME (not --work), keeps
  // its pre-D4 byte-identical "no executor -> out-of-process" behavior --
  // only the work-item-shaped lookup gets the native-first default.
  const byName = await decideExecutorCli('fgos-coding-implement', { repoRoot: root, hasLiveTaskAccess: true });
  assert.deepEqual(byName, { mechanism: 'out-of-process', configured: false });
});

test('decideExecutorCli resolves work-item-based (--work) to "out-of-process" when the caller has no live Task access, even with no explicit cfg.executors entry -- never claims in-process dishonestly', async () => {
  const root = mkTempDir();
  const fgosDir = path.join(root, '.fgos');
  addWork(fgosDir, {
    id: 'tsk-fanout-no-live-access',
    title: 'Fanout candidate, caller declares no live Task access',
    kind: 'task',
    status: 'todo',
    deps: [],
    risk: 'light',
    refs: [],
    verify: 'npm test',
  });
  writeRunnerConfigFixture(root, {
    executor: { command: 'claude', args: ['{prompt}'] },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const byWork = await decideExecutorCli(undefined, { repoRoot: root, work: 'tsk-fanout-no-live-access' });
  assert.deepEqual(byWork, { mechanism: 'out-of-process', executorId: 'fgos-coding-implement', configured: false });
});

test('decideExecutorCli throws a RunnerConfigError when --work names a work item that does not exist -- never silently "unavailable" (a typo/stale id is a real usage error, unlike an unconfigured purpose)', async () => {
  const root = mkTempDir();
  fs.mkdirSync(path.join(root, '.fgos'), { recursive: true });
  writeRunnerConfigFixture(root, {
    executor: { command: 'claude', args: ['{prompt}'] },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  await assert.rejects(
    () => decideExecutorCli(undefined, { repoRoot: root, work: 'no-such-work-item' }),
    RunnerConfigError,
  );
});

test('a positional executorId still wins over --work when both are somehow passed, same precedence --for already has', async () => {
  const root = mkTempDir();
  const fgosDir = path.join(root, '.fgos');
  addWork(fgosDir, {
    id: 'tsk-fanout-candidate-2',
    title: 'Fanout candidate 2',
    kind: 'task',
    status: 'todo',
    deps: [],
    risk: 'light',
    refs: [],
    verify: 'npm test',
  });
  writeRunnerConfigFixture(root, {
    executor: { command: 'claude', args: ['{prompt}'] },
    executors: {
      'fgos-coding-implement': { kind: 'agent', agentType: 'general-purpose' },
      explicit: { kind: 'tool', command: 'agy', args: ['{prompt}'], allowCrossProvider: true },
    },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const decided = await decideExecutorCli('explicit', { repoRoot: root, work: 'tsk-fanout-candidate-2', hasLiveTaskAccess: true });
  assert.deepEqual(decided, { mechanism: 'out-of-process', configured: true });
});

test('the "decide" CLI entry point resolves --work <id> the same way as a positional executorId', () => {
  const { repoRoot, fgosDir } = mkTempGitRepo();
  addWork(fgosDir, {
    id: 'tsk-fanout-cli-candidate',
    title: 'Fanout CLI candidate',
    kind: 'task',
    status: 'todo',
    deps: [],
    risk: 'light',
    refs: [],
    verify: 'npm test',
  });
  writeRunnerConfigFixture(repoRoot, {
    executor: { command: 'claude', args: ['{prompt}'] },
    executors: { 'fgos-coding-implement': { kind: 'agent', agentType: 'general-purpose' } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const dispatchPath = path.resolve('src/runner/dispatch.mjs');
  const result = spawnSync(
    process.execPath,
    [dispatchPath, 'decide', '--work', 'tsk-fanout-cli-candidate', '--has-live-task-access'],
    { encoding: 'utf8', cwd: repoRoot },
  );
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), { mechanism: 'in-process', agentType: 'general-purpose', executorId: 'fgos-coding-implement', configured: true });
});

// tsk-60f D4: the two resolveExecutorCli usage-error tests this cluster
// used to carry here are dropped, not ported -- `executeExecutorCli` already
// has its own native equivalent of both (the "both executorId and --for are
// missing" cluster above, and "throws when no executor is registered for
// the given purpose" in the tsk-5tm-3 D5 cluster). Only the gate-carries
// propagation coverage genuinely had no execute-native equivalent yet.

test('executeExecutorCli resolves purpose-based (--for) to the same command a positional executorId would, plus the resolved executorId; carries repo-content clears the gate', async () => {
  const dir = mkTempDir();
  const scriptPath = writeEchoExecutor(dir);
  const root = mkTempDir();
  writeRunnerConfigFixture(root, {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    capabilities: { judge: {} },
    executors: { gather: { kind: 'agent', for: ['judge'], carries: 'repo-content', command: process.execPath, provider: 'agy', args: [scriptPath, '{prompt}'], allowCrossProvider: true } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const byPurpose = await executeExecutorCli(undefined, { repoRoot: root, for: 'judge', carries: 'repo-content', prompt: 'p' });
  const byName = await executeExecutorCli('gather', { repoRoot: root, carries: 'repo-content', prompt: 'p' });
  assert.equal(byPurpose.executorId, 'gather');
  assert.equal(byPurpose.provider, 'agy');
  assert.equal(byPurpose.model, 'sonnet');
  assert.equal(byName.executorId, undefined);
  assert.equal(byName.provider, 'agy');
});

test('executeExecutorCli propagates the carries refusal for a purpose-resolved executor exactly like a name-resolved one', async () => {
  const root = mkTempDir();
  writeRunnerConfigFixture(root, {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    capabilities: { judge: {} },
    executors: { gather: { kind: 'agent', for: ['judge'], carries: 'user-text', command: 'agy', args: ['{prompt}'], allowCrossProvider: true } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  await assert.rejects(
    () => executeExecutorCli(undefined, { repoRoot: root, for: 'judge', carries: 'repo-content', prompt: 'p' }),
    RunnerConfigError,
  );
});

// --- CLI entry point: --for / --carries / the new "log" subcommand --------

// tsk-in1-4: isolated `mkTempGitRepo()`, not the live main checkout — same
// rationale as the CLI-spawn tests above.
test('the "decide" CLI entry point resolves --for <purpose> the same way as a positional executorId', () => {
  const { repoRoot } = mkTempGitRepo();
  writeRunnerConfigFixture(repoRoot, { executor: { command: 'claude', args: ['{prompt}'] }, models: { standard: 'sonnet' }, timeoutMs: 5000 });
  const dispatchPath = path.resolve('src/runner/dispatch.mjs');
  const result = spawnSync(process.execPath, [dispatchPath, 'decide', '--for', 'no-such-purpose-configured'], { encoding: 'utf8', cwd: repoRoot });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), { mechanism: 'unavailable', configured: false });
});

test('the "execute" CLI entry point honors --carries, threading it through end to end', () => {
  const { repoRoot } = mkTempGitRepo();
  const dir = mkTempDir();
  const scriptPath = writeEchoExecutor(dir);
  writeRunnerConfigFixture(repoRoot, { executor: { command: process.execPath, args: [scriptPath, '{prompt}'] }, models: { standard: 'sonnet' }, timeoutMs: 5000 });
  const dispatchPath = path.resolve('src/runner/dispatch.mjs');
  const result = spawnSync(
    process.execPath,
    [dispatchPath, 'execute', 'no-such-executor-configured', '--prompt', 'hello', '--carries', 'repo-content'],
    { encoding: 'utf8', cwd: repoRoot },
  );
  assert.equal(result.status, 0, result.stderr);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.mechanism, 'out-of-process');
  assert.equal(parsed.status, 0);
});

test('the "log" CLI entry point appends a executor.dispatch event and prints it as JSON', () => {
  const { repoRoot } = mkTempGitRepo();
  fs.mkdirSync(path.join(repoRoot, '.fgos'), { recursive: true });
  const dispatchPath = path.resolve('src/runner/dispatch.mjs');
  const result = spawnSync(
    process.execPath,
    [dispatchPath, 'log', 'gather', '--id', 'tsk-2c1', '--provider', 'agy', '--command', 'agy', '--model', 'gemini-flash'],
    { encoding: 'utf8', cwd: repoRoot },
  );
  assert.equal(result.status, 0, result.stderr);
  const printed = JSON.parse(result.stdout);
  assert.equal(printed.type, 'executor.dispatch');
  assert.equal(printed.payload.id, 'tsk-2c1');
  assert.equal(printed.payload.executorId, 'gather');
  assert.equal(printed.payload.provider, 'agy');
  assert.equal(printed.payload.command, 'agy');
  assert.equal(printed.payload.model, 'gemini-flash');
  const dispatchEvents = readRawEvents(path.join(repoRoot, '.fgos')).filter((e) => e.type === 'executor.dispatch');
  const logged = dispatchEvents[dispatchEvents.length - 1];
  assert.equal(logged.type, 'executor.dispatch');
  assert.equal(logged.payload.id, 'tsk-2c1');
});

test('the "log" CLI entry point exits non-zero with a usage message when a required flag is missing', () => {
  const dispatchPath = path.resolve('src/runner/dispatch.mjs');
  const result = spawnSync(process.execPath, [dispatchPath, 'log', 'gather', '--id', 'tsk-2c1'], { encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /usage: node src\/runner\/dispatch\.mjs log/);
});

// --- logExecutorDispatch (D9-shaped audit line for an IN-SESSION executor
// call — the sibling loop.mjs's own executor.dispatch event has no claim to
// attach to; closes bee's own named gap, tsk-2ie5/tsk-2c1) -----------------

test('logExecutorDispatch appends a executor.dispatch event with baseCommit/headRef always null (no worktree attestation applies in-session)', () => {
  const { fgosDir } = mkTempGitRepo();
  const event = logExecutorDispatch(fgosDir, {
    id: 'tsk-2c1',
    executorId: 'gather',
    provider: 'agy',
    command: 'agy',
    model: 'gemini-flash',
  });
  assert.equal(event.type, 'executor.dispatch');
  assert.equal(event.payload.baseCommit, null);
  assert.equal(event.payload.headRef, null);
  // Tầng A (TA-D2/TA-D12): logExecutorDispatch now writes into this
  // writer's own open file under `.fgos/events/`, not the frozen baseline
  // `events.jsonl` -- readRawEvents(dir) is the one door that reads both.
  const dispatchEvents = readRawEvents(fgosDir).filter((e) => e.type === 'executor.dispatch');
  assert.equal(dispatchEvents.length, 1);
});

test('logExecutorDispatch appends multiple sequential calls without corrupting the log — sequential seq, no duplicate/dropped lines (parallel gather branches must never race the write)', () => {
  const { fgosDir } = mkTempGitRepo();
  const events = [1, 2, 3, 4].map((n) =>
    logExecutorDispatch(fgosDir, { id: 'tsk-2c1', executorId: 'gather', provider: 'agy', command: 'agy', model: `m${n}` }),
  );
  const seqs = events.map((e) => e.seq);
  assert.deepEqual(seqs, [...new Set(seqs)].sort((a, b) => a - b), 'no duplicate seq');
  const dispatchEvents = readRawEvents(fgosDir).filter((e) => e.type === 'executor.dispatch');
  assert.equal(dispatchEvents.length, 4);
});

// --- CLI subcommand --cwd flag coverage ---------------------------------

test('dispatch CLI execute subcommand respects --cwd flag', () => {
  const repo = mkTempGitRepo();
  const workerRepo = mkTempGitRepo();
  const scriptPath = writeEchoExecutor(repo.repoRoot);
  const dispatchScriptPath = path.resolve(process.cwd(), 'src/runner/dispatch.mjs');
  writeRunnerConfigFixture(workerRepo.repoRoot, {
    executor: { command: process.execPath, args: [scriptPath, '{prompt}'] },
    executors: { testexec: { kind: 'agent', allowCrossProvider: true, command: process.execPath, args: [scriptPath, '{prompt}'] } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });

  const out = execFileSync(process.execPath, [dispatchScriptPath, 'execute', 'testexec', '--cwd', workerRepo.repoRoot, '--prompt', 'hello'], {
    encoding: 'utf8',
    cwd: repo.repoRoot,
  });
  const res = JSON.parse(out);
  assert.equal(res.status, 0);
  const echoData = JSON.parse(res.stdout);
  assert.equal(echoData.cwd, workerRepo.repoRoot);
});

test('dispatch CLI decide subcommand respects --cwd flag', () => {
  const repo = mkTempGitRepo();
  const dispatchScriptPath = path.resolve(process.cwd(), 'src/runner/dispatch.mjs');
  writeRunnerConfigFixture(repo.repoRoot, {
    executor: { command: process.execPath, args: ['{prompt}'] },
    executors: { testexec: { kind: 'agent', agentType: 'test' } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });

  const out = execFileSync(process.execPath, [dispatchScriptPath, 'decide', 'testexec', '--cwd', repo.repoRoot, '--has-live-task-access'], {
    encoding: 'utf8',
  });
  const res = JSON.parse(out);
  assert.equal(res.mechanism, 'in-process');
  assert.equal(res.agentType, 'test');
});

// --- fanout-batch and fgos schedule --candidates -------------------------

test('fanoutBatchExecutorCli returns slotsFull when worker slots ceiling is full', async () => {
  const repo = mkTempGitRepo();
  const fgosDir = repo.fgosDir;
  initStore(fgosDir);
  // Write shared config with ceiling = 1 into .fgos/config.json
  fs.writeFileSync(path.join(fgosDir, 'config.json'), JSON.stringify({ workerSlots: { ceiling: 1 } }));
  // Add 1 doing item to consume the slot
  addWork(fgosDir, { id: 't1', title: 'Running Item', kind: 'task', status: 'doing', domain: 'coding', stage: 'executing', deps: [], refs: [], risk: 'light', verify: 'npm test' });

  const result = await fanoutBatchExecutorCli(['c1', 'c2'], { repoRoot: repo.repoRoot });
  assert.equal(result.slotsFull, true);
  assert.deepEqual(result.deferred, ['c1', 'c2']);
  assert.deepEqual(result.fired, []);
});

test('fanoutBatchExecutorCli trims candidates to free slots when ceiling is configured', async () => {
  const repo = mkTempGitRepo();
  const fgosDir = repo.fgosDir;
  initStore(fgosDir);
  fs.writeFileSync(path.join(fgosDir, 'config.json'), JSON.stringify({ workerSlots: { ceiling: 1 } }));

  addWork(fgosDir, { id: 'c1', title: 'Cand 1', kind: 'task', status: 'todo', domain: 'coding', stage: 'executing', deps: [], refs: [], risk: 'light', verify: 'npm test' });
  addWork(fgosDir, { id: 'c2', title: 'Cand 2', kind: 'task', status: 'todo', domain: 'coding', stage: 'executing', deps: [], refs: [], risk: 'light', verify: 'npm test' });

  const result = await fanoutBatchExecutorCli(['c1', 'c2'], { repoRoot: repo.repoRoot, hasLiveTaskAccess: true });
  assert.equal(result.slotsFull, undefined);
  assert.deepEqual(result.deferred, ['c2']);
  assert.equal(result.mechanismChanged.length, 1);
  assert.equal(result.mechanismChanged[0].id, 'c1');
});

test('fgos schedule --candidates filters schedule to specified candidates', () => {
  const repo = mkTempGitRepo();
  const fgosDir = repo.fgosDir;
  initStore(fgosDir);
  addWork(fgosDir, { id: 'w1', title: 'Item 1', kind: 'task', status: 'todo', domain: 'coding', stage: 'executing', deps: [], refs: [], risk: 'light', verify: 'npm test' });
  addWork(fgosDir, { id: 'w2', title: 'Item 2', kind: 'task', status: 'todo', domain: 'coding', stage: 'executing', deps: [], refs: [], risk: 'light', verify: 'npm test' });
  const fgosScript = path.resolve(process.cwd(), 'bin/fgos.mjs');

  const outAll = execFileSync(process.execPath, [fgosScript, 'schedule', '--json', '--dir', repo.repoRoot], { encoding: 'utf8' });
  const schedAll = JSON.parse(outAll);
  const wavesAll = schedAll.data ? schedAll.data.waves : schedAll.waves;
  assert.ok(wavesAll[0].includes('w1'));
  assert.ok(wavesAll[0].includes('w2'));

  const outScoped = execFileSync(process.execPath, [fgosScript, 'schedule', '--candidates', 'w1', '--json', '--dir', repo.repoRoot], { encoding: 'utf8' });
  const schedScoped = JSON.parse(outScoped);
  const wavesScoped = schedScoped.data ? schedScoped.data.waves : schedScoped.waves;
  assert.deepEqual(wavesScoped, [['w1']]);
});

/** Write a fake executor that commits an empty commit in whatever cwd it
 * runs in (the picked worktree, per `executeExecutorCli`'s own `cwd`
 * param) -- simulates a real worker actually doing+committing work, so
 * `fgos return` finds real progress to verify against. */
function writeCommittingExecutor(dir) {
  const scriptPath = path.join(dir, 'committing-executor.mjs');
  fs.writeFileSync(
    scriptPath,
    `
    import { execFileSync } from 'node:child_process';
    execFileSync('git', ['commit', '--allow-empty', '-m', 'fake work'], { stdio: 'ignore' });
    process.stdout.write(JSON.stringify({ ok: true }));
    process.exit(0);
    `,
  );
  return scriptPath;
}

test('fanoutBatchExecutorCli: real end-to-end out-of-process fire -- pick/execute/return actually complete via subprocess calls to the real bin/fgos.mjs (closes the --dir/worktreePath-shape bug: this function used to pass fgosDir instead of root to --dir, doubling the .fgos suffix into a nonexistent path, and read a flat .worktreePath field the fgos.v1 envelope never has -- data.worktree.path is the real shape)', async () => {
  const { repoRoot, fgosDir } = mkTempGitRepo();
  const dir = mkTempDir();
  const scriptPath = writeCommittingExecutor(dir);
  writeRunnerConfigFixture(repoRoot, {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    executors: { 'fgos-coding-implement': { kind: 'agent', command: process.execPath, args: [scriptPath], allowCrossProvider: true } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  addWork(fgosDir, {
    id: 'cand1',
    title: 'Candidate 1',
    kind: 'task',
    status: 'todo',
    domain: 'coding',
    stage: 'executing',
    deps: [],
    refs: [],
    risk: 'light',
    verify: 'true',
  });

  const result = await fanoutBatchExecutorCli(['cand1'], { repoRoot, hasLiveTaskAccess: false });

  assert.equal(result.mechanismChanged.length, 0);
  assert.equal(result.unavailable.length, 0);
  assert.equal(result.fired.length, 1);
  assert.equal(result.fired[0].id, 'cand1');
  assert.equal(result.fired[0].status, 0);
  assert.equal(result.fired[0].errorClass, null);

  // Never trust the return value alone -- independently re-read real state.
  const view = listWork(fgosDir);
  assert.equal(view.work.cand1.status, 'awaiting-approval');
});

test('fanoutBatchExecutorCli fires candidates in batch concurrently with overlapping execution windows', async () => {
  const { repoRoot, fgosDir } = mkTempGitRepo();
  const dir = mkTempDir();
  const logFile = path.join(dir, 'timestamps.jsonl');
  const scriptPath = path.join(dir, 'timed-committing-executor.mjs');
  fs.writeFileSync(
    scriptPath,
    `
    import { execFileSync } from 'node:child_process';
    import fs from 'node:fs';

    const start = Date.now();
    // 800ms (widened from 200ms, tsk-5v3 flake): a CPU busy-wait, not a
    // sleep, so under real contention from this repo's own full test
    // suite running many other subprocess-heavy tests concurrently, the
    // OS scheduler can delay or preempt one candidate's spin loop enough
    // that a short window fails to overlap the other's even though both
    // were genuinely dispatched concurrently -- observed flaking under
    // full-suite load, passing reliably in isolation. A longer window
    // gives real scheduling jitter more margin to still produce a
    // provable overlap.
    const until = Date.now() + 800;
    while (Date.now() < until) { /* artificial delay */ }
    execFileSync('git', ['commit', '--allow-empty', '-m', 'fake work'], { stdio: 'ignore' });
    const end = Date.now();

    fs.appendFileSync(${JSON.stringify(logFile)}, JSON.stringify({ start, end, pid: process.pid }) + '\\n');
    process.stdout.write(JSON.stringify({ ok: true }));
    process.exit(0);
    `,
  );

  writeRunnerConfigFixture(repoRoot, {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    capabilities: { 'fgos-coding-implement': { prefer: 'fgos-coding-implement' } },
    executors: { 'fgos-coding-implement': { kind: 'agent', command: process.execPath, args: [scriptPath], allowCrossProvider: true } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });

  addWork(fgosDir, {
    id: 'cand1',
    title: 'Candidate 1',
    kind: 'task',
    status: 'todo',
    domain: 'coding',
    stage: 'executing',
    deps: [],
    refs: [],
    risk: 'light',
    verify: 'true',
  });
  addWork(fgosDir, {
    id: 'cand2',
    title: 'Candidate 2',
    kind: 'task',
    status: 'todo',
    domain: 'coding',
    stage: 'executing',
    deps: [],
    refs: [],
    risk: 'light',
    verify: 'true',
  });

  const result = await fanoutBatchExecutorCli(['cand1', 'cand2'], { repoRoot, hasLiveTaskAccess: false });

  assert.equal(result.fired.length, 2);
  assert.equal(result.fired[0].status, 0);
  assert.equal(result.fired[1].status, 0);

  const lines = fs.readFileSync(logFile, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  assert.equal(lines.length, 2);

  // Assert execution windows overlap: max(start1, start2) < min(end1, end2)
  const [t1, t2] = lines;
  const overlapStart = Math.max(t1.start, t2.start);
  const overlapEnd = Math.min(t1.end, t2.end);
  assert.ok(
    overlapStart < overlapEnd,
    `Expected execution windows to overlap, but candidate 1: [${t1.start}, ${t1.end}] and candidate 2: [${t2.start}, ${t2.end}]`,
  );
});

// --- resolveAgentTypeForWork (D20/D22 wiring, review finding H1, tsk-397) ---
// DOMAINS.coding is a fixed, module-load-time registry (not injectable per
// call), so these fixtures write a real domains/coding/task-specs/
// implement-item.md + core/agents/*.yaml under a temp cwd -- the SAME
// taskSpec id DOMAINS.coding.taskSpecMap.executing already names
// ('implement-item', proven by the bundleForStage test above), just with a
// controlled header/roster so the resolution itself is isolated and
// deterministic.

function writeTaskSpecFixture(cwd, headerLine) {
  const dir = path.join(cwd, 'domains', 'coding', 'task-specs');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'implement-item.md'), `# task-spec: implement-item\n\n${headerLine}\n\n## Input\n`);
}

function writeAgentFixture(cwd, name, skills) {
  const dir = path.join(cwd, 'core', 'agents');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${name}.yaml`), `name: ${name}\nskills: [${skills.join(', ')}]\n`);
}

test('resolveAgentTypeForWork resolves the real coding/executing taskSpec (implement-item) against a controlled agent roster', () => {
  const cwd = mkTempDir();
  writeTaskSpecFixture(cwd, 'domain: coding | stage: executing | role: implementer | requires-skill: fgos-coding-implement');
  writeAgentFixture(cwd, 'general-worker', ['fgos-coding-implement', 'fgos-coding-planning']);

  const resolved = resolveAgentTypeForWork({ domain: 'coding', stage: 'executing' }, cwd);
  assert.equal(resolved, 'general-worker');
});

test('resolveAgentTypeForWork honors an explicit agent: pin over skill-matching (D32 tie-break priority 1)', () => {
  const cwd = mkTempDir();
  writeTaskSpecFixture(cwd, 'domain: coding | stage: executing | role: implementer | agent: pinned-worker | requires-skill: fgos-coding-implement');
  writeAgentFixture(cwd, 'general-worker', ['fgos-coding-implement']);
  writeAgentFixture(cwd, 'pinned-worker', []); // no matching skills -- the pin still wins

  const resolved = resolveAgentTypeForWork({ domain: 'coding', stage: 'executing' }, cwd);
  assert.equal(resolved, 'pinned-worker');
});

test('resolveAgentTypeForWork returns null when no real agentDefs exist to resolve against (empty roster is a legitimate "nothing to resolve", not an error)', () => {
  const cwd = mkTempDir();
  writeTaskSpecFixture(cwd, 'domain: coding | stage: executing | role: implementer | requires-skill: fgos-coding-implement');
  // No core/agents/ or domains/coding/agents/ written -- empty roster.
  const resolved = resolveAgentTypeForWork({ domain: 'coding', stage: 'executing' }, cwd);
  assert.equal(resolved, null);
});

test('resolveAgentTypeForWork returns null for a stage with no registered taskSpec (bundleForStage\'s own {skill:null,taskSpec:null} case) -- nothing to resolve from', () => {
  const cwd = mkTempDir();
  const resolved = resolveAgentTypeForWork({ domain: 'coding', stage: 'nonexistent-stage' }, cwd);
  assert.equal(resolved, null);
});

// --- tsk-gb3: per-executor env overrides and GLM OpenRouter executor ---

test('resolveExecutorEnv substitutes ${VAR} against baseEnv and passes literals unchanged', () => {
  const baseEnv = {
    FOO: 'bar',
    EMPTY_VAR: '',
  };

  const rawEnv = {
    LITERAL: 'https://openrouter.ai/api',
    SUBSTITUTED: '${FOO}',
    SUBSTITUTED_EMPTY: '${EMPTY_VAR}',
    UNSET: '${UNSET_VAR}',
    EMPTY_LITERAL: '',
    MULTI: '${FOO}_baz_${FOO}',
  };

  const resolved = resolveExecutorEnv(rawEnv, baseEnv);

  assert.equal(resolved.LITERAL, 'https://openrouter.ai/api');
  assert.equal(resolved.SUBSTITUTED, 'bar');
  assert.equal(resolved.SUBSTITUTED_EMPTY, '');
  assert.equal(resolved.UNSET, '');
  assert.equal(resolved.EMPTY_LITERAL, '');
  assert.equal(resolved.MULTI, 'bar_baz_bar');
});

test('resolveExecutorEnv returns empty object when rawEnv is absent or invalid', () => {
  assert.deepEqual(resolveExecutorEnv(undefined), {});
  assert.deepEqual(resolveExecutorEnv(null), {});
  assert.deepEqual(resolveExecutorEnv('not-an-object'), {});
});

test('loadRunnerConfig accepts well-formed "env" block in executors entry', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'env-ok.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      executors: {
        glm: {
          kind: 'agent',
          command: 'claude',
          args: ['{prompt}'],
          env: {
            ANTHROPIC_BASE_URL: 'https://openrouter.ai/api',
            ANTHROPIC_AUTH_TOKEN: '${GLM_KEY}',
            ANTHROPIC_API_KEY: '',
          },
        },
      },
      models: { standard: 'sonnet' },
      timeoutMs: 1000,
    }),
  );
  const cfg = loadRunnerConfig(configPath);
  assert.equal(cfg.executors.glm.env.ANTHROPIC_BASE_URL, 'https://openrouter.ai/api');
  assert.equal(cfg.executors.glm.env.ANTHROPIC_AUTH_TOKEN, '${GLM_KEY}');
  assert.equal(cfg.executors.glm.env.ANTHROPIC_API_KEY, '');
});

test('loadRunnerConfig rejects malformed "env" in executors entry', () => {
  const dir = mkTempDir();

  // non-object env
  const path1 = path.join(dir, 'bad-env-1.json');
  fs.writeFileSync(
    path1,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      executors: { glm: { kind: 'agent', command: 'claude', args: ['{prompt}'], env: 'not-an-object' } },
      models: {},
      timeoutMs: 1000,
    }),
  );
  assert.throws(() => loadRunnerConfig(path1), RunnerConfigError);

  // array env
  const path2 = path.join(dir, 'bad-env-2.json');
  fs.writeFileSync(
    path2,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      executors: { glm: { kind: 'agent', command: 'claude', args: ['{prompt}'], env: ['KEY=VAL'] } },
      models: {},
      timeoutMs: 1000,
    }),
  );
  assert.throws(() => loadRunnerConfig(path2), RunnerConfigError);

  // non-string value in env
  const path3 = path.join(dir, 'bad-env-3.json');
  fs.writeFileSync(
    path3,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      executors: { glm: { kind: 'agent', command: 'claude', args: ['{prompt}'], env: { KEY: 123 } } },
      models: {},
      timeoutMs: 1000,
    }),
  );
  assert.throws(() => loadRunnerConfig(path3), RunnerConfigError);

  // empty-string key in env
  const path4 = path.join(dir, 'bad-env-4.json');
  fs.writeFileSync(
    path4,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      executors: { glm: { kind: 'agent', command: 'claude', args: ['{prompt}'], env: { '': 'value' } } },
      models: {},
      timeoutMs: 1000,
    }),
  );
  assert.throws(() => loadRunnerConfig(path4), RunnerConfigError);
});

test('resolveExecutorCommand returns env block from resolved executor', () => {
  const cfg = {
    executor: { command: 'claude', args: ['{prompt}'] },
    executors: {
      glm: {
        kind: 'agent',
        command: 'claude',
        args: ['-p', '{prompt}'],
        env: {
          ANTHROPIC_BASE_URL: 'https://openrouter.ai/api',
          ANTHROPIC_AUTH_TOKEN: '${TEST_OPENROUTER_KEY}',
        },
      },
    },
    models: { standard: 'sonnet' },
  };

  const res = resolveExecutorCommand(cfg, { prompt: 'hi', model: 'sonnet', tier: 'standard', executorId: 'glm' });
  assert.equal(res.command, 'claude');
  assert.deepEqual(res.env, {
    ANTHROPIC_BASE_URL: 'https://openrouter.ai/api',
    ANTHROPIC_AUTH_TOKEN: '${TEST_OPENROUTER_KEY}',
  });
});

test('spawnWorker / cliSpawnAdapter passes per-executor resolved env to child process', async () => {
  const dir = mkTempDir();
  const scriptPath = path.join(dir, 'env-echo-executor.mjs');
  fs.writeFileSync(
    scriptPath,
    `
    process.stdout.write(JSON.stringify({
      BASE_URL: process.env.ANTHROPIC_BASE_URL,
      AUTH_TOKEN: process.env.ANTHROPIC_AUTH_TOKEN,
      API_KEY: process.env.ANTHROPIC_API_KEY,
    }));
    process.exit(0);
    `,
  );

  const originalKey = process.env.GLM_OPENROUTER_API_KEY;
  process.env.GLM_OPENROUTER_API_KEY = 'secret-test-key-12345';

  try {
    const cfg = {
      executor: { command: process.execPath, args: [scriptPath] },
      capabilities: {
        'fgos-coding-implement': { prefer: 'glm' },
      },
      executors: {
        glm: {
          kind: 'agent',
          command: process.execPath,
          args: [scriptPath],
          allowCrossProvider: true,
          env: {
            ANTHROPIC_BASE_URL: 'https://openrouter.ai/api',
            ANTHROPIC_AUTH_TOKEN: '${GLM_OPENROUTER_API_KEY}',
            ANTHROPIC_API_KEY: '',
          },
        },
      },
      models: { standard: 'sonnet' },
      timeoutMs: 5000,
    };

    const res = await spawnWorker(sampleWork(), cfg, dir, { stage: 'executing' });
    const output = JSON.parse(res.stdout);
    assert.equal(output.BASE_URL, 'https://openrouter.ai/api');
    assert.equal(output.AUTH_TOKEN, 'secret-test-key-12345');
    assert.equal(output.API_KEY, '');

    // process.env of host remains unchanged
    assert.equal(process.env.ANTHROPIC_BASE_URL, undefined);
  } finally {
    if (originalKey !== undefined) {
      process.env.GLM_OPENROUTER_API_KEY = originalKey;
    } else {
      delete process.env.GLM_OPENROUTER_API_KEY;
    }
  }
});

test('registered executors.glm entry resolves command "claude" and env block', () => {
  const { repoRoot } = mkTempGitRepo();
  const glmConfig = {
    executor: { command: 'claude', args: ['{prompt}'] },
    executors: {
      glm: {
        kind: 'agent',
        description: 'Claude Code CLI routing to OpenRouter GLM 5.2 model',
        command: 'claude',
        args: ['-p', '{prompt}', '--model', '{model}'],
        env: {
          ANTHROPIC_BASE_URL: 'https://openrouter.ai/api',
          ANTHROPIC_AUTH_TOKEN: '${GLM_OPENROUTER_API_KEY}',
          ANTHROPIC_MODEL: 'z-ai/glm-5.2',
          ANTHROPIC_API_KEY: '',
        },
      },
    },
    models: { standard: 'sonnet' },
    timeoutMs: 1000,
  };
  const fgosDir = path.join(repoRoot, '.fgos');
  fs.writeFileSync(path.join(fgosDir, 'config.json'), JSON.stringify({ runner: glmConfig }, null, 2));

  const cfg = loadRunnerConfigFromDir(repoRoot);
  assert.ok(cfg.executors.glm, 'executors.glm is registered');
  assert.equal(cfg.executors.glm.kind, 'agent');
  assert.equal(cfg.executors.glm.command, 'claude');
  assert.equal(cfg.executors.glm.env.ANTHROPIC_BASE_URL, 'https://openrouter.ai/api');
  assert.equal(cfg.executors.glm.env.ANTHROPIC_AUTH_TOKEN, '${GLM_OPENROUTER_API_KEY}');
  assert.equal(cfg.executors.glm.env.ANTHROPIC_MODEL, 'z-ai/glm-5.2');
  assert.equal(cfg.executors.glm.env.ANTHROPIC_API_KEY, '');

  const res = resolveExecutorCommand(cfg, { prompt: 'test', model: 'sonnet', tier: 'standard', executorId: 'glm' });
  assert.equal(res.command, 'claude');
  assert.equal(res.provider, 'claude');
});
