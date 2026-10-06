#!/usr/bin/env node
// check-doc-constitution.mjs -- validates the documentation-migration
// constitution files and the inventory's claim ledger against them.
//
// Three inputs are checked:
//   1. the claim/disposition vocabulary (internal consistency),
//   2. the minimum constitution (every id it references exists in the
//      vocabulary, placements are well formed, gates name real scripts),
//   3. the claim ledger of a doc-inventory artifact, row by row, against the
//      claim-ledger JSON Schema and the vocabulary.
//
// Policy. Structural breakage is fatal (exit 1): an unreadable or inconsistent
// vocabulary, constitution or schema, or an unreadable inventory. Invalid
// ledger rows are reported with counts per reason but are NOT fatal by
// default, because the inventory legitimately holds rows that later steps
// still fill (unassigned owners, unclassified kinds); they are data to
// close, not corruption. `--strict-rows` makes any invalid row fatal, for the
// steps that must hand over a clean ledger. Empty plan §6.2 fields are
// reported separately as gaps and never make a row invalid.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { isMainModule } from './lib/is-main-module.mjs';
import { loadShardedJsonArtifact } from './doc-inventory-artifact.mjs';
import { INVENTORY_MANIFEST_PATH, IDENTITY_REGISTRY_PATH } from './generate-doc-inventory.mjs';

const PLAN_DIR = 'plans/260925-documentation-authority-unification';
export const DEFAULT_VOCABULARY_PATH = `${PLAN_DIR}/claim-and-disposition-vocabulary.json`;
export const DEFAULT_CONSTITUTION_PATH = `${PLAN_DIR}/minimum-constitution.json`;
export const DEFAULT_SCHEMA_PATH = `${PLAN_DIR}/claim-ledger.schema.json`;
export const DEFAULT_INVENTORY_PATH = INVENTORY_MANIFEST_PATH;

const VOCABULARY_SECTIONS = ['sourceDispositions', 'claimKinds', 'fileClasses', 'corpora', 'authorityKinds', 'claimStatuses', 'reviewStatuses', 'relationTypes', 'identityStatuses'];
const USAGE_VALUES = new Set(['in-use', 'reserved', 'generator-only', 'registry-only']);
const CARDINALITIES = new Set(['singleton', 'collection']);
const GATE_KINDS = new Set(['script', 'planned', 'review']);
// Ledger field -> vocabulary section, used for usage counting.
const LEDGER_VOCABULARY_FIELDS = {
  claimKinds: 'claimKind',
  sourceDispositions: 'disposition',
  authorityKinds: 'authorityKind',
  claimStatuses: 'status',
  reviewStatuses: 'reviewStatus',
  identityStatuses: 'identityStatus',
};

const nonEmptyString = (v) => typeof v === 'string' && v.length > 0;
const idsOf = (list) => (Array.isArray(list) ? list.map((e) => e?.id) : []);

function collector() {
  const findings = [];
  return { findings, add: (type, message) => findings.push({ type, message }) };
}

function checkUniqueIds(add, label, ids) {
  const seen = new Set();
  for (const id of ids) {
    if (!nonEmptyString(id)) add('malformed-id', `${label}: every entry needs a non-empty id`);
    else if (seen.has(id)) add('duplicate-id', `${label}: id "${id}" appears more than once`);
    seen.add(id);
  }
}

