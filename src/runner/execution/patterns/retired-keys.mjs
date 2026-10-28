// Pure leaf module in the domain layer for retired runner config keys.
// Keys that moved or were retired are tracked here in one authoritative place.

const RETIRED_GATED_NAME = ['research-fan-out', 'gated'].join('-');

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
 * Inspects `patternsRaw` for retired keys and incompatible shapes.
 * Returns structured findings describing each violation.
 *
 * @param {object} patternsRaw
 * @returns {Array<{
 *   key: string,
 *   kind: 'defaultRule' | 'gated' | 'both-shapes' | 'tuning-only',
 *   replacement: string | null,
 *   instruction: string,
 *   baseMessage: string,
 *   hasMaxRounds?: boolean,
 *   hasCheckersByRigor?: boolean,
 * }>}
 */
export function detectRetiredPatternKeys(patternsRaw) {
  if (!patternsRaw || typeof patternsRaw !== 'object' || Array.isArray(patternsRaw)) return [];

  const findings = [];

  if (Object.hasOwn(patternsRaw, 'defaultRule')) {
    const meta = RETIRED_CONFIG_KEYS['runner.patterns.defaultRule'];
    findings.push({
      key: 'runner.patterns.defaultRule',
      name: 'defaultRule',
      code: 'config-key-retired',
      kind: 'defaultRule',
      replacement: meta?.replacement ?? null,
      instruction: meta?.instruction ?? 'delete the key',
      baseMessage: `runner.patterns.defaultRule was retired; ${meta?.instruction ?? 'delete the key'}`,
    });
  }

  if (Object.hasOwn(patternsRaw, RETIRED_GATED_NAME)) {
    const key = `runner.patterns.${RETIRED_GATED_NAME}`;
    const meta = RETIRED_CONFIG_KEYS[key];
    findings.push({
      key,
      name: RETIRED_GATED_NAME,
      code: 'config-key-retired',
      kind: 'gated',
      replacement: meta?.replacement ?? 'runner.patterns.research-fan-out',
      instruction: meta?.instruction ?? 'use runner.patterns.research-fan-out instead',
      baseMessage: `${key} was retired; ${meta?.instruction ?? 'use runner.patterns.research-fan-out instead'}`,
    });
  }

  for (const [name, entry] of Object.entries(patternsRaw)) {
    if (name === 'defaultRule' || name === RETIRED_GATED_NAME || name === 'seatBinding') continue;
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;

    const hasMaxRounds = Object.hasOwn(entry, 'maxRounds');
    const hasCheckersByRigor = Object.hasOwn(entry, 'checkersByRigor');
    const hasTuning = hasMaxRounds || hasCheckersByRigor;
    const hasCatalog = Object.hasOwn(entry, 'loop')
      || Object.hasOwn(entry, 'defaults')
      || Object.hasOwn(entry, 'promise')
      || Object.hasOwn(entry, 'invariants');

    if (hasTuning && hasCatalog) {
      findings.push({
        key: `runner.patterns.${name}`,
        name,
        code: 'config-error',
        kind: 'both-shapes',
        replacement: null,
        instruction: `move tuning to runner.loops.${name}`,
        baseMessage: `pattern "${name}" cannot combine pattern catalog fields with retired loop tuning; move tuning to runner.loops.${name}`,
      });
    } else if (hasTuning && !hasCatalog) {
      findings.push({
        key: `runner.patterns.${name}`,
        name,
        code: 'config-key-retired',
        kind: 'tuning-only',
        replacement: `runner.loops.${name}`,
        instruction: `use runner.loops.${name} instead`,
        baseMessage: `runner.patterns.${name} was retired; use runner.loops.${name} instead`,
        hasMaxRounds,
        hasCheckersByRigor,
      });
    }
  }

  return findings;
}
