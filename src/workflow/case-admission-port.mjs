// src/workflow/case-admission-port.mjs — the Workflow's implementation of the Execution Core's admission port
// Architecture guard: MUST NOT import src/state/** or src/runner/coordination/** (A4 boundary)
//
// The Execution Core owns the interface (src/runner/execution/case-admission-port.mjs) and asks it
// before it runs a Unit for a case; the entry point builds this port and injects it, so the core never
// imports the Workflow. Every operation is a short section under the case's `advance`:
//
//   - a Playbook proposer holds `advance` for its whole life and passes the hold (`heldAdvance`); the
//     port never acquires then, so the proposer's own admit and settle cannot refuse themselves;
//   - anyone else (a conductor, a standalone door) is tried once per operation: `admit` that finds the
//     lock held answers `case-admission-busy` (retryable), `settle` leaves a settle-pending file the next
//     holder of `advance` folds in before anything else, so a receipt is never lost.

import fs from 'node:fs';
import path from 'node:path';

import { appendWorkflowEvent, readWorkflowEvents } from './store.mjs';
import { tryAcquireAdvanceLock } from './case-lock.mjs';
import { applySettle, drainCaseInbox, writeSettlePending } from './case-runtime.mjs';
import { isDeliveryMilestone, projectCase, readCaseProjection, receiptsFromResults } from './case-projection.mjs';
import { digestSubject, digestUnitRunReports } from './ref-digests.mjs';
import { admitProposal, newReservationId, recheckReservation } from './case-admission.mjs';
import { bindingsDir, bindWorktree, ensureBindingsSentinel, readBinding, SENTINEL_NAME } from './case-bindings.mjs';
import { workflowCheckout } from './unit-handoff.mjs';
import { CASE_ID_ENV, CASE_RESERVATION_ENV, currentDispatchDepth } from '../runner/dispatch/adapters.mjs';
import { seatKeyOf } from '../runner/execution/legacy-seat-read.mjs';
import { isCaseId, runDirOf } from '../runner/execution/case-run-paths.mjs';

/** Admission reads without `advance`, so it can meet an append in flight. */
const readEvents = (mainRoot, caseId) => readWorkflowEvents({ repoRoot: mainRoot, workflowRunId: caseId, retryTail: true });
const readCase = (mainRoot, caseId) => readCaseProjection(mainRoot, caseId, { retryTail: true });

/**
 * What a case's pinned workflow snapshot says about an activity's Unit pattern and params.
 * Reads without taking advance; returns null when the case or activity has no Unit pattern.
 */
export function activityUnitOf({ mainRoot, caseId, activity }) {
  if (!mainRoot || typeof mainRoot !== 'string' || !isCaseId(caseId) || !fs.existsSync(runDirOf(mainRoot, caseId))) {
    return null;
  }
  const { projection } = readCase(mainRoot, caseId);
  const found = projection?.guide?.activities?.find((a) => a.id === activity);
  if (!found?.unit || typeof found.unit !== 'object') return null;
  const { unit } = found;
  if ('step' in unit && 'units' in unit) return null;
  if (typeof unit.pattern !== 'string' || unit.pattern.trim() === '') return null;
  return {
    pattern: unit.pattern,
    params: unit.params ?? {},
  };
}

/**
 * What a conductor case's settle proposes as achieved: each milestone the reservation's activity declares
 * it produces, with the digest of its subject as it is now, and the receipts that back it. A delivery
 * milestone's subject is the paths the Unit was allowed to write, read in its worktree, and each of its
 * receipts names that milestone and digest; any other milestone's subject is the reports the Unit run left.
 * Only a pass or a findings outcome proposes anything, and a digest that cannot be read proposes nothing,
 * so that milestone stays unreached. Whether a proposal is accepted stays the projection's decision.
 * A Playbook case achieves its milestones at step completion and proposes none here.
 */
