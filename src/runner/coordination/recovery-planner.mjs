// coordination/recovery-planner.mjs — pure recovery-recommendation planner
// for a COORDINATION-SESSION-owned Run (the session-scoped
// analog of src/runner/dispatch/recovery-planner.mjs's standalone
// planner).
//
// Same discipline as that sibling and as ./read-evaluators.mjs (hexagonal
// domain decisions live in pure evaluators/planners; adapters own
// filesystem details; a write door stays the only mutation boundary): every
// function below is a pure function of its arguments -- no fs, no
// child_process, no network, no mutation. The caller
// (src/verbs/coordination/recover.mjs) gathers the `snapshot` these
// functions need (a `replaySession()` result plus per-Run facts already
// read off disk) and passes it in explicitly.
//
// Reuses, never reimplements: `legalNext`/`authorize` from
// ./read-evaluators.mjs are the SAME shared pure evaluators the write door
// (store.mjs, via session-engine.mjs's other callers) is built on --
// "the read call uses the shared pure evaluators" (contract). `legalNext`'s
// existing "session must be active" gate is what keeps a terminal session's
// continuation refused here too, with no second copy of that rule.

import { createHash } from 'node:crypto';
import { legalNext, authorize } from './read-evaluators.mjs';
import { RECOVERY_ACTIONS } from './schema.mjs';

export class RecoveryPlannerError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'RecoveryPlannerError';
    this.code = code;
    Object.assign(this, details);
  }
}

// How long a fresh recommendation stays applicable. Same rationale as
// dispatch/recovery-planner.mjs's own DEFAULT_TTL_MS: long enough for a
// person to read and decide, short enough that a stale recommendation can
// never be replayed against present-day evidence just because the
// snapshot/epoch happen to still match.
export const DEFAULT_TTL_MS = 5 * 60 * 1000;

