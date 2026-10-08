import test from 'node:test';
import assert from 'node:assert/strict';
import { checkConservation } from '../../scripts/check-doc-inventory-gates.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { loadDecisionShards, buildConservationUnitLookup } from '../../scripts/check-doc-inventory-gates.mjs';

const source = 'docs/specs/alpha.md';
const owner = 'docs/platform/alpha/spec.md';
const sibling = 'docs/platform/alpha/contracts/new.md';
const other = 'docs/platform/beta/spec.md';
const vocabulary = { sourceDispositions: [{ id: 'promote', requiresTargetOwner: true }, { id: 'unknown-blocking' }] };
const unit = (claimId, sourcePath, sourceAnchor, overrides = {}) => ({ claimId, sourcePath, sourceAnchor, sourceUnitDigest: 'a'.repeat(64), disposition: 'unknown-blocking', reviewStatus: 'blocking', targetOwner: null, ...overrides });
const sourceRow = unit('source-contract', source, 'contract', { disposition: 'promote', reviewStatus: 'pending', targetOwner: owner, targetAnchor: 'contract' });
const inventory = {
  items: [{ path: source, corpus: 'platform-authority', authorityStatus: 'legacy-current' }, ...[owner, sibling, other].map((path) => ({ path, corpus: 'platform-authority', authorityStatus: 'candidate' }))],
  claimLedger: [sourceRow, unit('target-contract', owner, 'contract'), unit('target-extra', owner, 'extra'), unit('target-sibling', sibling, 'new'), unit('target-other', other, 'other')],
};
const shard = { version: 1, shard: 'alpha', authorshipRequired: true, sources: [source], claims: [{ claimId: sourceRow.claimId }] };
const run = (overrides = {}) => checkConservation({ inventory, vocabulary, registry: { units: [], identityGaps: [], retiredUnits: [] }, decisions: [shard], ...overrides });

test('candidate units not named by a source decision are open data rather than invariant corruption', () => {
  const result = run();
  assert.deepEqual(result.invariant, []);
  assert.equal(result.open.find((row) => row.type === 'candidate-blocks-unreferenced')?.count, 3);
  assert.deepEqual(new Set(result.unreferencedCandidateRows.map((row) => row.claimId)), new Set(['target-extra', 'target-sibling', 'target-other']));
});

test('legacy source scope checks the target area including unnamed sibling documents, not unrelated areas', () => {
  const result = run({ scope: [source] });
  assert.equal(result.open.find((row) => row.type === 'candidate-blocks-unreferenced')?.count, 2);
  assert.deepEqual(new Set(result.unreferencedCandidateRows.map((row) => row.path)), new Set([owner, sibling]));
});

test('candidate self references cannot conceal invented units and a parent anchor does not own unnamed children', () => {
  const changed = structuredClone(inventory);
  Object.assign(changed.claimLedger[2], { targetOwner: owner, targetAnchor: 'extra' });
  const result = run({ inventory: changed, decisions: [{ ...shard, claims: [...shard.claims, { claimId: 'target-extra' }] }] });
  assert.ok(result.unreferencedCandidateRows.some((row) => row.anchor === 'extra'));
  assert.equal(result.open.find((row) => row.type === 'candidate-blocks-unreferenced')?.count, 3);
});

test('previous shards do not acquire new reverse-review obligations implicitly', () => {
  const old = { ...shard };
  delete old.authorshipRequired;
  const result = run({ decisions: [old] });
  assert.equal(result.open.some((row) => row.type === 'candidate-blocks-unreferenced'), false);
  assert.equal(result.unreferencedCandidateRows, undefined);
});

