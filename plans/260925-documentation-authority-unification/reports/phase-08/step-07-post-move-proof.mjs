// Records proof only. Never execute a CLI, fold live state, or mutate the checkout.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { enumerateDocEntries } from '../../../../src/report/enduser-index-generate.mjs';
import { buildEnduserIndex } from '../../../../src/report/enduser-index.mjs';
import { computeKnowledgeProjection } from '../../../../src/report/knowledge-projection.mjs';
const root = process.cwd();
const here = path.join(root, 'plans/260925-documentation-authority-unification/reports/phase-08');
const pin = process.argv[2];
const scratch = '/tmp/fgos-work/integration-fix';
const sha = x => crypto.createHash('sha256').update(x).digest('hex');
const read = n => JSON.parse(fs.readFileSync(path.join(here, n), 'utf8'));
const git = args => execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }).trim();
assert.match(pin ?? '', /^[0-9a-f]{40}$/);
assert.equal(git(['diff', '--name-only', pin, '--', 'docs', 'src/report', 'test/report']), '');
fs.mkdirSync(scratch, { recursive: true });
const tmp = fs.mkdtempSync(path.join(scratch, 'candidate-'));
const current = path.join(tmp, 'current'), candidate = path.join(tmp, 'candidate');
const retained = ['docs/decisions/index.md', 'docs/enduser-docs-index.json', 'docs/architecture-manifest.json'];
const moves = read('step-05-cutover-move-set.json').paths.filter(r => !retained.includes(r.oldPath));
const moving = new Set(moves.map(r => r.oldPath));
const tree = new Set(git(['ls-tree', '-r', '--name-only', pin, '--', 'docs']).split('\n'));
// Copy only tracked regular document payloads. Never traverse symlinks, state,
// env or secret files. Product docs are unchanged from the explicit source pin.
for (const file of tree) {
  if (/(?:^|\/)(?:\.fgos|secrets?[^/]*|[^/]*\.env)(?:$|[./])/i.test(file)) continue;
  if (!fs.lstatSync(path.join(root, file)).isFile()) continue;
  for (const dst of [current, candidate]) {
    fs.mkdirSync(path.dirname(path.join(dst, file)), { recursive: true });
    fs.copyFileSync(path.join(root, file), path.join(dst, file));
  }
}
const physicalMoves = [];
for (const row of moves) {
  const from = path.join(candidate, row.oldPath);
  if (!fs.existsSync(from) || !fs.statSync(from).isFile()) continue;
  const targets = [...new Set(row.moves.map(r => r.to).filter(Boolean))];
  const existingTargets = [];
  for (const target of targets) {
    assert.ok(target.startsWith('docs/') && !target.split('/').includes('..'));
    const to = path.join(candidate, target);
    if (fs.existsSync(to)) existingTargets.push({ path: target, identical: sha(fs.readFileSync(to)) === sha(fs.readFileSync(from)) });
    else {
      fs.mkdirSync(path.dirname(to), { recursive: true });
      fs.copyFileSync(from, to);
    }
  }
  fs.unlinkSync(from);
  physicalMoves.push({ from: row.oldPath, targets, existingTargets });
}
const exp = read('step-07-state-path-export-v2.json');
const view = { docs: Object.fromEntries(exp.docs.map(d => [d.docId, d])), topics: Object.fromEntries(exp.topics.map(t => [t.topicId, t])), outcomes: Object.fromEntries(exp.outcomes.map(o => [o.id, o])) };
const beforeScan = enumerateDocEntries(current), afterScan = enumerateDocEntries(candidate);
const before = buildEnduserIndex(beforeScan, view.outcomes, view), after = buildEnduserIndex(afterScan, view.outcomes, view);
const beforeByPath = new Map(before.map(e => [e.docPath, e])), afterByPath = new Map(after.map(e => [e.docPath, e]));
const removed = before.filter(e => !afterByPath.has(e.docPath)).map(e => e.docPath);
const registry = computeKnowledgeProjection(view);
const matrix = read('step-07-consumer-cutover-matrix.json');
const records = new Map(matrix.recordCatalog.map(r => [r.id, fs.readFileSync(path.join(here, r.path), 'utf8').trim().split('\n').map(JSON.parse)]));
const baselineCommit = 'a0aa5a2acf49470e4b2bb9d21b7ae11a91842b47';
const baseline = JSON.parse(execFileSync('git', ['show', `${baselineCommit}:plans/260925-documentation-authority-unification/reports/phase-08/step-07-consumer-cutover-matrix.json`], { cwd: root, maxBuffer: 16 * 1024 * 1024 }));
const checks = [], overturns = [];
const manifest = fs.readFileSync(path.join(current, 'docs/enduser-docs-index.json'), 'utf8');
for (const row of baseline.consumerRows.filter(r => r[4] === 'preserved-history/fixture')) {
  const record = records.get(row[1])[row[2] - 1];
  const item = ['references', 'dynamicTraces', 'authorAddedReferences'].flatMap(f => record[f] ?? []).find(i => String(i.referenceId ?? i.id ?? i.edgeId) === row[3]);
  assert.ok(item, `missing owning record ${row[0]}`);
  const token = String(item.matchedExpression ?? item.pathOperand ?? item.targetSetOrConstruction ?? '');
  const hits = [...moving].filter(p => token.includes(p));
  let result = 'unchanged-operand-outside-move-set';
  let reason = 'No moving path occurs in this member operand; keep its existing owning proof, not a new full-runtime parity claim.';
  let newDisposition = 'preserve';
  if (row[6] === 'gen-enduser-index') {
    const line = (item.sourceSpans ?? [])[0]?.line;
    assert.ok(line, `missing generated span ${row[0]}`);
    const offset = manifest.split('\n').slice(0, line - 1).join('\n').length;
    const start = manifest.lastIndexOf('\n  {', offset) + 1;
    const end = manifest.indexOf('\n  }', offset) + 4;
    const entry = JSON.parse(manifest.slice(start, end));
    const next = afterByPath.get(entry.docPath);
    if (removed.includes(entry.docPath)) {
      newDisposition = 'patch'; result = 'generated-entry-physically-retires';
      reason = 'Legacy duplicate physically retires; enumerateDocEntries/buildEnduserIndex drops this entire entry, including its alias. Patch via existing generator, never a hand edit.';
    } else {
      assert.ok(next, `unregistered preserved slot ${row[0]}`);
      const field = item.projectionFieldAtSpan;
      assert.ok(field === 'aliases' ? next.aliases?.includes(token) : field === 'docPath' ? next.docPath === token : JSON.stringify(next).includes(token), `candidate operand changed ${row[0]}`);
      result = 'candidate-generated-slot-retains-operand'; reason = `Existing generator retains ${field} in surviving entry ${entry.docPath}.`;
    }
  } else if (row[6] === 'gen-doc-registry') {
    result = 'registry-input-and-projection-unchanged';
    reason = 'No registry currentPath moves; aliases/capture ids and topic free text are persisted historical identity. Physical retirement of another scanned duplicate does not mutate them.';
  } else if (row[6] === 'gen-decision-index') {
    result = 'state-wins-union-free-text-unchanged'; reason = 'Retained index plus unchanged exported decisions; free-text path mentions are not followed. See bounded union parity in export-v2-proof, not export-only parity.';
  } else if (hits.length && item.role === 'real-document-reader' && record.file === 'test/report/enduser-index.test.mjs') {
    newDisposition = 'patch'; result = 'real-manifest-demo-moved'; reason = 'Regenerated manifest no longer has the old demo entry. Compose both assertions with the direct frontmatter hunk and REAL_DEMO_DOC_PATH.';
  } else if (token.includes('docs/contracts') && ['apps/fgos-gateway/src/gateway.rs', 'apps/fgos-gateway/src/mcp.rs'].includes(record.file) && (['fixture-writer', 'synthetic-fixture'].includes(item.role) || token === 'docs/contracts')) {
    newDisposition = 'patch'; result = 'gateway-fixture-co-cut'; reason = 'Existing prepared gateway-contract-reader-move already changes the real runtime contract path; fixture writers must co-change with it, including create_dir_all parent. Preserve is inconsistent with that co-cut.';
  } else if (hits.length && /(?:R26\/R28 pointer co-changes|L12-85\/R28: comment pointer co-changes)/.test(item.reason ?? '')) {
    newDisposition = 'patch'; result = 'conditional-r28-preserve-overturned'; reason = 'The member explicitly preserves only pending retention-or-move decision. Effective move set retires the operand; apply the recorded conditional pointer co-cut, without changing prose semantics.';
  } else if (hits.length) {
    assert.ok(['frozen-baseline-data', 'frozen-classifier', 'inherited-document-reference', 'comment-provenance', 'navigation', 'post-census-source-occurrence', 'fixture-provenance', 'inherited-preserve', 'test-title'].includes(item.role), `unreviewed moving preserve ${row[0]} ${item.role}`);
    result = 'historical-fixture-or-frozen-gate-operand'; reason = item.reason;
  }
  const check = { rowId: row[0], file: record.file, memberId: row[3], familyId: row[6], role: item.role, operandSha256: sha(token), movingPaths: hits, result, newDisposition, reason };
  checks.push(check);
  if (newDisposition !== 'preserve') overturns.push({ ...check, token, sourceSpans: item.sourceSpans ?? [], record: matrix.recordCatalog.find(r => r.id === row[1]).path, recordLine: row[2] });
}
assert.equal(checks.length, 9650);
assert.equal(view.docs && exp.docs.filter(d => moving.has(d.currentPath)).length, 0);
const results = [...new Set(checks.map(r => r.result))].sort();
const out = { sourceCommit: pin, authority: 'L12-120', method: 'Physical tracked-doc scratch copy; remove every present effective oldPath, retain already-existing destinations (no invented carriage), then run the existing enumerator and pure generator. Rejoin ALL 9,650 input preserves, not only the 2,311 park-family members. Historical/frozen proofs are retained by their explicit member reasons; this does not certify blocked successor scan/carriage or runtime tests.', inputs: { baselineCommit, moveSetSha256: sha(fs.readFileSync(path.join(here, 'step-05-cutover-move-set.json'))), exportSha256: sha(fs.readFileSync(path.join(here, 'step-07-state-path-export-v2.json'))), baselineMatrixSha256: sha(JSON.stringify(baseline)) }, scan: { before: beforeScan.length, after: afterScan.length, beforeSha256: sha(JSON.stringify(before)), afterSha256: sha(JSON.stringify(after)), removed, added: after.filter(e => !beforeByPath.has(e.docPath)).map(e => e.docPath) }, registry: { currentPathMoves: 0, jsonSha256: sha(registry.jsonContent), mdSha256: sha(registry.mdContent) }, physicalMoveSchema: ['effectiveMoveIndex', 'existingDestinations: [uniqueTargetIndex, identicalBytes] (other targets copied)'], physicalMoves: physicalMoves.map(r => [moves.findIndex(m => m.oldPath === r.from), r.existingTargets.map(t => [r.targets.indexOf(t.path), t.identical])]), checkSchema: ['rowNumber (r + zero-pad to 5 digits)', 'resultIndex'], resultCatalog: results, checks: checks.map(r => [Number(r.rowId.slice(1)), results.indexOf(r.result)]), overturns, count: checks.length, remainingPreserves: checks.length - overturns.length, additionalOverturns: overturns.filter(r => !['r03739', 'r03718', 'r03900', 'r03806', 'r26116', 'r26215', 'r26201'].includes(r.rowId)).map(r => r.rowId), scope: 'No checkout move, live state, secrets, CLI, Git write, generator write or owning-test execution. Candidate conflicts remain carriage obligations; no overwrite of existing destination content.' };
fs.writeFileSync(path.join(here, 'step-07-post-move-proof.json'), JSON.stringify(out) + '\n');
fs.rmSync(tmp, { recursive: true });
console.log(JSON.stringify({ count: checks.length, removed, overturns: overturns.map(r => r.rowId), remainingPreserves: out.remainingPreserves }));
