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

// A before/after snapshot shows what changed, never who changed it: every
// finding it supports is reported as a warning and the round is accepted. Only
// a write proven to belong to the run (a run-bound observer's attestation,
// within its coverage) is refused.

test('evaluateAttributionPolicy: a mutated pre-existing dirty file is a warning, not a refusal', () => {
  const policy = evaluateAttributionPolicy({
    attributions: [
      { path: 'docs/dirty.md', level: 'correlated', firstObserved: 'pre-launch' },
    ],
    isReadOnly: true,
    mutatedDirtyBeforeFiles: ['docs/dirty.md'],
  });

  assert.equal(policy.disposition, 'allow');
  assert.equal(policy.code, null);
  assert.deepEqual(policy.warnings, [
    { code: 'mutated-dirty-before-correlated', level: 'correlated', basis: ['dirty-before-hash-changed'], paths: ['docs/dirty.md'] },
  ]);
});

test('evaluateAttributionPolicy: a correlated change under a read-only operation is a warning, not a refusal', () => {
  const policy = evaluateAttributionPolicy({
    attributions: [
      { path: 'src/mutated.mjs', level: 'correlated', firstObserved: 'post-run' },
    ],
    isReadOnly: true,
  });

  assert.equal(policy.disposition, 'allow');
  assert.deepEqual(policy.warnings, [
    { code: 'read-only-mutation-correlated', level: 'correlated', basis: ['pre-post-git-snapshot'], paths: ['src/mutated.mjs'] },
  ]);
});

test('evaluateAttributionPolicy: a proven write under a read-only operation is refused', () => {
  const policy = evaluateAttributionPolicy({
    attributions: [
      { path: 'src/mutated.mjs', level: 'proven', firstObserved: 'post-run' },
      { path: 'docs/bystander.md', level: 'correlated', firstObserved: 'post-run' },
    ],
    isReadOnly: true,
  });

  assert.equal(policy.disposition, 'refuse');
  assert.equal(policy.code, 'read-only-mutation');
  assert.match(policy.reason, /src\/mutated\.mjs/);
  assert.doesNotMatch(policy.reason, /bystander/);
});

test('evaluateAttributionPolicy: a correlated change outside the declared write scope is a warning', () => {
  const policy = evaluateAttributionPolicy({
    attributions: [
      { path: 'docs/outside.md', level: 'correlated', firstObserved: 'post-run' },
    ],
    isReadOnly: false,
    writeScope: ['src/'],
  });

  assert.equal(policy.disposition, 'allow');
  assert.deepEqual(policy.warnings.map((w) => [w.code, w.paths]), [['outside-write-scope-correlated', ['docs/outside.md']]]);
});

test('evaluateAttributionPolicy: a proven write outside the declared write scope is refused', () => {
  const policy = evaluateAttributionPolicy({
    attributions: [
      { path: 'docs/outside.md', level: 'proven', firstObserved: 'post-run' },
    ],
    isReadOnly: false,
    writeScope: ['src/'],
  });

  assert.equal(policy.disposition, 'refuse');
  assert.equal(policy.code, 'outside-write-scope');
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

// Coverage and the policy's scope read a declared scope through the one shared matcher: a file,
// a directory, a glob, and any spelling of the same entry are one scope.
test('attributeWorkspaceChanges: coverage reads declared writes through the shared matcher', () => {
  const coverage = (paths, file) => attributeWorkspaceChanges({ postRunDirt: [file], declaredCoverage: { paths } })[0].coverageMatched;
  assert.equal(coverage(['docs/a.md'], 'docs/a.md'), true);
  assert.equal(coverage(['docs'], 'docs/guide/a.md'), true);
  assert.equal(coverage(['./docs'], 'docs/a.md'), true);
  assert.equal(coverage(['docs//'], 'docs/a.md'), true);
  assert.equal(coverage(['src/**/*.mjs'], 'src/runner/x.mjs'), true);
  assert.equal(coverage(['*.md'], 'README.md'), true);
  assert.equal(coverage(['docs'], 'docs-old/a.md'), false);
  assert.equal(coverage(['src/**/*.mjs'], 'src/runner/x.json'), false);
  assert.equal(coverage(['**'], '.fgos/state.json'), false);
  assert.equal(coverage([], 'docs/a.md'), false);
});

test('evaluateAttributionPolicy: no outside-scope warning for a file inside a glob, a ./ entry or a directory entry', () => {
  const warn = (writeScope, files) => evaluateAttributionPolicy({
    attributions: files.map((p) => ({ path: p, level: 'correlated', firstObserved: 'post-run' })),
    writeScope,
  }).warnings.filter((w) => w.code === 'outside-write-scope-correlated').flatMap((w) => w.paths);
  assert.deepEqual(warn(['./docs'], ['docs/a.md']), []);
  assert.deepEqual(warn(['src/**/*.mjs'], ['src/runner/x.mjs', 'src/runner/x.json']), ['src/runner/x.json']);
  assert.deepEqual(warn(['docs/a.md', 'plans/*/reports/**'], ['plans/p1/reports/r.md', 'docs/b.md']), ['docs/b.md']);
});

test('evaluateAttributionPolicy: a proven write inside a glob scope is allowed, outside it refused', () => {
  const policy = (p) => evaluateAttributionPolicy({ attributions: [{ path: p, level: 'proven', firstObserved: 'post-run' }], writeScope: ['src/**/*.mjs'] });
  assert.equal(policy('src/a/b.mjs').disposition, 'allow');
  assert.equal(policy('src/a/b.json').code, 'outside-write-scope');
});
