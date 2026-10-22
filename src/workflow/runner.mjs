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
import { createGitLand } from '../git/land.mjs';
import { gitPortOptions } from '../git/inspect.mjs';

import {
  appendWorkflowEvent,
  readWorkflowEvents,
  projectWorkflowState,
} from './store.mjs';
import { PROGRESS_LINE_LIMIT, ADVANCE_DETACHED_ENV } from './case-lock.mjs';
import { drainCaseInbox } from './case-runtime.mjs';
import { projectCase } from './case-projection.mjs';
import { admitRecordedWorkflow, openCaseOnLedger, resolveFrame } from './case-start.mjs';
import {
  approvedReportDigests,
  buildUnitHandoff,
  canResumeUnitRun,
  workflowCommit,
  workflowInspect,
  createWorkflowWorktree,
  resolveIntegrationTarget,
  cleanupWorkflowWorktree,
  outOfScopeWrites,
  playbookSubjectDigests,
  renderGateQuestion,
  settleUnitWorktrees,
  singleWriteBaseOf,
  stepSubjectDigest,
  unitOverridesOf,
  unitPatternOf,
} from './unit-handoff.mjs';
import { runUnit, detectHerdrPresent } from '../runner/execution/run.mjs';
import { CaseAdmissionRefusedError } from '../runner/execution/case-admission-port.mjs';
import { createCaseAdmissionPort } from './case-admission-port.mjs';
import { closeCaseUnderHold } from './case-close.mjs';
import { workflowPersonaScope } from './loader.mjs';
import { unitFieldsOfTemplate } from './steps.mjs';
import { simulateUnitBindings } from '../runner/execution/dry-bind.mjs';
import { RunnerConfigError, ensureRunnerConfigForDir } from '../runner/dispatch/config.mjs';
import { leaseAdmission } from '../runner/documentation-cutover-lease.mjs';

/** One log line for the events that mark a step's progress, null for every other event. */
function progressLine({ ts, type, payload }) {
  const step = payload?.stepId;
  let what;
  if (type === 'step.start') what = 'started';
  else if (type === 'step.complete') what = 'completed';
  else if (type === 'step.fail') what = `failed: ${payload.reason ?? payload.outcome}`;
  else if (type === 'gate.park') what = 'parked, waiting for an answer';
  else if (type === 'unit.account-unpinned') what = `unit ${payload.unitId} runs without account ${payload.account}: none of its seats is on that provider`;
  else return null;
  return `[${ts}] step ${step} ${what}`.slice(0, PROGRESS_LINE_LIMIT);
}

// The detached advance process is the only one whose output is a log nobody is watching live, so
// it alone prints progress; a foreground advance keeps its stdout for the result.
const detachedChildLog = process.env[ADVANCE_DETACHED_ENV] === '1' ? (line) => process.stderr.write(`${line}\n`) : null;

/** A refusal that means "the approval this step stands on is not valid for what is there now". */
const APPROVAL_REFUSALS = new Set(['consent-stale', 'consent-missing', 'consent-subject-unknown', 'entry-milestone-stale']);

/**
 * Run loop of the Playbook proposer: advance the ready steps of a Workflow run until it completes,
 * fails, or parks, under the `advance` hold the caller took.
 */
