// src/workflow/case-admission.mjs — may this proposed activity run now? A pure answer over recorded state
// Architecture guard: MUST NOT import src/state/** or src/runner/coordination/** (A4 boundary)
//
// The agent (or the Playbook proposer) proposes; this decides whether the proposal is allowed against
// the projection of the case, the binding answers of the worktrees it would write, and the live
// reservations. Nothing here reads a file, a lock or the clock. A refusal is an answer for the proposer
// that names every hard rule the proposal breaks; it is not a question for the owner.

import crypto from 'node:crypto';
import { RIGOR_ORDER } from './case-projection.mjs';
import { canonicalizeWrites, writeScopesOverlap } from '../runner/dispatch/write-scope.mjs';

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
  if (governing.some((point) => listed(point.should, activity.id))) return { kind: 'should', governing };
  if (governing.some((point) => listed(point.mayInstead, activity.id))) return { kind: 'may-instead', governing };
  return { kind: governing.length > 0 ? 'unlisted' : 'eligible', governing };
}

/**
 * @param {object} input
 * @param {object} input.projection `projectCase` of the ledger, with the current subject digests applied
 * @param {object} input.proposal
 * @param {string} input.proposal.activity
 * @param {string} [input.proposal.unitId]
 * @param {string} [input.proposal.decisionPoint] the decision point the choice is made at
 * @param {string} [input.proposal.reason] why, when the route is not a listed one
 * @param {string[]} [input.proposal.writes] repo-relative write scope; empty for a read-only dispatch
 * @param {string} [input.proposal.worktree] the worktree a writing dispatch runs in
 * @param {boolean} [input.proposal.blind] the dispatch is encapsulated blind seats
 * @param {string[]} [input.proposal.handoffRefs] `unit-run:<id>/<role>` refs the dispatch is handed
 * @param {string} [input.proposal.rigor]
 * @param {number | null} [input.proposal.seatLaunchCeiling] launches the dispatch may spend; null when not known
 * @param {'playbook' | 'agent'} [input.proposal.proposer]
 * @param {Record<string, { answer: string, record?: object }>} [input.bindingAnswers] by worktree path
 * @param {string} input.reservationId
 * @param {string} [input.now] ISO time recorded on the events
 * @returns {{ reservation: object, events: object[], bindings: Array<{ worktree: string, action: 'create' | 'have' }> } | { refused: object }}
 */
