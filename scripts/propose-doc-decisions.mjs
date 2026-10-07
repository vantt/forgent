#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createHash, randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { loadShardedJsonArtifact } from './doc-inventory-artifact.mjs';
import { applyDecisions, buildCommittedReviewReportLookup, buildConservationUnitLookup, classifyExactCarry, isEvidenceMirrorPath, isLegacySourceItem, loadDecisionShards, reviewSessionIdentity, validateManualReview } from './check-doc-inventory-gates.mjs';
import { isMainModule } from './lib/is-main-module.mjs';

const RECONCILIATION = ['docs/distribution-vision.md', 'docs/id-systems-audit.md', 'docs/work-item-lifecycle-vision.md', 'docs/backlog.md', 'docs/platform/proposals/documentation-system-unification.md'];
const CLASSES = ['Mirror', 'Unit-exact', 'Weak-exact', 'Judgment'];
export const HELP = `Usage: node scripts/propose-doc-decisions.mjs <mode> [options]

Modes:
  --summary                  Report per-area/class counts and unresolved groups.
  --propose                  Propose exact entries and pending weaker rows.
  --pack <shard>             Markdown full-text/diff pack and reverse units.
  --seed-pack <pack.json>    Reviewer-only Markdown sensitivity pack; --key required.
  --score-pack <key>         Score the reviewer's markdown --verdicts.
  --apply-review <shard>     Apply independent markdown verdicts to the shard.
  --coverage                 Legacy-source coverage by Source tables and mirrors.
  --rebind <shard>           Unique digest plus recorded heading ancestry required.
  --snapshot                 Dry-run merged legacy ledger rows plus sha256.
  --verify <snapshot>        Recompute rows and sha256 against the same inputs.
  --help                     Print this contract.

Committed reports bind Reviewer, Pack commit, Pack id, Seed score and each
claim's ok verdict/note. Approvals pin their own report commit; existing
reviewed rows must verify before pack/apply, including earlier rounds.
Pack modes write Markdown. With --out <pack.md>, a bound <pack.md>.json
sidecar is also written for --seed-pack and --review-pack. The reviewer
reads the Markdown, not the machine sidecar. Other modes retain JSON output.

Inputs:
  --inventory <manifest>     Required inventory; units read at its pinned commit.
  --repo-root <directory>    Repository containing that commit (default: cwd).
  --source <path>            Source document for --propose.
  --target <path>            Counterpart document for --propose.
  --shard <name>             Required proposed shard identity (version stays 1).
  --author <identity>        Required author for pending rows; not a script identity.
  --out <path>               Write JSON to this path; otherwise print JSON.
  --reviewer <identity>      reviewer:<model>-session:<id>@<date>; independent.
  --verdicts <report.md>     Reviewer header and claimId/verdict/note table.
  --seed <text>             Required reproducible seed for --seed-pack.
  --key <path>              Separate seeded key, withheld until verdict commit.
  --maps <file-or-directory> Frozen area-map markdown for --coverage.
                            Source cells use backticks: path, directory/**,
                            path#anchor or path#start..end (inclusive sections).
  --decisions <path>         Repeatable decision input for coverage/snapshot/verify.
  --identity-registry <path> Required pinned registry for snapshot/verify gap rows.
  --review-pack <path>       Required full pack seen by the reviewer for apply.
  --seed-key <path>          Required private sensitivity key for apply.
  --seed-verdicts <report>   Required sensitivity verdicts; must score passing.

Proof: Unit-exact requires one target digest match, equal ancestor heading titles,
at least 40 source characters and at least half the source document's units exact.
Every weaker exact match stays pending with its demotion reason. No judgment row
is reviewed by this command. Mirror rows are counted only after full blob equality.
Corpus rules select whole history-evidence, user-knowledge or consumer-project
corpora, all non-authority and all named in sources. History uses retain-as-evidence;
the other two use reclassify-out-of-platform-scope. Pending rules approve nothing.
Reviewed rules require authorSession and authoredBy independent from reviewedBy,
and a committed review-<step>-<shard>.md: Reviewer header, Corpus, Rule digest
(corpusRuleDigest export), and corpus:<name> | ok | own note. Expansion preserves
the rule's human identities/report and adds each item's classification rationale.
Review modes never edit target documents. --apply-review writes the shard in place
and names its report; the gate accepts reviewed rows only after that report is
committed. Verdicts are ok, rework or hold with an own note for every pending row.
Hold/rework keeps unknown-blocking rows blocking and other rows pending; no approval
identity/date remains. The reviewer lists held unknown-blocking rows in owner queue.
Apply verifies the private key by replay and requires a passing sensitivity score.
The manual report echoes Pack commit, Pack id and Seed score headers. Approval
stamps the shown target digest/ancestry and refuses current text or context drift;
it never approves text merely because that text exists at application time.
Seed packs contain 24 byte-equal controls and six real mutations, shuffled; score
passes at >=5/6 mutations caught and <=2/24 false flags. The author must not run
--seed-pack on a real batch. Key and pack output paths must differ.
The same-batch sensitivity pool also includes current script-proven carries and
unchanged independently reviewed rows; their decisions are never reopened.
Apply rebuilds those control proofs, rejecting invented or stale pool entries.
Coverage accepts explicit source cells path[#range] and directory/** in the
first column of frozen map tables; target mentions never count as source coverage.
--summary --coverage combines both reports. Snapshot rows exclude docs/platform/
sources and project only the frozen claim-ledger schema fields. Snapshot is a
dry run, not a sealed format. Verify fails if content or sha256 differs.
`;

