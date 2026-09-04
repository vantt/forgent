import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateSourceCoverage,
  validateRequiredDisclosureCoverage,
  evaluateAggregationCoverage,
  validateDisclosureValueShapes,
  validateSourceRevisionCurrency,
  validateDissentSurfacing,
  classifyAggregationOutcome,
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

// === P07.2: outcome classification + adversarial fixtures ================
//
// Shared fixture shape used by every test below: one declared source
// operation ('op-research'), a matching source entry carrying
// {confidence, dissent} disclosures, a `dissentRefs[]` list, and a
// `currentRevisions` map keyed by artifactRef. Deterministic classification
// rule under test (documented in aggregation-evaluator.mjs's own
// `classifyAggregationOutcome` JSDoc): no-consensus on any coverage/
// disclosure-shape/revision-currency/hidden-dissent failure; qualified when
// everything else passes but a dissent ref is not yet resolved; consensus
// only when everything passes and no unresolved dissent remains.

const CURRENT_REVISIONS = { 'artifact://findings.md': 'rev_abc123' };

function classifyInput(overrides = {}) {
  return {
    sourceOperationRefs: ['op-research'],
    sources: [source()],
    requiredDisclosures: ['confidence', 'dissent'],
    dissentRefs: [],
    currentRevisions: CURRENT_REVISIONS,
    ...overrides,
  };
}

// --- malformed disclosure value shape (schema.mjs unit) -------------------

test('validateDisclosureValueShapes: accepts every disclosure value that is a non-empty string (positive)', () => {
  const result = validateDisclosureValueShapes([source()]);
  assert.equal(result.ok, true);
  assert.deepEqual(result.malformedDisclosuresBySource, {});
});

test('validateDisclosureValueShapes: rejects a non-string disclosure value (negative)', () => {
  const result = validateDisclosureValueShapes([source({ disclosures: { confidence: 42, dissent: 'none' } })]);
  assert.equal(result.ok, false);
  assert.deepEqual(result.malformedDisclosuresBySource['op-research:asg_001:run_001'], ['confidence']);
});

test('validateDisclosureValueShapes: rejects an empty-string disclosure value (negative)', () => {
  const result = validateDisclosureValueShapes([source({ disclosures: { confidence: '', dissent: 'none' } })]);
  assert.equal(result.ok, false);
});

// --- stale artifact-revision-provenance (aggregation-evaluator.mjs unit) --

test('validateSourceRevisionCurrency: accepts a source whose revision matches the current-revision map (positive)', () => {
  const result = validateSourceRevisionCurrency([source()], CURRENT_REVISIONS);
  assert.equal(result.ok, true);
  assert.deepEqual(result.staleSourceKeys, []);
});

test('validateSourceRevisionCurrency: rejects a source whose revision does not match the current-revision entry (negative)', () => {
  const result = validateSourceRevisionCurrency([source()], { 'artifact://findings.md': 'rev_NEWER' });
  assert.equal(result.ok, false);
  assert.deepEqual(result.staleSourceKeys, ['op-research:asg_001:run_001']);
});

test('validateSourceRevisionCurrency: fails closed when the artifact has no entry in currentRevisions at all (negative)', () => {
  const result = validateSourceRevisionCurrency([source()], {});
  assert.equal(result.ok, false);
  assert.deepEqual(result.staleSourceKeys, ['op-research:asg_001:run_001']);
});

// --- hidden-dissent surfacing (aggregation-evaluator.mjs unit) ------------

test('validateDissentSurfacing: a disclosed objection with a matching dissentRefs entry is surfaced, not hidden (positive)', () => {
  const result = validateDissentSurfacing(
    [source({ disclosures: { confidence: 'high', dissent: 'objection-scope' } })],
    [{ sourceOperationRef: 'op-research', resolved: false }],
  );
  assert.equal(result.ok, true);
  assert.deepEqual(result.hiddenDissentSourceRefs, []);
  assert.deepEqual(result.unresolvedDissentRefs, ['op-research']);
});

test('validateDissentSurfacing: a disclosed objection with no matching dissentRefs entry is reported as hidden dissent (negative)', () => {
  const result = validateDissentSurfacing(
    [source({ disclosures: { confidence: 'high', dissent: 'objection-scope' } })],
    [],
  );
  assert.equal(result.ok, false);
  assert.deepEqual(result.hiddenDissentSourceRefs, ['op-research']);
});

test('validateDissentSurfacing: a disclosed "none" dissent value never counts as hidden, even with no dissentRefs', () => {
  const result = validateDissentSurfacing([source()], []);
  assert.equal(result.ok, true);
  assert.deepEqual(result.hiddenDissentSourceRefs, []);
});

// --- classifyAggregationOutcome: one test per outcome, deterministic rule -

test('classifyAggregationOutcome: consensus when coverage/disclosures/revisions pass and no unresolved dissent remains', () => {
  const result = classifyAggregationOutcome(classifyInput());
  assert.equal(result.outcome, 'consensus');
  assert.equal(result.coverage.ok, true);
  assert.equal(result.disclosureShape.ok, true);
  assert.equal(result.revisionCurrency.ok, true);
  assert.equal(result.dissentSurfacing.ok, true);
});