function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`;
}

/** Deterministic digest over the caller-supplied snapshot facts this
 * planner actually reasons over (session status/assignmentRefs/assignments/
 * results plus the one resolved eligible Run's own facts) -- the
 * "event-log hash" the sibling planner's own snapshotHash plays, standing
 * in for a session's event log the same way that Run's observed-facts
 * snapshot stands in for a Run's own missing event log. */
export function computeSnapshotDigest(snapshot) {
  let eligibleRunFacts = null;
  if (snapshot.eligibleRunFacts) {
    const { controlEpoch: _epoch, ...rest } = snapshot.eligibleRunFacts;
    eligibleRunFacts = rest;
  }
  return createHash('sha256').update(
    stableStringify({
      status: snapshot.manifest.status,
      assignmentRefs: snapshot.assignmentRefs,
      assignments: snapshot.assignments,
      results: snapshot.results,
      eligibleRunFacts,
    }),
  ).digest('hex');
}

/** Deterministically binds `actionKey` to the exact recommendation it was
 * issued for -- (snapshotDigest, expectedEventSeq, expectedRunControlEpoch,
 * action, expiresAt). A CAS/staleness binding, mirroring
 * dispatch/recovery-planner.mjs's own `computeActionKey` exactly, with one
 * extra dimension (`expectedEventSeq`) this session-scoped door also
 * fences on. */
export function computeActionKey({ snapshotDigest, expectedEventSeq, expectedRunControlEpoch, action, expiresAt }) {
  return createHash('sha256')
    .update(stableStringify({ snapshotDigest, expectedEventSeq, expectedRunControlEpoch, action, expiresAt }))
    .digest('hex');
}

/**
 * The exact-eligible-Run selection rule: the
 * ONE session-member Assignment that is "in-flight" -- created but not yet
 * linked with a result -- using the SAME definition
 * `createSessionAssignment`'s own `opts.maxConcurrencyForSession` check
 * already uses (store.mjs), never a second, independently-drifting notion
 * of "in flight". Zero candidates means nothing is currently in flight
 * (every member Assignment already settled and linked); more than one is
 * genuine ambiguity this door refuses rather than guesses through.
 *
 * Pure over `snapshot.assignments`/`snapshot.results` alone (both already
 * `replaySession()` output, no fs needed for this step) -- resolving WHICH
 * Assignment is eligible never touches disk; only resolving that one
 * Assignment's own Run facts does, which is the caller's job.
 *
 * @param {{assignments: {assignmentId: string}[], results: {assignmentId: string}[]}} snapshot
 * @returns {{status: 'none'} | {status: 'ambiguous', candidates: string[]} | {status: 'one', assignmentId: string}}
 */
export function findEligibleAssignment(snapshot) {
  const linkedIds = new Set(snapshot.results.map((r) => r.assignmentId));
  const candidates = snapshot.assignments.filter((a) => !linkedIds.has(a.assignmentId)).map((a) => a.assignmentId);
  if (candidates.length === 0) return { status: 'none' };
  if (candidates.length > 1) return { status: 'ambiguous', candidates };
  return { status: 'one', assignmentId: candidates[0] };
}

/**
 * Evaluates whether quorum rules allow closing the session. Uses the same
 * completion and partialPolicy derivation as the real write door (closeSessionByQuorum).
 *
 * @param {object} snapshot
 * @returns {{eligible: boolean, reason?: string, partial?: boolean}}
 */
export function checkQuorumEligibility(snapshot) {
  const coordinationId = snapshot.manifest?.coordinationId ?? '';
  const quorum = snapshot.quorum;
  const manifest = snapshot.manifest ?? {};

  if (!quorum) {
    const requiredActorIds = (manifest.actors ?? []).map((actor) => actor.id);
    if (requiredActorIds.length > 0) {
      const policy = manifest.partialPolicy;
      if (!policy) {
        return {
          eligible: false,
          reason: `session "${coordinationId}" is missing required actor(s) [${requiredActorIds.join(', ')}] and declares no partialPolicy -- default completion requires every required SessionActor (R1)`,
        };
      }
    }
    return { eligible: true };
  }

  const incomplete = [...(quorum.failed ?? []), ...(quorum.late ?? []), ...(quorum.missing ?? [])];
  const incompleteActorIds = incomplete.map((entry) => entry.actorId);

  if (incompleteActorIds.length === 0) {
    return { eligible: true };
  }

  const policy = manifest.partialPolicy;
  if (!policy) {
    return {
      eligible: false,
      reason: `session "${coordinationId}" is missing required actor(s) [${incompleteActorIds.join(', ')}] and declares no partialPolicy -- default completion requires every required SessionActor (R1)`,
    };
  }

  const allowed = new Set(policy.allowedOmissions ?? []);
  const notAllowed = incompleteActorIds.filter((id) => !allowed.has(id));
  if (notAllowed.length > 0) {
    return {
      eligible: false,
      reason: `actor(s) [${notAllowed.join(', ')}] are missing/failed/late but not named in session "${coordinationId}"'s declared partialPolicy.allowedOmissions -- refusing an undeclared partial close`,
    };
  }

  const completedCount = (quorum.completed ?? []).length;
  if (policy.minimumActors !== undefined && completedCount < policy.minimumActors) {
    return {
      eligible: false,
      reason: `only ${completedCount} actor(s) completed in session "${coordinationId}", below the declared partialPolicy.minimumActors (${policy.minimumActors})`,
    };
  }

  return { eligible: true, partial: true };
}

/**
 * Derive the recommended action from the exact eligible Run's own
 * evidence -- never a caller-declared intent (unlike the standalone
 * sibling's `requestedIntent`, this door has no analogous caller input to
 * trust: the Run's OWN state is the only honest source of "what should
 * happen next").
 *
 * @param {{status: 'none'} | {status: 'ambiguous', candidates: string[]} | {status: 'one', assignmentId: string}} eligibility
 * @param {{assignmentId: string, runId: string|null, settledSignal?: {outcome: string}, driverLive?: boolean|null, error?: string}|null} runFacts
 * @param {object} [snapshot]
 */
