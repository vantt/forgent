// The judge a hot record is read through where /proc does not exist: the
// holder's start time comes from the host's process facts (`fgos internal
// process-observe`). Run here against the real host on whatever platform the
// suite runs on, so the composition is proven before the Windows job runs it
// with a Windows creation time.

import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { hotObserver, judgeHotRecord, observeViaHost } from '../../src/state/hot-lock.mjs';
import { resolveActiveHostBin } from '../../src/util/host-bin-path.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const { bin: HOST_BIN } = resolveActiveHostBin({ fgosDir: path.join(root, '.fgos') });
const NEEDS_HOST = HOST_BIN ? false : 'no fgos host binary: set FGOS_HOST_BIN to a host built with the process-observe route';

const fgosDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hot-host-judge-'));
const WIN = { platform: 'win32' };

function liveChild() {
  return spawn(process.execPath, ['-e', 'setTimeout(() => {}, 60000)'], { stdio: 'ignore' });
}

async function exited(child) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  await new Promise((resolve) => child.once('exit', resolve));
}

test('a live holder with its recorded start time is alive; another start time is a reused pid', { skip: NEEDS_HOST }, async () => {
  const child = liveChild();
  try {
    const seen = observeViaHost(child.pid, { fgosDir });
    assert.equal(seen.kind, 'live');
    assert.match(seen.startTime, /^\d+$/);
    assert.equal(judgeHotRecord({ v: 1, pid: child.pid, startTime: seen.startTime }, fgosDir, WIN), 'alive');
    assert.equal(judgeHotRecord({ v: 1, pid: child.pid, startTime: `${seen.startTime}0` }, fgosDir, WIN), 'dead');
  } finally {
    child.kill('SIGKILL');
    await exited(child);
  }
});

test('a killed holder is dead, a live holder without a recorded start time stays unknown', { skip: NEEDS_HOST }, async () => {
  const gone = liveChild();
  const record = { v: 1, pid: gone.pid, startTime: observeViaHost(gone.pid, { fgosDir }).startTime };
  gone.kill('SIGKILL');
  await exited(gone);
  assert.equal(judgeHotRecord(record, fgosDir, WIN), 'dead');
  // This process is live; a record that never captured its start time proves nothing.
  assert.equal(judgeHotRecord({ v: 1, pid: process.pid }, fgosDir, WIN), 'unknown');
});

test('a host that cannot be run leaves a live pid unjudged, never dead', () => {
  const spawned = spawnSync(process.execPath, ['--input-type=module', '-e', `
    const { observeViaHost } = await import(${JSON.stringify(new URL('../../src/state/hot-lock.mjs', import.meta.url).href)});
    process.stdout.write(JSON.stringify(observeViaHost(process.pid, { fgosDir: ${JSON.stringify(fgosDir)} })));
  `], { encoding: 'utf8', env: { ...process.env, FGOS_HOST_BIN: path.join(fgosDir, 'no-such-host') } });
  assert.equal(spawned.status, 0, spawned.stderr);
  assert.deepEqual(JSON.parse(spawned.stdout), { kind: 'unreadable', cause: 'driver-missing' });
});

test('the Windows observer reuses a live reading briefly and sees a death at once', { skip: NEEDS_HOST }, async () => {
  const child = liveChild();
  const observe = hotObserver(fgosDir, WIN);
  const first = observe(child.pid);
  assert.equal(first.kind, 'live');
  assert.equal(observe(child.pid), first, 'the second look inside the window is the cached reading');
  child.kill('SIGKILL');
  await exited(child);
  assert.equal(observe(child.pid).kind, 'absent');
});

test('the process-observe route of a host refuses a missing pid argument', { skip: NEEDS_HOST }, () => {
  const out = spawnSync(HOST_BIN, ['internal', 'process-observe', '--protocol', '2'], { encoding: 'utf8' });
  assert.equal(out.status, 2);
  assert.equal(JSON.parse(out.stdout).code, 'usage');
});

test('a cached live reading is never used to reclaim: the reclaim judge reads afresh', { skip: NEEDS_HOST }, async () => {
  const child = liveChild();
  const record = { v: 1, pid: child.pid, startTime: observeViaHost(child.pid, { fgosDir }).startTime };
  const warm = hotObserver(fgosDir, WIN);
  warm(child.pid);
  // Another start time with the pid still alive: the cached reading says the recorded one is a reused pid.
  const stale = { ...record, startTime: `${record.startTime}1` };
  assert.equal(judgeHotRecord(stale, fgosDir, { ...WIN, cache: false }), 'dead');
  child.kill('SIGKILL');
  await exited(child);
});
