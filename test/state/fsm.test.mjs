import { test } from 'node:test';
import assert from 'node:assert/strict';
import { transitionWork, FsmError, STATUSES } from '../../src/state/fsm.mjs';

function work(status, overrides = {}) {
  return { id: 'w1', status, ...overrides };
}

test('STATUSES exposes the full flat status domain', () => {
  assert.deepEqual(STATUSES, ['todo', 'doing', 'blocked', 'proposed', 'done', 'awaiting-human', 'wontfix']);
});

for (const [from, to] of [
  ['todo', 'doing'],
  ['doing', 'done'],
  ['todo', 'blocked'],
  ['doing', 'blocked'],
  ['blocked', 'todo'],
  ['blocked', 'doing'],
  ['blocked', 'proposed'],
  ['doing', 'proposed'],
  ['proposed', 'done'],
  ['blocked', 'wontfix'],
  ['todo', 'wontfix'],
  ['doing', 'wontfix'],
]) {
  test(`transitionWork allows ${from} -> ${to} and returns a validated event with no extra payload keys`, () => {
    const event = transitionWork({ work: work(from), to });
    assert.deepEqual(event, { type: 'work.move', payload: { id: 'w1', from, to } });
  });
}

// fan-out-parallel D18: blocked -> proposed is the mechanical reconcile
// door (drift catch-up + re-verify, CONTEXT.md D7/D8/D11) that returns a
// parked root to `proposed` WITHOUT re-entering `doing`. This matters
// because `runner/anti-loop.mjs`'s `visitCount` counts a work item's visits
// by scanning for `work.move` events whose `payload.to` is strictly
// `'doing'` — so this edge's event (`payload.to === 'proposed'`) is
// provably never counted as an anti-loop visit, no matter how many times a
// root cycles through it.
test('transitionWork allows blocked -> proposed, and its event is never counted by anti-loop.mjs (payload.to is "proposed", not "doing")', () => {
  const event = transitionWork({ work: work('blocked'), to: 'proposed' });
  assert.deepEqual(event, { type: 'work.move', payload: { id: 'w1', from: 'blocked', to: 'proposed' } });
  assert.equal(event.payload.to, 'proposed');
  assert.notEqual(event.payload.to, 'doing');
});

test('transitionWork allows proposed -> todo (rejection) and carries the reason in the payload', () => {
  const event = transitionWork({ work: work('proposed'), to: 'todo', reason: 'goal-check failed twice' });
  assert.deepEqual(event, {
    type: 'work.move',
    payload: { id: 'w1', from: 'proposed', to: 'todo', reason: 'goal-check failed twice' },
  });
});

test('transitionWork rejects proposed -> todo without a reason as validation, not precondition', () => {
  assert.throws(
    () => transitionWork({ work: work('proposed'), to: 'todo' }),
    (err) => err instanceof FsmError && err.category === 'validation',
  );
  assert.throws(
    () => transitionWork({ work: work('proposed'), to: 'todo', reason: '   ' }),
    (err) => err instanceof FsmError && err.category === 'validation',
  );
});

// pr-lifecycle D3: proposed -> blocked (an approved proposal whose merge or
// post-merge verify failed) requires a reason exactly like proposed -> todo.
test('transitionWork allows proposed -> blocked and carries the reason in the payload', () => {
  const event = transitionWork({ work: work('proposed'), to: 'blocked', reason: 'merge conflict' });
  assert.deepEqual(event, {
    type: 'work.move',
    payload: { id: 'w1', from: 'proposed', to: 'blocked', reason: 'merge conflict' },
  });
});

test('transitionWork rejects proposed -> blocked without a reason as validation, not precondition', () => {
  assert.throws(
    () => transitionWork({ work: work('proposed'), to: 'blocked' }),
    (err) => err instanceof FsmError && err.category === 'validation',
  );
  assert.throws(
    () => transitionWork({ work: work('proposed'), to: 'blocked', reason: '   ' }),
    (err) => err instanceof FsmError && err.category === 'validation',
  );
});

