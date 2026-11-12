// src/workflow/runner.mjs — the Playbook proposer: the harness's own proposer for a guide whose every decision point lists its routes
// Architecture guard: MUST NOT import src/state/** or src/runner/coordination/** (A4 boundary)
//
// It holds the case's `advance` for its whole life. Each cycle it drains the runtime inbox, reads the
// case, takes the ready steps in the order the playbook declares them (the single SHOULD among the
// eligible activities), and for each Unit asks admission whether it may run now. An admitted Unit gets
// a `route` and a `reservation` on the ledger, runs through the Execution Core exactly as before, and
// is settled with its receipts. Admission is asked, never bypassed: a refusal ends the step by name,
// or, when the approval a later step stands on has gone stale, parks the gate again for a new answer.

import crypto from 'node:crypto';

import {
  appendWorkflowEvent,
  readWorkflowEvents,
  projectWorkflowState,
} from './store.mjs';
import { PROGRESS_LINE_LIMIT, ADVANCE_DETACHED_ENV } from './case-lock.mjs';
import { drainCaseInbox } from './case-runtime.mjs';
import { guideOfEvents, readCaseProjection } from './case-projection.mjs';
import { openCaseOnLedger, resolveFrame, assertUnitAcceptOutcomes } from './case-start.mjs';
import {
  approvedReportDigests,
  buildUnitHandoff,
  canResumeUnitRun,
  workflowCommit,
  createWorkflowWorktree,
  cleanupWorkflowWorktree,
  gateQuestionOf,
  prepareUnitWorktree,
  settleUnitWorktrees,
  singleWriteBaseOf,
  unitOverridesOf,
  unitPatternOf,
} from './unit-handoff.mjs';
import { stepSubjectDigest } from './ref-digests.mjs';
import { runUnit } from '../runner/execution/run.mjs';
import { CaseAdmissionRefusedError } from '../runner/execution/case-admission-port.mjs';
import { createCaseAdmissionPort } from './case-admission-port.mjs';
import { closeCaseUnderHold } from './case-close.mjs';
import { workflowPersonaScope } from './loader.mjs';
import { unitFieldsOfTemplate } from './steps.mjs';
import { loopOf } from '../runner/execution/patterns/catalog.mjs';
import { loadRunnerConfigForDir } from '../runner/dispatch/config.mjs';
import { RunnerConfigError } from '../runner/dispatch/runner-config-error.mjs';

/** One log line for the events that mark a step's progress, null for every other event. */
function progressLine({ ts, type, payload }) {
  const step = payload?.stepId;
  let what;
  if (type === 'step.start') what = 'started';
  else if (type === 'step.complete') what = 'completed';
  else if (type === 'step.fail') what = `failed: ${payload.reason ?? payload.outcome}`;
  else if (type === 'gate.park') what = 'parked, waiting for an answer';
  else return null;
  return `[${ts}] step ${step} ${what}`.slice(0, PROGRESS_LINE_LIMIT);
}

// The detached advance process is the only one whose output is a log nobody is watching live, so
// it alone prints progress; a foreground advance keeps its stdout for the result.
const detachedChildLog = process.env[ADVANCE_DETACHED_ENV] === '1' ? (line) => process.stderr.write(`${line}\n`) : null;

/** A refusal that means "the approval this step stands on is not valid for what is there now". */
const APPROVAL_REFUSALS = new Set(['consent-stale', 'consent-missing', 'consent-subject-unknown', 'entry-milestone-stale']);

/**
 * What every step of one advance shares: the ledger writer (always under the run's `advance` hold),
 * the reader that folds the inbox in first, and the port every Unit is admitted and settled through.
 */
