// graph-metrics.mjs — read-only MECHANICAL graph metrics AND work-item
// advisories over a work view (work-graph-intelligence S5+, the "compute-
// brain"; S8 adds the stale-doing advisory, which is status/time based rather
// than graph-topology based but shares the same read-only, suggest-never-act
// stance). PURE: no fs, no writes,
// no model/LLM call — every metric is folded mechanically from the view's
// unified typed-edge graph (dep-graph.mjs `buildUnifiedEdges`). Stance R42:
// this module NEVER writes and never decides; it computes graph FACTS that a
// picker (P7) or planner (P8) later reads. It is a Domain functional core —
// it imports only same-layer Domain helpers (dep-graph, frontier), never an
// Infra/Entry module, and it takes an already-folded `view` (it never folds
// the log itself; the store facade hands it the view).

import { buildUnifiedEdges } from './dep-graph.mjs';
import { FRONTIER_ORDER_VERSION, frontier, isResolvedStatus } from './frontier.mjs';
import { viewRevision } from './replay.mjs';
import { effectiveStage, getDomain } from './workflow-stage-graphs.mjs';
import { normalizePath } from '../util/normalize-path.mjs';

/**
 * Connected components of the UNDIRECTED unified graph (blocks + parent-child
 * edges treated as undirected). Each component is a set of work items that are
 * transitively linked through any dependency or lineage edge — i.e. an
 * INDEPENDENT PARALLEL TRACK: two items in different components share no
 * dependency and no lineage, so they can be worked fully in parallel. An item
 * with no edges is its own singleton component.
 *
 * Only ids actually present in `view.work` are grouped: an edge to an unknown
 * id (a dangling `parent`/`dep` — the live gap noted in dep-graph.mjs) is
 * skipped rather than materialized as a phantom node, so the component set is
 * always over real work items.
 *
 * Deterministic (so the C1 envelope's `data_hash` is stable across rebuilds):
 * items within a component are in `view.work` declaration order, and the
 * components themselves are ordered by their first member's declaration index.
 *
 * @returns {{ componentCount: number, components: Array<{ size: number, items: string[] }> }}
 */
export function connectedComponents(view) {
  const work = view?.work ?? {};
  const ids = Object.keys(work); // declaration (insertion) order — the FIFO basis
  const orderIndex = new Map(ids.map((id, i) => [id, i]));
  const known = new Set(ids);

  const adjacency = new Map(ids.map((id) => [id, new Set()]));
  for (const { from, to } of buildUnifiedEdges(work)) {
    if (!known.has(from) || !known.has(to)) continue; // dangling endpoint — never a phantom node
    adjacency.get(from).add(to);
    adjacency.get(to).add(from);
  }

  const seen = new Set();
  const components = [];
  // Iterating `ids` in declaration order means each component is discovered
  // from its lowest-declaration-index member, so the components array is
  // itself in a stable declaration order — no post-sort of components needed.
  for (const id of ids) {
    if (seen.has(id)) continue;
    const members = [];
    const queue = [id];
    seen.add(id);
    while (queue.length > 0) {
      const current = queue.shift();
      members.push(current);
      for (const neighbour of adjacency.get(current)) {
        if (!seen.has(neighbour)) {
          seen.add(neighbour);
          queue.push(neighbour);
        }
      }
    }
    // BFS visitation order depends on Set insertion order; re-sort members by
    // declaration index so the emitted shape is fully deterministic.
    members.sort((a, b) => orderIndex.get(a) - orderIndex.get(b));
    components.push({ size: members.length, items: members });
  }

  return { componentCount: components.length, components };
}

// Build an id -> [things it waits on] map over the UNIFIED typed-edge graph
// (dep-graph.mjs `buildUnifiedEdges` — `deps` PLUS `parent`), known ids only.
// A `deps` entry contributes "id waits on dep", matching the graph's own
// `blocks` edge `{from: id, to: dep}` directly. A `parent` edge is
// `{from: parent, to: child}` ("parent waits on child" — dep-graph.mjs's own
// documented direction, since a parent stays gated until every child is
// done, frontier.mjs's `hasOpenDescendant`) — folded into this same map, so
// every function below that walks "what does id wait on" sees an open child
// exactly like it would see a `deps` entry, with no separate code path. An
// edge to/from an id not present in `work` is dropped — the same known-only
// rule connectedComponents uses, so a dangling reference never phantoms a
// node. Insertion (declaration) order is kept throughout so every derived
// list below is deterministic.
function knownUnifiedDeps(work) {
  const known = new Set(Object.keys(work));
  const deps = new Map(Object.keys(work).map((id) => [id, []]));
  for (const { from, to } of buildUnifiedEdges(work)) {
    if (!known.has(from) || !known.has(to)) continue;
    deps.get(from).push(to);
  }
  return deps;
}

