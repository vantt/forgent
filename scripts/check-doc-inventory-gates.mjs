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
import { SCAN_ROOTS, ADDITIONAL_ROOT_FILES, parseLsTreeLong, extractMarkdownConservationUnits, extractMixedFileConservationUnit, loadSwitchboard, readCommitBlobMap, buildIdentityRegistryIndex } from './generate-doc-inventory.mjs';

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
      if (claim && !claim.sourceUnitDigest) findings.push({ type: 'malformed-claim', message: `claim ${claim.claimId || '<missing>'}: missing required conservation sourceUnitDigest` });
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
        if (claim.disposition === 'unknown-blocking' && claim.identityStatus === 'ambiguous-registry-gap' && (claim.targetOwner !== null || claim.targetAnchor !== null)) findings.push({ type: 'ambiguous-identity-gap-has-target', path: itemPath, message: `${itemPath}: ambiguous edited unit ${claimId} must not carry targetOwner/targetAnchor` });
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
    const resolvedConsumerEdges = inventory.consumerEdges.filter((edge) => edge.identityStatus !== 'unresolved-dynamic-pattern');
    if (resolvedConsumerEdges.length !== itemConsumerIds.length) findings.push({ type: 'consumer-edge-mismatch', message: `resolved consumerEdges length (${resolvedConsumerEdges.length}) does not match total item consumerEdgeIds (${itemConsumerIds.length})` });
    for (const { edgeId, path: itemPath } of itemConsumerIds) {
      const edge = edgesById.get(edgeId);
      if (!edge) findings.push({ type: 'consumer-edge-missing-id', path: itemPath, message: `${itemPath}: consumerEdgeId ${edgeId} not found exactly once in top-level consumerEdges` });
      else if (edge.targetPath && edge.targetPath !== itemPath) findings.push({ type: 'consumer-edge-target-mismatch', path: itemPath, message: `${itemPath}: consumerEdgeId ${edgeId} targets ${edge.targetPath}` });
    }
    for (const edge of inventory.consumerEdges) {
      if (edge.identityStatus === 'unresolved-dynamic-pattern') {
        const explicitUnresolvedRoot = edge.unresolvedRoot && Array.isArray(edge.targetPaths) && edge.targetPaths.length === 0 && (edge.targetPath === null || edge.targetPath === undefined);
        if (!edge.unresolvedDynamicPattern || (!String(edge.unresolvedDynamicPattern).includes('**') && !explicitUnresolvedRoot)) findings.push({ type: 'malformed-unresolved-consumer-edge', message: `consumer edge ${edge.edgeId || '<missing>'}: unresolved dynamic edge must carry a broad pattern or explicit unresolvedRoot with empty targetPaths` });
      } else if ((edge.rawTarget || edge.resolvedTarget) && !edge.targetPath) findings.push({ type: 'consumer-link-edge-missing-target', message: `consumer edge ${edge.edgeId || '<missing>'}: resolved link edge must carry targetPath` });
    }
  }

  return findings;
}

export function deriveValidTargetOwnersFromSwitchboard(switchboard) {
  const owners = new Set();
  for (const area of switchboard?.areas || []) {
    for (const field of [area.entryPoint, area.canonicalRoute, ...(Array.isArray(area.canonicalRoutes) ? area.canonicalRoutes : [])]) {
      if (typeof field === 'string' && field.startsWith('docs/platform/')) owners.add(field);
    }
  }
  for (const rd of switchboard?.rootDocuments || []) {
    if (rd?.authorityStatus === 'promoted' && typeof rd.path === 'string' && rd.path.startsWith('docs/platform/')) owners.add(rd.path);
  }
  return owners;
}

