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
//     constitution and docs/platform/governance.md, never copied here);
//   - links-resolve: all local platform links (including Related and clickable
//     Historical source references) resolve to a file/directory and real anchor.
//     The link/anchor reader is shared; code spans and fences remain literal.
//
// Metadata stays report-only by default; --strict makes any finding fatal.
// Only candidate/promoted metadata is checked. Body health has no status or
// history exemptions. --links-only is always strict, uses the filesystem tree,
// and needs neither migration metadata nor the native Git door.

import fs from 'node:fs';
import path from 'node:path';
import { isMainModule } from './lib/is-main-module.mjs';
import { DEFAULT_CONSTITUTION_PATH, governanceBaselineFields, headerFields, classifyPath, trackedPlatformDocs } from './check-doc-constitution.mjs';
import { buildSwitchboardIndex, lookupSwitchboard } from './generate-doc-inventory.mjs';
import { listAnchors } from './list-doc-anchors.mjs';
import { clickable, relatedLinks, localDestination } from './lib/doc-links.mjs';

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

/** Compatibility views of the shared body reader; checking uses full operands. */
export function relativeLinkTargets(text) {
  return clickable(text).map(({ target }) => target)
    .filter((target) => !/^[a-z][a-z0-9+.-]*:|^[#\/]/i.test(target))
    .map((target) => target.split('#')[0].split('?')[0]).filter(Boolean);
}

export function relatedPaths(text) {
  return relatedLinks(text).map(({ target }) => target);
}

/** Strict doc-health guard: all platform Markdown, independent of status/kind.
 * readFile and exists are ports so the same check can read a materialized F tree.
 * Code is literal, not a link exemption. There are no history/status allowlists.
 */
export function checkPlatformLinks({ files, readFile, exists }) {
  const population = [], findings = [], anchors = new Map();
  for (const file of [...files].sort()) {
    if (!file.startsWith('docs/platform/') || !file.endsWith('.md')) continue;
    const text = readFile(file);
    for (const link of [...clickable(text), ...relatedLinks(text)]) {
      let resolved;
      try { resolved = localDestination(file, link.target); }
      catch { resolved = { path: '', fragment: '', invalid: true }; }
      if (!resolved) continue;
      // Related has always accepted repo-relative paths as well as file-relative.
      const bare = link.target.split('#')[0];
      if (link.related && exists(bare)) resolved.path = bare;
      const edge = { file, line: text.slice(0, link.targetStart).split('\n').length,
        targetStart: [...text.slice(0, link.targetStart)].length, target: link.target,
        oldPath: resolved.path, fragment: resolved.fragment, related: !!link.related };
      if (resolved.invalid || resolved.path === '..' || resolved.path.startsWith('../') || !exists(resolved.path)) edge.reason = 'missing-file';
      else if (resolved.fragment) {
        if (!anchors.has(resolved.path)) {
          anchors.set(resolved.path, new Set(listAnchors(readFile(resolved.path))
            .flatMap((a) => [a.anchor, a.githubSlug]).filter(Boolean)));
        }
        if (!anchors.get(resolved.path).has(resolved.fragment)) edge.reason = 'missing-anchor';
      }
      population.push(edge);
      if (edge.reason) findings.push({ type: edge.reason === 'missing-anchor' ? 'unresolved-anchor' : link.related ? 'unresolved-related' : 'unresolved-link',
        path: file, line: edge.line, target: link.target, reason: edge.reason,
        message: `link target does not resolve: ${link.target} (${edge.reason})` });
    }
  }
  return { population, findings, counts: { files: files.filter((f) => f.startsWith('docs/platform/') && f.endsWith('.md')).length,
    links: population.length, findings: findings.length } };
}

/** Filesystem body enumeration, including new files; no Git index or addon needed. */
export function platformDocs(repoRoot) {
  const files = [];
  const walk = (relative) => {
    let entries;
    try { entries = fs.readdirSync(path.join(repoRoot, relative), { withFileTypes: true }); }
    catch (error) { if (error.code === 'ENOENT') return; throw error; }
    for (const entry of entries) {
      const file = relative + '/' + entry.name;
      if (entry.isDirectory()) walk(file);
      else if (file.endsWith('.md')) files.push(file);
    }
  };
  walk('docs/platform');
  return files.sort();
}

function filesystemLinks(repoRoot, files, readFile = (file) => fs.statSync(path.resolve(repoRoot, file)).isDirectory() ? '' : fs.readFileSync(path.resolve(repoRoot, file), 'utf8')) {
  return checkPlatformLinks({ files,
    readFile,
    exists: (file) => fs.existsSync(path.resolve(repoRoot, file)),
  });
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
  }
  // Body health is never gated by the switchboard or metadata exemptions.
  for (const finding of filesystemLinks(repoRoot, files, readFile).findings) {
    findings.push(finding);
    counts.byType[finding.type] = (counts.byType[finding.type] || 0) + 1;
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
  if (argv.includes('--links-only')) {
    try {
      const result = filesystemLinks(repoRoot, platformDocs(repoRoot));
      if (asJson) console.log(JSON.stringify(result));
      else {
        console.log(`doc-health: ${result.counts.files} platform documents, ${result.counts.links} local links, ${result.findings.length} finding(s)`);
        for (const f of result.findings) console.log(`${f.path}:${f.line}: ${f.message}`);
      }
      return result.findings.length ? 1 : 0;
    } catch (error) {
      console.error(`doc-health: ${error.message}`);
      return 1;
    }
  }
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
    files = trackedPlatformDocs(repoRoot, { includeUntracked: true });
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
