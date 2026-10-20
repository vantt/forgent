// Defaults deep-merged under a file's own config: the executor command is read from the merged object.
const DEFAULTS = { runner: { executors: { vcs: { command: 'git', args: ['commit'] } }, tiers: ['a'] } };
function mergeInto(existing, defaults) {
  const result = { ...existing };
  for (const key of Object.keys(defaults)) {
    if (!(key in existing)) { result[key] = defaults[key]; continue; }
    if (typeof existing[key] === 'object') result[key] = mergeInto(existing[key], defaults[key]);
  }
  return result;
}
export function loadConfig(text) {
  return mergeInto(JSON.parse(text), DEFAULTS).runner;
}
