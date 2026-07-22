// frontmatter.mjs — pure OKF-style flat YAML frontmatter parser/writer
// (str64-backfill, CONTEXT.md D3). Mirrors entropy.mjs / enduser-index.mjs's
// own purity discipline exactly: ZERO imports, no fs, no Date.now(), no side
// effects of any kind — it only transforms a doc's already-read string
// content and returns plain data. All I/O (reading a doc file off disk,
// deciding WHEN to write frontmatter back) is the entry/caller layer's job,
// never this module's.
//
// Deliberately hand-rolled, not a general YAML parser: fgOS has zero
// dependencies today (package.json), and this feature's frontmatter schema
// is flat by design (scalars + one string-array form, no nesting, no
// multiline values) — see plan.md's Discovery for the explicit
// no-dependency decision. A doc with no leading `---` block is a fully
// valid, common case (most existing Diataxis docs have none yet) — it is
// never an error, just an empty meta.

const DELIMITER = '---';

function unquote(raw) {
  if (raw.length >= 2) {
    const first = raw[0];
    const last = raw[raw.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return raw.slice(1, -1);
    }
  }
  return raw;
}

function parseScalarOrArray(raw) {
  const trimmed = raw.trim();
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    const inner = trimmed.slice(1, -1).trim();
    if (inner === '') return [];
    return inner.split(',').map((item) => unquote(item.trim()));
  }
  return unquote(trimmed);
}

function renderScalarOrArray(value) {
  if (Array.isArray(value)) {
    return `[${value.join(', ')}]`;
  }
  return String(value ?? '');
}

/**
 * Parse a doc's raw string content into `{ meta, body }`. A leading `---`
 * line through the next `---` line is treated as the frontmatter block:
 * each non-blank line inside it is a `key: value` pair, where `value` is
 * either a scalar or a `[a, b, c]` string-array form (quotes around an
 * individual scalar/array item are stripped). A doc with no such leading
 * block returns `{ meta: {}, body: content }` unchanged — this never
 * throws, regardless of input shape (a malformed or absent frontmatter
 * block degrades to "no frontmatter", never a crash).
 */
export function parseFrontmatter(content) {
  if (typeof content !== 'string' || !content.startsWith(`${DELIMITER}\n`)) {
    return { meta: {}, body: content };
  }

  const closeMarker = `\n${DELIMITER}\n`;
  const closeIndex = content.indexOf(closeMarker, DELIMITER.length + 1);
  if (closeIndex === -1) {
    return { meta: {}, body: content };
  }

  const block = content.slice(DELIMITER.length + 1, closeIndex);
  const body = content.slice(closeIndex + closeMarker.length);

  const meta = {};
  for (const line of block.split('\n')) {
    if (!line.trim()) continue;
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;
    const key = line.slice(0, colonIndex).trim();
    if (!key) continue;
    meta[key] = parseScalarOrArray(line.slice(colonIndex + 1));
  }

  return { meta, body };
}

/**
 * Render `meta` (a plain object, e.g. `{ type, title, tags, timestamp,
 * source_capture_ids }`) and `body` (the doc content after the frontmatter
 * block) back into one frontmatter-prefixed string — the inverse of
 * `parseFrontmatter`. Key order follows `Object.entries(meta)`'s own
 * insertion order, so a caller that hand-builds `meta` in a fixed field
 * order gets that same order back out. An empty/absent `meta` still
 * produces a valid (empty) frontmatter block, never a special case.
 */
export function renderFrontmatter(meta, body) {
  const lines = Object.entries(meta ?? {}).map(
    ([key, value]) => `${key}: ${renderScalarOrArray(value)}`,
  );
  const block = lines.length > 0 ? `${lines.join('\n')}\n` : '';
  return `${DELIMITER}\n${block}${DELIMITER}\n${body ?? ''}`;
}
