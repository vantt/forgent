import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { mintAttemptWriterId, WriterIdentityError } from '../../src/util/session-identity.mjs';
import { workerBaseEnv } from '../../src/runner/dispatch/adapters.mjs';
import { computeSha256Digest } from '../../src/runner/dispatch/proof-helpers.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const HOST_BIN = process.env.FGOS_HOST_BIN;
const vectors = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'packages/session-identity/contracts/vectors/attempt-writer-id.v1.json'), 'utf8'),
);

function attemptIdOf(c) {
  return c.expand ? c.expand.char.repeat(c.expand.count) : c.attemptId;
}

const needsHost = { skip: HOST_BIN ? false : 'FGOS_HOST_BIN is not set' };

test('every shared vector mints to the same writer id through the Rust route', needsHost, () => {
  for (const c of vectors.cases) {
    const attemptId = attemptIdOf(c);
    if (c.error) {
      assert.throws(
        () => mintAttemptWriterId(attemptId, { bin: HOST_BIN }),
        (err) => err instanceof WriterIdentityError && err.code === c.error,
        c.name,
      );
    } else {
      const expected = c.expand ? `att-${attemptId}` : c.writerId;
      assert.equal(mintAttemptWriterId(attemptId, { bin: HOST_BIN }), expected, c.name);
    }
  }
});

test('workerBaseEnv drops all three session ids of the parent and keeps the rest', () => {
  const env = workerBaseEnv({
    PATH: '/usr/bin',
    FGOS_SESSION_ID: 'parent-session',
    CLAUDE_CODE_SESSION_ID: 'claude-parent',
    CODEX_THREAD_ID: 'codex-parent',
  });
  assert.equal(env.FGOS_SESSION_ID, undefined);
  assert.equal(env.CLAUDE_CODE_SESSION_ID, undefined);
  assert.equal(env.CODEX_THREAD_ID, undefined);
  assert.equal(env.PATH, '/usr/bin');
});

test('workerBaseEnv drops an empty session id too, so it cannot shadow the minted one', () => {
  const env = workerBaseEnv({ PATH: '/usr/bin', FGOS_SESSION_ID: '' });
  assert.equal('FGOS_SESSION_ID' in env, false);
});

test('resuming the same attempt gives the same writer id and the same env digest', needsHost, () => {
  const build = () => {
    const writerId = mintAttemptWriterId('att_asgn-demo_01_7f3a', { bin: HOST_BIN });
    return { writerId, envDigest: computeSha256Digest({ ...workerBaseEnv({ PATH: '/usr/bin' }), FGOS_SESSION_ID: writerId }) };
  };
  const first = build();
  const second = build();
  assert.equal(first.writerId, second.writerId);
  assert.equal(first.envDigest, second.envDigest);
});
