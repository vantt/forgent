import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { initStore, addWork, moveWork, listWork, readRawEvents, readyWork } from '../../src/state/store.mjs';
import { appendEvent } from '../../src/state/events.mjs';
import { createWorktree, removeWorktree, createBranchRef, branchNameFor } from '../../src/runner/worktree.mjs';
import { runOnce } from '../../src/runner/loop.mjs';

// Fake executors only — every "worker" spawned here is a node script this
// file writes into a mkdtemp directory. Every test builds its own
// disposable git repo (git init in mkdtemp) with its own `.fgos/` inside
// it; nothing here ever creates a worktree, a branch, or a `.fgos/` entry
// in THIS repo (forgent itself).

const noLog = () => {};

// Pinned to "main" (mirrors merge.test.mjs's initRepo()): cell fan-out-parallel-9
// wires createBranchRef's default baseRef ('main', worktree.mjs) into a real
// leaf dispatch path, so a leaf whose root has no branch yet forks it from
// literally "main" — a bare `git init` leaves the default branch name to this
// machine's `init.defaultBranch` (often not "main"), which would make that
// codepath fail here even though the real forgent/repo (whose default branch
// really is "main") is unaffected.
function initTempRepo() {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-loop-test-repo-'));
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: repoRoot });
  fs.writeFileSync(path.join(repoRoot, 'seed.txt'), 'seed\n');
  execFileSync('git', ['add', 'seed.txt'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-q', '-m', 'init'], { cwd: repoRoot });
  return repoRoot;
}

function mkTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function seedItem(dir, overrides = {}) {
  const item = {
    id: 'item-x',
    title: 'Produce the output file',
    kind: 'behavior_change',
    status: 'todo',
    deps: [],
    risk: 'low',
    refs: [],
    verify: 'test -f output.txt',
    ...overrides,
  };
  addWork(dir, item);
  return item;
}

/** A worker that behaves: bumps a run counter, produces a file, commits it
 * on its branch. Never touches `.fgos/`. */
function writeCommittingExecutor(scriptDir, counterFile, produce = 'output.txt') {
  const scriptPath = path.join(scriptDir, 'committing-executor.mjs');
  fs.writeFileSync(
    scriptPath,
    `
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
fs.appendFileSync(${JSON.stringify(counterFile)}, 'run\\n');
fs.writeFileSync(${JSON.stringify(produce)}, 'produced by worker\\n');
execFileSync('git', ['add', ${JSON.stringify(produce)}]);
execFileSync('git', ['commit', '-q', '-m', ${JSON.stringify(`worker: ${produce}`)}]);
`,
  );
  return scriptPath;
}

/** A worker that produces the verify target but never commits it. */
function writeNonCommittingExecutor(scriptDir, counterFile) {
  const scriptPath = path.join(scriptDir, 'non-committing-executor.mjs');
  fs.writeFileSync(
    scriptPath,
    `
import fs from 'node:fs';
fs.appendFileSync(${JSON.stringify(counterFile)}, 'run\\n');
fs.writeFileSync('output.txt', 'uncommitted\\n');
`,
  );
  return scriptPath;
}

/** A rogue writer that races the runner: does the work, commits it, then
 * moves the item doing -> blocked in the MAIN repo's .fgos behind the
 * runner's back — so the runner's own doing -> proposed CAS must conflict. */
function writeRacingExecutor(scriptDir, counterFile, mainDir, id) {
  const storeUrl = pathToFileURL(path.resolve(import.meta.dirname, '../../src/state/store.mjs')).href;
  const scriptPath = path.join(scriptDir, 'racing-executor.mjs');
  fs.writeFileSync(
    scriptPath,
    `
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
fs.appendFileSync(${JSON.stringify(counterFile)}, 'run\\n');
fs.writeFileSync('output.txt', 'produced by worker\\n');
execFileSync('git', ['add', 'output.txt']);
execFileSync('git', ['commit', '-q', '-m', 'worker: output.txt']);
const { moveWork } = await import(${JSON.stringify(storeUrl)});
moveWork(${JSON.stringify(mainDir)}, { id: ${JSON.stringify(id)}, to: 'blocked', expectedStatus: 'doing' });
`,
  );
  return scriptPath;
}

/** A worker that records a real execution INTERVAL: it writes a start marker,
 * waits long enough that two concurrent dispatches must overlap in wall time,
 * then writes+commits its proof file and an end marker. Each item writes to
 * its OWN marker files (keyed by the produce target parsed out of the prompt's
 * `test -f <file>` verify line, exactly as the real e2e decompose-aware
 * executor does), so two concurrent executors never race on the same file —
 * the overlap is proven by interval intersection, not a delay-only proxy. */
function writeIntervalExecutor(scriptDir, markerDir, sleepMs = 300) {
  const scriptPath = path.join(scriptDir, 'interval-executor.mjs');
  fs.writeFileSync(
    scriptPath,
    `
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const prompt = process.argv[2] ?? '';
const match = prompt.match(/test -f (\\S+)/);
const file = match ? match[1] : 'output.txt';
const marker = path.join(${JSON.stringify(markerDir)}, file);
fs.writeFileSync(marker + '.start', String(Date.now()));
await new Promise((r) => setTimeout(r, ${sleepMs}));
fs.writeFileSync(file, 'produced by worker\\n');
execFileSync('git', ['add', file]);
execFileSync('git', ['commit', '-q', '-m', 'worker: ' + file]);
fs.writeFileSync(marker + '.end', String(Date.now()));
`,
  );
  return scriptPath;
}

function configFor(scriptPath) {
  return {
    executor: { command: process.execPath, args: [scriptPath, '{prompt}', '--model', '{model}'] },
    models: { light: 'haiku', standard: 'sonnet', heavy: 'opus' },
    timeoutMs: 30000,
  };
}

function branchExists(repoRoot, branch) {
  try {
    execFileSync('git', ['rev-parse', '--verify', '--quiet', `refs/heads/${branch}`], {
      cwd: repoRoot,
      encoding: 'utf8',
    });
    return true;
  } catch {
    return false;
  }
}

function countRuns(counterFile) {
  if (!fs.existsSync(counterFile)) return 0;
  return fs.readFileSync(counterFile, 'utf8').split('\n').filter(Boolean).length;
}

/** Plant a real commit directly on `branch` via a throwaway worktree
 * checkout (mirrors worktree.test.mjs's `commitOnWorktree`), synthesizing
 * "a branch that already carries content" without a real merge/dispatch —
 * exactly what cell fan-out-parallel-9's own tests need to prove
 * fork-from-tip/branch-reuse without the (still deferred) approve-side
 * leaf-to-root merge mechanism. */
function plantCommit(repoRoot, worktreeDir, id, filename, contents) {
  const wt = createWorktree(repoRoot, id, { worktreeDir });
  fs.writeFileSync(path.join(wt.path, filename), contents);
  execFileSync('git', ['add', filename], { cwd: wt.path });
  execFileSync('git', ['commit', '-q', '-m', `planted: ${filename}`], { cwd: wt.path });
  removeWorktree(repoRoot, wt.path);
}

/** True when `ref` contains `filename` at its tip — used to prove a branch's
 * ACTUAL fork point/content (which base ref its history includes), not just
 * its name. */
function fileAtRef(repoRoot, ref, filename) {
  try {
    // stderr silenced (mirrors branchExists's `--quiet` rev-parse above): a
    // missing path is an expected, asserted-on outcome in these tests, not a
    // real failure worth printing "fatal: path ... does not exist" for.
    execFileSync('git', ['show', `${ref}:${filename}`], { cwd: repoRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    return true;
  } catch {
    return false;
  }
}

function setup() {
  const repoRoot = initTempRepo();
  const dir = path.join(repoRoot, '.fgos');
  initStore(dir);
  const scriptDir = mkTempDir('fgos-loop-test-exec-');
  const worktreeDir = mkTempDir('fgos-loop-test-wt-');
  const counterFile = path.join(scriptDir, 'runs.log');
  return { repoRoot, dir, scriptDir, worktreeDir, counterFile };
}

// --- happy path: --once runs the full circle -----------------------------

test('runOnce full circle: todo -> doing -> worker commit -> goal-check pass -> proposed, branch kept, worktree gone, runner is the only .fgos writer', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  seedItem(dir, { id: 'item-happy' });
  const config = configFor(writeCommittingExecutor(scriptDir, counterFile));

  const result = await runOnce({ repoRoot, config, worktreeDir, log: noLog });

  assert.equal(result.outcome, 'drained');
  assert.equal(result.exitCode, 0);
  assert.equal(result.dispatched.length, 1);
  assert.equal(result.dispatched[0].outcome, 'proposed');
  assert.equal(result.dispatched[0].id, 'item-happy');
  assert.equal(result.dispatched[0].branch, 'fgw/item-happy');
  assert.equal(listWork(dir).work['item-happy'].status, 'proposed');
  assert.equal(branchExists(repoRoot, 'fgw/item-happy'), true);
  const log = execFileSync('git', ['log', '--oneline', 'fgw/item-happy'], { cwd: repoRoot, encoding: 'utf8' });
  assert.match(log, /worker: output\.txt/);
  // worktree torn down, branch survives (D4 proposal artifact)
  assert.deepEqual(fs.readdirSync(worktreeDir), []);
  // one door: the log carries exactly the runner's writes — the worker
  // never touched .fgos/ (add + claim + predicted + propose + actual,
  // nothing else)
  const events = readRawEvents(dir);
  assert.deepEqual(
    events.map((e) => (e.type === 'work.outcome' ? `work.outcome:${e.payload.predicted ? 'predicted' : 'actual'}` : `${e.type}:${e.payload.to ?? 'add'}`)),
    ['work.add:add', 'work.move:doing', 'work.outcome:predicted', 'work.move:proposed', 'work.outcome:actual'],
  );
  // predicted is written right at claim time, before dispatch ever runs
  const predictedEvent = events.find((e) => e.type === 'work.outcome' && e.payload.predicted);
  assert.deepEqual(predictedEvent.payload.predicted, { tier: 'standard', deps: 0, priorVisits: 0 });
  // actual is written on the pass terminal, sourced from the runner's own
  // goal-check/branchFacts — never the worker's status/signal
  const actualEvent = events.find((e) => e.type === 'work.outcome' && e.payload.actual);
  assert.equal(actualEvent.payload.actual.outcome, 'proposed');
  assert.equal(actualEvent.payload.actual.passed, true);
  assert.equal(actualEvent.payload.actual.aheadCount, 1);
});

// --- settlement actor attribution (phase-3-compound-learning-5,
// S3-closeout): every moveWork call the runner itself makes stamps
// actor:'runner' on the raw event payload (per vision §8 — the runner is
// never a human/session). -------------------------------------------------

test('runOnce stamps actor "runner" on every claim/propose work.move it writes', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  seedItem(dir, { id: 'item-actor' });
  const config = configFor(writeCommittingExecutor(scriptDir, counterFile));

  await runOnce({ repoRoot, config, worktreeDir, log: noLog });

  const moves = readRawEvents(dir).filter((e) => e.type === 'work.move');
  assert.ok(moves.length >= 2, 'claim (todo->doing) and propose (doing->proposed) both wrote a move');
  for (const move of moves) {
    assert.equal(move.payload.actor, 'runner');
  }
});

/** A discovery-and-chia-việc-aware executor (stage-clarify D4/D5/D13 +
 * stage-decompose D2, mirroring test/e2e/runner-loop.test.mjs's own
 * helper): the same configured executor serves THREE call sites — the
 * context-discovery verdict call (discovery.mjs's prompt, "# Context-
 * discovery"), the chia-việc verdict call (decompose.mjs's prompt, "#
 * Chia-việc (decompose)" — answered pass-through here so a clarify-pass
 * item chains straight on to `executing` in the same sweep, per
 * stage-decompose D2), and the worker dispatch call — told apart by their
 * fixed prefixes. */
function writeClearDiscoveryExecutor(scriptDir, counterFile, { verify, produce = 'output.txt' } = {}) {
  const scriptPath = path.join(scriptDir, 'clear-discovery-executor.mjs');
  fs.writeFileSync(
    scriptPath,
    `
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const prompt = process.argv[2] ?? '';
if (prompt.startsWith('# Context-discovery')) {
  process.stdout.write(JSON.stringify({ clear: true, verify: ${JSON.stringify(verify)} }));
} else if (prompt.startsWith('# Chia-việc (decompose)')) {
  process.stdout.write(JSON.stringify({ verdict: 'pass-through' }));
} else {
  fs.appendFileSync(${JSON.stringify(counterFile)}, 'run\\n');
  fs.writeFileSync(${JSON.stringify(produce)}, 'produced by worker\\n');
  execFileSync('git', ['add', ${JSON.stringify(produce)}]);
  execFileSync('git', ['commit', '-q', '-m', ${JSON.stringify('worker: output.txt')}]);
}
`,
  );
  return scriptPath;
}

test('runOnce clarify sweep records a clarify-pass settlement stamped actor "runner" (R19/D13 sweep); the decompose sweep right after it (stage-decompose D2) pass-throughs the item on to executing in the same pass', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  seedItem(dir, { id: 'item-clarify', stage: 'clarify', verify: 'test -f output.txt' });
  const config = configFor(writeClearDiscoveryExecutor(scriptDir, counterFile, { verify: 'test -f output.txt' }));

  const result = await runOnce({ repoRoot, config, worktreeDir, log: noLog });

  assert.equal(result.outcome, 'drained', 'the clarify+decompose sweeps clear the item before the frontier dispatches it in the same pass');
  assert.equal(result.dispatched[0].outcome, 'proposed');
  assert.equal(result.dispatched[0].id, 'item-clarify');
  const view = listWork(dir);
  assert.equal(view.work['item-clarify'].stage, 'executing');
  // must_haves truth 4: the clarify-pass settlement (cell 1's re-guard on
  // from === 'clarify') still fires even though clarify's own destination is
  // now `decompose`, not `executing` — this is what proves the re-guard,
  // not the eventual (decompose-driven) stage the item lands on.
  assert.equal(view.settlements['item-clarify'].length, 1);
  assert.equal(view.settlements['item-clarify'][0].kind, 'clarify-pass');
  assert.equal(view.settlements['item-clarify'][0].actor, 'runner');
});

