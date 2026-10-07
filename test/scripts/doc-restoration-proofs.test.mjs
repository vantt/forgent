import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { applyDecisions, buildConservationUnitLookup, summarizeConservationCompleteness, validateDroppedClaims } from '../../scripts/check-doc-inventory-gates.mjs';
const plan = 'plans/260925-documentation-authority-unification';
const vocabulary = JSON.parse(fs.readFileSync(new URL('../../' + plan + '/claim-and-disposition-vocabulary.json', import.meta.url)));
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'doc-restoration-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const owner = 'docs/platform/probe/spec.md';
  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: 'pipe' }).trim();
  git('init', '-q'); git('config', 'user.name', 'Fixture'); git('config', 'user.email', 'fixture@example.invalid');
  fs.mkdirSync(path.dirname(path.join(root, owner)), { recursive: true }); fs.writeFileSync(path.join(root, owner), '# Restored contract\n\nThe consumer retains the complete restored contract.\n');
  git('add', '--', owner); git('commit', '-qm', 'docs: record restoration fixture', '--', owner);
  const unitsOf = buildConservationUnitLookup(root, git('rev-parse', 'HEAD'));
  const unit = unitsOf(owner).find((row) => row.kind !== 'heading') || unitsOf(owner)[0];
  const entry = { id: 'restored-fixture', status: 'needs-restoration', restorationOwner: 'fixture', gate: 'verified', phase3Ledger: { claimId: 'claim_fixture' }, reviewedDisposition: { decision: 'restored', reviewer: 'reviewer:fixture-session:other@2026-10-07', reviewedAt: '2026-10-07', owner, anchor: unit.anchor, unitDigest: unit.textDigest } };
  return { root, git, owner, unit, unitsOf, entry };
}
const check = (f, entry = f.entry) => validateDroppedClaims({ entries: [entry] }, { ledgerClaimIds: new Set(['claim_fixture']), unitsOf: f.unitsOf });
test('restored claims require owner anchor and the complete committed unit digest', (t) => {
  const f = fixture(t);
  assert.deepEqual(check(f), []);
  for (const change of [{ owner: '' }, { anchor: '' }, { unitDigest: '' }, { anchor: 'missing' }, { unitDigest: 'f'.repeat(64) }, { owner: 'docs/platform/probe/missing.md' }]) {
    assert.ok(check(f, { ...f.entry, reviewedDisposition: { ...f.entry.reviewedDisposition, ...change } }).some((row) => row.type === 'dropped-claim-restore-invalid'), JSON.stringify(change));
  }
});
test('working-tree text cannot supply an uncommitted restoration proof', (t) => {
  const f = fixture(t);
  fs.writeFileSync(path.join(f.root, f.owner), '# New uncommitted contract\n');
  assert.deepEqual(check(f), []);
  assert.ok(check(f, { ...f.entry, reviewedDisposition: { ...f.entry.reviewedDisposition, anchor: 'new-uncommitted-contract' } }).some((row) => row.type === 'dropped-claim-restore-invalid'));
});
test('deferred register entries must point to an existing committed stub anchor', (t) => {
  const f = fixture(t);
  const reviewedDisposition = { ...f.entry.reviewedDisposition, decision: 'defer-with-owner', stubOwner: f.owner, stubAnchor: f.unit.anchor };
  assert.deepEqual(check(f, { ...f.entry, reviewedDisposition }), []);
  for (const change of [{ stubOwner: '' }, { stubAnchor: '' }, { stubAnchor: 'missing' }]) assert.ok(check(f, { ...f.entry, reviewedDisposition: { ...reviewedDisposition, ...change } }).some((row) => row.type === 'dropped-claim-stub-invalid'));
});
test('a deferred decision cannot name a nonexistent stub or omit its fields', (t) => {
  const f = fixture(t);
  const sourcePath = 'docs/specs/source.md';
  const row = { claimId: 'claim_fixture', sourcePath, sourceAnchor: 'contract', sourceUnitDigest: '1'.repeat(64), claimKind: 'contract', disposition: 'unknown-blocking', reviewStatus: 'blocking', targetOwner: null, targetAnchor: null };
  const inventory = { items: [{ path: sourcePath }, { path: f.owner }], claimLedger: [row] };
  const decision = { ...row, targetOwner: f.owner, targetAnchor: f.unit.anchor, disposition: 'defer-with-owner', reviewStatus: 'pending', rationale: 'The unit is deferred to a named restoration task, not claimed as carried.', stubOwner: f.owner, stubAnchor: f.unit.anchor };
  const apply = (d) => applyDecisions(inventory, [{ version: 1, shard: 'deferred-fixture', sources: [sourcePath], claims: [d] }], { vocabulary, unitsOf: f.unitsOf });
  assert.deepEqual(apply(decision).findings, []);
  for (const change of [{ stubOwner: '' }, { stubAnchor: '' }, { stubAnchor: 'missing' }, { stubOwner: 'docs/specs/source.md' }]) assert.ok(apply({ ...decision, ...change }).findings.some((row) => row.type === 'decision-stub-invalid'));
  assert.equal(apply(decision).inventory.claimLedger[0].stubOwner, f.owner);
  assert.equal(apply(decision).inventory.claimLedger[0].stubAnchor, f.unit.anchor);
});
test('two legacy sources sharing a short unit retain a multiple-owner blocking finding', (t) => {
  const f = fixture(t);
  const sources = ['docs/specs/one.md', 'docs/specs/two.md'];
  for (const source of sources) { fs.mkdirSync(path.dirname(path.join(f.root, source)), { recursive: true }); fs.writeFileSync(path.join(f.root, source), '# Source\n\nBrief.\n'); }
  f.git('add', '--', ...sources); f.git('commit', '-qm', 'docs: record shared short source units', '--', ...sources);
  const unitsOf = buildConservationUnitLookup(f.root, f.git('rev-parse', 'HEAD'));
  const claimLedger = sources.map((sourcePath, i) => {
    const unit = unitsOf(sourcePath).find((candidate) => candidate.text.trim() === 'Brief.');
    return { claimId: 'claim_' + i, sourcePath, sourceAnchor: unit.anchor, sourceUnitDigest: unit.textDigest, targetOwner: 'docs/platform/' + i + '/spec.md', disposition: 'promote', reviewStatus: 'pending' };
  });
  const findings = summarizeConservationCompleteness({ inventory: { items: sources.map((sourcePath) => ({ path: sourcePath, authorityStatus: 'legacy-current' })), claimLedger }, vocabulary, registry: null });
  assert.equal(findings.find((row) => row.type === 'identical-units-multiple-owners').count, 1);
});
