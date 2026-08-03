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
import { resolveRoot } from '../runner/root-affinity.mjs';

/**
 * Rank `proposed` items by merge-readiness.
 *
 * `opts.drift` (tsk-2u0, docs/history/tsk-3bn-merge-conductor-harness-v2/):
 * an OPTIONAL pre-computed `driftStatus()` result (`{[rootId]: {needsSync,
 * ...}}`). This function stays PURE — it never calls `driftStatus` itself
 * (that module shells real git subprocesses, a different purity class,
 * per its own header comment) — a caller that wants `blockedOnSync`
 * populated computes drift separately and passes the result in. Omitting
 * `opts.drift` (every existing caller today) leaves `blockedOnSync` always
 * empty — a pure additive opt-in, zero behavior change for callers that
 * don't know about it yet.
 *
 * Returns `{ ready, waiting, conflicts, mergeSets, blockedOnSync,
 * mergeTier, supersededOut }`:
 *   - `ready` — ids of `proposed` items whose `deps`/`mergeAfter` are all
 *     RESOLVED, whose resolved root has no unresolved sync drift, and
 *     which are not part of any footprint conflict, ordered by
 *     `rankImpact` (highest blocking fan-out first, tie-broken by
 *     `goalTier` then id — `rankImpact`'s own order, not re-derived here).
 *     UNCHANGED shape/membership rule from before mergeSets existed for
 *     any caller that never opts into `opts.drift` — footprint-conflicted
 *     items were already excluded from `ready` before this cell, shared-
 *     root siblings stay IN `ready` (mergeSets is additive visibility on
 *     top, never a second exclusion).
 *   - `waiting` — ids of `proposed` items with at least one `deps` or
 *     `mergeAfter` target not yet RESOLVED — merge-ready in isolation, but
 *     blocked on merge ORDER. `mergeAfter` (D4/D5) extends this SAME gate
 *     `deps` already used, never a new bucket — it is read ONLY here,
 *     never by `frontier.mjs`'s start-eligibility.
 *   - `conflicts` — the same `{a, b, shared, suggestions}` shape
 *     `footprintOverlapAmong`/`footprintOverlap` already produce, computed
 *     over the dep-clear, sync-clear candidate set. Unchanged shape.
 *   - `mergeSets` — D2's replacement for "silently drop a conflicting pair
 *     from ready": `{items, order, reason}` entries, `reason:
 *     'footprint-overlap' | 'shared-root'` (`'deps-chain'` stays
 *     conceptually inside `waiting` per this cell's own locked
 *     assumption, plan.md). `footprint-overlap` sets are the connected
 *     components of `conflicts` (a chain of overlapping pairs becomes ONE
 *     set, not several) — items here are NOT in `ready` (same exclusion
 *     `conflicts` already caused). `shared-root` sets are 2+ `ready`
 *     candidates resolving to the same root — items here STAY in `ready`
 *     too (informational ordering, not a new exclusion). `order` is
 *     `rankImpact`'s own relative order within the set (D2's permissive
 *     default: auto-serialize in that order; only escalate if a
 *     serialized re-check itself still conflicts — the re-check itself is
 *     Layer 2's job, not this pure function's).
 *   - `blockedOnSync` — ids of otherwise-candidate items whose resolved
 *     root shows `needsSync: true` in the supplied `opts.drift` — always
 *     empty when `opts.drift` is omitted.
 *   - `mergeTier` — `{[id]: 'leaf-to-root' | 'root-to-main'}` for every
 *     `proposed` item, derived from `item.parent` alone (an item with a
 *     parent always merges into SOME `fgw/<root>`, never straight to
 *     `main`) — matches the design report's own §G table split. Named
 *     `mergeTier`, not the canonical reports' bare `tier` (D7): `work.tier`
 *     already exists as a different, unrelated field (the item's own
 *     cost/model-weight).
 *   - `supersededOut` — ids of otherwise-`ready` candidates carrying a
 *     `supersededBy` target that is RESOLVED, or itself present in this
 *     same call's ready-set (tsk-2ie D2, docs/history/
 *     tsk-2ie-duplicate-superseded-guard/ — a different D2 than mergeSets'
 *     own above, distinct decision doc). Excluded from `ready`, never
 *     placed in `waiting` (permanently superseded, not "eventually
 *     mergeable once a dep resolves" — a different semantic). Always empty
 *     for every item that never sets `supersededBy` — pure additive
 *     exclusion, same backward-compatible shape `blockedOnSync`/`mergeSets`
 *     already established.
 */
