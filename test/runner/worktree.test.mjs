import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  createWorktree,
  createClaimWorktree,
  createDispatchWorktree,
  createBranchRef,
  removeWorktree,
  listLeftovers,
  branchNameFor,
  branchExists,
  reclaimOrphanedCheckout,
  provisionDependencies,
  resyncClaimWorktree,
  resyncWorktree,
  refreshUnstartedBranch,
  withMergeEphemeralWorktree,
  checkoutDirtyPaths,
  WorktreeError,
} from '../../src/runner/worktree.mjs';

// Every test here creates its own disposable git repo (git init in a
// mkdtemp dir) — no test ever creates a worktree or branch in THIS repo
// (forgent itself). `opts.worktreeDir` always points at a mkdtemp
// directory too, so no worktree checkout lands under the main repo either.

function initTempRepo() {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-worktree-test-repo-'));
  execFileSync('git', ['init', '-q'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: repoRoot });
  fs.writeFileSync(path.join(repoRoot, 'seed.txt'), 'seed\n');
  execFileSync('git', ['add', 'seed.txt'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-q', '-m', 'init'], { cwd: repoRoot });
  return repoRoot;
}

function mkWorktreeDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-worktree-test-dir-'));
}

function commitOnWorktree(worktreePath, filename, contents) {
  fs.writeFileSync(path.join(worktreePath, filename), contents);
  execFileSync('git', ['add', filename], { cwd: worktreePath });
  execFileSync('git', ['commit', '-q', '-m', `worker: ${filename}`], { cwd: worktreePath });
}

/**
 * Advances `branch` the same way `withMergeEphemeralWorktree` lands a merge
 * in production (tsk-2cd): a DETACHED checkout at the branch's current tip,
 * a real commit made there, then a plain `git branch -f` ref update — never
 * a checkout of `branch` itself, so this never collides with any existing
 * non-detached checkout of it (e.g. a claim worktree already reattached to
 * it). Returns the new tip commit.
 */
function advanceBranchExternally(repoRoot, branch, filename, contents) {
  const startTip = execFileSync('git', ['rev-parse', branch], { cwd: repoRoot, encoding: 'utf8' }).trim();
  const detachedPath = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-worktree-test-detached-'));
  execFileSync('git', ['worktree', 'add', '--detach', detachedPath, startTip], { cwd: repoRoot });
  fs.writeFileSync(path.join(detachedPath, filename), contents);
  execFileSync('git', ['add', filename], { cwd: detachedPath });
  execFileSync('git', ['commit', '-q', '-m', `external advance: ${filename}`], { cwd: detachedPath });
  const newTip = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: detachedPath, encoding: 'utf8' }).trim();
  execFileSync('git', ['branch', '-f', branch, newTip], { cwd: repoRoot });
  execFileSync('git', ['worktree', 'remove', '--force', detachedPath], { cwd: repoRoot });
  return newTip;
}

/** A tiny local package (tsk-2vd) — an absolute `file:` dependency resolves
 * entirely offline, no registry/network hit, so `provisionDependencies`'s
 * tests stay fast and deterministic. */
function mkLocalDependency() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-worktree-test-localdep-'));
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'fgos-test-localdep', version: '1.0.0' }));
  fs.writeFileSync(path.join(dir, 'index.js'), 'module.exports = {};\n');
  return dir;
}

test('branchNameFor is deterministic per id', () => {
  assert.equal(branchNameFor('phase-2-routing-7'), 'fgw/phase-2-routing-7');
});

test('createWorktree makes a fresh branch fgw/<id> from HEAD when none exists', () => {
  const repoRoot = initTempRepo();
  const worktreeDir = mkWorktreeDir();
  const wt = createWorktree(repoRoot, 'item-a', { worktreeDir });

  assert.equal(wt.branch, 'fgw/item-a');
  assert.equal(wt.reused, false);
  assert.ok(fs.existsSync(path.join(wt.path, 'seed.txt')));
});

test('a worker commit on the worktree branch survives after removeWorktree, and removeWorktree runs safely from repoRoot', () => {
  const repoRoot = initTempRepo();
  const worktreeDir = mkWorktreeDir();
  const wt = createWorktree(repoRoot, 'item-b', { worktreeDir });

  commitOnWorktree(wt.path, 'worker-output.txt', 'produced by worker\n');

  // removeWorktree must be callable while the process cwd is repoRoot (never
  // inside the worktree being removed) and must not throw.
  removeWorktree(repoRoot, wt.path);

  assert.equal(fs.existsSync(wt.path), false);
  const log = execFileSync('git', ['log', '--oneline', 'fgw/item-b'], { cwd: repoRoot, encoding: 'utf8' });
  assert.match(log, /worker: worker-output\.txt/);
});

test('createWorktree retried for the same id reuses the existing branch into a fresh directory (no self-collision)', () => {
  const repoRoot = initTempRepo();
  const worktreeDir = mkWorktreeDir();

  const first = createWorktree(repoRoot, 'item-c', { worktreeDir });
  commitOnWorktree(first.path, 'attempt-1.txt', 'first attempt\n');
  removeWorktree(repoRoot, first.path);

  const second = createWorktree(repoRoot, 'item-c', { worktreeDir });

  assert.equal(second.branch, 'fgw/item-c');
  assert.equal(second.reused, true);
  assert.notEqual(second.path, first.path);
  // the retry sees the first attempt's commit, since it reused the branch
  assert.ok(fs.existsSync(path.join(second.path, 'attempt-1.txt')));

  removeWorktree(repoRoot, second.path);
});

// --- crash reclaim (phase-2-routing-10) ------------------------------------
//
// A genuine process kill skips every `finally`, so a branch can be left
// checked out at a now-orphaned path (the crashed run's own worktree,
// never torn down). `createWorktree` must reclaim that checkout — not
// throw — whenever it is about to reuse the branch, in both sub-cases: the
// orphaned directory still exists on disk, or it is already gone and only
// git's own bookkeeping needs pruning.

test('createWorktree reclaims a branch already checked out at an orphaned path still on disk (crash recovery), instead of throwing', () => {
  const repoRoot = initTempRepo();
  const worktreeDir = mkWorktreeDir();
  const first = createWorktree(repoRoot, 'item-d', { worktreeDir });
  commitOnWorktree(first.path, 'attempt-1.txt', 'orphaned attempt\n');
  // no removeWorktree(first.path) here -- this simulates the crashed run:
  // fgw/item-d stays checked out at first.path when the next createWorktree
  // call for the same id comes in.

  const second = createWorktree(repoRoot, 'item-d', { worktreeDir });

  assert.equal(second.branch, 'fgw/item-d');
  assert.equal(second.reused, true);
  assert.notEqual(second.path, first.path);
  // the orphaned checkout was force-removed as part of the reclaim
  assert.equal(fs.existsSync(first.path), false);
  // the branch's prior commit survives -- reused, not recreated
  assert.ok(fs.existsSync(path.join(second.path, 'attempt-1.txt')));

  removeWorktree(repoRoot, second.path);
});

test('createWorktree reclaims a branch registered as checked out at a path that is already gone from disk (prune), instead of throwing', () => {
  const repoRoot = initTempRepo();
  const worktreeDir = mkWorktreeDir();
  const first = createWorktree(repoRoot, 'item-e', { worktreeDir });
  commitOnWorktree(first.path, 'attempt-1.txt', 'orphaned attempt\n');
  // the checkout directory vanishes without git being told (e.g. a /tmp
  // sweep) -- git worktree list --porcelain still reports it as checked
  // out until pruned.
  fs.rmSync(first.path, { recursive: true, force: true });

  const second = createWorktree(repoRoot, 'item-e', { worktreeDir });

  assert.equal(second.branch, 'fgw/item-e');
  assert.equal(second.reused, true);
  assert.ok(fs.existsSync(path.join(second.path, 'attempt-1.txt')));

  removeWorktree(repoRoot, second.path);
});

// --- zero-destroy relocation (tsk-3lx D2) ----------------------------------
//
// The incident this closes: `createWorktree`'s reuse path used to destroy
// the orphaned checkout (`git worktree remove --force`) BEFORE attempting
// `git worktree add` for the replacement — if that add then failed for any
// reason (including a real, twice-reproduced `spawnSync git ENOENT`), the
// destroyed checkout was gone with no automatic recovery, even though the
// branch's commits always survived. `git worktree move` replaces that
// destroy-then-create sequence with a single relocate — if it fails, the
// original checkout is untouched. `git worktree lock` is the real,
// deterministic way to make `git worktree move` itself fail without
// mocking anything: git refuses to move (or force-remove) a locked
// worktree.

test('createWorktree preserves the orphaned checkout when relocation itself fails (zero-destroy)', () => {
  const repoRoot = initTempRepo();
  const worktreeDir = mkWorktreeDir();
  const first = createWorktree(repoRoot, 'item-g', { worktreeDir });
  commitOnWorktree(first.path, 'attempt-1.txt', 'orphaned attempt\n');
  // no removeWorktree(first.path) -- same crash-orphan shape as the tests
  // above, but this time the orphaned checkout is locked, so the reuse
  // path's relocation attempt will itself fail.
  execFileSync('git', ['worktree', 'lock', first.path], { cwd: repoRoot });

  assert.throws(() => createWorktree(repoRoot, 'item-g', { worktreeDir }), WorktreeError);

  // the pre-existing checkout must be exactly as it was: same path, same
  // content, branch commit intact -- zero manual recovery needed for this
  // failure class.
  assert.equal(fs.existsSync(first.path), true);
  assert.equal(fs.readFileSync(path.join(first.path, 'attempt-1.txt'), 'utf8'), 'orphaned attempt\n');
  const log = execFileSync('git', ['log', '--oneline', 'fgw/item-g'], { cwd: repoRoot, encoding: 'utf8' });
  assert.match(log, /worker: attempt-1\.txt/);

  execFileSync('git', ['worktree', 'unlock', first.path], { cwd: repoRoot });
  removeWorktree(repoRoot, first.path);
});

