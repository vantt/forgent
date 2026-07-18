// graph-metrics.mjs — read-only MECHANICAL graph metrics over a work view
// (work-graph-intelligence S5+, the "compute-brain"). PURE: no fs, no writes,
// no model/LLM call — every metric is folded mechanically from the view's
// unified typed-edge graph (dep-graph.mjs `buildUnifiedEdges`). Stance R42:
// this module NEVER writes and never decides; it computes graph FACTS that a
// picker (P7) or planner (P8) later reads. It is a Domain functional core —
// it imports only same-layer Domain helpers (dep-graph, frontier), never an
// Infra/Entry module, and it takes an already-folded `view` (it never folds
// the log itself; the store facade hands it the view).

import { buildUnifiedEdges } from './dep-graph.mjs';
import { FRONTIER_ORDER_VERSION } from './frontier.mjs';

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

// Build an id -> deps[] map over KNOWN ids only (the `blocks` sub-graph: a
// dependent points at what it depends on). A dep to an id not present in
// `work` is dropped — the same known-only rule connectedComponents uses, so a
// dangling dep never phantoms a node. Insertion (declaration) order is kept
// throughout so every derived list below is deterministic.
function knownDeps(work) {
  const known = new Set(Object.keys(work));
  const deps = new Map();
  for (const id of Object.keys(work)) {
    const list = Array.isArray(work[id]?.deps) ? work[id].deps : [];
    deps.set(id, list.filter((d) => known.has(d)));
  }
  return deps;
}

// Reverse of knownDeps: id -> [ids that depend on it], each list in declaration
// order of the dependents (deterministic).
function reverseDeps(depsMap) {
  const rev = new Map([...depsMap.keys()].map((id) => [id, []]));
  for (const [id, ds] of depsMap) {
    for (const d of ds) rev.get(d).push(id);
  }
  return rev;
}

/**
 * The CRITICAL PATH through the `deps` (blocks) DAG — the longest dependency
 * chain, whose length is the minimum number of sequential steps before the
 * deepest item can start. The graph is acyclic (guaranteed at the write door
 * by S1/S2a), so the memoized longest-path recursion always terminates; a
 * `guard` set is a pure defensive backstop, never a cycle report.
 *
 * Returns `{ depth, path }` — `path` traced from the deepest item DOWN through
 * the max-depth dependency it sits on, ties broken by declaration order. An
 * empty view yields `{ depth: 0, path: [] }`.
 */
export function criticalPath(view) {
  const work = view?.work ?? {};
  const deps = knownDeps(work);
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
  for (const id of Object.keys(work)) {
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
 * STALE-BLOCKED items: those parked waiting on work that is not done. An item
 * is listed when its status is `todo` or `blocked` AND at least one of its
 * deps is not `done` (a MISSING dep counts — it can never complete, a
 * permanent blocker). Each entry names the unmet deps holding it. A fully
 * ready item (every dep done) is never listed. Declaration order throughout.
 */
export function staleBlocked(view) {
  const work = view?.work ?? {};
  const result = [];
  for (const id of Object.keys(work)) {
    const item = work[id];
    if (item.status !== 'todo' && item.status !== 'blocked') continue;
    const deps = Array.isArray(item.deps) ? item.deps : [];
    const blockedBy = deps.filter((dep) => work[dep]?.status !== 'done');
    if (blockedBy.length > 0) {
      result.push({ id, status: item.status, blockedBy });
    }
  }
  return result;
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
  const deps = knownDeps(work);
  const rev = reverseDeps(deps);
  const notDone = new Set(Object.keys(work).filter((id) => work[id].status !== 'done'));

  // Transitive not-done dependents of `id` (reverse-deps reachability).
  const downstreamOf = (id) => {
    const out = new Set();
    const stack = [...(rev.get(id) ?? [])];
    while (stack.length > 0) {
      const next = stack.pop();
      if (out.has(next) || !notDone.has(next)) continue;
      out.add(next);
      for (const up of rev.get(next) ?? []) stack.push(up);
    }
    return out;
  };

  const downstreamCache = new Map();
  const downstream = (id) => {
    if (!downstreamCache.has(id)) downstreamCache.set(id, downstreamOf(id));
    return downstreamCache.get(id);
  };

  const covered = new Set();
  const picks = [];
  const candidates = [...notDone]; // declaration order

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
 * The umbrella read-only metrics surface the `fgos graph` verb emits. It
 * carries the claim-order contract version alongside the graph facts so a
 * consumer reads how work is ordered (order_version), grouped (components, S5),
 * chained (criticalPath), stuck (staleBlocked), and best unblocked (topUnblock)
 * from ONE envelope — all folded mechanically from the same view, never
 * re-derived by the consumer. S6 completes P43's stated acceptance here.
 */
export function graphMetrics(view) {
  const { componentCount, components } = connectedComponents(view);
  return {
    order_version: FRONTIER_ORDER_VERSION,
    componentCount,
    components,
    criticalPath: criticalPath(view),
    staleBlocked: staleBlocked(view),
    topUnblock: greedyTopUnblock(view),
  };
}
