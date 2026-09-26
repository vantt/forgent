#!/usr/bin/env node
// generate-doc-inventory.mjs -- Phase 02 repository-wide documentation inventory
// and conservation-ledger generator for Documentation Authority Unification.
//
// The artifact is deterministic for an explicit immutable commit: it reads only
// git objects, accounts for every in-scope documentation file, emits file-level
// inventory rows, and emits claim-level conservation rows for headings,
// unheaded prose blocks, and mixed/non-Markdown payloads.

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { isMainModule } from './lib/is-main-module.mjs';
import {
  resolveCommitSha,
  readBlobAtCommit,
  normalizePosix,
} from './generate-shipped-path-inventory.mjs';
import { classifyFile as classifyLegacyRootFile } from './check-legacy-docs-ratchet.mjs';

export const SCAN_ROOTS = ['docs'];
export const ADDITIONAL_ROOT_FILES = ['AGENTS.md', 'CLAUDE.md'];
export const PHASE_DIR = 'plans/260925-documentation-authority-unification';

function stableHash(input, len = 16) {
  return crypto.createHash('sha256').update(String(input)).digest('hex').slice(0, len);
}

function sha256(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

function slugText(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[`*_~]/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-');
}

export function slugifyHeading(text) {
  return slugText(text);
}

function areaSlug(area) {
  return slugText(area || 'unassigned') || 'unassigned';
}

function stripGlob(route) {
  return normalizePosix(route || '').replace(/\/\*\*$/, '').replace(/\*+$/, '').replace(/\/$/, '');
}

function firstPresent(...values) {
  return values.find((v) => typeof v === 'string' && v.length > 0) || null;
}

function concreteRoute(value) {
  return typeof value === 'string' && value.length > 0 && !value.includes('<') ? value : null;
}

function deriveAreaTargetOwner(area) {
  return firstPresent(
    concreteRoute(area.entryPoint),
    concreteRoute(area.canonicalRoute),
    Array.isArray(area.canonicalRoutes) ? concreteRoute(area.canonicalRoutes.find(concreteRoute)) : null,
  );
}

function hasSwitchboardBackedTarget(classification) {
  return classification.switchboardSource === 'rootDocument' || Boolean(classification.bindingSource || classification.proposedTargetOwner);
}

function deriveClaimStatus(classification) {
  if (classification.corpus === 'history-evidence') return 'historical';
  if (classification.authorityStatus === 'promoted' || classification.authorityStatus === 'legacy-current') return 'current';
  return 'future';
}

function makeSourceId(sourceDigest) {
  return `src_${stableHash(`content\n${sourceDigest}`, 20)}`;
}

function makeClaimBaseId({ sourceId, unitKind, textDigest, title, claimKind, status }) {
  return `claim_${stableHash([sourceId, unitKind, textDigest, slugText(title), claimKind, status].join('\n'), 24)}`;
}

/** Builds exact-route and longest-prefix lookup from the Phase 01 switchboard. */
export function buildSwitchboardIndex(switchboard) {
  const exact = new Map();
  const prefixes = [];

  function addExact(pathStr, entry) {
    if (!pathStr || typeof pathStr !== 'string' || pathStr.includes('<')) return;
    exact.set(normalizePosix(pathStr), entry);
  }

  function addRoute(routeStr, entry) {
    if (!routeStr || typeof routeStr !== 'string' || routeStr.includes('<')) return;
    if (routeStr.endsWith('/**')) {
      prefixes.push({ prefix: normalizePosix(routeStr.slice(0, -3)), entry });
    } else {
      addExact(routeStr, entry);
    }
  }

  for (const rd of switchboard.rootDocuments || []) {
    addExact(rd.path, {
      area: `root:${rd.path}`,
      authorityStatus: rd.authorityStatus,
      fileClass: rd.fileClass,
      role: rd.role,
      proposedTargetOwner: rd.path,
      switchboardSource: 'rootDocument',
    });
  }

  for (const area of switchboard.areas || []) {
    const derivedTargetOwner = deriveAreaTargetOwner(area);
    const targetOwner = derivedTargetOwner ? normalizePosix(derivedTargetOwner) : null;
    const routes = area.currentRoutes || area.scopedRoutes || [];
    for (const r of routes) {
      addRoute(r.route, {
        area: area.area,
        authorityStatus: r.authorityStatus,
        role: r.role,
        scope: r.scope,
        bindingSource: r.bindingSource || area.bindingSource || null,
        proposedTargetOwner: targetOwner,
        switchboardSource: 'scopedRoute',
      });
    }
    if (area.corpusRoot) {
      const raw = area.corpusRoot.endsWith('/**') ? area.corpusRoot.slice(0, -3) : area.corpusRoot;
      prefixes.push({
        prefix: normalizePosix(raw),
        entry: {
          area: area.area,
          authorityStatus: area.authorityStatus,
          role: area.scopeSummary,
          proposedTargetOwner: targetOwner,
          switchboardSource: 'corpusRoot',
        },
      });
    }
  }

  prefixes.sort((a, b) => b.prefix.length - a.prefix.length);
  return { exact, prefixes };
}

export function lookupSwitchboard(index, relPath) {
  const norm = normalizePosix(relPath);
  if (index.exact.has(norm)) return index.exact.get(norm);
  for (const { prefix, entry } of index.prefixes) {
    if (norm === prefix || norm.startsWith(prefix + '/')) return entry;
  }
  return null;
}

export const DIRECTORY_HEURISTICS = [
  { prefix: 'docs/ui-spec', area: 'UI specification', authorityStatus: 'legacy-current', fileClass: 'maintained-authority', corpus: 'platform-authority' },
  { prefix: 'docs/decisions', area: 'Decision records (generated projection, tsk-1lv-4)', authorityStatus: 'non-authority', fileClass: 'generated', corpus: 'history-evidence' },
  { prefix: 'docs/history', area: 'History/evidence', authorityStatus: 'non-authority', fileClass: 'history-evidence', corpus: 'history-evidence' },
  { prefix: 'docs/journals', area: 'History/evidence (journals)', authorityStatus: 'non-authority', fileClass: 'history-evidence', corpus: 'history-evidence' },
  { prefix: 'docs/how-to', area: 'End-user documentation (Diataxis)', authorityStatus: 'non-authority', fileClass: 'maintained-authority', corpus: 'user-knowledge' },
  { prefix: 'docs/tutorials', area: 'End-user documentation (Diataxis)', authorityStatus: 'non-authority', fileClass: 'maintained-authority', corpus: 'user-knowledge' },
  { prefix: 'docs/reference', area: 'End-user documentation (Diataxis)', authorityStatus: 'non-authority', fileClass: 'maintained-authority', corpus: 'user-knowledge' },
  { prefix: 'docs/explanation', area: 'End-user documentation (Diataxis)', authorityStatus: 'non-authority', fileClass: 'maintained-authority', corpus: 'user-knowledge' },
  { prefix: 'docs/knowledge', area: 'End-user knowledge registry', authorityStatus: 'non-authority', fileClass: 'maintained-authority', corpus: 'user-knowledge' },
  { prefix: 'docs/doc-registry', area: 'End-user knowledge registry', authorityStatus: 'non-authority', fileClass: 'generated', corpus: 'user-knowledge' },
  { prefix: 'docs/enduser-docs-index.json', area: 'End-user knowledge registry', authorityStatus: 'non-authority', fileClass: 'generated', corpus: 'user-knowledge' },
  { prefix: 'docs/distillery', area: 'Distillery reference-learning (consumer-project corpus)', authorityStatus: 'non-authority', fileClass: 'retained-source', corpus: 'consumer-project' },
  { prefix: 'docs/generated', area: 'Generated projection (unmapped)', authorityStatus: 'non-authority', fileClass: 'generated', corpus: 'platform-authority', gap: true },
  { prefix: 'docs/contracts', area: 'Platform contracts (unmapped)', authorityStatus: 'legacy-current', fileClass: 'maintained-authority', corpus: 'platform-authority', gap: true },
  { prefix: 'docs/platform', area: 'Platform documentation (unmapped candidate)', authorityStatus: 'candidate', fileClass: 'maintained-authority', corpus: 'platform-authority', gap: true },
  { prefix: 'docs/specs', useRatchetClassify: true, area: 'Legacy spec (unmapped)', authorityStatus: 'legacy-current', corpus: 'platform-authority', gap: true },
  { prefix: 'docs/architect', useRatchetClassify: true, area: 'Legacy architect (unmapped)', authorityStatus: 'legacy-current', corpus: 'platform-authority', gap: true },
];

export function classifyByDirectoryHeuristic(relPath) {
  const norm = normalizePosix(relPath);
  for (const rule of DIRECTORY_HEURISTICS) {
    if (norm === rule.prefix || norm.startsWith(rule.prefix + '/')) {
      const fileClass = rule.useRatchetClassify ? classifyLegacyRootFile(norm) : rule.fileClass;
      return {
        area: rule.area,
        authorityStatus: rule.authorityStatus,
        fileClass,
        corpus: rule.corpus,
        gap: Boolean(rule.gap),
        proposedTargetOwner: null,
        switchboardSource: 'directory-heuristic',
      };
    }
  }
  return null;
}

export function deriveFileClassFromAuthority(authorityStatus, role = '') {
  const roleLower = (role || '').toLowerCase();
  if (roleLower.includes('generated') || roleLower.includes('projection')) return 'generated';
  if (authorityStatus === 'non-authority') {
    if (roleLower.includes('historical') || roleLower.includes('directional') || roleLower.includes('vision') || roleLower.includes('proposal')) return 'retained-source';
    return 'maintained-authority';
  }
  return 'maintained-authority';
}

function deriveCorpusForSwitchboardEntry(sb, norm) {
  const areaLower = (sb.area || '').toLowerCase();
  const roleLower = (sb.role || '').toLowerCase();
  if (areaLower.includes('end-user') || areaLower.includes('knowledge registry') || roleLower.includes('user/end-user knowledge corpus') || norm.startsWith('docs/knowledge/') || norm.startsWith('docs/doc-registry')) return 'user-knowledge';
  return 'platform-authority';
}

export function classifyDocPath(relPath, switchboardIndex) {
  const norm = normalizePosix(relPath);
  if (norm === 'AGENTS.md' || norm === 'CLAUDE.md') {
    return {
      area: 'Always-loaded instruction layer',
      authorityStatus: 'legacy-current',
      fileClass: 'maintained-authority',
      corpus: 'platform-authority',
      gap: false,
      proposedTargetOwner: null,
      switchboardSource: 'always-loaded-instruction',
      role: 'Doctrine layer loaded every agent session (Phase 07 switchboard-bypass elimination target).',
    };
  }
  const sb = lookupSwitchboard(switchboardIndex, norm);
  if (sb) {
    return {
      area: sb.area,
      authorityStatus: sb.authorityStatus,
      fileClass: sb.fileClass || deriveFileClassFromAuthority(sb.authorityStatus, sb.role),
      corpus: deriveCorpusForSwitchboardEntry(sb, norm),
      gap: false,
      proposedTargetOwner: sb.proposedTargetOwner || null,
      bindingSource: sb.bindingSource || null,
      switchboardSource: sb.switchboardSource,
      role: sb.role || null,
    };
  }
  const heuristic = classifyByDirectoryHeuristic(norm);
  if (heuristic) return { ...heuristic, role: null };
  return {
    area: 'Unclassified',
    authorityStatus: 'unclassified',
    fileClass: 'unclassified',
    corpus: 'platform-authority',
    gap: true,
    proposedTargetOwner: null,
    switchboardSource: 'none',
    role: null,
  };
}

export function extractHeadings(markdownContent) {
  return extractMarkdownConservationUnits(markdownContent).filter((u) => u.unitKind === 'heading').map((u) => ({ level: u.level, text: u.title, anchor: u.anchor }));
}

export function extractDocumentType(content) {
  const fenceMatch = content.match(/```txt\r?\n([\s\S]*?)\r?\n```/);
  if (!fenceMatch) return null;
  const m = fenceMatch[1].match(/^Document type:\s*(.+)$/mi);
  return m ? m[1].trim() : null;
}

const DOCUMENT_TYPE_TO_CLAIM_KIND = {
  vision: 'vision',
  'platform foundations': 'normative-law',
  contract: 'contract',
  spec: 'specification',
  architecture: 'architecture',
  decision: 'decision',
  'intent preservation ledger': 'intent',
  'guide / runbook': 'procedure',
  guide: 'procedure',
  runbook: 'procedure',
  verification: 'verification',
  history: 'historical-context',
  knowledge: 'historical-context',
  'area portal': 'navigation',
  'subcomponent portal': 'navigation',
  'reading map': 'navigation',
  inventory: 'navigation',
  'governance guide': 'contract',
  'transitional switchboard': 'navigation',
};

export function deriveClaimKind(documentType) {
  if (!documentType) return 'unclassified';
  return DOCUMENT_TYPE_TO_CLAIM_KIND[documentType.trim().toLowerCase()] || 'unclassified';
}

export function inferClaimKindFromPathAndText(relPath, text, documentType) {
  const typed = deriveClaimKind(documentType);
  if (typed !== 'unclassified') return typed;
  const p = relPath.toLowerCase();
  const t = `${relPath}\n${text || ''}`.toLowerCase();
  if (p.includes('/decisions/') || /\b(adr|decision|decided|supersedes)\b/.test(t)) return 'decision';
  if (p.includes('/contracts/') || /\b(contract|schema|protocol|invariant|boundary)\b/.test(t)) return 'contract';
  if (p.includes('/architecture/') || p.includes('/architect/') || /\b(architecture|component|topology)\b/.test(t)) return 'architecture';
  if (p.includes('/specs/') || /\b(spec|state|lifecycle|shared entities)\b/.test(t)) return 'specification';
  if (/\b(proof|verification|test|evidence|receipt)\b/.test(t)) return 'verification';
  if (/\b(vision|mission|intent)\b/.test(t)) return 'vision';
  if (/\b(how to|runbook|procedure|steps)\b/.test(t)) return 'procedure';
  if (/\b(history|retrospective|timeline)\b/.test(t)) return 'historical-context';
  return 'unclassified';
}

export function proposeDisposition({ corpus, authorityStatus, fileClass, gap, isPromotedCanonical }) {
  if (gap) return 'unknown-blocking';
  if (fileClass === 'generated') return 'regenerate-from-source';
  if (corpus === 'user-knowledge' || corpus === 'consumer-project') return 'reclassify-out-of-platform-scope';
  if (corpus === 'history-evidence') return 'retain-as-evidence';
  if (isPromotedCanonical) return 'promote';
  if (fileClass === 'maintained-authority') return authorityStatus === 'candidate' ? 'promote' : 'merge';
  if (fileClass === 'retained-source') return 'defer-with-owner';
  return 'unknown-blocking';
}

export function proposeRationale(disposition, { area } = {}) {
  switch (disposition) {
    case 'merge':
      return null;
    case 'defer-with-owner':
      return `Phase 01 switchboard declares or Phase 02 infers the current owner for area "${area}"; Phase 05 candidate transformation is not yet authorized.`;
    case 'retain-as-evidence':
      return 'History/evidence corpus per plan.md §2.3; never serves as default reading authority.';
    case 'reclassify-out-of-platform-scope':
      return 'User-knowledge or consumer-project corpus per plan.md §2.3; governed outside platform documentation authority.';
    case 'unknown-blocking':
      return 'Not sufficiently resolved by the Phase 01 switchboard; requires explicit area assignment before later phases.';
    default:
      return null;
  }
}

const DISPOSITIONS_REQUIRING_TARGET_OWNER = new Set(['promote', 'move', 'merge', 'split', 'extract', 'redirect', 'supersede', 'delete-as-duplicate', 'defer-with-owner']);
const RETAINED_CLAIM_DISPOSITIONS = new Set(['promote', 'move', 'merge', 'split', 'extract', 'redirect', 'supersede', 'delete-as-duplicate', 'defer-with-owner']);

function targetOwnerForDisposition(disposition, classification) {
  if (!DISPOSITIONS_REQUIRING_TARGET_OWNER.has(disposition)) return null;
  return classification.proposedTargetOwner ? normalizePosix(classification.proposedTargetOwner) : null;
}

export function extractMarkdownConservationUnits(content) {
  const lines = content.split(/\r?\n/);
  const units = [];
  const seenAnchors = new Map();
  let inFence = false;
  let fenceMarker = null;
  let unheaded = [];
  let unheadedStart = 1;
  let unheadedCount = 0;
  let beforeFirstHeading = true;

  function flushUnheaded(endLine) {
    const raw = unheaded.join('\n').trim();
    unheaded = [];
    if (raw.replace(/\s+/g, '').length < 20) return;
    unheadedCount += 1;
    const anchor = `unheaded-block-${unheadedCount}`;
    units.push({
      unitKind: beforeFirstHeading ? 'unheaded-preamble' : 'unheaded-block',
      anchor,
      title: beforeFirstHeading ? 'Unheaded preamble' : `Unheaded block ${unheadedCount}`,
      startLine: unheadedStart,
      endLine,
      textDigest: sha256(raw),
      sample: raw.slice(0, 180),
    });
  }

  for (let idx = 0; idx < lines.length; idx += 1) {
    const line = lines[idx];
    const lineNo = idx + 1;
    const fenceMatch = line.match(/^\s{0,3}(`{3,}|~{3,})/);
    if (fenceMatch) {
      if (unheaded.length === 0) unheadedStart = lineNo;
      unheaded.push(line);
      if (!inFence) {
        inFence = true;
        fenceMarker = fenceMatch[1][0];
      } else if (line.trim().startsWith(fenceMarker.repeat(3))) {
        inFence = false;
      }
      continue;
    }
    if (inFence) {
      unheaded.push(line);
      continue;
    }

    const h = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (h) {
      flushUnheaded(lineNo - 1);
      const level = h[1].length;
      const title = h[2].trim();
      const base = slugifyHeading(title) || 'section';
      const count = seenAnchors.get(base) || 0;
      seenAnchors.set(base, count + 1);
      const anchor = count > 0 ? `${base}-${count}` : base;
      units.push({ unitKind: 'heading', level, title, anchor, startLine: lineNo, endLine: lineNo, textDigest: sha256(title), sample: title });
      beforeFirstHeading = false;
      unheadedStart = lineNo + 1;
      continue;
    }

    if (line.trim().length > 0) {
      if (unheaded.length === 0) unheadedStart = lineNo;
      unheaded.push(line);
    } else {
      flushUnheaded(lineNo - 1);
      unheadedStart = lineNo + 1;
    }
  }
  flushUnheaded(lines.length);
  return units;
}

