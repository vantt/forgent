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
import { execFileSync, spawnSync } from 'node:child_process';
import { isMainModule } from './lib/is-main-module.mjs';
import { writeShardedJsonArtifact } from './doc-inventory-artifact.mjs';
import {
  resolveCommitSha,
  readBlobAtCommit,
  normalizePosix,
} from './generate-shipped-path-inventory.mjs';
import { classifyFile as classifyLegacyRootFile } from './check-legacy-docs-ratchet.mjs';

export const SCAN_ROOTS = ['docs'];
export const ADDITIONAL_ROOT_FILES = ['AGENTS.md', 'CLAUDE.md'];
export const PHASE_DIR = 'plans/260925-documentation-authority-unification';
// Saved inventory artifacts live under the plan's reports/ directory. The
// manifest, its Markdown report and the identity registry are committed; the
// shards (`<name>.parts/`, layout owned by doc-inventory-artifact.mjs) are not.
// The first generation's phase-02 names stay recognised as generator output.
export const INVENTORY_MANIFEST_PATH = `${PHASE_DIR}/reports/doc-inventory.json`;
export const IDENTITY_REGISTRY_PATH = `${PHASE_DIR}/reports/identity-registry.json`;
const LEGACY_INVENTORY_MANIFEST_PATH = `${PHASE_DIR}/reports/phase-02-doc-inventory.json`;
const LEGACY_IDENTITY_REGISTRY_PATH = `${PHASE_DIR}/reports/phase-02-identity-registry.json`;
const OUTPUT_MANIFEST_PATHS = [INVENTORY_MANIFEST_PATH, LEGACY_INVENTORY_MANIFEST_PATH];
const OUTPUT_REPORT_PATHS = OUTPUT_MANIFEST_PATHS.map((p) => p.replace(/\.json$/, '.md'));
const OUTPUT_PARTS_PREFIXES = OUTPUT_MANIFEST_PATHS.map((p) => `${p.replace(/\.json$/, '')}.parts/`);
const OUTPUT_REGISTRY_PATHS = [IDENTITY_REGISTRY_PATH, LEGACY_IDENTITY_REGISTRY_PATH];

function stableHash(input, len = 16) {
  return crypto.createHash('sha256').update(String(input)).digest('hex').slice(0, len);
}