export function mergeReadiness(view, opts = {}) {
  const work = view?.work ?? {};
  const drift = opts.drift ?? {};
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
    const mergeAfter = Array.isArray(item.mergeAfter) ? item.mergeAfter : [];
    const mergeAfterClear = mergeAfter.every((target) => RESOLVED_STATUSES.has(work[target]?.status));
    if (depsClear && mergeAfterClear) {
      candidates.push(item);
    } else {
      waiting.push(item.id);
    }
  }

  const blockedOnSync = [];
  const syncClear = [];
  for (const item of candidates) {
    const root = resolveRoot(view, item.id);
    if (drift[root]?.needsSync) {
      blockedOnSync.push(item.id);
    } else {
      syncClear.push(item);
    }
  }

  const conflicts = footprintOverlapAmong(syncClear);
  const conflictedIds = new Set();
  for (const { a, b } of conflicts) {
    conflictedIds.add(a);
    conflictedIds.add(b);
  }

  const rankedIds = rankImpact(view).map((row) => row.id);
  const orderByRank = (ids) => rankedIds.filter((id) => ids.includes(id));

  const readyIdSet = new Set(
    syncClear.map((item) => item.id).filter((id) => !conflictedIds.has(id)),
  );

  // supersededOut (tsk-2ie D2, docs/history/tsk-2ie-duplicate-superseded-
  // guard/): exclude any readyIdSet member whose supersededBy target is
  // RESOLVED (RESOLVED_STATUSES, same gate deps/mergeAfter already reuse)
  // OR itself present in this SAME readyIdSet snapshot (about to merge this
  // same round) -- a single pass against the ORIGINAL readyIdSet, checked
  // before any deletion, so a mutual pair (A supersededBy B, B supersededBy
  // A) is excluded on both sides deterministically rather than depending on
  // iteration order. `duplicates` is read by nothing here (D4 --
  // informational only).
  const supersededOutIds = [];
  for (const id of readyIdSet) {
    const target = work[id]?.supersededBy;
    if (typeof target !== 'string') continue;
    if (RESOLVED_STATUSES.has(work[target]?.status) || readyIdSet.has(target)) {
      supersededOutIds.push(id);
    }
  }
  for (const id of supersededOutIds) {
    readyIdSet.delete(id);
  }
  const supersededOut = orderByRank(supersededOutIds);

  const ready = orderByRank([...readyIdSet]);

  const mergeSets = [];

  if (conflictedIds.size > 0) {
    // Connected components over `conflicts`' pairs (a chain of overlapping
    // pairs becomes ONE mergeSet, not several) — a minimal union-find,
    // scoped to this call, never persisted.
    const find = (parents, x) => {
      while (parents.get(x) !== x) x = parents.get(x);
      return x;
    };
    const parents = new Map();
    for (const id of conflictedIds) parents.set(id, id);
    for (const { a, b } of conflicts) {
      const ra = find(parents, a);
      const rb = find(parents, b);
      if (ra !== rb) parents.set(ra, rb);
    }
    const components = new Map();
    for (const id of conflictedIds) {
      const root = find(parents, id);
      if (!components.has(root)) components.set(root, []);
      components.get(root).push(id);
    }
    for (const ids of components.values()) {
      const order = orderByRank(ids);
      mergeSets.push({ items: order, order, reason: 'footprint-overlap' });
    }
  }

  const rootGroups = new Map();
  for (const id of readyIdSet) {
    const root = resolveRoot(view, id);
    if (!rootGroups.has(root)) rootGroups.set(root, []);
    rootGroups.get(root).push(id);
  }
  for (const ids of rootGroups.values()) {
    if (ids.length < 2) continue;
    const order = orderByRank(ids);
    mergeSets.push({ items: order, order, reason: 'shared-root' });
  }

  const mergeTier = {};
  for (const item of proposed) {
    mergeTier[item.id] = item.parent ? 'leaf-to-root' : 'root-to-main';
  }

  return { ready, waiting, conflicts, mergeSets, blockedOnSync, mergeTier, supersededOut };
}
