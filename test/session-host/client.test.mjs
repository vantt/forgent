// The one wiring proof of the Session Host: the Node client reaches the Rust crate through the
// internal route of the real host binary (FGOS_HOST_BIN, built from this checkout) and every
// operation comes back as the contract says. What each operation decides (the refusals, the
// placement rules) is owned by the crate's own tests.
import '../helpers/process-tmp-root.mjs';
import { test, after, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createSessionHost, SessionHostError } from '../../src/session-host/client.mjs';

const HOST_BIN = process.env.FGOS_HOST_BIN;
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-sh-client-'));

before(() => {
  assert.ok(HOST_BIN && fs.existsSync(HOST_BIN), `set FGOS_HOST_BIN to a host built from this checkout: ${HOST_BIN}`);
  process.env.FGOS_STATE_ROOT = path.join(scratch, 'state');
});

after(() => {
  fs.rmSync(scratch, { recursive: true, force: true });
});

test('a refusal of the port comes back as an answer, never thrown', () => {
  const host = createSessionHost({ hostBin: HOST_BIN });
  const opened = host.open({ host: 'terminal', key: 'bad key', cwd: scratch });
  assert.deepEqual([opened.result, opened.code], ['unknown', 'placement-unknown']);
  const launched = host.launch({ host: 'terminal', key: 'bad key' }, { command: 'true', cwd: scratch });
  assert.deepEqual([launched.result, launched.code], ['unknown', 'placement-unknown']);
  const retired = host.retire({ host: 'terminal', key: 'bad key' }, 'close');
  assert.deepEqual([retired.result, retired.code], ['unknown', 'placement-unknown']);
  assert.equal(host.alive({ host: 'terminal', key: 'bad key' }).result, 'unknown');
});

test('a bad request, the removed screenless host included, throws a named error', () => {
  const host = createSessionHost({ hostBin: HOST_BIN });
  for (const call of [
    () => host.alive({ host: 'direct', key: 'client-worker' }),
    () => host.open({ host: 'direct', key: 'client-open', cwd: scratch }),
    () => host.launch({ host: 'terminal', key: 'client-open' }, { cwd: scratch }),
  ]) assert.throws(call, (err) => err instanceof SessionHostError && err.code === 'session-host-route-usage');
});
