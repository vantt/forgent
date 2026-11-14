import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { launcherEnv, mintAttemptWriterId, WriterIdentityError } from '../../src/util/session-identity.mjs';
import { workerBaseEnv } from '../../src/runner/dispatch/adapters.mjs';
import { computeSha256Digest } from '../../src/native/proof-helpers.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const HOST_BIN = process.env.FGOS_HOST_BIN;
const vectors = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'packages/identity/contracts/vectors/attempt-writer-id.v1.json'), 'utf8'),
);

function attemptIdOf(c) {
  return c.expand ? c.expand.char.repeat(c.expand.count) : c.attemptId;
}

const needsHost = { skip: HOST_BIN ? false : 'FGOS_HOST_BIN is not set' };

test('every shared vector mints to the same writer id through the door', needsHost, () => {
  for (const c of vectors.cases) {
    const attemptId = attemptIdOf(c);
    if (c.error) {
      assert.throws(
        () => mintAttemptWriterId(attemptId),
        (err) => err instanceof WriterIdentityError && err.code === c.error,
        c.name,
      );
    } else {
      const expected = c.expand ? `att-${attemptId}` : c.writerId;
      assert.equal(mintAttemptWriterId(attemptId), expected, c.name);
    }
  }
});

// What a worker's base environment drops (every parent session id, an empty `FGOS_SESSION_ID` too) is proved once, by the
// allowlist test in test/runner/dispatch/worker-env-case-context.test.mjs.

test('resuming the same attempt gives the same writer id and the same env digest', needsHost, () => {
  const build = () => {
    const writerId = mintAttemptWriterId('att_asgn-demo_01_7f3a');
    return { writerId, envDigest: computeSha256Digest({ ...workerBaseEnv({ PATH: '/usr/bin' }), FGOS_SESSION_ID: writerId }) };
  };
  const first = build();
  const second = build();
  assert.equal(first.writerId, second.writerId);
  assert.equal(first.envDigest, second.envDigest);
});

test('launcherEnv refuses a non-string or NUL id before the door and maps an empty id to its own error', needsHost, () => {
  for (const [id, parent] of [[42], ['a\0b'], ['att-1', 7], ['att-1', 'p\0']]) {
    assert.throws(() => launcherEnv(id, parent), (err) => err instanceof WriterIdentityError && err.code === 'invalid-writer-id');
  }
  assert.throws(() => launcherEnv(''), (err) => err instanceof WriterIdentityError && err.code === 'empty-writer-id');
  const answer = launcherEnv('att-1', 'ctl-1');
  assert.deepEqual(Object.fromEntries(answer.set), { FGOS_SESSION_ID: 'att-1', FGOS_PARENT_WRITER_ID: 'ctl-1' });
});
