import { test } from 'node:test';
import assert from 'node:assert/strict';
import { transitionPorting, PortingError, STATUSES } from '../../src/state/porting.mjs';

function porting(status, overrides = {}) {
  return { id: 'p1', status, ...overrides };
}

test('STATUSES exposes the full flat status domain', () => {
  assert.deepEqual(STATUSES, ['candidate', 'planned', 'in-progress', 'ported', 'adapted', 'rejected']);
});

for (const [from, to] of [
  ['candidate', 'planned'],
  ['candidate', 'rejected'],
  ['planned', 'in-progress'],
  ['in-progress', 'ported'],
  ['in-progress', 'adapted'],
  ['in-progress', 'rejected'],
]) {
  test(`transitionPorting allows ${from} -> ${to} and returns a validated event`, () => {
    const event = transitionPorting({ porting: porting(from), to });
    assert.deepEqual(event, { type: 'porting.move', payload: { id: 'p1', from, to } });
  });
}

test('every legal edge is exactly the declared table; every other status pair is precondition', () => {
  const legalEdges = new Set([
    'candidate->planned',
    'candidate->rejected',
    'planned->in-progress',
    'in-progress->ported',
    'in-progress->adapted',
    'in-progress->rejected',
  ]);
  for (const from of STATUSES) {
    for (const to of STATUSES) {
      const key = `${from}->${to}`;
      if (legalEdges.has(key)) {
        assert.doesNotThrow(() => transitionPorting({ porting: porting(from), to }), `expected ${key} to be legal`);
      } else {
        assert.throws(
          () => transitionPorting({ porting: porting(from), to }),
          (err) => err instanceof PortingError && err.category === 'precondition',
          `expected ${key} to be refused as precondition`,
        );
      }
    }
  }
});

test('transitionPorting rejects a transition not in the table and returns no event', () => {
  assert.throws(
    () => transitionPorting({ porting: porting('candidate'), to: 'in-progress' }),
    (err) => err instanceof PortingError && err.category === 'precondition',
  );
});

for (const terminal of ['ported', 'adapted', 'rejected']) {
  test(`${terminal} is terminal single-door: no transition out of ${terminal}, no matter the target`, () => {
    for (const to of STATUSES) {
      if (to === terminal) continue;
      assert.throws(
        () => transitionPorting({ porting: porting(terminal), to }),
        (err) => err instanceof PortingError && err.category === 'precondition',
      );
    }
  });
}

test('there is no reopen/un-reject edge from any terminal state (out of scope per D3)', () => {
  for (const terminal of ['ported', 'adapted', 'rejected']) {
    assert.throws(
      () => transitionPorting({ porting: porting(terminal), to: 'candidate' }),
      (err) => err instanceof PortingError && err.category === 'precondition',
    );
  }
});

test('transitionPorting rejects an unknown target status as precondition', () => {
  assert.throws(
    () => transitionPorting({ porting: porting('candidate'), to: 'archived' }),
    (err) => err instanceof PortingError && err.category === 'precondition',
  );
});

test('transitionPorting CAS: matching expectedStatus proceeds normally', () => {
  const event = transitionPorting({ porting: porting('candidate'), to: 'planned', expectedStatus: 'candidate' });
  assert.equal(event.payload.from, 'candidate');
  assert.equal(event.payload.to, 'planned');
});

test('transitionPorting CAS: mismatched expectedStatus is refused as conflict, not precondition', () => {
  assert.throws(
    () => transitionPorting({ porting: porting('planned'), to: 'in-progress', expectedStatus: 'candidate' }),
    (err) => err instanceof PortingError && err.category === 'conflict',
  );
});

test('transitionPorting CAS mismatch takes priority over table lookup (conflict, not precondition, even for a bogus target)', () => {
  assert.throws(
    () => transitionPorting({ porting: porting('planned'), to: 'archived', expectedStatus: 'candidate' }),
    (err) => err instanceof PortingError && err.category === 'conflict',
  );
});

test('transitionPorting requires a porting object', () => {
  assert.throws(
    () => transitionPorting({ to: 'planned' }),
    (err) => err instanceof PortingError && err.category === 'precondition',
  );
});

test('transitionPorting requires a non-empty "to"', () => {
  assert.throws(
    () => transitionPorting({ porting: porting('candidate') }),
    (err) => err instanceof PortingError && err.category === 'precondition',
  );
  assert.throws(
    () => transitionPorting({ porting: porting('candidate'), to: '' }),
    (err) => err instanceof PortingError && err.category === 'precondition',
  );
});