test('reclaimOrphanedCheckout is a no-op when the branch is not checked out anywhere', () => {
  const repoRoot = initTempRepo();
  const worktreeDir = mkWorktreeDir();
  const wt = createWorktree(repoRoot, 'item-f', { worktreeDir });
  commitOnWorktree(wt.path, 'attempt.txt', 'real work\n');
  removeWorktree(repoRoot, wt.path);

  const result = reclaimOrphanedCheckout(repoRoot, 'fgw/item-f');

  assert.deepEqual(result, { reclaimed: false, path: null });
});

test('reclaimOrphanedCheckout reports reclaimed:true and force-removes the still-existing checkout directory', () => {
  const repoRoot = initTempRepo();
  const worktreeDir = mkWorktreeDir();
  const wt = createWorktree(repoRoot, 'item-g', { worktreeDir });
  commitOnWorktree(wt.path, 'attempt.txt', 'real work\n');

  const result = reclaimOrphanedCheckout(repoRoot, 'fgw/item-g');

  assert.equal(result.reclaimed, true);
  assert.equal(result.path, wt.path);
  assert.equal(fs.existsSync(wt.path), false);
});

test('reclaimOrphanedCheckout refuses (throws, does not remove) a checkout with real uncommitted changes (data-loss guard)', () => {
  const repoRoot = initTempRepo();
  const worktreeDir = mkWorktreeDir();
  const wt = createWorktree(repoRoot, 'item-h', { worktreeDir });
  commitOnWorktree(wt.path, 'attempt.txt', 'real work\n');
  // simulate a live checkout still being worked in: uncommitted edit, never
  // torn down via removeWorktree.
  fs.writeFileSync(path.join(wt.path, 'in-progress.txt'), 'not yet committed\n');

  assert.throws(() => reclaimOrphanedCheckout(repoRoot, 'fgw/item-h'), WorktreeError);
  assert.equal(fs.existsSync(wt.path), true);
  assert.equal(fs.existsSync(path.join(wt.path, 'in-progress.txt')), true);

  removeWorktree(repoRoot, wt.path, { force: true });
});

test('reclaimOrphanedCheckout refuses (throws, does not remove) a checkout that resolves to repoRoot itself (tsk-k8u D1)', () => {
  const repoRoot = initTempRepo();
  // Check the branch out directly IN repoRoot's own working directory —
  // `git worktree list --porcelain`'s first entry is always the main
  // checkout, so this makes repoRoot itself the orphan path for the branch.
  execFileSync('git', ['checkout', '-q', '-b', 'fgw/item-repo-root'], { cwd: repoRoot });

  assert.throws(() => reclaimOrphanedCheckout(repoRoot, 'fgw/item-repo-root'), WorktreeError);
  assert.equal(fs.existsSync(repoRoot), true, 'repoRoot itself must never be force-removed');
  assert.equal(fs.existsSync(path.join(repoRoot, 'seed.txt')), true, 'repoRoot\'s own working tree must stay intact');
});

test('createWorktree does not leak its freshly-allocated directory when the reuse path is refused for a dirty checkout', () => {
  const repoRoot = initTempRepo();
  const worktreeDir = mkWorktreeDir();
  const wt = createWorktree(repoRoot, 'item-h2', { worktreeDir });
  commitOnWorktree(wt.path, 'attempt.txt', 'real work\n');
  fs.writeFileSync(path.join(wt.path, 'in-progress.txt'), 'not yet committed\n');

  const before = fs.readdirSync(worktreeDir);
  assert.throws(() => createWorktree(repoRoot, 'item-h2', { worktreeDir }), WorktreeError);
  const after = fs.readdirSync(worktreeDir);

  assert.deepEqual(after, before);

  removeWorktree(repoRoot, wt.path, { force: true });
});

