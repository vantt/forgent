import test from 'node:test';
import assert from 'node:assert/strict';
import { buildReviewPack, seedReviewPack, scoreReviewPack, applyReviewVerdicts, parseReviewVerdicts, independentReviewer } from '../../scripts/propose-doc-decisions.mjs';
import { applyDecisions } from '../../scripts/check-doc-inventory-gates.mjs';

const author = 'codex-session:author@2026-10-07';
const reviewer = 'reviewer:claude-session:other@2026-10-07';
const digest = 'a'.repeat(64);
const rows = Array.from({ length: 36 }, (_, i) => ({ claimId: `claim_${i.toString(16).padStart(32, '0')}`, sourcePath: 'docs/specs/example.md', sourceAnchor: `a${i}`, sourceUnitDigest: digest, claimKind: 'implementation-fact' }));
const unit = (i) => ({ anchor: `a${i}`, textDigest: digest, ancestry: ['Contract'], text: `The operation MUST NOT exceed 12 requests; mode is required.\n- Retain the first item.\n- Retain the second item.` });
const context = { inventory: { commit: 'b'.repeat(40), claimLedger: rows, items: [] }, unitsOf: () => rows.map((_, i) => unit(i)) };
const shard = { version: 1, shard: 's02-example', sources: ['docs/specs/example.md'], authorSession: author, authorshipRequired: true, claims: rows.map((row, i) => ({ claimId: row.claimId, sourceUnitDigest: digest, targetOwner: 'docs/platform/example.md', targetAnchor: `a${i}`, claimKind: row.claimKind, disposition: 'promote', rationale: 'Retain the entire operation contract.', reviewStatus: 'pending', authoredBy: author })) };

function reviewEvidence(decisions = shard) {
  const claims = new Map(shard.claims.map((row) => [row.claimId, row]));
  for (const row of decisions.claims) claims.set(row.claimId, row);
  const pack = buildReviewPack(context, { ...decisions, claims: [...claims.values()] });
  const seeded = seedReviewPack(pack, { seed: 'fixture-sensitivity', reviewer, nonce: '1'.repeat(64) });
  return { pack, seedProof: { key: seeded.key, verdicts: seeded.key.rows.map((row) => ({ claimId: row.claimId, verdict: row.mutated ? 'rework' : 'ok', note: 'Compared the fixture units.' })) } };
}

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
  const seeded = seedReviewPack(pack, { seed: 'reproducible', reviewer, authorSession: author, nonce: '1'.repeat(64) });
  assert.equal(seeded.pack.rows.length, 30);
  assert.equal(seeded.key.rows.filter((row) => row.mutated).length, 6);
  assert.deepEqual(seedReviewPack(pack, { seed: 'reproducible', reviewer, authorSession: author, nonce: seeded.key.nonce }), seeded);
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
  const result = applyReviewVerdicts(context, shard, { ...reviewEvidence(), verdicts, reviewer, reportPath: 'fixture/review-example.md', reviewedAt: '2026-10-07' });
  assert.equal(result.claims[0].reviewStatus, 'reviewed');
  assert.equal(result.claims[0].targetUnitDigest, digest);
  assert.equal(result.claims[0].reviewedBy, reviewer);
  assert.equal(result.claims[1].reviewStatus, 'pending');
  assert.equal(result.claims[1].reviewNote, 'Owner decision needed.');
  assert.equal(result.reviewReport, 'fixture/review-example.md');
  assert.throws(() => applyReviewVerdicts(context, shard, { verdicts, reviewer: `reviewer:${author}`, reportPath: 'report.md' }), /independent/);
  assert.throws(() => applyReviewVerdicts(context, shard, { verdicts: [...verdicts, verdicts[0]], reviewer, reportPath: 'report.md' }), /duplicate/);
  assert.throws(() => applyReviewVerdicts({ ...context, unitsOf: () => [] }, shard, { ...reviewEvidence(), verdicts, reviewer, reportPath: 'report.md' }), /target/);
  assert.equal(shard.claims[0].reviewStatus, 'pending');
});

test('valid source digest prefixes survive pack and review application with full seen-text bindings', () => {
  const prefixed = { ...shard, claims: shard.claims.map((row) => ({ ...row, sourceUnitDigest: digest.slice(0, 16) })) };
  const evidence = reviewEvidence(prefixed);
  assert.equal(evidence.pack.rows[0].sourceUnitDigest, digest);
  const verdicts = prefixed.claims.map((row) => ({ claimId: row.claimId, verdict: 'ok', note: 'Entire source and target units retained.' }));
  const result = applyReviewVerdicts(context, prefixed, { ...evidence, verdicts, reviewer, reportPath: 'fixture/review-example.md' });
  assert.equal(result.claims[0].reviewStatus, 'reviewed');
  assert.equal(result.claims[0].sourceUnitDigest, digest.slice(0, 16));
  assert.equal(result.claims[0].targetUnitDigest, digest);
  for (const sourceUnitDigest of [digest.slice(0, 15), 'f'.repeat(16)]) {
    assert.throws(() => buildReviewPack(context, { ...shard, claims: [{ ...shard.claims[0], sourceUnitDigest }] }), /stale source/);
  }
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
    const result = applyReviewVerdicts({ ...context, inventory }, blocked, { ...reviewEvidence(blocked), verdicts: [{ claimId: rows[0].claimId, verdict, note }], reviewer, reportPath: 'fixture/review.md' });
    const decided = result.claims[0];
    assert.equal(decided.reviewStatus, 'blocking');
    assert.equal(decided.reviewNote, note);
    assert.equal(decided.reviewedBy, undefined);
    assert.equal(decided.reviewedAt, undefined);
    const vocabulary = { claimKinds: [{ id: 'implementation-fact' }], sourceDispositions: [{ id: 'unknown-blocking', requiresTargetOwner: false }] };
    assert.deepEqual(applyDecisions(inventory, [result], { vocabulary }).findings, []);
  });
}

