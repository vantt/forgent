// recover.mjs -- the CAS-guarded recovery door for a standalone
// (Assignment-owned, session-authority-free) dispatch Run.
//
// Sibling to show-run.mjs, same run-directory family, opposite capability:
// `dispatch show-run`/`watch` may only observe; `dispatch recover` may
// observe too (no --action: a pure, ephemeral recommendation, no write) but
// may ALSO apply one (--action plus all four CAS expectations), through a
// short, fully-synchronous critical section on the run directory alone.
//
// This module never imports from src/runner/coordination/: a Run reached
// through this door sits outside any coordination session's scope by
// contract ("Standalone recovery stays outside session authority"), so it
// never appends a session event, and it never invokes the unconditional
// close-after-steps that belongs to run.mjs's own coordination-session
// path. The only state this door ever writes is the Run's own directory:
// `run.json`'s `controlEpoch` field, and one line appended to
// `recovery-commands.jsonl` per successfully applied action.

import fs from 'node:fs';
import path from 'node:path';
import { readRunSnapshot } from './show-run.mjs';
import { findRunDir, RunLookupError } from '../../runner/dispatch/assignment-layout.mjs';
import { fgosDirFromRoot } from '../../runner/paths.mjs';
import { plan, checkApply, collectEvidence, RecoveryPlannerError } from '../../runner/dispatch/recovery-planner.mjs';
import { currentGeneration, controlDirs } from '../../run-supervisor/run-lock.mjs';
import { findCoordinationSessionOwningAssignment } from '../../runner/dispatch/runtime-inspection.mjs';
import { classifyRunOutcome } from '../../runner/dispatch/visibility-session.mjs';
import { acquireSync, createLockScope, resolveLock } from '../../holder-lock/index.mjs';
import { adoptRun } from '../../run-supervisor/client.mjs';

export class RecoveryError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'RecoveryError';
    this.code = code;
    this.category = (code === 'run-not-found' || code === 'missing-run' || code === 'run-ambiguous') ? 'precondition' : 'validation';
    Object.assign(this, details);
  }
}

const DEFAULT_INTENT = 'resume';
const RECOVERY_LOG_FILE = 'recovery-commands.jsonl';

function requireRunId(runId) {
  if (typeof runId !== 'string' || !runId.trim()) {
    throw new RecoveryError('invalid-run-id', 'dispatch recover requires a runId');
  }
}

function resolveRunDir(ctx, runId) {
  const repoRoot = ctx?.repoRoot ?? ctx?.cwd ?? process.cwd();
  let runDir;
  try { runDir = findRunDir(fgosDirFromRoot(repoRoot), runId); }
  catch (err) {
    if (err instanceof RunLookupError) {
      throw new RecoveryError(err.code, err.message, { runId, repoRoot, locations: err.locations });
    }
    throw err;
  }
  if (!runDir) {
    throw new RecoveryError('run-not-found', `no run "${runId}" under ${repoRoot}`, { runId, repoRoot });
  }
  return runDir;
}

/** The Run's REAL control epoch, off run-lock.mjs's own generation ledger
 * (`control/generations/`) -- never `run.json.controlEpoch`, which is only
 * a shadow copy nothing fences against a live controller's own
 * acquireRunControl/releaseRunControl calls. `null` (no generation ever
 * published) reads as this module's own "epoch 0" convention, matching the
 * pre-existing schema-1 run.json default. */
function readRealControlEpoch(runDir) {
  const { generationsDir } = controlDirs(runDir);
  return currentGeneration(generationsDir)?.epoch ?? 0;
}

/** The logical facts snapshot recovery-planner.mjs reasons over: run status,
 * the two artifacts (visibility, outbox) that make up this Run's own "event
 * log" (per the planner contract's snapshotHash), the REAL control epoch
 * (H1), and a settled-outcome signal (F1) so a run that settles between
 * plan() and apply -- `result.json` appears, `classifyRunOutcome()` now
 * reports `settled` -- changes the hash even though `run.json.status` may
 * not have been reconciled yet. `runDir` itself is deliberately excluded --
 * an absolute path is not a fact about the run's state, and including it
 * would make the hash sensitive to where the same logical run happens to
 * live on disk (the same reason `settledSignal` stores a path relative to
 * `runDir`, not `resultPath` itself). */
function readEnvelopeAttemptId(runDir) {
  try {
    const envelope = JSON.parse(fs.readFileSync(path.join(runDir, 'envelope.json'), 'utf8'));
    return typeof envelope.attemptId === 'string' ? envelope.attemptId : null;
  } catch { return null; }
}

