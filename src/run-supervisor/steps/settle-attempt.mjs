// settle-attempt: turn the physical receipt of an attempt into its work result through the one
// door the Execution Core has (`settleRunOutcome`: Run Result Evaluator, exit.json, evidence.json,
// result.json, run control settled). Safe to run again: a finished settlement is left alone, a
// crash between "run control settled" and "result.json published" is completed with the same token.

import fs from 'node:fs';
import path from 'node:path';
import { settleRunOutcome } from '../../runner/dispatch/settlement.mjs';
import { interpretRunResult } from '../../runner/dispatch/run-result.mjs';
import { computeSha256Digest } from '../../runner/dispatch/proof-helpers.mjs';
import { acquireRunControl, buildRunControlHolder } from '../../runner/dispatch/run-lock.mjs';
import { resolveWorkerArtifactPath } from '../../runner/dispatch/worker-artifacts.mjs';
import { collectModelWarnings } from '../../runner/dispatch/provider-adapter.mjs';
import { strayWriteWarning, watchWritesOutsideWorkspace } from '../../runner/dispatch/stray-writes.mjs';
import { readSideFile, StepError } from '../step-support.mjs';

const CAPTURE_TAIL_BYTES = 64 * 1024 * 1024;

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}

function readTail(file) {
  let fd;
  try {
    fd = fs.openSync(file, 'r');
    const { size } = fs.fstatSync(fd);
    const length = Math.min(size, CAPTURE_TAIL_BYTES);
    const buffer = Buffer.alloc(length);
    fs.readSync(fd, buffer, 0, length, size - length);
    return buffer.toString('utf8');
  } catch { return ''; } finally { if (fd !== undefined) fs.closeSync(fd); }
}

function settledResultOf(runDir, runId) {
  const file = path.join(runDir, 'result.json');
  if (!fs.existsSync(file)) return null;
  try {
    const existing = interpretRunResult(file, { expectedRunId: runId });
    const sound = existing && !existing.corrupt && !existing.contractCorrupt && !existing.resultCorrupt
      && existing.classification?.provenance !== 'contract-corrupt';
    return sound ? existing : null;
  } catch { return null; }
}

function evaluatorBaseline(runDir, outcome) {
  const file = path.join(runDir, 'controller', 'evaluator-baseline.json');
  const baseline = readJson(file);
  if (!baseline) {
    // An attempt that never started has no pre-launch picture to compare with.
    if (outcome === 'abandoned-not-started') return null;
    throw new StepError('io', `evaluator baseline missing or unreadable at ${file}`);
  }
  const { digest, ...body } = baseline;
  if (digest && digest !== computeSha256Digest(body)) {
    throw new StepError('internal', 'evaluator baseline digest mismatch');
  }
  return baseline;
}

/** The run-control token of the attempt: the side file's, else a new epoch only when the writer is dead. */
function controlOf(runDir, envelope) {
  const side = readSideFile(envelope);
  if (side) return { controlEpoch: side.controlEpoch, controlToken: side.controlToken };
  const acquired = acquireRunControl(runDir, {
    holder: buildRunControlHolder(`settle-attempt:${envelope.attemptId}`),
    purpose: 'settle-attempt',
  });
  if (acquired.status === 'acquired') return { controlEpoch: acquired.controlEpoch, controlToken: acquired.controlToken };
  if (acquired.status === 'held') return null;
  throw new StepError('internal', `side file is gone and run control is ${acquired.status}: the settlement cannot be completed`);
}

/** The process facts settleRunOutcome takes, from what the receipt says happened. */
function rawResultOf(receipt, outboxClaimPresent) {
  const gate = receipt.gateExit ?? null;
  const stopped = receipt.outcome !== 'exited';
  const settledAt = gate?.exitedAt ?? receipt.publishedAt ?? new Date().toISOString();
  // A result the agent wrote is judged whatever stopped it afterwards (hard ceiling, orphan, lost gate).
  if (outboxClaimPresent && stopped) {
    return { exitCode: 0, signal: null, isTimeout: false, settledAt, executionError: null };
  }
  switch (receipt.outcome) {
    case 'exited':
      return { exitCode: gate?.exitCode ?? null, signal: gate?.signal ?? null, isTimeout: false, settledAt, executionError: null };
    case 'timeout':
      return { exitCode: gate?.exitCode ?? 124, signal: gate?.signal ?? 'SIGTERM', isTimeout: true, settledAt, executionError: null };
    case 'cancelled':
      return { exitCode: gate?.exitCode ?? null, signal: gate?.signal ?? 'SIGTERM', isTimeout: false, settledAt, executionError: null };
    default:
      return { exitCode: 1, signal: null, isTimeout: false, settledAt, executionError: new Error(receipt.outcome) };
  }
}