function sha256(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

function sha256Bytes(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

function randomOpaqueId(prefix, bytes = 16) {
  return `${prefix}_${crypto.randomBytes(bytes).toString('hex')}`;
}

function readBlobBufferAtCommit(commitSha, fileRel, repoRoot = process.cwd()) {
  return execFileSync('git', ['show', `${commitSha}:${fileRel}`], {
    cwd: repoRoot,
    encoding: 'buffer',
    maxBuffer: 20 * 1024 * 1024,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
}

function decodeUtf8(buffer) {
  return Buffer.isBuffer(buffer) ? buffer.toString('utf8') : String(buffer);
}

function slugText(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[`*_~]/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-');
}

export function githubSlugText(text) {
  return String(text || '')
    .trim()
    .toLowerCase()
    .replace(/<[^>]*>/g, '')
    .replace(/[`*~]/g, '')
    .replace(/[^\p{L}\p{N}_\s -]/gu, '')
    .trim()
    .replace(/\s+/g, '-');
}

export function slugifyHeading(text) {
  return githubSlugText(text);
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

function isTargetTopologyPath(value) {
  return typeof value === 'string' && normalizePosix(value).startsWith('docs/platform/');
}

function deriveAreaTargetOwner(area) {
  return firstPresent(
    isTargetTopologyPath(area.entryPoint) ? concreteRoute(area.entryPoint) : null,
    isTargetTopologyPath(area.canonicalRoute) ? concreteRoute(area.canonicalRoute) : null,
    Array.isArray(area.canonicalRoutes) ? concreteRoute(area.canonicalRoutes.find(isTargetTopologyPath)) : null,
  );
}

function hasSwitchboardBackedTarget(classification) {
  return Boolean(classification.proposedTargetOwner && isTargetTopologyPath(classification.proposedTargetOwner) && ['scopedRoute', 'corpusRoot'].includes(classification.switchboardSource));
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

function buildUnitIdentityDigest(unit) {
  return sha256(`${unit.unitKind}\n${unit.textDigest}`);
}

function readIdentityRegistryPath(registryPath, repoRoot = process.cwd()) {
  if (!registryPath || typeof registryPath !== 'string') throw new Error('--identity-registry <path> is required for inventory generation (explicit pinned registry; no fallback)');
  const resolved = path.isAbsolute(registryPath) ? registryPath : path.resolve(repoRoot, registryPath);
  let raw;
  try { raw = fs.readFileSync(resolved); }
  catch (err) { throw new Error(`Unable to read identity registry ${registryPath}: ${err.message}`); }
  try {
    const registry = JSON.parse(raw.toString('utf8'));
    registry._binding = { path: normalizePosix(path.relative(repoRoot, resolved) || resolved), bytes: raw.length, sha256: sha256Bytes(raw) };
    return registry;
  } catch (err) { throw new Error(`Unable to parse identity registry ${registryPath}: ${err.message}`); }
}

// Registry identity depends only on the in-scope documents and the switchboard
// that classifies them, so a registry stays bound to every later commit whose
// tree is identical for those paths (committing the registry itself changes
// neither).
export function identityScopePathspec() {
  return [...SCAN_ROOTS, ...ADDITIONAL_ROOT_FILES, `${PHASE_DIR}/transitional-switchboard.json`];
}

export function registryBindsToCommit(registryCommit, commitSha, repoRoot = process.cwd()) {
  if (!registryCommit || typeof registryCommit !== 'string') return false;
  if (registryCommit === commitSha) return true;
  const result = spawnSync('git', ['diff', '--quiet', registryCommit, commitSha, '--', ...identityScopePathspec()], { cwd: repoRoot, stdio: 'ignore' });
  return result.status === 0;
}

export function buildIdentityRegistryIndex(registry = {}) {
  const docByPath = new Map();
  const docConflictsByPath = new Map();
  const unitsByDigest = new Map();
  const unitsByFingerprint = new Map();
  for (const doc of registry.documents || []) {
    if (!doc?.path || !doc?.sourceId) continue;
    const p = normalizePosix(doc.path);
    if (docByPath.has(p) && docByPath.get(p) !== doc.sourceId) docConflictsByPath.set(p, [...new Set([docByPath.get(p), doc.sourceId])]);
    else docByPath.set(p, doc.sourceId);
  }
  for (const unit of registry.units || []) {
    if (!unit?.unitDigest || !unit?.claimId) continue;
    const normalized = { ...unit, sourcePath: unit.sourcePath ? normalizePosix(unit.sourcePath) : null };
    const arr = unitsByDigest.get(unit.unitDigest) || [];
    arr.push(normalized);
    unitsByDigest.set(unit.unitDigest, arr);
    if (unit.identityFingerprint) {
      const fpArr = unitsByFingerprint.get(unit.identityFingerprint) || [];
      fpArr.push(normalized);
      unitsByFingerprint.set(unit.identityFingerprint, fpArr);
    }
  }
  return { docByPath, docConflictsByPath, unitsByDigest, unitsByFingerprint };
}

function explicitIdentityGapId(prefix, seed, len = 24) {
  return `${prefix}_identity_gap_${stableHash(seed, len)}`;
}

function resolveRegisteredSourceId(identityIndex, sourcePath) {
  const p = normalizePosix(sourcePath);
  if (identityIndex?.docConflictsByPath?.has(p)) return { sourceId: null, identityStatus: 'ambiguous-source-registry-gap' };
  const sourceId = identityIndex?.docByPath?.get(p) || null;
  return sourceId ? { sourceId, identityStatus: 'carried-forward' } : { sourceId: null, identityStatus: 'missing-source-registry-gap' };
}

function resolveRegisteredClaimId(identityIndex, unitDigest, sourcePath = null, sourceAnchor = null, identityFingerprint = null) {
  const p = sourcePath ? normalizePosix(sourcePath) : null;
  const matchSets = [];
  if (identityFingerprint) matchSets.push(identityIndex?.unitsByFingerprint?.get(identityFingerprint) || []);
  matchSets.push(identityIndex?.unitsByDigest?.get(unitDigest) || []);
  let sawAmbiguous = false;
  for (const matches of matchSets) {
    if (matches.length === 0) continue;
    const pathMatches = p ? matches.filter((m) => normalizePosix(m.sourcePath || '') === p) : matches;
    const pathIds = [...new Set(pathMatches.map((m) => m.claimId).filter(Boolean))];
    if (pathIds.length === 1) return { claimId: pathIds[0], identityStatus: 'carried-forward' };
    if (pathIds.length > 1) {
      // Duplicates resolve by anchor only when the registry holds exactly one
      // row for this path, digest and anchor; rows minted from an unresolved
      // ambiguity stay ambiguous.
      const anchorIds = sourceAnchor ? [...new Set(pathMatches.filter((m) => m.sourceAnchor === sourceAnchor && !m.identityNote).map((m) => m.claimId).filter(Boolean))] : [];
      if (anchorIds.length === 1 && pathMatches.filter((m) => m.sourceAnchor === sourceAnchor).length === 1) return { claimId: anchorIds[0], identityStatus: 'carried-forward' };
      sawAmbiguous = true;
      continue;
    }
    const claimIds = [...new Set(matches.map((m) => m.claimId).filter(Boolean))];
    if (claimIds.length > 0) sawAmbiguous = true;
  }
  return { claimId: null, identityStatus: sawAmbiguous ? 'ambiguous-registry-gap' : 'missing-registry-gap' };
}

/** Builds exact-route and longest-prefix lookup from the Phase 01 switchboard. */
export function buildSwitchboardIndex(switchboard) {
  const exact = new Map();
  const prefixes = [];
  const routeConflicts = new Map();

  function addRouteConflict(route, existing, incoming) {
    const norm = normalizePosix(route);
    const arr = routeConflicts.get(norm) || [];
    if (arr.length === 0 && existing) arr.push(existing);
    arr.push(incoming);
    routeConflicts.set(norm, arr);
  }

  function addExact(pathStr, entry) {
    if (!pathStr || typeof pathStr !== 'string' || pathStr.includes('<')) return;
    const norm = normalizePosix(pathStr);
    if (exact.has(norm)) addRouteConflict(norm, exact.get(norm), entry);
    exact.set(norm, exact.get(norm) || entry);
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

  prefixes.sort((a, b) => b.prefix.length - a.prefix.length || a.prefix.localeCompare(b.prefix));
  return { exact, prefixes, routeConflicts };
}

export function lookupSwitchboard(index, relPath) {
  const norm = normalizePosix(relPath);
  if (index.routeConflicts?.has(norm)) return { ...index.exact.get(norm), routeConflict: index.routeConflicts.get(norm) };
  if (index.exact.has(norm)) return index.exact.get(norm);
  const matches = [];
  for (const { prefix, entry } of index.prefixes) {
    if (norm === prefix || norm.startsWith(prefix + '/')) matches.push({ prefix, entry });
  }
  if (matches.length === 0) return null;
  const maxLen = matches[0].prefix.length;
  const tied = matches.filter((m) => m.prefix.length === maxLen);
  if (tied.length > 1) return { ...tied[0].entry, routeConflict: tied.map((m) => m.entry) };
  return tied[0].entry;
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
      gap: Boolean(sb.routeConflict),
      gapType: sb.routeConflict ? 'route-conflict' : null,
      routeConflict: sb.routeConflict || null,
      proposedTargetOwner: sb.routeConflict ? null : (sb.proposedTargetOwner || null),
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
  if (authorityStatus === 'candidate') return 'unknown-blocking';
  if (fileClass === 'maintained-authority') return 'merge';
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

const DISPOSITIONS_REQUIRING_TARGET_OWNER = new Set(['promote', 'move', 'merge', 'split', 'extract', 'redirect', 'supersede', 'partial-carry', 'delete-as-duplicate', 'defer-with-owner']);
const RETAINED_CLAIM_DISPOSITIONS = new Set(['promote', 'move', 'merge', 'split', 'extract', 'redirect', 'supersede', 'partial-carry', 'delete-as-duplicate', 'defer-with-owner']);

function targetOwnerForDisposition(disposition, classification) {
  if (!DISPOSITIONS_REQUIRING_TARGET_OWNER.has(disposition)) return null;
  return classification.proposedTargetOwner ? normalizePosix(classification.proposedTargetOwner) : null;
}

function isNormativeUnheaded(raw) {
  return /\b(MUST|MUST NOT|SHOULD|SHALL|NEVER|ALWAYS|REQUIRED|FORBIDDEN|Không được|không được|phải|Luật|Rule|Invariant|Blocked when|Runs when|What changes)\b/.test(raw);
}

export function extractMarkdownConservationUnits(content) {
  const lines = content.split(/\r?\n/);
  const ordered = [];
  const seenAnchors = new Map();
  let inFence = false;
  let fenceMarker = null;
  let unheaded = [];
  let unheadedStart = 1;
  let headingCount = 0;

  // A block shorter than 20 non-space characters without a normative keyword is not a unit of its
  // own: a label ending in a colon is merged into the block it introduces (the next one of the
  // section), any other short block into the previous block of the section (or the next one when
  // it comes first), so no non-blank line of the source is outside every unit. It becomes its own unit only
  // when its section has no other block.
  function flushUnheaded(endLine) {
    const raw = unheaded.join('\n').trim();
    unheaded = [];
    if (!raw) return;
    const short = raw.replace(/\s+/g, '').length < 20 && !isNormativeUnheaded(raw);
    ordered.push({ block: true, short, section: headingCount, preamble: headingCount === 0, startLine: unheadedStart, originalStart: unheadedStart, endLine });
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
        fenceMarker = fenceMatch[1];
      } else if (fenceMatch[1][0] === fenceMarker[0] && fenceMatch[1].length >= fenceMarker.length) {
        inFence = false;
        fenceMarker = null;
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
      const githubBase = githubSlugText(title) || 'section';
      const count = seenAnchors.get(githubBase) || 0;
      seenAnchors.set(githubBase, count + 1);
      const githubAnchor = count > 0 ? `${githubBase}-${count}` : githubBase;
      const stableAnchor = `h-${stableHash(`${title}\n${lineNo}`, 12)}`;
      ordered.push({ unit: { unitKind: 'heading', level, title, anchor: githubAnchor, githubAnchor, stableAnchor, startLine: lineNo, endLine: lineNo, textDigest: sha256(title), sample: title } });
      headingCount += 1;
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

  const blocks = ordered.filter((o) => o.block);
  const kept = [];
  for (const b of blocks) {
    if (!b.short) { kept.push(b); continue; }
    const label = /:\s*$/.test(lines.slice(b.startLine - 1, b.endLine).join('\n').trim());
    const next = blocks.find((k) => k.section === b.section && !k.short && k.originalStart > b.endLine);
    if (label && next) { next.startLine = Math.min(next.startLine, b.startLine); continue; }
    const previous = [...kept].reverse().find((k) => k.section === b.section);
    if (previous) { previous.endLine = b.endLine; continue; }
    if (next) { next.startLine = Math.min(next.startLine, b.startLine); continue; }
    kept.push(b);
  }
  const keptSet = new Set(kept);
  const units = [];
  let unheadedCount = 0;
  for (const o of ordered) {
    if (!o.block) { units.push(o.unit); continue; }
    if (!keptSet.has(o)) continue;
    const raw = lines.slice(o.startLine - 1, o.endLine).join('\n').trim();
    unheadedCount += 1;
    const anchor = `unheaded-block-${unheadedCount}`;
    units.push({
      unitKind: o.preamble ? 'unheaded-preamble' : 'unheaded-block',
      anchor,
      githubAnchor: anchor,
      stableAnchor: anchor,
      title: o.preamble ? 'Unheaded preamble' : `Unheaded block ${unheadedCount}`,
      startLine: o.startLine,
      endLine: o.endLine,
      textDigest: sha256(raw),
      sample: raw.slice(0, 180),
    });
  }

  const headingIndexes = units.map((u, idx) => u.unitKind === 'heading' ? idx : -1).filter((idx) => idx >= 0);
  for (let hIdx = 0; hIdx < headingIndexes.length; hIdx += 1) {
    const idx = headingIndexes[hIdx];
    const unit = units[idx];
    const nextHeading = headingIndexes[hIdx + 1] != null ? units[headingIndexes[hIdx + 1]] : null;
    const sectionEnd = nextHeading ? nextHeading.startLine - 1 : lines.length;
    const payload = lines.slice(unit.startLine, sectionEnd).join('\n').trim();
    const following = units[idx + 1] && units[idx + 1].unitKind !== 'heading' ? units[idx + 1].textDigest : '';
    const sectionPayloadDigest = sha256(payload);
    unit.sectionPayloadDigest = sectionPayloadDigest;
    unit.followingBlockDigest = following || null;
    unit.textDigest = sha256(`heading\n${unit.level}\n${unit.title}\n${sectionPayloadDigest}\n${following || ''}`);
    unit.identityFingerprint = sha256(`heading\n${unit.level}\n${slugText(unit.title)}\n${sectionPayloadDigest}\n${following || ''}`);
  }
  for (const unit of units) {
    if (!unit.identityFingerprint) unit.identityFingerprint = sha256(`${unit.unitKind}\n${unit.textDigest}`);
  }
  return units;
}

export function extractMixedFileConservationUnit(relPath, content) {
  return [{
    unitKind: 'file-block',
    anchor: 'file-block',
    githubAnchor: 'file-block',
    stableAnchor: 'file-block',
    title: path.posix.basename(normalizePosix(relPath)),
    startLine: 1,
    endLine: content.split(/\r?\n/).length,
    textDigest: sha256(content),
    identityFingerprint: sha256(`file-block\n${sha256(content)}`),
    sample: content.slice(0, 180),
  }];
}

export function normalizeDocTarget(rawTarget, sourcePath = '') {
  if (!rawTarget || typeof rawTarget !== 'string') return null;
  let raw = rawTarget.trim().replace(/^<|>$/g, '');
  if (!raw || /^(https?:|mailto:|#)/i.test(raw)) return null;
  raw = raw.split(/[?#]/)[0];
  if (!raw) return null;
  const baseDir = path.posix.dirname(normalizePosix(sourcePath || ''));
  const resolved = raw.startsWith('/')
    ? normalizePosix(raw.slice(1))
    : (raw.startsWith('./') || raw.startsWith('../'))
      ? normalizePosix(path.posix.normalize(path.posix.join(baseDir, raw)))
      : normalizePosix(raw);
  return resolved.replace(/\/$/, '');
}

export function extractLinks(content, sourcePath = '') {
  const links = [];
  const markdown = /(?<!!)\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  let m;
  while ((m = markdown.exec(content)) !== null) {
    const raw = m[1].trim();
    links.push({ raw, targetPath: normalizeDocTarget(raw, sourcePath), kind: raw.startsWith('.') ? 'markdown-relative' : 'markdown' });
  }
  const bare = /(?:^|[\s"'`(<\[])(((?:docs|plans|scripts|src|test|core|domains|plugins|\.agents|\.fgos)\/[A-Za-z0-9_.\/*-]+)(?:#[A-Za-z0-9_.\/-]+)?)/g;
  while ((m = bare.exec(content)) !== null) {
    const raw = m[1].trim().replace(/[),.;:]+$/, '');
    links.push({ raw, targetPath: normalizeDocTarget(raw, sourcePath), kind: raw.includes('*') ? 'glob' : 'bare' });
  }
  const byKey = new Map();
  for (const link of links) byKey.set(`${link.raw}\n${link.targetPath || ''}\n${link.kind}`, link);
  return [...byKey.values()].sort((a, b) => (a.targetPath || a.raw).localeCompare(b.targetPath || b.raw) || a.raw.localeCompare(b.raw));
}

export function extractRefs(content) {
  const refs = new Set();
  const patterns = [
    /\bD-ADR\d{4}\b/g,
    /(?<!D-)\bADR-?\d{3,4}\b/g,
    /\bSTR\d+[A-Za-z0-9-]*\b/g,
    /\btsk-[a-z0-9]+(?:-[a-z0-9]+)*\b/g,
    /\bRUL\d+\b/g,
    /\bCTR\d+\b/g,
    /\b(?=[a-f0-9]{7,40}\b)(?=[a-f0-9]*[a-f])[a-f0-9]{7,40}\b/g,
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(content)) !== null) refs.add(m[0]);
  }
  return [...refs].sort();
}

function hasMeaningfulGlobSyntax(line) {
  const stripped = String(line).replace(/\*\*[^*]+\*\*/g, '');
  return /(^|[\s"'`=:([])[A-Za-z0-9_./-]*\*{1,2}[A-Za-z0-9_./*-]*/.test(stripped) || /\b(glob|pathspec|minimatch)\b/i.test(stripped);
}

export function classifyConsumerKind(refFile, line = '') {
  const f = normalizePosix(refFile).toLowerCase();
  const l = String(line).toLowerCase();
  if (f.includes('/fixtures/') || f.includes('fixture') || l.includes('fixture')) return 'fixture';
  if (f.startsWith('test/') || /\b(proof|verify|receipt|assert|node --test|npm test)\b/.test(l)) return 'executable-proof';
  if (hasMeaningfulGlobSyntax(line)) return 'glob';
  if (/\$\{|<[^>]+>|\bdynamic\b|join\(|resolve\(|path\.join|path\.resolve/.test(line)) return 'dynamic';
  return 'literal';
}

function isTextPath(p) {
  return /\.(md|ts|tsx|js|mjs|cjs|py|rs|sh|jsonl|json|yaml|yml|toml|txt|log)$/i.test(p);
}

// Saved generator output is never an input: reading it back would feed the
// previous run's artifacts (hundreds of MB) into the consumer scan.
export function isGeneratorOutputArtifact(filePath) {
  const norm = normalizePosix(filePath);
  return OUTPUT_MANIFEST_PATHS.includes(norm)
    || OUTPUT_REPORT_PATHS.includes(norm)
    || OUTPUT_REGISTRY_PATHS.includes(norm)
    || OUTPUT_PARTS_PREFIXES.some((prefix) => norm.startsWith(prefix));
}

// Every blob in the commit tree except the generator's own saved output.
export function listCommitEntries(repoRoot, commitSha) {
  const out = execFileSync('git', ['ls-tree', '-r', '-l', commitSha], {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 60 * 1024 * 1024,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  return parseLsTreeLong(out).filter((e) => !isGeneratorOutputArtifact(e.path));
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

function pathSegmentTokenRegex(fileName) {
  const escaped = fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp('(^|[^A-Za-z0-9_./-])' + escaped + '($|[^A-Za-z0-9_./-])');
}

function globToRegExp(glob) {
  const escaped = normalizePosix(glob).replace(/[.+^${}()|[\]\\]/g, '\\$&');
  const pattern = escaped.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*');
  return new RegExp(`^${pattern}$`);
}

function addUnique(map, target, edge) {
  if (!map.has(target)) return;
  map.get(target).push(edge);
}

export function collectConsumers(repoRoot, commitSha, targetPaths, shippedIndex = new Map(), options = {}) {
  const normalizedTargets = targetPaths.map(normalizePosix).sort();
  const targetSet = new Set(normalizedTargets);
  const stemToTargets = new Map();
  const targetRefs = options.targetRefs || new Map();
  const immutableSourcesByRef = new Map();
  const refToTargets = new Map();
  for (const [target, refs] of targetRefs.entries()) {
    for (const ref of refs || []) refToTargets.set(ref, (refToTargets.get(ref) || []).concat(target));
  }
  for (const target of normalizedTargets) {
    if (target.endsWith('.md')) {
      const stem = target.replace(/\.md$/, '');
      stemToTargets.set(stem, (stemToTargets.get(stem) || []).concat(target));
    }
  }
  const consumersByPath = new Map(normalizedTargets.map((p) => [p, []]));
  const scanGaps = [];
  const unresolvedConsumerEdges = [];
  const allEntries = listCommitEntries(repoRoot, commitSha);
  const allPaths = allEntries.map((e) => normalizePosix(e.path)).filter(isTextPath).sort();
  const sizeByPath = new Map(allEntries.map((e) => [normalizePosix(e.path), e.size]));
  const pathToken = /(?:^|[\s"'`(<\[])(((?:docs|plans|scripts|src|test|core|domains|plugins|\.agents|\.fgos)\/[A-Za-z0-9_.\/*-]+)(?:#[A-Za-z0-9_.\/-]+)?)/g;

  function add(target, file, lineNo, kind, extra = {}) {
    addUnique(consumersByPath, target, { path: file, line: lineNo, kind, ...extra });
  }

  function addUnresolved(file, lineNo, kind, pattern, extra = {}) {
    unresolvedConsumerEdges.push({
      edgeId: `consumer_unresolved_${stableHash(`${file}\n${lineNo || ''}\n${kind}\n${pattern}\n${extra.rawTarget || ''}`, 24)}`,
      path: file,
      line: lineNo,
      kind,
      unresolvedDynamicPattern: pattern,
      targetPath: pattern,
      identityStatus: 'unresolved-dynamic-pattern',
      ...extra,
    });
  }

  function lineNumberAt(content, offset) {
    return content.slice(0, offset).split(/\r?\n/).length;
  }

  function parseCallArguments(src) {
    const args = [];
    let start = 0;
    let depth = 0;
    let quote = null;
    let lineComment = false;
    let blockComment = false;
    function pushArg(end) {
      const raw = src.slice(start, end).trim();
      if (!raw) return;
      const q = raw[0];
      const literal = (q === '"' || q === "'" || q === '`') && raw[raw.length - 1] === q && !(q === '`' && /\$\{/.test(raw));
      args.push({ literal, value: literal ? raw.slice(1, -1) : raw });
    }
    for (let idx = 0; idx < src.length; idx += 1) {
      const ch = src[idx];
      const next = src[idx + 1];
      if (lineComment) { if (ch === '\n') lineComment = false; continue; }
      if (blockComment) { if (ch === '*' && next === '/') { blockComment = false; idx += 1; } continue; }
      if (quote) {
        if (ch === '\\') { idx += 1; continue; }
        if (ch === quote) quote = null;
        continue;
      }
      if (ch === '/' && next === '/') { lineComment = true; idx += 1; continue; }
      if (ch === '/' && next === '*') { blockComment = true; idx += 1; continue; }
      if (ch === '"' || ch === "'" || ch === '`') { quote = ch; continue; }
      if (ch === '(' || ch === '[' || ch === '{') { depth += 1; continue; }
      if (ch === ')' || ch === ']' || ch === '}') { depth = Math.max(0, depth - 1); continue; }
      if (ch === ',' && depth === 0) {
        pushArg(idx);
        start = idx + 1;
      }
    }
    pushArg(src.length);
    return args;
  }

  function findDynamicCalls(content) {
    const calls = [];
    const callees = ['path.join', 'path.resolve', 'new URL'];
    let quote = null;
    let lineComment = false;
    let blockComment = false;
    for (let idx = 0; idx < content.length; idx += 1) {
      const ch = content[idx];
      const next = content[idx + 1];
      if (lineComment) { if (ch === '\n') lineComment = false; continue; }
      if (blockComment) { if (ch === '*' && next === '/') { blockComment = false; idx += 1; } continue; }
      if (quote) {
        if (ch === '\\') { idx += 1; continue; }
        if (ch === quote) quote = null;
        continue;
      }
      if (ch === '/' && next === '/') { lineComment = true; idx += 1; continue; }
      if (ch === '/' && next === '*') { blockComment = true; idx += 1; continue; }
      if (ch === '"' || ch === "'" || ch === '`') { quote = ch; continue; }
      const callee = callees.find((c) => content.startsWith(c, idx));
      if (!callee) continue;
      let open = idx + callee.length;
      while (/\s/.test(content[open] || '')) open += 1;
      if (content[open] !== '(') continue;
      let depth = 1;
      let end = open + 1;
      let innerQuote = null;
      let innerLineComment = false;
      let innerBlockComment = false;
      for (; end < content.length; end += 1) {
        const c = content[end];
        const n = content[end + 1];
        if (innerLineComment) { if (c === '\n') innerLineComment = false; continue; }
        if (innerBlockComment) { if (c === '*' && n === '/') { innerBlockComment = false; end += 1; } continue; }
        if (innerQuote) {
          if (c === '\\') { end += 1; continue; }
          if (c === innerQuote) innerQuote = null;
          continue;
        }
        if (c === '/' && n === '/') { innerLineComment = true; end += 1; continue; }
        if (c === '/' && n === '*') { innerBlockComment = true; end += 1; continue; }
        if (c === '"' || c === "'" || c === '`') { innerQuote = c; continue; }
        if (c === '(') depth += 1;
        else if (c === ')') {
          depth -= 1;
          if (depth === 0) break;
        }
      }
      if (depth === 0) calls.push({ callee, start: idx, end: end + 1, argsSource: content.slice(open + 1, end), raw: content.slice(idx, end + 1) });
    }
    return calls;
  }

  function collapseGlobStars(pattern) {
    const parts = normalizePosix(pattern).split('/');
    const collapsed = [];
    for (const part of parts) {
      if (part === '**' && collapsed[collapsed.length - 1] === '**') continue;
      collapsed.push(part);
    }
    return collapsed.join('/').replace(/\/\*\*(?=\/\*\*|$)/g, '/**');
  }

  function dynamicPatternFromArgs(args, sourceFile, newUrl = false) {
    const roots = new Set(['docs', 'plans', 'scripts', 'src', 'test', 'core', 'domains', 'plugins', '.agents', '.fgos']);
    const rawSegs = args.map((arg, idx) => {
      if (newUrl && idx === 1 && /^import\.meta\.url$/.test(arg.value)) return '';
      if (arg.literal) return arg.value;
      const nested = findDynamicCalls(arg.value).map((call) => dynamicPatternFromArgs(parseCallArguments(call.argsSource), sourceFile, call.callee === 'new URL')?.pattern).filter(Boolean);
      if (nested.length === 1) return nested[0];
      return '**';
    }).filter((v) => v !== '');
    if (rawSegs.length === 0) return null;
    const rootIdx = rawSegs.findIndex((s) => roots.has(s) || [...roots].some((root) => s === root || s.startsWith(`${root}/`)));
    if (rootIdx < 0) {
      const raw = collapseGlobStars(path.posix.join(...rawSegs));
      const normalized = collapseGlobStars(normalizeDocTarget(raw, sourceFile) || raw);
      if (/^(docs|plans|scripts|src|test|core|domains|plugins|\.agents|\.fgos)(\/|$)/.test(normalized)) return { pattern: normalized, unresolvedRoot: null };
      return { pattern: raw, unresolvedRoot: args[0]?.value || rawSegs[0] || null };
    }
    const segs = rawSegs.slice(rootIdx);
    let raw = collapseGlobStars(path.posix.join(...segs));
    const pattern = collapseGlobStars(normalizeDocTarget(raw, sourceFile) || raw);
    return { pattern, unresolvedRoot: null };
  }

  function markdownCodePayloads(content) {
    const payloads = [];
    const lines = content.split(/(\r?\n)/);
    let offset = 0;
    let fence = null;
    let startOffset = 0;
    let buf = '';
    for (let i = 0; i < lines.length; i += 2) {
      const line = lines[i] || '';
      const newline = lines[i + 1] || '';
      const open = line.match(/^\s*(`{3,}|~{3,})\s*([^`]*)/);
      if (!fence && open) {
        const lang = (open[2] || '').trim().toLowerCase();
        fence = { marker: open[1][0], len: open[1].length, relevant: /^(js|javascript|ts|typescript|mjs|cjs|tsx|jsx|node)\b/.test(lang) };
        startOffset = offset + line.length + newline.length;
        buf = '';
      } else if (fence && new RegExp(`^\\s*${fence.marker}{${fence.len},}\\s*$`).test(line)) {
        if (fence.relevant) payloads.push({ content: buf, offset: startOffset });
        fence = null;
      } else if (fence) {
        buf += line + newline;
      }
      offset += line.length + newline.length;
    }
    return payloads;
  }

  function scanDynamicCalls(content, file) {
    const payloads = file.toLowerCase().endsWith('.md') ? markdownCodePayloads(content) : [{ content, offset: 0 }];
    for (const payload of payloads) for (const call of findDynamicCalls(payload.content)) {
      const args = parseCallArguments(call.argsSource);
      if (args.length === 0) continue;
      const isNewUrl = call.callee === 'new URL';
      const derived = dynamicPatternFromArgs(args, file, isNewUrl);
      if (!derived?.pattern) continue;
      const pattern = derived.pattern;
      const lineNo = lineNumberAt(content, payload.offset + call.start);
      const rawTarget = call.raw.replace(/\s+/g, ' ').slice(0, 240);
      if (!/^(docs|plans|scripts|src|test|core|domains|plugins|\.agents|\.fgos|AGENTS\.md|CLAUDE\.md)(\/|$)/.test(pattern)) {
        if (derived.unresolvedRoot) addUnresolved(file, lineNo, 'dynamic', pattern, { rawTarget, unresolvedRoot: derived.unresolvedRoot, targetPath: null, targetPaths: [] });
        continue;
      }
      if (pattern.includes('**')) {
        addUnresolved(file, lineNo, 'dynamic', pattern, { rawTarget });
        continue;
      }
      if (targetSet.has(pattern)) add(pattern, file, lineNo, 'dynamic', { resolvedTarget: pattern });
    }
  }

  for (const file of allPaths) {
    const blobSize = sizeByPath.get(file) || 0;
    if (blobSize > 20 * 1024 * 1024) {
      scanGaps.push({ type: 'consumer-scan-too-large', path: file, blobSize, message: `${file}: ${blobSize} bytes exceeds 20MB consumer scan limit` });
      continue;
    }
    let content;
    try {
      const cached = options.blobContentsByPath?.get(file);
      content = cached ? decodeUtf8(cached) : readBlobAtCommit(commitSha, file, repoRoot);
    } catch (err) {
      scanGaps.push({ type: 'consumer-scan-unreadable', path: file, message: `${file}: unable to read blob: ${err.message}` });
      continue;
    }
    scanDynamicCalls(content, file);
    const lines = content.split(/\r?\n/);
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      const lineNo = i + 1;
      const kind = classifyConsumerKind(file, line);
      if (pathSegmentTokenRegex('AGENTS.md').test(line)) add('AGENTS.md', file, lineNo, kind);
      if (pathSegmentTokenRegex('CLAUDE.md').test(line)) add('CLAUDE.md', file, lineNo, kind);

      for (const link of extractLinks(line, file)) {
        const token = link.targetPath;
        if (!token) continue;
        const edgeKind = link.kind === 'glob' ? 'glob' : kind;
        if (targetSet.has(token)) add(token, file, lineNo, edgeKind, { rawTarget: link.raw, resolvedTarget: token });
        for (const target of stemToTargets.get(token) || []) add(target, file, lineNo, edgeKind, { rawTarget: link.raw, resolvedTarget: token });
        if (token.includes('*')) {
          const re = globToRegExp(token);
          for (const target of normalizedTargets) if (re.test(target)) add(target, file, lineNo, 'glob', { rawTarget: link.raw, resolvedTarget: token });
        }
      }

      let m;
      pathToken.lastIndex = 0;
      while ((m = pathToken.exec(line)) !== null) {
        const token = normalizeDocTarget(m[1].trim().replace(/[),.;:]+$/, ''), file);
        if (!token) continue;
        if (targetSet.has(token)) add(token, file, lineNo, kind, { resolvedTarget: token });
        for (const target of stemToTargets.get(token) || []) add(target, file, lineNo, kind, { resolvedTarget: token });
        if (token.includes('*')) {
          const re = globToRegExp(token);
          for (const target of normalizedTargets) if (re.test(target)) add(target, file, lineNo, 'glob', { resolvedTarget: token });
        }
      }

      for (const ref of extractRefs(line)) {
        if (refToTargets.has(ref)) {
          const key = `${file}:${lineNo}`;
          const byLocation = immutableSourcesByRef.get(ref) || new Map();
          byLocation.set(key, { path: file, line: lineNo });
          immutableSourcesByRef.set(ref, byLocation);
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
    for (const c of arr) uniq.set(`${c.path}:${c.line || ''}:${c.kind}:${c.contractScope || ''}:${c.resolvedTarget || ''}:${c.ref || ''}`, c);
    consumersByPath.set(target, [...uniq.values()].sort((a, b) => a.path.localeCompare(b.path) || String(a.line || '').localeCompare(String(b.line || ''))));
  }
  const immutableRefEdges = [...immutableSourcesByRef.entries()].map(([ref, byLocation]) => ({
    edgeId: `immutable_ref_${stableHash(ref, 24)}`,
    ref,
    sourcePaths: [...new Set([...byLocation.values()].map((loc) => loc.path))].sort(),
    targetPaths: [...new Set(refToTargets.get(ref) || [])].sort(),
  })).sort((a, b) => a.ref.localeCompare(b.ref));
  Object.defineProperty(consumersByPath, 'scanGaps', { value: scanGaps, enumerable: false });
  Object.defineProperty(consumersByPath, 'immutableRefEdges', { value: immutableRefEdges, enumerable: false });
  Object.defineProperty(consumersByPath, 'unresolvedConsumerEdges', { value: [...new Map(unresolvedConsumerEdges.map((e) => [e.edgeId, e])).values()].sort((a, b) => a.path.localeCompare(b.path) || String(a.line || '').localeCompare(String(b.line || ''))), enumerable: false });
  return consumersByPath;
}

export function buildInventoryRow(relPath, { content, sourceDigest: providedSourceDigest = null, blobSha, blobSize, switchboardIndex, shippedContract = null, consumers = [], identityIndex = null }) {
  const sourcePath = normalizePosix(relPath);
  const classification = classifyDocPath(sourcePath, switchboardIndex);
  const isMarkdown = sourcePath.toLowerCase().endsWith('.md');
  const documentType = isMarkdown ? extractDocumentType(content) : null;
  const claimKind = deriveClaimKind(documentType);
  const units = isMarkdown ? extractMarkdownConservationUnits(content) : extractMixedFileConservationUnit(sourcePath, content);
  const headings = units.filter((u) => u.unitKind === 'heading').map((u) => ({ level: u.level, text: u.title, anchor: u.anchor, githubAnchor: u.githubAnchor, stableAnchor: u.stableAnchor }));
  const isPromotedCanonical = classification.authorityStatus === 'promoted' && sourcePath.startsWith('docs/platform/');
  const initialDisposition = proposeDisposition({ ...classification, isPromotedCanonical });
  const initialTargetOwner = targetOwnerForDisposition(initialDisposition, classification);
  const uniqueClaimKinds = new Set(units.map((u) => inferClaimKindFromPathAndText(sourcePath, u.sample || u.title, documentType)));
  const needsClaimLevelSplit = classification.fileClass === 'maintained-authority' && RETAINED_CLAIM_DISPOSITIONS.has(initialDisposition) && uniqueClaimKinds.size > 1;
  const candidateSplitOwner = initialTargetOwner && hasSwitchboardBackedTarget(classification) ? initialTargetOwner : null;
  const distinctConcreteSplitOwners = new Set(candidateSplitOwner ? [candidateSplitOwner] : []);
  const hasTrueClaimLevelSplit = needsClaimLevelSplit && distinctConcreteSplitOwners.size >= 2;
  const proposedDisposition = hasTrueClaimLevelSplit ? 'split' : (needsClaimLevelSplit ? 'unknown-blocking' : initialDisposition);
  const proposedTargetOwner = targetOwnerForDisposition(proposedDisposition, classification);
  const hasCredibleOwner = proposedTargetOwner && hasSwitchboardBackedTarget(classification);
  const disposition = DISPOSITIONS_REQUIRING_TARGET_OWNER.has(proposedDisposition) && !hasCredibleOwner ? 'unknown-blocking' : proposedDisposition;
  const targetOwner = disposition === proposedDisposition ? proposedTargetOwner : null;
  const rationale = disposition === proposedDisposition ? proposeRationale(disposition, classification) : proposeRationale('unknown-blocking', classification);
  const linkRecords = extractLinks(content, sourcePath);
  const links = linkRecords.map((l) => l.raw);
  const resolvedLinks = [...new Set(linkRecords.map((l) => l.targetPath).filter(Boolean))].sort();
  const refs = extractRefs(content);
  const sourceDigest = providedSourceDigest || sha256(content);
  const resolvedSourceIdentity = resolveRegisteredSourceId(identityIndex, sourcePath);
  const sourceId = resolvedSourceIdentity.sourceId;
  const claimStatus = deriveClaimStatus(classification);
  const proposedClaimOwner = RETAINED_CLAIM_DISPOSITIONS.has(disposition) ? targetOwner : null;
  const baseIdCounts = new Map();

  const claims = units.map((u) => {
    const kind = inferClaimKindFromPathAndText(sourcePath, u.sample || u.title, documentType);
    const unitDigest = buildUnitIdentityDigest(u);
    const resolvedIdentity = resolveRegisteredClaimId(identityIndex, unitDigest, sourcePath, u.anchor, u.identityFingerprint);
    const duplicateOrdinal = resolvedIdentity.claimId ? (baseIdCounts.get(resolvedIdentity.claimId) || 0) : 0;
    if (resolvedIdentity.claimId) baseIdCounts.set(resolvedIdentity.claimId, duplicateOrdinal + 1);
    const duplicateCarriedForward = resolvedIdentity.identityStatus === 'carried-forward' && duplicateOrdinal > 0;
    const identityStatus = duplicateCarriedForward ? 'ambiguous-duplicate-registry-gap' : resolvedIdentity.identityStatus;
    const hasIdentityGap = resolvedSourceIdentity.identityStatus !== 'carried-forward' || identityStatus !== 'carried-forward';
    const baseClaimId = !hasIdentityGap ? resolvedIdentity.claimId : explicitIdentityGapId('claim', `${sourcePath}\n${unitDigest}\n${u.identityFingerprint || ''}\n${u.anchor}`);
    const claimId = baseClaimId;
    const relations = duplicateCarriedForward ? [{ type: 'same-source-indistinguishable-duplicate-blocker', claimId: resolvedIdentity.claimId, duplicateOrdinal }] : [];
    const unitRefs = extractRefs(`${u.title || ''}\n${u.sample || ''}`);
    const unitLinks = extractLinks(u.sample || '', sourcePath).map((l) => l.raw);
    return {
      claimId,
      sourceId,
      sourcePath,
      sourceAnchor: u.anchor,
      sourceDigest,
      sourceUnitDigest: u.textDigest,
      identityUnitDigest: unitDigest,
      identityFingerprint: u.identityFingerprint || unitDigest,
      identityStatus: hasIdentityGap ? (resolvedSourceIdentity.identityStatus === 'carried-forward' ? identityStatus : resolvedSourceIdentity.identityStatus) : 'carried-forward',
      sourceLocation: { start: u.startLine, end: u.endLine },
      targetOwner: hasIdentityGap ? null : proposedClaimOwner,
      targetAnchor: !hasIdentityGap && proposedClaimOwner === sourcePath ? u.anchor : null,
      claimKind: kind,
      authorityKind: classification.authorityStatus,
      status: claimStatus,
      relations,
      decisionRefs: unitRefs.filter((r) => /^(D-ADR|ADR|STR|RUL|CTR)/.test(r)),
      evidenceLinks: unitLinks.filter((l) => /proof|verify|evidence|receipt|test|history|reports/.test(l.toLowerCase())),
      disposition: hasIdentityGap ? 'unknown-blocking' : disposition,
      reviewStatus: disposition === 'unknown-blocking' || hasIdentityGap ? 'blocking' : 'pending',
    };
  });

  const _claimsById = new Map(claims.map((claim) => [claim.claimId, claim]));

  const row = {
    path: normalizePosix(relPath),
    sourceId,
    identityStatus: resolvedSourceIdentity.identityStatus,
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
    resolvedLinks,
    linkRecords,
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

export function readCommitBlobMap(repoRoot, entries, options = {}) {
  const maxSize = options.maxSize ?? 20 * 1024 * 1024;
  const readable = entries.filter((e) => e?.blobSha && Number(e.size) <= maxSize);
  if (readable.length === 0) return new Map();
  const input = readable.map((e) => e.blobSha).join('\n') + '\n';
  const result = spawnSync('git', ['cat-file', '--batch'], {
    cwd: repoRoot,
    input,
    maxBuffer: Math.max(64 * 1024 * 1024, readable.reduce((n, e) => n + Number(e.size || 0), 0) + readable.length * 200),
  });
  if (result.status !== 0) throw new Error(`git cat-file --batch failed: ${decodeUtf8(result.stderr || Buffer.alloc(0)).trim()}`);
  const bySha = new Map();
  let offset = 0;
  const stdout = result.stdout || Buffer.alloc(0);
  for (const entry of readable) {
    const nl = stdout.indexOf(0x0a, offset);
    if (nl < 0) throw new Error(`git cat-file --batch truncated before ${entry.blobSha}`);
    const header = stdout.slice(offset, nl).toString('utf8');
    const [sha, type, sizeText] = header.split(' ');
    const size = Number(sizeText);
    if (sha !== entry.blobSha || type !== 'blob' || !Number.isFinite(size)) throw new Error(`git cat-file --batch unexpected header for ${entry.path}: ${header}`);
    const start = nl + 1;
    const end = start + size;
    bySha.set(sha, Buffer.from(stdout.slice(start, end)));
    offset = end + 1;
  }
  const byPath = new Map();
  for (const entry of readable) byPath.set(normalizePosix(entry.path), bySha.get(entry.blobSha));
  return byPath;
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

function compareText(a, b) {
  const x = String(a ?? '');
  const y = String(b ?? '');
  return x < y ? -1 : x > y ? 1 : 0;
}

function multimap(rows, keyFn) {
  const map = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    if (!key) continue;
    map.set(key, (map.get(key) || []).concat(row));
  }
  return map;
}

/**
 * Looks up the single previous unit a current unit carries identity from:
 * fingerprint first, digest second. Marks the match consumed. A key that still
 * has several unconsumed candidates is reported as ambiguous, never guessed.
 */
function matchPreviousUnit({ oldByFingerprint, oldByDigest, consumed }, unit, unitDigest) {
  const attempts = [];
  if (unit.identityFingerprint) attempts.push(['fingerprint', unit.identityFingerprint, oldByFingerprint.get(unit.identityFingerprint) || []]);
  attempts.push(['digest', unitDigest, oldByDigest.get(unitDigest) || []]);
  const ambiguousNotes = [];
  const ambiguousRows = new Set();
  for (const [kind, key, rows] of attempts) {
    const available = rows.filter((row) => !consumed.has(row));
    if (available.length === 1) {
      consumed.add(available[0]);
      return { row: available[0] };
    }
    if (available.length > 1) {
      ambiguousNotes.push(`${kind} ${key} has ${available.length} possible old units`);
      for (const row of available) ambiguousRows.add(row);
    }
  }
  return ambiguousNotes.length > 0 ? { ambiguous: ambiguousNotes.join('; '), ambiguousRows: [...ambiguousRows] } : {};
}

const CARRY_MARKER_FIELDS = ['reviewStatus', 'lineage', 'movedFrom', 'identityNote', 'origin', 'pairedByAnchor'];

/** Drops per-carry markers so a later carry only reports what it did itself. */
function withoutCarryMarkers(row) {
  const copy = { ...row };
  for (const field of CARRY_MARKER_FIELDS) delete copy[field];
  return copy;
}

function carriedUnitRow(previous, u, { sourcePath, unitDigest, documentType, classification }) {
  return {
    ...previous,
    sourcePath,
    unitDigest,
    identityFingerprint: u.identityFingerprint || unitDigest,
    claimId: previous.claimId,
    sourceAnchor: u.anchor,
    unitKind: u.unitKind,
    sourceUnitDigest: u.textDigest,
    claimKind: inferClaimKindFromPathAndText(sourcePath, u.sample || u.title, documentType),
    status: deriveClaimStatus(classification),
  };
}

function freshUnitRow(u, { sourcePath, unitDigest, documentType, classification }) {
  return {
    sourcePath,
    unitDigest,
    identityFingerprint: u.identityFingerprint || unitDigest,
    claimId: randomOpaqueId('claim'),
    sourceAnchor: u.anchor,
    unitKind: u.unitKind,
    sourceUnitDigest: u.textDigest,
    claimKind: inferClaimKindFromPathAndText(sourcePath, u.sample || u.title, documentType),
    status: deriveClaimStatus(classification),
  };
}

function anchorWithoutNumericSuffix(anchor) {
  const m = String(anchor).match(/^(.+)-\d+$/);
  return m ? m[1] : null;
}

/**
 * Units of one file that share a digest and whose old anchor set equals their
 * new anchor set are paired by anchor: identical content at identical
 * positions is not a guess. Any other duplicate group stays ambiguous.
 */
function pairDuplicatesByAnchor(src, oldHere, ambiguityByOld, consumedOld) {
  const oldByDigest = multimap(oldHere, (u) => u.unitDigest);
  const newByDigest = multimap(src.units.map((entry, idx) => ({ ...entry, idx })), (entry) => entry.unitDigest);
  for (const [digest, olds] of oldByDigest) {
    const news = newByDigest.get(digest) || [];
    if (olds.length < 2 || olds.length !== news.length) continue;
    if (!olds.every((o) => ambiguityByOld.has(o) && !consumedOld.has(o))) continue;
    if (!news.every((n) => src.ambiguous[n.idx] && !src.matched[n.idx])) continue;
    const oldAnchors = olds.map((o) => o.sourceAnchor);
    const newAnchors = news.map((n) => n.u.anchor);
    if (new Set(oldAnchors).size !== olds.length || [...oldAnchors].sort().join('\0') !== [...newAnchors].sort().join('\0')) continue;
    for (const n of news) {
      const previous = olds.find((o) => o.sourceAnchor === n.u.anchor);
      consumedOld.add(previous);
      ambiguityByOld.delete(previous);
      src.matched[n.idx] = { previous, kind: 'paired' };
      src.ambiguous[n.idx] = null;
    }
  }
}

/** Anchors that cannot be mistaken for a duplicate-title suffix of another anchor in the same file. */
function stableHeadingAnchors(anchors) {
  const all = new Set(anchors);
  return new Set([...all].filter((a) => {
    const base = anchorWithoutNumericSuffix(a);
    if (base && all.has(base)) return false;
    return ![...all].some((b) => anchorWithoutNumericSuffix(b) === a);
  }));
}

export function carryForwardIdentityRegistry(repoRoot = process.cwd(), options = {}) {
  const registryPath = options.identityRegistryPath;
  const sourcePath = normalizePosix(options.sourcePath || '');
  const toSourcePath = normalizePosix(options.toSourcePath || sourcePath);
  if (!sourcePath) throw new Error('--source-path <path> is required for identity carry-forward');
  const registry = readIdentityRegistryPath(registryPath, repoRoot);
  const commitSha = resolveCommitSha(options.commit || registry.commit, repoRoot);
  const switchboardIndex = buildSwitchboardIndex(loadSwitchboard(commitSha, repoRoot));
  const entryOut = execFileSync('git', ['ls-tree', '-l', commitSha, toSourcePath], { cwd: repoRoot, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  const entry = parseLsTreeLong(entryOut)[0];
  if (!entry) throw new Error(`${toSourcePath}: not found at ${commitSha}`);
  const blob = readBlobBufferAtCommit(commitSha, toSourcePath, repoRoot);
  const content = decodeUtf8(blob);
  const documentType = toSourcePath.toLowerCase().endsWith('.md') ? extractDocumentType(content) : null;
  const classification = classifyDocPath(toSourcePath, switchboardIndex);
  const units = toSourcePath.toLowerCase().endsWith('.md') ? extractMarkdownConservationUnits(content) : extractMixedFileConservationUnit(toSourcePath, content);
  if (toSourcePath !== sourcePath && (registry.documents || []).some((d) => normalizePosix(d.path || '') === toSourcePath)) throw new Error(`${toSourcePath}: identity carry-forward refused because destination already exists in identity registry`);
  if (toSourcePath !== sourcePath && (registry.units || []).some((u) => normalizePosix(u.sourcePath || '') === toSourcePath)) throw new Error(`${toSourcePath}: identity carry-forward refused because destination units already exist in identity registry`);
  const oldUnits = (registry.units || []).filter((u) => normalizePosix(u.sourcePath || '') === sourcePath);
  const matchState = { oldByFingerprint: multimap(oldUnits, (u) => u.identityFingerprint), oldByDigest: multimap(oldUnits, (u) => u.unitDigest), consumed: new Set() };
  const consumed = matchState.consumed;
  function pickUniquePrevious(u, unitDigest) {
    const match = matchPreviousUnit(matchState, u, unitDigest);
    if (match.row) return match.row;
    throw new Error(`${toSourcePath}: identity carry-forward refused for unit ${u.anchor || unitDigest}: ${match.ambiguous || 'no uniquely matchable old unit (edited/new unit)'}`);
  }
  const newUnitRows = units.map((u) => {
    const unitDigest = buildUnitIdentityDigest(u);
    const previous = pickUniquePrevious(u, unitDigest);
    return carriedUnitRow(previous, u, { sourcePath: toSourcePath, unitDigest, documentType, classification });
  });
  const unconsumed = oldUnits.filter((u) => !consumed.has(u));
  if (unconsumed.length > 0) throw new Error(`${toSourcePath}: identity carry-forward refused because ${unconsumed.length} old unit(s) from ${sourcePath} were not uniquely preserved`);
  const documents = (registry.documents || []).filter((d) => normalizePosix(d.path || '') !== sourcePath && normalizePosix(d.path || '') !== toSourcePath);
  const oldDoc = (registry.documents || []).find((d) => normalizePosix(d.path || '') === sourcePath || normalizePosix(d.path || '') === toSourcePath);
  documents.push({ ...(oldDoc || {}), path: toSourcePath, sourceId: oldDoc?.sourceId || randomOpaqueId('src'), sourceDigest: sha256Bytes(blob), blobSha: entry.blobSha });
  const otherUnits = (registry.units || []).filter((u) => normalizePosix(u.sourcePath || '') !== sourcePath && normalizePosix(u.sourcePath || '') !== toSourcePath);
  return { ...registry, commit: commitSha, documents: documents.sort((a, b) => normalizePosix(a.path).localeCompare(normalizePosix(b.path))), units: [...otherUnits, ...newUnitRows].sort((a, b) => normalizePosix(a.sourcePath).localeCompare(normalizePosix(b.sourcePath)) || String(a.sourceAnchor || '').localeCompare(String(b.sourceAnchor || ''))) };
}

/**
 * Carries identity for every in-scope source from a registry bound to an older
 * commit onto `options.commit`. Each old unit ends in exactly one of: kept
 * (unchanged or moved), edited-kept (stable heading anchor, flagged for review),
 * identity gap (ambiguous or edited positional unit), or retired (no
 * counterpart; kept pending disposition). Nothing is derived from content and
 * no old id is dropped.
 */
export function carryForwardIdentityRegistryRepoWide(repoRoot = process.cwd(), options = {}) {
  const registry = readIdentityRegistryPath(options.identityRegistryPath, repoRoot);
  const commit = options.commit;
  if (!commit || typeof commit !== 'string' || commit.trim() === '') throw new Error('Explicit commit/treeish is required for identity carry-forward');
  const commitSha = resolveCommitSha(commit, repoRoot);
  const seenClaimIds = new Set();
  for (const row of [...(registry.units || []), ...(registry.retiredUnits || []), ...(registry.identityGaps || [])]) {
    if (seenClaimIds.has(row.claimId)) throw new Error(`identity registry holds claim id ${row.claimId} more than once across units, retiredUnits and identityGaps`);
    seenClaimIds.add(row.claimId);
  }
  const fromCommit = registry.commit;
  const origin = `added-since-${fromCommit}`;
  const switchboardIndex = buildSwitchboardIndex(loadSwitchboard(commitSha, repoRoot));
  const files = scanInScopeFiles(repoRoot, commitSha).sort((a, b) => compareText(normalizePosix(a.path), normalizePosix(b.path)));
  const blobContentsByPath = readCommitBlobMap(repoRoot, files);

  const oldUnitsByPath = multimap(registry.units || [], (u) => normalizePosix(u.sourcePath || ''));
  const oldUnits = registry.units || [];
  const sources = [];
  for (const f of files) {
    const sourcePath = normalizePosix(f.path);
    if (f.size > 20 * 1024 * 1024) throw new Error(`${sourcePath}: cannot carry identity for >20MB blob without an explicit reviewed gap`);
    const blob = blobContentsByPath.get(sourcePath) || readBlobBufferAtCommit(commitSha, sourcePath, repoRoot);
    const content = decodeUtf8(blob);
    const isMarkdown = sourcePath.toLowerCase().endsWith('.md');
    const ctx = { sourcePath, documentType: isMarkdown ? extractDocumentType(content) : null, classification: classifyDocPath(sourcePath, switchboardIndex) };
    const units = (isMarkdown ? extractMarkdownConservationUnits(content) : extractMixedFileConservationUnit(sourcePath, content)).map((u) => ({ u, unitDigest: buildUnitIdentityDigest(u) }));
    sources.push({ f, blob, ctx, units, matched: new Array(units.length).fill(null), ambiguous: new Array(units.length).fill(null) });
  }

  const keptRows = [];
  const consumedOld = new Set();
  const ambiguityByOld = new Map();
  const matchedOld = (previous) => consumedOld.add(previous);

  // Same path, same digest or fingerprint: identity carries unchanged.
  for (const src of sources) {
    const oldHere = oldUnitsByPath.get(src.ctx.sourcePath) || [];
    const state = { oldByFingerprint: multimap(oldHere, (u) => u.identityFingerprint), oldByDigest: multimap(oldHere, (u) => u.unitDigest), consumed: consumedOld };
    src.units.forEach(({ u, unitDigest }, idx) => {
      const match = matchPreviousUnit(state, u, unitDigest);
      if (match.row) src.matched[idx] = { previous: match.row, kind: 'kept' };
      else if (match.ambiguous) {
        src.ambiguous[idx] = `ambiguous match: ${match.ambiguous}`;
        for (const row of match.ambiguousRows) ambiguityByOld.set(row, src.ambiguous[idx]);
      }
    });
    pairDuplicatesByAnchor(src, oldHere, ambiguityByOld, consumedOld);
  }

  // Different path, digest unique on both sides: the unit moved.
  const orphanOld = oldUnits.filter((u) => !consumedOld.has(u) && !ambiguityByOld.has(u));
  const orphanNew = [];
  sources.forEach((src, sIdx) => src.units.forEach(({ unitDigest }, idx) => { if (!src.matched[idx] && !src.ambiguous[idx]) orphanNew.push({ sIdx, idx, unitDigest }); }));
  const oldByDigest = multimap(orphanOld, (u) => u.unitDigest);
  const newByDigest = multimap(orphanNew, (n) => n.unitDigest);
  for (const [digest, olds] of oldByDigest) {
    const news = newByDigest.get(digest) || [];
    if (news.length === 0) continue;
    if (olds.length === 1 && news.length === 1 && normalizePosix(olds[0].sourcePath || '') !== sources[news[0].sIdx].ctx.sourcePath) {
      matchedOld(olds[0]);
      sources[news[0].sIdx].matched[news[0].idx] = { previous: olds[0], kind: 'moved' };
    } else {
      for (const old of olds) ambiguityByOld.set(old, `ambiguous match: move digest ${digest} has ${olds.length} old and ${news.length} new unmatched unit(s)`);
      for (const n of news) sources[n.sIdx].ambiguous[n.idx] = `ambiguous match: move digest ${digest}`;
    }
  }

  // Same file, same stable heading anchor, changed content: edited-kept.
  for (const src of sources) {
    const oldHere = oldUnitsByPath.get(src.ctx.sourcePath) || [];
    const oldStable = stableHeadingAnchors(oldHere.filter((u) => u.unitKind === 'heading').map((u) => u.sourceAnchor));
    const newStable = stableHeadingAnchors(src.units.filter(({ u }) => u.unitKind === 'heading').map(({ u }) => u.anchor));
    const freeOld = multimap(oldHere.filter((u) => !consumedOld.has(u) && !ambiguityByOld.has(u) && u.unitKind === 'heading' && oldStable.has(u.sourceAnchor)), (u) => u.sourceAnchor);
    src.units.forEach(({ u }, idx) => {
      if (src.matched[idx] || src.ambiguous[idx] || u.unitKind !== 'heading' || !newStable.has(u.anchor)) return;
      const candidates = freeOld.get(u.anchor) || [];
      if (candidates.length !== 1) return;
      matchedOld(candidates[0]);
      src.matched[idx] = { previous: candidates[0], kind: 'edited-kept' };
    });
  }

  const units = [];
  const counts = { kept: 0, paired: 0, moved: 0, editedKept: 0, added: 0 };
  const newAnchorsByPath = new Map();
  for (const src of sources) {
    const unmatchedAnchors = new Set();
    src.units.forEach(({ u, unitDigest }, idx) => {
      const match = src.matched[idx];
      if (!match) {
        unmatchedAnchors.add(u.anchor);
        const row = freshUnitRow(u, { ...src.ctx, unitDigest });
        row.origin = origin;
        if (src.ambiguous[idx]) row.identityNote = src.ambiguous[idx];
        units.push(row);
        counts.added += 1;
        return;
      }
      const row = carriedUnitRow(withoutCarryMarkers(match.previous), u, { ...src.ctx, unitDigest });
      if (match.kind === 'moved') {
        row.movedFrom = { sourcePath: match.previous.sourcePath, sourceAnchor: match.previous.sourceAnchor };
        counts.moved += 1;
      } else if (match.kind === 'edited-kept') {
        row.reviewStatus = 'needs-review';
        row.lineage = { fromCommit, fromUnitDigest: match.previous.unitDigest, toUnitDigest: unitDigest, fromSourceUnitDigest: match.previous.sourceUnitDigest, toSourceUnitDigest: u.textDigest };
        counts.editedKept += 1;
      } else if (match.kind === 'paired') {
        row.pairedByAnchor = true;
        counts.paired += 1;
      } else counts.kept += 1;
      units.push(row);
    });
    newAnchorsByPath.set(src.ctx.sourcePath, unmatchedAnchors);
  }

  const currentPaths = new Set(sources.map((s) => s.ctx.sourcePath));
  const identityGaps = [];
  const retiredUnits = [];
  for (const old of oldUnits) {
    if (consumedOld.has(old)) continue;
    const oldPath = normalizePosix(old.sourcePath || '');
    const ambiguity = ambiguityByOld.get(old);
    if (ambiguity) identityGaps.push({ ...old, identityStatus: 'identity-gap', gapReason: ambiguity });
    else if ((newAnchorsByPath.get(oldPath) || new Set()).has(old.sourceAnchor)) identityGaps.push({ ...old, identityStatus: 'identity-gap', gapReason: `edited unit whose anchor ${old.sourceAnchor} is not a stable heading anchor` });
    else retiredUnits.push({ ...old, priorStatus: old.status, status: 'removed-pending-disposition', retiredAtCommit: commitSha, retiredReason: currentPaths.has(oldPath) ? 'no counterpart in current source' : 'source removed' });
  }

  // Documents: same path keeps its source id; a vanished path whose units moved together hands its id on.
  const oldDocByPath = new Map((registry.documents || []).map((d) => [normalizePosix(d.path || ''), d]));
  const inheritedDocPaths = new Set();
  const documents = sources.map((src) => {
    const sourcePath = src.ctx.sourcePath;
    const base = { path: sourcePath, sourceDigest: sha256Bytes(src.blob), blobSha: src.f.blobSha };
    const same = oldDocByPath.get(sourcePath);
    if (same) return { ...withoutCarryMarkers(same), ...base };
    const fromCounts = new Map();
    for (const m of src.matched) if (m?.kind === 'moved') fromCounts.set(normalizePosix(m.previous.sourcePath || ''), (fromCounts.get(normalizePosix(m.previous.sourcePath || '')) || 0) + 1);
    const donor = [...fromCounts.entries()].sort((a, b) => b[1] - a[1] || compareText(a[0], b[0])).map(([p]) => p).find((p) => !currentPaths.has(p) && oldDocByPath.has(p) && !inheritedDocPaths.has(p));
    if (donor) {
      inheritedDocPaths.add(donor);
      return { ...withoutCarryMarkers(oldDocByPath.get(donor)), ...base, movedFrom: { sourcePath: donor } };
    }
    return { ...base, sourceId: randomOpaqueId('src'), origin };
  });
  const retiredDocuments = (registry.documents || [])
    .filter((d) => !currentPaths.has(normalizePosix(d.path || '')) && !inheritedDocPaths.has(normalizePosix(d.path || '')))
    .map((d) => ({ ...d, priorStatus: d.status, status: 'removed-pending-disposition', retiredAtCommit: commitSha }));

  const byPathAnchor = (a, b) => compareText(normalizePosix(a.sourcePath), normalizePosix(b.sourcePath)) || compareText(a.sourceAnchor, b.sourceAnchor) || compareText(a.claimId, b.claimId);
  units.sort(byPathAnchor);
  const carriedRetired = [...(registry.retiredUnits || []), ...retiredUnits].sort(byPathAnchor);
  const carriedGaps = [...(registry.identityGaps || []), ...identityGaps].sort(byPathAnchor);
  const carriedRetiredDocuments = [...(registry.retiredDocuments || []), ...retiredDocuments].sort((a, b) => compareText(normalizePosix(a.path), normalizePosix(b.path)));
  return {
    ...registry,
    commit: commitSha,
    carriedFromCommit: fromCommit,
    documents: documents.sort((a, b) => compareText(normalizePosix(a.path), normalizePosix(b.path))),
    units,
    identityGaps: carriedGaps,
    retiredUnits: carriedRetired,
    retiredDocuments: carriedRetiredDocuments,
    carryForward: { fromCommit, toCommit: commitSha, oldUnits: oldUnits.length, newUnits: units.length, ...counts, gaps: identityGaps.length, retired: retiredUnits.length, retiredDocuments: retiredDocuments.length },
  };
}

export function bootstrapIdentityRegistry(repoRoot = process.cwd(), options = {}) {
  const commit = options.commit;
  if (!commit || typeof commit !== 'string' || commit.trim() === '') throw new Error('Explicit commit/treeish is required for identity registry bootstrap');
  const commitSha = resolveCommitSha(commit, repoRoot);
  const switchboardIndex = buildSwitchboardIndex(loadSwitchboard(commitSha, repoRoot));
  const files = scanInScopeFiles(repoRoot, commitSha).sort((a, b) => normalizePosix(a.path).localeCompare(normalizePosix(b.path)));
  const blobContentsByPath = readCommitBlobMap(repoRoot, files);
  const documents = [];
  const units = [];
  for (const f of files) {
    const sourcePath = normalizePosix(f.path);
    if (f.size > 20 * 1024 * 1024) throw new Error(`${sourcePath}: cannot bootstrap identity for >20MB blob without an explicit reviewed gap`);
    const content = decodeUtf8(blobContentsByPath.get(sourcePath) || readBlobBufferAtCommit(commitSha, sourcePath, repoRoot));
    const sourceDigest = sha256Bytes(blobContentsByPath.get(sourcePath) || Buffer.from(content));
    const classification = classifyDocPath(sourcePath, switchboardIndex);
    const documentType = sourcePath.toLowerCase().endsWith('.md') ? extractDocumentType(content) : null;
    const conservationUnits = sourcePath.toLowerCase().endsWith('.md') ? extractMarkdownConservationUnits(content) : extractMixedFileConservationUnit(sourcePath, content);
    const sourceId = randomOpaqueId('src');
    documents.push({ path: sourcePath, sourceId, sourceDigest, blobSha: f.blobSha });
    for (const u of conservationUnits) {
      units.push(freshUnitRow(u, { sourcePath, unitDigest: buildUnitIdentityDigest(u), documentType, classification }));
    }
  }
  return {
    $schema: 'https://forgent.dev/schemas/doc-inventory-identity-registry.v1.json',
    version: 1,
    phase: '02',
    commit: commitSha,
    generatedAt: new Date(0).toISOString(),
    description: 'Opaque Phase 02 identity registry. Values are persisted random IDs; lookup keys preserve immutable-base path and conservation-unit digest only to carry identity across unrelated insertion/reorder. Missing or ambiguous entries are identity gaps, not a license to derive replacement IDs.',
    documents,
    units,
  };
}

export function generateInventory(repoRoot = process.cwd(), options = {}) {
  const commit = options.commit;
  if (!commit || typeof commit !== 'string' || commit.trim() === '') throw new Error('Explicit commit/treeish is required for inventory generation (fail closed; cannot default to HEAD or working tree)');
  const commitSha = resolveCommitSha(commit, repoRoot);
  const switchboardIndex = buildSwitchboardIndex(loadSwitchboard(commitSha, repoRoot));
  const identityRegistry = readIdentityRegistryPath(options.identityRegistryPath, repoRoot);
  if (!registryBindsToCommit(identityRegistry.commit, commitSha, repoRoot)) throw new Error(`identity registry commit ${identityRegistry.commit || '<missing>'} does not match generation commit ${commitSha} and the in-scope tree differs; carry the registry forward with: node scripts/generate-doc-inventory.mjs --refresh --commit ${commitSha}`);
  const identityIndex = buildIdentityRegistryIndex(identityRegistry);
  const shippedIndex = buildShippedContractIndex(loadShippedPathInventory(commitSha, repoRoot));
  const files = scanInScopeFiles(repoRoot, commitSha).sort((a, b) => normalizePosix(a.path).localeCompare(normalizePosix(b.path)));
  const paths = files.map((f) => normalizePosix(f.path));
  const allEntries = listCommitEntries(repoRoot, commitSha);
  const blobContentsByPath = readCommitBlobMap(repoRoot, allEntries.filter((e) => isTextPath(normalizePosix(e.path)) || paths.includes(normalizePosix(e.path))));
  const targetRefs = new Map();
  for (const f of files) {
    const norm = normalizePosix(f.path);
    if (f.size > 20 * 1024 * 1024) {
      targetRefs.set(norm, []);
      continue;
    }
    try { targetRefs.set(norm, extractRefs(decodeUtf8(blobContentsByPath.get(norm) || readBlobBufferAtCommit(commitSha, f.path, repoRoot)))); }
    catch { targetRefs.set(norm, []); }
  }
  const consumersByPath = collectConsumers(repoRoot, commitSha, paths, shippedIndex, { targetRefs, blobContentsByPath });
  const scanGaps = consumersByPath.scanGaps || [];
  const immutableRefEdges = consumersByPath.immutableRefEdges || [];
  const unresolvedConsumerEdges = consumersByPath.unresolvedConsumerEdges || [];
  const blobShaCounts = new Map();
  const items = [];

  for (const f of files) {
    const norm = normalizePosix(f.path);
    if (f.size > 20 * 1024 * 1024) {
      items.push(buildInventoryRow(norm, {
        content: `UNREAD INVENTORY GAP: ${norm} exceeds 20MB blob limit (${f.size} bytes).`,
        blobSha: f.blobSha,
        blobSize: f.size,
        switchboardIndex,
        identityIndex,
        shippedContract: shippedIndex.get(norm) || null,
        consumers: consumersByPath.get(norm) || [],
      }));
      scanGaps.push({ type: 'inventory-blob-too-large', path: norm, blobSize: f.size, message: `${norm}: explicit inventory gap because blob exceeds 20MB` });
      blobShaCounts.set(f.blobSha, (blobShaCounts.get(f.blobSha) || []).concat(norm));
      continue;
    }
    let content;
    let sourceDigest;
    try {
      const blobBuffer = blobContentsByPath.get(norm) || readBlobBufferAtCommit(commitSha, f.path, repoRoot);
      sourceDigest = sha256Bytes(blobBuffer);
      content = decodeUtf8(blobBuffer);
    }
    catch (err) {
      content = `UNREAD INVENTORY GAP: ${norm} could not be read: ${err.message}`;
      sourceDigest = sha256Bytes(Buffer.from(content));
      scanGaps.push({ type: 'inventory-blob-unreadable', path: norm, message: `${norm}: explicit inventory gap because blob could not be read: ${err.message}` });
    }
    const row = buildInventoryRow(norm, {
      content,
      sourceDigest,
      blobSha: f.blobSha,
      blobSize: f.size,
      switchboardIndex,
      identityIndex,
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
    const semanticClaimId = `semantic_${stableHash(group.blobSha, 24)}`;
    const sourceOccurrences = group.paths.map((p, idx) => ({ sourceOccurrenceOrdinal: idx, path: p, role: idx === 0 ? 'canonical' : 'duplicate' }));
    for (const duplicatePath of group.paths) {
      const item = itemByPath.get(duplicatePath);
      if (!item) continue;
      item.sourceOccurrences = sourceOccurrences;
      for (const claim of item.claims || []) {
        claim.semanticClaimId = semanticClaimId;
        claim.sourceOccurrences = sourceOccurrences;
        claim.relations.push({ type: 'duplicate-content-member', semanticClaimId, sourcePath: duplicatePath, blobSha: group.blobSha });
      }
    }
  }
  const claimLedger = [];
  const claimLedgerIds = new Set();
  const consumerEdges = [];
  const inboundLinkEdges = [];
  for (const item of items) {
    const consumers = consumersByPath.get(item.path) || [];
    item.consumerEdgeIds = consumers.map((consumer) => `consumer_${stableHash(`${item.path}\n${consumer.path}\n${consumer.line || ''}\n${consumer.kind}\n${consumer.contractScope || ''}\n${consumer.resolvedTarget || ''}\n${consumer.ref || ''}`, 24)}`);
    for (const consumer of consumers) {
      const edgeId = `consumer_${stableHash(`${item.path}\n${consumer.path}\n${consumer.line || ''}\n${consumer.kind}\n${consumer.contractScope || ''}\n${consumer.resolvedTarget || ''}\n${consumer.ref || ''}`, 24)}`;
      const { line, ...consumerWithoutLine } = consumer;
      const edge = { edgeId, line, targetPath: item.path, ...consumerWithoutLine };
      consumerEdges.push(edge);
      if (consumer.resolvedTarget || consumer.rawTarget) inboundLinkEdges.push({ edgeId, targetPath: item.path });
    }
    for (const claimId of item.claimIds) {
      const claim = item._claimsById?.get(claimId);
      if (claim && !claimLedgerIds.has(claim.claimId)) {
        claimLedger.push(claim);
        claimLedgerIds.add(claim.claimId);
      }
    }
    delete item._claimsById;
  }
  const semanticConflictGroups = buildSemanticConflictGroups(items);
  const claimIdentityGapRows = claimLedger.filter((claim) => claim.identityStatus && claim.identityStatus !== 'carried-forward');

  const summary = {
    scannedFilesCount: items.length,
    claimCount: claimLedger.length,
    claimIdentityGapCount: claimIdentityGapRows.length,
    byCorpus: {},
    byAuthorityStatus: {},
    byFileClass: {},
    byProposedDisposition: {},
    byConsumerKind: {},
    gapCount: items.filter((i) => i.gap).length + claimIdentityGapRows.length,
    fileGapCount: items.filter((i) => i.gap).length,
    duplicateContentGroupCount: duplicateContentGroups.length,
    semanticConflictGroupCount: semanticConflictGroups.length,
    scanGapCount: scanGaps.length,
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
  summary.immutableRefEdgeCount = immutableRefEdges.length;

  return {
    $schema: 'https://forgent.dev/schemas/doc-inventory.v3.json',
    version: 3,
    generatedAt: new Date(0).toISOString(),
    phase: '02',
    description: 'Repository-wide documentation inventory and conservation ledger (Phase 02 file-level and claim-level accounting)',
    commit: commitSha,
    identityRegistry: {
      commit: identityRegistry.commit || null,
      path: identityRegistry._binding?.path || null,
      bytes: identityRegistry._binding?.bytes || null,
      sha256: identityRegistry._binding?.sha256 || null,
      documents: Array.isArray(identityRegistry.documents) ? identityRegistry.documents.length : null,
      units: Array.isArray(identityRegistry.units) ? identityRegistry.units.length : null,
    },
    scanRoots: SCAN_ROOTS,
    additionalRootFiles: ADDITIONAL_ROOT_FILES,
    summary,
    duplicateContentGroups,
    semanticConflictGroups,
    claimIdentityGapRows: claimIdentityGapRows.map((claim) => ({ claimId: claim.claimId, sourcePath: claim.sourcePath, sourceAnchor: claim.sourceAnchor, identityStatus: claim.identityStatus, disposition: claim.disposition })),
    scanGaps,
    immutableRefEdges,
    claimLedger,
    consumerEdges: [...consumerEdges, ...unresolvedConsumerEdges],
    inboundLinkEdges: [...inboundLinkEdges.reduce((m, e) => m.set(e.targetPath, (m.get(e.targetPath) || []).concat(e.edgeId)), new Map()).entries()]
      .map(([targetPath, edgeIds]) => ({ targetPath, edgeIds }))
      .sort((a, b) => a.targetPath.localeCompare(b.targetPath)),
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
  lines.push(`- \`${INVENTORY_MANIFEST_PATH}\``);
  lines.push('- `plans/260925-documentation-authority-unification/plan.md` §7 Phase 02');
  lines.push('```');
  lines.push('');
  lines.push(`- **Commit:** \`${inventory.commit}\``);
  lines.push(`- **Files scanned:** ${inventory.summary.scannedFilesCount}`);
  lines.push(`- **Claim rows:** ${inventory.summary.claimCount}`);
  lines.push(`- **Headings / unheaded blocks / mixed-file blocks:** ${inventory.summary.headingTotalCount} / ${inventory.summary.unheadedBlockTotalCount} / ${inventory.summary.mixedFileBlockTotalCount}`);
  lines.push(`- **Gaps:** ${inventory.summary.gapCount} (${inventory.summary.fileGapCount || 0} file/routing gap(s), ${inventory.summary.claimIdentityGapCount || 0} claim identity-gap blocker(s))`);
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
  lines.push('## Claim Identity-Gap Blockers');
  lines.push('');
  lines.push('| Claim | Source | Anchor | Identity status | Disposition |');
  lines.push('|---|---|---|---|---|');
  for (const c of inventory.claimIdentityGapRows || []) lines.push(`| \`${c.claimId}\` | \`${c.sourcePath}\` | \`${c.sourceAnchor}\` | \`${c.identityStatus}\` | \`${c.disposition}\` |`);
  lines.push('');
  lines.push('## Claim Ledger Sample (first 500 rows)');
  lines.push('');
  lines.push('| Claim | Source | Anchor | Kind | Disposition | Target owner |');
  lines.push('|---|---|---|---|---|---|');
  for (const c of inventory.claimLedger.slice(0, 500)) lines.push(`| \`${c.claimId}\` | \`${c.sourcePath}\` | \`${c.sourceAnchor}\` | \`${c.claimKind}\` | \`${c.disposition}\` | ${c.targetOwner ? `\`${c.targetOwner}\`` : ''} |`);
  return lines.join('\n') + '\n';
}

// One command that makes the saved inventory current: when the committed
// registry is still bound to the in-scope tree of `commit` it is used as is,
// otherwise identity is carried forward from it first (and the registry file is
// rewritten); the inventory manifest and Markdown report are then regenerated.
function runRefresh(argv, cwd, commit) {
  const option = (name, fallback) => path.resolve(cwd, argv.indexOf(name) >= 0 ? argv[argv.indexOf(name) + 1] : fallback);
  const registryPath = option('--identity-registry', IDENTITY_REGISTRY_PATH);
  const jsonOut = option('--json-out', INVENTORY_MANIFEST_PATH);
  const mdOut = option('--md-out', INVENTORY_MANIFEST_PATH.replace(/\.json$/, '.md'));
  try {
    const commitSha = resolveCommitSha(commit, cwd);
    let registry = readIdentityRegistryPath(registryPath, cwd);
    if (registryBindsToCommit(registry.commit, commitSha, cwd)) {
      console.log(`generate-doc-inventory: identity registry (commit ${registry.commit}) is bound to ${commitSha}; no carry-forward needed`);
    } else {
      const carried = carryForwardIdentityRegistryRepoWide(cwd, { commit: commitSha, identityRegistryPath: registryPath });
      delete carried._binding;
      // A carry-forward never loses a claim id; refuse to overwrite the registry if one did.
      const rowIds = (r) => new Set([...(r.units || []), ...(r.retiredUnits || []), ...(r.identityGaps || [])].map((row) => row.claimId));
      const kept = rowIds(carried);
      const lost = [...rowIds(registry)].filter((id) => !kept.has(id));
      if (lost.length > 0) throw new Error(`carry-forward would lose ${lost.length} claim id(s) (first: ${lost[0]}); the registry was not rewritten`);
      fs.writeFileSync(registryPath, JSON.stringify(carried) + '\n');
      console.log(`generate-doc-inventory: carried identity registry forward from ${registry.commit} to ${commitSha} (${carried.documents.length} documents, ${carried.units.length} units); commit ${path.relative(cwd, registryPath)}`);
    }
    const inventory = generateInventory(cwd, { commit: commitSha, identityRegistryPath: registryPath });
    fs.mkdirSync(path.dirname(jsonOut), { recursive: true });
    writeShardedJsonArtifact(jsonOut, inventory);
    fs.mkdirSync(path.dirname(mdOut), { recursive: true });
    fs.writeFileSync(mdOut, generateMarkdownReport(inventory));
    console.log(`generate-doc-inventory: wrote ${path.relative(cwd, jsonOut)} and ${path.relative(cwd, mdOut)}`);
    return 0;
  } catch (err) { console.error(`Error: ${err.message}`); return 1; }
}

export function runCli(argv, cwd = process.cwd()) {
  const commitFlagIdx = argv.indexOf('--commit');
  const commit = commitFlagIdx >= 0 ? argv[commitFlagIdx + 1] : null;
  if (!commit || commit.startsWith('-')) {
    console.error('Error: --commit <commit-or-treeish> is required (fail closed; cannot default to HEAD or working tree)');
    return 1;
  }
  const jsonOutIdx = argv.indexOf('--json-out');
  const mdOutIdx = argv.indexOf('--md-out');
  const jsonOut = jsonOutIdx >= 0 ? path.resolve(cwd, argv[jsonOutIdx + 1]) : null;
  const mdOut = mdOutIdx >= 0 ? path.resolve(cwd, argv[mdOutIdx + 1]) : null;
  if (argv.includes('--refresh')) return runRefresh(argv, cwd, commit);
  if (argv.includes('--carry-forward-identity-registry')) {
    const identityIdx = argv.indexOf('--identity-registry');
    const identityRegistryPath = identityIdx >= 0 ? argv[identityIdx + 1] : null;
    const sourceIdx = argv.indexOf('--source-path');
    const toIdx = argv.indexOf('--to-source-path');
    if (!jsonOut) { console.error('Error: --carry-forward-identity-registry requires --json-out <path>'); return 1; }
    try {
      const registry = sourceIdx >= 0
        ? carryForwardIdentityRegistry(cwd, { commit, identityRegistryPath, sourcePath: argv[sourceIdx + 1], toSourcePath: toIdx >= 0 ? argv[toIdx + 1] : null })
        : carryForwardIdentityRegistryRepoWide(cwd, { commit, identityRegistryPath });
      fs.mkdirSync(path.dirname(jsonOut), { recursive: true });
      fs.writeFileSync(jsonOut, JSON.stringify(registry) + '\n');
      console.log(`generate-doc-inventory: wrote carried-forward identity registry to ${path.relative(cwd, jsonOut)} (${registry.documents.length} documents, ${registry.units.length} units)`);
      return 0;
    } catch (err) { console.error(`Error: ${err.message}`); return 1; }
  }
  if (argv.includes('--bootstrap-identity-registry')) {
    if (!jsonOut) { console.error('Error: --bootstrap-identity-registry requires --json-out <path>'); return 1; }
    try {
      const registry = bootstrapIdentityRegistry(cwd, { commit });
      fs.mkdirSync(path.dirname(jsonOut), { recursive: true });
      fs.writeFileSync(jsonOut, JSON.stringify(registry) + '\n');
      console.log(`generate-doc-inventory: wrote identity registry to ${path.relative(cwd, jsonOut)} (${registry.documents.length} documents, ${registry.units.length} units)`);
      return 0;
    } catch (err) { console.error(`Error: ${err.message}`); return 1; }
  }
  const identityIdx = argv.indexOf('--identity-registry');
  const identityRegistryPath = identityIdx >= 0 ? argv[identityIdx + 1] : null;
  let inventory;
  try { inventory = generateInventory(cwd, { commit, identityRegistryPath }); } catch (err) { console.error(`Error: ${err.message}`); return 1; }
  if (jsonOut) { fs.mkdirSync(path.dirname(jsonOut), { recursive: true }); writeShardedJsonArtifact(jsonOut, inventory); console.log(`generate-doc-inventory: wrote sharded JSON inventory manifest to ${path.relative(cwd, jsonOut)}`); }
  if (mdOut) { fs.mkdirSync(path.dirname(mdOut), { recursive: true }); fs.writeFileSync(mdOut, generateMarkdownReport(inventory)); console.log(`generate-doc-inventory: wrote Markdown report to ${path.relative(cwd, mdOut)}`); }
  if (!jsonOut && !mdOut) console.log(JSON.stringify(inventory, null, 2));
  return 0;
}

if (isMainModule(import.meta.url)) process.exitCode = runCli(process.argv.slice(2), process.cwd());
