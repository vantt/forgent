#!/usr/bin/env node
// generate-doc-inventory.mjs -- Phase 02 repository-wide documentation inventory
// and conservation-ledger generator (Documentation Authority Unification plan
// plans/260925-documentation-authority-unification/plan.md, Phase 02).
//
// Scans the documentation corpus (docs/**, AGENTS.md, CLAUDE.md) at an explicit
// immutable commit, classifies every file against the Phase 01 operative
// switchboard (docs/transitional-switchboard.md / transitional-switchboard.json)
// and the legacy-root ratchet's classifyFile(), extracts markdown headings for
// the source-coverage floor, and proposes a disposition from the plan §6.1
// vocabulary (claim-and-disposition-vocabulary.json) -- never a final decision,
// only an accounted, explicit starting point for Phase 03-05.
//
// Reuses Phase 01 conventions: fail-closed --commit (never HEAD/working-tree
// default), reads exclusively from the git commit tree via git plumbing.

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

/**
 * Builds an exact-path and longest-prefix lookup index from the Phase 01
 * operative switchboard (transitional-switchboard.json shape).
 */
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
      switchboardSource: 'rootDocument',
    });
  }

  for (const area of switchboard.areas || []) {
    const routes = area.currentRoutes || area.scopedRoutes || [];
    for (const r of routes) {
      addRoute(r.route, {
        area: area.area,
        authorityStatus: r.authorityStatus,
        role: r.role,
        scope: r.scope,
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

/**
 * Directory-prefix classification for paths the switchboard does not name
 * explicitly. Ordered; first match wins. `gap: true` means the switchboard
 * has not yet assigned this path an area -- an explicit Phase 02 finding,
 * not a silently invented one.
 */
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
      if (rule.useRatchetClassify) {
        return {
          area: rule.area,
          authorityStatus: rule.authorityStatus,
          fileClass: classifyLegacyRootFile(norm),
          corpus: rule.corpus,
          gap: Boolean(rule.gap),
          switchboardSource: 'directory-heuristic',
        };
      }
      return {
        area: rule.area,
        authorityStatus: rule.authorityStatus,
        fileClass: rule.fileClass,
        corpus: rule.corpus,
        gap: Boolean(rule.gap),
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
    // Default to maintained-authority rather than assuming generated: most
    // non-authority switchboard entries (e.g. the user/end-user knowledge
    // corpus) are individually authored prose, not machine-derived output.
    // Plan.md §3 Decision 8: "Generated projections never establish
    // authority" is a constraint on generated files, not license to guess
    // a file is generated merely because its authorityStatus is non-authority.
    return 'maintained-authority';
  }
  // promoted / legacy-current / candidate
  return 'maintained-authority';
}

/**
 * Corpus classification (plan.md §2.3) for a switchboard-matched entry.
 * The switchboard itself is the platform-authority registry, but two of its
 * areas ("End-user authoring, index, and knowledge registry") deliberately
 * cover the distinct user/end-user knowledge corpus -- detect that from the
 * area name/role text rather than assuming every switchboard hit is platform
 * authority.
 */
function deriveCorpusForSwitchboardEntry(sb, norm) {
  const areaLower = (sb.area || '').toLowerCase();
  const roleLower = (sb.role || '').toLowerCase();
  if (
    areaLower.includes('end-user') ||
    areaLower.includes('knowledge registry') ||
    roleLower.includes('user/end-user knowledge corpus') ||
    norm.startsWith('docs/knowledge/') ||
    norm.startsWith('docs/doc-registry')
  ) {
    return 'user-knowledge';
  }
  return 'platform-authority';
}

/**
 * Full classification for one doc path: switchboard exact/prefix match wins;
 * else directory heuristic; else an explicit unclassified gap.
 */
export function classifyDocPath(relPath, switchboardIndex) {
  const norm = normalizePosix(relPath);

  if (norm === 'AGENTS.md' || norm === 'CLAUDE.md') {
    return {
      area: 'Always-loaded instruction layer',
      authorityStatus: 'legacy-current',
      fileClass: 'maintained-authority',
      corpus: 'platform-authority',
      gap: false,
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
      switchboardSource: sb.switchboardSource,
      role: sb.role || null,
    };
  }

  const heuristic = classifyByDirectoryHeuristic(norm);
  if (heuristic) {
    return { ...heuristic, role: null };
  }

  return {
    area: 'Unclassified',
    authorityStatus: 'unclassified',
    fileClass: 'unclassified',
    corpus: 'platform-authority',
    gap: true,
    switchboardSource: 'none',
    role: null,
  };
}

/**
 * Extracts ATX (#) markdown headings outside fenced code blocks, with
 * GitHub-slug-style deduplicated anchors, for the Phase 02 source-coverage
 * floor (every heading must map to a claim row or an explicit disposition).
 */
export function slugifyHeading(text) {
  return text
    .toLowerCase()
    .replace(/[`*_~]/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-');
}

export function extractHeadings(markdownContent) {
  const lines = markdownContent.split(/\r?\n/);
  const headings = [];
  const seenAnchors = new Map();
  let inFence = false;
  let fenceMarker = null;

  for (const line of lines) {
    const fenceMatch = line.match(/^\s{0,3}(`{3,}|~{3,})/);
    if (fenceMatch) {
      if (!inFence) {
        inFence = true;
        fenceMarker = fenceMatch[1][0];
      } else if (line.trim().startsWith(fenceMarker.repeat(3))) {
        inFence = false;
      }
      continue;
    }
    if (inFence) continue;

    const m = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (m) {
      const level = m[1].length;
      const text = m[2].trim();
      let anchor = slugifyHeading(text) || 'section';
      const count = seenAnchors.get(anchor) || 0;
      seenAnchors.set(anchor, count + 1);
      if (count > 0) anchor = `${anchor}-${count}`;
      headings.push({ level, text, anchor });
    }
  }
  return headings;
}

/**
 * Reads the `Document type:` line out of this repo's conventional leading
 * ```txt frontmatter block, if present.
 */
export function extractDocumentType(content) {
  const fenceMatch = content.match(/```txt\r?\n([\s\S]*?)\r?\n```/);
  if (!fenceMatch) return null;
  const m = fenceMatch[1].match(/^Document type:\s*(.+)$/mi);
  return m ? m[1].trim() : null;
}

const DOCUMENT_TYPE_TO_CLAIM_KIND = {
  'vision': 'vision',
  'platform foundations': 'normative-law',
  'contract': 'contract',
  'spec': 'specification',
  'architecture': 'architecture',
  'decision': 'decision',
  'intent preservation ledger': 'intent',
  'guide / runbook': 'procedure',
  'guide': 'procedure',
  'runbook': 'procedure',
  'verification': 'verification',
  'history': 'historical-context',
  'knowledge': 'historical-context',
  'area portal': 'navigation',
  'subcomponent portal': 'navigation',
  'reading map': 'navigation',
  'inventory': 'navigation',
  'governance guide': 'contract',
  'transitional switchboard': 'navigation',
};

export function deriveClaimKind(documentType) {
  if (!documentType) return 'unclassified';
  return DOCUMENT_TYPE_TO_CLAIM_KIND[documentType.trim().toLowerCase()] || 'unclassified';
}

/**
 * Proposes a plan-§6.1 disposition. Never final: Phase 02 accounts for the
 * corpus, it does not decide migration mechanics (plan §7 Phase 02 Purpose).
 */
export function proposeDisposition({ corpus, authorityStatus, fileClass, gap, isPromotedCanonical }) {
  if (gap) return 'unknown-blocking';
  if (corpus === 'user-knowledge' || corpus === 'consumer-project') return 'reclassify-out-of-platform-scope';
  if (corpus === 'history-evidence') return 'retain-as-evidence';
  if (fileClass === 'generated') return 'regenerate-from-source';
  if (isPromotedCanonical) return 'promote';
  if (fileClass === 'maintained-authority' || fileClass === 'retained-source') return 'defer-with-owner';
  return 'unknown-blocking';
}

export function proposeRationale(disposition, { area } = {}) {
  switch (disposition) {
    case 'defer-with-owner':
      return `Phase 01 switchboard declares the current owner for area "${area}"; Phase 05 candidate transformation is not yet authorized (plan.md Phase 03-05).`;
    case 'retain-as-evidence':
      return 'History/evidence corpus per plan.md §2.3; never serves as default reading authority.';
    case 'reclassify-out-of-platform-scope':
      return 'User-knowledge or consumer-project corpus per plan.md §2.3; governed outside platform documentation authority.';
    case 'unknown-blocking':
      return 'Not present in the Phase 01 switchboard and not matched by a Phase 02 directory heuristic; requires an explicit area assignment before later phases.';
    default:
      return null;
  }
}

const DISPOSITIONS_REQUIRING_TARGET_OWNER = new Set(['promote', 'move', 'merge', 'split', 'extract', 'redirect', 'supersede', 'delete-as-duplicate', 'defer-with-owner']);

export function buildInventoryRow(relPath, { content, blobSha, blobSize, switchboardIndex }) {
  const classification = classifyDocPath(relPath, switchboardIndex);
  const isMarkdown = relPath.toLowerCase().endsWith('.md');
  const documentType = isMarkdown ? extractDocumentType(content) : null;
  const claimKind = deriveClaimKind(documentType);
  const headings = isMarkdown ? extractHeadings(content) : [];
  const isPromotedCanonical = classification.authorityStatus === 'promoted' && normalizePosix(relPath).startsWith('docs/platform/');
  const disposition = proposeDisposition({ ...classification, isPromotedCanonical });
  const targetOwner = DISPOSITIONS_REQUIRING_TARGET_OWNER.has(disposition) ? normalizePosix(relPath) : null;
  const rationale = proposeRationale(disposition, classification);

  return {
    path: normalizePosix(relPath),
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
    headings,
    proposedDisposition: disposition,
    proposedTargetOwner: targetOwner,
    proposedRationale: rationale,
  };
}

/**
 * Parses `git ls-tree -r -l <commit>` output into {path, mode, blobSha, size}.
 */
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
  const raw = readBlobAtCommit(commitSha, 'plans/260925-documentation-authority-unification/transitional-switchboard.json', repoRoot);
  return JSON.parse(raw);
}

export function generateInventory(repoRoot = process.cwd(), options = {}) {
  const commit = options.commit;
  if (!commit || typeof commit !== 'string' || commit.trim() === '') {
    throw new Error('Explicit commit/treeish is required for inventory generation (fail closed; cannot default to HEAD or working tree)');
  }
  const commitSha = resolveCommitSha(commit, repoRoot);
  const switchboard = loadSwitchboard(commitSha, repoRoot);
  const switchboardIndex = buildSwitchboardIndex(switchboard);

  const files = scanInScopeFiles(repoRoot, commitSha);
  const blobShaCounts = new Map();
  const items = [];

  for (const f of files) {
    const content = readBlobAtCommit(commitSha, f.path, repoRoot);
    const row = buildInventoryRow(f.path, {
      content,
      blobSha: f.blobSha,
      blobSize: f.size,
      switchboardIndex,
    });
    items.push(row);
    blobShaCounts.set(f.blobSha, (blobShaCounts.get(f.blobSha) || []).concat(row.path));
  }

  items.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));

  const duplicateContentGroups = [];
  for (const [sha, paths] of blobShaCounts.entries()) {
    if (Array.isArray(paths) && paths.length > 1) {
      duplicateContentGroups.push({ blobSha: sha, paths: [...paths].sort() });
    }
  }

  const summary = {
    scannedFilesCount: items.length,
    byCorpus: {},
    byAuthorityStatus: {},
    byFileClass: {},
    byProposedDisposition: {},
    gapCount: items.filter((i) => i.gap).length,
    duplicateContentGroupCount: duplicateContentGroups.length,
    headingTotalCount: items.reduce((n, i) => n + i.headingCount, 0),
  };
  for (const i of items) {
    summary.byCorpus[i.corpus] = (summary.byCorpus[i.corpus] || 0) + 1;
    summary.byAuthorityStatus[i.authorityStatus] = (summary.byAuthorityStatus[i.authorityStatus] || 0) + 1;
    summary.byFileClass[i.fileClass] = (summary.byFileClass[i.fileClass] || 0) + 1;
    summary.byProposedDisposition[i.proposedDisposition] = (summary.byProposedDisposition[i.proposedDisposition] || 0) + 1;
  }

  return {
    $schema: 'https://forgent.dev/schemas/doc-inventory.v1.json',
    version: 1,
    generatedAt: new Date(0).toISOString(),
    phase: '02',
    description: 'Repository-wide documentation inventory and conservation-ledger scaffold (Phase 02 file-level accounting + proposed disposition)',
    commit: commitSha,
    scanRoots: SCAN_ROOTS,
    additionalRootFiles: ADDITIONAL_ROOT_FILES,
    summary,
    duplicateContentGroups,
    items,
  };
}