// Changed (pr-lifecycle-1): was "... other than proposed -> todo" — now two
// edges require reason (proposed -> todo, proposed -> blocked, per D3), so
// the description and the edge exercised below are updated to name both.
test('reason is ignored (never appears in payload) for every edge other than proposed -> todo/blocked', () => {
  const event = transitionWork({ work: work('todo'), to: 'doing', reason: 'should be dropped' });
  assert.deepEqual(event, { type: 'work.move', payload: { id: 'w1', from: 'todo', to: 'doing' } });
});

// Changed (pr-lifecycle-1): added 'proposed->blocked' to legalEdges (per D3's
// new table entry) and to the reason-required branch below, alongside the
// existing 'proposed->todo' — this sweep asserts the FULL table, so a new
// edge left out here would silently pass as "still precondition" and hide
// the addition.
test('every legal edge is exactly the declared table; every other status pair is precondition', () => {
  const legalEdges = new Set([
    'todo->doing',
    'doing->done',
    'todo->blocked',
    'doing->blocked',
    'blocked->todo',
    'blocked->doing',
    'blocked->proposed',
    'doing->proposed',
    'doing->todo',
    'proposed->done',
    'proposed->todo',
    'proposed->blocked',
    'todo->awaiting-human',
    'doing->awaiting-human',
    'awaiting-human->todo',
    'awaiting-human->doing',
    'blocked->wontfix',
    'todo->wontfix',
    'doing->wontfix',
  ]);
  for (const from of STATUSES) {
    for (const to of STATUSES) {
      const key = `${from}->${to}`;
      if (legalEdges.has(key)) {
        const args = { work: work(from), to };
        if (key === 'proposed->todo' || key === 'proposed->blocked') args.reason = 'sweep-test reason';
        if (to === 'awaiting-human') args.ask = 'sweep-test ask';
        if (from === 'awaiting-human') args.answer = 'sweep-test answer';
        assert.doesNotThrow(() => transitionWork(args), `expected ${key} to be legal`);
      } else {
        assert.throws(
          () => transitionWork({ work: work(from), to }),
          (err) => err instanceof FsmError && err.category === 'precondition',
          `expected ${key} to be refused as precondition`,
        );
      }
    }
  }
});

test('transitionWork allows todo -> awaiting-human and doing -> awaiting-human, carrying the ask in the payload', () => {
  for (const from of ['todo', 'doing']) {
    const event = transitionWork({ work: work(from), to: 'awaiting-human', ask: 'which auth method?' });
    assert.deepEqual(event, {
      type: 'work.move',
      payload: { id: 'w1', from, to: 'awaiting-human', ask: 'which auth method?' },
    });
  }
});

test('transitionWork rejects entry into awaiting-human without a non-empty ask as validation, not precondition', () => {
  for (const from of ['todo', 'doing']) {
    assert.throws(
      () => transitionWork({ work: work(from), to: 'awaiting-human' }),
      (err) => err instanceof FsmError && err.category === 'validation',
    );
    assert.throws(
      () => transitionWork({ work: work(from), to: 'awaiting-human', ask: '   ' }),
      (err) => err instanceof FsmError && err.category === 'validation',
    );
  }
});

test('transitionWork allows awaiting-human -> todo (resume) and carries the answer in the payload', () => {
  const event = transitionWork({ work: work('awaiting-human'), to: 'todo', answer: 'use OAuth' });
  assert.deepEqual(event, {
    type: 'work.move',
    payload: { id: 'w1', from: 'awaiting-human', to: 'todo', answer: 'use OAuth' },
  });
});

test('transitionWork rejects resuming from awaiting-human without a non-empty answer as validation, not precondition', () => {
  assert.throws(
    () => transitionWork({ work: work('awaiting-human'), to: 'todo' }),
    (err) => err instanceof FsmError && err.category === 'validation',
  );
  assert.throws(
    () => transitionWork({ work: work('awaiting-human'), to: 'todo', answer: '   ' }),
    (err) => err instanceof FsmError && err.category === 'validation',
  );
});

