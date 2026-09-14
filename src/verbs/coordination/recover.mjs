// recover.mjs — the use-case behind `fgos coordination recover
// <coordinationId>`: the
// COORDINATION-SESSION-scoped analog of `dispatch recover`
// (src/verbs/dispatch/recover.mjs), which owns STANDALONE Run recovery and
// appends no session event at all. This door owns SESSION recovery and
// cannot admit a standalone Run -- it only ever resolves a Run through a
// session's own `assignmentRefs`/replayed event log, never a bare runId a
// caller hands in directly.
//
// No --action: pure, ephemeral observation (`recoverSessionObserveUseCase`)
// -- read-only, safe to call any number of times, no write of any kind.
// With --action (plus all five CAS expectation fields): re-verifies CURRENT
// state via `recovery-planner.mjs`'s own `checkApply()` against a freshly
// rebuilt snapshot, then enters `store.mjs`'s `recordRecoveryCommand` write
// door (which re-verifies the parts a lock-held, zero-extra-cost re-read
// can authoritatively confirm -- event sequence, actionKey, expiry, the
// premature-close check -- see that door's own doc comment for the exact
// staleness-window reasoning).
//
// Both paths share ONE snapshot-building step (`buildSnapshot`, below) and
// ONE eligible-Run-resolution step (`recovery-planner.mjs`'s
// `findEligibleAssignment`), so read and apply can never derive two
// different notions of "what the exact eligible Run even is."

import fs from 'node:fs';
import path from 'node:path';
import { StoreError } from '../../state/store.mjs';
import { CoordinationError, SCHEMA_VERSION_2, RECOVERY_ACTIONS } from '../../runner/coordination/schema.mjs';
import { resolveSessionPaths, recordRecoveryCommand } from '../../runner/coordination/store.mjs';
import { replaySession } from '../../runner/coordination/replay.mjs';
import { plan, checkApply, findEligibleAssignment } from '../../runner/coordination/recovery-planner.mjs';
import { controlDirs, currentGeneration } from '../../runner/dispatch/run-lock.mjs';
import { classifyRunOutcome, readVisibility } from '../../runner/dispatch/visibility-session.mjs';
import { resolveWriterIdentity } from '../../util/session-identity.mjs';

// Mirrors visibility-session.mjs's own DRIVER_FRESH_MS rationale (six
// missed 10s heartbeats). Duplicated rather than imported -- that constant
// is private to visibility-session.mjs, the same reason
// dispatch/recovery-planner.mjs duplicates it.
const DRIVER_FRESH_MS = 60000;

function requireCoordinationId(coordinationId) {
  if (typeof coordinationId !== 'string' || !coordinationId.trim()) {
    throw new StoreError('validation', 'coordination recover requires a coordinationId');
  }
}

function readManifestFor(coordinationId, opts) {
  try {
    return replaySession(coordinationId, opts);
  } catch (err) {
    if (err instanceof CoordinationError && err.category === 'not-found') {
      throw new StoreError('validation', `coordination recover: no session "${coordinationId}" found under .fgos/coordination/sessions/ (${err.message})`);
    }
    throw err;
  }
}

function assertSchema2(coordinationId, manifest) {
  if (manifest.schemaVersion !== SCHEMA_VERSION_2) {
    throw new StoreError(
      'validation',
      `coordination recover: session "${coordinationId}" is schema "${manifest.schemaVersion}" -- session recovery is schema-2 only (schema-1 sessions are unaffected by this cell)`,
    );
  }
}

/** The latest numeric attempt directory under an Assignment's own `runs/`
 * dir, or `null` when the Assignment was created but no Run has started
 * for it yet (a real, legitimate state -- never an error). */
