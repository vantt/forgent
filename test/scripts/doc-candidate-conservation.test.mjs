import test from 'node:test';
import assert from 'node:assert/strict';
import { checkConservation } from '../../scripts/check-doc-inventory-gates.mjs';

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
