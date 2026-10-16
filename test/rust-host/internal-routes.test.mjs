// `fgos internal ...` through the real host binary (FGOS_HOST_BIN, which
// `npm test` builds from this checkout): the routes answer one JSON line,
// a protocol other than 1 fails closed with exit 3 (host-version-mismatch),
// and `internal` is in neither the route table nor the help manifest.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const ROUTES = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'packages/host-runtime/contracts/command-routes.json'), 'utf8'));
const HOST_BIN = process.env.FGOS_HOST_BIN;

const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-internal-routes-'));
after(() => fs.rmSync(scratch, { recursive: true, force: true }));

function host(args, { fd, env } = {}) {
  assert.ok(HOST_BIN && fs.existsSync(HOST_BIN), `set FGOS_HOST_BIN to a host built from this checkout (npm test does): ${HOST_BIN}`);
  const childEnv = { ...process.env, ...env };
  delete childEnv.FGOS_LOCK_FD;
  return spawnSync(HOST_BIN, ['internal', ...args], {
    encoding: 'utf8',
    env: childEnv,
    stdio: fd === undefined ? ['ignore', 'pipe', 'pipe'] : ['ignore', 'pipe', 'pipe', fd],
    timeout: 30000,
  });
}

function line(result) {
  const lines = result.stdout.split('\n').filter((l) => l.trim() !== '');
  assert.equal(lines.length, 1, `one JSON line expected, got ${JSON.stringify(result.stdout)} (stderr ${result.stderr})`);
  const parsed = JSON.parse(lines[0]);
  assert.equal(parsed.v, 1);
  assert.equal(parsed.protocol, 1);
  return parsed;
}

test('internal is neither a route nor in the help manifest', () => {
  assert.equal(ROUTES.internal, undefined);
  assert.ok(!Object.values(ROUTES).some((r) => r.selector === 'internal'));
  const env = { ...process.env };
  delete env.CLAUDE_CODE_SESSION_ID;
  const help = spawnSync(process.execPath, [path.join(REPO_ROOT, 'bin/fgos.mjs'), '--help', '--json'], { cwd: scratch, encoding: 'utf8', env, maxBuffer: 64 * 1024 * 1024 });
  assert.equal(help.status, 0, help.stderr);
  const names = JSON.parse(help.stdout).commands.map((c) => c.name);
  assert.ok(names.length > 0);
  assert.ok(!names.includes('internal'), 'help lists internal');
});

test('a protocol other than 1 fails closed with exit 3 and host-version-mismatch', () => {
  for (const args of [['state-root'], ['state-root', '--protocol', '2'], ['lock-fd', '--try'], ['lock-borrow-vectors', '--protocol', '9']]) {
    const result = host(args);
    assert.equal(result.status, 3, args.join(' '));
    const parsed = line(result);
    assert.equal(parsed.result, 'error');
    assert.equal(parsed.code, 'host-version-mismatch');
    assert.match(result.stderr, /host-version-mismatch/);
  }
  const unknown = host(['nope', '--protocol', '1']);
  assert.equal(unknown.status, 2);
  assert.equal(line(unknown).code, 'usage');
});

test('state-root answers the pinned root and its lock root', () => {
  const result = host(['state-root', '--protocol', '1'], { env: { FGOS_STATE_ROOT: path.join(scratch, 'state') } });
  assert.equal(result.status, 0, result.stderr);
  const parsed = line(result);
  assert.equal(parsed.stateRoot, path.join(scratch, 'state'));
  assert.equal(parsed.lockRoot, path.join(scratch, 'state', 'locks'));
  assert.equal(parsed.source, 'pinned');
});

test('lock-fd locks the caller\'s description at fd 3 and the lock outlives the helper', { skip: process.platform === 'win32' }, () => {
  const lockPath = path.join(scratch, 'node.lock');
  const mine = fs.openSync(lockPath, 'a+');
  try {
    const acquired = host(['lock-fd', '--protocol', '1', '--try'], { fd: mine });
    assert.equal(acquired.status, 0, acquired.stderr);
    assert.equal(line(acquired).result, 'acquired');
    const other = fs.openSync(lockPath, 'a+');
    try {
      const held = host(['lock-fd', '--protocol', '1', '--try'], { fd: other });
      assert.equal(held.status, 10);
      assert.deepEqual(line(held), { v: 1, protocol: 1, result: 'held', reason: 'kernel-lock-held' });
    } finally {
      fs.closeSync(other);
    }
  } finally {
    fs.closeSync(mine);
  }
  const again = fs.openSync(lockPath, 'a+');
  try {
    const free = host(['lock-fd', '--protocol', '1', '--try'], { fd: again });
    assert.equal(line(free).result, 'acquired', 'closing the owner description released the lock');
  } finally {
    fs.closeSync(again);
  }
});