export function admitProposal({ projection, proposal, bindingAnswers = {}, reservationId, now = new Date().toISOString() }) {
  const guide = projection.guide;
  const refuse = (violations) => ({ refused: { code: violations[0].code, condition: violations[0].condition, violations } });
  if (!guide) return refuse([{ code: 'no-guide', rule: 'guide', condition: 'the case has no guide to admit against' }]);
  if (!projection.open) return refuse([{ code: 'case-closed', rule: 'case', condition: 'the case is closed; no activity is admitted into it' }]);
  const activity = guide.activities.find((a) => a.id === proposal.activity);
  if (!activity) return refuse([{ code: 'unknown-activity', rule: 'guide', condition: `the guide has no activity "${proposal.activity}"` }]);

  const violations = [];
  const add = (code, rule, condition) => violations.push({ code, rule, condition });
  const writes = canonicalizeWrites(proposal.writes ?? []);
  const writing = writes.length > 0;

  if (writing && activity.effects !== 'writes') {
    add('activity-has-no-write-effect', 'guide', `activity "${activity.id}" is declared without write effects, so it may not be given writes [${writes.join(', ')}]`);
  }

  // Entry: every milestone the activity needs holds for the subject as it is now.
  for (const id of activity.entry) {
    const m = projection.milestones[id];
    if (m?.state === 'achieved') continue;
    if (m?.state === 'stale') add('entry-milestone-stale', 'milestone-reached', `milestone "${id}" was reached for another version of its subject (${m.reason ?? 'the subject changed'}); reach it again`);
    else if (m?.state === 'blocked') add('entry-milestone-blocked', 'milestone-reached', `milestone "${id}" waits for an answer: ${m.question}`);
    else add('entry-milestone-unmet', 'milestone-reached', `milestone "${id}" is not reached`);
  }

  // The guide's MUST rows, each by the one check it names.
  for (const row of guide.must) {
    const milestone = row.subject ? projection.milestones[row.subject] : undefined;
    switch (row.guard) {
      case 'milestone-reached':
        if (writing && !activity.produces.includes(row.subject) && milestone?.state !== 'achieved') {
          add('milestone-not-reached', row.id, `rule "${row.id}": milestone "${row.subject}" must be reached (now ${milestone?.state ?? 'unknown'}) before a writing activity`);
        }
        break;
      case 'human-consent':
        if (writing && isDownstream(guide, activity, row.subject)) {
          if (milestone?.state === 'stale' && milestone.reason === 'current-digest-unknown') {
            add('consent-subject-unknown', row.id, `rule "${row.id}": what "${row.subject}" approved cannot be read now, so the approval cannot be compared`);
          } else if (milestone?.state === 'stale') {
            add('consent-stale', row.id, `rule "${row.id}": the approval of "${row.subject}" was for another version (approved ${milestone.prior}, now ${milestone.current}); it needs a new approval`);
          } else if (milestone?.state !== 'achieved' || milestone.consent !== true) {
            add('consent-missing', row.id, `rule "${row.id}": "${row.subject}" has no approval from a gate answer; nothing a worker wrote counts`);
          }
        }
        break;
      case 'verify-receipt':
        if (!activity.entry.includes(row.subject) && isDownstream(guide, activity, row.subject) && milestone?.state !== 'achieved') {
          add(milestone?.state === 'stale' ? 'receipt-stale' : 'receipt-missing', row.id, `rule "${row.id}": "${row.subject}" needs a verify receipt for its current subject (now ${milestone?.state ?? 'unknown'})`);
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

  // Writes are disjoint from every live reservation of the case.
  if (writing) {
    for (const other of projection.liveReservations) {
      if ((other.writes ?? []).length > 0 && writeScopesOverlap(writes, other.writes)) {
        add('writes-overlap', 'write-scope-isolation', `writes [${writes.join(', ')}] can touch the same path as reservation ${other.reservationId} (activity ${other.activity}, writes [${other.writes.join(', ')}]); scopes are compared by their literal leading segments, so narrow an entry if the two are disjoint`);
      }
    }
  }

  // Binding: a writing dispatch runs in a worktree that is this case's.
  const bindings = [];
  if (writing) {
    if (!proposal.worktree) {
      add('writes-need-worktree', 'binding', 'a writing dispatch names the worktree it runs in');
    } else {
      const answered = bindingAnswers[proposal.worktree];
      if (!answered) add('binding-unresolved', 'binding', `no binding answer for worktree ${proposal.worktree}`);
      else if (answered.answer === 'unbound') bindings.push({ worktree: proposal.worktree, action: 'create' });
      else if (answered.answer === 'bound') bindings.push({ worktree: proposal.worktree, action: 'have' });
      else add(answered.answer, 'binding', `worktree ${proposal.worktree}: ${answered.answer}${answered.record?.caseId ? ` (case ${answered.record.caseId})` : ''}`);
    }
  }

  // Frame: counters reserved before the dispatch; an unknown remainder refuses the next writing dispatch.
  const frame = projection.frame;
  if (frame) {
    const left = projection.frameRemaining;
    if (left.dispatches === 0) add('frame-exhausted', 'frame-allowance', 'the approved frame has no dispatch left');
    if (writing) {
      if (left.dispatches === null || left.mutatingDispatches === null) add('frame-remaining-unknown', 'frame-allowance', 'what is left of the frame is not known (a count was left to the approver), so a writing dispatch is not admitted');
      else if (left.mutatingDispatches === 0) add('frame-exhausted', 'frame-allowance', 'the approved frame has no writing dispatch left');
    }
    const perDispatch = left.seatLaunchesPerDispatch;
    if (perDispatch !== null) {
      if (proposal.seatLaunchCeiling == null) {
        if (writing) add('frame-remaining-unknown', 'frame-allowance', 'the seat launches this dispatch may spend are not known, so a writing dispatch is not admitted');
      } else if (proposal.seatLaunchCeiling > perDispatch) {
        add('seat-launch-ceiling-exceeded', 'frame-allowance', `the dispatch may launch ${proposal.seatLaunchCeiling} seats; the frame allows ${perDispatch} per dispatch`);
      }
    }
    if (proposal.rigor && RIGOR_ORDER.includes(frame.rigorFloor) && RIGOR_ORDER.indexOf(proposal.rigor) >= 0
      && RIGOR_ORDER.indexOf(proposal.rigor) < RIGOR_ORDER.indexOf(frame.rigorFloor)) {
      add('rigor-below-floor', 'frame-allowance', `rigor ${proposal.rigor} is below the frame's floor ${frame.rigorFloor}`);
    }
  }

  // Route: listed routes are named as such; the way outside the list needs a reason and is refused
  // where the point lists routes only. Every rule above still applies to it.
  const { kind: routeKind, governing } = routeKindOf({ guide, projection, activity, proposal });
  if (routeKind === 'unlisted') {
    if (!proposal.reason || !String(proposal.reason).trim()) add('route-reason-required', 'route', `"${activity.id}" is not a listed route at ${governing.map((p) => p.at).join(', ')}; say why`);
    const strict = governing.filter((point) => point.listedRoutesOnly);
    if (strict.length > 0) add('unlisted-route-refused', 'route', `"${activity.id}" is not a listed route and ${strict.map((p) => p.at).join(', ')} lists routes only`);
    if (projection.frameRemaining.deviationsBeforeAsk === 0) add('deviation-limit-reached', 'frame-allowance', 'the frame allows no further deviation before asking the owner');
  }

  if (violations.length > 0) return refuse(violations);

  const reservation = {
    reservationId,
    activity: activity.id,
    unitId: proposal.unitId ?? null,
    writes,
    worktree: proposal.worktree ?? null,
    counters: { dispatches: 1, mutatingDispatches: writing ? 1 : 0 },
    seatLaunchCeiling: proposal.seatLaunchCeiling ?? null,
    blind: proposal.blind === true,
    unitRunId: null,
    createdAt: now,
  };
  return {
    reservation,
    bindings,
    events: [
      {
        type: 'route',
        payload: {
          decisionPoint: governing[0]?.at ?? null,
          activity: activity.id,
          unitId: proposal.unitId ?? null,
          routeKind,
          ...(proposal.reason ? { reason: proposal.reason } : {}),
          guideVersion: projection.guideRef?.sha256 ?? null,
          reservationId,
        },
      },
      { type: 'reservation', payload: reservation },
    ],
  };
}
