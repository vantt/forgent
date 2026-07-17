import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  createWorktree,
  createBranchRef,
  removeWorktree,
  listLeftovers,
  branchNameFor,
  reclaimOrphanedCheckout,
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
