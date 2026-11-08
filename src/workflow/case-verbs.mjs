// src/workflow/case-verbs.mjs — the case verbs: start, status, answer, resume, close
// Architecture guard: MUST NOT import src/state/** or src/runner/coordination/** (A4 boundary)
//
// A playbook case has a proposer that holds `advance` for its life; these verbs start one, find one alive,
// or leave it alone. A conductor case has no proposer: its verbs take `advance` once, fold in what is
// waiting beside the ledger, and let go. `answer` never writes the ledger itself: it makes the answer a
// round file, then tries `advance` once; whoever holds `advance` next appends `gate.answer`.

import path from 'node:path';

import { RunnerConfigError } from '../runner/dispatch/runner-config-error.mjs';
import { resolveGitRoots } from '../runner/execution/run.mjs';
import { runDirOf } from '../runner/execution/case-run-paths.mjs';
import { appendWorkflowEvent, projectWorkflowState, readWorkflowEvents } from './store.mjs';
import {
  acquireAdvanceLock,
  advanceReport,
  caseNotFound,
  tryAcquireAdvanceLock,
  withAdvanceLock,
  withAdvanceLockSync,
} from './case-lock.mjs';
import { drainCaseInbox, recordGateAnswerRound } from './case-runtime.mjs';
import { gateOfStep, readCaseProjection } from './case-projection.mjs';
import { CONFINED_WRITE_CODE, confinedWriteRefusal, confinedWriteText } from './case-admission-port.mjs';
import { currentDispatchDepth } from '../runner/dispatch/adapters.mjs';
import { DEFAULT_PRUNE_DAYS, closeCaseUnderHold, pruneFinishedCases } from './case-close.mjs';
import { detachedResult, openCaseOnLedger, prepareWorkflowRun, refundIfNotOpened, spawnDetachedAdvance } from './case-start.mjs';
import { inspectCaseBindings } from './case-bindings.mjs';
import { runCaseGate } from './case-gate.mjs';
import { advanceWorkflowRun } from './runner.mjs';
import { normalizeSeats } from './seats.mjs';
import { seatProviders } from './seat-providers.mjs';
import { stepSubjectDigest } from './ref-digests.mjs';

const isConductor = (projection) => projection.kind === 'guide';

