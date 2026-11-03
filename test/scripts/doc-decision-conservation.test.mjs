import test from 'node:test';
import assert from 'node:assert/strict';
import { coverageOfSources, rebindReviewedDecisions, createClaimSnapshot, verifyClaimSnapshot } from '../../scripts/propose-doc-decisions.mjs';

const source = 'docs/specs/example.md';
const target = 'docs/platform/example.md';
const digest = 'a'.repeat(64);
const row = { claimId: `claim_${'1'.repeat(32)}`, sourceId: `src_${'2'.repeat(32)}`, sourcePath: source, sourceAnchor: 'old', sourceDigest: digest, sourceUnitDigest: digest, sourceLocation: { start: 1, end: 2 }, targetOwner: null, targetAnchor: null, claimKind: 'implementation-fact', authorityKind: 'legacy', status: 'current', relations: [], decisionRefs: [], evidenceLinks: [], disposition: 'unknown-blocking', reviewStatus: 'blocking', identityUnitDigest: digest, identityFingerprint: digest, identityStatus: 'stable' };
const context = { inventory: { version: 1, commit: 'b'.repeat(40), claimLedger: [row], items: [{ path: source, proposedDisposition: 'unknown-blocking', corpus: 'platform-authority', authorityStatus: 'legacy-current' }, { path: target, proposedDisposition: 'promote', corpus: 'platform-authority', authorityStatus: 'candidate' }] }, unitsOf: () => [{ anchor: 'current', textDigest: digest, text: 'The entire implementation contract is retained verbatim.', ancestry: [] }] };
const decision = { ...row, authoredBy: 'fixture-session:author@2026-10-07', targetOwner: target, targetAnchor: 'current', disposition: 'promote', rationale: 'The whole contract is carried.', reviewStatus: 'pending' };
const shard = { version: 1, shard: 'example', authorSession: 'fixture-session:author@2026-10-07', sources: [source], claims: [decision] };
const vocabulary = { claimKinds: [{ id: 'implementation-fact' }], sourceDispositions: [{ id: 'promote', requiresTargetOwner: true, requiresRationale: true }, { id: 'unknown-blocking' }] };
const schema = { required: Object.keys(row), properties: Object.fromEntries([...Object.keys(row), 'rationale'].map((name) => [name, {}])) };

test('coverage honors explicit source paths and prefix maps but not target mentions or neighboring prefixes', () => {
  const inventory = { items: [source, 'docs/specs/examples.md', 'docs/specs/evidence/old.md'].map((path) => ({ path, corpus: 'platform-authority', authorityStatus: 'legacy-current' })), claimLedger: [] };
  const map = '| Source | Target |\n|---|---|\n| `docs/specs/example.md` | `docs/specs/examples.md` |\n| `docs/specs/evidence/**` | evidence |';
  assert.deepEqual(coverageOfSources(inventory, [map], []).uncovered, ['docs/specs/examples.md']);
  const mirrors = [{ mirrors: [{ path: 'docs/specs/examples.md', target }] }];
  assert.deepEqual(coverageOfSources(inventory, [map], mirrors).uncovered, []);
  assert.equal(coverageOfSources(inventory, [], []).sourceFiles, 3);
});

test('rebind preserves review only for one digest match and otherwise returns rows to pending', () => {
  const reviewed = { ...shard, claims: [{ ...decision, targetAnchor: 'old', targetUnitDigest: digest, targetAncestry: [], reviewStatus: 'reviewed', reviewedBy: 'reviewer:fixture-session:other@2026-10-07', reviewedAt: '2026-10-07' }] };
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

test('identical text moved under another heading loses review while same-context anchor shifts retain it', () => {
  const reviewed = { ...shard, claims: [{ ...decision, targetUnitDigest: digest, targetAncestry: ['Contract'], reviewStatus: 'reviewed', reviewedBy: 'reviewer:fixture-session:other@2026-10-07', reviewedAt: '2026-10-07' }] };
  const moved = { ...context, unitsOf: () => [{ ...context.unitsOf()[0], ancestry: ['Examples'] }] };
  const result = rebindReviewedDecisions(moved, reviewed);
  assert.equal(result.shard.claims[0].reviewStatus, 'pending');
  assert.equal(result.shard.claims[0].reviewedBy, undefined);
  const missingContext = { ...reviewed, claims: [{ ...reviewed.claims[0], targetAncestry: undefined }] };
  assert.equal(rebindReviewedDecisions(context, missingContext).shard.claims[0].reviewStatus, 'pending');
});

test('coverage excludes canonical and non-authority items and a heading range covers only its rows', () => {
  const units = [
    { anchor: 'first', unitKind: 'heading', level: 2, startLine: 1, endLine: 1 },
    { anchor: 'first-body', unitKind: 'unheaded-block', startLine: 2, endLine: 3 },
    { anchor: 'second', unitKind: 'heading', level: 2, startLine: 4, endLine: 4 },
    { anchor: 'second-body', unitKind: 'unheaded-block', startLine: 5, endLine: 6 },
  ];
  const inventory = { ...context.inventory, items: [...context.inventory.items, { path: 'docs/user/guide.md', corpus: 'user-knowledge', authorityStatus: 'non-authority' }], claimLedger: units.map((unit, i) => ({ ...row, claimId: `claim_${String(i).padStart(32, '0')}`, sourceAnchor: unit.anchor, sourceLocation: { start: unit.startLine, end: unit.endLine } })) };
  const map = (cells) => '| Source file or heading range | Target |\n|---|---|\n' + cells.map((cell) => '| `' + cell + '` | candidate |').join('\n');
  const options = { unitsOf: () => units };
  const partial = coverageOfSources(inventory, [map([source + '#first', 'docs/platform/**', 'docs/user/**'])], [], options);
  assert.equal(partial.sourceFiles, 1);
  assert.deepEqual(partial.uncovered, [source]);
  assert.deepEqual(coverageOfSources(inventory, [map([source + '#first', source + '#second'])], [], options).uncovered, []);
  assert.deepEqual(coverageOfSources(inventory, [map([source + '#first..second'])], [], options).uncovered, []);
  assert.throws(() => coverageOfSources(inventory, [map([source + '#absent'])], [], options));
  const legend = '| Legend | Meaning |\n|---|---|\n| `' + source + '` | example only |';
  assert.deepEqual(coverageOfSources(inventory, [legend], [], options).uncovered, [source]);
});
