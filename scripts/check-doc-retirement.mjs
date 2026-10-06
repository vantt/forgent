#!/usr/bin/env node
// check-doc-retirement.mjs -- retirement-check dry run for the documentation
// cutover.
//
// The minimum constitution lists the checks a legacy source must pass before it
// may be deleted or redirected (retirementGate) and before a candidate becomes
// canonical (promotionGate). This script evaluates every one of those checks
// against the saved inventory and the working tree and reports which of them
// block the cutover today and by how much. It composes the existing checks
// (inventory gates, ledger cutover mode, ratchet, alias table, candidate-status
// check, promotion report); it owns no rule of its own.
//
// Default run: a report. The exit code is 1 only when an input cannot be read
// or a conservation invariant fails. --cutover: strict mode, exit 1 while any
// check is blocked. A check the constitution still marks "planned" is blocked
// by definition, and a check without an evaluator is reported as unevaluated
// and blocked, so a gate cannot be forgotten silently.

import fs from 'node:fs';
import path from 'node:path';
import { isMainModule } from './lib/is-main-module.mjs';
import {
  checkConservation,
  loadInventory,
  loadJson,
  loadRatchetResult,
  loadDroppedClaimsRegister,
  DEFAULT_VOCABULARY_PATH,
  DEFAULT_IDENTITY_REGISTRY_PATH,
  DEFAULT_PREVIOUS_REGISTRY_PATH,
  DEFAULT_INVENTORY_PATH,
} from './check-doc-inventory-gates.mjs';
import { summarizeCutoverRows, summarizeLedger, checkPromotion, trackedPlatformDocs, DEFAULT_CONSTITUTION_PATH, DEFAULT_SCHEMA_PATH } from './check-doc-constitution.mjs';
import { validateAliasTable, DEFAULT_ALIAS_TABLE_PATH, splitRef } from './doc-alias-resolver.mjs';
import { checkCandidateMetadata, DEFAULT_SWITCHBOARD_PATH } from './check-doc-candidate-status.mjs';

export const LEGACY_ROOTS = ['docs/specs/', 'docs/architect/'];
export const DEFAULT_EVIDENCE_MANIFEST_PATH = 'docs/platform/history/documentation-authority-unification/evidence-relocation-manifest.json';
// Consumers under these prefixes are history or evidence, not authority readers.
const NON_AUTHORITY_CONSUMER_PREFIXES = ['docs/history/', 'archive/', 'plans/', '.fgos/'];

const isLegacyPath = (p) => typeof p === 'string' && LEGACY_ROOTS.some((root) => p.startsWith(root));
const isAuthorityConsumer = (p) => typeof p === 'string' && !isLegacyPath(p) && !NON_AUTHORITY_CONSUMER_PREFIXES.some((prefix) => p.startsWith(prefix));

const pass = (measure) => ({ status: 'pass', measure });
const blocked = (measure) => ({ status: 'blocked', measure });
const verdict = (count, describe) => (count === 0 ? pass(`none: ${describe}`) : blocked(`${count} ${describe}`));
const openCount = (open, type) => open.find((o) => o.type === type)?.count ?? 0;

/** Legacy paths that an immutable reference points at and that no alias resolves. */
export function uncoveredImmutableTargets(inventory, aliasTable) {
  const aliased = new Set((aliasTable?.entries || []).map((e) => splitRef(e.fromPath).path));
  const targets = new Set();
  for (const edge of inventory?.immutableRefEdges || []) for (const target of edge?.targetPaths || []) if (isLegacyPath(target)) targets.add(target);
  return { targets: targets.size, uncovered: [...targets].filter((t) => !aliased.has(t)).sort() };
}

/** Consumer edges that read a legacy path from outside the legacy roots and outside history, by consumer kind. */
export function unrewrittenConsumerEdges(inventory) {
  const byKind = {};
  let total = 0;
  for (const edge of inventory?.consumerEdges || []) {
    if (!isLegacyPath(edge?.targetPath) || !isAuthorityConsumer(edge?.path)) continue;
    byKind[edge.kind] = (byKind[edge.kind] || 0) + 1;
    total += 1;
  }
  return { total, byKind };
}

/**
 * Evaluates one constitution check against the gathered inputs. Every
 * evaluator returns { status: 'pass' | 'blocked', measure }.
 */