test('the same reviewer session on another date is still the author session', () => {
  assert.equal(independentReviewer('reviewer:codex-session:author@2026-10-08', author), false);
  assert.equal(independentReviewer(reviewer, undefined), false);
  assert.equal(independentReviewer(reviewer, author), true);
  const verdicts = shard.claims.map((row) => ({ claimId: row.claimId, verdict: 'rework', note: 'Requires a different session.' }));
  assert.throws(() => applyReviewVerdicts(context, shard, { verdicts, reviewer: 'reviewer:codex-session:author@2026-10-08', reportPath: 'fixture/review.md' }), /independent/);
});

test('pre-reviewed hand rows without committed evidence are rejected instead of skipped', () => {
  const forged = { ...shard, claims: [{ ...shard.claims[0], reviewStatus: 'reviewed', reviewedBy: reviewer, reviewedAt: '2026-10-07', targetUnitDigest: digest }] };
  assert.throws(() => buildReviewPack(context, forged), /committed review/);
  assert.throws(() => applyReviewVerdicts(context, forged, { verdicts: [], reviewer, reportPath: 'fixture/review.md' }), /committed review/);
});

test('a public seeded pack does not expose its replay inputs or retain original mutated digests', () => {
  const original = buildReviewPack(context, shard);
  const first = seedReviewPack(original, { seed: 'hidden-input', reviewer, nonce: '1'.repeat(64) });
  const second = seedReviewPack(original, { seed: 'hidden-input', reviewer, nonce: '2'.repeat(64) });
  assert.equal('seed' in first.pack, false);
  assert.equal('nonce' in first.pack, false);
  assert.notEqual(first.key.nonce, second.key.nonce);
  const replay = seedReviewPack(original, { seed: first.key.seed, reviewer, nonce: first.key.nonce });
  assert.deepEqual(replay, first);
  for (const keyed of first.key.rows.filter((row) => row.mutated)) {
    const shown = first.pack.rows.find((row) => row.claimId === keyed.claimId);
    assert.notEqual(shown.target.textDigest, digest);
    assert.notEqual(shown.target.text, unit(0).text);
  }
});

test('review application requires a passing sensitivity result for the exact shown pack', () => {
  const verdicts = shard.claims.map((row) => ({ claimId: row.claimId, verdict: 'ok', note: 'The entire shown contract is retained.' }));
  const options = { verdicts, reviewer, reportPath: 'fixture/review.md' };
  assert.throws(() => applyReviewVerdicts(context, shard, options), /sensitivity/);
  const evidence = reviewEvidence();
  const failed = { ...evidence.seedProof, verdicts: evidence.seedProof.verdicts.map((row) => ({ ...row, verdict: 'ok' })) };
  assert.throws(() => applyReviewVerdicts(context, shard, { ...options, ...evidence, seedProof: failed }), /sensitivity/);
  const altered = structuredClone(evidence);
  altered.pack.rows[0].target.text = 'A claim not shown to the reviewer.';
  assert.throws(() => applyReviewVerdicts(context, shard, { ...options, ...altered }), /pack/);
});

test('approval cannot attach to target text or heading ancestry changed after the pack', () => {
  const verdicts = shard.claims.map((row) => ({ claimId: row.claimId, verdict: 'ok', note: 'Entire shown unit retained.' }));
  const options = { ...reviewEvidence(), verdicts, reviewer, reportPath: 'fixture/review.md' };
  const drifted = { ...context, unitsOf: (owner) => context.unitsOf(owner).map((unit) => owner.startsWith('docs/platform/') ? { ...unit, textDigest: 'c'.repeat(64), text: 'A different operation contract.' } : unit) };
  assert.throws(() => applyReviewVerdicts(drifted, shard, options), /target.*changed/);
  const moved = { ...context, unitsOf: (owner) => context.unitsOf(owner).map((unit) => owner.startsWith('docs/platform/') ? { ...unit, ancestry: ['Examples'] } : unit) };
  assert.throws(() => applyReviewVerdicts(moved, shard, options), /target.*changed/);
});

