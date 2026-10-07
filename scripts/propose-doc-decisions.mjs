#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { loadShardedJsonArtifact } from './doc-inventory-artifact.mjs';
import { buildConservationUnitLookup, classifyExactCarry, isEvidenceMirrorPath } from './check-doc-inventory-gates.mjs';
import { isMainModule } from './lib/is-main-module.mjs';

const PLAN = 'plans/260925-documentation-authority-unification';
const RECONCILIATION = ['docs/distribution-vision.md', 'docs/id-systems-audit.md', 'docs/work-item-lifecycle-vision.md', 'docs/backlog.md', 'docs/platform/proposals/documentation-system-unification.md'];
const CLASSES = ['Mirror', 'Unit-exact', 'Weak-exact', 'Judgment'];
export const HELP = `Usage: node scripts/propose-doc-decisions.mjs <mode> [options]

Modes:
  --summary                  Report per-area/class counts and unresolved groups.
  --propose                  Propose exact entries and pending weaker rows.
  --help                     Print this contract.

Inputs:
  --inventory <manifest>     Required inventory; units read at its pinned commit.
  --repo-root <directory>    Repository containing that commit (default: cwd).
  --source <path>            Source document for --propose.
  --target <path>            Counterpart document for --propose.
  --shard <name>             Required proposed shard identity (version stays 1).
  --author <identity>        Required author for pending rows; not a script identity.
  --out <path>               Write JSON to this path; otherwise print JSON.

Proof: Unit-exact requires one target digest match, equal ancestor heading titles,
at least 40 source characters and at least half the source document's units exact.
Every weaker exact match stays pending with its demotion reason. No judgment row
is reviewed by this command. Mirror rows are counted only after full blob equality.
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

export function runCli(argv, cwd = process.cwd()) {
  if (argv.includes('--help')) { console.log(HELP); return 0; }
  const modes = ['--summary', '--propose'].filter((mode) => argv.includes(mode));
  const values = new Map();
  const options = new Set(['--inventory', '--repo-root', '--source', '--target', '--shard', '--author', '--out']);
  try {
    if (modes.length !== 1) throw new Error('choose exactly one mode: --summary or --propose');
    for (let i = 0; i < argv.length; i++) {
      if (modes.includes(argv[i])) continue;
      if (!options.has(argv[i])) throw new Error(`unknown option ${argv[i]}`);
      if (!argv[i + 1] || argv[i + 1].startsWith('--')) throw new Error(`${argv[i]} requires a value`);
      if (values.has(argv[i])) throw new Error(`${argv[i]} is not repeatable`);
      values.set(argv[i], argv[++i]);
    }
    if (!values.has('--inventory')) throw new Error('--inventory is required');
    const context = loadProposalContext(path.resolve(cwd, values.get('--inventory')), path.resolve(cwd, values.get('--repo-root') || '.'));
    const result = modes[0] === '--summary' ? summarizeInventory(context) : proposeExactDecisions(context, { source: values.get('--source'), target: values.get('--target'), shard: values.get('--shard'), author: values.get('--author') });
    const json = JSON.stringify(result, null, 2) + '\n';
    if (values.has('--out')) fs.writeFileSync(path.resolve(cwd, values.get('--out')), json);
    else console.log(json.trimEnd());
    return 0;
  } catch (err) { console.error(`propose-doc-decisions: ${err.message}`); return 1; }
}

if (isMainModule(import.meta.url)) process.exitCode = runCli(process.argv.slice(2));