// Reverse of knownUnifiedDeps: id -> [ids that depend on it], each list in declaration
// order of the dependents (deterministic).
function reverseDeps(depsMap) {
  const rev = new Map([...depsMap.keys()].map((id) => [id, []]));
  for (const [id, ds] of depsMap) {
    for (const d of ds) rev.get(d).push(id);
  }
  return rev;
}

// The transitive set of NOT-done items that depend on `id` (reverse-deps
// reachability, bounded to the `notDone` set). Shared by greedyTopUnblock and
// whatIf so "what completing X unblocks" has one definition.
function transitiveDownstream(id, rev, notDone) {
  const out = new Set();
  const stack = [...(rev.get(id) ?? [])];
  while (stack.length > 0) {
    const next = stack.pop();
    if (out.has(next) || !notDone.has(next)) continue;
    out.add(next);
    for (const up of rev.get(next) ?? []) stack.push(up);
  }
  return out;
}

// Shared longest-`deps`-chain search underlying both criticalPath (over the
// whole graph) and goalScopedCriticalPath (over a D5 scope). `candidateIds`
// is the declaration-order list of ids eligible to be the deepest item; the
// depthOf recursion itself is never separately scoped — every dep of a
// scoped candidate is already inside the scope by construction (D5's own
// deps-ancestor closure), so recursion naturally never leaves it. The graph
// is acyclic (guaranteed at the write door by S1/S2a), so the memoized
// recursion always terminates; a `guard` set is a pure defensive backstop,
// never a cycle report.
function longestChain(deps, candidateIds) {
  const depthMemo = new Map();
  const deepestDep = new Map();

  const depthOf = (id, guard = new Set()) => {
    if (depthMemo.has(id)) return depthMemo.get(id);
    if (guard.has(id)) return 0; // defensive only — the deps graph is acyclic
    guard.add(id);
    let best = 0;
    let chosen = null;
    for (const dep of deps.get(id) ?? []) {
      const d = depthOf(dep, guard);
      if (d > best) {
        best = d;
        chosen = dep; // first strict max wins -> declaration-order tie-break
      }
    }
    guard.delete(id);
    depthMemo.set(id, best + 1);
    deepestDep.set(id, chosen);
    return best + 1;
  };

  let top = null;
  let topDepth = 0;
  for (const id of candidateIds) {
    const d = depthOf(id);
    if (d > topDepth) {
      topDepth = d;
      top = id;
    }
  }

  const path = [];
  for (let cursor = top; cursor != null; cursor = deepestDep.get(cursor)) {
    path.push(cursor);
  }
  return { depth: topDepth, path };
}

/**
 * The CRITICAL PATH through the UNIFIED (`deps` + `parent`) DAG — the longest
 * chain of things one item waits on, whose length is the minimum number of
 * sequential steps before the deepest item can start. A root's own open
 * child counts here exactly like a `deps` entry would (the root cannot
 * finish until the child does, frontier.mjs's `hasOpenDescendant`). The
 * graph is acyclic (guaranteed at the write door by S1/S2a), so the
 * memoized longest-path recursion always terminates; a `guard` set is a
 * pure defensive backstop, never a cycle report.
 *
 * Returns `{ depth, path }` — `path` traced from the deepest item DOWN through
 * the max-depth dependency it sits on, ties broken by declaration order. An
 * empty view yields `{ depth: 0, path: [] }`.
 */
export function criticalPath(view) {
  const work = view?.work ?? {};
  const deps = knownUnifiedDeps(work);
  return longestChain(deps, Object.keys(work));
}

// Ids reachable from `startId` via the transitive closure of `targets` (D5's
// scope-union starting point — covers nested MVP > milestone > work). Cycle-
// safe: `result` doubles as the seen-guard, so a `targets` cycle (A targets
// B targets A) terminates without duplicating members, the same defensive
// stance as criticalPath's `guard` set. Only known ids (present in
// `view.work`) are ever added — mirrors knownUnifiedDeps's dangling-edge filtering,
// so an entry naming an unknown id is simply not traversed further. An
// unknown `startId` yields an empty set.
function targetsClosure(work, startId) {
  const known = new Set(Object.keys(work));
  const result = new Set();
  if (!known.has(startId)) return result;
  result.add(startId);
  const stack = [startId];
  while (stack.length > 0) {
    const id = stack.pop();
    const targets = Array.isArray(work[id]?.targets) ? work[id].targets : [];
    for (const t of targets) {
      if (!known.has(t) || result.has(t)) continue;
      result.add(t);
      stack.push(t);
    }
  }
  return result;
}

