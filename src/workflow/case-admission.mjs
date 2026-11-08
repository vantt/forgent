// src/workflow/case-admission.mjs — may this proposed activity run now? A pure answer over recorded state
// Architecture guard: MUST NOT import src/state/** or src/runner/coordination/** (A4 boundary)
//
// The agent (or the Playbook proposer) proposes; this decides whether the proposal is allowed against
// the projection of the case, the binding answers of the worktrees it would write, and the live
// reservations. Nothing here reads a file, a lock or the clock. A refusal is an answer for the proposer
// that names every hard rule the proposal breaks; it is not a question for the owner.

import crypto from 'node:crypto';
import { RIGOR_ORDER } from './guide-schema.mjs';
import { canonicalizeWrites, writeScopesOverlap } from '../runner/dispatch/write-scope.mjs';

// The refusals that mean "what this admission stood on is no longer true". Frame, route and overlap
// answers belong to the moment of admission and are not asked again.
const RECHECK_CODES = new Set([
  'consent-stale', 'consent-missing', 'consent-subject-unknown',
  'entry-milestone-stale', 'entry-milestone-unmet', 'entry-milestone-blocked',
  'milestone-not-reached', 'receipt-stale', 'receipt-missing',
  'independence-not-encapsulated', 'independence-blind-handoff',
]);

/**
 * Whether the consent, entry milestones and receipts a live reservation was admitted on still hold for
 * the subjects as they are now. Asked just before a writing round is committed.
 *
 * @param {object} input
 * @param {object} input.projection `projectCase` of the ledger with the current subject digests applied
 * @param {object} input.reservation the live reservation
 * @returns {object[] | null} the violations that no longer hold, or null when all still do
 */
export function recheckReservation({ projection, reservation }) {
  const others = projection.liveReservations.filter((r) => r.reservationId !== reservation.reservationId);
  const verdict = admitProposal({
    projection: { ...projection, frame: null, liveReservations: others },
    proposal: {
      activity: reservation.activity,
      writes: reservation.writes,
      worktree: reservation.worktree ?? undefined,
      blind: reservation.blind === true,
      reason: 'recheck',
    },
    bindingAnswers: reservation.worktree ? { [reservation.worktree]: { answer: 'bound' } } : {},
    reservationId: reservation.reservationId,
  });
  if (!verdict.refused) return null;
  const broken = verdict.refused.violations.filter((v) => RECHECK_CODES.has(v.code));
  return broken.length > 0 ? broken : null;
}

/** A fresh reservation id; kept out of the predicate so that stays pure. */
export function newReservationId() {
  return `rsv-${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}`;
}

const listed = (routes, id) => routes.some((route) => route === id || route.startsWith(`${id} `));

function producersOf(guide, milestoneId) {
  return guide.activities.filter((a) => a.produces.includes(milestoneId));
}

/** Activities whose result the given activity builds on, directly or through the milestones it needs. */
function ancestorsOf(guide, activity) {
  const seen = new Set();
  const walk = (a) => {
    for (const milestone of a.entry) {
      for (const producer of producersOf(guide, milestone)) {
        if (seen.has(producer.id)) continue;
        seen.add(producer.id);
        walk(producer);
      }
    }
  };
  walk(activity);
  return seen;
}

/** Whether `activity` comes after milestone `id`: it needs it, or builds on an activity that produces it. */
function isDownstream(guide, activity, id) {
  if (activity.entry.includes(id)) return true;
  const ancestors = ancestorsOf(guide, activity);
  return producersOf(guide, id).some((producer) => ancestors.has(producer.id));
}

function routeKindOf({ guide, projection, activity, proposal }) {
  const governing = projection.routePoints.filter((point) => point.open
    && (proposal.decisionPoint === undefined || proposal.decisionPoint === point.at)
    && (listed(point.should, activity.id) || listed(point.mayInstead, activity.id) || activity.entry.includes(point.at)));
  if (projection.kind === 'playbook' && proposal.proposer === 'playbook') {
    // The Playbook proposer is the guide's single SHOULD among the eligible activities.
    return { kind: 'should', governing };
  }
  // Running the activity under another pattern than the one it declares leaves the listed routes.
  const declaredPattern = activity.unit?.pattern;
  if (typeof declaredPattern === 'string' && typeof proposal.pattern === 'string' && proposal.pattern !== declaredPattern) {
    return { kind: 'unlisted', governing, swappedFrom: declaredPattern };
  }
  if (governing.some((point) => listed(point.should, activity.id))) return { kind: 'should', governing };
  if (governing.some((point) => listed(point.mayInstead, activity.id))) return { kind: 'may-instead', governing };
  return { kind: governing.length > 0 ? 'unlisted' : 'eligible', governing };
}

