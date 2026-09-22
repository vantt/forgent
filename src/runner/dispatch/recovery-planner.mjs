// recovery-planner.mjs -- pure recovery-recommendation planner for
// standalone (session-authority-free) Assignment-owned dispatch Runs.
//
// Sibling to src/runner/coordination/read-evaluators.mjs, same discipline
// (AD-11: domain decisions live in pure evaluators/planners; adapters own
// filesystem details; a write door stays the only mutation boundary) but a
// DIFFERENT authority: a Run recovered through this door is explicitly
// outside any coordination session's scope ("Standalone recovery stays
// outside session authority"), so this module never imports from
// src/runner/coordination/ -- importing that runtime here would fold a
// standalone Run back under session authority, which is exactly the scope
// violation the owning cell's contract forbids.
//
// Every function below is a pure function of its arguments: no fs, no
// child_process, no network, no mutation, no reading of ambient/global
// state. `node:crypto`'s hash primitive is the one import, pure with
// respect to the arguments given (never touches disk/network).
// The caller (src/verbs/dispatch/recover.mjs) gathers the `snapshot` these
// functions need -- already-read facts, never fetched here -- and passes it
// in explicitly.

import { createHash } from 'node:crypto';

export class RecoveryPlannerError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'RecoveryPlannerError';
    this.code = code;
    Object.assign(this, details);
  }
}

// The only evidence types this planner can interpret. Evidence of any other
// type is never guessed at -- it parks the recommendation (Staleness Rules:
// "unknown/unrecognized external evidence -> park, never a guessed action").
const RECOGNIZED_EVIDENCE_TYPES = Object.freeze(['liveness', 'worker-result', 'replacement-authority']);

// The only requestedIntent values a caller may declare. An intent outside
// this set is a malformed call (not a park-worthy runtime fact), so it
// throws rather than returning a typed outcome -- the same distinction
// show-run.mjs draws between "invalid-run-id" (thrown) and "run-not-found"
// (thrown, but for a legitimate lookup miss); an unrecognized intent is
// caller misuse, closer to the former.
const RECOGNIZED_INTENTS = Object.freeze(['resume', 'reassign']);

// Mirrors visibility-session.mjs's own DRIVER_FRESH_MS rationale (six
// missed 10s heartbeats): long enough that a slow filesystem or a busy
// machine never costs a live driver its "fresh" reading, short enough that
// a killed dispatch shows up within a minute. Duplicated rather than
// imported -- that constant is private to visibility-session.mjs, and this
// module may not import fs-adjacent modules regardless.
const DRIVER_FRESH_MS = 60000;

// How long a fresh recommendation stays applicable. Long enough for a
// person to read a recommendation and decide; short enough that a
// recommendation captured hours ago can never be replayed against
// present-day evidence just because the snapshot/epoch happen to still
// match.
export const DEFAULT_TTL_MS = 5 * 60 * 1000;

