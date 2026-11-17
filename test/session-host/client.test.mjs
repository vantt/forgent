// The one wiring proof of the Session Host: the Node client reaches the Rust crate through the
// internal route of the real host binary (FGOS_HOST_BIN, built from this checkout) and every
// operation comes back as the contract says. What each operation decides (the refusals, the
// delivery of an opening, SIGTERM before SIGKILL) is owned by the crate's own tests.
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

test('each operation answers with the contract shape through the route on the direct host', { skip: process.platform === 'win32' }, () => {
  const host = createSessionHost({ hostBin: HOST_BIN, graceMs: 1_000 });
  const placement = { host: 'direct', key: 'client-worker' };

  const started = host.start({ host: 'direct', key: 'client-worker', cwd: scratch, command: 'true' });
  assert.deepEqual([started.result, started.placement], ['placed', placement]);
  assert.ok(['live', 'gone', 'unknown'].includes(host.alive(placement).result));
  const fronted = host.front(placement);
  assert.deepEqual([fronted.result, fronted.code], ['unsupported', 'host-unsupported-here']);
  assert.equal(host.retire(placement, 'close').result, 'retired');
});

test('a refusal comes back as an answer and a bad request throws a named error', () => {
  const host = createSessionHost({ hostBin: HOST_BIN });
  const head = host.start({ host: 'direct', key: 'client-head', cwd: scratch, command: 'claude', role: 'head' });
  assert.deepEqual([head.result, head.code], ['unsupported', 'head-needs-interactive-host']);

  assert.throws(() => host.start({ host: 'direct', key: 'client-head', command: 'claude' }), (err) => err instanceof SessionHostError && err.code === 'session-host-route-usage');
});

test('open and launch reach the route and a screenless placement is refused for both', () => {
  const host = createSessionHost({ hostBin: HOST_BIN });
  const opened = host.open({ host: 'direct', key: 'client-open', cwd: scratch });
  assert.deepEqual([opened.result, opened.code], ['unsupported', 'host-unsupported-here']);
  const launched = host.launch({ host: 'direct', key: 'client-open' }, { command: 'true', cwd: scratch });
  assert.deepEqual([launched.result, launched.code], ['unsupported', 'host-unsupported-here']);
  assert.throws(() => host.launch({ host: 'terminal', key: 'client-open' }, { cwd: scratch }), (err) => err instanceof SessionHostError && err.code === 'session-host-route-usage');
});
