// src/workflow/index.mjs — the verbs the CLI door calls; everything else is imported from the file that owns it
// Architecture guard: MUST NOT import src/state/** or src/runner/coordination/** (A4 boundary)

export { preflightWorkflowSeats } from './case-start.mjs';
export {
  startWorkflow,
  statusWorkflow,
  answerWorkflow,
  resumeWorkflow,
  closeWorkflow,
  pruneWorkflow,
  gateWorkflow,
} from './case-verbs.mjs';
