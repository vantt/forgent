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
import { getDomain, stepForPhase } from './domain-registry.mjs';

// A Work item is a planning candidate when its effective step is the plan-phase
// step of its own domain's Workflow. The legacy step name `decompose` is mapped
// onto that step by replay (the workflow's `aliases`), so older records are not
// invisible to this pool.
function isCandidate(item, view) {
  const domain = getDomain(item.domain, { onUnrecognized: () => {} });
  const planStep = stepForPhase(domain, 'plan', item.kind);
  return (
    item.status === 'todo' &&
    planStep !== undefined &&
    item.workflowStep === planStep &&
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
 * Pick the single next plan-phase item for a plan-loop iteration to act on, or
 * `null` when none qualify. The returned `workflowStep` is always the item's OWN
 * real step — never a hardcoded literal.
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
  return { id: candidates[0].id, workflowStep: candidates[0].workflowStep };
}
