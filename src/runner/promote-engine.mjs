// promote-engine.mjs — tsk-3gx-2: the mutating half of `promote-to-component`
// (docs/history/promote-to-component/CONTEXT.md/plan.md). Resolves or
// creates the shared integration branch (D1), then merges each member's own
// branch into it — reusing `sync-root`'s own battle-tested primitive
// (`mergeRunnerItem`/`withMergeEphemeralWorktree`) instead of a destructive
// rebase (plan.md's Approach). Gated per member by `promote-preflight.mjs`'s
// read-only D3 judgment; a member preflight already flagged unsafe is never
// even attempted.
//
// SCOPE BOUNDARY: this module never sets a member's `parent` field and
// never records a decision — those only happen after a REAL git success,
// which is `tsk-3gx-3`'s (the CLI action layer's) job, "chỉ khi git thành
// công thật mới set field parent" (the item's own description).

import { createBranchRef, withMergeEphemeralWorktree, detectTrunk, isMainWorktree } from './worktree.mjs';
import { mergeRunnerItem } from './merge.mjs';
import { preflightRetarget } from './promote-preflight.mjs';
import { withLockRetry } from './lock-wait.mjs';

/**
 * D1: resolve the shared integration branch for `rootId`. Reuses
 * `fgw/<rootId>` as-is if it already exists (D1's "promote an existing
 * member" path — that member's own branch IS the integration branch,
 * untouched here). Otherwise creates it fresh as a ref only, seeded from
 * `detectTrunk` (D1's "new item" path, uniformly — plan.md's Assumptions:
 * no special-cased "seed" member, every member including one that inspired
 * the grouping goes through the same `retargetMember` call below).
 *
 * @returns {{branch: string, created: boolean}}
 */
export function resolveIntegrationBranch(repoRoot, rootId) {
  return createBranchRef(repoRoot, rootId, { baseRef: detectTrunk(repoRoot) });
}

/**
 * Per-member engine restructure: merge `memberItem`'s own branch into
 * `rootId`'s integration branch. Runs `preflightRetarget` first (D3) and
 * never attempts a git mutation for a member it flags unsafe. On a real,
 * clean merge, returns `outcome: 'merged'` — `parent` is deliberately left
 * untouched; the caller (tsk-3gx-3) sets it only after seeing this outcome.
 *
 * Refuses to run from a linked worktree (mirrors `sync-root`'s own
 * `isMainWorktree` discipline) — this creates and tears down real ephemeral
 * worktrees under `repoRoot`, which only makes sense from the main
 * checkout.
 *
 * @returns {Promise<
 *   {id: string, outcome: 'skipped', reason: 'is-root'} |
 *   {id: string, outcome: 'bailed', reason: string, detail: string} |
 *   {id: string, outcome: 'merged'} |
 *   {id: string, outcome: 'blocked', reason: string, detail: string|null}
 * >}
 */
export async function retargetMember(repoRoot, memberItem, rootId, opts = {}) {
  if (!isMainWorktree(repoRoot)) {
    throw new Error(
      `retargetMember: refusing to run from "${repoRoot}" — this must run from the main checkout, which a linked worktree structurally is not.`,
    );
  }

  if (memberItem.id === rootId) {
    return { id: memberItem.id, outcome: 'skipped', reason: 'is-root' };
  }

  // preflightRetarget itself already checks both branches exist (D3's own
  // "missing-branch" reason covers the integration branch too — no need to
  // duplicate that check here).
  const preflight = preflightRetarget(repoRoot, memberItem.id, rootId);
  if (!preflight.safe) {
    return { id: memberItem.id, outcome: 'bailed', reason: preflight.reason, detail: preflight.detail };
  }

  const result = await withMergeEphemeralWorktree(repoRoot, rootId, (ephemeral) =>
    withLockRetry(
      () => mergeRunnerItem(ephemeral.path, memberItem, opts.timeoutMs ? { timeoutMs: opts.timeoutMs, lockRoot: repoRoot } : { lockRoot: repoRoot }),
      { waitMs: undefined },
    ),
  );

  if (result.outcome !== 'merged') {
    return {
      id: memberItem.id,
      outcome: 'blocked',
      reason: result.outcome,
      detail: result.check?.output ?? (result.paths ? `staged .fgos write: ${result.paths.join(', ')}` : null),
    };
  }
  return { id: memberItem.id, outcome: 'merged' };
}
