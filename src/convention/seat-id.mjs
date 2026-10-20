// src/convention/seat-id.mjs — the seat id rule and the definition file names, read from the Convention contract.
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

// ── File names of workflow and persona definitions ────────────────────────────────────────────────
// Convention owns `wf.<name>.yaml` (a packaged workflow) and `agent.<name>.yaml` (a persona beside it) and the
// name rules behind them (`definitionFiles` and the `workflow-name` / `agent-name` identifiers of the same
// contract); the Rust crate reads the same entries and both run the same golden vectors. They sit in this leaf
// module because it already reads the contract; a module of their own needs an architecture manifest row.

let contract = null;

function contractRules() {
  contract ??= JSON.parse(fs.readFileSync(RULES_URL, 'utf8'));
  return contract;
}

function definitionNameOk(identifierId, name) {
  const identifier = contractRules().identifiers?.find((r) => r.id === identifierId);
  if (!identifier) throw new Error(`convention.rules.v1.json has no "${identifierId}" identifier rule`);
  const chars = [...name];
  return chars.length > 0 && chars.length <= identifier.maxLength && identifier.first.includes(chars[0])
    && chars.slice(1).every((c) => identifier.rest.includes(c)) && !(identifier.reserved ?? []).includes(name);
}

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
  return definitionNameOk(rule.nameIdentifier, name) ? name : null;
}

/** The file name a definition of `name` has under the rule; throws when `name` is not a valid name for it. */
export function definitionFileName(ruleId, name) {
  const rule = definitionFileRule(ruleId);
  if (typeof name !== 'string' || !definitionNameOk(rule.nameIdentifier, name)) throw new TypeError(`${JSON.stringify(name)} is not a valid ${rule.nameIdentifier}`);
  return `${rule.prefix}${name}${rule.suffix}`;
}
