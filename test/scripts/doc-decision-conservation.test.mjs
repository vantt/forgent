import test from 'node:test';
import assert from 'node:assert/strict';
import { coverageOfSources, rebindReviewedDecisions, createClaimSnapshot, verifyClaimSnapshot } from '../../scripts/propose-doc-decisions.mjs';

const source = 'docs/specs/example.md';
const target = 'docs/platform/example.md';
const digest = 'a'.repeat(64);
const row = { claimId: `claim_${'1'.repeat(32)}`, sourceId: `src_${'2'.repeat(32)}`, sourcePath: source, sourceAnchor: 'old', sourceDigest: digest, sourceUnitDigest: digest, sourceLocation: { start: 1, end: 2 }, targetOwner: null, targetAnchor: null, claimKind: 'implementation-fact', authorityKind: 'legacy', status: 'current', relations: [], decisionRefs: [], evidenceLinks: [], disposition: 'unknown-blocking', reviewStatus: 'blocking', identityUnitDigest: digest, identityFingerprint: digest, identityStatus: 'stable' };
const context = { inventory: { version: 1, commit: 'b'.repeat(40), claimLedger: [row], items: [{ path: source, proposedDisposition: 'unknown-blocking', corpus: 'platform-authority', authorityStatus: 'legacy-current' }, { path: target, proposedDisposition: 'promote', corpus: 'platform-authority', authorityStatus: 'candidate' }] }, unitsOf: () => [{ anchor: 'current', textDigest: digest, text: 'The entire implementation contract is retained verbatim.', ancestry: [] }] };
const decision = { ...row, targetOwner: target, targetAnchor: 'current', disposition: 'promote', rationale: 'The whole contract is carried.', reviewStatus: 'pending' };
const shard = { version: 1, shard: 'example', sources: [source], claims: [decision] };
const vocabulary = { claimKinds: [{ id: 'implementation-fact' }], sourceDispositions: [{ id: 'promote', requiresTargetOwner: true, requiresRationale: true }, { id: 'unknown-blocking' }] };
const schema = { required: Object.keys(row), properties: Object.fromEntries([...Object.keys(row), 'rationale'].map((name) => [name, {}])) };

test('coverage honors explicit source paths and prefix maps but not target mentions or neighboring prefixes', () => {
  const inventory = { items: [{ path: source }, { path: 'docs/specs/examples.md' }, { path: 'docs/history/old.md' }] };
  const map = '| Source | Target |\n|---|---|\n| `docs/specs/example.md#contract` | `docs/specs/examples.md` |\n| `docs/history/**` | history |';
  assert.deepEqual(coverageOfSources(inventory, [map], []).uncovered, ['docs/specs/examples.md']);
  const mirrors = [{ mirrors: [{ path: 'docs/specs/examples.md', target }] }];
  assert.deepEqual(coverageOfSources(inventory, [map], mirrors).uncovered, []);
  assert.equal(coverageOfSources(inventory, [], []).sourceFiles, 3);
});

test('rebind preserves review only for one digest match and otherwise returns rows to pending', () => {
  const reviewed = { ...shard, claims: [{ ...decision, targetAnchor: 'old', targetUnitDigest: digest, reviewStatus: 'reviewed', reviewedBy: 'reviewer:fixture-session:other@2026-10-07', reviewedAt: '2026-10-07' }] };
  const rebound = rebindReviewedDecisions(context, reviewed);
  assert.equal(rebound.shard.claims[0].targetAnchor, 'current');
  assert.equal(rebound.shard.claims[0].reviewStatus, 'reviewed');
  assert.deepEqual(rebound.rebound, [row.claimId]);
  for (const units of [[], [context.unitsOf()[0], { ...context.unitsOf()[0], anchor: 'other' }]]) {
    const result = rebindReviewedDecisions({ ...context, unitsOf: () => units }, reviewed);
    assert.equal(result.shard.claims[0].reviewStatus, 'pending');
    assert.equal(result.shard.claims[0].reviewedBy, undefined);
    assert.deepEqual(result.pending, [row.claimId]);
  }
  assert.equal(reviewed.claims[0].targetAnchor, 'old');
});

test('snapshot uses merged decisions in the ledger schema shape and verifies both content and digest', () => {
  const snapshot = createClaimSnapshot(context, [shard], { vocabulary, schema });
  assert.equal(snapshot.rows[0].targetOwner, target);
  assert.equal(snapshot.rows[0].disposition, 'promote');
  assert.equal(snapshot.rows[0].reviewedBy, undefined);
  assert.equal(verifyClaimSnapshot(context, [shard], snapshot, { vocabulary, schema }).ok, true);
  const edited = structuredClone(snapshot);
  edited.rows[0].targetOwner = 'docs/platform/wrong.md';
  assert.equal(verifyClaimSnapshot(context, [shard], edited, { vocabulary, schema }).ok, false);
  const falseDigest = { ...snapshot, sha256: '0'.repeat(64) };
  assert.equal(verifyClaimSnapshot(context, [shard], falseDigest, { vocabulary, schema }).ok, false);
  const incomplete = { ...context, inventory: { ...context.inventory, claimLedger: [{ ...row, sourceId: undefined }] } };
  assert.throws(() => createClaimSnapshot(incomplete, [], { vocabulary, schema }), /required/);
  const stale = { ...shard, claims: [{ ...decision, sourceUnitDigest: 'c'.repeat(64) }] };
  assert.throws(() => createClaimSnapshot(context, [stale], { vocabulary, schema }), /decision/);
});
