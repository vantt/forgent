#!/usr/bin/env node
// check-doc-retirement.mjs -- retirement-check dry run for the documentation
// cutover.
//
// The minimum constitution lists the checks a legacy source must pass before it
// may be deleted or redirected (retirementGate) and before a candidate becomes
// canonical (promotionGate). This script evaluates every one of those checks
// against the saved inventory and the working tree and reports which of them
// block the cutover today and by how much. It runs the inventory gates (so a
// stale or tampered inventory is fatal) and composes the existing checks
// (ledger cutover mode, ratchet, alias table, candidate-status check, promotion
// report); the few measures it owns are the consumer and history-reference
// counts and the conflict-group count.
//
// Default run: a report. The exit code is 1 only when an input cannot be read
// or an inventory-gate invariant fails. --cutover: strict mode, exit 1 while any
// check is blocked or still owed to human review. A check the constitution still
// marks "planned" is blocked by definition, a check without an evaluator is
// reported as unevaluated and blocked, and an evaluator whose check the
// constitution no longer lists is blocked too, so a gate cannot be dropped
// silently. A review check passes only with a recorded review (--review-record).

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { isMainModule } from './lib/is-main-module.mjs';
import {
  checkInventory,
  isEvidenceMirrorPath,
  loadInventory,
  loadJson,
  loadPreviousRegistries,
  loadRatchetResult,
  loadDroppedClaimsRegister,
  DEFAULT_VOCABULARY_PATH,
  DEFAULT_IDENTITY_REGISTRY_PATH,
  DEFAULT_INVENTORY_PATH,
} from './check-doc-inventory-gates.mjs';
import { summarizeCutoverRows, summarizeLedger, checkPromotion, trackedPlatformDocs, DEFAULT_CONSTITUTION_PATH, DEFAULT_SCHEMA_PATH } from './check-doc-constitution.mjs';
import { validateAliasTable, DEFAULT_ALIAS_TABLE_PATH } from './doc-alias-resolver.mjs';
import { checkCandidateMetadata, DEFAULT_SWITCHBOARD_PATH } from './check-doc-candidate-status.mjs';
import { normalizePosix } from './generate-shipped-path-inventory.mjs';

export const LEGACY_ROOTS = ['docs/specs/', 'docs/architect/'];
export const DEFAULT_CONFLICT_RESOLUTIONS_PATH = path.posix.join(path.posix.dirname(DEFAULT_CONSTITUTION_PATH), 'ledger/conflict-resolutions.json');
export const DEFAULT_RETIRING_ROOTS_PATH = path.posix.join(path.posix.dirname(DEFAULT_CONSTITUTION_PATH), 'ledger/retiring-roots.json');
// Consumers under these prefixes are history or evidence, not authority readers.
const NON_AUTHORITY_CONSUMER_PREFIXES = ['docs/history/', 'archive/', 'plans/', '.fgos/'];

const isLegacyPath = (p) => typeof p === 'string' && LEGACY_ROOTS.some((root) => p.startsWith(root));
const isHistoryConsumer = (p) => typeof p === 'string' && NON_AUTHORITY_CONSUMER_PREFIXES.some((prefix) => p.startsWith(prefix));
const isAuthorityConsumer = (p, isRetiring = isLegacyPath) => typeof p === 'string' && !isRetiring(p) && !isHistoryConsumer(p);

function retiringPathPredicate(data = null) {
  if (data === null) return isLegacyPath;
  if (data?.version !== 1 || !Array.isArray(data.documents) || Object.keys(data).some((key) => !['version', 'documents'].includes(key)) ||
      data.documents.some((file) => typeof file !== 'string' || path.posix.normalize(file) !== file || !/^docs\/.+\.[a-z0-9]+$/.test(file) || file.startsWith('docs/platform/') || file === 'docs/decisions/index.md')) {
    throw new Error('retiring document data must name exact docs files, never directory roots, candidates, instruction files or the kept decision projection');
  }
  const documents = new Set(data.documents);
  return (file) => isLegacyPath(file) || documents.has(file);
}

const pass = (measure) => ({ status: 'pass', measure });
const blocked = (measure) => ({ status: 'blocked', measure });
const verdict = (count, describe) => (count === 0 ? pass(`none: ${describe}`) : blocked(`${count} ${describe}`));
const openCount = (open, type) => open.find((o) => o.type === type)?.count ?? 0;

