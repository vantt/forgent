// The Windows transport of the facade: one `fgos internal lock-hold` helper
// per held lock. Real processes and real LockFileEx locks through the real
// host binary (FGOS_HOST_BIN). The stale work-directory sweep is platform
// neutral and always runs; everything else needs win32.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolveActiveHostBin } from '../../src/util/host-bin-path.mjs';
import { acquireSync, probe, createLockScope } from '../../src/holder-lock/index.mjs';
import { sweepStaleWorkDirs } from '../../src/holder-lock/hold-transport.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const FACADE_URL = pathToFileURL(path.join(root, 'src', 'holder-lock', 'index.mjs')).href;
const { bin: HOST_BIN } = resolveActiveHostBin({ fgosDir: path.join(root, '.fgos') });
const WINDOWS_ONLY = process.platform === 'win32' ? false : 'the lock-hold transport runs on win32 only; POSIX uses the fd transport';
const SKIP = WINDOWS_ONLY || (HOST_BIN ? false : 'no fgos host binary: set FGOS_HOST_BIN to a host built from this checkout');
const LOCK = 'main-checkout';

function makeProject() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'holder-lock-windows-'));
  return { dir, fgosDir: path.join(dir, '.fgos') };
}

function childEnv(extra) {
  return { ...process.env, FGOS_HOST_BIN: HOST_BIN, ...extra };
}

function writeScript(dir, name, body) {
  const file = path.join(dir, name);
  fs.writeFileSync(file, `import * as lock from ${JSON.stringify(FACADE_URL)};\n${body}`);
  return file;
}

function runScript(file, env, timeout = 20_000) {
  const res = spawnSync(process.execPath, [file], { env: childEnv(env), encoding: 'utf8', timeout });
  assert.equal(res.error, undefined, `script did not run: ${res.error?.message}`);
  return res;
}

const TRY_SCRIPT = `
const scope = lock.createLockScope('probe');
const r = lock.acquireSync(scope, process.env.LOCK_NAME, { fgosDir: process.env.FGOS_DIR });
process.stdout.write(JSON.stringify({ result: r.result }) + '\\n');
if (r.result === 'acquired') r.handle.release();
`;

const tryFrom = (dir, fgosDir) => JSON.parse(runScript(writeScript(dir, 'try.mjs', TRY_SCRIPT), { LOCK_NAME: LOCK, FGOS_DIR: fgosDir }).stdout.trim().split('\n').pop()).result;

function acquired(scope, fgosDir, opts) {
  const r = acquireSync(scope, LOCK, { fgosDir }, opts);
  assert.equal(r.result, 'acquired', JSON.stringify(r));
  return r.handle;
}

function helperProcessCount() {
  const out = spawnSync('tasklist', ['/FI', 'IMAGENAME eq fgos.exe', '/FO', 'CSV', '/NH'], { encoding: 'utf8' }).stdout;
  return out.split('\n').filter((line) => line.toLowerCase().includes('fgos.exe')).length;
}

function workDirCount() {
  return fs.readdirSync(os.tmpdir()).filter((name) => name.startsWith('fgos-lock-hold-')).length;
}

function percentile(sorted, p) {
  return sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)];
}

