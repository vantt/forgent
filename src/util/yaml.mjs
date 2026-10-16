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

/**
 * One-line reason for a failed parse: `<reason> (line L, column C)`, 1-based like an editor shows it.
 * Works for a parser error (it carries a position) and for the single-document error (it has none).
 *
 * @param {unknown} error
 * @returns {string}
 */
export function describeYamlError(error) {
  const reason = String(error?.reason ?? error?.message ?? error).split('\n')[0];
  const mark = error?.mark;
  if (mark && Number.isInteger(mark.line) && Number.isInteger(mark.column)) {
    return `${reason} (line ${mark.line + 1}, column ${mark.column + 1})`;
  }
  return reason;
}
