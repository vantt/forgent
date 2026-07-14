// fsm.mjs — transition table with precondition + CAS (per D3/D4).
//
// PURE: no fs import, no disk writes of any kind. This module only decides
// whether a transition is legal and, if so, RETURNS the validated event for
// the caller to append — disk writes belong to the store (cell
// phase-1-state-layer-4's store.mjs), never here.
//
// "done" is terminal, single-door: exactly one entry in TRANSITIONS has
// `to: 'done'`, and no entry has `from: 'done'` — so once a work item is
// done, every further transitionWork() call for it throws 'precondition'.

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
// two-way with both `todo` and `doing` per the plan; `done` only has an
// incoming edge (from `doing`) and no outgoing edge (terminal).
const TRANSITIONS = Object.freeze([
  Object.freeze({ from: 'todo', to: 'doing' }),
  Object.freeze({ from: 'doing', to: 'done' }),
  Object.freeze({ from: 'todo', to: 'blocked' }),
  Object.freeze({ from: 'doing', to: 'blocked' }),
  Object.freeze({ from: 'blocked', to: 'todo' }),
  Object.freeze({ from: 'blocked', to: 'doing' }),
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
 */
export function transitionWork({ work, to, expectedStatus } = {}) {
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

  return { type: 'work.move', payload: { id: work.id, from, to } };
}
