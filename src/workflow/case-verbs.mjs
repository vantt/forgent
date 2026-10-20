// src/workflow/case-verbs.mjs — the case verbs: start, status, answer, resume, close
// Architecture guard: MUST NOT import src/state/** or src/runner/coordination/** (A4 boundary)
//
// A playbook case has a proposer that holds `advance` for its life; these verbs start one, find one alive,
// or leave it alone. A conductor case has no proposer: its verbs take `advance` once, fold in what is
// waiting beside the ledger, and let go. `answer` never writes the ledger itself: it makes the answer a
// round file, then tries `advance` once; whoever holds `advance` next appends `gate.answer`.

import path from 'node:path';

import { RunnerConfigError } from '../runner/dispatch/config.mjs';
import { resolveGitRoots } from '../runner/execution/run.mjs';
import { projectWorkflowState, readWorkflowEvents } from './store.mjs';
import {
  acquireAdvanceLock,
  advanceReport,
  tryAcquireAdvanceLock,
  withAdvanceLock,
  withAdvanceLockSync,
  workflowRunDirOf,
} from './case-lock.mjs';
import { drainCaseInbox, recordGateAnswerRound } from './case-runtime.mjs';
import { closeCaseUnderHold, readCaseProjection } from './case-close.mjs';
import { detachedResult, openCaseOnLedger, prepareWorkflowRun, refundIfNotOpened, spawnDetachedAdvance } from './case-start.mjs';
import { advanceWorkflowRun } from './runner.mjs';
import { normalizeSeats } from './seats.mjs';
import { seatProviders } from './seat-providers.mjs';
import { stepSubjectDigest } from './unit-handoff.mjs';

const isConductor = (projection) => projection.kind === 'guide';

function rootsOf(workflowRunId, options, verb) {
  if (!workflowRunId) throw new RunnerConfigError(`${verb} requires workflowRunId`);
  const roots = resolveGitRoots(options.cwd ?? process.cwd(), { allowNoRepository: true });
  return {
    mainRoot: options.repoRoot ? path.resolve(options.repoRoot) : roots.mainCheckoutRoot,
    worktreePath: options.worktree ? path.resolve(options.worktree) : roots.worktreeRoot,
  };
}