const violation = (code, rule, condition, milestone) => ({ code, rule, condition, ...(milestone ? { milestone } : {}) });

/** Guard 1, entry: a write needs a write-effect activity, and every milestone the activity needs holds for the subject as it is now. */
function guardEntry({ projection, activity, writes, writing }) {
  const violations = [];
  if (writing && activity.effects !== 'writes') {
    violations.push(violation('activity-has-no-write-effect', 'guide', `activity "${activity.id}" is declared without write effects, so it may not be given writes [${writes.join(', ')}]`));
  }
  for (const id of activity.entry) {
    const m = projection.milestones[id];
    if (m?.state === 'achieved') continue;
    if (m?.state === 'stale') violations.push(violation('entry-milestone-stale', 'milestone-reached', `milestone "${id}" was reached for another version of its subject (${m.reason ?? 'the subject changed'}); reach it again`, id));
    else if (m?.state === 'blocked') violations.push(violation('entry-milestone-blocked', 'milestone-reached', `milestone "${id}" waits for an answer: ${m.question}`, id));
    else violations.push(violation('entry-milestone-unmet', 'milestone-reached', `milestone "${id}" is not reached`, id));
  }
  return violations;
}

/** Guard 2, the guide's MUST rows, each by the one check it names. */
function guardMustRows({ projection, proposal, guide, activity, writing }) {
  const violations = [];
  const add = (...args) => violations.push(violation(...args));
  for (const row of guide.must) {
    const milestone = row.subject ? projection.milestones[row.subject] : undefined;
    switch (row.guard) {
      case 'milestone-reached':
        if (writing && !activity.produces.includes(row.subject) && milestone?.state !== 'achieved') {
          add('milestone-not-reached', row.id, `rule "${row.id}": milestone "${row.subject}" must be reached (now ${milestone?.state ?? 'unknown'}) before a writing activity`, row.subject);
        }
        break;
      case 'human-consent':
        if (writing && isDownstream(guide, activity, row.subject)) {
          if (milestone?.state === 'stale' && milestone.reason === 'current-digest-unknown') {
            add('consent-subject-unknown', row.id, `rule "${row.id}": what "${row.subject}" approved cannot be read now, so the approval cannot be compared`, row.subject);
          } else if (milestone?.state === 'stale') {
            add('consent-stale', row.id, `rule "${row.id}": the approval of "${row.subject}" was for another version (approved ${milestone.prior}, now ${milestone.current}); it needs a new approval`, row.subject);
          } else if (milestone?.state !== 'achieved' || milestone.consent !== true) {
            add('consent-missing', row.id, `rule "${row.id}": "${row.subject}" has no approval from a gate answer; nothing a worker wrote counts`, row.subject);
          }
        }
        break;
      case 'verify-receipt':
        if (!activity.entry.includes(row.subject) && isDownstream(guide, activity, row.subject) && milestone?.state !== 'achieved') {
          add(milestone?.state === 'stale' ? 'receipt-stale' : 'receipt-missing', row.id, `rule "${row.id}": "${row.subject}" needs a verify receipt for its current subject (now ${milestone?.state ?? 'unknown'})`, row.subject);
        }
        break;
      case 'independence-blind':
        if (activity.produces.includes(row.subject)) {
          if (proposal.blind !== true) add('independence-not-encapsulated', row.id, `rule "${row.id}": seats that produce "${row.subject}" must run as blind seats of one pattern or wave`);
          const earlier = (proposal.handoffRefs ?? []).filter((ref) => {
            const owner = projection.blindUnitRuns.get(/^unit-run:([^/]+)/.exec(ref)?.[1]);
            return owner !== undefined && producersOf(guide, row.subject).some((a) => a.id === owner);
          });
          if (earlier.length > 0) add('independence-blind-handoff', row.id, `rule "${row.id}": this dispatch is handed the output of blind seats (${earlier.join(', ')}) that must stay unread by the later ones`);
        }
        break;
      default:
        // frame-allowance and write-scope-isolation are checked below for every proposal;
        // platform guards are enforced where they live.
        break;
    }
  }
  return violations;
}