export function validateVocabulary(vocabulary) {
  const { findings, add } = collector();
  if (vocabulary?.version !== 2) add('wrong-version', `vocabulary version must be 2, found ${vocabulary?.version}`);
  for (const section of VOCABULARY_SECTIONS) {
    const entries = vocabulary?.[section];
    if (!Array.isArray(entries) || entries.length === 0) {
      add('malformed-section', `vocabulary.${section} must be a non-empty array`);
      continue;
    }
    checkUniqueIds(add, `vocabulary.${section}`, idsOf(entries));
    for (const entry of entries) {
      if (!USAGE_VALUES.has(entry?.usage)) add('invalid-usage', `vocabulary.${section}.${entry?.id}: usage must be one of ${[...USAGE_VALUES].join(', ')}`);
      if (!nonEmptyString(entry?.definition) && !nonEmptyString(entry?.description)) add('missing-definition', `vocabulary.${section}.${entry?.id}: needs a definition`);
    }
  }

  const fileClassIds = new Set(idsOf(vocabulary?.fileClasses));
  const dispositionIds = new Set(idsOf(vocabulary?.sourceDispositions));
  for (const d of vocabulary?.sourceDispositions || []) {
    if (!Array.isArray(d.allowedFileClasses) || d.allowedFileClasses.length === 0) {
      add('missing-allowed-file-classes', `disposition ${d.id}: allowedFileClasses must be a non-empty array`);
      continue;
    }
    for (const cls of d.allowedFileClasses) {
      if (!fileClassIds.has(cls)) add('unknown-file-class', `disposition ${d.id}: file class "${cls}" is not in fileClasses`);
    }
    if (typeof d.requiresTargetOwner !== 'boolean' || typeof d.requiresRationale !== 'boolean') add('malformed-disposition', `disposition ${d.id}: requiresTargetOwner and requiresRationale must be booleans`);
  }
  for (const cls of vocabulary?.fileClasses || []) {
    const allowing = (vocabulary.sourceDispositions || []).filter((d) => d.allowedFileClasses?.includes(cls.id)).map((d) => d.id);
    if (allowing.length === 0) add('file-class-without-disposition', `file class ${cls.id}: no disposition allows it`);
    if (cls.allowedDispositions === undefined) continue;
    for (const id of cls.allowedDispositions) {
      if (!dispositionIds.has(id)) add('unknown-disposition', `file class ${cls.id}: allowedDispositions names unknown disposition "${id}"`);
    }
    const declared = [...cls.allowedDispositions].sort().join(',');
    if (declared !== [...allowing].sort().join(',')) add('class-disposition-mismatch', `file class ${cls.id}: allowedDispositions (${declared}) disagree with the dispositions that allow it (${allowing.join(',')})`);
  }
  const unknownBlocking = (vocabulary?.sourceDispositions || []).find((d) => d.id === 'unknown-blocking');
  if (!unknownBlocking) add('missing-unknown-blocking', 'vocabulary must define unknown-blocking');
  else for (const cls of fileClassIds) {
    if (!unknownBlocking.allowedFileClasses?.includes(cls)) add('unknown-blocking-not-universal', `unknown-blocking must be allowed for file class ${cls}`);
  }
  if (!Array.isArray(vocabulary?.dispositionConstraints) || vocabulary.dispositionConstraints.length === 0) add('missing-constraints', 'vocabulary.dispositionConstraints must be a non-empty array');

  const fieldLists = (vocabulary?.claimKinds || []).map((k) => JSON.stringify(k.minimumLedgerFields));
  if (fieldLists.some((l) => l !== fieldLists[0])) add('ledger-fields-differ', 'every claim kind must list the same minimumLedgerFields');
  if (!Array.isArray(vocabulary?.claimKinds?.[0]?.minimumLedgerFields) || vocabulary.claimKinds[0].minimumLedgerFields.length === 0) add('missing-ledger-fields', 'claim kinds must list minimumLedgerFields');

  if (!nonEmptyString(vocabulary?.amendmentRule)) add('missing-amendment-rule', 'vocabulary.amendmentRule must state how the frozen vocabulary is extended');
  checkUniqueIds(add, 'vocabulary.amendments', idsOf(vocabulary?.amendments));
  let lastMinor = 0;
  for (const amendment of vocabulary?.amendments || []) {
    if (!nonEmptyString(amendment.change) || !nonEmptyString(amendment.evidence)) add('amendment-missing-evidence', `amendment ${amendment.id}: needs a change and its evidence`);
    if (!Number.isInteger(amendment.minor) || amendment.minor <= lastMinor) add('amendment-minor-order', `amendment ${amendment.id}: minor must increase`);
    lastMinor = amendment.minor;
  }
  checkUniqueIds(add, 'vocabulary.changesFromV1', idsOf(vocabulary?.changesFromV1));
  for (const change of vocabulary?.changesFromV1 || []) {
    if (!nonEmptyString(change.change) || !nonEmptyString(change.evidence)) add('change-missing-evidence', `change ${change.id}: needs a change and its evidence`);
  }
  return findings;
}

function placeholdersOf(pattern) {
  return [...pattern.matchAll(/<([^>]+)>/g)].map((m) => m[1]);
}

const placementCache = new WeakMap();