/** What the run supervisor's read-only adopt probe says about this attempt directory. A host that cannot
 * judge reads as `unprobed`, which no action keys on: the door then behaves as it did before the probe. */
function probeAttempt(runDir) {
  try {
    const verdict = adoptRun(runDir, { probeOnly: true });
    return { state: verdict.state, attemptId: readEnvelopeAttemptId(runDir) };
  } catch {
    return { state: 'unprobed', attemptId: null };
  }
}

const ATTEMPT_CONTRACT_FILES = ['receipt.json', 'gate-exit.json', 'closed.json'];

/** The contract files the supervisor left in the attempt directory, named as evidence. */
function listAttemptFiles(runDir) {
  const names = ATTEMPT_CONTRACT_FILES.filter((name) => fs.existsSync(path.join(runDir, name)));
  try {
    for (const step of fs.readdirSync(path.join(runDir, 'steps')).sort()) names.push(`steps/${step}`);
  } catch { /* no steps directory yet */ }
  return names;
}

function buildSnapshot(runDir) {
  const { run, visibility, outbox, controller = [], visibilityError = null } = readRunSnapshot(runDir);
  const attempt = probeAttempt(runDir);
  const controlEpoch = readRealControlEpoch(runDir);
  const settled = classifyRunOutcome(runDir, { liveness: 'unknown' });
  return {
    run,
    visibility,
    outbox,
    controller,
    visibilityError,
    controlEpoch,
    attempt,
    attemptFiles: listAttemptFiles(runDir),
    settledSignal: { outcome: settled.outcome, resultPath: settled.resultPath ? path.relative(runDir, settled.resultPath) : null },
  };
}

/**
 * `dispatch recover <runId>` without --action: read-only, ephemeral. No fs
 * write of any kind -- calling this twice in a row against an unchanged run
 * produces two recommendations with the same action/reason/evidenceIds
 * (only actionKey/expiresAt differ, being inherently per-call).
 */
export function recoverObserveUseCase(ctx, { runId, intent = DEFAULT_INTENT, now } = {}) {
  requireRunId(runId);
  const runDir = resolveRunDir(ctx, runId);
  const nowFn = typeof now === 'function' ? now : now ? () => now : undefined;
  const snapshot = buildSnapshot(runDir);
  const evidence = collectEvidence(snapshot);
  let recommendation;
  try {
    recommendation = plan(snapshot, evidence, intent, nowFn ? { now: nowFn } : {});
  } catch (err) {
    if (err instanceof RecoveryPlannerError) {
      throw new RecoveryError(err.code, err.message);
    }
    throw err;
  }
  return { runId, runDir, ...recommendation };
}

// A short, fully-synchronous kernel mutex on `<runDir>/locks/recovery.lock`
// (src/holder-lock), scoped to one run directory -- never the repo-wide
// main-checkout lock (that guards unrelated concurrent work-item claims, a
// different resource entirely). Exactly one caller ever runs `fn`, and a
// holder that crashes mid-apply releases the lock with its process, so no
// stale file can block later recovery applies. No I/O inside `fn` is ever
// awaited or spawned, so "acquire, compare, act, release" never spans
// anything slow.
function withRunLock(repoRoot, runDir, fn) {
  // Taking the lock creates its directory; never bring back a run that was deleted.
  if (!fs.existsSync(runDir)) throw new RecoveryError('run-not-found', `run directory ${runDir} is gone`, { runDir });
  const res = acquireSync(createLockScope('recovery'), 'recovery', { runDir, fgosDir: fgosDirFromRoot(repoRoot) });
  if (res.result !== 'acquired') {
    const lockPath = resolveLock('recovery', { runDir }).v3Path;
    throw new RecoveryError('lock-busy', `a recovery apply is already in progress for this run (${lockPath})`, { runDir });
  }
  try {
    return fn();
  } finally {
    res.handle.release();
  }
}

function readRecoveryLog(runDir) {
  const file = path.join(runDir, RECOVERY_LOG_FILE);
  if (!fs.existsSync(file)) return [];
  return fs
    .readFileSync(file, 'utf8')
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line));
}

function appendRecoveryCommand(runDir, record) {
  const file = path.join(runDir, RECOVERY_LOG_FILE);
  fs.appendFileSync(file, `${JSON.stringify(record)}\n`);
}

