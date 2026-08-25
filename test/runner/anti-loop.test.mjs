import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MAX_VISITS,
  BREAKER_MISSES,
  visitCount,
  visitsSinceLastHumanEvent,
  hasExceededMaxVisits,
  createMissBreaker,
} from '../../src/runner/anti-loop.mjs';

// Pure lib — every event array here is a literal built in-memory; no fs, no
// mkdtemp, no `.fgos/` writes anywhere in this file.

function move(id, to, seq) {
  return { seq, ts: new Date(2026, 0, seq).toISOString(), type: 'work.move', payload: { id, from: 'x', to }, v: 2 };
}

test('visitCount is 0 on an empty log', () => {
  assert.equal(visitCount([], 'a'), 0);
});

function attempt(id, seq, overrides = {}) {
  return { seq, ts: new Date(2026, 0, seq).toISOString(), type: 'work.attempt', payload: { id, phase: 'execute', result: 'success', ...overrides }, v: 3 };
}

// tsk-40m D3 (docs/history/runtime-claim-doing-separation/CONTEXT.md,
// locked decision — hard migration, no dual-count legacy): visitCount now
// counts durable work.attempt(phase:'execute') events directly, INSTEAD OF
// work.move(to:'doing') — a full replacement, not an additive/dual-count
// transition. settleClaim (store.mjs) only ever stamps `phase:'execute'`
// for a real dispatch attempt (a clarify/decompose-phase claim settles
// with a different `phase`), so the executing-only scoping this file used
// to reconstruct from domain+stage is now a fact already recorded at
// write time.

test('visitCount counts every execute-phase attempt for the given id', () => {
  const events = [
    attempt('a', 1),
    move('a', 'blocked', 2),
    attempt('a', 3),
    move('a', 'awaiting-approval', 4),
    move('a', 'todo', 5),
    attempt('a', 6),
  ];
  assert.equal(visitCount(events, 'a'), 3);
});

test('visitCount ignores attempts for other ids', () => {
  const events = [attempt('a', 1), attempt('b', 2), attempt('b', 3)];
  assert.equal(visitCount(events, 'a'), 1);
  assert.equal(visitCount(events, 'b'), 2);
});

test('visitCount ignores non-execute-phase attempts and non-work.attempt event types', () => {
  const events = [
    move('a', 'blocked', 1),
    move('a', 'awaiting-approval', 2),
    attempt('a', 3, { phase: 'clarify' }),
    attempt('a', 4, { phase: 'decompose' }),
    { seq: 5, ts: new Date().toISOString(), type: 'decision', payload: { text: 'unrelated' }, v: 2 },
  ];
  assert.equal(visitCount(events, 'a'), 0);
});

test('visitCount counts a human-actor attempt exactly the same as any other (no privileged writer)', () => {
  // A human's manual re-dispatch settles through the exact same
  // settleClaim path (and the same work.attempt shape) a runner-driven
  // one does — this test locks that no distinction is (or can be) made,
  // regardless of `actor`.
  const events = [attempt('a', 1, { actor: 'human' })];
  assert.equal(visitCount(events, 'a'), 1);
});

test('visitCount defensive guards: non-array events / missing id never throw', () => {
  assert.doesNotThrow(() => visitCount(undefined, 'a'));
  assert.equal(visitCount(undefined, 'a'), 0);
  assert.equal(visitCount([attempt('a', 1)], undefined), 0);
});

// -- executing-phase scoping (claim-lock, code review finding, superseded
// by tsk-40m D3) -------------------------------------------------------
//
// Before claim-lock, `doing` was unreachable before stage `executing`
// (pick/take were frontier-only), so every `to: 'doing'` move already WAS
// an executing-phase dispatch. Claim-lock let `pick` claim an item at
// clarify/decompose too; a claim-then-release cycle there must not
// consume the SAME budget real executing retries draw from. That scoping
// used to be reconstructed here from domain+stage replay. tsk-40m D3
// retired that reconstruction: a clarify/decompose-phase claim now
// settles with a `phase` OTHER than `'execute'` (resolveDiscovery/
// resolvePlan's own responsibility when they call settleClaim), so
// visitCount's own `phase === 'execute'` filter already excludes it by
// construction — no domain/stage inference needed here at all.

