/**
 * Collaboration pattern presets and resolution helper.
 * Single source of truth for named pattern presets.
 */

export const PRESETS = Object.freeze({
  'code-change': Object.freeze({
    pattern: 'reviewed',
    params: Object.freeze({
      minCheckers: Object.freeze(['reviewer', 'red-team']),
      verify: 'npm test',
    }),
  }),
  'consult': Object.freeze({
    pattern: 'solo',
    params: Object.freeze({
      role: 'advisor',
    }),
  }),
  'research-fan-out': Object.freeze({
    pattern: 'panel',
    params: Object.freeze({
      members: 3,
    }),
  }),
  'rfc': Object.freeze({
    pattern: 'reviewed',
    params: Object.freeze({
      maxRounds: 1,
      minCheckers: Object.freeze(['red-team']),
    }),
  }),
});

/**
 * Resolve a pattern name or preset object into canonical { patternName, params }.
 *
 * @param {string|object} nameOrPreset
 * @returns {{ patternName: string, params: object }}
 */
export function resolvePattern(nameOrPreset) {
  if (!nameOrPreset) {
    return { patternName: 'solo', params: {} };
  }

  if (typeof nameOrPreset === 'string') {
    if (Object.prototype.hasOwnProperty.call(PRESETS, nameOrPreset)) {
      const preset = PRESETS[nameOrPreset];
      return {
        patternName: preset.pattern,
        params: { ...preset.params },
      };
    }
    return {
      patternName: nameOrPreset,
      params: {},
    };
  }

  if (typeof nameOrPreset === 'object') {
    const rawPattern = nameOrPreset.pattern || nameOrPreset.patternName;
    if (rawPattern && Object.prototype.hasOwnProperty.call(PRESETS, rawPattern)) {
      const preset = PRESETS[rawPattern];
      return {
        patternName: preset.pattern,
        params: { ...preset.params, ...(nameOrPreset.params || {}) },
      };
    }

    if (rawPattern) {
      return {
        patternName: rawPattern,
        params: { ...(nameOrPreset.params || {}) },
      };
    }
  }

  return { patternName: 'solo', params: {} };
}
