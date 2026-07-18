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

/**
 * The umbrella read-only metrics surface the `fgos graph` verb emits (S5). It
 * carries the claim-order contract version alongside the graph facts so a
 * consumer reads both the "how work is ordered" and "how work is grouped"
 * signals from one envelope. S6 extends this object with the transitive
 * unblock-set, critical path/depth, stale-blocked chains, and greedy
 * top-k-unblock — all folded from the same view, never re-derived by the
 * consumer.
 */
export function graphMetrics(view) {
  const { componentCount, components } = connectedComponents(view);
  return {
    order_version: FRONTIER_ORDER_VERSION,
    componentCount,
    components,
  };
}