// The transitive deps-ancestor set of every id in `startIds` — every id
// reachable by walking `deps` outward, the same "blocker" relation
// criticalPath's depthOf recursion walks, collected as a SET instead of a
// depth. `startIds` themselves are never re-walked (they are already in the
// caller's scope) and never included in the returned set.
function depsAncestors(startIds, deps) {
  const visited = new Set(startIds);
  const result = new Set();
  const stack = [];
  for (const id of startIds) stack.push(...(deps.get(id) ?? []));
  while (stack.length > 0) {
    const dep = stack.pop();
    if (visited.has(dep)) continue;
    visited.add(dep);
    result.add(dep);
    stack.push(...(deps.get(dep) ?? []));
  }
  return result;
}

/**
 * GOAL-SCOPED SET (D5): for a focus id, the ranking scope = the focus item
 * itself PLUS the transitive `targets` closure from it (covers nested
 * MVP > milestone > work), UNION every member's transitive `deps`-ancestors
 * (the same blocker relation `criticalPath` already walks). This feeds
 * `goalScopedCriticalPath`/`goalScopedGreedyTopUnblock` RANKING only — item
 * readiness (`frontier.mjs`) stays a whole-graph computation, a documented
 * boundary, not a gap (D5).
 *
 * An unknown `focusId` (not present in `view.work`) yields an empty Set.
 * Deterministic and pure, matching the module's stance throughout.
 */
export function goalScopedSet(view, focusId) {
  const work = view?.work ?? {};
  const scope = targetsClosure(work, focusId);
  if (scope.size === 0) return scope;
  const deps = knownUnifiedDeps(work);
  for (const ancestor of depsAncestors(scope, deps)) scope.add(ancestor);
  return scope;
}

/**
 * GOAL-SCOPED CRITICAL PATH (D5): the same longest-`deps`-chain search as
 * `criticalPath`, but restricted to the D5 goal-scoped set for `focusId` —
 * an item outside the scope never appears in the returned path, even if it
 * would otherwise be the whole graph's deepest chain. The candidate search
 * iterates `Object.keys(view.work)` in declaration order filtered by the
 * scope (never the scope Set directly), preserving the same declaration-
 * order tie-break every other metric in this module relies on. An unknown
 * `focusId` yields `{ depth: 0, path: [] }`, matching `criticalPath`'s own
 * empty-view behavior.
 */
export function goalScopedCriticalPath(view, focusId) {
  const work = view?.work ?? {};
  const scope = goalScopedSet(view, focusId);
  if (scope.size === 0) return { depth: 0, path: [] };
  const deps = knownUnifiedDeps(work);
  return longestChain(deps, Object.keys(work).filter((id) => scope.has(id)));
}

/**
 * STALE-BLOCKED items: those parked waiting on work that is not RESOLVED. An
 * item is listed when its status is `todo` or `blocked` AND at least one of
 * its deps is not RESOLVED (`done` or, per
 * wontfix-terminal-status-filter-consistency D2, `wontfix` — a MISSING dep
 * also counts, since a nonexistent id can never complete either, a permanent
 * blocker). Each entry names the unmet deps holding it. A fully ready item
 * (every dep resolved) is never listed. Declaration order throughout.
 */
export function staleBlocked(view) {
  const work = view?.work ?? {};
  const result = [];
  for (const id of Object.keys(work)) {
    const item = work[id];
    if (item.status !== 'todo' && item.status !== 'blocked') continue;
    const deps = Array.isArray(item.deps) ? item.deps : [];
    const blockedBy = deps.filter((dep) => !isResolvedStatus(work[dep]));
    if (blockedBy.length > 0) {
      result.push({ id, status: item.status, blockedBy });
    }
  }
  return result;
}

// Shared submodular-greedy unblock ranking underlying both greedyTopUnblock
// (over the whole graph) and goalScopedGreedyTopUnblock (over a D5 scope).
// `candidates` is the declaration-order eligible set; `notDone` bounds the
// downstream-coverage counting (transitiveDownstream stops the moment it
// leaves `notDone`, so a scoped `notDone` already keeps out-of-scope items
// out of every pick's newlyUnblocks count without any extra filtering here).
function computeGreedyTopUnblock(candidates, notDone, deps, k) {
  const rev = reverseDeps(deps);
  const downstreamCache = new Map();
  const downstream = (id) => {
    if (!downstreamCache.has(id)) downstreamCache.set(id, transitiveDownstream(id, rev, notDone));
    return downstreamCache.get(id);
  };

  const covered = new Set();
  const picks = [];

  for (let round = 0; round < k; round += 1) {
    let best = null;
    let bestGain = 0;
    for (const id of candidates) {
      if (covered.has(id)) continue;
      const ds = downstream(id);
      let gain = 1; // the item itself becomes covered
      for (const d of ds) if (!covered.has(d)) gain += 1;
      if (gain > bestGain) {
        bestGain = gain;
        best = id;
      }
    }
    if (best == null || bestGain === 0) break;
    const ds = downstream(best);
    picks.push({ id: best, unblocks: ds.size, newlyUnblocks: bestGain });
    covered.add(best);
    for (const d of ds) covered.add(d);
  }
  return picks;
}