function recordApplied(runDir, params, nowIso, extra = {}) {
  const record = {
    actionKey: params.actionKey,
    action: params.action,
    appliedAt: nowIso,
    controlEpochBefore: params.expectedControlEpoch,
    controlEpochAfter: params.expectedControlEpoch,
    snapshotHash: params.expectedSnapshot,
    ...extra,
  };
  appendRecoveryCommand(runDir, record);
  return record;
}

// `adopt` settles the attempt through the run supervisor's adopt door: it takes the attempt lock, writes the
// receipt, runs the steps after it and publishes closed.json. It never starts an agent or a second
// supervisor, and the control epoch is not touched (no driver is being replaced).
function applyAdopt(runId, runDir, params, nowIso) {
  const verdict = adoptRun(runDir);
  if (verdict.state !== 'adopted' && verdict.state !== 'closed') {
    return {
      runId,
      runDir,
      outcome: verdict.state === 'open' ? 'adopt-incomplete' : 'held',
      reason: `adopt left the attempt ${verdict.state}${verdict.pendingStep ? ` (step ${verdict.pendingStep} is not done)` : ''}${verdict.reason ? `: ${verdict.reason}` : ''}`,
    };
  }
  const record = recordApplied(runDir, params, nowIso, { adoptState: verdict.state, ...(verdict.outcome ? { adoptOutcome: verdict.outcome } : {}) });
  return { runId, runDir, outcome: 'applied', ...record };
}

const REQUIRED_APPLY_FIELDS = ['action', 'expectedSnapshot', 'expectedControlEpoch', 'expectedExpiresAt', 'actionKey'];

function isMissing(value) {
  return value === undefined || value === null || value === '';
}

/**
 * Apply a previously-issued recommendation. All 5 CAS fields are required
 * -- any missing one refuses before the run directory is even resolved.
 * The critical section (acquire lock, re-read CURRENT state, compare,
 * write, release) is entirely synchronous: nothing inside it can be slow.
 *
 * A repeated call with an already-consumed actionKey returns the SAME
 * recorded outcome without touching run.json or the recovery log again
 * (idempotency) -- checked before the CAS comparison, so a replay can never
 * even reach "stale" for its own prior action key.
 */
export function recoverApplyUseCase(ctx, params = {}) {
  const { runId, now } = params;
  requireRunId(runId);
  const missing = REQUIRED_APPLY_FIELDS.filter((field) => isMissing(params[field]));
  if (missing.length > 0) {
    throw new RecoveryError(
      'missing-expectation',
      `dispatch recover --action requires --action, --expected-snapshot, --expected-control-epoch, --expected-expires-at and --action-key; missing: ${missing.join(', ')}`,
      { missing },
    );
  }
  const runDir = resolveRunDir(ctx, runId);
  const nowIso = typeof now === 'function' ? now() : now ?? new Date().toISOString();
  const repoRoot = ctx?.repoRoot ?? ctx?.cwd ?? process.cwd();
  const assignmentId = readRunSnapshot(runDir).run?.assignmentId ?? null;

  // An adopt over a run a CoordinationSession owns is refused: that session's own recovery door decides it.
  // (Asking whether one owns this assignment only names it; no session state is read or written here.)
  if (params.action?.type === 'adopt' && assignmentId) {
    const sessionOwner = findCoordinationSessionOwningAssignment(repoRoot, assignmentId);
    if (sessionOwner) {
      throw new RecoveryError(
        'session-owned',
        `run "${runId}" (assignment "${assignmentId}") is owned by CoordinationSession "${sessionOwner.id}" -- ${params.action.type} recovery belongs to that session's own recovery door (${sessionOwner.observeCommand}), not dispatch recover`,
        { runId, assignmentId, sessionId: sessionOwner.id },
      );
    }
  }

  return withRunLock(repoRoot, runDir, () => {
    const log = readRecoveryLog(runDir);
    const already = log.find((entry) => entry.actionKey === params.actionKey);
    if (already) {
      return { runId, runDir, outcome: 'already-applied', ...already };
    }

    const snapshot = buildSnapshot(runDir);
    const evidence = collectEvidence(snapshot);
    const check = checkApply({
      snapshot,
      evidence,
      action: params.action,
      expectedSnapshot: params.expectedSnapshot,
      expectedControlEpoch: params.expectedControlEpoch,
      expectedExpiresAt: params.expectedExpiresAt,
      actionKey: params.actionKey,
      now: nowIso,
    });
    if (check.outcome !== 'ok') {
      return { runId, runDir, outcome: check.outcome, reason: check.reason };
    }

    return applyAdopt(runId, runDir, params, nowIso);
  });
}