// --- domain-aware sweeps (per base-workflow-model D2/D3): an unrecognized
// item.domain must never throw inside the hot loop — it folds to 'coding'
// (same clarify/decompose stage names as today) with a diagnostic log line.
// validateWork (intake) rejects an unrecognized domain by design, so the
// only realistic way this reaches the runner is data that never went
// through addWork — e.g. a future domain later dropped from the registry
// (approach.md's rollback plan). Exercised here via a raw appended event,
// bypassing addWork's validation on purpose. ---

test('runOnce clarify+decompose sweeps fold an unrecognized item.domain to "coding" (fail-safe), logging a warning instead of throwing', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  appendEvent(path.join(dir, 'events.jsonl'), {
    type: 'work.add',
    payload: {
      id: 'item-clarify',
      title: 'Produce the output file',
      kind: 'behavior_change',
      status: 'todo',
      deps: [],
      risk: 'low',
      refs: [],
      verify: 'test -f output.txt',
      stage: 'clarify',
      domain: 'bogus-domain',
    },
  });
  const config = configFor(writeClearDiscoveryExecutor(scriptDir, counterFile, { verify: 'test -f output.txt' }));
  const lines = [];
  const capture = (msg) => lines.push(msg);

  const result = await runOnce({ repoRoot, config, worktreeDir, log: capture });

  assert.equal(result.outcome, 'drained', 'the sweeps still clear the item despite the unrecognized domain');
  assert.equal(result.dispatched[0].id, 'item-clarify');
  assert.ok(
    lines.some((line) => /unrecognized domain "bogus-domain"/.test(line)),
    'the fold must be logged, not silent',
  );
});