function findLatestRunAttemptDir(fgosDir, assignmentId) {
  const runsDir = path.join(fgosDir, 'assignments', assignmentId, 'runs');
  let attempts;
  try {
    attempts = fs
      .readdirSync(runsDir)
      .filter((d) => /^\d+$/.test(d))
      .sort((a, b) => Number(a) - Number(b));
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
  if (attempts.length === 0) return null;
  const attempt = attempts[attempts.length - 1];
  return { runDir: path.join(runsDir, attempt), attempt };
}

/**
 * The exact eligible Assignment's own Run facts -- control epoch (the REAL
 * epoch, off run-lock.mjs's own generation ledger, never a shadow copy),
 * a settled-outcome signal (reusing `classifyRunOutcome`, the SAME
 * settled-detection `dispatch/recover.mjs`'s own sibling planner already
 * trusts -- never a second, independently-drifting detector), and a
 * liveness reading off the Run's own `visibility.json` heartbeat (the SAME
 * freshness signal `dispatch/recovery-planner.mjs`'s own `collectEvidence`
 * already uses, reused rather than reinvented as a PID-liveness check).
 *
 * Never throws for a legitimate business state (no Run started yet is
 * `runId: null`, not an error) -- only a genuine read failure surfaces as
 * `{error}`, which the planner reads as "park, never guess."
 */
function resolveEligibleRunFacts(fgosDir, assignmentId, nowMs) {
  let found;
  try {
    found = findLatestRunAttemptDir(fgosDir, assignmentId);
  } catch (err) {
    return { assignmentId, runId: null, error: err.message };
  }
  if (!found) {
    return { assignmentId, runId: null, controlEpoch: 0, settledSignal: { outcome: 'unknown' }, driverLive: null };
  }
  const { runDir, attempt } = found;
  const runId = `run_${assignmentId}_${attempt}`;

  let controlEpoch = 0;
  try {
    const { generationsDir } = controlDirs(runDir);
    controlEpoch = currentGeneration(generationsDir)?.epoch ?? 0;
  } catch (err) {
    return { assignmentId, runId, error: err.message };
  }

  let settledSignal = { outcome: 'unknown' };
  try {
    const classified = classifyRunOutcome(runDir, { liveness: 'unknown' });
    settledSignal = { outcome: classified.outcome };
  } catch {
    // No run.json yet (dispatch started, mkdirSync raced the read) --
    // "unknown" is the honest, non-guessing default.
  }

  let driverLive = false;
  try {
    const visibility = readVisibility(runDir);
    const seenAtMs = visibility?.lastSeenAt ? Date.parse(visibility.lastSeenAt) : NaN;
    driverLive = Number.isFinite(seenAtMs) && Number.isFinite(nowMs) && nowMs - seenAtMs < DRIVER_FRESH_MS;
  } catch {
    driverLive = false;
  }

  return { assignmentId, runId, controlEpoch, settledSignal, driverLive };
}

/**
 * Build the ONE snapshot shape both `plan()` and `checkApply()` reason
 * over: session-log facts straight off `replaySession()` (pure, no extra
 * fs beyond what replay already reads), plus the exact eligible
 * Assignment's own Run facts (the one fs-dependent step, resolved for AT
 * MOST one Assignment -- never scanning every member's Run).
 */
function buildSnapshot(coordinationId, opts, nowMs) {
  const replayed = readManifestFor(coordinationId, opts);
  assertSchema2(coordinationId, replayed.manifest);
  const { fgosDir } = resolveSessionPaths(coordinationId, opts);

  const eligibility = findEligibleAssignment({ assignments: replayed.assignments, results: replayed.results });
  const eligibleRunFacts = eligibility.status === 'one' ? resolveEligibleRunFacts(fgosDir, eligibility.assignmentId, nowMs) : null;

  return {
    manifest: replayed.manifest,
    assignmentRefs: replayed.assignmentRefs,
    assignments: replayed.assignments,
    results: replayed.results,
    recoveryCommands: replayed.recoveryCommands,
    eventCount: replayed.events.length,
    eligibleRunFacts,
  };
}

/**
 * `coordination recover <coordinationId>` without --action: pure,
 * ephemeral. No fs write of any kind -- calling this twice in a row
 * against an unchanged session produces two recommendations with the same
 * action/reason (only actionKey/expiresAt differ, being inherently
 * per-call).
 */
export function recoverSessionObserveUseCase(ctx, { coordinationId, now } = {}) {
  requireCoordinationId(coordinationId);
  const opts = { cwd: ctx.cwd, repoRoot: ctx.repoRoot };
  const nowFn = typeof now === 'function' ? now : now ? () => now : () => new Date().toISOString();
  const snapshot = buildSnapshot(coordinationId, opts, Date.parse(nowFn()));
  const recommendation = plan(snapshot, { now: nowFn });
  return { coordinationId, ...recommendation };
}

const REQUIRED_APPLY_FIELDS = ['action', 'expectedSnapshot', 'expectedEventSeq', 'expectedRunControlEpoch', 'expectedExpiresAt', 'actionKey'];

function isMissing(value) {
  return value === undefined || value === null || value === '';
}

/**
 * Apply a previously-issued recommendation. All 5 CAS fields are required
 * -- any missing one refuses before the session is even resolved. The
 * calling driver's own identity is resolved automatically
 * (`resolveWriterIdentity`, the same primitive the main-checkout lock
 * already trusts) rather than taken as a caller-supplied flag -- the
 * Public Contract's own CLI signature names no such flag. `params.authorizedBy`
 * is an explicit override, for a caller (or test) that already knows the
 * exact `{type:'driver', id}` identity to present -- never used by the real
 * CLI path (bin/fgos.mjs never sets it), which always relies on the
 * auto-resolved identity.
 */
export function recoverSessionApplyUseCase(ctx, params = {}) {
  const { coordinationId, now } = params;
  requireCoordinationId(coordinationId);
  const missing = REQUIRED_APPLY_FIELDS.filter((field) => isMissing(params[field]));
  if (missing.length > 0) {
    throw new StoreError(
      'validation',
      `coordination recover --action requires --action, --expected-snapshot, --expected-event-seq, --expected-run-control-epoch, --expected-expires-at and --action-key; missing: ${missing.join(', ')}`,
    );
  }
  if (!RECOVERY_ACTIONS.includes(params.action)) {
    throw new StoreError('validation', `coordination recover --action must be one of ${RECOVERY_ACTIONS.join(', ')}, got "${params.action}"`);
  }

  const opts = { cwd: ctx.cwd, repoRoot: ctx.repoRoot };
  const nowIso = typeof now === 'function' ? now() : now ?? new Date().toISOString();
  const { fgosDir } = resolveSessionPaths(coordinationId, opts);
  const authorizedBy = params.authorizedBy ?? { type: 'driver', id: String(resolveWriterIdentity(fgosDir).id) };

  const snapshot = buildSnapshot(coordinationId, opts, Date.parse(nowIso));

  const already = snapshot.recoveryCommands?.find((cmd) => cmd.invocationKey === params.actionKey);
  if (already) {
    return { coordinationId, outcome: 'already-applied', ...already, appended: false };
  }

  const check = checkApply({
    snapshot,
    action: params.action,
    expectedSnapshot: params.expectedSnapshot,
    expectedEventSeq: Number(params.expectedEventSeq),
    expectedRunControlEpoch: Number(params.expectedRunControlEpoch),
    expectedExpiresAt: params.expectedExpiresAt,
    actionKey: params.actionKey,
    authorizedBy,
    now: nowIso,
  });
  if (check.outcome !== 'ok') {
    return { coordinationId, outcome: check.outcome, reason: check.reason };
  }

  const eligibility = findEligibleAssignment(snapshot);
  const runId = eligibility.status === 'one' ? snapshot.eligibleRunFacts?.runId ?? null : null;

  const result = recordRecoveryCommand(
    coordinationId,
    {
      runId,
      action: params.action,
      expectedSnapshot: params.expectedSnapshot,
      expectedEventSeq: Number(params.expectedEventSeq),
      expectedRunControlEpoch: Number(params.expectedRunControlEpoch),
      expectedExpiresAt: params.expectedExpiresAt,
      actionKey: params.actionKey,
      authorizedBy,
    },
    opts,
  );

  return { coordinationId, ...result };
}