/** The case as an agent reads it: the projection with the digests the playbook's subjects have now. */
function readCase(mainRoot, workflowRunId) {
  const read = readCaseProjection(mainRoot, workflowRunId);
  if (read.events.length === 0) throw new RunnerConfigError(`Workflow run "${workflowRunId}" not found`);
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

/**
 * Start a new Workflow run and hand its advancing to a detached process, returning as soon as
 * the run is recorded. The caller gets the run id (the case id) and where to read progress
 * (`fgos workflow status <id>`); the detached process is `fgos workflow resume <id>`, so it
 * survives the caller exiting or being killed and stays readable through the same event log. A
 * conductor case (a guide with its own activities) is opened and returned with no process at all.
 *
 * Same params as startWorkflow, plus `params.cliPath` to override the CLI entry that is spawned.
 *
 * @returns {object} Projected state of the just-recorded run plus `detached: { pid, logPath, statusCommand }`
 */
export function startWorkflowDetached(params = {}) {
  const { workflowRunId, runDir, workflow, mainRoot, worktreePath, frame, request, parent } = prepareWorkflowRun(params);
  let opened = false;
  try {
    withAdvanceLockSync(mainRoot, workflowRunId, (hold) => openCaseOnLedger({ mainRoot, workflowRunId, workflow, frame, request, hold, worktreePath, parent }));
    opened = true;
  } finally {
    refundIfNotOpened({ mainRoot, parent, opened });
  }
  if (workflow.guide.kind === 'guide') return conductorResult(mainRoot, workflowRunId);
  const detached = spawnDetachedAdvance({
    mainRoot,
    workflowRunId,
    runDir,
    worktree: params.worktree ? worktreePath : undefined,
    cwd: params.cwd,
    cliPath: params.cliPath,
  });
  return detachedResult({ mainRoot, workflowRunId, detached });
}

/**
 * Start a new Workflow run and advance it in this process until it completes, fails, or parks.
 *
 * @param {object} params
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
 * @returns {Promise<object>} Projected workflow state
 */
export async function startWorkflow(params = {}) {
  const { workflowRunId, workflow, mainRoot, worktreePath, frame, request, parent } = prepareWorkflowRun(params);

  let opened = false;
  try {
    return await withAdvanceLock(mainRoot, workflowRunId, async (hold) => {
      openCaseOnLedger({ mainRoot, workflowRunId, workflow, frame, request, hold, worktreePath, parent });
      opened = true;
      if (workflow.guide.kind === 'guide') return conductorResult(mainRoot, workflowRunId);
      return advanceWorkflowRun({ repoRoot: mainRoot, workflowRunId, workflow, mainRoot, worktreePath, hold, onLog: params.onLog });
    });
  } finally {
    refundIfNotOpened({ mainRoot, parent, opened });
  }
}

/**
 * Get current projected status of a Workflow run: its own fields, `advance: { running, pid, logPath,
 * lastLines?, hint? }` for the process that advances it, and `case`: milestones with their digests, the
 * routes (listed, and the way outside the list), what is left of the frame, open gates and live
 * reservations. A playbook case is `running` while someone holds `advance`; a conductor case while an
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
  // A seated run also says who actually served each seat; an unseated run's status is unchanged.
  const served = state.seats ? { seatProviders: seatProviders(state) } : {};
  let advance = advanceReport(mainRoot, workflowRunId, state, events);
  if (isConductor(projection)) {
    const { hint, ...rest } = advance;
    advance = { ...rest, running: projection.liveReservations.length > 0, pid: null };
  }
  return { ...state, ...served, advance, case: caseBlock(projection) };
}

/** Keep the answer as a round (a file made once), with the digest of what the gate shows. */
function recordAnswer(workflowRunId, params, mainRoot) {
  if (!params.stepId) throw new RunnerConfigError('answerWorkflow requires stepId');
  if (params.answer === undefined) throw new RunnerConfigError('answerWorkflow requires answer');
  const { events, state } = readCase(mainRoot, workflowRunId);
  const gate = state.workflow.steps.find((s) => s.id === params.stepId)?.gate;
  recordGateAnswerRound({
    mainRoot,
    caseId: workflowRunId,
    events,
    stepId: params.stepId,
    answer: String(params.answer),
    approved: params.approved === true || params.approved === 'true',
    question: state.questions.find((q) => q.stepId === params.stepId)?.question ?? gate?.question ?? '',
    mode: gate?.mode === 'input' ? 'input' : 'consent',
    subjectDigest: stepSubjectDigest({ state, workflow: state.workflow, stepId: params.stepId, mainRoot }),
  });
  return state;
}

/**
 * Try `advance` once, then keep the answer as a round. Taking it first means an unfinished ledger tail is
 * repaired before the ledger is read; when it is taken, the round is folded into the ledger at once. Returns
 * the hold, or null when a live proposer holds `advance` and will record the answer itself.
 */
function takeAndRecord(workflowRunId, params, mainRoot) {
  const hold = tryAcquireAdvanceLock(mainRoot, workflowRunId);
  try {
    recordAnswer(workflowRunId, params, mainRoot);
    if (hold) drainCaseInbox({ mainRoot, caseId: workflowRunId, hold });
  } catch (err) {
    hold?.release();
    throw err;
  }
  return hold;
}

const recordedByLiveProposer = (mainRoot, workflowRunId) => ({
  ...projectWorkflowState(readWorkflowEvents({ repoRoot: mainRoot, workflowRunId })),
  recorded: true,
  appliedBy: 'live proposer',
});

/**
 * Answer a parked human gate in a Workflow run. The answer is kept as a round file; then `advance` is
 * tried once. Taken: the answer is appended to the ledger, and a playbook case carries on in this
 * process. Held: the answer waits for the proposer that holds it, which records it before it acts.
 *
 * @param {string} workflowRunId
 * @param {object} params
 * @param {string} params.stepId
 * @param {string} params.answer
 * @param {string} [params.repoRoot]
 * @param {string} [params.cwd]
 * @returns {Promise<object>} Projected state after advancing
 */
export async function answerWorkflow(workflowRunId, params = {}) {
  if (!workflowRunId) throw new RunnerConfigError('answerWorkflow requires workflowRunId');
  const { mainRoot, worktreePath } = rootsOf(workflowRunId, params, 'answerWorkflow');
  const hold = takeAndRecord(workflowRunId, params, mainRoot);
  if (hold === null) return recordedByLiveProposer(mainRoot, workflowRunId);
  try {
    const { state, projection } = readCase(mainRoot, workflowRunId);
    if (isConductor(projection)) return conductorResult(mainRoot, workflowRunId);
    return await advanceWorkflowRun({ repoRoot: mainRoot, workflowRunId, workflow: state.workflow, mainRoot, worktreePath, hold });
  } finally {
    hold.release();
  }
}

/**
 * Record a gate answer and hand advancing the run to a detached process, returning as soon as the
 * answer is stored. While a proposer is alive it is left to record the answer and nothing is spawned;
 * a conductor case has no process to hand it to. Same params as answerWorkflow, plus `params.cliPath`.
 *
 * @returns {object} Projected state with the answer recorded plus `detached: { pid, logPath, statusCommand }`
 */
export function answerWorkflowDetached(workflowRunId, params = {}) {
  if (!workflowRunId) throw new RunnerConfigError('answerWorkflow requires workflowRunId');
  const { mainRoot, worktreePath } = rootsOf(workflowRunId, params, 'answerWorkflow');
  const hold = takeAndRecord(workflowRunId, params, mainRoot);
  if (hold === null) return recordedByLiveProposer(mainRoot, workflowRunId);
  hold.release();
  if (isConductor(readCase(mainRoot, workflowRunId).projection)) return conductorResult(mainRoot, workflowRunId);
  const detached = spawnDetachedAdvance({
    mainRoot,
    workflowRunId,
    runDir: workflowRunDirOf(mainRoot, workflowRunId),
    worktree: params.worktree ? worktreePath : undefined,
    cwd: params.cwd,
    cliPath: params.cliPath,
  });
  return detachedResult({ mainRoot, workflowRunId, detached });
}

/** The run's state, refusing a resume that asks for seats the run did not start with. Read under the advance lock. */
function readResumeState(workflowRunId, mainRoot, options) {
  const { state } = readCase(mainRoot, workflowRunId);
  if (options.seats !== undefined) {
    const given = normalizeSeats(options.seats);
    const stored = state.seats?.seats ?? [];
    if (JSON.stringify(given) !== JSON.stringify(stored)) {
      throw new RunnerConfigError(`Workflow run "${workflowRunId}" started with ${stored.length > 0 ? `seats "${stored.join('|')}"` : 'no --seats'}; resume refuses different --seats (given "${given.join('|')}")`);
    }
  }
  return state;
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
 * Resume execution of an existing Workflow run. A playbook case runs a proposer in this process, and is
 * refused while another holds it. A conductor case only has what waits beside its ledger folded in.
 *
 * @param {string} workflowRunId
 * @param {object} [options]
 * @param {string} [options.repoRoot]
 * @param {string} [options.cwd]
 * @returns {Promise<object>} Projected state
 */
export async function resumeWorkflow(workflowRunId, options = {}) {
  const { mainRoot, worktreePath } = rootsOf(workflowRunId, options, 'resumeWorkflow');
  let hold = tryAcquireAdvanceLock(mainRoot, workflowRunId);
  if (hold === null) {
    if (heldConductor(mainRoot, workflowRunId)) return conductorResult(mainRoot, workflowRunId);
    hold = acquireAdvanceLock(mainRoot, workflowRunId); // refuses, naming the holder
  }
  try {
    const state = readResumeState(workflowRunId, mainRoot, options);
    if (isConductor(readCase(mainRoot, workflowRunId).projection)) return conductorResult(mainRoot, workflowRunId);
    return await advanceWorkflowRun({ repoRoot: mainRoot, workflowRunId, workflow: state.workflow, mainRoot, worktreePath, hold });
  } finally {
    hold.release();
  }
}

/**
 * Hand advancing an existing run to a detached process, returning at once. Refuses while a live
 * process is already advancing the run. A conductor case spawns nothing. Same options as resumeWorkflow,
 * plus `options.cliPath`.
 *
 * @returns {object} Projected state plus `detached: { pid, logPath, statusCommand }`
 */
export function resumeWorkflowDetached(workflowRunId, options = {}) {
  const { mainRoot, worktreePath } = rootsOf(workflowRunId, options, 'resumeWorkflow');
  // Holding the run while it is checked refuses when a live process is advancing it, and repairs an
  // unfinished last ledger line; the hold is released before the detached advance takes it.
  let conductor = false;
  const hold = tryAcquireAdvanceLock(mainRoot, workflowRunId);
  if (hold === null) {
    if (!heldConductor(mainRoot, workflowRunId)) acquireAdvanceLock(mainRoot, workflowRunId); // refuses, naming the holder
    conductor = true;
  } else {
    try {
      readResumeState(workflowRunId, mainRoot, options);
      conductor = isConductor(readCase(mainRoot, workflowRunId).projection);
    } finally {
      hold.release();
    }
  }
  if (conductor) return conductorResult(mainRoot, workflowRunId);
  const detached = spawnDetachedAdvance({
    mainRoot,
    workflowRunId,
    runDir: workflowRunDirOf(mainRoot, workflowRunId),
    worktree: options.worktree ? worktreePath : undefined,
    cwd: options.cwd,
    cliPath: options.cliPath,
  });
  return detachedResult({ mainRoot, workflowRunId, detached });
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
  return withAdvanceLockSync(mainRoot, workflowRunId, (hold) => {
    readCase(mainRoot, workflowRunId);
    const result = closeCaseUnderHold({ mainRoot, workflowRunId, hold, reason: options.reason });
    if (!result.closed) {
      throw result.code === 'case-closed'
        ? new RunnerConfigError(`Workflow case "${workflowRunId}" is already closed`, { code: 'case-closed' })
        : new RunnerConfigError(`Workflow case "${workflowRunId}" cannot close: ${result.reasons.join(', ')}`, { code: 'close-refused' });
    }
    return { closed: true, caseId: workflowRunId, unbound: result.unbound, kept: result.kept };
  });
}