// --- clarify/decompose sweeps never match on a domain with no Clarify/Divide
// stage (base-workflow-model-4): stageForStep returns undefined for the
// 'synthetic' domain's Clarify/Divide steps, and an item with no explicit
// `stage` also reads as `item.stage === undefined` (D8 lazy default) — the
// pre-fix comparison (`item.stage === clarifyStage`) wrongly matched
// undefined === undefined and swept the item into resolveDiscovery, which
// then threw a stage conflict (synthetic's lazily-resolved "from" stage is
// its own Execute stage, 'assembling', never 'clarify') and halted the whole
// drain-run. The fixed guard requires clarifyStage/decomposeStage to be a
// real stage name before comparing, so a synthetic-domain item is left alone
// by both sweeps and reaches the frontier (already ready, since its own
// lazy-default stage IS its Execute stage) and dispatches normally.

test('runOnce clarify+decompose sweeps never touch a synthetic-domain item with no Clarify/Divide-mapped stage — it dispatches straight through instead of being wrongly swept', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  seedItem(dir, { id: 'item-synthetic', domain: 'synthetic', verify: 'test -f output.txt' });
  const config = configFor(writeCommittingExecutor(scriptDir, counterFile));

  const result = await runOnce({ repoRoot, config, worktreeDir, log: noLog });

  assert.equal(result.outcome, 'drained', 'the synthetic item must dispatch, never halt on a bogus stage conflict');
  assert.equal(result.dispatched.length, 1);
  assert.equal(result.dispatched[0].outcome, 'proposed');
  assert.equal(result.dispatched[0].id, 'item-synthetic');
  assert.equal(listWork(dir).work['item-synthetic'].status, 'proposed');
  // no work.discovery / work.stage event was ever written — the sweeps
  // genuinely skipped it rather than happening to succeed
  const events = readRawEvents(dir);
  assert.ok(!events.some((e) => e.type === 'work.discovery' || e.type === 'work.stage'));
});

test('runOnce clarify+decompose sweeps still fire normally for a coding-domain item at stage "clarify" (no behavior change for coding)', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  seedItem(dir, { id: 'item-coding-clarify', stage: 'clarify', verify: 'test -f output.txt' });
  const config = configFor(writeClearDiscoveryExecutor(scriptDir, counterFile, { verify: 'test -f output.txt' }));

  const result = await runOnce({ repoRoot, config, worktreeDir, log: noLog });

  assert.equal(result.outcome, 'drained');
  assert.equal(result.dispatched[0].outcome, 'proposed');
  assert.equal(result.dispatched[0].id, 'item-coding-clarify');
  assert.equal(listWork(dir).work['item-coding-clarify'].stage, 'executing');
});

// --- real parallelism: two independent items overlap in one runOnce -------
// (fan-out-parallel D10/D16 — the whole point of the drain-run rewrite). The
// overlap is proven CONCRETELY (interval intersection), not by a wall-clock-
// under-2x-delay proxy: two sequential delayed dispatches would pass a delay-
// only check, so only genuinely intersecting [start,end] intervals prove it.

test('real concurrency: two independent ready items dispatched in ONE runOnce overlap in wall time (interval intersection) and both reach proposed with a consistent event log', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir } = setup();
  const markerDir = mkTempDir('fgos-loop-test-marker-');
  seedItem(dir, { id: 'item-a', verify: 'test -f a.txt' });
  seedItem(dir, { id: 'item-b', verify: 'test -f b.txt' });
  const config = configFor(writeIntervalExecutor(scriptDir, markerDir, 300));

  const result = await runOnce({ repoRoot, config, worktreeDir, log: noLog });

  // both items dispatched in the same drain-run, both proposed
  assert.equal(result.outcome, 'drained');
  const outcomes = new Map(result.dispatched.map((d) => [d.id, d.outcome]));
  assert.equal(outcomes.get('item-a'), 'proposed');
  assert.equal(outcomes.get('item-b'), 'proposed');

  // event-log internal consistency: the log replays cleanly and both items
  // land at proposed in the rebuilt view (the write-queue kept the concurrent
  // workers' state writes from interleaving into corruption).
  const view = listWork(dir);
  assert.equal(view.work['item-a'].status, 'proposed');
  assert.equal(view.work['item-b'].status, 'proposed');

  // CONCRETE overlap proof: item-a's [start,end] and item-b's [start,end]
  // genuinely intersect — impossible under sequential dispatch, where b would
  // not start until a's worker had fully finished (b.start > a.end).
  const readMarker = (f, suffix) => parseInt(fs.readFileSync(path.join(markerDir, `${f}.${suffix}`), 'utf8'), 10);
  const aStart = readMarker('a.txt', 'start');
  const aEnd = readMarker('a.txt', 'end');
  const bStart = readMarker('b.txt', 'start');
  const bEnd = readMarker('b.txt', 'end');
  assert.ok(
    Math.max(aStart, bStart) < Math.min(aEnd, bEnd),
    `the two dispatches must overlap in wall time: a=[${aStart},${aEnd}] b=[${bStart},${bEnd}]`,
  );
});

