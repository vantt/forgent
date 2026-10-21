// Real processes, real kernel locks, the real `fgos internal lock-fd` route:
// a lock taken through the facade stays held after the helper exits, a
// bounded wait ends as `timeout` with nothing held, and the predecessor rule
// runs through the facade (named error, configured bound). The kernel cases
// the facade only passes through (two descriptions exclude each other, a
// SIGKILLed holder frees the lock, a live predecessor is killed at once) are
// owned by packages/holder-lock/rust/tests/multiprocess.rs.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolveActiveHostBin } from '../../src/util/host-bin-path.mjs';
import { acquire, acquireSync, probe, createLockScope, HolderLockError } from '../../src/holder-lock/index.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const FACADE_URL = pathToFileURL(path.join(root, 'src', 'holder-lock', 'index.mjs')).href;
const { bin: HOST_BIN } = resolveActiveHostBin({ fgosDir: path.join(root, '.fgos') });
const NEEDS_HOST = HOST_BIN ? false : 'no fgos host binary: set FGOS_HOST_BIN to a host built with the internal lock-fd route';
const LINUX_ONLY = process.platform === 'linux' ? false : 'reads /proc';
const LOCK = 'main-checkout';

function makeProject() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'holder-lock-facade-'));
  return { dir, fgosDir: path.join(dir, '.fgos') };
}

function childEnv(extra) {
  return { ...process.env, FGOS_HOST_BIN: HOST_BIN, ...extra };
}

function writeHelper(dir, name, body) {
  const file = path.join(dir, name);
  fs.writeFileSync(file, `import * as lock from ${JSON.stringify(FACADE_URL)};\nimport fs from 'node:fs';\n${body}`);
  return file;
}

const TRY_HELPER = `
const scope = lock.createLockScope('helper');
try {
  const r = lock.acquireSync(scope, process.env.LOCK_NAME, { fgosDir: process.env.FGOS_DIR });
  process.stdout.write(JSON.stringify({ result: r.result, reason: r.reason ?? null }) + '\\n');
  if (r.result === 'acquired') r.handle.release();
} catch (err) {
  process.stdout.write(JSON.stringify({ error: err.code ?? null, message: err.message }) + '\\n');
  process.exitCode = 1;
}
`;

function tryFromAnotherProcess(dir, fgosDir) {
  const helper = writeHelper(dir, 'try-helper.mjs', TRY_HELPER);
  const res = spawnSync(process.execPath, [helper], { env: childEnv({ LOCK_NAME: LOCK, FGOS_DIR: fgosDir }), encoding: 'utf8', timeout: 20_000 });
  assert.equal(res.error, undefined, `helper did not run: ${res.error?.message}`);
  const line = res.stdout.split('\n').find((l) => l.trim() !== '');
  assert.ok(line, `helper printed nothing; stderr: ${res.stderr}`);
  return JSON.parse(line);
}

function openFdCount() {
  return fs.readdirSync('/proc/self/fd').length;
}

