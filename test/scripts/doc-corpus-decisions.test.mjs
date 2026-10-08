import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { applyDecisions, loadDecisionShards, validateAgainstVocabulary } from '../../scripts/check-doc-inventory-gates.mjs';

const plan = 'plans/260925-documentation-authority-unification';
const vocabulary = JSON.parse(fs.readFileSync(new URL('../../' + plan + '/claim-and-disposition-vocabulary.json', import.meta.url)));
const author = 'fixture-session:author@2026-10-07';
const reviewer = 'reviewer:fixture-session:other@2026-10-07';
const reportPath = plan + '/reports/phase-06/review-corpus-fixture.md';
const corpora = ['history-evidence', 'user-knowledge', 'consumer-project'];
const rule = (corpus) => ({ corpus, disposition: corpus === 'history-evidence' ? 'retain-as-evidence' : 'reclassify-out-of-platform-scope', rationale: 'The classified corpus remains outside maintained platform authority.', claimKind: 'historical-context', reviewStatus: 'reviewed', authoredBy: author, reviewedBy: reviewer, reviewedAt: '2026-10-07', reviewReport: reportPath });
const digestOf = ({ corpus, disposition, rationale, claimKind }) => createHash('sha256').update(JSON.stringify({ corpus, disposition, rationale, ...(claimKind === undefined ? {} : { claimKind }) })).digest('hex');
function fixture(t, rules = corpora.map(rule)) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'doc-corpus-rule-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  git('init', '-q');
  git('config', 'user.name', 'Fixture');
  git('config', 'user.email', 'fixture@example.invalid');
  fs.mkdirSync(path.dirname(path.join(root, reportPath)), { recursive: true });
  const report = 'Reviewer: ' + reviewer + '\n\n' + rules.map((entry) => 'Corpus: ' + entry.corpus + '\nRule digest: ' + digestOf(entry) + '\n| Rule | Verdict | Note |\n|---|---|---|\n| corpus:' + entry.corpus + ' | ok | Checked the classification and non-authority retention rule. |').join('\n\n');
  fs.writeFileSync(path.join(root, reportPath), report);
  git('add', '--', reportPath);
  git('commit', '-qm', 'docs: record independent corpus review', '--', reportPath);
  const commit = git('rev-parse', 'HEAD');
  const items = corpora.map((corpus, i) => ({ path: 'docs/fixture/' + i + '.md', corpus, authorityStatus: 'non-authority', proposedDisposition: 'unknown-blocking' }));
  items.push({ path: 'docs/specs/legacy.md', corpus: 'platform-authority', authorityStatus: 'legacy-current', proposedDisposition: 'unknown-blocking' });
  const claimLedger = items.map((item, i) => ({ claimId: 'claim_' + i, sourcePath: item.path, sourceAnchor: 'contract', sourceUnitDigest: String(i + 1).repeat(64), claimKind: 'unclassified', disposition: 'unknown-blocking', reviewStatus: 'blocking', targetOwner: null, targetAnchor: null }));
  return { root, report, git, inventory: { commit, items, claimLedger }, shard: { version: 1, shard: 'corpus-fixture', authorSession: author, authorshipRequired: true, sources: items.map((item) => item.path), claims: [], corpusRules: rules } };
}
const apply = (f, shard = f.shard, inventory = f.inventory) => applyDecisions(inventory, [shard], { vocabulary, repoRoot: f.root });

test('independently committed corpus rules classify every selected row and file without reviewing legacy authority', (t) => {
  const f = fixture(t);
  const result = apply(f);
  assert.deepEqual(result.findings, []);
  for (let i = 0; i < 3; i++) {
    const row = result.inventory.claimLedger[i];
    assert.equal(row.reviewStatus, 'reviewed');
    assert.equal(row.disposition, f.shard.corpusRules[i].disposition);
    assert.equal(row.authoredBy, author);
    assert.equal(row.reviewedBy, reviewer);
    assert.equal(row.reviewReport, reportPath);
    assert.equal(row.claimKind, 'historical-context');
    assert.match(row.rationale, new RegExp(row.sourcePath));
    assert.equal(result.inventory.items[i].proposedDisposition, row.disposition);
  }
  assert.equal(result.inventory.claimLedger[3].reviewStatus, 'blocking');
  assert.equal(result.inventory.items[3].proposedDisposition, 'unknown-blocking');
});

test('a corpus classification drift is rejected rather than silently giving authority rows a rule approval', (t) => {
  const f = fixture(t);
  const inventory = structuredClone(f.inventory);
  inventory.items[0].authorityStatus = 'legacy-current';
  const result = apply(f, f.shard, inventory);
  assert.ok(result.findings.some((finding) => finding.type === 'decision-corpus-invalid'));
  assert.equal(result.inventory.claimLedger[0].reviewStatus, 'blocking');
});

