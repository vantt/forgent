// step-fsm.mjs — Work step transition decision with precondition + CAS.
// Mirrors status-fsm.mjs's transitionWork one level up: `workflowStep` is the
// macro lifecycle dimension (which step of its domain's Workflow a Work item is
// at), `status` (status-fsm.mjs) stays the micro dimension, untouched.
//
// PURE: no fs import, no disk writes. This module only decides whether a step
// move is legal and, if so, RETURNS the validated event for the store to
// append — disk writes belong to store.mjs, never here. The one side effect it
// can perform is a diagnostic `console.warn` on a genuinely unrecognized
// `work.domain` value — never a throw.
//
// The legal moves are the `transitions` of the Work item's Workflow definition
// (domains/<domain>/workflows/*.yaml); this file holds none of its own.

import { FsmError } from './status-fsm.mjs';
import { DEFAULT_DOMAIN, getDomain, effectiveStep, isLegalStepMove } from './domain-registry.mjs';

export { FsmError };

/**
 * Decide whether `work` can move to step `to`, and if so return the validated
 * event ready for the store to append — this function never writes anything.
 *
 * `from` is read lazily: the item's recorded `workflowStep`, or its domain's
 * execute-phase step when none was ever recorded, so a Work item with no step at
 * all is treated as already at that step.
 *
 * CAS: when `expectedStep` is supplied and does not match the item's current
 * step, refuse with category 'conflict' — checked before the transition lookup,
 * same order as status-fsm.mjs's transitionWork.
 *
 * Precondition: the (from, to) pair must be one of the Workflow's transitions.
 * Any other pair (the reverse edge, or a same-step no-op) is refused with
 * category 'precondition' and no event is returned.
 *
 * `verify`: when supplied, rides on the SAME event as the move — the fold sets
 * `item.verify` alongside `item.workflowStep` from one event, so a discovery pass
 * never leaves a window where the item is at its execute step with a stale
 * placeholder verify. Not validated for content here (the discovery engine's
 * concern) — only carried through when present.
 */
export function transitionStep({ work, to, expectedStep, verify } = {}) {
  if (!work || typeof work !== 'object' || Array.isArray(work)) {
    throw new FsmError('precondition', 'transitionStep: "work" must be a work item object.');
  }
  if (typeof work.id !== 'string' || !work.id) {
    throw new FsmError('precondition', 'transitionStep: "work.id" must be a non-empty string.');
  }
  if (typeof to !== 'string' || !to) {
    throw new FsmError('precondition', 'transitionStep: "to" is required and must be a non-empty string.');
  }

  const domain = getDomain(work.domain, {
    onUnrecognized: (bad) =>
      console.warn(
        `fgos: work "${work.id}" has unrecognized domain "${bad}" — folding to "${DEFAULT_DOMAIN}" for its step transition.`,
      ),
  });
  const from = effectiveStep(work, domain);

  if (expectedStep !== undefined && from !== expectedStep) {
    throw new FsmError(
      'conflict',
      `transitionStep: expected step "${expectedStep}" for work "${work.id}" but found "${from}" — refusing to overwrite blindly.`,
    );
  }

  if (!isLegalStepMove(domain, work.kind, from, to)) {
    throw new FsmError(
      'precondition',
      `transitionStep: no step transition from "${from}" to "${to}" for work "${work.id}".`,
    );
  }

  const payload = { id: work.id, from, to };
  if (verify !== undefined) {
    payload.verify = verify;
  }

  return { type: 'work.step', payload };
}
