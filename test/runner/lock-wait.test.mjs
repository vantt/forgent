import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withLockRetry } from '../../src/runner/lock-wait.mjs';

function lockHeldError(remainingTtlMs, holderPid) {
  return Object.assign(new Error('main checkout locked'), { code: 'lock-held', remainingTtlMs, holderPid });
}

test('withLockRetry: succeeds immediately when the thunk succeeds on the first attempt (no retry needed)', async () => {
  let calls = 0;
  const result = await withLockRetry(() => {
    calls += 1;
    return 'ok';
  });
  assert.equal(result, 'ok');
  assert.equal(calls, 1);
});

test('withLockRetry: retries a lock-held error until the thunk succeeds, within the remainingTtlMs budget', async () => {
  let calls = 0;
  const result = await withLockRetry(() => {
    calls += 1;
    if (calls < 3) throw lockHeldError(5000);
    return 'acquired';
  });
  assert.equal(result, 'acquired');
  assert.equal(calls, 3);
});

test('withLockRetry: exhausts the wait budget and rethrows the last lock-held error, never looping past it', async () => {
  let calls = 0;
  await assert.rejects(
    () => withLockRetry(() => {
      calls += 1;
      throw lockHeldError(900); // short budget -- a couple of backoff ticks max
    }),
    (e) => {
      assert.equal(e.code, 'lock-held');
      assert.match(e.message, /waited \d+ms before giving up/, 'exhausted-budget message must be distinguishable from an immediate-fail message');
      return true;
    },
  );
  assert.ok(calls >= 2, 'must have retried at least once before giving up');
});

// Note: a real `HELD` result always carries `remainingTtlMs > 0` (by
// construction -- `tryAcquireOnce` only returns HELD when age < ttl), and
// the CLI rejects a non-positive `--wait`, so `budgetMs` is always > 0
// whenever `withLockRetry` actually runs (the `--no-wait` bypass skips it
// entirely). A synthetic "budget already exhausted with zero attempts"
// case isn't a reachable state, so it isn't tested here.

test('withLockRetry: never retries a non-lock-held error (e.g. lock-ambiguous), fails on the first attempt', async () => {
  let calls = 0;
  await assert.rejects(
    () => withLockRetry(() => {
      calls += 1;
      throw Object.assign(new Error('ambiguous'), { code: 'lock-ambiguous' });
    }),
    (e) => {
      assert.equal(e.code, 'lock-ambiguous');
      return true;
    },
  );
  assert.equal(calls, 1, 'lock-ambiguous must never be retried');
});

test('withLockRetry: never retries an error with no code at all (e.g. a real merge conflict) -- fails on the first attempt', async () => {
  let calls = 0;
  await assert.rejects(
    () => withLockRetry(() => {
      calls += 1;
      throw new Error('merge conflicted');
    }),
  );
  assert.equal(calls, 1, 'an error with no lock-held signal must never be retried');
});

test('withLockRetry: waitMs tightens the budget below remainingTtlMs', async () => {
  let calls = 0;
  const start = Date.now();
  await assert.rejects(
    () => withLockRetry(() => {
      calls += 1;
      throw lockHeldError(60_000); // remainingTtlMs alone would wait a full minute
    }, { waitMs: 400 }),
  );
  const elapsed = Date.now() - start;
  assert.ok(elapsed < 3000, `waitMs must bound the retry loop well under remainingTtlMs (took ${elapsed}ms)`);
  assert.ok(calls >= 1);
});

// tsk-2rf D2: an explicit waitMs bigger than remainingTtlMs is now the true
// ceiling -- the retry outlasts the snapshot instead of giving up at it.
test('withLockRetry: explicit waitMs extends the wait PAST remainingTtlMs, succeeding once the thunk clears', async () => {
  let calls = 0;
  const result = await withLockRetry(() => {
    calls += 1;
    // remainingTtlMs (300ms) alone would give up well before the thunk
    // clears on the 3rd call -- only an explicit waitMs bigger than that
    // snapshot lets the retry survive long enough to succeed.
    if (calls < 3) throw lockHeldError(300);
    return 'acquired-past-snapshot';
  }, { waitMs: 5000 });
  assert.equal(result, 'acquired-past-snapshot');
  assert.equal(calls, 3);
});

