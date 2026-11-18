// settle-attempt: turn the physical receipt of an attempt into its work result through the one
// door the Execution Core has (`settleRunOutcome`: Run Result Evaluator, exit.json, evidence.json,
// result.json, run control settled). Safe to run again: a finished settlement is left alone, a
// crash between "run control settled" and "result.json published" is completed with the same token.

import fs from 'node:fs';
import path from 'node:path';
import { settleRunOutcome } from '../../runner/dispatch/settlement.mjs';
import { readSettledResult } from '../../runner/dispatch/run-result.mjs';
import { computeSha256Digest, openAgentFileSync } from '../../native/proof-helpers.mjs';
import { acquireRunControl, buildRunControlHolder } from '../run-lock.mjs';
import { collectModelWarnings } from '../../runner/dispatch/provider-adapter.mjs';
import { strayWriteWarning, watchWritesOutsideWorkspace } from '../stray-writes.mjs';
import { createTerminalControl } from '../../terminal-control/client.mjs';
import { readSideFile, StepError } from '../step-support.mjs';
import { CLAIM_FRICTION_FIELD_MAX } from '../../runner/dispatch/agent-result-claim-contract.mjs';
import { assignmentDir } from '../../runner/dispatch/assignment-layout.mjs';
import { recordFriction } from '../../observe/friction-client.mjs';

const CAPTURE_TAIL_BYTES = 64 * 1024 * 1024;

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}

