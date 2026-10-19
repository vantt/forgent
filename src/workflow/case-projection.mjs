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
import { projectWorkflowState } from './store.mjs';

/** Event kinds a case adds to the ledger, beside the step events a playbook already writes. */
export const CASE_EVENT_KINDS = Object.freeze(['case.opened', 'binding', 'route', 'reservation', 'settle', 'gate.answer', 'case.closed']);

/** Who may name a receipt. Worker prose and a self-reported `verifiedSha` are never one. */
export const RECEIPT_EVALUATORS = Object.freeze(['harness-verify', 'reviewer-verdict', 'gate-answer']);

export const RIGOR_ORDER = Object.freeze(['low', 'standard', 'high', 'critical']);

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

function guideOf(startPayload) {
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
 * @returns {object}
 */
export function projectCase(events, { currentDigests = {} } = {}) {
  const legacy = projectWorkflowState(events);
  const start = events.find((e) => e.type === 'workflow.start');
  const opened = events.find((e) => e.type === 'case.opened');
  const guide = guideOf(start?.payload);
  const kind = opened?.payload?.kind ?? guide?.kind ?? 'playbook';
  const frame = frameOf(opened, guide);

  const milestones = {};
  for (const m of guide?.milestones ?? []) milestones[m.id] = { state: 'unreached' };
  const achieve = (id, digest, extra = {}) => {
    if (!(id in milestones)) return;
    milestones[id] = { state: 'achieved', digest: digest ?? null, ...extra };
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
  const counting = all.filter((r) => !(r.settled && r.outcome === 'refunded'));
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
    liveReservations: all.filter((r) => !r.settled),
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
