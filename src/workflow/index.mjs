// src/workflow/index.mjs — Public interface for Workflow runner & definition
// Architecture guard: MUST NOT import src/state/** or src/runner/coordination/** (A4 boundary)

export { validateWorkflow, WorkflowDefinitionError } from './definition.mjs';
export { loadWorkflow, discoverWorkflows } from './loader.mjs';
export {
  createWorkflowRun,
  appendWorkflowEvent,
  readWorkflowEvents,
  projectWorkflowState,
} from './store.mjs';
export {
  createWorkflowWorktree,
  mergeWorkflowBranch,
  resolveIntegrationTarget,
  cleanupWorkflowWorktree,
} from './integrate.mjs';
export { translatePlanToWorkflow } from './plan-source.mjs';
export {
  startWorkflow,
  startWorkflowDetached,
  statusWorkflow,
  answerWorkflow,
  resumeWorkflow,
} from './runner.mjs';