// --- bounded drain-run: cap + refill + terminate (D10/D15) ----------------

test('bounded drain-run: three independent ready items under maxRoots=2 dispatch across two waves (refill) — all reach proposed, then the run terminates', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  seedItem(dir, { id: 'root-1' });
  seedItem(dir, { id: 'root-2' });
  seedItem(dir, { id: 'root-3' });
  const config = { ...configFor(writeCommittingExecutor(scriptDir, counterFile)), parallel: { maxRoots: 2, maxLeavesPerRoot: 1 } };

  const result = await runOnce({ repoRoot, config, worktreeDir, log: noLog });

  assert.equal(result.outcome, 'drained');
  assert.equal(result.dispatched.length, 3, 'the cap dispatched 2 then refilled the 3rd — all three, none dropped');
  for (const id of ['root-1', 'root-2', 'root-3']) {
    assert.equal(listWork(dir).work[id].status, 'proposed');
  }
  assert.equal(countRuns(counterFile), 3); // three real worker dispatches
  assert.deepEqual(readyWork(dir), [], 'the drain terminated with the frontier empty (D15), it did not spin');
});

// --- two-tier cap + root-affinity: leaves of one root share an owner ------

test('two-tier cap: a root with three ready leaves dispatches maxLeavesPerRoot per wave, refills the rest, all leaves reach proposed under one shared root owner', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  seedItem(dir, { id: 'the-root', verify: 'test -f root.txt' });
  seedItem(dir, { id: 'leaf-1', parent: 'the-root' });
  seedItem(dir, { id: 'leaf-2', parent: 'the-root' });
  seedItem(dir, { id: 'leaf-3', parent: 'the-root' });
  const config = { ...configFor(writeCommittingExecutor(scriptDir, counterFile)), parallel: { maxRoots: 4, maxLeavesPerRoot: 2 } };

  const result = await runOnce({ repoRoot, config, worktreeDir, log: noLog });

  assert.equal(result.outcome, 'drained');
  assert.equal(result.dispatched.length, 3, 'all three leaves of the one root dispatched (2 in wave 1, 1 refilled)');
  for (const id of ['leaf-1', 'leaf-2', 'leaf-3']) {
    assert.equal(listWork(dir).work[id].status, 'proposed');
  }
  // the root itself never dispatched — its descendants are only proposed (not
  // done), so the lineage filter keeps it off the frontier this whole run.
  assert.equal(listWork(dir).work['the-root'].status, 'todo');
  assert.equal(countRuns(counterFile), 3);
});

// --- D3 branch targeting: leaf fork-from-root-tip, root branch-reuse ------

test('cell fan-out-parallel-9: a leaf whose root branch already carries a planted commit forks its own worktree from that root tip, not from main', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  seedItem(dir, { id: 'the-root', verify: 'test -f root.txt' });
  seedItem(dir, { id: 'leaf-1', parent: 'the-root', verify: 'test -f leaf.txt' });

  // Synthesize a root branch tip that differs from main: ensure fgw/the-root
  // exists (ref-only, from main), then plant a real commit on it — mirrors
  // "an earlier sibling leaf already merged into fgw/the-root", without the
  // (still deferred) approve-side merge mechanism.
  createBranchRef(repoRoot, 'the-root', { baseRef: 'main' });
  plantCommit(repoRoot, worktreeDir, 'the-root', 'root-marker.txt', 'planted on the root branch\n');
  assert.equal(fileAtRef(repoRoot, 'main', 'root-marker.txt'), false, 'main itself never got the planted commit');

  const result = await runOnce({ repoRoot, config: configFor(writeCommittingExecutor(scriptDir, counterFile, 'leaf.txt')), worktreeDir, log: noLog });

  assert.equal(result.outcome, 'drained');
  assert.equal(result.dispatched[0].outcome, 'proposed');
  assert.equal(listWork(dir).work['leaf-1'].status, 'proposed');

  // The leaf's OWN branch carries the root's planted content — proof it
  // forked from fgw/the-root's tip (D3 "leaf fork-from-tip-of-parent"), not
  // from main, which never had root-marker.txt.
  assert.equal(fileAtRef(repoRoot, branchNameFor('leaf-1'), 'root-marker.txt'), true, 'leaf branch forked from the root branch tip, carries its planted file');
  assert.equal(fileAtRef(repoRoot, branchNameFor('leaf-1'), 'leaf.txt'), true, 'leaf branch also carries its own worker commit');
});

test('cell fan-out-parallel-9: a root-less item is unaffected (byte-for-byte regression) — its worktree still forks fresh from main, exactly as before this cell', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  seedItem(dir, { id: 'standalone', verify: 'test -f output.txt' });

  const result = await runOnce({ repoRoot, config: configFor(writeCommittingExecutor(scriptDir, counterFile)), worktreeDir, log: noLog });

  assert.equal(result.outcome, 'drained');
  assert.equal(listWork(dir).work.standalone.status, 'proposed');
  assert.equal(branchExists(repoRoot, 'fgw/standalone'), true);
  const mergeBase = execFileSync('git', ['merge-base', 'main', 'fgw/standalone'], { cwd: repoRoot, encoding: 'utf8' }).trim();
  const mainTip = execFileSync('git', ['rev-parse', 'main'], { cwd: repoRoot, encoding: 'utf8' }).trim();
  assert.equal(mergeBase, mainTip, 'a parent-less item still forks fresh from main, same as pre-fan-out-parallel-9 behavior');
});

test('cell fan-out-parallel-9: a root whose own branch already carries a planted commit (simulating an earlier merged leaf) reuses it via the existing branch-reuse path — proves the mechanism, not a real leaf-to-root merge', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  seedItem(dir, { id: 'the-root2', verify: 'test -f root2.txt' });

  // Simulate "an earlier leaf already merged into fgw/the-root2" — plant a
  // commit directly on the root's own branch before it is ever dispatched.
  plantCommit(repoRoot, worktreeDir, 'the-root2', 'child-merged.txt', 'from an earlier merged leaf\n');

  const result = await runOnce({ repoRoot, config: configFor(writeCommittingExecutor(scriptDir, counterFile, 'root2.txt')), worktreeDir, log: noLog });

  assert.equal(result.outcome, 'drained');
  assert.equal(result.dispatched[0].outcome, 'proposed');
  assert.equal(listWork(dir).work['the-root2'].status, 'proposed');

  // Both the planted (pre-existing) content and the fresh worker commit are
  // on the SAME branch — createWorktree's branch-reuse path (opts.baseRef
  // ignored) forked the dispatch worktree from the branch's own tip, never
  // discarding what was already there.
  assert.equal(fileAtRef(repoRoot, 'fgw/the-root2', 'child-merged.txt'), true, 'the pre-existing planted commit survived (branch reused, not recreated)');
  assert.equal(fileAtRef(repoRoot, 'fgw/the-root2', 'root2.txt'), true, 'the worker\'s own commit landed on the same, reused branch');
});

