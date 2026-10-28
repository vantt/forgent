// Thin mapper for retired runner config keys.
// Pure module in the dispatch layer: maps retired-key findings into descriptors.
// Throws are handled by callers in config.mjs.
import {
  RETIRED_CONFIG_KEYS,
  detectRetiredPatternKeys,
} from '../execution/patterns/retired-keys.mjs';

export { RETIRED_CONFIG_KEYS };

/**
 * Inspects `runnerRaw` (the parsed runner section or config object) for retired keys.
 * Returns an array of `{ key, file, replacement, instruction, message, code, classification }` descriptors.
 */
export function retiredKeysIn(runnerRaw, file) {
  if (!runnerRaw || typeof runnerRaw !== 'object') return [];
  const patterns = runnerRaw?.runner?.patterns
    ?? (runnerRaw?.patterns && !('loop' in runnerRaw.patterns || 'promise' in runnerRaw.patterns) ? runnerRaw.patterns : runnerRaw);
  const fileName = file ?? '<config>';
  const detected = detectRetiredPatternKeys(patterns);
  return detected.map((item) => ({
    key: item.key,
    file: fileName,
    replacement: item.replacement,
    instruction: item.instruction,
    message: `${fileName}: ${item.baseMessage}.`,
    code: item.code,
    classification: item.classification,
    kind: item.kind,
    name: item.name,
    hasMaxRounds: item.hasMaxRounds,
    hasCheckersByRigor: item.hasCheckersByRigor,
  }));
}
