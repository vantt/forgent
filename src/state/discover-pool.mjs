// discover-pool.mjs (tsk-3go-1) — picks the next single item for an
// interactive discover-loop session to run `fgos discover` on. PURE: no
// fs, no `.fgos/` read, same discipline as frontier.mjs/impact.mjs. Never
// used by `frontier()` itself — that function only ever surfaces
// `stage: executing` items; this covers the earlier clarify pool
// `frontier()` deliberately excludes.
import { rankImpact } from './impact.mjs';
import { isDepsAndLineageReady } from './frontier.mjs';
import { getDomain, discoverableStages } from './workflow-stage-graphs.mjs';

// tsk-1w7 D10: `discovery`/`exploring` sit between `clarify` and
// `decompose`/`planning` now — both join the pool as ordinary
// clarify-shaped candidates (see compareClarifyOrder below) rather than a
// third bucket, since nothing yet exists to route `discovery`-stage items
// to a runner worker instead (that dispatch mechanism is a separate
// item's own scope, per plan.md's P5 row — `! rg -q "resolveDiscovery"
// src/runner/loop.mjs` is P5's own verify, not this item's).
//
// tsk-lya D10/D11: the `decompose`/`planning` pool that used to ride
// along here (a legacy from before `tsk-2b0` split the bottom tier) now
// has its own dedicated pool module, `plan-pool.mjs` — this pool is
// clarify-shaped stages only from here on.
//
// tsk-64h: which stages count as clarify-shaped is now ASKED, per item,
// of the same `discoverableStages` the `fgos discover` verb's own
// precondition gate uses (`bin/fgos.mjs`) — never a literal copy kept in
// step by hand. The copy that used to live here (`new Set(['clarify',
// 'discovery', 'exploring'])`) had already drifted: `coding` retired
// `clarify` as a stage entirely (tsk-qod D1/D2), so this pool went on
// admitting items the verb then refused with a StoreError — and that
// error's own advice pointed at `fgos plan`, which `plan-pool.mjs`
// refuses them too. Three items sat in exactly that trap.
//
// Resolved PER ITEM, not once per view: the pool is handed a view, which
// may hold items of several domains at once, and each domain declares its
// own discoverable stages (`coding` -> discovery/exploring; a domain that
// still has a real Clarify-mapped stage -> that stage). `onUnrecognized`
// is a no-op here for the same reason `bin/fgos.mjs`'s own gate silences
// it: a pure picker must not print, and an unrecognized domain already
// folds to the default one.
function isCandidateStage(item) {
  const domain = getDomain(item.domain, { onUnrecognized: () => {} });
  return discoverableStages(domain).includes(item.stage);
}

// work-item-backlog-status Piece 3 (tsk-1av): a clarify-shaped stage
// accepts `backlog` alongside `todo`, so `fgos-clarifying` can sharpen an
// idea's own description while it still sits at `backlog` — the whole
// point of a status meaning "not yet committed to work" is that thinking
// about it is allowed before committing to it.
//
// Safe to widen HERE, and only here, because this pool is clarify-shaped
// stages only (tsk-lya D10/D11, see the header above). The
// `decompose`/`planning` pool that used to share this function moved to
// `plan-pool.mjs`, whose own `isCandidate` keeps the strict
// `status === 'todo'` check — that pool feeds real dispatch, so a
// not-yet-committed idea must never reach it.
const CANDIDATE_STATUSES = new Set(['todo', 'backlog']);

function isCandidate(item, view) {
  return (
    CANDIDATE_STATUSES.has(item.status) &&
    isCandidateStage(item) &&
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
 * Pick the single next clarify-shaped item for a discover-loop iteration
 * to act on, or `null` when none is `status: todo`/`backlog` (tsk-1av).
 * Clarify-shaped means
 * whatever that item's OWN domain declares discoverable (tsk-64h; for
 * `coding` today: `discovery`/`exploring`) — so this pool can never offer
 * a caller an item the `discover` verb would then refuse. The returned
 * `stage` is likewise always the item's own real stage, never a hardcoded
 * literal.
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
