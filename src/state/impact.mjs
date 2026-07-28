// impact.mjs — backlog-triage impact ranking (P21, deep-dive
// work-item-management.md, "cửa 2 của triage" — separate from P14's
// intake-triage risk/lane classification). PURE: takes a work-state view (as
// returned by store.mjs's listWork/rebuildView) and returns items ranked by
// how many other still-open items they block, highest first. No fs, no
// Date.now(), no event append, no mutation of any kind — a read never
// writes, same discipline as src/evolve/candidates.mjs.
//
// "Impact" here is a blocking-fan-out proxy: an item that unblocks more
// still-open work when it lands is more impactful to finish first. This is
// deliberately NOT a priority/value field on the schema (that is P7's
// scope — priority field for frontier ordering — and P8's intent-scoring,
// both still proposed); it is a pure derive over the unified typed-edge
// graph (dep-graph.mjs's `buildUnifiedEdges` — `deps` PLUS `parent`) the
// schema already has, same spirit as frontier.mjs's parent-lineage derive.
// Counting `deps` alone under-counted a root item's real impact: finishing
// a root's last open child unblocks that root too (frontier.mjs's own
// `hasOpenDescendant` gate), so a root with only children and no `deps`
// dependents used to rank as zero impact despite gating real downstream
// work.
import { buildUnifiedEdges } from './dep-graph.mjs';
import { connectedComponents } from './graph-metrics.mjs';

// Tier ordering used to sort mvp/milestone goals ahead of ungrouped work —
// lower sorts first. An absent goalTier (plain work item, the common case)
// sorts last, never crowding out declared goals.
function tierRank(goalTier) {
  if (goalTier === 'mvp') return 0;
  if (goalTier === 'milestone') return 1;
  return 2;
}

/**
 * Rank open work items by blocking fan-out, highest first.
 *
 * `blocks` for an item is the count of OTHER items with status !== 'done'
 * that directly wait on it in the unified graph — either a `deps` entry
 * naming it, or (for a parent item) an open child naming it as `parent`.
 * Done items never count on either side: a done item is never ranked
 * (nothing left to unblock by finishing it) and never counted as something
 * still blocked.
 *
 * Each row also carries which connected component (RUL44 — dependency or
 * lineage cluster) the item belongs to, reusing graph-metrics.mjs's own
 * `connectedComponents` rather than re-deriving it — but computed over the
 * OPEN-ITEM SUBGRAPH ONLY: a done item is finished work, so it never adds
 * real leverage to a cluster. `componentSize: 1` (`isIsolated: true`) means
 * the item shares no edge with any OTHER STILL-OPEN item — finishing it has
 * no remaining structural fan-out beyond its own `blocks` count, even if it
 * once shared a component with work that has since landed.
 *
 * Ranking is deterministic: declared goal tier first (mvp, then milestone,
 * then ungrouped work), then blocks descending, then component size
 * descending (a bigger cluster is a higher-leverage pick at an equal blocks
 * count), ties broken by ascending id.
 */
export function rankImpact(view) {
  const work = view?.work ?? {};
  const openIds = Object.keys(work).filter((id) => work[id].status !== 'done');
  const openSet = new Set(openIds);

  const blockCounts = new Map(openIds.map((id) => [id, 0]));
  for (const { from, to } of buildUnifiedEdges(work)) {
    if (openSet.has(from) && blockCounts.has(to)) {
      blockCounts.set(to, blockCounts.get(to) + 1);
    }
  }

  // connectedComponents groups over every id in `.work` with no status
  // filter of its own (it is a whole-graph structural view, correctly so
  // for `fgos graph`) — passing an OPEN-ONLY work map here keeps a
  // finished dependency/parent from inflating componentSize/isIsolated for
  // an item whose real remaining cluster is smaller or empty. An edge
  // toward a now-excluded done id is dropped exactly like any other
  // dangling reference (see connectedComponents' own `known` check).
  const openWork = Object.fromEntries(openIds.map((id) => [id, work[id]]));
  const { components } = connectedComponents({ work: openWork });
  const componentOf = new Map();
  components.forEach(({ items, size }, componentId) => {
    for (const memberId of items) componentOf.set(memberId, { componentId, componentSize: size });
  });

  const ranked = openIds.map((id) => {
    const item = work[id];
    const { componentId, componentSize } = componentOf.get(id) ?? { componentId: null, componentSize: 1 };
    return {
      id,
      title: item.title,
      status: item.status,
      blocks: blockCounts.get(id),
      stage: item.stage ?? 'executing',
      goalTier: item.goalTier ?? null,
      componentId,
      componentSize,
      isIsolated: componentSize === 1,
    };
  });
  ranked.sort((a, b) => (
    tierRank(a.goalTier) - tierRank(b.goalTier)
    || b.blocks - a.blocks
    || b.componentSize - a.componentSize
    || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
  ));
  return ranked;
}
