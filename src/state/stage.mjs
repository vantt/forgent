// stage.mjs — stage transition table with precondition + CAS (per
// stage-clarify D1/D3/D8/D10/D12). Mirrors fsm.mjs's transitionWork exactly,
// one level up: `stage` is the macro lifecycle dimension (clarify ->
// executing -> ...), `status` (fsm.mjs) stays the micro dimension untouched.
//
// PURE: no fs import, no disk writes. This module only decides whether a
// stage transition is legal and, if so, RETURNS the validated event for the
// store to append — disk writes belong to store.mjs, never here.
//
// Three edges exist today: `clarify -> executing` (D12), plus
// `clarify -> decompose` and `decompose -> executing` (stage-decompose
// D2/D4/D5) for the chia-việc stage that now sits between clarify and
// executing. stage-decompose cell 3 retargeted the discovery engine
// (discovery.mjs) onto `clarify -> decompose`, so no caller uses the first
// edge anymore (grep-verified) — it is kept, legal but dormant, rather than
// removed: deleting it would also require editing test/state/stage.test.mjs
// (its own edge-count/precondition assertions), a file outside this cell's
// reserved scope. A dormant legal edge is harmless; deleting it is a
// follow-up for whichever cell next touches this file's test scope.

import { FsmError } from './fsm.mjs';

// Re-exported for consumers that want the stage error type under this
// module's own name, mirroring fsm.mjs's re-export of STATUSES from work.mjs.
export { FsmError };

// The transition table: `clarify -> executing` (D12) stays until cell 3
// retargets clarify-pass onto `decompose`; the other two edges (per
// stage-decompose D2/D4/D5) carry an item through chia-việc.
const STAGE_TRANSITIONS = Object.freeze([
  Object.freeze({ from: 'clarify', to: 'executing' }),
  Object.freeze({ from: 'clarify', to: 'decompose' }),
  Object.freeze({ from: 'decompose', to: 'executing' }),
]);

/**
 * Decide whether `work` can move to stage `to`, and if so return the
 * validated event ready for the store to append — this function never
 * writes anything itself.
 *
 * `from` is read lazily (per D8): `work.stage ?? 'executing'`, since a work
 * item with no `stage` field at all is treated as already `executing`.
 *
 * CAS: when `expectedStage` is supplied and does not match the item's
 * (lazily-read) current stage, refuse with category 'conflict' — checked
 * before the transition-table lookup, same order as fsm.mjs's
 * transitionWork.
 *
 * Precondition: the (from, to) pair must exist in STAGE_TRANSITIONS. Any
 * other pair (including the reverse edge, or a same-stage no-op) is refused
 * with category 'precondition' and no event is returned.
 *
 * `verify` (per D10): when supplied, rides on the SAME event as the stage
 * move — the store's fold sets `item.verify` alongside `item.stage` from
 * one event, so a clarify-pass never leaves a window where the item is
 * `executing` with a stale/placeholder verify. Not validated for content at
 * this layer (that is the discovery engine's concern) — only carried
 * through when present.
 */
export function transitionStage({ work, to, expectedStage, verify } = {}) {
  if (!work || typeof work !== 'object' || Array.isArray(work)) {
    throw new FsmError('precondition', 'transitionStage: "work" must be a work item object.');
  }
  if (typeof work.id !== 'string' || !work.id) {
    throw new FsmError('precondition', 'transitionStage: "work.id" must be a non-empty string.');
  }
  if (typeof to !== 'string' || !to) {
    throw new FsmError('precondition', 'transitionStage: "to" is required and must be a non-empty string.');
  }

  const from = work.stage ?? 'executing';

  if (expectedStage !== undefined && from !== expectedStage) {
    throw new FsmError(
      'conflict',
      `transitionStage: expected stage "${expectedStage}" for work "${work.id}" but found "${from}" — refusing to overwrite blindly.`,
    );
  }

  const allowed = STAGE_TRANSITIONS.some((edge) => edge.from === from && edge.to === to);
  if (!allowed) {
    throw new FsmError(
      'precondition',
      `transitionStage: no stage transition from "${from}" to "${to}" for work "${work.id}".`,
    );
  }

  const payload = { id: work.id, from, to };
  if (verify !== undefined) {
    payload.verify = verify;
  }

  return { type: 'work.stage', payload };
}
