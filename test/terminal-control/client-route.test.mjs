// The Node client and the route against the real host binary (FGOS_HOST_BIN,
// built from this checkout) and the fake herdr script the Rust driver tests use:
// every port operation answers as the contract says, refusals come back
// untouched, and a route problem throws a named error. The client carries only
// the operations a Node caller uses; `send`, `launch` and `label` are reached
// through the route directly, as the terminal skill does.
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
import { DEFAULT_TERMINAL_CONFIG } from '../../src/terminal-control/config.mjs';

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

// The caller of every route call is this process, so its shell is the pane's shell: attach takes the pane.
const herdrEnv = { FAKE_HERDR_LOG: log, FAKE_HERDR_SOCKET: socketPath, HERDR_SOCKET_PATH: socketPath, FAKE_HERDR_SHELL_PID: String(process.pid) };

/** One route call with no client in between: the answer line, flattened as the contract says. */
function route(op, request, { env = herdrEnv, config } = {}) {
  const input = JSON.stringify({ v: 1, driver: 'herdr', herdrBin: FAKE_HERDR, env, ...(config ? { config } : {}), request });
  const res = spawnSync(HOST_BIN, ['internal', 'terminal-control', op, '--protocol', '1', '--json'], { input, encoding: 'utf8', env: { ...process.env } });
  assert.equal(res.status, 0, res.stderr);
  return JSON.parse(res.stdout);
}
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
  assert.equal(capabilities.endpoint.socketPath, socketPath, 'the socket the caller named is the endpoint');
  assert.match(route('capabilities', {}, { env: { HERDR_SESSION: 'confined-1', HOME: '/home/op' } }).endpoint.socketPath, /\/\.config\/herdr\/sessions\/confined-1\/herdr\.sock$/, 'a named session answers its own socket');
  // The core's own defaults and policy registry are what setup writes and the contract names.
  const { layout, allocationGraceMs } = DEFAULT_TERMINAL_CONFIG;
  assert.deepEqual(
    { minCols: layout.minCols, minRows: layout.minRows, maxPanesPerTab: layout.maxPanesPerTab, policy: layout.policy, allocationGraceMs },
    { minCols: capabilities.defaults.minCols, minRows: capabilities.defaults.minRows, maxPanesPerTab: capabilities.defaults.maxPanesPerTab, policy: capabilities.defaults.policy, allocationGraceMs: capabilities.defaults.allocationGraceMs },
  );
  const placement = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'packages/terminal-control/contracts/placement-policy.v1.json'), 'utf8'));
  assert.deepEqual(capabilities.policies, placement.registry.names);
  assert.equal(capabilities.defaults.policy, placement.registry.default);

  const slot = tc.allocate({ key: 'k-one', groupKey: 'g-one', display });
  assert.equal(slot.result, 'slot');
  assert.equal(slot.origin, 'allocated');
  assert.match(slot.slot.paneId, /^wS:p/);
  assert.deepEqual(tc.allocate({ key: 'k-one', groupKey: 'g-one', display }), slot);

  const attached = tc.attach({ key: 'k-attached', pane: 'wS:p552', display });
  assert.equal(attached.result, 'slot');
  assert.equal(attached.origin, 'attached');
  const foreign = route('attach', { key: 'k-foreign', pane: 'wS:p553' }, { env: { ...herdrEnv, FAKE_HERDR_SHELL_PID: '999999999' } });
  assert.equal(foreign.result, 'unknown');
  assert.match(foreign.reason, /^pane-not-owned: /, 'a pane whose shell is not an ancestor of the caller is refused by name');

  assert.equal(route('label', { key: 'k-one', display: { label: 'renamed' } }, shellForeground).result, 'ok');
  // Only the pane's shell holds the foreground: nothing is typed, and the route names why.
  const refused = route('send', { key: 'k-one', text: 'hello', submit: true }, shellForeground);
  assert.equal(refused.result, 'foreground-not-agent');
  assert.match(refused.reason, /shell/);
  assert.equal(tc.read({ key: 'k-one', lines: 5 }).screen, 'line one\nline two\n');

  const inspection = tc.inspect({ key: 'k-one' });
  assert.equal(inspection.result, 'inspection');
  assert.equal(inspection.pane, 'live');

  const scan = tc.reconcileScan({ olderThanMs: 0 });
  assert.equal(scan.result, 'scan');
  assert.ok(Array.isArray(scan.findings));

  // The fake herdr's shell never proves it runs commands, so the route answers not-started and names why.
  const launcher = client({ config: { launchIdentifyTimeoutMs: 200, shellReadyTimeoutMs: 200 } });
  assert.equal(launcher.allocate({ key: 'k-launch', groupKey: 'g-launch', display }).result, 'slot');
  const launched = route('launch', { key: 'k-launch', launchSpec: { command: 'sleep', args: ['300'], cwd: scratch, env: {} } }, { config: { launchIdentifyTimeoutMs: 200, shellReadyTimeoutMs: 200 } });
  assert.equal(launched.result, 'not-started');
  assert.ok(launched.reason, 'the route names why nothing started');

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
  assert.throws(() => client().read({ key: 'k-one', source: 'nope' }), (e) => e instanceof TerminalControlError && e.code === 'terminal-control-route-usage');
  assert.throws(() => client().allocate({ key: 'k' }), (e) => e.code === 'terminal-control-route-usage');
  assert.throws(() => createTerminalControl({ hostBin: path.join(scratch, 'missing-host') }).capabilities(), (e) => e.code === 'terminal-control-no-host-binary');
  const neither = spawnSync(HOST_BIN, ['internal', 'terminal-control', 'send', '--protocol', '1', '--json'], { input: JSON.stringify({ v: 1, request: { key: 'k-one' } }), encoding: 'utf8' });
  assert.equal(neither.status, 2, 'a send with neither text nor keys is a usage error');
  const direct = spawnSync(HOST_BIN, ['internal', 'terminal-control', 'capabilities', '--protocol', '2', '--json'], { encoding: 'utf8' });
  assert.equal(direct.status, 3);
  assert.equal(JSON.parse(direct.stdout).code, 'host-version-mismatch');
});
