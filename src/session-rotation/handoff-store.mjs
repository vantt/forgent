// The handoff files a rotating session leaves for its successor, under
// `.fgos/runtime/session-rotation/<persona>-<name>/`: one immutable `<yymmdd-hhmm>-<sid8>.md` per rotation, a
// `latest.json` pointer replaced atomically AFTER the file exists, and only the newest `keep` files retained.
// The text describes state, never actions, and is redacted before it is written.
import fs from 'node:fs';
import path from 'node:path';
import { installOnce, replaceDurably } from '../native/door.mjs';

const FILE_MODE = 0o600;
const NAME_RE = /^[a-z0-9][a-z0-9-]*$/;
const FILE_RE = /^\d{6}-\d{4}-[A-Za-z0-9]{1,8}\.md$/;
export const VERIFY_LINE = 'Verify against the repo before acting: this handoff describes state as it was, not what is true now.';

const REDACTION = '[redacted]';
const SECRET_PATTERNS = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?(?:-----END [A-Z ]*PRIVATE KEY-----|$)/g,
  /\b(?:sk|pk|rk)-[A-Za-z0-9_-]{16,}/g,
  /\bgh[pousr]_[A-Za-z0-9]{20,}/g,
  /\bgithub_pat_[A-Za-z0-9_]{20,}/g,
  /\bxox[abprs]-[A-Za-z0-9-]{10,}/g,
  /\bAKIA[0-9A-Z]{16}\b/g,
  /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g,
  /\bBearer\s+[A-Za-z0-9._~+/=-]{12,}/gi,
];
const ASSIGNMENT = /\b([A-Za-z0-9_.-]*(?:secret|password|passwd|token|api[_-]?key|credential)[A-Za-z0-9_.-]*)(\s*[:=]\s*)(?:"[^"\n]*"|'[^'\n]*'|[^\s"',;]+)/gi;

/** `text` with secret-shaped values (keys, bearer and JWT tokens, private keys, `name=value` credentials) masked. */
export function redactText(text) {
  let out = String(text);
  for (const pattern of SECRET_PATTERNS) out = out.replace(pattern, REDACTION);
  return out.replace(ASSIGNMENT, (_, name, sep) => `${name}${sep}${REDACTION}`);
}

const two = (n) => String(n).padStart(2, '0');
/** `yymmdd-hhmm` of `date`, in UTC. */
export function stampOf(date) {
  return `${two(date.getUTCFullYear() % 100)}${two(date.getUTCMonth() + 1)}${two(date.getUTCDate())}-${two(date.getUTCHours())}${two(date.getUTCMinutes())}`;
}

function dirOf(fgosDir, persona, name) {
  for (const [what, value] of [['persona', persona], ['name', name]]) {
    if (!NAME_RE.test(value ?? '')) throw new TypeError(`handoff store: ${what} must be a lowercase slug, got ${JSON.stringify(value)}`);
  }
  return path.join(fgosDir, 'runtime', 'session-rotation', `${persona}-${name}`);
}

/** The Markdown body: pointers, delta, and on `hard` the last assistant message and pending question verbatim. */
export function buildHandoff({ persona, name, sessionId, rotate, portfolio = [], delta = '', lastAssistantMessage = null, pendingQuestion = null }) {
  const lines = [VERIFY_LINE, '', `# Handoff: ${persona}-${name}`, '', `- session: ${sessionId}`, `- rotation: ${rotate}`, '', '## Portfolio files to reread', ''];
  lines.push(...(portfolio.length > 0 ? portfolio.map((p) => `- ${p}`) : ['- (none listed)']), '', '## Delta since the last handoff', '', delta.trim() || '(none recorded)', '');
  if (rotate === 'hard') {
    lines.push('## Last assistant message (verbatim)', '', lastAssistantMessage ?? '(none)', '', '## Pending question (verbatim)', '', pendingQuestion ?? '(none)', '');
  }
  return lines.join('\n');
}

/**
 * Write one handoff. Refuses to overwrite an existing file, installs `latest.json` last, then prunes to the newest
 * `keep`. Returns `{ file, path }`.
 */
export function writeHandoff({ fgosDir, persona, name, sessionId, rotate, keep = 10, now = new Date(), ...content }) {
  const dir = dirOf(fgosDir, persona, name);
  const sid8 = String(sessionId).replace(/[^A-Za-z0-9]/g, '').slice(0, 8);
  if (!sid8) throw new TypeError('handoff store: sessionId has no usable characters');
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  const file = `${stampOf(now)}-${sid8}.md`;
  const body = redactText(buildHandoff({ persona, name, sessionId, rotate, ...content }));
  if (installOnce(dir, file, body, FILE_MODE) === 'already-exists') throw Object.assign(new Error(`handoff-exists: ${file} is already stored for ${persona}-${name}`), { code: 'handoff-exists' });
  const pointer = JSON.stringify({ file, session: sessionId, rotate, writtenAt: now.toISOString() });
  replaceDurably(dir, 'latest.json', `${pointer}\n`, FILE_MODE);
  prune(dir, keep, file);
  return { file, path: path.join(dir, file) };
}

/** Remove all but the newest `keep` handoff files; the one named `current` is never removed. */
function prune(dir, keep, current) {
  const files = fs.readdirSync(dir).filter((f) => FILE_RE.test(f)).sort();
  for (const old of files.slice(0, Math.max(0, files.length - keep))) if (old !== current) fs.rmSync(path.join(dir, old), { force: true });
}

/** `{ file, path, text, ...pointer }` of the latest handoff, or null when there is none or its file is gone. */
export function readLatestHandoff({ fgosDir, persona, name }) {
  const dir = dirOf(fgosDir, persona, name);
  try {
    const pointer = JSON.parse(fs.readFileSync(path.join(dir, 'latest.json'), 'utf8'));
    if (!FILE_RE.test(pointer.file ?? '')) return null;
    const file = path.join(dir, pointer.file);
    return { ...pointer, path: file, text: fs.readFileSync(file, 'utf8') };
  } catch (err) {
    if (err.code === 'ENOENT' || err instanceof SyntaxError) return null;
    throw err;
  }
}
