// status-fsm.mjs — transition table with precondition + CAS (per D3/D4).
//
// PURE: no fs import, no disk writes of any kind. This module only decides
// whether a transition is legal and, if so, RETURNS the validated event for
// the caller to append — disk writes belong to the store (cell
// phase-1-state-layer-4's store.mjs), never here.
//
// "done" is terminal, no-exit: no entry in TRANSITIONS has `from: 'done'`,
// so once a work item is done, every further transitionWork() call for it
// throws 'precondition'. Per work-item-status-delivered-retrospective-
// cleanup D1/D2 (superseding D5's original two-door shape), `done` now has
// exactly ONE door in — `cleanup -> done` — reached only after a sequential
// chain: `delivered` (code accepted into the main tree — the earlier,
// narrower meaning `done` always informally carried for RUL12's
// dependent-open) -> `retrospective` (batched learning synthesis,
// formerly the `compound-learn` stage) -> `cleanup` (TTL-bounded
// worktree-reclaim park). `doing -> done` and `awaiting-approval -> done`
// no longer exist; they are replaced by `doing -> delivered` and
// `awaiting-approval -> delivered`.
//
// fsm-wontfix-terminal-status D1/D2/D3/D4: `wontfix` is a SECOND terminal
// state alongside `done` — for an item deliberately closed without being
// built (superseded, duplicate, admin decision), as opposed to `done`'s
// "actually completed". Three doors in — `blocked -> wontfix`,
// `todo -> wontfix`, `doing -> wontfix` (D3, mirroring how `awaiting-human`
// already enters from both `todo` and `doing`, plus `blocked`) — and zero
// doors out (D4, symmetric with `done`; a wrongly-closed item is revived by
// filing a new item that references the old one via `refs`, not by
// reopening this edge). No `reason` is mechanically required to enter
// `wontfix`, the same shape as plain `todo -> blocked`/`doing -> blocked`
// (as opposed to `awaiting-approval -> todo`/`awaiting-approval -> blocked`, which do
// require one) — the closure reason is expected in the item's decision
// log (D2), not enforced here.
//
// async-human-gate D1/D3/D5: `awaiting-human` is a single generic park
// state, entered from either `todo` or `doing` (the two states an item can
// hold before parking) and left through exactly one exit, back to `todo`
// (resume makes the item actionable again; no `awaiting-human -> doing`
// edge — YAGNI, add only if a real consumer needs it).
//
// fan-out-parallel D18: `blocked -> awaiting-approval` is a door out of
// `blocked` alongside `blocked -> todo` (tsk-40m retired the third,
// `blocked -> doing` — see that edge's own removal comment in the
// TRANSITIONS table below). It exists for fan-out-parallel's drift reconcile (CONTEXT.md
// D7/D8/D11): a root parked via `awaiting-approval -> blocked` (reason
// `integration-drift`) after a clean catch-up + re-verify needs to return to
// `awaiting-approval` directly, without re-entering `doing`. Re-entering `doing`
// would wrongly count as an anti-loop visit — `visitCount` in
// `runner/anti-loop.mjs` counts any `work.move` event whose `payload.to` is
// `'doing'`, and a mechanical reconcile retry is not the kind of rework that
// counter is meant to bound. Like the other plain `blocked` edges, this one
// carries no `reason`/`ask`/`answer` — it is not a rejection (that's
// `awaiting-approval -> todo`/`awaiting-approval -> blocked`, which do require `reason`).

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

