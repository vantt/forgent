import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  AggregationError,
  validateAggregationSource,
  validateSourceOperationRefs,
  validateSources,
  validateRequiredDisclosures,
  validateDissentRef,
  validateDissentRefs,
  validateCurrentRevisions,
} from '../../src/runner/team-cognition/schema.mjs';

function baseSource(overrides = {}) {
  return {
    sourceOperationRef: 'op-research',
    assignmentId: 'asg_001',
    runId: 'run_001',
    artifactRef: 'artifact://findings.md',
    revision: 'rev_abc123',
    disclosures: { confidence: 'high' },
    ...overrides,
  };
}

test('validateAggregationSource accepts a well-formed source entry', () => {
  assert.doesNotThrow(() => validateAggregationSource(baseSource(), 0));
});

test('validateAggregationSource rejects an unknown field (whitelist)', () => {
  assert.throws(
    () => validateAggregationSource(baseSource({ extraField: 'nope' }), 0),
    (err) => err instanceof AggregationError && /unknown field "extraField"/.test(err.message),
  );
});

test('validateAggregationSource rejects a missing revision (immutability pin required)', () => {
  const source = baseSource();
  delete source.revision;
  assert.throws(
    () => validateAggregationSource(source, 0),
    (err) => err instanceof AggregationError && /revision must be a non-empty string/.test(err.message),
  );
});

test('validateAggregationSource rejects a non-object disclosures field', () => {
  assert.throws(
    () => validateAggregationSource(baseSource({ disclosures: 'not-an-object' }), 0),
    (err) => err instanceof AggregationError && /disclosures must be an object/.test(err.message),
  );
});

test('validateAggregationSource rejects a non-object entry', () => {
  assert.throws(
    () => validateAggregationSource('nope', 0),
    (err) => err instanceof AggregationError && /must be a non-null object/.test(err.message),
  );
});

test('validateSourceOperationRefs accepts a non-empty array of unique strings', () => {
  assert.doesNotThrow(() => validateSourceOperationRefs(['op-a', 'op-b']));
});

test('validateSourceOperationRefs rejects an empty array', () => {
  assert.throws(
    () => validateSourceOperationRefs([]),
    (err) => err instanceof AggregationError && /non-empty array/.test(err.message),
  );
});

test('validateSourceOperationRefs rejects a duplicate entry', () => {
  assert.throws(
    () => validateSourceOperationRefs(['op-a', 'op-a']),
    (err) => err instanceof AggregationError && /duplicate entry "op-a"/.test(err.message),
  );
});

test('validateSources accepts an array of well-formed entries', () => {
  assert.doesNotThrow(() => validateSources([baseSource(), baseSource({ sourceOperationRef: 'op-review' })]));
});

test('validateSources rejects a non-array', () => {
  assert.throws(
    () => validateSources({}),
    (err) => err instanceof AggregationError && /sources must be an array/.test(err.message),
  );
});

test('validateRequiredDisclosures accepts a non-empty array of strings', () => {
  assert.doesNotThrow(() => validateRequiredDisclosures(['confidence']));
});

test('validateRequiredDisclosures rejects an empty array', () => {
  assert.throws(
    () => validateRequiredDisclosures([]),
    (err) => err instanceof AggregationError && /non-empty array/.test(err.message),
  );
});

// --- dissentRefs (P07.2) --------------------------------------------------

test('validateDissentRef accepts a well-formed entry', () => {
  assert.doesNotThrow(() => validateDissentRef({ sourceOperationRef: 'op-research', resolved: false }, 0));
});

test('validateDissentRef rejects an unknown field (whitelist)', () => {
  assert.throws(
    () => validateDissentRef({ sourceOperationRef: 'op-research', resolved: false, weight: 1 }, 0),
    (err) => err instanceof AggregationError && /unknown field "weight"/.test(err.message),
  );
});

test('validateDissentRef rejects a non-boolean resolved field', () => {
  assert.throws(
    () => validateDissentRef({ sourceOperationRef: 'op-research', resolved: 'yes' }, 0),
    (err) => err instanceof AggregationError && /resolved must be a boolean/.test(err.message),
  );
});

test('validateDissentRefs accepts an empty array (no disclosed dissent)', () => {
  assert.doesNotThrow(() => validateDissentRefs([]));
});

test('validateDissentRefs rejects a non-array', () => {
  assert.throws(
    () => validateDissentRefs({}),
    (err) => err instanceof AggregationError && /dissentRefs must be an array/.test(err.message),
  );
});

// --- currentRevisions (P07.2) --------------------------------------------

test('validateCurrentRevisions accepts a well-formed map', () => {
  assert.doesNotThrow(() => validateCurrentRevisions({ 'artifact://findings.md': 'rev_abc123' }));
});

test('validateCurrentRevisions accepts an empty map', () => {
  assert.doesNotThrow(() => validateCurrentRevisions({}));
});

test('validateCurrentRevisions rejects a non-object', () => {
  assert.throws(
    () => validateCurrentRevisions(null),
    (err) => err instanceof AggregationError && /currentRevisions must be a non-null object/.test(err.message),
  );
});

test('validateCurrentRevisions rejects a non-string revision value', () => {
  assert.throws(
    () => validateCurrentRevisions({ 'artifact://findings.md': 123 }),
    (err) => err instanceof AggregationError && /must be a non-empty string/.test(err.message),
  );
});
