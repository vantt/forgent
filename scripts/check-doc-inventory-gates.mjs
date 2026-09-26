#!/usr/bin/env node
// check-doc-inventory-gates.mjs -- validates a Phase 02 doc-inventory artifact
// (generate-doc-inventory.mjs output) against the plan §7 Phase 02 gates and
// the plan §6.1 claim-and-disposition vocabulary's mechanical constraints
// (requiresTargetOwner / requiresRationale / allowedFileClasses).
//
// Fatal (exit 1): structural corruption, an in-scope file missing from the
// inventory or listed twice, a disposition outside the vocabulary, or a
// disposition used without a required target owner / rationale / allowed
// file class.
//
// Non-fatal (reported, exit 0): gap rows (`unknown-blocking`) and duplicate-
// content groups. Phase 02's gate is that conflicts and gaps are EXPLICIT,
// not that none exist (plan.md §7 Phase 02 Gate) -- later phases resolve them.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { isMainModule } from './lib/is-main-module.mjs';
import { normalizePosix, readBlobAtCommit } from './generate-shipped-path-inventory.mjs';
import { loadShardedJsonArtifact, sha256Buffer } from './doc-inventory-artifact.mjs';
import { SCAN_ROOTS, ADDITIONAL_ROOT_FILES, parseLsTreeLong } from './generate-doc-inventory.mjs';

/**
 * Independently recomputes the in-scope file count directly from the commit
 * tree (deliberately not calling generate-doc-inventory.mjs's own scan
 * function) so a bug shared between generator and checker cannot mask a
 * missing/duplicated file.
 */
