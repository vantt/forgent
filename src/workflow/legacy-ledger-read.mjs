// src/workflow/legacy-ledger-read.mjs -- the one reader of unit.complete entries written before Execution handed
// up its own `infrastructure` fact. Such an entry holds only an outcome string, its seat results and (when
// non-empty) `outOfScope`; this module answers for it with the derivation Workflow used to carry, taken from
// Execution's outcome module so no second list exists. It also renames Workflow's old step outcome `refused`. Nothing else reads the old shape. Delete this file one
// release after it lands, when every ledger on every machine has been written by the new runner.

import { infrastructure } from '../runner/execution/outcome.mjs';

/**
 * Whether an old `unit.complete` entry ended on infrastructure. An entry that carries the fact is never routed
 * here; one without it is answered from its outcome, so it is rerunnable exactly as before and never read as a pass.
 *
 * @param {{ outcome?: string, outOfScope?: string[], results?: object[] }} entry
 * @returns {boolean}
 */
export const legacyInfrastructureOf = (entry) => infrastructure(entry);

/**
 * The outcome of an old `step.fail` or `workflow.fail` entry. Workflow named a step ended by an admission refusal
 * `refused`, the word Execution keeps for a seat's own fact; it now writes `admission-refused`, and an old
 * ledger still reads under the new name.
 *
 * @param {string|undefined} outcome
 */
export const legacyStepOutcomeOf = (outcome) => (outcome === 'refused' ? 'admission-refused' : outcome);