export function analyzeCounterpart({ inventory, unitsOf }, source, target) {
  const sourceUnits = unitsOf(source) || [];
  const targetUnits = unitsOf(target) || [];
  const sourceItem = inventory.items.find((item) => item.path === source);
  const targetItem = inventory.items.find((item) => item.path === target);
  const mirror = source.startsWith('docs/architect/') && isEvidenceMirrorPath(source) && target.startsWith('docs/platform/') && isEvidenceMirrorPath(target) && sourceItem?.blobSha && sourceItem.blobSha === targetItem?.blobSha;
  return inventory.claimLedger.filter((row) => row.sourcePath === source).map((row) => ({
    claimId: row.claimId,
    source,
    target,
    ...classifyExactCarry(sourceUnits, targetUnits, row),
    ...(mirror ? { class: 'Mirror', reason: 'byte-identical pinned evidence blobs' } : {}),
  }));
}

export function proposeExactDecisions(context, { source, target, shard, author }) {
  if (!source || !target || !shard || !author || author.startsWith('script:')) throw new Error('--propose requires --source, --target, --shard and a non-script --author');
  if (source === target || !context.inventory.items.some((item) => item.path === source && isLegacySourceItem(item)) || !context.inventory.items.some((item) => item.path === target && item.path.startsWith('docs/platform/'))) throw new Error('proposal requires a legacy source and a distinct platform counterpart in the pinned inventory');
  const analysis = analyzeCounterpart(context, source, target);
  const rows = new Map(context.inventory.claimLedger.filter((row) => row.sourcePath === source).map((row) => [row.claimId, row]));
  const exact = [];
  const claims = [];
  const sourceItem = context.inventory.items.find((item) => item.path === source);
  const mirrors = [];
  if (analysis.length && analysis.every((row) => row.class === 'Mirror')) mirrors.push({ path: source, target, blobSha: sourceItem.blobSha });
  else for (const proposal of analysis) {
    const row = rows.get(proposal.claimId);
    if (proposal.class === 'Unit-exact') exact.push({ claimId: row.claimId, sourceUnitDigest: row.sourceUnitDigest, targetUnitDigest: proposal.targetUnit.textDigest });
    else claims.push({
      claimId: row.claimId, sourceUnitDigest: row.sourceUnitDigest,
      targetOwner: proposal.targetUnit ? target : null, targetAnchor: proposal.targetUnit?.anchor ?? null,
      claimKind: row.claimKind,
      disposition: proposal.targetUnit ? 'promote' : 'unknown-blocking',
      reviewStatus: proposal.targetUnit ? 'pending' : 'blocking',
      authoredBy: author,
      rationale: `${proposal.class}: ${proposal.reason}. A human decision is required before this proposal can be reviewed.`,
      ...(!proposal.targetUnit ? { searched: [source, target, 'all counterpart unit digests'] } : {}),
    });
  }
  return { version: 1, shard, sources: [source], authorSession: author, authorshipRequired: true, claims, ...(mirrors.length ? { mirrors } : {}), ...(exact.length ? { exact: [{ source, target, rows: exact }] } : {}) };
}

export function summarizeInventory(context) {
  const { inventory } = context;
  const sourceItems = inventory.items.filter(isLegacySourceItem);
  const byArea = new Map();
  const totals = Object.fromEntries(CLASSES.map((name) => [name, 0]));
  const items = new Map(inventory.items.map((item) => [item.path, item]));
  const rowsByPath = new Map();
  for (const row of inventory.claimLedger) {
    const rows = rowsByPath.get(row.sourcePath) || [];
    rows.push(row);
    rowsByPath.set(row.sourcePath, rows);
  }
  const files = [];
  for (const item of sourceItems) {
    const target = item.path.startsWith('docs/architect/') ? item.path.replace('docs/architect/', 'docs/platform/') : null;
    const classes = Object.fromEntries(CLASSES.map((name) => [name, 0]));
    const analysis = target && items.has(target) ? analyzeCounterpart(context, item.path, target) : (rowsByPath.get(item.path) || []).map(() => ({ class: 'Judgment' }));
    for (const row of analysis) { classes[row.class]++; totals[row.class]++; }
    const area = item.area || 'Unmapped';
    const bucket = byArea.get(area) || { area, files: 0, rows: 0, classes: Object.fromEntries(CLASSES.map((name) => [name, 0])) };
    bucket.files++; bucket.rows += analysis.length;
    for (const name of CLASSES) bucket.classes[name] += classes[name];
    byArea.set(area, bucket);
    files.push({ path: item.path, area, target: target && items.has(target) ? target : null, rows: analysis.length, classes });
  }
  const legacyMembers = (group) => (group.paths || []).filter((p) => p.startsWith('docs/architect/') || p.startsWith('docs/specs/') || sourceItems.some((item) => item.path === p));
  const duplicates = inventory.duplicateContentGroups || [];
  const conflicts = inventory.semanticConflictGroups || [];
  const historical = (p) => /^(archive\/|plans\/|docs\/history\/|\.fgos\/)/.test(p) || p === 'CHANGELOG.md';
  const legacyPaths = new Set(sourceItems.map((item) => item.path));
  return {
    version: 1, commit: inventory.commit,
    sourceFiles: files.length, sourceRows: files.reduce((sum, file) => sum + file.rows, 0), classes: totals,
    areas: [...byArea.values()].sort((a, b) => a.area.localeCompare(b.area)), files,
    duplicateGroups: duplicates.length, semanticConflictGroups: conflicts.length,
    duplicateGroupsMultipleLegacyMembers: duplicates.filter((group) => legacyMembers(group).length > 1),
    duplicateGroupsNotAllMirror: duplicates.filter((group) => !(group.paths || []).every(isEvidenceMirrorPath)),
    semanticGroupsNotAllMirror: conflicts.filter((group) => !(group.paths || []).every(isEvidenceMirrorPath)),
    legacyHistoricalPaths: [...new Set((inventory.consumerEdges || []).filter((edge) => historical(edge.path) && legacyPaths.has(edge.targetPath)).map((edge) => edge.targetPath))].sort(),
    reconciliationSources: RECONCILIATION.filter((p) => items.has(p)).map((p) => ({ path: p, rows: (rowsByPath.get(p) || []).length })),
  };
}

