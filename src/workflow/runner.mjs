// src/workflow/runner.mjs — Workflow execution runner, DAG sequencer, and gate manager
// Architecture guard: MUST NOT import src/state/** or src/runner/coordination/** (A4 boundary)

import fs from 'node:fs';
import path from 'node:path';

import { validateWorkflowChecked as validateWorkflow } from './checked.mjs';
import { loadWorkflow } from './loader.mjs';
import {
  createWorkflowRun,
  appendWorkflowEvent,
  readWorkflowEvents,
  projectWorkflowState,
} from './store.mjs';
import {
  createWorkflowWorktree,
  mergeWorkflowBranch,
  cleanupWorkflowWorktree,
} from './integrate.mjs';
import { translatePlanToWorkflow } from './plan-source.mjs';
import { runUnit, snapshotRunnerConfig, resolveGitRoots } from '../runner/execution/run.mjs';
import { RunnerConfigError } from '../runner/dispatch/config.mjs';

/**
 * Run loop to advance ready steps in a Workflow run.
 */
async function advanceWorkflowRun({ repoRoot, workflowRunId, workflow, mainRoot, worktreePath, onLog }) {
  let events = readWorkflowEvents({ repoRoot: mainRoot, workflowRunId });
  let state = projectWorkflowState(events);

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
      if (!stepState || stepState.status === 'completed' || stepState.status === 'parked') {
        return false;
      }
      return step.dependsOn.every((dep) => completedStepIds.has(dep));
    });

    if (readySteps.length === 0) {
      // Check if all steps completed
      const allDone = steps.every((s) => state.steps[s.id]?.status === 'completed');
      if (allDone) {
        appendWorkflowEvent({
          repoRoot: mainRoot,
          workflowRunId,
          event: {
            type: 'workflow.complete',
            payload: { outcome: 'pass', completedAt: new Date().toISOString() },
          },
        });
        state = projectWorkflowState(readWorkflowEvents({ repoRoot: mainRoot, workflowRunId }));
      }
      break;
    }

    // Process ready steps
    let stateChanged = false;
    for (const step of readySteps) {
      const stepState = state.steps[step.id];

      // 1. Human gate check
      if (step.gate && step.gate.kind === 'human' && stepState.status !== 'answered') {
        appendWorkflowEvent({
          repoRoot: mainRoot,
          workflowRunId,
          event: {
            type: 'gate.park',
            payload: {
              stepId: step.id,
              question: step.gate.question || `Approve step "${step.id}"?`,
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
        appendWorkflowEvent({
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
        // Collect branches from predecessor units
        for (const depId of step.dependsOn) {
          const depStep = workflow.steps.find((s) => s.id === depId);
          if (depStep?.units) {
            for (const u of depStep.units) {
              const uBranch = `wf/${workflowRunId}/${u.id}`;
              try {
                mergeWorkflowBranch({
                  repoRoot: mainRoot,
                  sourceBranch: uBranch,
                  targetBranch: 'main',
                  commitMessage: `integrate: merge step ${depId} unit ${u.id}`,
                });
              } catch {
                // If branch didn't have commits or already merged, ignore
              }
            }
          }
        }

        appendWorkflowEvent({
          repoRoot: mainRoot,
          workflowRunId,
          event: {
            type: 'step.complete',
            payload: { stepId: step.id, outcome: 'pass', completedAt: new Date().toISOString() },
          },
        });
        stateChanged = true;
        continue;
      }

      // 3. Standard step with units
      if (step.units && step.units.length > 0) {
        let stepFailed = false;
        for (const u of step.units) {
          const uState = stepState.units[u.id];
          if (uState && uState.status === 'completed') {
            continue;
          }

          // Build unit object
          const unitData = {
            id: u.id,
            objective: u.template.objective || `Execute unit ${u.id} in step ${step.id}`,
            capability: u.template.capability,
            pattern: u.template.pattern || 'solo',
            rigor: u.template.rigor,
            writes: u.template.writes || [],
            dependsOn: u.dependsOn || [],
          };

          // If unit has writes, prepare worktree
          let unitWorktree = worktreePath;
          let uBranch = null;
          if (unitData.writes.length > 0) {
            uBranch = `wf/${workflowRunId}/${u.id}`;
            try {
              const wtInfo = createWorkflowWorktree({
                repoRoot: mainRoot,
                branch: uBranch,
              });
              unitWorktree = wtInfo.worktreePath;
            } catch {
              unitWorktree = worktreePath;
            }
          }

          appendWorkflowEvent({
            repoRoot: mainRoot,
            workflowRunId,
            event: {
              type: 'unit.scheduled',
              payload: { stepId: step.id, unitId: u.id },
            },
          });

          // Run Unit via P1 execution door
          const unitRunResult = await runUnit({
            unitData,
            repoRoot: mainRoot,
            cwd: unitWorktree,
            worktree: unitWorktree,
            pattern: unitData.pattern,
          });

          appendWorkflowEvent({
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
              },
            },
          });

          if (unitRunResult.outcome !== 'pass') {
            stepFailed = true;
          }
          stateChanged = true;
        }

        if (!stepFailed) {
          appendWorkflowEvent({
            repoRoot: mainRoot,
            workflowRunId,
            event: {
              type: 'step.complete',
              payload: { stepId: step.id, outcome: 'pass', completedAt: new Date().toISOString() },
            },
          });
        }
      } else {
        // Step with no units
        appendWorkflowEvent({
          repoRoot: mainRoot,
          workflowRunId,
          event: {
            type: 'step.complete',
            payload: { stepId: step.id, outcome: 'pass', completedAt: new Date().toISOString() },
          },
        });
        stateChanged = true;
      }
    }

    events = readWorkflowEvents({ repoRoot: mainRoot, workflowRunId });
    state = projectWorkflowState(events);

    if (!stateChanged) {
      break;
    }
  }

  return state;
}

/**
 * Start a new Workflow run.
 *
 * @param {object} params
 * @param {string} [params.workflowId] Id of registered workflow
 * @param {object} [params.workflow] In-memory workflow object
 * @param {string} [params.planPath] Path to AgentKit plan.md or plan directory
 * @param {string} [params.repoRoot]
 * @param {string} [params.cwd]
 * @param {string} [params.worktree]
 * @param {Function} [params.onLog]
 * @returns {Promise<object>} Projected workflow state
 */
export async function startWorkflow(params = {}) {
  const cwd = params.cwd ?? process.cwd();
  const roots = resolveGitRoots(cwd);
  const mainRoot = params.repoRoot ? path.resolve(params.repoRoot) : roots.mainCheckoutRoot;
  const worktreePath = params.worktree ? path.resolve(params.worktree) : roots.worktreeRoot;

  let workflow;
  let workflowId;

  if (params.workflow) {
    workflow = validateWorkflow(params.workflow);
    workflowId = workflow.id;
  } else if (params.planPath) {
    workflow = translatePlanToWorkflow(params.planPath);
    workflowId = workflow.id;
  } else if (params.workflowId) {
    workflow = loadWorkflow(params.workflowId, { packageRoot: mainRoot, cwd });
    workflowId = workflow.id;
  } else {
    throw new RunnerConfigError('startWorkflow requires workflowId, workflow, or planPath');
  }

  const configSnapshot = snapshotRunnerConfig(mainRoot);
  const { workflowRunId } = createWorkflowRun({
    repoRoot: mainRoot,
    workflowId,
    workflow,
    configSnapshot,
  });

  return await advanceWorkflowRun({
    repoRoot: mainRoot,
    workflowRunId,
    workflow,
    mainRoot,
    worktreePath,
    onLog: params.onLog,
  });
}

/**
 * Get current projected status of a Workflow run.
 *
 * @param {string} workflowRunId
 * @param {object} [options]
 * @param {string} [options.repoRoot]
 * @param {string} [options.cwd]
 * @returns {object} Projected state
 */
export function statusWorkflow(workflowRunId, options = {}) {
  if (!workflowRunId) throw new RunnerConfigError('statusWorkflow requires workflowRunId');
  const cwd = options.cwd ?? process.cwd();
  const roots = resolveGitRoots(cwd);
  const mainRoot = options.repoRoot ? path.resolve(options.repoRoot) : roots.mainCheckoutRoot;

  const events = readWorkflowEvents({ repoRoot: mainRoot, workflowRunId });
  if (events.length === 0) {
    throw new RunnerConfigError(`Workflow run "${workflowRunId}" not found`);
  }
  return projectWorkflowState(events);
}

/**
 * Answer a parked human gate in a Workflow run.
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
  if (!params.stepId) throw new RunnerConfigError('answerWorkflow requires stepId');
  if (params.answer === undefined) throw new RunnerConfigError('answerWorkflow requires answer');

  const cwd = params.cwd ?? process.cwd();
  const roots = resolveGitRoots(cwd);
  const mainRoot = params.repoRoot ? path.resolve(params.repoRoot) : roots.mainCheckoutRoot;
  const worktreePath = params.worktree ? path.resolve(params.worktree) : roots.worktreeRoot;

  const events = readWorkflowEvents({ repoRoot: mainRoot, workflowRunId });
  if (events.length === 0) {
    throw new RunnerConfigError(`Workflow run "${workflowRunId}" not found`);
  }
  const state = projectWorkflowState(events);

  appendWorkflowEvent({
    repoRoot: mainRoot,
    workflowRunId,
    event: {
      type: 'gate.answer',
      payload: {
        stepId: params.stepId,
        answer: params.answer,
        answeredAt: new Date().toISOString(),
      },
    },
  });

  return await advanceWorkflowRun({
    repoRoot: mainRoot,
    workflowRunId,
    workflow: state.workflow,
    mainRoot,
    worktreePath,
  });
}

/**
 * Resume execution of an existing Workflow run.
 *
 * @param {string} workflowRunId
 * @param {object} [options]
 * @param {string} [options.repoRoot]
 * @param {string} [options.cwd]
 * @returns {Promise<object>} Projected state
 */
export async function resumeWorkflow(workflowRunId, options = {}) {
  if (!workflowRunId) throw new RunnerConfigError('resumeWorkflow requires workflowRunId');
  const cwd = options.cwd ?? process.cwd();
  const roots = resolveGitRoots(cwd);
  const mainRoot = options.repoRoot ? path.resolve(options.repoRoot) : roots.mainCheckoutRoot;
  const worktreePath = options.worktree ? path.resolve(options.worktree) : roots.worktreeRoot;

  const events = readWorkflowEvents({ repoRoot: mainRoot, workflowRunId });
  if (events.length === 0) {
    throw new RunnerConfigError(`Workflow run "${workflowRunId}" not found`);
  }
  const state = projectWorkflowState(events);

  return await advanceWorkflowRun({
    repoRoot: mainRoot,
    workflowRunId,
    workflow: state.workflow,
    mainRoot,
    worktreePath,
  });
}