// The transition table itself: every legal (from -> to) edge. `blocked` has
// three doors out now — `todo` per the plan, `awaiting-approval` per
// fan-out-parallel D18 (see the doc comment above), and `delivered`
// (work-item-status-delivered-retrospective-cleanup D2: a mechanical retry
// door, mirroring `blocked -> awaiting-approval`'s own shape exactly — no
// `reason`, not a rejection) for an item parked via `cleanup -> blocked`
// that just needs its retrospective/cleanup retried, not real rework
// (rework instead goes out through the existing `blocked -> todo` door —
// tsk-40m retired the `blocked -> doing` door this comment used to name
// alongside it; see that edge's own removal comment in the table below).
// `awaiting-approval` (per D5) is entered from `todo`/`doing` directly
// (tsk-40m: settleClaim settles a claim straight through, no durable
// intermediate `doing`) or, per fan-out-parallel D18, from `blocked` (a
// mechanical reconcile), and leaves to `delivered`
// (approved/merged — work-item-status-delivered-retrospective-cleanup D1,
// superseding the old direct `-> done` edge), back to `todo` (rejected,
// with a reason — see transitionWork below), or, per pr-lifecycle D3, to
// `blocked` (an approved proposal whose merge conflicted or whose verify
// came back red on main after merge — the item parks with a reason rather
// than being silently returned to the queue or auto-rebased; a human
// resolves it, same as any other `blocked` item, via the existing
// `blocked -> todo`/`blocked -> awaiting-approval`/
// `blocked -> delivered` doors below). It is never a re-entry point for
// `doing` directly.
//
// `delivered -> retrospective -> cleanup -> done` (work-item-status-
// delivered-retrospective-cleanup D1/D2/D10) is a strictly sequential
// chain — no parallel branches, no skip edges. `cleanup -> blocked`
// (D2/D8, `reason` required — mirrors `awaiting-approval -> blocked`'s own
// shape exactly) is the one way out on a failed final harness check (e.g.
// the merge no longer resolves on main, or retrospective never actually
// produced real content); `blocked -> delivered` above is how a
// mechanical retry re-enters this chain.
const TRANSITIONS = Object.freeze([
  // work-item-backlog-status D1: `backlog` (an idea not yet committed to
  // work) has exactly one door out, to `todo`, and zero doors in — an item
  // is created at `backlog` or never reaches it. Plain edge, no
  // `reason`/`ask`/`answer`, same shape as `blocked -> todo` below; D1
  // settled that only a human fires it, and `role` is attribution-only
  // here (never an ACL — see transitionWork), so "human-only" is enforced
  // the way every other human-only edge in this codebase already is: the
  // CLI verb that exposes the edge stamps `role: 'human'`, not this table.
  Object.freeze({ from: 'backlog', to: 'todo' }),
  // tsk-40m (docs/architect/doing-coordination-redesign.md, design target
  // confirmed 2026-08-25): the direct edge settleClaim (store.mjs) now
  // needs to settle a fresh (`todo`-preClaim) claim straight through to
  // `awaiting-approval` with NO durable intermediate `work.move(->doing)`
  // — the whole point of this redesign. `todo -> doing` and
  // `blocked -> doing` (both present in an earlier round of this same
  // item) are RETIRED, not kept: nothing durably writes INTO `doing`
  // anymore, not even settleClaim's own settle segment — `doing` is
  // derived purely from the active-claim overlay (D1) or read from a
  // durable value written before this migration (D6's own accepted
  // backward-compat fallback), never newly written. `doing -> todo` (and
  // every other `doing -> *` edge below) stays: it is still the real door
  // settleClaim's legacy fallback (a pre-migration item durably 'doing',
  // no active runtime claim) settles a GENUINELY OLD durable-doing item
  // through — this new edge is for a FRESH claim that was never durably
  // `doing` at all.
  Object.freeze({ from: 'todo', to: 'awaiting-approval' }),
  Object.freeze({ from: 'todo', to: 'blocked' }),
  Object.freeze({ from: 'doing', to: 'blocked' }),
  Object.freeze({ from: 'blocked', to: 'todo' }),
  Object.freeze({ from: 'blocked', to: 'awaiting-approval' }),
  Object.freeze({ from: 'blocked', to: 'delivered' }),
  Object.freeze({ from: 'doing', to: 'awaiting-approval' }),
  // Claim release (claim-lock §3b): originally fired by the clarify/
  // decompose -> executing boundary handing a held pick claim back to
  // `todo` the moment the item was ready for its executing phase
  // (resolvePlan's `releaseClaimOnExecuting`) — silent, no `reason`
  // required, mirroring `blocked -> todo`'s own no-reason shape immediately
  // above. tsk-40m D5 retired that specific trigger (a runtime claim now
  // stays active, unreleased, straight through clarify->executing).
  // `latestTodoReleaseTrigger` (claim-port.mjs) still reads the historical
  // `releaseTrigger: 'claim-lock-3b'` marker off pre-migration event log
  // entries. This edge (and every other `doing -> *` edge here) stays live
  // ONLY for settleClaim's legacy fallback settling a genuinely
  // pre-migration durable-`doing` item — new code must never reach it any
  // other way (see the `todo -> awaiting-approval` edge's own comment
  // above for why `todo -> doing`/`blocked -> doing` are retired instead
  // of kept alongside it).
  Object.freeze({ from: 'doing', to: 'todo' }),
  // work-item-status-delivered-retrospective-cleanup D1: `delivered`
  // replaces `done` as the direct target of both close doors — RUL58's
  // acceptance-evidence gate (store.mjs's moveWork) now runs on every
  // entry into `delivered`, not `done`.
  Object.freeze({ from: 'doing', to: 'delivered' }),
  Object.freeze({ from: 'awaiting-approval', to: 'delivered' }),
  Object.freeze({ from: 'awaiting-approval', to: 'todo' }),
  Object.freeze({ from: 'awaiting-approval', to: 'blocked' }),
  // work-item-status-delivered-retrospective-cleanup D1/D2/D10: the
  // sequential post-delivery chain. `retrospective` is where the
  // (formerly `compound-learn`-stage) batched learning synthesis runs;
  // `cleanup` is the TTL-bounded worktree-reclaim park; `cleanup -> done`
  // is `done`'s one remaining door in, gated by the harness in D8 (not
  // this table). `cleanup -> blocked` (D8) is the one way out of the
  // chain on a failed final check.
  Object.freeze({ from: 'delivered', to: 'retrospective' }),
  Object.freeze({ from: 'retrospective', to: 'cleanup' }),
  Object.freeze({ from: 'cleanup', to: 'done' }),
  Object.freeze({ from: 'cleanup', to: 'blocked' }),
  Object.freeze({ from: 'todo', to: 'awaiting-human' }),
  Object.freeze({ from: 'doing', to: 'awaiting-human' }),
  Object.freeze({ from: 'awaiting-human', to: 'todo' }),
  // Claim-lock resume (str-clarify-decompose-claim-lock §5.1), tsk-40m P1
  // fix + hard-cut RETIRED this edge entirely (docs/architect/doing-
  // coordination-redesign.md): a claim active at ask-time now resumes via
  // the `todo` edge above instead (its own preClaimStatus matches durable
  // status again, so buildEffectiveView's overlay shows 'doing' again on
  // its own — no durable write of 'doing' anywhere), and `putInAwaiting`
  // durably settles a claimed item DIRECTLY from its preClaimStatus into
  // `awaiting-human` (via settleClaim), releasing the claim in that same
  // write — never leaving one to silently resume through this edge later.
  // A genuinely legacy pre-migration item whose durable status really was
  // 'doing' at ask-time can still ENTER awaiting-human (the `doing ->
  // awaiting-human` edge below stays) but never resumes back to 'doing' —
  // answerAwaiting clamps that case to `todo` (store.mjs's own comment),
  // matching the hard-cut discipline every other retired `-> doing` edge
  // in this table follows: nothing durably writes INTO `doing`, ever,
  // full stop, not even for old data.
  // fsm-wontfix-terminal-status D1/D3: three doors into the second
  // terminal state, zero doors out (see header comment above).
  Object.freeze({ from: 'blocked', to: 'wontfix' }),
  Object.freeze({ from: 'todo', to: 'wontfix' }),
  Object.freeze({ from: 'doing', to: 'wontfix' }),
  // tsk-2ub: a fourth door -- awaiting-human is a park-for-question state
  // with no committed work either way, the same shape D3 already covered
  // for todo/doing. Without this edge, closing a question that became
  // moot required fabricating an `answer` just to reach todo first, an
  // intentionally-wrong permanent log entry. delivered/retrospective/
  // cleanup/done are deliberately NOT given this door: those are
  // past-completion states where the work already happened, which
  // `wontfix` ("valid, never going to be done") does not fit.
  Object.freeze({ from: 'awaiting-human', to: 'wontfix' }),
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
 * Rejection reason (per D5): the `awaiting-approval -> todo` edge is a rejection, and
 * carries a `reason` explaining why. Per pr-lifecycle D3, `awaiting-approval -> blocked`
 * (an approved proposal whose merge or post-merge verify failed) carries the
 * same `reason` requirement — the concrete failure, so a human resolving the
 * park knows what broke. Per work-item-status-delivered-retrospective-
 * cleanup D2/D8, `cleanup -> blocked` (the final harness check failed —
 * merge no longer resolves on main, or retrospective never produced real
 * content) carries the same requirement, same reasoning. `reason` is
 * required for exactly these three edges — a missing or blank `reason` is
 * refused with category 'validation' (checked only after the edge itself
 * is confirmed legal, so an illegal edge still reports 'precondition'
 * first). For every other edge, `reason` is ignored and never appears in
 * the returned event's payload.
 *
 * Human-gate ask/answer (per async-human-gate D2/D5), mirroring the `reason`
 * mechanism above: entering `awaiting-human` (`todo -> awaiting-human` or
 * `doing -> awaiting-human`) requires a non-empty `ask` explaining what the
 * gate is waiting for; leaving it (`awaiting-human -> *`, either back to
 * `todo` or, per claim-lock §5.1, resuming to `doing`) requires a non-empty
 * `answer`. Both are refused with category 'validation' when missing or
 * blank (checked only after the edge itself is confirmed legal). `ask`/
 * `answer` are ignored and never appear in the payload for any other edge,
 * exactly like `reason`.
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
    // tsk-2ub: name a remedy, mirroring cursor.mjs's own error-states-a-
    // remedy pattern, instead of only naming the illegal edge.
    const validTargets = TRANSITIONS.filter((edge) => edge.from === from).map((edge) => edge.to);
    const remedy = validTargets.length > 0
      ? ` -- valid targets from "${from}" are: ${validTargets.join(', ')}`
      : ` -- "${from}" is a terminal status with no outgoing transitions`;
    throw new FsmError(
      'precondition',
      `transitionWork: no transition from "${from}" to "${to}" for work "${work.id}".${remedy}`,
    );
  }

  const payload = { id: work.id, from, to };
  const reasonRequired =
    (from === 'awaiting-approval' && to === 'todo') ||
    (from === 'awaiting-approval' && to === 'blocked') ||
    (from === 'cleanup' && to === 'blocked');
  if (reasonRequired) {
    if (typeof reason !== 'string' || !reason.trim()) {
      throw new FsmError(
        'validation',
        `transitionWork: "reason" is required and must be a non-empty string when moving work "${work.id}" from "${from}" to "${to}".`,
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
    const lines = ask.split(/\r?\n/);
    const sections = { context: [], whyThisMatters: [] };
    let currentSection = null;
    for (const line of lines) {
      const headingMatch = line.match(/^\s*#+\s+(.+)$/);
      if (headingMatch) {
        const headingText = headingMatch[1].trim().toLowerCase();
        if (/^context\b/i.test(headingText)) {
          currentSection = 'context';
        } else if (/^why\s+this\s+matters\b/i.test(headingText)) {
          currentSection = 'whyThisMatters';
        } else {
          currentSection = null;
        }
      } else if (currentSection) {
        sections[currentSection].push(line);
      }
    }
    const missing = [];
    if (sections.context.join('\n').trim().length < 20) {
      missing.push('## Context');
    }
    if (sections.whyThisMatters.join('\n').trim().length < 20) {
      missing.push('## Why this matters');
    }
    if (missing.length > 0) {
      throw new FsmError(
        'validation',
        `transitionWork: "ask" for work "${work.id}" must contain structurally complete Markdown headings with at least 20 characters of content under each. Missing or incomplete: ${missing.join(', ')}.`,
      );
    }
    payload.ask = ask.trim();
  }

  if (from === 'awaiting-human') {
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
