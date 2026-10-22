// src/convention/seat-id.mjs — the seat id rule, read from the Convention contract.
// A seat id becomes a directory name and a ref segment of a unit run, so Convention owns what it may be
// (packages/convention/contracts/convention.rules.v1.json, `identifiers` entry `seat-id`); the Rust crate
// reads the same entry and both run the same golden vectors. Leaf module: imports nothing from the runner.

import { identifierRule, identifierProblem } from './identifier-rules.mjs';

const RULE_ID = 'seat-id';

/** Names no declared seat may take: the run layout's own directories and the runner's synthetic seats. */
export const reservedSeatIds = () => identifierRule(RULE_ID).reserved;

/**
 * @param {unknown} value
 * @returns {null | 'invalid-identifier' | 'reserved-identifier'} the stable code, or null when `value` is a valid seat id
 */
export function seatIdProblem(value) {
  return identifierProblem(RULE_ID, value);
}

export function isSeatId(value) {
  return seatIdProblem(value) === null;
}

/** Throws a TypeError naming the rule when `value` is not a seat id. `label` says whose id it is. */
export function assertSeatId(value, label = 'seat id') {
  const problem = seatIdProblem(value);
  const rule = identifierRule(RULE_ID);
  if (problem === 'reserved-identifier') throw new TypeError(`${label} "${value}" is reserved (${rule.reserved.join(', ')})`);
  if (problem) {
    throw new TypeError(`${label} ${JSON.stringify(value)} must be 1-${rule.maxLength} characters: a lowercase letter, then lowercase letters, digits or "-"`);
  }
  return value;
}
