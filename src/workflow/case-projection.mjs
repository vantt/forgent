// src/workflow/case-projection.mjs — the pure fold from a Workflow case's events to what an agent reads
// Architecture guard: MUST NOT import src/state/** or src/runner/coordination/** (A4 boundary)
//
// One fold. The legacy step events of a stored run fold as a playbook case (its guide is read from the
// start event, or rebuilt from its steps); the case events (`case.opened`, `binding`, `route`,
// `reservation`, `settle`, `case.closed`, and `gate.answer` carrying a subject digest) add the frame,
// the reservations and the milestone digests. Nothing is read from disk here: the digest a subject has
// *now* is computed by the caller and passed in, so replaying the same events with the same digests
// always gives the same projection.

import { normalizeGuide } from './guide-schema.mjs';
import { projectWorkflowState, readWorkflowEvents } from './store.mjs';
import { playbookSubjectDigests } from './ref-digests.mjs';
import { seatKeyOf, isVerdictResult, isVerifyResult } from '../runner/execution/legacy-seat-read.mjs';

/** Who may name a receipt. Worker prose and a self-reported `verifiedSha` are never one. */
export const RECEIPT_EVALUATORS = Object.freeze(['harness-verify', 'reviewer-verdict', 'gate-answer']);

const isCount = (value) => Number.isInteger(value) && value >= 0;

/** A receipt of a named evaluator that passed and says which milestone and which subject digest it covers. */
export function isValidReceipt(receipt, milestone, subjectDigest) {
  return Boolean(receipt)
    && RECEIPT_EVALUATORS.includes(receipt.evaluator)
    && receipt.passed === true
    && receipt.milestone === milestone
    && typeof receipt.subjectDigest === 'string'
    && receipt.subjectDigest === subjectDigest;
}

/** A delivery milestone needs `pass` plus a current verify receipt; every other one accepts `findings`. */
export function isDeliveryMilestone(guide, milestoneId) {
  return (guide?.must ?? []).some((row) => row.guard === 'verify-receipt' && row.subject === milestoneId);
}

/**
 * The gate of the guide that `stepId` names, or null when it names none: a step of the Workflow that carries a
 * `gate`, or an activity a guide decision point lists under a `gate:` of its own (that point's mode). Nothing
 * else can be answered, so a worker cannot invent one.
 *
 * @param {Array<object>} events the ledger
 * @param {string} stepId
 * @returns {{ mode: 'consent' | 'input', question?: string } | null}
 */
export function gateOfStep(events, stepId) {
  const stepGate = projectWorkflowState(events).steps[stepId]?.gate;
  if (stepGate) return { ...stepGate, mode: stepGate.mode === 'input' ? 'input' : 'consent' };
  const guide = guideOfEvents(events);
  const point = (guide?.decisions ?? []).find((d) => d.gate && [...d.should, ...d.mayInstead].includes(stepId));
  return point ? { mode: point.gate === 'input' ? 'input' : 'consent' } : null;
}

/** The guide a ledger's start event carries (or its steps rebuild), null when it has none. */
export function guideOfEvents(events) {
  const startPayload = events.find((e) => e.type === 'workflow.start')?.payload;
  const workflow = startPayload?.workflow;
  if (!workflow) return null;
  if (workflow.guide) return workflow.guide;
  try {
    return normalizeGuide(workflow, { id: workflow.id ?? startPayload.workflowId, steps: workflow.steps ?? [] });
  } catch {
    return null;
  }
}

/**
 * The frame a case runs under. `case.opened` carries it; a stored run has none, so its guide's defaults
 * stand (a count the guide leaves to the approver stays `set-at-approval`: the remainder is unknown).
 */
function frameOf(opened, guide) {
  if (opened?.payload?.frame) return opened.payload.frame;
  return guide?.frameDefaults ? { ...guide.frameDefaults } : null;
}

function remaining(limit, used) {
  return isCount(limit) ? Math.max(0, limit - used) : null;
}

/**
 * @param {Array<object>} events the ledger
 * @param {object} [options]
 * @param {Record<string, string | null>} [options.currentDigests] subject digest of a milestone as it is now;
 *   a milestone with no entry is not rechecked, one whose value is null cannot be known and fails closed
 * @param {object} [options.state] the events already folded by `projectWorkflowState`, when the caller has them
 * @param {object | null} [options.guide] the guide already derived by `guideOfEvents`, when the caller has it
 * @returns {object}
 */
