/**
 * Collaboration patterns index.
 * Dispatches units to collaboration pattern loops: solo, reviewed, panel, debate.
 */

import { runSolo } from './solo.mjs';
import { runReviewed } from './reviewed.mjs';
import { runPanel } from './panel.mjs';
import { runDebate } from './debate.mjs';
import { resolvePattern, PRESETS } from '../patterns/presets.mjs';

export { runSolo } from './solo.mjs';
export { runReviewed } from './reviewed.mjs';
export { runPanel } from './panel.mjs';
export { runDebate } from './debate.mjs';
export { resolvePattern, PRESETS } from '../patterns/presets.mjs';

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