test('unsupported corpora and dispositions cannot earn rule review', (t) => {
  const f = fixture(t);
  for (const entry of [{ ...rule('platform-authority') }, { ...rule('history-evidence'), disposition: 'delete-as-obsolete' }]) {
    const result = apply(f, { ...f.shard, corpusRules: [entry] });
    assert.ok(result.findings.some((finding) => finding.type === 'decision-corpus-invalid'));
    assert.equal(result.inventory.claimLedger[3].reviewStatus, 'blocking');
  }
});

test('uncommitted, mismatched and self-session corpus review cannot approve rows', (t) => {
  const f = fixture(t);
  const uncommitted = reportPath.replace('fixture.md', 'uncommitted.md');
  fs.writeFileSync(path.join(f.root, uncommitted), f.report);
  const cases = [
    { ...rule('history-evidence'), reviewReport: uncommitted },
    { ...rule('history-evidence'), reviewedBy: 'reviewer:fixture-session:wrong@2026-10-07' },
    { ...rule('history-evidence'), rationale: 'Changed after the committed review.' },
    { ...rule('history-evidence'), reviewedBy: 'reviewer:fixture-session:author@2026-10-08' },
    { ...rule('history-evidence'), authoredBy: 'script:forged' },
  ];
  for (const entry of cases) {
    const result = apply(f, { ...f.shard, corpusRules: [entry] });
    assert.ok(result.findings.some((finding) => finding.type === 'decision-corpus-review-invalid'));
    assert.equal(result.inventory.claimLedger[0].reviewStatus, 'blocking');
  }
});

test('corpus-generated rows cannot be decided again in the same shard', (t) => {
  const f = fixture(t);
  const row = f.inventory.claimLedger[0];
  const result = apply(f, { ...f.shard, claims: [{ ...row, ...rule('history-evidence'), reviewStatus: 'reviewed' }] });
  assert.ok(result.findings.some((finding) => finding.type === 'decision-claim-duplicate'));
});

test('loader rejects a malformed corpus-rule collection', (t) => {
  const f = fixture(t);
  const file = path.join(f.root, 'shard.json');
  fs.writeFileSync(file, JSON.stringify({ ...f.shard, corpusRules: {} }));
  assert.throws(() => loadDecisionShards(file), /corpusRules.*array/);
});

test('pending corpus policy keeps rows blocking until its independent review is committed', (t) => {
  const f = fixture(t);
  const pending = { ...rule('history-evidence'), reviewStatus: 'pending' };
  delete pending.reviewedBy; delete pending.reviewedAt; delete pending.reviewReport;
  const result = apply(f, { ...f.shard, corpusRules: [pending] });
  assert.deepEqual(result.findings, []);
  assert.equal(result.inventory.claimLedger[0].reviewStatus, 'blocking');
  assert.equal(result.inventory.items[0].proposedDisposition, 'unknown-blocking');
});

test('corpus approval preserves generated projections while reviewing every generated claim', (t) => {
  const f = fixture(t);
  const projections = [
    ['docs/decisions/index.md', 'history-evidence'],
    ['docs/doc-registry.md', 'user-knowledge'],
    ['docs/enduser-docs-index.json', 'user-knowledge'],
  ];
  for (const [sourcePath, corpus] of projections) {
    f.inventory.items.push({ path: sourcePath, corpus, authorityStatus: 'non-authority', fileClass: 'generated', proposedDisposition: 'regenerate-from-source' });
    f.inventory.claimLedger.push({ claimId: 'claim_' + f.inventory.claimLedger.length, sourceId: sourcePath, sourcePath, sourceAnchor: 'file-block', sourceDigest: 'a'.repeat(64), sourceUnitDigest: 'a'.repeat(64), authorityKind: 'generated', status: 'historical', relations: [], claimKind: 'unclassified', disposition: 'unknown-blocking', reviewStatus: 'blocking', targetOwner: null, targetAnchor: null });
    f.shard.sources.push(sourcePath);
  }
  const result = apply(f);
  assert.deepEqual(result.findings, []);
  const generated = result.inventory.items.filter((item) => item.fileClass === 'generated');
  assert.deepEqual(generated.map((item) => item.proposedDisposition), projections.map(() => 'regenerate-from-source'));
  assert.deepEqual(validateAgainstVocabulary({ items: generated, claimLedger: result.inventory.claimLedger.filter((row) => projections.some(([source]) => source === row.sourcePath)) }, vocabulary), []);
  for (const [sourcePath, corpus] of projections) {
    const row = result.inventory.claimLedger.find((entry) => entry.sourcePath === sourcePath);
    assert.equal(row.disposition, rule(corpus).disposition);
    assert.equal(row.reviewStatus, 'reviewed');
    assert.equal(row.reviewedBy, reviewer);
    assert.equal(row.reviewReport, reportPath);
  }
  assert.equal(result.inventory.items[0].proposedDisposition, 'retain-as-evidence');
  assert.equal(result.inventory.items[1].proposedDisposition, 'reclassify-out-of-platform-scope');
});
