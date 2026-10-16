// The one door for reading YAML. Every YAML parse in fgOS goes through parseYaml; nothing else may
// import the parser (test/architecture.test.mjs enforces it). The parser is the vendored js-yaml
// bundle in ./third-party/, so it is present in a checkout, a worktree and an installed release alike.
import { loadAll } from './third-party/js-yaml.mjs';

// Alias expansion limit, the same as the former `yaml` package's default.
const MAX_ALIASES = 100;

/**
 * Parses one YAML document.
 *
 * - Empty, whitespace-only or comment-only input (and a bare `---` or `~`) returns `null`.
 * - More than one document throws.
 * - The schema is js-yaml's core schema: no `<<` merge keys, no timestamps, unknown tags throw,
 *   duplicate keys throw. An error carries the line and column of the fault.
 *
 * @param {string} text
 * @param {{ filename?: string }} [options] named in parse errors
 * @returns {unknown}
 */
export function parseYaml(text, { filename } = {}) {
  const docs = loadAll(text, { filename, maxAliases: MAX_ALIASES });
  if (docs.length === 0) return null;
  if (docs.length > 1) {
    throw new Error(`${filename ?? 'YAML input'}: expected a single document, found ${docs.length}`);
  }
  return docs[0];
}
