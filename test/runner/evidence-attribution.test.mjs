import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ATTRIBUTION_LEVELS,
  POLICY_DISPOSITIONS,
  attributeWorkspaceChanges,
  attributeClaimEvidenceRefs,
  evaluateAttributionPolicy,
} from '../../src/runner/dispatch/evidence-attribution.mjs';

test('attribution levels and policy dispositions vocabulary is frozen and closed', () => {
  assert.deepEqual(ATTRIBUTION_LEVELS, ['proven', 'correlated', 'excluded', 'unattributed']);
  assert.deepEqual(POLICY_DISPOSITIONS, ['allow', 'refuse', 'needs-input', 'not-applicable']);
});

test('attributeWorkspaceChanges: pre-existing dirt with matching hash is excluded', () => {
  const records = attributeWorkspaceChanges({
    preLaunchDirt: ['docs/existing.md'],
    postRunDirt: ['docs/existing.md'],
    dirtyBeforeHashes: { 'docs/existing.md': 'hash123' },
    postRunHashes: { 'docs/existing.md': 'hash123' },
  });

  assert.equal(records.length, 1);
  assert.equal(records[0].path, 'docs/existing.md');
  assert.equal(records[0].level, 'excluded');
  assert.ok(records[0].basis.includes('dirty-before-hash-match'));
});

test('attributeWorkspaceChanges: post-run dirt without positive observer is at most correlated', () => {
  const records = attributeWorkspaceChanges({
    preLaunchDirt: [],
    postRunDirt: ['src/new-file.mjs'],
    dirtyBeforeHashes: {},
    postRunHashes: { 'src/new-file.mjs': 'hash456' },
  });

  assert.equal(records.length, 1);
  assert.equal(records[0].path, 'src/new-file.mjs');
  assert.equal(records[0].level, 'correlated');
  assert.ok(records[0].basis.includes('pre-post-git-snapshot'));
});

test('attributeWorkspaceChanges: positive attestation inside declared coverage is proven', () => {
  const records = attributeWorkspaceChanges({
    preLaunchDirt: [],
    postRunDirt: ['src/covered-file.mjs'],
    dirtyBeforeHashes: {},
    postRunHashes: { 'src/covered-file.mjs': 'hash789' },
    declaredCoverage: { paths: ['src/'] },
    adapterAttestation: { writtenPaths: ['src/covered-file.mjs'] },
  });

  assert.equal(records.length, 1);
  assert.equal(records[0].path, 'src/covered-file.mjs');
  assert.equal(records[0].level, 'proven');
  assert.ok(records[0].basis.includes('adapter-confinement-attestation'));
});

test('attributeWorkspaceChanges: positive attestation outside declared coverage is not proven (at most correlated)', () => {
  const records = attributeWorkspaceChanges({
    preLaunchDirt: [],
    postRunDirt: ['outside/file.mjs'],
    dirtyBeforeHashes: {},
    postRunHashes: { 'outside/file.mjs': 'hash999' },
    declaredCoverage: { paths: ['src/'] },
    adapterAttestation: { writtenPaths: ['outside/file.mjs'] },
  });

  assert.equal(records.length, 1);
  assert.equal(records[0].path, 'outside/file.mjs');
  assert.equal(records[0].level, 'correlated');
});

test('attributeClaimEvidenceRefs: worker claim evidenceRefs are untrusted and default to correlated', () => {
  const refs = attributeClaimEvidenceRefs({
    status: 'done',
    summary: 'Claim with refs',
    evidenceRefs: ['diff:candidate.patch', 'verify:test.log'],
  });

  assert.equal(refs.length, 2);
  assert.equal(refs[0].level, 'correlated');
  assert.equal(refs[1].level, 'correlated');
  assert.ok(refs[0].basis.includes('worker-claim-ref'));
});

test('evaluateAttributionPolicy: allows safe execution within write scope', () => {
  const policy = evaluateAttributionPolicy({
    attributions: [
      { path: 'src/file.mjs', level: 'proven', firstObserved: 'post-run' },
    ],
    isReadOnly: false,
    writeScope: ['src/'],
    mutatedDirtyBeforeFiles: [],
  });

  assert.equal(policy.disposition, 'allow');
  assert.equal(policy.code, null);
});

test('evaluateAttributionPolicy: refuses when pre-existing dirty files are mutated', () => {
  const policy = evaluateAttributionPolicy({
    attributions: [
      { path: 'docs/dirty.md', level: 'correlated', firstObserved: 'pre-launch' },
    ],
    isReadOnly: false,
    mutatedDirtyBeforeFiles: ['docs/dirty.md'],
  });

  assert.equal(policy.disposition, 'refuse');
  assert.equal(policy.code, 'mutated-dirty-before-files');
});

test('evaluateAttributionPolicy: refuses when read-only operation mutates workspace files', () => {
  const policy = evaluateAttributionPolicy({
    attributions: [
      { path: 'src/mutated.mjs', level: 'correlated', firstObserved: 'post-run' },
    ],
    isReadOnly: true,
  });

  assert.equal(policy.disposition, 'refuse');
  assert.equal(policy.code, 'read-only-mutation');
});

test('evaluateAttributionPolicy: refuses when changes occur outside declared write scope', () => {
  const policy = evaluateAttributionPolicy({
    attributions: [
      { path: 'docs/outside.md', level: 'correlated', firstObserved: 'post-run' },
    ],
    isReadOnly: false,
    writeScope: ['src/'],
  });

  assert.equal(policy.disposition, 'refuse');
  assert.equal(policy.code, 'outside-workspace-change-correlated');
});

test('evaluateAttributionPolicy: refuses contradictory worker claim while keeping input evidence', () => {
  const policy = evaluateAttributionPolicy({
    attributions: [],
    isReadOnly: false,
    contradictoryClaim: true,
  });

  assert.equal(policy.disposition, 'refuse');
  assert.equal(policy.code, 'contradictory-worker-claim');
});