function deriveRecommendedAction(eligibility, runFacts, snapshot = {}) {
  const recoveryCommands = snapshot.recoveryCommands ?? [];
  const coordinationId = snapshot.manifest?.coordinationId ?? '';

  if (eligibility.status === 'none') {
    const pendingClose = recoveryCommands.find((cmd) => cmd.action === 'close');
    if (pendingClose) {
      return {
        action: 'park',
        reason: `recovery command "${pendingClose.commandId}" (close) is already recorded for session "${coordinationId}" and has not yet been reconciled -- parking rather than duplicating command`,
      };
    }
    const quorumCheck = checkQuorumEligibility(snapshot);
    if (!quorumCheck.eligible) {
      return {
        action: 'park',
        reason: `no session-member Assignment is in flight, but closing is disallowed by quorum rules: ${quorumCheck.reason} -- parking rather than guessing`,
      };
    }
    return {
      action: 'close',
      reason: 'no session-member Assignment is in flight (every one already has a linked result) -- normal completion rules allow closing now',
    };
  }
  if (runFacts?.error) {
    return { action: 'park', reason: `could not read the exact eligible Run's own facts (${runFacts.error}) -- parking rather than guessing` };
  }
  if (!runFacts || runFacts.runId === null) {
    return { action: 'observe', reason: `assignment "${eligibility.assignmentId}" was created but no Run has started for it yet -- observe` };
  }

  const pendingForRun = recoveryCommands.find((cmd) => cmd.runId && cmd.runId === runFacts.runId);

  if (runFacts.settledSignal?.outcome === 'settled') {
    if (pendingForRun?.action === 'collect') {
      return {
        action: 'park',
        reason: `recovery command "${pendingForRun.commandId}" (collect) is already recorded for Run "${runFacts.runId}" and has not yet been reconciled -- parking rather than duplicating command`,
      };
    }
    return {
      action: 'collect',
      reason: `a settled result exists for the exact eligible Run of assignment "${eligibility.assignmentId}" but the session has not linked it yet`,
    };
  }

  if (pendingForRun) {
    return {
      action: 'park',
      reason: `recovery command "${pendingForRun.commandId}" (${pendingForRun.action}) is already recorded for Run "${runFacts.runId}" and has not yet been reconciled -- parking rather than duplicating command`,
    };
  }

  if (runFacts.driverLive) {
    return {
      action: 'observe',
      reason: `the exact eligible Run of assignment "${eligibility.assignmentId}" still has a live control holder -- observe, do not intervene`,
    };
  }
  return {
    action: 'settle',
    reason: `the exact eligible Run of assignment "${eligibility.assignmentId}" has no live control holder and no settled result -- record a forced settlement decision`,
  };
}

/**
 * Is `action` legal to apply RIGHT NOW, given a freshly re-read snapshot?
 * Shared by `plan()` (deciding what to recommend) and the write door's own
 * `checkApply()` re-check (deciding whether a caller-declared action may
 * still be applied) -- one rule, never two independently-decided notions
 * of legality (Acceptance: "read/apply parity with write-door legal-next
 * rules").
 *
 * X11: "close" is refused, never silently converted into a successful
 * recovery, whenever something is still genuinely in flight -- a premature
 * close stays a visible `refuse`, not a quiet `applied`. "collect"/"settle"
 * get their own, symmetric evidence-grounded refusals for the same reason.
 *
 * @returns {{status: 'ok'} | {status: 'refuse'|'needs-input', reason: string}}
 */
