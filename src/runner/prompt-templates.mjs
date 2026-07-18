// prompt-templates.mjs — worker prompt content, externalized from dispatch.mjs
// (P49/backlog): tuning what a worker is TOLD is now a one-file template
// edit, never a code change. Selection is a MECHANICAL kind/tier/domain
// table lookup (R42 — no model call anywhere in this path, same standing
// stance the tier->model table already follows). Substitution is plain
// `{placeholder}` string-replace only — never a template engine — so any
// conditional composition (e.g. whether a "Human feedback" section appears
// at all) stays JS logic in dispatch.mjs's buildPrompt, computed BEFORE
// substitution, never as control flow inside a template file.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const TEMPLATE_DIR = path.join(import.meta.dirname, 'prompt-templates');

/**
 * Ordered rule table: the first rule whose declared `match` fields all equal
 * the input wins. The final wildcard rule (`match: {}`) always matches, so
 * `selectTemplate` never fails to resolve. Today exactly one rule exists —
 * no differentiated template is invented speculatively (mirrors P41's
 * "buy the interface, not the second instance" discipline); add a more
 * specific rule ahead of the wildcard when a real kind/tier/domain needs its
 * own prompt.
 */
const TEMPLATE_RULES = [{ match: {}, template: 'worker-prompt-default.txt' }];

function ruleMatches(match, input) {
  return Object.keys(match).every((key) => match[key] === input[key]);
}

/**
 * Mechanical kind/tier/domain -> template-file-name lookup. Pure and
 * synchronous — no model call, ever (R42).
 */
export function selectTemplate({ kind, tier, domain } = {}) {
  const input = { kind, tier, domain };
  const rule = TEMPLATE_RULES.find((r) => ruleMatches(r.match, input));
  return rule.template;
}

const templateCache = new Map();

function readTemplate(name) {
  if (!templateCache.has(name)) {
    const content = fs.readFileSync(path.join(TEMPLATE_DIR, name), 'utf8');
    templateCache.set(name, content);
  }
  return templateCache.get(name);
}

/** Read a template file's raw content (memoized — templates are committed,
 * static for the process lifetime, same trust-at-load discipline
 * `.fgos-runner.json` already uses). */
export function loadTemplate(name) {
  return readTemplate(name);
}

/**
 * Substitute `vars` into the named template — literal `{key}` substring
 * replace, per key, in the order `vars` was given. Never a regex, never
 * conditional logic: a template file has no control flow, only placeholders.
 */
export function renderTemplate(name, vars) {
  let text = readTemplate(name);
  for (const [key, value] of Object.entries(vars)) {
    text = text.split(`{${key}}`).join(String(value));
  }
  return text;
}

const hashCache = new Map();

/** SHA-256 hex digest of the template's raw file bytes (the template's own
 * identity — NOT the rendered/substituted output) — memoized. Dispatch logs
 * this alongside the template name so a bad worker run traces back to
 * exactly which template version produced its prompt. */
export function hashTemplate(name) {
  if (!hashCache.has(name)) {
    hashCache.set(name, crypto.createHash('sha256').update(readTemplate(name), 'utf8').digest('hex'));
  }
  return hashCache.get(name);
}
