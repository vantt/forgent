// discover-pool.mjs (tsk-3go-1) — picks the next single item for an
// interactive discover-loop session to run `fgos discover`/`fgos decompose`
// on. PURE: no fs, no `.fgos/` read, same discipline as frontier.mjs/
// impact.mjs. Never used by `frontier()` itself — that function only ever
// surfaces `stage: executing` items; this covers the earlier
// clarify/decompose pool `frontier()` deliberately excludes.
import { rankImpact } from './impact.mjs';

// tsk-1w7 D10: `discovery`/`exploring` sit between `clarify` and
// `decompose` now — both join the pool as ordinary clarify-shaped
// candidates (see compareClarifyOrder below) rather than a third bucket,
// since nothing yet exists to route `discovery`-stage items to a runner
// worker instead (that dispatch mechanism is a separate item's own scope,
// per plan.md's P5 row — `! rg -q "resolveDiscovery" src/runner/loop.mjs`
// is P5's own verify, not this item's). Forward-compatible, zero regression
// today: no item can reach `discovery`/`exploring` yet (nothing in this
// item's own footprint fires those new transitions either), so this only
// widens coverage for whenever something later does.
const CLARIFY_SHAPED_STAGES = new Set(['clarify', 'discovery', 'exploring']);
const CANDIDATE_STAGES = new Set([...CLARIFY_SHAPED_STAGES, 'decompose']);

function isCandidate(item) {
  return item.status === 'todo' && CANDIDATE_STAGES.has(item.stage);
}

// Clarify-pool order: `blocks` DESCENDING, then `urgent` (true first), then
// declaration order (FIFO, via Array.prototype.sort's guaranteed stability
// — same technique frontier.mjs's compareReadyOrder relies on). `blocks`
// comes from `rankImpact` (dependency-graph-structural, no LLM needed) — a
// clarify-stage item has never been discovered yet, so `work.priority` is
// unset or a fixed constant (see decompose-pool order below for why that
// signal is meaningless here) and cannot drive ordering on its own.
function compareClarifyOrder(blocksById) {
  return (a, b) => {
    const blocksDiff = (blocksById.get(b.id) ?? 0) - (blocksById.get(a.id) ?? 0);
    if (blocksDiff !== 0) return blocksDiff;
    const urgentDiff = (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0);
    if (urgentDiff !== 0) return urgentDiff;
    return 0;
  };
}

// Decompose-pool order: `priority` ASCENDING, absent last, then FIFO — same
// shape as frontier.mjs's compareReadyOrder. Meaningful here (unlike the
// clarify pool) because every item reaching `stage: decompose` has already
// been through one real `discover` call, which always computes `priority`
// as a side effect regardless of the clear/unclear outcome.
function compareDecomposeOrder(a, b) {
  if (a.priority !== b.priority) {
    if (a.priority === undefined || a.priority === null) return 1;
    if (b.priority === undefined || b.priority === null) return -1;
    return a.priority - b.priority;
  }
  return 0;
}

/**
 * Pick the single next item for a discover-loop iteration to act on, or
 * `null` when no clarify-shaped (`clarify`/`discovery`/`exploring`, tsk-1w7
 * D10) or `decompose`-stage item is `status: todo`. Clarify-shaped
 * candidates always win over `decompose` ones when both pools are non-empty
 * (matches the original description's "prioritizing clarify first" —
 * ambiguity anywhere in that pre-decompose chain blocks everything
 * downstream for that item, including its own eventual decompose pass).
 * The returned `stage` is always the item's OWN real stage — never a
 * hardcoded 'clarify' literal — so a caller branching on it (e.g.
 * `/fgOS:discover-next`'s own ceiling logic) sees the truth even once
 * something starts landing items on `discovery`/`exploring` for real.
 */
export function pickNextDiscoverItem(view) {
  const work = view?.work ?? {};
  const clarify = [];
  const decompose = [];
  for (const id of Object.keys(work)) {
    const item = work[id];
    if (!isCandidate(item)) continue;
    if (CLARIFY_SHAPED_STAGES.has(item.stage)) clarify.push(item);
    else decompose.push(item);
  }

  if (clarify.length > 0) {
    const blocksById = new Map(rankImpact(view).map((row) => [row.id, row.blocks]));
    clarify.sort(compareClarifyOrder(blocksById));
    return { id: clarify[0].id, stage: clarify[0].stage };
  }

  if (decompose.length > 0) {
    decompose.sort(compareDecomposeOrder);
    return { id: decompose[0].id, stage: 'decompose' };
  }

  return null;
}
