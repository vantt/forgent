// worktree.mjs — isolated git worktree/branch lifecycle for the runner (per
// D2/D4, reliability panel revision on phase-2-routing-7): every worker runs
// on its own worktree, checked out on branch `fgw/<id>`, so its result stays
// a proposal on a disposable branch (per D4) until a human/review approves
// it — this module never merges, pushes, or touches the main working tree.
//
// SAME-USER TRUST INVARIANT: like dispatch.mjs, this module assumes the
// repo it operates on is the user's own trusted checkout — it shells out to
// `git` with the repo root as `cwd`, and does not sandbox or restrict what
// the worker committed on its branch. Isolation here is "own branch, easy
// to discard," not a security boundary against a hostile worker.
//
// CWD DISCIPLINE (probe-learned, reliability panel): every `git` call in
// this module runs with `cwd: repoRoot` — NEVER from inside a worktree that
// is itself being removed. Running `git worktree remove` (or anything else)
// from inside the very worktree it targets makes the process's own cwd
// vanish mid-command; the fix is structural, not a retry: always operate
// from the stable repo root.
//
// RETRY-WITHOUT-SELF-COLLISION: `createWorktree` REUSES an existing
// `fgw/<id>` branch (checkout via `git worktree add <path> <branch>`, never
// `-b`) whenever that branch already exists, and always allocates a FRESH
// worktree directory (via `mkdtemp`) for the checkout. A retried dispatch of
// the same work item therefore never collides with its own previous attempt
// — same branch, new empty directory slot.
//
// BRANCH-TREE TOPOLOGY (fan-out-parallel, D3/D4/D17): a root's integration
// branch `fgw/<root>` is created EARLY as a ref only, via `createBranchRef`
// — no worktree/checkout, just `git branch <branch> <baseRef>`. Leaves of
// that root then fork their own `fgw/<leaf>` branch from the *tip of the
// root's branch* (D3 "leaf fork-from-tip-of-parent") by passing that tip as
// `opts.baseRef` to `createWorktree`, instead of forking from `main`/current
// HEAD. D17 revises the original D4 design: no worktree is ever long-lived
// here — only branches are durable; every checkout (leaf execution,
// leaf-into-parent merge, root-into-main merge) is ephemeral and rebuilt
// from its branch ref on demand.
//
// CRASH RECLAIM (phase-2-routing-10): a normal teardown always runs
// `removeWorktree` before a branch is ever reused, so under ordinary
// operation the branch is never checked out anywhere when `createWorktree`
// reuses it. But a genuine process kill (the runner itself SIGKILLed
// mid-item) skips every `finally` — the worker's commit lands, yet the
// worktree checkout is never torn down, so `fgw/<id>` stays checked out at
// that now-orphaned path. The next `createWorktree` call for the same id
// (e.g. the startup reap's own throwaway goal-check worktree) would
// otherwise hit git's own "already checked out at <path>" refusal.
// `reclaimOrphanedCheckout` runs first whenever the branch is being reused:
// it finds any existing checkout of the branch via `git worktree list
// --porcelain` and clears it — force-removing the directory if it still
// exists on disk, or pruning git's own bookkeeping if the directory is
// already gone — before the fresh worktree is added. The branch (and its
// commit) survives; only the stale checkout directory is discarded, exactly
// like an ordinary `removeWorktree` would have done had it run. Only a
// genuinely irreconcilable state surfaces as a hard `worktree-fail`.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

/** Raised for any git worktree/branch operation failure. `errorClass`
 * reuses the vocabulary declared in `recovery.mjs`'s `ERROR_CLASSES` (per
 * the cell's key_link) — always `'worktree-fail'` here. */
export class WorktreeError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'WorktreeError';
    this.errorClass = 'worktree-fail';
    // `.category` too (store.mjs's categoryOf contract, R4): any error that
    // sets `.category` participates without store.mjs needing to know about
    // this module specifically.
    this.category = 'worktree-fail';
    Object.assign(this, details);
  }
}

/** The branch name a work item's worktree always uses. */
export function branchNameFor(id) {
  return `fgw/${id}`;
}

function git(repoRoot, args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8', shell: false });
}

