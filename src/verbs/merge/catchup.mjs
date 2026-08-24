// catchup.mjs — use case behind `fgos catchup <id>`.
//
// Catch-up-by-merge (D6/D7/D11, fan-out-parallel): the unified mechanism
// that bounces a parked item — a root drift-parked at root->main (D7) or
// a leaf conflict-parked at leaf->parent (D11), same git mechanics
// either way per the real-conflict spike
// (.bee/spikes/fan-out-parallel/catchup-real-conflict-probe.sh) — by
// merging the current TARGET (main for a root/standalone item, the
// resolved parent's branch for a leaf) into the item's OWN branch,
// re-verifying, and either landing the merge (blocked -> awaiting-approval, D18's
// edge, mechanical/uncounted per D11) or aborting clean and leaving the
// item blocked for a human. Deliberately does NOT call mergeRunnerItem
// (merge.mjs) — that merges the item's branch INTO the caller's checkout,
// the opposite direction catchup needs, and its source ref is hardcoded
// to the item's own branch (main as a *source* cannot be expressed
// through it) — so the git sequence lives in `performCatchUp`
// (runner/merge.mjs) instead, mirroring the spike's proven shape (merge
// --no-commit --no-ff -> verify -> commit-or-abort, verify strictly before
// any commit).
import { listWork, moveWork, StoreError } from '../../state/store.mjs';
import { resolveRoot } from '../../state/frontier.mjs';
import { checkMergeStillResolves } from '../../state/cleanup-harness.mjs';
import { branchNameFor, branchExists } from '../../runner/worktree.mjs';
import { performCatchUp } from '../../runner/merge.mjs';

// Only a merge-related park is something this mechanism can address —
// any other blocked reason (e.g. anti-loop-max-visits,
// runner-crash-reclaim) needs a human's real take/return rework
// instead, never an automated catch-up. tsk-18a D1: a
// 'merge-failed-unclassified' park is actually the BEST fit for
// catchup among these four — the failure wasn't a real conflict, so
// simply re-attempting the merge (which is exactly what catchup
// does) may just succeed once whatever transient condition caused it
// has passed.
// tsk-53o: 'verify-timeout-post-merge' joins this set deliberately —
// a timed-out post-merge check is exactly the transient condition
// this comment already describes, and catchup (a retry) is the
// correct next step for it, not a manual rework.
// tsk-4hj D2: 'merge-blocked-other-item' joins this set the same way
// 'merge-failed-unclassified' did — the block is a DIFFERENT item's
// still-in-progress merge, not this item's own conflict, so a retry
// once that other merge finishes or gets aborted is the natural
// recovery, not a manual rework.
// tsk-2qp: 'lock-lost-mid-merge' joins this set — the lock was lost mid-merge
// due to a lapsed heartbeat or a reclaimed lock, so a retry via catchup
// once the target/lock is free is the natural recovery.
const CATCHUP_REASONS = new Set(['merge-conflict', 'verify-fail-post-merge', 'verify-timeout-post-merge', 'integration-drift', 'merge-failed-unclassified', 'merge-blocked-other-item', 'lock-lost-mid-merge']);

/**
 * @param {{dir: string, repoRoot: string}} ctx - `repoRoot` is always
 *   `path.dirname(dir)` for this verb, never raw `process.cwd()` (tsk-5vl);
 *   the adapter owns that per-verb policy.
 * @param {{id: string, timeoutMs: number|null}} options
 */
export async function catchupUseCase({ dir, repoRoot }, { id, timeoutMs }) {
  const view = listWork(dir);
  const item = view.work[id];
  if (!item) {
    throw new StoreError('validation', `catchup: work "${id}" not found.`);
  }
  if (item.status !== 'blocked') {
    throw new StoreError('precondition', `catchup: work "${id}" is "${item.status}", not "blocked" — nothing to catch up.`);
  }

  // tsk-2q8: a `cleanup -> blocked` park caused specifically by
  // checkMergeStillResolves (e.g. a root branch rebased-not-pruned) is
  // ALSO catchup-eligible — re-merging the target into this item's own
  // branch and re-verifying is exactly what recovers it (a genuinely
  // stale commit becomes a fresh, real descendant of the target). Its
  // `reason` is never one of the short enum values above though — the
  // cleanup verb records the FULL human-readable diagnostic text there
  // instead (possibly joined with an UNRELATED failure like missing
  // retrospective content), so it can never match CATCHUP_REASONS by
  // content, and a plain "was this parked from cleanup" check would be too
  // broad — merging fixes a stale-ancestry gap, not a
  // missing-retrospective-content one, so it must not be trusted to
  // resolve that second kind of park. Re-run the exact check live instead
  // of trusting stored text: if `checkMergeStillResolves` fails for this
  // item right now, that IS the fact catchup's own merge-and-reverify
  // would flip, independent of whatever else `reason` says.
  const mergeStillFails = !checkMergeStillResolves(repoRoot, item, { view, id }).ok;
  if (!CATCHUP_REASONS.has(item.reason) && !mergeStillFails) {
    throw new StoreError(
      'validation',
      `catchup: work "${id}" is blocked for reason "${item.reason ?? '(none)'}" — catchup only resolves a merge-related park (merge-conflict/verify-fail-post-merge/verify-timeout-post-merge/integration-drift/merge-failed-unclassified) or a cleanup-harness merge-ancestry park; use take/return for a manual rework instead.`,
    );
  }

  const ownBranch = branchNameFor(id);
  // Guards against a human hand-forcing an inapplicable blocked state
  // (e.g. `fgos move <id> --to blocked --reason integration-drift` on a
  // branchless pull/legacy item) from silently creating a bogus branch
  // instead of failing loudly — checked before any git operation runs.
  if (!branchExists(repoRoot, ownBranch)) {
    throw new StoreError(
      'validation',
      `catchup: work "${id}" has no live branch "${ownBranch}" — this blocked state was not produced by a merge-related park; refusing rather than creating a bogus branch.`,
    );
  }

  // Leaf (resolved root is a DIFFERENT item) targets its parent's
  // integration branch; a root/standalone item (resolved root is
  // itself) targets main — the exact D3/D11 split `approve` already
  // uses (resolveRoot).
  const rootId = resolveRoot(view, id);
  const target = rootId !== id ? branchNameFor(rootId) : 'main';

  // tsk-4ax: the git merge/verify/commit MECHANICS are shared with
  // approve's own inbound pre-check (performCatchUp, runner/merge.mjs) —
  // this use case owns only what's specific to the manual-recovery entry
  // point: the blocked/CATCHUP_REASONS precondition above, and the
  // moveWork/friction bookkeeping below.
  const result = await performCatchUp(repoRoot, id, item, target, timeoutMs);
  if (result.outcome === 'already-caught-up' || result.outcome === 'merged') {
    const { event } = moveWork(dir, { id, to: 'awaiting-approval', expectedStatus: 'blocked', role: 'runner', branchHeadAtReturn: result.catchupHead });
    return { id, outcome: result.outcome, from: 'blocked', to: 'awaiting-approval', target, branch: ownBranch, seq: event.seq, output: result.output };
  }
  if (result.outcome === 'verify-fail') {
    return { id, outcome: 'verify-fail', timedOut: result.timedOut, target, branch: ownBranch, exitStatus: result.exitStatus, output: result.output };
  }
  // 'conflict'
  return { id, outcome: 'conflict', target, branch: ownBranch, conflictedFiles: result.conflictedFiles };
}
