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
  reclaimOrphanedCheckout,
  provisionDependencies,
  resyncClaimWorktree,
  withMergeEphemeralWorktree,
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

test('createWorktree stays byte-identical (no node_modules created) for a repo with no package.json — every existing zero-dependency caller unaffected', () => {
  const repoRoot = initTempRepo();
  const worktreeDir = mkWorktreeDir();

  const wt = createWorktree(repoRoot, 'item-nodeps', { worktreeDir });

  assert.equal(fs.existsSync(path.join(wt.path, 'node_modules')), false);
});