export function extractMixedFileConservationUnit(relPath, content) {
  return [{
    unitKind: 'file-block',
    anchor: 'file-block',
    title: path.posix.basename(normalizePosix(relPath)),
    startLine: 1,
    endLine: content.split(/\r?\n/).length,
    textDigest: sha256(content),
    sample: content.slice(0, 180),
  }];
}

export function extractLinks(content) {
  const links = [];
  const markdown = /\[[^\]]*\]\(([^)]+)\)/g;
  let m;
  while ((m = markdown.exec(content)) !== null) links.push(m[1].trim());
  const bare = /(?:^|\s)((?:docs|plans|scripts|src|test|core|domains|plugins|\.agents|\.fgos)\/[A-Za-z0-9_.\/-]+(?:#[A-Za-z0-9_.\/-]+)?)/g;
  while ((m = bare.exec(content)) !== null) links.push(m[1].trim());
  return [...new Set(links)].sort();
}

export function extractRefs(content) {
  const refs = new Set();
  const patterns = [
    /\bD-ADR\d{4}\b/g,
    /\bADR-?\d{3,4}\b/g,
    /\bSTR\d+[A-Za-z0-9-]*\b/g,
    /\btsk-[a-z0-9]+\b/g,
    /\bRUL\d+\b/g,
    /\bCTR\d+\b/g,
    /\b[a-f0-9]{7,40}\b/g,
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(content)) !== null) refs.add(m[0]);
  }
  return [...refs].sort();
}

