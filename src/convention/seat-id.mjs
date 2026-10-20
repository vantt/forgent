// src/convention/seat-id.mjs — the seat id rule, read from the Convention contract.
// A seat id becomes a directory name and a ref segment of a unit run, so Convention owns what it may be
// (packages/convention/contracts/convention.rules.v1.json, `identifiers` entry `seat-id`); the Rust crate
// reads the same entry and both run the same golden vectors. Leaf module: imports nothing from the runner.

import fs from 'node:fs';

const RULES_URL = new URL('../../packages/convention/contracts/convention.rules.v1.json', import.meta.url);

const RULE = (() => {
  const rule = JSON.parse(fs.readFileSync(RULES_URL, 'utf8')).identifiers?.find((r) => r.id === 'seat-id');
  if (!rule) throw new Error('convention.rules.v1.json has no "seat-id" identifier rule');
  return Object.freeze({ ...rule, reserved: Object.freeze([...rule.reserved]) });
})();

/** Names no declared seat may take: the run layout's own directories and the runner's synthetic seats. */
export const RESERVED_SEAT_IDS = RULE.reserved;

/**
 * @param {unknown} value
 * @returns {null | 'invalid-identifier' | 'reserved-identifier'} the stable code, or null when `value` is a valid seat id
 */
export function seatIdProblem(value) {
  if (typeof value !== 'string' || value === '') return 'invalid-identifier';
  const chars = [...value];
  if (!RULE.first.includes(chars[0]) || chars.length > RULE.maxLength || !chars.slice(1).every((c) => RULE.rest.includes(c))) {
    return 'invalid-identifier';
  }
  return RULE.reserved.includes(value) ? 'reserved-identifier' : null;
}

export function isSeatId(value) {
  return seatIdProblem(value) === null;
}

/** Throws a TypeError naming the rule when `value` is not a seat id. `label` says whose id it is. */
export function assertSeatId(value, label = 'seat id') {
  const problem = seatIdProblem(value);
  if (problem === 'reserved-identifier') throw new TypeError(`${label} "${value}" is reserved (${RULE.reserved.join(', ')})`);
  if (problem) {
    throw new TypeError(`${label} ${JSON.stringify(value)} must be 1-${RULE.maxLength} characters: a lowercase letter, then lowercase letters, digits or "-"`);
  }
  return value;
}