export function generateMarkdownReport(inventory) {
  const lines = [];
  lines.push('# Repository-Wide Documentation Inventory (Phase 02)');
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
  lines.push(`- **Gaps (unclassified/unmapped):** ${inventory.summary.gapCount}`);
  lines.push(`- **Duplicate-content groups:** ${inventory.summary.duplicateContentGroupCount}`);
  lines.push(`- **Total headings (source-coverage floor):** ${inventory.summary.headingTotalCount}`);
  lines.push('');
  lines.push('## Summary By Dimension');
  lines.push('');
  for (const [dim, obj] of [
    ['Corpus', inventory.summary.byCorpus],
    ['Authority Status', inventory.summary.byAuthorityStatus],
    ['File Class', inventory.summary.byFileClass],
    ['Proposed Disposition', inventory.summary.byProposedDisposition],
  ]) {
    lines.push(`### ${dim}`);
    lines.push('');
    lines.push('| Value | Count |');
    lines.push('|---|---:|');
    for (const [k, v] of Object.entries(obj).sort((a, b) => b[1] - a[1])) {
      lines.push(`| \`${k}\` | ${v} |`);
    }
    lines.push('');
  }
  if (inventory.duplicateContentGroups.length > 0) {
    lines.push('## Duplicate-Content Groups');
    lines.push('');
    for (const g of inventory.duplicateContentGroups) {
      lines.push(`- \`${g.blobSha}\`: ${g.paths.map((p) => `\`${p}\``).join(', ')}`);
    }
    lines.push('');
  }
  lines.push('## Gaps (Not Yet Area-Assigned)');
  lines.push('');
  lines.push('| Path | Area | Authority Status | File Class |');
  lines.push('|---|---|---|---|');
  for (const item of inventory.items.filter((i) => i.gap)) {
    lines.push(`| \`${item.path}\` | ${item.area} | \`${item.authorityStatus}\` | \`${item.fileClass}\` |`);
  }
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
  try {
    inventory = generateInventory(cwd, { commit });
  } catch (err) {
    console.error(`Error: ${err.message}`);
    return 1;
  }

  const jsonOutIdx = argv.indexOf('--json-out');
  const mdOutIdx = argv.indexOf('--md-out');
  const jsonOut = jsonOutIdx >= 0 ? path.resolve(cwd, argv[jsonOutIdx + 1]) : null;
  const mdOut = mdOutIdx >= 0 ? path.resolve(cwd, argv[mdOutIdx + 1]) : null;

  if (jsonOut) {
    fs.writeFileSync(jsonOut, JSON.stringify(inventory, null, 2) + '\n');
    console.log(`generate-doc-inventory: wrote JSON inventory to ${path.relative(cwd, jsonOut)}`);
  }
  if (mdOut) {
    fs.writeFileSync(mdOut, generateMarkdownReport(inventory));
    console.log(`generate-doc-inventory: wrote Markdown report to ${path.relative(cwd, mdOut)}`);
  }
  if (!jsonOut && !mdOut) {
    console.log(JSON.stringify(inventory, null, 2));
  }
  return 0;
}

if (isMainModule(import.meta.url)) {
  process.exitCode = runCli(process.argv.slice(2), process.cwd());
}
