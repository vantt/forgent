// No driver, no lock: without the addon every acquire/probe fails with the
// named `lock-driver-unavailable` and opens nothing; on a network filesystem
// the driver's guarantee is `none` and the same error names the filesystem.
// Neither branch falls back to a lock implemented in Node. The lock door is
// taken once, by the facade, and by nothing else.
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
const NEEDS_HOST = HOST_BIN ? false : 'no fgos host binary: set FGOS_HOST_BIN to a host whose release carries the addon';

test('without the addon every facade door fails lock-driver-unavailable and creates nothing', () => {
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
    // No activation and no release manifest: the door cannot find an addon, so it throws git-addon-not-shipped.
    const { FGOS_HOST_BIN: _unset, FGOS_STATE_ROOT: _noPin, FGOS_ACTIVE_MANIFEST_PATH: _manifest, FGOS_ACTIVE_RELEASE_PATH: _release, ...env } = process.env;
    const res = spawnSync(process.execPath, [script], { cwd: dir, env: { ...env, FGOS_DIR: fgosDir }, encoding: 'utf8', timeout: 20_000 });
    assert.equal(res.status, 0, res.stderr);
    const out = JSON.parse(res.stdout);
    for (const door of ['acquireSync', 'acquire', 'probe', 'stateRoot']) {
      assert.equal(out[door].code, 'lock-driver-unavailable', `${door}: ${JSON.stringify(out[door])}`);
      // Every lock operation and the unpinned state root ask the same door.
      assert.equal(out[door].reason, 'addon-not-shipped', door);
      assert.equal(out[door].name, 'HolderLockError', door);
    }
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

test('no module but the facade can take the lock door', { skip: NEEDS_HOST }, () => {
  // The facade takes the capability on its first use; a second take, by anything else in the process, is refused by name.
  const script = `
import * as lock from ${JSON.stringify(FACADE_URL)};
import { nativeDoor } from ${JSON.stringify(pathToFileURL(path.join(root, 'src', 'native', 'door.mjs')).href)};
import fs from 'node:fs';
const dir = fs.mkdtempSync(process.env.TMPDIR_ROOT + '/door-');
const out = { facade: lock.probe('main-checkout', { fgosDir: dir + '/.fgos' }).result };
try { nativeDoor().holderLock.take(); out.second = 'taken'; } catch (err) { out.second = err.message; }
fs.rmSync(dir, { recursive: true, force: true });
process.stdout.write(JSON.stringify(out));
`;
  const res = spawnSync(process.execPath, ['--input-type=module', '-e', script], { env: { ...process.env, TMPDIR_ROOT: os.tmpdir() }, encoding: 'utf8', timeout: 20_000 });
  assert.equal(res.status, 0, res.stderr);
  const out = JSON.parse(res.stdout);
  assert.equal(out.facade, 'free');
  assert.match(out.second, /holder-lock-already-taken/);
  // And no other source module takes the capability.
  const users = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (/\.m?js$/.test(entry.name) && /holderLock\.take\(/.test(fs.readFileSync(file, 'utf8'))) users.push(path.relative(root, file));
    }
  };
  for (const dir of ['src', 'bin', 'scripts']) walk(path.join(root, dir));
  assert.deepEqual(users, ['src/holder-lock/driver.mjs']);
});
