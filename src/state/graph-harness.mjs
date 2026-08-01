// graph-harness.mjs — merge-order ranking (tsk-4j9-2, docs/history/
// merge-standardization/). PURE: takes a work-state view (as returned by
// store.mjs's listWork/rebuildView) and returns which `proposed` items are
// actually ready to merge right now, in the order they should merge, plus
// which ones are waiting or conflicting. No fs, no Date.now(), no event
// append, no mutation — same read-only discipline as impact.mjs/
// graph-metrics.mjs.
//
// Composes three signals, each reused rather than reimplemented (CONTEXT.md
// D1/D3/D4-revised):
//   - dependency-wait gate: a `proposed` item whose own `deps` are not ALL
//     RESOLVED (frontier.mjs — delivered/retrospective/cleanup/done/wontfix)
//     yet waits — genuinely new, `approve` has no such check today.
//   - conflict detection: `footprintOverlapAmong` (extracted out of
//     `footprintOverlap`, D4-revised) over the dep-clear candidate set,
//     instead of `footprintOverlap`'s own frontier-only candidate set.
//   - impact ordering: `rankImpact`'s existing blocking-fan-out + goalTier
//     ordering (D3), filtered down to the conflict-free candidates rather
//     than re-implemented.
import { rankImpact } from './impact.mjs';
import { footprintOverlapAmong } from './graph-metrics.mjs';
import { RESOLVED_STATUSES } from './frontier.mjs';

/**
 * Rank `proposed` items by merge-readiness.
 *
 * Returns `{ ready, waiting, conflicts }`:
 *   - `ready` — ids of `proposed` items whose `deps` are all RESOLVED and
 *     which are not part of any footprint conflict, ordered by `rankImpact`
 *     (highest blocking fan-out first, tie-broken by `goalTier` then id —
 *     `rankImpact`'s own order, not re-derived here).
 *   - `waiting` — ids of `proposed` items with at least one dep not yet
 *     RESOLVED — merge-ready in isolation, but blocked on merge ORDER.
 *   - `conflicts` — the same `{a, b, shared, suggestions}` shape
 *     `footprintOverlapAmong`/`footprintOverlap` already produce, computed
 *     over the dep-clear candidate set. An item named in any conflict pair
 *     is excluded from `ready` (deprioritized, never silently merged out of
 *     order) — it is neither in `ready` nor `waiting`.
 */
export function mergeReadiness(view) {
  const work = view?.work ?? {};
  const proposed = Object.values(work).filter((item) => item.status === 'awaiting-approval');

  const waiting = [];
  const candidates = [];
  for (const item of proposed) {
    const deps = Array.isArray(item.deps) ? item.deps : [];
    // work-item-status-delivered-retrospective-cleanup D13: shares
    // frontier.mjs's RESOLVED_STATUSES instead of a literal 'done' check —
    // a dep merged (delivered) but not yet fully closed out (retrospective/
    // cleanup) no longer holds up merge-ordering.
    const depsClear = deps.every((dep) => RESOLVED_STATUSES.has(work[dep]?.status));
    if (depsClear) {
      candidates.push(item);
    } else {
      waiting.push(item.id);
    }
  }

  const conflicts = footprintOverlapAmong(candidates);
  const conflictedIds = new Set();
  for (const { a, b } of conflicts) {
    conflictedIds.add(a);
    conflictedIds.add(b);
  }

  const candidateIds = new Set(candidates.map((item) => item.id));
  const ready = rankImpact(view)
    .filter((row) => candidateIds.has(row.id) && !conflictedIds.has(row.id))
    .map((row) => row.id);

  return { ready, waiting, conflicts };
}