/**
 * GREEDY TOP-K-UNBLOCK: a submodular greedy ranking of the not-`done` items by
 * how much completing each would unblock. `unblocks` is the size of an item's
 * transitive downstream (the not-done items that depend on it, directly or
 * through a chain); `newlyUnblocks` is the MARGINAL coverage a pick adds over
 * everything the earlier picks already cover — the greedy always takes the
 * largest marginal gain next (declaration order breaking ties), which is the
 * classic submodular-cover heuristic. Stops at `k` picks or when no remaining
 * candidate adds new coverage.
 */
export function greedyTopUnblock(view, k = 10) {
  const work = view?.work ?? {};
  const deps = knownUnifiedDeps(work);
  const notDone = new Set(Object.keys(work).filter((id) => !isResolvedStatus(work[id])));
  return computeGreedyTopUnblock([...notDone], notDone, deps, k); // declaration order
}

/**
 * GOAL-SCOPED GREEDY TOP-K-UNBLOCK (D5): the same submodular-greedy ranking
 * as `greedyTopUnblock`, but both the candidate set and the `notDone` set
 * used for downstream-coverage counting are intersected with the D5 goal-
 * scoped set for `focusId` first — so ranking and marginal-coverage counting
 * only consider work relevant to this goal, never whole-graph noise. This
 * also truncates `transitiveDownstream` at out-of-scope hops, which is
 * correct under D5 (coverage counting should only count scoped work), not a
 * bug to avoid. An unknown `focusId` yields `[]`, matching `greedyTopUnblock`
 * on an empty candidate set.
 */
export function goalScopedGreedyTopUnblock(view, focusId, k = 10) {
  const work = view?.work ?? {};
  const scope = goalScopedSet(view, focusId);
  if (scope.size === 0) return [];
  const deps = knownUnifiedDeps(work);
  const notDone = new Set(Object.keys(work).filter((id) => scope.has(id) && !isResolvedStatus(work[id])));
  return computeGreedyTopUnblock([...notDone], notDone, deps, k); // declaration order, scope-filtered
}

/**
 * WHAT-IF (S7): "if I complete `id`, what does it unblock?" — the cheap answer
 * a human gate wants. `unblocksTransitive` is the size of `id`'s transitive
 * not-RESOLVED downstream (the same definition greedyTopUnblock ranks by;
 * RESOLVED = `done` or, per wontfix-terminal-status-filter-consistency D2,
 * `wontfix`). `newlyReady` is the direct dependents that become
 * DEP-SATISFIED the moment `id` is done: status `todo` and every OTHER dep
 * already RESOLVED. That is a graph fact about dependencies only — NOT full
 * frontier eligibility (it does not check stage/lineage), so a `newlyReady`
 * item may still wait on context-discovery or an open descendant. An
 * unknown id yields exists:false.
 */
export function whatIf(view, id) {
  const work = view?.work ?? {};
  if (!work[id]) {
    return { id, exists: false, unblocksTransitive: 0, newlyReady: [] };
  }
  const deps = knownUnifiedDeps(work);
  const rev = reverseDeps(deps);
  const notDone = new Set(Object.keys(work).filter((x) => !isResolvedStatus(work[x])));
  const downstream = transitiveDownstream(id, rev, notDone);
  const newlyReady = (rev.get(id) ?? []).filter((depId) => {
    const item = work[depId];
    if (item.status !== 'todo') return false;
    return (Array.isArray(item.deps) ? item.deps : []).every((d) => d === id || isResolvedStatus(work[d]));
  });
  // tsk-4zj D6: `newlyReady` entries are `status: 'todo'`, which spans
  // every stage — same reasoning as `graphMetrics`'s own `stageByItem`,
  // scoped here to just `id` itself plus `newlyReady`'s members rather
  // than the whole work map (this answer is already single-id-scoped).
  const stageByItem = Object.fromEntries(
    [id, ...newlyReady].map((itemId) => [itemId, effectiveStage(work[itemId], getDomain(work[itemId].domain))]),
  );
  return { id, exists: true, unblocksTransitive: downstream.size, newlyReady, stageByItem };
}

// Default node ceiling above which the expensive greedy (topUnblock) is
// skipped. Cheap metrics (components/critical-path/stale-blocked are all
// linear in V+E) always run; the greedy is the only super-linear one, so it is
// the only metric the frame ever marks skipped.
export const DEFAULT_MAX_NODES_FOR_GREEDY = 500;