// --- verify-miss: retry then park ----------------------------------------

test('verify-miss: worker commits the wrong thing -> retry once, then park to blocked (never proposed)', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  seedItem(dir, { id: 'item-miss' });
  // commits junk.txt, but verify demands output.txt -> goal-check miss
  const config = configFor(writeCommittingExecutor(scriptDir, counterFile, 'junk.txt'));

  const result = await runOnce({ repoRoot, config, worktreeDir, log: noLog });

  assert.equal(result.outcome, 'drained');
  assert.equal(result.dispatched[0].outcome, 'parked');
  assert.equal(result.dispatched[0].errorClass, 'verify-miss');
  assert.equal(result.dispatched[0].attempts, 2);
  assert.equal(countRuns(counterFile), 2); // retry really re-dispatched
  assert.equal(listWork(dir).work['item-miss'].status, 'blocked');
  assert.deepEqual(fs.readdirSync(worktreeDir), []);

  // predicted at claim, and actual on the PARK branch (closes the HIGH-risk
  // "failures learn nothing" gap — a park/halt must not be silent).
  const events = readRawEvents(dir);
  const predictedEvent = events.find((e) => e.type === 'work.outcome' && e.payload.predicted);
  assert.ok(predictedEvent, 'predicted work.outcome written at claim');
  const actualEvent = events.find((e) => e.type === 'work.outcome' && e.payload.actual);
  assert.ok(actualEvent, 'actual work.outcome written on the park branch');
  assert.equal(actualEvent.payload.actual.outcome, 'parked');
  assert.equal(actualEvent.payload.actual.passed, false);
  assert.equal(actualEvent.payload.actual.errorClass, 'verify-miss');
  assert.equal(actualEvent.payload.actual.attempts, 2);

  // friction channel (S2 — kênh 2 của capture): the runner blames itself at
  // the same park choke-point, layer attributed mechanically from the class.
  const frictionEvent = events.find((e) => e.type === 'work.friction');
  assert.ok(frictionEvent, 'work.friction written on the park branch');
  assert.equal(frictionEvent.payload.disposition, 'parked');
  assert.equal(frictionEvent.payload.errorClass, 'verify-miss');
  assert.equal(frictionEvent.payload.layer, 'verification');
  assert.equal(frictionEvent.payload.attempts, 2);
  assert.ok(frictionEvent.payload.detail, 'friction carries the failure message');
});

test('verify passes but the worker never committed -> classified verify-miss, parked after retries', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  seedItem(dir, { id: 'item-nocommit' });
  const config = configFor(writeNonCommittingExecutor(scriptDir, counterFile));

  const result = await runOnce({ repoRoot, config, worktreeDir, log: noLog });

  assert.equal(result.outcome, 'drained');
  assert.equal(result.dispatched[0].outcome, 'parked');
  assert.equal(result.dispatched[0].errorClass, 'verify-miss');
  assert.equal(listWork(dir).work['item-nocommit'].status, 'blocked');
  assert.deepEqual(fs.readdirSync(worktreeDir), []);
});

// --- spawn-fail: routed by the recovery matrix ----------------------------

test('worker-spawn-fail: nonexistent executor -> retry per matrix, then park to blocked', async () => {
  const { repoRoot, dir, worktreeDir } = setup();
  seedItem(dir, { id: 'item-nospawn' });
  const config = {
    executor: { command: '/no/such/executor-binary-xyz', args: ['{prompt}'] },
    models: { light: 'haiku', standard: 'sonnet', heavy: 'opus' },
    timeoutMs: 30000,
  };

  const result = await runOnce({ repoRoot, config, worktreeDir, log: noLog });

  assert.equal(result.outcome, 'drained');
  assert.equal(result.dispatched[0].outcome, 'parked');
  assert.equal(result.dispatched[0].errorClass, 'worker-spawn-fail');
  assert.equal(result.dispatched[0].attempts, 2);
  assert.equal(listWork(dir).work['item-nospawn'].status, 'blocked');
  assert.deepEqual(fs.readdirSync(worktreeDir), []);
  // worker-dispatch-log (D1/D3/D4): the failing outcome is persisted to
  // .fgos/logs/<id>.log — recoverable after the fact, not console-only.
  const logFile = path.join(dir, 'logs', 'item-nospawn.log');
  assert.ok(fs.existsSync(logFile), 'worker dispatch log persisted for the failed spawn');
  assert.match(fs.readFileSync(logFile, 'utf8'), /worker-spawn-fail/);
});

// --- anti-loop: max-visits parks the item OFF the frontier ----------------

test('anti-loop: an item at MAX_VISITS is parked todo -> blocked and truly leaves the frontier — the next item runs in the same pass', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  seedItem(dir, { id: 'item-loopy' });
  seedItem(dir, { id: 'item-fresh' });
  // one prior visit for item-loopy: todo -> doing -> blocked -> todo
  moveWork(dir, { id: 'item-loopy', to: 'doing', expectedStatus: 'todo' });
  moveWork(dir, { id: 'item-loopy', to: 'blocked', expectedStatus: 'doing' });
  moveWork(dir, { id: 'item-loopy', to: 'todo', expectedStatus: 'blocked' });
  const config = configFor(writeCommittingExecutor(scriptDir, counterFile));

  const result = await runOnce({ repoRoot, config, worktreeDir, maxVisits: 1, log: noLog });

  // the FIFO head was parked, and the drain moved on instead of hovering
  assert.deepEqual(result.parked, [{ id: 'item-loopy', reason: 'anti-loop-max-visits', visits: 1 }]);
  assert.equal(listWork(dir).work['item-loopy'].status, 'blocked');
  assert.equal(result.outcome, 'drained');
  assert.equal(result.dispatched.length, 1);
  assert.equal(result.dispatched[0].id, 'item-fresh');
  assert.equal(result.dispatched[0].outcome, 'proposed');
  assert.deepEqual(readyWork(dir), []);
});

test('anti-loop: a human reject (with reason) resets the runner gate — visits BEFORE it no longer count toward the cap (human-rounds D1)', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  seedItem(dir, { id: 'item-reprieved' });
  // one machine visit that would already be AT the cap (maxVisits: 1) on its
  // own — then a human rejects with a reason, which per D1 resets the item's
  // own budget. Reaching `proposed` first (not just doing -> blocked -> todo)
  // exercises the real reject edge (proposed -> todo, reason required).
  moveWork(dir, { id: 'item-reprieved', to: 'doing', expectedStatus: 'todo' });
  moveWork(dir, { id: 'item-reprieved', to: 'proposed', expectedStatus: 'doing' });
  moveWork(dir, { id: 'item-reprieved', to: 'todo', expectedStatus: 'proposed', reason: 'not quite right', actor: 'human' });
  // lifetime visitCount is already 1 here — the OLD (pre-D1) gate would have
  // parked this item immediately at maxVisits: 1, never dispatching it again.
  const config = configFor(writeCommittingExecutor(scriptDir, counterFile));

  const result = await runOnce({ repoRoot, config, worktreeDir, maxVisits: 1, log: noLog });

  // the human reject reset the budget to 0 doing-entries-since — the item
  // dispatches and proposes instead of being parked as over-limit.
  assert.deepEqual(result.parked, []);
  assert.equal(result.dispatched.length, 1);
  assert.equal(result.dispatched[0].id, 'item-reprieved');
  assert.equal(result.dispatched[0].outcome, 'proposed');
});

