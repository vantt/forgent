import { test } from 'node:test';
import assert from 'node:assert/strict';
import { transitionWork, FsmError, STATUSES } from '../../src/state/status-fsm.mjs';

function work(status, overrides = {}) {
  return { id: 'w1', status, ...overrides };
}

const VALID_ASK = `## Context

We are configuring authentication for the user service and have two viable mechanisms.

## Why this matters

Selecting the proper auth mechanism impacts security and integration across all API endpoints.`;

test('STATUSES exposes the full flat status domain', () => {
  assert.deepEqual(STATUSES, [
    'backlog',
    'todo',
    'doing',
    'blocked',
    'awaiting-approval',
    'delivered',
    'retrospective',
    'cleanup',
    'done',
    'awaiting-human',
    'wontfix',
  ]);
});

for (const [from, to] of [
  // work-item-backlog-status D1: a plain edge — the assertion below that the
  // event carries no payload keys beyond id/from/to is what pins "no
  // reason/ask/answer required", the same shape blocked -> todo has.
  ['backlog', 'todo'],
  // tsk-40m (docs/architect/doing-coordination-redesign.md): settleClaim
  // settles a fresh (never-durably-doing) claim straight through to
  // awaiting-approval — the direct edge this redesign needs, replacing
  // `todo -> doing` (retired below, see the standalone refusal test).
  ['todo', 'awaiting-approval'],
  ['todo', 'blocked'],
  ['doing', 'blocked'],
  ['blocked', 'todo'],
  ['blocked', 'awaiting-approval'],
  ['doing', 'awaiting-approval'],
  ['doing', 'delivered'],
  ['awaiting-approval', 'delivered'],
  ['delivered', 'retrospective'],
  ['retrospective', 'cleanup'],
  ['cleanup', 'done'],
  ['blocked', 'wontfix'],
  ['todo', 'wontfix'],
  ['doing', 'wontfix'],
]) {
  test(`transitionWork allows ${from} -> ${to} and returns a validated event with no extra payload keys`, () => {
    const event = transitionWork({ work: work(from), to });
    assert.deepEqual(event, { type: 'work.move', payload: { id: 'w1', from, to } });
  });
}

// tsk-40m (docs/architect/doing-coordination-redesign.md, design target
// confirmed 2026-08-25): `todo -> doing` and `blocked -> doing` are
// RETIRED, not merely unused — nothing durably writes INTO `doing` anymore,
// not even settleClaim's own settle segment (`doing` is derived purely
// from the active-claim overlay, or read from pre-migration history, never
// newly written). Locked here as an explicit refusal so a future change
// can never silently reintroduce either edge.
for (const from of ['todo', 'blocked']) {
  test(`transitionWork refuses ${from} -> doing as precondition (tsk-40m: doing is never a durable settle/claim target)`, () => {
    assert.throws(
      () => transitionWork({ work: work(from), to: 'doing' }),
      (err) => err instanceof FsmError && err.category === 'precondition',
    );
  });
}

// fan-out-parallel D18: blocked -> awaiting-approval is the mechanical reconcile
// door (drift catch-up + re-verify, CONTEXT.md D7/D8/D11) that returns a
// parked root to `proposed` WITHOUT re-entering `doing`. This matters
// because `runner/anti-loop.mjs`'s `visitCount` counts a work item's visits
// by scanning for `work.move` events whose `payload.to` is strictly
// `'doing'` — so this edge's event (`payload.to === 'awaiting-approval'`) is
// provably never counted as an anti-loop visit, no matter how many times a
// root cycles through it.
test('transitionWork allows blocked -> awaiting-approval, and its event is never counted by anti-loop.mjs (payload.to is "awaiting-approval", not "doing")', () => {
  const event = transitionWork({ work: work('blocked'), to: 'awaiting-approval' });
  assert.deepEqual(event, { type: 'work.move', payload: { id: 'w1', from: 'blocked', to: 'awaiting-approval' } });
  assert.equal(event.payload.to, 'awaiting-approval');
  assert.notEqual(event.payload.to, 'doing');
});