/**
 * Legacy paths that history (archive, journals, event logs, plans) reads by
 * path and that no bare-path alias resolves. An alias recorded for one anchor
 * covers only references to that anchor, not the document.
 */
export function uncoveredHistoryReferences(inventory, aliasTable, retiringRoots = null) {
  const isRetiring = retiringPathPredicate(retiringRoots);
  const aliased = new Set((aliasTable?.entries || []).map((e) => e.fromPath).filter((from) => typeof from === 'string' && !from.includes('#')));
  const targets = new Set();
  for (const edge of inventory?.consumerEdges || []) if (isRetiring(edge?.targetPath) && isHistoryConsumer(edge?.path)) targets.add(edge.targetPath);
  return { targets: targets.size, uncovered: [...targets].filter((t) => !aliased.has(t)).sort() };
}

/** Consumer edges that read a legacy path from outside the legacy roots and outside history, by consumer kind. */
export function unrewrittenConsumerEdges(inventory, retiringRoots = null) {
  const isRetiring = retiringPathPredicate(retiringRoots);
  const byKind = {};
  let total = 0;
  for (const edge of inventory?.consumerEdges || []) {
    if (!isRetiring(edge?.targetPath) || !isAuthorityConsumer(edge?.path, isRetiring)) continue;
    byKind[edge.kind] = (byKind[edge.kind] || 0) + 1;
    total += 1;
  }
  const unresolvedDynamic = (inventory?.consumerEdges || []).filter((e) => e?.identityStatus === 'unresolved-dynamic-pattern' && isAuthorityConsumer(e?.path, isRetiring)).length;
  return { total, byKind, unresolvedDynamic };
}

/**
 * Duplicate-content groups that still need a decision: a group whose members
 * are all evidence-payload mirrors resolves by deduplication, not by choosing
 * an owner.
 */
export function openConflictGroups(inventory, resolutions = null) {
  const all = inventory?.duplicateContentGroups || [];
  const duplicates = all.filter((g) => !(g?.paths || []).every(isEvidenceMirrorPath));
  const semantic = inventory?.semanticConflictGroups || [];
  const closed = new Set();
  if (resolutions !== null) {
    if (resolutions?.version !== 1 || !Array.isArray(resolutions.groups)) throw new Error('conflict resolution data must be version 1 with a groups array');
    for (const entry of resolutions.groups) {
      const id = `${entry?.kind}:${entry?.key}`;
      if (!['duplicate', 'semantic'].includes(entry?.kind) || typeof entry.key !== 'string' || !entry.key.trim() ||
          !['resolution', 'rule'].every((field) => typeof entry[field] === 'string' && entry[field].trim()) ||
          !Array.isArray(entry.evidence) || entry.evidence.length === 0 || entry.evidence.some((value) => typeof value !== 'string' || !value.trim()) ||
          closed.has(id)) throw new Error(`conflict resolution ${id} is malformed or recorded twice`);
      closed.add(id);
    }
  }
  return {
    duplicates: duplicates.filter((group) => !closed.has(`duplicate:${group.blobSha}`)).length,
    mirrors: all.length - duplicates.length,
    semantic: semantic.filter((group) => !closed.has(`semantic:${group.key}`)).length,
  };
}

const countsOfCandidateStatus = (candidateStatus) => {
  const { byStatus, byType, exemptUnrouted = 0 } = candidateStatus.counts;
  const missing = (byType['missing-candidate-fields'] || 0) + (byType['missing-promotion-fields'] || 0);
  return { unrouted: byStatus.unrouted - exemptUnrouted, missing, links: (byType['unresolved-link'] || 0) + (byType['unresolved-related'] || 0), conflicts: byType['switchboard-route-conflict'] || 0, unplaced: byType['unplaced-document'] || 0 };
};

/**
 * Evaluates one constitution check against the gathered inputs. Every
 * evaluator returns { status: 'pass' | 'blocked', measure }.
 */