function add(id, seq, overrides = {}) {
  return { seq, ts: new Date(2026, 0, seq).toISOString(), type: 'work.add', payload: { id, title: id, status: 'todo', ...overrides }, v: 2 };
}

test('visitCount does not count a clarify-phase claim settle (claim-lock pick-at-clarify)', () => {
  const events = [
    add('a', 1, { stage: 'clarify' }),
    attempt('a', 2, { phase: 'clarify' }), // pick --id a (clarify), released — not a dispatch attempt
    move('a', 'todo', 3), // decompose.mjs's release, doing -> todo
  ];
  assert.equal(visitCount(events, 'a'), 0);
});

test('visitCount counts the execute-phase attempt once the item has actually reached executing, ignoring the earlier clarify-phase claim', () => {
  const events = [
    add('a', 1, { stage: 'clarify' }),
    attempt('a', 2, { phase: 'clarify' }), // pick at clarify — excluded
    move('a', 'todo', 3), // release
    attempt('a', 4), // pick at executing — the real first dispatch
  ];
  assert.equal(visitCount(events, 'a'), 1);
});

// -- settleClaim's own segment (tsk-40m redesign): one real settle writes
// an enriched work.attempt(phase:'execute') then transitions DIRECTLY from
// preClaimStatus to finalStatus — no durable intermediate
// work.move(->doing) leg at all (store.mjs's settleClaim). There is
// therefore no "bundle" left to dual-count: visitCount counts the one
// work.attempt event and nothing else, full stop.

test('visitCount counts one settleClaim segment (work.attempt, no accompanying doing-move) as exactly one visit', () => {
  const events = [add('a', 1), attempt('a', 2), move('a', 'awaiting-approval', 3)];
  assert.equal(visitCount(events, 'a'), 1);
});

test('visitCount does NOT count a legacy standalone doing-move at all — hard migration, no dual-count legacy (tsk-40m D3)', () => {
  const events = [add('a', 1), move('a', 'doing', 2), move('a', 'blocked', 3)];
  assert.equal(visitCount(events, 'a'), 0);
});

test('visitCount counts two consecutive settleClaim segments as two visits, not four', () => {
  const events = [
    add('a', 1),
    attempt('a', 2), move('a', 'blocked', 3), // segment 1
    attempt('a', 4), move('a', 'awaiting-approval', 5), // segment 2
  ];
  assert.equal(visitCount(events, 'a'), 2);
});

// -- visitsSinceLastHumanEvent: human-rounds D1 gate budget ----------------
//
// Distinct from visitCount above: this is the runner GATE's own budget
// (loop.mjs's hasExceededMaxVisits call sites), not the shipped lifetime
// metric. `humanMove` mints the two CLOSED trigger shapes (D1c): an `answer`
// leaving awaiting-human, or a `reason`-carrying move — both require
// `role: 'human'`, matching status-fsm.mjs's transitionWork (answer only appears
// on `awaiting-human -> todo`; reason only on `awaiting-approval -> todo`/`blocked`).

function humanMove(id, to, seq, extra = {}) {
  return { seq, ts: new Date(2026, 0, seq).toISOString(), type: 'work.move', payload: { id, from: 'x', to, role: 'human', ...extra }, v: 2 };
}

test('visitsSinceLastHumanEvent is 0 on an empty log', () => {
  assert.equal(visitsSinceLastHumanEvent([], 'a'), 0);
});

test('with no human trigger event ever, visitsSinceLastHumanEvent equals visitCount (a pure machine loop still dies at the cap)', () => {
  const events = [attempt('a', 1), move('a', 'blocked', 2), attempt('a', 3)];
  assert.equal(visitsSinceLastHumanEvent(events, 'a'), visitCount(events, 'a'));
  assert.equal(visitsSinceLastHumanEvent(events, 'a'), 2);
});

test('a human answer (leaving awaiting-human) resets the budget — only attempts AFTER it count', () => {
  const events = [
    attempt('a', 1),
    move('a', 'blocked', 2),
    attempt('a', 3),
    humanMove('a', 'todo', 4, { answer: 'go ahead' }),
    attempt('a', 5),
  ];
  assert.equal(visitCount(events, 'a'), 3); // lifetime metric unaffected
  assert.equal(visitsSinceLastHumanEvent(events, 'a'), 1); // only the attempt at seq 5
});

