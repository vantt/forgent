// promote-preflight.mjs — read-only judgment: is it safe to retarget a
// work item's own branch onto another branch right now? Grounds
// `docs/history/promote-to-component/CONTEXT.md`'s D3 threshold (tsk-3gx-1)
// in real git state. NEVER mutates anything — no commit, no merge, no
// worktree created or removed. The actual retarget (a real merge landing a
// real commit) is `tsk-3gx-2`'s job, and only ever runs after this module
// returns `{ safe: true }` for a given member.

import { branchExists, branchNameFor, checkoutPathForBranch, inspectGit, isCheckoutDirty, resolveRefSha } from './worktree.mjs';
import { inspectPath } from '../util/git-paths.mjs';

/**
 * D3(ii): true when `branch` is checked out in some worktree of `repoRoot`
 * right now AND that checkout has real uncommitted changes. A branch that
 * is not checked out anywhere, or is checked out but clean, is not
 * "active" in D3's sense. Fails closed (active) on an unreadable worktree
 * listing — mirrors `isCheckoutDirty`'s own fail-closed stance.
 */
function checkoutActivity(repoRoot, branch) {
  let checkoutPath;
  try {
    checkoutPath = checkoutPathForBranch(repoRoot, branch);
  } catch (err) {
    return { active: true, detail: `could not list worktrees: ${err.message}` };
  }
  if (!checkoutPath) return { active: false, detail: null };
  if (isCheckoutDirty(repoRoot, checkoutPath)) {
    return { active: true, detail: `"${branch}" is checked out at "${checkoutPath}" with uncommitted changes` };
  }
  return { active: false, detail: null };
}

/**
 * D3(i): true when merging `branch` into `target` would conflict. Git
 * Inspect's `mergeTree` never touches the working tree, the index, or
 * `MERGE_HEAD`; it names the paths a real merge would leave conflicted.
 */
function mergeConflictRisk(repoRoot, branch, target) {
  const { conflictedPaths } = inspectGit(repoRoot).mergeTree({ target: resolveRefSha(repoRoot, target), source: resolveRefSha(repoRoot, branch) });
  const hasConflict = conflictedPaths.length > 0;
  return { hasConflict, detail: hasConflict ? `merging "${branch}" into "${target}" conflicts in: ${conflictedPaths.map(inspectPath).join(', ')}` : null };
}

/**
 * `docs/history/promote-to-component/CONTEXT.md` D3, applied read-only:
 * judges whether `memberId`'s own branch is safe to retarget onto
 * `targetId`'s branch right now. Bails (returns `safe: false`) on either
 * D3 condition — a real merge conflict, or the member branch looking
 * currently active elsewhere — exactly like D3 requires, before any git
 * mutation is ever attempted for that member.
 *
 * @returns {{safe: true} | {safe: false, reason: 'missing-branch'|'active-checkout'|'merge-conflict', detail: string}}
 */
export function preflightRetarget(repoRoot, memberId, targetId) {
  const memberBranch = branchNameFor(memberId);
  const targetBranch = branchNameFor(targetId);

  if (!branchExists(repoRoot, memberBranch)) {
    return { safe: false, reason: 'missing-branch', detail: `branch "${memberBranch}" does not exist` };
  }
  if (!branchExists(repoRoot, targetBranch)) {
    return { safe: false, reason: 'missing-branch', detail: `target branch "${targetBranch}" does not exist` };
  }

  const activity = checkoutActivity(repoRoot, memberBranch);
  if (activity.active) {
    return { safe: false, reason: 'active-checkout', detail: activity.detail };
  }

  const conflict = mergeConflictRisk(repoRoot, memberBranch, targetBranch);
  if (conflict.hasConflict) {
    return { safe: false, reason: 'merge-conflict', detail: conflict.detail };
  }

  return { safe: true };
}