function compilePattern(pattern) {
  const segments = pattern.split('/');
  const source = segments.map((segment) => {
    if (segment === '**') return '(?:[^/]+/)*[^/]+';
    return segment
      .split(/(<[^>]+>)/)
      .map((part) => (part.startsWith('<') ? `(?<${part.slice(1, -1).replace(/[^a-z]/g, '')}>[^/]+)` : part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
      .join('');
  }).join('/');
  return {
    regex: new RegExp(`^${source}$`),
    stars: segments.filter((s) => s === '**').length,
    placeholders: placeholdersOf(pattern).length,
    segments: segments.length,
  };
}

function compiledPlacements(constitution) {
  if (!placementCache.has(constitution)) {
    const list = [];
    for (const kind of constitution.documentKinds || []) {
      for (const placement of kind.placements || []) list.push({ kindId: kind.id, ...compilePattern(placement.pattern) });
    }
    placementCache.set(constitution, list);
  }
  return placementCache.get(constitution);
}

/**
 * Finds the one document kind a path belongs to. A header carrying a kind's
 * marker wins outright; otherwise the most specific matching pattern wins
 * (fewest `**`, then most path segments, then fewest placeholders). Equally specific patterns of
 * different kinds are ambiguous. `<area>` never binds a reserved directory.
 */
export function classifyPath(filePath, constitution, { header = '' } = {}) {
  for (const kind of constitution.documentKinds || []) {
    const marker = kind.marker;
    if (marker && new RegExp(`^${marker.field}:\\s*${marker.value}\\s*$`, 'm').test(header)) return { kind: kind.id, ambiguous: [] };
  }
  const reserved = new Set(constitution.areaNameRules?.reserved || []);
  const matches = [];
  for (const entry of compiledPlacements(constitution)) {
    const m = entry.regex.exec(filePath);
    if (!m) continue;
    if (m.groups?.area && reserved.has(m.groups.area)) continue;
    matches.push(entry);
  }
  if (matches.length === 0) return { kind: null, ambiguous: [] };
  const score = (e) => e.stars * 1000 - e.segments * 10 + e.placeholders;
  const best = Math.min(...matches.map(score));
  const kinds = [...new Set(matches.filter((e) => score(e) === best).map((e) => e.kindId))];
  return kinds.length === 1 ? { kind: kinds[0], ambiguous: [] } : { kind: null, ambiguous: kinds };
}

/** Classifies every path; recorded placement exceptions are listed apart from real leftovers. */
export function checkPlacement(files, constitution, readHeader) {
  const exceptionPaths = new Set((constitution.placementExceptions || []).map((e) => e.path));
  const byKind = {};
  const leftovers = [];
  const exceptions = [];
  const ambiguous = [];
  const evidenceWithoutOwner = [];
  const present = new Set(files);
  let matched = 0;
  for (const file of files) {
    const { kind, ambiguous: clash } = classifyPath(file, constitution, { header: readHeader(file) });
    if (kind) {
      matched += 1;
      byKind[kind] = (byKind[kind] || 0) + 1;
      const owner = (constitution.documentKinds || []).find((k) => k.id === kind)?.ownedBy;
      if (owner) {
        const parts = file.split('/');
        const at = parts.indexOf(owner.ancestorDirectory);
        if (at < 0 || !present.has(`${parts.slice(0, at + 1).join('/')}/${owner.file}`)) evidenceWithoutOwner.push(file);
      }
    }
    else if (clash.length) ambiguous.push(`${file}: ${clash.join(', ')}`);
    else if (exceptionPaths.has(file)) exceptions.push(file);
    else leftovers.push(file);
  }
  return { files: files.length, matched, leftovers, exceptions, ambiguous, evidenceWithoutOwner, byKind };
}

/** Fields of the "Required baseline" block of doc-governance.md §5, read from the file so they are never copied. */
export function governanceBaselineFields(repoRoot) {
  const file = path.resolve(repoRoot, 'docs/doc-governance.md');
  if (!fs.existsSync(file)) return [];
  const text = fs.readFileSync(file, 'utf8');
  const start = text.indexOf('Required baseline:');
  const block = start >= 0 ? text.slice(start).match(/```txt\n([\s\S]*?)\n```/) : null;
  return block ? block[1].split('\n').map((l) => l.replace(/:\s*$/, '').trim()).filter(Boolean) : [];
}

function headerFields(text) {
  const block = text.match(/^# .+\n+```txt\n([\s\S]*?)\n```/m);
  return block ? new Set([...block[1].matchAll(/^([A-Za-z][A-Za-z ]*):/gm)].map((m) => m[1])) : null;
}

/** Report-only: which canonical documents lack which promotion-gate header fields. */
export function checkPromotion(files, constitution, readFile, repoRoot) {
  const promotion = constitution.requiredMetadata?.promotionFields || {};
  const required = [...governanceBaselineFields(repoRoot), ...(promotion.extra || [])];
  const missingByField = Object.fromEntries(required.map((f) => [f, 0]));
  const result = { canonicalDocuments: 0, complete: 0, headerless: 0, headeredIncomplete: 0, headeredDocuments: 0, evidencePayloads: 0, headerlessPaths: [], missingByField, incomplete: [] };
  for (const file of files) {
    const text = readFile(file);
    const { kind } = classifyPath(file, constitution, { header: text.slice(0, 800) });
    const kindSpec = (constitution.documentKinds || []).find((k) => k.id === kind);
    if (kindSpec?.metadataExempt) { result.evidencePayloads += 1; continue; }
    if (!kindSpec?.canonical) continue;
    result.canonicalDocuments += 1;
    const fields = headerFields(text);
    if (!fields) { result.headerless += 1; result.headerlessPaths.push(file); } else result.headeredDocuments += 1;
    const missing = required.filter((f) => !fields?.has(f));
    for (const f of missing) result.missingByField[f] += 1;
    if (missing.length === 0) result.complete += 1;
    else if (fields) { result.headeredIncomplete += 1; result.incomplete.push({ path: file, missing }); }
  }
  return result;
}

function governanceHeadings(repoRoot) {
  const file = path.resolve(repoRoot, 'docs/doc-governance.md');
  if (!fs.existsSync(file)) return null;
  return new Set([...fs.readFileSync(file, 'utf8').matchAll(/^## (.+)$/gm)].map((m) => m[1].trim()));
}

function collectGovernanceRefs(node, found = []) {
  if (Array.isArray(node)) node.forEach((n) => collectGovernanceRefs(n, found));
  else if (node && typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) {
      if (key === 'governanceRef' && typeof value === 'string') found.push(value);
      else collectGovernanceRefs(value, found);
    }
  }
  return found;
}

export function validateConstitution(constitution, vocabulary, { repoRoot = process.cwd() } = {}) {
  const { findings, add } = collector();
  if (constitution?.vocabulary?.version !== vocabulary?.version) add('vocabulary-version-mismatch', `constitution pins vocabulary version ${constitution?.vocabulary?.version}, vocabulary is ${vocabulary?.version}`);
  const claimKindIds = new Set(idsOf(vocabulary?.claimKinds));
  const dispositionById = new Map((vocabulary?.sourceDispositions || []).map((d) => [d.id, d]));
  const fileClassIds = new Set(idsOf(vocabulary?.fileClasses));

  for (const reuse of constitution?.reuses || []) {
    if (!nonEmptyString(reuse.source) || !nonEmptyString(reuse.what)) add('reuse-missing-field', 'every reuses entry needs source and what');
  }

  // Scopes, kinds, placements.
  const scopeIds = new Set(idsOf(constitution?.scopes));
  checkUniqueIds(add, 'constitution.scopes', idsOf(constitution?.scopes));
  const placeholders = new Set(constitution?.placeholders || []);
  const kinds = constitution?.documentKinds || [];
  checkUniqueIds(add, 'constitution.documentKinds', idsOf(kinds));
  const typeNames = new Set();
  const patternOwner = new Map();
  const forbidden = (constitution?.placementRules || []).flatMap((r) => r.forbiddenPaths || []);
  const legacyRoots = (constitution?.placementRules || []).flatMap((r) => r.legacyRoots || []);
  const servedClaimKinds = new Set();
  for (const kind of kinds) {
    if (!nonEmptyString(kind.typeName)) add('malformed-kind', `document kind ${kind.id}: needs a typeName`);
    else if (typeNames.has(kind.typeName.toLowerCase())) add('duplicate-type-name', `document kind ${kind.id}: typeName "${kind.typeName}" is already used`);
    typeNames.add(String(kind.typeName).toLowerCase());
    if (kind.metadataExempt) {
      if (kind.canonical) add('exempt-kind-canonical', `document kind ${kind.id}: a metadata-exempt kind must not be canonical (evidence is not authority)`);
      if (!nonEmptyString(kind.ownedBy?.ancestorDirectory) || !nonEmptyString(kind.ownedBy?.file)) add('exempt-kind-missing-owner', `document kind ${kind.id}: a metadata-exempt kind needs ownedBy.ancestorDirectory and ownedBy.file`);
    }
    if (typeof kind.canonical !== 'boolean') add('malformed-kind', `document kind ${kind.id}: canonical must be a boolean`);
    for (const ck of kind.claimKinds || []) {
      if (!claimKindIds.has(ck) || ck === 'unclassified') add('unknown-claim-kind', `document kind ${kind.id}: claim kind "${ck}" is not a usable vocabulary claim kind`);
      servedClaimKinds.add(ck);
    }
    const hasMarker = nonEmptyString(kind.marker?.field) && nonEmptyString(kind.marker?.value);
    if ((!Array.isArray(kind.placements) || kind.placements.length === 0) && !hasMarker) add('missing-placement', `document kind ${kind.id}: needs at least one placement or a marker`);
    for (const placement of kind.placements || []) {
      const { pattern, cardinality, per } = placement;
      if (!nonEmptyString(pattern)) { add('malformed-placement', `document kind ${kind.id}: placement needs a pattern`); continue; }
      for (const name of placeholdersOf(pattern)) {
        if (!placeholders.has(name)) add('unknown-placeholder', `document kind ${kind.id}: pattern ${pattern} uses undeclared placeholder <${name}>`);
      }
      if (!pattern.startsWith('docs/')) add('placement-outside-docs', `document kind ${kind.id}: pattern ${pattern} must start with docs/`);
      if (!CARDINALITIES.has(cardinality)) add('invalid-cardinality', `document kind ${kind.id}: pattern ${pattern} has cardinality "${cardinality}"`);
      if (!scopeIds.has(per) && per !== 'directory' && per !== 'feature') add('invalid-per', `document kind ${kind.id}: pattern ${pattern} has per "${per}"`);
      if (patternOwner.has(pattern) && patternOwner.get(pattern) !== kind.id) add('duplicate-placement', `pattern ${pattern} is claimed by ${patternOwner.get(pattern)} and ${kind.id}`);
      patternOwner.set(pattern, kind.id);
      if (forbidden.some((f) => pattern.startsWith(f)) || (kind.canonical && legacyRoots.some((r) => pattern.startsWith(r)))) {
        add('placement-in-forbidden-location', `document kind ${kind.id}: pattern ${pattern} is in a forbidden or legacy location`);
      }
    }
  }
  for (const id of claimKindIds) {
    if (id !== 'unclassified' && !servedClaimKinds.has(id)) add('claim-kind-without-document-kind', `claim kind ${id} is served by no document kind`);
  }
  for (const ck of vocabulary?.claimKinds || []) {
    for (const docType of ck.canonicalDocumentTypes || []) {
      if (!typeNames.has(docType.toLowerCase())) add('unresolved-document-type', `claim kind ${ck.id}: document type "${docType}" matches no document kind typeName`);
    }
  }

  // Observed document-type mapping.
  const kindIds = new Set(idsOf(kinds));
  for (const [observed, target] of Object.entries(constitution?.documentTypeAliases || {})) {
    if (!kindIds.has(target)) add('alias-to-unknown-kind', `alias "${observed}" maps to unknown document kind "${target}"`);
  }
  for (const entry of constitution?.unmappedObservedDocumentTypes || []) {
    if (!nonEmptyString(entry.value) || !Number.isInteger(entry.files) || !nonEmptyString(entry.examplePath) || !nonEmptyString(entry.reason)) add('malformed-unmapped', `unmapped document type entry needs value, files, examplePath and reason: ${JSON.stringify(entry)}`);
    if (constitution.documentTypeAliases && entry.value in constitution.documentTypeAliases) add('alias-also-unmapped', `document type "${entry.value}" is both aliased and listed as unmapped`);
  }

  // Required metadata.
  const metadata = constitution?.requiredMetadata || {};
  const seenFields = new Map();
  for (const list of ['candidateCore', 'generatedExtra']) {
    if (!Array.isArray(metadata[list]) || metadata[list].length === 0) { add('malformed-metadata', `requiredMetadata.${list} must be a non-empty array`); continue; }
    for (const field of metadata[list]) {
      if (seenFields.has(field)) add('duplicate-metadata-field', `metadata field "${field}" is in both ${seenFields.get(field)} and ${list}`);
      seenFields.set(field, list);
    }
  }
  const baseline = governanceBaselineFields(repoRoot);
  for (const field of metadata.candidateCore || []) {
    if (baseline.length > 0 && !baseline.includes(field)) add('candidate-core-not-in-baseline', `candidate field "${field}" is not in the doc-governance.md required baseline`);
  }
  const promotion = metadata.promotionFields;
  if (!promotion || !nonEmptyString(promotion.governanceRef) || !Array.isArray(promotion.extra) || promotion.extra.length === 0) add('malformed-promotion-fields', 'requiredMetadata.promotionFields needs governanceRef and a non-empty extra list');
  else {
    if (baseline.length === 0) add('governance-baseline-unreadable', 'the required baseline block of doc-governance.md could not be read');
    for (const field of promotion.extra) if (baseline.includes(field)) add('promotion-extra-duplicates-baseline', `promotion field "${field}" is already in the governance baseline`);
  }
  if (!nonEmptyString(metadata.candidateMarker?.source) || !nonEmptyString(metadata.candidateMarker?.rule)) add('malformed-candidate-marker', 'requiredMetadata.candidateMarker needs a source and a rule; Design status text is not a marker');
  if (!Array.isArray(metadata.structure) || metadata.structure.length === 0) add('malformed-metadata', 'requiredMetadata.structure must be a non-empty array');

  if (!nonEmptyString(constitution?.amendmentRule)) add('missing-amendment-rule', 'constitution.amendmentRule must state how the frozen rules are extended');
  for (const entry of constitution?.placementExceptions || []) {
    if (!nonEmptyString(entry.path) || !nonEmptyString(entry.reason)) add('malformed-exception', `placement exception needs a path and a reason: ${JSON.stringify(entry)}`);
  }
  const headings = governanceHeadings(repoRoot);
  const refs = collectGovernanceRefs(constitution);
  if (refs.length > 0 && headings === null) add('governance-file-missing', 'docs/doc-governance.md is not readable, so governance references cannot be checked');
  else for (const ref of refs) if (!headings.has(ref)) add('governance-anchor-missing', `governanceRef "${ref}" is not a heading of docs/doc-governance.md`);

  // Generated / history classification.
  for (const [name, spec] of Object.entries(constitution?.classification || {})) {
    if (!fileClassIds.has(spec.fileClass)) add('unknown-file-class', `classification.${name}: file class "${spec.fileClass}" is not in the vocabulary`);
    if (spec.authorityKind !== undefined && !idsOf(vocabulary?.authorityKinds).includes(spec.authorityKind)) add('unknown-authority-kind', `classification.${name}: authority kind "${spec.authorityKind}" is not in the vocabulary`);
    for (const id of [].concat(spec.disposition || [], spec.dispositions || [])) {
      const d = dispositionById.get(id);
      if (!d) add('unknown-disposition', `classification.${name}: disposition "${id}" is not in the vocabulary`);
      else if (!d.allowedFileClasses.includes(spec.fileClass)) add('disposition-not-allowed-for-class', `classification.${name}: disposition ${id} is not allowed for file class ${spec.fileClass}`);
    }
  }

  // Authority conflict handling.
  const conflict = constitution?.authorityConflict || {};
  checkUniqueIds(add, 'authorityConflict.precedence', idsOf(conflict.precedence));
  for (const rule of conflict.precedence || []) if (!nonEmptyString(rule.rule)) add('malformed-precedence', `precedence ${rule.id}: needs a rule`);
  if (!Array.isArray(conflict.procedure) || conflict.procedure.length === 0) add('missing-procedure', 'authorityConflict.procedure must be a non-empty array');
  for (const id of conflict.outcomeDispositions || []) {
    if (!dispositionById.has(id)) add('unknown-disposition', `authorityConflict: outcome disposition "${id}" is not in the vocabulary`);
  }

  // Promotion and retirement gates.
  for (const gateName of ['promotionGate', 'retirementGate']) {
    const checks = constitution?.[gateName]?.checks;
    if (!Array.isArray(checks) || checks.length === 0) { add('missing-gate-checks', `${gateName}.checks must be a non-empty array`); continue; }
    checkUniqueIds(add, gateName, idsOf(checks));
    for (const check of checks) {
      const by = check.enforcedBy;
      if (!nonEmptyString(check.rule)) add('gate-missing-rule', `${gateName}.${check.id}: needs a rule`);
      if (!GATE_KINDS.has(by?.kind)) { add('gate-invalid-enforcement', `${gateName}.${check.id}: enforcedBy.kind must be one of ${[...GATE_KINDS].join(', ')}`); continue; }
      if (by.kind === 'script' && !(nonEmptyString(by.path) && fs.existsSync(path.resolve(repoRoot, by.path)))) add('gate-script-missing', `${gateName}.${check.id}: script ${by.path} does not exist`);
      if (by.kind === 'planned' && !nonEmptyString(by.deliverable)) add('gate-missing-deliverable', `${gateName}.${check.id}: a planned check must name its deliverable`);
      if (by.kind === 'review' && !nonEmptyString(by.reference)) add('gate-missing-reference', `${gateName}.${check.id}: a review check must name its reference`);
    }
  }

  // Corpus placement and deferred list.
  const corpusIds = new Set(idsOf(vocabulary?.corpora));
  const placedCorpora = new Set();
  for (const entry of constitution?.corpusPlacement || []) {
    if (!corpusIds.has(entry.corpus)) add('unknown-corpus', `corpusPlacement: corpus "${entry.corpus}" is not in the vocabulary`);
    placedCorpora.add(entry.corpus);
  }
  for (const id of corpusIds) if (!placedCorpora.has(id)) add('corpus-without-placement', `corpus ${id} has no placement entry`);

  const deferred = constitution?.deferredToEngine || [];
  if (deferred.length === 0) add('missing-deferred', 'deferredToEngine must list the items left to the future engine');
  checkUniqueIds(add, 'deferredToEngine', idsOf(deferred));
  for (const item of deferred) {
    for (const field of ['item', 'source', 'revisitTrigger']) {
      if (!nonEmptyString(item[field])) add('deferred-missing-field', `deferred item ${item.id}: needs ${field}`);
    }
  }
  return findings;
}

/** Findings that tie the row schema to the vocabulary; structural when non-empty. */
export function validateSchema(schema, vocabulary) {
  const { findings, add } = collector();
  const properties = schema?.properties || {};
  for (const name of schema?.required || []) {
    if (!(name in properties)) add('schema-required-without-property', `schema requires "${name}" but declares no such property`);
  }
  const walk = (node, label) => {
    if (node?.['x-vocabulary'] && !Array.isArray(vocabulary?.[node['x-vocabulary']])) add('schema-unknown-vocabulary-section', `${label}: x-vocabulary "${node['x-vocabulary']}" is not a vocabulary section`);
    for (const [key, child] of Object.entries(node?.properties || {})) walk(child, `${label}.${key}`);
    if (node?.items) walk(node.items, `${label}[]`);
  };
  walk(schema, '$');
  const planFields = vocabulary?.claimKinds?.[0]?.minimumLedgerFields || [];
  const marked = Object.keys(properties).filter((k) => properties[k]['x-plan62']);
  for (const field of planFields) if (!marked.includes(field)) add('schema-plan62-mismatch', `ledger field "${field}" is required by the vocabulary but not marked x-plan62 in the schema`);
  for (const field of marked) if (!planFields.includes(field)) add('schema-plan62-mismatch', `schema marks "${field}" x-plan62 but the vocabulary does not list it`);
  return findings;
}

function matchesType(value, type) {
  if (type === 'null') return value === null;
  if (type === 'array') return Array.isArray(value);
  if (type === 'object') return value !== null && typeof value === 'object' && !Array.isArray(value);
  if (type === 'integer') return Number.isInteger(value);
  return typeof value === type;
}

/**
 * Returns a function that checks one ledger row and returns its reason codes
 * (empty when valid). It implements the small JSON Schema subset the row
 * schema uses plus the x-vocabulary extension keyword.
 */
export function createRowValidator(schema, vocabulary, constitution = null) {
  const vocabularyIds = new Map();
  const sectionIds = (section) => {
    if (!vocabularyIds.has(section)) {
      if (!Array.isArray(vocabulary?.[section])) throw new Error(`schema names unknown vocabulary section "${section}"`);
      vocabularyIds.set(section, new Set(idsOf(vocabulary[section])));
    }
    return vocabularyIds.get(section);
  };
  const dispositionById = new Map((vocabulary?.sourceDispositions || []).map((d) => [d.id, d]));

  function walk(value, node, label, reasons) {
    const where = label || '$';
    const types = [].concat(node.type || []);
    if (types.length && !types.some((t) => matchesType(value, t))) { reasons.push(`wrong-type:${where}`); return; }
    if (value === null) return;
    if (typeof value === 'string') {
      if (node.minLength !== undefined && value.length < node.minLength) reasons.push(`too-short:${where}`);
      if (node.pattern && !new RegExp(node.pattern).test(value)) reasons.push(`pattern-mismatch:${where}`);
      if (node['x-vocabulary'] && !sectionIds(node['x-vocabulary']).has(value)) reasons.push(`unknown-vocabulary-value:${where}`);
    }
    if (typeof value === 'number' && node.minimum !== undefined && value < node.minimum) reasons.push(`below-minimum:${where}`);
    if (Array.isArray(value) && node.items) {
      for (const element of value) walk(element, node.items, `${label}[]`, reasons);
    }
    if (matchesType(value, 'object') && (node.properties || node.required)) {
      const prefix = label ? `${label}.` : '';
      for (const name of node.required || []) if (!(name in value)) reasons.push(`missing-required:${prefix}${name}`);
      for (const [key, child] of Object.entries(value)) {
        if (node.properties?.[key]) walk(child, node.properties[key], `${prefix}${key}`, reasons);
        else if (node.additionalProperties === false) reasons.push(`unexpected-property:${prefix}${key}`);
      }
    }
  }

  const blockingKinds = new Set((vocabulary?.claimKinds || []).filter((k) => k.blocksCutover).map((k) => k.id));

  return function validateRow(row, { itemRationale = '' } = {}) {
    const reasons = [];
    walk(row, schema, '', reasons);
    if (!row || typeof row !== 'object') return [...new Set(reasons)];
    const disposition = dispositionById.get(row.disposition);
    if (disposition?.requiresTargetOwner && !nonEmptyString(row.targetOwner)) reasons.push(`missing-target-owner:${disposition.id}`);
    if (disposition?.requiresRationale && !nonEmptyString(row.rationale) && !nonEmptyString(itemRationale)) reasons.push(`missing-rationale:${disposition.id}`);
    if (constitution && nonEmptyString(row.targetOwner)) {
      if (!row.targetOwner.startsWith('docs/platform/')) reasons.push('target-owner-outside-platform:targetOwner');
      else if (!classifyPath(row.targetOwner, constitution).kind) reasons.push('target-owner-not-placeable:targetOwner');
    }
    if (row.reviewStatus === 'reviewed' && (row.disposition === 'unknown-blocking' || blockingKinds.has(row.claimKind))) reasons.push('reviewed-while-blocking:reviewStatus');
    return [...new Set(reasons)];
  };
}

/** Validates every row and tallies reasons, vocabulary usage and empty plan §6.2 fields. */
export function summarizeLedger(rows, schema, vocabulary, { constitution = null, itemRationaleByPath = new Map() } = {}) {
  const validate = createRowValidator(schema, vocabulary, constitution);
  const seenIds = new Set();
  const invalidByReason = {};
  const usage = {};
  for (const section of [...Object.keys(LEDGER_VOCABULARY_FIELDS), 'relationTypes']) usage[section] = {};
  const gaps = { targetOwnerEmpty: 0, targetAnchorEmpty: 0, claimKindUnclassified: 0, notReviewed: 0 };
  let invalid = 0;
  const bump = (counts, key) => { counts[key] = (counts[key] || 0) + 1; };

  for (const row of rows) {
    const reasons = validate(row, { itemRationale: itemRationaleByPath.get(row?.sourcePath) || '' });
    if (row && typeof row === 'object') {
      if (seenIds.has(row.claimId)) reasons.push('duplicate-claim-id');
      seenIds.add(row.claimId);
      for (const [section, field] of Object.entries(LEDGER_VOCABULARY_FIELDS)) if (typeof row[field] === 'string') bump(usage[section], row[field]);
      for (const relation of Array.isArray(row.relations) ? row.relations : []) if (typeof relation?.type === 'string') bump(usage.relationTypes, relation.type);
      if (row.targetOwner == null) gaps.targetOwnerEmpty += 1;
      if (row.targetAnchor == null) gaps.targetAnchorEmpty += 1;
      if (row.claimKind === 'unclassified') gaps.claimKindUnclassified += 1;
      if (row.reviewStatus !== 'reviewed') gaps.notReviewed += 1;
    }
    if (reasons.length) {
      invalid += 1;
      for (const reason of reasons) bump(invalidByReason, reason);
    }
  }

  const usageDrift = [];
  const neverUsed = {};
  for (const section of Object.keys(usage)) {
    neverUsed[section] = [];
    for (const entry of vocabulary[section] || []) {
      const count = usage[section][entry.id] || 0;
      if (count === 0) neverUsed[section].push(entry.id);
      if ((entry.usage === 'in-use' && count === 0) || (entry.usage !== 'in-use' && count > 0)) {
        usageDrift.push({ section, id: entry.id, declared: entry.usage, observedRows: count });
      }
    }
  }
  return { rows: rows.length, valid: rows.length - invalid, invalid, invalidByReason, usage, usageDrift, neverUsed, gaps };
}

// Item field -> vocabulary section; every value the inventory emits must be defined.
const ITEM_VOCABULARY_FIELDS = {
  fileClass: 'fileClasses',
  corpus: 'corpora',
  authorityStatus: 'authorityKinds',
  proposedDisposition: 'sourceDispositions',
  claimKind: 'claimKinds',
};

/** Lists inventory item values (and document types) that no vocabulary or constitution entry defines. */
export function summarizeItems(items, vocabulary, constitution) {
  const undefinedValues = {};
  let undefinedTotal = 0;
  const note = (field, value) => {
    undefinedValues[field] ??= {};
    undefinedValues[field][value] = (undefinedValues[field][value] || 0) + 1;
    undefinedTotal += 1;
  };
  const known = Object.fromEntries(Object.entries(ITEM_VOCABULARY_FIELDS).map(([field, section]) => [field, new Set(idsOf(vocabulary[section]))]));
  const allowedClasses = new Map((vocabulary.sourceDispositions || []).map((d) => [d.id, new Set(d.allowedFileClasses || [])]));
  const mismatch = { count: 0, examples: [] };
  const knownTypes = new Set([...Object.keys(constitution.documentTypeAliases || {}), ...(constitution.unmappedObservedDocumentTypes || []).map((e) => e.value)]);
  for (const item of items) {
    for (const field of Object.keys(ITEM_VOCABULARY_FIELDS)) {
      if (!known[field].has(item[field])) note(field, item[field]);
    }
    if (item.documentType != null && !knownTypes.has(item.documentType)) note('documentType', item.documentType);
    const allowed = allowedClasses.get(item.proposedDisposition);
    if (allowed && !allowed.has(item.fileClass) && known.fileClass.has(item.fileClass)) {
      mismatch.count += 1;
      if (mismatch.examples.length < 5) mismatch.examples.push(`${item.path}: ${item.proposedDisposition} on ${item.fileClass}`);
    }
  }
  return { items: items.length, undefinedValues, undefinedTotal, dispositionClassMismatch: mismatch };
}

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function regenerateCommand() {
  return `node scripts/generate-doc-inventory.mjs --commit <commit> --identity-registry ${IDENTITY_REGISTRY_PATH} --json-out ${DEFAULT_INVENTORY_PATH} --md-out ${DEFAULT_INVENTORY_PATH.replace(/\.json$/, '.md')}`;
}

function trackedPlatformDocs(repoRoot) {
  return execFileSync('git', ['ls-files', 'docs/platform'], { cwd: repoRoot, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 }).split('\n').filter((f) => f.endsWith('.md'));
}

function formatCounts(counts) {
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([key, n]) => `    ${key}: ${n}`);
}

export function runCli(argv, cwd = process.cwd()) {
  const option = (name, fallback) => {
    const idx = argv.indexOf(name);
    return path.resolve(cwd, idx >= 0 ? argv[idx + 1] : fallback);
  };
  const repoRoot = option('--repo-root', '.');
  const asJson = argv.includes('--json');
  const strictRows = argv.includes('--strict-rows');
  const skipLedger = argv.includes('--no-ledger');

  let vocabulary;
  let constitution;
  let schema;
  try {
    vocabulary = loadJson(option('--vocabulary', DEFAULT_VOCABULARY_PATH));
    constitution = loadJson(option('--constitution', DEFAULT_CONSTITUTION_PATH));
    schema = loadJson(option('--schema', DEFAULT_SCHEMA_PATH));
  } catch (err) {
    console.error(`check-doc-constitution error loading input: ${err.message}`);
    return 1;
  }

  const fatalFindings = [
    ...validateVocabulary(vocabulary),
    ...validateConstitution(constitution, vocabulary, { repoRoot }),
    ...validateSchema(schema, vocabulary),
  ];

  let ledger = null;
  if (!skipLedger && fatalFindings.length === 0) {
    const inventoryPath = option('--inventory', DEFAULT_INVENTORY_PATH);
    try {
      if (!fs.existsSync(inventoryPath)) throw new Error(`File not found: ${inventoryPath}`);
      const inventory = loadShardedJsonArtifact(inventoryPath, { allowLegacyRawJson: false });
      if (!Array.isArray(inventory?.claimLedger)) throw new Error('inventory has no claimLedger array');
      const items = Array.isArray(inventory.items) ? inventory.items : [];
      const itemRationaleByPath = new Map(items.filter((i) => nonEmptyString(i.proposedRationale)).map((i) => [i.path, i.proposedRationale]));
      ledger = {
        ...summarizeLedger(inventory.claimLedger, schema, vocabulary, { constitution, itemRationaleByPath }),
        itemSummary: summarizeItems(items, vocabulary, constitution),
      };
    } catch (err) {
      console.error(`check-doc-constitution error loading inventory: ${err.message}. The shards are not committed; regenerate with: ${regenerateCommand()}`);
      return 1;
    }
  }

  let placement = null;
  if (argv.includes('--check-placement') && fatalFindings.length === 0) {
    const tracked = trackedPlatformDocs(repoRoot);
    const readHeader = (file) => {
      try { return fs.readFileSync(path.resolve(repoRoot, file), 'utf8').slice(0, 800); } catch { return ''; }
    };
    placement = checkPlacement(tracked, constitution, readHeader);
  }
  let promotion = null;
  if (argv.includes('--promotion') && fatalFindings.length === 0) {
    const tracked = trackedPlatformDocs(repoRoot);
    promotion = checkPromotion(tracked, constitution, (file) => {
      try { return fs.readFileSync(path.resolve(repoRoot, file), 'utf8'); } catch { return ''; }
    }, repoRoot);
  }
  const placementProblems = placement ? placement.leftovers.length + placement.ambiguous.length + placement.evidenceWithoutOwner.length : 0;
  const fatal = fatalFindings.length > 0 || (strictRows && placementProblems > 0) || (strictRows && ledger !== null && (ledger.invalid > 0 || ledger.itemSummary.undefinedTotal > 0 || ledger.itemSummary.dispositionClassMismatch.count > 0));
  if (asJson) {
    console.log(JSON.stringify({ fatalFindings, ledger, placement, promotion }, null, 2));
    return fatal ? 1 : 0;
  }
  if (fatalFindings.length > 0) {
    console.error(`check-doc-constitution: ${fatalFindings.length} fatal finding(s):`);
    for (const f of fatalFindings) console.error(`  - [${f.type}] ${f.message}`);
    return 1;
  }
  console.log(
    `check-doc-constitution: vocabulary and constitution are consistent ` +
    `(${vocabulary.sourceDispositions.length} dispositions, ${vocabulary.claimKinds.length} claim kinds, ` +
    `${constitution.documentKinds.length} document kinds, ${constitution.deferredToEngine.length} deferred items).`
  );
  if (placement) {
    console.log(`check-doc-constitution: placement: ${placement.files} files, ${placement.matched} matched, ${placement.leftovers.length} leftover, ${placement.ambiguous.length} ambiguous, ${placement.evidenceWithoutOwner.length} evidence without index (${placement.exceptions.length} recorded exception(s))`);
    for (const line of [...placement.leftovers, ...placement.ambiguous, ...placement.evidenceWithoutOwner]) console.log(`    ${line}`);
  }
  if (promotion) {
    console.log(`check-doc-constitution: promotion: ${promotion.canonicalDocuments} canonical documents, ${promotion.complete} complete, ${promotion.headerless} headerless, ${promotion.headeredIncomplete} headered with missing fields (report only; ${promotion.headeredDocuments} headered, ${promotion.evidencePayloads} evidence payloads exempt)`);
    for (const file of promotion.headerlessPaths.slice(0, 20)) console.log(`    headerless: ${file}`);
    console.log(`    missing by field: ${JSON.stringify(promotion.missingByField)}`);
  }
  if (ledger) {
    console.log(`check-doc-constitution: ledger rows: ${ledger.rows}, valid: ${ledger.valid}, invalid: ${ledger.invalid}`);
    if (ledger.invalid > 0) {
      console.log('  invalid rows by reason:');
      for (const line of formatCounts(ledger.invalidByReason)) console.log(line);
    }
    const { items, undefinedValues, undefinedTotal } = ledger.itemSummary;
    console.log(`check-doc-constitution: inventory items: ${items}, values not defined by the vocabulary or constitution: ${undefinedTotal}`);
    const mismatch = ledger.itemSummary.dispositionClassMismatch;
    if (mismatch.count > 0) {
      console.log(`    disposition not allowed for the file class: ${mismatch.count}`);
      for (const example of mismatch.examples) console.log(`      ${example}`);
    }
    for (const [field, counts] of Object.entries(undefinedValues)) {
      for (const [value, n] of Object.entries(counts)) console.log(`    ${field}: ${value} (${n})`);
    }
    console.log(`  plan §6.2 fields still empty (data to fill, not invalid): ${JSON.stringify(ledger.gaps)}`);
    if (ledger.usageDrift.length > 0) {
      console.log(`  vocabulary usage flags that disagree with the rows (${ledger.usageDrift.length}):`);
      for (const d of ledger.usageDrift) console.log(`    ${d.section}.${d.id}: declared ${d.declared}, ${d.observedRows} row(s)`);
    }
    const unused = Object.entries(ledger.neverUsed).filter(([, ids]) => ids.length > 0).map(([section, ids]) => `${section}: ${ids.join(', ')}`);
    if (unused.length > 0) console.log(`  defined but never used by any row: ${unused.join('; ')}`);
  }
  return fatal ? 1 : 0;
}

if (isMainModule(import.meta.url)) {
  process.exitCode = runCli(process.argv.slice(2), process.cwd());
}