export async function advanceWorkflowRun({ repoRoot, workflowRunId, workflow, mainRoot, worktreePath, hold, documentationAdmission, onLog = detachedChildLog }) {
  documentationAdmission ??= admitRecordedWorkflow({ mainRoot, workflowRunId });
  // Every event is recorded in the event log under the run's advance hold; a step's start, end or
  // park also reaches onLog as one line.
  const recordEvent = (args) => {
    const stored = appendWorkflowEvent({ ...args, hold });
    const line = progressLine(stored);
    if (line && onLog) onLog(line);
    return stored;
  };

  // The one port every Unit of this run is admitted and settled through: it never acquires `advance`,
  // because this proposer already holds it.
  const port = createCaseAdmissionPort({ repoRoot: mainRoot, caseId: workflowRunId, heldAdvance: hold });
  // Where the persona lookup of this run's Units starts: the workflow's own folder and owning domain, from its location.
  const personaScope = workflowPersonaScope(workflow.id, { packageRoot: mainRoot });

  // A run recorded before cases existed is opened on its first advance, with its guide's defaults.
  {
    const events = readWorkflowEvents({ repoRoot: mainRoot, workflowRunId });
    const guide = projectCase(events).guide;
    openCaseOnLedger({ mainRoot, workflowRunId, workflow, guide, frame: resolveFrame(guide, undefined), request: projectWorkflowState(events).request, hold, worktreePath, legacy: true });
  }

  // Everything a cycle reads: the inbox is folded into the ledger first, so a gate answer that arrived
  // while a Unit ran is on the ledger before anything acts on it.
  const reread = () => {
    const drained = drainCaseInbox({ mainRoot, caseId: workflowRunId, hold });
    const events = readWorkflowEvents({ repoRoot: mainRoot, workflowRunId });
    const state = projectWorkflowState(events);
    const guide = projectCase(events).guide;
    const projection = projectCase(events, { currentDigests: playbookSubjectDigests({ state, workflow, guide, mainRoot }) });
    return { events, state, projection, drained };
  };
  let { state } = reread();

  while (true) {
    while (state.status === 'running') {
      const steps = workflow.steps;
      const completedStepIds = new Set(
        Object.values(state.steps)
          .filter((s) => s.status === 'completed')
          .map((s) => s.id),
      );

      // Find ready steps that haven't started or are running
      const readySteps = steps.filter((step) => {
        const stepState = state.steps[step.id];
        if (!stepState || stepState.status === 'completed' || stepState.status === 'parked' || stepState.status === 'failed') {
          return false;
        }
        return step.dependsOn.every((dep) => completedStepIds.has(dep));
      });

      if (readySteps.length === 0) {
        // Check if all steps completed
        const allDone = steps.every((s) => state.steps[s.id]?.status === 'completed');
        if (allDone) {
          recordEvent({
            repoRoot: mainRoot,
            workflowRunId,
            event: {
              type: 'workflow.complete',
              payload: { outcome: 'pass', completedAt: new Date().toISOString() },
            },
          });
          // A Playbook case that ran to a pass is finished: the proposer that holds `advance` closes it by
          // the rules of `fgos workflow close`. One that cannot close (a closure milestone is stale)
          // stays open, as does every case that failed, is blocked or is parked.
          closeCaseUnderHold({ mainRoot, workflowRunId, hold, reason: 'completed' });
          state = reread().state;
        }
        break;
      }

      // Process ready steps
      let stateChanged = false;
      const completeStep = (stepId) => {
        // What the step's milestones stand for, as the Units' reports are now.
        const subjectDigest = stepSubjectDigest({ state: reread().state, workflow, stepId, mainRoot });
        recordEvent({
          repoRoot: mainRoot,
          workflowRunId,
          event: { type: 'step.complete', payload: { stepId, outcome: 'pass', subjectDigest, completedAt: new Date().toISOString() } },
        });
      };
      for (const step of readySteps) {
        const stepState = state.steps[step.id];

        // 1. Human gate check
        if (step.gate && step.gate.kind === 'human' && stepState.status !== 'answered') {
          let question;
          try {
            question = renderGateQuestion(step, state, mainRoot);
          } catch (error) {
            const reason = error instanceof SyntaxError ? 'invalid JSON' : error.code || error.message;
            question = `Cannot read settled producer "missing expertise": ${reason}. No expertise decision was inferred. Review the packet manually and answer this gate with your decision and acknowledged limitation.`;
          }
          recordEvent({
            repoRoot: mainRoot,
            workflowRunId,
            event: {
              type: 'gate.park',
              payload: {
                stepId: step.id,
                question,
                header: step.gate.header,
                parkedAt: new Date().toISOString(),
              },
            },
          });
          stateChanged = true;
          continue;
        }

        // Mark step start if pending
        if (stepState.status === 'pending' || stepState.status === 'answered') {
          recordEvent({
            repoRoot: mainRoot,
            workflowRunId,
            event: {
              type: 'step.start',
              payload: { stepId: step.id, startedAt: new Date().toISOString() },
            },
          });
          stateChanged = true;
        }

        // 2. Integration step
        if (step.kind === 'integrate') {
          const integrationTarget = resolveIntegrationTarget({ repoRoot: mainRoot, workflow });
          // A unit that wrote outside its scope never reaches the target: the step fails, saying which,
          // and merges nothing, rather than landing the rest and reporting a pass.
          const flagged = step.dependsOn.flatMap((depId) => Object.values(state.steps[depId]?.units ?? {})
            .filter((unit) => unit.outOfScope?.length)
            .map((unit) => `${unit.unitId} (out-of-scope-writes: ${unit.outOfScope.join(', ')})`));
          if (flagged.length > 0) {
            const reason = `integrate refused, nothing merged: ${flagged.join('; ')}`;
            const failedAt = new Date().toISOString();
            recordEvent({ repoRoot: mainRoot, workflowRunId, event: { type: 'step.fail', payload: { stepId: step.id, outcome: 'findings', reason, failedAt } } });
            recordEvent({ repoRoot: mainRoot, workflowRunId, event: { type: 'workflow.fail', payload: { outcome: 'findings', stepId: step.id, reason, failedAt } } });
            stateChanged = true;
            continue;
          }
          let integrationFailure = integrationTarget ? null : 'integration target unknown: no declared target, remote default branch or checked-out branch';
          const landed = [];
          // Only a writing unit has a branch to bring in; a read-only unit records none.
          for (const depId of integrationFailure ? [] : step.dependsOn) {
            for (const unit of Object.values(state.steps[depId]?.units ?? {})) {
              if (!unit.branch) continue;
              try {
                const merged = await mergeWorkflowBranch({
                  repoRoot: mainRoot,
                  sourceBranch: unit.branch,
                  targetBranch: integrationTarget,
                  callerCheckout: documentationAdmission.callerCheckout,
                  commitMessage: `integrate: merge step ${depId} unit ${unit.unitId}`,
                });
                if (merged.operationId) landed.push(merged.operationId);
              } catch (err) {
                integrationFailure = `integration of ${unit.branch} refused: ${err.message}`;
                break;
              }
            }
            if (integrationFailure) break;
          }

          if (integrationFailure) {
            const failedAt = new Date().toISOString();
            recordEvent({ repoRoot: mainRoot, workflowRunId, event: { type: 'step.fail', payload: { stepId: step.id, outcome: 'findings', reason: integrationFailure, failedAt } } });
            recordEvent({ repoRoot: mainRoot, workflowRunId, event: { type: 'workflow.fail', payload: { outcome: 'findings', stepId: step.id, reason: integrationFailure, failedAt } } });
          } else {
            completeStep(step.id);
            // The completed step is the durable record of the delivery; only now may Land release
            // its candidates. A cleanup warning never negates the integration.
            for (const operationId of landed) acknowledgeWorkflowLand(mainRoot, operationId, `workflow-run:${workflowRunId}/step:${step.id}`);
          }
          stateChanged = true;
          continue;
        }

        // 3. Standard step with units
        if (step.units && step.units.length > 0) {
          let failedUnit = null;
          let reparked = false;
          for (const u of step.units) {
            const uState = stepState.units[u.id];
            if (uState && uState.status === 'completed') {
              continue;
            }

            // Build unit object
            const handoff = buildUnitHandoff({ template: u.template, state, step, workflow });
            const unitData = {
              id: u.id,
              objective: handoff.objective || `Execute unit ${u.id} in step ${step.id}`,
              ...unitFieldsOfTemplate(u.template),
              dependsOn: u.dependsOn || [],
              inputs: handoff.inputs,
              stanceOptions: state.stanceOptions?.length ? state.stanceOptions : u.template.stanceOptions,
            };

            // A unit left `running` with a recorded Unit run id was started by a controller that died:
            // continue that run (settled seats are kept) and reuse the worktree it already has.
            // Only when what it needs is still there: after a reboot or a temp-dir cleanup the run's
            // worktree is gone and resuming would fail for good, where a fresh run can still work.
            let resumeUnitRunId = uState?.status === 'running' && canResumeUnitRun(mainRoot, uState) ? uState.unitRunId : null;
            let startedUnitRunId = null;

            // If unit has writes, prepare worktree
            let unitWorktree = worktreePath;
            let uBranch = null;
            let ownsWorktree = false;
            let baseRef = null;
            let baseSha = null;
            // Why a writing unit cannot get its own worktree; it then fails without running.
            let prepError = null;
            const base = unitData.writes.length > 0 ? singleWriteBaseOf(workflow, step.id) : null;
            if (resumeUnitRunId) {
              // The seats run in the worktree recorded in the Unit run; never make another one here.
              unitWorktree = uState.worktreePath ?? worktreePath;
              uBranch = uState.branch ?? null;
              baseSha = uState.baseSha ?? null;
              baseRef = uState.baseRef ?? null;
            } else if (unitData.writes.length > 0) {
              uBranch = `wf/${workflowRunId}/${u.id}`;
              // A unit that builds on a writing unit starts on that unit's branch, so it sees its work.
              baseRef = base ? state.steps[base.stepId]?.units[base.unitId]?.branch : 'HEAD';
              baseSha = baseRef ? workflowCommit(mainRoot, baseRef) : null;
              if (!baseSha) {
                prepError = base
                  ? `base branch "${baseRef ?? `of unit ${base.unitId}`}" of writing unit ${base.unitId} is gone; it cannot start from the work it builds on`
                  : `cannot resolve ${baseRef} to start the unit's worktree from`;
              } else {
                try {
                  unitWorktree = createWorkflowWorktree({ repoRoot: mainRoot, branch: uBranch, baseRef: baseSha }).worktreePath;
                  ownsWorktree = true;
                } catch (err) {
                  // Never fall back to the shared checkout: a writer there would commit onto the caller's branch.
                  prepError = `could not create the unit's worktree on ${uBranch}: ${err.message}`;
                }
              }
            }

            // Admission happens inside runUnit, through the port this proposer injects with its own
            // `advance` hold: the Execution Core asks before it creates anything, and a refusal arrives
            // as CaseAdmissionRefusedError. `unit.scheduled` is recorded the moment the Unit is
            // admitted (or, for a Unit that could not be prepared or resumed, when it runs).
            let scheduledRecorded = Boolean(resumeUnitRunId);
            const recordScheduled = (reservationId = null) => {
              // Recording it again would reset the unit and lose the run id it already carries.
              if (scheduledRecorded) return;
              scheduledRecorded = true;
              recordEvent({
                repoRoot: mainRoot,
                workflowRunId,
                event: {
                  type: 'unit.scheduled',
                  payload: {
                    stepId: step.id,
                    unitId: u.id,
                    ...(reservationId ? { reservationId } : {}),
                    ...(ownsWorktree ? { worktreePath: unitWorktree, branch: uBranch, baseRef, baseSha } : {}),
                  },
                },
              });
            };

            // Run Unit via P1 execution door. A throw (an unresolvable hand-off ref, a refused
            // config) is a failed unit like any other: left uncaught it would end the advance with
            // the run still `running` and no event saying why.
            let unitRunResult;
            try {
              if (prepError) {
                recordScheduled();
                throw new RunnerConfigError(prepError);
              }
              // Reports a fresh approval stands behind may be handed over although their bytes changed after
              // settlement; an edit no approval covers is still refused by the Execution Core.
              const fresh = reread();
              const runOptions = {
                unitData,
                acceptedReports: approvedReportDigests({ events: fresh.events, state: fresh.state, workflow, mainRoot }),
                repoRoot: mainRoot,
                documentationAdmission,
                cwd: unitWorktree,
                worktree: unitWorktree,
                pattern: unitPatternOf(u.template),
                personaScope,
                workflowId: workflow.id,
                overrides: await (async () => {
                  let unitAccount = state.account ?? null;
                  if (unitAccount !== null) {
                    const runnerConfig = ensureRunnerConfigForDir(mainRoot);
                    const testOverrides = unitOverridesOf(u, state.seats?.personas, {
                      effort: state.effort,
                      timeoutMs: state.timeoutMs,
                      account: unitAccount,
                    });
                    const dry = await simulateUnitBindings(
                      { ...unitData, pattern: unitPatternOf(u.template) || 'solo' },
                      runnerConfig,
                      { session: { headless: true, herdrPresent: detectHerdrPresent() }, overrides: testOverrides },
                    );
                    if (!dry.seats.some((r) => r.account)) {
                      // No seat of this unit runs on the account's provider: the unit runs unpinned,
                      // and the run says so instead of dropping the pin silently.
                      recordEvent({
                        repoRoot: mainRoot,
                        workflowRunId,
                        event: { type: 'unit.account-unpinned', payload: { stepId: step.id, unitId: u.id, account: unitAccount } },
                      });
                      unitAccount = null;
                    }
                  }
                  return unitOverridesOf(u, state.seats?.personas, {
                    effort: state.effort,
                    timeoutMs: state.timeoutMs,
                    account: unitAccount,
                  });
                })(),
                caseAdmission: port,
                caseRef: { caseId: workflowRunId, activity: step.id, unitId: u.id },
                onCaseAdmitted: ({ reservationId }) => recordScheduled(reservationId),
                ...(resumeUnitRunId ? { resumeUnitRunId } : {
                  onUnitRunCreated: (unitRunId) => {
                    startedUnitRunId = unitRunId;
                    recordEvent({
                      repoRoot: mainRoot,
                      workflowRunId,
                      event: { type: 'unit.started', payload: { stepId: step.id, unitId: u.id, unitRunId } },
                    });
                  },
                }),
              };
              try {
                unitRunResult = await runUnit(runOptions);
              } catch (err) {
                if (err?.errorClass !== 'custody-predecessor-unknown' || unitData.writes.length === 0) throw err;
                // Preserve the unknown predecessor's checkout and branch. Start from the trusted
                // base, never from commits an unproven predecessor may still be changing.
                const preservedWorktree = unitWorktree;
                const preservedBranch = uBranch;
                baseRef ??= base ? state.steps[base.stepId]?.units[base.unitId]?.branch : 'HEAD';
                baseSha ??= baseRef ? workflowCommit(mainRoot, baseRef) : null;
                if (!baseSha) throw err;
                uBranch = `wf/${workflowRunId}/${u.id}-recovery-${crypto.randomUUID()}`;
                unitWorktree = createWorkflowWorktree({ repoRoot: mainRoot, branch: uBranch, baseRef: baseSha }).worktreePath;
                ownsWorktree = true;
                resumeUnitRunId = null;
                startedUnitRunId = null;
                // The recovery checkout is admitted and bound by the run that starts in it.
                recordEvent({ repoRoot: mainRoot, workflowRunId, event: {
                  type: 'unit.scheduled', payload: { stepId: step.id, unitId: u.id,
                    worktreePath: unitWorktree, branch: uBranch, baseRef, baseSha,
                    recovery: { reason: err.errorClass, preservedWorktree, preservedBranch } },
                } });
                unitRunResult = await runUnit({ ...runOptions, cwd: unitWorktree, worktree: unitWorktree,
                  resumeUnitRunId: undefined,
                  onCaseAdmitted: undefined,
                  onUnitRunCreated: (unitRunId) => {
                    startedUnitRunId = unitRunId;
                    recordEvent({ repoRoot: mainRoot, workflowRunId, event: {
                      type: 'unit.started', payload: { stepId: step.id, unitId: u.id, unitRunId },
                    } });
                  },
                });
              }
            } catch (err) {
              if (err instanceof CaseAdmissionRefusedError) {
                // Refused before anything existed: the worktree made for the Unit goes, the step ends by name,
                // or, when the approval it stands on went stale, the gate asks again.
                if (ownsWorktree) cleanupWorkflowWorktree({ repoRoot: mainRoot, worktreePath: unitWorktree, branch: uBranch, deleteBranch: true });
                const refused = err.refusal;
                const approval = (refused.violations ?? []).find((v) => APPROVAL_REFUSALS.has(v.code) && v.milestone);
                const guide = projectCase(readWorkflowEvents({ repoRoot: mainRoot, workflowRunId })).guide;
                const gated = approval && workflow.steps.find((s) => s.gate && guide.activities.find((a) => a.id === s.id)?.produces.includes(approval.milestone));
                if (gated) {
                  // What was approved is not what is there now: the gate asks again, for the current version.
                  recordEvent({
                    repoRoot: mainRoot,
                    workflowRunId,
                    event: {
                      type: 'gate.park',
                      payload: {
                        stepId: gated.id,
                        question: `${gated.gate.question || `Approve step "${gated.id}"?`}\n\n(Asked again: ${approval.condition})`,
                        header: gated.gate.header,
                        parkedAt: new Date().toISOString(),
                        reason: approval.code,
                      },
                    },
                  });
                  reparked = true;
                } else {
                  failedUnit = { unitId: u.id, outcome: 'refused', results: [], error: `admission refused ${refused.code}: ${refused.condition}`, outOfScope: [] };
                }
                stateChanged = true;
                break;
              }
              recordScheduled();
              unitRunResult = {
                unitRunId: resumeUnitRunId ?? startedUnitRunId,
                outcome: 'execution-failure',
                results: [],
                error: String(err?.message ?? err),
              };
            }

            // Writing outside the unit's scope is a finding: the unit does not pass, its branch is not
            // integrated. A writer standing on a branch that itself carries such paths carries them too,
            // so they never reach the target through it; a path left uncommitted on the base is not on
            // its branch and holds nothing back.
            const own = unitData.writes.length > 0 && unitRunResult.unitRunId
              ? outOfScopeWrites(mainRoot, { unitRunId: unitRunResult.unitRunId, writes: unitData.writes, results: unitRunResult.results || [], branch: uBranch, baseSha })
              : { all: [], onBranch: [] };
            const inherited = base ? state.steps[base.stepId]?.units[base.unitId]?.outOfScopeOnBranch ?? [] : [];
            const outOfScope = [...new Set([...own.all, ...inherited])].sort();
            const outOfScopeOnBranch = [...new Set([...own.onBranch, ...inherited])].sort();
            if (outOfScope.length > 0 && unitRunResult.outcome === 'pass') unitRunResult = { ...unitRunResult, outcome: 'findings' };

            recordEvent({
              repoRoot: mainRoot,
              workflowRunId,
              event: {
                type: 'unit.complete',
                payload: {
                  stepId: step.id,
                  unitId: u.id,
                  unitRunId: unitRunResult.unitRunId,
                  outcome: unitRunResult.outcome,
                  results: unitRunResult.results || [],
                  ...(outOfScope.length > 0 ? { outOfScope } : {}),
                  ...(outOfScopeOnBranch.length > 0 ? { outOfScopeOnBranch } : {}),
                },
              },
            });

            // The reservation was settled by the run itself, through the port; fold in anything that arrived meanwhile.
            reread();

            stateChanged = true;
            // Only explicitly accepted semantic outcomes proceed; execution failures never do.
            if (!(u.template.acceptOutcomes ?? ['pass']).includes(unitRunResult.outcome)) {
              failedUnit = { unitId: u.id, outcome: unitRunResult.outcome, results: unitRunResult.results || [], error: unitRunResult.error, outOfScope };
              break;
            }
          }

          if (reparked) continue;
          if (failedUnit) {
            const refusal = failedUnit.results.find((r) => r?.refused)?.refused;
            const reason = refusal
              ? `${refusal.reason}: ${refusal.detail}`
              : failedUnit.outOfScope.length > 0
                ? `unit ${failedUnit.unitId} ended ${failedUnit.outcome}: out-of-scope-writes: ${failedUnit.outOfScope.join(', ')}`
                : failedUnit.error
                ? `unit ${failedUnit.unitId} could not run: ${failedUnit.error}`
                : `unit ${failedUnit.unitId} ended ${failedUnit.outcome}`;
            recordEvent({
              repoRoot: mainRoot,
              workflowRunId,
              event: {
                type: 'step.fail',
                payload: { stepId: step.id, outcome: failedUnit.outcome, unitId: failedUnit.unitId, reason, failedAt: new Date().toISOString() },
              },
            });
            recordEvent({
              repoRoot: mainRoot,
              workflowRunId,
              event: {
                type: 'workflow.fail',
                payload: { outcome: failedUnit.outcome, stepId: step.id, reason, failedAt: new Date().toISOString() },
              },
            });
            break;
          }

          completeStep(step.id);
        } else {
          // Step with no units
          completeStep(step.id);
          stateChanged = true;
        }
      }

      state = reread().state;

      if (!stateChanged) {
        break;
      }
    }

    // One last look before leaving, bounded to a single read: an answer that arrived while this
    // proposer was finishing is on the ledger now, and if it releases a gate the run goes on.
    const last = reread();
    state = last.state;
    if (last.drained.answers === 0 || state.status !== 'running') break;
  }

  if ((state.status === 'completed' || state.status === 'failed') && !state.worktrees) {
    const { removed, kept } = settleUnitWorktrees({ mainRoot, state, workflow });
    if (removed.length > 0 || kept.length > 0) {
      recordEvent({
        repoRoot: mainRoot,
        workflowRunId,
        event: { type: 'workflow.worktrees', payload: { removed, kept } },
      });
      state = projectWorkflowState(readWorkflowEvents({ repoRoot: mainRoot, workflowRunId }));
    }
  }

  return state;
}

