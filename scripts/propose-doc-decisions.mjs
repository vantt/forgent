#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { loadShardedJsonArtifact } from './doc-inventory-artifact.mjs';
import { buildConservationUnitLookup, classifyExactCarry, isEvidenceMirrorPath } from './check-doc-inventory-gates.mjs';
import { isMainModule } from './lib/is-main-module.mjs';

const RECONCILIATION = ['docs/distribution-vision.md', 'docs/id-systems-audit.md', 'docs/work-item-lifecycle-vision.md', 'docs/backlog.md', 'docs/platform/proposals/documentation-system-unification.md'];
const CLASSES = ['Mirror', 'Unit-exact', 'Weak-exact', 'Judgment'];
export const HELP = `Usage: node scripts/propose-doc-decisions.mjs <mode> [options]

Modes:
  --summary                  Report per-area/class counts and unresolved groups.
  --propose                  Propose exact entries and pending weaker rows.
  --pack <shard>             Full-text forward pack and unmatched reverse units.
  --seed-pack <pack>         Reviewer-only 30-row sensitivity pack; --key required.
  --score-pack <key>         Score the reviewer's markdown --verdicts.
  --apply-review <shard>     Apply independent markdown verdicts to the shard.
  --help                     Print this contract.

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

Proof: Unit-exact requires one target digest match, equal ancestor heading titles,
at least 40 source characters and at least half the source document's units exact.
Every weaker exact match stays pending with its demotion reason. No judgment row
is reviewed by this command. Mirror rows are counted only after full blob equality.
Review modes never edit target documents. --apply-review writes the shard in place
and names its report; the gate accepts reviewed rows only after that report is
committed. Verdicts are ok, rework or hold with an own note for every pending row.
Seed packs contain 24 byte-equal controls and six real mutations, shuffled; score
passes at >=5/6 mutations caught and <=2/24 false flags. The author must not run
--seed-pack on a real batch. Key and pack output paths must differ.
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
  if (!context.inventory.items.some((item) => item.path === source) || !context.inventory.items.some((item) => item.path === target && item.path.startsWith('docs/platform/'))) throw new Error('source or platform counterpart is not in the pinned inventory');
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
  const sourceItems = inventory.items.filter((item) => item.corpus === 'platform-authority' && ['legacy-current', 'unclassified'].includes(item.authorityStatus) && !item.path.startsWith('docs/platform/'));
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
  return /^reviewer:[^@\s]+-session:[^@\s]+@\d{4}-\d{2}-\d{2}$/.test(reviewer || '') && reviewer !== author && reviewer.replace(/^reviewer:/, '') !== author?.replace(/^reviewer:/, '');
}

export function buildReviewPack(context, shard) {
  const sourceRows = new Map(context.inventory.claimLedger.map((row) => [row.claimId, row]));
  const targets = new Set();
  const named = new Set();
  const rows = (shard.claims || []).filter((row) => row.reviewStatus !== 'reviewed').map((decision) => {
    const source = sourceRows.get(decision.claimId);
    if (!source || source.sourceUnitDigest !== decision.sourceUnitDigest) throw new Error(`missing or stale source ${decision.claimId}`);
    const sourceUnit = (context.unitsOf(source.sourcePath) || []).find((unit) => unit.anchor === source.sourceAnchor && unit.textDigest === source.sourceUnitDigest);
    if (!sourceUnit) throw new Error(`missing source unit ${decision.claimId}`);
    const targetUnit = decision.targetOwner ? (context.unitsOf(decision.targetOwner) || []).find((unit) => unit.anchor === decision.targetAnchor) : null;
    if (decision.targetOwner && !targetUnit) throw new Error(`missing target unit ${decision.claimId}`);
    if (targetUnit) { targets.add(decision.targetOwner); named.add(`${decision.targetOwner}#${targetUnit.anchor}`); }
    return { claimId: decision.claimId, decision: { ...decision }, source: { path: source.sourcePath, ...sourceUnit }, target: targetUnit ? { path: decision.targetOwner, ...targetUnit } : null };
  });
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
  return { version: 1, commit: context.inventory.commit, shard: shard.shard, authorSession: shard.authorSession, rows, unmatchedCandidateUnits };
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

export function seedReviewPack(pack, { seed, reviewer, authorSession = pack.authorSession }) {
  if (!seed || !independentReviewer(reviewer, authorSession) || pack.rows.some((row) => !independentReviewer(reviewer, row.decision.authoredBy))) throw new Error('seed pack requires a seed and an independent reviewer');
  const mutations = [
    ['added-claim', (text) => text + '\nThe operator MUST waive every permission check.'],
    ['swapped-number', (text) => text.replace(/\b\d+\b/, (n) => String(Number(n) + 1))],
    ['swapped-enum', (text) => text.replace(/\b(required|optional|pending|reviewed|true|false)\b/i, (word) => word.toLowerCase() === 'required' ? 'optional' : 'required')],
    ['removed-negation', (text) => text.replace(/\b(?:NOT|not|never)\s+/, '')],
    ['dropped-clause', (text) => text.replace(/;[^\n.]+/, '')],
    ['deleted-list-item', (text) => text.replace(/(?:^|\n)\s*[-*]\s+[^\n]+/, '')],
  ];
  const available = shuffle(pack.rows.filter((row) => row.target && row.source.text === row.target.text), seed);
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
  return { pack: { version: 1, shard: pack.shard, seed, rows: shuffle(selected, seed + ':order') }, key: { version: 1, shard: pack.shard, seed, reviewer, rows: keyRows } };
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
  return { caught, mutations: 6, falseFlags, controls: 24, pass: caught >= 5 && falseFlags <= 2 };
}