test('withLockRetry: explicit waitMs past remainingTtlMs still gives up once its own (larger) budget is spent', async () => {
  let calls = 0;
  const start = Date.now();
  await assert.rejects(
    () => withLockRetry(() => {
      calls += 1;
      throw lockHeldError(300); // remainingTtlMs snapshot, well under waitMs
    }, { waitMs: 900 }),
    (e) => {
      assert.equal(e.code, 'lock-held');
      assert.match(e.message, /waited \d+ms before giving up/);
      return true;
    },
  );
  const elapsed = Date.now() - start;
  assert.ok(elapsed >= 900, `must have waited out the full explicit waitMs, past the remainingTtlMs snapshot (took ${elapsed}ms)`);
  assert.ok(calls >= 2);
});

test('withLockRetry: prints a progress line on the default (no explicit waitMs) path (tsk-mgb)', async () => {
  const stderrChunks = [];
  const originalWrite = process.stderr.write;
  process.stderr.write = (chunk) => {
    stderrChunks.push(String(chunk));
    return true;
  };
  try {
    await assert.rejects(
      () => withLockRetry(() => {
        throw lockHeldError(900); // long enough for at least one real backoff sleep
      }),
    );
  } finally {
    process.stderr.write = originalWrite;
  }
  assert.ok(
    stderrChunks.some((line) => /still waiting on main-checkout lock/.test(line)),
    'the default (no --wait) path must still print at least one progress line during a real backoff wait',
  );
});

test('withLockRetry: does not busy-spin in the BOUNDARY_GRACE_MS tail -- bounded call count even for a tiny budget (tsk-mgb)', async () => {
  let calls = 0;
  await assert.rejects(
    () => withLockRetry(() => {
      calls += 1;
      throw lockHeldError(10); // tiny budget -- a negative/near-zero delay busy-spins hundreds of times in the grace tail
    }),
  );
  assert.ok(calls <= 10, `must not busy-spin in the grace-window tail (made ${calls} calls for a 10ms budget)`);
});

test('withLockRetry: renders self qualifier when numeric holderPid equals process.pid (tsk-6uc)', async () => {
  const stderrChunks = [];
  const originalWrite = process.stderr.write;
  process.stderr.write = (chunk) => {
    stderrChunks.push(String(chunk));
    return true;
  };
  try {
    await assert.rejects(
      () => withLockRetry(() => {
        throw lockHeldError(900, process.pid);
      }),
    );
  } finally {
    process.stderr.write = originalWrite;
  }
  assert.ok(
    stderrChunks.some((line) => /still waiting on main-checkout lock.*likely your own session's other in-flight call/.test(line)),
    'numeric holderPid equal to process.pid must render the self qualifier',
  );
});

test('withLockRetry: renders other qualifier when numeric holderPid is different from process.pid (tsk-6uc)', async () => {
  const stderrChunks = [];
  const originalWrite = process.stderr.write;
  process.stderr.write = (chunk) => {
    stderrChunks.push(String(chunk));
    return true;
  };
  try {
    await assert.rejects(
      () => withLockRetry(() => {
        throw lockHeldError(900, process.pid + 99999);
      }),
    );
  } finally {
    process.stderr.write = originalWrite;
  }
  assert.ok(
    stderrChunks.some((line) => /still waiting on main-checkout lock.*a different pid\/session/.test(line)),
    'numeric holderPid different from process.pid must render the other qualifier',
  );
});

test('withLockRetry: renders self qualifier when string holderPid equals env session id (tsk-6uc)', async () => {
  const stderrChunks = [];
  const originalWrite = process.stderr.write;
  const originalEnvSession = process.env.FGOS_SESSION_ID;
  const testSessionId = 'test-session-tsk-6uc';
  process.env.FGOS_SESSION_ID = testSessionId;
  process.stderr.write = (chunk) => {
    stderrChunks.push(String(chunk));
    return true;
  };
  try {
    await assert.rejects(
      () => withLockRetry(() => {
        throw lockHeldError(900, testSessionId);
      }),
    );
  } finally {
    process.stderr.write = originalWrite;
    if (originalEnvSession !== undefined) {
      process.env.FGOS_SESSION_ID = originalEnvSession;
    } else {
      delete process.env.FGOS_SESSION_ID;
    }
  }
  assert.ok(
    stderrChunks.some((line) => /still waiting on main-checkout lock.*likely your own session's other in-flight call/.test(line)),
    'string holderPid matching env session id must render the self qualifier',
  );
});

