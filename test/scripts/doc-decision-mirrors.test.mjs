import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { applyDecisions, buildTargetAnchorLookup, buildTargetUnitDigestLookup, validateSemanticClaimOwners } from '../../scripts/check-doc-inventory-gates.mjs';
import { extractMixedFileConservationUnit } from '../../scripts/generate-doc-inventory.mjs';

const P = 'plans/260925-documentation-authority-unification';
const vocabulary = JSON.parse(fs.readFileSync(new URL(`../../${P}/claim-and-disposition-vocabulary.json`, import.meta.url), 'utf8'));
const source = 'docs/architect/example/verification/run/proof.json';
const target = 'docs/platform/example/verification/run/proof.json';
const blobSha = 'a'.repeat(40);
const digest = 'b'.repeat(64);
const claimId = `claim_${'c'.repeat(32)}`;
function fixture() {
  return {
    generatedAt: '2026-10-07T00:00:00Z',
    items: [
      { path: source, blobSha, authorityStatus: 'legacy-current', corpus: 'platform-authority', fileClass: 'maintained-authority' },
      { path: target, blobSha, authorityStatus: 'candidate', corpus: 'platform-authority', fileClass: 'history-evidence' },
    ],
    claimLedger: [
      { claimId, sourcePath: source, sourceAnchor: 'file-block', sourceUnitDigest: digest, claimKind: 'verification', disposition: 'unknown-blocking', reviewStatus: 'blocking', targetOwner: null },
      { claimId: `claim_${'d'.repeat(32)}`, sourcePath: target, sourceAnchor: 'file-block', sourceUnitDigest: digest, claimKind: 'verification', disposition: 'unknown-blocking', reviewStatus: 'blocking', targetOwner: null },
    ],
  };
}
const shard = (mirrors = [{ path: source, target, blobSha }], extra = {}) => ({ version: 1, shard: 'mirrors', sources: [source], claims: [], mirrors, ...extra });
const run = (shards, inventory = fixture()) => applyDecisions(inventory, shards, { vocabulary, targetAnchorsOf: () => new Set(['file-block']), targetUnitDigestOf: () => digest });

test('a byte-identical evidence mirror carries all source units to the verified copy and decides its file', () => {
  const inventory = fixture();
  const before = JSON.stringify(inventory);
  const result = run([shard()], inventory);
  assert.deepEqual(result.findings, []);
  const row = result.inventory.claimLedger[0];
  assert.equal(row.disposition, 'delete-as-duplicate');
  assert.equal(row.targetOwner, target);
  assert.equal(row.targetAnchor, 'file-block');
  assert.equal(row.reviewStatus, 'reviewed');
  assert.equal(row.authoredBy, 'script:propose-doc-decisions');
  assert.equal(row.reviewedBy, 'script:check-doc-inventory-gates');
  assert.equal(row.targetUnitDigest, digest);
  assert.equal(result.inventory.items[0].proposedDisposition, 'delete-as-duplicate');
  assert.equal(result.inventory.items[0].proposedTargetOwner, target);
  assert.equal(result.inventory.claimLedger[1].reviewStatus, 'blocking');
  assert.equal(JSON.stringify(inventory), before);
});

test('mirror proof rejects changed blobs, unpinned blobs, non-evidence sources and missing targets', () => {
  const changed = fixture();
  changed.items[1].blobSha = 'e'.repeat(40);
  assert.equal(run([shard()], changed).findings.some((f) => f.type === 'decision-mirror-invalid'), true);
  for (const mirror of [
    { path: source, target, blobSha: 'e'.repeat(40) },
    { path: source, target, blobSha: 'a'.repeat(16) },
    { path: source, target: 'docs/platform/example/verification/run/missing.json', blobSha },
    { path: target, target: source, blobSha },
    { path: 'docs/specs/example.md', target, blobSha },
  ]) assert.equal(run([shard([mirror])]).findings.some((f) => f.type === 'decision-mirror-invalid'), true);
  assert.equal(run([shard(undefined, { sources: [] })]).findings.some((f) => f.type === 'decision-mirror-invalid'), true);
});

test('mirror and manual decisions cannot decide the same claim or file twice', () => {
  const manual = { claimId, sourceUnitDigest: digest, targetOwner: target, targetAnchor: 'file-block', claimKind: 'verification', disposition: 'move', reviewStatus: 'pending', rationale: 'The verified target carries the entire proof.' };
  const duplicate = run([shard(), shard([], { shard: 'manual', claims: [manual] })]);
  assert.equal(duplicate.findings.some((f) => f.type === 'decision-claim-duplicate'), true);
  const repeated = run([shard(), shard(undefined, { shard: 'again' })]);
  assert.equal(repeated.findings.some((f) => f.type === 'decision-file-duplicate'), true);
});

test('mixed-file target anchors and digests are proven from the committed bytes, not the working tree', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mirror-proof-'));
  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  try {
    git('init'); git('config', 'user.email', 'test@example.test'); git('config', 'user.name', 'Test');
    fs.mkdirSync(path.dirname(path.join(root, target)), { recursive: true });
    const bytes = '{"result":"accepted"}\n';
    fs.writeFileSync(path.join(root, target), bytes);
    git('add', '--', target); git('commit', '-m', 'proof');
    const commit = git('rev-parse', 'HEAD');
    fs.writeFileSync(path.join(root, target), '{"result":"changed"}\n');
    assert.equal(buildTargetAnchorLookup(root, commit)(target).has('file-block'), true);
    assert.equal(buildTargetUnitDigestLookup(root, commit)(target, 'file-block'), extractMixedFileConservationUnit(target, bytes)[0].textDigest);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('a canonical duplicate group with two source copies and two platform copies has one owner', () => {
  const firstOwner = 'docs/platform/example/contracts/first.md';
  const secondOwner = 'docs/platform/example/contracts/second.md';
  const rows = ['docs/architect/example/contracts/first.md', 'docs/architect/example/contracts/second.md', firstOwner, secondOwner].map((sourcePath) => ({ sourcePath, semanticClaimId: 'shared-contract', targetOwner: firstOwner }));
  assert.deepEqual(validateSemanticClaimOwners(rows), []);
  rows[1].targetOwner = secondOwner;
  assert.equal(validateSemanticClaimOwners(rows).some((f) => f.type === 'semantic-claim-multiple-owners'), true);
});