export function isActionLegal(snapshot, action) {
  const legal = legalNext(snapshot, {});
  if (legal.kind === 'blocked') {
    return { status: 'refuse', reason: legal.reason };
  }
  if (!RECOVERY_ACTIONS.includes(action)) {
    return { status: 'refuse', reason: `action "${action}" is not a recognized recovery action (expected one of ${RECOVERY_ACTIONS.join(', ')})` };
  }

  const eligibility = findEligibleAssignment(snapshot);
  const runFacts = snapshot.eligibleRunFacts;
  const recoveryCommands = snapshot.recoveryCommands ?? [];

  if (action === 'close') {
    if (eligibility.status !== 'none') {
      const named = eligibility.status === 'one' ? eligibility.assignmentId : eligibility.candidates.join(', ');
      return {
        status: 'refuse',
        reason: `"close" refused: assignment(s) "${named}" still have no linked result -- closing now would be a premature-close hazard (X11), never silently converted into success`,
      };
    }
    const pendingClose = recoveryCommands.find((cmd) => cmd.action === 'close');
    if (pendingClose) {
      return {
        status: 'refuse',
        reason: `"close" refused: recovery command "${pendingClose.commandId}" (close) is already recorded for session "${snapshot.manifest?.coordinationId}" and has not yet been reconciled`,
      };
    }
    const quorumCheck = checkQuorumEligibility(snapshot);
    if (!quorumCheck.eligible) {
      return {
        status: 'refuse',
        reason: `"close" refused: ${quorumCheck.reason}`,
      };
    }
  } else if (action === 'collect') {
    if (eligibility.status !== 'one' || runFacts?.settledSignal?.outcome !== 'settled') {
      return { status: 'refuse', reason: '"collect" refused: no settled result exists yet for the exact eligible Run -- nothing to collect' };
    }
    const pendingCollect = recoveryCommands.find((cmd) => cmd.runId && cmd.runId === runFacts.runId && cmd.action === 'collect');
    if (pendingCollect) {
      return {
        status: 'refuse',
        reason: `"collect" refused: recovery command "${pendingCollect.commandId}" (collect) is already recorded for Run "${runFacts.runId}" and has not yet been reconciled`,
      };
    }
  } else if (action === 'settle') {
    if (eligibility.status !== 'one') {
      return { status: 'refuse', reason: '"settle" refused: no single exact eligible Run is in flight to settle' };
    }
    if (!runFacts || runFacts.runId === null) {
      return { status: 'refuse', reason: '"settle" refused: assignment was created but no Run has started for it yet' };
    }
    if (runFacts?.settledSignal?.outcome === 'settled') {
      return { status: 'refuse', reason: '"settle" refused: the exact eligible Run already produced a settled result -- collect it instead of forcing a settlement' };
    }
    if (runFacts?.driverLive) {
      return { status: 'refuse', reason: '"settle" refused: the exact eligible Run still has a live control holder -- observe instead of forcing a settlement over an active driver' };
    }
    const pendingCmd = recoveryCommands.find((cmd) => cmd.runId && cmd.runId === runFacts.runId);
    if (pendingCmd) {
      return {
        status: 'refuse',
        reason: `"settle" refused: recovery command "${pendingCmd.commandId}" (${pendingCmd.action}) is already recorded for Run "${runFacts.runId}" and has not yet been reconciled`,
      };
    }
  }

  return { status: 'ok' };
}

/**
 * plan(snapshot, opts) -> SessionRecoveryRecommendation | park | needs-input
 *
 * Pure and deterministic: the same snapshot+now always produces the same
 * `action`/`reason`/`actionKey` -- only `expiresAt` (and anything derived
 * from it) is inherently per-call.
 *
 * `opts.authorizedBy`, when supplied, additionally runs the shared
 * `authorize()` evaluator (current-driver check) -- omitted, this stays a
 * pure read with no notion of a caller identity at all, matching Authority
 * And Scope's "other safe observations continue" even when no driver
 * identity is available to check.
 *
 * @param {object} snapshot `{manifest, assignmentRefs, assignments, results, eventCount, eligibleRunFacts}`
 * @param {{now?: Function|string, ttlMs?: number, authorizedBy?: object}} [opts]
 */
export function plan(snapshot, opts = {}) {
  const { now = () => new Date().toISOString(), ttlMs = DEFAULT_TTL_MS, authorizedBy } = opts;

  const legal = legalNext(snapshot, {});
  if (legal.kind === 'blocked') {
    return { kind: 'park', reason: legal.reason };
  }

  if (authorizedBy !== undefined) {
    const authResult = authorize(
      { label: 'coordination recover', subject: 'a session recovery recommendation' },
      { manifest: snapshot.manifest, authorizedBy },
    );
    if (authResult.kind === 'needs-input') {
      return { kind: 'needs-input', reason: authResult.reason };
    }
  }

  const eligibility = findEligibleAssignment(snapshot);
  if (eligibility.status === 'ambiguous') {
    return {
      kind: 'needs-input',
      reason: `more than one in-flight Assignment (${eligibility.candidates.join(', ')}) -- this door recovers exactly one Run at a time, never guessing which`,
    };
  }

  const derived = deriveRecommendedAction(eligibility, snapshot.eligibleRunFacts ?? null, snapshot);
  const legality = isActionLegal(snapshot, derived.action);
  if (legality.status !== 'ok') {
    // A recommended action that is not itself legal right now (should not
    // happen given deriveRecommendedAction's own evidence-grounded choices,
    // but never silently recommend it anyway) parks instead of lying.
    return { kind: 'park', reason: legality.reason };
  }

  const nowIso = typeof now === 'function' ? now() : now;
  const expiresAt = new Date(Date.parse(nowIso) + ttlMs).toISOString();
  const snapshotDigest = computeSnapshotDigest(snapshot);
  const expectedEventSeq = snapshot.eventCount;
  const expectedRunControlEpoch = snapshot.eligibleRunFacts?.controlEpoch ?? 0;
  const actionKey = computeActionKey({ snapshotDigest, expectedEventSeq, expectedRunControlEpoch, action: derived.action, expiresAt });

  return {
    kind: 'recommendation',
    coordinationId: snapshot.manifest.coordinationId,
    snapshotDigest,
    expectedEventSeq,
    expectedRunControlEpoch,
    actionKey,
    action: derived.action,
    expiresAt,
    reason: derived.reason,
    ...(eligibility.status === 'one' ? { assignmentId: eligibility.assignmentId, runId: snapshot.eligibleRunFacts?.runId ?? null } : {}),
  };
}

