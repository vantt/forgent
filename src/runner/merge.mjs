// merge.mjs — the approval-gate merge engine (per pr-lifecycle D1-D5):
// mechanics that turn an approved proposal into a merged, verified `done`
// item — extracted from bin/fgos.mjs so the CLI stays a thin verb table,
// mirroring how worktree.mjs/goal-check.mjs were already extracted.
//
// SOURCE CLASSIFICATION (per plan action (2)): every proposed item is
// classified into exactly one diff source before review/approve act on it:
//   - "runner" : a live `fgw/<id>` branch exists (worktree.mjs's branchExists)
//   - "pull"   : no live branch, but the item carries headAtTake AND
//                headAtReturn (fgos take/return, cell pr-lifecycle-1)
//   - "legacy" : neither — a proposed item from before this feature existed,
//                or whose branch/markers are gone. Approve/review never
//                throw on this — every verb degrades honestly (must_haves).
//
// MERGE MECHANICS (spike-proven, .bee/spikes/pr-lifecycle, see
// docs/history/pr-lifecycle/reports/validation-s1-gate.md): `git merge
// --no-commit --no-ff <branch>` stages the merge without committing; a
// conflict is reported by a nonzero exit and undone with `git merge
// --abort`, restoring the tree byte-for-byte (spike "merge-abort-probe").
// When the merge stages cleanly, the item's OWN verify runs on the now-
// staged, still-uncommitted tree (goal-check.mjs, D3's "merge sạch" second
// clause) BEFORE any commit is made (spike "nocommit-probe"); a red verify
// is undone the exact same way, `git merge --abort` — main never holds a
// broken merge commit, on any exit path. Only "pull"/"legacy" items skip the
// merge step entirely: their code is already on main (D4), so approve only
// re-runs their verify directly against the current tree.
//
// This module never writes to `.fgos/` — every state transition (proposed
// -> done / -> blocked) stays in bin/fgos.mjs, the sole write door via
// src/state/store.mjs, exactly like worktree.mjs/goal-check.mjs never touch
// state.json either.
//
// TRUNK PARAMETERIZATION (per D3, fan-out-parallel): `reviewDiff`'s "runner"
// source diff trunk is caller-parameterizable via `opts.trunk` — fan-out's
// per-root branch tree (`fgw/<root>`) needs a leaf's diff computed against
// its parent branch instead of the repo's actual trunk. When `opts.trunk` is
// omitted, `detectTrunk` resolves the default (origin/HEAD's target, falling
// back to a local `main`/`master` branch) instead of a hardcoded `'main'` —
// this repo's own trunk is `main`, but nothing here assumes that literal
// name anymore. Wiring an actual caller to pass a non-default trunk is out
// of scope here (Epic 4's job); this only makes the primitive capable.

import { execFileSync } from 'node:child_process';
import { branchNameFor, branchExists, reclaimOrphanedCheckout } from './worktree.mjs';
import { runGoalCheck } from './goal-check.mjs';

/** Raised only for a genuinely unexpected git failure (e.g. `git merge
 * --abort` itself failing) — never for a conflict or a red verify, which are
 * defined outcomes returned normally (see mergeRunnerItem below). */
export class MergeError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'MergeError';
    this.errorClass = 'merge-fail';
    this.category = 'merge-fail';
    Object.assign(this, details);
  }
}

function git(repoRoot, args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8', shell: false });
}

/** Resolve `repoRoot`'s trunk branch name without assuming `'main'`: prefers
 * the remote `origin/HEAD` target (what the repo host itself calls its
 * default branch), then falls back to whichever of `main`/`master` exists
 * locally as a branch, then to the literal `'main'` when neither signal is
 * available (e.g. a brand-new repo with no commits yet on either name). */
export function detectTrunk(repoRoot) {
  try {
    const ref = git(repoRoot, ['symbolic-ref', '--short', 'refs/remotes/origin/HEAD']).trim();
    if (ref.startsWith('origin/')) {
      return ref.slice('origin/'.length);
    }
  } catch {
    // no origin remote, or origin/HEAD isn't set locally — fall through
  }

  for (const candidate of ['main', 'master']) {
    try {
      git(repoRoot, ['show-ref', '--verify', '--quiet', `refs/heads/${candidate}`]);
      return candidate;
    } catch {
      // candidate branch doesn't exist locally — try the next one
    }
  }

  return 'main';
}

/** Whether `repoRoot`'s working tree has no pending changes — checked before
 * a runner-item merge is attempted (a dirty main tree must never be mixed
 * into a merge attempt). */
export function isWorkingTreeClean(repoRoot) {
  return git(repoRoot, ['status', '--porcelain']).trim() === '';
}

/** Classify a proposed `item` into its diff/merge source (see module doc). */
export function classifySource(repoRoot, item) {
  if (branchExists(repoRoot, branchNameFor(item.id))) {
    return 'runner';
  }
  if (typeof item.headAtTake === 'string' && item.headAtTake && typeof item.headAtReturn === 'string' && item.headAtReturn) {
    return 'pull';
  }
  return 'legacy';
}

