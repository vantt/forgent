// discover-pool.mjs (tsk-3go-1) — picks the next single item for an
// interactive discover-loop session to run `fgos discover` on. PURE: no
// fs, no `.fgos/` read, same discipline as frontier.mjs/impact.mjs. Never
// used by `frontier()` itself — that function only ever surfaces
// `stage: executing` items; this covers the earlier clarify pool
// `frontier()` deliberately excludes.
import { rankImpact } from './impact.mjs';
import { isDepsAndLineageReady } from './frontier.mjs';

// tsk-1w7 D10: `discovery`/`exploring` sit between `clarify` and
// `decompose`/`planning` now — both join the pool as ordinary
// clarify-shaped candidates (see compareClarifyOrder below) rather than a
// third bucket, since nothing yet exists to route `discovery`-stage items
// to a runner worker instead (that dispatch mechanism is a separate
// item's own scope, per plan.md's P5 row — `! rg -q "resolveDiscovery"
// src/runner/loop.mjs` is P5's own verify, not this item's).
// Forward-compatible, zero regression today: no item can reach
// `discovery`/`exploring` yet (nothing in this item's own footprint fires
// those new transitions either), so this only widens coverage for
// whenever something later does.
//
// tsk-lya D10/D11: the `decompose`/`planning` pool that used to ride
// along here (a legacy from before `tsk-2b0` split the bottom tier) now
// has its own dedicated pool module, `plan-pool.mjs` — this pool is
// clarify-shaped stages only from here on.
const CANDIDATE_STAGES = new Set(['clarify', 'discovery', 'exploring']);

function isCandidate(item, view) {
  return (
    item.status === 'todo' &&
    CANDIDATE_STAGES.has(item.stage) &&
    isDepsAndLineageReady(view, item.id)
  );
}

// Clarify-pool order: `blocks` DESCENDING, then `urgent` (true first), then
// declaration order (FIFO, via Array.prototype.sort's guaranteed stability
// — same technique frontier.mjs's compareReadyOrder relies on). `blocks`
// comes from `rankImpact` (dependency-graph-structural, no LLM needed) — a
// clarify-stage item has never been discovered yet, so `work.priority` is
// unset or a fixed constant and cannot drive ordering on its own.
function compareClarifyOrder(blocksById) {
  return (a, b) => {
    const blocksDiff = (blocksById.get(b.id) ?? 0) - (blocksById.get(a.id) ?? 0);
    if (blocksDiff !== 0) return blocksDiff;
    const urgentDiff = (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0);
    if (urgentDiff !== 0) return urgentDiff;
    return 0;
  };
}

/**
 * Pick the single next clarify-shaped (`clarify`/`discovery`/`exploring`,
 * tsk-1w7 D10) item for a discover-loop iteration to act on, or `null`
 * when none is `status: todo`. The returned `stage` is always the item's
 * OWN real stage — never a hardcoded 'clarify' literal — so a caller
 * (e.g. `/fgOS:discover-next`) sees the truth even once something starts
 * landing items on `discovery`/`exploring` for real.
 *
 * tsk-lya D10/D11: no longer also pools `decompose`/`planning` items —
 * `plan-pool.mjs`'s `pickNextPlanItem` covers that pool now, with its own
 * dedicated `plan-next`/`plan-loop` pair.
 */
export function pickNextDiscoverItem(view) {
  const work = view?.work ?? {};
  const clarify = [];
  for (const id of Object.keys(work)) {
    const item = work[id];
    if (!isCandidate(item, view)) continue;
    clarify.push(item);
  }

  if (clarify.length === 0) return null;

  const blocksById = new Map(rankImpact(view).map((row) => [row.id, row.blocks]));
  clarify.sort(compareClarifyOrder(blocksById));
  return { id: clarify[0].id, stage: clarify[0].stage };
}