test('anti-loop: a BARE resume (no reason, no human actor) does NOT reset the gate — the machine-only loop still dies at the cap', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  seedItem(dir, { id: 'item-loopy-bare' });
  // todo -> doing -> blocked -> todo, no reason, no actor: a bare resume,
  // never a human trigger per D1c. The prior visit must still count.
  moveWork(dir, { id: 'item-loopy-bare', to: 'doing', expectedStatus: 'todo' });
  moveWork(dir, { id: 'item-loopy-bare', to: 'blocked', expectedStatus: 'doing' });
  moveWork(dir, { id: 'item-loopy-bare', to: 'todo', expectedStatus: 'blocked' });
  const config = configFor(writeCommittingExecutor(scriptDir, counterFile));

  const result = await runOnce({ repoRoot, config, worktreeDir, maxVisits: 1, log: noLog });

  assert.deepEqual(result.parked, [{ id: 'item-loopy-bare', reason: 'anti-loop-max-visits', visits: 1 }]);
  assert.equal(listWork(dir).work['item-loopy-bare'].status, 'blocked');
  assert.equal(result.dispatched.length, 0);
});

// --- circuit breaker: consecutive misses halt the whole run ---------------

test('breaker trip: a goal-check miss at threshold parks the item and halts the run — worktree gone, branch kept (halt path teardown)', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  seedItem(dir, { id: 'item-breaker' });
  const config = configFor(writeCommittingExecutor(scriptDir, counterFile, 'junk.txt'));

  const result = await runOnce({ repoRoot, config, worktreeDir, breakerThreshold: 1, log: noLog });

  assert.equal(result.outcome, 'drained');
  assert.equal(result.exitCode, 1);
  assert.equal(result.dispatched[0].outcome, 'halted');
  assert.equal(result.dispatched[0].reason, 'breaker-tripped');
  assert.equal(result.dispatched[0].attempts, 1); // the breaker vetoed the matrix's retry
  assert.equal(countRuns(counterFile), 1);
  assert.equal(listWork(dir).work['item-breaker'].status, 'blocked'); // never dangles in doing
  // removeWorktree ran in the finally even on the halt path
  assert.deepEqual(fs.readdirSync(worktreeDir), []);
  assert.equal(branchExists(repoRoot, 'fgw/item-breaker'), true);

  // friction channel (S2): the HALT path writes friction too — a halt must
  // not be silent any more than a park (ghi CẢ đường thất bại).
  const frictionEvent = readRawEvents(dir).find((e) => e.type === 'work.friction');
  assert.ok(frictionEvent, 'work.friction written on the halt branch');
  assert.equal(frictionEvent.payload.disposition, 'halted');
  assert.equal(frictionEvent.payload.errorClass, 'verify-miss');
  assert.equal(frictionEvent.payload.layer, 'verification');
});

// --- startup reap: stale doing + orphan branches --------------------------

test('startup reap: a crashed run\'s doing item with a committed, verify-passing branch is completed to proposed before the frontier runs', async () => {
  const { repoRoot, dir, worktreeDir } = setup();
  const item = seedItem(dir, { id: 'item-crashed' });
  // simulate the crashed run: claim, do the work on the branch, crash
  // before writing proposed (worktree torn down, branch left behind)
  moveWork(dir, { id: item.id, to: 'doing', expectedStatus: 'todo' });
  const wt = createWorktree(repoRoot, item.id, { worktreeDir });
  fs.writeFileSync(path.join(wt.path, 'output.txt'), 'done before crash\n');
  execFileSync('git', ['add', 'output.txt'], { cwd: wt.path });
  execFileSync('git', ['commit', '-q', '-m', 'worker: output.txt'], { cwd: wt.path });
  removeWorktree(repoRoot, wt.path);
  // an executor that would blow up if the runner wrongly re-dispatched
  const config = {
    executor: { command: '/no/such/executor-binary-xyz', args: ['{prompt}'] },
    models: { standard: 'sonnet' },
    timeoutMs: 30000,
  };

  const result = await runOnce({ repoRoot, config, worktreeDir, log: noLog });

  assert.deepEqual(result.reap.resolutions, [{ id: 'item-crashed', to: 'proposed', reason: null }]);
  assert.equal(listWork(dir).work['item-crashed'].status, 'proposed');
  assert.equal(result.outcome, 'idle'); // frontier was empty after the reap
  assert.deepEqual(fs.readdirSync(worktreeDir), []);
});

test('startup reap reclaims an orphaned checkout left behind by a genuine crash (worktree teardown never ran) instead of dying raw', async () => {
  const { repoRoot, dir, worktreeDir } = setup();
  const item = seedItem(dir, { id: 'item-orphaned-crash' });
  // simulate a genuine process kill: claim, commit on the branch, but never
  // call removeWorktree -- the runner died before its own `finally` ran, so
  // fgw/item-orphaned-crash is still checked out at wt.path when reap starts
  // and its own throwaway goal-check worktree would otherwise collide with it.
  moveWork(dir, { id: item.id, to: 'doing', expectedStatus: 'todo' });
  const wt = createWorktree(repoRoot, item.id, { worktreeDir });
  fs.writeFileSync(path.join(wt.path, 'output.txt'), 'done before crash\n');
  execFileSync('git', ['add', 'output.txt'], { cwd: wt.path });
  execFileSync('git', ['commit', '-q', '-m', 'worker: output.txt'], { cwd: wt.path });
  const config = {
    executor: { command: '/no/such/executor-binary-xyz', args: ['{prompt}'] },
    models: { standard: 'sonnet' },
    timeoutMs: 30000,
  };

  const result = await runOnce({ repoRoot, config, worktreeDir, log: noLog });

  assert.deepEqual(result.reap.resolutions, [{ id: 'item-orphaned-crash', to: 'proposed', reason: null }]);
  assert.equal(listWork(dir).work['item-orphaned-crash'].status, 'proposed');
  assert.equal(result.outcome, 'idle');
  // the orphaned checkout is reclaimed, not leaked
  assert.equal(fs.existsSync(wt.path), false);
});