function createRun({ workflowRunId, workflow, mainRoot, worktreePath, hold, onLog }) {
  return {
    workflowRunId,
    workflow,
    mainRoot,
    worktreePath,
    // The port never acquires `advance`: this proposer already holds it.
    port: createCaseAdmissionPort({ repoRoot: mainRoot, caseId: workflowRunId, heldAdvance: hold }),
    // Where the persona lookup of this run's Units starts: the workflow's own folder and owning domain, from its location.
    personaScope: workflowPersonaScope(workflow.id, { packageRoot: mainRoot }),

    /** Record one event; a step's start, end or park also reaches onLog as one line. */
    emit(type, payload) {
      const stored = appendWorkflowEvent({ repoRoot: mainRoot, workflowRunId, event: { type, payload }, hold });
      const line = progressLine(stored);
      if (line && onLog) onLog(line);
      return stored;
    },

    /** Everything a cycle reads: the inbox is folded into the ledger first, so a gate answer that arrived while a Unit ran is on the ledger before anything acts on it. */
    reread() {
      const drained = drainCaseInbox({ mainRoot, caseId: workflowRunId, hold });
      return { ...readCaseProjection(mainRoot, workflowRunId), drained };
    },

    /** End a step, and the run with it, by name. */
    failStep(step, outcome, reason, unitId) {
      this.emit('step.fail', { stepId: step.id, outcome, ...(unitId ? { unitId } : {}), reason });
      this.emit('workflow.fail', { outcome, stepId: step.id, reason });
    },
  };
}

/** A step is ready when it has not ended or parked and every step it depends on completed. */
function isReady(step, state) {
  const own = state.steps[step.id];
  if (!own || ['completed', 'parked', 'failed'].includes(own.status)) return false;
  return step.dependsOn.every((dep) => state.steps[dep]?.status === 'completed');
}

function parkGate(run, step, question, reason) {
  run.emit('gate.park', { stepId: step.id, question, header: step.gate.header, ...(reason ? { reason } : {}) });
}

function completeStep(run, step) {
  // What the step's milestones stand for, as the Units' reports are now.
  const subjectDigest = stepSubjectDigest({ state: run.reread().state, workflow: run.workflow, stepId: step.id, mainRoot: run.mainRoot });
  run.emit('step.complete', { stepId: step.id, outcome: 'pass', subjectDigest });
}

/** The ledger keeps what a reader of a result uses; the seat's raw evidence stays with its Unit run on disk. */
function withoutEvidence(results) {
  return results.map((result) => {
    if (!result?.runResult || !('evidence' in result.runResult)) return result;
    const { evidence, ...runResult } = result.runResult;
    return { ...result, runResult };
  });
}

/** Why a unit's step ended: a refusal names its reason, out-of-scope writes their paths, else the error or the outcome. */
function unitFailureReason(unitId, { outcome, results, error }, outOfScope) {
  const refusal = results.find((r) => r?.refused)?.refused;
  if (refusal) return `${refusal.reason}: ${refusal.detail}`;
  if (outOfScope.length > 0) return `unit ${unitId} ended ${outcome}: out-of-scope-writes: ${outOfScope.join(', ')}`;
  return error ? `unit ${unitId} could not run: ${error}` : `unit ${unitId} ended ${outcome}`;
}

/**
 * Run one Unit through the Execution Core. A Unit whose predecessor's custody cannot be proven is run
 * again in a new worktree and branch from the trusted base, never from commits an unproven predecessor
 * may still be changing; the predecessor's checkout and branch are kept.
 */
