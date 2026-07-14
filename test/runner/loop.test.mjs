import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { initStore, addWork, moveWork, listWork, readRawEvents, readyWork } from '../../src/state/store.mjs';
import { createWorktree, removeWorktree } from '../../src/runner/worktree.mjs';
import { runOnce } from '../../src/runner/loop.mjs';

// Fake executors only — every "worker" spawned here is a node script this
// file writes into a mkdtemp directory. Every test builds its own
// disposable git repo (git init in mkdtemp) with its own `.fgos/` inside
// it; nothing here ever creates a worktree, a branch, or a `.fgos/` entry
// in THIS repo (forgent itself).

const noLog = () => {};

function initTempRepo() {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-loop-test-repo-'));
  execFileSync('git', ['init', '-q'], { cwd: repoRoot });
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

test('runOnce full circle: todo -> doing -> worker commit -> goal-check pass -> proposed, branch kept, worktree gone, runner is the only .fgos writer', () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  seedItem(dir, { id: 'item-happy' });
  const config = configFor(writeCommittingExecutor(scriptDir, counterFile));

  const result = runOnce({ repoRoot, config, worktreeDir, log: noLog });

  assert.equal(result.outcome, 'proposed');
  assert.equal(result.id, 'item-happy');
  assert.equal(result.branch, 'fgw/item-happy');
  assert.equal(result.exitCode, 0);
  assert.equal(listWork(dir).work['item-happy'].status, 'proposed');
  assert.equal(branchExists(repoRoot, 'fgw/item-happy'), true);
  const log = execFileSync('git', ['log', '--oneline', 'fgw/item-happy'], { cwd: repoRoot, encoding: 'utf8' });
  assert.match(log, /worker: output\.txt/);
  // worktree torn down, branch survives (D4 proposal artifact)
  assert.deepEqual(fs.readdirSync(worktreeDir), []);
  // one door: the log carries exactly the runner's writes — the worker
  // never touched .fgos/ (add + claim + propose, nothing else)
  const events = readRawEvents(dir);
  assert.deepEqual(
    events.map((e) => `${e.type}:${e.payload.to ?? 'add'}`),
    ['work.add:add', 'work.move:doing', 'work.move:proposed'],
  );
});

// --- verify-miss: retry then park ----------------------------------------

test('verify-miss: worker commits the wrong thing -> retry once, then park to blocked (never proposed)', () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  seedItem(dir, { id: 'item-miss' });
  // commits junk.txt, but verify demands output.txt -> goal-check miss
  const config = configFor(writeCommittingExecutor(scriptDir, counterFile, 'junk.txt'));

  const result = runOnce({ repoRoot, config, worktreeDir, log: noLog });

  assert.equal(result.outcome, 'parked');
  assert.equal(result.errorClass, 'verify-miss');
  assert.equal(result.attempts, 2);
  assert.equal(countRuns(counterFile), 2); // retry really re-dispatched
  assert.equal(listWork(dir).work['item-miss'].status, 'blocked');
  assert.deepEqual(fs.readdirSync(worktreeDir), []);
});

test('verify passes but the worker never committed -> classified verify-miss, parked after retries', () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  seedItem(dir, { id: 'item-nocommit' });
  const config = configFor(writeNonCommittingExecutor(scriptDir, counterFile));

  const result = runOnce({ repoRoot, config, worktreeDir, log: noLog });

  assert.equal(result.outcome, 'parked');
  assert.equal(result.errorClass, 'verify-miss');
  assert.equal(listWork(dir).work['item-nocommit'].status, 'blocked');
  assert.deepEqual(fs.readdirSync(worktreeDir), []);
});

// --- spawn-fail: routed by the recovery matrix ----------------------------

test('worker-spawn-fail: nonexistent executor -> retry per matrix, then park to blocked', () => {
  const { repoRoot, dir, worktreeDir } = setup();
  seedItem(dir, { id: 'item-nospawn' });
  const config = {
    executor: { command: '/no/such/executor-binary-xyz', args: ['{prompt}'] },
    models: { light: 'haiku', standard: 'sonnet', heavy: 'opus' },
    timeoutMs: 30000,
  };

  const result = runOnce({ repoRoot, config, worktreeDir, log: noLog });

  assert.equal(result.outcome, 'parked');
  assert.equal(result.errorClass, 'worker-spawn-fail');
  assert.equal(result.attempts, 2);
  assert.equal(listWork(dir).work['item-nospawn'].status, 'blocked');
  assert.deepEqual(fs.readdirSync(worktreeDir), []);
});

// --- anti-loop: max-visits parks the item OFF the frontier ----------------

test('anti-loop: an item at MAX_VISITS is parked todo -> blocked and truly leaves the frontier — the next item runs in the same pass', () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  seedItem(dir, { id: 'item-loopy' });
  seedItem(dir, { id: 'item-fresh' });
  // one prior visit for item-loopy: todo -> doing -> blocked -> todo
  moveWork(dir, { id: 'item-loopy', to: 'doing', expectedStatus: 'todo' });
  moveWork(dir, { id: 'item-loopy', to: 'blocked', expectedStatus: 'doing' });
  moveWork(dir, { id: 'item-loopy', to: 'todo', expectedStatus: 'blocked' });
  const config = configFor(writeCommittingExecutor(scriptDir, counterFile));

  const result = runOnce({ repoRoot, config, worktreeDir, maxVisits: 1, log: noLog });

  // the FIFO head was parked, and the loop moved on instead of hovering
  assert.deepEqual(result.parked, [{ id: 'item-loopy', reason: 'anti-loop-max-visits', visits: 1 }]);
  assert.equal(listWork(dir).work['item-loopy'].status, 'blocked');
  assert.equal(result.outcome, 'proposed');
  assert.equal(result.id, 'item-fresh');
  assert.deepEqual(readyWork(dir), []);
});