function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`;
}

/** Deterministic digest over the caller-supplied snapshot: stable key order,
 * so two calls given the same facts always produce the same hash regardless
 * of property insertion order. This IS the "event-log hash" the Staleness
 * Rules name -- a dispatch Run has no event log of its own the way a
 * coordination session does, so its observed-facts snapshot (run/visibility/
 * outbox) stands in for one. */
export function computeSnapshotHash(snapshot) {
  return createHash('sha256').update(stableStringify(snapshot)).digest('hex');
}

function evidenceIdsOf(evidence) {
  return evidence.map((e) => e.id);
}

/** Facts every caller (plan, checkApply) must agree on before branching on
 * intent/action: unrecognized evidence parks unconditionally, and a
 * settled run has nothing left to recover. Shared so the read path and the
 * write path's re-check can never drift into two different notions of
 * "what is legal right now" (Acceptance: "Read and write paths ... must
 * derive from and return identical authorization and legal-next facts"). */
function checkPreconditions(snapshot, evidence) {
  const unknown = evidence.filter((e) => !RECOGNIZED_EVIDENCE_TYPES.includes(e.type));
  if (unknown.length > 0) {
    return {
      status: 'park',
      reason: `unrecognized evidence type(s): ${unknown.map((e) => `${e.id}:${e.type}`).join(', ')} -- never guessing an action over evidence this door cannot interpret`,
    };
  }
  // R3: consult the settled-outcome signal (F1's own snapshot field), not
  // just run.json.status -- a run whose result.json already landed is
  // "nothing to recover" even before run.json.status has been reconciled to
  // 'settled'. Read-door defense-in-depth alongside recover.mjs's own F5
  // write-door re-check, not a substitute for it.
  if (snapshot.run?.status === 'settled' || snapshot.settledSignal?.outcome === 'settled') {
    return { status: 'park', reason: 'run already settled -- there is nothing to recover' };
  }
  return null;
}

/**
 * legalNext-and-authorize in one step, folded together because this
 * domain's "legal action" and "who may take it" are the same evidence-driven
 * question (unlike the coordination session's authorize, which checks a
 * caller identity against a fixed provenance root).
 *
 * @param {object} snapshot {run, visibility, outbox, visibilityError}
 * @param {Array<{id:string, type:string}>} evidence
 * @param {'resume'|'reassign'} requestedIntent
 * @returns {{status:'ok', action:object, reason:string} | {status:'needs-input'|'park', reason:string}}
 */
export function deriveRecoveryFacts(snapshot, evidence, requestedIntent) {
  if (!RECOGNIZED_INTENTS.includes(requestedIntent)) {
    throw new RecoveryPlannerError(
      'invalid-intent',
      `requestedIntent must be one of ${RECOGNIZED_INTENTS.join('/')}, got: ${JSON.stringify(requestedIntent)}`,
    );
  }
  const blocked = checkPreconditions(snapshot, evidence);
  if (blocked) return blocked;

  if (requestedIntent === 'resume') {
    // Phase 03 R3/M15a: `collectEvidence` already computes a `liveness`
    // entry (`fresh` from `visibility.lastSeenAt` vs. the same freshness
    // window a live driver's own heartbeat renews), but this branch never
    // consulted it -- resume was authorized purely on "not settled", which
    // is also true of a Run whose driver is still very much alive and
    // heartbeating. That is exactly how a second worker got spawned over a
    // live one: resume-driver told the caller it was safe to clear the
    // dispatch claim and relaunch while the original driver was still
    // running. Strict `=== false`, not merely falsy -- missing evidence or
    // an unconfirmed reading must never default to "safe to resume",
    // matching this module's "never guessing an action" rule.
    const liveness = evidence.find((e) => e.type === 'liveness');
    if (!liveness) {
      return {
        status: 'needs-input',
        reason: 'resume requested but no liveness evidence was supplied -- fresh/not-fresh cannot be guessed',
      };
    }
    if (liveness.fresh !== false) {
      return {
        status: 'park',
        reason: 'resume refused: the driver\'s last heartbeat is still fresh (or freshness could not be confirmed) -- a live driver may still be running this Run',
      };
    }
    return {
      status: 'ok',
      action: { type: 'resume-driver' },
      reason: 'run is not settled, no unrecognized evidence was found, and the driver has no fresh heartbeat (liveness.fresh === false) -- the current driver may resume',
    };
  }

  // requestedIntent === 'reassign'
  const authority = evidence.find((e) => e.type === 'replacement-authority');
  if (!authority) {
    return {
      status: 'needs-input',
      reason: 'reassign requested but no replacement-authority evidence names a fresh driver -- a fresh driver never gets a silent default action',
    };
  }
  return {
    status: 'ok',
    action: { type: 'reassign-driver', toDriverId: authority.driverId },
    reason: `replacement-authority evidence "${authority.id}" names driver "${authority.driverId}"`,
  };
}

/** Is `action` (already decided, at some earlier plan() call) still legal
 * given a FRESH snapshot/evidence? Deliberately intent-free: the write path
 * never learns the original requestedIntent back (it is not part of the 5
 * CAS-expectation fields), so it re-derives legality from the action's own
 * declared shape instead of re-picking one via intent -- the same
 * `checkPreconditions` gate `deriveRecoveryFacts` uses, so "legal right now"
 * can never diverge between the two paths. */
export function isActionLegal(snapshot, evidence, action) {
  const blocked = checkPreconditions(snapshot, evidence);
  if (blocked) return blocked;

  if (!action || typeof action !== 'object' || typeof action.type !== 'string') {
    return { status: 'park', reason: 'action is missing or malformed -- never guessing what was meant' };
  }
  if (action.type === 'resume-driver') {
    // Phase 03 R3/M15a: the same strict `fresh === false` requirement
    // `deriveRecoveryFacts`'s `resume` branch now applies -- this function's
    // own doc comment says "legal right now can never diverge between the
    // two paths", so a live-driver check missing from ONE of them is a
    // divergence, not an independent bug to fix once.
    const liveness = evidence.find((e) => e.type === 'liveness');
    if (!liveness) {
      return { status: 'needs-input', reason: 'resume-driver re-check found no liveness evidence -- fresh/not-fresh cannot be guessed' };
    }
    if (liveness.fresh !== false) {
      return { status: 'park', reason: 'resume-driver no longer legal: the driver\'s last heartbeat is fresh (or freshness could not be confirmed) at re-check time' };
    }
    return { status: 'ok', reason: 'resume-driver remains legal: run is not settled, evidence is recognized, and the driver has no fresh heartbeat' };
  }
  if (action.type === 'reassign-driver') {
    const authority = evidence.find((e) => e.type === 'replacement-authority' && e.driverId === action.toDriverId);
    if (!authority) {
      return {
        status: 'needs-input',
        reason: `no replacement-authority evidence for driver "${action.toDriverId}" -- a fresh driver never gets a silent default action`,
      };
    }
    return { status: 'ok', reason: `replacement-authority evidence still names driver "${action.toDriverId}"` };
  }
  return { status: 'park', reason: `unrecognized action type "${action.type}"` };
}

/** Deterministically binds `actionKey` to the exact recommendation it was
 * issued for -- (snapshotHash, controlEpoch, action, expiresAt). A CAS/
 * staleness binding, not a secrecy boundary: this is what lets apply-time
 * refuse a still-unconsumed key presented alongside a DIFFERENT action or a
 * re-declared expiresAt than what plan() actually produced for that key. */
export function computeActionKey({ snapshotHash, controlEpoch, action, expiresAt }) {
  return createHash('sha256').update(stableStringify({ snapshotHash, controlEpoch, action, expiresAt })).digest('hex');
}

/**
 * plan(snapshot, evidence, requestedIntent) -> RecoveryRecommendation
 *
 * Pure and deterministic: the same snapshot+evidence+requestedIntent+now
 * always produces the same `action`/`reason`/`evidenceIds`/
 * `expectedControlEpoch`/`actionKey` -- only `expiresAt` (and anything
 * derived from it) is inherently per-call, via `now`.
 *
 * `expectedControlEpoch` reads `snapshot.controlEpoch` -- the caller
 * (recover.mjs) is expected to have sourced that from run-lock.mjs's own
 * current-generation accessor, never from the Run's own shadow
 * `run.json.controlEpoch` field, which nothing fences against a live
 * controller.
 *
 * @returns {{kind:'recommendation', snapshotHash:string, expectedControlEpoch:number, actionKey:string, evidenceIds:string[], action:object, expiresAt:string, reason:string}
 *         | {kind:'needs-input'|'park', reason:string, evidenceIds:string[]}}
 */
export function plan(snapshot, evidence, requestedIntent, opts = {}) {
  const { now = () => new Date().toISOString(), ttlMs = DEFAULT_TTL_MS } = opts;
  const facts = deriveRecoveryFacts(snapshot, evidence, requestedIntent);
  const evidenceIds = evidenceIdsOf(evidence);

  if (facts.status === 'park') return { kind: 'park', reason: facts.reason, evidenceIds };
  if (facts.status === 'needs-input') return { kind: 'needs-input', reason: facts.reason, evidenceIds };

  const nowIso = typeof now === 'function' ? now() : now;
  const expiresAt = new Date(Date.parse(nowIso) + ttlMs).toISOString();
  const snapshotHash = computeSnapshotHash(snapshot);
  const expectedControlEpoch = snapshot.controlEpoch ?? 0;
  const actionKey = computeActionKey({ snapshotHash, controlEpoch: expectedControlEpoch, action: facts.action, expiresAt });
  return {
    kind: 'recommendation',
    snapshotHash,
    expectedControlEpoch,
    actionKey,
    evidenceIds,
    action: facts.action,
    expiresAt,
    reason: facts.reason,
  };
}

/**
 * checkApply -- the write door's own re-check, pure: given a FRESHLY
 * re-read snapshot/evidence and the 5 CAS expectations a caller is trying
 * to apply, says whether the apply may proceed. Never touches fs/a lock/an
 * action-key ledger itself -- recover.mjs owns those, this only judges.
 *
 * Staleness Rules: mismatched actionKey -> plan-stale; changed snapshot
 * hash -> plan-stale; changed control epoch -> plan-stale; expired ->
 * plan-expired; anything else routes through the SAME isActionLegal the
 * read path's legality rests on.
 *
 * @returns {{outcome:'ok'} | {outcome:'plan-stale'|'plan-expired'|'needs-input'|'park', reason:string}}
 */
export function checkApply({ snapshot, evidence, action, expectedSnapshot, expectedControlEpoch, expectedExpiresAt, actionKey, now }) {
  const expectedActionKey = computeActionKey({
    snapshotHash: expectedSnapshot,
    controlEpoch: expectedControlEpoch,
    action,
    expiresAt: expectedExpiresAt,
  });
  if (actionKey !== expectedActionKey) {
    return {
      outcome: 'plan-stale',
      reason: 'actionKey does not match the action/snapshot/epoch/expiresAt it was issued for -- refusing a mismatched replay',
    };
  }
  const currentHash = computeSnapshotHash(snapshot);
  if (currentHash !== expectedSnapshot) {
    return {
      outcome: 'plan-stale',
      reason: 'the run\'s observed state (visibility/outbox) has changed since this recommendation was issued -- snapshot hash mismatch',
    };
  }
  const currentEpoch = snapshot.controlEpoch ?? 0;
  if (currentEpoch !== expectedControlEpoch) {
    return {
      outcome: 'plan-stale',
      reason: `the run's control epoch has advanced since this recommendation was issued (expected ${expectedControlEpoch}, now ${currentEpoch})`,
    };
  }
  const nowMs = typeof now === 'number' ? now : Date.parse(now);
  const expiresAtMs = Date.parse(expectedExpiresAt);
  if (!Number.isFinite(expiresAtMs) || !Number.isFinite(nowMs) || nowMs > expiresAtMs) {
    return { outcome: 'plan-expired', reason: `this recommendation expired at ${expectedExpiresAt}` };
  }
  const legality = isActionLegal(snapshot, evidence, action);
  if (legality.status === 'park') return { outcome: 'park', reason: legality.reason };
  if (legality.status === 'needs-input') return { outcome: 'needs-input', reason: legality.reason };
  return { outcome: 'ok' };
}