async function runUnitWithRecovery(run, { step, u, unitData, state, base, attempt, recordScheduled }) {
  const { mainRoot, workflowRunId, workflow } = run;
  const started = (unitRunId) => {
    attempt.unitRunId = unitRunId;
    run.emit('unit.started', { stepId: step.id, unitId: u.id, unitRunId });
  };
  // Reports a fresh approval stands behind may be handed over although their bytes changed after
  // settlement; an edit no approval covers is still refused by the Execution Core.
  const fresh = run.reread();
  const runnerConfig = loadRunnerConfigForDir(mainRoot);
  const loopFn = (name) => loopOf(name, { effective: runnerConfig });
  assertUnitAcceptOutcomes(workflow, step, u, runnerConfig);
  const { prep } = attempt;
  // What the unit's branch is compared with, and what the writing unit it builds on already carries outside its scope.
  const inherited = base ? state.steps[base.stepId]?.units[base.unitId]?.outOfScopeOnBranch ?? [] : [];
  const branchBaseOf = ({ branch, baseSha }) => ({ branch: branch && baseSha ? branch : null, baseSha: branch && baseSha ? baseSha : null, outOfScopeOnBranch: inherited });
  const runOptions = {
    unitData,
    ...(unitData.writes.length > 0 ? { branchBase: branchBaseOf(prep) } : {}),
    acceptedReports: approvedReportDigests({ events: fresh.events, state: fresh.state, workflow, mainRoot }),
    repoRoot: mainRoot,
    cwd: prep.worktree,
    worktree: prep.worktree,
    pattern: unitPatternOf(u.template),
    personaScope: run.personaScope,
    workflowId: workflow.id,
    overrides: unitOverridesOf(u, state.seats?.personas, { effort: state.effort, timeoutMs: state.timeoutMs, account: state.account ?? null, loopOf: loopFn }),
    // A run-level account pin that no seat of a unit takes runs that unit unpinned: the pin applies where it is served.
    accountPin: 'where-served',
    caseAdmission: run.port,
    caseRef: { caseId: workflowRunId, activity: step.id, unitId: u.id },
    onCaseAdmitted: ({ reservationId }) => recordScheduled(reservationId),
    ...(attempt.resumeUnitRunId ? { resumeUnitRunId: attempt.resumeUnitRunId } : { onUnitRunCreated: started }),
  };
  try {
    return await runUnit(runOptions);
  } catch (err) {
    if (err?.errorClass !== 'custody-predecessor-unknown' || unitData.writes.length === 0) throw err;
    const baseRef = prep.baseRef ?? (base ? state.steps[base.stepId]?.units[base.unitId]?.branch : 'HEAD');
    const baseSha = prep.baseSha ?? (baseRef ? workflowCommit(mainRoot, baseRef) : null);
    if (!baseSha) throw err;
    const branch = `wf/${workflowRunId}/${u.id}-recovery-${crypto.randomUUID()}`;
    const worktree = createWorkflowWorktree({ repoRoot: mainRoot, branch, baseRef: baseSha }).worktreePath;
    const recovery = { reason: err.errorClass, preservedWorktree: prep.worktree, preservedBranch: prep.branch };
    Object.assign(attempt, { prep: { worktree, branch, baseRef, baseSha, owned: true, created: true, error: null }, resumeUnitRunId: null, unitRunId: null });
    // The recovery checkout is admitted and bound by the run that starts in it.
    run.emit('unit.scheduled', { stepId: step.id, unitId: u.id, worktreePath: worktree, branch, baseRef, baseSha, recovery });
    return runUnit({ ...runOptions, cwd: worktree, worktree, branchBase: branchBaseOf(attempt.prep), resumeUnitRunId: undefined, onCaseAdmitted: undefined, onUnitRunCreated: started });
  }
}

/**
 * A Unit refused at admission was refused before anything existed: the worktree made for it goes, and the
 * step ends by name, or, when the approval it stands on went stale, the gate asks again.
 *
 * @returns {'parked'|'failed'}
 */
function refuseUnit(run, { step, u, error, attempt }) {
  const { mainRoot, workflowRunId, workflow } = run;
  const refused = error.refusal;
  let cleanupFailure = null;
  if (attempt.prep.created) {
    try {
      cleanupWorkflowWorktree({ repoRoot: mainRoot, worktreePath: attempt.prep.worktree, branch: attempt.prep.branch, deleteBranch: true });
    } catch (err) {
      cleanupFailure = err;
    }
  }
  const approval = (refused.violations ?? []).find((v) => APPROVAL_REFUSALS.has(v.code) && v.milestone);
  const guide = guideOfEvents(readWorkflowEvents({ repoRoot: mainRoot, workflowRunId }));
  const gated = approval && workflow.steps.find((s) => s.gate && guide.activities.find((a) => a.id === s.id)?.produces.includes(approval.milestone));
  if (gated && !cleanupFailure) {
    // What was approved is not what is there now: the gate asks again, for the current version.
    parkGate(run, gated, `${gated.gate.question || `Approve step "${gated.id}"?`}\n\n(Asked again: ${approval.condition})`, approval.code);
    return 'parked';
  }
  const note = cleanupFailure ? `; its worktree could not be removed: ${cleanupFailure.message}` : '';
  run.failStep(step, 'refused', `unit ${u.id} could not run: admission refused ${refused.code}: ${refused.condition}${note}`, u.id);
  return 'failed';
}

