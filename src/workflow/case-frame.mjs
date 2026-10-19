// src/workflow/case-frame.mjs — a nested case spends its parent's frame, as its own short section on the parent
// Architecture guard: MUST NOT import src/state/** or src/runner/coordination/** (A4 boundary)
//
// The caller takes the parent's `advance`, calls `reserveParentFrame`, and releases it; only then does the
// child case open. A child that cannot open calls `refundParentFrame` in a section of its own. Two
// `advance` holds are never held in one scope. Both calls are idempotent on the reservation id.

import { RunnerConfigError } from '../runner/dispatch/config.mjs';
import { projectCase } from './case-projection.mjs';
import { appendWorkflowEvent, readWorkflowEvents } from './store.mjs';

/**
 * Charge a nested case's counters to the parent's frame.
 *
 * @param {object} params
 * @param {string} params.mainRoot
 * @param {string} params.parentCaseId
 * @param {object} params.hold the parent's `advance` hold
 * @param {string} params.reservationId id of this charge; a second call with the same id changes nothing
 * @param {string} params.childRef what is being opened (the child case id or the wave it stands for)
 * @param {{ dispatches: number, mutatingDispatches?: number }} params.counters
 * @returns {{ reserved: true, reservationId: string, already?: true } | { refused: { code: string, condition: string } }}
 */
export function reserveParentFrame({ mainRoot, parentCaseId, hold, reservationId, childRef, counters }) {
  const events = readWorkflowEvents({ repoRoot: mainRoot, workflowRunId: parentCaseId });
  if (events.some((e) => e.type === 'reservation' && e.payload?.reservationId === reservationId)) {
    return { reserved: true, reservationId, already: true };
  }
  const projection = projectCase(events);
  if (!projection.open) return { refused: { code: 'case-closed', condition: 'the parent case is closed' } };
  const need = { dispatches: counters.dispatches, mutatingDispatches: counters.mutatingDispatches ?? 0 };
  const left = projection.frameRemaining;
  if (projection.frame) {
    if (left.dispatches === null || (need.mutatingDispatches > 0 && left.mutatingDispatches === null)) {
      return { refused: { code: 'frame-remaining-unknown', condition: 'what is left of the parent frame is not known' } };
    }
    if (left.dispatches < need.dispatches || (need.mutatingDispatches > 0 && left.mutatingDispatches < need.mutatingDispatches)) {
      return { refused: { code: 'frame-exhausted', condition: `the parent frame has ${left.dispatches} dispatches left, the nested case needs ${need.dispatches}` } };
    }
  }
  appendWorkflowEvent({
    repoRoot: mainRoot,
    workflowRunId: parentCaseId,
    hold,
    event: {
      type: 'reservation',
      payload: { reservationId, activity: null, unitId: null, nested: { childRef }, writes: [], worktree: null, counters: need, seatLaunchCeiling: null, unitRunId: null },
    },
  });
  return { reserved: true, reservationId };
}

/** Give a nested case's charge back to the parent. Does nothing when the charge was already settled or refunded. */
export function refundParentFrame({ mainRoot, parentCaseId, hold, reservationId }) {
  const events = readWorkflowEvents({ repoRoot: mainRoot, workflowRunId: parentCaseId });
  if (!events.some((e) => e.type === 'reservation' && e.payload?.reservationId === reservationId)) {
    throw new RunnerConfigError(`parent case "${parentCaseId}" has no reservation "${reservationId}" to refund`);
  }
  if (events.some((e) => e.type === 'settle' && e.payload?.reservationId === reservationId)) return { refunded: false, already: true };
  appendWorkflowEvent({
    repoRoot: mainRoot,
    workflowRunId: parentCaseId,
    hold,
    event: { type: 'settle', payload: { reservationId, outcome: 'refunded', receipts: [], achieved: [], seatLaunchesUsed: 0 } },
  });
  return { refunded: true };
}
