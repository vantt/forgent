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
import { findRunDir, readRunSnapshot } from './show-run.mjs';
import { plan, checkApply, collectEvidence, RecoveryPlannerError } from '../../runner/dispatch/recovery-planner.mjs';
import { acquireRunControl, releaseRunControl, currentGeneration, controlDirs, isProcessAlive } from '../../runner/dispatch/run-lock.mjs';
import { classifyRunOutcome } from '../../runner/dispatch/visibility-session.mjs';

export class RecoveryError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'RecoveryError';
    this.code = code;
    Object.assign(this, details);
  }
}

const DEFAULT_INTENT = 'resume';
const RECOVERY_LOG_FILE = 'recovery-commands.jsonl';
const RUN_FILE = 'run.json';

function requireRunId(runId) {
  if (typeof runId !== 'string' || !runId.trim()) {
    throw new RecoveryError('invalid-run-id', 'dispatch recover requires a runId');
  }
}

function resolveRunDir(ctx, runId) {
  const repoRoot = ctx?.repoRoot ?? ctx?.cwd ?? process.cwd();
  const runDir = findRunDir(repoRoot, runId);
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

/** run-lock.mjs's own "no generation published yet" convention is a `null`
 * current epoch, not `0` -- translate at the one boundary that calls into
 * its real CAS primitive (acquireRunControl), so this module's public
 * 0-based convention never leaks a mismatched literal into that check. */
function toRunLockExpectedEpoch(epoch) {
  return epoch === 0 ? null : epoch;
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
function buildSnapshot(runDir) {
  const { run, visibility, outbox, visibilityError = null } = readRunSnapshot(runDir);
  const controlEpoch = readRealControlEpoch(runDir);
  const settled = classifyRunOutcome(runDir, { liveness: 'unknown' });
  return {
    run,
    visibility,
    outbox,
    visibilityError,
    controlEpoch,
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
  const evidence = collectEvidence(snapshot, nowFn ? { now: nowFn } : {});
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

// A short, fully-synchronous exclusive-create lock scoped to one run
// directory -- never the repo-wide main-checkout lock (that guards
// unrelated concurrent work-item claims, a different resource entirely).
// `fs.openSync(..., 'wx')` is atomic: exactly one caller can create the
// file, so exactly one caller ever runs `fn`. No I/O inside `fn` is ever
// awaited or spawned, so "acquire, compare, act, release" never spans
// anything slow.
function readLockHolderPid(lockPath) {
  let raw;
  try {
    raw = fs.readFileSync(lockPath, 'utf8').trim();
  } catch {
    return null;
  }
  const pid = Number(raw);
  return Number.isInteger(pid) && pid > 0 ? pid : null;
}

function withRunLock(runDir, fn) {
  const lockPath = path.join(runDir, '.recovery.lock');
  let fd;
  try {
    fd = fs.openSync(lockPath, 'wx');
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
    // M1: a crash between lock-acquire and release must not block every
    // future recovery apply forever. The lock file records its holder's
    // own pid; only PID-dead proof (never elapsed time alone, same
    // discipline as run-lock.mjs's own reclaim rule) authorizes reclaiming
    // it. An unreadable/non-numeric holder pid is treated as still live --
    // never guessing a stale lock away.
    const holderPid = readLockHolderPid(lockPath);
    if (holderPid === null || isProcessAlive(holderPid)) {
      throw new RecoveryError('lock-busy', `a recovery apply is already in progress for this run (${lockPath})`, { runDir });
    }
    try { fs.unlinkSync(lockPath); } catch { /* raced with the dead holder's own cleanup -- fine either way */ }
    try {
      fd = fs.openSync(lockPath, 'wx');
    } catch (retryErr) {
      if (retryErr.code === 'EEXIST') {
        throw new RecoveryError('lock-busy', `a recovery apply is already in progress for this run (${lockPath})`, { runDir });
      }
      throw retryErr;
    }
  }
  try {
    fs.writeSync(fd, String(process.pid));
    return fn();
  } finally {
    try { fs.closeSync(fd); } catch { /* already closed is fine */ }
    try { fs.unlinkSync(lockPath); } catch { /* already gone is fine */ }
  }
}

function writeRunJsonPatch(runDir, patch) {
  const file = path.join(runDir, RUN_FILE);
  const current = JSON.parse(fs.readFileSync(file, 'utf8'));
  const next = { ...current, ...patch };
  const tmp = `${file}.tmp-${process.pid}-${Date.now().toString(36)}`;
  fs.writeFileSync(tmp, `${JSON.stringify(next, null, 2)}\n`);
  fs.renameSync(tmp, file);
  return next;
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

  return withRunLock(runDir, () => {
    const log = readRecoveryLog(runDir);
    const already = log.find((entry) => entry.actionKey === params.actionKey);
    if (already) {
      return { runId, runDir, outcome: 'already-applied', ...already };
    }

    const snapshot = buildSnapshot(runDir);
    const evidence = collectEvidence(snapshot, { now: nowIso });
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

    // H1: the actual control-epoch mutation goes through run-lock's own
    // real CAS primitive -- the same generation ledger a live controller's
    // acquireRunControl/releaseRunControl calls fence against -- instead of
    // bumping the shadow run.json.controlEpoch field directly. A live
    // controller genuinely holding the run is refused here, never silently
    // overwritten. This is also the one exclusive resource this door can
    // acquire before its own write, so F5's fresh settled re-check (below)
    // is deliberately sequenced AFTER this, not before it.
    const controlResult = acquireRunControl(runDir, {
      holder: { id: 'dispatch-recover', pid: process.pid },
      purpose: `recovery-apply:${params.action?.type ?? 'unknown'}`,
      expectedControlEpoch: toRunLockExpectedEpoch(params.expectedControlEpoch),
      now: Date.now(),
    });
    if (controlResult.status === 'stale') {
      return {
        runId,
        runDir,
        outcome: 'plan-stale',
        reason: `the run's real control epoch has advanced since this recommendation was issued (expected ${params.expectedControlEpoch}, now ${controlResult.controlEpoch ?? 0})`,
      };
    }
    if (controlResult.status === 'held') {
      return {
        runId,
        runDir,
        outcome: 'held',
        reason: `run control is currently held by a live driver (epoch ${controlResult.controlEpoch}) -- refusing to apply recovery over an active controller`,
        holder: controlResult.holder,
      };
    }

    // F5: the LAST read before the write, not the first read after the CAS
    // checks -- markRunSettled/reconcileRun touch run.json OUTSIDE this
    // lock/epoch, so this has to run after acquireRunControl above (the one
    // exclusive resource this door holds) to actually shrink the race
    // window down to the length of the write itself, rather than covering
    // the acquireRunControl call too. A settle-writer that never routes
    // through acquireRunControl at all (e.g. cli.mjs's closeRun, a
    // status-only flip) is a documented residual this reordering narrows
    // but cannot close -- fixing that writer's own locking is out of this
    // door's lease.
    const freshOutcome = classifyRunOutcome(runDir, { liveness: 'unknown' });
    if (freshOutcome.outcome === 'settled') {
      // The control epoch was already bumped by acquireRunControl above;
      // release it immediately rather than leaving it held with no
      // corresponding recovery action, so a resumed/reassigned real driver
      // is never blocked behind an apply that ultimately refused.
      releaseRunControl(runDir, { controlEpoch: controlResult.controlEpoch, controlToken: controlResult.controlToken });
      return {
        runId,
        runDir,
        outcome: 'plan-stale',
        reason: 'the run settled moments before this recovery apply reached its write -- refusing to record a recovery action against a settled run',
      };
    }

    const controlEpochBefore = params.expectedControlEpoch;
    const controlEpochAfter = controlResult.controlEpoch;
    // The recovery decision is ephemeral, not an ongoing hold: release
    // immediately so a resumed/reassigned real driver's own
    // acquireRunControl call is never blocked behind this door's token.
    releaseRunControl(runDir, { controlEpoch: controlEpochAfter, controlToken: controlResult.controlToken });
    writeRunJsonPatch(runDir, { controlEpoch: controlEpochAfter });
    const record = {
      actionKey: params.actionKey,
      action: params.action,
      appliedAt: nowIso,
      controlEpochBefore,
      controlEpochAfter,
      snapshotHash: params.expectedSnapshot,
    };
    appendRecoveryCommand(runDir, record);
    return { runId, runDir, outcome: 'applied', ...record };
  });
}
