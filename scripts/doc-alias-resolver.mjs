#!/usr/bin/env node
// doc-alias-resolver.mjs -- validates the platform alias table and resolves an
// old documentation reference to its current owner.
//
// Policy. An alias preserves lookup lineage for immutable historical
// references; it never duplicates content. Every alias points at exactly one
// owner under docs/platform/, except a retirement, which has no owner and must
// cite evidence. Chains are rejected: one lookup must land on a current owner,
// so an alias whose owner is itself the old path of another alias is a
// finding (a loop is reported as a cycle). Matching is exact on the path (and
// optional #anchor); there is no globbing. A split document is aliased per
// anchor (one owner per old anchor); a bare path has one owner. Validation
// findings are fatal (exit 1).

import fs from 'node:fs';
import path from 'node:path';
import { isMainModule } from './lib/is-main-module.mjs';
import { classifyPath, DEFAULT_CONSTITUTION_PATH } from './check-doc-constitution.mjs';
import { extractMarkdownConservationUnits } from './generate-doc-inventory.mjs';

export const DEFAULT_ALIAS_TABLE_PATH = 'plans/260925-documentation-authority-unification/alias-table.json';
export const ALIAS_KINDS = ['moved', 'merged', 'split', 'redirected', 'retired-with-evidence'];
export const OWNER_ROOT = 'docs/platform/';

const ENTRY_FIELDS = ['aliasId', 'fromPath', 'toOwner', 'toAnchor', 'kind', 'evidenceRef', 'immutableRefs', 'recordedAt'];
const ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const nonEmptyString = (v) => typeof v === 'string' && v.length > 0;
const isNullableString = (v) => v === null || typeof v === 'string';

/** Splits `path#anchor` at the first `#`; the anchor is null when absent. */
export function splitRef(ref) {
  const at = ref.indexOf('#');
  return at < 0 ? { path: ref, anchor: null } : { path: ref.slice(0, at), anchor: ref.slice(at + 1) };
}

function isRepoRelativePosix(p) {
  return nonEmptyString(p) && !p.startsWith('/') && !p.includes('\\') && !p.split('/').some((s) => s === '..' || s === '');
}

