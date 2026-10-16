// The one door for reading YAML. Every YAML parse in fgOS goes through parseYaml; nothing else may
// import the parser (test/architecture.test.mjs enforces it). The parser is the vendored js-yaml
// bundle in ./third-party/, so it is present in a checkout, a worktree and an installed release alike.
import { loadAll } from './third-party/js-yaml.mjs';

// Two bounds against an alias bomb. MAX_ALIASES caps how many alias tokens a document may hold; it counts
// occurrences, not what they expand to, so a document well under it can still nest aliases exponentially
// (9 levels of 9 aliases each is 81 aliases and 9^9 values). MAX_EXPANDED_NODES therefore caps the size
// the finished tree has when every shared reference is counted at each place it is used.
const MAX_ALIASES = 100;
const MAX_EXPANDED_NODES = 100_000;

// Counts every value reachable from `root`, a shared reference once per place it is reached, and throws
// past the budget. Each traversal step costs one, so a self-referencing tree ends at the budget too.
function assertExpandedSize(root, filename) {
  let visited = 0;
  const stack = [root];
  while (stack.length > 0) {
    const value = stack.pop();
    if (++visited > MAX_EXPANDED_NODES) {
      throw new Error(`${filename ?? 'YAML input'}: aliases expand to more than ${MAX_EXPANDED_NODES} values`);
    }
    if (value === null || typeof value !== 'object') continue;
    if (Array.isArray(value)) for (const item of value) stack.push(item);
    else for (const key of Object.keys(value)) stack.push(value[key]);
  }
}

/**
 * Parses one YAML document.
 *
 * - Empty, whitespace-only or comment-only input (and a bare `---` or `~`) returns `null`.
 * - More than one document throws.
 * - A document whose aliases expand past MAX_EXPANDED_NODES values throws, a self-referencing one included
 *   (its expansion has no end).
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
  assertExpandedSize(docs[0], filename);
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
