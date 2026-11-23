// decision-index.mjs — generates docs/decisions/index.md, a projection of
// state.decisions' platform/repo-wide decisions (those carrying a `scope`
// field, tsk-1lv-2 / CONTEXT.md D4). Mirrors two existing patterns rather
// than inventing a new one:
//   - docs/enduser-docs-index.json's own generate+drift shape
//     (enduser-index-generate.mjs's computeEnduserDocsIndex/
//     generateEnduserDocsIndex) — compute-without-writing is shared by the
//     write path and the `--check` drift mode below.
// The same projection writes each scoped decision's role-field line into its
// holder document (see "role fields" below), so both outputs share one
// regenerate and one `--check`.
// Committed rows are unioned with local state until decision events travel
// across machines. State wins on identity; explicit removal requires editing
// both the committed index and state, never just regenerating a partial view.

import fs from 'node:fs';
import path from 'node:path';
import { listWork, StoreError } from '../state/store.mjs';
import { writeFrontmatter } from '../util/yaml.mjs';
import { invokeHost } from '../util/host-bin.mjs';

export function indexPathFor(repoRoot) {
  return path.join(repoRoot, 'docs', 'decisions', 'index.md');
}

const MODEL_DIR = path.join('packages', 'component-authority', 'model');
const LEGACY_SPEC_PATH = /docs\/specs\/([A-Za-z0-9-]+)\.md/g;

/**
 * Resolve where a decision scope's narrative lives today. Decision kinds in
 * `packages/component-authority/model/decision-kinds.yaml` name the narrative
 * home per scope (id, canonical, aliases); the host reads it (`fgos authority model`). A scope the model does not list
 * falls back to the platform file that carries its name
 * (`docs/platform/<name>.md` or `docs/platform/<name>/spec.md`, covering
 * scopes such as `questions`). Returns `(scopeName) => path|null`.
 */
export function narrativeHolderResolver(repoRoot) {
  const homes = new Map();
  if (fs.existsSync(path.join(repoRoot, MODEL_DIR))) {
    const { decisionKinds } = invokeHost(['authority', 'model', '--json'], { dir: repoRoot });
    for (const kind of decisionKinds) {
      const home = kind?.narrative;
      if (!home) continue;
      const names = new Set();
      // Match by id, canonical, and aliases only — not owner or area name.
      if (kind.id) names.add(kind.id);
      if (kind.canonical) names.add(kind.canonical);
      for (const alias of kind.aliases ?? []) names.add(alias);
      for (const name of names) {
        if (name) homes.set(name, home);
      }
    }
  }
  const exists = (rel) => fs.existsSync(path.join(repoRoot, rel));
  return (name) => homes.get(name)
    ?? [`docs/platform/${name}.md`, `docs/platform/${name}/spec.md`].find(exists)
    ?? null;
}

// Decision events are immutable and may carry a retired `docs/specs/<scope>.md`
// pointer; the projection shows the current holder instead.
function resolveLegacyPaths(text, holderFor) {
  return holderFor ? String(text ?? '').replace(LEGACY_SPEC_PATH, (match, name) => holderFor(name) ?? match) : text;
}

