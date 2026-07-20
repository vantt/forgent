import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';

// e2e — the PR gate (pr-lifecycle D1-D5): review/approve/reject exercised
// through the real fgos.mjs and fgos-runner.mjs binaries against a real,
// disposable git repo, mirroring runner-loop.test.mjs's own discipline
// (mkdtemp repo, real subprocesses, on-disk log/state as the only source of
// truth for assertions — nothing here imports src/runner or src/state
// directly). The pre-`proposed` chain (submit -> clarify -> decompose) is
// already covered by the stage-clarify/stage-decompose e2e suites in
// runner-loop.test.mjs; this file starts every scenario from a plain `add`
// (stage defaults to `executing`, per work.mjs D8) so it stays scoped to the
// gate itself: review, approve (merge-then-verify or verify-only), reject.
//
// TRUNK NAME: unlike runner-loop.test.mjs's plain `git init`, every repo here
// is initialized with `git init -b main` — merge.mjs's runner-source review
// (`git diff main...fgw/<id>`) and merge (`git merge ... fgw/<id>` while on
// main) both assume that literal trunk name (per plan.md's locked Approach,
// mirrored by test/runner/merge.test.mjs and test/cli/fgos.test.mjs's own
// `initGitCwdMain`). `.fgos/state.json` is gitignored (derived view) while
// `.fgos/events.jsonl` (the truth log) is a real tracked file, same
// convention this repo's own `.gitignore` declares — `approve`'s runner path
// refuses a dirty main tree, so every scenario that reaches a real merge
// folds pending log deltas into a real commit first (`commitPending`),
// exactly like a human would commit their own state bookkeeping alongside
// code.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FGOS = path.resolve(__dirname, '../../bin/fgos.mjs');
const RUNNER = path.resolve(__dirname, '../../bin/fgos-runner.mjs');

function mkTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function initTempRepo() {
  const repoRoot = mkTempDir('fgos-pr-gate-e2e-repo-');
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: repoRoot });
  fs.writeFileSync(path.join(repoRoot, '.gitignore'), '.fgos/state.json\n');
  fs.writeFileSync(path.join(repoRoot, 'seed.txt'), 'seed\n');
  execFileSync('git', ['add', 'seed.txt', '.gitignore'], { cwd: repoRoot });
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
  const result = fgos(cwd, ['add', id, ...flags]);
  assert.equal(result.status, 0, `fgos add ${id} failed: ${result.stderr}`);
  return result;
}

function viewPath(cwd) {
  return path.join(cwd, '.fgos', 'state.json');
}

function stateView(cwd) {
  return JSON.parse(fs.readFileSync(viewPath(cwd), 'utf8'));
}

// Every verb's success path prints a single fgos.v1 envelope
// {contract, generated_at, data_hash, data} — this unwraps it to the verb's
// own structured data.
function envelopeData(stdout) {
  return JSON.parse(stdout).data;
}