// --- circuit breaker: consecutive misses halt the whole run ---------------

test('breaker trip: a goal-check miss at threshold parks the item and halts the run — worktree gone, branch kept (halt path teardown)', () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  seedItem(dir, { id: 'item-breaker' });
  const config = configFor(writeCommittingExecutor(scriptDir, counterFile, 'junk.txt'));

  const result = runOnce({ repoRoot, config, worktreeDir, breakerThreshold: 1, log: noLog });

  assert.equal(result.outcome, 'halted');
  assert.equal(result.reason, 'breaker-tripped');
  assert.equal(result.attempts, 1); // the breaker vetoed the matrix's retry
  assert.equal(result.exitCode, 1);
  assert.equal(countRuns(counterFile), 1);
  assert.equal(listWork(dir).work['item-breaker'].status, 'blocked'); // never dangles in doing
  // removeWorktree ran in the finally even on the halt path
  assert.deepEqual(fs.readdirSync(worktreeDir), []);
  assert.equal(branchExists(repoRoot, 'fgw/item-breaker'), true);
});

// --- startup reap: stale doing + orphan branches --------------------------

test('startup reap: a crashed run\'s doing item with a committed, verify-passing branch is completed to proposed before the frontier runs', () => {
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

  const result = runOnce({ repoRoot, config, worktreeDir, log: noLog });

  assert.deepEqual(result.reap.resolutions, [{ id: 'item-crashed', to: 'proposed', reason: null }]);
  assert.equal(listWork(dir).work['item-crashed'].status, 'proposed');
  assert.equal(result.outcome, 'idle'); // frontier was empty after the reap
  assert.deepEqual(fs.readdirSync(worktreeDir), []);
});

test('startup reap reclaims an orphaned checkout left behind by a genuine crash (worktree teardown never ran) instead of dying raw', () => {
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

  const result = runOnce({ repoRoot, config, worktreeDir, log: noLog });

  assert.deepEqual(result.reap.resolutions, [{ id: 'item-orphaned-crash', to: 'proposed', reason: null }]);
  assert.equal(listWork(dir).work['item-orphaned-crash'].status, 'proposed');
  assert.equal(result.outcome, 'idle');
  // the orphaned checkout is reclaimed, not leaked
  assert.equal(fs.existsSync(wt.path), false);
});

test('startup reap: a doing item with nothing on its branch is reclaimed to blocked (runner-crash-reclaim)', () => {
  const { repoRoot, dir, worktreeDir } = setup();
  seedItem(dir, { id: 'item-vanished' });
  moveWork(dir, { id: 'item-vanished', to: 'doing', expectedStatus: 'todo' });
  const config = {
    executor: { command: '/no/such/executor-binary-xyz', args: ['{prompt}'] },
    models: { standard: 'sonnet' },
    timeoutMs: 30000,
  };

  const result = runOnce({ repoRoot, config, worktreeDir, log: noLog });

  assert.deepEqual(result.reap.resolutions, [
    { id: 'item-vanished', to: 'blocked', reason: 'runner-crash-reclaim' },
  ]);
  assert.equal(listWork(dir).work['item-vanished'].status, 'blocked');
  assert.equal(result.outcome, 'idle');
});

test('startup reap: empty fgw/ orphan branches are pruned, branches carrying commits are kept', () => {
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

  const result = runOnce({ repoRoot, config, worktreeDir, log: noLog });

  assert.deepEqual(result.reap.pruned, ['fgw/orphan-x']);
  assert.deepEqual(result.reap.kept, [{ branch: 'fgw/keeper-y', aheadCount: 1 }]);
  assert.equal(branchExists(repoRoot, 'fgw/orphan-x'), false);
  assert.equal(branchExists(repoRoot, 'fgw/keeper-y'), true);
});

// --- CAS conflict on the runner's own write -> clean halt, exit 3 ---------

test('state-conflict: a racing write under the runner\'s claim makes its own CAS fail -> cleanup, clean halt, exit 3', () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  seedItem(dir, { id: 'item-race' });
  const config = configFor(writeRacingExecutor(scriptDir, counterFile, dir, 'item-race'));

  const result = runOnce({ repoRoot, config, worktreeDir, log: noLog });

  assert.equal(result.outcome, 'halted');
  assert.equal(result.errorClass, 'state-conflict');
  assert.equal(result.exitCode, 3);
  // the racing writer's state stands — the runner never overwrote it blindly
  assert.equal(listWork(dir).work['item-race'].status, 'blocked');
  // cleanup still ran on this halt path: worktree gone, branch kept
  assert.deepEqual(fs.readdirSync(worktreeDir), []);
  assert.equal(branchExists(repoRoot, 'fgw/item-race'), true);
});

// --- dry-run: reads only, writes nothing ----------------------------------

test('dry-run: prints the plan (tier -> model, branch) and writes no event, no branch, no worktree', () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  seedItem(dir, { id: 'item-plan' });
  const config = configFor(writeCommittingExecutor(scriptDir, counterFile));

  const result = runOnce({ repoRoot, config, worktreeDir, dryRun: true, log: noLog });

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