function rootsOf(workflowRunId, options, verb) {
  if (!workflowRunId) throw new RunnerConfigError(`${verb} requires workflowRunId`);
  const roots = resolveGitRoots(options.cwd ?? process.cwd(), { allowNoRepository: true });
  return {
    mainRoot: options.repoRoot ? path.resolve(options.repoRoot) : roots.mainCheckoutRoot,
    worktreePath: options.worktree ? path.resolve(options.worktree) : roots.worktreeRoot,
  };
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Retire finished cases once a case has closed, after its hold is released; an error or a held lock never changes what closed. */
function pruneQuietly(mainRoot) {
  try { pruneFinishedCases({ mainRoot, olderThanMs: DEFAULT_PRUNE_DAYS * DAY_MS, apply: true }); } catch { /* best effort */ }
}

/** The case as an agent reads it: the projection with the digests the playbook's subjects have now. */
function readCase(mainRoot, workflowRunId) {
  const read = readCaseProjection(mainRoot, workflowRunId);
  if (read.events.length === 0) throw caseNotFound(workflowRunId);
  return read;
}

/** What `status` adds to a run's own fields: the projection, as one block. */
function caseBlock(projection) {
  return {
    caseId: projection.caseId,
    kind: projection.kind === 'guide' ? 'conductor' : 'playbook',
    open: projection.open,
    closed: projection.closed,
    frame: projection.frame,
    frameRemaining: projection.frameRemaining,
    frameExhausted: projection.frameExhausted,
    deviations: projection.deviations,
    milestones: projection.milestones,
    eligible: projection.eligible,
    routes: { points: projection.routePoints, unlisted: projection.unlistedPath },
    openGates: projection.openGates,
    liveReservations: projection.liveReservations.map(({ reservationId, activity, unitId, writes, worktree, counters }) => ({ reservationId, activity, unitId, writes, worktree, counters })),
    bindings: projection.bindings,
    closable: projection.closable,
  };
}

/** A conductor case has nothing to run: the answer is its state. */
function conductorResult(mainRoot, workflowRunId, extra = {}) {
  const { state, projection } = readCase(mainRoot, workflowRunId);
  return { ...state, caseId: workflowRunId, case: caseBlock(projection), ...extra };
}

/** Hand advancing a recorded case to a detached `fgos workflow resume <id> --foreground`; returns at once. */
function handOff({ mainRoot, workflowRunId, worktreePath, options }) {
  const detached = spawnDetachedAdvance({
    mainRoot,
    workflowRunId,
    runDir: runDirOf(mainRoot, workflowRunId),
    worktree: options.worktree ? worktreePath : undefined,
    cwd: options.cwd,
    cliPath: options.cliPath,
  });
  return detachedResult({ mainRoot, workflowRunId, detached });
}

/**
 * Start a new Workflow run. By default it is advanced in this process until it completes, fails, or parks.
 * With `params.detached` it is recorded and advancing is handed to a detached process, returning as soon as the
 * run is recorded: the caller gets the run id (the case id) and where to read progress (`fgos workflow status
 * <id>`); the detached process is `fgos workflow resume <id> --foreground`, so it survives the caller exiting or
 * being killed and stays readable through the same event log. A conductor case (a guide with its own
 * activities) is opened and returned with no process at all, detached or not.
 *
 * @param {object} params
 * @param {boolean} [params.detached] Hand advancing to a detached process and return at once
 * @param {string} [params.cliPath] With `detached`: override the CLI entry that is spawned
 * @param {string} [params.workflowId] Id of registered workflow
 * @param {object} [params.workflow] In-memory workflow object
 * @param {string} [params.unitsPath] Path to a units file (YAML/JSON list of Units), one step per Unit
 * @param {string} [params.effort] Reasoning effort every unit asks for (low, medium, high, max)
 * @param {string} [params.request] The owner's request this run serves; given to every unit
 * @param {object} [params.frame] Counts and floor that narrow the guide's frame defaults, never widen them
 * @param {string[]} [params.seats] Ordered entries (lenses or `@name` personas): rebuild the base with one panel seat per entry (see seats.mjs)
 * @param {string} [params.repoRoot]
 * @param {string} [params.cwd]
 * @param {string} [params.worktree]
 * @param {Function} [params.onLog]
 * @returns {Promise<object>} Projected state; with `detached`, plus `detached: { pid, logPath, statusCommand }`
 */
export async function startWorkflow(params = {}) {
  const { workflowRunId, workflow, mainRoot, worktreePath, frame, request, parent, inherits } = prepareWorkflowRun(params);

  let opened = false;
  let settled;
  try {
    settled = await withAdvanceLock(mainRoot, workflowRunId, async (hold) => {
      openCaseOnLedger({ mainRoot, workflowRunId, workflow, frame, request, hold, worktreePath, parent, inherits });
      opened = true;
      if (workflow.guide.kind === 'guide') return conductorResult(mainRoot, workflowRunId);
      if (params.detached) return null;
      return advanceWorkflowRun({ repoRoot: mainRoot, workflowRunId, workflow, mainRoot, worktreePath, hold, onLog: params.onLog });
    });
  } finally {
    refundIfNotOpened({ mainRoot, parent, opened });
  }
  if (settled?.status === 'completed') pruneQuietly(mainRoot);
  return settled ?? handOff({ mainRoot, workflowRunId, worktreePath, options: params });
}

/** What the bindings check says about this case's worktree bindings; reads only, repairs nothing. */
function judgeBindings(mainRoot, caseId) {
  const problems = inspectCaseBindings(mainRoot).problems.filter((problem) => problem.includes(`case ${caseId} `));
  return { sound: problems.length === 0, problems };
}

/**
 * Get current projected status of a Workflow run: its own fields, `advance: { running, pid, logPath,
 * lastLines?, hint? }` for the process that advances it, and `case`: milestones with their digests, the
 * routes (listed, and the way outside the list), what is left of the frame, open gates and live
 * reservations; `bindingsJudgment`: whether the bindings of the case's worktree agree with its ledger; and `seatProviders`: for every run, each finished seat's account. A playbook case is `running` while someone holds `advance`; a conductor case while an
 * attempt of its is still alive, and it never suggests a resume.
 *
 * @param {string} workflowRunId
 * @param {object} [options]
 * @param {string} [options.repoRoot]
 * @param {string} [options.cwd]
 * @returns {object} Projected state
 */
export function statusWorkflow(workflowRunId, options = {}) {
  const { mainRoot } = rootsOf(workflowRunId, options, 'statusWorkflow');
  const { events, state, projection } = readCase(mainRoot, workflowRunId);
  // Every run says who actually served each finished seat, read from the bindings already on its ledger.
  let advance = advanceReport(mainRoot, workflowRunId, state, events);
  if (isConductor(projection)) {
    const { hint, ...rest } = advance;
    advance = { ...rest, running: projection.liveReservations.length > 0, pid: null };
  }
  return { ...state, seatProviders: seatProviders(state), advance, case: caseBlock(projection), bindingsJudgment: judgeBindings(mainRoot, workflowRunId) };
}

/** Keep the answer as a round (a file made once), with the digest of what the gate shows. */
function recordAnswer(workflowRunId, params, mainRoot) {
  if (!params.stepId) throw new RunnerConfigError('answerWorkflow requires stepId');
  if (params.answer === undefined) throw new RunnerConfigError('answerWorkflow requires answer');
  // An answer is the owner's consent: no dispatched worker gives one, whatever its views of the ledger allow.
  if (currentDispatchDepth() > 0) {
    throw new RunnerConfigError(confinedWriteText(confinedWriteRefusal({ mainRoot, caseId: workflowRunId }) ?? 'a gate answer is the owner\'s, never a worker\'s'), { code: CONFINED_WRITE_CODE });
  }
  const { events, state } = readCase(mainRoot, workflowRunId);
  const gate = gateOfStep(events, params.stepId);
  if (!gate) throw new RunnerConfigError(`step "${params.stepId}" of "${workflowRunId}" is not a gate; a gate answer needs a gate`, { code: 'gate-unknown' });
  recordGateAnswerRound({
    mainRoot,
    caseId: workflowRunId,
    events,
    stepId: params.stepId,
    answer: String(params.answer),
    approved: params.approved === true || params.approved === 'true',
    question: state.questions.find((q) => q.stepId === params.stepId)?.question ?? gate.question ?? '',
    mode: gate.mode,
    subjectDigest: stepSubjectDigest({ state, workflow: state.workflow, stepId: params.stepId, mainRoot }),
  });
  return state;
}

/**
 * Try `advance` once, then keep the answer as a round. Taking it first means an unfinished ledger tail is
 * repaired before the ledger is read; when it is taken, the round is folded into the ledger at once. Returns
 * the hold (null when a live proposer will record the answer).
 */
function takeAndRecord(workflowRunId, params, mainRoot) {
  const hold = tryAcquireAdvanceLock(mainRoot, workflowRunId);
  try {
    recordAnswer(workflowRunId, params, mainRoot);
    if (hold) drainCaseInbox({ mainRoot, caseId: workflowRunId, hold });
    return hold;
  } catch (err) {
    hold?.release();
    throw err;
  }
}

const recordedByLiveProposer = (mainRoot, workflowRunId) => ({
  ...projectWorkflowState(readWorkflowEvents({ repoRoot: mainRoot, workflowRunId })),
  recorded: true,
  appliedBy: 'live proposer',
});

/**
 * Answer a parked human gate in a Workflow run. The answer is kept as a round file; then `advance` is
 * tried once. Taken: the answer is appended to the ledger, and a playbook case carries on in this
 * process, or with `params.detached` in a detached one that is started at once. Held: the answer
 * waits for the proposer that holds it, which records it before it acts and nothing is spawned. A
 * conductor case has no process to hand it to.
 *
 * @param {string} workflowRunId
 * @param {object} params
 * @param {string} params.stepId
 * @param {string} params.answer
 * @param {boolean} [params.detached] Hand advancing to a detached process; `params.cliPath` overrides its CLI entry
 * @param {string} [params.repoRoot]
 * @param {string} [params.cwd]
 * @returns {Promise<object>} Projected state after advancing; with `detached`, plus `detached: { pid, logPath, statusCommand }`
 */
export async function answerWorkflow(workflowRunId, params = {}) {
  const { mainRoot, worktreePath } = rootsOf(workflowRunId, params, 'answerWorkflow');
  const hold = takeAndRecord(workflowRunId, params, mainRoot);
  if (hold === null) return recordedByLiveProposer(mainRoot, workflowRunId);
  let advanced;
  try {
    const { state, projection } = readCase(mainRoot, workflowRunId);
    if (isConductor(projection)) return conductorResult(mainRoot, workflowRunId);
    if (!params.detached) advanced = await advanceWorkflowRun({ repoRoot: mainRoot, workflowRunId, workflow: state.workflow, mainRoot, worktreePath, hold });
  } finally {
    hold.release();
  }
  if (advanced) {
    if (advanced.status === 'completed') pruneQuietly(mainRoot);
    return advanced;
  }
  return handOff({ mainRoot, workflowRunId, worktreePath, options: params });
}

/**
 * The failed step a resume runs again, null when the run did not fail. A step that failed on infrastructure
 * (a unit that never started or whose seat could not launch) reopens; a step a verdict ended is refused by
 * name, because running it again would only ask a verdict to change.
 */
function failedStepToReopen(state) {
  if (state.status !== 'failed') return null;
  const failed = Object.values(state.steps).find((step) => step.status === 'failed');
  if (!failed) return null;
  if (Object.values(failed.units).some((unit) => unit.rerunnable)) return failed.id;
  throw new RunnerConfigError(`nothing-to-resume: step ${failed.id} ended ${failed.outcome}`, { code: 'nothing-to-resume' });
}

/**
 * The run's state and what resuming it does, refusing a resume that asks for seats the run did not start with
 * and one a verdict ended. Read under the advance lock.
 *
 * @returns {{ state: object, conductor: boolean, reopenStepId: string|null }}
 */
function readResumeState(workflowRunId, mainRoot, options) {
  const { state, projection } = readCase(mainRoot, workflowRunId);
  if (options.seats !== undefined) {
    const given = normalizeSeats(options.seats);
    const stored = state.seats?.seats ?? [];
    if (JSON.stringify(given) !== JSON.stringify(stored)) {
      throw new RunnerConfigError(`Workflow run "${workflowRunId}" started with ${stored.length > 0 ? `seats "${stored.join('|')}"` : 'no --seats'}; resume refuses different --seats (given "${given.join('|')}")`);
    }
  }
  const conductor = isConductor(projection);
  return { state, conductor, reopenStepId: conductor ? null : failedStepToReopen(state) };
}

/** Whether the case has no proposer to start: read once `advance` could not be taken. */
function heldConductor(mainRoot, workflowRunId) {
  try {
    return isConductor(readCase(mainRoot, workflowRunId).projection);
  } catch {
    return false;
  }
}

/**
 * Resume execution of an existing Workflow run. A playbook case runs a proposer in this process, or with
 * `options.detached` hands advancing to a detached process and returns at once; either way it is refused while
 * another process holds `advance`, naming the holder. A conductor case only has what waits beside its ledger
 * folded in and spawns nothing.
 *
 * @param {string} workflowRunId
 * @param {object} [options]
 * @param {boolean} [options.detached] Hand advancing to a detached process; `options.cliPath` overrides its CLI entry
 * @param {string} [options.repoRoot]
 * @param {string} [options.cwd]
 * @returns {Promise<object>} Projected state; with `detached`, plus `detached: { pid, logPath, statusCommand }`
 */
export async function resumeWorkflow(workflowRunId, options = {}) {
  const { mainRoot, worktreePath } = rootsOf(workflowRunId, options, 'resumeWorkflow');
  let hold = tryAcquireAdvanceLock(mainRoot, workflowRunId);
  if (hold === null) {
    if (heldConductor(mainRoot, workflowRunId)) return conductorResult(mainRoot, workflowRunId);
    hold = acquireAdvanceLock(mainRoot, workflowRunId); // refuses, naming the holder; the hold is the caller's when the holder let go meanwhile
  }
  let advanced;
  try {
    const { state, conductor, reopenStepId } = readResumeState(workflowRunId, mainRoot, options);
    if (conductor) return conductorResult(mainRoot, workflowRunId);
    if (!options.detached) {
      // The only way a failed step runs again: this one reopening, which the next advance acts on once.
      if (reopenStepId) appendWorkflowEvent({ repoRoot: mainRoot, workflowRunId, event: { type: 'step.start', payload: { stepId: reopenStepId } }, hold });
      advanced = await advanceWorkflowRun({ workflowRunId, workflow: state.workflow, mainRoot, worktreePath, hold });
    }
  } finally {
    hold.release();
  }
  if (advanced) {
    if (advanced.status === 'completed') pruneQuietly(mainRoot);
    return advanced;
  }
  return handOff({ mainRoot, workflowRunId, worktreePath, options });
}

/**
 * Close a case. Refused while a closure milestone is stale or a consent gate is parked, and while a
 * proposer holds `advance`. Closing with an attempt still alive keeps its binding (the doctor reports it,
 * and a later close of the binding, checked by generation, releases it once the attempt is quiet).
 *
 * @param {string} workflowRunId
 * @param {object} [options]
 * @param {string} [options.reason]
 * @returns {{ closed: true, caseId: string, unbound: string[], kept: Array<{ key: string, reason: string }> }}
 */
export function closeWorkflow(workflowRunId, options = {}) {
  const { mainRoot } = rootsOf(workflowRunId, options, 'closeWorkflow');
  const closed = withAdvanceLockSync(mainRoot, workflowRunId, (hold) => {
    readCase(mainRoot, workflowRunId);
    const result = closeCaseUnderHold({ mainRoot, workflowRunId, hold, reason: options.reason });
    if (!result.closed) {
      throw result.code === 'case-closed'
        ? new RunnerConfigError(`Workflow case "${workflowRunId}" is already closed`, { code: 'case-closed' })
        : new RunnerConfigError(`Workflow case "${workflowRunId}" cannot close: ${result.reasons.join(', ')}`, { code: 'close-refused' });
    }
    return { closed: true, caseId: workflowRunId, unbound: result.unbound, kept: result.kept };
  });
  pruneQuietly(mainRoot);
  return closed;
}

/**
 * Remove the cases that ended more than `options.olderThan` (`<N>d`, default 14d) ago with the Unit runs they
 * name. A dry run unless `options.apply` is true; see `pruneFinishedCases` for what is kept and why.
 *
 * @param {object} [options]
 * @param {string} [options.olderThan] `<N>d`
 * @param {boolean} [options.apply]
 * @param {string} [options.repoRoot]
 * @param {string} [options.cwd]
 */
export function pruneWorkflow(options = {}) {
  const given = options.olderThan ?? `${DEFAULT_PRUNE_DAYS}d`;
  const days = /^(\d+)d$/.exec(String(given))?.[1];
  if (days === undefined) throw new RunnerConfigError(`--older-than takes a whole number of days such as 14d (got "${given}")`, { code: 'invalid-older-than' });
  const mainRoot = options.repoRoot ? path.resolve(options.repoRoot) : resolveGitRoots(options.cwd ?? process.cwd(), { allowNoRepository: true }).mainCheckoutRoot;
  const result = pruneFinishedCases({ mainRoot, olderThanMs: Number(days) * DAY_MS, apply: options.apply === true });
  return { applied: options.apply === true, olderThanDays: Number(days), ...result };
}

/**
 * Run the project's whole-worktree check for a case as the runner, in `options.worktree`, and settle the
 * result as the receipt of `options.activity`. The verb is opt-in: nothing runs it by itself.
 */
export async function gateWorkflow(workflowRunId, options = {}) {
  const { mainRoot, worktreePath } = rootsOf(workflowRunId, options, 'gateWorkflow');
  return runCaseGate({
    mainRoot,
    caseId: workflowRunId,
    worktree: options.worktree ? path.resolve(options.worktree) : worktreePath,
    writes: options.writes,
    activity: options.activity,
    capability: options.capability,
    timeoutMs: options.timeoutMs,
    reason: options.reason,
  });
}
