// src/convention/seat-id.mjs — the seat id rule, read from the Convention contract.
// A seat id becomes a directory name and a ref segment of a unit run, so Convention owns what it may be
// (packages/convention/contracts/convention.rules.v1.json, `identifiers` entry `seat-id`); the Rust crate
// reads the same entry and both run the same golden vectors. Leaf module: imports nothing from the runner.

import fs from 'node:fs';

const RULES_URL = new URL('../../packages/convention/contracts/convention.rules.v1.json', import.meta.url);

let loaded = null;

// Read on first use, so a process that never names a seat (setup, doctor) does not need the contract file.
function rule() {
  if (loaded) return loaded;
  const found = JSON.parse(fs.readFileSync(RULES_URL, 'utf8')).identifiers?.find((r) => r.id === 'seat-id');
  if (!found) throw new Error('convention.rules.v1.json has no "seat-id" identifier rule');
  loaded = Object.freeze({ ...found, reserved: Object.freeze([...found.reserved]) });
  return loaded;
}

/** Names no declared seat may take: the run layout's own directories and the runner's synthetic seats. */
export const reservedSeatIds = () => rule().reserved;

/**
 * @param {unknown} value
 * @returns {null | 'invalid-identifier' | 'reserved-identifier'} the stable code, or null when `value` is a valid seat id
 */
export function seatIdProblem(value) {
  if (typeof value !== 'string' || value === '') return 'invalid-identifier';
  const RULE = rule();
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
  const RULE = rule();
  if (problem === 'reserved-identifier') throw new TypeError(`${label} "${value}" is reserved (${RULE.reserved.join(', ')})`);
  if (problem) {
    throw new TypeError(`${label} ${JSON.stringify(value)} must be 1-${RULE.maxLength} characters: a lowercase letter, then lowercase letters, digits or "-"`);
  }
  return value;
}