export function validateAliasTable(table, { repoRoot, constitution } = {}) {
  const findings = [];
  const add = (type, message, aliasId) => findings.push({ type, message, ...(aliasId ? { aliasId } : {}) });
  if (table?.version !== 1) add('wrong-version', `alias table version must be 1, found ${table?.version}`);
  if (!nonEmptyString(table?.description)) add('schema', 'alias table needs a description');
  if (!Array.isArray(table?.entries)) {
    add('schema', 'alias table entries must be an array');
    return findings;
  }

  const wellFormed = [];
  const seenIds = new Set();
  const seenFrom = new Map();
  for (const [index, entry] of table.entries.entries()) {
    const label = entry?.aliasId || `entries[${index}]`;
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) { add('schema', `${label}: entry must be an object`); continue; }
    let ok = true;
    const fail = (message) => { ok = false; add('schema', `${label}: ${message}`, entry.aliasId); };
    for (const field of ENTRY_FIELDS) if (!(field in entry)) fail(`missing field ${field}`);
    for (const field of Object.keys(entry)) if (!ENTRY_FIELDS.includes(field)) fail(`unknown field ${field}`);
    if (!ok) continue;
    if (!ID_PATTERN.test(entry.aliasId ?? '')) fail('aliasId must be lowercase kebab-case');
    if (!ALIAS_KINDS.includes(entry.kind)) add('bad-kind', `${label}: kind "${entry.kind}" is not one of ${ALIAS_KINDS.join(', ')}`, entry.aliasId);
    if (!isRepoRelativePosix(splitRef(String(entry.fromPath)).path)) fail('fromPath must be a repo-relative posix path');
    if (!isNullableString(entry.toOwner) || !isNullableString(entry.toAnchor) || !isNullableString(entry.evidenceRef)) fail('toOwner, toAnchor and evidenceRef must be strings or null');
    if (!Array.isArray(entry.immutableRefs) || entry.immutableRefs.some((r) => !nonEmptyString(r))) fail('immutableRefs must be an array of non-empty strings');
    if (!DATE_PATTERN.test(String(entry.recordedAt))) fail('recordedAt must be an ISO date (YYYY-MM-DD)');
    if (!ok) continue;

    if (seenIds.has(entry.aliasId)) add('duplicate-alias-id', `${label}: aliasId appears more than once`, entry.aliasId);
    seenIds.add(entry.aliasId);
    if (seenFrom.has(entry.fromPath)) add('duplicate-from-path', `${label}: fromPath "${entry.fromPath}" is already aliased by ${seenFrom.get(entry.fromPath)}`, entry.aliasId);
    else seenFrom.set(entry.fromPath, entry.aliasId);

    const retired = entry.kind === 'retired-with-evidence';
    if (entry.kind === 'split' && splitRef(entry.fromPath).anchor === null) add('split-without-anchor', `${label}: a split alias must name the old anchor (fromPath path#anchor), because a bare path resolves to one owner only`, entry.aliasId);
    if (entry.toOwner === null && entry.toAnchor !== null) add('anchor-without-owner', `${label}: toAnchor needs a toOwner`, entry.aliasId);
    if (retired) {
      if (!nonEmptyString(entry.evidenceRef)) add('missing-evidence', `${label}: retired-with-evidence needs an evidenceRef`, entry.aliasId);
    } else if (entry.toOwner === null) {
      if (entry.toAnchor === null) add('missing-owner', `${label}: ${entry.kind} needs a toOwner`, entry.aliasId);
    }
    if (entry.toOwner !== null) {
      if (entry.toOwner.includes('#')) add('schema', `${label}: toOwner must not carry an anchor; use toAnchor`, entry.aliasId);
      if (!retired && !entry.toOwner.startsWith(OWNER_ROOT)) add('owner-outside-platform', `${label}: toOwner "${entry.toOwner}" must be under ${OWNER_ROOT}`, entry.aliasId);
    }
    wellFormed.push(entry);
  }

  // Chains and cycles: following an alias must land on a document that is not itself an old path.
  const byFromPath = new Map();
  for (const entry of wellFormed) byFromPath.set(entry.fromPath, entry);
  const next = (entry) => (entry.toOwner === null ? null : (entry.toAnchor !== null && byFromPath.get(`${entry.toOwner}#${entry.toAnchor}`)) || byFromPath.get(entry.toOwner) || null);
  for (const entry of wellFormed) {
    let cursor = next(entry);
    if (!cursor) continue;
    const visited = new Set([entry.aliasId]);
    let cyclic = false;
    while (cursor) {
      if (visited.has(cursor.aliasId)) { cyclic = true; break; }
      visited.add(cursor.aliasId);
      cursor = next(cursor);
    }
    add(cyclic ? 'alias-cycle' : 'alias-chain', `${entry.aliasId}: toOwner "${entry.toOwner}"${entry.toAnchor ? `#${entry.toAnchor}` : ''} is itself the old path of another alias${cyclic ? ' (the aliases form a cycle)' : ''}`, entry.aliasId);
  }

  if (repoRoot) {
    for (const entry of wellFormed) {
      const { path: fromPath, anchor: fromAnchor } = splitRef(entry.fromPath);
      const old = fromAnchor === null ? null : readOldDocument(repoRoot, fromPath);
      if (old !== null && !anchorSpellings(old).has(fromAnchor)) add('from-anchor-missing', `${entry.aliasId}: fromPath anchor "${fromAnchor}" is not a heading or block anchor of ${fromPath}`, entry.aliasId);
    }
    for (const entry of wellFormed) {
      if (!entry.toOwner) continue;
      const ownerPath = path.resolve(repoRoot, entry.toOwner);
      if (!fs.existsSync(ownerPath)) { add('owner-missing', `${entry.aliasId}: toOwner "${entry.toOwner}" does not exist`, entry.aliasId); continue; }
      if (entry.toAnchor !== null && entry.toOwner.toLowerCase().endsWith('.md')) {
        const anchors = new Set(extractMarkdownConservationUnits(fs.readFileSync(ownerPath, 'utf8')).flatMap((u) => [u.anchor, u.githubAnchor, u.stableAnchor]).filter(Boolean));
        if (!anchors.has(entry.toAnchor)) add('anchor-missing', `${entry.aliasId}: toAnchor "${entry.toAnchor}" is not a heading or block anchor of ${entry.toOwner}`, entry.aliasId);
      }
    }
  }
  if (constitution) {
    for (const entry of wellFormed) {
      if (entry.toOwner && entry.toOwner.startsWith(OWNER_ROOT) && classifyPath(entry.toOwner, constitution).kind === null) {
        add('owner-not-placed', `${entry.aliasId}: toOwner "${entry.toOwner}" matches no document-kind placement`, entry.aliasId);
      }
    }
  }
  return findings;
}