export function projectCase(events, { currentDigests = {}, state: legacy = projectWorkflowState(events), guide = guideOfEvents(events) } = {}) {
  const opened = events.find((e) => e.type === 'case.opened');
  const kind = opened?.payload?.kind ?? guide?.kind ?? 'playbook';
  const frame = frameOf(opened, guide);

  const milestones = {};
  for (const m of guide?.milestones ?? []) milestones[m.id] = { state: 'unreached' };
  // A milestone reached again for the same subject keeps what an earlier guard left on it: the receipts of a
  // settle and of a gate answer sit side by side, and consent once given is not dropped by a later receipt.
  const achieve = (id, digest, extra = {}) => {
    if (!(id in milestones)) return;
    const prior = milestones[id];
    const same = prior.state === 'achieved' && prior.digest === (digest ?? null);
    const { receipt, ...fields } = extra;
    const receipts = [...(same ? prior.receipts ?? [] : []), ...(fields.receipts ?? []), ...(receipt ? [receipt] : [])];
    const consent = (same && prior.consent === true) || fields.consent === true;
    milestones[id] = {
      ...(same ? prior : {}),
      state: 'achieved',
      digest: digest ?? null,
      ...fields,
      ...(receipts.length > 0 || fields.receipts !== undefined ? { receipts } : {}),
      ...(fields.consent !== undefined || (same && prior.consent !== undefined) ? { consent } : {}),
    };
  };
  const achieveIfUnreached = (id, digest) => {
    if (milestones[id]?.state === 'unreached') achieve(id, digest);
  };
  const activityOf = (id) => guide?.activities.find((a) => a.id === id);

  const reservations = new Map();
  const bindings = new Map();
  const routes = [];
  const blindUnitRuns = new Map();
  const refusedAchievements = [];
  let closed = null;
  let frameExhausted = false;

  for (const event of events) {
    const p = event.payload ?? {};
    switch (event.type) {
      case 'case.opened':
        achieve('request-received', p.requestDigest);
        // Taken over from a closed case of the same plan; the source and its receipts stay on the milestone.
        for (const item of p.inherits?.milestones ?? []) {
          achieve(item.milestone, item.subjectDigest, { receipts: item.receipts ?? [], outcome: item.outcome ?? null, inherited: { fromCase: p.inherits.fromCase } });
        }
        break;
      case 'step.complete':
        // The step's own milestone (and any the guide says it settles); a digest recorded by the
        // settle of its units is already there and stays.
        for (const id of activityOf(p.stepId)?.produces ?? []) achieveIfUnreached(id, p.subjectDigest);
        break;
      case 'gate.answer': {
        const mode = legacy.steps[p.stepId]?.gate?.mode ?? p.mode ?? 'consent';
        const settles = mode === 'input' || p.approved === true;
        if (!settles) break;
        const receipt = { kind: 'gate-answer', evaluator: 'gate-answer', passed: true, approved: p.approved === true, answeredAt: p.answeredAt ?? null };
        for (const id of p.milestones ?? activityOf(p.stepId)?.produces ?? []) {
          // A milestone that needs a verify receipt is reached only by the settle that carries one.
          if (isDeliveryMilestone(guide, id)) continue;
          achieve(id, p.subjectDigest ?? null, { receipt, consent: mode === 'consent' });
        }
        break;
      }
      case 'reservation':
        reservations.set(p.reservationId, { ...p, settled: false });
        break;
      case 'settle': {
        const reservation = reservations.get(p.reservationId);
        if (reservation) Object.assign(reservation, { settled: true, outcome: p.outcome, seatLaunchesUsed: p.seatLaunchesUsed ?? null, unitRunId: p.unitRunId ?? reservation.unitRunId ?? null });
        if (p.frameExhausted) frameExhausted = true;
        if (p.blind && p.unitRunId) blindUnitRuns.set(p.unitRunId, p.activity ?? reservation?.activity ?? null);
        for (const item of p.achieved ?? []) {
          const delivery = isDeliveryMilestone(guide, item.milestone);
          const accepted = (p.outcome === 'pass' && (!delivery || (p.receipts ?? []).some((r) => isValidReceipt(r, item.milestone, item.subjectDigest))))
            || (p.outcome === 'findings' && !delivery);
          if (accepted) achieve(item.milestone, item.subjectDigest, { receipts: p.receipts ?? [], outcome: p.outcome });
          else refusedAchievements.push({ milestone: item.milestone, reservationId: p.reservationId, reason: delivery && p.outcome === 'pass' ? 'receipt-missing' : `outcome-${p.outcome}` });
        }
        break;
      }
      case 'route':
        routes.push({ ...p, seq: event.seq });
        break;
      case 'binding':
        if (p.state === 'unbound') bindings.delete(p.key ?? p.worktreeRoot);
        else bindings.set(p.key ?? p.worktreeRoot, { ...p });
        break;
      case 'case.closed':
        closed = { closedAt: p.closedAt ?? null, reason: p.reason ?? null };
        break;
      default:
        break;
    }
  }

  // A parked gate blocks the milestones its step produces, with the question that blocks it.
  for (const question of legacy.questions) {
    for (const id of activityOf(question.stepId)?.produces ?? []) {
      if (milestones[id]?.state === 'unreached') milestones[id] = { state: 'blocked', question: question.question };
    }
  }

  // A milestone recorded with a digest is stale once its subject has another one now.
  for (const [id, entry] of Object.entries(milestones)) {
    if (entry.state !== 'achieved' || entry.digest === null || !(id in currentDigests)) continue;
    const current = currentDigests[id];
    if (current === entry.digest) continue;
    milestones[id] = { ...entry, state: 'stale', prior: entry.digest, current: current ?? null, ...(current == null ? { reason: 'current-digest-unknown' } : {}) };
  }

  const all = [...reservations.values()];
  // A reservation given back (refunded, or its run never started) spends nothing of the frame.
  const counting = all.filter((r) => !(r.settled && (r.outcome === 'refunded' || r.outcome === 'not-started')));
  const used = {
    dispatches: counting.reduce((sum, r) => sum + (r.counters?.dispatches ?? 1), 0),
    mutatingDispatches: counting.reduce((sum, r) => sum + (r.counters?.mutatingDispatches ?? 0), 0),
  };
  const deviations = routes.filter((r) => r.routeKind === 'unlisted').length;
  const frameRemaining = {
    dispatches: remaining(frame?.dispatches, used.dispatches),
    mutatingDispatches: remaining(frame?.mutatingDispatches, used.mutatingDispatches),
    deviationsBeforeAsk: remaining(frame?.deviationsBeforeAsk, deviations),
    seatLaunchesPerDispatch: isCount(frame?.seatLaunchesPerDispatch) ? frame.seatLaunchesPerDispatch : null,
    fallbackPerSeat: isCount(frame?.fallbackPerSeat) ? frame.fallbackPerSeat : null,
    rigorFloor: frame?.rigorFloor ?? null,
  };

  const eligible = closed ? [] : (guide?.activities ?? [])
    .filter((a) => a.entry.every((id) => milestones[id]?.state === 'achieved'))
    .map((a) => a.id);

  const points = (guide?.decisions ?? []).map((d) => ({
    at: d.at,
    open: milestones[d.at]?.state === 'achieved',
    should: d.should,
    mayInstead: d.mayInstead,
    reason: d.reason,
    listedRoutesOnly: d.listedRoutesOnly,
    ...(d.gate ? { gate: d.gate } : {}),
  }));

  const closureReasons = [];
  if (closed) closureReasons.push('case-closed');
  for (const id of guide?.closure ?? []) if (milestones[id]?.state === 'stale') closureReasons.push(`closure-milestone-stale:${id}`);
  for (const question of legacy.questions) {
    const mode = legacy.steps[question.stepId]?.gate?.mode ?? 'consent';
    if (mode === 'consent') closureReasons.push(`consent-gate-parked:${question.stepId}`);
  }

  return {
    caseId: legacy.workflowRunId ?? null,
    kind,
    guide,
    guideRef: opened?.payload?.guide ?? null,
    frame,
    status: legacy.status,
    open: !closed,
    closed,
    milestones,
    refusedAchievements,
    reservations: all,
    // A nested case's charge spends frame but is no attempt that may still be running.
    liveReservations: all.filter((r) => !r.settled && !r.nested),
    blindUnitRuns,
    frameUsed: used,
    frameRemaining,
    frameExhausted,
    deviations,
    routes,
    eligible,
    routePoints: points,
    // The way outside the list is always shown: it needs a reason, MUST rules still apply to it, and a
    // listed-routes-only point refuses it by name.
    unlistedPath: { proposable: true, requires: 'reason', refusedAt: points.filter((d) => d.listedRoutesOnly).map((d) => d.at) },
    openGates: legacy.questions,
    bindings: [...bindings.values()],
    closable: { ok: closureReasons.length === 0, reasons: closureReasons },
  };
}

