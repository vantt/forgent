// Real processes, real kernel locks, the real in-process `holderLock` door:
// a lock taken through the facade excludes another process and starts no
// process of its own, a bounded wait ends as `timeout` with nothing held, and
// the predecessor rule runs through the facade (named error, the 2000 ms
// bound). The kernel cases
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
import { acquire, acquireSync, probe, createLockScope, spawnWithLocks, HolderLockError } from '../../src/holder-lock/index.mjs';
import { observe, signalByIdentity } from '../../src/runner/dispatch/process-identity.mjs';
import { enterHotLock } from '../../src/holder-lock/hot-guard.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const FACADE_URL = pathToFileURL(path.join(root, 'src', 'holder-lock', 'index.mjs')).href;
const { bin: HOST_BIN } = resolveActiveHostBin({ fgosDir: path.join(root, '.fgos') });
const NEEDS_HOST = HOST_BIN ? false : 'no fgos host binary: set FGOS_HOST_BIN to a host whose release carries the addon';
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

test('a lock acquired through the door is held with no child process and excludes another process', { skip: NEEDS_HOST }, () => {
  const { dir, fgosDir } = makeProject();
  try {
    const scope = createLockScope('owner');
    // Inside a hot critical section any process start is refused by name: acquire, probe and release start none.
    const leave = enterHotLock();
    let taken;
    try {
      taken = acquireSync(scope, LOCK, { fgosDir });
      assert.equal(taken.result, 'acquired');
      assert.deepEqual(probe(LOCK, { fgosDir }), { result: 'held' });
    } finally {
      leave();
    }
    assert.ok(fs.existsSync(path.join(fgosDir, 'locks', 'main-checkout.lock')));
    assert.equal(taken.handle.name, LOCK);
    assert.equal(taken.handle.rank, 50);
    assert.deepEqual(Object.keys(taken.handle).filter((key) => /fd/i.test(key)), [], 'the handle carries no descriptor');

    assert.deepEqual(tryFromAnotherProcess(dir, fgosDir), { result: 'held', reason: 'kernel-lock-held' });

    const leaveAgain = enterHotLock();
    try {
      assert.deepEqual(taken.handle.release(), { settled: 'released', killed: 0, pids: [] });
    } finally {
      leaveAgain();
    }
    assert.deepEqual(taken.handle.release(), { settled: 'closed', killed: 0, pids: [] }, 'release is idempotent');
    assert.equal(taken.handle.released, true);
    assert.deepEqual(scope.holding(), []);

    assert.deepEqual(tryFromAnotherProcess(dir, fgosDir), { result: 'acquired', reason: null });
    assert.deepEqual(probe(LOCK, { fgosDir }), { result: 'free' });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// boundary: process-level lock handover. The grandchild is the only process that
// can prove the handed-over description outlives the parent's release.
const HANDOVER_CHILD = `
const { spawn } = require('node:child_process');
const grandchild = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: ['ignore', 'ignore', 'ignore', 3] });
require('node:fs').writeFileSync(process.argv[1], String(grandchild.pid));
setInterval(() => {}, 1000);
`;

test('a lock handed to a spawned child stays held through the parent release while the child tree lives', { skip: NEEDS_HOST || LINUX_ONLY }, async (t) => {
  const { dir, fgosDir } = makeProject();
  fs.mkdirSync(dir, { recursive: true });
  const pidFile = path.join(dir, 'grandchild.pid');
  const tuples = [];
  t.after(async () => {
    for (const tuple of tuples) signalByIdentity(tuple, 'kill');
    for (let i = 0; i < 100 && tuples.some((tuple) => observe(tuple.pid).kind === 'live'); i += 1) await new Promise((r) => setTimeout(r, 50));
    fs.rmSync(dir, { recursive: true, force: true });
  });
  const taken = acquireSync(createLockScope('owner'), LOCK, { fgosDir });
  assert.equal(taken.result, 'acquired');
  const child = spawnWithLocks([taken.handle], { command: process.execPath, args: ['-e', HANDOVER_CHILD, pidFile], env: childEnv({}) });
  tuples.push(observe(child.pid));
  for (let i = 0; i < 200 && !fs.existsSync(pidFile); i += 1) await new Promise((r) => setTimeout(r, 25));
  assert.ok(fs.existsSync(pidFile), 'the child started its grandchild');
  const grandchildPid = Number(fs.readFileSync(pidFile, 'utf8'));
  tuples.push(observe(grandchildPid));
  assert.equal(tuples[1].kind, 'live');

  // The description lives on in the child tree: the release closes this process's copy and settles nothing.
  assert.deepEqual(taken.handle.release(), { settled: 'closed', killed: 0, pids: [] });
  await new Promise((r) => setTimeout(r, 300));

  assert.equal(observe(grandchildPid).kind, 'live', 'the grandchild outlives the parent release');
  assert.deepEqual(probe(LOCK, { fgosDir }), { result: 'held' });
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

test('a predecessor domain that cannot be killed fails by name within the 2000 ms kill wait and leaves the lock free', { skip: NEEDS_HOST || LINUX_ONLY || (process.getuid?.() === 0 ? 'root can kill pid 1' : false) }, () => {
  const { dir, fgosDir } = makeProject();
  try {
    writePredecessor(fgosDir, processTuple(1));
    const started = Date.now();
    assert.throws(
      () => acquireSync(createLockScope('successor'), LOCK, { fgosDir }),
      (err) => {
        assert.ok(err instanceof HolderLockError);
        assert.equal(err.code, 'lock-predecessor-domain-not-empty');
        assert.equal(err.domain?.domainKind, 'linux-gate');
        assert.equal(err.domain?.domainId?.pid, 1);
        assert.equal(err.killWaitMs, 2000, 'the one kill wait every caller uses');
        return true;
      },
    );
    const elapsed = Date.now() - started;
    // pid 1 refuses the kill (EPERM), and a refused kill is answered at once
    // instead of waiting the bound out; it never takes longer than it.
    assert.ok(elapsed < 2500, `took ${elapsed} ms: the 2000 ms bound was not applied`);
    assert.deepEqual(probe(LOCK, { fgosDir }), { result: 'free' }, 'the successor released the kernel lock before reporting');
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
