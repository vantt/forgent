import { test } from 'node:test';
import assert from 'node:assert/strict';
import { transitionWork, FsmError, STATUSES } from '../../src/state/fsm.mjs';

function work(status, overrides = {}) {
  return { id: 'w1', status, ...overrides };
}

test('STATUSES exposes the full flat status domain', () => {
  assert.deepEqual(STATUSES, ['todo', 'doing', 'blocked', 'done']);
});

for (const [from, to] of [
  ['todo', 'doing'],
  ['doing', 'done'],
  ['todo', 'blocked'],
  ['doing', 'blocked'],
  ['blocked', 'todo'],
  ['blocked', 'doing'],
]) {
  test(`transitionWork allows ${from} -> ${to} and returns a validated event`, () => {
    const event = transitionWork({ work: work(from), to });
    assert.deepEqual(event, { type: 'work.move', payload: { id: 'w1', from, to } });
  });
}

test('transitionWork rejects a transition not in the table and returns no event', () => {
  assert.throws(
    () => transitionWork({ work: work('todo'), to: 'done' }),
    (err) => err instanceof FsmError && err.category === 'precondition',
  );
});

test('done is terminal single-door: no transition out of done, no matter the target', () => {
  for (const to of ['todo', 'doing', 'blocked']) {
    assert.throws(
      () => transitionWork({ work: work('done'), to }),
      (err) => err instanceof FsmError && err.category === 'precondition',
    );
  }
});

test('done is reachable only through the doing -> done edge, never directly from todo or blocked', () => {
  for (const from of ['todo', 'blocked']) {
    assert.throws(
      () => transitionWork({ work: work(from), to: 'done' }),
      (err) => err instanceof FsmError && err.category === 'precondition',
    );
  }
});

test('transitionWork rejects an unknown target status as precondition', () => {
  assert.throws(
    () => transitionWork({ work: work('todo'), to: 'archived' }),
    (err) => err instanceof FsmError && err.category === 'precondition',
  );
});

test('transitionWork CAS: matching expectedStatus proceeds normally', () => {
  const event = transitionWork({ work: work('todo'), to: 'doing', expectedStatus: 'todo' });
  assert.equal(event.payload.from, 'todo');
  assert.equal(event.payload.to, 'doing');
});

test('transitionWork CAS: mismatched expectedStatus is refused as conflict, not precondition', () => {
  assert.throws(
    () => transitionWork({ work: work('doing'), to: 'done', expectedStatus: 'todo' }),
    (err) => err instanceof FsmError && err.category === 'conflict',
  );
});

test('transitionWork CAS mismatch takes priority over table lookup (conflict, not precondition, even for a bogus target)', () => {
  assert.throws(
    () => transitionWork({ work: work('doing'), to: 'archived', expectedStatus: 'todo' }),
    (err) => err instanceof FsmError && err.category === 'conflict',
  );
});

test('transitionWork requires a work object', () => {
  assert.throws(
    () => transitionWork({ to: 'doing' }),
    (err) => err instanceof FsmError && err.category === 'precondition',
  );
});

test('transitionWork requires a non-empty "to"', () => {
  assert.throws(
    () => transitionWork({ work: work('todo') }),
    (err) => err instanceof FsmError && err.category === 'precondition',
  );
  assert.throws(
    () => transitionWork({ work: work('todo'), to: '' }),
    (err) => err instanceof FsmError && err.category === 'precondition',
  );
});
