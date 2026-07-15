import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';

// e2e — the runner's own binary (bin/fgos-runner.mjs), exercised as a real
// child process against a real, disposable git repo, alongside the CLI
// binary (bin/fgos.mjs) for setup. Nothing here imports src/runner or
// src/state directly (per this cell's prohibitions): every assertion reads
// the on-disk log/branch state the same way an outside observer would.
//
// Every test builds its own mkdtemp temp repo + temp worktree dir + temp
// executor-script dir — never the main repo's own `.fgos/`, worktrees, or
// branches. Fake executors are self-contained Node scripts (no deps); item
// `verify` commands are self-contained shell checks (`test -f ...`) since a
// temp repo carries no test suite of its own.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FGOS = path.resolve(__dirname, '../../bin/fgos.mjs');
const RUNNER = path.resolve(__dirname, '../../bin/fgos-runner.mjs');

function mkTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function initTempRepo() {
  const repoRoot = mkTempDir('fgos-runner-e2e-repo-');
  execFileSync('git', ['init', '-q'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: repoRoot });
  fs.writeFileSync(path.join(repoRoot, 'seed.txt'), 'seed\n');
  execFileSync('git', ['add', 'seed.txt'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-q', '-m', 'root commit'], { cwd: repoRoot });
  return repoRoot;
}

function fgos(cwd, args) {
  return spawnSync(process.execPath, [FGOS, ...args], { cwd, encoding: 'utf8' });
}

function runner(cwd, args = ['--once']) {
  return spawnSync(process.execPath, [RUNNER, ...args], { cwd, encoding: 'utf8' });
}

function add(cwd, id, extra = {}) {
  const flags = [
    '--title', extra.title ?? `Title ${id}`,
    '--kind', extra.kind ?? 'task',
    '--risk', extra.risk ?? 'low',
    '--verify', extra.verify ?? 'test -f output.txt',
  ];
  if (extra.deps && extra.deps.length) flags.push('--deps', extra.deps.join(','));
  const result = fgos(cwd, ['add', id, ...flags]);
  assert.equal(result.status, 0, `fgos add ${id} failed: ${result.stderr}`);
  return result;
}

function logPath(cwd) {
  return path.join(cwd, '.fgos', 'events.jsonl');
}

function viewPath(cwd) {
  return path.join(cwd, '.fgos', 'state.json');
}

function stateView(cwd) {
  return JSON.parse(fs.readFileSync(viewPath(cwd), 'utf8'));
}

function events(cwd) {
  return fs
    .readFileSync(logPath(cwd), 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function writeRunnerConfig(repoRoot, executorScript) {
  fs.writeFileSync(
    path.join(repoRoot, '.fgos-runner.json'),
    JSON.stringify({
      executor: { command: process.execPath, args: [executorScript, '{prompt}', '--model', '{model}'] },
      models: { light: 'haiku', standard: 'sonnet', heavy: 'opus' },
      timeoutMs: 15000,
    }),
  );
}

function branchLog(repoRoot, branch) {
  return execFileSync('git', ['log', '--oneline', branch], { cwd: repoRoot, encoding: 'utf8' });
}

function branchAheadCount(repoRoot, branch) {
  const mergeBase = execFileSync('git', ['merge-base', 'HEAD', branch], { cwd: repoRoot, encoding: 'utf8' }).trim();
  const count = execFileSync('git', ['rev-list', '--count', `${mergeBase}..${branch}`], {
    cwd: repoRoot,
    encoding: 'utf8',
  }).trim();
  return parseInt(count, 10) || 0;
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

/** Count of live `git worktree` entries for `repoRoot` (the main worktree
 * itself always counts as 1) — the binary never accepts a test-controlled
 * `worktreeDir` (that override only exists for the library-level unit
 * tests), so "no leak" here is measured the only environment-independent
 * way available to an e2e test: repoRoot's own worktree admin state, not a
 * directory listing under the shared OS temp dir. */
function worktreeCount(repoRoot) {
  const out = execFileSync('git', ['worktree', 'list', '--porcelain'], { cwd: repoRoot, encoding: 'utf8' });
  return out.split('\n').filter((line) => line.startsWith('worktree ')).length;
}

/** A well-behaved fake executor: writes the file the item's own verify
 * checks for, commits it on the current branch. Self-contained (no deps
 * beyond node:fs/node:child_process), never touches `.fgos/`. */
function writeCommittingExecutor(scriptDir, produce = 'output.txt') {
  const scriptPath = path.join(scriptDir, 'committing-executor.mjs');
  fs.writeFileSync(
    scriptPath,
    `
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
fs.writeFileSync(${JSON.stringify(produce)}, 'produced by worker\\n');
execFileSync('git', ['add', ${JSON.stringify(produce)}]);
execFileSync('git', ['commit', '-q', '-m', ${JSON.stringify(`worker: ${produce}`)}]);
`,
  );
  return scriptPath;
}

/** A fake executor that commits something that does NOT satisfy the item's
 * verify — every dispatch is a real, deterministic goal-check miss. */
function writeWrongCommitExecutor(scriptDir) {
  const scriptPath = path.join(scriptDir, 'wrong-commit-executor.mjs');
  fs.writeFileSync(
    scriptPath,
    `
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
fs.writeFileSync('junk.txt', 'not what verify wants\\n');
execFileSync('git', ['add', 'junk.txt']);
execFileSync('git', ['commit', '-q', '-m', 'worker: junk.txt']);
`,
  );
  return scriptPath;
}

/** A fake executor that reproduces a genuine runner crash: it commits the
 * real proof file (so the branch carries a legitimate worker commit), then
 * kills its OWN PARENT (the runner process, still blocked inside
 * `spawnSync` waiting on this very child) before the runner ever gets to
 * write `proposed`. This is not a simulated/hand-built post-crash state —
 * it is a real SIGKILL of the real runner process, mid-dispatch, so
 * whatever the OS/git left behind (worktree checkout included) is exactly
 * what a real crash leaves behind. */
function writeParentKillingExecutor(scriptDir, produce = 'output.txt') {
  const scriptPath = path.join(scriptDir, 'parent-killing-executor.mjs');
  fs.writeFileSync(
    scriptPath,
    `
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
fs.writeFileSync(${JSON.stringify(produce)}, 'produced by worker\\n');
execFileSync('git', ['add', ${JSON.stringify(produce)}]);
execFileSync('git', ['commit', '-q', '-m', ${JSON.stringify(`worker: ${produce}`)}]);
process.kill(process.ppid, 'SIGKILL');
await new Promise((resolve) => setTimeout(resolve, 200));
process.exit(1);
`,
  );
  return scriptPath;
}

// --- case 1: full journey, two items with a dep -----------------------------

test('e2e full journey: item1 (no deps) -> proposed with a worker commit on fgw/, item2 (dep on item1) stays closed while item1 is only proposed, second --once dispatches nothing', () => {
  const repoRoot = initTempRepo();
  const scriptDir = mkTempDir('fgos-runner-e2e-exec-');

  assert.equal(fgos(repoRoot, ['init']).status, 0);
  add(repoRoot, 'item1', { verify: 'test -f output.txt && echo VERIFY_OK' });
  add(repoRoot, 'item2', { deps: ['item1'], verify: 'test -f output2.txt' });

  writeRunnerConfig(repoRoot, writeCommittingExecutor(scriptDir, 'output.txt'));

  const eventsBeforeAdds = events(repoRoot);
  assert.equal(eventsBeforeAdds.length, 2, 'only the two work.add events so far');
  assert.equal(eventsBeforeAdds[0].type, 'work.add');
  assert.equal(eventsBeforeAdds[1].type, 'work.add');

  const first = runner(repoRoot, ['--once']);
  assert.equal(first.status, 0, `first --once failed: ${first.stderr}`);
  assert.match(first.stdout, /proposed/);
  assert.match(first.stdout, /item1/);

  // item1 proposed, item2 untouched (still todo — its dep is not `done`).
  const afterFirst = stateView(repoRoot);
  assert.equal(afterFirst.work.item1.status, 'proposed');
  assert.equal(afterFirst.work.item2.status, 'todo');

  // fgw/item1 exists and carries exactly the worker's commit.
  assert.equal(branchExists(repoRoot, 'fgw/item1'), true);
  assert.match(branchLog(repoRoot, 'fgw/item1'), /worker: output\.txt/);
  assert.equal(branchAheadCount(repoRoot, 'fgw/item1'), 1);
  assert.equal(branchExists(repoRoot, 'fgw/item2'), false, 'item2 was never dispatched');

  // the runner ran the item's OWN verify itself (goal-check) — its stdout
  // is the evidence, not the worker's say-so: the tail the runner prints
  // carries the marker only `test -f output.txt && echo VERIFY_OK` prints.
  assert.match(first.stdout, /VERIFY_OK/);

  // events.jsonl carries the real chain: two adds, then doing, then a
  // predicted work.outcome (written at claim), then proposed for item1
  // only, then an actual work.outcome (written on the pass terminal) —
  // every event from Phase 2 on carries `v`.
  const afterFirstEvents = events(repoRoot);
  assert.deepEqual(
    afterFirstEvents.map((e) => (e.type === 'work.outcome'
      ? `work.outcome:${e.payload.id}:${e.payload.predicted ? 'predicted' : 'actual'}`
      : `${e.type}:${e.payload.id}:${e.payload.to ?? 'add'}`)),
    [
      'work.add:item1:add',
      'work.add:item2:add',
      'work.move:item1:doing',
      'work.outcome:item1:predicted',
      'work.move:item1:proposed',
      'work.outcome:item1:actual',
    ],
  );
  const doingEvent = afterFirstEvents.find((e) => e.type === 'work.move' && e.payload.to === 'doing');
  const proposedEvent = afterFirstEvents.find((e) => e.type === 'work.move' && e.payload.to === 'proposed');
  assert.equal(doingEvent.payload.id, 'item1');
  assert.equal(proposedEvent.payload.id, 'item1');
  assert.equal(typeof doingEvent.v, 'number', 'doing event carries a schema version');
  assert.equal(typeof proposedEvent.v, 'number', 'proposed event carries a schema version');
  // actual is real dispatch evidence (real subprocess, real goal-check),
  // sourced from the runner's own branchFacts — never the worker's report.
  const actualOutcomeEvent = afterFirstEvents.find((e) => e.type === 'work.outcome' && e.payload.actual);
  assert.equal(actualOutcomeEvent.payload.actual.outcome, 'proposed');
  assert.equal(actualOutcomeEvent.payload.actual.passed, true);
  assert.equal(actualOutcomeEvent.payload.actual.aheadCount, 1);

  // second --once: item2's dep (item1) is `proposed`, not `done` — the
  // frontier is empty, nothing gets dispatched a second time.
  const second = runner(repoRoot, ['--once']);
  assert.equal(second.status, 0, `second --once failed: ${second.stderr}`);
  assert.match(second.stdout, /idle/);
  assert.equal(stateView(repoRoot).work.item2.status, 'todo');
  assert.equal(events(repoRoot).length, afterFirstEvents.length, 'the idle pass appended no event');
});

// --- case 2: verify-red -> blocked, never proposed --------------------------

test('e2e verify-red: a worker that commits the wrong thing fails goal-check on every attempt -> retried per the matrix, then parked blocked, never proposed', () => {
  const repoRoot = initTempRepo();
  const scriptDir = mkTempDir('fgos-runner-e2e-exec-');

  assert.equal(fgos(repoRoot, ['init']).status, 0);
  add(repoRoot, 'item-red', { verify: 'test -f output.txt' });
  writeRunnerConfig(repoRoot, writeWrongCommitExecutor(scriptDir));

  const result = runner(repoRoot, ['--once']);
  assert.equal(result.status, 0, `--once should still exit 0 for a parked item: ${result.stderr}`);
  assert.match(result.stdout, /parked/);

  assert.equal(stateView(repoRoot).work['item-red'].status, 'blocked');
  assert.notEqual(stateView(repoRoot).work['item-red'].status, 'proposed');
  assert.equal(branchExists(repoRoot, 'fgw/item-red'), true, 'the (wrong) attempt still leaves its branch behind');

  const redEvents = events(repoRoot);
  const seq = redEvents.map((e) => (e.type === 'work.outcome'
    ? `work.outcome:${e.payload.predicted ? 'predicted' : 'actual'}`
    : `${e.type}:${e.payload.to ?? e.payload.id ?? ''}`));
  assert.deepEqual(seq, [
    'work.add:item-red',
    'work.move:doing',
    'work.outcome:predicted',
    'work.move:blocked',
    'work.outcome:actual',
  ]);

  // actual on the park terminal, real verify-red evidence — closes the
  // HIGH-risk "failures learn nothing" gap: a park must not be silent.
  const actualOutcomeEvent = redEvents.find((e) => e.type === 'work.outcome' && e.payload.actual);
  assert.equal(actualOutcomeEvent.payload.actual.outcome, 'parked');
  assert.equal(actualOutcomeEvent.payload.actual.passed, false);
  assert.equal(actualOutcomeEvent.payload.actual.errorClass, 'verify-miss');
});

// --- case 3: crash-idempotency ----------------------------------------------

test('e2e crash-idempotency: runner killed mid-item (after doing, before proposed) -> a second --once reaps the item to a defined state, exactly one worker commit, no leaked worktree', () => {
  const repoRoot = initTempRepo();
  const scriptDir = mkTempDir('fgos-runner-e2e-exec-');

  assert.equal(fgos(repoRoot, ['init']).status, 0);
  add(repoRoot, 'item-crash', { verify: 'test -f output.txt' });
  writeRunnerConfig(repoRoot, writeParentKillingExecutor(scriptDir, 'output.txt'));

  // First --once: the worker commits, then SIGKILLs its own parent (the
  // runner) before the runner can write `proposed`. The runner process
  // dies mid-dispatch — its own worktree teardown (in a `finally`) never
  // runs, so `fgw/item-crash` is left checked out at whatever path the
  // runner allocated for this attempt.
  const first = runner(repoRoot, ['--once', '--config', path.join(repoRoot, '.fgos-runner.json')]);
  // Killed by SIGKILL: no graceful exit code, no controlled stdout.
  assert.equal(first.status, null);
  assert.equal(first.signal, 'SIGKILL');

  // The claim (todo -> doing) landed before the kill; the item is left
  // sitting in `doing` with a real commit already on its branch.
  assert.equal(stateView(repoRoot).work['item-crash'].status, 'doing');
  assert.equal(branchExists(repoRoot, 'fgw/item-crash'), true);
  assert.equal(branchAheadCount(repoRoot, 'fgw/item-crash'), 1);

  // Second --once: the killed runner left its runner.lock behind, so this
  // run cleans the stale lock and yields busy (exit 6) — the reclaimer
  // never acquires on the path it just deleted (clean-and-yield).
  const second = runner(repoRoot, ['--once', '--config', path.join(repoRoot, '.fgos-runner.json')]);
  assert.equal(second.status, 6, `expected busy (stale lock cleaned): ${second.stderr}`);
  assert.equal(fs.existsSync(path.join(repoRoot, '.fgos', 'runner.lock')), false);

  // Third --once: acquires a clean lock; startup reap resolves the stale
  // `doing` item to a defined state (proposed, since the branch's commit
  // passes verify) — crash recovery lands within two ticks.
  const third = runner(repoRoot, ['--once', '--config', path.join(repoRoot, '.fgos-runner.json')]);
  assert.equal(third.status, 0, `post-clean --once did not recover cleanly: ${third.stderr}`);

  const finalStatus = stateView(repoRoot).work['item-crash'].status;
  assert.ok(
    finalStatus === 'proposed' || finalStatus === 'blocked',
    `expected the crashed item to reap to a defined state (proposed/blocked), got "${finalStatus}"`,
  );

  // Exactly one worker commit on the branch — the reap must never re-run
  // (and hence never re-commit) the same item.
  assert.equal(branchAheadCount(repoRoot, 'fgw/item-crash'), 1);

  // No worktree leak: only the main worktree is still registered against
  // this repo — the killed first attempt's checkout and the second
  // attempt's own throwaway reap checkout must both be gone.
  assert.equal(worktreeCount(repoRoot), 1);
});
