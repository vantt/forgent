// src/workflow/checked.mjs — validateWorkflow with the runner's own error class
// Architecture guard: infra layer; the kernel-level definition module stays free of runner imports.

import { validateWorkflow, WorkflowDefinitionError } from './definition.mjs';
import { RunnerConfigError } from '../runner/dispatch/config.mjs';

/**
 * Validate a raw Workflow definition, surfacing a malformed definition as the
 * RunnerConfigError every CLI/runner caller already handles.
 *
 * @param {unknown} raw
 * @returns {Readonly<object>}
 */
export function validateWorkflowChecked(raw) {
  try {
    return validateWorkflow(raw);
  } catch (err) {
    if (err instanceof WorkflowDefinitionError) throw new RunnerConfigError(err.message);
    throw err;
  }
}