/**
 * The receipts a Unit run's own results back, by named evaluators only: the harness's verify round and
 * a checker's verdict. What a worker wrote about itself is never read here.
 */
export function receiptsFromResults({ unitRunId, results = [], milestone = null, subjectDigest = null }) {
  const receipts = [];
  for (const result of results) {
    const role = String(seatKeyOf(result) ?? '');
    if (isVerifyResult(result) && result.outcome === 'pass') {
      receipts.push({ kind: 'verify', evaluator: 'harness-verify', passed: true, unitRunId, role, milestone, subjectDigest });
    } else if (isVerdictResult(result) && ['pass', 'findings'].includes(result.outcome)) {
      receipts.push({ kind: 'verdict', evaluator: 'reviewer-verdict', passed: result.outcome === 'pass', unitRunId, role, milestone, subjectDigest });
    }
  }
  return receipts;
}

/**
 * The case as a reader sees it: the ledger, its fold, and the projection with the digests a playbook's
 * subjects have now. A reader that does not hold `advance` asks for `retryTail`, because it can meet an
 * append in flight; a reader that holds it never can.
 *
 * @param {string} mainRoot
 * @param {string} caseId
 * @param {{ retryTail?: boolean }} [options]
 */
export function readCaseProjection(mainRoot, caseId, { retryTail = false } = {}) {
  const events = readWorkflowEvents({ repoRoot: mainRoot, workflowRunId: caseId, retryTail });
  const state = projectWorkflowState(events);
  const guide = guideOfEvents(events);
  const currentDigests = playbookSubjectDigests({ state, workflow: state.workflow, guide, mainRoot });
  return { events, state, projection: projectCase(events, { currentDigests, state, guide }) };
}
