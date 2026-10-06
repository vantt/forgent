#!/usr/bin/env node
// check-doc-candidate-status.mjs -- metadata and link check for candidate and
// promoted platform documents.
//
// Policy. Whether a document is a candidate or promoted is read only from the
// transitional switchboard (an area's or route's authorityStatus, plus the
// root documents). The "Design status" line of the document itself is
// descriptive and never changes the computed status: promoted portals say
// "Draft" today and a candidate may say "Accepted".
//
// Two constitution gates are covered:
//   - metadata-and-structure: a candidate carries every requiredMetadata
//     candidateCore field; a promoted document carries the governance
//     baseline plus promotionFields.extra (field lists are read from the
//     constitution and docs/doc-governance.md, never copied here);
//   - links-resolve: every relative markdown link and every path listed under
//     the Related field resolves to an existing file.
//
// Report-only by default (exit 0, counts printed); --strict makes any finding
// fatal. Legacy-current, non-authority and unrouted documents are counted but
// never checked: their metadata belongs to the legacy corpus.

import fs from 'node:fs';
import path from 'node:path';
import { isMainModule } from './lib/is-main-module.mjs';
import { DEFAULT_CONSTITUTION_PATH, governanceBaselineFields, headerBlock, headerFields, classifyPath, trackedPlatformDocs } from './check-doc-constitution.mjs';
import { buildSwitchboardIndex, lookupSwitchboard } from './generate-doc-inventory.mjs';

export const DEFAULT_SWITCHBOARD_PATH = 'plans/260925-documentation-authority-unification/transitional-switchboard.json';
export const STATUSES = ['promoted', 'candidate', 'legacy-current', 'non-authority', 'unrouted'];
const ROUTED_STATUSES = new Set(STATUSES.filter((s) => s !== 'unrouted'));

const indexCache = new WeakMap();

function switchboardEntry(docPath, switchboard) {
  if (!indexCache.has(switchboard)) indexCache.set(switchboard, buildSwitchboardIndex(switchboard));
  return lookupSwitchboard(indexCache.get(switchboard), docPath);
}

/**
 * The status of a document, derived only from the switchboard through the same
 * route index the inventory generator uses (exact route or root document, else
 * the longest glob prefix), so the two tools cannot disagree.
 */
export function classifyDocumentStatus(docPath, switchboard) {
  const status = switchboardEntry(docPath, switchboard)?.authorityStatus;
  return ROUTED_STATUSES.has(status) ? status : 'unrouted';
}

function stripCode(text) {
  return text.replace(/^```[\s\S]*?^```/gm, '').replace(/`[^`\n]*`/g, '');
}

/** Relative file targets of markdown links, without anchors or queries; external and anchor-only links are skipped. */
export function relativeLinkTargets(text) {
  const targets = [];
  for (const m of stripCode(text).matchAll(/\[[^\]]*\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g)) {
    const target = m[1];
    if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('#') || target.startsWith('/')) continue;
    const bare = target.split('#')[0].split('?')[0];
    if (bare) targets.push(bare);
  }
  return targets;
}

/** Paths listed under the header's Related field (`- path` lines); non-path values and globs are skipped. */
export function relatedPaths(text) {
  const block = headerBlock(text);
  if (block === null) return [];
  const lines = block.split('\n');
  const start = lines.findIndex((l) => /^Related:/.test(l));
  if (start < 0) return [];
  const values = [];
  const inline = lines[start].replace(/^Related:\s*/, '').trim();
  if (inline) values.push(inline);
  for (const line of lines.slice(start + 1)) {
    const item = line.match(/^\s*-\s+(.+)$/);
    if (!item) break;
    values.push(item[1].trim());
  }
  return values
    .map((v) => v.replace(/^`([^`]+)`.*$/, '$1').split(/\s+/)[0].replace(/[,;]$/, ''))
    .filter((v) => (v.includes('/') || /\.md$/.test(v)) && !v.includes('*') && !/^[a-z][a-z0-9+.-]*:/i.test(v));
}

/** Evidence payloads are metadata-exempt; they need a location, not a switchboard status. */
function isEvidencePayload(file, constitution) {
  const { kind } = classifyPath(file, constitution, { header: '' });
  return (constitution.documentKinds || []).find((k) => k.id === kind)?.metadataExempt === true;
}