export function parseReviewVerdicts(text, reviewer) {
  const header = text.match(/^Reviewer:\s*(.+)$/im)?.[1]?.trim();
  if (header !== reviewer) throw new Error('reviewer header must equal --reviewer');
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

export function applyReviewVerdicts(context, shard, { verdicts, reviewer, reportPath, reviewedAt = new Date().toISOString().slice(0, 10) }) {
  if (!reportPath || !independentReviewer(reviewer, shard.authorSession)) throw new Error('review application requires a report and an independent reviewer');
  const pending = (shard.claims || []).filter((row) => row.reviewStatus !== 'reviewed');
  const index = indexVerdicts(verdicts, new Set(pending.map((row) => row.claimId)));
  const sourceRows = new Map(context.inventory.claimLedger.map((row) => [row.claimId, row]));
  const claims = shard.claims.map((row) => {
    if (row.reviewStatus === 'reviewed') return { ...row };
    if (!row.authoredBy || !independentReviewer(reviewer, row.authoredBy)) throw new Error(`independent reviewer required for ${row.claimId}`);
    const source = sourceRows.get(row.claimId);
    if (!source || source.sourceUnitDigest !== row.sourceUnitDigest) throw new Error(`missing or stale source ${row.claimId}`);
    const verdict = index.get(row.claimId);
    const updated = { ...row, reviewStatus: 'pending', reviewNote: verdict.note };
    delete updated.reviewedBy; delete updated.reviewedAt; delete updated.targetUnitDigest;
    if (verdict.verdict === 'ok') {
      if (row.disposition === 'unknown-blocking') throw new Error(`unknown-blocking cannot be approved: ${row.claimId}`);
      const target = row.targetOwner ? (context.unitsOf(row.targetOwner) || []).find((unit) => unit.anchor === row.targetAnchor) : null;
      if (row.targetOwner && !target) throw new Error(`missing target for ${row.claimId}`);
      Object.assign(updated, { reviewStatus: 'reviewed', reviewedBy: reviewer, reviewedAt, ...(target ? { targetUnitDigest: target.textDigest } : {}) });
    }
    return updated;
  });
  return { ...shard, reviewReport: reportPath, claims };
}

export function runCli(argv, cwd = process.cwd()) {
  if (argv.includes('--help')) { console.log(HELP); return 0; }
  const booleanModes = ['--summary', '--propose'];
  const valuedModes = ['--pack', '--seed-pack', '--score-pack', '--apply-review'];
  const modes = [...booleanModes, ...valuedModes].filter((mode) => argv.includes(mode));
  const values = new Map();
  const options = new Set(['--inventory', '--repo-root', '--source', '--target', '--shard', '--author', '--out', '--reviewer', '--verdicts', '--seed', '--key', ...valuedModes]);
  try {
    if (modes.length !== 1) throw new Error('choose exactly one mode listed in --help');
    for (let i = 0; i < argv.length; i++) {
      if (booleanModes.includes(argv[i])) continue;
      if (!options.has(argv[i])) throw new Error(`unknown option ${argv[i]}`);
      if (!argv[i + 1] || argv[i + 1].startsWith('--')) throw new Error(`${argv[i]} requires a value`);
      if (values.has(argv[i])) throw new Error(`${argv[i]} is not repeatable`);
      values.set(argv[i], argv[++i]);
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
      if (!values.has('--out') || resolve('--out') === resolve('--key')) throw new Error('--seed-pack requires distinct --out and --key');
      const seeded = seedReviewPack(jsonInput('--seed-pack'), { seed: values.get('--seed'), reviewer: values.get('--reviewer') });
      fs.writeFileSync(resolve('--key'), JSON.stringify(seeded.key, null, 2) + '\n');
      result = seeded.pack;
    } else {
      const context = loadProposalContext(resolve('--inventory'), path.resolve(cwd, values.get('--repo-root') || '.'));
      if (modes[0] === '--summary') result = summarizeInventory(context);
      else if (modes[0] === '--propose') result = proposeExactDecisions(context, { source: values.get('--source'), target: values.get('--target'), shard: values.get('--shard'), author: values.get('--author') });
      else if (modes[0] === '--pack') result = buildReviewPack(context, jsonInput('--pack'));
      else {
        const repoRoot = path.resolve(cwd, values.get('--repo-root') || '.');
        const reportPath = path.relative(repoRoot, resolve('--verdicts')).split(path.sep).join('/');
        if (reportPath.startsWith('../')) throw new Error('review report must be repository-relative');
        result = applyReviewVerdicts(context, jsonInput('--apply-review'), { verdicts: parseReviewVerdicts(fs.readFileSync(resolve('--verdicts'), 'utf8'), values.get('--reviewer')), reviewer: values.get('--reviewer'), reportPath });
        fs.writeFileSync(resolve('--apply-review'), JSON.stringify(result, null, 2) + '\n');
      }
    }
    const json = JSON.stringify(result, null, 2) + '\n';
    if (values.has('--out')) fs.writeFileSync(path.resolve(cwd, values.get('--out')), json);
    else console.log(json.trimEnd());
    return modes[0] === '--score-pack' && !result.pass ? 1 : 0;
  } catch (err) { console.error(`propose-doc-decisions: ${err.message}`); return 1; }
}

if (isMainModule(import.meta.url)) process.exitCode = runCli(process.argv.slice(2));