export function loadProposalContext(inventoryPath, repoRoot) {
  const inventory = loadShardedJsonArtifact(inventoryPath);
  if (!inventory.commit) throw new Error('inventory must name its pinned commit');
  return { inventory, repoRoot, unitsOf: buildConservationUnitLookup(repoRoot, inventory.commit) };
}

export function independentReviewer(reviewer, author) {
  return Boolean(author) && /^reviewer:[^@\s]+-session:[^@\s]+@\d{4}-\d{2}-\d{2}$/.test(reviewer || '') && reviewSessionIdentity(reviewer) !== reviewSessionIdentity(author);
}

function requireVerifiedShard(context, shard) {
  if (shard.authorshipRequired && !shard.authorSession?.trim()) throw new Error('authorshipRequired needs authorSession');
  const reportOf = context.repoRoot && context.inventory.commit ? buildCommittedReviewReportLookup(context.repoRoot, context.inventory.commit) : () => null;
  for (const row of shard.claims || []) {
    if (row.reviewStatus !== 'reviewed') continue;
    const findings = validateManualReview(row, shard, reportOf);
    if (findings.length) throw new Error('pre-reviewed rows require committed review report verification: ' + findings.map((finding) => finding.type).join(', '));
  }
}

export function buildReviewPack(context, shard) {
  requireVerifiedShard(context, shard);
  const sourceRows = new Map(context.inventory.claimLedger.map((row) => [row.claimId, row]));
  const targets = new Set();
  const named = new Set();
  const reviewRow = (decision) => {
    const source = sourceRows.get(decision.claimId);
    if (!source || typeof decision.sourceUnitDigest !== 'string' || decision.sourceUnitDigest.length < 16 || !source.sourceUnitDigest.startsWith(decision.sourceUnitDigest)) throw new Error(`missing or stale source ${decision.claimId}`);
    const sourceUnit = (context.unitsOf(source.sourcePath) || []).find((unit) => unit.anchor === source.sourceAnchor && unit.textDigest === source.sourceUnitDigest);
    if (!sourceUnit) throw new Error(`missing source unit ${decision.claimId}`);
    const targetUnit = decision.targetOwner ? (context.unitsOf(decision.targetOwner) || []).find((unit) => unit.anchor === decision.targetAnchor) : null;
    if (decision.targetOwner && !targetUnit) throw new Error(`missing target unit ${decision.claimId}`);
    if (targetUnit) { targets.add(decision.targetOwner); named.add(`${decision.targetOwner}#${targetUnit.anchor}`); }
    return { claimId: decision.claimId, sourceUnitDigest: source.sourceUnitDigest, targetUnitDigest: targetUnit?.textDigest ?? null, decision: { ...decision }, source: { path: source.sourcePath, ...sourceUnit }, target: targetUnit ? { path: decision.targetOwner, ...targetUnit } : null };
  };
  const rows = (shard.claims || []).filter((row) => row.reviewStatus !== 'reviewed').map(reviewRow);
  const sensitivityControls = (shard.claims || []).filter((row) => row.reviewStatus === 'reviewed').map(reviewRow).filter((row) => row.target && typeof row.decision.targetUnitDigest === 'string' && row.decision.targetUnitDigest.length >= 16 && row.target.textDigest.startsWith(row.decision.targetUnitDigest) && JSON.stringify(row.decision.targetAncestry) === JSON.stringify(row.target.ancestry));
  if ((shard.exact || []).length || (shard.mirrors || []).length) {
    const scriptIds = new Set((shard.exact || []).flatMap((entry) => (entry.rows || []).map((row) => row.claimId)));
    for (const mirror of shard.mirrors || []) for (const row of context.inventory.claimLedger) if (row.sourcePath === mirror.path) scriptIds.add(row.claimId);
    const proof = applyDecisions(context.inventory, [{
      version: shard.version, shard: shard.shard, sources: shard.sources,
      authorSession: shard.authorSession, authorshipRequired: shard.authorshipRequired,
      exact: shard.exact, mirrors: shard.mirrors,
    }], {
      vocabulary: JSON.parse(fs.readFileSync(new URL('../plans/260925-documentation-authority-unification/claim-and-disposition-vocabulary.json', import.meta.url), 'utf8')),
      unitsOf: context.unitsOf, repoRoot: context.repoRoot,
      targetAnchorsOf: (owner) => { const units = context.unitsOf(owner); return units ? new Set(units.map((unit) => unit.anchor)) : null; },
      targetUnitDigestOf: (owner, anchor) => (context.unitsOf(owner) || []).find((unit) => unit.anchor === anchor)?.textDigest ?? null,
    });
    if (proof.findings.length) throw new Error('sensitivity script proof failed: ' + proof.findings.map((finding) => finding.type).join(', '));
    for (const row of proof.inventory.claimLedger) if (scriptIds.has(row.claimId)) sensitivityControls.push(reviewRow({
      ...Object.fromEntries(['claimId', 'sourceUnitDigest', 'targetOwner', 'targetAnchor', 'targetUnitDigest', 'claimKind', 'disposition', 'reviewStatus', 'authoredBy'].map((field) => [field, row[field]])),
      rationale: row.dispositionRationale,
    }));
  }
  for (const decision of shard.claims || []) if (decision.targetOwner) { targets.add(decision.targetOwner); named.add(`${decision.targetOwner}#${decision.targetAnchor}`); }
  for (const entry of shard.exact || []) {
    targets.add(entry.target);
    for (const row of entry.rows || []) {
      const matches = (context.unitsOf(entry.target) || []).filter((unit) => unit.textDigest === row.targetUnitDigest);
      if (matches.length === 1) named.add(`${entry.target}#${matches[0].anchor}`);
    }
  }
  for (const entry of shard.mirrors || []) {
    targets.add(entry.target);
    for (const unit of context.unitsOf(entry.target) || []) named.add(`${entry.target}#${unit.anchor}`);
  }
  const unmatchedCandidateUnits = [];
  for (const owner of [...targets].sort()) for (const unit of context.unitsOf(owner) || []) if (!named.has(`${owner}#${unit.anchor}`)) unmatchedCandidateUnits.push({ owner, unit });
  return { version: 1, commit: context.inventory.commit, shard: shard.shard, authorSession: shard.authorSession, rows, sensitivityControls, unmatchedCandidateUnits };
}