/** Guard 3, write scope: writes are disjoint from every live reservation of the case. */
function guardWriteScope({ projection, writes, writing }) {
  if (!writing) return [];
  return projection.liveReservations
    .filter((other) => (other.writes ?? []).length > 0 && writeScopesOverlap(writes, other.writes))
    .map((other) => violation('writes-overlap', 'write-scope-isolation', `writes [${writes.join(', ')}] can touch the same path as reservation ${other.reservationId} (activity ${other.activity}, writes [${other.writes.join(', ')}]); scopes are compared by their literal leading segments, so narrow an entry if the two are disjoint`));
}

/** Guard 4, binding: a writing dispatch runs in a worktree that is this case's (unbound or already bound to it). */
function guardBinding({ proposal, bindingAnswers, writing }) {
  if (!writing) return [];
  if (!proposal.worktree) return [violation('writes-need-worktree', 'binding', 'a writing dispatch names the worktree it runs in')];
  const answered = bindingAnswers[proposal.worktree];
  if (!answered) return [violation('binding-unresolved', 'binding', `no binding answer for worktree ${proposal.worktree}`)];
  if (answered.answer === 'unbound' || answered.answer === 'bound') return [];
  return [violation(answered.answer, 'binding', `worktree ${proposal.worktree}: ${answered.answer}${answered.record?.caseId ? ` (case ${answered.record.caseId})` : ''}`)];
}

/** Guard 5, frame: counters reserved before the dispatch; an unknown remainder refuses the next writing dispatch. */
function guardFrame({ projection, proposal, writing }) {
  const frame = projection.frame;
  if (!frame) return [];
  const violations = [];
  const add = (...args) => violations.push(violation(...args));
  const left = projection.frameRemaining;
  if (left.dispatches === 0) add('frame-exhausted', 'frame-allowance', 'the approved frame has no dispatch left');
  if (writing) {
    if (left.dispatches === null || left.mutatingDispatches === null) add('frame-remaining-unknown', 'frame-allowance', 'what is left of the frame is not known (a count was left to the approver), so a writing dispatch is not admitted');
    else if (left.mutatingDispatches === 0) add('frame-exhausted', 'frame-allowance', 'the approved frame has no writing dispatch left');
  }
  const perDispatch = left.seatLaunchesPerDispatch;
  if (perDispatch !== null) {
    if (proposal.seatLaunches == null) {
      if (writing) add('frame-remaining-unknown', 'frame-allowance', 'the seat launches this dispatch plans are not known, so a writing dispatch is not admitted');
    } else if (proposal.seatLaunches > perDispatch) {
      add('seat-launch-ceiling-exceeded', 'frame-allowance', `the dispatch plans ${proposal.seatLaunches} seat launches; the frame allows ${perDispatch} per dispatch`);
    } else if (left.fallbackPerSeat === null && writing) {
      add('frame-remaining-unknown', 'frame-allowance', 'the fallback allowance per seat was left to the approver, so a writing dispatch is not admitted');
    }
  }
  if (proposal.rigor && RIGOR_ORDER.includes(frame.rigorFloor) && RIGOR_ORDER.indexOf(proposal.rigor) >= 0
    && RIGOR_ORDER.indexOf(proposal.rigor) < RIGOR_ORDER.indexOf(frame.rigorFloor)) {
    add('rigor-below-floor', 'frame-allowance', `rigor ${proposal.rigor} is below the frame's floor ${frame.rigorFloor}`);
  }
  return violations;
}

/**
 * Guard 6, route: listed routes are named as such; the way outside the list needs a reason and is refused
 * where the point lists routes only. Every guard above still applies to it.
 */
function guardRoute({ projection, proposal, activity, routeKind, governing, swappedFrom }) {
  if (routeKind !== 'unlisted') return [];
  const violations = [];
  const where = swappedFrom !== undefined
    ? `"${activity.id}" declares pattern "${swappedFrom}" and this run uses "${proposal.pattern}"`
    : `"${activity.id}" is not a listed route at ${governing.map((p) => p.at).join(', ')}`;
  if (!proposal.reason || !String(proposal.reason).trim()) violations.push(violation('route-reason-required', 'route', `${where}; say why`));
  const strict = governing.filter((point) => point.listedRoutesOnly);
  if (strict.length > 0) violations.push(violation('unlisted-route-refused', 'route', `${swappedFrom !== undefined ? where : `"${activity.id}" is not a listed route`} and ${strict.map((p) => p.at).join(', ')} lists routes only`));
  if (projection.frameRemaining.deviationsBeforeAsk === 0) violations.push(violation('deviation-limit-reached', 'frame-allowance', 'the frame allows no further deviation before asking the owner'));
  return violations;
}

