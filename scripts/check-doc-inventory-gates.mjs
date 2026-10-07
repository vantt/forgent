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
import { checkRatchet, DEFAULT_BASELINE_PATH as RATCHET_BASELINE_PATH, DEFAULT_EXCEPTIONS_PATH as RATCHET_EXCEPTIONS_PATH } from './check-legacy-docs-ratchet.mjs';
import { SCAN_ROOTS, ADDITIONAL_ROOT_FILES, registryBindsToCommit, parseLsTreeLong, extractMarkdownConservationUnits, extractMixedFileConservationUnit, loadSwitchboard, readCommitBlobMap, buildIdentityRegistryIndex, INVENTORY_MANIFEST_PATH, IDENTITY_REGISTRY_PATH } from './generate-doc-inventory.mjs';

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

/**
 * Heading anchors of a target document at a commit, so a claim's targetAnchor can
 * be checked against the owner it names. Returns null when the owner is not a
 * readable document at that commit.
 */
export function buildTargetAnchorLookup(repoRoot, commitSha) {
  const cache = new Map();
  return (owner) => {
    if (cache.has(owner)) return cache.get(owner);
    let anchors = null;
    try {
      const content = readBlobAtCommit(commitSha, owner, repoRoot);
      const units = owner.toLowerCase().endsWith('.md') ? extractMarkdownConservationUnits(content) : extractMixedFileConservationUnit(owner, content);
      anchors = new Set(units.flatMap((u) => [u.anchor, u.githubAnchor, u.stableAnchor]).filter(Boolean));
    } catch { anchors = null; }
    cache.set(owner, anchors);
    return anchors;
  };
}

/**
 * Text digest of the unit that carries `anchor` in `owner` at a commit, so a review can be
 * bound to the target text it vouched for. Returns null when owner or anchor is unreadable.
 */
export function buildTargetUnitDigestLookup(repoRoot, commitSha) {
  const cache = new Map();
  return (owner, anchor) => {
    if (!cache.has(owner)) {
      let byAnchor = null;
      try {
        byAnchor = new Map();
        const content = readBlobAtCommit(commitSha, owner, repoRoot);
        const units = owner.toLowerCase().endsWith('.md') ? extractMarkdownConservationUnits(content) : extractMixedFileConservationUnit(owner, content);
        for (const u of units) for (const a of [u.anchor, u.githubAnchor, u.stableAnchor]) if (a && !byAnchor.has(a)) byAnchor.set(a, u.textDigest);
      } catch { byAnchor = null; }
      cache.set(owner, byAnchor);
    }
    return cache.get(owner)?.get(anchor) ?? null;
  };
}

/** Full committed units, including their ancestor heading titles, for exact-carry proof. */
export function buildConservationUnitLookup(repoRoot, commitSha) {
  const cache = new Map();
  return (owner) => {
    if (!cache.has(owner)) {
      let units = null;
      try {
        const content = readBlobAtCommit(commitSha, owner, repoRoot);
        const lines = content.split(/\r?\n/);
        const extracted = owner.toLowerCase().endsWith('.md') ? extractMarkdownConservationUnits(content) : extractMixedFileConservationUnit(owner, content);
        const headings = [];
        units = extracted.map((unit, index) => {
          if (unit.unitKind === 'heading') while (headings.length && headings.at(-1).level >= unit.level) headings.pop();
          const ancestry = headings.map((heading) => heading.title);
          if (unit.unitKind === 'heading') headings.push(unit);
          let sectionText;
          if (unit.unitKind === 'heading') {
            let end = lines.length;
            for (let next = index + 1; next < extracted.length; next++) if (extracted[next].unitKind === 'heading') { end = extracted[next].startLine - 1; break; }
            sectionText = lines.slice(unit.startLine - 1, end).join('\n').trim();
          }
          return { ...unit, ancestry, text: lines.slice(unit.startLine - 1, unit.endLine).join('\n').trim(), ...(sectionText !== undefined ? { sectionText } : {}) };
        });
      } catch { units = null; }
      cache.set(owner, units);
    }
    return cache.get(owner);
  };
}

export function isLegacySourceItem(item) {
  return item?.corpus === 'platform-authority' && ['legacy-current', 'unclassified'].includes(item.authorityStatus) && typeof item.path === 'string' && !item.path.startsWith('docs/platform/');
}

/** Only the explicitly authorized class earns script review; every weaker match needs a reviewer. */
export function classifyExactCarry(sourceUnits, targetUnits, row) {
  const source = (sourceUnits || []).find((unit) => unit.anchor === row.sourceAnchor && unit.textDigest === row.sourceUnitDigest);
  const matches = (targetUnits || []).filter((unit) => unit.textDigest === row.sourceUnitDigest);
  if (!source || matches.length === 0) return { class: 'Judgment', reason: !source ? 'source unit unreadable or stale' : 'no target digest match', targetUnit: null };
  const targetUnit = matches[0];
  const exactCount = sourceUnits.filter((unit) => targetUnits.some((other) => other.textDigest === unit.textDigest)).length;
  const reasons = [];
  if (matches.length !== 1) reasons.push('target digest repeats');
  if (sourceUnits.filter((unit) => unit.textDigest === row.sourceUnitDigest).length > matches.length) reasons.push('source occurrences exceed target occurrences');
  if (JSON.stringify(source.ancestry) !== JSON.stringify(targetUnit.ancestry)) reasons.push('ancestor headings differ');
  if (source.text.trim().length < 40) reasons.push('source unit shorter than 40 characters');
  if (exactCount * 2 < sourceUnits.length) reasons.push('document exact share below one half');
  return { class: reasons.length ? 'Weak-exact' : 'Unit-exact', reason: reasons.join('; ') || 'unique long digest match, equal ancestry, sufficient document exact share', targetUnit };
}

function defaultSwitchboardOwners(inventory) {
  return new Set((inventory.items || [])
    .filter((item) => ['rootDocument', 'scopedRoute', 'corpusRoot'].includes(item.switchboardSource) && typeof item.path === 'string' && item.path.startsWith('docs/platform/'))
    .map((item) => item.path));
}