/**
 * Bring one writing unit's branch into the integration target through Land. A branch the target
 * already contains is integrated and lands nothing (Land refuses a fresh identity for it).
 * Workflow runs no verification command of its own, so the evidence it binds says exactly that.
 */
export async function mergeWorkflowBranch({ repoRoot, sourceBranch, targetBranch, callerCheckout = repoRoot, commitMessage, squash = false }) {
  if (!repoRoot || !sourceBranch || !targetBranch) throw new RunnerConfigError('mergeWorkflowBranch requires repoRoot, sourceBranch and targetBranch');
  const destination = targetBranch.startsWith('refs/') ? targetBranch : `refs/heads/${targetBranch}`;
  const source = workflowCommit(repoRoot, sourceBranch);
  const target = workflowCommit(repoRoot, destination);
  if (!source) throw new RunnerConfigError(`workflow branch "${sourceBranch}" is gone`);
  if (!target) throw new RunnerConfigError(`integration target "${targetBranch}" is unknown`);
  // Inspect the pinned branch's complete merge-base diff before a Land port
  // can create a candidate or WAL. No rename folding: both old and new paths
  // must count, including a move out of frozen scope.
  const inspect = workflowInspect(repoRoot);
  const base = inspect.compareCommits({ left: target, right: source }).mergeBase;
  const paths = [];
  let cursor;
  do {
    const page = inspect.diff({ before: base, after: source, renames: false, cursor, maxEntries: 4096 });
    paths.push(...page.entries.map(entry => Buffer.from(entry.path).toString('utf8')));
    cursor = page.nextCursor;
  } while (cursor);
  const admission = leaseAdmission({ repoRoot, worktreePath: callerCheckout, paths });
  if (!admission.allowed) throw new RunnerConfigError(admission.message, { code: admission.reason });
  if (inspect.ancestry({ ancestor: source, descendant: target }).answer === 'yes') {
    return { merged: false, sourceBranch, targetBranch, operationId: null };
  }
  const operationId = crypto.randomUUID();
  const port = createGitLand(gitPortOptions(repoRoot, { mutation: true }));
  try {
    const { candidate, receipt: prior } = await port.prepare({ operationId, request: {
      source, destination,
      message: commitMessage ?? `merge: integrate workflow branch ${sourceBranch} into ${targetBranch}`,
      // Only the paths the branch brings count against the main checkout's own edits.
      squash, footprint: [], subtree: null, files: [],
    } });
    const receipt = prior ?? await port.publish({ source: candidate.source, target: candidate.target,
      candidate: candidate.candidate, treeDigest: candidate.treeDigest,
      evidenceDigest: crypto.createHash('sha256').update(JSON.stringify({ policy: 'workflow integration runs no verification command', source: candidate.source, target: candidate.target, candidate: candidate.candidate })).digest('hex'),
    });
    return { merged: true, sourceBranch, targetBranch, operationId, receipt };
  } finally { port.close(); }
}

function acknowledgeWorkflowLand(repoRoot, operationId, acknowledgement) {
  let port;
  try {
    port = createGitLand(gitPortOptions(repoRoot, { mutation: true }));
    return port.recover({ operationId, consumerAcknowledgement: acknowledgement }).warnings;
  } catch (err) {
    return [`land-cleanup-deferred: ${err.message}`];
  } finally {
    port?.close();
  }
}
