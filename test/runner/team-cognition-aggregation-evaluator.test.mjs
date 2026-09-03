import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateSourceCoverage,
  validateRequiredDisclosureCoverage,
  evaluateAggregationCoverage,
} from '../../src/runner/team-cognition/aggregation-evaluator.mjs';
import { AggregationError } from '../../src/runner/team-cognition/schema.mjs';

function source(overrides = {}) {
  return {
    sourceOperationRef: 'op-research',
    assignmentId: 'asg_001',
    runId: 'run_001',
    artifactRef: 'artifact://findings.md',
    revision: 'rev_abc123',
    disclosures: { confidence: 'high', dissent: 'none' },
    ...overrides,
  };
}

// --- structured source coverage: positive -------------------------------

test('validateSourceCoverage: every declared source operation resolves to a supplied source (positive)', () => {
  const result = validateSourceCoverage(
    ['op-research', 'op-review'],
    [source(), source({ sourceOperationRef: 'op-review', assignmentId: 'asg_002', runId: 'run_002' })],
  );
  assert.equal(result.ok, true);
  assert.deepEqual(result.missingSourceOperationRefs, []);
  assert.deepEqual(result.unresolvedSourceRefs, []);
  assert.equal(result.bySourceOperationRef.get('op-research').length, 1);
});

// --- structured source coverage: negative -------------------------------

test('validateSourceCoverage: a source ref that does not resolve to a declared operation is reported unresolved (negative)', () => {
  const result = validateSourceCoverage(
    ['op-research'],
    [source(), source({ sourceOperationRef: 'op-not-declared', assignmentId: 'asg_003', runId: 'run_003' })],
  );
  assert.equal(result.ok, false);
  assert.deepEqual(result.unresolvedSourceRefs, ['op-not-declared']);
  assert.deepEqual(result.missingSourceOperationRefs, []);
});

test('validateSourceCoverage: a declared source operation with no supplied source is reported missing (negative)', () => {
  const result = validateSourceCoverage(['op-research', 'op-review'], [source()]);
  assert.equal(result.ok, false);
  assert.deepEqual(result.missingSourceOperationRefs, ['op-review']);
});

// --- required disclosures: positive -------------------------------------

test('validateRequiredDisclosureCoverage: every source carries every required disclosure (positive)', () => {
  const result = validateRequiredDisclosureCoverage([source()], ['confidence', 'dissent']);
  assert.equal(result.ok, true);
  assert.deepEqual(result.missingDisclosuresBySource, {});
});

// --- required disclosures: negative --------------------------------------

test('validateRequiredDisclosureCoverage: a missing required disclosure fails validation (negative)', () => {
  const result = validateRequiredDisclosureCoverage([source({ disclosures: { confidence: 'high' } })], ['confidence', 'dissent']);
  assert.equal(result.ok, false);
  const key = 'op-research:asg_001:run_001';
  assert.deepEqual(result.missingDisclosuresBySource[key], ['dissent']);
});

test('validateRequiredDisclosureCoverage: a disclosure explicitly set to null counts as missing', () => {
  const result = validateRequiredDisclosureCoverage([source({ disclosures: { confidence: 'high', dissent: null } })], ['confidence', 'dissent']);
  assert.equal(result.ok, false);
});

// --- combined evaluator entry point --------------------------------------

test('evaluateAggregationCoverage: ok=true when source coverage and disclosures both pass', () => {
  const result = evaluateAggregationCoverage({
    sourceOperationRefs: ['op-research', 'op-review'],
    sources: [source(), source({ sourceOperationRef: 'op-review', assignmentId: 'asg_002', runId: 'run_002' })],
    requiredDisclosures: ['confidence', 'dissent'],
  });
  assert.equal(result.ok, true);
  assert.equal(result.sourceCoverage.ok, true);
  assert.equal(result.disclosureCoverage.ok, true);
});

test('evaluateAggregationCoverage: ok=false when a required disclosure is missing, even with full source coverage', () => {
  const result = evaluateAggregationCoverage({
    sourceOperationRefs: ['op-research'],
    sources: [source({ disclosures: { confidence: 'high' } })],
    requiredDisclosures: ['confidence', 'dissent'],
  });
  assert.equal(result.ok, false);
  assert.equal(result.sourceCoverage.ok, true);
  assert.equal(result.disclosureCoverage.ok, false);
});

