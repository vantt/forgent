// Pure leaf module in the domain layer for retired runner config keys.
// Keys that moved or were retired are tracked here in one authoritative place.

export const RETIRED_GATED_NAME = 'research-fan-out-gated';
export const RESERVED_PATTERN_NAMES = Object.freeze(new Set(['seatBinding', 'defaultRule']));
export const SEAT_BINDING_MARKER_PATH = 'runner.patterns.seatBinding.schema';
export const MARKER_PATH = SEAT_BINDING_MARKER_PATH;


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
 * Inspects `input` (dotted paths, findings, or explicit pattern map object) for retired keys.
 * Returns structured findings `{ key, replacement, instruction }` describing each violation.
 *
 * @param {string | Array<string | { path?: string }> | object} input
 * @returns {Array<{ key: string, replacement: string | null, instruction: string }>}
 */
export function detectRetiredPatternKeys(input) {
  if (!input) return [];

  if (typeof input === 'string') {
    return matchDottedPath(input);
  }

  if (Array.isArray(input)) {
    const findings = [];
    const seen = new Set();
    for (const item of input) {
      const p = typeof item === 'string' ? item : item?.path;
      if (typeof p === 'string') {
        for (const f of matchDottedPath(p)) {
          if (!seen.has(f.key)) {
            seen.add(f.key);
            findings.push(f);
          }
        }
      }
    }
    return findings;
  }

  if (typeof input !== 'object') return [];

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

  // Check top-level retired keys on patterns-map
  if (Object.hasOwn(input, 'defaultRule')) {
    add('runner.patterns.defaultRule');
  }

  if (Object.hasOwn(input, RETIRED_GATED_NAME)) {
    add(`runner.patterns.${RETIRED_GATED_NAME}`);
  }

  if (Object.hasOwn(input, 'reviewed')) {
    const rev = input.reviewed;
    if (rev && typeof rev === 'object' && !Array.isArray(rev)) {
      if (Object.hasOwn(rev, 'maxRounds')) {
        add('runner.patterns.reviewed.maxRounds');
      }
      if (Object.hasOwn(rev, 'checkersByRigor')) {
        add('runner.patterns.reviewed.checkersByRigor');
      }
    }
  }

  // Also support objects directly keyed by full path
  for (const k of Object.keys(RETIRED_CONFIG_KEYS)) {
    if (Object.hasOwn(input, k)) {
      add(k);
    }
  }

  return findings;
}