test('script-proven exact and mirror rows name only their expanded units, not an entire target area', () => {
  const mirrorSource = 'docs/architect/agent-coordination/verification/receipt/data.log';
  const mirrorTarget = 'docs/platform/agent-coordination/verification/receipt/data.log';
  const mirrorSibling = 'docs/platform/agent-coordination/contracts/unclaimed.md';
  const extra = { ...inventory, items: [...inventory.items, { path: mirrorSource, corpus: 'platform-authority', authorityStatus: 'legacy-current' }, { path: mirrorTarget, corpus: 'platform-authority', authorityStatus: 'candidate' }, { path: mirrorSibling, corpus: 'platform-authority', authorityStatus: 'candidate' }], claimLedger: [...inventory.claimLedger, unit('mirror-source', mirrorSource, 'file-block', { sourceUnitDigest: 'b'.repeat(64), disposition: 'promote', targetOwner: mirrorTarget, targetAnchor: 'file-block', reviewStatus: 'reviewed' }), unit('mirror-target', mirrorTarget, 'file-block', { sourceUnitDigest: 'b'.repeat(64) }), unit('mirror-sibling', mirrorSibling, 'unclaimed')] };
  const carriers = { ...shard, claims: [], exact: [{ source, target: owner, rows: [{ claimId: sourceRow.claimId }] }], mirrors: [{ path: mirrorSource, target: mirrorTarget, blobSha: 'b'.repeat(40) }] };
  const result = run({ inventory: extra, decisions: [carriers] });
  assert.equal(result.open.find((row) => row.type === 'candidate-blocks-unreferenced')?.count, 4);
  assert.ok(result.unreferencedCandidateRows.some((row) => row.claimId === 'mirror-sibling'));
  assert.equal(result.unreferencedCandidateRows.some((row) => row.claimId === 'mirror-target' || row.claimId === 'target-contract'), false);
});

function receiptFixture(t, options = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'candidate-classification-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  const write = (file, text) => {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), text);
  };
  git('init', '-q');
  git('config', 'user.name', 'Fixture');
  git('config', 'user.email', 'fixture@example.invalid');
  const author = 'codex-session:author@2026-10-08';
  const reviewer = options.reviewer || 'reviewer:claude-session:reviewer@2026-10-08';
  const receiptPath = 'plans/fixture/ledger/candidate-classifications-alpha.json';
  const reportPath = 'plans/fixture/reports/phase-06/review-2-classifications.md';
  write(owner, '# Alpha\n\n## Native\n\nCandidate navigation frame.\n');
  git('add', '--', owner); git('commit', '-qm', 'candidate');
  const nativeUnit = buildConservationUnitLookup(root, git('rev-parse', 'HEAD'))(owner).find(unit => unit.anchor === (options.heading ? 'native' : 'unheaded-block-1'));
  const digest = nativeUnit.textDigest;
  const shownText = nativeUnit.sectionText ?? nativeUnit.text;
  const shownTextDigest = createHash('sha256').update(shownText).digest('hex');
  const receipt = { claimId: 'native-unit', path: owner, anchor: nativeUnit.anchor, unitDigest: digest, shownText: options.shownText || shownText, shownTextDigest: options.receiptShownDigest || shownTextDigest, class: options.class || 'candidate-native-navigation', authoredBy: options.authoredBy ?? author };
  write(receiptPath, JSON.stringify({ version: 1, authorSession: options.authorSession ?? author, receipts: [receipt] }));
  if (!options.uncommittedReceipt) { git('add', '--', receiptPath); git('commit', '-qm', 'classification receipt'); }
  const receiptCommit = git('rev-parse', 'HEAD');
  const note = 'The shown unit is candidate-native material, not an unnamed legacy claim.';
  write(reportPath, `# Independent classification review\nAuthor session: ${author}\nReviewer: ${options.reportReviewer || reviewer}\nReceipt commit: ${receiptCommit}\n\n| Claim | Class | Verdict | Unit digest | Shown text digest | Note |\n|---|---|---|---|---|---|\n| native-unit | ${options.reportClass || receipt.class} | ${options.verdict || 'ok'} | ${options.reportDigest || digest} | ${options.reportShownDigest || shownTextDigest} | ${note} |\n`);
  if (!options.uncommittedReport) { git('add', '--', reportPath); git('commit', '-qm', 'independent review'); }
  const commit = git('rev-parse', 'HEAD');
  const classification = { claimId: receipt.claimId, receiptPath, receiptCommit, reviewStatus: options.reviewStatus || 'reviewed', reviewedBy: reviewer, reviewedAt: '2026-10-08', reviewReport: reportPath, reviewReportCommit: commit, reviewNote: note };
  const nativeInventory = { commit, items: [{ path: options.currentPath || owner, authorityStatus: 'candidate' }], claimLedger: [unit(receipt.claimId, options.currentPath || owner, options.currentAnchor || receipt.anchor, { sourceUnitDigest: options.currentDigest || digest })] };
  const nativeShard = { version: 1, shard: 'native', authorSession: options.shardAuthorSession ?? author, authorshipRequired: options.authorshipRequired ?? true, sources: [], claims: [], candidateClassifications: [classification] };
  return { root, receiptPath, receipt, classification, nativeInventory, nativeShard, write, git, check: (overrides = {}) => checkConservation({ repoRoot: root, inventory: nativeInventory, vocabulary, decisions: [nativeShard], ...overrides }).unreferencedCandidateRows };
}