function readTail(file) {
  let fd;
  try {
    // The agent can write what the capture files hold: never follow a link it may have put there.
    let stat;
    ({ fd, stat } = openAgentFileSync(file));
    const { size } = stat;
    const length = Math.min(size, CAPTURE_TAIL_BYTES);
    const buffer = Buffer.alloc(length);
    fs.readSync(fd, buffer, 0, length, size - length);
    return buffer.toString('utf8');
  } catch { return ''; } finally { if (fd !== undefined) fs.closeSync(fd); }
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
  // A record written before placement went through the Session Host names it `mode`.
  if ((envelope.host ?? envelope.mode) !== 'terminal') return '';
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

/** The blocked names that are a provider stop, and the cause each names. */
const PROVIDER_STOP_CAUSE = new Map([['usage-limit', 'quota'], ['login', 'credential'], ['provider-error', 'provider']]);

/**
 * The provider stop a receipt reason names: the one table from the supervisor's name to an outcome.
 * `*:blocked:usage-limit`, `*:blocked:login` and `*:blocked:provider-error` are a provider limit, which
 * moves the caller to another account or candidate (a login is also a credential fault, so the walk does
 * not land on the provider whose login just failed; a provider error is the provider's own fault, such as
 * an HTTP 404 for the model); every other blocked name, `terminal:needs-human` and `terminal:needs-setup` (a CLI's first-run setup) is a
 * person to wait for, never a success. A result in the outbox is judged as reported whatever else the
 * receipt says. The outcome stays the receipt's own: a deadline stop that names the provider is still
 * a timeout. A name this table does not know settles on the receipt outcome alone. A provider stop carries
 * the receipt's `providerSignal` (the provider's own status, requested wait and reset hint) as `signal`.
 */
export function providerStopOf(receipt, claimed = Boolean(receipt.outboxResult)) {
  if (claimed) return null;
  const reason = receipt.reason ?? '';
  const blocked = /^(?:terminal|direct):blocked:(.+)$/.exec(reason);
  const waiting = { adapterOutcome: 'blocked', cause: null, signal: null };
  if (blocked) {
    const cause = PROVIDER_STOP_CAUSE.get(blocked[1]);
    return cause ? { adapterOutcome: 'provider-limit', cause, signal: receipt.providerSignal ?? null } : waiting;
  }
  return reason === 'terminal:needs-human' || reason === 'terminal:needs-setup' ? waiting : null;
}

/**
 * The claim file this attempt's settlement judges, or null. The receipt names the newest result in the
 * attempt's outbox by the agent protocol's rule, and every worker, headless or interactive, is told to write
 * its claim there, so a receipt that names nothing means the attempt left no claim.
 */
function claimOf(envelope, receipt) {
  if (!receipt.outboxResult) return null;
  if (path.basename(receipt.outboxResult) !== receipt.outboxResult) throw new StepError('io', 'receipt.json names an outbox result outside the outbox');
  return path.join(envelope.launch.outboxDir, receipt.outboxResult);
}

const FALLS_BACK = 'the seat walk falls back to another account or candidate.';
const ANSWER_PROMPT = 'Next: answer the prompt in the pane, then run again.';

/** What a person does next for each stop the supervisor named; a stop that waits on nobody has none. */
const STOP_REMEDY = {
  'terminal:blocked:trust-dialog': "Next: grant trust for this project in the agent's own home, then run again.",
  'terminal:blocked:login': "Next: log the agent in again on this account (in the agent's own home), then run again.",
  'terminal:blocked:usage-limit': `The account's quota or credits are used up: wait for the reset or add credits; ${FALLS_BACK}`,
  'terminal:blocked:provider-error': `The provider refused the round with an API error (a fault on its side, such as a model it does not serve to this account); ${FALLS_BACK}`,
  'terminal:needs-setup': "Next: finish the CLI's first-run setup once by hand on the same profile (for omp, `omp --profile=<profile>`), then run again.",
  'terminal:needs-human': ANSWER_PROMPT,
};

/** Why a terminal attempt was stopped, in the words of its screen, and the remedy for that reason: a person reads this, not a log. */
export function terminalStopMessage(receipt, screenText) {
  const tail = String(screenText ?? '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean).slice(-6).join(' / ');
  // A blocked name this table does not know is still a person to wait for (providerStopOf).
  const remedy = STOP_REMEDY[receipt.reason] ?? (/^terminal:blocked:/.test(receipt.reason) ? ANSWER_PROMPT : '');
  return `the agent was stopped: ${receipt.reason}.${tail ? ` Its screen ended with: ${tail}.` : ''}${remedy ? ` ${remedy}` : ''}`;
}

/** The process facts settleRunOutcome takes, from what the receipt says happened. */
function rawResultOf(receipt, outboxClaimPresent, screenText = '') {
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
    return { exitCode: 1, signal: null, isTimeout: false, settledAt, executionError: new Error(terminalStopMessage(receipt, screenText)) };
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

// One budget for recording every friction of a claim: checked before each record, so a slow host delays the step by
// at most this plus one host call.
const CLAIM_FRICTIONS_DEADLINE_MS = 10_000;
// A worker value that becomes a host flag value: one line, never read as a flag.
const FRICTION_TEXT = /^[^\s-][^\n]*$/;
const FRICTION_CLASS = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const frictionText = (value, pattern = FRICTION_TEXT) => {
  if (typeof value !== 'string') return undefined;
  const text = value.trim();
  return text.length <= CLAIM_FRICTION_FIELD_MAX && pattern.test(text) ? text : undefined;
};

// The plan and phase the Unit run serves, read from its stored record beside the attempt's own assignment
// (`<fgos>/assignments/<assignmentId>/runs/<NN>`); null when there is none.
function unitPlanOf(runDir, assignmentId, unitRunId) {
  if (typeof assignmentId !== 'string' || assignmentId === '' || typeof unitRunId !== 'string' || unitRunId === '') return null;
  const assignmentsDir = path.resolve(runDir, '..', '..', ...assignmentId.split('/').map(() => '..'));
  if (path.basename(assignmentsDir) !== 'assignments') return null;
  const dir = assignmentDir(path.dirname(assignmentsDir), unitRunId);
  const plan = dir ? readJson(path.join(dir, 'unit.json'))?.unit?.plan : null;
  if (typeof plan?.dir !== 'string' || plan.dir === '') return null;
  return { dir: plan.dir, phase: typeof plan.phase === 'string' && plan.phase !== '' ? plan.phase : null };
}

/**
 * Record the frictions a settled worker claim lists through the friction door, with refs to the run and to the Unit's
 * plan and phase. It runs after the outcome is settled and never changes it: a record the host cannot store is logged
 * as a fault and warned by the friction client, a refused or malformed entry is warned and skipped, entries past
 * the deadline are dropped with a warning; settlement has already cut the list to the claim limit.
 */
function recordClaimFrictions({ agentClaim, root, runDir, assignmentId, runId, unitRunId, workId }) {
  const entries = Array.isArray(agentClaim?.frictions) ? agentClaim.frictions : [];
  if (entries.length === 0) return;
  const warn = (message) => console.error(`fgos: warning: worker friction ${message}`);
  // Settlement already kept the claim's first entries and counted the rest.
  if (agentClaim.frictionsDropped > 0) warn(`list was cut at settlement: ${agentClaim.frictionsDropped} entries dropped`);
  const subject = workId ? null : (unitRunId ? `run:${unitRunId}` : `run:${runId}`);
  const plan = unitPlanOf(runDir, assignmentId, unitRunId);
  const refs = [
    { kind: 'run', id: runId },
    ...(plan ? [{ kind: 'plan', id: plan.dir }, ...(plan.phase ? [{ kind: 'phase', id: plan.phase }] : [])] : []),
  ];
  const deadline = Date.now() + CLAIM_FRICTIONS_DEADLINE_MS;
  for (const [index, entry] of entries.entries()) {
    if (Date.now() > deadline) {
      warn(`recording passed its ${CLAIM_FRICTIONS_DEADLINE_MS} ms deadline; ${entries.length - index} entries not recorded`);
      return;
    }
    const valid = entry !== null && typeof entry === 'object' && !Array.isArray(entry);
    const kind = valid ? frictionText(entry.kind) : undefined;
    const layer = valid ? frictionText(entry.layer) : undefined;
    const errorClass = valid ? frictionText(entry.errorClass, FRICTION_CLASS) : undefined;
    if (!layer || !errorClass || (valid && entry.kind != null && !kind)) {
      warn(`entry ${index + 1} skipped: layer and errorClass must be single lines of at most ${CLAIM_FRICTION_FIELD_MAX} characters, errorClass a lowercase-hyphenated signature`);
      continue;
    }
    try {
      recordFriction(root, {
        ...(subject ? { subject } : { id: workId }), kind, layer, errorClass, disposition: 'advisory', producer: 'worker-claim', refs,
        detail: typeof entry.detail === 'string' ? entry.detail : '',
      });
    } catch (err) {
      // The host refused this entry's values; the rest still record.
      warn(`entry ${index + 1} refused: ${err.message}`);
    }
  }
}

export async function settleAttempt({ runDir, envelope }) {
  const runMeta = readJson(path.join(runDir, 'run.json'));
  if (!runMeta?.runId) throw new StepError('io', 'run.json is missing or has no runId');
  const done = readSettledResult(runDir, runMeta.runId);
  if (done) return { result: 'done', detail: { settled: 'already' } };

  const receipt = readJson(path.join(runDir, 'receipt.json'));
  if (!receipt || receipt.attemptId !== envelope.attemptId) throw new StepError('io', 'receipt.json is missing or belongs to another attempt');

  const control = controlOf(runDir, envelope);
  if (!control) return { result: 'retry', reason: 'run-control-held' };

  // The controller's effective assignment (stored fields plus what it backfilled), else the stored one.
  const assignment = readJson(path.join(runDir, 'assignment.json')) ?? readJson(path.join(path.dirname(runDir), '..', 'assignment.json'));
  const baseline = evaluatorBaseline(runDir, receipt.outcome);
  const { capture } = envelope.launch;
  // What the launching controller knew and no file of the attempt carries (policy, provider account,
  // fallback). Absent for an attempt whose controller died before it wrote it: the settlement then
  // simply has less provenance, never a different outcome.
  const context = readJson(path.join(runDir, 'controller', 'settle-context.json')) ?? {};
  const strayWarning = context.strayWatch
    ? strayWriteWarning({ repoRoot: context.strayWatch.repoRoot, strayPaths: watchWritesOutsideWorkspace(context.strayWatch).strayPaths() })
    : null;
  const strayWarnings = strayWarning ? [strayWarning] : [];
  const screenText = paneScreenOf(runDir, envelope).replace(/\s+$/, '');
  const claimPath = claimOf(envelope, receipt);
  const raw = rawResultOf(receipt, claimPath !== null, screenText);
  // The screen is evidence for a person (the stop message, the stdout of a pane that writes no capture),
  // never a judge: why a provider stopped the agent is the receipt's reason.
  const stdoutText = readTail(capture.stdout) || screenText;
  const stderrText = readTail(capture.stderr);
  const providerStop = providerStopOf(receipt, claimPath !== null);

  let settled;
  try {
    settled = await settleRunOutcome({
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
      agentResultPath: claimPath,
      adapterOutcome: providerStop?.adapterOutcome ?? null,
      providerStopCause: providerStop?.cause ?? null,
      providerSignal: providerStop?.signal ?? null,
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
      opts: {
        cwd: envelope.cwd,
        repoRoot: context.repoRoot ?? envelope.cwd,
        updateRunJson: 'settled',
        ...(context.providerCapacityRuntimeDir ? { providerCapacityRuntimeDir: context.providerCapacityRuntimeDir } : {}),
        adapter: (envelope.host ?? envelope.mode) === 'terminal' ? 'herdr-spawn' : 'cli-spawn',
      },
    });
  } catch (err) {
    if (err?.code === 'run-control-superseded') {
      // Another writer settled this run first; its result.json is the answer.
      if (readSettledResult(runDir, runMeta.runId)) return { result: 'done', detail: { settled: 'by-other' } };
      throw new StepError('internal', err.message);
    }
    throw err;
  }
  // After the outcome is committed, so recording can only add a friction, never move the result.
  try {
    recordClaimFrictions({
      agentClaim: settled.runResult?.agentClaim, root: context.repoRoot ?? envelope.cwd, runDir,
      assignmentId: runMeta.assignmentId ?? assignment?.assignmentId, runId: runMeta.runId,
      unitRunId: envelope.unitRunId ?? assignment?.unitRunId, workId: runMeta.workId ?? assignment?.workId,
    });
  } catch (err) {
    console.error(`fgos: warning: worker frictions not recorded: ${err.message}`);
  }
  return { result: 'done', detail: { settled: 'now', runId: runMeta.runId, status: settled.status } };
}