/** Derive evidence from an already-read snapshot's own outbox/visibility --
 * pure, no fs of its own (the snapshot was already read by the caller).
 * File-naming convention: `replacement-authority--<driverId>.json` names a
 * fresh driver's authorization; `ack-*`/`report-*`/`result.json` are the
 * worker's own result artifacts (same prefixes findWorkerResult/the outbox
 * convention already use elsewhere); anything else is `unknown` -- which is
 * exactly what routes a recommendation to `park` rather than a guess. */
export function collectEvidence(snapshot, opts = {}) {
  const { now = () => new Date().toISOString() } = opts;
  const nowIso = typeof now === 'function' ? now() : now;
  const nowMs = Date.parse(nowIso);
  const evidence = [];

  const lastSeenAt = snapshot.visibility?.lastSeenAt;
  const seenAtMs = lastSeenAt ? Date.parse(lastSeenAt) : NaN;
  const fresh = Number.isFinite(seenAtMs) && Number.isFinite(nowMs) && nowMs - seenAtMs < DRIVER_FRESH_MS;
  evidence.push({ id: 'liveness', type: 'liveness', fresh });

  for (const entry of snapshot.outbox ?? []) {
    const name = entry.name;
    const authorityMatch = /^replacement-authority--(.+)\.json$/.exec(name);
    if (authorityMatch) {
      evidence.push({ id: name, type: 'replacement-authority', driverId: authorityMatch[1] });
      continue;
    }
    if (/^(ack|report)-/.test(name) || name === 'result.json') {
      evidence.push({ id: name, type: 'worker-result' });
      continue;
    }
    evidence.push({ id: name, type: 'unknown' });
  }
  return evidence;
}