test('classifyAggregationOutcome: qualified when dissent is honestly surfaced but not yet resolved', () => {
  const result = classifyAggregationOutcome(
    classifyInput({
      sources: [source({ disclosures: { confidence: 'high', dissent: 'objection-scope' } })],
      dissentRefs: [{ sourceOperationRef: 'op-research', resolved: false }],
    }),
  );
  assert.equal(result.outcome, 'qualified');
  assert.equal(result.dissentSurfacing.ok, true, 'dissent was surfaced, so this is not a hidden-dissent failure');
  assert.deepEqual(result.dissentSurfacing.unresolvedDissentRefs, ['op-research']);
});

test('classifyAggregationOutcome: no-consensus when source coverage fails (a declared source has no supplied source)', () => {
  const result = classifyAggregationOutcome(
    classifyInput({ sourceOperationRefs: ['op-research', 'op-review'] }),
  );
  assert.equal(result.outcome, 'no-consensus');
  assert.equal(result.coverage.ok, false);
});

// --- negative: hidden-dissent rejection ------------------------------------

test('classifyAggregationOutcome: rejects a would-be-consensus outcome when a disclosed objection is not surfaced in dissentRefs (hidden dissent)', () => {
  const result = classifyAggregationOutcome(
    classifyInput({
      sources: [source({ disclosures: { confidence: 'high', dissent: 'objection-scope' } })],
      dissentRefs: [], // the objection exists in disclosures but is quietly omitted here
    }),
  );
  assert.equal(result.outcome, 'no-consensus');
  assert.equal(result.dissentSurfacing.ok, false);
  assert.deepEqual(result.dissentSurfacing.hiddenDissentSourceRefs, ['op-research']);
});

// --- negative: stale artifact-revision-provenance rejection ---------------

test('classifyAggregationOutcome: rejects a would-be-consensus outcome when a source revision does not match the current-revision map', () => {
  const result = classifyAggregationOutcome(
    classifyInput({ currentRevisions: { 'artifact://findings.md': 'rev_NEWER' } }),
  );
  assert.equal(result.outcome, 'no-consensus');
  assert.equal(result.revisionCurrency.ok, false);
  assert.deepEqual(result.revisionCurrency.staleSourceKeys, ['op-research:asg_001:run_001']);
});

// --- negative: malformed disclosure rejection ------------------------------

test('classifyAggregationOutcome: rejects a would-be-consensus outcome when a disclosure value is malformed (not well-typed)', () => {
  const result = classifyAggregationOutcome(
    classifyInput({ sources: [source({ disclosures: { confidence: 42, dissent: 'none' } })] }),
  );
  assert.equal(result.outcome, 'no-consensus');
  assert.equal(result.disclosureShape.ok, false);
  assert.deepEqual(result.disclosureShape.malformedDisclosuresBySource['op-research:asg_001:run_001'], ['confidence']);
});

// --- negative: consensus never coexists with an unresolved dissent ref ----

test('classifyAggregationOutcome: never classifies as consensus while any dissentRefs entry remains unresolved, even with everything else passing', () => {
  const result = classifyAggregationOutcome(
    classifyInput({
      sources: [source({ disclosures: { confidence: 'high', dissent: 'objection-scope' } })],
      dissentRefs: [{ sourceOperationRef: 'op-research', resolved: false }],
    }),
  );
  assert.notEqual(result.outcome, 'consensus');
  assert.equal(result.outcome, 'qualified');
});

test('classifyAggregationOutcome: resolving the dissent ref (and only that) flips the same scenario to consensus', () => {
  const result = classifyAggregationOutcome(
    classifyInput({
      sources: [source({ disclosures: { confidence: 'high', dissent: 'objection-scope' } })],
      dissentRefs: [{ sourceOperationRef: 'op-research', resolved: true }],
    }),
  );
  assert.equal(result.outcome, 'consensus');
});

// --- result immutability + no input mutation (matches P07.1's own pattern) -

test('classifyAggregationOutcome: result is frozen at every level', () => {
  const result = classifyAggregationOutcome(classifyInput());
  assert.ok(Object.isFrozen(result));
  assert.ok(Object.isFrozen(result.disclosureShape));
  assert.ok(Object.isFrozen(result.revisionCurrency));
  assert.ok(Object.isFrozen(result.dissentSurfacing));
});

test('classifyAggregationOutcome: never mutates its sources/dissentRefs/currentRevisions inputs', () => {
  const input = deepFreeze({
    sourceOperationRefs: ['op-research'],
    sources: [source({ disclosures: { confidence: 'high', dissent: 'objection-scope' } })],
    requiredDisclosures: ['confidence', 'dissent'],
    dissentRefs: [{ sourceOperationRef: 'op-research', resolved: false }],
    currentRevisions: { 'artifact://findings.md': 'rev_abc123' },
  });
  const before = structuredClone(input);

  const result = classifyAggregationOutcome(input);

  assert.equal(result.outcome, 'qualified');
  assert.deepEqual(input, before);
});
