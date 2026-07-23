// config-merge.mjs — general-purpose deep-merge-fill-missing-only utility
// (per str87-fgos-setup-doctor D3): patches keys present in a default config
// but absent from a user's existing config, without ever touching a value
// the user already has. Designed for reuse by any config shape (not
// hardcoded to `.fgos-runner.json`'s own fields) — today's one caller is
// `runner/dispatch.mjs`'s `ensureRunnerConfig`, a future caller may be a
// user-level config file.
//
// PURE: no fs import, no I/O of any kind — callers own reading/writing.
//
// ARRAYS ARE LEAVES: an array value already present in `existingConfig` is
// kept exactly as-is, never recursed into or merged element-by-element,
// regardless of length/contents versus `defaultConfig`'s array at the same
// key. Only a key missing from `existingConfig` entirely gets `defaultConfig`'s
// array copied in wholesale.

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function mergeInto(existing, defaults, prefix, addedKeys) {
  const result = { ...existing };
  for (const key of Object.keys(defaults)) {
    const keyPath = prefix ? `${prefix}.${key}` : key;
    if (!(key in existing)) {
      result[key] = defaults[key];
      addedKeys.push(keyPath);
      continue;
    }
    const existingValue = existing[key];
    const defaultValue = defaults[key];
    if (isPlainObject(existingValue) && isPlainObject(defaultValue)) {
      result[key] = mergeInto(existingValue, defaultValue, keyPath, addedKeys);
    }
    // else: key already present as a non-plain-object (array, primitive, or
    // a type mismatch with defaults) — kept byte-identical, never touched.
  }
  return result;
}

/**
 * Deep-merge-fill-missing-only: recursively fills in any key present in
 * `defaultConfig` but absent from `existingConfig` (including nested plain
 * objects), never overwriting a key/value already present in `existingConfig`
 * at any depth. Returns `{ merged, addedKeys }` — `addedKeys` is a flat list
 * of dotted key paths that were newly added (empty when `existingConfig`
 * already has everything).
 */
export function mergeConfigDefaults(existingConfig, defaultConfig) {
  const addedKeys = [];
  const merged = mergeInto(existingConfig ?? {}, defaultConfig ?? {}, '', addedKeys);
  return { merged, addedKeys };
}