export function validateAgainstVocabulary(inventory, vocabulary, validTargetOwners = null, { targetAnchorsOf = null } = {}) {
  const findings = [];
  const dispositionsById = new Map((vocabulary?.sourceDispositions || []).map((d) => [d.id, d]));
  const claimKinds = new Set((vocabulary?.claimKinds || []).map((k) => k.id));
  claimKinds.add('unclassified');
  const RECOGNIZED_FILE_CLASSES = new Set(['maintained-authority', 'retained-source', 'generated', 'history-evidence']);
  const RETAINED_CLAIM_DISPOSITIONS = new Set(['promote', 'move', 'merge', 'split', 'extract', 'redirect', 'supersede', 'partial-carry', 'delete-as-duplicate', 'defer-with-owner']);
  const switchboardBackedTargetOwners = validTargetOwners || defaultSwitchboardOwners(inventory);
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
          if (targetAnchorsOf === null) {
            findings.push({ type: 'retained-claim-target-anchor-unverified-copy', path: item.path, message: `${item.path}: claim ${claim.claimId} copies targetAnchor ${claim.targetAnchor} onto different targetOwner ${claim.targetOwner} without target verification` });
          } else if (!(targetAnchorsOf(claim.targetOwner)?.has(claim.targetAnchor))) {
            findings.push({ type: 'retained-claim-target-anchor-missing', path: item.path, message: `${item.path}: claim ${claim.claimId} targetAnchor ${claim.targetAnchor} is not a heading or block anchor of ${claim.targetOwner}` });
          }
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

// A registry bound to an earlier commit stays valid for a later inventory commit
// whose in-scope tree is identical (needs repoRoot to compare the two commits).
export function validateIdentityRegistry(inventory, registry, { repoRoot = null } = {}) {
  const findings = [];
  if (!registry || typeof registry !== 'object') return [{ type: 'missing-identity-registry', message: 'Phase 02 identity registry is required' }];
  const bound = registry.commit === inventory.commit || (repoRoot !== null && registryBindsToCommit(registry.commit, inventory.commit, repoRoot));
  if (!bound) findings.push({ type: 'identity-registry-commit-mismatch', message: `identity registry commit ${registry.commit || '<missing>'} does not match inventory commit ${inventory.commit}` });
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
export function validateDroppedClaims(register, { ledgerClaimIds = new Set(), registry = null, unitsOf = null } = {}) {
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
    const review = entry?.reviewedDisposition;
    if (review?.decision === 'restored') {
      const unit = nonEmpty(review.owner) && review.owner.startsWith('docs/platform/') && nonEmpty(review.anchor) && typeof unitsOf === 'function'
        ? (unitsOf(review.owner) || []).find((candidate) => candidate.anchor === review.anchor) : null;
      if (!unit || !/^[0-9a-f]{64}$/.test(review.unitDigest || '') || unit.textDigest !== review.unitDigest) findings.push({ type: 'dropped-claim-restore-invalid', message: `dropped claim ${label}: restored needs a committed platform owner, anchor and matching full unitDigest` });
    }
    if (review?.decision === 'defer-with-owner' && !committedStubExists(review, unitsOf)) findings.push({ type: 'dropped-claim-stub-invalid', message: `dropped claim ${label}: deferred disposition needs an existing committed stubOwner#stubAnchor` });
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

// ---- Reviewed decision shards ---------------------------------------------
// A shard is merged onto the inventory in memory; the inventory is never rewritten.

const DECISION_REVIEW_STATUSES = new Set(['blocking', 'pending', 'reviewed']);
// A rationale that says content is missing belongs to a partial-carry (which names its remainder), never to a disposition that satisfies conservation.
const LOSS_LANGUAGE = /\b(omits?|omitted|(?:is|are) missing|missing from|absent from|not carried anywhere|only part of|does not carry|lacks)\b/i;
const TRIVIAL_REMAINDER = /^(none|n\/a|na|-|\.|todo|tbd)$/i;
const substantiveRemainder = (v) => nonEmpty(v) && v.trim().length >= 15 && !TRIVIAL_REMAINDER.test(v.trim());
const nonEmpty = (v) => typeof v === 'string' && v.trim() !== '';

function committedStubExists(row, unitsOf) {
  return nonEmpty(row.stubOwner) && row.stubOwner.startsWith('docs/platform/') && nonEmpty(row.stubAnchor) &&
    typeof unitsOf === 'function' && (unitsOf(row.stubOwner) || []).some((unit) => unit.anchor === row.stubAnchor);
}

export function reviewSessionIdentity(identity) {
  return typeof identity === 'string' ? identity.replace(/^reviewer:/, '').replace(/@[^@]+$/, '') : '';
}

export function buildCommittedReviewReportLookup(repoRoot, commitSha) {
  const cache = new Map();
  const ancestors = new Map([[commitSha, true]]);
  return (reportPath, reportCommit = commitSha) => {
    if (typeof reportPath !== 'string' || path.posix.normalize(reportPath) !== reportPath || !/^plans\/[^/]+\/reports\/phase-06\/review-[a-z0-9]+-[a-z0-9-]+\.md$/.test(reportPath)) return null;
    if (!/^[0-9a-f]{40}$/.test(reportCommit || '')) return null;
    if (!ancestors.has(reportCommit)) {
      let ancestor = false;
      try { execFileSync('git', ['merge-base', '--is-ancestor', reportCommit, commitSha], { cwd: repoRoot, stdio: 'pipe' }); ancestor = true; } catch {}
      ancestors.set(reportCommit, ancestor);
    }
    if (!ancestors.get(reportCommit)) return null;
    const key = `${reportCommit}:${reportPath}`;
    if (!cache.has(key)) {
      let report = null;
      try { report = readBlobAtCommit(reportCommit, reportPath, repoRoot); } catch {}
      cache.set(key, report);
    }
    return cache.get(key);
  };
}

export function reviewReportAuthor(report) {
  const author = typeof report === 'string' ? report.match(/^Author session:\s*(.+)$/mi)?.[1].trim() : null;
  return /^[^\s@]+-session:[^\s@]+@\d{4}-\d{2}-\d{2}$/.test(author || '') && !/^(script:|reviewer:)/.test(author) ? author : null;
}

export function validateManualReview(row, shard, reportOf) {
  const findings = [];
  const fail = (type, message) => findings.push({ type, message: `claim ${row.claimId}: ${message}` });
  if ([row.authoredBy, row.reviewedBy].some((identity) => typeof identity === 'string' && identity.startsWith('script:'))) fail('decision-script-identity', 'manual rows cannot use script identities');
  if (row.reviewStatus !== 'reviewed') return findings;
  const report = reportOf(row.reviewReport, row.reviewReportCommit);
  const legacy = shard.authorshipRequired !== true;
  const reportAuthor = legacy ? reviewReportAuthor(report) : null;
  const author = row.authoredBy || reportAuthor;
  const shardAuthor = shard.authorSession || reportAuthor;
  if (!nonEmpty(author)) fail('decision-authored-by-missing', 'a reviewed manual row needs authoredBy or committed legacy review-author provenance');
  if (!nonEmpty(shardAuthor)) fail('decision-author-session-missing', 'a reviewed manual row needs its shard or committed legacy review author');
  if ([author, shardAuthor].some((identity) => nonEmpty(identity) && reviewSessionIdentity(identity) === reviewSessionIdentity(row.reviewedBy))) fail('decision-self-review', 'reviewer and author must be different sessions, regardless of date or prefix');
  const header = (name) => typeof report === 'string' ? report.match(new RegExp(`^${name}:\\s*(.+)$`, 'mi'))?.[1].trim() : null;
  const bound = typeof report === 'string' &&
    /^reviewer:[^\s@]+-session:[^\s@]+@\d{4}-\d{2}-\d{2}$/.test(row.reviewedBy || '') &&
    header('Reviewer') === row.reviewedBy &&
    (!legacy || nonEmpty(row.authoredBy) || (reportAuthor && (!shard.authorSession || reportAuthor === shard.authorSession))) &&
    /^[0-9a-f]{40}$/.test(row.reviewPackCommit || '') && header('Pack commit') === row.reviewPackCommit &&
    /^[0-9a-f]{64}$/.test(row.reviewPackId || '') && header('Pack id') === row.reviewPackId &&
    /^[0-9a-f]{64}$/.test(row.seedScoreId || '') && header('Seed score') === row.seedScoreId &&
    nonEmpty(row.reviewNote) && report.split(/\r?\n/).some((line) => {
      const cells = line.trim().split(/(?<!\\)\|/).slice(1, -1).map((cell) => cell.trim().replace(/\\\|/g, '|'));
      return cells.length === 3 && cells[0] === row.claimId && cells[1] === 'ok' && cells[2] === row.reviewNote;
    });
  if (!bound) fail('decision-review-report-missing', 'no matching committed independent verdict with pack and sensitivity bindings');
  return findings;
}

export function corpusRuleDigest({ corpus, disposition, rationale, claimKind }) {
  return sha256Buffer(Buffer.from(JSON.stringify({ corpus, disposition, rationale, ...(claimKind === undefined ? {} : { claimKind }) })));
}

function corpusRuleReviewIsValid(rule, shard, report) {
  const reviewer = rule.reviewedBy;
  if (!nonEmpty(rule.authoredBy) || rule.authoredBy.startsWith('script:') || !nonEmpty(shard.authorSession) ||
      !/^reviewer:[^\s@]+-session:[^\s@]+@\d{4}-\d{2}-\d{2}$/.test(reviewer || '') || !nonEmpty(rule.reviewedAt) ||
      [rule.authoredBy, shard.authorSession].some((author) => reviewSessionIdentity(author) === reviewSessionIdentity(reviewer)) ||
      typeof report !== 'string' || report.match(/^Reviewer:\s*(.+)$/mi)?.[1].trim() !== reviewer) return false;
  const lines = report.split(/\r?\n/).map((line) => line.trim());
  if (!lines.includes(`Corpus: ${rule.corpus}`) || !lines.includes(`Rule digest: ${corpusRuleDigest(rule)}`)) return false;
  const verdicts = lines.filter((line) => line.startsWith('|')).map((line) => line.split('|').slice(1, -1).map((cell) => cell.trim())).filter((cells) => cells[0] === `corpus:${rule.corpus}`);
  return verdicts.length === 1 && verdicts[0][1] === 'ok' && nonEmpty(verdicts[0][2]);
}

export function loadDecisionShards(target) {
  let files;
  try {
    files = fs.statSync(target).isDirectory()
      ? fs.readdirSync(target).filter((name) => name.endsWith('.json')).sort().map((name) => path.join(target, name))
      : [target];
  } catch (err) { throw new Error(`decisions path unreadable: ${target} (${err.message})`); }
  if (files.length === 0) throw new Error(`decisions path ${target} holds no *.json shard`);
  return files.map((file) => {
    let shard;
    try { shard = JSON.parse(fs.readFileSync(file, 'utf8')); }
    catch (err) { throw new Error(`decision shard ${file} is unreadable or not valid JSON (${err.message})`); }
    if (!shard || typeof shard !== 'object' || Array.isArray(shard)) throw new Error(`decision shard ${file} must be a JSON object`);
    if (shard.version !== 1) throw new Error(`decision shard ${file}: unsupported version ${JSON.stringify(shard.version)} (expected 1)`);
    for (const field of ['version', 'shard', 'sources', 'claims']) {
      if (!(field in shard)) throw new Error(`decision shard ${file}: missing required field "${field}"`);
    }
    for (const field of ['sources', 'claims', ...['files', 'registryGaps', 'mirrors', 'exact', 'corpusRules'].filter((field) => field in shard)]) {
      if (!Array.isArray(shard[field])) throw new Error(`decision shard ${file}: "${field}" must be an array`);
    }
    if ('authorshipRequired' in shard && typeof shard.authorshipRequired !== 'boolean') throw new Error(`decision shard ${file}: "authorshipRequired" must be boolean`);
    if ('authorSession' in shard && !nonEmpty(shard.authorSession)) throw new Error(`decision shard ${file}: "authorSession" must be a nonempty string`);
    return shard;
  });
}

/** Owners decided by the shards that are promoted or candidate platform documents of the inventory. */
export function decidedPlatformOwners(inventory, shards) {
  const platform = new Set((inventory.items || []).filter((i) => ['promoted', 'candidate'].includes(i.authorityStatus) && typeof i.path === 'string' && i.path.startsWith('docs/platform/')).map((i) => i.path));
  return new Set((shards || []).flatMap((shard) => [
    ...(shard.claims || []).map((d) => d?.targetOwner),
    ...(shard.mirrors || []).map((mirror) => mirror?.target),
    ...(shard.exact || []).map((entry) => entry?.target),
  ]).filter((owner) => platform.has(owner)));
}

export function applyDecisions(inventory, shards, { vocabulary, targetAnchorsOf = null, targetUnitDigestOf = null, unitsOf = null, registry = null, repoRoot = null } = {}) {
  const findings = [];
  const dispositions = new Map((vocabulary?.sourceDispositions || []).map((d) => [d.id, d]));
  const claimKinds = new Set((vocabulary?.claimKinds || []).map((k) => k.id));
  const itemPaths = new Set((inventory.items || []).map((i) => i.path));
  const claimIndex = new Map((inventory.claimLedger || []).map((c, idx) => [c.claimId, idx]));
  const claimLedger = [...(inventory.claimLedger || [])];
  const items = [...(inventory.items || [])];
  const decided = new Set();
  const gapRows = registry ? [...(registry.identityGaps || [])] : null;
  const decidedGaps = new Set();
  const decidedFiles = new Set();
  const fail = (type, message, extra = {}) => findings.push({ type, message, ...extra });
  const itemIndex = new Map(items.map((item) => [item.path, item]));
  const reviewReportOf = repoRoot && inventory.commit ? buildCommittedReviewReportLookup(repoRoot, inventory.commit) : () => null;
  const corpusDispositions = new Map([['history-evidence', 'retain-as-evidence'], ['user-knowledge', 'reclassify-out-of-platform-scope'], ['consumer-project', 'reclassify-out-of-platform-scope']]);
  const rowsBySource = new Map();
  for (const row of claimLedger) {
    const rows = rowsBySource.get(row.sourcePath) || [];
    rows.push(row);
    rowsBySource.set(row.sourcePath, rows);
  }

  for (const shard of shards || []) {
    const sources = new Set(shard.sources || []);
    if (shard.authorshipRequired === true && !nonEmpty(shard.authorSession)) fail('decision-author-session-missing', `shard ${shard.shard}: authorshipRequired needs authorSession`);
    const mirrorClaims = [];
    const mirrorFiles = [];
    for (const rule of shard.corpusRules || []) {
      const selected = items.filter((item) => item.corpus === rule?.corpus);
      if (!corpusDispositions.has(rule?.corpus) || rule.disposition !== corpusDispositions.get(rule.corpus) ||
          !nonEmpty(rule.rationale) || !['pending', 'reviewed'].includes(rule.reviewStatus) ||
          (rule.claimKind !== undefined && !claimKinds.has(rule.claimKind)) ||
          selected.length === 0 || selected.some((item) => item.authorityStatus !== 'non-authority' || !sources.has(item.path))) {
        fail('decision-corpus-invalid', `shard ${shard.shard}: corpus ${rule?.corpus} must name its whole classified non-authority corpus with the matching retention rule`);
        continue;
      }
      if (rule.reviewStatus === 'pending') continue;
      if (!corpusRuleReviewIsValid(rule, shard, reviewReportOf(rule.reviewReport))) {
        fail('decision-corpus-review-invalid', `shard ${shard.shard}: corpus ${rule.corpus} lacks a matching committed independent rule verdict`);
        continue;
      }
      for (const item of selected) {
        const rationale = `${rule.rationale} Item ${item.path} is classified ${item.corpus}/${item.authorityStatus}.`;
        for (const row of rowsBySource.get(item.path) || []) mirrorClaims.push({
          claimId: row.claimId, sourceUnitDigest: row.sourceUnitDigest,
          targetOwner: null, targetAnchor: null, claimKind: rule.claimKind ?? row.claimKind,
          disposition: rule.disposition, reviewStatus: 'reviewed', rationale,
          authoredBy: rule.authoredBy, reviewedBy: rule.reviewedBy, reviewedAt: rule.reviewedAt,
          reviewReport: rule.reviewReport, corpusRule: rule.corpus,
        });
        mirrorFiles.push({ path: item.path, disposition: rule.disposition, rationale, targets: [] });
      }
    }
    for (const mirror of shard.mirrors || []) {
      const source = itemIndex.get(mirror?.path);
      const target = itemIndex.get(mirror?.target);
      const sourceRows = rowsBySource.get(mirror?.path) || [];
      const targetRows = rowsBySource.get(mirror?.target) || [];
      const areaRoot = String(mirror?.path || '').replace(/^docs\/architect\//, 'docs/platform/').split('/verification/')[0];
      if (!source || !target || !sources.has(mirror.path) ||
          !mirror.path.startsWith('docs/architect/') || !isEvidenceMirrorPath(mirror.path) ||
          !mirror.target.startsWith(`${areaRoot}/verification/`) || !isEvidenceMirrorPath(mirror.target) ||
          !/^[0-9a-f]{40}$/.test(mirror.blobSha || '') ||
          source.blobSha !== mirror.blobSha || target.blobSha !== mirror.blobSha ||
          sourceRows.length === 0 || sourceRows.some((row) => !targetRows.some((other) => other.sourceAnchor === row.sourceAnchor && other.sourceUnitDigest === row.sourceUnitDigest))) {
        fail('decision-mirror-invalid', `shard ${shard.shard}: mirror ${mirror?.path} -> ${mirror?.target} is not a pinned byte-identical evidence copy with all source units`, { path: mirror?.path });
        continue;
      }
      const rationale = `The evidence copy at ${mirror.target} has the identical pinned blob ${mirror.blobSha}; it carries every source unit.`;
      for (const row of sourceRows) mirrorClaims.push({
        claimId: row.claimId, sourceUnitDigest: row.sourceUnitDigest,
        targetOwner: mirror.target, targetAnchor: row.sourceAnchor, targetUnitDigest: row.sourceUnitDigest,
        claimKind: row.claimKind, disposition: 'delete-as-duplicate', reviewStatus: 'reviewed',
        authoredBy: 'script:propose-doc-decisions', reviewedBy: 'script:check-doc-inventory-gates',
        reviewedAt: String(inventory.generatedAt || '').slice(0, 10), rationale,
        searched: [`blob:${mirror.blobSha}`, mirror.path, mirror.target],
      });
      mirrorFiles.push({ path: mirror.path, disposition: 'delete-as-duplicate', rationale, targets: [mirror.target] });
    }
    for (const entry of shard.exact || []) {
      const sourceUnits = typeof unitsOf === 'function' ? unitsOf(entry?.source) : null;
      const targetUnits = typeof unitsOf === 'function' ? unitsOf(entry?.target) : null;
      if (entry?.source === entry?.target || !isLegacySourceItem(itemIndex.get(entry?.source)) ||
          !sources.has(entry?.source) || !itemPaths.has(entry?.source) || !itemPaths.has(entry?.target) ||
          !String(entry?.target || '').startsWith('docs/platform/') || !Array.isArray(entry?.rows) || !entry.rows.length ||
          !sourceUnits || !targetUnits) {
        fail('decision-exact-invalid', `shard ${shard.shard}: exact entry ${entry?.source} -> ${entry?.target} has no verifiable source, target or rows`);
        continue;
      }
      for (const decision of entry.rows) {
        const row = claimLedger[claimIndex.get(decision?.claimId)];
        const proof = row ? classifyExactCarry(sourceUnits, targetUnits, row) : null;
        if (!row || row.sourcePath !== entry.source || !/^[0-9a-f]{64}$/.test(decision.sourceUnitDigest || '') ||
            decision.sourceUnitDigest !== row.sourceUnitDigest || decision.targetUnitDigest !== row.sourceUnitDigest ||
            proof?.class !== 'Unit-exact') {
          fail('decision-exact-invalid', `shard ${shard.shard}: claim ${decision?.claimId} does not satisfy exact-carry proof (${proof?.reason || 'unknown row or invalid digest'})`, { path: entry.source });
          continue;
        }
        mirrorClaims.push({
          claimId: row.claimId, sourceUnitDigest: row.sourceUnitDigest,
          targetOwner: entry.target, targetAnchor: proof.targetUnit.anchor, targetUnitDigest: proof.targetUnit.textDigest,
          claimKind: row.claimKind, disposition: 'promote', reviewStatus: 'reviewed',
          authoredBy: 'script:propose-doc-decisions', reviewedBy: 'script:check-doc-inventory-gates',
          reviewedAt: String(inventory.generatedAt || '').slice(0, 10),
          rationale: `The entire source unit is present at ${entry.target}#${proof.targetUnit.anchor}; ${proof.reason}.`,
        });
      }
    }
    if (shard.authorshipRequired === true) for (const row of shard.claims || []) findings.push(...validateManualReview(row, shard, reviewReportOf));
    for (const d of [...mirrorClaims, ...(shard.claims || [])]) {
      const id = d?.claimId;
      const idx = claimIndex.get(id);
      if (idx === undefined) { fail('decision-claim-unknown', `shard ${shard.shard}: claim ${id} is not in the claim ledger`); continue; }
      if (decided.has(id)) { fail('decision-claim-duplicate', `claim ${id} is decided more than once (again in shard ${shard.shard})`); continue; }
      decided.add(id);
      const row = claimLedger[idx];
      const at = { path: row.sourcePath };
      if (d.disposition === 'defer-with-owner' && !committedStubExists(d, unitsOf)) fail('decision-stub-invalid', `claim ${id}: defer-with-owner needs an existing committed stubOwner#stubAnchor`, at);
      if (!sources.has(row.sourcePath)) fail('decision-claim-outside-sources', `shard ${shard.shard}: claim ${id} belongs to ${row.sourcePath}, which is not one of the shard's sources`, at);
      if (typeof d.sourceUnitDigest !== 'string' || d.sourceUnitDigest.length < 16 || !String(row.sourceUnitDigest || '').startsWith(d.sourceUnitDigest)) fail('decision-digest-stale', `claim ${id}: sourceUnitDigest does not match the current source text (needs at least 16 hex characters of the row's digest)`, at);
      const disposition = dispositions.get(d.disposition);
      if (!disposition) fail('decision-disposition-invalid', `claim ${id}: disposition "${d.disposition}" is not in the vocabulary`, at);
      if (!claimKinds.has(d.claimKind)) fail('decision-claim-kind-invalid', `claim ${id}: claimKind "${d.claimKind}" is not in the vocabulary`, at);
      if (!DECISION_REVIEW_STATUSES.has(d.reviewStatus)) fail('decision-review-status-invalid', `claim ${id}: reviewStatus "${d.reviewStatus}" is not one of blocking, pending, reviewed`, at);
      const hasOwner = nonEmpty(d.targetOwner);
      if (disposition?.requiresTargetOwner && !hasOwner) fail('decision-target-owner-missing', `claim ${id}: disposition "${d.disposition}" requires a targetOwner`, at);
      if (!hasOwner && nonEmpty(d.targetAnchor)) fail('decision-target-anchor-missing', `claim ${id}: targetAnchor ${d.targetAnchor} is set without a targetOwner`, at);
      if (hasOwner) {
        if (!itemPaths.has(d.targetOwner) || !d.targetOwner.startsWith('docs/platform/')) fail('decision-target-owner-missing', `claim ${id}: targetOwner ${d.targetOwner} is not a docs/platform document of the inventory`, at);
        if (!nonEmpty(d.targetAnchor)) fail('decision-target-anchor-missing', `claim ${id}: targetOwner ${d.targetOwner} needs a targetAnchor`, at);
        else if (typeof targetAnchorsOf === 'function' && itemPaths.has(d.targetOwner)) {
          const anchors = targetAnchorsOf(d.targetOwner);
          if (anchors === null || anchors === undefined) fail('decision-target-anchor-missing', `claim ${id}: targetOwner ${d.targetOwner} is unreadable at the inventory commit, so targetAnchor ${d.targetAnchor} cannot be verified`, at);
          else if (!anchors.has(d.targetAnchor)) fail('decision-target-anchor-missing', `claim ${id}: targetAnchor ${d.targetAnchor} is not a heading or block anchor of ${d.targetOwner}`, at);
          else if (typeof targetUnitDigestOf === 'function' && d.targetUnitDigest !== undefined) {
            const current = targetUnitDigestOf(d.targetOwner, d.targetAnchor);
            if (typeof d.targetUnitDigest !== 'string' || d.targetUnitDigest.length < 16 || !String(current || '').startsWith(d.targetUnitDigest)) fail('decision-target-drift', `claim ${id}: the unit at ${d.targetOwner}#${d.targetAnchor} is not the text this decision was recorded against (targetUnitDigest differs from the current unit digest)`, at);
          }
        }
      }
      if (d.reviewStatus === 'reviewed' && !(nonEmpty(d.reviewedBy) && nonEmpty(d.reviewedAt) && nonEmpty(d.rationale))) fail('decision-reviewed-incomplete', `claim ${id}: reviewStatus reviewed needs reviewedBy, reviewedAt and rationale`, at);
      if (d.reviewStatus === 'reviewed' && hasOwner && typeof targetUnitDigestOf === 'function' && d.targetUnitDigest === undefined) fail('decision-reviewed-incomplete', `claim ${id}: a reviewed decision with a target needs targetUnitDigest, the digest of the target unit the reviewer compared`, at);
      if (d.reviewStatus === 'blocking' && d.disposition !== 'unknown-blocking') fail('decision-blocking-status-mismatch', `claim ${id}: reviewStatus blocking is only for disposition unknown-blocking, found "${d.disposition}"`, at);
      if (d.disposition === 'unknown-blocking' && d.reviewStatus !== 'blocking') fail('decision-blocking-status-mismatch', `claim ${id}: disposition unknown-blocking needs reviewStatus blocking, found "${d.reviewStatus}"`, at);
      if ((d.disposition === 'unknown-blocking' || String(d.disposition).startsWith('delete-')) && !(Array.isArray(d.searched) && d.searched.length > 0)) fail('decision-searched-missing', `claim ${id}: disposition "${d.disposition}" needs a non-empty searched list`, at);
      if (!nonEmpty(d.rationale)) fail('decision-rationale-missing', `claim ${id}: rationale is empty`, at);
      if (d.disposition === 'partial-carry' && !substantiveRemainder(d.remainder)) fail('decision-partial-carry-remainder-missing', `claim ${id}: a partial-carry names what the target does not carry in remainder (at least 15 characters, not a placeholder)`, at);
      if (d.disposition !== 'partial-carry' && d.disposition !== 'unknown-blocking' && !String(d.disposition).startsWith('delete-') && LOSS_LANGUAGE.test(String(d.rationale || '')) && !nonEmpty(d.remainder)) fail('decision-loss-without-partial-carry', `claim ${id}: the rationale says content is missing; a unit that loses anything is a partial-carry with a remainder, not ${d.disposition}`, at);

      const merged = { ...row, targetOwner: d.targetOwner ?? null, targetAnchor: d.targetAnchor ?? null, claimKind: d.claimKind, disposition: d.disposition, reviewStatus: d.reviewStatus, rationale: d.rationale };
      for (const field of ['authoredBy', 'reviewedBy', 'reviewedAt', 'searched', 'remainder', 'targetUnitDigest', 'targetAncestry', 'reviewReport', 'reviewReportCommit', 'reviewPackCommit', 'reviewPackId', 'seedScoreId', 'reviewNote', 'stubOwner', 'stubAnchor', 'corpusRule']) if (d[field] !== undefined) merged[field] = d[field];
      claimLedger[idx] = merged;
      const gapIdx = gapRows ? gapRows.findIndex((gap) => gap?.claimId === id) : -1;
      if (gapIdx >= 0 && d.reviewStatus === 'reviewed' && d.disposition !== 'unknown-blocking') gapRows[gapIdx] = { ...gapRows[gapIdx], disposition: d.disposition };
    }
    for (const g of shard.registryGaps || []) {
      const idx = gapRows ? gapRows.findIndex((row) => row?.claimId === g?.claimId) : -1;
      const at = { path: g?.sourcePath };
      if (idx < 0) { fail('decision-gap-unknown', `shard ${shard.shard}: ${g?.claimId} is not an identity-gap row of the registry`, at); continue; }
      if (decidedGaps.has(g.claimId)) { fail('decision-gap-duplicate', `registry gap ${g.claimId} is decided more than once (again in shard ${shard.shard})`, at); continue; }
      decidedGaps.add(g.claimId);
      const disposition = dispositions.get(g.disposition);
      if (!disposition) fail('decision-gap-invalid', `registry gap ${g.claimId}: disposition "${g.disposition}" is not in the vocabulary`, at);
      else if (disposition.requiresTargetOwner && !(nonEmpty(g.targetOwner) && itemPaths.has(g.targetOwner))) fail('decision-gap-invalid', `registry gap ${g.claimId}: disposition "${g.disposition}" requires a targetOwner that is a document of the inventory`, at);
      if (!nonEmpty(g.rationale)) fail('decision-gap-invalid', `registry gap ${g.claimId}: rationale is empty`, at);
      if (g.disposition === 'partial-carry' && !substantiveRemainder(g.remainder)) fail('decision-gap-invalid', `registry gap ${g.claimId}: a partial-carry names its remainder`, at);
      if (gapRows[idx].sourcePath !== g.sourcePath) fail('decision-gap-invalid', `registry gap ${g.claimId}: sourcePath ${g.sourcePath} is not the registry's ${gapRows[idx].sourcePath}`, at);
      if (g.disposition !== 'unknown-blocking') gapRows[idx] = { ...gapRows[idx], disposition: g.disposition, targetOwner: g.targetOwner ?? null, targetAnchor: g.targetAnchor ?? null, dispositionRationale: g.rationale, ...(g.remainder ? { remainder: g.remainder } : {}) };
    }
    for (const f of [...mirrorFiles, ...(shard.files || [])]) {
      if (decidedFiles.has(f?.path)) { fail('decision-file-duplicate', `file ${f?.path} is decided more than once (again in shard ${shard.shard})`, { path: f?.path }); continue; }
      decidedFiles.add(f?.path);
      const idx = items.findIndex((i) => i.path === f?.path);
      if (idx < 0) { fail('decision-file-unknown', `shard ${shard.shard}: file ${f?.path} is not an inventory item`, { path: f?.path }); continue; }
      const disposition = dispositions.get(f.disposition);
      const targets = Array.isArray(f.targets) ? f.targets : [];
      const at = { path: f.path };
      if (!disposition) fail('decision-file-invalid', `${f.path}: disposition "${f.disposition}" is not in the vocabulary`, at);
      else {
        if (disposition.requiresTargetOwner && targets.length === 0) fail('decision-file-invalid', `${f.path}: disposition "${f.disposition}" requires a target owner but targets is empty`, at);
        if (disposition.requiresRationale && !nonEmpty(f.rationale)) fail('decision-file-invalid', `${f.path}: disposition "${f.disposition}" requires a rationale`, at);
      }
      items[idx] = { ...items[idx], proposedDisposition: f.disposition, proposedRationale: f.rationale, proposedTargetOwner: targets[0] ?? null };
    }
  }
  return { inventory: { ...inventory, items, claimLedger }, registry: registry ? { ...registry, identityGaps: gapRows } : null, findings };
}

// ---- Conservation ---------------------------------------------------------
// Invariants hold on today's data and are fatal in every mode: a claim identity
// that vanished, a live row without a known disposition, a retired row without
// one, a required target that is missing, two owners for one semantic claim,
// growth under the legacy roots, an inventory that no longer matches the tree.
// Completeness findings describe data that is legitimately unfinished before the
// cutover (blocking or unreviewed rows, rationale-less rows, open registry rows,
// unreviewed dropped claims); they are reported with counts and become fatal in
// strict (cutover) mode, where a missing conservation input is fatal as well.

const registryRows = (registry) => [...(registry?.units || []), ...(registry?.retiredUnits || []), ...(registry?.identityGaps || [])];
const EXAMPLE_LIMIT = 5;

function summarizeOpen(type, message, items, describe) {
  return items.length === 0 ? null : { type, message, count: items.length, examples: items.slice(0, EXAMPLE_LIMIT).map(describe) };
}

/** Every claim id of the previous registry is still a live, gap or retired row of the current one. */
export function validateRowSetConservation(registry, previousRegistry, label = 'the previous registry') {
  if (!previousRegistry) return [];
  const present = new Set(registryRows(registry).map((row) => row?.claimId).filter(Boolean));
  return registryRows(previousRegistry)
    .filter((row) => row?.claimId && !present.has(row.claimId))
    .map((row) => ({ type: 'claim-id-not-conserved', path: row.sourcePath, message: `${row.sourcePath}: claim ${row.claimId} (${row.sourceAnchor}) of ${label} is neither a live, gap nor retired row of the current registry` }));
}

/** Rows that share a semanticClaimId must not name two different target owners. */
export function validateSemanticClaimOwners(claimLedger) {
  const owners = new Map();
  for (const claim of claimLedger || []) {
    if (!claim?.semanticClaimId || typeof claim.targetOwner !== 'string' || claim.targetOwner === '') continue;
    const set = owners.get(claim.semanticClaimId) || new Set();
    set.add(claim.targetOwner);
    owners.set(claim.semanticClaimId, set);
  }
  return [...owners.entries()]
    .filter(([, set]) => set.size > 1)
    .map(([semanticClaimId, set]) => ({ type: 'semantic-claim-multiple-owners', message: `semantic claim ${semanticClaimId} names ${set.size} different target owners: ${[...set].sort().join(', ')}` }));
}

/** Every claim row has a disposition of the vocabulary, and a target owner when that disposition requires one. */
export function validateClaimDispositions(claimLedger, vocabulary) {
  const findings = [];
  const dispositions = new Map((vocabulary?.sourceDispositions || []).map((d) => [d.id, d]));
  for (const claim of claimLedger || []) {
    const disposition = dispositions.get(claim?.disposition);
    if (typeof claim?.disposition !== 'string' || claim.disposition === '') findings.push({ type: 'claim-disposition-missing', path: claim?.sourcePath, message: `${claim?.sourcePath}: claim ${claim?.claimId} has no disposition` });
    else if (!disposition) findings.push({ type: 'claim-disposition-unknown', path: claim.sourcePath, message: `${claim.sourcePath}: claim ${claim.claimId} disposition "${claim.disposition}" is not in the vocabulary` });
    else if (disposition.requiresTargetOwner && (typeof claim.targetOwner !== 'string' || claim.targetOwner === '')) findings.push({ type: 'claim-target-owner-missing', path: claim.sourcePath, message: `${claim.sourcePath}: claim ${claim.claimId} disposition "${claim.disposition}" requires a targetOwner` });
  }
  return findings;
}

/** A recorded removal names a vocabulary disposition; a retired row without one is not a recorded removal. */
export function validateRetiredRowDispositions(registry, vocabulary) {
  const known = new Set((vocabulary?.sourceDispositions || []).map((d) => d.id));
  return (registry?.retiredUnits || [])
    .filter((row) => !known.has(row?.disposition))
    .map((row) => ({ type: 'retired-row-disposition-missing', path: row?.sourcePath, message: `${row?.sourcePath}: retired claim ${row?.claimId} (${row?.sourceAnchor}) has no vocabulary disposition, so its removal is not recorded` }));
}

/** Legacy-root growth found by the ratchet, one finding per ratchet violation. */
export function validateLegacyGrowth(ratchetResult) {
  return (ratchetResult?.findings || []).map((f) => ({ type: `legacy-growth-${f.type}`, path: f.path, message: f.message }));
}

/** The saved inventory describes the tree it is checked against, and the registry on disk is the one it was generated from. */
export function validateInventoryFreshness({ inventory, headCommit, repoRoot, registryBytes = null }) {
  const findings = [];
  if (headCommit && inventory?.commit && !registryBindsToCommit(inventory.commit, headCommit, repoRoot)) {
    findings.push({ type: 'inventory-stale', message: `the inventory was generated at ${inventory.commit} and the in-scope tree at ${headCommit} differs; regenerate with: node scripts/generate-doc-inventory.mjs --refresh --commit ${headCommit}` });
  }
  const recorded = inventory?.identityRegistry?.sha256;
  if (registryBytes && recorded && sha256Buffer(registryBytes) !== recorded) {
    findings.push({ type: 'identity-registry-digest-mismatch', message: 'the identity registry on disk is not the file the inventory was generated from (sha256 differs); regenerate the inventory' });
  }
  return findings;
}

/** A document is an evidence mirror when it is a payload nested below a verification directory of the legacy or platform tree. */
export function isEvidenceMirrorPath(p) {
  return /^docs\/(?:architect|platform)\/(?:.+\/)?verification\/[^/]+\/.+/.test(p);
}

/** The first scope value that is an option-looking string or matches no inventory path: such a scope would filter every row out and let strict pass vacuously. */
export function findUnmatchedScope(scope, inventory) {
  return (scope || []).find((value) => value.startsWith('--') || !(inventory?.items || []).some((item) => pathInScope(item.path, [value])));
}

/** A path is in scope when no scope is given, or it equals a scope value or lies below one. */
export function pathInScope(p, scope) {
  if (!Array.isArray(scope) || scope.length === 0) return true;
  return typeof p === 'string' && scope.some((s) => p === s || p.startsWith(s.endsWith('/') ? s : `${s}/`));
}

export function unreferencedCandidateRows(inventory, shards, { scope = null } = {}) {
  const candidates = new Set((inventory.items || []).filter((item) => item.authorityStatus === 'candidate').map((item) => item.path));
  const canonical = new Set((inventory.items || []).filter((item) => ['candidate', 'promoted'].includes(item.authorityStatus)).map((item) => item.path));
  const claimIds = new Set();
  const mirrorSources = new Set();
  for (const shard of shards || []) {
    for (const row of shard.claims || []) claimIds.add(row.claimId);
    for (const entry of shard.exact || []) for (const row of entry.rows || []) claimIds.add(row.claimId);
    for (const mirror of shard.mirrors || []) mirrorSources.add(mirror.path);
  }
  const named = new Set();
  const ownersInScope = new Set();
  for (const row of inventory.claimLedger || []) {
    if (canonical.has(row.sourcePath) || (!claimIds.has(row.claimId) && !mirrorSources.has(row.sourcePath)) || !row.targetOwner || !row.targetAnchor) continue;
    named.add(`${row.targetOwner}#${row.targetAnchor}`);
    if (pathInScope(row.sourcePath, scope)) ownersInScope.add(row.targetOwner);
  }
  for (const shard of shards || []) for (const file of shard.files || []) if (pathInScope(file.path, scope)) for (const owner of file.targets || []) ownersInScope.add(owner);
  const namespaces = [...ownersInScope].map((owner) => {
    const parts = owner.split('/');
    return parts.length > 3 ? parts.slice(0, 3).join('/') + '/' : owner;
  });
  const scoped = Array.isArray(scope) && scope.length > 0;
  return (inventory.claimLedger || []).filter((row) => candidates.has(row.sourcePath) &&
    (!scoped || pathInScope(row.sourcePath, scope) || namespaces.some((prefix) => prefix.endsWith('/') ? row.sourcePath.startsWith(prefix) : row.sourcePath === prefix)) &&
    !named.has(`${row.sourcePath}#${row.sourceAnchor}`)).map((row) => ({
      claimId: row.claimId, path: row.sourcePath, anchor: row.sourceAnchor, unitDigest: row.sourceUnitDigest,
    }));
}

/** Open data that blocks the cutover but is not corruption before it. */
export function summarizeConservationCompleteness({ inventory, registry, vocabulary, droppedClaimsRegister = null, scope = null, unreferencedCandidateRows = [] }) {
  const dispositions = new Map((vocabulary?.sourceDispositions || []).map((d) => [d.id, d]));
  const inScope = (p) => pathInScope(p, scope);
  const claims = (inventory?.claimLedger || []).filter((c) => inScope(c?.sourcePath));
  const unitOwners = new Map();
  for (const claim of claims) {
    if (!claim?.sourceUnitDigest || typeof claim.targetOwner !== 'string' || claim.targetOwner === '') continue;
    const set = unitOwners.get(claim.sourceUnitDigest) || new Set();
    set.add(claim.targetOwner);
    unitOwners.set(claim.sourceUnitDigest, set);
  }
  const open = [
    summarizeOpen('files-unknown-blocking', 'inventory files whose file-level disposition is unknown-blocking', (inventory?.items || []).filter((i) => i.proposedDisposition === 'unknown-blocking' && inScope(i.path)), (i) => i.path),
    summarizeOpen('claims-unknown-blocking', 'claim rows whose disposition is unknown-blocking', claims.filter((c) => c.disposition === 'unknown-blocking'), (c) => `${c.sourcePath}#${c.sourceAnchor}`),
    summarizeOpen('claims-partial-carry', 'claim rows whose disposition is partial-carry (the target carries only part of the unit; blocks the cutover)', [...claims.filter((c) => c.disposition === 'partial-carry'), ...(registry?.identityGaps || []).filter((row) => inScope(row?.sourcePath) && row?.disposition === 'partial-carry')], (c) => `${c.sourcePath}#${c.sourceAnchor}`),
    summarizeOpen('claims-not-reviewed', 'claim rows whose reviewStatus is not reviewed', claims.filter((c) => c.reviewStatus !== 'reviewed'), (c) => `${c.sourcePath}#${c.sourceAnchor}`),
    summarizeOpen('claims-without-own-rationale', 'claim rows whose disposition requires a rationale and that carry none of their own', claims.filter((c) => dispositions.get(c.disposition)?.requiresRationale && !(typeof c.rationale === 'string' && c.rationale !== '')), (c) => `${c.sourcePath}#${c.sourceAnchor}`),
    summarizeOpen('identical-units-multiple-owners', 'identical source units whose rows name different target owners', [...unitOwners.entries()].filter(([, set]) => set.size > 1), ([digest, set]) => `${digest.slice(0, 12)}: ${[...set].sort().join(', ')}`),
    summarizeOpen('registry-gaps-without-disposition', 'registry identity-gap rows with no vocabulary disposition', (registry?.identityGaps || []).filter((row) => inScope(row?.sourcePath) && !dispositions.has(row?.disposition)), (row) => `${row.sourcePath}#${row.sourceAnchor}`),
    summarizeOpen('retired-rows-incomplete', 'retired rows without a required target owner or a rationale', (registry?.retiredUnits || []).filter((row) => {
      if (!inScope(row?.sourcePath)) return false;
      const disposition = dispositions.get(row?.disposition);
      return disposition && ((disposition.requiresTargetOwner && !row.targetOwner) || (disposition.requiresRationale && !(row.dispositionRationale || row.retiredReason)));
    }), (row) => `${row.sourcePath}#${row.sourceAnchor}`),
    summarizeOpen('dropped-claims-unreviewed', 'dropped-claims register entries without a reviewedDisposition (decision, reviewer, reviewedAt)', (droppedClaimsRegister?.entries || []).filter((entry) => {
      if (!inScope(entry?.source?.path)) return false;
      const review = entry?.reviewedDisposition;
      return !review || ['decision', 'reviewer', 'reviewedAt'].some((field) => typeof review[field] !== 'string' || review[field].trim() === '');
    }), (entry) => entry.id),
    summarizeOpen('candidate-blocks-unreferenced', 'candidate conservation units not named by a source decision', unreferencedCandidateRows, (row) => `${row.path}#${row.anchor}`),
  ];
  return open.filter(Boolean);
}

/** Runs every conservation rule; invariant findings are fatal in all modes, open findings only when strict. */
export function checkConservation({ inventory, registry, previousRegistries = [], vocabulary, droppedClaimsRegister = null, ratchetResult = null, scope = null, decisions = null }) {
  const invariant = [
    ...previousRegistries.flatMap(({ registry: previous, label }) => validateRowSetConservation(registry, previous, label)),
    ...validateSemanticClaimOwners(inventory?.claimLedger),
    ...validateClaimDispositions(inventory?.claimLedger, vocabulary),
    ...validateRetiredRowDispositions(registry, vocabulary),
    ...(ratchetResult ? validateLegacyGrowth(ratchetResult) : []),
  ];
  const reverseEnabled = (decisions || []).some((shard) => shard.authorshipRequired === true);
  const reverseRows = reverseEnabled ? unreferencedCandidateRows(inventory, decisions, { scope }) : [];
  const open = summarizeConservationCompleteness({ inventory, registry, vocabulary, droppedClaimsRegister, scope, unreferencedCandidateRows: reverseRows });
  return { invariant, open, ...(reverseEnabled ? { unreferencedCandidateRows: reverseRows } : {}) };
}

export function checkInventory({ repoRoot, inventory, vocabulary, identityRegistry = null, droppedClaimsRegister = null, previousRegistries = [], ratchetResult = null, strict = false, headCommit = null, registryBytes = null, missingInputs = [], decisions = null, scope = null }) {
  const targetAnchorsOf = inventory.commit ? buildTargetAnchorLookup(repoRoot, inventory.commit) : null;
  const decisionFindings = [];
  let conservationRegistry = identityRegistry;
  let validTargetOwners = inventory.commit ? deriveValidTargetOwnersFromSwitchboard(loadSwitchboard(inventory.commit, repoRoot)) : null;
  if (decisions && decisions.length > 0) {
    const applied = applyDecisions(inventory, decisions, { vocabulary, targetAnchorsOf, targetUnitDigestOf: inventory.commit ? buildTargetUnitDigestLookup(repoRoot, inventory.commit) : null, unitsOf: inventory.commit ? buildConservationUnitLookup(repoRoot, inventory.commit) : null, registry: identityRegistry, repoRoot });
    inventory = applied.inventory;
    // Only the conservation open-data summary reads the overlaid gap rows; the identity and dropped-claim validators keep the registry as committed.
    conservationRegistry = applied.registry || identityRegistry;
    decisionFindings.push(...applied.findings);
    validTargetOwners = new Set([...(validTargetOwners || defaultSwitchboardOwners(inventory)), ...decidedPlatformOwners(inventory, decisions)]);
  }
  const fatalFindings = [
    ...decisionFindings,
    ...validateStructure(inventory),
    ...validateAgainstVocabulary(inventory, vocabulary, validTargetOwners, { targetAnchorsOf }),
    ...validateCommitBlobIntegrity(repoRoot, inventory),
    ...validateSourceUnitCoverage(repoRoot, inventory),
    ...validateIdentityRegistry(inventory, identityRegistry, { repoRoot }),
    ...(droppedClaimsRegister ? validateDroppedClaims(droppedClaimsRegister, { ledgerClaimIds: new Set((inventory.claimLedger || []).map((c) => c.claimId)), registry: identityRegistry, unitsOf: inventory.commit ? buildConservationUnitLookup(repoRoot, inventory.commit) : null }) : []),
  ];
  const conservation = checkConservation({ inventory, registry: conservationRegistry, previousRegistries, vocabulary, droppedClaimsRegister, ratchetResult, scope, decisions });
  fatalFindings.push(...validateInventoryFreshness({ inventory, headCommit, repoRoot, registryBytes }), ...conservation.invariant);
  const strictFindings = strict ? [
    ...conservation.open.map((o) => ({ type: o.type, message: `${o.count} ${o.message} (e.g. ${o.examples.join(', ')})` })),
    ...missingInputs.map((input) => ({ type: 'conservation-input-missing', message: `strict mode needs ${input}` })),
  ] : [];

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

  const allFatal = [...fatalFindings, ...coverageFindings, ...strictFindings];

  return {
    clean: allFatal.length === 0,
    fatalFindings: allFatal,
    conservationOpen: conservation.open,
    explicitOpenFindings: {
      ...(conservation.unreferencedCandidateRows !== undefined ? { unreferencedCandidateRows: conservation.unreferencedCandidateRows } : {}),
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

export function loadJson(filePath) {
  if (!fs.existsSync(filePath)) throw new Error(`File not found: ${filePath}`);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function currentCommit(cwd) {
  try { return execFileSync('git', ['rev-parse', 'HEAD'], { cwd, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim(); }
  catch { return '<commit>'; }
}

// One command: reuses the committed identity registry when the in-scope tree
// still matches it, otherwise carries identity forward from it, then regenerates.
export function regenerateCommand({ inventoryPath, identityRegistryPath, cwd }) {
  const rel = (p) => normalizePosix(path.relative(cwd, p) || p);
  return `node scripts/generate-doc-inventory.mjs --refresh --commit ${currentCommit(cwd)} --identity-registry ${rel(identityRegistryPath)} --json-out ${rel(inventoryPath)} --md-out ${rel(inventoryPath).replace(/\.json$/, '.md')}`;
}

// The manifest is committed but its shards are not, so a fresh checkout has to
// regenerate them before the inventory can be read.
export function loadInventory(filePath, context) {
  if (!fs.existsSync(filePath)) throw new Error(`File not found: ${filePath}. Regenerate with: ${regenerateCommand(context)}`);
  try { return loadShardedJsonArtifact(filePath, { allowLegacyRawJson: false }); }
  catch (err) { throw new Error(`inventory shards unreadable (${err.message}). The shards are not committed; regenerate with: ${regenerateCommand(context)}`); }
}

export const DEFAULT_INVENTORY_PATH = INVENTORY_MANIFEST_PATH;
export const DEFAULT_VOCABULARY_PATH = 'plans/260925-documentation-authority-unification/claim-and-disposition-vocabulary.json';
export const DEFAULT_DROPPED_CLAIMS_REGISTER_PATH = 'plans/260925-documentation-authority-unification/dropped-claims-register.json';
export const DEFAULT_IDENTITY_REGISTRY_PATH = IDENTITY_REGISTRY_PATH;
// The registry sealed at the end of the first inventory generation; row-set
// conservation is measured against it unless --previous-registry names another.
export const DEFAULT_PREVIOUS_REGISTRY_PATH = 'plans/260925-documentation-authority-unification/reports/phase-02-identity-registry.json';

/** Runs the legacy-docs ratchet against the working tree; null when its baseline is absent. */
export function loadRatchetResult(repoRoot, argv = []) {
  const baselinePath = path.resolve(repoRoot, RATCHET_BASELINE_PATH);
  if (argv.includes('--no-ratchet') || !fs.existsSync(baselinePath)) return null;
  const exceptionsPath = path.resolve(repoRoot, RATCHET_EXCEPTIONS_PATH);
  return checkRatchet({ repoRoot, baseline: loadJson(baselinePath), exceptions: fs.existsSync(exceptionsPath) ? loadJson(exceptionsPath) : undefined });
}

/** Explicit flag: the file must exist. Default path: a missing file skips the check with a notice. */
export function loadDroppedClaimsRegister(argv, cwd) {
  const idx = argv.indexOf('--dropped-claims-register');
  if (idx >= 0) return { register: loadJson(path.resolve(cwd, argv[idx + 1])), notice: null };
  const defaultPath = path.resolve(cwd, DEFAULT_DROPPED_CLAIMS_REGISTER_PATH);
  if (!fs.existsSync(defaultPath)) return { register: null, notice: `dropped-claims register not found at ${DEFAULT_DROPPED_CLAIMS_REGISTER_PATH}; dropped-claim conservation check skipped` };
  return { register: loadJson(defaultPath), notice: null };
}

/**
 * The registries a claim id must survive: the sealed first-generation registry
 * and the registry committed at HEAD (what a refresh is about to replace).
 * `--previous-registry <path>` names one instead; a named path that is missing
 * is an error. Absent defaults are returned as `missing` so strict mode can
 * refuse to run without them.
 */
export function loadPreviousRegistries({ repoRoot, cwd, argv, registryRelPath = IDENTITY_REGISTRY_PATH }) {
  const idx = argv.indexOf('--previous-registry');
  if (idx >= 0) return { registries: [{ registry: loadJson(path.resolve(cwd, argv[idx + 1])), label: `the registry ${argv[idx + 1]}` }], missing: [] };
  const registries = [];
  const missing = [];
  const sealedPath = path.resolve(cwd, DEFAULT_PREVIOUS_REGISTRY_PATH);
  if (fs.existsSync(sealedPath)) registries.push({ registry: loadJson(sealedPath), label: 'the sealed first-generation registry' });
  else missing.push(`the sealed registry ${DEFAULT_PREVIOUS_REGISTRY_PATH}`);
  try {
    const committed = execFileSync('git', ['show', `HEAD:${registryRelPath}`], { cwd: repoRoot, maxBuffer: 1024 * 1024 * 1024, stdio: ['pipe', 'pipe', 'pipe'] });
    registries.push({ registry: JSON.parse(committed.toString('utf8')), label: 'the registry committed at HEAD' });
  } catch { missing.push(`the registry committed at HEAD (${registryRelPath})`); }
  return { registries, missing };
}

function headCommitOf(repoRoot) {
  try { return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim(); }
  catch { return null; }
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
  const strict = argv.includes('--strict') || argv.includes('--cutover');
  const previousIdx = argv.indexOf('--previous-registry');
  const decisionPaths = [];
  for (let idx = 0; idx < argv.length; idx++) {
    if (argv[idx] !== '--decisions') continue;
    const value = argv[idx + 1];
    if (!value || value.startsWith('--')) {
      console.error('check-doc-inventory-gates error loading input: --decisions requires a file or directory path');
      return 1;
    }
    decisionPaths.push(path.resolve(cwd, value));
    idx++;
  }
  const scope = argv.flatMap((arg, idx) => (arg === '--scope' && argv[idx + 1] ? [argv[idx + 1]] : []));

  let inventory;
  let decisions = null;
  let vocabulary;
  let identityRegistry;
  let previousRegistries = [];
  const missingInputs = [];
  let registryBytes = null;
  let ratchetResult = null;
  let droppedClaimsRegister;
  let droppedClaimsNotice;
  try {
    inventory = loadInventory(inventoryPath, { inventoryPath, identityRegistryPath, cwd });
    vocabulary = loadJson(vocabularyPath);
    registryBytes = fs.readFileSync(identityRegistryPath);
    identityRegistry = JSON.parse(registryBytes.toString('utf8'));
    ({ register: droppedClaimsRegister, notice: droppedClaimsNotice } = loadDroppedClaimsRegister(argv, cwd));
    if (droppedClaimsRegister === null) missingInputs.push('the dropped-claims register');
    const previous = loadPreviousRegistries({ repoRoot, cwd, argv, registryRelPath: normalizePosix(path.relative(repoRoot, identityRegistryPath)) });
    previousRegistries = previous.registries;
    for (const gone of previous.missing) {
      console.error(`check-doc-inventory-gates: ${gone} not found; row-set conservation against it skipped`);
      missingInputs.push(gone);
    }
    if (decisionPaths.length > 0) decisions = decisionPaths.flatMap((target) => loadDecisionShards(target));
    ratchetResult = loadRatchetResult(repoRoot, argv);
    if (ratchetResult === null) missingInputs.push('the legacy-docs ratchet (baseline missing or --no-ratchet)');
    if (droppedClaimsNotice) console.error(`check-doc-inventory-gates: ${droppedClaimsNotice}`);
  } catch (err) {
    console.error(`check-doc-inventory-gates error loading input: ${err.message}`);
    return 1;
  }

  const scopeProblem = findUnmatchedScope(scope, inventory);
  if (scopeProblem !== undefined) {
    console.error(`check-doc-inventory-gates error loading input: --scope ${scopeProblem} matches no inventory path (a scope that matches nothing would make strict pass vacuously)`);
    return 1;
  }
  if (scope.length > 0 && !asJson) console.log(`check-doc-inventory-gates: strict open-data checks scoped to ${scope.join(', ')}`);

  let result;
  try {
    result = checkInventory({ repoRoot, inventory, vocabulary, identityRegistry, droppedClaimsRegister, previousRegistries, ratchetResult, strict, headCommit: headCommitOf(repoRoot), registryBytes, missingInputs, decisions, scope });
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
  console.log(`check-doc-inventory-gates: conservation: ${previousRegistries.length > 0 ? `row set conserved against ${previousRegistries.length} previous registr${previousRegistries.length === 1 ? 'y' : 'ies'}` : 'row-set check skipped'}, one owner per semantic claim, dispositions and targets present, ${ratchetResult ? 'legacy-docs ratchet clean' : 'ratchet skipped'}.`);
  if (result.conservationOpen.length > 0) {
    console.log('check-doc-inventory-gates: open conservation data (fatal with --strict or --cutover):');
    for (const o of result.conservationOpen) console.log(`  - ${o.type}: ${o.count} (${o.message})`);
  }
  return 0;
}

if (isMainModule(import.meta.url)) {
  process.exitCode = runCli(process.argv.slice(2), process.cwd());
}
