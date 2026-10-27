/**
 * Collaboration patterns index.
 * Dispatches units to collaboration pattern loops: solo, reviewed, panel, debate.
 */

import { runSolo, PARAMS as SOLO_PARAMS } from './solo.mjs';
import { runReviewed, PARAMS as REVIEWED_PARAMS } from './reviewed.mjs';
import { runPanel, PARAMS as PANEL_PARAMS } from './panel.mjs';
import { runDebate, PARAMS as DEBATE_PARAMS } from './debate.mjs';
import { resolvePattern, PRESETS } from '../patterns/presets.mjs';

export { runSolo } from './solo.mjs';
export { runReviewed } from './reviewed.mjs';
export { runPanel } from './panel.mjs';
export { runDebate } from './debate.mjs';
export { resolvePattern, PRESETS } from '../patterns/presets.mjs';
export { DEFAULT_MAX_ROUNDS } from './reviewed.mjs';
export { DEFAULT_REBUTTAL } from './debate.mjs';

const PARAM_TABLES = Object.freeze(Object.assign(Object.create(null), {
  solo: SOLO_PARAMS,
  reviewed: REVIEWED_PARAMS,
  panel: PANEL_PARAMS,
  debate: DEBATE_PARAMS,
}));

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
 * Run a collaboration pattern for a unit.
 *
 * @param {string|object} nameOrPreset - Pattern name ('solo', 'reviewed', 'panel', 'debate') or preset name/object.
 * @param {object} unit - The unit data contract.
 * @param {object} cfg - Runner configuration snapshot.
 * @param {object} hooks - Injected execution hooks { runRole, verify, history }.
 * @returns {Promise<{ outcome: string, rounds?: number, results: Array<object>, findings?: Array<string> }>}
 */
export async function runPattern(nameOrPreset, unit, cfg, hooks = {}) {
  const patternInput = nameOrPreset || unit?.pattern || 'solo';
  const { patternName, params } = resolvePattern(patternInput);

  switch (patternName) {
    case 'solo':
      return await runSolo(unit, cfg, hooks, params);
    case 'reviewed':
      return await runReviewed(unit, cfg, hooks, params);
    case 'panel':
      return await runPanel(unit, cfg, hooks, params);
    case 'debate':
      return await runDebate(unit, cfg, hooks, params);
    default:
      throw new Error(`Unknown collaboration pattern: "${patternName}"`);
  }
}