const LINE_RANGE = /^(.+?\.md):(\d+)(?:-(\d+))?$/;
const LINE_FRAGMENT = /^(.+?\.md)#L(\d+)(?:-L?(\d+))?$/;

/** GitHub's slug of a heading: lower case, punctuation removed, every space a hyphen (no collapsing). */
function githubSlug(title) {
  return title.trim().toLowerCase().replace(/[^\p{L}\p{N}\- _]/gu, '').replace(/ /g, '-');
}

function readOldDocument(repoRoot, refPath) {
  if (!repoRoot || !refPath.toLowerCase().endsWith('.md')) return null;
  try { return fs.readFileSync(path.resolve(repoRoot, refPath), 'utf8'); } catch { return null; }
}

/** Every spelling of a heading anchor of the old document (extractor anchors and GitHub's own slug) mapped to the extractor anchor. */
function anchorSpellings(content) {
  const spellings = new Map();
  for (const u of extractMarkdownConservationUnits(content)) {
    for (const a of [u.anchor, u.githubAnchor, u.stableAnchor]) if (a && !spellings.has(a)) spellings.set(a, u.anchor);
    if (u.unitKind === 'heading' && !spellings.has(githubSlug(u.title))) spellings.set(githubSlug(u.title), u.anchor);
  }
  return spellings;
}

/** The headings enclosing a line of the old document, nearest first (the heading on the line itself first when the line is a heading). */
function enclosingHeadings(content, line) {
  const units = extractMarkdownConservationUnits(content).sort((a, b) => a.startLine - b.startLine);
  let idx = -1;
  for (let k = 0; k < units.length; k += 1) if (units[k].startLine <= line) idx = k;
  if (idx < 0) return [];
  const chain = [];
  let level = Infinity;
  for (let k = idx; k >= 0; k -= 1) {
    if (units[k].unitKind === 'heading' && units[k].level < level) { chain.push(units[k].anchor); level = units[k].level; }
  }
  return chain;
}