for (const classification of ['candidate-native-navigation', 'structural-frame', 'bookkeeping']) {
  test(`a committed independently accepted ${classification} receipt closes only its bound unit`, (t) => {
    const fixture = receiptFixture(t, { class: classification });
    assert.deepEqual(fixture.check(), []);
    const added = unit('unnamed-child', owner, 'child');
    assert.deepEqual(fixture.check({ inventory: { ...fixture.nativeInventory, claimLedger: [...fixture.nativeInventory.claimLedger, added] } }).map(row => row.claimId), ['unnamed-child']);
  });
}

for (const [name, options] of [
  ['an uncommitted receipt', { uncommittedReceipt: true }],
  ['an uncommitted review report', { uncommittedReport: true }],
  ['a non-accepted verdict', { verdict: 'rework' }],
  ['an unapproved reference', { reviewStatus: 'pending' }],
  ['a class outside the fixed list', { class: 'invented-claim' }],
  ['a reviewer who authored the receipt in the same session on another date', { reviewer: 'reviewer:codex-session:author@2026-10-09' }],
  ['missing row authorship', { authoredBy: '' }],
  ['missing receipt session authorship', { authorSession: '' }],
  ['missing shard authorship with the opt-in flag disabled', { shardAuthorSession: '', authorshipRequired: false }],
  ['a script pretending to author a classification', { authoredBy: 'script:classifier' }],
  ['a reviewer identity different from the report', { reportReviewer: 'reviewer:claude-session:someone-else@2026-10-08' }],
  ['a changed candidate unit', { currentDigest: 'b'.repeat(64) }],
  ['a moved unit path', { currentPath: sibling }],
  ['a moved unit heading', { currentAnchor: 'elsewhere' }],
  ['a report for a different class', { reportClass: 'bookkeeping' }],
  ['a report for a different shown-text digest', { reportDigest: 'b'.repeat(64) }],
]) {
  test(`reverse conservation leaves its unit open with ${name}`, (t) => {
    const fixture = receiptFixture(t, options);
    assert.deepEqual(fixture.check().map(row => row.claimId), ['native-unit']);
  });
}

test('classification proofs read committed receipt bytes, not a later working-tree rewrite', (t) => {
  const fixture = receiptFixture(t, { class: 'structural-frame' });
  fixture.write(fixture.receiptPath, JSON.stringify({ version: 1, authorSession: 'codex-session:author@2026-10-08', receipts: [{ ...fixture.receipt, class: 'invented-claim', unitDigest: 'f'.repeat(64) }] }));
  assert.deepEqual(fixture.check(), []);
});

test('classification report and receipt pins must be ancestors of the inventory commit', (t) => {
  const fixture = receiptFixture(t, { class: 'bookkeeping' });
  fixture.git('commit', '--allow-empty', '-qm', 'future proof');
  fixture.classification.receiptCommit = fixture.git('rev-parse', 'HEAD');
  assert.deepEqual(fixture.check().map(row => row.claimId), ['native-unit']);
});

test('the shard loader rejects a non-array classification reference list', (t) => {
  const fixture = receiptFixture(t);
  fixture.write('shard.json', JSON.stringify({ ...fixture.nativeShard, candidateClassifications: {} }));
  assert.throws(() => loadDecisionShards(path.join(fixture.root, 'shard.json')), /candidateClassifications.*array/);
});

test('heading classification approval is invalidated when the shown section changes without changing its heading identity', (t) => {
  const fixture = receiptFixture(t, { class: 'structural-frame', heading: true });
  assert.deepEqual(fixture.check(), []);
  fixture.write(owner, '# Alpha\n\n## Native\n\nA changed candidate claim.\n');
  fixture.git('add', '--', owner); fixture.git('commit', '-qm', 'changed candidate');
  fixture.nativeInventory.commit = fixture.git('rev-parse', 'HEAD');
  assert.deepEqual(fixture.check().map(row => row.claimId), ['native-unit']);
});

for (const [name, options] of [
  ['a forged receipt payload', { shownText: 'A clause the reviewer did not see.' }],
  ['a stale receipt payload digest', { receiptShownDigest: 'e'.repeat(64) }],
  ['a stale reviewed payload digest', { reportShownDigest: 'e'.repeat(64) }],
]) {
  test(`a classification receipt does not close a unit with ${name}`, (t) => {
    const fixture = receiptFixture(t, options);
    assert.deepEqual(fixture.check().map(row => row.claimId), ['native-unit']);
  });
}