test('a lock acquired through the facade stays held after the helper exits and excludes another process', { skip: NEEDS_HOST }, () => {
  const { dir, fgosDir } = makeProject();
  try {
    const scope = createLockScope('owner');
    const taken = acquireSync(scope, LOCK, { fgosDir });
    assert.equal(taken.result, 'acquired');
    assert.ok(fs.existsSync(path.join(fgosDir, 'locks', 'main-checkout.lock')));
    assert.equal(taken.handle.name, LOCK);
    assert.equal(taken.handle.rank, 50);
    assert.deepEqual(Object.keys(taken.handle).filter((key) => /fd/i.test(key)), [], 'the handle carries no descriptor');

    assert.deepEqual(tryFromAnotherProcess(dir, fgosDir), { result: 'held', reason: 'kernel-lock-held' });
    assert.deepEqual(probe(LOCK, { fgosDir }), { result: 'held' });

    assert.equal(taken.handle.release(), true);
    assert.equal(taken.handle.release(), false, 'release is idempotent');
    assert.equal(taken.handle.released, true);
    assert.deepEqual(scope.holding(), []);

    assert.deepEqual(tryFromAnotherProcess(dir, fgosDir), { result: 'acquired', reason: null });
    assert.deepEqual(probe(LOCK, { fgosDir }), { result: 'free' });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('a bounded wait on a held lock ends as timeout, closes its description and holds nothing', { skip: NEEDS_HOST || LINUX_ONLY }, () => {
  const { dir, fgosDir } = makeProject();
  try {
    const owner = createLockScope('owner');
    const taken = acquireSync(owner, LOCK, { fgosDir });
    assert.equal(taken.result, 'acquired');
    const before = openFdCount();
    const started = Date.now();
    const waited = acquireSync(createLockScope('waiter'), LOCK, { fgosDir }, { waitMs: 200 });
    const elapsed = Date.now() - started;
    assert.equal(waited.result, 'timeout');
    assert.ok(Number.isInteger(waited.waitedMs) && waited.waitedMs >= 0, JSON.stringify(waited));
    assert.ok(elapsed >= 150, `waited only ${elapsed} ms`);
    assert.ok(elapsed < 3000, `waited ${elapsed} ms, past the wait plus kill bound`);
    assert.equal(openFdCount(), before, 'the waiter closed its description');
    taken.handle.release();
    const retaken = acquireSync(createLockScope('waiter'), LOCK, { fgosDir });
    assert.equal(retaken.result, 'acquired', 'nothing stayed held after the timeout');
    retaken.handle.release();
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('acquire refuses a missing scope and a bad wait before touching anything', () => {
  assert.throws(() => acquireSync(null, LOCK, { fgosDir: '/nowhere/.fgos' }), (err) => err instanceof HolderLockError && err.code === 'lock-scope-required');
  assert.throws(() => acquireSync(createLockScope('x'), LOCK, { fgosDir: '/nowhere/.fgos' }, { waitMs: 0 }), (err) => err.code === 'lock-wait-invalid');
  assert.throws(() => acquireSync(createLockScope('x'), 'no-such-lock', {}), (err) => err.code === 'unknown-lock');
  assert.throws(() => acquireSync(createLockScope('x'), LOCK, {}), (err) => err.code === 'lock-path-param-missing' && err.param === 'fgosDir');
  assert.equal(fs.existsSync('/nowhere/.fgos'), false);
});

// The predecessor rule, seen from the facade: the record next to the lock
// file names a process domain; the next holder may proceed only once that
// domain is empty.
function processTuple(pid) {
  const stat = fs.readFileSync(`/proc/${pid}/stat`, 'utf8');
  const startTime = stat.slice(stat.lastIndexOf(')') + 2).split(' ')[19];
  return {
    host: os.hostname(),
    bootId: fs.readFileSync('/proc/sys/kernel/random/boot_id', 'utf8').trim(),
    // Both domains below (a child of this process, and pid 1) live in this
    // process's own PID namespace; pid 1's ns link is unreadable without root.
    pidNs: fs.readlinkSync('/proc/self/ns/pid'),
    pid,
    startTime,
  };
}

function writePredecessor(fgosDir, tuple) {
  const lockDir = path.join(fgosDir, 'locks');
  fs.mkdirSync(lockDir, { recursive: true });
  const record = path.join(lockDir, 'main-checkout.lock.predecessor.json');
  fs.writeFileSync(`${record}.tmp`, JSON.stringify({ v: 1, domainKind: 'linux-gate', domainId: tuple }));
  fs.renameSync(`${record}.tmp`, record);
  return record;
}

test('a predecessor domain that cannot be killed fails by name within lock.predecessorKillWaitMs and leaves the lock free', { skip: NEEDS_HOST || LINUX_ONLY || (process.getuid?.() === 0 ? 'root can kill pid 1' : false) }, () => {
  const { dir, fgosDir } = makeProject();
  try {
    fs.mkdirSync(fgosDir, { recursive: true });
    fs.writeFileSync(path.join(fgosDir, 'config.json'), JSON.stringify({ lock: { predecessorKillWaitMs: 200 } }));
    writePredecessor(fgosDir, processTuple(1));
    const started = Date.now();
    assert.throws(
      () => acquireSync(createLockScope('successor'), LOCK, { fgosDir }),
      (err) => {
        assert.ok(err instanceof HolderLockError);
        assert.equal(err.code, 'lock-predecessor-domain-not-empty');
        assert.equal(err.domain?.domainKind, 'linux-gate');
        assert.equal(err.domain?.domainId?.pid, 1);
        assert.equal(err.killWaitMs, 200, 'the configured bound is the one sent to the route');
        return true;
      },
    );
    const elapsed = Date.now() - started;
    // pid 1 refuses the kill (EPERM), and the route answers a refused kill at
    // once instead of waiting the bound out; it never takes longer than it.
    assert.ok(elapsed < 1500, `took ${elapsed} ms: the configured 200 ms bound was not applied`);
    assert.deepEqual(probe(LOCK, { fgosDir }), { result: 'free' }, 'the successor released the kernel lock before reporting');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('a malformed lock.predecessorKillWaitMs is refused, never guessed around', () => {
  const { dir, fgosDir } = makeProject();
  try {
    fs.mkdirSync(fgosDir, { recursive: true });
    // The same range doctor's lock-predecessor-kill-wait check enforces.
    for (const value of ['2s', 0, 60_001]) {
      fs.writeFileSync(path.join(fgosDir, 'config.json'), JSON.stringify({ lock: { predecessorKillWaitMs: value } }));
      assert.throws(() => acquireSync(createLockScope('x'), LOCK, { fgosDir }), (err) => err.code === 'lock-config-invalid' && err.key === 'lock.predecessorKillWaitMs', `value ${JSON.stringify(value)}`);
      assert.equal(fs.existsSync(path.join(fgosDir, 'locks')), false, 'refused before any lock file was touched');
    }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('the async acquire polls a held lock to timeout, then takes it once the holder releases', { skip: NEEDS_HOST }, async () => {
  const { dir, fgosDir } = makeProject();
  try {
    const held = acquireSync(createLockScope('first'), LOCK, { fgosDir });
    assert.equal(held.result, 'acquired');
    assert.deepEqual(await acquire(createLockScope('second'), LOCK, { fgosDir }), { result: 'held', reason: 'kernel-lock-held' }, 'no wait asked: held at once');
    const started = Date.now();
    const waited = await acquire(createLockScope('second'), LOCK, { fgosDir }, { waitMs: 200, pollMs: 20 });
    const elapsed = Date.now() - started;
    assert.equal(waited.result, 'timeout');
    assert.ok(elapsed >= 150 && elapsed < 3000, `waited ${elapsed} ms for a 200 ms bound`);
    setTimeout(() => held.handle.release(), 100);
    const taken = await acquire(createLockScope('second'), LOCK, { fgosDir }, { waitMs: 3000, pollMs: 20 });
    assert.equal(taken.result, 'acquired', 'taken once the first holder closed its description');
    assert.deepEqual(probe(LOCK, { fgosDir }), { result: 'held' });
    taken.handle.release();
    assert.deepEqual(probe(LOCK, { fgosDir }), { result: 'free' });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
