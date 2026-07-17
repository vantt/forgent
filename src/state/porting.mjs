// porting.mjs — transition table with precondition + CAS for the distillery
// porting domain (per distillery-state-consumer D1(D5)/D3).
//
// PURE: no fs import, no disk writes of any kind. This module only decides
// whether a transition is legal and, if so, RETURNS the validated event for
// the caller to append — disk writes belong to the store
// (porting-store.mjs), never here. Mirrors fsm.mjs's separation of concerns,
// but this is a SIBLING module: it shares zero lines with fsm.mjs/work.mjs
// and does not import from them (D5 — porting is its own domain, not a
// generalization of the work-item FSM).
//
// Scope is the `Status` column only (D3) — `Score`/`Local`/`Đích`/`Commit`/
// `Ghi chú` stay free-form metadata attached to a porting record, never
// modeled here.
//
// Terminal states (ported, adapted, rejected) are single-door-in, zero-door-
// out, same discipline as fsm.mjs's `done`: no entry in TRANSITIONS has
// `from` equal to any of them. No reopen/un-reject edge exists (out of scope
// per D3 — Agent's Discretion did not extend the CoS to a resurrection path).

/** The full flat status domain for a porting record. */
export const STATUSES = ['candidate', 'planned', 'in-progress', 'ported', 'adapted', 'rejected'];

/** Error raised by this module. `category` is the CLI exit-code contract (R4). */
export class PortingError extends Error {
  constructor(category, message) {
    super(message);
    this.name = 'PortingError';
    this.category = category;
  }
}

// The transition table: every legal (from -> to) edge. `candidate -> rejected`
// is an escape hatch alongside the documented linear chain (Discovery L1:
// porting-log.md's `bvr-viewer-frontend-stack` row is rejected straight from
// candidate, never having passed through planned/in-progress). `ported`,
// `adapted`, and `rejected` are terminal — zero outgoing edges.
const TRANSITIONS = Object.freeze([
  Object.freeze({ from: 'candidate', to: 'planned' }),
  Object.freeze({ from: 'candidate', to: 'rejected' }),
  Object.freeze({ from: 'planned', to: 'in-progress' }),
  Object.freeze({ from: 'in-progress', to: 'ported' }),
  Object.freeze({ from: 'in-progress', to: 'adapted' }),
  Object.freeze({ from: 'in-progress', to: 'rejected' }),
]);

/**
 * Decide whether `porting` can move to status `to`, and if so return the
 * validated event ready for the store to append — this function never
 * writes anything itself.
 *
 * CAS: when `expectedStatus` is supplied and does not match
 * `porting.status`, refuse with category 'conflict' (never overwrite
 * blindly) — checked before the transition-table lookup, so a stale caller
 * gets 'conflict' rather than a possibly-coincidentally-true 'precondition'.
 *
 * Precondition: the (from, to) pair must exist in the transition table.
 * `from` is always the record's actual current status. An edge missing from
 * the table — including any edge out of a terminal state, or into an
 * unknown status — is refused with category 'precondition' and no event is
 * returned.
 */
export function transitionPorting({ porting, to, expectedStatus } = {}) {
  if (!porting || typeof porting !== 'object' || Array.isArray(porting)) {
    throw new PortingError('precondition', 'transitionPorting: "porting" must be a porting record object.');
  }
  if (typeof porting.id !== 'string' || !porting.id) {
    throw new PortingError('precondition', 'transitionPorting: "porting.id" must be a non-empty string.');
  }
  if (typeof to !== 'string' || !to) {
    throw new PortingError('precondition', 'transitionPorting: "to" is required and must be a non-empty string.');
  }

  if (expectedStatus !== undefined && porting.status !== expectedStatus) {
    throw new PortingError(
      'conflict',
      `transitionPorting: expected status "${expectedStatus}" for porting "${porting.id}" but found "${porting.status}" — refusing to overwrite blindly.`,
    );
  }

  const from = porting.status;
  const allowed = TRANSITIONS.some((edge) => edge.from === from && edge.to === to);
  if (!allowed) {
    throw new PortingError(
      'precondition',
      `transitionPorting: no transition from "${from}" to "${to}" for porting "${porting.id}".`,
    );
  }

  return { type: 'porting.move', payload: { id: porting.id, from, to } };
}