test('a human reject/park with reason resets the budget the same way', () => {
  const events = [
    attempt('a', 1),
    attempt('a', 2),
    humanMove('a', 'todo', 3, { reason: 'not quite right' }),
    attempt('a', 4),
  ];
  assert.equal(visitsSinceLastHumanEvent(events, 'a'), 1);
});

test('a bare resume (blocked -> todo, no reason, no role) does NOT reset the budget', () => {
  const events = [
    attempt('a', 1),
    move('a', 'blocked', 2),
    move('a', 'todo', 3),
    attempt('a', 4),
  ];
  assert.equal(visitsSinceLastHumanEvent(events, 'a'), 2);
});

test('a human-actor attempt does NOT reset the budget — it counts as a visit like any other (only a work.move reset trigger can reset)', () => {
  const events = [
    attempt('a', 1),
    move('a', 'blocked', 2),
    attempt('a', 3, { actor: 'human' }),
  ];
  assert.equal(visitsSinceLastHumanEvent(events, 'a'), 2);
});

test('a machine park with reason (role runner, e.g. anti-loop-max-visits) does NOT reset the budget — reason alone is not enough, role must be human', () => {
  const events = [
    attempt('a', 1),
    { seq: 2, ts: new Date(2026, 0, 2).toISOString(), type: 'work.move', payload: { id: 'a', from: 'doing', to: 'blocked', reason: 'anti-loop-max-visits', role: 'runner' }, v: 2 },
    attempt('a', 3),
  ];
  assert.equal(visitsSinceLastHumanEvent(events, 'a'), 2);
});

test('a system park edge does not reset the anti-loop budget — role must be human, not just reason (return/approve internal park edges stamp role system)', () => {
  const events = [
    attempt('a', 1),
    { seq: 2, ts: new Date(2026, 0, 2).toISOString(), type: 'work.move', payload: { id: 'a', from: 'doing', to: 'blocked', reason: 'verify-fail', role: 'system' }, v: 2 },
    attempt('a', 3),
  ];
  assert.equal(visitsSinceLastHumanEvent(events, 'a'), 2);
});

test('per-item: another id\'s human event never resets this id\'s budget', () => {
  const events = [
    attempt('a', 1),
    attempt('a', 2),
    humanMove('b', 'todo', 3, { answer: 'yes' }),
    attempt('a', 4),
  ];
  assert.equal(visitsSinceLastHumanEvent(events, 'a'), 3);
});

test('visitsSinceLastHumanEvent defensive guards: non-array events / missing id never throw', () => {
  assert.doesNotThrow(() => visitsSinceLastHumanEvent(undefined, 'a'));
  assert.equal(visitsSinceLastHumanEvent(undefined, 'a'), 0);
  assert.equal(visitsSinceLastHumanEvent([move('a', 'doing', 1)], undefined), 0);
});

// -- hasExceededMaxVisits boundary -----------------------------------------

test('hasExceededMaxVisits: strictly below MAX_VISITS is not exceeded', () => {
  assert.equal(hasExceededMaxVisits(MAX_VISITS - 1), false);
});

test('hasExceededMaxVisits: exactly at MAX_VISITS (boundary) is exceeded', () => {
  assert.equal(hasExceededMaxVisits(MAX_VISITS), true);
});

test('hasExceededMaxVisits: past MAX_VISITS is exceeded', () => {
  assert.equal(hasExceededMaxVisits(MAX_VISITS + 5), true);
});

test('hasExceededMaxVisits honors a custom threshold override', () => {
  assert.equal(hasExceededMaxVisits(2, 5), false);
  assert.equal(hasExceededMaxVisits(5, 5), true);
});

// -- createMissBreaker: in-memory, now per-item circuit breaker ------------

test('a fresh breaker starts untripped with zero consecutive misses (sentinel/no-id getter)', () => {
  const breaker = createMissBreaker();
  assert.equal(breaker.consecutiveMisses, 0);
  assert.equal(breaker.isTripped(), false);
});

test('recordMiss increments the streak; isTripped flips at BREAKER_MISSES (boundary)', () => {
  const breaker = createMissBreaker();
  for (let i = 1; i < BREAKER_MISSES; i++) {
    breaker.recordMiss('a');
    assert.equal(breaker.isTripped('a'), false, `should not trip before ${BREAKER_MISSES} misses (at ${i})`);
  }
  breaker.recordMiss('a');
  assert.equal(breaker.consecutiveMissesFor('a'), BREAKER_MISSES);
  assert.equal(breaker.isTripped('a'), true);
});