/**
 * The ARCHITECTURE FRAME (S7): provenance for the metrics payload. `revision`
 * is the deterministic view fingerprint (S3) — a consumer caches metrics by it
 * and skips recompute when it is unchanged. `computed`/`skipped` name which
 * metrics actually ran: the greedy `topUnblock` is skipped (kept bounded) once
 * `nodeCount` exceeds `maxNodesForGreedy`. This is a computed/skipped + data-
 * hash frame, not decoration — it tells a consumer exactly what it is reading.
 */
export function metricsFrame(view, { maxNodesForGreedy = DEFAULT_MAX_NODES_FOR_GREEDY } = {}) {
  const nodeCount = Object.keys(view?.work ?? {}).length;
  const greedyComputed = nodeCount <= maxNodesForGreedy;
  return {
    revision: viewRevision(view),
    nodeCount,
    computed: ['componentCount', 'components', 'criticalPath', 'staleBlocked', ...(greedyComputed ? ['topUnblock'] : [])],
    skipped: greedyComputed ? [] : ['topUnblock'],
  };
}

/**
 * The umbrella read-only metrics surface the `fgos graph` verb emits. It
 * carries the claim-order contract version alongside the graph facts so a
 * consumer reads how work is ordered (order_version), grouped (components, S5),
 * chained (criticalPath), stuck (staleBlocked), and best unblocked (topUnblock)
 * from ONE envelope — all folded mechanically from the same view, never
 * re-derived by the consumer. S6 completes P43's stated acceptance; S7 adds the
 * `frame` (computed/skipped + revision), and skips the greedy on a large graph.
 */
export function graphMetrics(view, opts = {}) {
  const { componentCount, components } = connectedComponents(view);
  const frame = metricsFrame(view, opts);
  const work = view?.work ?? {};
  return {
    order_version: FRONTIER_ORDER_VERSION,
    frame,
    componentCount,
    components,
    criticalPath: criticalPath(view),
    staleBlocked: staleBlocked(view),
    topUnblock: frame.skipped.includes('topUnblock') ? [] : greedyTopUnblock(view),
    // tsk-4zj D6: `components[].items`/`criticalPath`/`topUnblock` are
    // arrays of bare id strings, `staleBlocked` entries reference ids too
    // — none of them carry `stage` today. Rather than changing any of
    // those id-array shapes to object-arrays (a real breaking change,
    // per CONTEXT.md's Scout evidence on the existing `assert.deepEqual`
    // coverage of `components[0].items`), this adds one flat side-map a
    // reader cross-references any id in the output against.
    stageByItem: Object.fromEntries(
      Object.keys(work).map((id) => [id, effectiveStage(work[id], getDomain(work[id].domain))]),
    ),
  };
}

// Advisory grace windows per owner type (S8). A person's claim gets a far
// longer grace than an agent's — human >> agent — mirroring the runner reap,
// which reclaims only its OWN crashed claims and never a human/session's. Both
// are advisory defaults, fully overridable by the caller.
export const STALE_DOING_DEFAULTS = Object.freeze({
  agentMs: 15 * 60 * 1000, // 15 minutes
  humanMs: 24 * 60 * 60 * 1000, // 24 hours
});

/**
 * EVIDENCE-CLASSIFIER ADVISORY (S8): classify items stuck in `doing` as stale
 * by OWNER TYPE and SUGGEST — never act. `entries` is
 * `[{ id, claimRole, claimedAt }]` (claimedAt in epoch ms). PURE when `now`
 * is passed. An item claimed by the `runner` is an `agent` claim (short grace);
 * anything else (`human`/`session`/unknown) is treated as a `human` claim (the
 * long grace — the conservative choice, and never auto-reclaimed anywhere).
 * An entry with no locatable claim time is skipped (never a NaN age). Returns
 * only the stale entries; every suggestion is advisory text and explicitly
 * NEVER an automatic reclaim — this module classifies, the human decides.
 */
export function classifyStaleDoing(entries, { now = Date.now(), thresholds = STALE_DOING_DEFAULTS } = {}) {
  const stale = [];
  for (const entry of entries ?? []) {
    const { id, claimRole, claimedAt } = entry ?? {};
    if (typeof claimedAt !== 'number' || !Number.isFinite(claimedAt)) continue; // no claim time -> cannot age
    const ownerClass = claimRole === 'runner' ? 'agent' : 'human';
    const thresholdMs = ownerClass === 'agent' ? thresholds.agentMs : thresholds.humanMs;
    const ageMs = now - claimedAt;
    if (ageMs <= thresholdMs) continue; // fresh enough for this owner type
    const suggestion = ownerClass === 'agent'
      ? `runner-claimed ~${Math.round(ageMs / 60000)}m — likely a crashed or hung agent; investigate or let the startup reap reclaim it. This advisory never reclaims.`
      : `held by ${claimRole ?? 'a person'} ~${Math.round(ageMs / 3600000)}h — check in with the holder; a person's claim is never auto-reclaimed.`;
    stale.push({ id, claimRole, ownerClass, ageMs, thresholdMs, suggestion });
  }
  return { now, thresholds, stale };
}