// claim-lock §5.1: a claim held at ask-time (status 'doing') must be able to
// resume to 'doing', not just 'todo' — otherwise answering a gate mid-claim
// silently drops it. Mirrors the awaiting-human -> todo test above exactly,
// one target over.
test('transitionWork allows awaiting-human -> doing (resume held claim, per claim-lock §5.1) and carries the answer in the payload', () => {
  const event = transitionWork({ work: work('awaiting-human'), to: 'doing', answer: 'use OAuth' });
  assert.deepEqual(event, {
    type: 'work.move',
    payload: { id: 'w1', from: 'awaiting-human', to: 'doing', answer: 'use OAuth' },
  });
});

test('transitionWork rejects resuming from awaiting-human to doing without a non-empty answer as validation, not precondition', () => {
  assert.throws(
    () => transitionWork({ work: work('awaiting-human'), to: 'doing' }),
    (err) => err instanceof FsmError && err.category === 'validation',
  );
  assert.throws(
    () => transitionWork({ work: work('awaiting-human'), to: 'doing', answer: '   ' }),
    (err) => err instanceof FsmError && err.category === 'validation',
  );
});

// claim-lock §3b: the direct release door a held claim leaves `doing`
// through without settling the item — no `reason` required (mirrors
// `blocked -> todo`'s own no-reason shape).
test('transitionWork allows doing -> todo (claim release, per claim-lock §3b) with no extra payload keys', () => {
  const event = transitionWork({ work: work('doing'), to: 'todo' });
  assert.deepEqual(event, { type: 'work.move', payload: { id: 'w1', from: 'doing', to: 'todo' } });
});

test('ask/answer are ignored (never appear in payload) for every edge other than the awaiting-human entry/exit edges', () => {
  const event = transitionWork({ work: work('todo'), to: 'doing', ask: 'dropped ask', answer: 'dropped answer' });
  assert.deepEqual(event, { type: 'work.move', payload: { id: 'w1', from: 'todo', to: 'doing' } });
});

test('awaiting-human is not reachable from blocked, proposed, or done, and does not accept blocked/proposed/done as a resume target (todo/doing are the only two, per claim-lock §5.1)', () => {
  for (const from of ['blocked', 'proposed', 'done']) {
    assert.throws(
      () => transitionWork({ work: work(from), to: 'awaiting-human', ask: 'irrelevant' }),
      (err) => err instanceof FsmError && err.category === 'precondition',
    );
  }
  for (const to of ['blocked', 'proposed', 'done']) {
    assert.throws(
      () => transitionWork({ work: work('awaiting-human'), to, answer: 'irrelevant' }),
      (err) => err instanceof FsmError && err.category === 'precondition',
    );
  }
});

test('transitionWork rejects a transition not in the table and returns no event', () => {
  assert.throws(
    () => transitionWork({ work: work('todo'), to: 'done' }),
    (err) => err instanceof FsmError && err.category === 'precondition',
  );
});

test('done is terminal single-door: no transition out of done, no matter the target', () => {
  for (const to of ['todo', 'doing', 'blocked', 'awaiting-human']) {
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

// fsm-wontfix-terminal-status D1/D4: wontfix is a SECOND terminal state
// alongside done — same no-exit shape, mirrors the 'done is terminal'
// test above one status over.
test('wontfix is terminal single-door: no transition out of wontfix, no matter the target', () => {
  for (const to of ['todo', 'doing', 'blocked', 'proposed', 'done', 'awaiting-human']) {
    assert.throws(
      () => transitionWork({ work: work('wontfix'), to }),
      (err) => err instanceof FsmError && err.category === 'precondition',
    );
  }
});

// D3: wontfix is reachable from exactly blocked/todo/doing — never from
// proposed, done, or awaiting-human.
test('wontfix is not reachable from proposed, done, or awaiting-human', () => {
  for (const from of ['proposed', 'done', 'awaiting-human']) {
    assert.throws(
      () => transitionWork({ work: work(from), to: 'wontfix' }),
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