// work-item-status-delivered-retrospective-cleanup D2: blocked -> delivered
// is a mechanical retry door (mirrors blocked -> awaiting-approval exactly)
// for an item parked via cleanup -> blocked that just needs its
// retrospective/cleanup retried, not real rework — no reason required, not
// counted by anti-loop.mjs (payload.to is "delivered", not "doing").
test('transitionWork allows blocked -> delivered (mechanical retry) with no extra payload keys', () => {
  const event = transitionWork({ work: work('blocked'), to: 'delivered' });
  assert.deepEqual(event, { type: 'work.move', payload: { id: 'w1', from: 'blocked', to: 'delivered' } });
  assert.notEqual(event.payload.to, 'doing');
});

test('transitionWork allows awaiting-approval -> todo (rejection) and carries the reason in the payload', () => {
  const event = transitionWork({ work: work('awaiting-approval'), to: 'todo', reason: 'goal-check failed twice' });
  assert.deepEqual(event, {
    type: 'work.move',
    payload: { id: 'w1', from: 'awaiting-approval', to: 'todo', reason: 'goal-check failed twice' },
  });
});

test('transitionWork rejects awaiting-approval -> todo without a reason as validation, not precondition', () => {
  assert.throws(
    () => transitionWork({ work: work('awaiting-approval'), to: 'todo' }),
    (err) => err instanceof FsmError && err.category === 'validation',
  );
  assert.throws(
    () => transitionWork({ work: work('awaiting-approval'), to: 'todo', reason: '   ' }),
    (err) => err instanceof FsmError && err.category === 'validation',
  );
});

// pr-lifecycle D3: awaiting-approval -> blocked (an approved proposal whose merge or
// post-merge verify failed) requires a reason exactly like awaiting-approval -> todo.
test('transitionWork allows awaiting-approval -> blocked and carries the reason in the payload', () => {
  const event = transitionWork({ work: work('awaiting-approval'), to: 'blocked', reason: 'merge conflict' });
  assert.deepEqual(event, {
    type: 'work.move',
    payload: { id: 'w1', from: 'awaiting-approval', to: 'blocked', reason: 'merge conflict' },
  });
});

test('transitionWork rejects awaiting-approval -> blocked without a reason as validation, not precondition', () => {
  assert.throws(
    () => transitionWork({ work: work('awaiting-approval'), to: 'blocked' }),
    (err) => err instanceof FsmError && err.category === 'validation',
  );
  assert.throws(
    () => transitionWork({ work: work('awaiting-approval'), to: 'blocked', reason: '   ' }),
    (err) => err instanceof FsmError && err.category === 'validation',
  );
});

// work-item-status-delivered-retrospective-cleanup D2/D8: cleanup -> blocked
// (the final harness check failed) requires a reason exactly like
// awaiting-approval -> todo/blocked.
test('transitionWork allows cleanup -> blocked and carries the reason in the payload', () => {
  const event = transitionWork({ work: work('cleanup'), to: 'blocked', reason: 'merge no longer resolves on main' });
  assert.deepEqual(event, {
    type: 'work.move',
    payload: { id: 'w1', from: 'cleanup', to: 'blocked', reason: 'merge no longer resolves on main' },
  });
});

test('transitionWork rejects cleanup -> blocked without a reason as validation, not precondition', () => {
  assert.throws(
    () => transitionWork({ work: work('cleanup'), to: 'blocked' }),
    (err) => err instanceof FsmError && err.category === 'validation',
  );
  assert.throws(
    () => transitionWork({ work: work('cleanup'), to: 'blocked', reason: '   ' }),
    (err) => err instanceof FsmError && err.category === 'validation',
  );
});

// Changed (work-item-status-delivered-retrospective-cleanup D2): now three
// edges require reason (awaiting-approval -> todo, awaiting-approval ->
// blocked, cleanup -> blocked, per D2/D8), so the description and the edge
// exercised below are updated to name all three.
test('reason is ignored (never appears in payload) for every edge other than awaiting-approval -> todo/blocked and cleanup -> blocked', () => {
  const event = transitionWork({ work: work('todo'), to: 'blocked', reason: 'should be dropped' });
  assert.deepEqual(event, { type: 'work.move', payload: { id: 'w1', from: 'todo', to: 'blocked' } });
});