test('startup reap: a doing item with nothing on its branch is reclaimed to blocked (runner-crash-reclaim)', async () => {
  const { repoRoot, dir, worktreeDir } = setup();
  seedItem(dir, { id: 'item-vanished' });
  moveWork(dir, { id: 'item-vanished', to: 'doing', expectedStatus: 'todo' });
  const config = {
    executor: { command: '/no/such/executor-binary-xyz', args: ['{prompt}'] },
    models: { standard: 'sonnet' },
    timeoutMs: 30000,
  };

  const result = await runOnce({ repoRoot, config, worktreeDir, log: noLog });

  assert.deepEqual(result.reap.resolutions, [
    { id: 'item-vanished', to: 'blocked', reason: 'runner-crash-reclaim' },
  ]);
  assert.equal(listWork(dir).work['item-vanished'].status, 'blocked');
  assert.equal(result.outcome, 'idle');
});

// --- startup reap never reclaims a pull-door (human/session) claim --------
// (stage-decompose S2-pull D1/cell action (4)): a person holds `doing`
// indefinitely — only a runner's own crashed claim is ever reaped.

test('startup reap SKIPS a doing item claimed by a human (claimActor) — never reclaimed, even with no branch/commit at all', async () => {
  const { repoRoot, dir, worktreeDir } = setup();
  const item = seedItem(dir, { id: 'item-human-held' });
  moveWork(dir, { id: item.id, to: 'doing', expectedStatus: 'todo', actor: 'human', headAtTake: 'deadbeef' });
  const config = {
    executor: { command: '/no/such/executor-binary-xyz', args: ['{prompt}'] },
    models: { standard: 'sonnet' },
    timeoutMs: 30000,
  };

  const result = await runOnce({ repoRoot, config, worktreeDir, log: noLog });

  assert.deepEqual(result.reap.resolutions, [], 'the human-held item is never entered into the reap resolutions at all');
  assert.equal(listWork(dir).work['item-human-held'].status, 'doing', 'still held — a person is working it, no auto-reclaim');
  assert.equal(result.outcome, 'idle', 'the item stays out of the frontier too (status doing, not todo)');
});

test('startup reap SKIPS a doing item claimed by a session, but still reaps a plain runner claim in the SAME pass — selective, not a blanket disablement', async () => {
  const { repoRoot, dir, worktreeDir } = setup();
  const held = seedItem(dir, { id: 'item-session-held' });
  moveWork(dir, { id: held.id, to: 'doing', expectedStatus: 'todo', actor: 'session', headAtTake: 'cafebabe' });
  const vanished = seedItem(dir, { id: 'item-runner-vanished' });
  moveWork(dir, { id: vanished.id, to: 'doing', expectedStatus: 'todo', actor: 'runner' });
  const config = {
    executor: { command: '/no/such/executor-binary-xyz', args: ['{prompt}'] },
    models: { standard: 'sonnet' },
    timeoutMs: 30000,
  };

  const result = await runOnce({ repoRoot, config, worktreeDir, log: noLog });

  assert.deepEqual(result.reap.resolutions, [
    { id: 'item-runner-vanished', to: 'blocked', reason: 'runner-crash-reclaim' },
  ]);
  assert.equal(listWork(dir).work['item-session-held'].status, 'doing', 'session claim untouched');
  assert.equal(listWork(dir).work['item-runner-vanished'].status, 'blocked', 'runner claim still reclaimed');
});

test('startup reap: empty fgw/ orphan branches are pruned, branches carrying commits are kept', async () => {
  const { repoRoot, dir, worktreeDir } = setup();
  // orphan: worktree created and torn down without a single commit
  const orphan = createWorktree(repoRoot, 'orphan-x', { worktreeDir });
  removeWorktree(repoRoot, orphan.path);
  // keeper: carries a real commit — a proposal, never auto-deleted
  const keeper = createWorktree(repoRoot, 'keeper-y', { worktreeDir });
  fs.writeFileSync(path.join(keeper.path, 'proposal.txt'), 'real work\n');
  execFileSync('git', ['add', 'proposal.txt'], { cwd: keeper.path });
  execFileSync('git', ['commit', '-q', '-m', 'worker: proposal.txt'], { cwd: keeper.path });
  removeWorktree(repoRoot, keeper.path);
  const config = {
    executor: { command: '/no/such/executor-binary-xyz', args: ['{prompt}'] },
    models: { standard: 'sonnet' },
    timeoutMs: 30000,
  };

  const result = await runOnce({ repoRoot, config, worktreeDir, log: noLog });

  assert.deepEqual(result.reap.pruned, ['fgw/orphan-x']);
  assert.deepEqual(result.reap.kept, [{ branch: 'fgw/keeper-y', aheadCount: 1 }]);
  assert.equal(branchExists(repoRoot, 'fgw/orphan-x'), false);
  assert.equal(branchExists(repoRoot, 'fgw/keeper-y'), true);
});

// --- CAS conflict on the runner's own write -> clean halt, exit 3 ---------

test('state-conflict: a racing write under the runner\'s claim makes its own CAS fail -> cleanup, clean halt, exit 3', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  seedItem(dir, { id: 'item-race' });
  const config = configFor(writeRacingExecutor(scriptDir, counterFile, dir, 'item-race'));

  const result = await runOnce({ repoRoot, config, worktreeDir, log: noLog });

  assert.equal(result.outcome, 'drained');
  assert.equal(result.exitCode, 3);
  assert.equal(result.dispatched[0].outcome, 'halted');
  assert.equal(result.dispatched[0].errorClass, 'state-conflict');
  // the racing writer's state stands — the runner never overwrote it blindly
  assert.equal(listWork(dir).work['item-race'].status, 'blocked');
  // cleanup still ran on this halt path: worktree gone, branch kept
  assert.deepEqual(fs.readdirSync(worktreeDir), []);
  assert.equal(branchExists(repoRoot, 'fgw/item-race'), true);
});

// --- dry-run: reads only, writes nothing ----------------------------------

test('dry-run: prints the plan (tier -> model, branch) and writes no event, no branch, no worktree', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  seedItem(dir, { id: 'item-plan' });
  const config = configFor(writeCommittingExecutor(scriptDir, counterFile));

  const result = await runOnce({ repoRoot, config, worktreeDir, dryRun: true, log: noLog });

  assert.equal(result.outcome, 'dry-run');
  assert.equal(result.plan.dispatch, 'item-plan');
  assert.equal(result.plan.tier, 'standard');
  assert.equal(result.plan.model, 'sonnet');
  assert.equal(result.plan.branch, 'fgw/item-plan');
  assert.equal(result.exitCode, 0);
  assert.equal(countRuns(counterFile), 0); // nothing dispatched
  assert.equal(readRawEvents(dir).length, 1); // only the seeding work.add
  assert.equal(listWork(dir).work['item-plan'].status, 'todo');
  assert.equal(branchExists(repoRoot, 'fgw/item-plan'), false);
  assert.deepEqual(fs.readdirSync(worktreeDir), []);
});

// --- the binary: repo root from cwd, categorized exit ----------------------