function escapeCell(text) {
  return String(text ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

/**
 * Pure: render docs/decisions/index.md's markdown from state.decisions'
 * scope-carrying records. `kind: 'engine'` bookkeeping is excluded (never
 * platform-scoped, tsk-1ud D7); any record with no `scope` field (item-
 * level D-IDs, D3) is excluded too — this index is ONLY the platform/
 * repo-wide surface D4 names. Sorted by scope, then chronologically, so a
 * repeat call over an unchanged log produces byte-identical output
 * (the `--check` drift mode below depends on this determinism).
 *
 * `type: explanation` frontmatter (tsk-1lv-4): `docs/decisions/` is a
 * QUADRANT_DIR_ALIASES entry for the "explanation" Diataxis quadrant
 * (`enduser-index.mjs`) — every file the retired ADR corpus held carried
 * this same `type`, and `docs-index`/its own consistency test expect every
 * `.md` file under this dir to keep declaring it, generated index included.
 */
export function buildDecisionIndexMarkdown(decisions, existingMarkdown = '', { holderFor } = {}) {
  const rows = new Map();
  const key = (d) => `${d.scope}\0${d.text.match(/^D-ADR\d+\b/)?.[0] ?? d.ts}`;
  for (const line of existingMarkdown.split('\n')) {
    if (!line.startsWith('| ')) continue;
    const cells = line.slice(1, -1).split(/(?<!\\)\|/).map((cell) => cell.trim().replace(/\\\|/g, '|'));
    if (cells.length !== 4 || cells[0] === 'Scope') continue;
    const [scope, text, rationale, ts] = cells;
    rows.set(key({ scope, text, ts }), { scope, text, rationale, ts });
  }
  const stateRows = (decisions ?? []).filter(
    (d) => d.kind !== 'engine' && typeof d.scope === 'string' && d.scope.trim(),
  );
  // State wins on text and rationale (the latest event of a decision restates it); Recorded keeps the first record.
  for (const d of stateRows) {
    const earlier = rows.get(key(d));
    rows.set(key(d), earlier && earlier.ts < d.ts ? { ...d, ts: earlier.ts } : d);
  }
  const scoped = [...rows.values()];
  scoped.sort((a, b) => {
    if (a.scope !== b.scope) return a.scope < b.scope ? -1 : 1;
    return a.ts < b.ts ? -1 : a.ts > b.ts ? 1 : 0;
  });

  const lines = [
    '',
    '# Decisions index',
    '',
    '<!-- generated by `fgos decision-index` from state.decisions plus committed rows; state wins by scope + decision ID (otherwise scope + timestamp). To remove a row, remove it from both state and this file. -->',
    '',
  ];
  if (scoped.length === 0) {
    lines.push('_No platform/repo-wide decisions recorded yet._', '');
  } else {
    lines.push('| Scope | Decision | Rationale | Recorded |', '|---|---|---|---|');
    for (const d of scoped) {
      lines.push(`| ${escapeCell(d.scope)} | ${escapeCell(resolveLegacyPaths(d.text, holderFor))} | ${escapeCell(resolveLegacyPaths(d.rationale, holderFor))} | ${escapeCell(d.ts)} |`);
    }
    lines.push('');
  }
  return writeFrontmatter({ type: 'explanation', title: 'Decisions index', generated: true }, lines.join('\n'), 'docs/decisions/index.md');
}

// ---- role fields in the holder documents ----------------------------------------------------------------------
//
// Each scoped `D-ADR####` decision unit carries one field line under its heading, which pkm reads to compute the
// decisions in force: `[valid_from:: <date>]`, then `[replaces:: <id>]` or `[amends:: <id>]` when the decision ends
// or changes an earlier unit. The line is a projection of the decision events, never hand-written: the latest event
// for an id decides its relation, and `valid_from` is the latest `validFrom` an event declares, else the first event's
// timestamp. Ids with no local event are left untouched, as committed index rows are.

const DECISION_ID = /^D-ADR\d{4}\b/;
const HEADING_ID = /^#{2,6} +(D-ADR\d{4})\b/;
const FIELD_LINE = /^\[valid_from:: [^\]]*\](?: \[[a-z_]+:: [^\]]*\])*$/;
const RELATION_FIELD = { supersedes: 'replaces', amends: 'amends' };

/** A relation target as a unit id pkm can resolve, or null: `ADR####` reads as `D-ADR####`. */
export function roleFieldTarget(target) {
  const text = String(target ?? '').trim();
  const alias = /^ADR(\d{4})$/.exec(text);
  if (alias) return `D-ADR${alias[1]}`;
  return /^(?:D-ADR\d{4}|0\d{3}|L\d+|RUL\d+)$/.test(text) ? text : null;
}

/**
 * Pure: the field line of every scoped decision, from its events in log order. A decision is its scope and id
 * (two scopes once minted the same number). Returns `{ fields: Map<key, { id, scope, line }>, warnings }`; a
 * relation whose target is no unit id is left out of the line and named in `warnings`.
 */
