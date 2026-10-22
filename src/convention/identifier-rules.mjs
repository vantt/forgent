// src/convention/identifier-rules.mjs — the one reader of the Convention rules contract and the one identifier check.
// A seat id, a workflow name and a persona name are identifiers under packages/convention/contracts/convention.rules.v1.json
// (`identifiers`); the Rust crate reads the same entries and both run the same golden vectors. Leaf module: imports nothing from the runner.

import fs from 'node:fs';

const RULES_URL = new URL('../../packages/convention/contracts/convention.rules.v1.json', import.meta.url);

let contract = null;

// Read on first use, so a process that never names an identifier (setup, doctor) does not need the contract file.
export function contractRules() {
  contract ??= JSON.parse(fs.readFileSync(RULES_URL, 'utf8'));
  return contract;
}

/** The `identifiers` entry named `id`; throws when the contract has none. */
export function identifierRule(id) {
  const found = contractRules().identifiers?.find((r) => r.id === id);
  if (!found) throw new Error(`convention.rules.v1.json has no "${id}" identifier rule`);
  return found;
}

/**
 * @param {string} id the identifier rule id
 * @param {unknown} value
 * @returns {null | 'invalid-identifier' | 'reserved-identifier'} the stable code, or null when `value` follows the rule
 */
export function identifierProblem(id, value) {
  if (typeof value !== 'string' || value === '') return 'invalid-identifier';
  const rule = identifierRule(id);
  const chars = [...value];
  if (!rule.first.includes(chars[0]) || chars.length > rule.maxLength || !chars.slice(1).every((c) => rule.rest.includes(c))) {
    return 'invalid-identifier';
  }
  return (rule.reserved ?? []).includes(value) ? 'reserved-identifier' : null;
}
