import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { applyDecisions } from '../../scripts/check-doc-inventory-gates.mjs';
import { buildReviewPack } from '../../scripts/propose-doc-decisions.mjs';
const plan = 'plans/260925-documentation-authority-unification';
const vocabulary = JSON.parse(fs.readFileSync(new URL('../../' + plan + '/claim-and-disposition-vocabulary.json', import.meta.url)));
const author = 'fixture-session:author@2026-10-07';
const reviewer = 'reviewer:fixture-session:other@2026-10-07';
const reportPath = plan + '/reports/phase-06/review-contract-fixture.md';
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'doc-review-authorship-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  git('init', '-q'); git('config', 'user.name', 'Fixture'); git('config', 'user.email', 'fixture@example.invalid');
  fs.writeFileSync(path.join(root, 'source.md'), '# Source\n');
  git('add', '--', 'source.md'); git('commit', '-qm', 'docs: record source fixture', '--', 'source.md');
  const sourceCommit = git('rev-parse', 'HEAD');
  const row = { claimId: 'claim_fixture', sourcePath: 'docs/specs/source.md', sourceAnchor: 'source', sourceUnitDigest: '1'.repeat(64), targetOwner: null, targetAnchor: null, claimKind: 'historical-context', disposition: 'archive-with-reason', reviewStatus: 'reviewed', rationale: 'Historical rationale stays available as evidence.', authoredBy: author, reviewedBy: reviewer, reviewedAt: '2026-10-07', reviewReport: reportPath, reviewPackCommit: sourceCommit, reviewPackId: 'a'.repeat(64), seedScoreId: 'b'.repeat(64), reviewNote: 'Checked the entire historical unit.' };
  const report = `Reviewer: ${reviewer}\nPack commit: ${sourceCommit}\nPack id: ${row.reviewPackId}\nSeed score: ${row.seedScoreId}\n\n| Claim | Verdict | Note |\n|---|---|---|\n| ${row.claimId} | ok | ${row.reviewNote} |\n`;
  fs.mkdirSync(path.dirname(path.join(root, reportPath)), { recursive: true });
  fs.writeFileSync(path.join(root, reportPath), report);
  git('add', '--', reportPath); git('commit', '-qm', 'docs: record independent review fixture', '--', reportPath);
  row.reviewReportCommit = git('rev-parse', 'HEAD');
  const inventory = { commit: row.reviewReportCommit, items: [{ path: row.sourcePath, corpus: 'platform-authority', authorityStatus: 'legacy-current', proposedDisposition: 'unknown-blocking' }], claimLedger: [{ ...row, reviewStatus: 'blocking', disposition: 'unknown-blocking' }] };
  const shard = { version: 1, shard: 'contract-fixture', sources: [row.sourcePath], authorSession: author, authorshipRequired: true, claims: [row] };
  const context = { inventory, repoRoot: root, unitsOf: () => [{ anchor: 'source', textDigest: row.sourceUnitDigest, text: 'Historical source', ancestry: [] }] };
  return { root, git, row, report, inventory, shard, context };
}
const apply = (f, row = f.row, shard = f.shard) => applyDecisions(f.inventory, [{ ...shard, claims: [row] }], { vocabulary, repoRoot: f.root });
test('committed independent review permits a subsequent pack without passing unproven rows', (t) => {
  const f = fixture(t);
  assert.deepEqual(apply(f).findings, []);
  assert.deepEqual(buildReviewPack(f.context, f.shard).rows, []);
});
test('the same session cannot review itself by changing identity prefix or date', (t) => {
  const f = fixture(t);
  for (const row of [{ ...f.row, authoredBy: 'fixture-session:other@2026-10-08' }, { ...f.row }]) {
    const shard = row.authoredBy === author ? { ...f.shard, authorSession: 'fixture-session:other@2026-10-09' } : f.shard;
    assert.ok(apply(f, row, shard).findings.some((r) => r.type === 'decision-self-review'));
  }
});
test('reviewed manual rows require an author and cannot borrow a script identity', (t) => {
  const f = fixture(t);
  const missing = { ...f.row }; delete missing.authoredBy;
  assert.ok(apply(f, missing).findings.some((r) => r.type === 'decision-authored-by-missing'));
  for (const field of ['authoredBy', 'reviewedBy']) {
    assert.ok(apply(f, { ...f.row, [field]: 'script:forged' }).findings.some((r) => r.type === 'decision-script-identity'));
  }
});
test('an uncommitted or mismatched verdict never approves a manual row', (t) => {
  const f = fixture(t);
  const uncommitted = reportPath.replace('fixture.md', 'uncommitted.md');
  fs.writeFileSync(path.join(f.root, uncommitted), f.report);
  for (const change of [{ reviewReport: uncommitted }, { reviewedBy: 'reviewer:fixture-session:wrong@2026-10-07' }, { claimId: 'claim_other' }, { reviewPackId: 'c'.repeat(64) }, { seedScoreId: 'd'.repeat(64) }, { reviewNote: 'Changed verdict note.' }]) {
    const row = { ...f.row, ...change };
    const inventory = change.claimId ? { ...f.inventory, claimLedger: [{ ...f.inventory.claimLedger[0], claimId: change.claimId }] } : f.inventory;
    const result = applyDecisions(inventory, [{ ...f.shard, claims: [row] }], { vocabulary, repoRoot: f.root });
    assert.ok(result.findings.some((r) => r.type === 'decision-review-report-missing'), JSON.stringify(change));
  }
});
test('a later edit of a report cannot silently erase or replace an earlier pinned approval', (t) => {
  const f = fixture(t);
  fs.writeFileSync(path.join(f.root, reportPath), 'Reviewer: another-session\n');
  f.git('add', '--', reportPath); f.git('commit', '-qm', 'docs: record a later review round', '--', reportPath);
  f.inventory.commit = f.git('rev-parse', 'HEAD');
  assert.deepEqual(apply(f).findings, []);
  assert.deepEqual(buildReviewPack(f.context, f.shard).rows, []);
});
test('review report pins from outside inventory ancestry cannot certify a row', (t) => {
  const f = fixture(t);
  f.inventory.commit = f.row.reviewPackCommit;
  assert.ok(apply(f).findings.some((r) => r.type === 'decision-review-report-missing'));
});
test('authorship-required shards cannot omit their author session', (t) => {
  const f = fixture(t);
  const shard = { ...f.shard }; delete shard.authorSession;
  assert.ok(apply(f, f.row, shard).findings.some((r) => r.type === 'decision-author-session-missing'));
});