export function validateAgainstVocabulary(inventory, vocabulary, validTargetOwners = null) {
  const findings = [];
  const dispositionsById = new Map((vocabulary?.sourceDispositions || []).map((d) => [d.id, d]));
  const claimKinds = new Set((vocabulary?.claimKinds || []).map((k) => k.id));
  claimKinds.add('unclassified');
  const RECOGNIZED_FILE_CLASSES = new Set(['maintained-authority', 'retained-source', 'generated', 'history-evidence']);
  const RETAINED_CLAIM_DISPOSITIONS = new Set(['promote', 'move', 'merge', 'split', 'extract', 'redirect', 'supersede', 'delete-as-duplicate', 'defer-with-owner']);
  const switchboardBackedTargetOwners = validTargetOwners || new Set((inventory.items || [])
    .filter((item) => ['rootDocument', 'scopedRoute', 'corpusRoot'].includes(item.switchboardSource) && typeof item.path === 'string' && item.path.startsWith('docs/platform/'))
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
        if (claim.targetAnchor && claim.targetOwner !== claim.sourcePath) {
          findings.push({ type: 'retained-claim-target-anchor-unverified-copy', path: item.path, message: `${item.path}: claim ${claim.claimId} copies targetAnchor ${claim.targetAnchor} onto different targetOwner ${claim.targetOwner} without target verification` });
        }
      }
    }
  }
  return findings;
}