export function decisionRoleFields(decisions) {
  const byId = new Map();
  for (const d of decisions ?? []) {
    if (d.kind === 'engine' || typeof d.scope !== 'string' || !d.scope.trim()) continue;
    const id = DECISION_ID.exec(String(d.text ?? ''))?.[0];
    if (!id) continue;
    const key = `${d.scope}\0${id}`;
    if (!byId.has(key)) byId.set(key, []);
    byId.get(key).push(d);
  }
  const fields = new Map();
  const warnings = [];
  for (const [key, events] of byId) {
    const id = DECISION_ID.exec(events[0].text)[0];
    const latest = events.at(-1);
    const declared = events.filter((e) => typeof e.validFrom === 'string' && e.validFrom).at(-1);
    const parts = [`[valid_from:: ${declared?.validFrom ?? events[0].ts}]`];
    const [kind, ...rest] = String(latest.relation ?? 'none').split(':');
    const field = RELATION_FIELD[kind];
    if (field) {
      const target = roleFieldTarget(rest.join(':'));
      if (target) parts.push(`[${field}:: ${target}]`);
      else warnings.push(`${id}: ${latest.relation} names no unit id; no ${field} field is written (record a new decision event naming the unit)`);
    }
    fields.set(key, { id, scope: latest.scope, line: parts.join(' ') });
  }
  return { fields, warnings };
}

/**
 * Pure: `markdown` with the field line of every id in `lines` (Map id → line) placed under that id's heading,
 * replacing a field line already there. Returns `{ content, placed: Set<id> }`.
 */
export function placeRoleFields(markdown, lines) {
  const input = String(markdown ?? '').split('\n');
  const out = [];
  const placed = new Set();
  for (let i = 0; i < input.length; i += 1) {
    out.push(input[i]);
    const id = HEADING_ID.exec(input[i])?.[1];
    if (!id || !lines.has(id)) continue;
    placed.add(id);
    if (input[i + 1] === '' && FIELD_LINE.test(input[i + 2] ?? '')) i += 2;
    out.push('', lines.get(id));
  }
  return { content: out.join('\n'), placed };
}

/**
 * The holder documents with their field lines refreshed, in memory: `{ holders: [{ path, filePath, previous,
 * next, changed }], warnings }`. A decision is placed under its heading in its scope's holder. When the holder has
 * no such heading and no other scope uses the same number, the heading is looked for under `docs/platform/`, and
 * used when exactly one document has it (a decision recorded under one scope whose narrative lives in another
 * area). Anything else is a warning, never inserted prose.
 */
export function computeDecisionRoleFields(repoRoot, decisions, holderFor = narrativeHolderResolver(repoRoot)) {
  const { fields, warnings } = decisionRoleFields(decisions);
  const headings = new Map();
  const headingIds = (rel) => {
    if (!headings.has(rel)) {
      const text = fs.readFileSync(path.join(repoRoot, rel), 'utf8');
      headings.set(rel, new Set(text.split('\n').map((line) => HEADING_ID.exec(line)?.[1]).filter(Boolean)));
    }
    return headings.get(rel);
  };
  let platformFiles;
  const scopesPerId = new Map();
  for (const { id } of fields.values()) scopesPerId.set(id, (scopesPerId.get(id) ?? 0) + 1);
  const perFile = new Map();
  for (const { id, scope, line } of fields.values()) {
    const holder = holderFor(scope);
    const files = holder ? holderFiles(repoRoot, holder) : null;
    let targets = (files ?? []).filter((rel) => headingIds(rel).has(id));
    if (!targets.length && scopesPerId.get(id) === 1) {
      platformFiles ??= markdownFilesUnder(repoRoot, path.posix.join('docs', 'platform'));
      const elsewhere = platformFiles.filter((rel) => headingIds(rel).has(id));
      if (elsewhere.length === 1) targets = elsewhere;
    }
    if (!targets.length) {
      warnings.push(!holder
        ? `${id}: scope "${scope}" has no narrative holder`
        : `${id}: no "${id}" heading in ${holder}${files ? '' : ' (the holder does not exist)'}`);
      continue;
    }
    for (const rel of targets) {
      if (!perFile.has(rel)) perFile.set(rel, new Map());
      perFile.get(rel).set(id, line);
    }
  }
  const holders = [];
  for (const [rel, lines] of [...perFile].sort(([a], [b]) => (a < b ? -1 : 1))) {
    const filePath = path.join(repoRoot, rel);
    const previous = fs.readFileSync(filePath, 'utf8');
    const { content } = placeRoleFields(previous, lines);
    holders.push({ path: rel, filePath, previous, next: content, changed: content !== previous });
  }
  return { holders, warnings };
}