export function recomputeInScopePaths(repoRoot, commitSha) {
  const out = execFileSync('git', ['ls-tree', '-r', '--name-only', commitSha], {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 60 * 1024 * 1024,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  const all = out.split('\n').filter(Boolean).map(normalizePosix);
  return all.filter((p) => ADDITIONAL_ROOT_FILES.includes(p) || SCAN_ROOTS.some((root) => p === root || p.startsWith(root + '/')));
}

export function validateStructure(inventory) {
  const findings = [];
  if (!inventory || typeof inventory !== 'object') {
    return [{ type: 'malformed-inventory', message: 'Inventory root must be an object' }];
  }
  if (!Array.isArray(inventory.items)) {
    return [{ type: 'malformed-inventory', message: '"items" must be an array' }];
  }

  const seenPaths = new Set();
  for (const [idx, item] of inventory.items.entries()) {
    if (!item || typeof item !== 'object') {
      findings.push({ type: 'malformed-item', message: `items[${idx}] must be an object` });
      continue;
    }
    if (typeof item.path !== 'string' || item.path.length === 0) {
      findings.push({ type: 'malformed-item', path: item.path, message: `items[${idx}] missing path` });
      continue;
    }
    if (seenPaths.has(item.path)) {
      findings.push({ type: 'duplicate-path', path: item.path, message: `${item.path}: appears more than once in inventory (file-level accounting must be exactly once)` });
    }
    seenPaths.add(item.path);

    for (const field of ['area', 'authorityStatus', 'fileClass', 'corpus', 'proposedDisposition']) {
      if (typeof item[field] !== 'string' || item[field].length === 0) {
        findings.push({ type: 'malformed-item', path: item.path, message: `${item.path}: missing or empty required field "${field}"` });
      }
    }
    if (!Array.isArray(item.headings)) {
      findings.push({ type: 'malformed-item', path: item.path, message: `${item.path}: "headings" must be an array (source-coverage floor)` });
    } else {
      for (const [hIdx, h] of item.headings.entries()) {
        if (!h || typeof h.anchor !== 'string' || h.anchor.length === 0) {
          findings.push({ type: 'malformed-heading', path: item.path, message: `${item.path}: headings[${hIdx}] missing a non-empty anchor` });
        }
      }
    }
    if (!Array.isArray(item.claimIds) || item.claimIds.length === 0 || item.claimCount !== item.claimIds.length) {
      findings.push({ type: 'missing-claim-rows', path: item.path, message: `${item.path}: every file must emit claimIds plus matching claimCount` });
    }
    if (!Array.isArray(item.consumerEdgeIds) || typeof item.consumerEdgeCount !== 'number' || item.consumerEdgeCount !== item.consumerEdgeIds.length || !Array.isArray(item.consumerKinds)) {
      findings.push({ type: 'missing-consumer-accounting', path: item.path, message: `${item.path}: consumer inventory must use consumerEdgeIds plus matching consumerEdgeCount and consumerKinds` });
    }
    if (!Array.isArray(item.resolvedLinks) || !Array.isArray(item.linkRecords)) {
      findings.push({ type: 'missing-resolved-link-inventory', path: item.path, message: `${item.path}: link inventory must carry raw linkRecords and normalized resolvedLinks` });
    }
  }

  if (Array.isArray(inventory.scanGaps)) {
    for (const gap of inventory.scanGaps) {
      if (!gap?.type || !gap?.path || !gap?.message) findings.push({ type: 'malformed-scan-gap', message: 'scanGaps entries must carry type, path, and message' });
    }
  } else {
    findings.push({ type: 'missing-scan-gaps', message: 'Inventory must include top-level scanGaps array, even when empty' });
  }

  if (typeof inventory.summary?.scannedFilesCount === 'number' && inventory.summary.scannedFilesCount !== inventory.items.length) {
    findings.push({
      type: 'summary-mismatch',
      message: `summary.scannedFilesCount (${inventory.summary.scannedFilesCount}) does not match items.length (${inventory.items.length})`,
    });
  }
  const itemsByPath = new Map((inventory.items || []).map((item) => [item.path, item]));
  const itemClaimIds = (inventory.items || []).flatMap((item) => Array.isArray(item.claimIds) ? item.claimIds.map((claimId) => ({ claimId, path: item.path })) : []);
  if (!Array.isArray(inventory.claimLedger)) {
    findings.push({ type: 'missing-claim-ledger', message: 'Inventory must include top-level claimLedger array' });
  } else {
    const claimsById = new Map();
    const requiredClaimFields = ['claimId', 'sourceId', 'sourcePath', 'sourceAnchor', 'sourceDigest', 'sourceLocation', 'targetOwner', 'targetAnchor', 'claimKind', 'authorityKind', 'status', 'relations', 'decisionRefs', 'evidenceLinks', 'disposition', 'reviewStatus'];
    const statusEnum = new Set(['current', 'future', 'historical']);
    for (const claim of inventory.claimLedger) {
      if (!claim?.claimId || claimsById.has(claim.claimId)) findings.push({ type: 'claim-ledger-duplicate', message: `claimLedger contains missing or duplicate claimId ${claim?.claimId || '<missing>'}` });
      if (claim?.claimId) claimsById.set(claim.claimId, claim);
      for (const field of requiredClaimFields) {
        if (!(field in (claim || {}))) findings.push({ type: 'malformed-claim', message: `claim ${claim?.claimId || '<missing>'}: missing required plan §6.2 field ${field}` });
      }
      if (claim?.status && !statusEnum.has(claim.status)) findings.push({ type: 'invalid-claim-status', message: `claim ${claim.claimId}: status ${claim.status} is not one of current, future, historical` });
      for (const arrayField of ['relations', 'decisionRefs', 'evidenceLinks']) {
        if (claim && arrayField in claim && !Array.isArray(claim[arrayField])) findings.push({ type: 'malformed-claim', message: `claim ${claim.claimId || '<missing>'}: ${arrayField} must be an array` });
      }
      if (claim?.sourceLocation && (typeof claim.sourceLocation.start !== 'number' || typeof claim.sourceLocation.end !== 'number')) {
        findings.push({ type: 'malformed-claim-source-location', message: `claim ${claim.claimId || '<missing>'}: sourceLocation must identify the source line span; sourcePath remains the path field` });
      }
    }
    for (const claim of inventory.claimLedger) {
      if (/_srcdup_[0-9a-f]+$/.test(claim.claimId)) {
        findings.push({ type: 'path-dependent-duplicate-claim-id', message: `claim ${claim.claimId}: exact duplicate occurrences must share the path-independent canonical claimId and be covered by duplicate relations` });
      }
    }
    const uniqueItemClaimIds = new Set(itemClaimIds.map(({ claimId }) => claimId));
    if (inventory.claimLedger.length !== uniqueItemClaimIds.size) findings.push({ type: 'claim-ledger-mismatch', message: `claimLedger length (${inventory.claimLedger.length}) does not match unique item claimIds (${uniqueItemClaimIds.size})` });
    const refsByClaim = new Map();
    for (const ref of itemClaimIds) refsByClaim.set(ref.claimId, (refsByClaim.get(ref.claimId) || []).concat(ref.path));
    for (const { claimId, path: itemPath } of itemClaimIds) {
      const claim = claimsById.get(claimId);
      if (!claim) findings.push({ type: 'claim-ledger-missing-id', path: itemPath, message: `${itemPath}: claimId ${claimId} not found exactly once in top-level claimLedger` });
      else {
        const item = itemsByPath.get(itemPath);
        const occurrencePaths = new Set(Array.isArray(claim.sourceOccurrences) ? claim.sourceOccurrences.map((o) => o?.path).filter(Boolean) : [claim.sourcePath]);
        const duplicateRelationPaths = new Set((claim.relations || []).filter((r) => String(r.type || '').startsWith('duplicate-content-')).map((r) => r.sourcePath).filter(Boolean));
        const coveredByDuplicateRelation = duplicateRelationPaths.has(itemPath) && occurrencePaths.has(itemPath);
        if (claim.sourceId && claim.sourceId !== item?.sourceId) findings.push({ type: 'claim-source-id-mismatch', path: itemPath, message: `${itemPath}: claimId ${claimId} has sourceId ${claim.sourceId}` });
        if (claim.sourcePath !== itemPath && !coveredByDuplicateRelation) findings.push({ type: 'claim-source-path-mismatch', path: itemPath, message: `${itemPath}: claimId ${claimId} has sourcePath ${claim.sourcePath} and no duplicate occurrence covering this path` });
        if (claim.sourceDigest !== item?.sourceDigest) findings.push({ type: 'claim-source-digest-mismatch', path: itemPath, message: `${itemPath}: claimId ${claimId} has sourceDigest ${claim.sourceDigest}` });
      }
    }
    for (const [claimId, paths] of refsByClaim.entries()) {
      const uniquePaths = [...new Set(paths)];
      if (uniquePaths.length <= 1) continue;
      const claim = claimsById.get(claimId);
      const covered = new Set((claim?.relations || []).filter((r) => String(r.type || '').startsWith('duplicate-content-')).map((r) => r.sourcePath).filter(Boolean));
      for (const p of uniquePaths) {
        if (!covered.has(p)) findings.push({ type: 'claim-shared-id-silent-collision', path: p, message: `${p}: shared claimId ${claimId} is not covered by an explicit duplicate relation for every referencing path` });
      }
    }
  }

  const itemConsumerIds = (inventory.items || []).flatMap((item) => Array.isArray(item.consumerEdgeIds) ? item.consumerEdgeIds.map((edgeId) => ({ edgeId, path: item.path })) : []);
  if (!Array.isArray(inventory.inboundLinkEdges)) {
    findings.push({ type: 'missing-inbound-link-edges', message: 'Inventory must include top-level inboundLinkEdges array' });
  }
  if (!Array.isArray(inventory.immutableRefEdges)) {
    findings.push({ type: 'missing-immutable-ref-edges', message: 'Inventory must include top-level immutableRefEdges array grouping inbound event/decision references by source paths' });
  } else {
    for (const edge of inventory.immutableRefEdges) {
      if (!edge?.ref || !Array.isArray(edge.sourcePaths) || !Array.isArray(edge.targetPaths)) findings.push({ type: 'malformed-immutable-ref-edge', message: 'immutableRefEdges entries must carry ref, sourcePaths, and targetPaths' });
    }
  }

  if (!Array.isArray(inventory.consumerEdges)) {
    findings.push({ type: 'missing-consumer-edges', message: 'Inventory must include top-level consumerEdges array' });
  } else {
    const edgesById = new Map();
    for (const edge of inventory.consumerEdges) {
      if (!edge?.edgeId || edgesById.has(edge.edgeId)) findings.push({ type: 'consumer-edge-duplicate', message: `consumerEdges contains missing or duplicate edgeId ${edge?.edgeId || '<missing>'}` });
      if (edge?.edgeId) edgesById.set(edge.edgeId, edge);
    }
    if (inventory.consumerEdges.length !== itemConsumerIds.length) findings.push({ type: 'consumer-edge-mismatch', message: `consumerEdges length (${inventory.consumerEdges.length}) does not match total item consumerEdgeIds (${itemConsumerIds.length})` });
    for (const { edgeId, path: itemPath } of itemConsumerIds) {
      const edge = edgesById.get(edgeId);
      if (!edge) findings.push({ type: 'consumer-edge-missing-id', path: itemPath, message: `${itemPath}: consumerEdgeId ${edgeId} not found exactly once in top-level consumerEdges` });
      else if (edge.targetPath && edge.targetPath !== itemPath) findings.push({ type: 'consumer-edge-target-mismatch', path: itemPath, message: `${itemPath}: consumerEdgeId ${edgeId} targets ${edge.targetPath}` });
    }
    for (const edge of inventory.consumerEdges) {
      if ((edge.rawTarget || edge.resolvedTarget) && !edge.targetPath) findings.push({ type: 'consumer-link-edge-missing-target', message: `consumer edge ${edge.edgeId || '<missing>'}: resolved link edge must carry targetPath` });
    }
  }

  return findings;
}

export function validateAgainstVocabulary(inventory, vocabulary) {
  const findings = [];
  const dispositionsById = new Map((vocabulary?.sourceDispositions || []).map((d) => [d.id, d]));
  const claimKinds = new Set((vocabulary?.claimKinds || []).map((k) => k.id));
  claimKinds.add('unclassified');
  const RECOGNIZED_FILE_CLASSES = new Set(['maintained-authority', 'retained-source', 'generated', 'history-evidence']);
  const RETAINED_CLAIM_DISPOSITIONS = new Set(['promote', 'move', 'merge', 'split', 'extract', 'redirect', 'supersede', 'delete-as-duplicate', 'defer-with-owner']);
  const switchboardBackedTargetOwners = new Set((inventory.items || [])
    .filter((item) => ['rootDocument', 'scopedRoute', 'corpusRoot'].includes(item.switchboardSource))
    .map((item) => item.path));
  const claimsBySourcePath = new Map();
  for (const claim of inventory.claimLedger || []) {
    const sourcePath = claim.sourcePath;
    claimsBySourcePath.set(sourcePath, (claimsBySourcePath.get(sourcePath) || []).concat(claim));
  }

  for (const item of inventory.items || []) {
    const disposition = dispositionsById.get(item.proposedDisposition);
    if (!disposition) {
      findings.push({ type: 'unknown-disposition', path: item.path, message: `${item.path}: proposedDisposition "${item.proposedDisposition}" is not in the plan §6.1 vocabulary` });
      continue;
    }
    if (disposition.requiresTargetOwner && (!item.proposedTargetOwner || typeof item.proposedTargetOwner !== 'string')) {
      findings.push({ type: 'missing-target-owner', path: item.path, message: `${item.path}: disposition "${item.proposedDisposition}" requires proposedTargetOwner` });
    }
    if (disposition.requiresRationale && (!item.proposedRationale || typeof item.proposedRationale !== 'string')) {
      findings.push({ type: 'missing-rationale', path: item.path, message: `${item.path}: disposition "${item.proposedDisposition}" requires proposedRationale` });
    }
    if (
      Array.isArray(disposition.allowedFileClasses) &&
      RECOGNIZED_FILE_CLASSES.has(item.fileClass) &&
      !disposition.allowedFileClasses.includes(item.fileClass)
    ) {
      findings.push({
        type: 'file-class-not-allowed-for-disposition',
        path: item.path,
        message: `${item.path}: fileClass "${item.fileClass}" is not allowed for disposition "${item.proposedDisposition}" (allowed: ${disposition.allowedFileClasses.join(', ')})`,
      });
    }
    for (const claim of claimsBySourcePath.get(item.path) || []) {
      if (!claim || typeof claim !== 'object') {
        findings.push({ type: 'malformed-claim', path: item.path, message: `${item.path}: claim row must be an object` });
        continue;
      }
      for (const field of ['claimId', 'sourceId', 'sourcePath', 'sourceAnchor', 'sourceDigest', 'claimKind', 'authorityKind', 'status', 'disposition', 'reviewStatus']) {
        if (typeof claim[field] !== 'string' || claim[field].length === 0) {
          findings.push({ type: 'malformed-claim', path: item.path, message: `${item.path}: claim ${claim.claimId || '<unknown>'} missing ${field}` });
        }
      }
      if (!['current', 'future', 'historical'].includes(claim.status)) {
        findings.push({ type: 'invalid-claim-status', path: item.path, message: `${item.path}: claim ${claim.claimId || '<unknown>'} status must be current, future, or historical` });
      }
      if (!claimKinds.has(claim.claimKind)) {
        findings.push({ type: 'unknown-claim-kind', path: item.path, message: `${item.path}: claim ${claim.claimId} claimKind "${claim.claimKind}" is not in vocabulary` });
      }
      if (!Array.isArray(claim.relations)) {
        findings.push({ type: 'malformed-claim-links', path: item.path, message: `${item.path}: claim ${claim.claimId} must carry relations array` });
      }
      if (RETAINED_CLAIM_DISPOSITIONS.has(claim.disposition)) {
        const owners = [claim.targetOwner].filter((v, idx, arr) => typeof v === 'string' && v.length > 0 && arr.indexOf(v) === idx);
        if (owners.length !== 1) {
          findings.push({ type: 'retained-claim-owner-count', path: item.path, message: `${item.path}: claim ${claim.claimId} must have exactly one targetOwner, found ${owners.length}` });
        } else if (!switchboardBackedTargetOwners.has(owners[0])) {
          findings.push({ type: 'retained-claim-owner-not-switchboard-backed', path: item.path, message: `${item.path}: claim ${claim.claimId} targetOwner ${owners[0]} is not a real switchboard-backed target owner` });
        }
        if (typeof claim.targetAnchor !== 'string' || claim.targetAnchor.length === 0) {
          findings.push({ type: 'retained-claim-target-anchor-missing', path: item.path, message: `${item.path}: claim ${claim.claimId} must have targetAnchor for retained disposition ${claim.disposition}` });
        }
      }
    }
  }
  return findings;
}

export function validateCommitBlobIntegrity(repoRoot, inventory) {
  const findings = [];
  if (!inventory?.commit) return findings;
  const out = execFileSync('git', ['ls-tree', '-r', '-l', inventory.commit], {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 60 * 1024 * 1024,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  const treeByPath = new Map(parseLsTreeLong(out).map((entry) => [normalizePosix(entry.path), entry]));
  for (const item of inventory.items || []) {
    const entry = treeByPath.get(item.path);
    if (!entry) {
      findings.push({ type: 'source-blob-missing-from-commit', path: item.path, message: `${item.path}: not found in commit tree ${inventory.commit}` });
      continue;
    }
    if (item.blobSha !== entry.blobSha) findings.push({ type: 'source-blob-sha-mismatch', path: item.path, message: `${item.path}: blobSha ${item.blobSha} does not match commit tree ${entry.blobSha}` });
    if (typeof item.blobSize === 'number' && item.blobSize !== entry.size) findings.push({ type: 'source-blob-size-mismatch', path: item.path, message: `${item.path}: blobSize ${item.blobSize} does not match commit tree ${entry.size}` });
    if (entry.size <= 20 * 1024 * 1024) {
      const content = readBlobAtCommit(inventory.commit, item.path, repoRoot);
      const digest = sha256Buffer(Buffer.from(content, 'utf8'));
      if (item.sourceDigest !== digest) findings.push({ type: 'source-digest-mismatch', path: item.path, message: `${item.path}: sourceDigest ${item.sourceDigest} does not match commit blob content ${digest}` });
    }
  }
  return findings;
}

export function checkInventory({ repoRoot, inventory, vocabulary }) {
  const fatalFindings = [
    ...validateStructure(inventory),
    ...validateAgainstVocabulary(inventory, vocabulary),
    ...validateCommitBlobIntegrity(repoRoot, inventory),
  ];

  let coverageFindings = [];
  if (fatalFindings.length === 0 && inventory.commit) {
    const expected = recomputeInScopePaths(repoRoot, inventory.commit).sort();
    const actual = inventory.items.map((i) => i.path).sort();
    const expectedSet = new Set(expected);
    const actualSet = new Set(actual);
    for (const p of expected) {
      if (!actualSet.has(p)) {
        coverageFindings.push({ type: 'missing-from-inventory', path: p, message: `${p}: in-scope at commit ${inventory.commit} but absent from inventory` });
      }
    }
    for (const p of actual) {
      if (!expectedSet.has(p)) {
        coverageFindings.push({ type: 'not-in-scope', path: p, message: `${p}: present in inventory but not in-scope at commit ${inventory.commit} (stale or out-of-scope entry)` });
      }
    }
  }

  const gapItems = (inventory.items || []).filter((i) => i.gap);
  const duplicateGroups = inventory.duplicateContentGroups || [];
  const semanticConflictGroups = inventory.semanticConflictGroups || [];

  const allFatal = [...fatalFindings, ...coverageFindings];

  return {
    clean: allFatal.length === 0,
    fatalFindings: allFatal,
    explicitOpenFindings: {
      gapCount: gapItems.length,
      gapPaths: gapItems.map((i) => i.path),
      duplicateContentGroupCount: duplicateGroups.length,
      duplicateContentGroups: duplicateGroups,
      semanticConflictGroupCount: semanticConflictGroups.length,
      semanticConflictGroups,
    },
  };
}

function loadJson(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  return loadShardedJsonArtifact(filePath);
}

export const DEFAULT_INVENTORY_PATH = 'plans/260925-documentation-authority-unification/phase-02-doc-inventory.json';
export const DEFAULT_VOCABULARY_PATH = 'plans/260925-documentation-authority-unification/claim-and-disposition-vocabulary.json';

export function runCli(argv, cwd = process.cwd()) {
  const inventoryIdx = argv.indexOf('--inventory');
  const vocabIdx = argv.indexOf('--vocabulary');
  const repoRootIdx = argv.indexOf('--repo-root');

  const inventoryPath = path.resolve(cwd, inventoryIdx >= 0 ? argv[inventoryIdx + 1] : DEFAULT_INVENTORY_PATH);
  const vocabularyPath = path.resolve(cwd, vocabIdx >= 0 ? argv[vocabIdx + 1] : DEFAULT_VOCABULARY_PATH);
  const repoRoot = path.resolve(cwd, repoRootIdx >= 0 ? argv[repoRootIdx + 1] : cwd);
  const asJson = argv.includes('--json');

  let inventory;
  let vocabulary;
  try {
    inventory = loadJson(inventoryPath);
    vocabulary = loadJson(vocabularyPath);
  } catch (err) {
    console.error(`check-doc-inventory-gates error loading input: ${err.message}`);
    return 1;
  }

  let result;
  try {
    result = checkInventory({ repoRoot, inventory, vocabulary });
  } catch (err) {
    console.error(`check-doc-inventory-gates evaluation error: ${err.message}`);
    return 1;
  }

  if (asJson) {
    console.log(JSON.stringify(result, null, 2));
    return result.clean ? 0 : 1;
  }

  if (!result.clean) {
    console.error(`check-doc-inventory-gates: ${result.fatalFindings.length} fatal finding(s):`);
    for (const f of result.fatalFindings) {
      console.error(`  - [${f.type}] ${f.message}`);
    }
    return 1;
  }

  console.log(
    `check-doc-inventory-gates: structural and vocabulary gates pass. ` +
    `Explicit open findings (not blocking Phase 02, must be resolved before Phase 05): ` +
    `${result.explicitOpenFindings.gapCount} gap(s), ${result.explicitOpenFindings.duplicateContentGroupCount} duplicate-content group(s), ` +
    `${result.explicitOpenFindings.semanticConflictGroupCount} semantic-conflict group(s).`
  );
  return 0;
}

if (isMainModule(import.meta.url)) {
  process.exitCode = runCli(process.argv.slice(2), process.cwd());
}
