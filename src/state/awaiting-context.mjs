// awaiting-context.mjs — read-time, parent-anchored context for an
// awaiting-human work item (str61 D1/D2/D3). PURE: no fs import, no side
// effects — mirrors frontier.mjs/graph-metrics.mjs's shape: it only reads
// the `view` object it is handed and returns a derived value, never
// mutating `view` and never writing an event. This is what makes D1's
// "reconstructed fresh every time, never a persisted transcript" true —
// there is no stored "session" here, only a pure function of the current
// view plus the ask-time snapshot store.mjs/replay.mjs already fold into
// `view.gates[id].parentSnapshotAtAsk`.

// Materiality set for D3's "what changed" callout — deliberately just the
// two fields that exist and matter for anchoring today (plan.md Discovery:
// no `priority`/assignee field exists yet). Extending this list is the
// natural follow-up once such a field ships; not a gap in this slice.
const MATERIAL_FIELDS = ['title', 'status'];

/**
 * Compute the parent-anchored context for one work item (per D2/D3).
 *
 * Returns `null` when:
 * - `id` doesn't resolve to a work item in `view.work`;
 * - the item's status isn't `awaiting-human`;
 * - the item has no `parent`;
 * - the item's `parent` points at an id that no longer resolves in
 *   `view.work` (a dangling parent degrades to "no parent" — the same
 *   tolerance this schema already extends to dangling `parent`/
 *   `discoveredFrom` elsewhere, per work.mjs).
 *
 * Otherwise returns `{ parent: {id, title, status} }`, built from the
 * parent's CURRENT record in `view.work` (D2 — always live, never frozen
 * at ask time), plus an optional `changedSinceAsk` array.
 *
 * `changedSinceAsk` holds one `{field, from, to}` entry per material field
 * (`title`, `status`) whose current parent value differs — by exact string
 * inequality, no trim/normalize (a deliberate KISS choice, not a gap) —
 * from the value recorded in `view.gates[id]?.parentSnapshotAtAsk` at ask
 * time (D3). The key is present only when at least one field actually
 * changed. When there is no recorded snapshot at all (an item parked into
 * awaiting-human before this feature shipped, or with no parent to
 * snapshot at ask time), `changedSinceAsk` is omitted entirely — that is a
 * different state from "diffed and found nothing changed," and the two
 * must stay distinguishable by the key's presence, never by an
 * empty-but-present array standing in for "no baseline."
 *
 * @param {object} view - a folded view (replay.mjs's rebuildView/foldEvents shape)
 * @param {string} id - the work item id to compute context for
 * @returns {{ parent: { id: string, title: string, status: string }, changedSinceAsk?: Array<{ field: string, from: unknown, to: unknown }> } | null}
 */
export function computeAwaitingContext(view, id) {
  const item = view?.work?.[id];
  if (!item) return null;
  if (item.status !== 'awaiting-human') return null;
  if (!item.parent) return null;

  const parent = view?.work?.[item.parent];
  if (!parent) return null; // dangling parent id degrades to null, per D2

  const result = {
    parent: { id: parent.id, title: parent.title, status: parent.status },
  };

  const snapshot = view?.gates?.[id]?.parentSnapshotAtAsk;
  if (snapshot) {
    const changedSinceAsk = MATERIAL_FIELDS
      .filter((field) => snapshot[field] !== parent[field])
      .map((field) => ({ field, from: snapshot[field], to: parent[field] }));
    if (changedSinceAsk.length > 0) {
      result.changedSinceAsk = changedSinceAsk;
    }
  }

  return result;
}
