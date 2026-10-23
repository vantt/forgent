import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createSealCoalescer } from '../../src/event-store/seal-coalescing.mjs';

function harness() {
  const calls = [];
  const store = { seal: (stream, held, options) => calls.push({ stream, held, options }) };
  const clock = { time: 0, timers: [], now: () => clock.time,
    setTimer(fn, ms) { const timer = { fn, at: clock.time + ms, cleared: false }; clock.timers.push(timer); return timer; },
    clearTimer(timer) { timer.cleared = true; },
    advance(ms) { clock.time += ms; for (const t of clock.timers.filter(x => !x.cleared && x.at <= clock.time)) { t.cleared = true; t.fn(); } } };
  return { calls, store, clock, coalescer: createSealCoalescer(clock) };
}

test('outside a long-lived scope every seal request seals at once', () => {
  const { calls, store, coalescer } = harness();
  coalescer.seal(store, 'project', [7], 30);
  coalescer.seal(store, 'project', [7], 30);
  assert.equal(calls.length, 2);
  assert.deepEqual(calls[0], { stream: 'project', held: [7], options: { opportunistic: true } });
  assert.equal(coalescer.pending, false);
});

test('several seal requests in a long-lived scope become one seal when the scope ends', () => {
  const { calls, store, coalescer } = harness();
  coalescer.scope(() => {
    for (let i = 0; i < 5; i += 1) coalescer.seal(store, 'project', [], 30);
    assert.equal(calls.length, 0);
    assert.equal(coalescer.pending, true);
  });
  assert.equal(calls.length, 1);
  assert.equal(coalescer.pending, false);
});

test('an async scope flushes when it settles, a failure included', async () => {
  const { calls, store, coalescer } = harness();
  await coalescer.scope(async () => { coalescer.seal(store, 'project', [], 30); });
  assert.equal(calls.length, 1);
  await assert.rejects(coalescer.scope(async () => { coalescer.seal(store, 'project', [], 30); throw new Error('boom'); }), /boom/);
  assert.equal(calls.length, 2);
  assert.equal(coalescer.active, false);
});

test('a finished unit of work flushes what is pending and the next request starts a new window', () => {
  const { calls, store, clock, coalescer } = harness();
  coalescer.scope(() => {
    coalescer.seal(store, 'project', [], 30);
    coalescer.flush();
    assert.equal(calls.length, 1);
    coalescer.seal(store, 'project', [], 30);
    clock.advance(29_000);
    assert.equal(calls.length, 1, 'the window counts from the first request after the flush');
    clock.advance(1_000);
    assert.equal(calls.length, 2);
  });
  assert.equal(calls.length, 2, 'nothing is left to seal on leaving');
});

test('the seal happens by the configured number of seconds after the first pending request', () => {
  const { calls, store, clock, coalescer } = harness();
  coalescer.scope(() => {
    coalescer.seal(store, 'project', [], 30);
    clock.advance(10_000);
    coalescer.seal(store, 'project', [], 30);
    clock.advance(19_999);
    assert.equal(calls.length, 0);
    clock.advance(1);
    assert.equal(calls.length, 1, 'the timer seals with no further request');
    assert.deepEqual(calls[0].held, []);
  });
  assert.equal(calls.length, 1);
});

test('a request that arrives after the window closed seals with the caller held ranks', () => {
  const { calls, store, clock, coalescer } = harness();
  coalescer.scope(() => {
    coalescer.seal(store, 'project', [], 30);
    clock.time += 31_000; // timers starved: only the request observes the deadline
    coalescer.seal(store, 'project', [60], 30);
    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0].held, [60]);
  });
});

test('a failing seal never throws out of a flush and the pending list is cleared', () => {
  const { store, coalescer } = harness();
  store.seal = () => { throw new Error('seal busy'); };
  coalescer.scope(() => coalescer.seal(store, 'project', [], 30));
  assert.equal(coalescer.pending, false);
});
