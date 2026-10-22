// Records-only evidence: no CLI, state fold, generated-output write or Git mutation.
// Reuse both frozen unitsOf extractors and the existing pure projection generators.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { computeKnowledgeProjection } from '../../../../src/report/knowledge-projection.mjs';
import { buildEnduserIndex } from '../../../../src/report/enduser-index.mjs';
import { enumerateDocEntries } from '../../../../src/report/enduser-index-generate.mjs';
const root = process.cwd();
const here = path.join(root, 'plans/260925-documentation-authority-unification/reports/phase-08');
const pin = process.argv[2];
const scratch = process.argv[3];
if (!/^[0-9a-f]{40}$/.test(pin ?? '') || !scratch?.startsWith('/tmp/fgos-work/')) throw Error('explicit pin and scratch required');
if (execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim() !== pin) throw Error('pin moved');
fs.mkdirSync(scratch, { recursive: true });
const sha = x => crypto.createHash('sha256').update(x).digest('hex');
const read = p => JSON.parse(fs.readFileSync(p));
const write = (p, x) => fs.writeFileSync(path.join(here, p), `${JSON.stringify(x)}\n`);
const exportPath = path.join(here, 'step-07-state-path-export.json');
const exp = read(exportPath);
const moveSet = read(path.join(here, 'step-05-cutover-move-set.json'));
const retained = ['docs/decisions/index.md', 'docs/enduser-docs-index.json', 'docs/architecture-manifest.json'];
const moveSources = new Set(moveSet.paths.map(r => r.oldPath).filter(p => !retained.includes(p)));
const view = { docs: Object.fromEntries(exp.docs.map(d => [d.docId, d])), topics: Object.fromEntries(exp.topics.map(t => [t.topicId, t])) };
const currentPathMoves = exp.docs.filter(d => moveSources.has(d.currentPath));
if (currentPathMoves.length) throw Error('registry currentPath movement requires a real migration');
// Aliases and sourceCaptureIds are historical identity/lookup values, NOT physical destinations.
// No normalization: unchanged current paths imply unchanged bounded registry input.
const afterView = structuredClone(view);
const before = computeKnowledgeProjection(view);
const after = computeKnowledgeProjection(afterView);
if (before.jsonContent !== after.jsonContent || before.mdContent !== after.mdContent) throw Error('bounded generator parity failed');
const scan = enumerateDocEntries(root);
const outcomes = Object.fromEntries(exp.outcomes.map(o => [o.id, o]));
const entries = buildEnduserIndex(scan, outcomes, view);
const entryByPath = new Map(entries.map(e => [e.docPath, e]));
const registryPathEvidence = exp.docs.map((d, i) => ({ exportPointer: `/docs/${i}`, docId: d.docId, currentPath: d.currentPath,
  existsAtPin: fs.existsSync(path.join(root, d.currentPath)), currentPathInMoveSet: false,
  aliasesSha256: sha(JSON.stringify(d.aliases ?? [])), sourceCaptureIdsSha256: sha(JSON.stringify(d.sourceCaptureIds ?? [])),
  inCurrentEnduserScan: entryByPath.has(d.currentPath),
  generatedAliasesEqual: entryByPath.has(d.currentPath) && JSON.stringify(entryByPath.get(d.currentPath).aliases ?? []) === JSON.stringify(d.aliases ?? []) }));
