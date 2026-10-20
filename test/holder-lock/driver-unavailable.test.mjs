// No driver, no lock: with no host binary every acquire/probe fails with the
// named `lock-driver-unavailable` and opens nothing; on a network filesystem
// the driver's guarantee is `none` and the same error names the filesystem.
// Neither branch falls back to a lock implemented in Node.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolveActiveHostBin } from '../../src/util/host-bin-path.mjs';
import { acquireSync, createLockScope, HolderLockError } from '../../src/holder-lock/index.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const FACADE_URL = pathToFileURL(path.join(root, 'src', 'holder-lock', 'index.mjs')).href;
const ADAPTERS_URL = pathToFileURL(path.join(root, 'src', 'runner', 'dispatch', 'adapters.mjs')).href;
const { bin: HOST_BIN } = resolveActiveHostBin({ fgosDir: path.join(root, '.fgos') });
const NEEDS_HOST = HOST_BIN ? false : 'no fgos host binary: set FGOS_HOST_BIN to a host built with the internal lock-fd route';

test('with no host binary every door fails by name and nothing is created', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'holder-lock-no-driver-'));
  const fgosDir = path.join(dir, '.fgos');
  try {
    const script = path.join(dir, 'no-driver.mjs');
    fs.writeFileSync(script, `
import * as lock from ${JSON.stringify(FACADE_URL)};
import fs from 'node:fs';
const fgosDir = process.env.FGOS_DIR;
const scope = lock.createLockScope('no-driver');
const out = {};
const record = (err) => ({ code: err.code, reason: err.reason, name: err.name, tried: Array.isArray(err.tried) ? err.tried.length : null });
try { lock.acquireSync(scope, 'main-checkout', { fgosDir }); out.acquireSync = 'returned'; } catch (err) { out.acquireSync = record(err); }
try { await lock.acquire(scope, 'main-checkout', { fgosDir }, { waitMs: 50 }); out.acquire = 'returned'; } catch (err) { out.acquire = record(err); }
try { lock.probe('main-checkout', { fgosDir }); out.probe = 'returned'; } catch (err) { out.probe = record(err); }
try { lock.resolveStateRoot(); out.stateRoot = 'returned'; } catch (err) { out.stateRoot = record(err); }
try {
  const { workerBaseEnv } = await import(${JSON.stringify(ADAPTERS_URL)});
  out.workerEnv = workerBaseEnv({ PATH: '/usr/bin', FGOS_STATE_ROOT: '/sandbox/state/fgos' });
} catch (err) { out.workerEnv = record(err); }
out.locksDirExists = fs.existsSync(fgosDir + '/locks');
process.stdout.write(JSON.stringify(out));
`);
    const { FGOS_HOST_BIN: _unset, FGOS_STATE_ROOT: _noPin, ...env } = process.env;
    const res = spawnSync(process.execPath, [script], { cwd: dir, env: { ...env, FGOS_DIR: fgosDir }, encoding: 'utf8', timeout: 20_000 });
    assert.equal(res.status, 0, res.stderr);
    const out = JSON.parse(res.stdout);
    for (const door of ['acquireSync', 'acquire', 'probe', 'stateRoot']) {
      assert.equal(out[door].code, 'lock-driver-unavailable', `${door}: ${JSON.stringify(out[door])}`);
      assert.equal(out[door].reason, 'no-host-binary', door);
      assert.equal(out[door].name, 'HolderLockError', door);
    }
    assert.ok(out.acquireSync.tried >= 1, 'the error lists where the binary was looked for');
    assert.equal(out.locksDirExists, false, 'no lock directory is created when there is no driver');
    assert.deepEqual(out.workerEnv, { PATH: '/usr/bin' }, 'a worker spawn still works with no host: no pin, and never the inherited root');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

function writableNetworkMounts() {
  if (process.platform !== 'linux') return [];
  let mounts;
  try {
    mounts = fs.readFileSync('/proc/mounts', 'utf8');
  } catch {
    return [];
  }
  const network = /^(nfs|nfs4|cifs|smb3|smbfs)$/;
  return mounts.split('\n')
    .map((line) => line.split(' '))
    .filter((fields) => fields.length >= 3 && network.test(fields[2]))
    .map((fields) => fields[1].replace(/\\040/g, ' '))
    .filter((mountPoint) => {
      try {
        fs.accessSync(mountPoint, fs.constants.W_OK);
        return true;
      } catch {
        return false;
      }
    });
}

test('a lock directory on a network filesystem is refused by name (guarantee none)', { skip: NEEDS_HOST }, (t) => {
  const mounts = writableNetworkMounts();
  if (mounts.length === 0) {
    t.skip('no writable NFS/SMB mount on this machine: the unsupported-filesystem branch is not measured here');
    return;
  }
  const lockRoot = fs.mkdtempSync(path.join(mounts[0], 'holder-lock-netfs-'));
  try {
    assert.throws(
      () => acquireSync(createLockScope('netfs'), 'full-suite', { lockRoot }),
      (err) => {
        assert.ok(err instanceof HolderLockError);
        assert.equal(err.code, 'lock-driver-unavailable');
        assert.equal(err.reason, 'unsupported-filesystem');
        assert.equal(err.guarantee?.exclusion, 'none');
        return true;
      },
    );
  } finally {
    fs.rmSync(lockRoot, { recursive: true, force: true });
  }
});

test('a host that speaks another route protocol is refused by name, and a protocol-1 answer is never trusted', { skip: process.platform === 'win32' }, () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'holder-lock-protocol-'));
  try {
    const script = path.join(dir, 'protocol.mjs');
    fs.writeFileSync(script, `
import * as lock from ${JSON.stringify(FACADE_URL)};
const scope = lock.createLockScope('protocol');
try { lock.acquireSync(scope, 'main-checkout', { fgosDir: process.env.FGOS_DIR }); process.stdout.write(JSON.stringify({ outcome: 'returned' })); }
catch (err) { process.stdout.write(JSON.stringify({ code: err.code, reason: err.reason, message: err.message })); }
`);
    const run = (hostBody) => {
      const host = path.join(dir, 'fake-host');
      fs.writeFileSync(host, `#!/bin/sh\n${hostBody}\n`, { mode: 0o755 });
      const { FGOS_STATE_ROOT: _noPin, ...env } = process.env;
      const res = spawnSync(process.execPath, [script], { cwd: dir, env: { ...env, FGOS_HOST_BIN: host, FGOS_DIR: path.join(dir, '.fgos') }, encoding: 'utf8', timeout: 20_000 });
      assert.equal(res.status, 0, res.stderr);
      return JSON.parse(res.stdout);
    };
    // A host of the first release refuses the protocol this facade sends (2).
    const refused = run(`case "$*" in *"--protocol 2"*) echo "fgos internal: host-version-mismatch: this host speaks internal protocol 1" >&2; exit 3;; esac; exit 70`);
    assert.equal(refused.code, 'lock-driver-unavailable');
    assert.equal(refused.reason, 'host-version-mismatch');
    // An answer stamped with protocol 1 is rejected as bad output, never read as a lock result.
    const stale = run(`echo '{"v":1,"protocol":1,"result":"acquired"}'`);
    assert.equal(stale.code, 'lock-route-bad-output');
    assert.match(stale.message, /protocol 1, expected 2/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