export function checkCandidateMetadata({ files, readFile, switchboard, constitution, repoRoot }) {
  const findings = [];
  const counts = { files: files.length, byStatus: Object.fromEntries(STATUSES.map((s) => [s, 0])), exemptUnrouted: 0, checked: 0, findings: 0, byType: {} };
  const candidateCore = constitution?.requiredMetadata?.candidateCore || [];
  const promotionRequired = [...governanceBaselineFields(repoRoot), ...(constitution?.requiredMetadata?.promotionFields?.extra || [])];
  const add = (type, file, message) => {
    findings.push({ type, path: file, message });
    counts.byType[type] = (counts.byType[type] || 0) + 1;
  };
  for (const file of files) {
    const status = classifyDocumentStatus(file, switchboard);
    counts.byStatus[status] += 1;
    const conflict = switchboardEntry(file, switchboard)?.routeConflict;
    if (conflict) add('switchboard-route-conflict', file, `the switchboard routes this document more than once (${conflict.length} entries); the status is ambiguous`);
    if (status === 'unrouted' && constitution && isEvidencePayload(file, constitution)) counts.exemptUnrouted += 1;
    if (status !== 'candidate' && status !== 'promoted') continue;
    counts.checked += 1;
    const text = readFile(file);
    if (constitution && !classifyPath(file, constitution, { header: text.slice(0, 800) }).kind) add('unplaced-document', file, 'the document matches no placement pattern of the constitution');
    const fields = headerFields(text);
    const required = status === 'candidate' ? candidateCore : promotionRequired;
    const missing = required.filter((f) => !fields?.has(f));
    if (missing.length > 0) {
      add(status === 'candidate' ? 'missing-candidate-fields' : 'missing-promotion-fields', file, fields ? `missing header fields: ${missing.join(', ')}` : `no header block; missing: ${missing.join(', ')}`);
    }
    const dir = path.posix.dirname(file);
    const exists = (rel) => fs.existsSync(path.resolve(repoRoot, rel));
    for (const target of relativeLinkTargets(text)) {
      if (!exists(path.posix.normalize(path.posix.join(dir, target)))) add('unresolved-link', file, `link target does not exist: ${target}`);
    }
    for (const related of relatedPaths(text)) {
      if (!exists(path.posix.normalize(related)) && !exists(path.posix.normalize(path.posix.join(dir, related)))) add('unresolved-related', file, `Related path does not exist: ${related}`);
    }
  }
  counts.findings = findings.length;
  return { findings, counts };
}

export function runCli(argv, cwd = process.cwd()) {
  const option = (name, fallback) => {
    const idx = argv.indexOf(name);
    return path.resolve(cwd, idx >= 0 ? argv[idx + 1] : fallback);
  };
  const repoRoot = option('--repo-root', '.');
  const asJson = argv.includes('--json');
  const strict = argv.includes('--strict');
  let switchboard;
  let constitution;
  try {
    switchboard = JSON.parse(fs.readFileSync(path.resolve(repoRoot, option('--switchboard', DEFAULT_SWITCHBOARD_PATH)), 'utf8'));
    constitution = JSON.parse(fs.readFileSync(path.resolve(repoRoot, option('--constitution', DEFAULT_CONSTITUTION_PATH)), 'utf8'));
  } catch (err) {
    console.error(`check-doc-candidate-status error loading input: ${err.message}`);
    return 1;
  }
  let files;
  try {
    files = trackedPlatformDocs(repoRoot);
  } catch (err) {
    console.error(`check-doc-candidate-status error listing documents: ${err.message}`);
    return 1;
  }
  const readFile = (file) => {
    try { return fs.readFileSync(path.resolve(repoRoot, file), 'utf8'); } catch { return ''; }
  };
  const { findings, counts } = checkCandidateMetadata({ files, readFile, switchboard, constitution, repoRoot });
  const fatal = strict && findings.length > 0;
  if (asJson) {
    console.log(JSON.stringify({ counts, findings }, null, 2));
    return fatal ? 1 : 0;
  }
  console.log(`check-doc-candidate-status: ${counts.files} documents; ${STATUSES.map((s) => `${s} ${counts.byStatus[s]}`).join(', ')}; ${counts.exemptUnrouted} of the unrouted are metadata-exempt evidence payloads; ${counts.checked} checked, ${counts.findings} finding(s)${strict ? ' (strict)' : ' (report only)'}.`);
  for (const [type, n] of Object.entries(counts.byType)) console.log(`    ${type}: ${n}`);
  for (const f of findings) console.log(`    [${f.type}] ${f.path}: ${f.message}`);
  return fatal ? 1 : 0;
}

if (isMainModule(import.meta.url)) process.exitCode = runCli(process.argv.slice(2));
