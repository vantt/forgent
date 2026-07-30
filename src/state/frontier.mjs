// frontier.mjs — derive the "ready to start" work items from a view (per D1
// Epic 2, A2 FIFO). PURE: no fs import, no side effects — this module only
// reads the `view` object it is handed (built by replay.mjs's `foldEvents`
// / `rebuildView`, or a literal view in tests) and returns a derived array.
// It never mutates `view` and never writes an event (the one exception is a
// diagnostic `console.warn` via domains.mjs on a genuinely unrecognized
// `item.domain` value — never a throw, see base-workflow-model D2/D3).
import { getDomain, stageForStep } from './workflow-stage-graphs.mjs';
//
// Ready = status 'todo' AND every dep's status is RESOLVED (per D5: 'done'
// means "accepted into the main tree" — a dep sitting at 'awaiting-approval',
// 'doing', or 'blocked' does NOT unblock its dependents; per
// wontfix-terminal-status-filter-consistency D1, a dep at 'wontfix' DOES
// unblock its dependents — abandoned, nothing further will ever land for
// it, so waiting on it forever would be a silent permanent deadlock) AND
// stage at the
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
// TIE-BREAK CONTRACT (work-graph-intelligence S4, bumped to v2 by
// str7-str8-priority-intent D2). `frontier(view)` is the single, versioned
// surface that decides claim order: the order it returns IS the order the
// runner claims and dispatches in (consumers `readyWork` in store.mjs and
// `steerFrontier` in the runner take this order as given, never re-sorting).
// `FRONTIER_ORDER_VERSION` names that order so a change to it is deliberate
// and visible, never an accidental reorder of a cold-pickup-critical
// invariant.
//
//   - v1 (superseded): the SOLE ordering key was FIFO by `work.add`
//     declaration order — exactly the insertion-order iteration argued for
//     in the header comment above. No priority, no intent, no re-sort.
//   - v2 (current, per D1/D2/D6): three ordering keys, applied in order —
//     (1) `priority` ASCENDING, absent-last (an item with no `priority`
//     sorts strictly after every item that has one, regardless of the
//     latter's magnitude); (2) among ties on (1), `intent` DESCENDING, same
//     absent-last bucketing; (3) among ties on (1) and (2), declaration
//     order — the v1 tie-break, preserved for free by
//     `Array.prototype.sort`'s spec-guaranteed stability on Node >=18 (this
//     repo's engines requirement): a comparator that returns 0 once both
//     keys tie never reorders those items relative to each other, so no
//     third key is hand-written here.
//
// A view where no item has `priority` or `intent` set produces the exact v1
// order (every comparison short-circuits both absent-last branches to a tie,
// i.e. "keep declaration order") — v2 is a strict backward-compatible
// superset of v1, not a behavior change for existing data.
export const FRONTIER_ORDER_VERSION = 2;

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
    const depsReady = item.deps.every((dep) => RESOLVED_STATUSES.has(work[dep]?.status));
    if (depsReady) ready.push(item);
  }
  ready.sort(compareReadyOrder);
  return ready;
}

// v2 comparator (D2/D6): priority ASC absent-last, then intent DESC
// absent-last, then declaration order — the last key falls out of
// Array.prototype.sort's guaranteed stability (see header comment above),
// so returning 0 on a full tie is the entire tie-break, not an omission.
function compareReadyOrder(a, b) {
  if (a.priority !== b.priority) {
    if (a.priority === undefined) return 1;
    if (b.priority === undefined) return -1;
    return a.priority - b.priority;
  }
  if (a.intent !== b.intent) {
    if (a.intent === undefined) return 1;
    if (b.intent === undefined) return -1;
    return b.intent - a.intent;
  }
  return 0;
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

// A status is RESOLVED when nothing further will ever happen to an item
// holding it — the FSM's two terminal states (fsm.mjs: zero outgoing
// edges from either): 'done' (actually built) and, per
// fsm-wontfix-terminal-status D1/D4, 'wontfix' (deliberately closed
// without being built, symmetric with 'done'). Exported so every other
// consumer that needs "is this item resolved enough to stop counting it
// as open" (deps-readiness in this module's own `depsReady`, plus
// claim-port.mjs/impact.mjs/graph-metrics.mjs/entropy.mjs — see
// wontfix-terminal-status-filter-consistency D1/D2/D3) shares this one
// two-element set instead of six separate ad-hoc re-declarations.
export const RESOLVED_STATUSES = new Set(['done', 'wontfix']);

// True when `id` has any descendant (direct child, or a descendant reachable
// through further `parent` chains below a child) whose status is not yet
// RESOLVED. `seen` guards against a malformed/cyclic parent chain turning
// this into an infinite walk — it never occurs on data produced by the
// decompose engine, only a defensive backstop.

function hasOpenDescendant(id, work, childrenByParent, seen = new Set()) {
  const children = childrenByParent[id];
  if (!children) return false;
  for (const childId of children) {
    if (seen.has(childId)) continue;
    seen.add(childId);
    const child = work[childId];
    if (!child) continue;
    if (!RESOLVED_STATUSES.has(child.status)) return true;
    if (hasOpenDescendant(childId, work, childrenByParent, seen)) return true;
  }
  return false;
}
