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
// — same branch, new empty directory slot — and only a genuinely
// irreconcilable state (e.g. the branch is checked out somewhere `git`
// refuses to share) surfaces as a hard `worktree-fail`.

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

function branchExists(repoRoot, branch) {
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
 * Create (or reuse, see module doc) an isolated worktree for work item `id`
 * inside `repoRoot`. Always allocates a fresh temp directory for the
 * checkout via `mkdtemp` (default base: `os.tmpdir()/fgos-worktrees`,
 * overridable via `opts.worktreeDir` — tests use this to stay inside a
 * disposable temp git repo, never the main repo). Returns
 * `{ path, branch, reused }`.
 */
export function createWorktree(repoRoot, id, opts = {}) {
  const branch = branchNameFor(id);
  const baseDir = opts.worktreeDir ?? path.join(os.tmpdir(), 'fgos-worktrees');
  fs.mkdirSync(baseDir, { recursive: true });
  const worktreePath = fs.mkdtempSync(path.join(baseDir, `${id}-`));

  const reused = branchExists(repoRoot, branch);
  try {
    if (reused) {
      git(repoRoot, ['worktree', 'add', worktreePath, branch]);
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
