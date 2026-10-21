// The Node client against the real host binary (FGOS_HOST_BIN, built from this
// checkout) and the fake herdr script the Rust driver tests use: every port
// operation answers as the contract says, refusals come back untouched, and a
// route problem throws a named error.
import '../helpers/process-tmp-root.mjs';
import { test, after, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createTerminalControl, TerminalControlError } from '../../src/terminal-control/client.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const HOST_BIN = process.env.FGOS_HOST_BIN;
const FAKE_HERDR = path.join(REPO_ROOT, 'packages/terminal-control/rust/tests/fixtures/herdr/fake-herdr.sh');

const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-tc-client-'));
const socketPath = path.join(scratch, 'herdr.sock');
const log = path.join(scratch, 'herdr.log');
let server;

before(async () => {
  assert.ok(HOST_BIN && fs.existsSync(HOST_BIN), `set FGOS_HOST_BIN to a host built from this checkout: ${HOST_BIN}`);
  process.env.FGOS_STATE_ROOT = path.join(scratch, 'state');
  server = net.createServer().listen(socketPath);
  await new Promise((resolve) => server.once('listening', resolve));
});

after(() => {
  server?.close();
  fs.rmSync(scratch, { recursive: true, force: true });
});

const herdrEnv = { FAKE_HERDR_LOG: log, FAKE_HERDR_SOCKET: socketPath, HERDR_SOCKET_PATH: socketPath };
const client = (extra = {}) => createTerminalControl({ hostBin: HOST_BIN, herdrBin: FAKE_HERDR, env: herdrEnv, ...extra });
const calls = () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').split('\n').filter(Boolean).map((l) => l.replace(/\t+$/, '').split('\t').join(' ')) : []);

// Only the shell is in the pane's foreground, so a close is provably safe.
const shellForeground = { env: { ...herdrEnv, FAKE_HERDR_FOREGROUND: 'shell' } };

// The one wiring proof of the port: every operation reaches the Rust core through the route and
// comes back as the contract says. What each operation decides (close guards, launch-once,
// capability probing, the incarnation owner) is owned by the crate's own tests.
test('every operation of the port answers through the route', () => {
  const tc = client(shellForeground);
  const display = { label: 'client-route', role: 'worker' };

  const capabilities = tc.capabilities();
  assert.equal(capabilities.result, 'capabilities');
  assert.equal(capabilities.driver, 'herdr');
  for (const name of ['tab.create', 'pane.split', 'pane.close', 'layout.geometry', 'server.incarnation']) {
    assert.ok(capabilities.capabilities.includes(name), name);
  }
  assert.equal(capabilities.serverIncarnation.endpoint, socketPath);
  assert.equal(capabilities.serverIncarnation.pid, process.pid);

  const slot = tc.allocate({ key: 'k-one', groupKey: 'g-one', display });
  assert.equal(slot.result, 'slot');
  assert.equal(slot.origin, 'allocated');
  assert.match(slot.slot.paneId, /^wS:p/);
  assert.deepEqual(tc.allocate({ key: 'k-one', groupKey: 'g-one', display }), slot);

  const attached = tc.attach({ key: 'k-attached', pane: 'wS:p552', display });
  assert.equal(attached.result, 'slot');
  assert.equal(attached.origin, 'attached');

  assert.deepEqual(tc.label({ key: 'k-one', display: { label: 'renamed' } }), { result: 'ok' });
  // Only the pane's shell holds the foreground: nothing is typed, and the route names why.
  const refused = tc.send({ key: 'k-one', text: 'hello', submit: true });
  assert.equal(refused.result, 'foreground-not-agent');
  assert.match(refused.reason, /shell/);
  assert.ok(!calls().some((c) => c.startsWith('pane send-text') || c.startsWith('agent prompt')), 'nothing reached the pane');
  assert.equal(tc.read({ key: 'k-one', lines: 5 }).screen, 'line one\nline two\n');

  const inspection = tc.inspect({ key: 'k-one' });
  assert.equal(inspection.result, 'inspection');
  assert.equal(inspection.pane, 'live');

  const scan = tc.reconcileScan({ olderThanMs: 0 });
  assert.equal(scan.result, 'scan');
  assert.ok(Array.isArray(scan.findings));

  // The fake herdr reports a foreground process that does not exist, so the root is never
  // identified: the route answers not-started, and the launch request reached herdr once.
  const launcher = client({ config: { launchIdentifyTimeoutMs: 200 } });
  assert.equal(launcher.allocate({ key: 'k-launch', groupKey: 'g-launch', display }).result, 'slot');
  const runsBefore = calls().filter((c) => c.startsWith('pane run')).length;
  const launched = launcher.launch({ key: 'k-launch', launchSpec: { command: 'sleep', args: ['300'], cwd: scratch, env: {} } });
  assert.equal(launched.result, 'not-started');
  assert.equal(calls().filter((c) => c.startsWith('pane run')).length, runsBefore + 1);

  assert.deepEqual(tc.release({ key: 'k-attached', disposition: 'retain', until: null }), { result: 'released', disposition: 'retain' });
  assert.deepEqual(tc.release({ key: 'k-one', disposition: 'close' }), { result: 'released', disposition: 'close' });
  assert.ok(calls().some((c) => c.startsWith('pane close')), 'the allocated pane was closed');
});

test('unknown keys and a missing herdr come back as results, not exceptions', () => {
  const unknown = client().read({ key: 'no-such-key' });
  assert.equal(unknown.result, 'unknown');
  assert.match(unknown.reason, /no allocation record/);

  const absent = createTerminalControl({ hostBin: HOST_BIN, herdrBin: path.join(scratch, 'no-herdr'), env: herdrEnv });
  const refused = absent.allocate({ key: 'k-absent', groupKey: 'g-absent', display: { label: 'x' } });
  assert.equal(refused.result, 'unsupported');
});

test('a bad request or a wrong protocol throws a named error', () => {
  assert.throws(() => client().send({ key: 'k-one' }), (e) => e instanceof TerminalControlError && e.code === 'terminal-control-route-usage');
  assert.throws(() => client().read({ key: 'k-one', source: 'nope' }), (e) => e.code === 'terminal-control-route-usage');
  assert.throws(() => client().allocate({ key: 'k' }), (e) => e.code === 'terminal-control-route-usage');
  assert.throws(() => createTerminalControl({ hostBin: path.join(scratch, 'missing-host') }).capabilities(), (e) => e.code === 'terminal-control-no-host-binary');
  const direct = spawnSync(HOST_BIN, ['internal', 'terminal-control', 'capabilities', '--protocol', '2', '--json'], { encoding: 'utf8' });
  assert.equal(direct.status, 3);
  assert.equal(JSON.parse(direct.stdout).code, 'host-version-mismatch');
});

test('read through the route is fast enough to poll (p50/p95 over 200 calls)', () => {
  const tc = client();
  tc.allocate({ key: 'k-perf', groupKey: 'g-perf', display: { label: 'perf' } });
  const samples = [];
  for (let i = 0; i < 200; i += 1) {
    const start = process.hrtime.bigint();
    assert.equal(tc.read({ key: 'k-perf', lines: 5 }).result, 'screen');
    samples.push(Number(process.hrtime.bigint() - start) / 1e6);
  }
  samples.sort((a, b) => a - b);
  const p50 = samples[100];
  const p95 = samples[189];
  console.log(`read via route over fake herdr: p50 ${p50.toFixed(1)} ms, p95 ${p95.toFixed(1)} ms`);
  assert.ok(p95 < 1000, `p95 ${p95} ms`);
});
