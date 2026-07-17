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
// both still proposed); it is a pure derive over the `deps` relation the
// schema already has, same spirit as frontier.mjs's parent-lineage derive.

/**
 * Rank open work items by blocking fan-out, highest first.
 *
 * `blocks` for an item is the count of OTHER items with status !== 'done'
 * whose `deps` array includes this item's id — done items never count on
 * either side: a done item is never ranked (nothing left to unblock by
 * finishing it) and never counted as something still blocked. Ranking is
 * deterministic: blocks descending, ties broken by ascending id.
 */
export function rankImpact(view) {
  const work = view?.work ?? {};
  const openIds = Object.keys(work).filter((id) => work[id].status !== 'done');

  const blockCounts = new Map(openIds.map((id) => [id, 0]));
  for (const id of openIds) {
    for (const dep of work[id].deps ?? []) {
      if (blockCounts.has(dep)) {
        blockCounts.set(dep, blockCounts.get(dep) + 1);
      }
    }
  }

  const ranked = openIds.map((id) => ({
    id,
    title: work[id].title,
    status: work[id].status,
    blocks: blockCounts.get(id),
  }));
  ranked.sort((a, b) => b.blocks - a.blocks || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return ranked;
}
