import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MAX_VISITS, BREAKER_MISSES, visitCount, hasExceededMaxVisits, createMissBreaker } from '../../src/runner/anti-loop.mjs';

// Pure lib — every event array here is a literal built in-memory; no fs, no
// mkdtemp, no `.fgos/` writes anywhere in this file.

function move(id, to, seq) {
  return { seq, ts: new Date(2026, 0, seq).toISOString(), type: 'work.move', payload: { id, from: 'x', to }, v: 2 };
}

test('visitCount is 0 on an empty log', () => {
  assert.equal(visitCount([], 'a'), 0);
});

test('visitCount counts every entry into doing for the given id', () => {
  const events = [
    move('a', 'doing', 1),
    move('a', 'blocked', 2),
    move('a', 'doing', 3),
    move('a', 'proposed', 4),
    move('a', 'todo', 5),
    move('a', 'doing', 6),
  ];
  assert.equal(visitCount(events, 'a'), 3);
});

test('visitCount ignores moves for other ids', () => {
  const events = [move('a', 'doing', 1), move('b', 'doing', 2), move('b', 'doing', 3)];
  assert.equal(visitCount(events, 'a'), 1);
  assert.equal(visitCount(events, 'b'), 2);
});

test('visitCount ignores non-"doing" targets and non-work.move event types', () => {
  const events = [
    move('a', 'blocked', 1),
    move('a', 'proposed', 2),
    { seq: 3, ts: new Date().toISOString(), type: 'decision', payload: { text: 'unrelated' }, v: 2 },
  ];
  assert.equal(visitCount(events, 'a'), 0);
});

test('visitCount counts a human-authored move exactly the same as any other (no privileged writer)', () => {
  // The current event shape carries no "who wrote this" field, so a
  // human's manual re-dispatch through the CLI produces the identical
  // work.move{to:'doing'} shape a runner-driven one would — this test
  // locks that no distinction is (or can be) made.
  const events = [move('a', 'doing', 1)];
  assert.equal(visitCount(events, 'a'), 1);
});

test('visitCount defensive guards: non-array events / missing id never throw', () => {
  assert.doesNotThrow(() => visitCount(undefined, 'a'));
  assert.equal(visitCount(undefined, 'a'), 0);
  assert.equal(visitCount([move('a', 'doing', 1)], undefined), 0);
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

// -- createMissBreaker: in-memory per-run circuit breaker ------------------

test('a fresh breaker starts untripped with zero consecutive misses', () => {
  const breaker = createMissBreaker();
  assert.equal(breaker.consecutiveMisses, 0);
  assert.equal(breaker.isTripped(), false);
});

test('recordMiss increments the streak; isTripped flips at BREAKER_MISSES (boundary)', () => {
  const breaker = createMissBreaker();
  for (let i = 1; i < BREAKER_MISSES; i++) {
    breaker.recordMiss();
    assert.equal(breaker.isTripped(), false, `should not trip before ${BREAKER_MISSES} misses (at ${i})`);
  }
  breaker.recordMiss();
  assert.equal(breaker.consecutiveMisses, BREAKER_MISSES);
  assert.equal(breaker.isTripped(), true);
});

test('recordHit resets the streak to 0', () => {
  const breaker = createMissBreaker();
  breaker.recordMiss();
  breaker.recordMiss();
  breaker.recordHit();
  assert.equal(breaker.consecutiveMisses, 0);
  assert.equal(breaker.isTripped(), false);
});

test('a custom threshold trips earlier', () => {
  const breaker = createMissBreaker(2);
  breaker.recordMiss();
  assert.equal(breaker.isTripped(), false);
  breaker.recordMiss();
  assert.equal(breaker.isTripped(), true);
});

test('two misses with an unrelated (human) event in between still count as consecutive (in-memory, not event-derived)', () => {
  // The breaker never reads the event log itself — it only reacts to
  // recordMiss()/recordHit() calls the runner makes. An unrelated event
  // (e.g. a human writing a `decision`, or another item's work.move) that
  // the caller never reports through this API leaves the streak untouched,
  // because there is nothing here that could have seen it.
  const breaker = createMissBreaker(3);
  breaker.recordMiss();
  const unrelatedHumanEvent = { seq: 7, ts: new Date().toISOString(), type: 'decision', payload: { text: 'note' }, v: 2 };
  void unrelatedHumanEvent; // never passed to the breaker — it has no read path to see it
  breaker.recordMiss();
  assert.equal(breaker.consecutiveMisses, 2);
  assert.equal(breaker.isTripped(), false);
  breaker.recordMiss();
  assert.equal(breaker.isTripped(), true);
});

// -- purity guard: the lib must never import fs/child_process -------------

test('src/runner/anti-loop.mjs never imports fs or child_process (pure lib prohibition)', () => {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const source = fs.readFileSync(path.join(here, '../../src/runner/anti-loop.mjs'), 'utf8');
  assert.doesNotMatch(source, /from\s+['"](node:)?fs['"]/);
  assert.doesNotMatch(source, /from\s+['"](node:)?child_process['"]/);
  assert.doesNotMatch(source, /require\(['"](node:)?(fs|child_process)['"]\)/);
});