export function classifyConsumerKind(refFile, line = '') {
  const f = normalizePosix(refFile).toLowerCase();
  const l = String(line).toLowerCase();
  if (f.includes('/fixtures/') || f.includes('fixture') || l.includes('fixture')) return 'fixture';
  if (f.startsWith('test/') || /\b(proof|verify|receipt|assert|node --test|npm test)\b/.test(l)) return 'executable-proof';
  if (line.includes('**') || /glob|pathspec|minimatch/.test(l)) return 'glob';
  if (/\$\{|<[^>]+>|\*|\bdynamic\b|join\(|resolve\(/.test(line)) return 'dynamic';
  return 'literal';
}

function isTextPath(p) {
  return /\.(md|txt|json|jsonl|mjs|js|cjs|yaml|yml|toml|sh|rs|html|css)$/i.test(p) || !path.posix.extname(p);
}

function listCommitPaths(repoRoot, commitSha) {
  const out = execFileSync('git', ['ls-tree', '-r', '--name-only', commitSha], {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 60 * 1024 * 1024,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  return out.split('\n').filter(Boolean).map(normalizePosix).sort();
}

export function loadShippedPathInventory(commitSha, repoRoot) {
  try {
    const raw = readBlobAtCommit(commitSha, `${PHASE_DIR}/shipped-path-conventions-inventory.json`, repoRoot);
    return JSON.parse(raw);
  } catch {
    return { items: [] };
  }
}

export function buildShippedContractIndex(shippedInventory) {
  const byPath = new Map();
  for (const item of shippedInventory.items || []) byPath.set(normalizePosix(item.path), item);
  return byPath;
}

export function collectConsumers(repoRoot, commitSha, targetPaths, shippedIndex = new Map()) {
  const normalizedTargets = targetPaths.map(normalizePosix).sort();
  const targetSet = new Set(normalizedTargets);
  const stemToTargets = new Map();
  for (const target of normalizedTargets) {
    if (target.endsWith('.md')) {
      const stem = target.replace(/\.md$/, '');
      stemToTargets.set(stem, (stemToTargets.get(stem) || []).concat(target));
    }
  }
  const consumersByPath = new Map(normalizedTargets.map((p) => [p, []]));
  const allPaths = listCommitPaths(repoRoot, commitSha).filter(isTextPath);
  const pathToken = /(?:^|[\s"'`(<\[])(((?:docs|plans|scripts|src|test|core|domains|plugins|\.agents|\.fgos)\/[A-Za-z0-9_.\/-]+(?:\*\*)?(?:\.[A-Za-z0-9]+)?))/g;

  function add(target, file, lineNo, kind, extra = {}) {
    if (!consumersByPath.has(target)) return;
    consumersByPath.get(target).push({ path: file, line: lineNo, kind, ...extra });
  }

  for (const file of allPaths) {
    let content;
    try { content = readBlobAtCommit(commitSha, file, repoRoot); } catch { continue; }
    const lines = content.split(/\r?\n/);
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      if (!line.includes('docs/') && !line.includes('AGENTS.md') && !line.includes('CLAUDE.md')) continue;
      const lineNo = i + 1;
      if (line.includes('AGENTS.md')) add('AGENTS.md', file, lineNo, classifyConsumerKind(file, line));
      if (line.includes('CLAUDE.md')) add('CLAUDE.md', file, lineNo, classifyConsumerKind(file, line));
      let m;
      pathToken.lastIndex = 0;
      while ((m = pathToken.exec(line)) !== null) {
        const token = normalizePosix(m[1]).replace(/[),.;:]+$/, '');
        const kind = classifyConsumerKind(file, line);
        if (targetSet.has(token)) add(token, file, lineNo, kind);
        for (const target of stemToTargets.get(token) || []) add(target, file, lineNo, kind);
        if (token.includes('*')) {
          const prefix = token.split('*')[0].replace(/\/$/, '');
          for (const target of normalizedTargets) {
            if (target === prefix || target.startsWith(prefix + '/')) add(target, file, lineNo, 'glob');
          }
        }
      }
    }
  }
  for (const [target, shipped] of shippedIndex.entries()) {
    if (!consumersByPath.has(target)) continue;
    for (const ref of shipped.referencedIn || []) add(target, ref, null, 'shipped-contract', { contractScope: shipped.contractScope, referenceKind: shipped.referenceKind });
  }
  for (const [target, arr] of consumersByPath.entries()) {
    const uniq = new Map();
    for (const c of arr) uniq.set(`${c.path}:${c.line || ''}:${c.kind}:${c.contractScope || ''}`, c);
    consumersByPath.set(target, [...uniq.values()].sort((a, b) => a.path.localeCompare(b.path) || String(a.line || '').localeCompare(String(b.line || ''))));
  }
  return consumersByPath;
}

export function buildInventoryRow(relPath, { content, blobSha, blobSize, switchboardIndex, shippedContract = null, consumers = [] }) {
  const sourcePath = normalizePosix(relPath);
  const classification = classifyDocPath(sourcePath, switchboardIndex);
  const isMarkdown = sourcePath.toLowerCase().endsWith('.md');
  const documentType = isMarkdown ? extractDocumentType(content) : null;
  const claimKind = deriveClaimKind(documentType);
  const units = isMarkdown ? extractMarkdownConservationUnits(content) : extractMixedFileConservationUnit(sourcePath, content);
  const headings = units.filter((u) => u.unitKind === 'heading').map((u) => ({ level: u.level, text: u.title, anchor: u.anchor }));
  const isPromotedCanonical = classification.authorityStatus === 'promoted' && sourcePath.startsWith('docs/platform/');
  const initialDisposition = proposeDisposition({ ...classification, isPromotedCanonical });
  const initialTargetOwner = targetOwnerForDisposition(initialDisposition, classification);
  const uniqueClaimKinds = new Set(units.map((u) => inferClaimKindFromPathAndText(sourcePath, u.sample || u.title, documentType)));
  const needsClaimLevelSplit = classification.fileClass === 'maintained-authority' && RETAINED_CLAIM_DISPOSITIONS.has(initialDisposition) && uniqueClaimKinds.size > 1;
  const proposedDisposition = needsClaimLevelSplit ? 'split' : initialDisposition;
  const proposedTargetOwner = targetOwnerForDisposition(proposedDisposition, classification);
  const hasCredibleOwner = proposedTargetOwner && hasSwitchboardBackedTarget(classification);
  const disposition = DISPOSITIONS_REQUIRING_TARGET_OWNER.has(proposedDisposition) && !hasCredibleOwner ? 'unknown-blocking' : proposedDisposition;
  const targetOwner = disposition === proposedDisposition ? proposedTargetOwner : null;
  const rationale = disposition === proposedDisposition ? proposeRationale(disposition, classification) : proposeRationale('unknown-blocking', classification);
  const links = extractLinks(content);
  const refs = extractRefs(content);
  const sourceDigest = sha256(content);
  const sourceId = makeSourceId(sourceDigest);
  const claimStatus = deriveClaimStatus(classification);
  const proposedClaimOwner = RETAINED_CLAIM_DISPOSITIONS.has(disposition) ? targetOwner : null;
  const claimDecisionRefs = refs.filter((r) => /^(D-ADR|ADR|STR|RUL|CTR)/.test(r));
  const claimEvidenceLinks = links.filter((l) => /proof|verify|evidence|receipt|test|history|reports/.test(l.toLowerCase()));
  const baseIdCounts = new Map();

  const claims = units.map((u) => {
    const kind = inferClaimKindFromPathAndText(sourcePath, u.sample || u.title, documentType);
    const baseClaimId = makeClaimBaseId({ sourceId, unitKind: u.unitKind, textDigest: u.textDigest, title: u.title, claimKind: kind, status: claimStatus });
    const duplicateOrdinal = baseIdCounts.get(baseClaimId) || 0;
    baseIdCounts.set(baseClaimId, duplicateOrdinal + 1);
    const claimId = duplicateOrdinal === 0 ? baseClaimId : `${baseClaimId}_dup_${stableHash(`${u.anchor}\n${duplicateOrdinal}`, 8)}`;
    const relations = duplicateOrdinal === 0 ? [] : [{ type: 'same-source-identical-content-duplicate', claimId: baseClaimId, duplicateOrdinal }];
    return {
      claimId,
      sourceId,
      sourcePath,
      sourceAnchor: u.anchor,
      sourceDigest,
      targetOwner: proposedClaimOwner,
      targetAnchor: proposedClaimOwner ? u.anchor : null,
      claimKind: kind,
      authorityKind: classification.authorityStatus,
      status: claimStatus,
      relations,
      decisionRefs: claimDecisionRefs,
      evidenceLinks: claimEvidenceLinks,
      disposition: needsClaimLevelSplit && disposition === proposedDisposition ? 'split' : disposition,
      reviewStatus: disposition === 'unknown-blocking' ? 'blocking' : 'pending',
    };
  });

  const _claimsById = new Map(claims.map((claim) => [claim.claimId, claim]));

  const row = {
    path: normalizePosix(relPath),
    sourceId,
    sourceDigest,
    blobSha,
    blobSize,
    area: classification.area,
    authorityStatus: classification.authorityStatus,
    fileClass: classification.fileClass,
    corpus: classification.corpus,
    switchboardSource: classification.switchboardSource,
    gap: classification.gap,
    documentType,
    claimKind,
    headingCount: headings.length,
    unheadedBlockCount: units.filter((u) => u.unitKind.startsWith('unheaded')).length,
    mixedFileBlockCount: units.filter((u) => u.unitKind === 'file-block').length,
    headings,
    links,
    decisionRefs: refs.filter((r) => /^(D-ADR|ADR|STR|RUL|CTR)/.test(r)),
    immutableRefs: refs.filter((r) => /^[a-f0-9]{7,40}$/.test(r) || /^tsk-/.test(r)),
    evidenceLinks: links.filter((l) => /proof|verify|evidence|receipt|test|history|reports/.test(l.toLowerCase())),
    consumerKinds: [...new Set(consumers.map((c) => c.kind))].sort(),
    consumerEdgeCount: consumers.length,
    consumerEdgeIds: [],
    claimCount: claims.length,
    claimIds: claims.map((c) => c.claimId),
    shippedContract: shippedContract ? {
      contractScope: shippedContract.contractScope,
      referenceKind: shippedContract.referenceKind,
      sourceRole: shippedContract.sourceRole,
      resolutionStatus: shippedContract.resolutionStatus,
      isSafeRewriteTarget: shippedContract.isSafeRewriteTarget,
    } : null,
    proposedDisposition: disposition,
    proposedTargetOwner: targetOwner,
    proposedRationale: rationale,
    _claimsById,
  };
  Object.defineProperty(row, 'claims', { value: claims, enumerable: false });
  return row;
}

export function parseLsTreeLong(output) {
  const entries = [];
  for (const line of output.split('\n')) {
    if (!line) continue;
    const tabIdx = line.indexOf('\t');
    if (tabIdx < 0) continue;
    const meta = line.slice(0, tabIdx).trim().split(/\s+/);
    const filePath = line.slice(tabIdx + 1);
    const [mode, type, sha, size] = meta;
    if (type !== 'blob') continue;
    entries.push({ path: filePath, mode, blobSha: sha, size: Number(size) });
  }
  return entries;
}

export function scanInScopeFiles(repoRoot, commitSha) {
  const out = execFileSync('git', ['ls-tree', '-r', '-l', commitSha], {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 60 * 1024 * 1024,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  const all = parseLsTreeLong(out);
  return all.filter((e) => {
    const norm = normalizePosix(e.path);
    if (ADDITIONAL_ROOT_FILES.includes(norm)) return true;
    return SCAN_ROOTS.some((root) => norm === root || norm.startsWith(root + '/'));
  });
}

export function loadSwitchboard(commitSha, repoRoot) {
  const raw = readBlobAtCommit(commitSha, `${PHASE_DIR}/transitional-switchboard.json`, repoRoot);
  return JSON.parse(raw);
}

export function buildSemanticConflictGroups(items) {
  const groups = new Map();
  for (const item of items) {
    const title = item.headings?.[0]?.text || path.posix.basename(item.path, path.posix.extname(item.path));
    const key = `${areaSlug(item.area)}:${slugText(title)}`;
    if (!key.endsWith(':')) groups.set(key, (groups.get(key) || []).concat(item.path));
  }
  return [...groups.entries()]
    .filter(([, paths]) => paths.length > 1)
    .map(([key, paths]) => ({ key, paths: [...paths].sort(), rationale: 'Same normalized area/title; requires semantic duplicate/conflict review before promotion.' }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

export function generateInventory(repoRoot = process.cwd(), options = {}) {
  const commit = options.commit;
  if (!commit || typeof commit !== 'string' || commit.trim() === '') throw new Error('Explicit commit/treeish is required for inventory generation (fail closed; cannot default to HEAD or working tree)');
  const commitSha = resolveCommitSha(commit, repoRoot);
  const switchboardIndex = buildSwitchboardIndex(loadSwitchboard(commitSha, repoRoot));
  const shippedIndex = buildShippedContractIndex(loadShippedPathInventory(commitSha, repoRoot));
  const files = scanInScopeFiles(repoRoot, commitSha).sort((a, b) => normalizePosix(a.path).localeCompare(normalizePosix(b.path)));
  const paths = files.map((f) => normalizePosix(f.path));
  const consumersByPath = collectConsumers(repoRoot, commitSha, paths, shippedIndex);
  const blobShaCounts = new Map();
  const items = [];

  for (const f of files) {
    const norm = normalizePosix(f.path);
    const content = readBlobAtCommit(commitSha, f.path, repoRoot);
    const row = buildInventoryRow(norm, {
      content,
      blobSha: f.blobSha,
      blobSize: f.size,
      switchboardIndex,
      shippedContract: shippedIndex.get(norm) || null,
      consumers: consumersByPath.get(norm) || [],
    });
    items.push(row);
    blobShaCounts.set(f.blobSha, (blobShaCounts.get(f.blobSha) || []).concat(row.path));
  }

  const duplicateContentGroups = [...blobShaCounts.entries()]
    .filter(([, pathsForSha]) => pathsForSha.length > 1)
    .map(([sha, pathsForSha]) => ({ blobSha: sha, paths: [...pathsForSha].sort() }))
    .sort((a, b) => a.blobSha.localeCompare(b.blobSha));
  const itemByPath = new Map(items.map((item) => [item.path, item]));
  for (const group of duplicateContentGroups) {
    const canonicalPath = group.paths[0];
    const canonical = itemByPath.get(canonicalPath);
    const canonicalClaimIds = canonical?.claimIds || [];
    for (const duplicatePath of group.paths) {
      const item = itemByPath.get(duplicatePath);
      if (!item) continue;
      const oldClaimIds = [...item.claimIds];
      const oldClaimsById = item._claimsById;
      const rewrittenIds = [];
      item._claimsById = new Map();
      for (const [idx, oldClaimId] of oldClaimIds.entries()) {
        const claim = oldClaimsById?.get(oldClaimId) || item.claims?.[idx];
        if (!claim) continue;
        const canonicalClaimId = canonicalClaimIds[idx] || oldClaimId;
        if (duplicatePath !== canonicalPath) claim.claimId = `${oldClaimId}_srcdup_${stableHash(duplicatePath, 8)}`;
        claim.relations.push({
          type: duplicatePath === canonicalPath ? 'duplicate-content-canonical' : 'duplicate-content-of',
          claimId: canonicalClaimId,
          sourceId: canonical?.sourceId || null,
          sourcePath: canonicalPath,
          blobSha: group.blobSha,
        });
        rewrittenIds.push(claim.claimId);
        item._claimsById.set(claim.claimId, claim);
      }
      item.claimIds = rewrittenIds;
      item.claimCount = rewrittenIds.length;
    }
  }
  const claimLedger = [];
  const consumerEdges = [];
  for (const item of items) {
    const consumers = consumersByPath.get(item.path) || [];
    item.consumerEdgeIds = consumers.map((consumer) => `consumer_${stableHash(`${item.path}\n${consumer.path}\n${consumer.line || ''}\n${consumer.kind}\n${consumer.contractScope || ''}`, 24)}`);
    for (const consumer of consumers) {
      const edgeId = `consumer_${stableHash(`${item.path}\n${consumer.path}\n${consumer.line || ''}\n${consumer.kind}\n${consumer.contractScope || ''}`, 24)}`;
      const { line, ...consumerWithoutLine } = consumer;
      consumerEdges.push({ edgeId, ...consumerWithoutLine });
    }
    for (const claimId of item.claimIds) {
      const claim = item._claimsById?.get(claimId);
      if (claim) claimLedger.push(claim);
    }
    delete item._claimsById;
  }
  const semanticConflictGroups = buildSemanticConflictGroups(items);

  const summary = {
    scannedFilesCount: items.length,
    claimCount: claimLedger.length,
    byCorpus: {},
    byAuthorityStatus: {},
    byFileClass: {},
    byProposedDisposition: {},
    byConsumerKind: {},
    gapCount: items.filter((i) => i.gap).length,
    duplicateContentGroupCount: duplicateContentGroups.length,
    semanticConflictGroupCount: semanticConflictGroups.length,
    headingTotalCount: items.reduce((n, i) => n + i.headingCount, 0),
    unheadedBlockTotalCount: items.reduce((n, i) => n + i.unheadedBlockCount, 0),
    mixedFileBlockTotalCount: items.reduce((n, i) => n + i.mixedFileBlockCount, 0),
  };
  for (const i of items) {
    summary.byCorpus[i.corpus] = (summary.byCorpus[i.corpus] || 0) + 1;
    summary.byAuthorityStatus[i.authorityStatus] = (summary.byAuthorityStatus[i.authorityStatus] || 0) + 1;
    summary.byFileClass[i.fileClass] = (summary.byFileClass[i.fileClass] || 0) + 1;
    summary.byProposedDisposition[i.proposedDisposition] = (summary.byProposedDisposition[i.proposedDisposition] || 0) + 1;
    for (const k of i.consumerKinds) summary.byConsumerKind[k] = (summary.byConsumerKind[k] || 0) + 1;
  }

  return {
    $schema: 'https://forgent.dev/schemas/doc-inventory.v3.json',
    version: 3,
    generatedAt: new Date(0).toISOString(),
    phase: '02',
    description: 'Repository-wide documentation inventory and conservation ledger (Phase 02 file-level and claim-level accounting)',
    commit: commitSha,
    scanRoots: SCAN_ROOTS,
    additionalRootFiles: ADDITIONAL_ROOT_FILES,
    summary,
    duplicateContentGroups,
    semanticConflictGroups,
    claimLedger,
    consumerEdges,
    items,
  };
}

export function generateMarkdownReport(inventory) {
  const lines = [];
  lines.push('# Repository-Wide Documentation Inventory And Conservation Ledger (Phase 02)');
  lines.push('');
  lines.push('```txt');
  lines.push('Document type: Inventory');
  lines.push('Audience: Architect, maintainer, reviewer, agent');
  lines.push('Purpose: Account for the real documentation corpus before deciding migration mechanics (plan.md Phase 02)');
  lines.push('Design status: Draft (Phase 02, pending independent review)');
  lines.push('Phase: 02 Deliverable');
  lines.push('Related:');
  lines.push('- `plans/260925-documentation-authority-unification/phase-02-doc-inventory.json`');
  lines.push('- `plans/260925-documentation-authority-unification/plan.md` §7 Phase 02');
  lines.push('```');
  lines.push('');
  lines.push(`- **Commit:** \`${inventory.commit}\``);
  lines.push(`- **Files scanned:** ${inventory.summary.scannedFilesCount}`);
  lines.push(`- **Claim rows:** ${inventory.summary.claimCount}`);
  lines.push(`- **Headings / unheaded blocks / mixed-file blocks:** ${inventory.summary.headingTotalCount} / ${inventory.summary.unheadedBlockTotalCount} / ${inventory.summary.mixedFileBlockTotalCount}`);
  lines.push(`- **Gaps:** ${inventory.summary.gapCount}`);
  lines.push(`- **Exact duplicate-content groups:** ${inventory.summary.duplicateContentGroupCount}`);
  lines.push(`- **Semantic conflict groups:** ${inventory.summary.semanticConflictGroupCount}`);
  lines.push('');
  lines.push('## Summary By Dimension');
  lines.push('');
  for (const [dim, obj] of [['Corpus', inventory.summary.byCorpus], ['Authority Status', inventory.summary.byAuthorityStatus], ['File Class', inventory.summary.byFileClass], ['Proposed Disposition', inventory.summary.byProposedDisposition], ['Consumer Kind', inventory.summary.byConsumerKind]]) {
    lines.push(`### ${dim}`);
    lines.push('');
    lines.push('| Value | Count |');
    lines.push('|---|---:|');
    for (const [k, v] of Object.entries(obj).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))) lines.push(`| \`${k}\` | ${v} |`);
    lines.push('');
  }
  lines.push('## Duplicate And Conflict Findings');
  lines.push('');
  if (inventory.duplicateContentGroups.length === 0) lines.push('- No exact git-blob duplicate groups found.');
  for (const g of inventory.duplicateContentGroups) lines.push(`- Exact \`${g.blobSha}\`: ${g.paths.map((p) => `\`${p}\``).join(', ')}`);
  for (const g of inventory.semanticConflictGroups.slice(0, 200)) lines.push(`- Semantic \`${g.key}\`: ${g.paths.map((p) => `\`${p}\``).join(', ')}`);
  lines.push('');
  lines.push('## Gaps (Not Yet Area-Assigned)');
  lines.push('');
  lines.push('| Path | Area | Authority Status | File Class | Proposed owner |');
  lines.push('|---|---|---|---|---|');
  for (const item of inventory.items.filter((i) => i.gap)) lines.push(`| \`${item.path}\` | ${item.area} | \`${item.authorityStatus}\` | \`${item.fileClass}\` | ${item.proposedTargetOwner ? `\`${item.proposedTargetOwner}\`` : ''} |`);
  lines.push('');
  lines.push('## Claim Ledger Sample (first 500 rows)');
  lines.push('');
  lines.push('| Claim | Source | Anchor | Kind | Disposition | Target owner |');
  lines.push('|---|---|---|---|---|---|');
  for (const c of inventory.claimLedger.slice(0, 500)) lines.push(`| \`${c.claimId}\` | \`${c.sourcePath}\` | \`${c.sourceAnchor}\` | \`${c.claimKind}\` | \`${c.disposition}\` | ${c.targetOwner ? `\`${c.targetOwner}\`` : ''} |`);
  return lines.join('\n') + '\n';
}

export function runCli(argv, cwd = process.cwd()) {
  const commitFlagIdx = argv.indexOf('--commit');
  const commit = commitFlagIdx >= 0 ? argv[commitFlagIdx + 1] : null;
  if (!commit || commit.startsWith('-')) {
    console.error('Error: --commit <commit-or-treeish> is required (fail closed; cannot default to HEAD or working tree)');
    return 1;
  }
  let inventory;
  try { inventory = generateInventory(cwd, { commit }); } catch (err) { console.error(`Error: ${err.message}`); return 1; }
  const jsonOutIdx = argv.indexOf('--json-out');
  const mdOutIdx = argv.indexOf('--md-out');
  const jsonOut = jsonOutIdx >= 0 ? path.resolve(cwd, argv[jsonOutIdx + 1]) : null;
  const mdOut = mdOutIdx >= 0 ? path.resolve(cwd, argv[mdOutIdx + 1]) : null;
  if (jsonOut) { fs.mkdirSync(path.dirname(jsonOut), { recursive: true }); fs.writeFileSync(jsonOut, JSON.stringify(inventory) + '\n'); console.log(`generate-doc-inventory: wrote JSON inventory to ${path.relative(cwd, jsonOut)}`); }
  if (mdOut) { fs.mkdirSync(path.dirname(mdOut), { recursive: true }); fs.writeFileSync(mdOut, generateMarkdownReport(inventory)); console.log(`generate-doc-inventory: wrote Markdown report to ${path.relative(cwd, mdOut)}`); }
  if (!jsonOut && !mdOut) console.log(JSON.stringify(inventory, null, 2));
  return 0;
}

if (isMainModule(import.meta.url)) process.exitCode = runCli(process.argv.slice(2), process.cwd());