/**
 * Build the human-viewable diff for a proposed item's `review` (never
 * throws on a legacy item — it degrades to a warning, no diff). For a
 * "runner" item, the trunk compared against defaults to the repo's detected
 * trunk (`detectTrunk` — no longer a hardcoded `'main'`) but is caller-
 * parameterizable via `opts.trunk` (per D3, fan-out-parallel) — a leaf's
 * diff against its parent root branch instead of the trunk, without
 * changing the default behavior for every existing caller.
 *
 * Pull-door range (per plan's deferred-to-planning resolution): the range is
 * fixed at `headAtTake..headAtReturn`, so it never picks up commits landed
 * on main AFTER this item's own return — but it CAN contain commits from
 * another session's take/return interleaved inside this item's own window
 * (multi-session is a valid scenario, not an error). This is reported as an
 * honest warning (commit count in range) rather than silently attributing
 * every line in the diff to this one item.
 */
export function reviewDiff(repoRoot, item, opts = {}) {
  const { trunk = detectTrunk(repoRoot) } = opts;
  const source = classifySource(repoRoot, item);

  if (source === 'runner') {
    const branch = branchNameFor(item.id);
    let diff;
    try {
      diff = git(repoRoot, ['diff', `${trunk}...${branch}`]);
    } catch (err) {
      throw new MergeError(`computing diff for branch "${branch}" failed: ${err.message}`, { branch });
    }
    return { source, diff, warnings: [] };
  }

  if (source === 'pull') {
    const range = `${item.headAtTake}..${item.headAtReturn}`;
    let diff;
    let commitCount;
    try {
      diff = git(repoRoot, ['diff', range]);
      commitCount = parseInt(git(repoRoot, ['rev-list', '--count', range]).trim(), 10) || 0;
    } catch (err) {
      throw new MergeError(`computing pull-door diff for range "${range}" failed: ${err.message}`, { range });
    }
    const warnings = commitCount > 1
      ? [`range headAtTake..headAtReturn contains ${commitCount} commits — may include commits from another session's take/return interleaved with this one (multi-session is a valid scenario; honest degrade, not an error)`]
      : [];
    return { source, diff, warnings };
  }

  return {
    source: 'legacy',
    diff: null,
    warnings: ['no live diff source for this item — no fgw/<id> branch and no headAtTake/headAtReturn recorded (a legacy proposed item predating pr-lifecycle); review/approve/reject still work, just without a viewable diff'],
  };
}

/**
 * Attempt to merge a runner item's branch into `repoRoot`'s current checkout
 * (checked clean by the caller first). The git call itself is target-
 * agnostic — no trunk is hardcoded — so per D3 (fan-out-parallel) this
 * generalizes to whichever branch the caller has checked out: `main` for a
 * root->main merge, or `fgw/<root>` for a leaf->parent merge. Every path is
 * either "outcome: merged" (verify passed on the staged tree, merge
 * committed) or a defined non-throwing outcome — "conflict" or
 * "verify-fail" — with the merge already cleanly aborted, the checkout
 * untouched. Only a failure to even run `git merge --abort` itself throws
 * (a real bug).
 */
export async function mergeRunnerItem(repoRoot, item, { timeoutMs } = {}) {
  const branch = branchNameFor(item.id);

  try {
    git(repoRoot, ['merge', '--no-commit', '--no-ff', branch]);
  } catch (err) {
    try {
      git(repoRoot, ['merge', '--abort']);
    } catch (abortErr) {
      throw new MergeError(`merge of "${branch}" conflicted and "git merge --abort" itself failed: ${abortErr.message}`, { branch });
    }
    return { outcome: 'conflict', branch };
  }

  const check = await runGoalCheck(item, repoRoot, timeoutMs);
  if (!check.passed) {
    try {
      git(repoRoot, ['merge', '--abort']);
    } catch (abortErr) {
      throw new MergeError(`post-merge verify failed for "${branch}" and "git merge --abort" itself failed: ${abortErr.message}`, { branch });
    }
    return { outcome: 'verify-fail', branch, check };
  }

  try {
    git(repoRoot, ['commit', '--no-edit']);
  } catch (err) {
    throw new MergeError(`verify passed for "${branch}" but "git commit" failed: ${err.message}`, { branch });
  }
  return { outcome: 'merged', branch, check };
}

/**
 * Best-effort cleanup after a successful merge (per D5, additive to
 * worktree.mjs's own lifecycle): the worktree checkout for a runner item is
 * normally already torn down by the runner at propose-time (loop.mjs's
 * finally), so this only reclaims a stray leftover checkout if one somehow
 * still exists, then deletes the now-fully-merged branch. Never throws — a
 * cleanup failure must never mask the merge/done result that already
 * happened; failures are returned as warnings for the caller to surface.
 */
export function cleanupMergedBranch(repoRoot, branch) {
  const warnings = [];
  try {
    reclaimOrphanedCheckout(repoRoot, branch);
  } catch (err) {
    warnings.push(`worktree cleanup failed for "${branch}": ${err.message}`);
  }
  try {
    git(repoRoot, ['branch', '-d', branch]);
  } catch (err) {
    warnings.push(`branch delete failed for "${branch}" (left in place, harmless): ${err.message}`);
  }
  return { warnings };
}
