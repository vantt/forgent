import '../helpers/process-tmp-root.mjs';
import { activateGitFixture, discardFixtureWorktree } from './worktree-native-fixture.helper.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createLockScope, HolderLockError } from '../../src/holder-lock/index.mjs';
import { holdLockInChild } from '../helpers/hold-lock-in-child.mjs';
import { HOOK_TEST_SKIP } from '../helpers/main-checkout-hook-repo.mjs';
import { landRunnerItem } from '../../src/runner/merge.mjs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { writeProjectConfig } from '../helpers/config-fixture.mjs';
import {
  createWorktree,
  createClaimWorktree,
  createDispatchWorktree,
  removeDispatchWorktree,
  createBranchRef,
  removeWorktree,
  listLeftovers,
  branchNameFor,
  branchExists,
  reclaimOrphanedCheckout,
  provisionDependencies,
  createVerifyCheckout,
  checkoutDirtyPaths,
  realpathOrSelf,
  WorktreeError,
  admitStoreAccess,
  checkedOutBranch,
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
  activateGitFixture(repoRoot);
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
 * Advances `branch` from outside any checkout of it (tsk-2cd): a DETACHED
 * checkout at the branch's current tip, a real commit made there, then a
 * plain ref update — never
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
  execFileSync('git', ['update-ref', `refs/heads/${branch}`, newTip], { cwd: repoRoot });
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


// --- crash reclaim (phase-2-routing-10) ------------------------------------
//
// A genuine process kill skips every `finally`, so a branch can be left
// checked out at a now-orphaned path (the crashed run's own worktree,
// never torn down). `createWorktree` must reclaim that checkout — not
// throw — whenever it is about to reuse the branch, in both sub-cases: the
// orphaned directory still exists on disk, or it is already gone and only
// git's own bookkeeping needs pruning.


test('createWorktree prunes a missing checkout with owned create evidence and preserves its branch', () => {
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






test('reclaimOrphanedCheckout still reclaims normally when the only "change" is the .fgos removal createWorktree itself performs', () => {
  const repoRoot = initTempRepo();
  fs.mkdirSync(path.join(repoRoot, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, '.fgos', 'events.jsonl'), '');
  execFileSync('git', ['add', '.fgos/events.jsonl'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-q', '-m', 'track .fgos'], { cwd: repoRoot });
  activateGitFixture(repoRoot);
  const worktreeDir = mkWorktreeDir();
  const wt = createWorktree(repoRoot, 'item-i', { worktreeDir });
  commitOnWorktree(wt.path, 'attempt.txt', 'real work\n');

  const result = reclaimOrphanedCheckout(repoRoot, 'fgw/item-i');

  assert.equal(result.reclaimed, true);
  assert.equal(fs.existsSync(wt.path), false);
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
  activateGitFixture(repoRoot);

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
  activateGitFixture(repoRoot);
  const masterTip = branchTip(repoRoot, 'master');

  // Finding 8's own failure scenario: the pre-fix hardcoded default would
  // attempt `git branch fgw/<id> main` here, which throws outright -- this
  // repo has no branch named "main" at all.
  const result = createBranchRef(repoRoot, 'master-trunk-item');

  assert.equal(result.created, true);
  assert.equal(branchTip(repoRoot, 'fgw/master-trunk-item'), masterTip, 'branch forks from the real detected trunk (master), never a nonexistent hardcoded "main"');
});




test('tsk-4yv: verifying an already-landed leaf removes the detached checkout it registered when dependency provisioning fails -- never leaks an unreclaimed detached checkout', async () => {
  // Finding 7: this is specifically the DETACHED case (the verification
  // checkout landRunnerItem stands up for a target no checkout holds) --
  // reclaimOrphanedCheckout/checkoutPathForBranch are both branch-keyed and skip
  // a `detached` worktree stanza entirely, so nothing else in the codebase
  // would ever reclaim a leaked detached checkout. A repeated npm registry
  // flake during approve would accumulate full checkouts under tmp
  // indefinitely, exactly the scenario this fix closes.
  const repoRoot = initTempRepo();
  execFileSync('git', ['branch', '-M', 'main'], { cwd: repoRoot });
  // Malformed JSON forces a real, deterministic, fully offline throw inside
  // provisionDependencies (see the createWorktree sibling test above for
  // why a nonexistent file: dependency does NOT reliably fail npm install).
  fs.writeFileSync(path.join(repoRoot, 'package.json'), '{not valid json');
  execFileSync('git', ['add', 'package.json'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-q', '-m', 'commit a malformed package.json'], { cwd: repoRoot });
  activateGitFixture(repoRoot);
  // The leaf already landed on its root: approve's retry path verifies the
  // root branch's tree in a detached checkout, since no checkout holds it.
  execFileSync('git', ['branch', 'fgw/broken-dep-leaf'], { cwd: repoRoot });
  execFileSync('git', ['branch', 'fgw/broken-dep-root'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-q', '--allow-empty', '-m', 'unrelated main advance'], { cwd: repoRoot });

  await assert.rejects(() => landRunnerItem(repoRoot, { id: 'broken-dep-leaf', verify: 'true' }, { target: 'fgw/broken-dep-root' }), (err) => err instanceof Error && /package\.json is not valid JSON/.test(err.message));

  const listing = execFileSync('git', ['worktree', 'list', '--porcelain'], { cwd: repoRoot, encoding: 'utf8' });
  assert.doesNotMatch(listing, /fgos-worktrees\/verify-/, 'the detached verification checkout must not remain registered after provisioning failed');
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
  fs.mkdirSync(path.join(repoRoot, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, '.fgos', 'events.jsonl'), '{"seq":1}\n');
  execFileSync('git', ['add', '.fgos/events.jsonl'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-q', '-m', 'seed .fgos/events.jsonl'], { cwd: repoRoot });
  activateGitFixture(repoRoot);

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

  discardFixtureWorktree(repoRoot, first.path);
});

// --- resync guard: a reattached claim worktree may have fallen behind its
// own branch (tsk-2cd) — a child merge lands via a plain ref update on a
// DETACHED checkout, never touching this worktree's own files, so its
// branch can advance while this checkout sits exactly where it was ---------


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

  discardFixtureWorktree(repoRoot, second.path);
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

  discardFixtureWorktree(repoRoot, first.path);
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
    /docs\/knowledge\/how-to-tell-a-stale-worktree-index-apart-from-real-uncommitt\/tell-a-stale-worktree-index-apart-from-real-uncommitted-work\.md/,
  );

  discardFixtureWorktree(repoRoot, first.path);
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
  execFileSync('git', ['update-ref', `refs/heads/${branch}`, parentTip], { cwd: repoRoot });
  advanceBranchExternally(repoRoot, branch, 'sibling.md', '# sibling\n');

  assert.throws(
    () => createClaimWorktree(repoRoot, 'resync-diverged', { worktreeDir }),
    WorktreeError,
  );

  discardFixtureWorktree(repoRoot, first.path);
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

  discardFixtureWorktree(repoRoot, first.path);
});


// --- resync-worktree repair verb (tsk-1d7, docs/history/
// stale-worktree-index-guard/CONTEXT.md D3) -- unlike resyncClaimWorktree
// above, this verb is invoked precisely BECAUSE the worktree has real
// staged content worth carrying forward (the commit that was about to
// happen), so it must succeed where resyncClaimWorktree would refuse. ---








// --- tsk-jg4: orphaned-patch crash-window detection ---------------------
//
// A prior resyncWorktree run killed between its own reset and reapply
// leaves an unremoved patch file under fgos-resync-patches/ while
// lastSyncedCommit already reads "already in sync" -- the next run must
// refuse loudly instead of silently proceeding past the orphaned signal.



test('createClaimWorktree ignores a checkout outside its own worktreeDir (a runner dispatch checkout is never reattached to)', () => {
  const repoRoot = initTempRepo();
  const dispatchDir = mkWorktreeDir();
  const claimDir = mkWorktreeDir();
  const dispatch = createDispatchWorktree(repoRoot, 'reattach-elsewhere', { worktreeDir: dispatchDir });
  commitOnWorktree(dispatch.path, 'attempt.txt', 'worker output\n');

  const claim = createClaimWorktree(repoRoot, 'reattach-elsewhere', { worktreeDir: claimDir });

  assert.notEqual(claim.path, dispatch.path, 'a checkout in another caller\'s directory is not reattachable');
  assert.equal(path.dirname(claim.path), realpathOrSelf(claimDir));
  assert.equal(claim.reused, true, 'still a branch reuse — just not a checkout reattach');
  assert.equal(fs.existsSync(dispatch.path), false, 'the out-of-dir checkout goes through the normal reclaim path');

  discardFixtureWorktree(repoRoot, claim.path);
});

test('createClaimWorktree prunes an owned missing registration before allocating a fresh checkout', () => {
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

  discardFixtureWorktree(repoRoot, second.path);
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

  discardFixtureWorktree(repoRoot, retry.path);
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
  execFileSync('npm', ['install', '--package-lock-only'], { cwd: worktreeDir, shell: process.platform === 'win32' });
  fs.rmSync(path.join(worktreeDir, 'node_modules'), { recursive: true, force: true });
  assert.equal(fs.existsSync(path.join(worktreeDir, 'package-lock.json')), true);

  provisionDependencies(worktreeDir);
  assert.equal(fs.existsSync(path.join(worktreeDir, 'node_modules', 'fgos-test-localdep', 'package.json')), true);
});

test('createWorktree and createVerifyCheckout provision a declared dependency, and runner teardown removes both checkouts with what provisioning placed', () => {
  const repoRoot = initTempRepo();
  const worktreeDir = mkWorktreeDir();
  const localDep = mkLocalDependency();
  fs.writeFileSync(
    path.join(repoRoot, 'package.json'),
    JSON.stringify({ name: 'x', version: '1.0.0', dependencies: { 'fgos-test-localdep': `file:${localDep}` } }),
  );
  execFileSync('git', ['add', 'package.json'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-q', '-m', 'declare a dependency'], { cwd: repoRoot });
  activateGitFixture(repoRoot);

  const wt = createWorktree(repoRoot, 'item-deps', { worktreeDir });

  assert.equal(fs.existsSync(path.join(wt.path, 'node_modules', 'fgos-test-localdep', 'package.json')), true);
  // The ignored install would make the Worktree port refuse; teardown sets
  // aside exactly what provisioning recorded, so nothing is left behind.
  const failures = [];
  removeDispatchWorktree(repoRoot, wt.path, (line) => failures.push(line));
  assert.deepEqual(failures, []);
  assert.deepEqual(fs.readdirSync(worktreeDir), [], 'no checkout or set-aside directory is left');

  const verify = createVerifyCheckout(repoRoot, branchTip(repoRoot, 'HEAD'));
  assert.equal(fs.existsSync(path.join(verify, 'node_modules', 'fgos-test-localdep', 'package.json')), true);
  removeWorktree(repoRoot, verify, { force: true });
  assert.deepEqual(fs.readdirSync(path.dirname(verify)).filter((name) => name.includes(path.basename(verify))), []);
});


test('removing a verify checkout also removes the ignored bytes verification produced there, while a dispatch checkout with the same unknown ignored bytes is still refused', () => {
  const repoRoot = initTempRepo();
  fs.writeFileSync(path.join(repoRoot, '.gitignore'), 'build-output/\n');
  execFileSync('git', ['add', '.gitignore'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-q', '-m', 'ignore build output'], { cwd: repoRoot });
  activateGitFixture(repoRoot);
  const leave = (checkout) => {
    fs.mkdirSync(path.join(checkout, 'build-output', 'debug'), { recursive: true });
    fs.writeFileSync(path.join(checkout, 'build-output', 'debug', 'artifact.bin'), 'produced by a verification run');
  };

  // A checkout a worker or person uses keeps the port's protection: bytes no record names are never deleted.
  const dispatch = createWorktree(repoRoot, 'item-keeps-unknown-bytes', { worktreeDir: mkWorktreeDir() });
  leave(dispatch.path);
  assert.throws(() => removeWorktree(repoRoot, dispatch.path, { force: true }), /worktree-ignored-bytes-preserved/);
  assert.equal(fs.existsSync(path.join(dispatch.path, 'build-output', 'debug', 'artifact.bin')), true);
  fs.rmSync(path.join(dispatch.path, 'build-output'), { recursive: true });
  removeWorktree(repoRoot, dispatch.path, { force: true });

  // A verify checkout is disposable: what the verification run built there goes with it.
  const verify = createVerifyCheckout(repoRoot, branchTip(repoRoot, 'HEAD'));
  leave(verify);
  removeWorktree(repoRoot, verify, { force: true });
  assert.equal(fs.existsSync(verify), false, 'the checkout directory is gone');
  const listing = execFileSync('git', ['worktree', 'list', '--porcelain'], { cwd: repoRoot, encoding: 'utf8' });
  assert.doesNotMatch(listing, new RegExp(path.basename(verify)), 'the checkout is no longer registered');
  assert.deepEqual(fs.readdirSync(path.dirname(verify)).filter((name) => name.includes(path.basename(verify))), [], 'no set-aside directory is left');
});

test('createWorktree provisions dependencies after git worktree add and leaves its lock scope empty', () => {
  const repoRoot = initTempRepo();
  const worktreeDir = mkWorktreeDir();
  const localDep = mkLocalDependency();
  fs.writeFileSync(
    path.join(repoRoot, 'package.json'),
    JSON.stringify({ name: 'x', version: '1.0.0', dependencies: { 'fgos-test-localdep': `file:${localDep}` } }),
  );
  execFileSync('git', ['add', 'package.json'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-q', '-m', 'declare a dependency'], { cwd: repoRoot });
  activateGitFixture(repoRoot);

  const scope = createLockScope('provision-after-add');
  const wt = createWorktree(repoRoot, 'item-deps-nocb', { worktreeDir, scope });

  assert.equal(fs.existsSync(path.join(wt.path, 'node_modules', 'fgos-test-localdep', 'package.json')), true);
  assert.deepEqual(scope.holding(), [], 'worktree-admin is released before dependencies are provisioned');
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
  activateGitFixture(repoRoot);

  assert.throws(() => createWorktree(repoRoot, 'item-broken-dep', { worktreeDir }), (err) => err instanceof Error && /package\.json is not valid JSON/.test(err.message));

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

// --- runWorktreeSetupCommands (worktreeSetup.commands) ----------------------

function writeRepoConfig(repoRoot, config) {
  fs.mkdirSync(path.join(repoRoot, '.fgos'), { recursive: true });
  writeProjectConfig(repoRoot, config);
}



test('a failing worktreeSetup command throws WorktreeError naming the command and its output, and the half-built worktree is removed', () => {
  const repoRoot = initTempRepo();
  const nodeBin = JSON.stringify(process.execPath);
  writeRepoConfig(repoRoot, {
    worktreeSetup: {
      commands: [`${nodeBin} -e "process.stderr.write('boom-output\\n'); process.exit(3)" /* exit 3 */`],
    },
  });
  const worktreeDir = mkWorktreeDir();
  assert.throws(
    () => createWorktree(repoRoot, 'item-badsetup', { worktreeDir }),
    (err) => err instanceof WorktreeError && /exit 3/.test(err.message) && /boom-output/.test(err.message),
  );
  const registered = execFileSync('git', ['worktree', 'list', '--porcelain'], { cwd: repoRoot, encoding: 'utf8' });
  assert.doesNotMatch(registered, /item-badsetup/);
});

// admitStoreAccess is an adapter over the door in fgos-git: every refusal, its text and its fault class, the lazy Git
// read and the session-worktree rule are owned by packages/git/rust/src/store_admission.rs. These two cases own only
// what the adapter does: a refusal becomes a validation error carrying its fault class, and a warning passes through.
function mainWithCommittedFgos() {
  const main = initTempRepo();
  fs.mkdirSync(path.join(main, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(main, '.fgos', 'events.jsonl'), '');
  execFileSync('git', ['add', '.fgos/events.jsonl'], { cwd: main });
  execFileSync('git', ['commit', '-q', '-m', 'store'], { cwd: main });
  return main;
}

function linkedWorktreeOf(main, name) {
  const wt = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-admit-wt-')), name);
  execFileSync('git', ['worktree', 'add', '-q', '--detach', wt, 'HEAD'], { cwd: main });
  return wt;
}

const refusal = (fn) => { try { fn(); } catch (err) { return err; } return null; };

test('admitStoreAccess: a refusal of the door is a validation error carrying its fault class and its text', () => {
  const main = mainWithCommittedFgos();
  const wt = linkedWorktreeOf(main, 'adhoc');
  const err = refusal(() => admitStoreAccess({ verb: 'submit', store: 'require', mutates: true, dir: path.join(wt, '.fgos'), cwd: wt }));
  assert.equal(err?.category, 'validation');
  assert.equal(err.faultClass, 'disconnected-worktree-store');
  assert.match(err.message, /^"submit" refused: .*disconnected snapshot/);
  // The verb that creates the store is told by name: `init` inside a linked worktree.
  fs.rmSync(path.join(wt, '.fgos'), { recursive: true });
  assert.equal(refusal(() => admitStoreAccess({ verb: 'init', store: 'open', dir: path.join(wt, '.fgos'), cwd: wt }))?.faultClass, 'init-in-worktree');
});

test('admitStoreAccess: a verb that may run is admitted, and the warning line of a read from a linked worktree passes through', () => {
  const main = mainWithCommittedFgos();
  assert.deepEqual(admitStoreAccess({ verb: 'submit', store: 'require', mutates: true, dir: path.join(main, '.fgos'), cwd: main }), { warning: null });
  const wt = linkedWorktreeOf(main, 'adhoc');
  fs.rmSync(path.join(wt, '.fgos'), { recursive: true });
  const { warning } = admitStoreAccess({ verb: 'list', store: 'read', dir: path.join(wt, '.fgos'), cwd: wt });
  assert.match(warning, /^fgos: warning: .*this view may be empty/);
});

test('admitStoreAccess: an install with no Git door admits a verb that needs no store and refuses every other by name', () => {
  const plain = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-admit-no-door-')));
  fs.mkdirSync(path.join(plain, '.fgos'));
  const module = pathToFileURL(path.resolve('src/runner/worktree.mjs')).href;
  const ask = (request) => {
    const script = `import {admitStoreAccess} from ${JSON.stringify(module)};
      try { console.log(JSON.stringify(admitStoreAccess(${JSON.stringify({ ...request, dir: path.join(plain, '.fgos'), cwd: plain })}))); } catch (e) { console.log(JSON.stringify({ category: e.category, faultClass: e.faultClass, message: e.message })); }`;
    const env = { ...process.env, FGOS_ACTIVE_RELEASE_PATH: '', FGOS_ACTIVE_MANIFEST_PATH: '', FGOS_HOST_BIN: '' };
    return JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', script], { cwd: plain, encoding: 'utf8', env }));
  };
  assert.deepEqual(ask({ verb: 'help', store: 'none' }), { warning: null });
  for (const request of [{ verb: 'list', store: 'read' }, { verb: 'submit', store: 'require', mutates: true }]) {
    const refused = ask(request);
    assert.equal(refused.category, 'validation', request.verb);
    assert.equal(refused.faultClass, 'worktree-identity-unreadable', request.verb);
    assert.match(refused.message, /git-addon-/, request.verb);
  }
  fs.rmSync(plain, { recursive: true, force: true });
});

test('checkedOutBranch names the branch of an attached checkout and nothing for a detached one', () => {
  const main = initTempRepo();
  const attached = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-resync-wt-')), 'attached');
  execFileSync('git', ['worktree', 'add', '-q', '-b', 'feature/x', attached, 'HEAD'], { cwd: main });
  assert.equal(checkedOutBranch(attached), 'feature/x');
  const detached = linkedWorktreeOf(main, 'detached');
  assert.equal(checkedOutBranch(detached), null);
});

test('the Work creators and removers reach the Rust checkout door, keep their error class, and refuse a held worktree-admin as a lock-held HolderLockError', { skip: HOOK_TEST_SKIP }, async () => {
  const repoRoot = initTempRepo();
  const worktreeDir = mkWorktreeDir();

  // The creators and removers answer in the shapes their Work callers read.
  const made = createWorktree(repoRoot, 'wire-a', { worktreeDir });
  assert.deepEqual(Object.keys(made).sort(), ['branch', 'path', 'reused']);
  assert.equal(made.branch, 'fgw/wire-a');
  assert.equal(made.reused, false);
  assert.equal(checkedOutBranch(made.path), 'fgw/wire-a');
  assert.equal(removeWorktree(repoRoot, made.path), undefined);
  assert.equal(fs.existsSync(made.path), false);
  assert.equal(branchExists(repoRoot, 'fgw/wire-a'), true);

  const claim = createClaimWorktree(repoRoot, 'wire-b', { worktreeDir, startSha: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).trim() });
  assert.equal(claim.branch, 'fgw/wire-b');
  const reattached = createClaimWorktree(repoRoot, 'wire-b', { worktreeDir });
  assert.equal(reattached.reused, true);
  assert.equal(reattached.path, claim.path);
  assert.equal(removeWorktree(repoRoot, claim.path), undefined);

  const dispatched = createDispatchWorktree(repoRoot, 'wire-c', { worktreeDir });
  const logged = [];
  removeDispatchWorktree(repoRoot, dispatched.path, (line) => logged.push(line));
  assert.deepEqual(logged, []);
  removeDispatchWorktree(repoRoot, path.join(worktreeDir, 'never-existed'), (line) => logged.push(line));
  assert.match(logged.join('\n'), /^fgos-runner: worktree cleanup failed for ".*never-existed": /);

  const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).trim();
  const verify = createVerifyCheckout(repoRoot, head);
  assert.equal(typeof verify, 'string');
  assert.equal(execFileSync('git', ['rev-parse', 'HEAD'], { cwd: verify, encoding: 'utf8' }).trim(), head);
  removeWorktree(repoRoot, verify, { force: true });

  assert.deepEqual(listLeftovers(repoRoot, { includeTip: true }).map((row) => [row.branch, row.aheadCount, row.tip]), [
    ['fgw/wire-a', 0, head], ['fgw/wire-b', 0, head], ['fgw/wire-c', 0, head],
  ]);
  assert.deepEqual(reclaimOrphanedCheckout(repoRoot, 'fgw/wire-a'), { reclaimed: false, path: null });
  assert.equal(provisionDependencies(worktreeDir), false);

  // A refusal keeps the Node class and the fields its callers read.
  const notAWorktree = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-not-a-worktree-'));
  assert.throws(() => removeWorktree(repoRoot, notAWorktree), (err) => err instanceof WorktreeError && err.errorClass === 'worktree-fail' && err.category === 'worktree-fail' && err.worktreePath === notAWorktree);
  assert.throws(() => createVerifyCheckout(repoRoot, 'no-such-ref'), (err) => err instanceof WorktreeError && err.errorClass === 'worktree-fail' && /git worktree add --detach failed at no-such-ref/.test(err.message));

  // A worktree-admin another process holds is a lock-held HolderLockError, never a generic worktree failure.
  const holder = await holdLockInChild('worktree-admin', { fgosDir: path.join(repoRoot, '.fgos') });
  try {
    const refused = (fn) => assert.throws(fn, (err) => err instanceof HolderLockError && err.code === 'lock-held' && err.category === 'precondition' && err.lock === 'worktree-admin' && err.holders.includes(holder.child.pid) && err.timedOut === true && !(err instanceof WorktreeError));
    refused(() => createWorktree(repoRoot, 'wire-held', { worktreeDir, waitMs: 150 }));
    refused(() => createDispatchWorktree(repoRoot, 'wire-held', { worktreeDir, waitMs: 150 }));
    refused(() => createClaimWorktree(repoRoot, 'wire-held', { worktreeDir, waitMs: 150 }));
    assert.equal(branchExists(repoRoot, 'fgw/wire-held'), false);
    assert.deepEqual(fs.readdirSync(worktreeDir).filter((name) => name.startsWith('wire-held-')), []);
  } finally {
    holder.child.kill('SIGKILL');
    await holder.exited;
  }
});