test('recordHit resets the streak to 0', () => {
  const breaker = createMissBreaker();
  breaker.recordMiss('a');
  breaker.recordMiss('a');
  breaker.recordHit('a');
  assert.equal(breaker.consecutiveMissesFor('a'), 0);
  assert.equal(breaker.isTripped('a'), false);
});

test('a custom threshold trips earlier', () => {
  const breaker = createMissBreaker(2);
  breaker.recordMiss('a');
  assert.equal(breaker.isTripped('a'), false);
  breaker.recordMiss('a');
  assert.equal(breaker.isTripped('a'), true);
});

test('two misses with an unrelated (human) event in between still count as consecutive (in-memory, not event-derived)', () => {
  // The breaker never reads the event log itself — it only reacts to
  // recordMiss()/recordHit() calls the runner makes. An unrelated event
  // (e.g. a human writing a `decision`, or another item's work.move) that
  // the caller never reports through this API leaves the streak untouched,
  // because there is nothing here that could have seen it.
  const breaker = createMissBreaker(3);
  breaker.recordMiss('a');
  const unrelatedHumanEvent = { seq: 7, ts: new Date().toISOString(), type: 'decision', payload: { text: 'note' }, v: 2 };
  void unrelatedHumanEvent; // never passed to the breaker — it has no read path to see it
  breaker.recordMiss('a');
  assert.equal(breaker.consecutiveMissesFor('a'), 2);
  assert.equal(breaker.isTripped('a'), false);
  breaker.recordMiss('a');
  assert.equal(breaker.isTripped('a'), true);
});

test('zero-arg recordMiss/recordHit/isTripped (no id) keep working exactly as before, keyed to the same sentinel as the consecutiveMisses getter', () => {
  const breaker = createMissBreaker();
  breaker.recordMiss();
  breaker.recordMiss();
  assert.equal(breaker.consecutiveMisses, 2);
  assert.equal(breaker.isTripped(), false);
  breaker.recordMiss();
  assert.equal(breaker.consecutiveMisses, BREAKER_MISSES);
  assert.equal(breaker.isTripped(), true);
  breaker.recordHit();
  assert.equal(breaker.consecutiveMisses, 0);
  assert.equal(breaker.isTripped(), false);
});

test('two different item ids each independently reach their own trip threshold without affecting each other', () => {
  const breaker = createMissBreaker();
  for (let i = 1; i < BREAKER_MISSES; i++) {
    breaker.recordMiss('item-a');
  }
  assert.equal(breaker.consecutiveMissesFor('item-a'), BREAKER_MISSES - 1);
  assert.equal(breaker.isTripped('item-a'), false);

  for (let i = 0; i < BREAKER_MISSES; i++) {
    breaker.recordMiss('item-b');
  }
  assert.equal(breaker.consecutiveMissesFor('item-b'), BREAKER_MISSES);
  assert.equal(breaker.isTripped('item-b'), true);

  // item-a's streak is untouched by item-b's misses.
  assert.equal(breaker.consecutiveMissesFor('item-a'), BREAKER_MISSES - 1);
  assert.equal(breaker.isTripped('item-a'), false);
});

test('an id never explicitly initialized starts at 0/untripped (Map absence is fresh state, not a throw)', () => {
  const breaker = createMissBreaker();
  assert.doesNotThrow(() => breaker.consecutiveMissesFor('never-seen'));
  assert.equal(breaker.consecutiveMissesFor('never-seen'), 0);
  assert.equal(breaker.isTripped('never-seen'), false);
});

// -- purity guard: the lib must never import fs/child_process -------------

test('src/runner/anti-loop.mjs never imports fs or child_process (pure lib prohibition)', () => {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const source = fs.readFileSync(path.join(here, '../../src/runner/anti-loop.mjs'), 'utf8');
  assert.doesNotMatch(source, /from\s+['"](node:)?fs['"]/);
  assert.doesNotMatch(source, /from\s+['"](node:)?child_process['"]/);
  assert.doesNotMatch(source, /require\(['"](node:)?(fs|child_process)['"]\)/);
});