test('approved rows retain the seen unit binding and their own report across review rounds', () => {
  const verdicts = shard.claims.map((row) => ({ claimId: row.claimId, verdict: 'ok', note: 'Entire shown unit retained.' }));
  const evidence = reviewEvidence();
  const result = applyReviewVerdicts(context, shard, { ...evidence, verdicts, reviewer, reportPath: 'fixture/review.md', reviewedAt: '2026-10-07' });
  assert.equal(result.claims[0].targetUnitDigest, evidence.pack.rows[0].target.textDigest);
  assert.deepEqual(result.claims[0].targetAncestry, ['Contract']);
  assert.equal(result.claims[0].reviewReport, 'fixture/review.md');
  assert.equal(result.claims[0].reviewPackCommit, context.inventory.commit);
});

test('sensitivity controls must belong to the bound batch even when the sensitivity score passes', () => {
  const pack = buildReviewPack(context, shard);
  const invented = structuredClone(pack.rows[0]);
  invented.claimId = 'claim_' + 'f'.repeat(32);
  invented.decision.claimId = invented.claimId;
  pack.sensitivityControls = [invented];
  const seeded = seedReviewPack(pack, { seed: 'fixture-only-controls', reviewer, nonce: '1'.repeat(64) });
  const seedProof = { key: seeded.key, verdicts: seeded.key.rows.map((row) => ({ claimId: row.claimId, verdict: row.mutated ? 'rework' : 'ok', note: 'Compared complete fixture text.' })) };
  assert.equal(scoreReviewPack(seedProof.key, seedProof.verdicts).pass, true);
  const verdicts = shard.claims.map((row) => ({ claimId: row.claimId, verdict: 'ok', note: 'Entire shown contract retained.' }));
  assert.throws(() => applyReviewVerdicts(context, shard, { pack, seedProof, verdicts, reviewer, reportPath: 'fixture/review.md' }), /controls.*batch/);
});

test('reviewer normalization rejects repeated prefixes case folding and invisible self aliases', () => {
  for (const identity of ['reviewer:reviewer:codex-session:author@2026-10-09', 'reviewer:CODEX-session:AUTHOR@2026-10-09', 'reviewer:codex-session:author\u200b@2026-10-09']) {
    assert.equal(independentReviewer(identity, author), false, identity);
  }
  assert.equal(independentReviewer('reviewer:reviewer:claude-session:other@2026-10-09', author), false);
});

test('sensitivity mutations and controls include judgment text rather than a byte-equal-only pool', () => {
  const original = buildReviewPack(context, shard);
  const scriptsOnly = { ...original, rows: [], sensitivityControls: original.rows.map((row) => ({ ...row, decision: { ...row.decision, authoredBy: 'script:proven', reviewStatus: 'reviewed' } })) };
  assert.throws(() => seedReviewPack(scriptsOnly, { seed: 'pool', reviewer }), /judgment/);
  const judgment = { ...original, rows: original.rows.map((row) => ({ ...row, target: { ...row.target, text: row.target.text.replace('12 requests', '**12** requests'), sectionText: undefined, textDigest: 'c'.repeat(64) } })) };
  const seeded = seedReviewPack(judgment, { seed: 'pool', reviewer });
  assert.equal(seeded.key.rows.filter((row) => row.mutated).length, 6);
  const mechanical = seeded.pack.rows.map((row) => ({ claimId: row.claimId, verdict: row.source.text === row.target.text ? 'ok' : 'rework', note: 'Mechanical byte comparison.' }));
  assert.equal(scoreReviewPack(seeded.key, mechanical).pass, false);
});

test('small judgment batches use previously reviewed controls and require every mutation detected', () => {
  const full = buildReviewPack(context, shard);
  const differing = full.rows.map((row) => ({ ...row, target: { ...row.target, text: row.target.text.replace('12 requests', '**12** requests'), sectionText: undefined, textDigest: 'c'.repeat(64) } }));
  const priorControls = differing.slice(4).map((row) => ({ ...row, decision: { ...row.decision, reviewStatus: 'reviewed', reviewedBy: reviewer, reviewedAt: '2026-10-07', reviewReport: 'review-earlier-fixture.md', reviewReportCommit: 'a'.repeat(40) } }));
  const small = { ...full, rows: differing.slice(0, 4), priorControls };
  const seeded = seedReviewPack(small, { seed: 'small', reviewer });
  assert.equal(seeded.key.rows.length, 30);
  assert.deepEqual(new Set(seeded.key.rows.filter((row) => row.mutated).map((row) => row.claimId)), new Set(small.rows.map((row) => row.claimId)));
  const answers = seeded.key.rows.map((row) => ({ claimId: row.claimId, verdict: row.mutated ? 'rework' : 'ok', note: 'Reviewed the actual full text.' }));
  assert.equal(scoreReviewPack(seeded.key, answers).pass, true);
  answers.find((row) => row.verdict === 'rework').verdict = 'ok';
  assert.equal(scoreReviewPack(seeded.key, answers).pass, false);
});
