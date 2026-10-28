// Pure leaf module in the domain layer for retired runner config keys.
// Keys that moved or were retired are tracked here in one authoritative place.

const RETIRED_GATED_NAME = 'research-fan-out-gated';

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
export function detectRetiredPatternKeys(input) {
  if (!input) return [];

  if (typeof input === 'string') {
    if (input === 'runner.patterns.defaultRule' || input.startsWith('runner.patterns.defaultRule.')) {
      const meta = RETIRED_CONFIG_KEYS['runner.patterns.defaultRule'];
      return [{
        code: 'config-key-retired',
        classification: 'defaultRule',
        kind: 'defaultRule',
        name: 'defaultRule',
        key: 'runner.patterns.defaultRule',
        replacement: meta.replacement,
        instruction: meta.instruction,
        baseMessage: `runner.patterns.defaultRule was retired; ${meta.instruction}`,
      }];
    }
    if (input === `runner.patterns.${RETIRED_GATED_NAME}` || input.startsWith(`runner.patterns.${RETIRED_GATED_NAME}.`)) {
      const key = `runner.patterns.${RETIRED_GATED_NAME}`;
      const meta = RETIRED_CONFIG_KEYS[key];
      return [{
        code: 'config-key-retired',
        classification: 'gated',
        kind: 'gated',
        name: RETIRED_GATED_NAME,
        key,
        replacement: meta.replacement,
        instruction: meta.instruction,
        baseMessage: `${key} was retired; ${meta.instruction}`,
      }];
    }
    if (input === 'runner.patterns.reviewed.maxRounds' || input.startsWith('runner.patterns.reviewed.maxRounds.')) {
      const key = 'runner.patterns.reviewed.maxRounds';
      const meta = RETIRED_CONFIG_KEYS[key];
      return [{
        code: 'config-key-retired',
        classification: 'tuning',
        kind: 'tuning-only',
        name: 'reviewed',
        key,
        replacement: meta.replacement,
        instruction: meta.instruction,
        baseMessage: `${key} was retired; ${meta.instruction}`,
        hasMaxRounds: true,
        hasCheckersByRigor: false,
      }];
    }
    if (input === 'runner.patterns.reviewed.checkersByRigor' || input.startsWith('runner.patterns.reviewed.checkersByRigor.')) {
      const key = 'runner.patterns.reviewed.checkersByRigor';
      const meta = RETIRED_CONFIG_KEYS[key];
      return [{
        code: 'config-key-retired',
        classification: 'tuning',
        kind: 'tuning-only',
        name: 'reviewed',
        key,
        replacement: meta.replacement,
        instruction: meta.instruction,
        baseMessage: `${key} was retired; ${meta.instruction}`,
        hasMaxRounds: false,
        hasCheckersByRigor: true,
      }];
    }
    if (Object.hasOwn(RETIRED_CONFIG_KEYS, input)) {
      const meta = RETIRED_CONFIG_KEYS[input];
      return [{
        code: 'config-key-retired',
        classification: 'tuning',
        kind: 'tuning-only',
        name: input.split('.').pop(),
        key: input,
        replacement: meta.replacement,
        instruction: meta.instruction,
        baseMessage: `${input} was retired; ${meta.instruction}`,
      }];
    }
    return [];
  }

  if (Array.isArray(input)) {
    return input.flatMap((item) => {
      if (typeof item === 'string') return detectRetiredPatternKeys(item);
      if (item && typeof item === 'object' && item.path) return detectRetiredPatternKeys(item.path);
      return [];
    });
  }

  const patternsRaw = input.patterns ?? input.runner?.patterns ?? input;
  if (!patternsRaw || typeof patternsRaw !== 'object' || Array.isArray(patternsRaw)) return [];
  const findings = [];

  if (Object.hasOwn(patternsRaw, 'defaultRule')) {
    const meta = RETIRED_CONFIG_KEYS['runner.patterns.defaultRule'];
    findings.push({
      code: 'config-key-retired',
      classification: 'defaultRule',
      kind: 'defaultRule',
      name: 'defaultRule',
      key: 'runner.patterns.defaultRule',
      replacement: meta.replacement,
      instruction: meta.instruction,
      baseMessage: `runner.patterns.defaultRule was retired; ${meta.instruction}`,
    });
  }

  if (Object.hasOwn(patternsRaw, RETIRED_GATED_NAME)) {
    const key = `runner.patterns.${RETIRED_GATED_NAME}`;
    const meta = RETIRED_CONFIG_KEYS[key];
    findings.push({
      code: 'config-key-retired',
      classification: 'gated',
      kind: 'gated',
      name: RETIRED_GATED_NAME,
      key,
      replacement: meta.replacement,
      instruction: meta.instruction,
      baseMessage: `${key} was retired; ${meta.instruction}`,
    });
  }

  if (Object.hasOwn(patternsRaw, 'reviewed')) {
    const entry = patternsRaw.reviewed;
    if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
      const hasMaxRounds = Object.hasOwn(entry, 'maxRounds');
      const hasCheckersByRigor = Object.hasOwn(entry, 'checkersByRigor');
      const hasTuning = hasMaxRounds || hasCheckersByRigor;
      const hasCatalog = Object.hasOwn(entry, 'loop')
        || Object.hasOwn(entry, 'defaults')
        || Object.hasOwn(entry, 'promise')
        || Object.hasOwn(entry, 'invariants');

      if (hasTuning && hasCatalog) {
        findings.push({
          code: 'config-error',
          classification: 'mixed',
          kind: 'both-shapes',
          name: 'reviewed',
          key: 'runner.patterns.reviewed',
          replacement: null,
          instruction: 'move tuning to runner.loops.reviewed',
          baseMessage: 'pattern "reviewed" cannot combine pattern catalog fields with retired loop tuning; move tuning to runner.loops.reviewed',
          hasMaxRounds,
          hasCheckersByRigor,
        });
      } else if (hasTuning) {
        if (hasMaxRounds) {
          const meta = RETIRED_CONFIG_KEYS['runner.patterns.reviewed.maxRounds'];
          findings.push({
            code: 'config-key-retired',
            classification: 'tuning',
            kind: 'tuning-only',
            name: 'reviewed',
            key: 'runner.patterns.reviewed.maxRounds',
            replacement: meta.replacement,
            instruction: meta.instruction,
            baseMessage: `runner.patterns.reviewed.maxRounds was retired; ${meta.instruction}`,
            hasMaxRounds: true,
            hasCheckersByRigor: false,
          });
        }
        if (hasCheckersByRigor) {
          const meta = RETIRED_CONFIG_KEYS['runner.patterns.reviewed.checkersByRigor'];
          findings.push({
            code: 'config-key-retired',
            classification: 'tuning',
            kind: 'tuning-only',
            name: 'reviewed',
            key: 'runner.patterns.reviewed.checkersByRigor',
            replacement: meta.replacement,
            instruction: meta.instruction,
            baseMessage: `runner.patterns.reviewed.checkersByRigor was retired; ${meta.instruction}`,
            hasMaxRounds: false,
            hasCheckersByRigor: true,
          });
        }
      }
    }
  }

  return findings;
}