function testedPathsDigest(reservation, mainRoot) {
  // A write scope is a path or `<path>/**`; a pattern in the middle of a path names no single subject.
  const paths = (reservation.writes ?? []).map((w) => w.replace(/\/\*\*?$/, ''));
  if (paths.length === 0 || paths.some((w) => /[*?[\]{}]/.test(w))) return null;
  return digestSubject({ tree: paths }, reservation.worktree ?? mainRoot);
}

function proposedAchievements({ mainRoot, projection, reservation, result }) {
  const base = receiptsFromResults({ unitRunId: result.unitRunId ?? null, results: result.results ?? [] });
  const produces = projection.kind === 'playbook' || !['pass', 'findings'].includes(result.outcome)
    ? []
    : (projection.guide?.activities.find((a) => a.id === reservation.activity)?.produces ?? []);
  if (produces.length === 0) return { achieved: [], receipts: base };
  const reports = () => {
    const seats = [...new Set((result.results ?? []).filter((r) => r?.runResult).map(seatKeyOf))];
    return result.unitRunId && seats.length > 0 ? digestUnitRunReports([{ unitRunId: result.unitRunId, seats }], mainRoot) : null;
  };
  const achieved = [];
  const receipts = [];
  for (const milestone of produces) {
    const delivery = isDeliveryMilestone(projection.guide, milestone);
    const subjectDigest = delivery ? testedPathsDigest(reservation, mainRoot) : reports();
    if (subjectDigest === null) continue;
    achieved.push({ milestone, subjectDigest });
    if (delivery) receipts.push(...receiptsFromResults({ unitRunId: result.unitRunId ?? null, results: result.results ?? [], milestone, subjectDigest }));
  }
  // A receipt that names its milestone replaces the unnamed one it was made from.
  return { achieved, receipts: receipts.length > 0 ? receipts : base };
}

/** A refusal as the port answers it: `{ code, condition }`, wrapped as `{ refused }` where an operation returns one. */
const refusal = (code, condition) => ({ code, condition });

/**
 * The case a caller's environment names: null when it names none, `{ malformed }` when it names half of
 * one or something that is no id, else `{ caseId, reservationId }`. The door is the only writer of these
 * variables; they are a claim to check, never an authority.
 */
function caseEnvOf(env) {
  const caseId = env[CASE_ID_ENV];
  const reservationId = env[CASE_RESERVATION_ENV];
  if (caseId === undefined && reservationId === undefined) return null;
  if (!isCaseId(caseId) || !isCaseId(reservationId)) return { malformed: true };
  return { caseId, reservationId };
}