function events(cwd) {
  return fs
    .readFileSync(path.join(cwd, '.fgos', 'events.jsonl'), 'utf8')
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

/** A well-behaved fake executor: writes the file the item's own verify
 * checks for, commits it on the current (branch) checkout. */
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

/** Scenario (b)'s conflict executor: overwrites `filename` (already seeded
 * with different content on main) instead of producing a fresh file, so the
 * branch and main diverge on the SAME path — the real ingredient for a real
 * `git merge` conflict. */
function writeOverwritingExecutor(scriptDir, filename, content) {
  const scriptPath = path.join(scriptDir, 'overwriting-executor.mjs');
  fs.writeFileSync(
    scriptPath,
    `
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
fs.writeFileSync(${JSON.stringify(filename)}, ${JSON.stringify(content)});
execFileSync('git', ['add', ${JSON.stringify(filename)}]);
execFileSync('git', ['commit', '-q', '-m', ${JSON.stringify(`worker changes ${filename}`)}]);
`,
  );
  return scriptPath;
}

function gitAt(repoRoot, args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' });
}

function currentHead(repoRoot) {
  return gitAt(repoRoot, ['rev-parse', 'HEAD']).trim();
}

/** Folds every pending `.fgos/` delta (events.jsonl, plus whatever real
 * files a step just produced) into one real commit on main — the same
 * "commit your own state bookkeeping" convention test/cli/fgos.test.mjs's
 * `commitPending` and the S2-pull e2e scenario already rely on, required
 * before any call that refuses a dirty tree (`approve` on a runner item,
 * `return`). */
function commitPending(repoRoot, message) {
  gitAt(repoRoot, ['add', '-A']);
  gitAt(repoRoot, ['commit', '-q', '-m', message]);
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

/** Count of live `git worktree` entries (the main worktree itself always
 * counts as 1) — mirrors runner-loop.test.mjs's own `worktreeCount`. */
function worktreeCount(repoRoot) {
  const out = gitAt(repoRoot, ['worktree', 'list', '--porcelain']);
  return out.split('\n').filter((line) => line.startsWith('worktree ')).length;
}

// --- (a) runner item, full loop: proposed -> review -> approve -> merge ->
// done, with all three of the must_have's "dấu vết" checked -------------

test('e2e pr-gate (a) runner item full loop: add -> runner dispatch -> proposed, review shows the branch diff, approve merges + verifies -> done with settlement actor human, câu-6 learning present, and the branch/worktree are cleaned up', () => {
  const repoRoot = initTempRepo();
  const scriptDir = mkTempDir('fgos-pr-gate-e2e-a-');

  assert.equal(fgos(repoRoot, ['init']).status, 0);
  add(repoRoot, 'pr-a-item', { verify: 'test -f pr-a-produced.txt && echo PR_A_OK' });
  writeRunnerConfig(repoRoot, writeCommittingExecutor(scriptDir, 'pr-a-produced.txt'));

  const dispatch = runner(repoRoot, ['--once']);
  assert.equal(dispatch.status, 0, `--once failed: ${dispatch.stderr}`);
  assert.equal(stateView(repoRoot).work['pr-a-item'].status, 'proposed');
  assert.equal(branchExists(repoRoot, 'fgw/pr-a-item'), true);

  const review = fgos(repoRoot, ['review', 'pr-a-item']);
  assert.equal(review.status, 0, `review failed: ${review.stderr}`);
  const reviewData = envelopeData(review.stdout);
  assert.equal(reviewData.source, 'runner');
  assert.match(reviewData.diff, /pr-a-produced\.txt/);

  // A coding item must pass through the compound-learn stage before done (D3).
  assert.equal(fgos(repoRoot, ['compound', 'pr-a-item']).status, 0);

  // approve's runner path refuses a dirty main tree — fold the init/add/
  // dispatch/compound log deltas into one real commit first.
  commitPending(repoRoot, 'state: propose pr-a-item');

  const approve = fgos(repoRoot, ['approve', 'pr-a-item']);
  assert.equal(approve.status, 0, `approve failed: ${approve.stderr}`);
  const approveData = envelopeData(approve.stdout);
  assert.equal(approveData.to, 'done');
  assert.match(approveData.output, /PR_A_OK/);

  const view = stateView(repoRoot);
  assert.equal(view.work['pr-a-item'].status, 'done');

  // 3 marks (must_haves truth 2):
  assert.equal(view.settlements['pr-a-item'][0].kind, 'close');
  assert.equal(view.settlements['pr-a-item'][0].actor, 'human', 'D3: the approver is the settlement actor, merge is only the mechanical consequence');
  assert.ok(view.learnings['pr-a-item'][0], 'câu-6 learning record must be present on the close edge');
  assert.equal(branchExists(repoRoot, 'fgw/pr-a-item'), false, 'the fully-merged branch is cleaned up');
  assert.equal(worktreeCount(repoRoot), 1, 'no leaked worktree after cleanup');

  assert.ok(fs.existsSync(path.join(repoRoot, 'pr-a-produced.txt')), 'the merged file is present on main');
});

// --- (b) real conflict: main and the branch diverge on the same file ----

test('e2e pr-gate (b) conflict: approving a runner item whose branch conflicts with a diverged main aborts the merge cleanly -> blocked (reason merge-conflict), main left byte-for-byte intact', () => {
  const repoRoot = initTempRepo();
  const scriptDir = mkTempDir('fgos-pr-gate-e2e-b-');

  assert.equal(fgos(repoRoot, ['init']).status, 0);
  fs.writeFileSync(path.join(repoRoot, 'shared.txt'), 'base\n');
  commitPending(repoRoot, 'seed shared.txt');

  add(repoRoot, 'pr-b-item', { verify: 'test -f shared.txt' });
  writeRunnerConfig(repoRoot, writeOverwritingExecutor(scriptDir, 'shared.txt', 'branch-change\n'));

  const dispatch = runner(repoRoot, ['--once']);
  assert.equal(dispatch.status, 0, `--once failed: ${dispatch.stderr}`);
  assert.equal(stateView(repoRoot).work['pr-b-item'].status, 'proposed');

  commitPending(repoRoot, 'state: propose pr-b-item');

  // Main diverges on the exact same path the branch already changed.
  fs.writeFileSync(path.join(repoRoot, 'shared.txt'), 'main-diverged\n');
  gitAt(repoRoot, ['add', 'shared.txt']);
  gitAt(repoRoot, ['commit', '-q', '-m', 'main changes shared.txt']);

  const headBefore = currentHead(repoRoot);
  const approve = fgos(repoRoot, ['approve', 'pr-b-item']);
  assert.equal(approve.status, 0, `approve failed: ${approve.stderr}`);
  const approveData = envelopeData(approve.stdout);
  assert.equal(approveData.to, 'blocked');
  assert.equal(approveData.reason, 'merge-conflict');

  // must_haves truth 1 (HIGH risk): main is byte-for-byte intact. Scoped to
  // the real working tree, excluding `.fgos/` — approve legitimately appends
  // its own blocked-transition record to events.jsonl right after aborting
  // the merge, which is expected bookkeeping, not a merge leftover.
  assert.equal(currentHead(repoRoot), headBefore, 'HEAD must be unchanged after an aborted merge');
  assert.equal(
    gitAt(repoRoot, ['status', '--porcelain', '--', '.', ':!.fgos']).trim(),
    '',
    'the tracked working tree (outside .fgos bookkeeping) must be clean after an aborted merge',
  );
  assert.equal(fs.readFileSync(path.join(repoRoot, 'shared.txt'), 'utf8'), 'main-diverged\n', 'main content must be unchanged');

  const view = stateView(repoRoot);
  assert.equal(view.work['pr-b-item'].status, 'blocked');
  assert.equal(view.frictions['pr-b-item'][0].errorClass, 'merge-conflict');
  assert.equal(branchExists(repoRoot, 'fgw/pr-b-item'), true, 'a conflicted merge never reaches cleanup — the branch survives for a human to resolve');
});

// --- (c) pull-door item: take/return, review the head-range diff, approve
// re-verifies on main (no merge step, D4) ---------------------------------

test('e2e pr-gate (c) pull-door item: take -> commit -> return -> proposed, review shows the exact headAtTake..headAtReturn diff, approve re-verifies on main (no merge) -> done', () => {
  const repoRoot = initTempRepo();

  assert.equal(fgos(repoRoot, ['init']).status, 0);
  add(repoRoot, 'pr-c-item', { verify: 'test -f pr-c-proof.txt && echo PULL_C_OK' });

  const headAtTake = currentHead(repoRoot);
  const taken = fgos(repoRoot, ['take', '--id', 'pr-c-item']);
  assert.equal(taken.status, 0, `take failed: ${taken.stderr}`);

  // The human's own commit folds the proof file AND whatever events.jsonl
  // deltas add/take already appended — one commit, one entry in the
  // headAtTake..headAtReturn range (mirrors the S2-pull e2e in
  // runner-loop.test.mjs).
  fs.writeFileSync(path.join(repoRoot, 'pr-c-proof.txt'), 'done by hand\n');
  gitAt(repoRoot, ['add', '-A']);
  gitAt(repoRoot, ['commit', '-q', '-m', 'human: pr-c-proof.txt']);

  const returned = fgos(repoRoot, ['return', 'pr-c-item']);
  assert.equal(returned.status, 0, `return failed: ${returned.stderr}`);
  assert.equal(stateView(repoRoot).work['pr-c-item'].status, 'proposed');

  const review = fgos(repoRoot, ['review', 'pr-c-item']);
  assert.equal(review.status, 0, `review failed: ${review.stderr}`);
  const reviewData = envelopeData(review.stdout);
  assert.equal(reviewData.source, 'pull');
  assert.match(reviewData.diff, /pr-c-proof\.txt/);
  assert.deepEqual(reviewData.warnings, [], 'a single-commit pull range carries no interleaving warning');

  // A coding item must pass through the compound-learn stage before done (D3);
  // a pull-door approve re-verifies on main and tolerates the .fgos delta.
  assert.equal(fgos(repoRoot, ['compound', 'pr-c-item']).status, 0);
  const approve = fgos(repoRoot, ['approve', 'pr-c-item']);
  assert.equal(approve.status, 0, `approve failed: ${approve.stderr}`);
  const approveData = envelopeData(approve.stdout);
  assert.equal(approveData.to, 'done');
  assert.match(approveData.output, /PULL_C_OK/);
  assert.equal(approveData.mode, 'verify-only', 'a pull-door approve never merges — code is already on main (D4)');

  const view = stateView(repoRoot);
  assert.equal(view.work['pr-c-item'].status, 'done');
  assert.equal(view.settlements['pr-c-item'][0].kind, 'close');
  assert.equal(view.settlements['pr-c-item'][0].actor, 'human');
  assert.equal(branchExists(repoRoot, 'fgw/pr-c-item'), false, 'a pull-door item never creates a branch');
  assert.notEqual(headAtTake, currentHead(repoRoot), 'sanity: the human commit really did advance HEAD past headAtTake');
});

// --- (d) reject a pull-door item: D4's no-auto-revert has real teeth here,
// because the item's code is already sitting on main ---------------------

test('e2e pr-gate (d) reject a pull-door item: proposed -> todo carries the reason, and the item\'s own commit REMAINS on main untouched (D4 no-revert is meaningful only when the code is already on main)', () => {
  const repoRoot = initTempRepo();

  assert.equal(fgos(repoRoot, ['init']).status, 0);
  add(repoRoot, 'pr-d-item', { verify: 'test -f pr-d-file.txt' });

  const taken = fgos(repoRoot, ['take', '--id', 'pr-d-item']);
  assert.equal(taken.status, 0, `take failed: ${taken.stderr}`);

  fs.writeFileSync(path.join(repoRoot, 'pr-d-file.txt'), 'important content, keep me\n');
  gitAt(repoRoot, ['add', '-A']);
  gitAt(repoRoot, ['commit', '-q', '-m', 'human: pr-d-file.txt']);
  const itemCommit = currentHead(repoRoot);

  const returned = fgos(repoRoot, ['return', 'pr-d-item']);
  assert.equal(returned.status, 0, `return failed: ${returned.stderr}`);
  assert.equal(stateView(repoRoot).work['pr-d-item'].status, 'proposed');
  assert.equal(currentHead(repoRoot), itemCommit, 'return never commits anything itself');

  const reject = fgos(repoRoot, ['reject', 'pr-d-item', '--reason', 'not needed right now']);
  assert.equal(reject.status, 0, `reject failed: ${reject.stderr}`);
  const rejectData = envelopeData(reject.stdout);
  assert.equal(rejectData.from, 'proposed');
  assert.equal(rejectData.to, 'todo');
  assert.equal(rejectData.reason, 'not needed right now');

  assert.equal(stateView(repoRoot).work['pr-d-item'].status, 'todo');
  const lines = events(repoRoot);
  const lastMove = lines.filter((e) => e.type === 'work.move').pop();
  assert.equal(lastMove.payload.reason, 'not needed right now');

  // must_haves truth 3: the item's own commit is still real history on
  // main, byte-for-byte — reject never rewrites it.
  assert.equal(currentHead(repoRoot), itemCommit, 'reject must never touch git — HEAD is unchanged');
  assert.match(gitAt(repoRoot, ['log', '--oneline']), /human: pr-d-file\.txt/, "the item's commit remains in main's history");
  assert.equal(fs.readFileSync(path.join(repoRoot, 'pr-d-file.txt'), 'utf8'), 'important content, keep me\n', 'the file content is unchanged — no revert');
});

// --- (e)/(f) branch-source item (human-rounds D2): a second door for a
// `blocked` item that already carries a live `fgw/<id>` branch (parked by
// the runner after too many visits, or a rejected proposal whose branch
// survives) — `take` claims it via the existing blocked -> doing edge
// (branchHeadAtTake, the branch's own HEAD), `return` verifies on the branch
// in a disposable DETACHED worktree without ever touching the human's own
// checkout, and classifySource's branch-existence-first rule (unchanged,
// per D2) means review/approve treat the resulting proposal exactly like a
// normal runner-source item — no merge.mjs changes needed. -----------------

/** Leaves behind exactly what a real parked runner branch looks like: item
 * at `blocked`, a live `fgw/<id>` branch one commit ahead of main, main's
 * own tree/HEAD untouched — mirrors makeRunnerProposedItem's own "simulate
 * what the runner leaves behind" discipline above, but the item never
 * reaches `proposed`; it stays `blocked`, the D2 starting point. */
function parkBranchItem(repoRoot, id, extra = {}) {
  add(repoRoot, id, extra);
  commitPending(repoRoot, `state: add ${id}`);

  gitAt(repoRoot, ['checkout', '-b', `fgw/${id}`]);
  fs.writeFileSync(path.join(repoRoot, `${id}-attempt.txt`), 'worker attempt\n');
  gitAt(repoRoot, ['add', '-A']);
  gitAt(repoRoot, ['commit', '-q', '-m', `worker attempt for ${id}`]);
  gitAt(repoRoot, ['checkout', 'main']);

  const moved = fgos(repoRoot, ['move', id, '--to', 'blocked']);
  assert.equal(moved.status, 0, `move to blocked failed: ${moved.stderr}`);
  commitPending(repoRoot, `state: park ${id}`);
}

test('e2e pr-gate (e) branch-source item full loop: park (blocked + live branch) -> take -> human commits fix on the branch -> return verifies in a detached temp worktree -> proposed -> review shows source: runner (classifySource unchanged, no merge.mjs edit) -> approve merges + verifies -> done, branch cleaned up', () => {
  const repoRoot = initTempRepo();

  assert.equal(fgos(repoRoot, ['init']).status, 0);
  parkBranchItem(repoRoot, 'pr-e-item', { verify: 'test -f pr-e-proof.txt && echo PR_E_OK' });

  const taken = fgos(repoRoot, ['take', '--id', 'pr-e-item']);
  assert.equal(taken.status, 0, `take failed: ${taken.stderr}`);
  const takenData = envelopeData(taken.stdout);
  assert.equal(takenData.from, 'blocked');
  assert.equal(takenData.to, 'doing');
  commitPending(repoRoot, 'state: take pr-e-item');

  // The human's own fix, committed directly ON THE BRANCH — never on main.
  gitAt(repoRoot, ['checkout', 'fgw/pr-e-item']);
  fs.writeFileSync(path.join(repoRoot, 'pr-e-proof.txt'), 'fixed by hand\n');
  gitAt(repoRoot, ['add', '-A']);
  gitAt(repoRoot, ['commit', '-q', '-m', 'human fix']);
  gitAt(repoRoot, ['checkout', 'main']);
  const mainHeadBeforeReturn = currentHead(repoRoot);

  const returned = fgos(repoRoot, ['return', 'pr-e-item']);
  assert.equal(returned.status, 0, `return failed: ${returned.stderr}`);
  assert.equal(envelopeData(returned.stdout).to, 'proposed');
  assert.equal(currentHead(repoRoot), mainHeadBeforeReturn, "return never advances the human's own main checkout");
  assert.equal(worktreeCount(repoRoot), 1, 'the disposable detached verify worktree is cleaned up — no leftover');

  const view1 = stateView(repoRoot);
  assert.equal(view1.work['pr-e-item'].status, 'proposed');
  assert.ok(view1.work['pr-e-item'].branchHeadAtReturn, 'branchHeadAtReturn recorded');
  assert.equal('headAtReturn' in view1.work['pr-e-item'], false, 'a branch return never records the main-based headAtReturn (D2 CẤM)');

  const review = fgos(repoRoot, ['review', 'pr-e-item']);
  assert.equal(review.status, 0, `review failed: ${review.stderr}`);
  assert.equal(envelopeData(review.stdout).source, 'runner', "D2: classifySource sees the live branch — review/approve treat this exactly like a normal runner-source item, no merge.mjs changes needed");

  // A coding item must pass through the compound-learn stage before done (D3).
  assert.equal(fgos(repoRoot, ['compound', 'pr-e-item']).status, 0);
  commitPending(repoRoot, 'state: propose pr-e-item');

  const approve = fgos(repoRoot, ['approve', 'pr-e-item']);
  assert.equal(approve.status, 0, `approve failed: ${approve.stderr}`);
  const approveEData = envelopeData(approve.stdout);
  assert.equal(approveEData.to, 'done');
  assert.match(approveEData.output, /PR_E_OK/);

  const view2 = stateView(repoRoot);
  assert.equal(view2.work['pr-e-item'].status, 'done');
  assert.equal(view2.settlements['pr-e-item'][0].actor, 'human');
  assert.equal(branchExists(repoRoot, 'fgw/pr-e-item'), false, 'the fully-merged branch is cleaned up');
  assert.equal(worktreeCount(repoRoot), 1, 'no leaked worktree after cleanup');
  assert.ok(fs.existsSync(path.join(repoRoot, 'pr-e-proof.txt')), 'the merged file is present on main');
});

test('e2e pr-gate (f) branch-source return never disturbs a checkout the human is actively standing on: a second live worktree on fgw/<id> at return time survives untouched — no reclaimOrphanedCheckout, no checkout-by-name collision', () => {
  const repoRoot = initTempRepo();

  assert.equal(fgos(repoRoot, ['init']).status, 0);
  parkBranchItem(repoRoot, 'pr-f-item', { verify: 'test -f pr-f-proof.txt && echo PR_F_OK' });

  const taken = fgos(repoRoot, ['take', '--id', 'pr-f-item']);
  assert.equal(taken.status, 0, `take failed: ${taken.stderr}`);
  commitPending(repoRoot, 'state: take pr-f-item');

  gitAt(repoRoot, ['checkout', 'fgw/pr-f-item']);
  fs.writeFileSync(path.join(repoRoot, 'pr-f-proof.txt'), 'fixed by hand\n');
  gitAt(repoRoot, ['add', '-A']);
  gitAt(repoRoot, ['commit', '-q', '-m', 'human fix']);
  gitAt(repoRoot, ['checkout', 'main']);

  // The human then opens a SECOND worktree on the very same branch — e.g. a
  // second terminal/editor window still open on the code while `return` runs
  // from their main checkout. `git worktree add <path> <branch>` (checkout
  // BY NAME — exactly what `return` must NEVER do here) would fail outright
  // with git's own "already checked out" refusal the moment a second such
  // add is attempted against a branch already checked out somewhere; a
  // `--detach <sha>` add (what `return` actually does) coexists with it
  // cleanly, which is the whole point of this scenario.
  const humanWorktree = mkTempDir('fgos-pr-gate-e2e-f-human-worktree-');
  gitAt(repoRoot, ['worktree', 'add', humanWorktree, 'fgw/pr-f-item']);
  assert.equal(worktreeCount(repoRoot), 2, "sanity: the human really does have a second live checkout of the branch");

  const returned = fgos(repoRoot, ['return', 'pr-f-item']);
  assert.equal(returned.status, 0, `return failed (must never collide with the human's own live checkout): ${returned.stderr}`);
  assert.equal(envelopeData(returned.stdout).to, 'proposed');

  // The human's own worktree survives, untouched, still checked out on the
  // branch — this is the BLOCKER the validating gate caught: reclaiming or
  // checking out by name here would rip out or corrupt exactly this.
  assert.ok(fs.existsSync(humanWorktree), "the human's own worktree directory must survive — never reclaimed");
  assert.equal(
    gitAt(humanWorktree, ['rev-parse', '--abbrev-ref', 'HEAD']).trim(),
    'fgw/pr-f-item',
    "the human's own worktree must still be checked out on the branch — never reclaimed/detached out from under them",
  );
  assert.equal(worktreeCount(repoRoot), 2, "return's own disposable verify worktree is cleaned up, but the human's own worktree remains — net count back to 2");

  assert.equal(stateView(repoRoot).work['pr-f-item'].status, 'proposed');

  gitAt(repoRoot, ['worktree', 'remove', humanWorktree, '--force']);
});
