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
import { isResolvedStatus, resolveRoot } from './frontier.mjs';
import { effectiveStage, getDomain } from './workflow-stage-graphs.mjs';

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
 *   - `strandedByResolvedRoot` (tsk-4s0, piece 2 of tsk-4qu's leaf-merge-
 *     into-resolved-root fix) — ids of otherwise-candidate items whose
 *     resolved root (`resolveRoot`) is already RESOLVED
 *     (`isResolvedStatus` — delivered/retrospective/cleanup/done/wontfix).
 *     `approve` now refuses these (`bin/fgos.mjs`'s resolved-root guard),
 *     so they are pulled out of `ready` here too rather than reported as
 *     plainly mergeable — a DIFFERENT hazard from `blockedOnSync` (that
 *     bucket means "the root branch itself needs syncing," not "the root
 *     is closed out and nothing will ever sync it"), kept as its own
 *     bucket rather than folded into `blockedOnSync` so that name's
 *     existing cross-language contract (`herdr-plugin/src/fgos.rs`
 *     deserializes it by name) keeps its current meaning unchanged.
 *     Checked independently of `opts.drift` (item status, not a git-shelled
 *     drift computation) — never empty just because `opts.drift` was
 *     omitted, unlike `blockedOnSync`.
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
    // frontier.mjs's isResolvedStatus (per decision record 0027) instead of
    // a literal 'done' check — a dep merged (delivered) but not yet fully
    // closed out (retrospective/cleanup) no longer holds up merge-ordering.
    const depsClear = deps.every((dep) => isResolvedStatus(work[dep]));
    const mergeAfter = Array.isArray(item.mergeAfter) ? item.mergeAfter : [];
    const mergeAfterClear = mergeAfter.every((target) => isResolvedStatus(work[target]));
    if (depsClear && mergeAfterClear) {
      candidates.push(item);
    } else {
      waiting.push(item.id);
    }
  }

  const blockedOnSync = [];
  const strandedByResolvedRoot = [];
  const syncClear = [];
  for (const item of candidates) {
    const root = resolveRoot(view, item.id);
    if (drift[root]?.needsSync) {
      blockedOnSync.push(item.id);
    } else if (root !== item.id && isResolvedStatus(work[root])) {
      strandedByResolvedRoot.push(item.id);
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
  // RESOLVED (isResolvedStatus, same gate deps/mergeAfter already reuse)
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
    if (isResolvedStatus(work[target]) || readyIdSet.has(target)) {
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

  // tsk-4zj D6: `ready`/`waiting`/`blockedOnSync`/`supersededOut`/
  // `mergeSets`/`mergeTier` above are all id-referencing, never full item
  // objects (unlike this function's own internal `candidates`/`syncClear`
  // locals, which never reach the return) — so, same as `graphMetrics`'s
  // own `stageByItem` (graph-metrics.mjs), this adds one flat side-map
  // rather than changing any existing id-array shape to an object-array.
  // Covers every id in `work`, not just ids already surfaced in one of the
  // buckets above, so a reader never has to guess which sub-shape an id
  // came from before looking its stage up here.
  const stageByItem = Object.fromEntries(
    Object.keys(work).map((id) => [id, effectiveStage(work[id], getDomain(work[id].domain))]),
  );

  return {
    ready,
    waiting,
    conflicts,
    mergeSets,
    // tsk-173: rank-ordered same as ready/mergeSets/supersededOut above --
    // merge next's auto-sync-root branch (bin/fgos.mjs) picks blockedOnSync[0]
    // as "the top-ranked blocked root", a claim only meaningful once this
    // bucket is ordered like every other one already is.
    blockedOnSync: orderByRank(blockedOnSync),
    strandedByResolvedRoot: orderByRank(strandedByResolvedRoot),
    mergeTier,
    supersededOut,
    stageByItem,
  };
}

/**
 * Group `mergeReadiness`'s own buckets into a nested merge tree (tsk-2x9k,
 * docs/history/merge-list-tree-bottleneck-priority/). PURE, same read-only
 * discipline as `mergeReadiness` itself — takes the SAME view plus the
 * `mergeReadiness` result already computed for it, never recomputes
 * `footprintOverlapAmong`/the dep-wait gate internally.
 *
 * D1/D4 (docs/history/merge-list-tree-bottleneck-priority/CONTEXT.md):
 * `mergeReadiness`'s own return shape is NEVER touched by this function —
 * a separate, additive view over the same computed buckets, meant to be
 * composed by a caller (`bin/fgos.mjs`'s `merge list` sub-verb) as
 * `{ ...mergeReadiness(...), tree: mergeTree(...) }`, never spread INTO
 * `mergeReadiness`'s own object. Four existing tests in this module's own
 * test file do an exact `assert.deepEqual` against `mergeReadiness`'s full
 * return shape — adding a field there directly would break them.
 *
 * D2: every id `mergeReadiness` surfaces in ANY bucket (`ready`, `waiting`,
 * `blockedOnSync`, `strandedByResolvedRoot` (tsk-4s0), every id inside a
 * `footprint-overlap` `mergeSets` entry, `supersededOut`) gets a node here
 * — never just `ready`. A `shared-root` `mergeSets` entry is informational
 * only (its items are already in `ready`) and adds no separate status.
 *
 * D3: every nesting level — the top-level root set AND every parent's own
 * children group — is sorted by the SAME order `mergeReadiness` already
 * uses for `ready` (`rankImpact`'s `blocks` descending, tie-broken by
 * `goalTier` then id), never a bespoke per-level sort.
 *
 * D7: a blocked/conflicted node carries a `reason` string naming the
 * specific cause and counterpart item, not just a bare status word.
 *
 * Nesting needs more than the direct candidate ids: a leaf's own immediate
 * parent is very often NOT itself a merge candidate — a decomposed root/
 * intermediate item never merges itself (`cleanup-harness.mjs`'s own
 * "decompose-into-children never itself merges"), so it never appears in
 * any of `mergeReadiness`'s buckets — but it still has to exist as a node
 * for its children to nest under, or the tree cannot show "child merges
 * into parent" at all. This function walks each candidate's `parent`
 * chain and materializes those real ancestors as plain container nodes
 * (`status: 'container'`, no `reason`) — real items, just not themselves
 * proposed for merge right now. An ancestor id not itself present in
 * `view.work` (a dangling/stale `parent` reference) stops the walk there
 * and the child surfaces at the top level instead of being silently
 * dropped — the same "never hide" principle D2 already established.
 */
export function mergeTree(view, readiness, opts = {}) {
  const work = view?.work ?? {};
  const drift = opts.drift ?? {};

  const statusById = new Map();
  for (const id of readiness.waiting) statusById.set(id, { status: 'waiting' });
  for (const id of readiness.blockedOnSync) {
    const root = resolveRoot(view, id);
    const d = drift[root];
    statusById.set(id, {
      status: 'blocked-sync',
      reason: d
        ? `root cần sync: ${d.branch} lệch ${d.aheadOfTarget} ahead / ${d.behindTarget} behind ${d.target}`
        : 'root cần sync',
    });
  }
  for (const set of readiness.mergeSets) {
    if (set.reason !== 'footprint-overlap') continue;
    for (const id of set.items) {
      const conflict = readiness.conflicts.find((c) => c.a === id || c.b === id);
      const counterpart = conflict ? (conflict.a === id ? conflict.b : conflict.a) : null;
      const sharedFiles = conflict?.shared?.length ? conflict.shared.join(', ') : null;
      statusById.set(id, {
        status: 'conflicted',
        reason: counterpart
          ? `conflict với ${counterpart}${sharedFiles ? ` qua ${sharedFiles}` : ''}`
          : 'footprint conflict',
      });
    }
  }
  for (const id of readiness.supersededOut) {
    const target = work[id]?.supersededBy;
    statusById.set(id, {
      status: 'superseded',
      reason: target ? `superseded bởi ${target}` : 'superseded',
    });
  }
  // tsk-4s0 (piece 2 of tsk-4qu's leaf-merge-into-resolved-root fix): a
  // strandedByResolvedRoot id would otherwise get NO node at all here (it
  // is deliberately excluded from `ready` and was never in any other
  // bucket) — violates D2's own "never hide" invariant. Same shape as
  // blockedOnSync just above: a distinct status naming the real cause.
  for (const id of readiness.strandedByResolvedRoot) {
    const root = resolveRoot(view, id);
    const rootItem = work[root];
    statusById.set(id, {
      status: 'stranded-resolved-root',
      reason: rootItem
        ? `root ${root} đã ${rootItem.status} — sẽ không được sync lên main`
        : 'root đã resolved',
    });
  }
  // `ready` last -- mergeReadiness's own membership rule already keeps
  // `ready` disjoint from every exclusion bucket above, so plain
  // assignment here never overwrites a real blocked/conflicted status.
  for (const id of readiness.ready) statusById.set(id, { status: 'ready' });

  const nodeIds = new Set(statusById.keys());
  for (const id of statusById.keys()) {
    let current = work[id];
    const seen = new Set([id]); // cycle guard against a malformed parent loop
    while (current?.parent && work[current.parent] && !seen.has(current.parent)) {
      nodeIds.add(current.parent);
      seen.add(current.parent);
      current = work[current.parent];
    }
  }

  // tsk-4s0: `{ includeDone: true }` (unlike mergeReadiness's own
  // `orderByRank` above, which only ever ranks already-open `candidates`)
  // -- a RESOLVED item can now legitimately need a container node here
  // (an open leaf nesting under its own resolved root is exactly the
  // strandedByResolvedRoot case just above), and `rankImpact`'s default
  // `openIds`-only ranking would silently drop that container id out of
  // `orderByRank`'s filter, hiding every child nested under it -- the
  // same D2 "never hide" invariant this whole function exists to uphold.
  const rankedIds = rankImpact(view, { includeDone: true }).map((row) => row.id);
  const orderByRank = (ids) => rankedIds.filter((id) => ids.includes(id));

  const childrenByParent = new Map();
  const topLevelIds = [];
  for (const id of nodeIds) {
    const parentId = work[id]?.parent;
    if (parentId && work[parentId] && nodeIds.has(parentId)) {
      if (!childrenByParent.has(parentId)) childrenByParent.set(parentId, []);
      childrenByParent.get(parentId).push(id);
    } else {
      topLevelIds.push(id);
    }
  }

  const buildNode = (id) => {
    const info = statusById.get(id) ?? { status: 'container' };
    const kids = childrenByParent.get(id) ?? [];
    return {
      id,
      title: work[id]?.title ?? id,
      ...info,
      children: orderByRank(kids).map(buildNode),
    };
  };

  return orderByRank(topLevelIds).map(buildNode);
}

/**
 * The still-open items that merge into the SAME target ref as `landedId` —
 * the only branches a land can possibly have put behind. An item's target is
 * `fgw/<parent>` when it has a parent and the trunk otherwise, so "same
 * target" is exactly "same parent", with two parentless items both aimed at
 * the trunk.
 *
 * Two exclusions, both because the excluded item has nothing to compare:
 * a RESOLVED item (`isResolvedStatus`) has already merged or been dropped,
 * and a pre-claim (`todo`) item's `fgw/<id>` branch is created back at
 * decompose carrying no commit of its own — its changed-file set is empty,
 * so running a diff for it buys a guaranteed-empty answer. Refreshing that
 * decompose→pick gap is `pick`-time refresh's job, not this detection's.
 */
export function openLeavesSharingTarget(view, landedId) {
  const work = view?.work ?? {};
  const landed = work[landedId];
  if (!landed) return [];
  const target = landed.parent ?? null;
  return Object.values(work)
    .filter((item) => item.id !== landedId
      && (item.parent ?? null) === target
      && item.status !== 'todo'
      && !isResolvedStatus(item))
    .map((item) => item.id)
    .sort();
}

/**
 * D4's three-way split over REAL changed-file sets — never declared
 * `footprint`, which an item fills in by hand and can leave stale or empty
 * (`footprintOverlapAmong` above compares exactly that weaker signal; here
 * git has already given the ground truth, so nothing needs to stand in for
 * it).
 *
 * A leaf sharing no path with what just landed produces NOTHING — no
 * notification, no mark. That silence is the point: a root landing 13
 * children sequentially would otherwise pay ~78 catchup+verify rounds, and
 * most of them discover nothing collided. A leaf that does share a path
 * either goes to the session that owns it — cheapest to fix while that
 * context is still in someone's head, and the owner is the only party
 * allowed to touch that branch — or, with no session behind it, is marked
 * stale for the lazy catchup it will get when it reaches the merge queue.
 *
 * `leaves` entries are `{id, files, sessionIds}`; the caller supplies the
 * real diffs and the real session registry, keeping this half pure.
 */
export function classifyPostLandDrift({ landedFiles = [], leaves = [] } = {}) {
  const landed = new Set(landedFiles);
  const notify = [];
  const stale = [];
  for (const leaf of leaves) {
    const shared = (leaf.files ?? []).filter((file) => landed.has(file)).sort();
    if (shared.length === 0) continue;
    const sessionIds = leaf.sessionIds ?? [];
    if (sessionIds.length > 0) {
      notify.push({ id: leaf.id, shared, sessionIds });
    } else {
      stale.push({ id: leaf.id, shared });
    }
  }
  return { notify, stale };
}
