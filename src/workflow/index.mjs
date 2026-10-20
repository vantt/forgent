// src/workflow/index.mjs — Public interface for Workflow runner & definition
// Architecture guard: MUST NOT import src/state/** or src/runner/coordination/** (A4 boundary)

export { validateWorkflow, WorkflowDefinitionError } from './definition.mjs';
export { loadWorkflow, discoverWorkflows } from './loader.mjs';
export {
  createWorkflowRun,
  appendWorkflowEvent,
  readWorkflowEvents,
  recoverWorkflowLedgerTail,
  projectWorkflowState,
} from './store.mjs';
export {
  createWorkflowWorktree,
  resolveIntegrationTarget,
  cleanupWorkflowWorktree,
} from './unit-handoff.mjs';
export { mergeWorkflowBranch } from './runner.mjs';
export { translateUnitsToWorkflow } from './units-source.mjs';
export { preflightWorkflowSeats } from './case-start.mjs';
export {
  startWorkflow,
  startWorkflowDetached,
  answerWorkflowDetached,
  resumeWorkflowDetached,
  statusWorkflow,
  answerWorkflow,
  resumeWorkflow,
  closeWorkflow,
} from './case-verbs.mjs';