/**
 * Run one unit of a step to its recorded end.
 *
 * @returns {Promise<'parked'|'failed'|undefined>} how the step ended, or undefined when the unit passed and the step goes on
 */
async function runStepUnit(run, { step, u, state, uState }) {
  const { mainRoot, workflowRunId, workflow } = run;
  const handoff = buildUnitHandoff({ template: u.template, state, step, workflow });
  const unitData = {
    id: u.id,
    objective: handoff.objective || `Execute unit ${u.id} in step ${step.id}`,
    ...unitFieldsOfTemplate(u.template),
    dependsOn: u.dependsOn || [],
    inputs: handoff.inputs,
    stanceOptions: state.stanceOptions?.length ? state.stanceOptions : u.template.stanceOptions,
  };

  // A unit left `running` with a recorded Unit run id was started by a controller that died: continue that run
  // (settled seats are kept) and reuse the worktree it already has. Only when what it needs is still there:
  // after a reboot or a temp-dir cleanup the run's worktree is gone and resuming would fail for good, where a
  // fresh run can still work.
  const resumeUnitRunId = uState?.status === 'running' && canResumeUnitRun(mainRoot, uState) ? uState.unitRunId : null;
  const base = unitData.writes.length > 0 ? singleWriteBaseOf(workflow, step.id) : null;
  const attempt = {
    resumeUnitRunId,
    unitRunId: null,
    scheduled: Boolean(resumeUnitRunId),
    prep: prepareUnitWorktree({ mainRoot, workflow, state, step, unitId: u.id, writes: unitData.writes, base, uState, resuming: Boolean(resumeUnitRunId), worktreePath: run.worktreePath, workflowRunId }),
  };

  // `unit.scheduled` is recorded the moment the Unit is admitted (or, for a Unit that could not be prepared or
  // resumed, when it runs). Recording it again would reset the unit and lose the run id it already carries.
  const recordScheduled = (reservationId = null) => {
    if (attempt.scheduled) return;
    attempt.scheduled = true;
    const { owned, worktree, branch, baseRef, baseSha } = attempt.prep;
    run.emit('unit.scheduled', {
      stepId: step.id,
      unitId: u.id,
      ...(reservationId ? { reservationId } : {}),
      ...(owned ? { worktreePath: worktree, branch, baseRef, baseSha } : {}),
    });
  };

  // A throw (an unresolvable hand-off ref, a refused config) is a failed unit like any other: left uncaught it
  // would end the advance with the run still `running` and no event saying why.
  let result;
  try {
    if (attempt.prep.error) {
      recordScheduled();
      throw new RunnerConfigError(attempt.prep.error);
    }
    result = await runUnitWithRecovery(run, { step, u, unitData, state, base, attempt, recordScheduled });
  } catch (error) {
    if (error instanceof CaseAdmissionRefusedError) return refuseUnit(run, { step, u, error, attempt });
    recordScheduled();
    result = { unitRunId: attempt.resumeUnitRunId ?? attempt.unitRunId, outcome: 'execution-failure', infrastructure: true, results: [], error: String(error?.message ?? error) };
  }

  // Execution settled the outcome after the scope rule: the ledger records what it handed up, never a rewrite of it.
  const { outOfScope = [], outOfScopeOnBranch = [] } = result;
  run.emit('unit.complete', {
    stepId: step.id,
    unitId: u.id,
    unitRunId: result.unitRunId,
    outcome: result.outcome,
    infrastructure: result.infrastructure,
    results: withoutEvidence(result.results || []),
    ...(outOfScope.length > 0 ? { outOfScope } : {}),
    ...(outOfScopeOnBranch.length > 0 ? { outOfScopeOnBranch } : {}),
  });
  // The reservation was settled by the run itself, through the port; fold in anything that arrived meanwhile.
  run.reread();

  // Only explicitly accepted semantic outcomes proceed; execution failures never do.
  if ((u.template.acceptOutcomes ?? ['pass']).includes(result.outcome)) return undefined;
  run.failStep(step, result.outcome, unitFailureReason(u.id, { ...result, results: result.results || [] }, outOfScope), u.id);
  return 'failed';
}

