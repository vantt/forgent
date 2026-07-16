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
//
// async-human-gate D1/D3/D5: `awaiting-human` is a single generic park
// state, entered from either `todo` or `doing` (the two states an item can
// hold before parking) and left through exactly one exit, back to `todo`
// (resume makes the item actionable again; no `awaiting-human -> doing`
// edge — YAGNI, add only if a real consumer needs it).

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
// goal-check pass) and leaves to `done` (approved/merged), back to `todo`
// (rejected, with a reason — see transitionWork below), or, per pr-lifecycle
// D3, to `blocked` (an approved proposal whose merge conflicted or whose
// verify came back red on main after merge — the item parks with a reason
// rather than being silently returned to the queue or auto-rebased; a human
// resolves it, same as any other `blocked` item, via the existing
// `blocked -> todo`/`blocked -> doing` doors below). It is never a re-entry
// point for `doing` directly.
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
  Object.freeze({ from: 'proposed', to: 'blocked' }),
  Object.freeze({ from: 'todo', to: 'awaiting-human' }),
  Object.freeze({ from: 'doing', to: 'awaiting-human' }),
  Object.freeze({ from: 'awaiting-human', to: 'todo' }),
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
 * carries a `reason` explaining why. Per pr-lifecycle D3, `proposed -> blocked`
 * (an approved proposal whose merge or post-merge verify failed) carries the
 * same `reason` requirement — the concrete failure, so a human resolving the
 * park knows what broke. `reason` is required for exactly these two edges —
 * a missing or blank `reason` is refused with category 'validation' (checked
 * only after the edge itself is confirmed legal, so an illegal edge still
 * reports 'precondition' first). For every other edge, `reason` is ignored
 * and never appears in the returned event's payload.
 *
 * Human-gate ask/answer (per async-human-gate D2/D5), mirroring the `reason`
 * mechanism above: entering `awaiting-human` (`todo -> awaiting-human` or
 * `doing -> awaiting-human`) requires a non-empty `ask` explaining what the
 * gate is waiting for; leaving it (`awaiting-human -> todo`) requires a
 * non-empty `answer`. Both are refused with category 'validation' when
 * missing or blank (checked only after the edge itself is confirmed legal).
 * `ask`/`answer` are ignored and never appear in the payload for any other
 * edge, exactly like `reason`.
 */
export function transitionWork({ work, to, expectedStatus, reason, ask, answer } = {}) {
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
  if ((from === 'proposed' && to === 'todo') || (from === 'proposed' && to === 'blocked')) {
    if (typeof reason !== 'string' || !reason.trim()) {
      throw new FsmError(
        'validation',
        `transitionWork: "reason" is required and must be a non-empty string when moving work "${work.id}" from proposed to "${to}".`,
      );
    }
    payload.reason = reason.trim();
  }

  if (to === 'awaiting-human') {
    if (typeof ask !== 'string' || !ask.trim()) {
      throw new FsmError(
        'validation',
        `transitionWork: "ask" is required and must be a non-empty string when moving work "${work.id}" into awaiting-human.`,
      );
    }
    payload.ask = ask.trim();
  }

  if (from === 'awaiting-human' && to === 'todo') {
    if (typeof answer !== 'string' || !answer.trim()) {
      throw new FsmError(
        'validation',
        `transitionWork: "answer" is required and must be a non-empty string when resuming work "${work.id}" from awaiting-human.`,
      );
    }
    payload.answer = answer.trim();
  }

  return { type: 'work.move', payload };
}
