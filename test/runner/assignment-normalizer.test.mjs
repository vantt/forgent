import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  READ_ONLY_ROLES,
  KNOWN_MUTATING_OPS,
  READ_ONLY_OPS,
  NORMALIZER_VERSION,
  stampDeclaredAssignment,
  stampInlineAssignment,
} from '../../src/runner/dispatch/assignment-normalizer.mjs';
import { RunnerConfigError } from '../../src/runner/dispatch/config.mjs';

test('NORMALIZER_VERSION is a non-empty string', () => {
  assert.equal(typeof NORMALIZER_VERSION, 'string');
  assert.ok(NORMALIZER_VERSION.length > 0);
});

test('READ_ONLY_ROLES/KNOWN_MUTATING_OPS/READ_ONLY_OPS are the single source of truth for the declared mapping', () => {
  assert.deepEqual([...READ_ONLY_ROLES].sort(), ['advisor', 'researcher', 'reviewer']);
  assert.deepEqual([...KNOWN_MUTATING_OPS].sort(), ['fix-verify-red', 'implement-item', 'scoped-subtask']);
  assert.deepEqual(
    [...READ_ONLY_OPS].sort(),
    ['compound-learn', 'judge-ambiguity', 'lock-decisions', 'resolve-question', 'scout-blast-radius', 'shape-plan', 'validate-plan'],
  );
});

test('stampDeclaredAssignment matches the lifted evidence-requirement table exactly for each explicitly named operation', () => {
  const cases = [
    { role: 'reviewer', operation: 'validate-plan', mutation: 'read-only', evidenceRequired: 'reported', resultKind: 'gate-verdict', onAdvance: 'derive-plan-verdict-from-plan-md' },
    { role: 'reviewer', operation: 'review-item', mutation: 'read-only', evidenceRequired: 'reported', resultKind: 'review-verdict' },
    { role: 'researcher', operation: 'scout-blast-radius', mutation: 'read-only', evidenceRequired: 'reported', resultKind: 'advisory' },
    { role: 'helper', operation: 'scoped-subtask', mutation: 'mutating', evidenceRequired: 'verified', resultKind: 'work-product' },
    { role: 'implementer', operation: 'implement-item', mutation: 'mutating', evidenceRequired: 'verified', resultKind: 'work-product' },
    { role: 'implementer', operation: 'fix-verify-red', mutation: 'mutating', evidenceRequired: 'verified', resultKind: 'work-product' },
  ];

  for (const { role, operation, mutation, evidenceRequired, resultKind, onAdvance } of cases) {
    const stamped = stampDeclaredAssignment({ role, operation });
    assert.equal(stamped.mutation, mutation, `${operation} mutation`);
    assert.equal(stamped.evidence.required, evidenceRequired, `${operation} evidence.required`);
    assert.equal(stamped.resultKind, resultKind, `${operation} resultKind`);
    if (onAdvance) {
      assert.equal(stamped.onAdvance, onAdvance, `${operation} onAdvance`);
    } else {
      assert.equal(stamped.onAdvance, undefined, `${operation} onAdvance should be absent`);
    }
    assert.ok(Object.isFrozen(stamped));
    assert.ok(Object.isFrozen(stamped.evidence));
  }
});

test('stampDeclaredAssignment falls back to a mutation-derived default for an operation outside the explicit table', () => {
  // resolve-question/shape-plan/lock-decisions/judge-ambiguity/compound-learn are
  // READ_ONLY_OPS but not in the explicit six-operation table; the fallback
  // must reuse the JUST-COMPUTED mutation stamp (not a second, independently
  // derived role check) so the two stamps can never disagree for these ops.
  for (const operation of ['resolve-question', 'shape-plan', 'lock-decisions', 'judge-ambiguity', 'compound-learn']) {
    const stamped = stampDeclaredAssignment({ role: 'researcher', operation });
    assert.equal(stamped.mutation, 'read-only', `${operation} mutation`);
    assert.equal(stamped.evidence.required, 'reported', `${operation} evidence.required fallback`);
    assert.equal(stamped.resultKind, 'advisory', `${operation} resultKind fallback`);
    assert.equal(stamped.onAdvance, undefined);
  }

  // An unrecognized/synthesized operation (e.g. 'decompose') with an
  // implementer-family role defaults to mutating -> verified/work-product.
  const decompose = stampDeclaredAssignment({ role: 'implementer', operation: 'decompose' });
  assert.equal(decompose.mutation, 'mutating');
  assert.equal(decompose.evidence.required, 'verified');
  assert.equal(decompose.resultKind, 'work-product');
});

test('stampDeclaredAssignment: KNOWN_MUTATING_OPS wins over a read-only role (mirrors isReadOnlyAssignment precedence)', () => {
  const stamped = stampDeclaredAssignment({ role: 'reviewer', operation: 'scoped-subtask' });
  assert.equal(stamped.mutation, 'mutating');
  assert.equal(stamped.evidence.required, 'verified');
});

test('stampDeclaredAssignment defaults role to "implementer" when omitted, like isReadOnlyAssignment', () => {
  const stamped = stampDeclaredAssignment({ operation: 'implement-item' });
  assert.equal(stamped.mutation, 'mutating');
});

test('stampInlineAssignment reads mutation/evidence.required straight from the contract', () => {
  const stamped = stampInlineAssignment({ mutation: 'read-only', evidence: { required: 'reported' } });
  assert.equal(stamped.mutation, 'read-only');
  assert.equal(stamped.evidence.required, 'reported');
  assert.ok(Object.isFrozen(stamped));
  assert.ok(Object.isFrozen(stamped.evidence));

  const stampedVerified = stampInlineAssignment({ mutation: 'read-only', evidence: { required: 'verified' } });
  assert.equal(stampedVerified.evidence.required, 'verified');
});

test('stampInlineAssignment throws RunnerConfigError when mutation is missing after normalization', () => {
  assert.throws(
    () => stampInlineAssignment({ evidence: { required: 'reported' } }),
    (err) => err instanceof RunnerConfigError && /mutation/.test(err.message),
  );
});

test('stampInlineAssignment throws RunnerConfigError when evidence.required is missing after normalization', () => {
  assert.throws(
    () => stampInlineAssignment({ mutation: 'read-only' }),
    (err) => err instanceof RunnerConfigError && /evidence\.required/.test(err.message),
  );
});

test('stampInlineAssignment throws RunnerConfigError for a contract with mutation "mutating" (defensive second gate, execution-contract.mjs is the primary gate)', () => {
  assert.throws(
    () => stampInlineAssignment({ mutation: 'mutating', evidence: { required: 'verified' } }),
    (err) => err instanceof RunnerConfigError,
  );
});
