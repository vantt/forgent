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
  executeCapacityCli,
  resolveCapacityIdForPurpose,
  resolveCapacityAndOverrides,
  logCapacityDispatch,
  decideDispatchMechanism,
  decideCapacityDispatchMechanism,
  decideCapacityCli,
  spawnWorker,
  RunnerConfigError,
  DispatchError,
  EXECUTOR_ADAPTERS,
  DEFAULT_ADAPTER,
  CAPACITY_KINDS,
  CAPACITY_CARRIES,
  INVOCATION_VIA,
  capacityIdForWork,
} from '../../src/runner/dispatch.mjs';
import { initStore, addWork } from '../../src/state/store.mjs';
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

// --- tsk-in1-2 D6: `executors.<tier>` (the per-tier override block) is
// retired — 0 live entries, had already caused a real bug (tsk-4eu, tsk-5tm
// D10: a non-tier key like "judge" silently fell through to the global
// executor with no error). A config declaring one now falls straight
// through validateRunnerConfigShape untouched, same as any other unknown
// top-level key — never validated, never consulted for resolution. See
// `resolveExecutorConfig`'s own dedicated coverage for the resolve-side
// confirmation (a global `capacities` D6 test elsewhere in this file).

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

test('loadRunnerConfig never validates an "executors" block — a malformed one loads fine, inert', () => {
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
  const cfg = loadRunnerConfig(configPath);
  assert.equal(cfg.executors, 'nope');
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

// --- tsk-62v: capacity-aware `capacities` schema (D1/D2) -----------------

test('CAPACITY_KINDS is exactly the agent/tool BAN CHAT axis (D5, tsk-in1-4) — no longer reuses tool-registry\'s own KINDS', () => {
  assert.deepEqual(CAPACITY_KINDS, ['agent', 'tool']);
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
      capacities: { 'fgos-code-implement': { kind: 'agent', command: 'agy', args: ['{prompt}'] } },
      models: { standard: 'sonnet' },
      timeoutMs: 1000,
    }),
  );
  const cfg = loadRunnerConfig(configPath);
  assert.equal(cfg.capacities['fgos-code-implement'].command, 'agy');
});

// --- tsk-in1-3: capabilities catalog (D4/D14) — curated, shared between
// the tool-registry's own free-text `capability` field and, later,
// capacities.<id>.for -- deliberately a DIFFERENT field from `capacities`
// above (D3 kept that name for the executor registry; `capabilities` is
// the catalog of WHAT a capacity can promise) --------------------------

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

// --- capacities.<id>.invocations[] (tsk-5tm-4 D11): executor-keyed
// alternative to flat command/args, ADDITIVE -- capacities field name
// itself stays unchanged (cfg.executors already means something else,
// tier-keyed, tsk-4eu) -----------------------------------------------

test('INVOCATION_VIA is exactly the CO CHE GOI axis (D11 tsk-5tm-4, widened D8 tsk-in1-4, "api" restored D13 tsk-in1-5) — cli/task/mcp/api', () => {
  assert.deepEqual(INVOCATION_VIA, ['cli', 'task', 'mcp', 'api']);
});

test('loadRunnerConfig accepts a "capacities.<id>" entry using the invocations[] shape instead of flat command/args', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'invocations-ok.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      capacities: {
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

test('loadRunnerConfig rejects a "capacities.<id>.invocations" that is not a non-empty array', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'bad-invocations-empty.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      capacities: { agy: { kind: 'agent', invocations: [] } },
      models: { standard: 'sonnet' },
      timeoutMs: 1000,
    }),
  );
  assert.throws(() => loadRunnerConfig(configPath), RunnerConfigError);
});

test('loadRunnerConfig rejects a "capacities.<id>.invocations[]" entry with an unknown "via"', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'bad-invocations-via.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      capacities: {
        agy: { kind: 'agent', allowCrossProvider: true, invocations: [{ via: 'api', command: 'agy', args: ['{prompt}'] }] },
      },
      models: { standard: 'sonnet' },
      timeoutMs: 1000,
    }),
  );
  assert.throws(() => loadRunnerConfig(configPath), RunnerConfigError);
});

test('loadRunnerConfig rejects a "capacities.<id>.invocations[]" entry with a malformed command/args shape (reuses validateExecutorShape)', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'bad-invocations-shape.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      capacities: { agy: { kind: 'agent', allowCrossProvider: true, invocations: [{ via: 'cli', command: 'agy' }] } },
      models: { standard: 'sonnet' },
      timeoutMs: 1000,
    }),
  );
  assert.throws(() => loadRunnerConfig(configPath), RunnerConfigError);
});

test('resolveExecutorCommand resolves command/args/provider from invocations[0] for an invocations[]-shaped capacity', () => {
  const cfg = {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    capacities: {
      agy: {
        kind: 'agent',
        allowCrossProvider: true,
        invocations: [{ via: 'cli', adapter: 'cli-spawn', command: 'agy', args: ['-p', '{prompt}', '--model', '{model}'] }],
      },
    },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
  const resolved = resolveExecutorCommand(cfg, { prompt: 'hello', model: 'sonnet', tier: 'standard', capacityId: 'agy' });
  assert.equal(resolved.command, 'agy');
  assert.deepEqual(resolved.args, ['-p', 'hello', '--model', 'sonnet']);
  assert.equal(resolved.adapter, 'cli-spawn');
  assert.equal(resolved.provider, 'agy');
});

test('resolveExecutorCommand picks the invocation whose "via" is "cli" even when it is not invocations[0] (D9 Gate B2 — never invocations[0] blindly)', () => {
  const cfg = {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    capacities: {
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
  const resolved = resolveExecutorCommand(cfg, { prompt: 'hello', model: 'sonnet', tier: 'standard', capacityId: 'agy' });
  assert.equal(resolved.command, 'claude');
  assert.deepEqual(resolved.args, ['-p', 'hello']);
});

test('resolveExecutorCommand throws when a capacity declares "invocations" but none is dispatchable via "cli" (D9 Gate B3 — never silently falls through to the global executor)', () => {
  const cfg = {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    capacities: {
      agy: {
        kind: 'tool',
        invocations: [{ via: 'mcp', command: 'mcp:agy' }],
      },
    },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
  assert.throws(
    () => resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', capacityId: 'agy' }),
    /declares "invocations" but none is dispatchable via "cli"/,
  );
});

test('resolveExecutorCommand still enforces cross-provider governance for an invocations[]-shaped capacity — allowCrossProvider stays required', () => {
  const cfg = {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    capacities: {
      agy: { kind: 'agent', invocations: [{ via: 'cli', adapter: 'cli-spawn', command: 'agy', args: ['{prompt}'] }] },
    },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
  assert.throws(
    () => resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', capacityId: 'agy' }),
    RunnerConfigError,
  );
});

test('the committed .fgos/config.json runner section declares the agy reference capacity (tsk-5tm-4 D11): invocations[]-shaped, kind agent (migrated at tsk-in1-4 D5), allowCrossProvider true, resolves to the real installed agy binary', () => {
  const cfg = committedRunnerConfig();
  const capacity = cfg.capacities?.agy;
  assert.ok(capacity, 'capacities.agy must exist');
  assert.equal(capacity.kind, 'agent');
  assert.equal(capacity.allowCrossProvider, true);
  assert.ok(Array.isArray(capacity.invocations) && capacity.invocations.length === 1);
  const invocation = capacity.invocations[0];
  assert.equal(invocation.via, 'cli');
  assert.equal(invocation.adapter, 'cli-spawn');
  assert.equal(invocation.command, 'agy');
  assert.ok(invocation.args.includes('{prompt}') && invocation.args.includes('{model}'));
  assert.ok(invocation.args.includes('--dangerously-skip-permissions'));
});

test('loadRunnerConfig accepts a "capacities" entry naming only "kind" (metadata-only, falls through for its executor)', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'metadata-only-capacity.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      capacities: { distill: { kind: 'agent', target: 'general-purpose', tier: 'standard' } },
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
      capacities: { distill: { kind: 'agent', target: 'general-purpose' } },
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
      capacities: { 'fgos-code-implement': { kind: 'agent', command: 'agy' } },
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
      capacities: { 'fgos-code-implement': { kind: 'agent', command: 'agy', args: ['{prompt}'], allowCrossProvider: true } },
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
      capacities: { 'fgos-code-implement': { kind: 'agent', command: 'agy', args: ['{prompt}'], allowCrossProvider: 'yes' } },
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
// signature is genuinely pluggable, independent of any capacity actually
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

test('loadRunnerConfig accepts a "capacities.<id>.invocations[]" entry with "via":"api" and a non-empty "url"', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'api-invocation-ok.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      capacities: {
        webhook: { kind: 'tool', invocations: [{ via: 'api', adapter: 'http', url: 'http://example.invalid/hook' }] },
      },
      models: { standard: 'sonnet' },
      timeoutMs: 1000,
    }),
  );
  assert.doesNotThrow(() => loadRunnerConfig(configPath));
});

test('loadRunnerConfig rejects a "capacities.<id>.invocations[]" entry with "via":"api" and no "url"', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'api-invocation-no-url.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      capacities: { webhook: { kind: 'tool', invocations: [{ via: 'api', adapter: 'http' }] } },
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

test('the committed .fgos/config.json runner section wires the agy capacity to gemini\'s own modelPolicies, not claude\'s (D9, tsk-5tm-5 — the bug this piece fixes)', () => {
  const cfg = committedRunnerConfig();
  assert.equal(cfg.capacities?.agy?.providerModel, 'gemini');
  assert.equal(typeof cfg.modelPolicies?.gemini?.lightweight, 'string');
  assert.ok(cfg.modelPolicies.gemini.lightweight.length > 0);
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

test('the committed .fgos/config.json runner section no longer declares a coding-classify-intake capacity (tsk-49u): tsk-4ns already stripped its only consumer (fgos-submit-assist\'s dispatch-fallback branch), leaving the config entry orphaned, so it was removed via the same ADR0020 hand-commit-to-main path its own rename (tsk-3fj) originally used', () => {
  const cfg = committedRunnerConfig();
  assert.equal(cfg.capacities?.['coding-classify-intake'], undefined, 'capacities.coding-classify-intake should no longer exist -- retired after tsk-4ns removed its only consumer');
});

test('the committed .fgos/config.json runner section no longer declares a gather capacity (tsk-5tm-2 D6): the one cross-provider path, retired -- no architectural reason on record for cross-provider, and native Task-tool dispatch already met the one documented reason (parallelizing wall-clock)', () => {
  const cfg = committedRunnerConfig();
  assert.equal(cfg.capacities?.gather, undefined, 'capacities.gather should no longer exist -- retired per D6');
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

test('loadRunnerConfig rejects a "capacities.<id>" entry whose providerModel is not a non-empty string', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'bad-provider-model.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      capacities: { agy: { kind: 'agent', command: 'agy', args: ['{prompt}'], providerModel: '' } },
      modelPolicies: { claude: { standard: 'sonnet' } },
      timeoutMs: 1000,
    }),
  );
  assert.throws(() => loadRunnerConfig(configPath), RunnerConfigError);
});

test('loadRunnerConfig rejects a "capacities.<id>" entry whose rigorOverrides key is not a valid tier', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'bad-rigor-key.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      capacities: { agy: { kind: 'agent', command: 'agy', args: ['{prompt}'], rigorOverrides: { 'not-a-tier': 'critical' } } },
      modelPolicies: { claude: { standard: 'sonnet' } },
      timeoutMs: 1000,
    }),
  );
  assert.throws(() => loadRunnerConfig(configPath), RunnerConfigError);
});

