// frontier.mjs — derive the "ready to start" work items from a view (per D1
// Epic 2, A2 FIFO). PURE: no fs import, no side effects — this module only
// reads the `view` object it is handed (built by replay.mjs's `foldEvents`
// / `rebuildView`, or a literal view in tests) and returns a derived array.
// It never mutates `view` and never writes an event (the one exception is a
// diagnostic `console.warn` via workflow-stage-graphs.mjs on a genuinely unrecognized
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
// base-workflow-model D2/D3, workflow-stage-graphs.mjs) AND no open descendant (per
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

// `step` (tsk-19j D9, generalized for fgos-coding-driving's own loop):
// which domain step counts as "ready to start" — defaults to `'Execute'`
// (every pre-existing caller, unparameterized, gets byte-identical
// behavior). A driver loop wanting the frontier for an earlier step (e.g.
// `'Clarify'`/`'Divide'`, mirroring discover-loop/planning-loop's own
// pools) passes it explicitly; `isDepsAndLineageReady` below already covers
// the stage-independent half of readiness this parameterizes the stage half
// of.
export function frontier(view, { step = 'Execute' } = {}) {
  const work = view?.work ?? {};
  const childrenByParent = indexChildrenByParent(work);
  const ready = [];
  for (const id of Object.keys(work)) {
    const item = work[id];
    if (!isTodoStatus(item)) continue;
    // Domain-aware per base-workflow-model D2/D3: an unrecognized
    // item.domain never throws here (workflow-stage-graphs.mjs's fail-safe) — it folds to
    // 'coding' with a diagnostic warning, so a corrupt/rolled-back domain
    // value can never wedge the frontier derive itself.
    const domain = getDomain(item.domain);
    const executeStage = stageForStep(domain, step);
    // A domain that never maps `step` at all (e.g. `synthetic` has no
    // Clarify/Divide, only Execute -> `assembling`) has NO item ready for
    // it, full stop -- guarded separately from the `??` fallback below,
    // which would otherwise wrongly admit an item with no `stage` field at
    // all (undefined ?? undefined === undefined, a false tie).
    if (executeStage === undefined) continue;
    if ((item.stage ?? executeStage) !== executeStage) continue;
    if (hasOpenDescendant(id, work, childrenByParent)) continue;
    const depsReady = item.deps.every((dep) => isResolvedStatus(work[dep]));
    if (depsReady) ready.push(item);
  }
  ready.sort(compareReadyOrder);
  return ready;
}

// Union of `frontier(view, {step})` across multiple steps (tsk-4so D1,
// docs/history/execution-fanout/CONTEXT-tsk-4so.md): a footprint-overlap
// advisory that only ever looks at one step is structurally blind to two
// items at DIFFERENT steps sharing a footprint — the real gap this exists
// to close (tsk-1ug at `decompose` vs tsk-4fg/tsk-59x at `executing`, all
// three declaring the same file, `fgos conflicts` reporting zero pairs).
// Dedupes by id: an item with no `stage` field matches EVERY step's
// `executeStage` fallback (`item.stage ?? executeStage` above), so without
// dedup it would appear once per step in `steps` instead of once overall.
// Re-sorts the deduped set once with `compareReadyOrder` — concatenating
// three already-sorted arrays would NOT preserve `FRONTIER_ORDER_VERSION`'s
// priority/intent ordering across the combined set. PURE: same read-only
// contract as `frontier`.
export function frontierAcrossSteps(view, steps = ['Clarify', 'Divide', 'Execute']) {
  const seen = new Map();
  for (const step of steps) {
    for (const item of frontier(view, { step })) {
      if (!seen.has(item.id)) seen.set(item.id, item);
    }
  }
  return [...seen.values()].sort(compareReadyOrder);
}