// Changed (work-item-status-delivered-retrospective-cleanup D1/D2, supersedes
// pr-lifecycle-1's own comment here): doing->done/awaiting-approval->done are
// GONE, replaced by doing->delivered/awaiting-approval->delivered; added
// blocked->delivered, delivered->retrospective, retrospective->cleanup,
// cleanup->done, cleanup->blocked. This sweep asserts the FULL table, so a
// missed edge would silently pass as "still precondition" and hide it.
//
// tsk-40m (docs/architect/doing-coordination-redesign.md, design target
// confirmed 2026-08-25): `todo->doing` and `blocked->doing` RETIRED —
// settleClaim (store.mjs) settles a claim straight from preClaimStatus to
// finalStatus with no durable intermediate `doing` leg at all; `doing` is
// derived purely from the active-claim overlay or read from pre-migration
// history, never newly written. `todo->awaiting-approval` ADDED — the
// direct edge that redesign needs. `doing->*` edges (doing->todo,
// doing->blocked, doing->awaiting-approval, doing->delivered,
// doing->awaiting-human, doing->wontfix) all STAY: they remain the real
// doors settleClaim's legacy fallback uses to settle a genuinely
// pre-migration durable-`doing` item.
test('every legal edge is exactly the declared table; every other status pair is precondition', () => {
  const legalEdges = new Set([
    // work-item-backlog-status D1: one door out, zero doors in. The sweep
    // below is what proves the "zero doors in" half — every other X->backlog
    // pair must still come back precondition.
    'backlog->todo',
    'todo->awaiting-approval',
    'todo->blocked',
    'doing->blocked',
    'blocked->todo',
    'blocked->awaiting-approval',
    'blocked->delivered',
    'doing->awaiting-approval',
    'doing->todo',
    'doing->delivered',
    'awaiting-approval->delivered',
    'awaiting-approval->todo',
    'awaiting-approval->blocked',
    'delivered->retrospective',
    'retrospective->cleanup',
    'cleanup->done',
    'cleanup->blocked',
    'todo->awaiting-human',
    'doing->awaiting-human',
    'awaiting-human->todo',
    'awaiting-human->doing',
    'blocked->wontfix',
    'todo->wontfix',
    'doing->wontfix',
    'awaiting-human->wontfix',
  ]);

  for (const from of STATUSES) {
    for (const to of STATUSES) {
      const key = `${from}->${to}`;
      if (legalEdges.has(key)) {
        const args = { work: work(from), to };
        if (key === 'awaiting-approval->todo' || key === 'awaiting-approval->blocked' || key === 'cleanup->blocked') {
          args.reason = 'sweep-test reason';
        }
        if (to === 'awaiting-human') args.ask = VALID_ASK;
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
    const event = transitionWork({ work: work(from), to: 'awaiting-human', ask: VALID_ASK });
    assert.deepEqual(event, {
      type: 'work.move',
      payload: { id: 'w1', from, to: 'awaiting-human', ask: VALID_ASK },
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

test('transitionWork rejects entry into awaiting-human with incomplete ask structure as validation', () => {
  for (const from of ['todo', 'doing']) {
    assert.throws(
      () => transitionWork({ work: work(from), to: 'awaiting-human', ask: 'just a bare question without headings' }),
      (err) =>
        err instanceof FsmError &&
        err.category === 'validation' &&
        err.message.includes('## Context') &&
        err.message.includes('## Why this matters'),
    );

    assert.throws(
      () =>
        transitionWork({
          work: work(from),
          to: 'awaiting-human',
          ask: '## Context\n\nThis is a sufficiently long context section with more than 20 chars.',
        }),
      (err) =>
        err instanceof FsmError &&
        err.category === 'validation' &&
        !err.message.includes('## Context') &&
        err.message.includes('## Why this matters'),
    );

    assert.throws(
      () =>
        transitionWork({
          work: work(from),
          to: 'awaiting-human',
          ask: '## Why this matters\n\nThis is a sufficiently long why this matters section with >20 chars.',
        }),
      (err) =>
        err instanceof FsmError &&
        err.category === 'validation' &&
        err.message.includes('## Context') &&
        !err.message.includes('## Why this matters'),
    );

    assert.throws(
      () =>
        transitionWork({
          work: work(from),
          to: 'awaiting-human',
          ask: '## Context\n\nToo short\n\n## Why this matters\n\nThis is a sufficiently long why this matters section with >20 chars.',
        }),
      (err) =>
        err instanceof FsmError &&
        err.category === 'validation' &&
        err.message.includes('## Context'),
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
  const event = transitionWork({ work: work('todo'), to: 'blocked', ask: 'dropped ask', answer: 'dropped answer' });
  assert.deepEqual(event, { type: 'work.move', payload: { id: 'w1', from: 'todo', to: 'blocked' } });
});

test('awaiting-human is not reachable from blocked, proposed, or done, and does not accept blocked/awaiting-approval/done as a resume target (todo/doing are the only two, per claim-lock §5.1)', () => {
  for (const from of ['blocked', 'awaiting-approval', 'done']) {
    assert.throws(
      () => transitionWork({ work: work(from), to: 'awaiting-human', ask: 'irrelevant' }),
      (err) => err instanceof FsmError && err.category === 'precondition',
    );
  }
  for (const to of ['blocked', 'awaiting-approval', 'done']) {
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
  for (const to of ['todo', 'doing', 'blocked', 'awaiting-human', 'delivered', 'retrospective', 'cleanup']) {
    assert.throws(
      () => transitionWork({ work: work('done'), to }),
      (err) => err instanceof FsmError && err.category === 'precondition',
    );
  }
});

// Changed (work-item-status-delivered-retrospective-cleanup D1/D2, supersedes
// this test's own prior name): done's one remaining door in is cleanup ->
// done — doing/awaiting-approval/blocked/delivered/retrospective can no
// longer reach done directly (they target delivered, or the next step in
// the sequential chain, instead).
test('done is reachable only through the cleanup -> done edge, never directly from any other status', () => {
  for (const from of ['todo', 'doing', 'blocked', 'awaiting-approval', 'delivered', 'retrospective']) {
    assert.throws(
      () => transitionWork({ work: work(from), to: 'done' }),
      (err) => err instanceof FsmError && err.category === 'precondition',
    );
  }
  assert.doesNotThrow(() => transitionWork({ work: work('cleanup'), to: 'done' }));
});

// fsm-wontfix-terminal-status D1/D4: wontfix is a SECOND terminal state
// alongside done — same no-exit shape, mirrors the 'done is terminal'
// test above one status over.
test('wontfix is terminal single-door: no transition out of wontfix, no matter the target', () => {
  for (const to of ['todo', 'doing', 'blocked', 'awaiting-approval', 'done', 'awaiting-human']) {
    assert.throws(
      () => transitionWork({ work: work('wontfix'), to }),
      (err) => err instanceof FsmError && err.category === 'precondition',
    );
  }
});

// D3: wontfix is reachable from exactly blocked/todo/doing — never from
// proposed, done, or awaiting-human.
test('wontfix is not reachable from awaiting-approval, delivered, retrospective, cleanup, or done -- past-completion statuses, unlike awaiting-human (tsk-2ub)', () => {
  for (const from of ['awaiting-approval', 'delivered', 'retrospective', 'cleanup', 'done']) {
    assert.throws(
      () => transitionWork({ work: work(from), to: 'wontfix' }),
      (err) => err instanceof FsmError && err.category === 'precondition',
    );
  }
});

test('wontfix IS reachable from awaiting-human (tsk-2ub): a park-for-question state with no committed work, same shape as todo/doing -- requires the usual awaiting-human exit answer', () => {
  assert.throws(
    () => transitionWork({ work: work('awaiting-human'), to: 'wontfix' }),
    (err) => err instanceof FsmError && err.category === 'validation',
    'missing answer must still be refused, same as every other awaiting-human exit',
  );
  const event = transitionWork({ work: work('awaiting-human'), to: 'wontfix', answer: 'no longer relevant, closing' });
  assert.equal(event.payload.from, 'awaiting-human');
  assert.equal(event.payload.to, 'wontfix');
  assert.equal(event.payload.answer, 'no longer relevant, closing');
});

test('transitionWork rejects an unknown target status as precondition', () => {
  assert.throws(
    () => transitionWork({ work: work('todo'), to: 'archived' }),
    (err) => err instanceof FsmError && err.category === 'precondition',
  );
});

test('transitionWork CAS: matching expectedStatus proceeds normally', () => {
  const event = transitionWork({ work: work('todo'), to: 'blocked', expectedStatus: 'todo' });
  assert.equal(event.payload.from, 'todo');
  assert.equal(event.payload.to, 'blocked');
});

test('transitionWork CAS: mismatched expectedStatus is refused as conflict, not precondition', () => {
  assert.throws(
    () => transitionWork({ work: work('doing'), to: 'delivered', expectedStatus: 'todo' }),
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