test('loadRunnerConfig rejects a "capacities.<id>" entry whose rigorOverrides value is not one of MODEL_POLICY_TIERS', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'bad-rigor-value.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      capacities: { agy: { kind: 'agent', command: 'agy', args: ['{prompt}'], rigorOverrides: { standard: 'ultra-mega' } } },
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

// --- tsk-62v: capacity-aware resolve precedence (D4) — capacities > global
// executor (tsk-in1-2 D6 retired the intermediate executors.<tier> rung)

test('resolveExecutorCommand honors a capacities.<capacityId> override ahead of the global executor', () => {
  const cfg = {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    capacities: { 'fgos-code-implement': { kind: 'agent', command: '/capacity/executor', args: ['{prompt}'], allowCrossProvider: true } },
    models: { heavy: 'opus' },
    timeoutMs: 5000,
  };
  const byCapacity = resolveExecutorCommand(cfg, { prompt: 'p', model: 'opus', tier: 'heavy', capacityId: 'fgos-code-implement' });
  assert.equal(byCapacity.command, '/capacity/executor');
  // no capacityId at all -> falls back to the global executor, unaffected
  const noCapacityId = resolveExecutorCommand(cfg, { prompt: 'p', model: 'opus', tier: 'heavy' });
  assert.equal(noCapacityId.command, '/global/executor');
});

test('resolveExecutorCommand falls back to the global executor when the capacities entry names no executor of its own (metadata-only) — executors.<tier> is retired, no intermediate stop', () => {
  // Global executor command is Claude's own here (unlike a same-named test
  // predating D5) deliberately -- this test's own purpose is metadata-only
  // fallback resolution, not cross-provider governance (D5, tsk-in1-4:
  // governance is no longer exempted by "kind" alone, so a non-Claude
  // placeholder here would trip an unrelated throw; see the dedicated
  // cross-provider-governance tests above for that boundary instead).
  const cfg = {
    executor: { command: 'claude', args: ['{prompt}'] },
    capacities: { 'fgos-code-implement': { kind: 'agent', target: 'general-purpose', tier: 'heavy' } },
    models: { heavy: 'opus' },
    timeoutMs: 5000,
  };
  const resolved = resolveExecutorCommand(cfg, { prompt: 'p', model: 'opus', tier: 'heavy', capacityId: 'fgos-code-implement' });
  assert.equal(resolved.command, 'claude');
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
        kind: 'agent',
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
    capacities: { 'some-other-capacity': { kind: 'agent', command: '/other/executor', args: ['{prompt}'] } },
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
    capacities: { 'fgos-code-implement': { kind: 'agent', target: 'agy' } },
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
  const cfg = {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    capacities: { 'fgos-code-implement': { kind: 'agent', target: 'agy-definitely-not-on-path-xyz' } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
  assert.throws(
    () => resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', capacityId: 'fgos-code-implement', fgosDir: dir }),
    RunnerConfigError,
  );
});

test('resolveExecutorCommand resolves a metadata-only kind:"cli" capacity straight through to the global executor for the command (executors.<tier> is retired, no intermediate stop)', () => {
  const dir = mkTempDir();
  initStore(dir);
  const cfg = {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    capacities: { 'fgos-code-implement': { kind: 'agent', target: 'agy', tier: 'standard', allowCrossProvider: true } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
  const resolved = resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', capacityId: 'fgos-code-implement', fgosDir: dir });
  assert.equal(resolved.command, '/global/executor');
});

test('resolveExecutorCommand skips the fgos-tool-query presence check entirely when fgosDir is omitted, even with a kind:"cli" capacity present', () => {
  const cfg = {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    capacities: { 'fgos-code-implement': { kind: 'agent', target: 'agy-not-registered-anywhere', allowCrossProvider: true } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
  assert.doesNotThrow(() =>
    resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', capacityId: 'fgos-code-implement' }),
  );
});

// --- presence/cross-provider gate predicate (D13, tsk-592):
// kind === 'cli' -> kind !== 'task' -- mcp/skill/http/binary capacities are
// now gated the same way a kind:"cli" capacity always has been ------------

for (const kind of ['mcp', 'skill', 'http', 'binary']) {
  test(`resolveExecutorCommand throws a RunnerConfigError when a kind:"${kind}" capacity is not registered and fgosDir is given (D13)`, () => {
    const dir = mkTempDir();
    initStore(dir);
    const cfg = {
      executor: { command: '/global/executor', args: ['{prompt}'] },
      capacities: { 'fgos-code-implement': { kind, target: 'agy' } },
      models: { standard: 'sonnet' },
      timeoutMs: 5000,
    };
    assert.throws(
      () => resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', capacityId: 'fgos-code-implement', fgosDir: dir }),
      RunnerConfigError,
    );
  });

  test(`resolveExecutorCommand throws a RunnerConfigError when a kind:"${kind}" capacity is registered but not present on this machine (D13)`, () => {
    const dir = mkTempDir();
    initStore(dir);
    const scanTarget = ['mcp', 'skill'].includes(kind) ? mkTempDir() : undefined;
    const cfg = {
      executor: { command: '/global/executor', args: ['{prompt}'] },
      capacities: { 'fgos-code-implement': { kind, target: 'agy-definitely-not-on-path-xyz' } },
      models: { standard: 'sonnet' },
      timeoutMs: 5000,
    };
    assert.throws(
      () => resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', capacityId: 'fgos-code-implement', fgosDir: dir }),
      RunnerConfigError,
    );
  });

  test(`resolveExecutorCommand throws when a kind:"${kind}" capacity resolves to a non-Claude command with no allowCrossProvider (D13)`, () => {
    const cfg = {
      executor: { command: 'claude', args: ['{prompt}'] },
      capacities: { 'fgos-code-implement': { kind, command: 'agy', args: ['{prompt}'] } },
      models: { standard: 'sonnet' },
      timeoutMs: 5000,
    };
    assert.throws(
      () => resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', capacityId: 'fgos-code-implement' }),
      RunnerConfigError,
    );
  });
}

test('resolveExecutorCommand still skips both the presence check and the cross-provider check for a kind:"task" capacity, even unregistered and non-Claude-shaped (D13: kind !== "task" excludes task by construction)', () => {
  const dir = mkTempDir();
  initStore(dir);
  const cfg = {
    executor: { command: 'claude', args: ['{prompt}'] },
    capacities: { 'my-agent-capacity': { kind: 'agent', agentType: 'code-simplifier' } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
  assert.doesNotThrow(() =>
    resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', capacityId: 'my-agent-capacity', fgosDir: dir }),
  );
});

// capacities.<id>.needs/for presence-matching (D5/D6, tsk-1o7, US-027) was
// retired at tsk-5tm-1 D1: resolveExecutorConfig no longer runs any
// presence/staleness gate at all (dead code -- 2/3 real entries were
// kind:"task", the third's needs added no signal beyond the OS's own
// ENOENT). The 2 tests that lived here asserted that gate's own
// capability-match behavior, which no longer exists to test -- removed
// rather than left passing for the wrong reason (trivial doesNotThrow with
// no gate underneath it).

// --- capacities.<id>.agentType (D1/D2, tsk-3sw): kind:"task" capacity with
// no own command/args resolves via a synthesized executor, Claude-only ---

function agentTypeCfg() {
  return {
    executor: {
      command: 'claude',
      args: ['-p', '{prompt}', '--model', '{model}', '--permission-mode', 'acceptEdits', '--allowedTools', 'Bash(git add:*),Bash(git commit:*)'],
    },
    capacities: { 'my-agent-capacity': { kind: 'agent', agentType: 'code-simplifier' } },
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

test('resolveExecutorCommand resolves an agentType capacity identically whether fgosDir is given (cli-dispatch/spawnWorker-style) or omitted (task-dispatch/executeCapacityCli-style)', () => {
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
        kind: 'agent',
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

test('resolveExecutorCommand falls through to the global executor for a capacity with neither command/args nor agentType', () => {
  // Claude command here, same reason as the sibling metadata-only test
  // above (D5, tsk-in1-4): unrelated to cross-provider governance.
  const cfg = {
    executor: { command: 'claude', args: ['{prompt}'] },
    capacities: { 'fgos-code-implement': { kind: 'agent', tier: 'standard' } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
  const resolved = resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', capacityId: 'fgos-code-implement' });
  assert.equal(resolved.command, 'claude');
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
      capacities: { 'my-agent-capacity': { kind: 'agent', agentType: 'code-simplifier' } },
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
      capacities: { 'my-agent-capacity': { kind: 'agent', agentType: '' } },
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
      capacities: { 'my-task-capacity': { kind: 'agent', agentType: 'code-simplifier', forceCliSpawn: true } },
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
      capacities: { 'my-task-capacity': { kind: 'agent', forceCliSpawn: 'yes' } },
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

// --- decideCapacityDispatchMechanism — capacities.<id>-specific convenience,
// derives hasNativeMechanism/forceCliSpawn from cfg.capacities[capacityId]
// without touching resolveExecutorConfig's own resolution path ---

test('decideCapacityDispatchMechanism resolves to in-process for a kind:"task" capacity when the caller declares live Task access', () => {
  const cfg = {
    executor: { command: 'claude', args: ['{prompt}'] },
    capacities: { 'judge-discovery': { kind: 'agent', agentType: 'judge' } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
  assert.equal(decideCapacityDispatchMechanism(cfg, 'judge-discovery', { hasLiveTaskAccess: true }), 'in-process');
});

test('decideCapacityDispatchMechanism falls back to out-of-process for a kind:"task" capacity when the caller has no live Task access', () => {
  const cfg = {
    executor: { command: 'claude', args: ['{prompt}'] },
    capacities: { 'judge-discovery': { kind: 'agent', agentType: 'judge' } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
  assert.equal(decideCapacityDispatchMechanism(cfg, 'judge-discovery', { hasLiveTaskAccess: false }), 'out-of-process');
  assert.equal(decideCapacityDispatchMechanism(cfg, 'judge-discovery'), 'out-of-process');
});

test('decideCapacityDispatchMechanism respects a capacity\'s own forceCliSpawn override even with live Task access', () => {
  const cfg = {
    executor: { command: 'claude', args: ['{prompt}'] },
    capacities: { 'judge-discovery': { kind: 'agent', agentType: 'judge', forceCliSpawn: true } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
  assert.equal(decideCapacityDispatchMechanism(cfg, 'judge-discovery', { hasLiveTaskAccess: true }), 'out-of-process');
});

test('decideCapacityDispatchMechanism always resolves out-of-process for a kind:"tool" capacity, regardless of live Task access (D5, tsk-in1-4: mechanical/never-native, even one that DOES dispatch via a real command — "agent" is the only native-eligible kind)', () => {
  const cfg = {
    executor: { command: 'claude', args: ['{prompt}'] },
    capacities: { 'submit-assist-classify': { kind: 'tool', command: 'agy', args: ['{prompt}'], allowCrossProvider: true } },
    models: { light: 'flash-3.5' },
    timeoutMs: 5000,
  };
  assert.equal(decideCapacityDispatchMechanism(cfg, 'submit-assist-classify', { hasLiveTaskAccess: true }), 'out-of-process');
});

test('decideCapacityDispatchMechanism resolves out-of-process for an unconfigured capacity, regardless of live Task access', () => {
  const cfg = { executor: { command: 'claude', args: ['{prompt}'] }, models: { standard: 'sonnet' }, timeoutMs: 5000 };
  assert.equal(decideCapacityDispatchMechanism(cfg, 'no-such-capacity', { hasLiveTaskAccess: true }), 'out-of-process');
});

// --- decideCapacityCli — the "decide <capacityId>" CLI-facing async
// function, mirrors executeCapacityCli's own repoRoot-skips-git-lookup
// test style ---

test('decideCapacityCli rejects with a usage RunnerConfigError when capacityId is missing', async () => {
  await assert.rejects(() => decideCapacityCli(undefined, { repoRoot: mkTempDir() }), RunnerConfigError);
  await assert.rejects(() => decideCapacityCli('', { repoRoot: mkTempDir() }), RunnerConfigError);
});

test('decideCapacityCli resolves "in-process" for a kind:"task" capacity when hasLiveTaskAccess is passed true, alongside its agentType', async () => {
  const root = mkTempDir();
  writeRunnerConfigFixture(root, {
    executor: { command: 'claude', args: ['{prompt}'] },
    capacities: { 'judge-discovery': { kind: 'agent', agentType: 'judge' } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const decided = await decideCapacityCli('judge-discovery', { repoRoot: root, hasLiveTaskAccess: true });
  assert.deepEqual(decided, { mechanism: 'in-process', agentType: 'judge', configured: true });
});

test('decideCapacityCli resolves "out-of-process" for the same kind:"task" capacity when hasLiveTaskAccess is omitted (safe default), still reporting its agentType', async () => {
  const root = mkTempDir();
  writeRunnerConfigFixture(root, {
    executor: { command: 'claude', args: ['{prompt}'] },
    capacities: { 'judge-discovery': { kind: 'agent', agentType: 'judge' } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const decided = await decideCapacityCli('judge-discovery', { repoRoot: root });
  assert.deepEqual(decided, { mechanism: 'out-of-process', agentType: 'judge', configured: true });
});

test('decideCapacityCli omits agentType entirely for a kind:"tool" capacity that declares none (tsk-3ik-3)', async () => {
  const root = mkTempDir();
  writeRunnerConfigFixture(root, {
    executor: { command: 'claude', args: ['{prompt}'] },
    capacities: { 'submit-assist-classify': { kind: 'tool', command: 'agy', args: ['{prompt}'], allowCrossProvider: true } },
    models: { light: 'flash-3.5' },
    timeoutMs: 5000,
  });
  const decided = await decideCapacityCli('submit-assist-classify', { repoRoot: root, hasLiveTaskAccess: true });
  assert.deepEqual(decided, { mechanism: 'out-of-process', configured: true });
  assert.ok(!('agentType' in decided));
});

// --- decideCapacityCli: --needs-soul (tsk-60f D2) — the caller's own
// self-declaration that it is about to fire its own Agent/Task tool with
// no capacity or work item to name; only consulted once capacityId/purpose/
// work all come up empty, and generalizes --work's own pre-existing
// hasExplicitCapacity===false default (below) to every door ------------------

test('decideCapacityCli defaults to native dispatch for a bare --needs-soul call with no capacity/purpose/work to name, honoring hasLiveTaskAccess', async () => {
  const root = mkTempDir();
  writeRunnerConfigFixture(root, {
    executor: { command: 'claude', args: ['{prompt}'] },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const withAccess = await decideCapacityCli(undefined, { repoRoot: root, needsSoul: true, hasLiveTaskAccess: true });
  assert.deepEqual(withAccess, { mechanism: 'in-process', configured: false });
  const withoutAccess = await decideCapacityCli(undefined, { repoRoot: root, needsSoul: true });
  assert.deepEqual(withoutAccess, { mechanism: 'out-of-process', configured: false });
});

test('decideCapacityCli --needs-soul defaults to native dispatch for an unregistered --for purpose, instead of "unavailable"', async () => {
  const root = mkTempDir();
  writeRunnerConfigFixture(root, {
    executor: { command: 'claude', args: ['{prompt}'] },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const decided = await decideCapacityCli(undefined, { repoRoot: root, for: 'general-purpose', needsSoul: true, hasLiveTaskAccess: true });
  assert.deepEqual(decided, { mechanism: 'in-process', configured: false });
});

test('decideCapacityCli --needs-soul never overrides a real registered purpose match -- a real capacity still wins', async () => {
  const root = mkTempDir();
  writeRunnerConfigFixture(root, {
    executor: { command: 'claude', args: ['{prompt}'] },
    capabilities: { judge: {} },
    capacities: { gather: { kind: 'tool', for: ['judge'], command: 'agy', args: ['{prompt}'], allowCrossProvider: true } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const decided = await decideCapacityCli(undefined, { repoRoot: root, for: 'judge', needsSoul: true, hasLiveTaskAccess: true });
  assert.deepEqual(decided, { mechanism: 'out-of-process', capacityId: 'gather', configured: true });
});

test('decideCapacityCli throws a usage RunnerConfigError when capacityId/--for/--work/--needs-soul are all missing', async () => {
  await assert.rejects(() => decideCapacityCli(undefined, { repoRoot: mkTempDir() }), RunnerConfigError);
});

// --- decideCapacityCli: MCP hand-back (tsk-45f D10) -- a tool-kind capacity
// with an mcp invocation's own "tools" map hands back mcpTool instead of
// resolving out-of-process -------------------------------------------------

test('decideCapacityCli hands back mcpTool (mechanism upgraded to in-process) for a --for purpose matching an mcp invocation\'s tools map -- the real gitnexus/impact-analysis case', async () => {
  const root = mkTempDir();
  writeRunnerConfigFixture(root, {
    executor: { command: 'claude', args: ['{prompt}'] },
    capabilities: { 'impact-analysis': {} },
    capacities: {
      gitnexus: {
        kind: 'tool',
        for: ['impact-analysis'],
        invocations: [{ via: 'mcp', command: 'mcp:gitnexus', tools: { 'impact-analysis': 'mcp__gitnexus__impact' } }],
      },
    },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const decided = await decideCapacityCli(undefined, { repoRoot: root, for: 'impact-analysis', hasLiveTaskAccess: true });
  assert.deepEqual(decided, { mechanism: 'in-process', mcpTool: 'mcp__gitnexus__impact', configured: true, capacityId: 'gitnexus' });
});

test('decideCapacityCli hands back mcpTool for a direct capacityId call with no --for, using the capacity\'s own sole "for" entry', async () => {
  const root = mkTempDir();
  writeRunnerConfigFixture(root, {
    executor: { command: 'claude', args: ['{prompt}'] },
    capabilities: { 'impact-analysis': {} },
    capacities: {
      gitnexus: {
        kind: 'tool',
        for: ['impact-analysis'],
        invocations: [{ via: 'mcp', command: 'mcp:gitnexus', tools: { 'impact-analysis': 'mcp__gitnexus__impact' } }],
      },
    },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const decided = await decideCapacityCli('gitnexus', { repoRoot: root, hasLiveTaskAccess: true });
  assert.deepEqual(decided, { mechanism: 'in-process', mcpTool: 'mcp__gitnexus__impact', configured: true });
});

test('decideCapacityCli never hands back mcpTool when the requested purpose has no entry in the invocation\'s tools map -- stays out-of-process', async () => {
  const root = mkTempDir();
  writeRunnerConfigFixture(root, {
    executor: { command: 'claude', args: ['{prompt}'] },
    capabilities: { 'impact-analysis': {}, other: {} },
    capacities: {
      gitnexus: {
        kind: 'tool',
        for: ['impact-analysis', 'other'],
        invocations: [{ via: 'mcp', command: 'mcp:gitnexus', tools: { 'impact-analysis': 'mcp__gitnexus__impact' } }],
      },
    },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const decided = await decideCapacityCli(undefined, { repoRoot: root, for: 'other', hasLiveTaskAccess: true });
  assert.deepEqual(decided, { mechanism: 'out-of-process', capacityId: 'gitnexus', configured: true });
});

test('decideCapacityCli never hands back mcpTool for a direct capacityId call when the capacity names more than one "for" entry -- ambiguous, no purpose to disambiguate', async () => {
  const root = mkTempDir();
  writeRunnerConfigFixture(root, {
    executor: { command: 'claude', args: ['{prompt}'] },
    capabilities: { 'impact-analysis': {}, other: {} },
    capacities: {
      gitnexus: {
        kind: 'tool',
        for: ['impact-analysis', 'other'],
        invocations: [{ via: 'mcp', command: 'mcp:gitnexus', tools: { 'impact-analysis': 'mcp__gitnexus__impact' } }],
      },
    },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const decided = await decideCapacityCli('gitnexus', { repoRoot: root, hasLiveTaskAccess: true });
  assert.deepEqual(decided, { mechanism: 'out-of-process', configured: true });
});

test('decideCapacityCli never hands back mcpTool for an agent-kind capacity -- agentType always wins, mcpTool and agentType are mutually exclusive', async () => {
  const root = mkTempDir();
  writeRunnerConfigFixture(root, {
    executor: { command: 'claude', args: ['{prompt}'] },
    capabilities: { judge: {} },
    capacities: { 'judge-discovery': { kind: 'agent', agentType: 'judge', for: ['judge'] } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const decided = await decideCapacityCli(undefined, { repoRoot: root, for: 'judge', hasLiveTaskAccess: true });
  assert.deepEqual(decided, { mechanism: 'in-process', agentType: 'judge', configured: true, capacityId: 'judge-discovery' });
  assert.equal('mcpTool' in decided, false);
});

test('the "decide" CLI entry point hands back mcpTool for --for impact-analysis against a real mcp tools map', () => {
  const { repoRoot } = mkTempGitRepo();
  writeRunnerConfigFixture(repoRoot, {
    executor: { command: 'claude', args: ['{prompt}'] },
    capabilities: { 'impact-analysis': {} },
    capacities: {
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
  assert.deepEqual(JSON.parse(result.stdout), { mechanism: 'in-process', mcpTool: 'mcp__gitnexus__impact', configured: true, capacityId: 'gitnexus' });
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
test('the "decide" CLI entry point (node src/runner/dispatch.mjs decide <capacityId>) prints {mechanism} JSON to stdout for a real spawned invocation against an isolated repo\'s own .fgos/config.json', () => {
  const { repoRoot } = mkTempGitRepo();
  writeRunnerConfigFixture(repoRoot, { executor: { command: 'claude', args: ['{prompt}'] }, models: { standard: 'sonnet' }, timeoutMs: 5000 });
  const dispatchPath = path.resolve('src/runner/dispatch.mjs');
  const result = spawnSync(process.execPath, [dispatchPath, 'decide', 'no-such-capacity-configured'], { encoding: 'utf8', cwd: repoRoot });
  assert.equal(result.status, 0, result.stderr);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.mechanism, 'out-of-process');
});

test('the "decide" CLI entry point exits non-zero with a usage message when capacityId is omitted', () => {
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
  assert.doesNotMatch(result.stderr, /resolve <capacityId>/);
  assert.match(result.stderr, /execute <capacityId>/);
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

// --- tsk-62v: spawnWorker's additive capacityId/provider result fields (D7) ---

test('spawnWorker prints a "fgos: dispatch ..." chokepoint line to stderr before spawning, naming job/capacity/via/provider/model/tier', async () => {
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
  assert.match(captured, /fgos: dispatch job=fgos-coding-implement capacity=\(global executor\) via=cli-spawn provider=.+ model=sonnet tier=standard/);
  assert.equal(result.status, 0);
});

test('spawnWorker result carries capacityId and provider alongside every existing field, unaffected by tier/config unrelated to capacities', async () => {
  const dir = mkTempDir();
  const scriptPath = writeEchoExecutor(dir);
  const cfg = baseConfig([scriptPath, '{prompt}', '--model', '{model}']);

  const result = await spawnWorker(sampleWork(), cfg, mkTempDir());

  assert.equal(result.capacityId, 'fgos-coding-implement');
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
  assert.equal(result.capacityId, 'fgos-coding-implement');
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
  const scriptPath = writeEchoExecutor(dir);
  const cfg = {
    executor: { command: process.execPath, args: [scriptPath, '{prompt}'] },
    capacities: { 'fgos-coding-implement': { kind: 'agent', tier: 'standard', allowCrossProvider: true } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };

  const result = await spawnWorker(sampleWork(), cfg, mkTempDir(), { fgosDir });
  assert.equal(result.capacityId, 'fgos-coding-implement');

  const cfgUnregistered = {
    executor: { command: process.execPath, args: [scriptPath, '{prompt}'] },
    capacities: { 'fgos-coding-implement': { kind: 'agent', target: 'not-registered' } },
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
    capacities: { 'fgos-code-implement': { kind: 'agent', command: 'agy', args: ['{prompt}'] } },
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
    capacities: { 'fgos-code-implement': { kind: 'agent', command: 'agy', args: ['{prompt}'], allowCrossProvider: true } },
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
    capacities: { 'fgos-code-implement': { kind: 'agent' } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
  const resolved = resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', capacityId: 'fgos-code-implement' });
  assert.equal(resolved.command, 'claude');
});

test('resolveExecutorCommand never requires allowCrossProvider for a kind:"cli" capacity that resolves to Claude\'s own CLI', () => {
  const cfg = {
    executor: { command: 'claude', args: ['{prompt}'] },
    capacities: { 'fgos-code-implement': { kind: 'agent', command: 'claude', args: ['{prompt}'] } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
  const resolved = resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', capacityId: 'fgos-code-implement' });
  assert.equal(resolved.command, 'claude');
});

test('resolveExecutorCommand cross-provider governance is kind-independent (D5, tsk-in1-4): a kind:"tool" capacity resolving to a non-Claude command via its own flat command/args still needs allowCrossProvider — no kind alone ever exempts it, only an agentType-resolved path does (kind:"task" used to be the exempt-by-kind value; retired)', () => {
  const cfg = {
    executor: { command: 'claude', args: ['{prompt}'] },
    capacities: { distill: { kind: 'tool', command: 'agy', args: ['{prompt}'] } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
  assert.throws(
    () => resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', capacityId: 'distill' }),
    RunnerConfigError,
  );
  cfg.capacities.distill.allowCrossProvider = true;
  const resolved = resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', capacityId: 'distill' });
  assert.equal(resolved.command, 'agy');
});

test('resolveExecutorCommand exempts an agentType-resolved capacity from cross-provider governance regardless of kind — it always reuses the global executor\'s own command (always Claude in practice), never a real non-Claude backend', () => {
  const cfg = {
    executor: { command: 'claude', args: ['{prompt}'] },
    capacities: { 'my-agent': { kind: 'agent', agentType: 'general-purpose' } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
  const resolved = resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', capacityId: 'my-agent' });
  assert.equal(resolved.command, 'claude');
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

test('resolveExecutorCommand throws for a non-Claude "cli" capacity even when fgosDir is given (cross-provider governance is independent of the retired presence gate, tsk-5tm-1 D1)', () => {
  const dir = mkTempDir();
  initStore(dir);
  const cfg = {
    executor: { command: 'claude', args: ['{prompt}'] },
    capacities: { 'fgos-code-implement': { kind: 'agent', command: 'agy', args: ['{prompt}'] } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
  assert.throws(
    () =>
      resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', capacityId: 'fgos-code-implement', fgosDir: dir }),
    RunnerConfigError,
  );
});

// --- tsk-60f D4: `resolveCapacityCli` / the "resolve <capacityId>" CLI
// subcommand (tsk-5l2-1) were retired -- 0 production consumers (confirmed
// live via `impact({target:"resolveCapacityCli",direction:"upstream"})`:
// LOW risk, 1 direct caller, the CLI branch itself). The behavior these
// tests used to prove that has no `executeCapacityCli` equivalent yet
// (providerModel via modelForTier, D9 tsk-5tm; --tier/--model override,
// tsk-2k1 D10; gate-carries propagation) is ported below onto
// `executeCapacityCli`/the "execute" CLI subcommand -- everything else this
// cluster used to test (usage errors, purpose-not-registered, the
// cross-provider-gate RunnerConfigError, a real spawn printing JSON, the
// CLI's own usage-error exit) already has an `executeCapacityCli`-native
// test of its own (below, and the "tsk-5tm-3 D5" cluster right after this
// one) -- ported once, not duplicated.

function writeRunnerConfigFixture(root, cfg) {
  fs.mkdirSync(path.join(root, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(root, '.fgos', 'config.json'), JSON.stringify({ runner: cfg }, null, 2));
}

test('executeCapacityCli resolves a cross-provider capacity\'s own providerModel through modelForTier, picking that provider\'s model over the default (claude) policy (D9\'s reported agy/Gemini bug)', async () => {
  const dir = mkTempDir();
  const scriptPath = writeEchoExecutor(dir);
  const root = mkTempDir();
  writeRunnerConfigFixture(root, {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    capacities: {
      agy: { kind: 'agent', command: process.execPath, provider: 'agy', args: [scriptPath, '--model', '{model}', '{prompt}'], allowCrossProvider: true, providerModel: 'gemini' },
    },
    modelPolicies: {
      claude: { standard: 'sonnet' },
      gemini: { standard: 'gemini-pro' },
    },
    timeoutMs: 5000,
  });
  const result = await executeCapacityCli('agy', { prompt: 'classify this', repoRoot: root, tier: 'standard' });
  assert.equal(result.mechanism, 'out-of-process');
  assert.equal(result.provider, 'agy');
  assert.equal(result.model, 'gemini-pro');
  const payload = JSON.parse(result.stdout);
  assert.deepEqual(payload.args, ['--model', 'gemini-pro', 'classify this']);
});

test('executeCapacityCli falls back to the global executor when the capacityId is not in cfg.capacities at all — never throws', async () => {
  const dir = mkTempDir();
  const scriptPath = writeEchoExecutor(dir);
  const root = mkTempDir();
  writeRunnerConfigFixture(root, {
    executor: { command: process.execPath, args: [scriptPath, '{prompt}'] },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const result = await executeCapacityCli('submit-assist-classify', { prompt: 'classify this', repoRoot: root });
  assert.equal(result.mechanism, 'out-of-process');
  assert.equal(result.provider, process.execPath);
  assert.equal(result.model, 'sonnet');
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.args[0], 'classify this');
});

test('executeCapacityCli honors a caller-supplied model override over both the capacity\'s own model and the computed modelForTier default', async () => {
  const dir = mkTempDir();
  const scriptPath = writeEchoExecutor(dir);
  const root = mkTempDir();
  writeRunnerConfigFixture(root, {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    capacities: { 'submit-assist-classify': { kind: 'agent', command: process.execPath, provider: 'agy', args: [scriptPath, '{model}:{prompt}'], tier: 'light', model: 'flash-3.5', allowCrossProvider: true } },
    models: { light: 'flash-3.5', standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const result = await executeCapacityCli('submit-assist-classify', { prompt: 'classify this', repoRoot: root, model: 'opus' });
  assert.equal(result.model, 'opus');
  const payload = JSON.parse(result.stdout);
  assert.deepEqual(payload.args, ['opus:classify this']);
});

test('executeCapacityCli honors a caller-supplied tier override, feeding it into modelForTier when no model is also supplied', async () => {
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
  // at all (the pre-existing `capacity?.tier ?? DEFAULTS.tier` fallback
  // already lands on 'standard' with no capacity match), so it would not
  // actually prove the override path works.
  const result = await executeCapacityCli('no-such-capacity', { prompt: 'x', repoRoot: root, tier: 'light' });
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
    [dispatchPath, 'execute', 'no-such-capacity-configured', '--prompt', 'hello', '--model', 'a-specific-override-model'],
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
    [dispatchPath, 'execute', 'no-such-capacity-configured', '--prompt', 'hello', '--tier', 'light'],
    { encoding: 'utf8', cwd: repoRoot },
  );
  assert.equal(result.status, 0, result.stderr);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.model, 'haiku');
});

// --- tsk-5tm-3 D5: `executeCapacityCli` / `execute <capacityId>` — the
// self-execute counterpart to `resolve` above, matching marketing-cockpit's
// `run_task()`: self-execute every adapter-resolvable case via
// EXECUTOR_ADAPTERS, hand back {mechanism,agentType,prompt} only for the
// one case dispatch (a passive CLI) cannot do itself (native, live
// session) -------------------------------------------------------------

test('executeCapacityCli rejects with a usage RunnerConfigError when both capacityId and --for are missing', async () => {
  await assert.rejects(() => executeCapacityCli(undefined, { repoRoot: mkTempDir() }), RunnerConfigError);
  await assert.rejects(() => executeCapacityCli('', { repoRoot: mkTempDir() }), RunnerConfigError);
});

test('executeCapacityCli hands back {mechanism:"in-process",agentType,prompt} for a kind:"task" capacity when the caller declares live Task access — self-executes nothing, since dispatch has no Task tool of its own to call', async () => {
  const root = mkTempDir();
  writeRunnerConfigFixture(root, {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    capacities: { 'my-agent-capacity': { kind: 'agent', agentType: 'code-simplifier' } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const result = await executeCapacityCli('my-agent-capacity', { repoRoot: root, prompt: 'do the thing', hasLiveTaskAccess: true });
  assert.deepEqual(result, { mechanism: 'in-process', agentType: 'code-simplifier', prompt: 'do the thing' });
});

test('executeCapacityCli falls to out-of-process and self-executes (never hands back) for a kind:"task" capacity with no live Task access — the safe default', async () => {
  const dir = mkTempDir();
  const scriptPath = writeEchoExecutor(dir);
  const root = mkTempDir();
  writeRunnerConfigFixture(root, {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    capacities: { 'my-agent-capacity': { kind: 'agent', command: process.execPath, args: [scriptPath, '{prompt}'], allowCrossProvider: true } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const result = await executeCapacityCli('my-agent-capacity', { repoRoot: root, prompt: 'hello' });
  assert.equal(result.mechanism, 'out-of-process');
  assert.equal(result.status, 0);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.args[0], 'hello');
});

test('executeCapacityCli self-executes a kind:"cli" capacity via EXECUTOR_ADAPTERS and returns the real result — never the bare {command,args} shape `resolve` hands back for the caller to run itself', async () => {
  const dir = mkTempDir();
  const scriptPath = writeEchoExecutor(dir);
  const root = mkTempDir();
  writeRunnerConfigFixture(root, {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    capacities: { 'submit-assist-classify': { kind: 'agent', command: process.execPath, args: [scriptPath, '{prompt}'], allowCrossProvider: true } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const result = await executeCapacityCli('submit-assist-classify', { repoRoot: root, prompt: 'classify this' });
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

test('executeCapacityCli prints a "fgos: dispatch ..." chokepoint line to stderr for the in-process branch, naming capability/capacity/via/agentType', async () => {
  const root = mkTempDir();
  writeRunnerConfigFixture(root, {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    capabilities: { review: {} },
    capacities: { 'my-agent-capacity': { kind: 'agent', agentType: 'code-simplifier', for: ['review'] } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const original = process.stderr.write.bind(process.stderr);
  let captured = '';
  process.stderr.write = (chunk) => { captured += chunk; return true; };
  try {
    await executeCapacityCli('my-agent-capacity', { repoRoot: root, prompt: 'do the thing', hasLiveTaskAccess: true });
  } finally {
    process.stderr.write = original;
  }
  assert.match(captured, /fgos: dispatch capability=review capacity=my-agent-capacity via=in-process agentType=code-simplifier provider=n\/a model=n\/a tier=n\/a/);
});

test('executeCapacityCli prints a "fgos: dispatch ..." chokepoint line to stderr for the out-of-process (real spawn) branch, naming capability/capacity/via/provider/model/tier', async () => {
  const dir = mkTempDir();
  const scriptPath = writeEchoExecutor(dir);
  const root = mkTempDir();
  writeRunnerConfigFixture(root, {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    capabilities: { classification: {} },
    capacities: { 'submit-assist-classify': { kind: 'agent', command: process.execPath, args: [scriptPath, '{prompt}'], allowCrossProvider: true, for: ['classification'] } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const original = process.stderr.write.bind(process.stderr);
  let captured = '';
  process.stderr.write = (chunk) => { captured += chunk; return true; };
  try {
    await executeCapacityCli('submit-assist-classify', { repoRoot: root, prompt: 'classify this' });
  } finally {
    process.stderr.write = original;
  }
  assert.match(captured, new RegExp(`fgos: dispatch capability=classification capacity=submit-assist-classify via=cli-spawn provider=${process.execPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} model=sonnet tier=standard`));
});

test('executeCapacityCli resolves purpose-based (--for) the same way a positional capacityId does, plus the resolved capacityId, whether the result is self-executed or handed back', async () => {
  const dir = mkTempDir();
  const scriptPath = writeEchoExecutor(dir);
  const root = mkTempDir();
  writeRunnerConfigFixture(root, {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    capabilities: { judge: {} },
    capacities: { 'judge-decompose': { kind: 'agent', for: ['judge'], command: process.execPath, args: [scriptPath, '{prompt}'], allowCrossProvider: true } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const byPurpose = await executeCapacityCli(undefined, { repoRoot: root, for: 'judge', prompt: 'p' });
  const byName = await executeCapacityCli('judge-decompose', { repoRoot: root, prompt: 'p' });
  assert.equal(byPurpose.capacityId, 'judge-decompose');
  assert.equal(byPurpose.status, 0);
  assert.equal(byName.capacityId, undefined);
});

test('executeCapacityCli throws when no capacity is registered for the given purpose — nothing left to execute', async () => {
  const root = mkTempDir();
  writeRunnerConfigFixture(root, {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  await assert.rejects(() => executeCapacityCli(undefined, { repoRoot: root, for: 'judge', prompt: 'x' }), RunnerConfigError);
});

test('executeCapacityCli propagates resolveExecutorConfig\'s own RunnerConfigError for a kind:"cli" capacity resolving cross-provider with no allowCrossProvider', async () => {
  const dir = mkTempDir();
  const scriptPath = writeEchoExecutor(dir);
  const root = mkTempDir();
  writeRunnerConfigFixture(root, {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    capacities: { 'submit-assist-classify': { kind: 'agent', command: scriptPath, args: ['{prompt}'] } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  await assert.rejects(() => executeCapacityCli('submit-assist-classify', { repoRoot: root, prompt: 'x' }), RunnerConfigError);
});

test('the "execute" CLI entry point self-executes a real adapter-resolvable capacity and prints the real result as JSON, never bare {command,args}', () => {
  const { repoRoot } = mkTempGitRepo();
  const dir = mkTempDir();
  const scriptPath = writeEchoExecutor(dir);
  writeRunnerConfigFixture(repoRoot, {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    capacities: { 'cli-capacity': { kind: 'agent', command: process.execPath, args: [scriptPath, '{prompt}'], allowCrossProvider: true } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const dispatchPath = path.resolve('src/runner/dispatch.mjs');
  const result = spawnSync(process.execPath, [dispatchPath, 'execute', 'cli-capacity', '--prompt', 'hello-from-cli'], {
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

test('the "execute" CLI entry point hands back {mechanism:"in-process",...} for a live-task-access native capacity, never spawning anything', () => {
  const { repoRoot } = mkTempGitRepo();
  writeRunnerConfigFixture(repoRoot, {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    capacities: { 'native-capacity': { kind: 'agent', agentType: 'code-simplifier' } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const dispatchPath = path.resolve('src/runner/dispatch.mjs');
  const result = spawnSync(
    process.execPath,
    [dispatchPath, 'execute', 'native-capacity', '--prompt', 'do it', '--has-live-task-access'],
    { encoding: 'utf8', cwd: repoRoot },
  );
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), { mechanism: 'in-process', agentType: 'code-simplifier', prompt: 'do it' });
});

test('the "execute" CLI entry point exits non-zero with a usage message when capacityId is omitted', () => {
  const dispatchPath = path.resolve('src/runner/dispatch.mjs');
  const result = spawnSync(process.execPath, [dispatchPath, 'execute'], { encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /usage: node src\/runner\/dispatch\.mjs execute/);
});

// --- capacities.<id>.carries (D15, tsk-5td; first real consumer tsk-2ie5/
// tsk-2c1) — closed enum at config-load, plus a real pre-dispatch gate on
// the ACTUAL content class a caller declares it's sending ------------------

test('CAPACITY_CARRIES is exactly the two D15-locked values, never a free string vocabulary', () => {
  assert.deepEqual(CAPACITY_CARRIES, ['user-text', 'repo-content']);
});

test('loadRunnerConfig accepts a "capacities.<id>" entry with a valid carries value', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'carries-ok.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      capabilities: { judge: {} },
      capacities: { gather: { kind: 'agent', command: 'agy', args: ['{prompt}'], for: ['judge'], carries: 'repo-content', allowCrossProvider: true } },
      models: { standard: 'sonnet' },
      timeoutMs: 1000,
    }),
  );
  assert.doesNotThrow(() => loadRunnerConfig(configPath));
});

// --- tsk-45f D11: "capability" (the tool-registry's own field) now gets the
// same catalog check "for" already had -------------------------------------

test('loadRunnerConfig accepts a "capacities.<id>" entry whose "capability" is declared in "capabilities"', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'capability-ok.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      capabilities: { 'impact-analysis': {} },
      capacities: { gitnexus: { kind: 'tool', capability: 'impact-analysis', invocations: [{ via: 'mcp', command: 'mcp:gitnexus' }] } },
      models: { standard: 'sonnet' },
      timeoutMs: 1000,
    }),
  );
  assert.doesNotThrow(() => loadRunnerConfig(configPath));
});

test('loadRunnerConfig rejects a "capacities.<id>" entry whose "capability" is not declared in "capabilities"', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'capability-bad.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      capacities: { gitnexus: { kind: 'tool', capability: 'not-declared-anywhere', invocations: [{ via: 'mcp', command: 'mcp:gitnexus' }] } },
      models: { standard: 'sonnet' },
      timeoutMs: 1000,
    }),
  );
  assert.throws(() => loadRunnerConfig(configPath), RunnerConfigError);
});

test('loadRunnerConfig rejects a "capacities.<id>" entry whose "capability" is not a non-empty string', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'capability-not-string.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      capacities: { gitnexus: { kind: 'tool', capability: 123, invocations: [{ via: 'mcp', command: 'mcp:gitnexus' }] } },
      models: { standard: 'sonnet' },
      timeoutMs: 1000,
    }),
  );
  assert.throws(() => loadRunnerConfig(configPath), RunnerConfigError);
});

test('loadRunnerConfig accepts a "capacities.<id>" entry naming neither "for" nor "capability" (a plain dispatch capacity)', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'no-capability.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      capacities: { agy: { kind: 'agent', command: 'agy', args: ['{prompt}'], allowCrossProvider: true } },
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
      capacities: {
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
      capacities: {
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
      capacities: {
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
      capacities: { gitnexus: { kind: 'tool', invocations: [{ via: 'mcp', command: 'mcp:gitnexus' }] } },
      models: { standard: 'sonnet' },
      timeoutMs: 1000,
    }),
  );
  assert.doesNotThrow(() => loadRunnerConfig(configPath));
});

test('loadRunnerConfig rejects a "capacities.<id>" entry whose carries is not one of CAPACITY_CARRIES', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'bad-carries.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      capacities: { gather: { kind: 'agent', command: 'agy', args: ['{prompt}'], carries: 'secrets' } },
      models: { standard: 'sonnet' },
      timeoutMs: 1000,
    }),
  );
  assert.throws(() => loadRunnerConfig(configPath), RunnerConfigError);
});

function carriesCfg(carries) {
  return {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    capacities: { gather: { kind: 'agent', command: 'agy', args: ['{prompt}'], for: ['judge'], carries, allowCrossProvider: true } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
}

test('resolveExecutorCommand throws when a capacity declares carries but the caller declares no contentCarries at all (fail closed, never silently allow)', () => {
  const cfg = carriesCfg('user-text');
  assert.throws(
    () => resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', capacityId: 'gather' }),
    RunnerConfigError,
  );
});

test('resolveExecutorCommand throws when contentCarries is not one of CAPACITY_CARRIES', () => {
  const cfg = carriesCfg('repo-content');
  assert.throws(
    () => resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', capacityId: 'gather', contentCarries: 'nonsense' }),
    RunnerConfigError,
  );
});

test('resolveExecutorCommand refuses a "carries: user-text" capacity handed repo-content — refused before spawn (D15 verify item 8)', () => {
  const cfg = carriesCfg('user-text');
  assert.throws(
    () => resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', capacityId: 'gather', contentCarries: 'repo-content' }),
    RunnerConfigError,
  );
});

test('resolveExecutorCommand accepts a "carries: user-text" capacity handed user-text (exact match)', () => {
  const cfg = carriesCfg('user-text');
  assert.doesNotThrow(() =>
    resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', capacityId: 'gather', contentCarries: 'user-text' }),
  );
});

test('resolveExecutorCommand accepts a "carries: repo-content" capacity handed EITHER content class — the wider permission covers both', () => {
  const cfg = carriesCfg('repo-content');
  assert.doesNotThrow(() =>
    resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', capacityId: 'gather', contentCarries: 'user-text' }),
  );
  assert.doesNotThrow(() =>
    resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', capacityId: 'gather', contentCarries: 'repo-content' }),
  );
});

test('resolveExecutorCommand never triggers the carries gate for a capacity that declares no carries at all — byte-identical to every pre-D15 capacity', () => {
  const cfg = {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    capacities: { 'submit-assist-classify': { kind: 'agent', command: 'agy', args: ['{prompt}'], allowCrossProvider: true } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
  assert.doesNotThrow(() =>
    resolveExecutorCommand(cfg, { prompt: 'p', model: 'sonnet', tier: 'standard', capacityId: 'submit-assist-classify' }),
  );
});

// --- resolveCapacityIdForPurpose (D5/D6, tsk-1o7; first real consumer
// tsk-2ie5/tsk-2c1) — purpose-based binding, never by name ------------------

test('resolveCapacityIdForPurpose finds the capacity whose own "for" matches the purpose, regardless of the capacity id\'s own name', () => {
  // resolveCapacityIdForPurpose is a pure string-match over `for` -- it never
  // validates against CAPACITY_PURPOSES itself (that enum check only runs at
  // config-load time, validateCapacityShape) -- so a synthetic purpose value
  // ("review") proves the real invariant (match by field, not by id name)
  // without reviving "gather" as if it were still a live purpose (tsk-5tm-2
  // D6: retired, CAPACITY_PURPOSES is down to its one real value, "judge").
  const cfg = {
    capacities: {
      'totally-unrelated-name': { kind: 'agent', for: ['review'], command: 'agy' },
      'judge-decompose': { kind: 'agent', for: ['judge'] },
    },
  };
  assert.equal(resolveCapacityIdForPurpose(cfg, 'review'), 'totally-unrelated-name');
});

test('resolveCapacityIdForPurpose finds the capacity via a multi-value "for" array (D15, tsk-in1-4) — one executor serving several purposes at once', () => {
  const cfg = { capacities: { multi: { kind: 'agent', for: ['review', 'judge'], command: 'agy' } } };
  assert.equal(resolveCapacityIdForPurpose(cfg, 'review'), 'multi');
  assert.equal(resolveCapacityIdForPurpose(cfg, 'judge'), 'multi');
});

test('resolveCapacityIdForPurpose returns null when no capacity declares that purpose — a legitimate state, never thrown', () => {
  const cfg = { capacities: { 'judge-decompose': { kind: 'agent', for: ['judge'] } } };
  assert.equal(resolveCapacityIdForPurpose(cfg, 'no-such-purpose-configured'), null);
});

test('resolveCapacityIdForPurpose returns null against an empty/missing capacities block', () => {
  assert.equal(resolveCapacityIdForPurpose({}, 'no-such-purpose-configured'), null);
  assert.equal(resolveCapacityIdForPurpose({ capacities: {} }, 'no-such-purpose-configured'), null);
});

// --- resolveCapacityAndOverrides (D1-D4, docs/history/capability-capacity-
// remodel/CONTEXT.md) -- the shared resolver every real cfg.capacities[id]
// lookup in this file now goes through: literal key first, then
// capabilities.<name>.prefer (symmetry required), then the plain "for"
// scan, then unconfigured -----------------------------------------------

test('resolveCapacityAndOverrides resolves a literal capacityId directly, unchanged from pre-this-item behavior -- the deep-customization escape hatch', () => {
  const cfg = { capacities: { agy: { kind: 'agent', command: 'agy' } } };
  const result = resolveCapacityAndOverrides(cfg, 'agy');
  assert.equal(result.capacityId, 'agy');
  assert.equal(result.capacity, cfg.capacities.agy);
  assert.equal(result.overrides, undefined);
  assert.equal(result.configured, true);
});

test('resolveCapacityAndOverrides resolves via capabilities.<name>.prefer when the preferred capacity declares a matching "for" (symmetry satisfied)', () => {
  const cfg = {
    capacities: { agy: { kind: 'agent', command: 'agy', for: ['fgos-coding-implement'] } },
    capabilities: { 'fgos-coding-implement': { prefer: 'agy' } },
  };
  const result = resolveCapacityAndOverrides(cfg, 'fgos-coding-implement');
  assert.equal(result.capacityId, 'agy');
  assert.equal(result.capacity, cfg.capacities.agy);
  assert.equal(result.configured, true);
});

test('resolveCapacityAndOverrides carries capabilities.<name>.overrides through, unapplied, for the caller to merge itself', () => {
  const cfg = {
    capacities: { agy: { kind: 'agent', command: 'agy', for: ['fgos-coding-implement'] } },
    capabilities: { 'fgos-coding-implement': { prefer: 'agy', overrides: { rigorOverrides: { standard: 'creative' } } } },
  };
  const result = resolveCapacityAndOverrides(cfg, 'fgos-coding-implement');
  assert.deepEqual(result.overrides, { rigorOverrides: { standard: 'creative' } });
});

test('resolveCapacityAndOverrides throws when "prefer" names a capacity that does not itself declare "for" including the capability name (symmetry violation)', () => {
  const cfg = {
    capacities: { agy: { kind: 'agent', command: 'agy' } }, // no "for" at all
    capabilities: { 'fgos-coding-implement': { prefer: 'agy' } },
  };
  assert.throws(() => resolveCapacityAndOverrides(cfg, 'fgos-coding-implement'), RunnerConfigError);
});

test('resolveCapacityAndOverrides throws when "prefer" names a capacity id that does not exist at all', () => {
  const cfg = { capabilities: { 'fgos-coding-implement': { prefer: 'no-such-capacity' } } };
  assert.throws(() => resolveCapacityAndOverrides(cfg, 'fgos-coding-implement'), RunnerConfigError);
});

test('resolveCapacityAndOverrides falls back to the plain "for" scan when no "prefer" is set -- unchanged resolveCapacityIdForPurpose behavior, wrapped', () => {
  const cfg = { capacities: { 'totally-unrelated-name': { kind: 'agent', command: 'agy', for: ['review'] } } };
  const result = resolveCapacityAndOverrides(cfg, 'review');
  assert.equal(result.capacityId, 'totally-unrelated-name');
  assert.equal(result.overrides, undefined);
});

test('resolveCapacityAndOverrides returns configured:false, capacityId:null when nothing resolves -- a legitimate state, never thrown', () => {
  const result = resolveCapacityAndOverrides({}, 'no-such-purpose-or-id');
  assert.equal(result.capacityId, null);
  assert.equal(result.configured, false);
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
      capacities: { agy: { kind: 'agent', command: 'agy', for: ['fgos-coding-implement'] } },
      capabilities: { 'fgos-coding-implement': { prefer: 'agy', overrides: { command: 'not-allowed' } } },
      modelPolicies: { claude: { standard: 'sonnet' } },
      timeoutMs: 1000,
    }),
  );
  assert.throws(() => loadRunnerConfig(configPath), RunnerConfigError);
});

test('loadRunnerConfig rejects capabilities.<name>.overrides.rigorOverrides via the SAME rule a capacity\'s own rigorOverrides already uses', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'bad-overrides-rigor.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      capacities: { agy: { kind: 'agent', command: 'agy', for: ['fgos-coding-implement'] } },
      capabilities: { 'fgos-coding-implement': { prefer: 'agy', overrides: { rigorOverrides: { standard: 'ultra-mega' } } } },
      modelPolicies: { claude: { standard: 'sonnet' } },
      timeoutMs: 1000,
    }),
  );
  assert.throws(() => loadRunnerConfig(configPath), RunnerConfigError);
});

test('loadRunnerConfig accepts a well-formed capabilities.<name>.prefer/overrides pair, symmetry satisfied', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'good-prefer-overrides.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      capacities: { agy: { kind: 'agent', command: 'agy', args: ['{prompt}'], for: ['fgos-coding-implement'] } },
      capabilities: { 'fgos-coding-implement': { description: 'code-implement work', prefer: 'agy', overrides: { rigorOverrides: { standard: 'creative' } } } },
      modelPolicies: { claude: { standard: 'sonnet' } },
      timeoutMs: 1000,
    }),
  );
  assert.doesNotThrow(() => loadRunnerConfig(configPath));
});

test('loadRunnerConfig rejects a load-time symmetry violation -- "prefer" names a real capacity that does not declare the matching "for" (config-load time, ahead of resolveCapacityAndOverrides\'s own resolve-time throw)', () => {
  const dir = mkTempDir();
  const configPath = path.join(dir, 'bad-symmetry.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: 'claude', args: ['{prompt}'] },
      capacities: { agy: { kind: 'agent', command: 'agy' } }, // no "for"
      capabilities: { 'fgos-coding-implement': { prefer: 'agy' } },
      modelPolicies: { claude: { standard: 'sonnet' } },
      timeoutMs: 1000,
    }),
  );
  assert.throws(() => loadRunnerConfig(configPath), RunnerConfigError);
});

// --- End-to-end: spawnWorker/executeCapacityCli/decideCapacityCli all
// resolve a purpose name via capabilities.<name>.prefer the same way a
// literal capacityId already did (D3's own real migration case) ----------

test('spawnWorker resolves model via capabilities.<name>.prefer + overrides -- the exact D4 gap (spawnWorker used to have its own separate lookup, distinct from resolveExecutorConfig)', async () => {
  const dir = mkTempDir();
  const scriptPath = writeEchoExecutor(dir);
  const cfg = {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    capacities: {
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

test('executeCapacityCli resolves a purpose-named capacityId via capabilities.<name>.prefer, spawning the real preferred capacity', async () => {
  const dir = mkTempDir();
  const scriptPath = writeEchoExecutor(dir);
  const root = mkTempDir();
  writeRunnerConfigFixture(root, {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    capacities: { agy: { kind: 'agent', command: process.execPath, args: [scriptPath, '{prompt}'], for: ['fgos-coding-implement'], allowCrossProvider: true } },
    capabilities: { 'fgos-coding-implement': { prefer: 'agy' } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const result = await executeCapacityCli('fgos-coding-implement', { repoRoot: root, prompt: 'do the thing' });
  assert.equal(result.mechanism, 'out-of-process');
  assert.equal(result.status, 0);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.args[0], 'do the thing');
});

test('decideCapacityCli resolves a purpose-named capacityId via capabilities.<name>.prefer -- "configured" reads true even though no literal capacities entry of that name exists', async () => {
  const root = mkTempDir();
  writeRunnerConfigFixture(root, {
    executor: { command: 'claude', args: ['{prompt}'] },
    capacities: { agy: { kind: 'agent', command: 'agy', args: ['{prompt}'], for: ['fgos-coding-implement'] } },
    capabilities: { 'fgos-coding-implement': { prefer: 'agy' } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const decided = await decideCapacityCli('fgos-coding-implement', { repoRoot: root, hasLiveTaskAccess: false });
  assert.deepEqual(decided, { mechanism: 'out-of-process', configured: true });
});

// --- executeCapacityCli / decideCapacityCli: purpose-based (--for) binding,
// the mechanism a runtime-composed gather prompt actually resolves through
// since it has no pre-registered capacityId to name (tsk-2c1) --------------

test('decideCapacityCli resolves "unavailable" when nothing is registered for the given purpose — the expected default state before any gather capacity exists', async () => {
  const root = mkTempDir();
  writeRunnerConfigFixture(root, {
    executor: { command: 'claude', args: ['{prompt}'] },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const decided = await decideCapacityCli(undefined, { repoRoot: root, for: 'judge', hasLiveTaskAccess: true });
  assert.deepEqual(decided, { mechanism: 'unavailable', configured: false });
});

test('decideCapacityCli resolves purpose-based (--for) to the same result a positional capacityId would, plus the resolved capacityId', async () => {
  const root = mkTempDir();
  writeRunnerConfigFixture(root, {
    executor: { command: 'claude', args: ['{prompt}'] },
    capabilities: { judge: {} },
    capacities: { gather: { kind: 'tool', for: ['judge'], command: 'agy', args: ['{prompt}'], allowCrossProvider: true } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const byPurpose = await decideCapacityCli(undefined, { repoRoot: root, for: 'judge', hasLiveTaskAccess: true });
  const byName = await decideCapacityCli('gather', { repoRoot: root, hasLiveTaskAccess: true });
  assert.deepEqual(byPurpose, { mechanism: 'out-of-process', capacityId: 'gather', configured: true });
  // Positional-id path stays byte-identical (no capacityId field) — every
  // pre-tsk-2c1 caller/test already asserts this exact shape.
  assert.deepEqual(byName, { mechanism: 'out-of-process', configured: true });
});

// --- decideCapacityCli: work-item-shaped lookup (--work, D4/D12(iii),
// tsk-5tm-6) -- the lookup fgos-fanout needs to consult this protocol
// per-candidate before firing an Agent, instead of assuming native
// dispatch unconditionally --------------------------------------------------

test('capacityIdForWork is exported and resolves a coding-domain (or no-domain) work item to fgos-coding-implement, the same lookup spawnWorker already applies internally', () => {
  assert.equal(capacityIdForWork(sampleWork()), 'fgos-coding-implement');
});

test('decideCapacityCli resolves work-item-based (--work) to the same result a positional capacityId would, plus the resolved capacityId -- explicit capacities.<id> override case', async () => {
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
    capacities: { 'fgos-coding-implement': { kind: 'agent', agentType: 'general-purpose' } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const byWork = await decideCapacityCli(undefined, { repoRoot: root, work: 'tsk-fanout-candidate', hasLiveTaskAccess: true });
  const byName = await decideCapacityCli('fgos-coding-implement', { repoRoot: root, hasLiveTaskAccess: true });
  assert.deepEqual(byWork, { mechanism: 'in-process', agentType: 'general-purpose', capacityId: 'fgos-coding-implement', configured: true });
  // Positional-id path stays byte-identical (no capacityId field) -- every
  // pre-D4 caller/test already asserts this exact shape.
  assert.deepEqual(byName, { mechanism: 'in-process', agentType: 'general-purpose', configured: true });
});

test('decideCapacityCli resolves work-item-based (--work) to "in-process" by default when the resolved capacityId has NO explicit cfg.capacities entry -- the real, common fgos-fanout case (D4 fix): a coding-domain work item is a same-provider, soul-needing rootTask (0026 rule 2), never the generic "no capacity -> out-of-process" fallback a NAMED capacityId lookup keeps unchanged', async () => {
  const root = mkTempDir();
  const fgosDir = path.join(root, '.fgos');
  addWork(fgosDir, {
    id: 'tsk-fanout-unregistered',
    title: 'Fanout candidate with no capacities.<id> override',
    kind: 'task',
    status: 'todo',
    deps: [],
    risk: 'light',
    refs: [],
    verify: 'npm test',
  });
  writeRunnerConfigFixture(root, {
    executor: { command: 'claude', args: ['{prompt}'] },
    // No `capacities` block at all -- matches this repo's own real
    // .fgos/config.json, where none of the 14 fgos-coding-* skills are
    // registered as a capacities.<id> entry.
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const byWork = await decideCapacityCli(undefined, { repoRoot: root, work: 'tsk-fanout-unregistered', hasLiveTaskAccess: true });
  assert.deepEqual(byWork, { mechanism: 'in-process', capacityId: 'fgos-coding-implement', configured: false });
  // The SAME unregistered capacityId, looked up by NAME (not --work), keeps
  // its pre-D4 byte-identical "no capacity -> out-of-process" behavior --
  // only the work-item-shaped lookup gets the native-first default.
  const byName = await decideCapacityCli('fgos-coding-implement', { repoRoot: root, hasLiveTaskAccess: true });
  assert.deepEqual(byName, { mechanism: 'out-of-process', configured: false });
});

test('decideCapacityCli resolves work-item-based (--work) to "out-of-process" when the caller has no live Task access, even with no explicit cfg.capacities entry -- never claims in-process dishonestly', async () => {
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
  const byWork = await decideCapacityCli(undefined, { repoRoot: root, work: 'tsk-fanout-no-live-access' });
  assert.deepEqual(byWork, { mechanism: 'out-of-process', capacityId: 'fgos-coding-implement', configured: false });
});

test('decideCapacityCli throws a RunnerConfigError when --work names a work item that does not exist -- never silently "unavailable" (a typo/stale id is a real usage error, unlike an unconfigured purpose)', async () => {
  const root = mkTempDir();
  fs.mkdirSync(path.join(root, '.fgos'), { recursive: true });
  writeRunnerConfigFixture(root, {
    executor: { command: 'claude', args: ['{prompt}'] },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  await assert.rejects(
    () => decideCapacityCli(undefined, { repoRoot: root, work: 'no-such-work-item' }),
    RunnerConfigError,
  );
});

test('a positional capacityId still wins over --work when both are somehow passed, same precedence --for already has', async () => {
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
    capacities: {
      'fgos-coding-implement': { kind: 'agent', agentType: 'general-purpose' },
      explicit: { kind: 'tool', command: 'agy', args: ['{prompt}'], allowCrossProvider: true },
    },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const decided = await decideCapacityCli('explicit', { repoRoot: root, work: 'tsk-fanout-candidate-2', hasLiveTaskAccess: true });
  assert.deepEqual(decided, { mechanism: 'out-of-process', configured: true });
});

test('the "decide" CLI entry point resolves --work <id> the same way as a positional capacityId', () => {
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
    capacities: { 'fgos-coding-implement': { kind: 'agent', agentType: 'general-purpose' } },
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
  assert.deepEqual(JSON.parse(result.stdout), { mechanism: 'in-process', agentType: 'general-purpose', capacityId: 'fgos-coding-implement', configured: true });
});

// tsk-60f D4: the two resolveCapacityCli usage-error tests this cluster
// used to carry here are dropped, not ported -- `executeCapacityCli` already
// has its own native equivalent of both (the "both capacityId and --for are
// missing" cluster above, and "throws when no capacity is registered for
// the given purpose" in the tsk-5tm-3 D5 cluster). Only the gate-carries
// propagation coverage genuinely had no execute-native equivalent yet.

test('executeCapacityCli resolves purpose-based (--for) to the same command a positional capacityId would, plus the resolved capacityId; carries repo-content clears the gate', async () => {
  const dir = mkTempDir();
  const scriptPath = writeEchoExecutor(dir);
  const root = mkTempDir();
  writeRunnerConfigFixture(root, {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    capabilities: { judge: {} },
    capacities: { gather: { kind: 'agent', for: ['judge'], carries: 'repo-content', command: process.execPath, provider: 'agy', args: [scriptPath, '{prompt}'], allowCrossProvider: true } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const byPurpose = await executeCapacityCli(undefined, { repoRoot: root, for: 'judge', carries: 'repo-content', prompt: 'p' });
  const byName = await executeCapacityCli('gather', { repoRoot: root, carries: 'repo-content', prompt: 'p' });
  assert.equal(byPurpose.capacityId, 'gather');
  assert.equal(byPurpose.provider, 'agy');
  assert.equal(byPurpose.model, 'sonnet');
  assert.equal(byName.capacityId, undefined);
  assert.equal(byName.provider, 'agy');
});

test('executeCapacityCli propagates the carries refusal for a purpose-resolved capacity exactly like a name-resolved one', async () => {
  const root = mkTempDir();
  writeRunnerConfigFixture(root, {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    capabilities: { judge: {} },
    capacities: { gather: { kind: 'agent', for: ['judge'], carries: 'user-text', command: 'agy', args: ['{prompt}'], allowCrossProvider: true } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  await assert.rejects(
    () => executeCapacityCli(undefined, { repoRoot: root, for: 'judge', carries: 'repo-content', prompt: 'p' }),
    RunnerConfigError,
  );
});

// --- CLI entry point: --for / --carries / the new "log" subcommand --------

// tsk-in1-4: isolated `mkTempGitRepo()`, not the live main checkout — same
// rationale as the CLI-spawn tests above.
test('the "decide" CLI entry point resolves --for <purpose> the same way as a positional capacityId', () => {
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
    [dispatchPath, 'execute', 'no-such-capacity-configured', '--prompt', 'hello', '--carries', 'repo-content'],
    { encoding: 'utf8', cwd: repoRoot },
  );
  assert.equal(result.status, 0, result.stderr);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.mechanism, 'out-of-process');
  assert.equal(parsed.status, 0);
});

test('the "log" CLI entry point appends a capacity.dispatch event and prints it as JSON', () => {
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
  assert.equal(printed.type, 'capacity.dispatch');
  assert.equal(printed.payload.id, 'tsk-2c1');
  assert.equal(printed.payload.capacityId, 'gather');
  assert.equal(printed.payload.provider, 'agy');
  assert.equal(printed.payload.command, 'agy');
  assert.equal(printed.payload.model, 'gemini-flash');
  const raw = fs.readFileSync(path.join(repoRoot, '.fgos', 'events.jsonl'), 'utf8');
  const lines = raw.trim().split('\n');
  const logged = JSON.parse(lines[lines.length - 1]);
  assert.equal(logged.type, 'capacity.dispatch');
  assert.equal(logged.payload.id, 'tsk-2c1');
});

test('the "log" CLI entry point exits non-zero with a usage message when a required flag is missing', () => {
  const dispatchPath = path.resolve('src/runner/dispatch.mjs');
  const result = spawnSync(process.execPath, [dispatchPath, 'log', 'gather', '--id', 'tsk-2c1'], { encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /usage: node src\/runner\/dispatch\.mjs log/);
});

// --- logCapacityDispatch (D9-shaped audit line for an IN-SESSION capacity
// call — the sibling loop.mjs's own capacity.dispatch event has no claim to
// attach to; closes bee's own named gap, tsk-2ie5/tsk-2c1) -----------------

test('logCapacityDispatch appends a capacity.dispatch event with baseCommit/headRef always null (no worktree attestation applies in-session)', () => {
  const { fgosDir } = mkTempGitRepo();
  const event = logCapacityDispatch(fgosDir, {
    id: 'tsk-2c1',
    capacityId: 'gather',
    provider: 'agy',
    command: 'agy',
    model: 'gemini-flash',
  });
  assert.equal(event.type, 'capacity.dispatch');
  assert.equal(event.payload.baseCommit, null);
  assert.equal(event.payload.headRef, null);
  const raw = fs.readFileSync(path.join(fgosDir, 'events.jsonl'), 'utf8');
  const lines = raw.trim().split('\n');
  assert.equal(lines.length, 1);
});

test('logCapacityDispatch appends multiple sequential calls without corrupting the log — sequential seq, no duplicate/dropped lines (parallel gather branches must never race the write)', () => {
  const { fgosDir } = mkTempGitRepo();
  const events = [1, 2, 3, 4].map((n) =>
    logCapacityDispatch(fgosDir, { id: 'tsk-2c1', capacityId: 'gather', provider: 'agy', command: 'agy', model: `m${n}` }),
  );
  const seqs = events.map((e) => e.seq);
  assert.deepEqual(seqs, [...new Set(seqs)].sort((a, b) => a - b), 'no duplicate seq');
  const raw = fs.readFileSync(path.join(fgosDir, 'events.jsonl'), 'utf8');
  assert.equal(raw.trim().split('\n').length, 4);
});