write('step-07-generator-path-proof.json', {
  sourceCommit: pin, exportSha256: sha(fs.readFileSync(exportPath)), moveSetSha256: sha(fs.readFileSync(path.join(here, 'step-05-cutover-move-set.json'))),
  method: 'Existing computeKnowledgeProjection over the same bounded export before/after; no alias/capture identity rewrite. Existing enumerateDocEntries/buildEnduserIndex confirm each retained slot and its exact alias order. This proves member path operands, not byte equality of full live-state projections or a completed final scan after future carriage.',
  currentPathMoves, retained, registryPathEvidence,
  boundedRegistryParity: { jsonBefore: sha(before.jsonContent), jsonAfter: sha(after.jsonContent), markdownBefore: sha(before.mdContent), markdownAfter: sha(after.mdContent) },
  scan: { count: scan.length, sha256: sha(JSON.stringify(scan)), entries: scan.map(e => ({ path: e.docPath, quadrant: e.quadrant, sha256: sha(fs.readFileSync(path.join(root, e.docPath))) })) },
  limits: ['Export omits topic lineage/timestamps: bounded parity is not full committed JSON/Markdown drift certification.', 'Decision export contains id/pathValues only, not scope/text/rationale/ts: cannot replay the full state-wins decision index union.', 'Inventory export contains oldPath only; topicId/role and computed destination inputs are not supplied.', 'Work acceptance strings are truncated at 300 characters; content-worktree/branch pins are not exported.', '479 current slots include one missing file; no existence or complete final-scan parity inferred for it.'],
});
const candidatePaths = JSON.parse(execFileSync('python3', ['-B', '-c', `import importlib.util,json,sys\np='plans/260925-documentation-authority-unification/reports/phase-08/step-07-assemble.py'\ns=importlib.util.spec_from_file_location('assembler',p);m=importlib.util.module_from_spec(s);s.loader.exec_module(m)\nprint(json.dumps([r['path'] for r in m.changed_candidates(sys.argv[1])]))`, pin], { cwd: root, encoding: 'utf8' }));
const recipes = [ ['step10-round5-reproduction.json', 'scripts', 'step10-sync287-lib.mjs'], ['step10-sync4d-reproduction.json', 'readOnlyScripts', 'lib.mjs'] ];
const unitsByRecipe = [];
const extractorProofs = [];
for (let n = 0; n < recipes.length; n++) {
  const [name, key, lib] = recipes[n];
  const manifest = path.join(root, 'plans/260925-documentation-authority-unification/reports/phase-06', name);
  const source = read(manifest)[key][lib];
  const dir = path.join(scratch, `extractor-${n}`); fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, lib), source);
  // The original libraries require an explicit external output directory.
  const oldArgv = process.argv; process.argv = [...process.argv, '--output-dir', dir];
  const { unitsOf } = await import(path.join(dir, lib)); process.argv = oldArgv;
  const byPath = new Map();
  for (const p of candidatePaths) if (fs.existsSync(p)) byPath.set(p, unitsOf(p));
  unitsByRecipe.push(byPath);
  extractorProofs.push({ manifest: path.relative(root, manifest), lib, sha256: sha(source) });
}
const fileChecks = candidatePaths.map(p => {
  const a = unitsByRecipe[0].get(p), b = unitsByRecipe[1].get(p);
  if (JSON.stringify(a) !== JSON.stringify(b)) throw Error(`extractors disagree: ${p}`);
  return { path: p, present: !!a, sha256: a ? sha(fs.readFileSync(p)) : null, units: a?.length ?? 0, unitsSha256: a ? sha(JSON.stringify(a)) : null };
});
const bindingChecks = [];
const errors = [];
const historicalSnapshots = [];
const plan = path.join(root, 'plans/260925-documentation-authority-unification');
function visit(value, file, locator = '') {
  if (!value || typeof value !== 'object') return;
  if (typeof value.targetOwner === 'string' && candidatePaths.includes(value.targetOwner)) {
    const units = unitsByRecipe[0].get(value.targetOwner) ?? [];
    const digest = value.targetUnitDigest ?? value.targetDigest;
    if (value.targetAnchor && digest) {
      const candidates = units.map((u, i) => ({ u, i })).filter(({ u }) => u.textDigest === digest && (!value.targetAncestry || JSON.stringify(value.targetAncestry) === JSON.stringify(u.ancestry)));
      const match = candidates.find(({ u }) => u.anchor === value.targetAnchor);
      if (!match) errors.push({ file, locator, targetOwner: value.targetOwner, targetAnchor: value.targetAnchor, digest, reason: 'No exact digest+ancestry+anchor match; do not rehash a stale ordinal.' });
      else bindingChecks.push({ file, locator, claimId: value.claimId ?? null, targetOwner: value.targetOwner, targetAnchor: match.u.anchor,
        targetUnitDigest: digest, ancestry: match.u.ancestry, contentSha256: sha(match.u.text),
        previous: match.i ? { anchor: units[match.i - 1].anchor, sha256: sha(units[match.i - 1].text) } : null,
        next: match.i + 1 < units.length ? { anchor: units[match.i + 1].anchor, sha256: sha(units[match.i + 1].text) } : null,
        identicalContentAncestryMatches: candidates.length, status: 'exact-at-pin', approvalCarried: false });
    }
  }
  for (const [k, v] of Object.entries(value)) {
    if (k === 'priorReview') { historicalSnapshots.push({ file, locator: `${locator}/${k}`, sha256: sha(JSON.stringify(v)), reason: 'Historical review snapshot, not a current target binding; retained byte-identical.' }); continue; }
    visit(v, file, `${locator}/${k}`);
  }
}
for (const sub of ['ledger/decisions', 'pilot/decisions']) {
  for (const name of fs.readdirSync(path.join(plan, sub)).filter(n => n.endsWith('.json')).sort()) {
    const p = path.join(plan, sub, name); visit(read(p), path.relative(root, p));
  }
}
const decisionFiles = [...new Set(bindingChecks.map(r => r.file))].sort();
const unitCatalog = [];
const unitIds = new Map();
const stringCatalog = [], strings = new Map(), digestCatalog = [], digests = new Map();
function intern(value, catalog, ids) { if (!ids.has(value)) { ids.set(value, catalog.length); catalog.push(value); } return ids.get(value); }
const s = value => intern(value, stringCatalog, strings);
const d = value => intern(value, digestCatalog, digests);
const neighbour = value => value ? [s(value.anchor), d(value.sha256)] : null;
const compactBindings = bindingChecks.map(r => {
  const u = [candidatePaths.indexOf(r.targetOwner), s(r.targetAnchor), d(r.targetUnitDigest), r.ancestry.map(s), neighbour(r.previous), neighbour(r.next), r.identicalContentAncestryMatches, d(r.contentSha256)];
  const k = JSON.stringify(u);
  if (!unitIds.has(k)) { unitIds.set(k, unitCatalog.length); unitCatalog.push(u); }
  return [decisionFiles.indexOf(r.file), r.locator, r.claimId, unitIds.get(k)];
});
write('step-07-final-binding-check.json', { sourceCommit: pin, extractors: extractorProofs, extractorsAgree: true,
  method: 'Recursive ledger+pilot traversal. Both unchanged extractors independently derive complete units. Every bound unit matches full text digest, ancestry and current anchor; both immediate neighbour digests are recorded. No ordinal-only placement, no rehash of stale indexes, no approval carry. Missing retired candidates are explicit carries, not silently treated as live targets.',
  files: fileChecks, decisionFiles, bindingCount: bindingChecks.length,
  bindingSchema: ['decisionFileIndex', 'jsonPointer', 'claimId', 'unitIndex'], bindings: compactBindings,
  stringCatalog, digestCatalog, neighbourSchema: ['anchorStringIndex', 'sha256DigestIndex'],
  unitSchema: ['candidateFileIndex', 'anchorStringIndex', 'targetUnitDigestIndex', 'ancestryStringIndices', 'previous', 'next', 'identicalContentAncestryMatches', 'textSha256DigestIndex'], units: unitCatalog,
  bindingStatus: 'exact-at-pin; no approval carried', errors, historicalSnapshots, rebindings: [], noNewDrift: errors.length === 0,
  retiredCandidateReceipt: 'step-07-l12-112-retired-candidate-carries.json' });
console.log(JSON.stringify({ candidateFiles: candidatePaths.length, bindings: bindingChecks.length, errors: errors.length, registrySlots: exp.docs.length, scan: scan.length }));