test('reclaimOrphanedCheckout still reclaims normally when the only "change" is the .fgos removal createWorktree itself performs', () => {
  const repoRoot = initTempRepo();
  fs.mkdirSync(path.join(repoRoot, '.fgos'));
  fs.writeFileSync(path.join(repoRoot, '.fgos', 'events.jsonl'), '');
  execFileSync('git', ['add', '.fgos/events.jsonl'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-q', '-m', 'track .fgos'], { cwd: repoRoot });
  const worktreeDir = mkWorktreeDir();
  const wt = createWorktree(repoRoot, 'item-i', { worktreeDir });
  commitOnWorktree(wt.path, 'attempt.txt', 'real work\n');

  const result = reclaimOrphanedCheckout(repoRoot, 'fgw/item-i');

  assert.equal(result.reclaimed, true);
  assert.equal(fs.existsSync(wt.path), false);
});

test('reclaimOrphanedCheckout refuses (throws, does not remove) a checkout that is the calling session\'s own live cwd (tsk-1tm, exact-match)', () => {
  const repoRoot = initTempRepo();
  const worktreeDir = mkWorktreeDir();
  const wt = createWorktree(repoRoot, 'item-j', { worktreeDir });
  commitOnWorktree(wt.path, 'attempt.txt', 'real work\n');
  // clean, committed checkout -- would pass the dirty-checkout guard, but
  // the calling session is standing exactly here (tsk-424 chained
  // EnterWorktree pattern: approving this item from inside its own
  // worktree).

  assert.throws(() => reclaimOrphanedCheckout(repoRoot, 'fgw/item-j', { callerCwd: wt.path }), WorktreeError);
  assert.equal(fs.existsSync(wt.path), true);

  removeWorktree(repoRoot, wt.path);
});

test('reclaimOrphanedCheckout refuses (throws, does not remove) a checkout whose live session cwd is nested under it (tsk-1tm, defense-in-depth)', () => {
  const repoRoot = initTempRepo();
  const worktreeDir = mkWorktreeDir();
  const wt = createWorktree(repoRoot, 'item-k', { worktreeDir });
  commitOnWorktree(wt.path, 'attempt.txt', 'real work\n');
  const nestedCwd = path.join(wt.path, 'nested', 'deeper');
  fs.mkdirSync(nestedCwd, { recursive: true });

  assert.throws(() => reclaimOrphanedCheckout(repoRoot, 'fgw/item-k', { callerCwd: nestedCwd }), WorktreeError);
  assert.equal(fs.existsSync(wt.path), true);

  removeWorktree(repoRoot, wt.path);
});

test('reclaimOrphanedCheckout still reclaims normally when callerCwd is unrelated to the checkout (regression)', () => {
  const repoRoot = initTempRepo();
  const worktreeDir = mkWorktreeDir();
  const wt = createWorktree(repoRoot, 'item-l', { worktreeDir });
  commitOnWorktree(wt.path, 'attempt.txt', 'real work\n');

  const result = reclaimOrphanedCheckout(repoRoot, 'fgw/item-l', { callerCwd: repoRoot });

  assert.equal(result.reclaimed, true);
  assert.equal(fs.existsSync(wt.path), false);
});

test('listLeftovers reports aheadCount 0 for a branch with no commits beyond base (orphan)', () => {
  const repoRoot = initTempRepo();
  const worktreeDir = mkWorktreeDir();
  const wt = createWorktree(repoRoot, 'item-orphan', { worktreeDir });
  removeWorktree(repoRoot, wt.path);

  const leftovers = listLeftovers(repoRoot);
  const entry = leftovers.find((l) => l.branch === 'fgw/item-orphan');
  assert.ok(entry, 'expected fgw/item-orphan in listLeftovers output');
  assert.equal(entry.aheadCount, 0);
});

test('listLeftovers reports a positive aheadCount for a branch carrying a real proposal', () => {
  const repoRoot = initTempRepo();
  const worktreeDir = mkWorktreeDir();
  const wt = createWorktree(repoRoot, 'item-proposal', { worktreeDir });
  commitOnWorktree(wt.path, 'proposal.txt', 'a real change\n');
  removeWorktree(repoRoot, wt.path);

  const leftovers = listLeftovers(repoRoot);
  const entry = leftovers.find((l) => l.branch === 'fgw/item-proposal');
  assert.ok(entry, 'expected fgw/item-proposal in listLeftovers output');
  assert.equal(entry.aheadCount, 1);
});

test('listLeftovers returns an empty array when no fgw/ branches exist', () => {
  const repoRoot = initTempRepo();
  assert.deepEqual(listLeftovers(repoRoot), []);
});

test('removeWorktree throws worktree-fail for a path that is not an actual worktree', () => {
  const repoRoot = initTempRepo();
  assert.throws(
    () => removeWorktree(repoRoot, path.join(os.tmpdir(), 'never-existed-worktree-xyz')),
    (err) => {
      assert.ok(err instanceof WorktreeError);
      assert.equal(err.errorClass, 'worktree-fail');
      return true;
    },
  );
});

// --- branch-tree topology (fan-out-parallel, D3/D4/D17) --------------------
//
// This harness's initTempRepo() runs plain `git init -q` with no `-b main`,
// so its default branch is whatever this machine's `init.defaultBranch` is
// (often not literally "main") — unlike merge.test.mjs's initRepo(), which
// pins `-b main`. Every test below therefore reads the repo's real initial
// branch name via currentBranch() and passes it explicitly as baseRef,
// never relying on createBranchRef's bare 'main' default resolving here.

function currentBranch(repoRoot) {
  return execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).trim();
}

function branchTip(repoRoot, branch) {
  return execFileSync('git', ['rev-parse', branch], { cwd: repoRoot, encoding: 'utf8' }).trim();
}

test('createBranchRef creates a real branch ref pointed at baseRef, with zero worktree checkouts registered for it', () => {
  const repoRoot = initTempRepo();
  const initialBranch = currentBranch(repoRoot);

  const result = createBranchRef(repoRoot, 'root-a', { baseRef: initialBranch });

  assert.equal(result.branch, 'fgw/root-a');
  assert.equal(result.created, true);
  assert.equal(branchTip(repoRoot, 'fgw/root-a'), branchTip(repoRoot, initialBranch));

  const listing = execFileSync('git', ['worktree', 'list', '--porcelain'], { cwd: repoRoot, encoding: 'utf8' });
  assert.doesNotMatch(listing, /branch refs\/heads\/fgw\/root-a/);
});

test('createBranchRef is idempotent: a second call on an existing branch is a no-op and does not move the branch', () => {
  const repoRoot = initTempRepo();
  const initialBranch = currentBranch(repoRoot);

  const first = createBranchRef(repoRoot, 'root-b', { baseRef: initialBranch });
  assert.equal(first.created, true);
  const shaAfterFirst = branchTip(repoRoot, 'fgw/root-b');

  // move the base ref forward — if createBranchRef were not idempotent, a
  // second call would (wrongly) re-point fgw/root-b at this new tip.
  fs.writeFileSync(path.join(repoRoot, 'advance.txt'), 'advanced\n');
  execFileSync('git', ['add', 'advance.txt'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-q', '-m', 'advance base'], { cwd: repoRoot });

  const second = createBranchRef(repoRoot, 'root-b', { baseRef: initialBranch });
  assert.equal(second.created, false);
  assert.equal(second.branch, 'fgw/root-b');
  assert.equal(branchTip(repoRoot, 'fgw/root-b'), shaAfterFirst, 'branch must not move on idempotent no-op');
});

test('tsk-386: createBranchRef with no baseRef at all resolves through detectTrunk on a master-trunk repo, never a hardcoded "main"', () => {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-worktree-test-master-'));
  execFileSync('git', ['init', '-q', '-b', 'master'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: repoRoot });
  fs.writeFileSync(path.join(repoRoot, 'seed.txt'), 'seed\n');
  execFileSync('git', ['add', 'seed.txt'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-q', '-m', 'seed'], { cwd: repoRoot });
  const masterTip = branchTip(repoRoot, 'master');

  // Finding 8's own failure scenario: the pre-fix hardcoded default would
  // attempt `git branch fgw/<id> main` here, which throws outright -- this
  // repo has no branch named "main" at all.
  const result = createBranchRef(repoRoot, 'master-trunk-item');

  assert.equal(result.created, true);
  assert.equal(branchTip(repoRoot, 'fgw/master-trunk-item'), masterTip, 'branch forks from the real detected trunk (master), never a nonexistent hardcoded "main"');
});

test('tsk-386: withMergeEphemeralWorktree\'s own createBranchRef fallback resolves through detectTrunk on a master-trunk repo (the exact Finding 8 failure scenario)', async () => {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-worktree-test-master-merge-'));
  execFileSync('git', ['init', '-q', '-b', 'master'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: repoRoot });
  fs.writeFileSync(path.join(repoRoot, 'seed.txt'), 'seed\n');
  execFileSync('git', ['add', 'seed.txt'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-q', '-m', 'seed'], { cwd: repoRoot });
  const masterTip = branchTip(repoRoot, 'master');

  // fgw/never-dispatched-master genuinely does not exist yet -- this is
  // exactly the "first session-driven root merge" scenario the finding
  // names: a host repo whose trunk is master hitting
  // createDetachedMergeWorktree's own fallback.
  const result = await withMergeEphemeralWorktree(repoRoot, 'never-dispatched-master', async (worktree) => {
    assert.equal(worktree.startCommit, masterTip, 'fallback-created branch is seeded from the real detected trunk (master)');
    return 'fn-ran';
  });

  assert.equal(result, 'fn-ran');
  assert.equal(branchTip(repoRoot, 'fgw/never-dispatched-master'), masterTip);
});

test('withMergeEphemeralWorktree falls back to createBranchRef (seeded from main) instead of throwing when fgw/<id> was never created early', async () => {
  const repoRoot = initTempRepo();
  execFileSync('git', ['branch', '-M', 'main'], { cwd: repoRoot });
  // seed a tracked .fgos/ so finishWorktreeSetup's strip is meaningfully
  // exercised on the fallback path too, not just the already-exists path.
  fs.mkdirSync(path.join(repoRoot, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, '.fgos', 'marker.txt'), 'x\n');
  execFileSync('git', ['add', '.fgos/marker.txt'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-q', '-m', 'seed .fgos'], { cwd: repoRoot });
  const mainTip = branchTip(repoRoot, 'main');

  assert.throws(() => branchTip(repoRoot, 'fgw/never-dispatched'), 'precondition: branch genuinely does not exist yet');

  const result = await withMergeEphemeralWorktree(repoRoot, 'never-dispatched', async (worktree) => {
    assert.equal(worktree.branch, 'fgw/never-dispatched');
    assert.equal(worktree.startCommit, mainTip, 'fallback-created branch is seeded from main\'s current tip');
    assert.equal(fs.existsSync(path.join(worktree.path, '.fgos')), false, 'finishWorktreeSetup strips .fgos on the fallback path too');
    return 'fn-ran';
  });

  assert.equal(result, 'fn-ran');
  assert.equal(branchTip(repoRoot, 'fgw/never-dispatched'), mainTip, 'the branch now exists, created by the fallback');

  const listing = execFileSync('git', ['worktree', 'list', '--porcelain'], { cwd: repoRoot, encoding: 'utf8' });
  assert.doesNotMatch(listing, /fgw\/never-dispatched/, 'the ephemeral checkout is removed on the way out');
});

test('withMergeEphemeralWorktree leaves an already-existing fgw/<id> branch untouched by the fallback (checkout at its real tip, not reset to main)', async () => {
  const repoRoot = initTempRepo();
  execFileSync('git', ['branch', '-M', 'main'], { cwd: repoRoot });
  createBranchRef(repoRoot, 'already-dispatched', { baseRef: 'main' });
  const advancedTip = advanceBranchExternally(repoRoot, 'fgw/already-dispatched', 'leaf-work.txt', 'leaf commit\n');

  const result = await withMergeEphemeralWorktree(repoRoot, 'already-dispatched', async (worktree) => {
    assert.equal(worktree.startCommit, advancedTip, 'checkout must be at the branch\'s real current tip, not reset to main');
    return 'ok';
  });

  assert.equal(result, 'ok');
  assert.equal(branchTip(repoRoot, 'fgw/already-dispatched'), advancedTip, 'branch tip is unchanged when fn makes no new commit');
});

test('tsk-4yv: withMergeEphemeralWorktree removes the detached worktree it just registered when finishWorktreeSetup fails -- never leaks an unreclaimed detached checkout', async () => {
  // Finding 7: this is specifically the DETACHED case
  // (createDetachedMergeWorktree, used by approve's own leaf-merge path via
  // withMergeEphemeralWorktree) -- reclaimOrphanedCheckout/findCheckoutPath
  // are both branch-keyed and skip a `detached` worktree stanza entirely, so
  // unlike the branch-attached createWorktree case, nothing else in the
  // codebase would ever reclaim a leaked detached checkout. A repeated npm
  // registry flake during approve would accumulate full checkouts under tmp
  // indefinitely, exactly the scenario this fix closes.
  const repoRoot = initTempRepo();
  execFileSync('git', ['branch', '-M', 'main'], { cwd: repoRoot });
  // Malformed JSON forces a real, deterministic, fully offline throw inside
  // provisionDependencies (see the createWorktree sibling test above for
  // why a nonexistent file: dependency does NOT reliably fail npm install).
  fs.writeFileSync(path.join(repoRoot, 'package.json'), '{not valid json');
  execFileSync('git', ['add', 'package.json'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-q', '-m', 'commit a malformed package.json'], { cwd: repoRoot });
  execFileSync('git', ['branch', 'fgw/broken-dep-merge-item'], { cwd: repoRoot });

  await assert.rejects(() => withMergeEphemeralWorktree(repoRoot, 'broken-dep-merge-item', async () => 'unreachable'), SyntaxError);

  const listing = execFileSync('git', ['worktree', 'list', '--porcelain'], { cwd: repoRoot, encoding: 'utf8' });
  assert.doesNotMatch(listing, /broken-dep-merge-item/, 'the detached merge worktree must not remain registered after finishWorktreeSetup failed');
});

test('createWorktree with opts.baseRef forks a new branch from that ref\'s tip, not from repoRoot\'s current HEAD', () => {
  const repoRoot = initTempRepo();
  const worktreeDir = mkWorktreeDir();
  const initialBranch = currentBranch(repoRoot);

  // "side" diverges from initialBranch at the seed commit, then gets a
  // commit of its own that initialBranch never sees.
  execFileSync('git', ['branch', 'side'], { cwd: repoRoot });
  execFileSync('git', ['checkout', '-q', 'side'], { cwd: repoRoot });
  fs.writeFileSync(path.join(repoRoot, 'side-only.txt'), 'side content\n');
  execFileSync('git', ['add', 'side-only.txt'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-q', '-m', 'side commit'], { cwd: repoRoot });
  execFileSync('git', ['checkout', '-q', initialBranch], { cwd: repoRoot });

  // initialBranch (current HEAD) then advances independently, so it now
  // holds a file "side" never sees.
  fs.writeFileSync(path.join(repoRoot, 'main-only.txt'), 'main only\n');
  execFileSync('git', ['add', 'main-only.txt'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-q', '-m', 'main-only commit'], { cwd: repoRoot });

  const wt = createWorktree(repoRoot, 'leaf-a', { worktreeDir, baseRef: 'side' });

  assert.equal(wt.reused, false);
  assert.ok(fs.existsSync(path.join(wt.path, 'side-only.txt')), 'forked worktree must see side branch content');
  assert.equal(
    fs.existsSync(path.join(wt.path, 'main-only.txt')),
    false,
    'forked worktree must NOT see current-HEAD-only content — proves it forked from baseRef tip, not HEAD',
  );
});

// --- .fgos/ exclusion (ADR0020, tsk-1an) -----------------------------------
//
// This repo's own convention is `.fgos/` git-tracked (D10/`0003`). A bare
// `git worktree add` would therefore check a frozen snapshot of it into
// every fresh worker worktree — stale the instant main gets another
// uncommitted event, and (if ever symlinked instead, per the rejected
// khóa-trong-cây option) a live write path into the shared store from an
// execution context with no real capability wall. ADR0020 settles on
// neither: `createWorktree` removes any checked-out `.fgos/` outright, so a
// worker's checkout has none at all — nothing stale to misread, nothing
// live to write into by accident.

test('createWorktree removes a git-tracked .fgos/ from the fresh worktree entirely — no stale copy, no symlink (ADR0020)', () => {
  const repoRoot = initTempRepo();
  fs.mkdirSync(path.join(repoRoot, '.fgos'));
  fs.writeFileSync(path.join(repoRoot, '.fgos', 'events.jsonl'), '{"seq":1}\n');
  execFileSync('git', ['add', '.fgos/events.jsonl'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-q', '-m', 'seed .fgos/events.jsonl'], { cwd: repoRoot });

  const worktreeDir = mkWorktreeDir();
  const wt = createWorktree(repoRoot, 'item-h', { worktreeDir });

  assert.equal(fs.existsSync(path.join(wt.path, '.fgos')), false);
  assert.ok(fs.existsSync(path.join(wt.path, 'seed.txt')), 'unrelated tracked content must still be checked out normally');
});

test('createWorktree stays a no-op on .fgos/ removal when the repo never tracked .fgos/ at all', () => {
  const repoRoot = initTempRepo();
  const worktreeDir = mkWorktreeDir();
  const wt = createWorktree(repoRoot, 'item-i', { worktreeDir });
  assert.equal(fs.existsSync(path.join(wt.path, '.fgos')), false);
});

test('createWorktree with opts.baseRef on an existing (reused) branch ignores baseRef and reuses as before', () => {
  const repoRoot = initTempRepo();
  const worktreeDir = mkWorktreeDir();

  const first = createWorktree(repoRoot, 'item-reuse', { worktreeDir });
  commitOnWorktree(first.path, 'attempt-1.txt', 'first attempt\n');
  removeWorktree(repoRoot, first.path);

  // an unrelated branch that does NOT contain attempt-1.txt — if baseRef
  // were (wrongly) honored on the reuse path, the checkout would come from
  // here instead of the existing fgw/item-reuse branch.
  execFileSync('git', ['branch', 'unrelated'], { cwd: repoRoot });

  const second = createWorktree(repoRoot, 'item-reuse', { worktreeDir, baseRef: 'unrelated' });

  assert.equal(second.branch, 'fgw/item-reuse');
  assert.equal(second.reused, true);
  assert.notEqual(second.path, first.path);
  assert.ok(
    fs.existsSync(path.join(second.path, 'attempt-1.txt')),
    'baseRef must be ignored on reuse — checkout must still come from the existing fgw/item-reuse branch',
  );

  removeWorktree(repoRoot, second.path);
});

// --- claim reattach: a claim whose checkout is still standing gets that same
// checkout back, instead of the reuse path reclaiming it out from under the
// session running in it -------------------------------------------------------

test('createClaimWorktree reattaches to the live checkout of fgw/<id> instead of removing it, and reports reused:true', () => {
  const repoRoot = initTempRepo();
  const worktreeDir = mkWorktreeDir();
  const first = createClaimWorktree(repoRoot, 'reattach-clean', { worktreeDir });
  commitOnWorktree(first.path, 'context.md', '# decisions\n');

  const second = createClaimWorktree(repoRoot, 'reattach-clean', { worktreeDir });

  assert.equal(second.path, first.path, 'the same checkout is handed back, not a new directory');
  assert.equal(second.branch, 'fgw/reattach-clean');
  assert.equal(second.reused, true);
  assert.equal(fs.existsSync(first.path), true, 'the live checkout survives the second claim');
  assert.equal(fs.existsSync(path.join(first.path, 'context.md')), true);
  // exactly one checkout for the branch — nothing was added alongside it
  const listing = execFileSync('git', ['worktree', 'list', '--porcelain'], { cwd: repoRoot, encoding: 'utf8' });
  assert.equal(listing.split('\n').filter((l) => l === 'branch refs/heads/fgw/reattach-clean').length, 1);

  removeWorktree(repoRoot, first.path, { force: true });
});

test('createClaimWorktree reattaches a DIRTY checkout with its uncommitted work intact (where createWorktree refuses outright)', () => {
  const repoRoot = initTempRepo();
  const worktreeDir = mkWorktreeDir();
  const first = createClaimWorktree(repoRoot, 'reattach-dirty', { worktreeDir });
  commitOnWorktree(first.path, 'context.md', '# decisions\n');
  fs.writeFileSync(path.join(first.path, 'in-progress.txt'), 'not yet committed\n');

  const second = createClaimWorktree(repoRoot, 'reattach-dirty', { worktreeDir });

  assert.equal(second.path, first.path);
  assert.equal(second.reused, true);
  assert.equal(fs.readFileSync(path.join(first.path, 'in-progress.txt'), 'utf8'), 'not yet committed\n');
  // the same call through the low-level primitive still refuses — the guard
  // it relies on is untouched, the claim wrapper just never reaches it
  assert.throws(() => createWorktree(repoRoot, 'reattach-dirty', { worktreeDir }), WorktreeError);

  removeWorktree(repoRoot, first.path, { force: true });
});

// --- resync guard: a reattached claim worktree may have fallen behind its
// own branch (tsk-2cd) — a child merge lands via a plain ref update on a
// DETACHED checkout, never touching this worktree's own files, so its
// branch can advance while this checkout sits exactly where it was ---------

test('resyncClaimWorktree is a no-op when the worktree is already at its branch tip', () => {
  const repoRoot = initTempRepo();
  const worktreeDir = mkWorktreeDir();
  const wt = createClaimWorktree(repoRoot, 'resync-same-tip', { worktreeDir });
  commitOnWorktree(wt.path, 'context.md', '# decisions\n');

  const result = resyncClaimWorktree(repoRoot, wt.path, branchNameFor('resync-same-tip'));

  assert.equal(result.resynced, false);
  removeWorktree(repoRoot, wt.path, { force: true });
});

test('createClaimWorktree auto-resyncs a clean reattach whose branch advanced via an external (merge-style) ref update', () => {
  const repoRoot = initTempRepo();
  const worktreeDir = mkWorktreeDir();
  const branch = branchNameFor('resync-clean');
  const first = createClaimWorktree(repoRoot, 'resync-clean', { worktreeDir });
  commitOnWorktree(first.path, 'context.md', '# decisions\n');

  const newTip = advanceBranchExternally(repoRoot, branch, 'plan.md', '# plan\n');
  // sanity: the checkout's own files have NOT changed yet — proves the
  // external advance really did bypass this worktree
  assert.equal(fs.existsSync(path.join(first.path, 'plan.md')), false);

  const second = createClaimWorktree(repoRoot, 'resync-clean', { worktreeDir });

  assert.equal(second.path, first.path);
  assert.equal(second.reused, true);
  assert.equal(fs.existsSync(path.join(second.path, 'plan.md')), true, 'reattach must resync to the branch\'s current tip');
  assert.equal(
    execFileSync('git', ['rev-parse', 'HEAD'], { cwd: second.path, encoding: 'utf8' }).trim(),
    newTip,
  );

  removeWorktree(repoRoot, second.path, { force: true });
});

test('createClaimWorktree refuses to resync (and never resets) a reattach that is both behind its branch AND has real uncommitted work', () => {
  const repoRoot = initTempRepo();
  const worktreeDir = mkWorktreeDir();
  const branch = branchNameFor('resync-dirty-behind');
  const first = createClaimWorktree(repoRoot, 'resync-dirty-behind', { worktreeDir });
  commitOnWorktree(first.path, 'context.md', '# decisions\n');

  advanceBranchExternally(repoRoot, branch, 'plan.md', '# plan\n');
  fs.writeFileSync(path.join(first.path, 'in-progress.txt'), 'not yet committed\n');

  assert.throws(
    () => createClaimWorktree(repoRoot, 'resync-dirty-behind', { worktreeDir }),
    WorktreeError,
  );
  // the uncommitted work must survive the refusal untouched — never reset
  // over real work
  assert.equal(fs.readFileSync(path.join(first.path, 'in-progress.txt'), 'utf8'), 'not yet committed\n');
  assert.equal(fs.existsSync(path.join(first.path, 'plan.md')), false, 'a refused resync must never partially apply');

  removeWorktree(repoRoot, first.path, { force: true });
});

test('createClaimWorktree\'s dirty-and-behind refusal points at the stale-vs-real diagnostic recipe', () => {
  const repoRoot = initTempRepo();
  const worktreeDir = mkWorktreeDir();
  const branch = branchNameFor('resync-dirty-behind-hint');
  const first = createClaimWorktree(repoRoot, 'resync-dirty-behind-hint', { worktreeDir });
  commitOnWorktree(first.path, 'context.md', '# decisions\n');

  advanceBranchExternally(repoRoot, branch, 'plan.md', '# plan\n');
  fs.writeFileSync(path.join(first.path, 'in-progress.txt'), 'not yet committed\n');

  let caught;
  try {
    createClaimWorktree(repoRoot, 'resync-dirty-behind-hint', { worktreeDir });
  } catch (err) {
    caught = err;
  }
  assert.ok(caught instanceof WorktreeError);
  assert.match(
    caught.message,
    /docs\/how-to\/tell-a-stale-worktree-index-apart-from-real-uncommitted-work\.md/,
  );

  removeWorktree(repoRoot, first.path, { force: true });
});

test('createClaimWorktree refuses to resync a reattach whose last-synced commit is not an ancestor of the branch\'s current tip (a rewrite/divergence)', () => {
  const repoRoot = initTempRepo();
  const worktreeDir = mkWorktreeDir();
  const branch = branchNameFor('resync-diverged');
  const first = createClaimWorktree(repoRoot, 'resync-diverged', { worktreeDir });
  commitOnWorktree(first.path, 'context.md', '# decisions\n');
  const lastSynced = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: first.path, encoding: 'utf8' }).trim();

  // rewrite the branch to a sibling of lastSynced's parent instead of a
  // descendant of lastSynced itself -- simulates a history rewrite, not an
  // ordinary forward merge
  const parentTip = execFileSync('git', ['rev-parse', `${lastSynced}^`], { cwd: repoRoot, encoding: 'utf8' }).trim();
  execFileSync('git', ['branch', '-f', branch, parentTip], { cwd: repoRoot });
  advanceBranchExternally(repoRoot, branch, 'sibling.md', '# sibling\n');

  assert.throws(
    () => createClaimWorktree(repoRoot, 'resync-diverged', { worktreeDir }),
    WorktreeError,
  );

  removeWorktree(repoRoot, first.path, { force: true });
});

test('createClaimWorktree still reattaches a DIRTY checkout whose branch never moved -- the resync guard is a no-op, not a new refusal (tsk-2cd)', () => {
  const repoRoot = initTempRepo();
  const worktreeDir = mkWorktreeDir();
  const first = createClaimWorktree(repoRoot, 'resync-dirty-not-behind', { worktreeDir });
  commitOnWorktree(first.path, 'context.md', '# decisions\n');
  fs.writeFileSync(path.join(first.path, 'in-progress.txt'), 'not yet committed\n');

  // no advanceBranchExternally call here -- the branch tip is exactly what
  // this worktree was last synced to, so the guard must not even reach its
  // own dirty check
  const second = createClaimWorktree(repoRoot, 'resync-dirty-not-behind', { worktreeDir });

  assert.equal(second.path, first.path);
  assert.equal(second.reused, true);
  assert.equal(fs.readFileSync(path.join(first.path, 'in-progress.txt'), 'utf8'), 'not yet committed\n');

  removeWorktree(repoRoot, first.path, { force: true });
});

test('resyncClaimWorktree re-strips .fgos/ after its own reset --hard (tsk-1d7 bundled fix, ADR0020)', () => {
  const repoRoot = initTempRepo();
  const worktreeDir = mkWorktreeDir();
  const branch = branchNameFor('resync-fgos-restrip');
  const first = createClaimWorktree(repoRoot, 'resync-fgos-restrip', { worktreeDir });
  commitOnWorktree(first.path, 'context.md', '# decisions\n');

  // Advance the branch externally with a commit that adds a TRACKED
  // .fgos/ file -- mirrors this real repo's own ADR0020 premise (.fgos/
  // is git-tracked), so `reset --hard` to the new tip resurrects it on
  // disk unless it is stripped again afterward.
  const startTip = execFileSync('git', ['rev-parse', branch], { cwd: repoRoot, encoding: 'utf8' }).trim();
  const detachedPath = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-worktree-test-detached-fgos-'));
  execFileSync('git', ['worktree', 'add', '--detach', detachedPath, startTip], { cwd: repoRoot });
  fs.mkdirSync(path.join(detachedPath, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(detachedPath, '.fgos', 'events.jsonl'), '{"seq":1}\n');
  execFileSync('git', ['add', '.fgos/events.jsonl'], { cwd: detachedPath });
  execFileSync('git', ['commit', '-q', '-m', 'external advance: tracked .fgos/'], { cwd: detachedPath });
  const newTip = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: detachedPath, encoding: 'utf8' }).trim();
  execFileSync('git', ['branch', '-f', branch, newTip], { cwd: repoRoot });
  execFileSync('git', ['worktree', 'remove', '--force', detachedPath], { cwd: repoRoot });

  const result = resyncClaimWorktree(repoRoot, first.path, branch);

  assert.equal(result.resynced, true);
  assert.equal(
    fs.existsSync(path.join(first.path, '.fgos')),
    false,
    'resyncClaimWorktree\'s own reset --hard must not resurrect .fgos/ on disk (ADR0020)',
  );

  removeWorktree(repoRoot, first.path, { force: true });
});

// --- resync-worktree repair verb (tsk-1d7, docs/history/
// stale-worktree-index-guard/CONTEXT.md D3) -- unlike resyncClaimWorktree
// above, this verb is invoked precisely BECAUSE the worktree has real
// staged content worth carrying forward (the commit that was about to
// happen), so it must succeed where resyncClaimWorktree would refuse. ---

test('resyncWorktree is a no-op when the worktree is already at its branch tip', () => {
  const repoRoot = initTempRepo();
  const worktreeDir = mkWorktreeDir();
  const branch = branchNameFor('resync-verb-same-tip');
  const wt = createClaimWorktree(repoRoot, 'resync-verb-same-tip', { worktreeDir });
  commitOnWorktree(wt.path, 'context.md', '# decisions\n');

  const result = resyncWorktree(repoRoot, wt.path, branch);

  assert.deepEqual(result, { resynced: false, reason: 'already-in-sync' });
  removeWorktree(repoRoot, wt.path, { force: true });
});

test('resyncWorktree refuses a diverged (rewritten) branch, same as resyncClaimWorktree', () => {
  const repoRoot = initTempRepo();
  const worktreeDir = mkWorktreeDir();
  const branch = branchNameFor('resync-verb-diverged');
  const wt = createClaimWorktree(repoRoot, 'resync-verb-diverged', { worktreeDir });
  commitOnWorktree(wt.path, 'context.md', '# decisions\n');
  const lastSynced = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: wt.path, encoding: 'utf8' }).trim();
  const parentTip = execFileSync('git', ['rev-parse', `${lastSynced}^`], { cwd: repoRoot, encoding: 'utf8' }).trim();
  execFileSync('git', ['branch', '-f', branch, parentTip], { cwd: repoRoot });
  advanceBranchExternally(repoRoot, branch, 'sibling.md', '# sibling\n');

  assert.throws(() => resyncWorktree(repoRoot, wt.path, branch), WorktreeError);

  removeWorktree(repoRoot, wt.path, { force: true });
});

test('resyncWorktree with nothing staged resets cleanly to the branch tip (reapplied: false)', () => {
  const repoRoot = initTempRepo();
  const worktreeDir = mkWorktreeDir();
  const branch = branchNameFor('resync-verb-nothing-staged');
  const wt = createClaimWorktree(repoRoot, 'resync-verb-nothing-staged', { worktreeDir });
  commitOnWorktree(wt.path, 'context.md', '# decisions\n');

  const newTip = advanceBranchExternally(repoRoot, branch, 'plan.md', '# plan\n');

  const result = resyncWorktree(repoRoot, wt.path, branch);

  assert.equal(result.resynced, true);
  assert.equal(result.reapplied, false);
  assert.equal(
    execFileSync('git', ['rev-parse', 'HEAD'], { cwd: wt.path, encoding: 'utf8' }).trim(),
    newTip,
  );
  assert.equal(fs.existsSync(path.join(wt.path, 'plan.md')), true);

  removeWorktree(repoRoot, wt.path, { force: true });
});

test('resyncWorktree reapplies staged content (a new file) after resetting to the moved branch tip', () => {
  const repoRoot = initTempRepo();
  const worktreeDir = mkWorktreeDir();
  const branch = branchNameFor('resync-verb-reapply');
  const wt = createClaimWorktree(repoRoot, 'resync-verb-reapply', { worktreeDir });
  commitOnWorktree(wt.path, 'context.md', '# decisions\n');

  // The commit that was about to happen from this worktree -- staged, not
  // yet committed, when the external force-move lands.
  fs.writeFileSync(path.join(wt.path, 'my-change.md'), '# my staged change\n');
  execFileSync('git', ['add', 'my-change.md'], { cwd: wt.path });

  const newTip = advanceBranchExternally(repoRoot, branch, 'plan.md', '# plan\n');

  const result = resyncWorktree(repoRoot, wt.path, branch);

  assert.equal(result.resynced, true);
  assert.equal(result.reapplied, true);
  assert.equal(
    execFileSync('git', ['rev-parse', 'HEAD'], { cwd: wt.path, encoding: 'utf8' }).trim(),
    newTip,
    'the worktree must land on the real branch tip, not stay behind',
  );
  assert.equal(fs.existsSync(path.join(wt.path, 'plan.md')), true, 'the branch\'s own external advance must be present');
  assert.equal(
    fs.readFileSync(path.join(wt.path, 'my-change.md'), 'utf8'),
    '# my staged change\n',
    'the worktree\'s own staged content must survive the resync',
  );
  const staged = execFileSync('git', ['diff', '--cached', '--name-only'], { cwd: wt.path, encoding: 'utf8' }).trim();
  assert.equal(staged, 'my-change.md', 'the reapplied content must land back in the index, not just the working tree');

  removeWorktree(repoRoot, wt.path, { force: true });
});

test('resyncWorktree refuses on a real conflict, preserving the patch file for manual review', () => {
  const repoRoot = initTempRepo();
  const worktreeDir = mkWorktreeDir();
  const branch = branchNameFor('resync-verb-conflict');
  const wt = createClaimWorktree(repoRoot, 'resync-verb-conflict', { worktreeDir });
  commitOnWorktree(wt.path, 'context.md', '# decisions\n');

  // Stage a conflicting edit to the SAME line the external advance below
  // also changes.
  fs.writeFileSync(path.join(wt.path, 'seed.txt'), 'staged-from-worktree\n');
  execFileSync('git', ['add', 'seed.txt'], { cwd: wt.path });

  advanceBranchExternally(repoRoot, branch, 'unrelated.md', '# unrelated\n');
  // advanceBranchExternally only touched a new file -- also conflict seed.txt
  // itself via a second external commit on the same branch.
  const detachedPath = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-worktree-test-detached-conflict-'));
  execFileSync('git', ['worktree', 'add', '--detach', detachedPath, branch], { cwd: repoRoot });
  fs.writeFileSync(path.join(detachedPath, 'seed.txt'), 'external-conflicting-content\n');
  execFileSync('git', ['add', 'seed.txt'], { cwd: detachedPath });
  execFileSync('git', ['commit', '-q', '-m', 'external conflicting edit'], { cwd: detachedPath });
  const conflictTip = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: detachedPath, encoding: 'utf8' }).trim();
  execFileSync('git', ['branch', '-f', branch, conflictTip], { cwd: repoRoot });
  execFileSync('git', ['worktree', 'remove', '--force', detachedPath], { cwd: repoRoot });

  const gitCommonDir = execFileSync('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'], { cwd: repoRoot, encoding: 'utf8' }).trim();
  const patchDirBefore = path.join(gitCommonDir, 'fgos-resync-patches');
  const filesBefore = fs.existsSync(patchDirBefore) ? fs.readdirSync(patchDirBefore) : [];

  assert.throws(() => resyncWorktree(repoRoot, wt.path, branch), WorktreeError);

  const filesAfter = fs.readdirSync(patchDirBefore);
  assert.equal(filesAfter.length, filesBefore.length + 1, 'a conflict must preserve exactly one new patch file for manual review');
  const patchContent = fs.readFileSync(path.join(patchDirBefore, filesAfter.find((f) => !filesBefore.includes(f))), 'utf8');
  assert.match(patchContent, /seed\.txt/, 'the preserved patch must contain the staged change that could not be reapplied');

  removeWorktree(repoRoot, wt.path, { force: true });
});

test('resyncWorktree refuses on stray dirt beyond what was staged, never guessing a merge', () => {
  const repoRoot = initTempRepo();
  const worktreeDir = mkWorktreeDir();
  const branch = branchNameFor('resync-verb-stray-dirt');
  const wt = createClaimWorktree(repoRoot, 'resync-verb-stray-dirt', { worktreeDir });
  commitOnWorktree(wt.path, 'context.md', '# decisions\n');

  fs.writeFileSync(path.join(wt.path, 'my-change.md'), '# staged\n');
  execFileSync('git', ['add', 'my-change.md'], { cwd: wt.path });
  // Stray dirt: an UNSTAGED, untracked file -- not part of the commit
  // under repair.
  fs.writeFileSync(path.join(wt.path, 'forgot-to-add.md'), '# oops\n');

  advanceBranchExternally(repoRoot, branch, 'plan.md', '# plan\n');

  assert.throws(() => resyncWorktree(repoRoot, wt.path, branch), WorktreeError);
  // refusing must not have touched anything -- still behind, still dirty
  assert.equal(fs.existsSync(path.join(wt.path, 'plan.md')), false, 'a refused resync must never partially apply');
  assert.equal(fs.readFileSync(path.join(wt.path, 'forgot-to-add.md'), 'utf8'), '# oops\n');

  removeWorktree(repoRoot, wt.path, { force: true });
});

test('resyncWorktree re-strips .fgos/ after its own reset --hard (tsk-1d7 bundled fix, ADR0020)', () => {
  const repoRoot = initTempRepo();
  const worktreeDir = mkWorktreeDir();
  const branch = branchNameFor('resync-verb-fgos-restrip');
  const wt = createClaimWorktree(repoRoot, 'resync-verb-fgos-restrip', { worktreeDir });
  commitOnWorktree(wt.path, 'context.md', '# decisions\n');

  const startTip = execFileSync('git', ['rev-parse', branch], { cwd: repoRoot, encoding: 'utf8' }).trim();
  const detachedPath = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-worktree-test-detached-verb-fgos-'));
  execFileSync('git', ['worktree', 'add', '--detach', detachedPath, startTip], { cwd: repoRoot });
  fs.mkdirSync(path.join(detachedPath, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(detachedPath, '.fgos', 'events.jsonl'), '{"seq":1}\n');
  execFileSync('git', ['add', '.fgos/events.jsonl'], { cwd: detachedPath });
  execFileSync('git', ['commit', '-q', '-m', 'external advance: tracked .fgos/'], { cwd: detachedPath });
  const newTip = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: detachedPath, encoding: 'utf8' }).trim();
  execFileSync('git', ['branch', '-f', branch, newTip], { cwd: repoRoot });
  execFileSync('git', ['worktree', 'remove', '--force', detachedPath], { cwd: repoRoot });

  const result = resyncWorktree(repoRoot, wt.path, branch);

  assert.equal(result.resynced, true);
  assert.equal(
    fs.existsSync(path.join(wt.path, '.fgos')),
    false,
    'resyncWorktree\'s own reset --hard must not resurrect .fgos/ on disk (ADR0020)',
  );

  removeWorktree(repoRoot, wt.path, { force: true });
});

// --- tsk-jg4: orphaned-patch crash-window detection ---------------------
//
// A prior resyncWorktree run killed between its own reset and reapply
// leaves an unremoved patch file under fgos-resync-patches/ while
// lastSyncedCommit already reads "already in sync" -- the next run must
// refuse loudly instead of silently proceeding past the orphaned signal.

test('resyncWorktree refuses when a prior run left an orphaned patch file for this branch, without touching the worktree', () => {
  const repoRoot = initTempRepo();
  const worktreeDir = mkWorktreeDir();
  const branch = branchNameFor('resync-verb-orphaned-patch');
  const wt = createClaimWorktree(repoRoot, 'resync-verb-orphaned-patch', { worktreeDir });
  commitOnWorktree(wt.path, 'context.md', '# decisions\n');

  advanceBranchExternally(repoRoot, branch, 'plan.md', '# plan\n');

  // Simulate a prior run killed between its own reset and reapply: a
  // leftover patch file for THIS branch, same naming shape
  // resyncWorktree itself writes.
  const gitCommonDir = execFileSync('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'], { cwd: repoRoot, encoding: 'utf8' }).trim();
  const patchDir = path.join(gitCommonDir, 'fgos-resync-patches');
  fs.mkdirSync(patchDir, { recursive: true });
  const orphanedPatchPath = path.join(patchDir, `${branch.replace(/\//g, '-')}-1700000000000.patch`);
  fs.writeFileSync(orphanedPatchPath, 'diff --git a/stranded.md b/stranded.md\n');

  assert.throws(
    () => resyncWorktree(repoRoot, wt.path, branch),
    (err) => err instanceof WorktreeError && err.message.includes(orphanedPatchPath),
    'must throw WorktreeError naming the orphaned patch path',
  );

  // Refusing must happen before any reset/reapply -- the working tree
  // itself is untouched (never fast-forwarded onto the branch's external
  // advance; `plan.md` never lands), and the orphaned file itself
  // survives (never silently cleaned up on this skill's own authority).
  // (`git rev-parse HEAD` inside a non-detached checkout would report the
  // branch's CURRENT tip regardless of whether a reset actually ran here
  // -- HEAD is a symbolic ref to the branch, which advanceBranchExternally
  // already force-moved from elsewhere -- so the working tree's real
  // content is the only trustworthy signal that no reset happened.)
  assert.equal(fs.existsSync(path.join(wt.path, 'plan.md')), false, 'the worktree must not be reset while an orphaned patch is unresolved');
  assert.equal(fs.existsSync(orphanedPatchPath), true, 'the orphaned patch must be preserved for manual review, never auto-deleted');

  fs.rmSync(orphanedPatchPath, { force: true });
  removeWorktree(repoRoot, wt.path, { force: true });
});

test('resyncWorktree is unaffected by an orphaned patch file belonging to a DIFFERENT branch', () => {
  const repoRoot = initTempRepo();
  const worktreeDir = mkWorktreeDir();
  const branch = branchNameFor('resync-verb-orphan-other-branch');
  const wt = createClaimWorktree(repoRoot, 'resync-verb-orphan-other-branch', { worktreeDir });
  commitOnWorktree(wt.path, 'context.md', '# decisions\n');

  const newTip = advanceBranchExternally(repoRoot, branch, 'plan.md', '# plan\n');

  // A leftover patch for a completely unrelated branch must never trip
  // this branch's own resync -- the filter is prefix-scoped per branch.
  const gitCommonDir = execFileSync('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'], { cwd: repoRoot, encoding: 'utf8' }).trim();
  const patchDir = path.join(gitCommonDir, 'fgos-resync-patches');
  fs.mkdirSync(patchDir, { recursive: true });
  const unrelatedPatchPath = path.join(patchDir, 'fgw-some-other-item-1700000000000.patch');
  fs.writeFileSync(unrelatedPatchPath, 'diff --git a/unrelated.md b/unrelated.md\n');

  const result = resyncWorktree(repoRoot, wt.path, branch);

  assert.equal(result.resynced, true);
  assert.equal(
    execFileSync('git', ['rev-parse', 'HEAD'], { cwd: wt.path, encoding: 'utf8' }).trim(),
    newTip,
  );
  assert.equal(fs.existsSync(unrelatedPatchPath), true, 'an unrelated branch\'s own orphaned patch must be left alone');

  fs.rmSync(unrelatedPatchPath, { force: true });
  removeWorktree(repoRoot, wt.path, { force: true });
});

test('createClaimWorktree ignores a checkout outside its own worktreeDir (a runner dispatch checkout is never reattached to)', () => {
  const repoRoot = initTempRepo();
  const dispatchDir = mkWorktreeDir();
  const claimDir = mkWorktreeDir();
  const dispatch = createDispatchWorktree(repoRoot, 'reattach-elsewhere', { worktreeDir: dispatchDir });
  commitOnWorktree(dispatch.path, 'attempt.txt', 'worker output\n');

  const claim = createClaimWorktree(repoRoot, 'reattach-elsewhere', { worktreeDir: claimDir });

  assert.notEqual(claim.path, dispatch.path, 'a checkout in another caller\'s directory is not reattachable');
  assert.equal(path.dirname(claim.path), fs.realpathSync(claimDir));
  assert.equal(claim.reused, true, 'still a branch reuse — just not a checkout reattach');
  assert.equal(fs.existsSync(dispatch.path), false, 'the out-of-dir checkout goes through the normal reclaim path');

  removeWorktree(repoRoot, claim.path, { force: true });
});

test('createClaimWorktree falls through to a fresh checkout when the registered path is gone from disk', () => {
  const repoRoot = initTempRepo();
  const worktreeDir = mkWorktreeDir();
  const first = createClaimWorktree(repoRoot, 'reattach-vanished', { worktreeDir });
  commitOnWorktree(first.path, 'context.md', '# decisions\n');
  // the directory disappears without a prune — `git worktree list` still
  // reports it
  fs.rmSync(first.path, { recursive: true, force: true });

  const second = createClaimWorktree(repoRoot, 'reattach-vanished', { worktreeDir });

  assert.notEqual(second.path, first.path);
  assert.equal(fs.existsSync(second.path), true);
  assert.equal(second.reused, true);
  // the branch's own commit survived — reused, not recreated
  assert.equal(fs.existsSync(path.join(second.path, 'context.md')), true);

  removeWorktree(repoRoot, second.path, { force: true });
});

test('createDispatchWorktree still allocates a FRESH directory on a reused branch — the reattach never leaks to the runner retry path', () => {
  const repoRoot = initTempRepo();
  const worktreeDir = mkWorktreeDir();
  const first = createDispatchWorktree(repoRoot, 'dispatch-retry', { worktreeDir });
  commitOnWorktree(first.path, 'attempt.txt', 'first attempt\n');

  const retry = createDispatchWorktree(repoRoot, 'dispatch-retry', { worktreeDir });

  assert.notEqual(retry.path, first.path, 'a retry never builds in the previous attempt\'s directory');
  assert.equal(retry.reused, true);
  assert.equal(fs.existsSync(first.path), false, 'the previous attempt\'s checkout is reclaimed as before');
  assert.equal(fs.existsSync(path.join(retry.path, 'attempt.txt')), true, 'same branch, so its commit is there');

  removeWorktree(repoRoot, retry.path, { force: true });
});

// --- provisionDependencies (tsk-2vd D1/D2) --------------------------------

test('provisionDependencies no-ops when the worktree has no package.json at all', () => {
  const worktreeDir = mkWorktreeDir();
  provisionDependencies(worktreeDir);
  assert.equal(fs.existsSync(path.join(worktreeDir, 'node_modules')), false);
});

test('provisionDependencies no-ops when package.json declares no dependencies or devDependencies', () => {
  const worktreeDir = mkWorktreeDir();
  fs.writeFileSync(path.join(worktreeDir, 'package.json'), JSON.stringify({ name: 'x', version: '1.0.0' }));
  provisionDependencies(worktreeDir);
  assert.equal(fs.existsSync(path.join(worktreeDir, 'node_modules')), false);
});

test('provisionDependencies runs npm install (no lockfile) and the declared dependency ends up in this worktree\'s own node_modules', () => {
  const worktreeDir = mkWorktreeDir();
  const localDep = mkLocalDependency();
  fs.writeFileSync(
    path.join(worktreeDir, 'package.json'),
    JSON.stringify({ name: 'x', version: '1.0.0', dependencies: { 'fgos-test-localdep': `file:${localDep}` } }),
  );
  provisionDependencies(worktreeDir);
  assert.equal(fs.existsSync(path.join(worktreeDir, 'node_modules', 'fgos-test-localdep', 'package.json')), true);
});

test('provisionDependencies runs npm ci when package-lock.json is present', () => {
  const worktreeDir = mkWorktreeDir();
  const localDep = mkLocalDependency();
  fs.writeFileSync(
    path.join(worktreeDir, 'package.json'),
    JSON.stringify({ name: 'x', version: '1.0.0', devDependencies: { 'fgos-test-localdep': `file:${localDep}` } }),
  );
  // Generate a real lockfile first (npm install), then re-provision a fresh
  // worktree from scratch with that lockfile already in place — proving
  // the npm-ci branch specifically, not just "some install happened".
  execFileSync('npm', ['install', '--package-lock-only'], { cwd: worktreeDir });
  fs.rmSync(path.join(worktreeDir, 'node_modules'), { recursive: true, force: true });
  assert.equal(fs.existsSync(path.join(worktreeDir, 'package-lock.json')), true);

  provisionDependencies(worktreeDir);
  assert.equal(fs.existsSync(path.join(worktreeDir, 'node_modules', 'fgos-test-localdep', 'package.json')), true);
});

test('createWorktree provisions a declared dependency into the fresh worktree automatically', () => {
  const repoRoot = initTempRepo();
  const worktreeDir = mkWorktreeDir();
  const localDep = mkLocalDependency();
  fs.writeFileSync(
    path.join(repoRoot, 'package.json'),
    JSON.stringify({ name: 'x', version: '1.0.0', dependencies: { 'fgos-test-localdep': `file:${localDep}` } }),
  );
  execFileSync('git', ['add', 'package.json'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-q', '-m', 'declare a dependency'], { cwd: repoRoot });

  const wt = createWorktree(repoRoot, 'item-deps', { worktreeDir });

  assert.equal(fs.existsSync(path.join(wt.path, 'node_modules', 'fgos-test-localdep', 'package.json')), true);
});

test('tsk-1mn: createWorktree calls opts.beforeProvision after all repoRoot-touching git setup completes, strictly BEFORE provisioning installs anything', () => {
  // Finding 2: claimWork used to hold main-checkout.lock across the whole
  // synchronous npm ci/install. The fix (claim-port.mjs) releases the lock
  // via this exact callback, at this exact seam -- this test proves the
  // seam's own ordering contract directly, independent of claimWork's own
  // wiring (already covered indirectly by every existing isolate:true
  // claimWork test, which now exercises this same callback for real).
  const repoRoot = initTempRepo();
  const worktreeDir = mkWorktreeDir();
  const localDep = mkLocalDependency();
  fs.writeFileSync(
    path.join(repoRoot, 'package.json'),
    JSON.stringify({ name: 'x', version: '1.0.0', dependencies: { 'fgos-test-localdep': `file:${localDep}` } }),
  );
  execFileSync('git', ['add', 'package.json'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-q', '-m', 'declare a dependency'], { cwd: repoRoot });

  let calls = 0;
  let nodeModulesExistedAtCallTime;
  let branchExistedAtCallTime;
  const wt = createWorktree(repoRoot, 'item-deps-cb', {
    worktreeDir,
    beforeProvision: () => {
      calls += 1;
      // The temp dir mkdtemp allocated is the only entry under worktreeDir
      // at this point -- read it back rather than assuming wt.path (not yet
      // assigned; createWorktree itself hasn't returned).
      const [createdDir] = fs.readdirSync(worktreeDir);
      nodeModulesExistedAtCallTime = fs.existsSync(path.join(worktreeDir, createdDir, 'node_modules'));
      branchExistedAtCallTime = branchExists(repoRoot, branchNameFor('item-deps-cb'));
    },
  });

  assert.equal(calls, 1, 'beforeProvision must fire exactly once');
  assert.equal(branchExistedAtCallTime, true, 'the branch this claim forked must already exist by the time beforeProvision fires (all repoRoot git setup already ran)');
  assert.equal(nodeModulesExistedAtCallTime, false, 'beforeProvision must fire BEFORE provisioning installs anything -- this is the release point, not an afterthought');
  assert.equal(fs.existsSync(path.join(wt.path, 'node_modules', 'fgos-test-localdep', 'package.json')), true, 'provisioning still actually ran afterward');
});

test('tsk-1mn: createWorktree with no beforeProvision supplied stays byte-identical (every existing caller, including createDetachedMergeWorktree, unaffected)', () => {
  const repoRoot = initTempRepo();
  const worktreeDir = mkWorktreeDir();
  const localDep = mkLocalDependency();
  fs.writeFileSync(
    path.join(repoRoot, 'package.json'),
    JSON.stringify({ name: 'x', version: '1.0.0', dependencies: { 'fgos-test-localdep': `file:${localDep}` } }),
  );
  execFileSync('git', ['add', 'package.json'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-q', '-m', 'declare a dependency'], { cwd: repoRoot });

  const wt = createWorktree(repoRoot, 'item-deps-nocb', { worktreeDir });

  assert.equal(fs.existsSync(path.join(wt.path, 'node_modules', 'fgos-test-localdep', 'package.json')), true);
});

test('tsk-4yv: createWorktree removes the worktree it just registered when finishWorktreeSetup fails (malformed package.json throws inside provisionDependencies) — never leaks a registered checkout', () => {
  const repoRoot = initTempRepo();
  const worktreeDir = mkWorktreeDir();
  // Malformed JSON forces a real, deterministic, fully offline throw inside
  // provisionDependencies's own `JSON.parse(fs.readFileSync(...))` call —
  // no npm process or network behavior to rely on (a nonexistent `file:`
  // dependency path was tried here first and found NOT to fail npm install
  // at all in practice; this is the reliable failure trigger instead).
  fs.writeFileSync(path.join(repoRoot, 'package.json'), '{not valid json');
  execFileSync('git', ['add', 'package.json'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-q', '-m', 'commit a malformed package.json'], { cwd: repoRoot });

  assert.throws(() => createWorktree(repoRoot, 'item-broken-dep', { worktreeDir }), SyntaxError);

  // Finding 7: before this fix, `git worktree add` had already succeeded
  // and registered the checkout by the time provisionDependencies threw --
  // nothing removed it, so it stayed registered AND on disk indefinitely.
  const listing = execFileSync('git', ['worktree', 'list', '--porcelain'], { cwd: repoRoot, encoding: 'utf8' });
  assert.doesNotMatch(listing, /item-broken-dep/, 'the worktree must be fully unregistered from git, not left dangling');
  assert.deepEqual(fs.readdirSync(worktreeDir), [], 'the checkout directory itself must be removed too, not just unregistered');
});

test('createWorktree stays byte-identical (no node_modules created) for a repo with no package.json — every existing zero-dependency caller unaffected', () => {
  const repoRoot = initTempRepo();
  const worktreeDir = mkWorktreeDir();

  const wt = createWorktree(repoRoot, 'item-nodeps', { worktreeDir });

  assert.equal(fs.existsSync(path.join(wt.path, 'node_modules')), false);
});

// --- refreshUnstartedBranch / createClaimWorktree's decompose-to-pick
// refresh (tsk-55p) --------------------------------------------------------

function rev(cwd, ref) {
  return execFileSync('git', ['rev-parse', ref], { cwd, encoding: 'utf8' }).trim();
}

test('createClaimWorktree refreshes a branch with no commits of its own onto the target tip (tsk-55p, acceptance 1)', () => {
  const repoRoot = initTempRepo();
  const worktreeDir = mkWorktreeDir();
  execFileSync('git', ['branch', 'fgw/root'], { cwd: repoRoot });
  createBranchRef(repoRoot, 'leaf', { baseRef: 'fgw/root' });
  const staleBase = rev(repoRoot, 'fgw/leaf');
  const newTip = advanceBranchExternally(repoRoot, 'fgw/root', 'target.txt', 'moved\n');
  assert.notEqual(staleBase, newTip);

  const wt = createClaimWorktree(repoRoot, 'leaf', { worktreeDir, baseRef: 'fgw/root' });

  assert.equal(wt.refresh.refreshed, true);
  assert.equal(wt.refresh.reason, undefined);
  assert.equal(rev(repoRoot, 'fgw/leaf'), newTip, 'the branch ref itself must now point at the target tip');
  assert.equal(rev(wt.path, 'HEAD'), newTip, 'the checkout must reflect the refreshed tip, not the stale base');
  assert.ok(fs.existsSync(path.join(wt.path, 'target.txt')), 'the checkout must carry the refreshed content');
});

test('createClaimWorktree never touches a branch carrying its own commits, and reports drift instead (tsk-55p acceptance 2, D2)', () => {
  const repoRoot = initTempRepo();
  const worktreeDir = mkWorktreeDir();
  execFileSync('git', ['branch', 'fgw/root'], { cwd: repoRoot });
  createBranchRef(repoRoot, 'leaf', { baseRef: 'fgw/root' });
  const ownCommit = advanceBranchExternally(repoRoot, 'fgw/leaf', 'work.txt', 'mine\n');
  advanceBranchExternally(repoRoot, 'fgw/root', 'target.txt', 'moved\n');

  const wt = createClaimWorktree(repoRoot, 'leaf', { worktreeDir, baseRef: 'fgw/root' });

  assert.equal(rev(repoRoot, 'fgw/leaf'), ownCommit, 'the branch must be byte-identical to before the claim — the whole point');
  assert.equal(wt.refresh.refreshed, false);
  assert.equal(wt.refresh.reason, 'own-commits');
  assert.equal(wt.refresh.ahead, 1, 'leaf is 1 commit ahead of root (its own work)');
  assert.equal(wt.refresh.behind, 1, 'leaf is 1 commit behind root (root advanced separately)');
  assert.equal(rev(wt.path, 'HEAD'), ownCommit, 'the checkout must reflect the untouched branch, not a merged/refreshed one');
});

test('the refresh only ever fast-forwards — the pre-refresh tip survives as an ancestor of the post-refresh tip (tsk-55p acceptance 3, D2: never a rebase)', () => {
  const repoRoot = initTempRepo();
  const worktreeDir = mkWorktreeDir();
  execFileSync('git', ['branch', 'fgw/root'], { cwd: repoRoot });
  createBranchRef(repoRoot, 'leaf', { baseRef: 'fgw/root' });
  const staleBase = rev(repoRoot, 'fgw/leaf');
  advanceBranchExternally(repoRoot, 'fgw/root', 'target.txt', 'moved\n');

  const wt = createClaimWorktree(repoRoot, 'leaf', { worktreeDir, baseRef: 'fgw/root' });

  assert.equal(wt.refresh.from, staleBase);
  assert.equal(wt.refresh.to, rev(repoRoot, 'fgw/leaf'));
  // A rebase would rewrite staleBase's own history away; a real fast-forward
  // keeps it reachable as an ancestor of the new tip. This throws if it is
  // not — the assertion IS the ancestor check itself.
  execFileSync('git', ['merge-base', '--is-ancestor', staleBase, rev(repoRoot, 'fgw/leaf')], { cwd: repoRoot });
});

test('createClaimWorktree with no baseRef supplied: refresh is undefined, byte-identical to every pre-tsk-55p test of this function (regression guard)', () => {
  const repoRoot = initTempRepo();
  const worktreeDir = mkWorktreeDir();
  execFileSync('git', ['branch', 'fgw/root'], { cwd: repoRoot });
  createBranchRef(repoRoot, 'leaf', { baseRef: 'fgw/root' });
  advanceBranchExternally(repoRoot, 'fgw/root', 'target.txt', 'moved\n');

  const wt = createClaimWorktree(repoRoot, 'leaf', { worktreeDir });

  assert.equal(wt.refresh, undefined);
  assert.equal(rev(repoRoot, 'fgw/leaf'), rev(wt.path, 'HEAD'), 'unchanged behavior: checkout stands on whatever the branch already pointed at');
});

test('refreshUnstartedBranch: branch already at the target tip reports already-current, refreshed false, no error', () => {
  const repoRoot = initTempRepo();
  execFileSync('git', ['branch', 'fgw/root'], { cwd: repoRoot });
  createBranchRef(repoRoot, 'leaf', { baseRef: 'fgw/root' });

  const result = refreshUnstartedBranch(repoRoot, 'fgw/leaf', 'fgw/root');
  assert.equal(result.refreshed, false);
  assert.equal(result.reason, 'already-current');
  assert.equal(result.ahead, 0);
  assert.equal(result.behind, 0);
});

test('refreshUnstartedBranch with a live checkout: refreshes in place via a real fast-forward merge, and a subsequent resyncClaimWorktree call is then a no-op', () => {
  const repoRoot = initTempRepo();
  const worktreeDir = mkWorktreeDir();
  execFileSync('git', ['branch', 'fgw/root'], { cwd: repoRoot });
  createBranchRef(repoRoot, 'leaf', { baseRef: 'fgw/root' });

  // Stand up a real (white, unstarted) checkout first, simulating a claim
  // taken before this item existed -- exactly the reattach case
  // refreshUnstartedBranch's checkoutPath argument exists for.
  const first = createClaimWorktree(repoRoot, 'leaf', { worktreeDir });
  assert.equal(first.refresh, undefined);

  const newTip = advanceBranchExternally(repoRoot, 'fgw/root', 'target.txt', 'moved\n');
  const result = refreshUnstartedBranch(repoRoot, 'fgw/leaf', 'fgw/root', first.path);

  assert.equal(result.refreshed, true);
  assert.equal(result.to, newTip);
  assert.equal(rev(first.path, 'HEAD'), newTip, 'the live checkout itself must reflect the merge, not just the ref');
  assert.ok(fs.existsSync(path.join(first.path, 'target.txt')));

  // resyncClaimWorktree, called after, finds the checkout already at the
  // branch's current tip and correctly does nothing further.
  const resync = resyncClaimWorktree(repoRoot, first.path, 'fgw/leaf');
  assert.equal(resync.resynced, false);
});

test('checkoutDirtyPaths returns relative dirty paths excluding .fgos artifacts', () => {
  const repoRoot = initTempRepo();
  assert.deepEqual(checkoutDirtyPaths(repoRoot, repoRoot), []);

  // Write a dirty uncommitted file and an untracked file
  fs.writeFileSync(path.join(repoRoot, 'seed.txt'), 'modified seed\n');
  fs.writeFileSync(path.join(repoRoot, 'newfile.txt'), 'new\n');
  // Write a .fgos file which should be excluded by :!.fgos
  fs.mkdirSync(path.join(repoRoot, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, '.fgos', 'test.json'), '{}');

  const dirty = checkoutDirtyPaths(repoRoot, repoRoot);
  assert.deepEqual(dirty.sort(), ['newfile.txt', 'seed.txt']);
});

test('checkoutDirtyPaths returns empty array on invalid directory or git error', () => {
  const tmpDir = mkWorktreeDir();
  assert.deepEqual(checkoutDirtyPaths(tmpDir, tmpDir), []);
});

