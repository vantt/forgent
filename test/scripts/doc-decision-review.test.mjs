import test from 'node:test';
import assert from 'node:assert/strict';
import { buildReviewPack, seedReviewPack, scoreReviewPack, applyReviewVerdicts, parseReviewVerdicts } from '../../scripts/propose-doc-decisions.mjs';
import { applyDecisions } from '../../scripts/check-doc-inventory-gates.mjs';

const author = 'codex-session:author@2026-10-07';
const reviewer = 'reviewer:claude-session:other@2026-10-07';
const digest = 'a'.repeat(64);
const rows = Array.from({ length: 36 }, (_, i) => ({ claimId: `claim_${i.toString(16).padStart(32, '0')}`, sourcePath: 'docs/specs/example.md', sourceAnchor: `a${i}`, sourceUnitDigest: digest, claimKind: 'implementation-fact' }));
const unit = (i) => ({ anchor: `a${i}`, textDigest: digest, ancestry: ['Contract'], text: `The operation MUST NOT exceed 12 requests; mode is required.\n- Retain the first item.\n- Retain the second item.` });
const context = { inventory: { commit: 'b'.repeat(40), claimLedger: rows, items: [] }, unitsOf: () => rows.map((_, i) => unit(i)) };
const shard = { version: 1, shard: 's02-example', sources: ['docs/specs/example.md'], authorSession: author, authorshipRequired: true, claims: rows.map((row, i) => ({ claimId: row.claimId, sourceUnitDigest: digest, targetOwner: 'docs/platform/example.md', targetAnchor: `a${i}`, claimKind: row.claimKind, disposition: 'promote', rationale: 'Retain the entire operation contract.', reviewStatus: 'pending', authoredBy: author })) };

test('review pack contains full source and target units and reverse unmatched candidate blocks', () => {
  const pack = buildReviewPack(context, shard);
  assert.equal(pack.rows[0].source.text, unit(0).text);
  assert.equal(pack.rows[0].target.text, unit(0).text);
  assert.equal(pack.rows[0].claimId, rows[0].claimId);
  assert.deepEqual(pack.unmatchedCandidateUnits, []);
  const extra = { ...context, unitsOf: (owner) => owner.startsWith('docs/platform/') ? [...rows.map((_, i) => unit(i)), { anchor: 'invented', textDigest: 'b'.repeat(64), text: 'An invented obligation.', ancestry: [] }] : rows.map((_, i) => unit(i)) };
  assert.equal(buildReviewPack(extra, shard).unmatchedCandidateUnits[0].unit.text, 'An invented obligation.');
});

test('seeded review uses six real text mutations and scores missed defects and false flags', () => {
  const pack = buildReviewPack(context, shard);
  const seeded = seedReviewPack(pack, { seed: 'reproducible', reviewer, authorSession: author });
  assert.equal(seeded.pack.rows.length, 30);
  assert.equal(seeded.key.rows.filter((row) => row.mutated).length, 6);
  assert.deepEqual(seedReviewPack(pack, { seed: 'reproducible', reviewer, authorSession: author }), seeded);
  assert.ok(!JSON.stringify(seeded.pack).includes('mutationKind'));
  const verdicts = seeded.key.rows.map((row) => ({ claimId: row.claimId, verdict: row.mutated ? 'rework' : 'ok', note: 'Compared full units.' }));
  assert.equal(scoreReviewPack(seeded.key, verdicts).pass, true);
  const missed = verdicts.map((row) => ({ ...row, verdict: 'ok' }));
  assert.equal(scoreReviewPack(seeded.key, missed).pass, false);
  assert.throws(() => seedReviewPack(pack, { seed: 'x', reviewer: `reviewer:${author}`, authorSession: author }), /independent/);
  assert.throws(() => scoreReviewPack(seeded.key, verdicts.slice(1)), /missing/);
});

test('review application binds current digest and keeps rework and hold pending without inventing approval', () => {
  const verdicts = shard.claims.map((row, i) => ({ claimId: row.claimId, verdict: i === 0 ? 'ok' : i === 1 ? 'hold' : 'rework', note: i === 0 ? 'Entire contract retained.' : 'Owner decision needed.' }));
  const result = applyReviewVerdicts(context, shard, { verdicts, reviewer, reportPath: 'fixture/review-example.md', reviewedAt: '2026-10-07' });
  assert.equal(result.claims[0].reviewStatus, 'reviewed');
  assert.equal(result.claims[0].targetUnitDigest, digest);
  assert.equal(result.claims[0].reviewedBy, reviewer);
  assert.equal(result.claims[1].reviewStatus, 'pending');
  assert.equal(result.claims[1].reviewNote, 'Owner decision needed.');
  assert.equal(result.reviewReport, 'fixture/review-example.md');
  assert.throws(() => applyReviewVerdicts(context, shard, { verdicts, reviewer: `reviewer:${author}`, reportPath: 'report.md' }), /independent/);
  assert.throws(() => applyReviewVerdicts(context, shard, { verdicts: [...verdicts, verdicts[0]], reviewer, reportPath: 'report.md' }), /duplicate/);
  assert.throws(() => applyReviewVerdicts({ ...context, unitsOf: () => [] }, shard, { verdicts, reviewer, reportPath: 'report.md' }), /target/);
  assert.equal(shard.claims[0].reviewStatus, 'pending');
});

test('verdict table names the reviewer and requires an explicit verdict and own note for each row', () => {
  const text = `# Review\n\nReviewer: ${reviewer}\n\n| claimId | verdict | note |\n|---|---|---|\n| ${rows[0].claimId} | ok | Entire contract retained. |\n`;
  assert.deepEqual(parseReviewVerdicts(text, reviewer), [{ claimId: rows[0].claimId, verdict: 'ok', note: 'Entire contract retained.' }]);
  assert.throws(() => parseReviewVerdicts(text, `reviewer:${author}`), /reviewer/);
  assert.throws(() => parseReviewVerdicts(text.replace('Entire contract retained.', ''), reviewer), /note/);
});

for (const verdict of ['hold', 'rework']) {
  test(`unknown dispositions remain blocking after a ${verdict} verdict and pass decision validation`, () => {
    const inventory = { ...context.inventory, items: [{ path: rows[0].sourcePath }], claimLedger: [rows[0]] };
    const blocked = { ...shard, claims: [{ ...shard.claims[0], targetOwner: null, targetAnchor: null, disposition: 'unknown-blocking', reviewStatus: 'blocking', searched: [rows[0].sourcePath], reviewedBy: reviewer, reviewedAt: '2026-10-06' }] };
    const note = 'The owner must name the missing carrier.';
    const result = applyReviewVerdicts({ ...context, inventory }, blocked, { verdicts: [{ claimId: rows[0].claimId, verdict, note }], reviewer, reportPath: 'fixture/review.md' });
    const decided = result.claims[0];
    assert.equal(decided.reviewStatus, 'blocking');
    assert.equal(decided.reviewNote, note);
    assert.equal(decided.reviewedBy, undefined);
    assert.equal(decided.reviewedAt, undefined);
    const vocabulary = { claimKinds: [{ id: 'implementation-fact' }], sourceDispositions: [{ id: 'unknown-blocking', requiresTargetOwner: false }] };
    assert.deepEqual(applyDecisions(inventory, [result], { vocabulary }).findings, []);
  });
}