test('bin/fgos-runner.mjs run from a SUBDIRECTORY of another repo operates on that repo (root from cwd, never __dirname)', () => {
  const { repoRoot, dir, scriptDir, counterFile } = setup();
  seedItem(dir, { id: 'item-cli' });
  const scriptPath = writeCommittingExecutor(scriptDir, counterFile);
  fs.writeFileSync(
    path.join(repoRoot, '.fgos-runner.json'),
    JSON.stringify({
      executor: { command: process.execPath, args: [scriptPath, '{prompt}', '--model', '{model}'] },
      models: { light: 'haiku', standard: 'sonnet', heavy: 'opus' },
      timeoutMs: 30000,
    }),
  );
  const nested = path.join(repoRoot, 'nested');
  fs.mkdirSync(nested);
  const runnerBin = path.resolve(import.meta.dirname, '../../bin/fgos-runner.mjs');

  const run = spawnSync(process.execPath, [runnerBin, '--once'], { cwd: nested, encoding: 'utf8' });

  assert.equal(run.status, 0, `stderr: ${run.stderr}`);
  assert.match(run.stdout, /proposed/);
  assert.equal(listWork(dir).work['item-cli'].status, 'proposed');
  assert.equal(branchExists(repoRoot, 'fgw/item-cli'), true);
});

test('bin/fgos-runner.mjs rejects an unknown flag with the validation exit code', () => {
  const repoRoot = initTempRepo();
  const runnerBin = path.resolve(import.meta.dirname, '../../bin/fgos-runner.mjs');
  const run = spawnSync(process.execPath, [runnerBin, '--frobnicate'], { cwd: repoRoot, encoding: 'utf8' });
  assert.equal(run.status, 4);
  assert.match(run.stderr, /unknown flag/);
});

// --- wgi-8: runner-automatic discovered-from (report-not-write channel) ----
// The worker surfaces newly-discovered work as a fenced ```fgos-discovered
// JSON block in its output; the RUNNER (never the worker, D3) creates each
// item, stamping discoveredFrom = the dispatched item's id. Discovered items
// enter at stage `clarify` with a placeholder verify, exactly like a submit.

/** A committing worker that ALSO emits one fgos-discovered block per entry in
 * `bodies` on stdout (bodies are raw strings, so a test can feed malformed
 * JSON too). With `commit: false` the verify target is never produced. */
function writeDiscoveringExecutor(scriptDir, counterFile, bodies, { commit = true } = {}) {
  const scriptPath = path.join(scriptDir, 'discovering-executor.mjs');
  const emit = bodies
    .map((body) => `process.stdout.write(${JSON.stringify('```fgos-discovered\n' + body + '\n```\n')});`)
    .join('\n');
  const commitLines = commit
    ? `fs.writeFileSync('output.txt', 'produced by worker\\n');
execFileSync('git', ['add', 'output.txt']);
execFileSync('git', ['commit', '-q', '-m', 'worker: output.txt']);`
    : '';
  fs.writeFileSync(
    scriptPath,
    `
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
fs.appendFileSync(${JSON.stringify(counterFile)}, 'run\\n');
${emit}
${commitLines}
`,
  );
  return scriptPath;
}

test('wgi-8: a worker fgos-discovered block makes the RUNNER create a new item stamped discoveredFrom = the dispatched item (D3: the worker never writes)', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  seedItem(dir, { id: 'item-happy' });
  const body = JSON.stringify({
    title: 'Wire retry metrics into the dashboard',
    kind: 'feature',
    risk: 'standard',
    description: 'surfaced while doing item-happy',
  });
  const config = configFor(writeDiscoveringExecutor(scriptDir, counterFile, [body]));

  const result = await runOnce({ repoRoot, config, worktreeDir, log: noLog });

  assert.equal(result.dispatched[0].outcome, 'proposed');
  const view = listWork(dir);
  const discovered = Object.values(view.work).filter((w) => w.discoveredFrom === 'item-happy');
  assert.equal(discovered.length, 1, 'exactly one discovered item, created by the RUNNER');
  const d = discovered[0];
  assert.equal(d.title, 'Wire retry metrics into the dashboard');
  assert.equal(d.description, 'surfaced while doing item-happy');
  assert.equal(d.status, 'todo');
  assert.equal(d.stage, 'clarify', 'enters at clarify so context-discovery attaches the real verify later');
  assert.equal(d.kind, 'feature', 'block kind override wins over classify()');
  assert.equal(d.risk, 'standard', 'block risk override wins over classify()');
  assert.equal(d.deps.length, 0);
  assert.match(d.verify, /chưa xác định/, 'reuses the shared clarify-entry verify placeholder, not a hardcoded duplicate');
  // D3: the worker committed only its own file; the .fgos work.add for the
  // discovered item was written by the runner, so item-happy still proposed.
  assert.equal(view.work['item-happy'].status, 'proposed');
});

test('wgi-8: a malformed fgos-discovered block is skipped (fail-safe) — the dispatch still proposes and no item is created', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  seedItem(dir, { id: 'item-happy' });
  const config = configFor(writeDiscoveringExecutor(scriptDir, counterFile, ['{ this is not valid json )']));

  const result = await runOnce({ repoRoot, config, worktreeDir, log: noLog });

  assert.equal(result.dispatched[0].outcome, 'proposed', 'a garbled report never derails the dispatch');
  assert.deepEqual(Object.keys(listWork(dir).work), ['item-happy'], 'malformed block creates nothing');
});

/** A worker that emits a discovery block, then hangs past the timeout — so its
 * output reaches the runner on the DispatchError(err.stdout) path, never
 * worker.stdout. Proves the terminal-outcome capture covers BOTH sources. */
function writeHangingDiscoveringExecutor(scriptDir, body) {
  const scriptPath = path.join(scriptDir, 'hanging-discovering-executor.mjs');
  fs.writeFileSync(
    scriptPath,
    `
process.stdout.write(${JSON.stringify('```fgos-discovered\n' + body + '\n```\n')});
await new Promise(() => {}); // hang until SIGTERM (timeout)
`,
  );
  return scriptPath;
}

test('wgi-8: even a TIMED-OUT worker (output on the err.stdout path) has its fgos-discovered report captured exactly once at the terminal outcome, no duplicate across the retry', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir } = setup();
  seedItem(dir, { id: 'item-slow' });
  const body = JSON.stringify({ title: 'Investigate the slow path' });
  const scriptPath = writeHangingDiscoveringExecutor(scriptDir, body);
  const config = {
    executor: { command: process.execPath, args: [scriptPath, '{prompt}'] },
    models: { light: 'haiku', standard: 'sonnet', heavy: 'opus' },
    timeoutMs: 400,
  };

  const result = await runOnce({ repoRoot, config, worktreeDir, log: noLog });

  assert.notEqual(result.dispatched[0].outcome, 'proposed', 'the item itself times out — it never proposes');
  const discovered = Object.values(listWork(dir).work).filter((w) => w.discoveredFrom === 'item-slow');
  assert.equal(discovered.length, 1, 'the err.stdout (timeout) report is captured once, never duplicated across retries');
  assert.equal(discovered[0].title, 'Investigate the slow path');
});