// Advisory thresholds for the post-delivery observability gap (S10, tsk-1bl
// CONTEXT.md D4/D7): `delivered` and `retrospective` both get a flat 3-day
// grace; `cleanup` gets no fixed default here since its real TTL is a
// per-repo shared-config value the caller must supply (`ttlDays`, same
// requirement `checkCleanupTTLElapsed`/`pickNextCleanupItem` already have,
// cleanup-harness.mjs/cleanup-pool.mjs) — this default only covers the two
// flat-3-day statuses.
export const STALE_POST_DELIVERY_DEFAULTS = Object.freeze({
  deliveredMs: 3 * 24 * 60 * 60 * 1000, // 3 days
  retrospectiveMs: 3 * 24 * 60 * 60 * 1000, // 3 days (D7 — same as delivered)
  cleanupGraceMs: 3 * 24 * 60 * 60 * 1000, // grace ADDED ON TOP of ttlDays, never counted alone
});

// The item's own SPECIFIC entry event into `status`, never "the latest event
// of any kind" — same precedent `checkCleanupTTLElapsed` (cleanup-harness.mjs)
// and `latestRetrospectiveEntry` (retro-pool.mjs) already use. Returns
// `undefined` when the item never actually entered that status.
function latestEntryInto(rawEvents, id, status) {
  const entries = (rawEvents ?? []).filter(
    (e) => e.type === 'work.move' && e.payload?.id === id && e.payload?.to === status,
  );
  return entries.at(-1);
}

/**
 * EVIDENCE-CLASSIFIER ADVISORY (S10, mirrors S8's classifyStaleDoing shape):
 * classify items stuck in the post-merge chain (`delivered`/`retrospective`/
 * `cleanup`) as stale and SUGGEST — never act, never invoke a verb, never
 * transition anything. `delivered`/`retrospective` are stale past a flat 3
 * days from their own entry-into-status event; `cleanup` is stale past
 * `ttlDays + cleanupGraceMs` from its own entry-into-cleanup event (the
 * grace is ADDED ON TOP of the real TTL — D4 — so an item still legitimately
 * waiting on TTL is never flagged). An item with no locatable entry event
 * for its current status is skipped (never a NaN age, same discipline
 * `classifyStaleDoing` already gives a missing `claimedAt`). PURE when `now`
 * is passed; reads only `view.work` + `rawEvents`, never `work.domain`
 * (domain-agnostic, CONTEXT.md D5).
 */
export function classifyStalePostDelivery(view, rawEvents, { now = Date.now(), thresholds = STALE_POST_DELIVERY_DEFAULTS, ttlDays } = {}) {
  const work = view?.work ?? {};
  const stale = [];
  for (const id of Object.keys(work)) {
    const status = work[id]?.status;
    if (status !== 'delivered' && status !== 'retrospective' && status !== 'cleanup') continue;

    const entered = latestEntryInto(rawEvents, id, status);
    if (!entered) continue; // no locatable entry event -> cannot age

    const enteredAt = new Date(entered.ts).getTime();
    const ageMs = now - enteredAt;
    const thresholdMs = status === 'cleanup'
      ? (ttlDays * 24 * 60 * 60 * 1000) + thresholds.cleanupGraceMs
      : (status === 'delivered' ? thresholds.deliveredMs : thresholds.retrospectiveMs);
    if (ageMs <= thresholdMs) continue; // fresh enough for this status

    const ageDays = Math.floor(ageMs / 86400000);
    const suggestion = status === 'cleanup'
      ? `sat in cleanup ~${ageDays}d (TTL+grace ${Math.floor(thresholdMs / 86400000)}d elapsed) — check whether /fgOS:cleanup-loop has run recently. This advisory never cleans up.`
      : `sat in ${status} ~${ageDays}d with no retro sweep run — check whether /fgOS:retro-loop has run recently. This advisory never advances status.`;
    stale.push({ id, status, ageMs, thresholdMs, suggestion });
  }
  return { now, thresholds, stale };
}