/**
 * checkApply -- the write door's own re-check, pure: given a FRESHLY
 * re-read snapshot and the 5 CAS expectations a caller is trying to apply,
 * says whether the apply may proceed. Never touches fs/a lock/an
 * action-key ledger itself -- src/verbs/coordination/recover.mjs and
 * store.mjs own those, this only judges.
 *
 * Staleness Rules: mismatched actionKey -> plan-stale; changed snapshot
 * digest -> plan-stale; changed event sequence -> plan-stale; changed Run
 * control epoch -> plan-stale; expired -> plan-stale (this door's public
 * outcome enum has no separate "plan-expired", per contract); a missing/
 * mismatched current driver -> needs-input; anything else routes through
 * the SAME `isActionLegal` the read path's own legality rests on, so a
 * premature "close"/"collect"/"settle" is `refuse`, never a silent
 * `applied`.
 *
 * @returns {{outcome: 'ok'} | {outcome: 'plan-stale'|'needs-input'|'refuse', reason: string}}
 */
export function checkApply({ snapshot, action, expectedSnapshot, expectedEventSeq, expectedRunControlEpoch, expectedExpiresAt, actionKey, authorizedBy, now }) {
  const authResult = authorize(
    { label: 'coordination recover', subject: 'a session recovery apply' },
    { manifest: snapshot.manifest, authorizedBy },
  );
  if (authResult.kind === 'needs-input') {
    return { outcome: 'needs-input', reason: authResult.reason };
  }

  const expectedActionKey = computeActionKey({
    snapshotDigest: expectedSnapshot,
    expectedEventSeq,
    expectedRunControlEpoch,
    action,
    expiresAt: expectedExpiresAt,
  });
  if (actionKey !== expectedActionKey) {
    return { outcome: 'plan-stale', reason: 'actionKey does not match the action/snapshot/eventSeq/epoch/expiresAt it was issued for -- refusing a mismatched replay' };
  }

  const currentEventSeq = snapshot.eventCount;
  if (currentEventSeq !== expectedEventSeq) {
    return {
      outcome: 'plan-stale',
      reason: `the session's event sequence has advanced since this recommendation was issued (expected ${expectedEventSeq}, now ${currentEventSeq})`,
    };
  }

  const currentEpoch = snapshot.eligibleRunFacts?.controlEpoch ?? 0;
  if (currentEpoch !== expectedRunControlEpoch) {
    return {
      outcome: 'plan-stale',
      reason: `the exact eligible Run's control epoch has advanced since this recommendation was issued (expected ${expectedRunControlEpoch}, now ${currentEpoch})`,
    };
  }

  const currentDigest = computeSnapshotDigest(snapshot);
  if (currentDigest !== expectedSnapshot) {
    return { outcome: 'plan-stale', reason: "the session's observed state has changed since this recommendation was issued -- snapshot digest mismatch" };
  }

  const nowMs = typeof now === 'number' ? now : Date.parse(now);
  const expiresAtMs = Date.parse(expectedExpiresAt);
  if (!Number.isFinite(expiresAtMs) || !Number.isFinite(nowMs) || nowMs > expiresAtMs) {
    return { outcome: 'plan-stale', reason: `this recommendation expired at ${expectedExpiresAt}` };
  }

  const legality = isActionLegal(snapshot, action);
  if (legality.status !== 'ok') {
    return { outcome: legality.status, reason: legality.reason };
  }
  return { outcome: 'ok' };
}
