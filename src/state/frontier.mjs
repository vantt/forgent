// frontier.mjs — derive the "ready to start" work items from a view (per D1
// Epic 2, A2 FIFO). PURE: no fs import, no side effects — this module only
// reads the `view` object it is handed (built by replay.mjs's `foldEvents`
// / `rebuildView`, or a literal view in tests) and returns a derived array.
// It never mutates `view` and never writes an event (the one exception is a
// diagnostic `console.warn` via domains.mjs on a genuinely unrecognized
// `item.domain` value — never a throw, see base-workflow-model D2/D3).
import { getDomain, stageForStep } from './domains.mjs';
//
// Ready = status 'todo' AND every dep's status is 'done' (per D5: done
// means "accepted into the main tree" — a dep sitting at 'proposed',
// 'doing', or 'blocked' does NOT unblock its dependents) AND stage at the
// item's own domain's Execute-mapped stage ('executing' for the 'coding'
// domain — per stage-clarify D1: an item still at stage `clarify` is not
// yet "ready to start" no matter its status — `fgos ready` would otherwise
// lie about items that have not passed context-discovery; domain-aware per
// base-workflow-model D2/D3, domains.mjs) AND no open descendant (per
// stage-decompose D4/D5: an item that was decomposed stays
// anchored — excluded from the frontier — for as long as any item reachable
// through the `parent` chain below it is not yet 'done'; this is a lineage
// filter DERIVED from `parent`, never `deps` — a child is never written into
// its parent's `deps`). `stage` is read lazily — `item.stage ?? <the item's
// domain's Execute stage>` (D8; domain-aware per base-workflow-model D2/D3)
// — so an item predating this field behaves exactly as before, and an
// item with no `parent` anywhere in the view is likewise never blocked by
// this filter (backward-compat). Frontier is a derived read (R5 — "derive,
// no danh sách tay"), never a stored list.
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
  const childrenByParent = indexChildrenByParent(work);
  const ready = [];
  for (const id of Object.keys(work)) {
    const item = work[id];
    if (item.status !== 'todo') continue;
    // Domain-aware per base-workflow-model D2/D3: an unrecognized
    // item.domain never throws here (domains.mjs's fail-safe) — it folds to
    // 'coding' with a diagnostic warning, so a corrupt/rolled-back domain
    // value can never wedge the frontier derive itself.
    const domain = getDomain(item.domain);
    const executeStage = stageForStep(domain, 'Execute');
    if ((item.stage ?? executeStage) !== executeStage) continue;
    if (hasOpenDescendant(id, work, childrenByParent)) continue;
    const depsReady = item.deps.every((dep) => work[dep]?.status === 'done');
    if (depsReady) ready.push(item);
  }
  return ready;
}

// Reverse index of `parent` -> direct children ids. Items with no `parent`
// field never contribute an entry, so a view with no lineage at all yields
// an empty index and `hasOpenDescendant` below short-circuits to `false` for
// every id — the exact no-op this filter must be on a parent-less log.
function indexChildrenByParent(work) {
  const index = {};
  for (const id of Object.keys(work)) {
    const parent = work[id].parent;
    if (!parent) continue;
    if (!index[parent]) index[parent] = [];
    index[parent].push(id);
  }
  return index;
}

// True when `id` has any descendant (direct child, or a descendant reachable
// through further `parent` chains below a child) whose status is not yet
// 'done'. `seen` guards against a malformed/cyclic parent chain turning this
// into an infinite walk — it never occurs on data produced by the decompose
// engine, only a defensive backstop.
function hasOpenDescendant(id, work, childrenByParent, seen = new Set()) {
  const children = childrenByParent[id];
  if (!children) return false;
  for (const childId of children) {
    if (seen.has(childId)) continue;
    seen.add(childId);
    const child = work[childId];
    if (!child) continue;
    if (child.status !== 'done') return true;
    if (hasOpenDescendant(childId, work, childrenByParent, seen)) return true;
  }
  return false;
}