/** Normalizes a reference written in a consumer: relative links are resolved against the consumer's directory. */
function normalizeReference(ref, consumerPath) {
  if (!/^\.{1,2}\//.test(ref)) return { ref };
  if (!consumerPath) return { error: 'relative-reference-needs-consumer' };
  const joined = path.posix.normalize(path.posix.join(path.posix.dirname(consumerPath), ref));
  return joined.startsWith('../') ? { error: 'relative-reference-leaves-repository' } : { ref: joined };
}

/**
 * Resolves `path`, `path#anchor`, `path:line`, `path:line-line`, `path#L12` or a relative link by exact match.
 * An exact full-reference hit comes first. With a repo root the anchor of the old document is checked:
 * an anchor that is not in it is unresolved (`unknown-anchor`), never a silent fallback to the bare-path
 * alias. A line form maps the line to the enclosing headings of the old document (line numbers drift, so the
 * result says `precision: 'line-to-section'`). A reference whose own anchor has no alias falls back to the
 * nearest enclosing heading that has one, or to the bare path, and says so in `precision`.
 */
export function resolveAlias(table, rawRef, { repoRoot = null, consumerPath = null } = {}) {
  const entries = Array.isArray(table?.entries) ? table.entries : [];
  const normalized = normalizeReference(String(rawRef), consumerPath);
  if (normalized.error) return { resolved: false, reason: normalized.error };
  let ref = normalized.ref;
  let lineForm = null;
  const lineMatch = ref.match(LINE_RANGE) || ref.match(LINE_FRAGMENT);
  if (lineMatch) { lineForm = { path: lineMatch[1], line: Number(lineMatch[2]) }; ref = lineMatch[1]; }
  const { path: refPath, anchor } = splitRef(ref);
  const found = (hit, extra = {}) => ({
    resolved: true,
    toOwner: hit.toOwner,
    toAnchor: hit.toAnchor,
    kind: hit.kind,
    via: hit.aliasId,
    ...(hit.evidenceRef ? { evidenceRef: hit.evidenceRef } : {}),
    ...extra,
  });
  const byFrom = (from) => entries.find((e) => e.fromPath === from);
  const old = readOldDocument(repoRoot, refPath);

  if (lineForm) {
    if (old === null) return { resolved: false, reason: 'line-reference-needs-old-document' };
    const total = old.split(/\r?\n/).length;
    if (lineForm.line < 1 || lineForm.line > total) return { resolved: false, reason: 'line-out-of-range' };
    for (const heading of enclosingHeadings(old, lineForm.line)) {
      const hit = byFrom(`${refPath}#${heading}`);
      if (hit) return found(hit, { precision: 'line-to-section', viaAnchor: heading });
    }
    const bare = byFrom(refPath);
    return bare ? found(bare, { precision: 'line-to-section', viaAnchor: null }) : { resolved: false, reason: 'no-alias' };
  }

  const exact = byFrom(ref);
  if (exact) return found(exact);
  if (anchor === null) return { resolved: false, reason: 'no-alias' };
  if (old !== null) {
    const canonical = anchorSpellings(old).get(anchor);
    if (canonical === undefined) return { resolved: false, reason: 'unknown-anchor' };
    const spelled = byFrom(`${refPath}#${canonical}`);
    if (spelled) return found(spelled);
    for (const heading of enclosingHeadings(old, extractMarkdownConservationUnits(old).find((u) => u.anchor === canonical)?.startLine ?? 1)) {
      const hit = byFrom(`${refPath}#${heading}`);
      if (hit) return found(hit, { precision: 'ancestor-section', viaAnchor: heading });
    }
  }
  const bare = byFrom(refPath);
  if (!bare) return { resolved: false, reason: 'no-alias' };
  return found(bare, { precision: 'bare-path', anchorVerified: old !== null });
}

export function runCli(argv, cwd = process.cwd()) {
  const option = (name) => {
    const idx = argv.indexOf(name);
    return idx >= 0 ? argv[idx + 1] : undefined;
  };
  const asJson = argv.includes('--json');
  const tablePath = path.resolve(cwd, option('--table') ?? DEFAULT_ALIAS_TABLE_PATH);
  const ref = option('--resolve');
  const consumerPath = option('--from') ?? null;
  let table;
  try {
    table = JSON.parse(fs.readFileSync(tablePath, 'utf8'));
  } catch (err) {
    console.error(`doc-alias-resolver error loading ${tablePath}: ${err.message}`);
    return 1;
  }
  let constitution;
  try {
    constitution = JSON.parse(fs.readFileSync(path.resolve(cwd, option('--constitution') ?? DEFAULT_CONSTITUTION_PATH), 'utf8'));
  } catch (err) {
    console.error(`doc-alias-resolver error loading the constitution: ${err.message}`);
    return 1;
  }
  const findings = validateAliasTable(table, { repoRoot: cwd, constitution });
  const resolution = ref === undefined ? null : resolveAlias(table, ref, { repoRoot: cwd, consumerPath });
  const failed = findings.length > 0 || (resolution !== null && !resolution.resolved);
  if (asJson) {
    console.log(JSON.stringify({ findings, resolution }, null, 2));
    return failed ? 1 : 0;
  }
  if (findings.length > 0) {
    console.error(`doc-alias-resolver: ${findings.length} finding(s):`);
    for (const f of findings) console.error(`  - [${f.type}] ${f.message}`);
  } else {
    console.log(`doc-alias-resolver: alias table is valid (${table.entries.length} entries).`);
  }
  if (resolution) {
    if (resolution.resolved) console.log(`${ref} -> ${resolution.toOwner ?? '(retired)'}${resolution.toAnchor ? `#${resolution.toAnchor}` : ''} [${resolution.kind}, via ${resolution.via}${resolution.precision ? `, ${resolution.precision}` : ''}]`);
    else console.error(`${ref}: unresolved (${resolution.reason})`);
  }
  return failed ? 1 : 0;
}

if (isMainModule(import.meta.url)) process.exitCode = runCli(process.argv.slice(2));
