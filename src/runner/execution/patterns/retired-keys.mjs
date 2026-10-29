// Pure leaf module in the domain layer for retired runner config keys.
// Keys that moved or were retired are tracked here in one authoritative place.

export const RETIRED_GATED_NAME = 'research-fan-out-gated';
export const RESERVED_PATTERN_NAMES = Object.freeze(new Set(['seatBinding', 'defaultRule']));
export const SEAT_BINDING_MARKER_PATH = 'runner.patterns.seatBinding.schema';


/**
 * Table of retired configuration keys and their replacements.
 */
export const RETIRED_CONFIG_KEYS = Object.freeze({
  'runner.patterns.defaultRule': Object.freeze({
    replacement: null,
    instruction: 'delete the key',
  }),
  'runner.patterns.reviewed.maxRounds': Object.freeze({
    replacement: 'runner.loops.reviewed.maxRounds',
    instruction: 'use runner.loops.reviewed.maxRounds instead',
  }),
  'runner.patterns.reviewed.checkersByRigor': Object.freeze({
    replacement: 'runner.loops.reviewed.checkersByRigor',
    instruction: 'use runner.loops.reviewed.checkersByRigor instead',
  }),
  [`runner.patterns.${RETIRED_GATED_NAME}`]: Object.freeze({
    replacement: 'runner.patterns.research-fan-out',
    instruction: 'use runner.patterns.research-fan-out instead',
  }),
});

/**
 * Shared leaf formatter for the retired-key sentence.
 *
 * @param {string | { key: string, instruction?: string }} item
 * @param {string} [instructionOverride]
 * @returns {string}
 */
export function formatRetiredKeySentence(item, instructionOverride) {
  if (!item) return '';
  const key = typeof item === 'string' ? item : item.key;
  const instruction = instructionOverride
    ?? (typeof item === 'object' && item.instruction ? item.instruction : null)
    ?? RETIRED_CONFIG_KEYS[key]?.instruction
    ?? 'delete the key';
  return `${key} was retired; ${instruction}`;
}

function matchDottedPath(path) {
  if (typeof path !== 'string') return [];
  for (const [retiredKey, meta] of Object.entries(RETIRED_CONFIG_KEYS)) {
    if (path === retiredKey || path.startsWith(`${retiredKey}.`)) {
      return [{
        key: retiredKey,
        replacement: meta.replacement,
        instruction: meta.instruction,
      }];
    }
  }
  return [];
}

/**
 * Inspects `input` (dotted paths or explicit pattern map object) for retired keys.
 * Returns structured findings `{ key, replacement, instruction }` describing each violation.
 *
 * @param {string | object} input
 * @returns {Array<{ key: string, replacement: string | null, instruction: string }>}
 */
export function detectRetiredPatternKeys(input) {
  if (!input) return [];

  if (typeof input === 'string') {
    return matchDottedPath(input);
  }

  if (typeof input !== 'object' || Array.isArray(input)) return [];

  const findings = [];
  const seen = new Set();

  const add = (k) => {
    if (!seen.has(k) && Object.hasOwn(RETIRED_CONFIG_KEYS, k)) {
      seen.add(k);
      findings.push({
        key: k,
        replacement: RETIRED_CONFIG_KEYS[k].replacement,
        instruction: RETIRED_CONFIG_KEYS[k].instruction,
      });
    }
  };

  for (const retiredKey of Object.keys(RETIRED_CONFIG_KEYS)) {
    if (!retiredKey.startsWith('runner.patterns.')) continue;
    const subpath = retiredKey.slice('runner.patterns.'.length);
    const segments = subpath.split('.');
    let curr = input;
    let matched = true;
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      if (curr !== null && typeof curr === 'object' && !Array.isArray(curr) && Object.hasOwn(curr, seg)) {
        if (i === segments.length - 1) {
          break;
        }
        curr = curr[seg];
      } else {
        matched = false;
        break;
      }
    }
    if (matched) {
      add(retiredKey);
    }
  }

  return findings;
}
