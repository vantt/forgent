import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWriteQueue } from '../../src/runner/write-queue.mjs';

// Pure lib — no fs, no mkdtemp, no `.fgos/` writes anywhere in this file.
// Every transaction body below is an in-memory function that only pushes
// markers into a shared array; the queue itself has no store/state
// dependency (see write-queue.mjs's own PURE module doc).

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * A transaction body that yields the event loop at multiple internal await
 * points before recording its exit — the exact shape D16 warns about: if
 * the queue did nothing, two of these run concurrently would interleave
 * their 'enter'/'mid'/'exit' markers in the shared `log`.
 */
function makeTransaction(log, id, { failAt } = {}) {
  return async () => {
    log.push(`${id}:enter`);
    await delay(5);
    log.push(`${id}:mid1`);
    await new Promise((resolve) => setImmediate(resolve));
    log.push(`${id}:mid2`);
    await delay(5);
    if (failAt === 'end') {
      log.push(`${id}:exit-fail`);
      throw new Error(`boom-${id}`);
    }
    log.push(`${id}:exit`);
    return id;
  };
}

/**
 * Assert that `log` never shows two different transaction ids "open"
 * (entered but not yet exited) at the same time. Walks the recorded marker
 * sequence and fails the moment a second id's `enter` appears before the
 * currently-open id's terminal marker (`exit` or `exit-fail`).
 */
function assertNeverInterleaved(log) {
  let openId = null;
  for (const marker of log) {
    const [id, phase] = marker.split(':');
    if (phase === 'enter') {
      assert.equal(openId, null, `expected no transaction open when ${marker} recorded, but ${openId} was still open`);
      openId = id;
    } else if (phase === 'exit' || phase === 'exit-fail') {
      assert.equal(openId, id, `expected ${id} to be the open transaction at ${marker}, but ${openId} was open`);
      openId = null;
    } else {
      // mid1/mid2: must belong to the currently-open transaction.
      assert.equal(openId, id, `expected ${id} to be the open transaction at ${marker}, but ${openId} was open`);
    }
  }
  assert.equal(openId, null, 'expected every transaction to have exited by the end of the log');
}

test('createWriteQueue serializes N (>=3) concurrently-submitted transactions with zero interleaving', async () => {
  const queue = createWriteQueue();
  const log = [];
  const ids = ['a', 'b', 'c', 'd'];

  // Submit all four concurrently (no awaiting between submissions) so the
  // queue — not call-site ordering — is what is under test.
  const results = await Promise.all(ids.map((id) => queue.enqueue(makeTransaction(log, id))));

  assert.deepEqual(results, ids, 'each enqueue() resolves with its own transaction result, in submission order');
  assertNeverInterleaved(log);

  // FIFO: the four transactions' enter markers appear in submission order.
  const enterOrder = log.filter((m) => m.endsWith(':enter')).map((m) => m.split(':')[0]);
  assert.deepEqual(enterOrder, ids, 'transactions run in FIFO submission order');
});

test('createWriteQueue never interleaves even when later submissions are staggered mid-flight', async () => {
  const queue = createWriteQueue();
  const log = [];

  const p1 = queue.enqueue(makeTransaction(log, 'x'));
  // Submit y and z after a microtask/short delay, while x is still running
  // its own internal awaits — the queue must still fully serialize them.
  await delay(1);
  const p2 = queue.enqueue(makeTransaction(log, 'y'));
  const p3 = queue.enqueue(makeTransaction(log, 'z'));

  await Promise.all([p1, p2, p3]);
  assertNeverInterleaved(log);
});

test('a rejecting transaction does not block or corrupt the queue for transactions submitted after it', async () => {
  const queue = createWriteQueue();
  const log = [];

  const failing = queue.enqueue(makeTransaction(log, 'fail1', { failAt: 'end' }));
  const after1 = queue.enqueue(makeTransaction(log, 'after1'));
  const after2 = queue.enqueue(makeTransaction(log, 'after2'));

  await assert.rejects(failing, /boom-fail1/);
  const [after1Result, after2Result] = await Promise.all([after1, after2]);

  assert.equal(after1Result, 'after1');
  assert.equal(after2Result, 'after2');
  assert.ok(log.includes('after1:enter') && log.includes('after1:exit'), 'after1 ran to completion');
  assert.ok(log.includes('after2:enter') && log.includes('after2:exit'), 'after2 ran to completion');
  assertNeverInterleaved(log);
});

test('multiple rejecting transactions in a row still leave the queue usable', async () => {
  const queue = createWriteQueue();
  const log = [];

  const r1 = queue.enqueue(makeTransaction(log, 'r1', { failAt: 'end' }));
  const r2 = queue.enqueue(makeTransaction(log, 'r2', { failAt: 'end' }));
  const survivor = queue.enqueue(makeTransaction(log, 'survivor'));

  await assert.rejects(r1, /boom-r1/);
  await assert.rejects(r2, /boom-r2/);
  assert.equal(await survivor, 'survivor');
  assertNeverInterleaved(log);
});

test('size() reflects queued/running transactions and returns to 0 once all settle', async () => {
  const queue = createWriteQueue();
  assert.equal(queue.size(), 0, 'empty queue starts at size 0');

  const log = [];
  const p1 = queue.enqueue(makeTransaction(log, 'a'));
  const p2 = queue.enqueue(makeTransaction(log, 'b'));
  assert.ok(queue.size() >= 1, 'size reflects at least the in-flight/queued transactions right after submission');

  await Promise.all([p1, p2]);
  assert.equal(queue.size(), 0, 'size returns to 0 once every submitted transaction has settled');
});

test('enqueue() resolves with a synchronous (non-promise-returning) transaction result too', async () => {
  const queue = createWriteQueue();
  const result = await queue.enqueue(() => 42);
  assert.equal(result, 42);
});