const EVALUATORS = {
  'file-disposition': ({ conservation }) => verdict(openCount(conservation.open, 'files-unknown-blocking'), 'inventory files whose file-level disposition is unknown-blocking'),
  'claims-closed': ({ conservation }) => verdict(openCount(conservation.open, 'claims-unknown-blocking') + openCount(conservation.open, 'claims-partial-carry') + openCount(conservation.open, 'claims-not-reviewed'), 'claim rows that are unknown-blocking, partial-carry or unreviewed (overlapping counts)'),
  'claims-reviewed': ({ conservation }) => verdict(openCount(conservation.open, 'claims-not-reviewed'), 'claim rows whose reviewStatus is not reviewed'),
  'owner-per-claim': ({ conservation, cutoverRows }) => verdict(conservation.invariant.filter((f) => /^retained-claim-/.test(f.type)).length + (cutoverRows.byReason['retained-without-owner'] || 0) + (cutoverRows.byReason['unknown-blocking'] || 0) + (cutoverRows.byReason['partial-carry'] || 0), 'owner violations of retained rows, retained rows without an owner and unknown-blocking rows'),
  'dropped-claims-resolved': ({ conservation }) => verdict(openCount(conservation.open, 'dropped-claims-unreviewed'), 'dropped-claims register entries without a reviewed disposition'),
  'aliases-cover-immutable-refs': ({ inventory, aliasTable, aliasFindings, retiringRoots }) => {
    if (aliasFindings.length > 0) return blocked(`alias table invalid: ${aliasFindings.length} finding(s)`);
    const { targets, uncovered } = uncoveredHistoryReferences(inventory, aliasTable, retiringRoots);
    return uncovered.length === 0 ? pass(`all ${targets} legacy paths that history reads by path resolve through the alias table`) : blocked(`${uncovered.length} of ${targets} legacy paths that history reads by path have no bare-path alias (alias table holds ${(aliasTable?.entries || []).length} entries)`);
  },
  'consumers-rewritten': ({ inventory, retiringRoots }) => {
    const { total, byKind, unresolvedDynamic } = unrewrittenConsumerEdges(inventory, retiringRoots);
    return verdict(total, `consumer edges read a legacy path from outside the legacy roots and history (upper bound, not yet proven non-authority; by kind ${JSON.stringify(byKind)}; ${unresolvedDynamic} unresolved dynamic patterns from authority consumers are not counted)`);
  },
  'evidence-digests': () => blocked('no evidence relocation manifest and no verifier exist; this dry run does not execute one'),
  'no-new-legacy-growth': ({ ratchetResult }) => (ratchetResult === null ? blocked('ratchet baseline unavailable') : verdict(ratchetResult.findings.length, 'legacy-docs ratchet violations')),
  'row-set-conserved': ({ previousRegistries, conservation }) => (previousRegistries.length === 0
    ? blocked('no previous registry to conserve against')
    : verdict(conservation.invariant.filter((f) => f.type === 'claim-id-not-conserved' || f.type === 'retired-row-disposition-missing').length, `previous claim ids missing from the current registry, or retired rows without a disposition (against ${previousRegistries.length} registr${previousRegistries.length === 1 ? 'y' : 'ies'})`)),
  'one-owner-per-semantic-claim': ({ conservation }) => verdict(conservation.invariant.filter((f) => f.type === 'semantic-claim-multiple-owners').length, 'semantic claims with more than one owner'),
  'write-lease': () => blocked('the lease is a design only (cutover-write-lease-design.md); no door, hook guard or doctor check exists'),
  'cutover-mode': ({ cutoverRows, usageDrift }) => verdict(cutoverRows.total + usageDrift.length, `ledger cutover violations (${JSON.stringify(cutoverRows.byReason)}) plus ${usageDrift.length} vocabulary usage drift(s)`),
  'reviewed-rationale': ({ cutoverRows }) => verdict(cutoverRows.byReason['without-own-rationale'] || 0, 'rows whose disposition requires a rationale and that carry none of their own'),
  'canonical-metadata-complete': ({ promotion }) => verdict(promotion.canonicalDocuments - promotion.complete, `of ${promotion.canonicalDocuments} canonical platform documents lack promotion fields (${promotion.headerless} headerless, ${promotion.headeredIncomplete} incomplete)`),
  'metadata-and-structure': ({ candidateStatus }) => {
    const c = countsOfCandidateStatus(candidateStatus);
    return verdict(c.unrouted + c.missing + c.unplaced + c.conflicts, `platform documents with no switchboard status (${c.unrouted}, evidence payloads excluded), missing metadata fields (${c.missing}), no placement (${c.unplaced}) or an ambiguous route (${c.conflicts})`);
  },
  'links-resolve': ({ candidateStatus }) => verdict(countsOfCandidateStatus(candidateStatus).links, 'unresolved relative links or Related paths in candidate and promoted documents'),
};