const EVALUATORS = {
  'file-disposition': ({ inventory }) => verdict((inventory.items || []).filter((i) => i.proposedDisposition === 'unknown-blocking').length, 'inventory files whose file-level disposition is unknown-blocking'),
  'claims-closed': ({ conservation }) => verdict(openCount(conservation.open, 'claims-unknown-blocking') + openCount(conservation.open, 'claims-not-reviewed'), 'claim rows that are unknown-blocking or unreviewed (overlapping counts)'),
  'claims-reviewed': ({ conservation }) => verdict(openCount(conservation.open, 'claims-not-reviewed'), 'claim rows whose reviewStatus is not reviewed'),
  'owner-per-claim': ({ cutoverRows }) => verdict((cutoverRows.byReason['retained-without-owner'] || 0) + (cutoverRows.byReason['unknown-blocking'] || 0), 'retained rows without an owner plus unknown-blocking rows'),
  'dropped-claims-resolved': ({ conservation }) => verdict(openCount(conservation.open, 'dropped-claims-unreviewed'), 'dropped-claims register entries without a reviewed disposition'),
  'aliases-cover-immutable-refs': ({ inventory, aliasTable, aliasFindings }) => {
    const { targets, uncovered } = uncoveredImmutableTargets(inventory, aliasTable);
    if (aliasFindings.length > 0) return blocked(`alias table invalid: ${aliasFindings.length} finding(s)`);
    return uncovered.length === 0 ? pass(`all ${targets} legacy paths named by immutable references resolve through the alias table`) : blocked(`${uncovered.length} of ${targets} legacy paths named by immutable references have no alias entry (alias table holds ${(aliasTable?.entries || []).length} entries)`);
  },
  'consumers-rewritten': ({ inventory }) => {
    const { total, byKind } = unrewrittenConsumerEdges(inventory);
    return verdict(total, `consumer edges read a legacy path from outside the legacy roots and history (upper bound, not yet proven non-authority; by kind ${JSON.stringify(byKind)})`);
  },
  'evidence-digests': ({ evidenceManifestPresent }) => (evidenceManifestPresent ? pass('relocation manifest present') : blocked('no evidence relocation manifest and no verifier exist yet')),
  'write-lease': () => blocked('the lease is a design only (cutover-write-lease-design.md); no door, hook guard or doctor check exists'),
  'no-new-legacy-growth': ({ ratchetResult }) => (ratchetResult === null ? blocked('ratchet baseline unavailable') : verdict(ratchetResult.findings.length, 'legacy-docs ratchet violations')),
  'row-set-conserved': ({ conservation }) => verdict(conservation.invariant.filter((f) => f.type === 'claim-id-not-conserved').length, 'previous claim ids missing from the current registry'),
  'one-owner-per-semantic-claim': ({ conservation }) => verdict(conservation.invariant.filter((f) => f.type === 'semantic-claim-multiple-owners').length, 'semantic claims with more than one owner'),
  'cutover-mode': ({ cutoverRows, usageDrift }) => verdict(cutoverRows.total + usageDrift.length, `ledger cutover violations (${JSON.stringify(cutoverRows.byReason)}) plus ${usageDrift.length} vocabulary usage drift(s)`),
  'reviewed-rationale': ({ cutoverRows }) => verdict(cutoverRows.byReason['without-own-rationale'] || 0, 'rows whose disposition requires a rationale and that carry none of their own'),
  'canonical-metadata-complete': ({ promotion }) => verdict(promotion.canonicalDocuments - promotion.complete, `of ${promotion.canonicalDocuments} canonical platform documents lack promotion fields (${promotion.headerless} headerless, ${promotion.headeredIncomplete} incomplete)`),
  'metadata-and-structure': ({ candidateStatus }) => {
    const { byStatus, byType } = candidateStatus.counts;
    const missing = (byType['missing-candidate-fields'] || 0) + (byType['missing-promotion-fields'] || 0);
    return verdict(byStatus.unrouted + missing, `platform documents with no switchboard status (${byStatus.unrouted}) or missing metadata fields (${missing})`);
  },
  'links-resolve': ({ candidateStatus }) => verdict((candidateStatus.counts.byType['unresolved-link'] || 0) + (candidateStatus.counts.byType['unresolved-related'] || 0), 'unresolved relative links or Related paths in candidate and promoted documents'),
};

/**
 * One result per check of the constitution's promotion and retirement gates.
 * A planned check is blocked by definition; a check with no evaluator is
 * reported unevaluated and blocked; a review check is listed, not computed.
 */
