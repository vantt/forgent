// src/convention/definition-names.mjs — the file names of workflow and persona definitions, read from the Convention contract.
// Convention owns `wf.<name>.yaml` (a packaged workflow) and `agent.<name>.yaml` (a persona beside it) and the
// name rules behind them (`definitionFiles` and the `workflow-name` / `agent-name` identifiers of the contract
// packages/convention/contracts/convention.rules.v1.json); the Rust crate reads the same entries and both run the
// same golden vectors. Leaf module: imports nothing from the runner.

import { contractRules, identifierProblem } from './identifier-rules.mjs';

function definitionFileRule(id) {
  const found = contractRules().definitionFiles?.find((r) => r.id === id);
  if (!found) throw new Error(`convention.rules.v1.json has no "${id}" definition file rule`);
  return found;
}

/**
 * The name inside a definition file name, or null when the file name does not follow the rule.
 *
 * @param {'workflow-file' | 'agent-file'} ruleId
 * @param {string} fileName a bare file name, never a path
 * @returns {string | null}
 */
export function definitionNameOf(ruleId, fileName) {
  const rule = definitionFileRule(ruleId);
  if (typeof fileName !== 'string' || !fileName.startsWith(rule.prefix) || !fileName.endsWith(rule.suffix)) return null;
  const name = fileName.slice(rule.prefix.length, fileName.length - rule.suffix.length);
  return identifierProblem(rule.nameIdentifier, name) === null ? name : null;
}

/** The file name a definition of `name` has under the rule; throws when `name` is not a valid name for it. */
export function definitionFileName(ruleId, name) {
  const rule = definitionFileRule(ruleId);
  if (identifierProblem(rule.nameIdentifier, name) !== null) throw new TypeError(`${JSON.stringify(name)} is not a valid ${rule.nameIdentifier}`);
  return `${rule.prefix}${name}${rule.suffix}`;
}
