import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withLockRetry, DEFAULT_LOCK_WAIT_MS } from '../../src/runner/lock-wait.mjs';

// withLockRetry hands the wait budget to the lock door; the door's own
// acquire does the waiting (covered against real locks and real processes in
// merge-target-slot-multiprocess.test.mjs).

test('withLockRetry calls the function once with the default wait budget when none was given', async () => {
  const seen = [];
  const result = await withLockRetry((ctx) => {
    seen.push(ctx);
    return 'ok';
  });
  assert.equal(result, 'ok');
  assert.deepEqual(seen, [{ waitMs: DEFAULT_LOCK_WAIT_MS }]);
});

test('withLockRetry passes an explicit waitMs through as the wall-clock ceiling', async () => {
  const seen = [];
  await withLockRetry((ctx) => { seen.push(ctx); }, { waitMs: 3000 });
  assert.deepEqual(seen, [{ waitMs: 3000 }]);
});

test('withLockRetry never retries: a lock-held error from the door reaches the caller unchanged after one call', async () => {
  let calls = 0;
  const held = Object.assign(new Error('merge slot of "main" is held by another process (pid 42) after waiting 3000 ms'), { code: 'lock-held' });
  await assert.rejects(
    () => withLockRetry(() => {
      calls += 1;
      throw held;
    }, { waitMs: 3000 }),
    (err) => err === held,
  );
  assert.equal(calls, 1, 'the acquire already waited; repeating the whole call would redo its work');
});

test('withLockRetry lets any other error through on the first call', async () => {
  let calls = 0;
  await assert.rejects(
    () => withLockRetry(() => {
      calls += 1;
      throw new Error('merge conflicted');
    }),
    /merge conflicted/,
  );
  assert.equal(calls, 1);
});

test('withLockRetry returns what the function resolves to, awaiting an async function', async () => {
  assert.equal(await withLockRetry(async () => 'later', { waitMs: 10 }), 'later');
});
