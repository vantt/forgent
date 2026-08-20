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
import { DEFAULT_DOMAIN, resolveDomainName } from '../state/workflow-stage-graphs.mjs';

export const TEMPLATE_DIR = path.join(import.meta.dirname, 'prompt-templates');

/**
 * Ordered rule table: the first rule whose declared `match` fields all equal
 * the input wins. The final wildcard rule (`match: {}`) always matches, so
 * `selectTemplate` never fails to resolve. The `domain: 'coding'` rule
 * (str91-runner-skill-convergence D3) sits ahead of that wildcard: `coding`
 * is the only domain with a shipped `SKILL.md` chain today (STR89) and is
 * also `DEFAULT_DOMAIN`, so this rule fires for effectively all of today's
 * real dispatches. Add a further rule ahead of the wildcard when another
 * domain grows its own skill chain.
 *
 * `domain: 'coding', stage: 'discovery'` (tsk-5mj D1/D6/D7) sits ahead of
 * the bare `domain: 'coding'` rule (more specific first, same ordering
 * discipline every other rule here already follows) — every pre-tsk-5mj
 * caller never passes `stage` at all, so `input.stage` stays `undefined`
 * and this rule's own `stage: 'discovery'` never matches for them; zero
 * regression.
 */
const TEMPLATE_RULES = [
  { match: { domain: DEFAULT_DOMAIN, stage: 'discovery' }, template: 'worker-prompt-discovery.txt' },
  { match: { domain: DEFAULT_DOMAIN }, template: 'worker-prompt-skill-pointer.txt' },
  { match: {}, template: 'worker-prompt-default.txt' },
];

function ruleMatches(match, input) {
  return Object.keys(match).every((key) => match[key] === input[key]);
}

/**
 * Mechanical kind/tier/domain/stage -> template-file-name lookup. Pure and
 * synchronous — no model call, ever (R42).
 *
 * The incoming `domain` is folded via `resolveDomainName` (undefined or an
 * unrecognized string both fold to `'coding'`, str91 D7) IN HERE — the ONLY
 * fold point. Callers (`buildPrompt`, `spawnWorker`) always pass the item's
 * raw `work.domain` unchanged, so the two call sites can never diverge.
 *
 * `stage` (tsk-5mj D1/D6/D7, optional): omitted or `undefined` behaves
 * byte-identical to every pre-tsk-5mj call — only an explicit
 * `stage: 'discovery'` picks the new rule above.
 */
export function selectTemplate({ kind, tier, domain, stage } = {}) {
  const input = { kind, tier, domain: resolveDomainName(domain), stage };
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
 * the runner config already uses). */
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
