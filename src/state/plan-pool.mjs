// plan-pool.mjs (tsk-lya D11) — picks the next single item for a
// plan-loop iteration to run `fgos plan` (formerly `fgos decompose`,
// tsk-403 D11) on. PURE: no fs, no `.fgos/` read, same discipline as
// cleanup-pool.mjs/retro-pool.mjs/discover-pool.mjs/frontier.mjs/impact.mjs.
//
// Extracted out of `discover-pool.mjs` (tsk-lya D10/D11): the planning
// pool used to ride along inside `pickNextDiscoverItem`'s own decompose
// branch, sharing one pool function with the unrelated clarify-shaped
// pool. Four sibling `<root>-next`/`<root>-loop` pairs (cleanup, discover,
// merge, retro) already get their own dedicated pool module each — this
// gives `planning` the same shape instead of continuing to piggyback on
// `discover-pool.mjs`.
import { isDepsAndLineageReady } from './frontier.mjs';

// tsk-403 D11/D18: `decompose` renamed to `planning` -- both stage names
// stay candidates, since `decompose` survives as a legacy, drain-only
// alias (workflow-stage-graphs.mjs) for items that reached it before the
// rename. Omitting `decompose` here would make this pool blind to those
// items forever; omitting `planning` would make it blind to every NEW
// item instead (nothing lands on literal `decompose` anymore).
const CANDIDATE_STAGES = new Set(['decompose', 'planning']);

function isCandidate(item, view) {
  return (
    item.status === 'todo' &&
    CANDIDATE_STAGES.has(item.stage) &&
    isDepsAndLineageReady(view, item.id)
  );
}

// Planning-pool order: `priority` ASCENDING, absent last, then FIFO — same
// shape as frontier.mjs's compareReadyOrder. Meaningful here because every
// item reaching stage `decompose`/`planning` has already been through one
// real `discover` call, which always computes `priority` as a side effect
// regardless of the clear/unclear outcome.
function comparePlanningOrder(a, b) {
  if (a.priority !== b.priority) {
    if (a.priority === undefined || a.priority === null) return 1;
    if (b.priority === undefined || b.priority === null) return -1;
    return a.priority - b.priority;
  }
  return 0;
}

/**
 * Pick the single next `decompose`/`planning`-stage item for a plan-loop
 * iteration to act on, or `null` when none qualify. The returned `stage`
 * is always the item's OWN real stage — never a hardcoded literal — so a
 * caller (e.g. `/fgOS:plan-next`) sees the truth for both the current
 * `planning` name and the legacy `decompose` drain-only alias (D18).
 */
export function pickNextPlanItem(view) {
  const work = view?.work ?? {};
  const candidates = [];
  for (const id of Object.keys(work)) {
    const item = work[id];
    if (!isCandidate(item, view)) continue;
    candidates.push(item);
  }

  if (candidates.length === 0) return null;

  candidates.sort(comparePlanningOrder);
  return { id: candidates[0].id, stage: candidates[0].stage };
}
