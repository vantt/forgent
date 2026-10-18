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
import { createTerminalControl } from '../../terminal-control/client.mjs';
import { readSideFile, StepError } from '../step-support.mjs';

const CAPTURE_TAIL_BYTES = 64 * 1024 * 1024;

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}

function readTail(file) {
  let fd;
  try {
    // The agent can write what the capture files hold: never follow a link it may have put there.
    fd = fs.openSync(file, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0));
    const stat = fs.fstatSync(fd);
    if (!stat.isFile()) return '';
    const { size } = stat;
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

/**
 * What a terminal attempt's pane showed when the attempt ended, for the same evidence the capture files
 * give a direct attempt. The slot is released by the step after this one, so the pane is still there to
 * read; a screen that cannot be read is no evidence, never a failure of the settlement.
 */
function paneScreenOf(runDir, envelope) {
  if (envelope.mode !== 'terminal') return '';
  try {
    const endpoint = readJson(path.join(runDir, 'terminal-endpoint.json')) ?? {};
    const env = {};
    if (endpoint.session) env.HERDR_SESSION = endpoint.session;
    if (endpoint.socket) env.HERDR_SOCKET_PATH = endpoint.socket;
    const tc = createTerminalControl({ hostBin: envelope.hostBin, ...(endpoint.bin ? { herdrBin: endpoint.bin } : {}), ...(Object.keys(env).length ? { env } : {}) });
    const seen = tc.read({ key: envelope.slot.key, source: 'visible' });
    return seen.result === 'screen' ? String(seen.screen ?? '') : '';
  } catch { return ''; }
}

/** The adapter outcome a terminal early end names for the settlement: an agent waiting on a person. */
function terminalAdapterOutcome(receipt) {
  return /^terminal:(blocked|needs-human)/.test(receipt.reason ?? '') ? 'blocked' : null;
}

/** The process facts settleRunOutcome takes, from what the receipt says happened. */
function rawResultOf(receipt, outboxClaimPresent) {
  const gate = receipt.gateExit ?? null;
  const stopped = receipt.outcome !== 'exited';
  const settledAt = gate?.exitedAt ?? receipt.publishedAt ?? new Date().toISOString();
  // A result the agent wrote is judged whatever stopped it afterwards (hard ceiling, orphan, lost gate).
  // A gate whose supervisor was gone ends the agent itself once the result shows: that ends a finished
  // agent, so the signal it died of says nothing about the work.
  const endedAfterResult = gate?.stoppedBy === 'orphan' && gate?.cause === 'orphan-result';
  if (outboxClaimPresent && (stopped || endedAfterResult)) {
    return { exitCode: 0, signal: null, isTimeout: false, settledAt, executionError: null };
  }
  // A terminal attempt the supervisor ended early names why in the receipt reason (the agent waits on a
  // person, the brief could not be confirmed): that is a failed attempt with a reason, not a cancellation.
  if (receipt.outcome === 'cancelled' && /^terminal:/.test(receipt.reason ?? '')) {
    return { exitCode: 1, signal: null, isTimeout: false, settledAt, executionError: new Error(`the agent was stopped: ${receipt.reason}`) };
  }
  switch (receipt.outcome) {
    case 'abandoned-before-brief':
    case 'abandoned-not-started':
      // Nothing the agent could have done answers the work: the attempt never got its brief.
      return { exitCode: 1, signal: null, isTimeout: false, settledAt, executionError: new Error(`${receipt.outcome}: the agent never received its brief${receipt.reason ? ` (${receipt.reason})` : ''}`) };
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
  const screenText = paneScreenOf(runDir, envelope);
  const stdoutText = readTail(capture.stdout) || screenText;
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
      adapterOutcome: terminalAdapterOutcome(receipt),
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
        adapter: envelope.mode === 'terminal' ? 'herdr-spawn' : 'cli-spawn',
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