/** Every `.md` file under `dir`, repo-relative and sorted. */
function markdownFilesUnder(repoRoot, dir) {
  const out = [];
  const walk = (rel) => {
    for (const entry of fs.readdirSync(path.join(repoRoot, rel), { withFileTypes: true })) {
      const child = path.posix.join(rel, entry.name);
      if (entry.isDirectory()) walk(child);
      else if (entry.name.endsWith('.md')) out.push(child);
    }
  };
  if (fs.existsSync(path.join(repoRoot, dir))) walk(dir);
  return out.sort();
}

/** The Markdown files a holder names, repo-relative and sorted: the file itself, or a directory's `.md` files. */
function holderFiles(repoRoot, holder) {
  let stat;
  try {
    stat = fs.statSync(path.join(repoRoot, holder));
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
  if (!stat.isDirectory()) return [holder];
  return fs.readdirSync(path.join(repoRoot, holder))
    .filter((name) => name.endsWith('.md'))
    .sort()
    .map((name) => path.posix.join(holder.replace(/\/+$/, ''), name));
}

/**
 * Compute the current decisions index in memory, without writing anything
 * — the read-only half shared by `fgos decision-index`'s write path and
 * its own `--check` drift mode (mirrors enduser-index-generate.mjs's
 * computeEnduserDocsIndex).
 */
export function computeDecisionIndex(repoRoot, fgosDir) {
  const indexPath = indexPathFor(repoRoot);
  let previousContent;
  try {
    previousContent = fs.readFileSync(indexPath, 'utf8');
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
  const view = listWork(fgosDir);
  const holderFor = narrativeHolderResolver(repoRoot);
  const nextContent = buildDecisionIndexMarkdown(view.decisions, previousContent, { holderFor });
  const roleFields = computeDecisionRoleFields(repoRoot, view.decisions, holderFor);
  return { indexPath, nextContent, previousContent, changed: previousContent !== nextContent, roleFields };
}

/** The repo-relative paths of the holder documents whose field lines would change. */
export function staleRoleFieldHolders(roleFields) {
  return roleFields.holders.filter((h) => h.changed).map((h) => h.path);
}

/**
 * Regenerate and, if content actually changed, overwrite
 * docs/decisions/index.md. Idempotent: a second call with nothing new in
 * state.decisions reports `changed: false` and never touches the file.
 *
 * tsk-1lv review-fix F12: refuses instead of writing when the on-disk
 * file already has real rows and the freshly-computed content would have
 * none -- `merge.mjs`'s own comment on the removed collision-resolve
 * mechanism argued the `fgos-write-rejected` wall makes a hostile
 * regenerated index impossible to merge, but that wall only rejects
 * staged changes under `.fgos/`; this file is an ordinary tracked doc.
 * A `fgw/<id>` worktree never carries `.fgos/` (ADR0020), so running this
 * verb there with no real store to read from computes the "no decisions
 * yet" placeholder -- committing and merging THAT is a real, unguarded
 * way to silently blank every platform decision's projection, same shape
 * as F6's context-render fix. This guard closes that gap directly rather
 * than relying on a wall that was never built to cover it.
 */
export function generateDecisionIndex(repoRoot, fgosDir) {
  const { indexPath, nextContent, previousContent, changed, roleFields } = computeDecisionIndex(repoRoot, fgosDir);
  const previousHasRows = typeof previousContent === 'string' && /^\|.+\|.*\|\s*$/m.test(previousContent);
  const nextHasRows = /^\|.+\|.*\|\s*$/m.test(nextContent);
  if (changed && previousHasRows && !nextHasRows) {
    throw new StoreError(
      'validation',
      `generateDecisionIndex: refusing to overwrite ${indexPath} -- it already has real rows and the freshly-computed content has none (a store with no decisions read, e.g. a worktree missing .fgos/ per ADR0020, or a genuine wipe -- either way this needs a person's look, not a silent overwrite).`,
    );
  }
  if (changed) {
    fs.mkdirSync(path.dirname(indexPath), { recursive: true });
    fs.writeFileSync(indexPath, nextContent, 'utf8');
  }
  for (const holder of roleFields.holders) {
    if (holder.changed) fs.writeFileSync(holder.filePath, holder.next, 'utf8');
  }
  return {
    path: path.relative(repoRoot, indexPath).split(path.sep).join('/'),
    changed,
    content: nextContent,
    holders: staleRoleFieldHolders(roleFields),
    warnings: roleFields.warnings,
  };
}