// The options a footprint conflict can be resolved by — surfaced as data, never
// applied. `sequence` = add a dependency so the two run in order not in
// parallel; `hoist` = extract the shared file's work into a prerequisite both
// depend on; `re-slice` = split so the footprints no longer overlap.
const FOOTPRINT_CONFLICT_SUGGESTIONS = Object.freeze(['sequence', 'hoist', 're-slice']);

/**
 * Pairwise declared-footprint overlap over an explicit candidate list (D4-
 * revised, docs/history/merge-standardization/CONTEXT.md): the comparison
 * itself, with no opinion on WHICH items are candidates — `footprintOverlap`
 * below supplies the frontier for the parallel-dispatch case; merge-
 * readiness ranking (`src/state/graph-harness.mjs`) supplies the
 * proposed-and-dep-clear set for the merge-ordering case. Every pair whose
 * declared `footprint`s share at least one path is flagged with the shared
 * paths and the resolution OPTIONS (sequence / hoist / re-slice) — the
 * detector suggests, it never re-slices. Deterministic: pairs follow the
 * candidate list's own order (i < j), shared paths keep the first item's
 * order. An item with no footprint never conflicts.
 */
export function footprintOverlapAmong(candidates) {
  const conflicts = [];
  for (let i = 0; i < candidates.length; i += 1) {
    const footprintA = Array.isArray(candidates[i].footprint) ? candidates[i].footprint : [];
    if (footprintA.length === 0) continue;
    for (let j = i + 1; j < candidates.length; j += 1) {
      // tsk-2jn: normalized through normalizePath (util/normalize-path.mjs) for the
      // MEMBERSHIP check only -- the same choke-point buildOwnFileSet
      // (merge.mjs) and frozenJudgeHits (frozen-judge.mjs) already normalize
      // through, so a stray "./" or a "\" from a different session/OS never
      // dodges detection. `shared` still reports footprint A's own
      // as-declared spelling (never the normalized form) -- this is a
      // detector, not a rewriter, and the raw string is what a person
      // resolving the conflict actually typed into `footprint`.
      const footprintB = new Set(
        (Array.isArray(candidates[j].footprint) ? candidates[j].footprint : []).map(normalizePath),
      );
      const shared = footprintA.filter((path) => footprintB.has(normalizePath(path)));
      if (shared.length > 0) {
        conflicts.push({ a: candidates[i].id, b: candidates[j].id, shared, suggestions: [...FOOTPRINT_CONFLICT_SUGGESTIONS] });
      }
    }
  }
  return conflicts;
}

/**
 * FOOTPRINT-INTERSECTION advisory (S9 — the target): find file-collision risk
 * between items that could dispatch IN PARALLEL. The candidate set is the
 * frontier (`ready` = items independently dispatchable right now), so a
 * conflict here is real: a parallel runner could pick both at once. Thin
 * wrapper over `footprintOverlapAmong` (D4-revised) — byte-for-byte
 * unchanged behavior, existing callers/tests untouched.
 */
export function footprintOverlap(view) {
  return footprintOverlapAmong(frontier(view));
}

/**
 * DEP-GRAPH CYCLE DETECTION (tsk-3c7, D1/D2 of docs/history/parallel-
 * decomposition-footprint-avoidance/CONTEXT.md; tsk-3u2 widened it to the
 * UNIFIED graph after independent review found the original `deps`-only
 * version blind to a real deadlock: a parent anchored by an open child
 * whose own `deps`/`mergeAfter` points back at the parent — a permanent
 * stall `findUnifiedCycle` in dep-graph.mjs already catches, this
 * function did not): Tarjan's strongly-connected-components algorithm
 * over `knownUnifiedDeps`'s adjacency (`deps` + `parent` + `mergeAfter`,
 * the SAME unified graph `connectedComponents`/`criticalPath` above
 * already walk), regardless of `status` — a cycle is a graph-integrity
 * defect no matter which items in it happen to be done/blocked/todo right
 * now. A self-edge (an item depending on, parented by, or merge-ordered
 * after itself) is reported as its own one-element cycle. An edge with
 * either endpoint not a known work item is dropped by `knownUnifiedDeps`
 * itself (dangling-reference detection is a different concern, not this
 * function's). Returns an array of cycles, each an array of the ids
 * forming that cycle — empty when the graph is acyclic. Unlike
 * `findUnifiedCycle` (which stops at the FIRST cycle found), this returns
 * EVERY cycle — `computedSchedule` (store.mjs) needs the full set, not
 * just proof that one exists. PURE: reads only `view.work`.
 */