// Exported (pr-lifecycle-2): the approval-gate merge engine (merge.mjs)
// reuses this exact check to classify a proposed item as "runner" (a live
// `fgw/<id>` branch) vs "pull"/"legacy" (no branch) — one existence check,
// never a second implementation of "does this branch exist" elsewhere.
export function branchExists(repoRoot, branch) {
  try {
    execFileSync('git', ['rev-parse', '--verify', '--quiet', `refs/heads/${branch}`], {
      cwd: repoRoot,
      encoding: 'utf8',
      shell: false,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Parse `git worktree list --porcelain` output and return the checkout
 * path currently registered for `branch` (as `refs/heads/<branch>`), or
 * `null` if the branch is not checked out anywhere. Porcelain records are
 * blank-line-separated stanzas, each starting with a `worktree <path>`
 * line followed by a `branch refs/heads/<name>` line (or `detached`).
 */
function findCheckoutPath(porcelainOutput, branch) {
  const ref = `refs/heads/${branch}`;
  let currentPath = null;
  for (const line of porcelainOutput.split('\n')) {
    if (line.startsWith('worktree ')) {
      currentPath = line.slice('worktree '.length).trim();
    } else if (line.startsWith('branch ')) {
      if (line.slice('branch '.length).trim() === ref) return currentPath;
    } else if (line === '') {
      currentPath = null;
    }
  }
  return null;
}

/**
 * Reclaim `branch` from any existing checkout before it is reused (per
 * CRASH RECLAIM in the module doc). Idempotent: a branch not checked out
 * anywhere is a no-op. Returns `{ reclaimed, path }`.
 */
export function reclaimOrphanedCheckout(repoRoot, branch) {
  let listing;
  try {
    listing = git(repoRoot, ['worktree', 'list', '--porcelain']);
  } catch (err) {
    throw new WorktreeError(`listing worktrees failed while reclaiming "${branch}": ${err.message}`, { branch });
  }

  const orphanPath = findCheckoutPath(listing, branch);
  if (!orphanPath) return { reclaimed: false, path: null };

  if (fs.existsSync(orphanPath)) {
    try {
      git(repoRoot, ['worktree', 'remove', '--force', orphanPath]);
    } catch (err) {
      throw new WorktreeError(
        `reclaiming orphaned checkout of "${branch}" at "${orphanPath}" failed: ${err.message}`,
        { branch, orphanPath },
      );
    }
  } else {
    try {
      git(repoRoot, ['worktree', 'prune']);
    } catch (err) {
      throw new WorktreeError(
        `pruning stale worktree registration for "${branch}" (path already gone: "${orphanPath}") failed: ${err.message}`,
        { branch, orphanPath },
      );
    }
  }
  return { reclaimed: true, path: orphanPath };
}

/**
 * Create the integration branch `fgw/<id>` (D17: "nhánh tạo sớm, không cần
 * worktree") as a REF ONLY — no worktree/checkout is registered for it.
 * `opts.baseRef` (default `'main'`) is the ref the new branch forks from.
 * Idempotent: if `fgw/<id>` already exists, this is a no-op — it does NOT
 * move the branch to `baseRef`, mirroring the RETRY-WITHOUT-SELF-COLLISION
 * discipline above (a retried root-dispatch must not disturb a branch that
 * may already carry committed leaf work). Returns `{ branch, created }`,
 * where `created` is `false` when the branch already existed.
 */
export function createBranchRef(repoRoot, id, opts = {}) {
  const branch = branchNameFor(id);
  const baseRef = opts.baseRef ?? 'main';

  if (branchExists(repoRoot, branch)) {
    return { branch, created: false };
  }

  try {
    git(repoRoot, ['branch', branch, baseRef]);
  } catch (err) {
    throw new WorktreeError(`git branch failed creating ref "${branch}" from "${baseRef}": ${err.message}`, {
      branch,
      baseRef,
    });
  }

  return { branch, created: true };
}

/**
 * Create (or reuse, see module doc) an isolated worktree for work item `id`
 * inside `repoRoot`. Always allocates a fresh temp directory for the
 * checkout via `mkdtemp` (default base: `os.tmpdir()/fgos-worktrees`,
 * overridable via `opts.worktreeDir` — tests use this to stay inside a
 * disposable temp git repo, never the main repo). When the branch does not
 * already exist, `opts.baseRef` (D3 "leaf fork-from-tip-of-parent") forks
 * the new branch from that ref instead of the implicit current HEAD; it is
 * ignored on the reuse path (an existing branch is reused exactly as
 * before, regardless of `opts.baseRef`). Returns `{ path, branch, reused }`.
 */
export function createWorktree(repoRoot, id, opts = {}) {
  const branch = branchNameFor(id);
  const baseDir = opts.worktreeDir ?? path.join(os.tmpdir(), 'fgos-worktrees');
  fs.mkdirSync(baseDir, { recursive: true });
  const worktreePath = fs.mkdtempSync(path.join(baseDir, `${id}-`));

  const reused = branchExists(repoRoot, branch);
  if (reused) reclaimOrphanedCheckout(repoRoot, branch);
  try {
    if (reused) {
      git(repoRoot, ['worktree', 'add', worktreePath, branch]);
    } else if (opts.baseRef) {
      git(repoRoot, ['worktree', 'add', '-b', branch, worktreePath, opts.baseRef]);
    } else {
      git(repoRoot, ['worktree', 'add', '-b', branch, worktreePath]);
    }
  } catch (err) {
    try {
      fs.rmSync(worktreePath, { recursive: true, force: true });
    } catch {
      // best-effort cleanup of the empty dir mkdtemp created; the real
      // failure below is what the caller needs to see.
    }
    throw new WorktreeError(`git worktree add failed for branch "${branch}": ${err.message}`, {
      branch,
      worktreePath,
    });
  }

  return { path: worktreePath, branch, reused };
}

/**
 * Remove the worktree checkout at `worktreePath` (per CWD DISCIPLINE above:
 * always run from `repoRoot`, never from inside `worktreePath`). Does NOT
 * delete the branch itself — the branch is the durable D1-level proposal
 * artifact (per D4) and survives worktree teardown for human/review to
 * inspect or merge later.
 */
export function removeWorktree(repoRoot, worktreePath, opts = {}) {
  const args = ['worktree', 'remove', worktreePath];
  if (opts.force) args.push('--force');
  try {
    git(repoRoot, args);
  } catch (err) {
    throw new WorktreeError(`git worktree remove failed for "${worktreePath}": ${err.message}`, {
      worktreePath,
    });
  }
  try {
    git(repoRoot, ['worktree', 'prune']);
  } catch {
    // best-effort — a failed prune does not invalidate a successful remove.
  }
}

/**
 * List every `fgw/*` branch left in `repoRoot`, each with its `aheadCount`
 * (commits reachable from the branch but not from its merge-base with
 * `opts.base`, default `HEAD`). POLICY (caller's to enforce, documented
 * here since this is where the fact is computed): `aheadCount === 0` means
 * an orphan — a worktree that was created and torn down without ever
 * committing anything on it — safe for a caller's prune loop to delete
 * outright; `aheadCount > 0` means the branch carries a real proposal and
 * must be kept for human/review, never auto-deleted.
 */
export function listLeftovers(repoRoot, opts = {}) {
  const base = opts.base ?? 'HEAD';
  let refsOut;
  try {
    refsOut = git(repoRoot, ['for-each-ref', '--format=%(refname:short)', 'refs/heads/fgw/']);
  } catch (err) {
    throw new WorktreeError(`listing "fgw/" branches failed: ${err.message}`, {});
  }

  const branches = refsOut
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  return branches.map((branch) => {
    let aheadCount;
    try {
      const mergeBase = git(repoRoot, ['merge-base', base, branch]).trim();
      const countOut = git(repoRoot, ['rev-list', '--count', `${mergeBase}..${branch}`]);
      aheadCount = parseInt(countOut.trim(), 10) || 0;
    } catch (err) {
      throw new WorktreeError(`computing ahead-count for branch "${branch}" failed: ${err.message}`, {
        branch,
      });
    }
    return { branch, aheadCount };
  });
}
