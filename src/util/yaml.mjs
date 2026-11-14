// The one door for reading YAML. Every YAML parse in fgOS goes through parseYaml; nothing else may
// import a parser (test/architecture.test.mjs enforces it). The parser is the Rust `fgos-yaml-doc` crate
// behind the native addon's `yaml` namespace, with the `tool` profile; there is no JavaScript fallback, so a
// process that cannot load the addon fails every read with the door's own named error.
import { fromDoorJson, nativeDoor } from '../native/door.mjs';

/** A refusal of the parser: the rule, the file and the 1-based position, never a value of the input. */
export class YamlParseError extends Error {
  constructor({ id, file, line, column }) {
    const where = Number.isInteger(line) && Number.isInteger(column) ? ` (line ${line}, column ${column})` : '';
    super(`${file}: ${id}${where}`);
    Object.assign(this, { name: 'YamlParseError', code: id, rule: id, file, line, column });
  }
}

/**
 * Parses one YAML document with the `tool` profile.
 *
 * - Empty, whitespace-only or comment-only input (and a bare `---` or `~`) returns `null`.
 * - A refusal throws a YamlParseError: more than one document, a duplicate key, an unknown tag, a
 *   `<<` merge key, aliases past the alias limit or expanding past the value budget, a syntax error.
 * - Objects have the ordinary prototype and own keys, `__proto__` included.
 * - `.nan`, `.inf` and `-.inf` are NaN, Infinity and -Infinity.
 *
 * @param {string} text
 * @param {{ filename?: string }} [options] named in parse errors
 * @returns {unknown}
 */
export function parseYaml(text, { filename } = {}) {
  const file = filename ?? 'YAML input';
  let parts;
  try {
    parts = nativeDoor().yaml.parse(text, file);
  } catch (err) {
    let refusal;
    try { refusal = JSON.parse(err.message); } catch { /* not a refusal of the parser */ }
    throw typeof refusal?.id === 'string' ? new YamlParseError({ file, ...refusal }) : err;
  }
  return fromDoorJson(parts.json, { special: parts.special });
}

/**
 * One-line reason for a failed parse: `<rule> (line L, column C)`, 1-based like an editor shows it.
 *
 * @param {unknown} error
 * @returns {string}
 */
export function describeYamlError(error) {
  if (!(error instanceof YamlParseError)) return String(error?.message ?? error).split('\n')[0];
  const where = Number.isInteger(error.line) && Number.isInteger(error.column) ? ` (line ${error.line}, column ${error.column})` : '';
  return `${error.rule.replaceAll('-', ' ')}${where}`;
}

const FRONTMATTER_BLOCK = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/;

/**
 * Cuts the leading `---` fenced block off a document without parsing it: for a caller that only copies or skips
 * the block's bytes and must not fail on a block that is not valid YAML.
 *
 * @param {string} text
 * @returns {{ block: string, source: string, body: string }} `block` is the fenced text as written, fences
 *   included; `source` is the text between the fences; `body` follows the block. No block gives empty `block`
 *   and `source`, and the whole text as `body`.
 */
export function cutFrontmatter(text) {
  const match = typeof text === 'string' ? FRONTMATTER_BLOCK.exec(text) : null;
  if (!match) return { block: '', source: '', body: text };
  return { block: match[0], source: match[1], body: text.slice(match[0].length) };
}

/**
 * Cuts the leading `---` fenced block off a document and parses it with the YAML door: the one place that decides
 * what a frontmatter block is.
 *
 * - No block (or no closing fence) returns `{ meta: {}, body: text, block: '' }`; an empty block returns an empty meta.
 * - `block` is the fenced source as written, both fences included; `body` is the text after it.
 * - A block the parser refuses, or one that is not a mapping, throws a YamlParseError naming `file`.
 *
 * @param {string} text
 * @param {string} [file] named in refusals
 * @returns {{ meta: Record<string, unknown>, body: string, block: string }}
 */
export function readFrontmatter(text, file) {
  const { block, source, body } = cutFrontmatter(text);
  if (!block) return { meta: {}, body, block };
  const parsed = parseYaml(source, { filename: file });
  if (parsed === null) return { meta: {}, body, block };
  if (typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new YamlParseError({ id: 'frontmatter-not-a-mapping', file: file ?? 'YAML input', line: 2, column: 1 });
  }
  return { meta: parsed, body, block };
}