test('evaluateAggregationCoverage: ok=false when a source ref does not resolve, even with all disclosures present', () => {
  const result = evaluateAggregationCoverage({
    sourceOperationRefs: ['op-research'],
    sources: [source({ sourceOperationRef: 'op-unclaimed' })],
    requiredDisclosures: ['confidence'],
  });
  assert.equal(result.ok, false);
  assert.equal(result.sourceCoverage.ok, false);
  assert.deepEqual(result.sourceCoverage.unresolvedSourceRefs, ['op-unclaimed']);
});

test('evaluateAggregationCoverage: result is frozen (evaluator never hands back a mutable verdict)', () => {
  const result = evaluateAggregationCoverage({
    sourceOperationRefs: ['op-research'],
    sources: [source()],
    requiredDisclosures: ['confidence'],
  });
  assert.ok(Object.isFrozen(result));
  assert.ok(Object.isFrozen(result.sourceCoverage));
  assert.ok(Object.isFrozen(result.disclosureCoverage));
});

test('evaluateAggregationCoverage: nested missingDisclosuresBySource array is frozen too, not just the outer object', () => {
  const result = evaluateAggregationCoverage({
    sourceOperationRefs: ['op-research'],
    sources: [source({ disclosures: { confidence: 'high' } })],
    requiredDisclosures: ['confidence', 'dissent'],
  });
  const key = 'op-research:asg_001:run_001';
  const missing = result.disclosureCoverage.missingDisclosuresBySource[key];
  assert.deepEqual(missing, ['dissent']);
  assert.ok(Object.isFrozen(missing), 'nested array must be frozen');
  assert.throws(() => missing.push('mutated'), TypeError);
});

test('validateSourceCoverage: result and every nested value (arrays, Map) are frozen/mutator-blocked', () => {
  const result = validateSourceCoverage(['op-research'], [source()]);

  assert.ok(Object.isFrozen(result), 'top-level result must be frozen');
  assert.ok(Object.isFrozen(result.missingSourceOperationRefs), 'missingSourceOperationRefs must be frozen');
  assert.ok(Object.isFrozen(result.unresolvedSourceRefs), 'unresolvedSourceRefs must be frozen');
  assert.throws(() => { result.ok = 'CORRUPTED'; }, TypeError);
  assert.throws(() => result.missingSourceOperationRefs.push('x'), TypeError);

  const entries = result.bySourceOperationRef.get('op-research');
  assert.ok(Object.isFrozen(entries), 'bySourceOperationRef array values must be frozen');
  assert.throws(() => entries.push('mutated'), TypeError, 'pushing into a bySourceOperationRef array value must throw');
  assert.throws(() => result.bySourceOperationRef.set('op-other', []), TypeError, 'bySourceOperationRef.set must throw');
  assert.throws(() => result.bySourceOperationRef.delete('op-research'), TypeError, 'bySourceOperationRef.delete must throw');
  assert.throws(() => result.bySourceOperationRef.clear(), TypeError, 'bySourceOperationRef.clear must throw');
  // reads still work through the immutable view
  assert.equal(result.bySourceOperationRef.size, 1);
  assert.equal(result.bySourceOperationRef.get('op-research').length, 1);
});

test('validateSourceCoverage: bySourceOperationRef holds deep-frozen snapshots, not the caller\'s live source objects (red-team recheck repro)', () => {
  const original = source({ revision: 'rev_abc123', disclosures: { confidence: 'high' } });
  const sources = [original];
  const result = validateSourceCoverage(['op-research'], sources);
  const entry = result.bySourceOperationRef.get('op-research')[0];

  assert.ok(Object.isFrozen(entry), 'source entry inside bySourceOperationRef must be frozen');
  assert.ok(Object.isFrozen(entry.disclosures), 'nested disclosures object inside a bySourceOperationRef entry must be frozen');

  // revision is schema.mjs's own immutability pin -- the exact field this
  // freeze exists to protect (red-team's exact tamper repro).
  assert.throws(() => { entry.revision = 'TAMPERED-REVISION'; }, TypeError, 'reassigning revision on a bySourceOperationRef entry must throw');
  assert.throws(() => { entry.disclosures.confidence = 'TAMPERED-DISCLOSURE'; }, TypeError, 'reassigning a disclosure value on a bySourceOperationRef entry must throw');

  assert.equal(entry.revision, 'rev_abc123');
  assert.equal(entry.disclosures.confidence, 'high');

  // the caller's own input object must be completely untouched -- freezing
  // it in place would itself be an input mutation, not just a defensive copy.
  assert.equal(original.revision, 'rev_abc123');
  assert.equal(original.disclosures.confidence, 'high');
  assert.ok(!Object.isFrozen(original), "the caller's own source object must not be frozen by this call");
  assert.ok(!Object.isFrozen(original.disclosures), "the caller's own disclosures object must not be frozen by this call");
  original.revision = 'still-mutable-by-its-owner';
  assert.equal(original.revision, 'still-mutable-by-its-owner');
});