const writable = (dir) => {
  try {
    fs.accessSync(dir, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
};

export const CONFINED_WRITE_CODE = 'nested-write-from-confined-worker';

/** The sentence a write from a confined worker is refused with. */
export const confinedWriteText = (why) => `a writing dispatch from inside a confined worker is refused: ${why}; a confined worker may dispatch read-only work only`;

/** Whether this process may write a case's ledger and bindings: a masked or read-only view cannot. */
export function confinedWriteRefusal({ mainRoot, caseId = null }) {
  if (currentDispatchDepth() === 0) return null;
  const dir = caseId === null ? null : runDirOf(mainRoot, caseId);
  if (dir !== null && fs.existsSync(dir) && !writable(dir)) return 'its view of the case ledger is read-only';
  if (!fs.existsSync(path.join(bindingsDir(mainRoot), SENTINEL_NAME))) return 'it cannot see the real bindings directory';
  if (!writable(bindingsDir(mainRoot))) return 'its view of the bindings is read-only';
  return null;
}

/** The case `id` as it is now, or why it cannot be named: unknown and closed are both `authority-context-invalid`. */
function openCaseFacts(mainRoot, id, what) {
  if (!fs.existsSync(runDirOf(mainRoot, id))) return { refused: refusal('authority-context-invalid', `${what} names case ${id}, which does not exist`) };
  const { projection } = readCase(mainRoot, id);
  if (!projection.open) return { refused: refusal('authority-context-invalid', `${what} names case ${id}, which is closed`) };
  return { projection };
}

/** Whether `childId` was opened under a reservation of `parentId` (its `case.opened` names the parent). */
function isChildOf(mainRoot, childId, parentId) {
  if (!fs.existsSync(runDirOf(mainRoot, childId))) return false;
  return readEvents(mainRoot, childId).find((e) => e.type === 'case.opened')?.payload?.parent?.caseId === parentId;
}

/**
 * Every signal a caller gives must name one open case: the explicit reference, the case variables its
 * door set, and the binding of the worktree it writes. Precedence only picks what to look up; it never
 * overrides the binding or the parent's reservation. The only way two cases may both appear is a case
 * that was opened under a live reservation of the other (a nested case).
 */
function authorityRefusal({ mainRoot, env, refCase, bound = null }) {
  const claimed = caseEnvOf(env);
  if (claimed?.malformed) return refusal('authority-context-invalid', `${CASE_ID_ENV} and ${CASE_RESERVATION_ENV} must both name a case and a reservation; the environment carries something else`);
  if (claimed) {
    const envCase = openCaseFacts(mainRoot, claimed.caseId, `the environment (${CASE_ID_ENV})`);
    if (envCase.refused) return envCase.refused;
    if (!envCase.projection.liveReservations.some((r) => r.reservationId === claimed.reservationId)) {
      return refusal('authority-context-invalid', `the environment names reservation ${claimed.reservationId} of case ${claimed.caseId}, which is not live`);
    }
    if (claimed.caseId !== refCase && !isChildOf(mainRoot, refCase, claimed.caseId)) {
      return refusal('authority-context-conflict', `the environment names case ${claimed.caseId} and the call names case ${refCase}, which was not opened under a reservation of it`);
    }
  }
  if (bound?.caseId && bound.caseId !== refCase) {
    return refusal('authority-context-conflict', `the worktree is bound to case ${bound.caseId} and the call names case ${refCase}; a case needs its own reservation to write another case's worktree`);
  }
  return null;
}

/**
 * What stops `fgos workflow start --case <parent>` before it charges the parent frame: the parent must
 * be an open conductor case (a Playbook case admits through its own proposer only) and the caller's
 * environment must agree with it. Null when the start may go on.
 */
export function nestedStartRefusal({ repoRoot, parentCaseId, env = process.env }) {
  const mainRoot = path.resolve(repoRoot);
  const named = openCaseFacts(mainRoot, parentCaseId, 'the call');
  if (named.refused) return named.refused;
  if (named.projection.kind === 'playbook') {
    return refusal('playbook-case-admits-via-proposer-only', `case ${parentCaseId} is a Playbook case: it opens nothing but through its own proposer; a call from outside it is refused, not queued`);
  }
  return authorityRefusal({ mainRoot, env, refCase: parentCaseId });
}

/** Why a worktree cannot be bound for a case; a record a crash left unsettled names the case that owns it and the verbs that settle it. */
function bindRefusal({ answer, record }, worktree, id) {
  if (answer === 'binding-unsettled' && record?.caseId) {
    return refusal(answer, `worktree ${worktree} has a binding record of case ${record.caseId} that a crash left unsettled; fgos workflow resume ${record.caseId} or fgos workflow close ${record.caseId} settles it`);
  }
  return refusal(answer, `worktree ${worktree} cannot be bound to case ${id}: ${answer}`);
}

/**
 * The admission itself, under the case's `advance`: the inbox and the crash leftovers first, then either the
 * live reservation of the same Unit asked again (its controller died before its run existed) or a new one.
 * A writing Unit's worktree is bound before anything is appended, so a refusal leaves nothing behind.
 */
function admitUnderHold({ mainRoot, hold, id, proposal, writing }) {
  drainCaseInbox({ mainRoot, caseId: id, hold });
  const { projection } = readCase(mainRoot, id);
  const unitId = proposal.caseRef.unitId ?? null;
  const live = unitId === null ? undefined : projection.liveReservations.find((r) => r.activity === proposal.activity && r.unitId === unitId);
  const target = writing ? readBinding({ mainRoot, worktree: proposal.worktree, caseId: id }) : null;
  if (target?.answer === 'binding-unsettled') return { refused: bindRefusal(target, proposal.worktree, id) };

  let verdict = null;
  if (!live) {
    verdict = admitProposal({
      projection,
      proposal: {
        activity: proposal.activity,
        unitId: proposal.caseRef.unitId,
        writes: proposal.writes,
        worktree: writing ? proposal.worktree : undefined,
        blind: proposal.blind,
        handoffRefs: proposal.handoffRefs,
        rigor: proposal.rigor,
        seatLaunches: proposal.seatLaunches,
        unitRunId: proposal.unitRunId,
        reason: proposal.caseRef.reason,
        claimedRoute: proposal.caseRef.route,
        proposer: projection.kind === 'playbook' ? 'playbook' : 'agent',
      },
      bindingAnswers: target ? { [proposal.worktree]: target } : {},
      reservationId: newReservationId(),
    });
    if (verdict.refused) return { refused: verdict.refused };
  }
  const bound = writing ? bindWorktree({ mainRoot, hold, caseId: id, worktree: proposal.worktree, ...workflowCheckout(proposal.worktree) }) : null;
  if (bound && !bound.ok) return { refused: bindRefusal(bound, proposal.worktree, id) };
  for (const event of verdict?.events ?? []) appendWorkflowEvent({ repoRoot: mainRoot, workflowRunId: id, event, hold });
  const reservation = live ?? verdict.reservation;
  return { admitted: true, reservationId: reservation.reservationId, caseId: id, seatLaunchCeiling: reservation.seatLaunchCeiling ?? null };
}

/**
 * @param {object} params
 * @param {string} params.repoRoot the main checkout the ledger and the bindings live under
 * @param {string} [params.caseId] the case this port serves, when its caller is that case's proposer
 * @param {object} [params.heldAdvance] the proposer's `advance` hold; given, the port never acquires
 * @returns {import('../runner/execution/case-admission-port.mjs').CaseAdmissionPort}
 */
export function createCaseAdmissionPort({ repoRoot, caseId = null, heldAdvance = null, env = process.env }) {
  const mainRoot = path.resolve(repoRoot);
  // A host-side sentinel tells a later reader that an empty bindings directory is the real one.
  ensureBindingsSentinel(mainRoot);
  const refuse = (code, condition) => ({ refused: refusal(code, condition) });

  /** Run `section(hold)` under `advance`; `null` when another process holds it. */
  const underAdvance = (id, section, options) => {
    if (heldAdvance) return section(heldAdvance);
    const hold = tryAcquireAdvanceLock(mainRoot, id, options);
    if (hold === null) return null;
    try {
      return section(hold);
    } finally {
      hold.release();
    }
  };

  return {
    resolveBinding({ worktree, caseId: asked = null }) {
      // No case is named. A call that carries case variables, or a masked view, is not standalone.
      if (asked === null && caseId === null) {
        const confined = confinedWriteRefusal({ mainRoot });
        if (confined) return { answer: CONFINED_WRITE_CODE, condition: confinedWriteText(confined) };
        const claimed = caseEnvOf(env);
        if (claimed) {
          return { answer: 'authority-context-invalid', condition: claimed.malformed
            ? `${CASE_ID_ENV} and ${CASE_RESERVATION_ENV} must both name a case and a reservation`
            : `the environment names case ${claimed.caseId}, so a writing dispatch must name it: --case ${claimed.caseId} --activity <id>` };
        }
      }
      const binding = readBinding({ mainRoot, worktree, caseId: asked ?? caseId ?? undefined });
      if (asked === null && caseId === null && (binding.answer === 'worktree-already-bound' || binding.answer === 'bound')) {
        const owner = binding.record?.caseId;
        return { answer: 'bound-worktree-requires-case-authority', ...(binding.record ? { record: binding.record } : {}), condition: `worktree ${worktree} is bound to case ${owner}; a writing run there must name it: --case ${owner} --activity <id>` };
      }
      if (binding.answer === 'binding-view-unavailable' && currentDispatchDepth() > 0) {
        return { answer: CONFINED_WRITE_CODE, condition: confinedWriteText('it cannot see the real bindings directory') };
      }
      return { answer: binding.answer, ...(binding.record ? { record: binding.record } : {}) };
    },

    admit(proposal) {
      const id = proposal.caseRef.caseId;
      if (caseId && caseId !== id) return refuse('authority-context-conflict', `this port serves case ${caseId}, the Unit names case ${id}`);
      if (heldAdvance && heldAdvance.workflowRunId !== id) return refuse('authority-context-conflict', `advance of case ${heldAdvance.workflowRunId} is held; a scope never holds two`);
      const writing = proposal.writes.length > 0;
      // A confined caller is refused by name before anything else is looked at, whatever it names.
      const confined = writing ? confinedWriteRefusal({ mainRoot, caseId: id }) : null;
      if (confined) return refuse(CONFINED_WRITE_CODE, confinedWriteText(confined));
      const named = openCaseFacts(mainRoot, id, 'the call');
      if (named.refused) return { refused: named.refused };
      // A Playbook case admits through its own proposer and nobody else: no waiting, no negotiation.
      if (named.projection.kind === 'playbook' && !(heldAdvance && heldAdvance.workflowRunId === id)) {
        return refuse('playbook-case-admits-via-proposer-only', `case ${id} is a Playbook case: its Units are admitted by its own proposer, in order; a call from outside it is refused, not queued`);
      }
      const targetBinding = writing ? readBinding({ mainRoot, worktree: proposal.worktree, caseId: id }) : null;
      const conflict = authorityRefusal({ mainRoot, env, refCase: id, bound: targetBinding?.answer === 'worktree-already-bound' ? targetBinding.record : null });
      if (conflict) return { refused: conflict };
      const answer = underAdvance(id, (hold) => admitUnderHold({ mainRoot, hold, id, proposal, writing }));
      return answer ?? refuse('case-admission-busy', `case ${id} is being advanced by another process; ask again`);
    },

    settle(reservationId, result) {
      const id = result.caseId;
      const events = readEvents(mainRoot, id);
      const reservation = events.find((e) => e.type === 'reservation' && e.payload?.reservationId === reservationId)?.payload;
      if (!reservation) return;
      const { achieved, receipts } = proposedAchievements({ mainRoot, projection: projectCase(events), reservation, result });
      const payload = {
        reservationId,
        activity: reservation.activity,
        unitId: reservation.unitId,
        unitRunId: result.unitRunId ?? null,
        outcome: result.outcome,
        receipts,
        achieved,
        seatLaunchesUsed: result.seatLaunchesUsed ?? 0,
        ...(result.frameExhausted ? { frameExhausted: true } : {}),
        ...(result.gate ? { gate: result.gate } : {}),
        blind: reservation.blind === true,
        settledAt: new Date().toISOString(),
      };
      const done = underAdvance(id, (hold) => applySettle({ mainRoot, caseId: id, hold, settle: payload }), { drain: false });
      if (done === null) writeSettlePending({ mainRoot, caseId: id, settle: payload });
    },

    recheckEffect(reservationId, { caseId: id }) {
      const { projection } = readCase(mainRoot, id);
      const reservation = projection.liveReservations.find((r) => r.reservationId === reservationId);
      if (!reservation) return refuse('reservation-not-live', `reservation ${reservationId} of case ${id} is not live`);
      const broken = recheckReservation({ projection, reservation });
      return broken ? refuse(broken[0].code, broken.map((v) => v.condition).join('; ')) : { ok: true };
    },
  };
}