/**
 * @param {object} input
 * @param {object} input.projection `projectCase` of the ledger, with the current subject digests applied
 * @param {object} input.proposal
 * @param {string} input.proposal.activity
 * @param {string} [input.proposal.unitId]
 * @param {string} [input.proposal.decisionPoint] the decision point the choice is made at
 * @param {string} [input.proposal.pattern] the pattern the run will use; one other than the activity's declared pattern is an unlisted route
 * @param {string} [input.proposal.reason] why, when the route is not a listed one
 * @param {string[]} [input.proposal.writes] repo-relative write scope; empty for a read-only dispatch
 * @param {string} [input.proposal.worktree] the worktree a writing dispatch runs in
 * @param {boolean} [input.proposal.blind] the dispatch is encapsulated blind seats
 * @param {string[]} [input.proposal.handoffRefs] `unit-run:<id>/<role>` refs the dispatch is handed
 * @param {string} [input.proposal.rigor]
 * @param {number | null} [input.proposal.seatLaunches] seat launches the dispatch plans before any fallback (seats per round times rounds); null when not known
 * @param {string} [input.proposal.unitRunId] the Unit run the reservation is for, when it is already minted
 * @param {'playbook' | 'agent'} [input.proposal.proposer]
 * @param {Record<string, { answer: string, record?: object }>} [input.bindingAnswers] by worktree path
 * @param {string} input.reservationId
 * @param {string} [input.now] ISO time recorded on the events
 * @returns {{ reservation: object, events: object[] } | { refused: object }}
 */
export function admitProposal({ projection, proposal, bindingAnswers = {}, reservationId, now = new Date().toISOString() }) {
  const guide = projection.guide;
  const refuse = (violations) => ({ refused: { code: violations[0].code, condition: violations[0].condition, violations } });
  if (!guide) return refuse([violation('no-guide', 'guide', 'the case has no guide to admit against')]);
  if (!projection.open) return refuse([violation('case-closed', 'case', 'the case is closed; no activity is admitted into it')]);
  const activity = guide.activities.find((a) => a.id === proposal.activity);
  if (!activity) return refuse([violation('unknown-activity', 'guide', `the guide has no activity "${proposal.activity}"`)]);

  const writes = canonicalizeWrites(proposal.writes ?? []);
  const { kind: routeKind, governing, swappedFrom } = routeKindOf({ guide, projection, activity, proposal });
  const ctx = { projection, proposal, guide, activity, writes, writing: writes.length > 0, bindingAnswers, routeKind, governing, swappedFrom };
  const violations = [guardEntry, guardMustRows, guardWriteScope, guardBinding, guardFrame, guardRoute].flatMap((guard) => guard(ctx));
  if (violations.length > 0) return refuse(violations);

  const left = projection.frameRemaining;
  // The ceiling handed to the Unit: planned launches times the fallback allowance of a seat.
  const seatLaunchCeiling = projection.frame && proposal.seatLaunches != null && left.fallbackPerSeat !== null ? proposal.seatLaunches * left.fallbackPerSeat : null;
  const reservation = {
    reservationId,
    activity: activity.id,
    unitId: proposal.unitId ?? null,
    writes,
    worktree: proposal.worktree ?? null,
    counters: { dispatches: 1, mutatingDispatches: ctx.writing ? 1 : 0 },
    seatLaunchCeiling,
    blind: proposal.blind === true,
    unitRunId: proposal.unitRunId ?? null,
    createdAt: now,
  };
  return {
    reservation,
    events: [
      {
        type: 'route',
        payload: {
          decisionPoint: governing[0]?.at ?? null,
          activity: activity.id,
          unitId: proposal.unitId ?? null,
          routeKind,
          ...(proposal.reason ? { reason: proposal.reason } : {}),
          ...(proposal.claimedRoute ? { claimedRoute: proposal.claimedRoute } : {}),
          guideVersion: projection.guideRef?.sha256 ?? null,
          reservationId,
        },
      },
      { type: 'reservation', payload: reservation },
    ],
  };
}
