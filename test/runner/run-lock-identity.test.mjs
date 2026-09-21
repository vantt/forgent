// Phase 02 H1: acquireRunControl's reclaim decision must be proven-dead
// identity, not raw PID liveness alone -- a PID reused by an unrelated
// process after the real holder died must never be mistaken for the same
// holder. Exercises resolveHolderLiveness's full decision table through the
// real acquireRunControl entry point (fixtures craft the holder record
// directly rather than mocking /proc, since real PID liveness/bootId are
// the only fs state this depends on).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { acquireRunControl, buildRunControlHolder, resolveHolderLiveness } from '../../src/runner/dispatch/run-lock.mjs';
import { getBootId, getProcessStartTime } from '../../src/runner/dispatch/process-identity.mjs';

function mkRunDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'run-lock-identity-'));
}

// A definitely-dead PID: spawn a real child, let it exit, then reuse its pid.
function deadPid() {
  const result = spawnSync(process.execPath, ['-e', 'process.exit(0)']);
  return result.pid;
}

test('buildRunControlHolder: current process identity is self-consistent with process-identity.mjs', () => {
  const holder = buildRunControlHolder('test-id');
  assert.equal(holder.id, 'test-id');
  assert.equal(holder.pid, process.pid);
  assert.equal(holder.bootId, getBootId());
  assert.equal(holder.processStartTime, getProcessStartTime(process.pid));
  assert.equal(holder.host, os.hostname());
});

test('resolveHolderLiveness: alive pid + matching processStartTime -> held', () => {
  const holder = buildRunControlHolder('self');
  assert.equal(resolveHolderLiveness(holder), 'held');
});

test('resolveHolderLiveness: alive pid but a DIFFERENT recorded processStartTime (pid reused by an unrelated process) -> dead', () => {
  const holder = { id: 'stale', pid: process.pid, bootId: getBootId(), processStartTime: 'not-the-real-starttime', host: os.hostname() };
  assert.equal(resolveHolderLiveness(holder), 'dead');
});

test('resolveHolderLiveness: a genuinely dead pid (ESRCH) -> dead, regardless of recorded processStartTime', () => {
  const pid = deadPid();
  const holder = { id: 'gone', pid, bootId: getBootId(), processStartTime: '12345', host: os.hostname() };
  assert.equal(resolveHolderLiveness(holder), 'dead');
});

test('resolveHolderLiveness: alive pid with NO recorded processStartTime (pre-H1 legacy holder) -> held (nothing to cross-check, stay conservative)', () => {
  const holder = { id: 'legacy', pid: process.pid };
  assert.equal(resolveHolderLiveness(holder), 'held');
});

test('resolveHolderLiveness: bootId recorded and different from the current boot -> dead, even with a coincidentally live pid', () => {
  const holder = { id: 'pre-reboot', pid: process.pid, bootId: 'a-different-boot-id-entirely', processStartTime: getProcessStartTime(process.pid), host: os.hostname() };
  assert.equal(resolveHolderLiveness(holder), 'dead');
});

test('resolveHolderLiveness: no pid at all -> dead', () => {
  assert.equal(resolveHolderLiveness({ id: 'no-pid' }), 'dead');
  assert.equal(resolveHolderLiveness(null), 'dead');
});

test('acquireRunControl: a live holder (real process, matching processStartTime) is never reclaimed by a contender, even with no ttlMs (always-attempt path)', () => {
  const runDir = mkRunDir();
  const first = acquireRunControl(runDir, { holder: buildRunControlHolder('first') });
  assert.equal(first.status, 'acquired');

  const contender = acquireRunControl(runDir, { holder: buildRunControlHolder('contender') });
  assert.equal(contender.status, 'held');
  assert.equal(contender.holder.id, 'first');
});

test('acquireRunControl: a holder record whose pid was reused by an unrelated process (processStartTime mismatch) IS reclaimed', () => {
  const runDir = mkRunDir();
  const staleHolder = { id: 'stale-holder', pid: process.pid, bootId: getBootId(), processStartTime: 'not-the-real-starttime', host: os.hostname() };
  const first = acquireRunControl(runDir, { holder: staleHolder });
  assert.equal(first.status, 'acquired');

  const contender = acquireRunControl(runDir, { holder: buildRunControlHolder('contender') });
  assert.equal(contender.status, 'acquired');
  assert.equal(contender.controlEpoch, first.controlEpoch + 1);
});

test('acquireRunControl: a holder whose pid is genuinely dead IS reclaimed', () => {
  const runDir = mkRunDir();
  const pid = deadPid();
  const deadHolder = { id: 'dead-holder', pid, bootId: getBootId(), processStartTime: '12345', host: os.hostname() };
  const first = acquireRunControl(runDir, { holder: deadHolder });
  assert.equal(first.status, 'acquired');

  const contender = acquireRunControl(runDir, { holder: buildRunControlHolder('contender') });
  assert.equal(contender.status, 'acquired');
});