test('the stale work-directory sweep removes old directories of dead owners only', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hold-sweep-'));
  try {
    const dead = spawnSync(process.execPath, ['-e', '0']);
    const old = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const make = (name, aged) => {
      const dir = path.join(tmp, name);
      fs.mkdirSync(dir);
      if (aged) fs.utimesSync(dir, old, old);
      return dir;
    };
    const staleDead = make(`fgos-lock-hold-${dead.pid}-1-abcdef`, true);
    const staleLive = make(`fgos-lock-hold-${process.pid}-1-abcdef`, true);
    const freshDead = make(`fgos-lock-hold-${dead.pid}-2-abcdef`, false);
    const other = make('unrelated-dir', true);
    assert.equal(sweepStaleWorkDirs({ tmpdir: tmp }), 1);
    assert.equal(fs.existsSync(staleDead), false, 'old, owner dead: removed');
    assert.equal(fs.existsSync(staleLive), true, 'old, owner alive: a long-held lock keeps its directory');
    assert.equal(fs.existsSync(freshDead), true, 'young: kept');
    assert.equal(fs.existsSync(other), true, 'not a work directory: kept');

    for (let i = 0; i < 60; i += 1) make(`fgos-lock-hold-${dead.pid}-${100 + i}-abcdef`, true);
    assert.equal(sweepStaleWorkDirs({ tmpdir: tmp }), 50, 'at most 50 per call');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('a Node process holds the lock; another process sees held; a process that exits without release frees it', { skip: SKIP }, () => {
  const { dir, fgosDir } = makeProject();
  const holder = writeScript(dir, 'hold-and-exit.mjs', `
const scope = lock.createLockScope('holder');
const r = lock.acquireSync(scope, process.env.LOCK_NAME, { fgosDir: process.env.FGOS_DIR });
process.stdout.write(JSON.stringify({ result: r.result }) + '\\n');
process.exit(0);
`);
  const scope = createLockScope('test');
  const mine = acquired(scope, fgosDir);
  assert.equal(tryFrom(dir, fgosDir), 'held');
  mine.release();

  // The holder process dies without release; only libuv's job ends its helper.
  const res = runScript(holder, { LOCK_NAME: LOCK, FGOS_DIR: fgosDir });
  assert.equal(JSON.parse(res.stdout.trim()).result, 'acquired');
  const started = Date.now();
  const next = acquired(createLockScope('next'), fgosDir, { waitMs: 2000 });
  const elapsed = Date.now() - started;
  // The elapsed time includes starting this process's own helper.
  assert.ok(elapsed < 300, `the lock was free ${elapsed} ms after the holder exited`);
  next.release();
  fs.rmSync(dir, { recursive: true, force: true });
});

test('release is quick and an immediate acquire in the same process succeeds', { skip: SKIP }, () => {
  const { dir, fgosDir } = makeProject();
  const scope = createLockScope('test');
  const first = acquired(scope, fgosDir);
  const started = process.hrtime.bigint();
  first.release();
  const releaseMs = Number(process.hrtime.bigint() - started) / 1e6;
  assert.ok(releaseMs < 50, `release took ${releaseMs} ms`);
  assert.equal(first.released, true);
  acquired(scope, fgosDir).release();
  fs.rmSync(dir, { recursive: true, force: true });
});

test('a bounded wait against a holder times out within its bound and leaves no helper or work directory', { skip: SKIP }, () => {
  const { dir, fgosDir } = makeProject();
  const holder = acquired(createLockScope('holder'), fgosDir);
  const helpersBefore = helperProcessCount();
  const dirsBefore = workDirCount();
  const started = Date.now();
  const r = acquireSync(createLockScope('waiter'), LOCK, { fgosDir }, { waitMs: 300 });
  const elapsed = Date.now() - started;
  assert.equal(r.result, 'timeout');
  assert.ok(elapsed >= 300, `timed out after ${elapsed} ms`);
  assert.ok(elapsed < 300 + 2000 + 1000, `timed out after ${elapsed} ms`);
  assert.equal(helperProcessCount(), helpersBefore, 'the waiter\'s helper is gone');
  assert.equal(workDirCount(), dirsBefore, 'the waiter\'s work directory is removed');
  holder.release();
  fs.rmSync(dir, { recursive: true, force: true });
});

test('a process that only holds a lock exits by itself and the lock is free afterwards', { skip: SKIP }, () => {
  const { dir, fgosDir } = makeProject();
  const holder = writeScript(dir, 'hold-idle.mjs', `
const scope = lock.createLockScope('holder');
lock.acquireSync(scope, process.env.LOCK_NAME, { fgosDir: process.env.FGOS_DIR });
`);
  const res = runScript(holder, { LOCK_NAME: LOCK, FGOS_DIR: fgosDir }, 15_000);
  assert.equal(res.status, 0, 'the helper is unref\'d: a held lock never keeps the event loop alive');
  const deadline = Date.now() + 1000;
  while (probe(LOCK, { fgosDir }).result !== 'free') {
    assert.ok(Date.now() < deadline, 'the lock is still held after the holder exited');
  }
  fs.rmSync(dir, { recursive: true, force: true });
});

test('probe answers held and free', { skip: SKIP }, () => {
  const { dir, fgosDir } = makeProject();
  assert.equal(probe(LOCK, { fgosDir }).result, 'free');
  const handle = acquired(createLockScope('test'), fgosDir);
  assert.equal(probe(LOCK, { fgosDir }).result, 'held');
  handle.release();
  assert.equal(probe(LOCK, { fgosDir }).result, 'free');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('a Rust in-process holder and a Node holder exclude each other', { skip: SKIP }, async () => {
  const { dir, fgosDir } = makeProject();
  const handle = acquired(createLockScope('node'), fgosDir);
  const rust = (lockPath) => spawn(HOST_BIN, ['internal', 'holder-lock-helper', 'probe-holder', '--path', lockPath], { stdio: ['ignore', 'pipe', 'ignore'], windowsHide: true });
  const exitCode = (child) => new Promise((resolve) => child.once('exit', resolve));

  const refused = rust(handle.path);
  assert.equal(await exitCode(refused), 1, 'the Rust holder cannot take a lock Node holds');
  handle.release();

  const holder = rust(handle.path);
  await new Promise((resolve) => holder.stdout.once('data', resolve));
  assert.equal(acquireSync(createLockScope('node2'), LOCK, { fgosDir }).result, 'held', 'Node cannot take a lock the Rust holder holds');
  holder.kill();
  await exitCode(holder);
  acquired(createLockScope('node3'), fgosDir).release();
  fs.rmSync(dir, { recursive: true, force: true });
});

test('cold acquire and release latency over 50 pairs', { skip: SKIP }, (t) => {
  const { dir, fgosDir } = makeProject();
  const scope = createLockScope('latency');
  const samples = [];
  for (let i = 0; i < 50; i += 1) {
    const started = process.hrtime.bigint();
    acquired(scope, fgosDir).release();
    samples.push(Number(process.hrtime.bigint() - started) / 1e6);
  }
  samples.sort((a, b) => a - b);
  const report = { pairs: samples.length, p50Ms: percentile(samples, 50), p95Ms: percentile(samples, 95), maxMs: samples.at(-1) };
  t.diagnostic(`lock-hold acquire+release ${JSON.stringify(report)}`);
  assert.ok(report.p95Ms < 2000, JSON.stringify(report));
  fs.rmSync(dir, { recursive: true, force: true });
});