export async function settleAttempt({ runDir, envelope }) {
  const runMeta = readJson(path.join(runDir, 'run.json'));
  if (!runMeta?.runId) throw new StepError('io', 'run.json is missing or has no runId');
  const done = settledResultOf(runDir, runMeta.runId);
  if (done) return { result: 'done', detail: { settled: 'already' } };

  const receipt = readJson(path.join(runDir, 'receipt.json'));
  if (!receipt || receipt.attemptId !== envelope.attemptId) throw new StepError('io', 'receipt.json is missing or belongs to another attempt');

  const control = controlOf(runDir, envelope);
  if (!control) return { result: 'retry', reason: 'run-control-held' };

  // The controller's effective assignment (stored fields plus what it backfilled), else the stored one.
  const assignment = readJson(path.join(runDir, 'assignment.json')) ?? readJson(path.join(path.dirname(runDir), '..', 'assignment.json'));
  const baseline = evaluatorBaseline(runDir, receipt.outcome);
  const outboxClaim = resolveWorkerArtifactPath(runDir, /^result-(\d+)\.json$/, 'agent-result.json');
  const raw = rawResultOf(receipt, fs.existsSync(outboxClaim));
  const { capture } = envelope.launch;
  // What the launching controller knew and no file of the attempt carries (policy, provider account,
  // fallback). Absent for an attempt whose controller died before it wrote it: the settlement then
  // simply has less provenance, never a different outcome.
  const context = readJson(path.join(runDir, 'controller', 'settle-context.json')) ?? {};
  const strayWarning = context.strayWatch
    ? strayWriteWarning({ repoRoot: context.strayWatch.repoRoot, strayPaths: watchWritesOutsideWorkspace(context.strayWatch).strayPaths() })
    : null;
  const strayWarnings = strayWarning ? [strayWarning] : [];
  const stdoutText = readTail(capture.stdout);
  const stderrText = readTail(capture.stderr);

  try {
    const settled = await settleRunOutcome({
      runDir,
      runMeta,
      assignment,
      controlEpoch: control.controlEpoch,
      controlToken: control.controlToken,
      exitCode: raw.exitCode,
      signal: raw.signal,
      isTimeout: raw.isTimeout,
      durationMs: null,
      settledAt: raw.settledAt,
      stdoutText,
      stderrText,
      executionError: raw.executionError,
      effectiveCwd: envelope.cwd,
      gitBefore: baseline?.gitBefore ?? null,
      gitBeforeSource: baseline?.gitBeforeSource ?? 'pre-launch',
      dirtyBefore: baseline?.dirtyBefore ?? [],
      dirtyBeforeSnapshots: baseline?.dirtyBeforeSnapshots ?? null,
      launchCommandId: envelope.attemptId,
      dispatchWarnings: strayWarnings,
      inputDigests: context.inputDigests,
      resolvedExecutorId: context.resolvedExecutorId,
      effectivePolicy: context.effectivePolicy,
      executorRedirected: context.executorRedirected ?? false,
      reasoningEffort: context.reasoningEffort,
      modelWarnings: context.modelCheck ? collectModelWarnings(context.modelCheck, { stdout: stdoutText, stderr: stderrText }) : [],
      providerCapacitySelection: context.providerCapacitySelection ?? null,
      providerCapacityEvidence: context.providerCapacityEvidence ?? null,
      fallbackEvidence: context.fallbackEvidence ?? null,
      opts: {
        cwd: envelope.cwd,
        repoRoot: context.repoRoot ?? envelope.cwd,
        updateRunJson: 'settled',
        ...(context.providerCapacityRuntimeDir ? { providerCapacityRuntimeDir: context.providerCapacityRuntimeDir } : {}),
        ...(envelope.mode === 'direct' ? { adapter: 'cli-spawn' } : {}),
      },
    });
    return { result: 'done', detail: { settled: 'now', runId: runMeta.runId, status: settled.status } };
  } catch (err) {
    if (err?.code === 'run-control-superseded') {
      // Another writer settled this run first; its result.json is the answer.
      if (settledResultOf(runDir, runMeta.runId)) return { result: 'done', detail: { settled: 'by-other' } };
      throw new StepError('internal', err.message);
    }
    throw err;
  }
}