// True when `item` is at the front-segment "not yet started" bucket (per
// decision record 0027, D2/D3: statusCategory 'todo') — used by the `ready`
// filter above so a domain that relabels its "not started" status away from
// the literal string 'todo' is still picked up correctly (frontier.mjs:92
// row of 0027's own audit table). Reads `item.statusCategory` when present;
// falls back to the literal `item.status === 'todo'` comparison when it is
// NOT present (an item written before tsk-38t-2 stamped this field at all,
// or an item whose domain declares no `statusLabels` at all, e.g.
// `synthetic`/`triage` today) — this is a fallback to the pre-existing
// field, never a derive-on-read of the category table itself (which
// platform-foundations.md's L3 forbids, see STATUS_CATEGORIES's own doc
// comment in work.mjs), so it stays safe under replay-from-zero.
function isTodoStatus(item) {
  if (item.statusCategory !== undefined) return item.statusCategory === 'todo';
  return item.status === 'todo';
}

// Stage-independent readiness (choke-point-take-vs-pick-claim-eligibility):
// the same deps-done + no-open-descendant clauses `frontier` enforces,
// minus its stage clause — for a caller that intentionally wants to claim
// an item still at `clarify`/`decompose` (status and stage are independent
// axes, status-fsm.mjs; the same stance `pick`'s explicit-`--id` branch already
// takes) while still refusing a genuinely-blocked item (unmet dep, or
// anchored by an open decomposed child) — those two reasons stay real
// "not dispatchable" regardless of stage.
export function isDepsAndLineageReady(view, id) {
  const work = view?.work ?? {};
  const item = work[id];
  if (!item) return false;
  const childrenByParent = indexChildrenByParent(work);
  if (hasOpenDescendant(id, work, childrenByParent)) return false;
  return item.deps.every((dep) => isResolvedStatus(work[dep]));
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
export function indexChildrenByParent(work) {
  const index = {};
  for (const id of Object.keys(work)) {
    const parent = work[id].parent;
    if (!parent) continue;
    if (!index[parent]) index[parent] = [];
    index[parent].push(id);
  }
  return index;
}

// An item is RESOLVED when nothing further will happen to it that could
// still change the CODE/graph state a dependent or lineage check cares
// about. Per decision record 0027 (D1/D2, `docs/decisions/0027-domain-so-
// huu-status-doan-truoc-delivered-supersede-base-workflow-model-d1-d3.md`)
// this is now a HYBRID read, not a flat literal Set, because the 10
// statuses split into two groups with different rules (0027's own audit,
// §"Hệ quả 1 chi tiết", `docs/history/phase-2-status-category-schema/
// DISCUSSION.md` §6):
//   - the FOUR tail-segment statuses (`delivered`/`retrospective`/
//     `cleanup`/`done`) never get relabeled by any domain (D1) — literal
//     status is sufficient for them forever, checked first below;
//   - `wontfix` is a front-segment, domain-OWNED label that always maps to
//     `statusCategory: 'canceled'` (D2) — a domain that relabels it (e.g.
//     `declined`) must still be recognized as resolved, which a literal
//     `'wontfix'` string match could never do. Reading `item.statusCategory
//     === 'canceled'` instead is the whole point of this migration
//     (tsk-38t-4): every domain-agnostic consumer that used to `.has()` a
//     flat Set now calls `isResolvedStatus(item)` (the WHOLE item, not just
//     a status string — reading category needs the item) instead.
// `item.statusCategory` is frozen at write time only (store.mjs's
// addWork/moveWork) and NEVER derived on read (platform-foundations.md's L3
// — see STATUS_CATEGORIES's own doc comment, work.mjs) — an item written
// before tsk-38t-2 landed this field, or whose domain declares no
// `statusLabels` at all (`synthetic`/`triage` today), carries no
// `statusCategory`. For those, this falls back to the literal `'wontfix'`
// string — the ONLY front-segment status this set has ever recognized —
// so pre-migration data keeps replaying exactly as before (never a
// derive-on-read of the category table itself, only a fallback to the
// pre-existing `status` field, the same lazy-default shape every other
// optional-additive field in this codebase already uses).
//
// `fgos rollup`'s progress-reporting count is a SEPARATE mechanism and
// intentionally does NOT share this function — it still counts strict
// `done` only. Exported so every other consumer that needs "is this item
// resolved enough to stop counting it as open" (deps-readiness in this
// module's own `depsReady`/`isDepsAndLineageReady`, plus claim-port.mjs/
// impact.mjs/graph-metrics.mjs/entropy.mjs/graph-harness.mjs/
// drift-status.mjs — see wontfix-terminal-status-filter-consistency D1/D2/D3
// and 0027's own audit §2) shares this one function instead of separate
// ad-hoc re-declarations.
const TAIL_RESOLVED_STATUSES = new Set(['delivered', 'retrospective', 'cleanup', 'done']);
const LEGACY_CANCELED_STATUS = 'wontfix';

/** The canceled-only half of `isResolvedStatus` below, extracted (tsk-4bh)
 * for a caller that needs to tell "abandoned, never had content" apart from
 * "successfully resolved" — `isResolvedStatus` itself treats both as
 * equally fine to stop waiting on (deps-readiness, frontier lineage), but
 * `cleanup-harness.mjs`'s own merge-still-resolves ancestry check needs the
 * opposite split: skip a canceled/wontfix child entirely (it never had
 * content to merge, so there is nothing to check), while STILL verifying a
 * `done`/`delivered` child's recorded sha really is an ancestor (that
 * verification is the whole point of the check — `isResolvedStatus` alone
 * would wrongly skip it too). Never returns true for a tail-resolved status
 * (`done`/`delivered`/`retrospective`/`cleanup`) — those are the opposite
 * case this function exists to distinguish. */
export function isCanceledStatus(item) {
  if (!item) return false;
  if (TAIL_RESOLVED_STATUSES.has(item.status)) return false;
  if (item.statusCategory !== undefined) return item.statusCategory === 'canceled';
  return item.status === LEGACY_CANCELED_STATUS;
}

export function isResolvedStatus(item) {
  if (!item) return false;
  if (TAIL_RESOLVED_STATUSES.has(item.status)) return true;
  return isCanceledStatus(item);
}

/**
 * Resolve the root of the lineage tree `id` belongs to: walk `view.work[id].parent`
 * upward until reaching an item with no `parent` (or whose `parent` does not
 * resolve to a known item), and return THAT item's id. An item with no
 * `parent` is its own root and resolves to itself.
 *
 * Defensive backstop, mirroring `hasOpenDescendant` below: a `seen` set
 * guards against a cyclic or malformed parent chain turning this into an
 * infinite walk. Should not occur on real decompose-produced data — if a
 * cycle is detected, the walk stops and returns the current id rather than
 * looping forever.
 *
 * Lives here rather than in `runner/root-affinity.mjs` (its original home,
 * tsk-49i D1): it is a pure read over the same `view.work` parent chain the
 * rest of this module walks, and `state/` modules needing it had to import
 * across into `runner/` to get it — one of the import edges that made the
 * two folders mutually dependent.
 *
 * @param {{work: Record<string, {parent?: string|null}>}} view
 * @param {string} id
 * @returns {string}
 */
export function resolveRoot(view, id) {
  const work = view?.work ?? {};
  const seen = new Set();
  let current = id;
  while (true) {
    if (seen.has(current)) return current;
    seen.add(current);
    const item = work[current];
    const parent = item?.parent;
    if (!parent || !work[parent]) return current;
    current = parent;
  }
}

// True when `id` has any descendant (direct child, or a descendant reachable
// through further `parent` chains below a child) whose status is not yet
// RESOLVED. `seen` guards against a malformed/cyclic parent chain turning
// this into an infinite walk — it never occurs on data produced by the
// decompose engine, only a defensive backstop.

export function hasOpenDescendant(id, work, childrenByParent, seen = new Set()) {
  const children = childrenByParent[id];
  if (!children) return false;
  for (const childId of children) {
    if (seen.has(childId)) continue;
    seen.add(childId);
    const child = work[childId];
    if (!child) continue;
    if (!isResolvedStatus(child)) return true;
    if (hasOpenDescendant(childId, work, childrenByParent, seen)) return true;
  }
  return false;
}