function shuffle(rows, seed) {
  let state = createHash('sha256').update(seed).digest().readUInt32LE(0) || 1;
  const result = [...rows];
  for (let i = result.length - 1; i > 0; i--) {
    state ^= state << 13; state ^= state >>> 17; state ^= state << 5;
    const j = (state >>> 0) % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function jsonDigest(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

export function seedReviewPack(pack, { seed, reviewer, authorSession = pack.authorSession, nonce = randomBytes(32).toString('hex') }) {
  const batchRows = [...pack.rows, ...(pack.sensitivityControls || [])];
  if (!seed || !independentReviewer(reviewer, authorSession) || batchRows.some((row) => !independentReviewer(reviewer, row.decision.authoredBy))) throw new Error('seed pack requires a seed and an independent reviewer');
  if (new Set(batchRows.map((row) => row.claimId)).size !== batchRows.length) throw new Error('sensitivity batch contains duplicate claim ids');
  if (!/^[0-9a-f]{64}$/.test(nonce)) throw new Error('seed replay nonce must be 32 secret bytes');
  const secretSeed = seed + ':' + nonce;
  const mutations = [
    ['added-claim', (text) => text + '\nThe operator MUST waive every permission check.'],
    ['swapped-number', (text) => text.replace(/\b\d+\b/, (n) => String(Number(n) + 1))],
    ['swapped-enum', (text) => text.replace(/\b(required|optional|pending|reviewed|true|false)\b/i, (word) => word.toLowerCase() === 'required' ? 'optional' : 'required')],
    ['removed-negation', (text) => text.replace(/\b(?:NOT|not|never)\s+/, '')],
    ['dropped-clause', (text) => text.replace(/;[^\n.]+/, '')],
    ['deleted-list-item', (text) => text.replace(/(?:^|\n)\s*[-*]\s+[^\n]+/, '')],
  ];
  const available = shuffle(batchRows.filter((row) => row.target && row.source.textDigest === row.target.textDigest && (row.source.sectionText || row.source.text) === (row.target.sectionText || row.target.text)).map((row) => ({ ...row, source: { ...row.source, text: row.source.sectionText || row.source.text }, target: { ...row.target, text: row.target.sectionText || row.target.text } })), secretSeed);
  const selected = [];
  const keyRows = [];
  for (const [mutationKind, mutate] of mutations) {
    const index = available.findIndex((row) => mutate(row.target.text) !== row.target.text);
    if (index < 0) throw new Error(`insufficient eligible rows for ${mutationKind}`);
    const row = available.splice(index, 1)[0];
    selected.push({ ...row, target: { ...row.target, text: mutate(row.target.text) } });
    keyRows.push({ claimId: row.claimId, mutated: true, mutationKind });
  }
  if (available.length < 24) throw new Error('seed pack requires 24 additional byte-equal controls');
  for (const row of available.slice(0, 24)) { selected.push(row); keyRows.push({ claimId: row.claimId, mutated: false }); }
  const displayUnit = (unit) => ({ path: unit.path, anchor: unit.anchor, ancestry: unit.ancestry, text: unit.text, textDigest: createHash('sha256').update(unit.text).digest('hex') });
  const shown = shuffle(selected, secretSeed + ':order').map((row) => ({
    claimId: row.claimId,
    decision: Object.fromEntries(['authoredBy', 'claimKind', 'disposition', 'rationale', 'remainder', 'targetOwner', 'targetAnchor'].filter((field) => row.decision[field] !== undefined).map((field) => [field, row.decision[field]])),
    source: displayUnit(row.source), target: displayUnit(row.target),
  }));
  return { pack: { version: 1, shard: pack.shard, rows: shown }, key: { version: 1, shard: pack.shard, commit: pack.commit, packId: jsonDigest(pack), seed, nonce, reviewer, rows: keyRows } };
}

function indexVerdicts(verdicts, expectedIds) {
  const index = new Map();
  for (const row of verdicts) {
    if (index.has(row.claimId)) throw new Error(`duplicate verdict ${row.claimId}`);
    if (!expectedIds.has(row.claimId)) throw new Error(`unknown verdict ${row.claimId}`);
    if (!['ok', 'rework', 'hold'].includes(row.verdict) || !row.note?.trim()) throw new Error(`verdict and own note required for ${row.claimId}`);
    index.set(row.claimId, row);
  }
  for (const id of expectedIds) if (!index.has(id)) throw new Error(`missing verdict ${id}`);
  return index;
}

export function scoreReviewPack(key, verdicts) {
  if (key.rows.length !== 30 || key.rows.filter((row) => row.mutated).length !== 6) throw new Error('invalid sensitivity key: expected 6 mutations and 24 controls');
  const index = indexVerdicts(verdicts, new Set(key.rows.map((row) => row.claimId)));
  const caught = key.rows.filter((row) => row.mutated && index.get(row.claimId).verdict !== 'ok').length;
  const falseFlags = key.rows.filter((row) => !row.mutated && index.get(row.claimId).verdict !== 'ok').length;
  const scoredVerdicts = [...index.values()].sort((a, b) => a.claimId.localeCompare(b.claimId));
  return { caught, mutations: 6, falseFlags, controls: 24, pass: caught >= 5 && falseFlags <= 2, reviewer: key.reviewer, commit: key.commit, packId: key.packId, scoreId: jsonDigest({ key, verdicts: scoredVerdicts }) };
}

export function parseReviewVerdicts(text, reviewer, binding = null) {
  const header = text.match(/^Reviewer:\s*(.+)$/im)?.[1]?.trim();
  if (header !== reviewer) throw new Error('reviewer header must equal --reviewer');
  if (binding) for (const [headerName, expected] of [['Pack commit', binding.commit], ['Pack id', binding.packId], ['Seed score', binding.scoreId]]) {
    const actual = text.match(new RegExp(`^${headerName}:\\s*(.+)$`, 'im'))?.[1]?.trim();
    if (actual !== expected) throw new Error(`review report ${headerName} does not match the shown pack or scored sensitivity result`);
  }
  const verdicts = [];
  for (const line of text.split(/\r?\n/)) {
    if (!/^\s*\|\s*claim_[0-9a-f]{32}\s*\|/.test(line)) continue;
    const cells = line.trim().split(/(?<!\\)\|/).slice(1, -1).map((cell) => cell.trim().replace(/\\\|/g, '|'));
    if (cells.length !== 3 || !['ok', 'rework', 'hold'].includes(cells[1]) || !cells[2]) throw new Error('verdict row requires claimId, verdict and own note');
    verdicts.push({ claimId: cells[0], verdict: cells[1], note: cells[2] });
  }
  if (!verdicts.length) throw new Error('review report has no verdict rows');
  return verdicts;
}

export function applyReviewVerdicts(context, shard, { verdicts, reviewer, reportPath, pack, seedProof, reviewedAt = new Date().toISOString().slice(0, 10) }) {
  requireVerifiedShard(context, shard);
  if (!reportPath || !independentReviewer(reviewer, shard.authorSession)) throw new Error('review application requires a report and an independent reviewer');
  const pending = (shard.claims || []).filter((row) => row.reviewStatus !== 'reviewed');
  const index = indexVerdicts(verdicts, new Set(pending.map((row) => row.claimId)));
  if (!pack || !seedProof?.key || !Array.isArray(seedProof.verdicts)) throw new Error('review application requires a passing sensitivity proof and the shown pack');
  if (pack.commit !== context.inventory.commit || pack.shard !== shard.shard) throw new Error('review pack commit or shard changed');
  const expectedKey = seedReviewPack(pack, { seed: seedProof.key.seed, nonce: seedProof.key.nonce, reviewer }).key;
  if (JSON.stringify(expectedKey) !== JSON.stringify(seedProof.key)) throw new Error('sensitivity key does not bind this exact review pack and reviewer');
  const score = scoreReviewPack(seedProof.key, seedProof.verdicts);
  if (!score.pass) throw new Error('sensitivity review did not pass the chosen thresholds');
  const shownRows = new Map(pack.rows.map((row) => [row.claimId, row]));
  const sourceRows = new Map(context.inventory.claimLedger.map((row) => [row.claimId, row]));
  const claims = shard.claims.map((row) => {
    if (row.reviewStatus === 'reviewed') return { ...row };
    if (!row.authoredBy || !independentReviewer(reviewer, row.authoredBy)) throw new Error(`independent reviewer required for ${row.claimId}`);
    const source = sourceRows.get(row.claimId);
    if (!source || typeof row.sourceUnitDigest !== 'string' || row.sourceUnitDigest.length < 16 || !source.sourceUnitDigest.startsWith(row.sourceUnitDigest)) throw new Error(`missing or stale source ${row.claimId}`);
    const shown = shownRows.get(row.claimId);
    if (!shown || shown.sourceUnitDigest !== source.sourceUnitDigest || shown.source.path !== source.sourcePath || shown.source.anchor !== source.sourceAnchor) throw new Error(`review pack source binding changed for ${row.claimId}`);
    const verdict = index.get(row.claimId);
    const updated = { ...row, reviewStatus: row.disposition === 'unknown-blocking' ? 'blocking' : 'pending', reviewNote: verdict.note };
    delete updated.reviewedBy; delete updated.reviewedAt; delete updated.targetUnitDigest;
    for (const field of ['targetAncestry', 'reviewReport', 'reviewReportCommit', 'reviewPackCommit', 'reviewPackId', 'seedScoreId']) delete updated[field];
    if (verdict.verdict === 'ok') {
      if (row.disposition === 'unknown-blocking') throw new Error(`unknown-blocking cannot be approved: ${row.claimId}`);
      const target = row.targetOwner ? (context.unitsOf(row.targetOwner) || []).find((unit) => unit.anchor === row.targetAnchor) : null;
      if (row.targetOwner && !target) throw new Error(`missing target for ${row.claimId}`);
      if (row.targetOwner && (shown.target?.path !== row.targetOwner || shown.target.anchor !== row.targetAnchor || shown.targetUnitDigest !== target.textDigest || shown.target.text !== target.text || shown.target.sectionText !== target.sectionText || JSON.stringify(shown.target.ancestry) !== JSON.stringify(target.ancestry))) throw new Error(`target text or ancestry changed after review pack for ${row.claimId}`);
      for (const field of ['targetOwner', 'targetAnchor', 'claimKind', 'disposition', 'rationale', 'remainder', 'stubOwner', 'stubAnchor']) if (shown.decision[field] !== row[field]) throw new Error(`review pack decision changed for ${row.claimId}`);
      Object.assign(updated, { reviewStatus: 'reviewed', reviewedBy: reviewer, reviewedAt, reviewReport: reportPath, reviewPackCommit: pack.commit, reviewPackId: score.packId, seedScoreId: score.scoreId, ...(target ? { targetUnitDigest: shown.targetUnitDigest, targetAncestry: [...(shown.target.ancestry || [])] } : {}) });
    }
    return updated;
  });
  if (jsonDigest(pack.sensitivityControls || []) !== jsonDigest(buildReviewPack(context, shard).sensitivityControls)) throw new Error('review pack sensitivity controls do not match the committed batch proofs');
  if (context.repoRoot && claims.some((row, i) => row.reviewStatus === 'reviewed' && shard.claims[i].reviewStatus !== 'reviewed')) {
    const reportCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: context.repoRoot, encoding: 'utf8' }).trim();
    const reportOf = buildCommittedReviewReportLookup(context.repoRoot, reportCommit);
    for (let i = 0; i < claims.length; i++) {
      if (claims[i].reviewStatus !== 'reviewed' || shard.claims[i].reviewStatus === 'reviewed') continue;
      claims[i].reviewReportCommit = reportCommit;
      const findings = validateManualReview(claims[i], shard, reportOf);
      if (findings.length) throw new Error('review application requires matching committed review evidence: ' + findings.map((finding) => finding.type).join(', '));
    }
  }
  return { ...shard, reviewReport: reportPath, claims };
}

export function coverageOfSources(inventory, maps, shards, { unitsOf } = {}) {
  const files = inventory.items.filter(isLegacySourceItem).map((item) => item.path).sort();
  const legacy = new Set(files);
  const named = new Set();
  const prefixes = [];
  const ranges = new Map();
  for (const text of maps) {
    let sourceTable = false;
    for (const line of text.split(/\r?\n/)) {
      if (!line.trimStart().startsWith('|')) { sourceTable = false; continue; }
      const sourceCell = line.split('|')[1]?.trim() || '';
      if (/^Source(?:\s|$)/i.test(sourceCell)) { sourceTable = true; continue; }
      if (/^:?-+:?$/.test(sourceCell)) continue;
      if (!sourceTable) continue;
      if (!sourceCell.includes('`')) { sourceTable = false; continue; }
      for (const token of sourceCell.matchAll(/`([^`]+)`/g)) {
        const separator = token[1].indexOf('#');
        const source = separator < 0 ? token[1] : token[1].slice(0, separator);
        if (separator < 0 && source.endsWith('/**')) prefixes.push(source.slice(0, -2));
        else if (legacy.has(source)) {
          if (separator < 0) named.add(source);
          else {
            const range = token[1].slice(separator + 1);
            if (!ranges.has(source)) ranges.set(source, []);
            ranges.get(source).push(range);
          }
        }
      }
    }
  }
  for (const shard of shards) for (const mirror of shard.mirrors || []) if (legacy.has(mirror.path)) named.add(mirror.path);
  const coveredAnchors = new Map();
  for (const [source, references] of ranges) {
    if (!unitsOf) throw new Error('heading-range coverage requires committed source units');
    const units = unitsOf(source) || [];
    const anchors = new Set();
    for (const reference of references) {
      const endpoints = reference.split('..');
      if (endpoints.length > 2 || endpoints.some((anchor) => !anchor)) throw new Error(`invalid source range: ${source}#${reference}`);
      const first = units.find((unit) => unit.anchor === endpoints[0]);
      const last = units.find((unit) => unit.anchor === endpoints.at(-1));
      if (!first || !last || first.startLine > last.startLine) throw new Error(`unresolved source range: ${source}#${reference}`);
      const followingHeading = last.unitKind === 'heading' ? units.find((unit) => unit.startLine > last.startLine && unit.unitKind === 'heading' && unit.level <= last.level) : null;
      const end = last.unitKind === 'heading' ? (followingHeading ? followingHeading.startLine - 1 : Infinity) : last.endLine;
      for (const unit of units) if (unit.startLine >= first.startLine && unit.startLine <= end) anchors.add(unit.anchor);
    }
    coveredAnchors.set(source, anchors);
  }
  const uncovered = files.filter((source) => {
    if (named.has(source) || prefixes.some((prefix) => source.startsWith(prefix))) return false;
    const rows = (inventory.claimLedger || []).filter((row) => row.sourcePath === source);
    return !rows.length || rows.some((row) => !coveredAnchors.get(source)?.has(row.sourceAnchor));
  });
  return { sourceFiles: files.length, covered: files.length - uncovered.length, uncovered };
}

export function rebindReviewedDecisions(context, shard) {
  const rebound = [];
  const pending = [];
  const claims = (shard.claims || []).map((row) => {
    const updated = { ...row };
    if (row.reviewStatus !== 'reviewed' || !row.targetOwner) return updated;
    const matches = /^[0-9a-f]{16,64}$/.test(row.targetUnitDigest || '') ? (context.unitsOf(row.targetOwner) || []).filter((unit) => unit.textDigest.startsWith(row.targetUnitDigest)) : [];
    const sameAncestry = matches.length === 1 && Array.isArray(row.targetAncestry) && JSON.stringify(row.targetAncestry) === JSON.stringify(matches[0].ancestry);
    if (sameAncestry) {
      if (row.targetAnchor !== matches[0].anchor) rebound.push(row.claimId);
      updated.targetAnchor = matches[0].anchor;
      updated.targetUnitDigest = matches[0].textDigest;
    } else {
      updated.reviewStatus = 'pending';
      updated.reviewNote = matches.length === 1 ? 'Stored heading ancestry is absent or changed; independent re-review required.' : matches.length ? 'Stored digest matches multiple target units; independent re-review required.' : 'Stored digest has no target match; independent re-review required.';
      delete updated.reviewedBy; delete updated.reviewedAt;
      pending.push(row.claimId);
    }
    return updated;
  });
  return { shard: { ...shard, claims }, rebound, pending };
}

export function createClaimSnapshot(context, shards, { vocabulary, schema }) {
  const merged = applyDecisions(context.inventory, shards, {
    vocabulary, registry: context.registry, unitsOf: context.unitsOf, repoRoot: context.repoRoot,
    targetAnchorsOf: (owner) => { const units = context.unitsOf(owner); return units ? new Set(units.map((unit) => unit.anchor)) : null; },
    targetUnitDigestOf: (owner, anchor) => (context.unitsOf(owner) || []).find((unit) => unit.anchor === anchor)?.textDigest ?? null,
  });
  if (merged.findings.length) throw new Error(`decision proof failed: ${merged.findings.map((finding) => finding.type).join(', ')}`);
  const rows = merged.inventory.claimLedger.filter((row) => !row.sourcePath.startsWith('docs/platform/')).map((row) => {
    for (const field of schema.required) if (row[field] === undefined) throw new Error(`required ledger field ${field} missing in ${row.claimId}`);
    return Object.fromEntries(Object.keys(schema.properties).filter((key) => row[key] !== undefined).map((key) => [key, row[key]]));
  }).sort((a, b) => a.claimId.localeCompare(b.claimId));
  return { version: 1, commit: context.inventory.commit, rows, sha256: createHash('sha256').update(JSON.stringify(rows)).digest('hex') };
}

export function verifyClaimSnapshot(context, shards, snapshot, options) {
  const expected = createClaimSnapshot(context, shards, options);
  const sha256 = createHash('sha256').update(JSON.stringify(snapshot.rows)).digest('hex');
  const ok = snapshot.version === 1 && sha256 === snapshot.sha256 && expected.sha256 === snapshot.sha256 && JSON.stringify(expected.rows) === JSON.stringify(snapshot.rows);
  return { ok, rows: expected.rows.length, sha256: expected.sha256 };
}

function renderReviewPack(pack) {
  const escape = (value) => String(typeof value === 'object' ? JSON.stringify(value) : value).replace(/[\\`*_<>[\]!]/g, '\\$&').replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>');
  const fullText = (unit) => unit ? (unit.sectionText || unit.text) : '';
  const fenced = (text, language = 'text') => {
    const runs = text.match(/`{3,}/g) || [];
    const fence = '`'.repeat(Math.max(3, ...runs.map((run) => run.length + 1)));
    return `${fence}${language}\n${text}\n${fence}`;
  };
  const temporaryRoot = path.join(os.tmpdir(), 'fgos-work');
  fs.mkdirSync(temporaryRoot, { recursive: true });
  const temporary = fs.mkdtempSync(path.join(temporaryRoot, 'doc-review-'));
  const sourceFile = path.join(temporary, 'source'), targetFile = path.join(temporary, 'target');
  const diff = (row) => {
    const source = fullText(row.source), target = fullText(row.target);
    if (source === target) return 'No text difference.';
    fs.writeFileSync(sourceFile, source); fs.writeFileSync(targetFile, target);
    let patch;
    try { patch = execFileSync('git', ['diff', '--no-index', '--no-ext-diff', '--no-textconv', '--text', '--no-color', '--', sourceFile, targetFile], { encoding: 'utf8', stdio: 'pipe', maxBuffer: 32 * 1024 * 1024 }); }
    catch (error) { if (error.status !== 1 || typeof error.stdout !== 'string') throw error; patch = error.stdout; }
    const lines = patch.trimEnd().split('\n');
    const headerEnd = lines.findIndex((line) => line.startsWith('@@ '));
    for (let i = 0; i < headerEnd; i++) {
      if (lines[i].startsWith('--- ')) lines[i] = '--- ' + JSON.stringify(`${row.source.path}#${row.source.anchor}`);
      if (lines[i].startsWith('+++ ')) lines[i] = '+++ ' + (row.target ? JSON.stringify(`${row.target.path}#${row.target.anchor}`) : '/dev/null');
    }
    return lines.filter((line, i) => i >= headerEnd || !/^(diff --git |index )/.test(line)).join('\n');
  };
  try {
    const sections = [`# Review pack: ${escape(pack.shard)}`];
    if (pack.commit) sections.push(`Pack commit: ${pack.commit}\n\nPack id: ${jsonDigest(pack)}`);
    for (const row of pack.rows) {
      sections.push(`## ${row.claimId}\n\nSource: ${escape(row.source.path)}#${escape(row.source.anchor)}\n\nTarget: ${row.target ? `${escape(row.target.path)}#${escape(row.target.anchor)}` : 'No target proposed'}`);
      sections.push('### Proposed decision\n\n| Field | Value |\n|---|---|\n' + Object.entries(row.decision).map(([field, value]) => `| ${escape(field)} | ${escape(value)} |`).join('\n'));
      sections.push('### Source unit\n\n' + fenced(fullText(row.source)));
      sections.push('### Target unit\n\n' + fenced(fullText(row.target)));
      sections.push('### Unified diff\n\n' + fenced(diff(row), 'diff'));
    }
    if (pack.unmatchedCandidateUnits) {
      sections.push('## Unmatched candidate units');
      for (const { owner, unit } of pack.unmatchedCandidateUnits) sections.push(`### ${escape(owner)}#${escape(unit.anchor)}\n\n` + fenced(fullText(unit)));
      if (!pack.unmatchedCandidateUnits.length) sections.push('None.');
    }
    return sections.join('\n\n') + '\n';
  } finally { fs.rmSync(temporary, { recursive: true, force: true }); }
}

export function runCli(argv, cwd = process.cwd()) {
  if (argv.includes('--help')) { console.log(HELP); return 0; }
  const booleanModes = ['--summary', '--propose', '--coverage', '--snapshot'];
  const valuedModes = ['--pack', '--seed-pack', '--score-pack', '--apply-review', '--rebind', '--verify'];
  const modes = [...booleanModes, ...valuedModes].filter((mode) => argv.includes(mode));
  const values = new Map();
  const options = new Set(['--inventory', '--repo-root', '--source', '--target', '--shard', '--author', '--out', '--reviewer', '--verdicts', '--seed', '--key', '--maps', '--decisions', '--identity-registry', '--review-pack', '--seed-key', '--seed-verdicts', ...valuedModes]);
  try {
    if (modes.length !== 1 && !(modes.length === 2 && modes.includes('--summary') && modes.includes('--coverage'))) throw new Error('choose exactly one mode listed in --help, or --summary --coverage');
    for (let i = 0; i < argv.length; i++) {
      if (booleanModes.includes(argv[i])) continue;
      if (!options.has(argv[i])) throw new Error(`unknown option ${argv[i]}`);
      if (!argv[i + 1] || argv[i + 1].startsWith('--')) throw new Error(`${argv[i]} requires a value`);
      const option = argv[i];
      const value = argv[++i];
      if (option === '--decisions') values.set(option, [...(values.get(option) || []), value]);
      else {
        if (values.has(option)) throw new Error(`${option} is not repeatable`);
        values.set(option, value);
      }
    }
    const resolve = (option) => {
      if (!values.has(option)) throw new Error(`${option} is required`);
      return path.resolve(cwd, values.get(option));
    };
    const jsonInput = (option) => JSON.parse(fs.readFileSync(resolve(option), 'utf8'));
    let result;
    if (modes[0] === '--score-pack') {
      const key = jsonInput('--score-pack');
      result = scoreReviewPack(key, parseReviewVerdicts(fs.readFileSync(resolve('--verdicts'), 'utf8'), key.reviewer));
    } else if (modes[0] === '--seed-pack') {
      if (!values.has('--out') || [resolve('--out'), resolve('--out') + '.json'].includes(resolve('--key'))) throw new Error('--seed-pack requires distinct --out, sidecar and --key');
      const seeded = seedReviewPack(jsonInput('--seed-pack'), { seed: values.get('--seed'), reviewer: values.get('--reviewer') });
      fs.writeFileSync(resolve('--key'), JSON.stringify(seeded.key, null, 2) + '\n');
      result = seeded.pack;
    } else {
      const context = loadProposalContext(resolve('--inventory'), path.resolve(cwd, values.get('--repo-root') || '.'));
      const shards = (values.get('--decisions') || []).flatMap((input) => loadDecisionShards(path.resolve(cwd, input)));
      if (modes.includes('--coverage')) {
        const mapPath = resolve('--maps');
        const mapFiles = fs.statSync(mapPath).isDirectory() ? fs.readdirSync(mapPath).filter((name) => /^area-map-.*\.md$/.test(name)).sort().map((name) => path.join(mapPath, name)) : [mapPath];
        if (!mapFiles.length) throw new Error('--maps directory contains no area maps');
        const coverage = coverageOfSources(context.inventory, mapFiles.map((file) => fs.readFileSync(file, 'utf8')), shards, { unitsOf: context.unitsOf });
        result = modes.includes('--summary') ? { ...summarizeInventory(context), coverage } : coverage;
      } else if (modes[0] === '--summary') result = summarizeInventory(context);
      else if (modes[0] === '--propose') result = proposeExactDecisions(context, { source: values.get('--source'), target: values.get('--target'), shard: values.get('--shard'), author: values.get('--author') });
      else if (modes[0] === '--pack') result = buildReviewPack(context, jsonInput('--pack'));
      else if (modes[0] === '--rebind') {
        result = rebindReviewedDecisions(context, jsonInput('--rebind'));
        fs.writeFileSync(resolve('--rebind'), JSON.stringify(result.shard, null, 2) + '\n');
      } else if (modes[0] === '--snapshot' || modes[0] === '--verify') {
        const root = context.repoRoot;
        const registryBytes = fs.readFileSync(resolve('--identity-registry'));
        if (createHash('sha256').update(registryBytes).digest('hex') !== context.inventory.identityRegistry?.sha256) throw new Error('registry bytes differ from the pinned inventory');
        context.registry = JSON.parse(registryBytes);
        const options = {
          vocabulary: JSON.parse(fs.readFileSync(path.join(root, 'plans/260925-documentation-authority-unification/claim-and-disposition-vocabulary.json'), 'utf8')),
          schema: JSON.parse(fs.readFileSync(path.join(root, 'plans/260925-documentation-authority-unification/claim-ledger.schema.json'), 'utf8')),
        };
        result = modes[0] === '--snapshot' ? createClaimSnapshot(context, shards, options) : verifyClaimSnapshot(context, shards, jsonInput('--verify'), options);
      }
      else {
        const repoRoot = path.resolve(cwd, values.get('--repo-root') || '.');
        const reportPath = path.relative(repoRoot, resolve('--verdicts')).split(path.sep).join('/');
        if (reportPath.startsWith('../')) throw new Error('review report must be repository-relative');
        const pack = jsonInput('--review-pack');
        const key = jsonInput('--seed-key');
        const seedProof = { key, verdicts: parseReviewVerdicts(fs.readFileSync(resolve('--seed-verdicts'), 'utf8'), key.reviewer) };
        const score = scoreReviewPack(key, seedProof.verdicts);
        const verdicts = parseReviewVerdicts(fs.readFileSync(resolve('--verdicts'), 'utf8'), values.get('--reviewer'), score);
        result = applyReviewVerdicts(context, jsonInput('--apply-review'), { verdicts, reviewer: values.get('--reviewer'), reportPath, pack, seedProof });
        fs.writeFileSync(resolve('--apply-review'), JSON.stringify(result, null, 2) + '\n');
      }
    }
    const json = JSON.stringify(result, null, 2) + '\n';
    const reviewMode = modes[0] === '--pack' || modes[0] === '--seed-pack';
    const output = reviewMode ? renderReviewPack(result) : json;
    if (values.has('--out')) {
      const out = path.resolve(cwd, values.get('--out'));
      fs.writeFileSync(out, output);
      if (reviewMode) fs.writeFileSync(out + '.json', json);
    } else console.log(output.trimEnd());
    return (modes[0] === '--score-pack' && !result.pass) || (modes[0] === '--verify' && !result.ok) ? 1 : 0;
  } catch (err) { console.error(`propose-doc-decisions: ${err.message}`); return 1; }
}

if (isMainModule(import.meta.url)) process.exitCode = runCli(process.argv.slice(2));
