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
      role: 'researcher',
      synthesizeRole: 'synthesizer',
    }),
  }),
  'research-fan-out-gated': Object.freeze({
    pattern: 'panel',
    params: Object.freeze({
      members: 3,
      role: 'researcher',
      synthesizeRole: 'synthesizer',
      gated: true,
    }),
  }),
  'rfc': Object.freeze({
    pattern: 'reviewed',
    params: Object.freeze({
      maxRounds: 1,
      minCheckers: Object.freeze(['reviewer', 'red-team']),
      // The thing under review is a supplied document or decision, not a commit, so the default
      // checker text that points at `git log -1` would send the checkers to the wrong place.
      roleTasks: Object.freeze({
        reviewer: [
          'You are the reviewer of a proposal or document another agent just produced. Do not change any file.',
          'Read the artifact the task names (a path or text in the task itself) and the producer\'s own account of it, listed under Context refs. Do not look at git history unless the task names a commit.',
          'Check it against the task below and report what is wrong, unsupported, or missing, with quoted evidence, or say plainly that you found nothing.',
          '',
          'The task that was assigned:',
          '{objective}',
        ].join('\n'),
        'red-team': [
          'You are the red-team for a proposal or document another agent just produced. Do not change any file.',
          'Read the artifact the task names (a path or text in the task itself) and the producer\'s own account of it, listed under Context refs. Do not look at git history unless the task names a commit.',
          'Try to break it: wrong claims, hidden assumptions, missed cases, failure modes, and anything the task forbade. Report concrete failures with quoted evidence, or say plainly that you found none.',
          '',
          'The task that was assigned:',
          '{objective}',
        ].join('\n'),
      }),
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
