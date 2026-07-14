// fsm.mjs — transition table with precondition + CAS (per D3/D4).
//
// PURE: no fs import, no disk writes of any kind. This module only decides
// whether a transition is legal and, if so, RETURNS the validated event for
// the caller to append — disk writes belong to the store (cell
// phase-1-state-layer-4's store.mjs), never here.
//
// "done" is terminal, no-exit: no entry in TRANSITIONS has `from: 'done'`,
// so once a work item is done, every further transitionWork() call for it
// throws 'precondition'. Per D5, `done` now has TWO entries (two doors in,
// still zero doors out): `doing -> done` (an operator's direct hand-move)
// and `proposed -> done` (approval/merge of a worker's proposal). Neither
// is more canonical than the other — both are asserted by test.

import { STATUSES } from './work.mjs';

/** Error raised by this module. `category` is the CLI exit-code contract (R4). */
export class FsmError extends Error {
  constructor(category, message) {
    super(message);
    this.name = 'FsmError';
    this.category = category;
  }
}

// Re-exported so existing consumers (e.g. test/state/fsm.test.mjs) keep
// importing STATUSES from here; work.mjs is the sole owner of the list.
export { STATUSES };

// The transition table itself: every legal (from -> to) edge. `blocked` is
// two-way with both `todo` and `doing` per the plan; `done` has two incoming
// edges (from `doing` and, per D5, from `proposed`) and no outgoing edge
// (terminal). `proposed` (per D5) is entered only from `doing` (a worker's
// goal-check pass) and leaves either to `done` (approved/merged) or back to
// `todo` (rejected, with a reason — see transitionWork below); it is never a
// re-entry point for `doing` directly.
const TRANSITIONS = Object.freeze([
  Object.freeze({ from: 'todo', to: 'doing' }),
  Object.freeze({ from: 'doing', to: 'done' }),
  Object.freeze({ from: 'todo', to: 'blocked' }),
  Object.freeze({ from: 'doing', to: 'blocked' }),
  Object.freeze({ from: 'blocked', to: 'todo' }),
  Object.freeze({ from: 'blocked', to: 'doing' }),
  Object.freeze({ from: 'doing', to: 'proposed' }),
  Object.freeze({ from: 'proposed', to: 'done' }),
  Object.freeze({ from: 'proposed', to: 'todo' }),
]);

/**
 * Decide whether `work` can move to status `to`, and if so return the
 * validated event ready for the store to append — this function never
 * writes anything itself.
 *
 * CAS: when `expectedStatus` is supplied and does not match `work.status`,
 * refuse with category 'conflict' (never overwrite blindly) — checked
 * before the transition-table lookup, so a stale caller gets 'conflict'
 * rather than a possibly-coincidentally-true 'precondition'.
 *
 * Precondition: the (from, to) pair must exist in the transition table.
 * `from` is always the item's actual current status. An edge missing from
 * the table — including any edge out of `done`, or into an unknown status —
 * is refused with category 'precondition' and no event is returned.
 *
 * Rejection reason (per D5): the `proposed -> todo` edge is a rejection, and
 * carries a `reason` explaining why. `reason` is required for exactly this
 * edge — a missing or blank `reason` is refused with category 'validation'
 * (checked only after the edge itself is confirmed legal, so an illegal
 * edge still reports 'precondition' first). For every other edge, `reason`
 * is ignored and never appears in the returned event's payload.
 */
export function transitionWork({ work, to, expectedStatus, reason } = {}) {
  if (!work || typeof work !== 'object' || Array.isArray(work)) {
    throw new FsmError('precondition', 'transitionWork: "work" must be a work item object.');
  }
  if (typeof work.id !== 'string' || !work.id) {
    throw new FsmError('precondition', 'transitionWork: "work.id" must be a non-empty string.');
  }
  if (typeof to !== 'string' || !to) {
    throw new FsmError('precondition', 'transitionWork: "to" is required and must be a non-empty string.');
  }

  if (expectedStatus !== undefined && work.status !== expectedStatus) {
    throw new FsmError(
      'conflict',
      `transitionWork: expected status "${expectedStatus}" for work "${work.id}" but found "${work.status}" — refusing to overwrite blindly.`,
    );
  }

  const from = work.status;
  const allowed = TRANSITIONS.some((edge) => edge.from === from && edge.to === to);
  if (!allowed) {
    throw new FsmError(
      'precondition',
      `transitionWork: no transition from "${from}" to "${to}" for work "${work.id}".`,
    );
  }

  const payload = { id: work.id, from, to };
  if (from === 'proposed' && to === 'todo') {
    if (typeof reason !== 'string' || !reason.trim()) {
      throw new FsmError(
        'validation',
        `transitionWork: "reason" is required and must be a non-empty string when rejecting work "${work.id}" from proposed back to todo.`,
      );
    }
    payload.reason = reason.trim();
  }

  return { type: 'work.move', payload };
}