const hasReviewRecord = (record) => ['reviewer', 'reviewedAt', 'evidence'].every((field) => typeof record?.[field] === 'string' && record[field].trim() !== '');

/**
 * One result per check of the constitution's promotion and retirement gates.
 * A planned check is blocked by definition; a check with no evaluator is
 * reported unevaluated and blocked; a review check is open until a review
 * record names reviewer, date and evidence; an evaluator without a check in the
 * constitution is blocked as a dropped gate.
 */
export function evaluateRetirement(inputs, constitution) {
  const results = [];
  const seen = new Set();
  const listed = new Set();
  for (const gate of ['promotionGate', 'retirementGate']) {
    for (const check of constitution?.[gate]?.checks || []) {
      const key = `${gate}:${check.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      listed.add(check.id);
      const kind = check.enforcedBy?.kind;
      const base = { gate, id: check.id, rule: check.rule, enforcedBy: kind };
      if (kind === 'review') {
        const record = inputs.reviewRecords?.[check.id];
        results.push(hasReviewRecord(record)
          ? { ...base, status: 'pass', measure: `reviewed by ${record.reviewer} on ${record.reviewedAt}: ${record.evidence}` }
          : { ...base, status: 'review', measure: `human review owed (${check.enforcedBy.reference || 'no reference'}); record it with --review-record` });
        continue;
      }
      const evaluate = EVALUATORS[check.id];
      if (!evaluate) { results.push({ ...base, status: 'blocked', measure: 'no evaluator for this check (unevaluated)' }); continue; }
      const result = evaluate(inputs);
      if (kind === 'planned' && result.status === 'pass') results.push({ ...base, status: 'blocked', measure: `constitution still marks this check planned (${check.enforcedBy.deliverable}); computed: ${result.measure}` });
      else results.push({ ...base, ...result });
    }
  }
  for (const id of Object.keys(EVALUATORS)) {
    if (!listed.has(id)) results.push({ gate: 'constitution', id, rule: 'A check this script evaluates is missing from the constitution.', enforcedBy: 'script', status: 'blocked', measure: 'the constitution no longer lists this check; a gate was dropped or renamed' });
  }
  // Acceptance of the migration: no unresolved claim conflict remains.
  const groups = openConflictGroups(inputs.inventory, inputs.conflictResolutions ?? null);
  results.push({ gate: 'migration-acceptance', id: 'no-unresolved-conflicts', rule: 'No unresolved claim conflict remains.', enforcedBy: 'script', ...verdict(groups.duplicates + groups.semantic, `duplicate-content groups (${groups.duplicates}, excluding ${groups.mirrors} evidence mirrors that resolve by deduplication) and semantic-conflict groups (${groups.semantic}) still open`) });
  return results;
}

export function summarizeResults(results) {
  const counts = { pass: 0, blocked: 0, review: 0 };
  for (const r of results) counts[r.status] += 1;
  return counts;
}

function headCommitOf(repoRoot) {
  try { return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim(); }
  catch { return null; }
}

function gatherInputs({ repoRoot, argv, cwd }) {
  const option = (name, fallback) => path.resolve(cwd, argv.indexOf(name) >= 0 ? argv[argv.indexOf(name) + 1] : fallback);
  const inventoryPath = option('--inventory', DEFAULT_INVENTORY_PATH);
  const identityRegistryPath = option('--identity-registry', DEFAULT_IDENTITY_REGISTRY_PATH);
  const vocabulary = loadJson(option('--vocabulary', DEFAULT_VOCABULARY_PATH));
  const constitution = loadJson(option('--constitution', DEFAULT_CONSTITUTION_PATH));
  const schema = loadJson(option('--schema', DEFAULT_SCHEMA_PATH));
  const switchboard = loadJson(option('--switchboard', DEFAULT_SWITCHBOARD_PATH));
  const aliasTable = loadJson(option('--alias-table', DEFAULT_ALIAS_TABLE_PATH));
  const reviewIdx = argv.indexOf('--review-record');
  const reviewRecords = reviewIdx >= 0 ? loadJson(path.resolve(cwd, argv[reviewIdx + 1])) : {};
  const conflictPath = option('--conflict-resolutions', DEFAULT_CONFLICT_RESOLUTIONS_PATH);
  const conflictResolutions = argv.includes('--conflict-resolutions') || fs.existsSync(conflictPath) ? loadJson(conflictPath) : null;
  const retiringPath = option('--retiring-roots', DEFAULT_RETIRING_ROOTS_PATH);
  const retiringRoots = argv.includes('--retiring-roots') || fs.existsSync(retiringPath) ? loadJson(retiringPath) : null;
  const inventory = loadInventory(inventoryPath, { inventoryPath, identityRegistryPath, cwd });
  const registryBytes = fs.readFileSync(identityRegistryPath);
  const registry = JSON.parse(registryBytes.toString('utf8'));
  const previous = loadPreviousRegistries({ repoRoot, cwd, argv, registryRelPath: normalizePosix(path.relative(repoRoot, identityRegistryPath)) });
  const { register: droppedClaimsRegister } = loadDroppedClaimsRegister(argv, cwd);
  const ratchetResult = loadRatchetResult(repoRoot, argv);

  const gate = checkInventory({ repoRoot, inventory, vocabulary, identityRegistry: registry, droppedClaimsRegister, previousRegistries: previous.registries, ratchetResult, headCommit: headCommitOf(repoRoot), registryBytes });
  const itemRationaleByPath = new Map((inventory.items || []).filter((i) => i.proposedRationale).map((i) => [i.path, i.proposedRationale]));
  const ledger = summarizeLedger(inventory.claimLedger, schema, vocabulary, { constitution, itemRationaleByPath });
  const files = trackedPlatformDocs(repoRoot);
  const readFile = (file) => { try { return fs.readFileSync(path.resolve(repoRoot, file), 'utf8'); } catch { return ''; } };
  return {
    inventory,
    // The gate's fatal findings are the invariant failures; its open data feeds the evaluators.
    gateFatalFindings: gate.fatalFindings,
    conservation: { invariant: gate.fatalFindings, open: gate.conservationOpen },
    previousRegistries: previous.registries,
    cutoverRows: summarizeCutoverRows(inventory.claimLedger, vocabulary),
    usageDrift: ledger.usageDrift,
    aliasTable,
    aliasFindings: validateAliasTable(aliasTable, { repoRoot, constitution }),
    ratchetResult,
    promotion: checkPromotion(files, constitution, readFile, repoRoot),
    candidateStatus: checkCandidateMetadata({ files, readFile, switchboard, constitution, repoRoot }),
    reviewRecords,
    conflictResolutions,
    retiringRoots,
    constitution,
  };
}

export function runCli(argv, cwd = process.cwd()) {
  const repoRootIdx = argv.indexOf('--repo-root');
  const repoRoot = path.resolve(cwd, repoRootIdx >= 0 ? argv[repoRootIdx + 1] : cwd);
  const cutover = argv.includes('--cutover');
  let inputs;
  let results;
  try {
    inputs = gatherInputs({ repoRoot, argv, cwd });
    results = evaluateRetirement(inputs, inputs.constitution);
  } catch (err) {
    console.error(`check-doc-retirement error loading input: ${err.message}`);
    return 1;
  }
  const counts = summarizeResults(results);
  const invariantFailures = inputs.gateFatalFindings;
  if (argv.includes('--json')) {
    console.log(JSON.stringify({ mode: cutover ? 'cutover' : 'dry-run', counts, results, invariantFailures }, null, 2));
  } else {
    console.log(`check-doc-retirement (${cutover ? 'cutover, strict' : 'dry run'}): ${counts.blocked} blocked, ${counts.pass} pass, ${counts.review} owed to human review, ${invariantFailures.length} inventory-gate invariant failure(s).`);
    for (const r of results) console.log(`  [${r.status.padEnd(7)}] ${r.gate}/${r.id}: ${r.measure}`);
    for (const f of invariantFailures.slice(0, 20)) console.error(`  - [${f.type}] ${f.message}`);
  }
  return exitCodeFor({ cutover, counts, invariantFailures });
}

/** Dry run: fatal only for an inventory-gate invariant. Cutover: also fatal while any check is blocked or owed to review. */
export function exitCodeFor({ cutover, counts, invariantFailures }) {
  if (invariantFailures.length > 0) return 1;
  return cutover && counts.blocked + counts.review > 0 ? 1 : 0;
}

if (isMainModule(import.meta.url)) {
  process.exitCode = runCli(process.argv.slice(2), process.cwd());
}