/**
 * Take one ready step as far as it goes: park at its human gate, or run its units in the order declared.
 *
 * @returns {Promise<'parked'|'failed'|'completed'>}
 */
async function advanceStep(run, step, state) {
  const stepState = state.steps[step.id];
  if (step.gate?.kind === 'human' && stepState.status !== 'answered') {
    parkGate(run, step, gateQuestionOf(step, state, run.mainRoot));
    return 'parked';
  }
  if (stepState.status === 'pending' || stepState.status === 'answered') run.emit('step.start', { stepId: step.id });
  for (const u of step.units ?? []) {
    if (stepState.units[u.id]?.status === 'completed') continue;
    const ended = await runStepUnit(run, { step, u, state, uState: stepState.units[u.id] });
    if (ended) return ended;
  }
  completeStep(run, step);
  return 'completed';
}

/**
 * Run loop of the Playbook proposer: advance the ready steps of a Workflow run until it completes,
 * fails, or parks, under the `advance` hold the caller took.
 */
export async function advanceWorkflowRun({ workflowRunId, workflow, mainRoot, worktreePath, hold, onLog = detachedChildLog }) {
  const run = createRun({ workflowRunId, workflow, mainRoot, worktreePath, hold, onLog });

  // A run recorded before cases existed is opened on its first advance, with its guide's defaults.
  const events = readWorkflowEvents({ repoRoot: mainRoot, workflowRunId });
  const guide = guideOfEvents(events);
  openCaseOnLedger({ mainRoot, workflowRunId, workflow, guide, frame: resolveFrame(guide, undefined), request: projectWorkflowState(events).request, hold, worktreePath, legacy: true });

  let read = run.reread();
  while (true) {
    while (read.state.status === 'running') {
      const ready = workflow.steps.filter((step) => isReady(step, read.state));
      if (ready.length === 0) {
        if (workflow.steps.every((s) => read.state.steps[s.id]?.status === 'completed')) {
          run.emit('workflow.complete', { outcome: 'pass' });
          // A Playbook case that ran to a pass is finished: the proposer that holds `advance` closes it by
          // the rules of `fgos workflow close`. One that cannot close (a closure milestone is stale)
          // stays open, as does every case that failed, is blocked or is parked.
          closeCaseUnderHold({ mainRoot, workflowRunId, hold, reason: 'completed' });
          read = run.reread();
        }
        break;
      }
      for (const step of ready) {
        if (await advanceStep(run, step, read.state) === 'failed') break;
      }
      const next = run.reread();
      const progressed = next.events.length > read.events.length;
      read = next;
      if (!progressed) break;
    }

    // One last look before leaving, bounded to a single read: an answer that arrived while this
    // proposer was finishing is on the ledger now, and if it releases a gate the run goes on.
    read = run.reread();
    if (read.drained.answers === 0 || read.state.status !== 'running') break;
  }

  let { state } = read;
  if ((state.status === 'completed' || state.status === 'failed') && !state.worktrees) {
    const { removed, kept } = settleUnitWorktrees({ mainRoot, state });
    if (removed.length > 0 || kept.length > 0) {
      run.emit('workflow.worktrees', { removed, kept });
      state = projectWorkflowState(readWorkflowEvents({ repoRoot: mainRoot, workflowRunId }));
    }
  }
  return state;
}
