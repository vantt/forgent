/**
 * Collaboration patterns index.
 * Dispatches units to collaboration pattern loops: solo, reviewed, panel, debate.
 */

import { runSolo, PARAMS as SOLO_PARAMS, VERIFY as SOLO_VERIFY } from './solo.mjs';
import { runReviewed, PARAMS as REVIEWED_PARAMS, VERIFY as REVIEWED_VERIFY } from './reviewed.mjs';
import { runPanel, PARAMS as PANEL_PARAMS, VERIFY as PANEL_VERIFY } from './panel.mjs';
import { runDebate, PARAMS as DEBATE_PARAMS, VERIFY as DEBATE_VERIFY } from './debate.mjs';

export { runSolo } from './solo.mjs';
export { runReviewed } from './reviewed.mjs';
export { runPanel } from './panel.mjs';
export { runDebate } from './debate.mjs';
export { DEFAULT_MAX_ROUNDS } from './reviewed.mjs';
export { DEFAULT_REBUTTAL } from './debate.mjs';

const PARAM_TABLES = Object.freeze(Object.assign(Object.create(null), {
  solo: SOLO_PARAMS,
  reviewed: REVIEWED_PARAMS,
  panel: PANEL_PARAMS,
  debate: DEBATE_PARAMS,
}));
export const VERIFY_CAPABILITY = Object.freeze(Object.assign(Object.create(null), {
  solo: SOLO_VERIFY,
  reviewed: REVIEWED_VERIFY,
  panel: PANEL_VERIFY,
  debate: DEBATE_VERIFY,
}));

/**
 * Returns true if the loop executes verification.
 *
 * @param {string|object} loop - Loop name or effective object.
 * @returns {boolean}
 */
export function loopRunsVerify(loop) {
  const name = typeof loop === 'string' ? loop : (loop?.loop ?? loop?.pattern ?? loop?.patternName);
  if (typeof name !== 'string') return false;
  return Boolean(VERIFY_CAPABILITY[name]);
}

/**
 * Returns the param table for a given loop name, or null if unknown.
 *
 * @param {string|object} loop - Loop name ('solo', 'reviewed', 'panel', 'debate') or object containing loop/pattern.
 * @returns {object|null}
 */
export function paramTableOf(loop) {
  const name = typeof loop === 'string' ? loop : loop?.loop ?? loop?.pattern ?? loop?.patternName;
  if (typeof name !== 'string') return null;
  return PARAM_TABLES[name] ?? null;
}

export const VALID_OUTCOMES = Object.freeze([
  'pass',
  'findings',
  'execution-failure',
  'policy-refusal',
  'provider-limit',
  'blocked',
]);

/**
 * Run a collaboration loop for a unit.
 *
 * @param {string|object} effective - Effective loop name ('solo', 'reviewed', 'panel', 'debate') or effective object with loop and params.
 * @param {object} unit - The unit data contract.
 * @param {object} cfg - Runner configuration snapshot.
 * @param {object} hooks - Injected execution hooks { runRole, verify, history }.
 * @returns {Promise<{ outcome: string, rounds?: number, results: Array<object>, findings?: Array<string> }>}
 */
export async function runLoop(effective, unit, cfg, hooks = {}) {
  const loop = typeof effective === 'string' ? effective : (effective?.loop ?? effective?.pattern ?? effective?.patternName);
  const rawParams = typeof effective === 'object' && effective !== null ? (effective.params ?? {}) : {};
  const params = {
    ...rawParams,
    ...(effective?.seats ? { seats: effective.seats } : {}),
  };

  switch (loop) {
    case 'solo':
      return await runSolo(unit, cfg, hooks, params);
    case 'reviewed':
      return await runReviewed(unit, cfg, hooks, params);
    case 'panel':
      return await runPanel(unit, cfg, hooks, params);
    case 'debate':
      return await runDebate(unit, cfg, hooks, params);
    default:
      throw new Error(`Unknown collaboration loop: "${loop}"`);
  }
}