export function validateSourceUnitCoverage(repoRoot, inventory) {
  const findings = [];
  if (!inventory?.commit) return findings;
  const claimsByPath = new Map();
  const claimById = new Map((inventory.claimLedger || []).map((claim) => [claim.claimId, claim]));
  for (const item of inventory.items || []) {
    for (const claimId of item.claimIds || []) {
      const claim = claimById.get(claimId);
      if (claim) claimsByPath.set(item.path, (claimsByPath.get(item.path) || []).concat(claim));
    }
  }
  const treeOut = execFileSync('git', ['ls-tree', '-r', '-l', inventory.commit], {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 60 * 1024 * 1024,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  const treeByPath = new Map(parseLsTreeLong(treeOut).map((entry) => [normalizePosix(entry.path), entry]));
  const entries = (inventory.items || []).map((item) => treeByPath.get(item.path)).filter(Boolean);
  const blobContentsByPath = readCommitBlobMap(repoRoot, entries);
  for (const item of inventory.items || []) {
    let content;
    try {
      const contentBytes = blobContentsByPath.get(item.path);
      if (!contentBytes) continue;
      content = contentBytes.toString('utf8');
    } catch (err) {
      continue;
    }
    const expectedUnits = item.path.toLowerCase().endsWith('.md') ? extractMarkdownConservationUnits(content) : extractMixedFileConservationUnit(item.path, content);
    const expectedKeys = expectedUnits.map((u) => `${u.startLine}:${u.endLine}:${u.textDigest}`).sort();
    const actualClaims = claimsByPath.get(item.path) || [];
    const actualKeys = actualClaims.map((c) => `${c.sourceLocation?.start}:${c.sourceLocation?.end}:${c.sourceUnitDigest}`).sort();
    const expectedCounts = new Map();
    const actualCounts = new Map();
    for (const key of expectedKeys) expectedCounts.set(key, (expectedCounts.get(key) || 0) + 1);
    for (const key of actualKeys) actualCounts.set(key, (actualCounts.get(key) || 0) + 1);
    for (const [key, count] of expectedCounts.entries()) {
      const actual = actualCounts.get(key) || 0;
      if (actual === 0) findings.push({ type: 'source-unit-dropped', path: item.path, message: `${item.path}: source unit ${key} was re-extracted from immutable blob but has no claim coverage` });
      else if (actual < count) findings.push({ type: 'source-unit-under-covered', path: item.path, message: `${item.path}: source unit ${key} expected ${count} claim row(s), found ${actual}` });
    }
    for (const [key, count] of actualCounts.entries()) {
      const expected = expectedCounts.get(key) || 0;
      if (expected === 0) findings.push({ type: 'source-unit-digest-mismatch', path: item.path, message: `${item.path}: claim coverage ${key} does not match any re-extracted immutable source unit` });
      else if (count > expected) findings.push({ type: 'source-unit-duplicate-coverage', path: item.path, message: `${item.path}: source unit ${key} has duplicate claim coverage (${count} > ${expected})` });
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
  }
  const blobContentsByPath = readCommitBlobMap(repoRoot, [...treeByPath.values()].filter((entry) => (inventory.items || []).some((item) => item.path === normalizePosix(entry.path))));
  for (const item of inventory.items || []) {
    const content = blobContentsByPath.get(item.path);
    if (content) {
      const digest = sha256Buffer(content);
      if (item.sourceDigest !== digest) findings.push({ type: 'source-digest-mismatch', path: item.path, message: `${item.path}: sourceDigest ${item.sourceDigest} does not match commit blob content ${digest}` });
    }
  }
  return findings;
}

export function validateIdentityRegistry(inventory, registry) {
  const findings = [];
  if (!registry || typeof registry !== 'object') return [{ type: 'missing-identity-registry', message: 'Phase 02 identity registry is required' }];
  if (registry.commit !== inventory.commit) findings.push({ type: 'identity-registry-commit-mismatch', message: `identity registry commit ${registry.commit || '<missing>'} does not match inventory commit ${inventory.commit}` });
  if (inventory.identityRegistry) {
    if (inventory.identityRegistry.documents !== (registry.documents || []).length) findings.push({ type: 'identity-registry-document-count-binding-mismatch', message: `inventory identityRegistry.documents ${inventory.identityRegistry.documents} does not match registry ${(registry.documents || []).length}` });
    if (inventory.identityRegistry.units !== (registry.units || []).length) findings.push({ type: 'identity-registry-unit-count-binding-mismatch', message: `inventory identityRegistry.units ${inventory.identityRegistry.units} does not match registry ${(registry.units || []).length}` });
  }
  const seenClaimIds = new Set();
  for (const row of [...(registry.units || []), ...(registry.retiredUnits || []), ...(registry.identityGaps || [])]) {
    if (seenClaimIds.has(row?.claimId)) findings.push({ type: 'identity-registry-duplicate-claim-id', message: `identity registry holds claim id ${row?.claimId} more than once across units, retiredUnits and identityGaps` });
    seenClaimIds.add(row?.claimId);
  }
  const index = buildIdentityRegistryIndex(registry);
  const registryDocPaths = new Set((registry.documents || []).map((d) => normalizePosix(d.path || '')).filter(Boolean));
  const itemPaths = new Set((inventory.items || []).map((i) => i.path));
  for (const p of itemPaths) {
    if (!registryDocPaths.has(p)) findings.push({ type: 'identity-registry-missing-document', path: p, message: `${p}: missing document identity registry entry` });
  }
  for (const p of registryDocPaths) {
    if (!itemPaths.has(p)) findings.push({ type: 'identity-registry-stale-document', path: p, message: `${p}: identity registry document is not in inventory` });
  }
  for (const item of inventory.items || []) {
    if (!item.sourceId || index.docByPath.get(item.path) !== item.sourceId) findings.push({ type: 'identity-registry-source-id-mismatch', path: item.path, message: `${item.path}: item sourceId is not supplied by identity registry` });
  }
  const claimKeys = new Set();
  const ambiguousUnitKeys = new Set();
  for (const claim of inventory.claimLedger || []) {
    if (String(claim.identityStatus || '') !== 'carried-forward') {
      if (String(claim.identityStatus || '').includes('ambiguous') && claim.identityUnitDigest) ambiguousUnitKeys.add(`${claim.sourcePath}\n${claim.identityUnitDigest}`);
      continue;
    }
    const matches = (index.unitsByDigest.get(claim.identityUnitDigest) || []).filter((u) => normalizePosix(u.sourcePath || '') === claim.sourcePath && u.claimId === claim.claimId);
    if (matches.length !== 1) findings.push({ type: 'identity-registry-claim-id-mismatch', path: claim.sourcePath, message: `${claim.sourcePath}: claim ${claim.claimId} is not supplied exactly once by identity registry` });
    const exact = matches[0];
    if (exact && exact.sourceAnchor !== claim.sourceAnchor) findings.push({ type: 'identity-registry-source-anchor-mismatch', path: claim.sourcePath, message: `${claim.sourcePath}: claim ${claim.claimId} anchor ${claim.sourceAnchor} does not match registry ${exact.sourceAnchor}` });
    if (exact && exact.sourceUnitDigest !== claim.sourceUnitDigest) findings.push({ type: 'identity-registry-source-unit-digest-mismatch', path: claim.sourcePath, message: `${claim.sourcePath}: claim ${claim.claimId} sourceUnitDigest does not match registry` });
    if (exact && exact.identityFingerprint && claim.identityFingerprint && exact.identityFingerprint !== claim.identityFingerprint) findings.push({ type: 'identity-registry-fingerprint-mismatch', path: claim.sourcePath, message: `${claim.sourcePath}: claim ${claim.claimId} identityFingerprint does not match registry` });
    claimKeys.add(`${claim.sourcePath}\n${claim.identityUnitDigest}\n${claim.claimId}`);
  }
  for (const unit of registry.units || []) {
    const sourcePath = normalizePosix(unit.sourcePath || '');
    const key = `${sourcePath}\n${unit.unitDigest}\n${unit.claimId}`;
    if (!claimKeys.has(key) && !ambiguousUnitKeys.has(`${sourcePath}\n${unit.unitDigest}`)) findings.push({ type: 'identity-registry-stale-unit', path: sourcePath, message: `${unit.sourcePath || '<missing>'}: registry unit ${unit.claimId || '<missing>'} is not present exactly in inventory` });
  }
  return findings;
}

/**
 * A dropped claim must stay conserved: its Phase 3 claim id has to be present in
 * the ledger or in the identity registry (live, retired, or identity-gap rows),
 * and the entry has to name its status, restoration owner and gate.
 */
export function validateDroppedClaims(register, { ledgerClaimIds = new Set(), registry = null } = {}) {
  const findings = [];
  if (!Array.isArray(register?.entries)) return [{ type: 'dropped-claims-register-malformed', message: 'dropped-claims register must be an object with an "entries" array' }];
  const registryIds = new Set([...(registry?.units || []), ...(registry?.retiredUnits || []), ...(registry?.identityGaps || [])].map((row) => row?.claimId).filter(Boolean));
  for (const entry of register?.entries || []) {
    const label = entry?.id || '<missing id>';
    const missing = ['status', 'restorationOwner', 'gate'].filter((field) => typeof entry?.[field] !== 'string' || entry[field].trim() === '');
    if (missing.length > 0) findings.push({ type: 'dropped-claim-incomplete-entry', message: `dropped claim ${label}: missing ${missing.join(', ')}` });
    const claimId = entry?.phase3Ledger?.claimId;
    if (typeof claimId !== 'string' || claimId === '' || (!ledgerClaimIds.has(claimId) && !registryIds.has(claimId))) {
      findings.push({ type: 'dropped-claim-absent-from-ledger', message: `dropped claim ${label}: phase3Ledger.claimId ${claimId || '<missing>'} is absent from the claim ledger and the identity registry` });
    }
  }
  return findings;
}

/** Retired registry rows that still lack a vocabulary disposition. Reported as open rows, never fatal. */
export function validateRetiredDispositions(registry, vocabulary) {
  const known = new Set((vocabulary?.sourceDispositions || []).map((d) => d.id));
  return (registry?.retiredUnits || [])
    .filter((row) => row?.status === 'removed-pending-disposition' && !known.has(row.disposition))
    .map((row) => ({ claimId: row.claimId, sourcePath: row.sourcePath, sourceAnchor: row.sourceAnchor }));
}

export function checkInventory({ repoRoot, inventory, vocabulary, identityRegistry = null, droppedClaimsRegister = null }) {
  const fatalFindings = [
    ...validateStructure(inventory),
    ...validateAgainstVocabulary(inventory, vocabulary, inventory.commit ? deriveValidTargetOwnersFromSwitchboard(loadSwitchboard(inventory.commit, repoRoot)) : null),
    ...validateCommitBlobIntegrity(repoRoot, inventory),
    ...validateSourceUnitCoverage(repoRoot, inventory),
    ...validateIdentityRegistry(inventory, identityRegistry),
    ...(droppedClaimsRegister ? validateDroppedClaims(droppedClaimsRegister, { ledgerClaimIds: new Set((inventory.claimLedger || []).map((c) => c.claimId)), registry: identityRegistry }) : []),
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
  const unknownBlockingItems = (inventory.items || []).filter((i) => i.proposedDisposition === 'unknown-blocking');
  const routingGapItems = unknownBlockingItems.filter((i) => i.gap || i.gapType === 'route-conflict');
  const ownerBlockingItems = unknownBlockingItems.filter((i) => !routingGapItems.includes(i));
  const claimIdentityGapRows = (inventory.claimLedger || []).filter((claim) => claim.identityStatus && claim.identityStatus !== 'carried-forward');
  const retiredWithoutDisposition = validateRetiredDispositions(identityRegistry, vocabulary);
  const duplicateGroups = inventory.duplicateContentGroups || [];
  const semanticConflictGroups = inventory.semanticConflictGroups || [];

  const allFatal = [...fatalFindings, ...coverageFindings];

  return {
    clean: allFatal.length === 0,
    fatalFindings: allFatal,
    explicitOpenFindings: {
      gapCount: gapItems.length + claimIdentityGapRows.length,
      fileGapCount: gapItems.length,
      claimIdentityGapCount: claimIdentityGapRows.length,
      gapPaths: gapItems.map((i) => i.path),
      claimIdentityGapRows: claimIdentityGapRows.map((claim) => ({ claimId: claim.claimId, sourcePath: claim.sourcePath, sourceAnchor: claim.sourceAnchor, identityStatus: claim.identityStatus })),
      unknownBlockingCount: unknownBlockingItems.length + claimIdentityGapRows.length,
      unknownBlockingRows: [
        ...unknownBlockingItems.map((i) => ({ path: i.path, blockerKind: i.gapType === 'route-conflict' ? 'route-conflict' : (i.gap ? 'routing-gap' : 'missing-owner'), proposedTargetOwner: i.proposedTargetOwner || null })),
        ...claimIdentityGapRows.map((claim) => ({ path: claim.sourcePath, claimId: claim.claimId, blockerKind: 'claim-identity-gap', proposedTargetOwner: null })),
      ],
      routingGapPaths: routingGapItems.map((i) => i.path),
      missingOwnerPaths: ownerBlockingItems.map((i) => i.path),
      registryIdentityGapCount: (identityRegistry?.identityGaps || []).length,
      retiredWithoutDispositionCount: retiredWithoutDisposition.length,
      retiredWithoutDispositionRows: retiredWithoutDisposition,
      duplicateContentGroupCount: duplicateGroups.length,
      duplicateContentGroups: duplicateGroups,
      semanticConflictGroupCount: semanticConflictGroups.length,
      semanticConflictGroups,
    },
  };
}

function loadJson(filePath) {
  if (!fs.existsSync(filePath)) throw new Error(`File not found: ${filePath}`);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function loadInventory(filePath) {
  if (!fs.existsSync(filePath)) throw new Error(`File not found: ${filePath}`);
  return loadShardedJsonArtifact(filePath, { allowLegacyRawJson: false });
}

export const DEFAULT_INVENTORY_PATH = 'plans/260925-documentation-authority-unification/reports/phase-02-doc-inventory.json';
export const DEFAULT_VOCABULARY_PATH = 'plans/260925-documentation-authority-unification/claim-and-disposition-vocabulary.json';
export const DEFAULT_DROPPED_CLAIMS_REGISTER_PATH = 'plans/260925-documentation-authority-unification/dropped-claims-register.json';
export const DEFAULT_IDENTITY_REGISTRY_PATH = 'plans/260925-documentation-authority-unification/reports/phase-02-identity-registry.json';

/** Explicit flag: the file must exist. Default path: a missing file skips the check with a notice. */
export function loadDroppedClaimsRegister(argv, cwd) {
  const idx = argv.indexOf('--dropped-claims-register');
  if (idx >= 0) return { register: loadJson(path.resolve(cwd, argv[idx + 1])), notice: null };
  const defaultPath = path.resolve(cwd, DEFAULT_DROPPED_CLAIMS_REGISTER_PATH);
  if (!fs.existsSync(defaultPath)) return { register: null, notice: `dropped-claims register not found at ${DEFAULT_DROPPED_CLAIMS_REGISTER_PATH}; dropped-claim conservation check skipped` };
  return { register: loadJson(defaultPath), notice: null };
}

export function runCli(argv, cwd = process.cwd()) {
  const inventoryIdx = argv.indexOf('--inventory');
  const vocabIdx = argv.indexOf('--vocabulary');
  const repoRootIdx = argv.indexOf('--repo-root');
  const identityIdx = argv.indexOf('--identity-registry');

  const inventoryPath = path.resolve(cwd, inventoryIdx >= 0 ? argv[inventoryIdx + 1] : DEFAULT_INVENTORY_PATH);
  const vocabularyPath = path.resolve(cwd, vocabIdx >= 0 ? argv[vocabIdx + 1] : DEFAULT_VOCABULARY_PATH);
  const identityRegistryPath = path.resolve(cwd, identityIdx >= 0 ? argv[identityIdx + 1] : DEFAULT_IDENTITY_REGISTRY_PATH);
  const repoRoot = path.resolve(cwd, repoRootIdx >= 0 ? argv[repoRootIdx + 1] : cwd);
  const asJson = argv.includes('--json');

  let inventory;
  let vocabulary;
  let identityRegistry;
  let droppedClaimsRegister;
  let droppedClaimsNotice;
  try {
    inventory = loadInventory(inventoryPath);
    vocabulary = loadJson(vocabularyPath);
    identityRegistry = loadJson(identityRegistryPath);
    ({ register: droppedClaimsRegister, notice: droppedClaimsNotice } = loadDroppedClaimsRegister(argv, cwd));
    if (droppedClaimsNotice) console.error(`check-doc-inventory-gates: ${droppedClaimsNotice}`);
  } catch (err) {
    console.error(`check-doc-inventory-gates error loading input: ${err.message}`);
    return 1;
  }

  let result;
  try {
    result = checkInventory({ repoRoot, inventory, vocabulary, identityRegistry, droppedClaimsRegister });
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
    `Explicit open findings (not blocking the inventory phase, Phase 3; must be resolved before candidate transformation, Phase 6): ` +
    `${result.explicitOpenFindings.gapCount} gap/blocker(s) (${result.explicitOpenFindings.fileGapCount} file/routing, ${result.explicitOpenFindings.claimIdentityGapCount} claim-identity), ${result.explicitOpenFindings.duplicateContentGroupCount} duplicate-content group(s), ` +
    `${result.explicitOpenFindings.semanticConflictGroupCount} semantic-conflict group(s), ` +
    `${result.explicitOpenFindings.registryIdentityGapCount} registry identity-gap row(s), ${result.explicitOpenFindings.retiredWithoutDispositionCount} retired row(s) without disposition; ` +
    `${droppedClaimsRegister ? `${droppedClaimsRegister.entries.length} dropped claim(s) conserved.` : 'dropped-claim check skipped.'}`
  );
  return 0;
}

if (isMainModule(import.meta.url)) {
  process.exitCode = runCli(process.argv.slice(2), process.cwd());
}