export function detectCycles(view) {
  const work = view?.work ?? {};
  const adjacency = knownUnifiedDeps(work);
  let index = 0;
  const stack = [];
  const indices = new Map();
  const lowlink = new Map();
  const onStack = new Set();
  const cycles = [];

  function strongconnect(id) {
    indices.set(id, index);
    lowlink.set(id, index);
    index += 1;
    stack.push(id);
    onStack.add(id);

    for (const target of adjacency.get(id) ?? []) {
      if (target === id) {
        cycles.push([id]);
        continue;
      }
      if (!indices.has(target)) {
        strongconnect(target);
        lowlink.set(id, Math.min(lowlink.get(id), lowlink.get(target)));
      } else if (onStack.has(target)) {
        lowlink.set(id, Math.min(lowlink.get(id), indices.get(target)));
      }
    }

    if (lowlink.get(id) === indices.get(id)) {
      const scc = [];
      let w;
      do {
        w = stack.pop();
        onStack.delete(w);
        scc.push(w);
      } while (w !== id);
      if (scc.length > 1) cycles.push(scc);
    }
  }

  for (const id of adjacency.keys()) {
    if (!indices.has(id)) strongconnect(id);
  }
  return cycles;
}

/**
 * COMPUTED-PARALLEL-WAVE-SCHEDULE (tsk-3c7, D1/D2 of docs/history/
 * parallel-decomposition-footprint-avoidance/CONTEXT.md; tsk-ik3 widened
 * it to accept an optional CANDIDATE SET, docs/history/execution-fanout/
 * CONTEXT.md/plan.md): dispatch-time query answering "which frontier
 * items can run in parallel right now, and which must wait for a
 * footprint-conflicting sibling to finish first" — a DIFFERENT question
 * from `footprintOverlap`'s pairwise advisory (which only flags
 * conflicting pairs, never orders them) and from `graph-harness.mjs`'s
 * `mergeReadiness` (which orders `proposed` items for MERGE, a different
 * lifecycle point — D2 deliberately does not reuse that connected-
 * component logic here: dispatch needs a COUNT of how many can start now,
 * merge only needs a relative ORDER).
 *
 * `candidateIds`, when given, SCOPES which frontier items are even
 * eligible to be packed into a wave — a caller wave-scheduling a fan-out
 * (children of one parent, or the targets of one milestone) never wants a
 * ready item OUTSIDE that set stealing a wave-0 slot from one inside it,
 * since footprint packing runs on whatever it's handed and would
 * otherwise place waves that are correct for the whole frontier but wrong
 * for the caller's actual candidate set. Scoping happens BEFORE packing
 * (filtering the already-packed waves after the fact would keep the wrong
 * wave placement, only hiding it — docs/history/execution-fanout/plan.md
 * "Đường nhỏ hơn đã xét"). Omitting `candidateIds` preserves today's
 * behavior exactly: every frontier item is a candidate, unchanged.
 *
 * Kahn-style greedy layering over the (optionally scoped) frontier, in
 * its own priority/intent/FIFO order (`frontier.mjs`'s
 * `FRONTIER_ORDER_VERSION`): walk it in that order, packing each item
 * into the earliest wave that has no footprint conflict with what is
 * already placed in it (`footprintOverlapAmong`, reused unchanged). A
 * conflicting item is DEFERRED to a later wave, never refused — mirrors
 * `footprintOverlapAmong`'s own "advisory, never blocking" stance. An
 * item with no declared footprint never conflicts with anything (same
 * semantics `footprintOverlapAmong` already gives it), so it packs into
 * the earliest wave with room. Returns `{ waves }` — `waves` is an array
 * of arrays of item ids, in frontier order within each wave; `waves[0]`
 * is everything dispatchable in parallel right now. PURE: reads only
 * `view.work` via `frontier`/`footprintOverlapAmong`.
 */
export function computeSchedule(view, candidateIds) {
  const scope = candidateIds ? new Set(candidateIds) : null;
  const candidates = scope ? frontier(view).filter((item) => scope.has(item.id)) : frontier(view);
  const conflicts = footprintOverlapAmong(candidates);
  const conflictsOf = new Map();
  for (const { a, b } of conflicts) {
    if (!conflictsOf.has(a)) conflictsOf.set(a, new Set());
    if (!conflictsOf.has(b)) conflictsOf.set(b, new Set());
    conflictsOf.get(a).add(b);
    conflictsOf.get(b).add(a);
  }

  const waves = [];
  let remaining = candidates;
  while (remaining.length > 0) {
    const wave = [];
    const waveIds = new Set();
    const deferred = [];
    for (const item of remaining) {
      const itemConflicts = conflictsOf.get(item.id);
      const conflictsWithWave = itemConflicts ? [...itemConflicts].some((id) => waveIds.has(id)) : false;
      if (conflictsWithWave) {
        deferred.push(item);
      } else {
        wave.push(item.id);
        waveIds.add(item.id);
      }
    }
    waves.push(wave);
    remaining = deferred;
  }
  return { waves };
}