test('validateRequiredDisclosureCoverage: result and nested missingDisclosuresBySource arrays are frozen', () => {
  const result = validateRequiredDisclosureCoverage([source({ disclosures: { confidence: 'high' } })], ['confidence', 'dissent']);

  assert.ok(Object.isFrozen(result), 'top-level result must be frozen');
  assert.throws(() => { result.ok = 'CORRUPTED'; }, TypeError);
  assert.ok(Object.isFrozen(result.missingDisclosuresBySource), 'missingDisclosuresBySource object must be frozen');

  const key = 'op-research:asg_001:run_001';
  const missing = result.missingDisclosuresBySource[key];
  assert.ok(Object.isFrozen(missing), 'per-source missing-disclosures array must be frozen');
  assert.throws(() => missing.push('mutated'), TypeError);
});

test('evaluateAggregationCoverage: throws AggregationError on malformed input shape rather than misclassifying it as a coverage gap', () => {
  assert.throws(
    () => evaluateAggregationCoverage({ sourceOperationRefs: [], sources: [], requiredDisclosures: ['confidence'] }),
    (err) => err instanceof AggregationError,
  );
});

// --- Bug Taxonomy: "evaluator silently mutating an artifact ref or RunResult" ---

function deepFreeze(value) {
  if (value === null || typeof value !== 'object') return value;
  for (const key of Object.keys(value)) deepFreeze(value[key]);
  return Object.freeze(value);
}

test('evaluateAggregationCoverage: never mutates its sources/sourceOperationRefs/requiredDisclosures inputs', () => {
  const sourceOperationRefs = deepFreeze(['op-research', 'op-review']);
  const sources = deepFreeze([
    source(),
    source({ sourceOperationRef: 'op-review', assignmentId: 'asg_002', runId: 'run_002', disclosures: { confidence: 'high' } }),
  ]);
  const requiredDisclosures = deepFreeze(['confidence', 'dissent']);

  const before = structuredClone({ sourceOperationRefs, sources, requiredDisclosures });

  // Deep-frozen inputs: any attempted write anywhere in these structures
  // (a rewritten field, a pushed array entry, an altered disclosure value)
  // would throw TypeError in this module's strict-mode code, not silently
  // succeed -- so a successful call is itself proof of non-mutation.
  const result = evaluateAggregationCoverage({ sourceOperationRefs, sources, requiredDisclosures });

  assert.equal(result.ok, false); // op-review's source is missing the 'dissent' disclosure
  assert.deepEqual(sourceOperationRefs, before.sourceOperationRefs);
  assert.deepEqual(sources, before.sources);
  assert.deepEqual(requiredDisclosures, before.requiredDisclosures);
});

test('validateSourceCoverage and validateRequiredDisclosureCoverage never mutate their inputs', () => {
  const sourceOperationRefs = deepFreeze(['op-research']);
  const sources = deepFreeze([source()]);
  const requiredDisclosures = deepFreeze(['confidence', 'dissent']);
  const before = structuredClone({ sourceOperationRefs, sources, requiredDisclosures });

  validateSourceCoverage(sourceOperationRefs, sources);
  validateRequiredDisclosureCoverage(sources, requiredDisclosures);

  assert.deepEqual(sourceOperationRefs, before.sourceOperationRefs);
  assert.deepEqual(sources, before.sources);
  assert.deepEqual(requiredDisclosures, before.requiredDisclosures);
});