export function evaluateRetirement(inputs, constitution) {
  const results = [];
  const seen = new Set();
  for (const gate of ['promotionGate', 'retirementGate']) {
    for (const check of constitution?.[gate]?.checks || []) {
      const key = `${gate}:${check.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const kind = check.enforcedBy?.kind;
      const base = { gate, id: check.id, rule: check.rule, enforcedBy: kind };
      if (kind === 'review') { results.push({ ...base, status: 'review', measure: `human review: ${check.enforcedBy.reference || ''}`.trim() }); continue; }
      const evaluate = EVALUATORS[check.id];
      if (!evaluate) { results.push({ ...base, status: 'blocked', measure: 'no evaluator for this check (unevaluated)' }); continue; }
      const result = evaluate(inputs);
      if (kind === 'planned' && result.status === 'pass') results.push({ ...base, status: 'blocked', measure: `constitution still marks this check planned (${check.enforcedBy.deliverable}); computed: ${result.measure}` });
      else results.push({ ...base, ...result });
    }
  }
  // Plan section 10: no unresolved claim conflict. Duplicate and semantic-conflict groups are the conflict inventory.
  const groups = (inputs.inventory.duplicateContentGroups || []).length + (inputs.inventory.semanticConflictGroups || []).length;
  results.push({ gate: 'plan-acceptance', id: 'no-unresolved-conflicts', rule: 'No unresolved claim conflict remains.', enforcedBy: 'script', ...verdict(groups, `duplicate-content and semantic-conflict groups still open (${(inputs.inventory.duplicateContentGroups || []).length} + ${(inputs.inventory.semanticConflictGroups || []).length})`) });
  return results;
}

export function summarizeResults(results) {
  const counts = { pass: 0, blocked: 0, review: 0 };
  for (const r of results) counts[r.status] += 1;
  return counts;
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
  const inventory = loadInventory(inventoryPath, { inventoryPath, identityRegistryPath, cwd });
  const registry = loadJson(identityRegistryPath);
  const previousPath = option('--previous-registry', DEFAULT_PREVIOUS_REGISTRY_PATH);
  const previousRegistry = fs.existsSync(previousPath) ? loadJson(previousPath) : null;
  const { register: droppedClaimsRegister } = loadDroppedClaimsRegister(argv, cwd);
  const ratchetResult = loadRatchetResult(repoRoot, argv);

  const conservation = checkConservation({ inventory, registry, previousRegistry, vocabulary, droppedClaimsRegister, ratchetResult });
  const itemRationaleByPath = new Map((inventory.items || []).filter((i) => i.proposedRationale).map((i) => [i.path, i.proposedRationale]));
  const ledger = summarizeLedger(inventory.claimLedger, schema, vocabulary, { constitution, itemRationaleByPath });
  const files = trackedPlatformDocs(repoRoot);
  const readFile = (file) => { try { return fs.readFileSync(path.resolve(repoRoot, file), 'utf8'); } catch { return ''; } };
  return {
    inventory,
    conservation,
    cutoverRows: summarizeCutoverRows(inventory.claimLedger, vocabulary),
    usageDrift: ledger.usageDrift,
    aliasTable,
    aliasFindings: validateAliasTable(aliasTable, { repoRoot, constitution }),
    ratchetResult,
    promotion: checkPromotion(files, constitution, readFile, repoRoot),
    candidateStatus: checkCandidateMetadata({ files, readFile, switchboard, constitution, repoRoot }),
    evidenceManifestPresent: fs.existsSync(path.resolve(repoRoot, DEFAULT_EVIDENCE_MANIFEST_PATH)),
    constitution,
  };
}

export function runCli(argv, cwd = process.cwd()) {
  const repoRootIdx = argv.indexOf('--repo-root');
  const repoRoot = path.resolve(cwd, repoRootIdx >= 0 ? argv[repoRootIdx + 1] : cwd);
  const cutover = argv.includes('--cutover');
  let inputs;
  try {
    inputs = gatherInputs({ repoRoot, argv, cwd });
  } catch (err) {
    console.error(`check-doc-retirement error loading input: ${err.message}`);
    return 1;
  }
  const results = evaluateRetirement(inputs, inputs.constitution);
  const counts = summarizeResults(results);
  const invariantFailures = inputs.conservation.invariant;
  if (argv.includes('--json')) {
    console.log(JSON.stringify({ mode: cutover ? 'cutover' : 'dry-run', counts, results, invariantFailures }, null, 2));
  } else {
    console.log(`check-doc-retirement (${cutover ? 'cutover, strict' : 'dry run'}): ${counts.blocked} blocked, ${counts.pass} pass, ${counts.review} owed to human review, ${invariantFailures.length} conservation invariant failure(s).`);
    for (const r of results) console.log(`  [${r.status.padEnd(7)}] ${r.gate}/${r.id}: ${r.measure}`);
    for (const f of invariantFailures.slice(0, 20)) console.error(`  - [${f.type}] ${f.message}`);
  }
  return exitCodeFor({ cutover, counts, invariantFailures });
}

/** Dry run: fatal only for a failed conservation invariant. Cutover: also fatal while any check is blocked. */
export function exitCodeFor({ cutover, counts, invariantFailures }) {
  if (invariantFailures.length > 0) return 1;
  return cutover && counts.blocked > 0 ? 1 : 0;
}

if (isMainModule(import.meta.url)) {
  process.exitCode = runCli(process.argv.slice(2), process.cwd());
}
