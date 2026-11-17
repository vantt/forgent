// src/workflow/checked.mjs — validateWorkflow with the runner's own error class
// Architecture guard: infra layer; the kernel-level definition module stays free of runner imports.

import { validateWorkflow, WorkflowDefinitionError } from './definition.mjs';
import { MODEL_POLICY_TIERS } from '../runner/dispatch/config.mjs';
import { RunnerConfigError } from '../runner/dispatch/runner-config-error.mjs';
import { checkDeclaredSeats, assertNoSeatTier, assertNoUnitTier } from '../runner/execution/seat-resolver.mjs';

/**
 * Validate a raw Workflow definition, surfacing a malformed definition as the
 * RunnerConfigError every CLI/runner caller already handles.
 *
 * @param {unknown} raw
 * @param {object} [options] passed through to validateWorkflow (e.g. `{ source: 'units-file' }`)
 * @returns {Readonly<object>}
 */
export function validateWorkflowChecked(raw, options) {
  let workflow;
  try {
    workflow = validateWorkflow(raw, options);
  } catch (err) {
    if (err instanceof WorkflowDefinitionError) throw new RunnerConfigError(err.message);
    throw err;
  }
  // Declared seats: ids by Convention's rule, roles from the seat vocabulary, tiers from the ladder. A
  // tier is a recommendation of a registered definition, so one from a units file is refused.
  for (const step of workflow.steps) {
    for (const unit of step.units ?? []) {
      if (options?.source === 'units-file') assertNoUnitTier(unit.template, 'a units file');
      // validateUnit checks the same ladder when the unit runs; here a bad tier is refused when the definition
      // loads, naming its step and unit.
      const tier = unit.template?.tier;
      if (tier !== undefined && !MODEL_POLICY_TIERS.includes(tier)) {
        throw new RunnerConfigError(`step "${step.id}" unit "${unit.id}" tier "${tier}" must be one of [${MODEL_POLICY_TIERS.join(', ')}]`);
      }
      const seats = unit.template?.seats;
      if (seats === undefined) continue;
      const label = `step "${step.id}" unit "${unit.id}" seats`;
      if (options?.source === 'units-file') assertNoSeatTier(seats, 'a units file');
      try {
        checkDeclaredSeats(seats, label, { tiers: MODEL_POLICY_TIERS });
      } catch (err) {
        throw new RunnerConfigError(err.message);
      }
    }
  }
  return workflow;
}
