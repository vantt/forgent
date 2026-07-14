// frontier.mjs — derive the "ready to start" work items from a view (per D1
// Epic 2, A2 FIFO). PURE: no fs import, no side effects — this module only
// reads the `view` object it is handed (built by replay.mjs's `foldEvents`
// / `rebuildView`, or a literal view in tests) and returns a derived array.
// It never mutates `view` and never writes an event.
//
// Ready = status 'todo' AND every dep's status is 'done' (per D5: done
// means "accepted into the main tree" — a dep sitting at 'proposed',
// 'doing', or 'blocked' does NOT unblock its dependents). Frontier is a
// derived read (R5 — "derive, no danh sách tay"), never a stored list.
//
// FIFO order (per A2, cold-pickup reliance — deliberately spelled out, not
// left implicit):
//   - `view.work` is a plain object built by replay.mjs's `foldEvents`,
//     which assigns `view.work[item.id] = ...` in the order `work.add`
//     events are folded — i.e. declaration order.
//   - `work.move` (see replay.mjs) only ever does `item.status = to` on the
//     existing entry; it never deletes/re-inserts the key, so a status
//     change never moves an id's position in iteration order.
//   - Every work id is validated kebab-case, starting with a letter
//     (work.mjs ID_PATTERN) — never an all-digit / numeric-looking string —
//     so none of these keys fall into the "integer index" bucket the JS
//     spec special-cases (those would iterate in ascending numeric order
//     ahead of insertion-order string keys, which would silently break
//     FIFO). `Object.keys(view.work)` therefore always iterates in
//     declaration (insertion) order, which is what `frontier` relies on for
//     FIFO — it never sorts by id.
export function frontier(view) {
  const work = view?.work ?? {};
  const ready = [];
  for (const id of Object.keys(work)) {
    const item = work[id];
    if (item.status !== 'todo') continue;
    const depsReady = item.deps.every((dep) => work[dep]?.status === 'done');
    if (depsReady) ready.push(item);
  }
  return ready;
}
