// dispatch-engine-liveness-hardening Phase 1: direct unit tests for the pure
// bootId/processStartTime judge promoted onto process-identity.mjs. This
// judge takes an INJECTED `isAlive` fact rather than probing pid liveness
// itself (that stays caller-specific, e.g. run-lock.mjs's own
// `isProcessAlive`, which uses `process.kill` -- a call this fs-only leaf
// must never contain, per test/runner/dispatch-reconciliation-import-graph
// .test.mjs's BANNED_CALL_PATTERN). Exercises the judge's full decision
// table directly, independent of run-lock-identity.test.mjs's own coverage
// of the same table through run-lock.mjs's thin wrapper + real
// acquireRunControl.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { getBootId, getProcessStartTime, resolveHolderLiveness } from '../../src/runner/dispatch/process-identity.mjs';

// Process identity is read from /proc, so only Linux can prove a pid was
// reused or the host rebooted. Elsewhere the judge has nothing to
// cross-check and fails closed to 'held' by contract.
const HAS_PROC_START_TIME = getProcessStartTime(process.pid) !== null;
const HAS_BOOT_ID = getBootId() !== 'unknown-boot';

// A definitely-dead pid: spawn a real child, let it exit, then reuse its pid
// number -- guaranteed to no longer resolve to any live process.
function deadPid() {
  const result = spawnSync(process.execPath, ['-e', 'process.exit(0)']);
  return result.pid;
}

test('resolveHolderLiveness: live pid (this test process), matching processStartTime, isAlive=true -> held', () => {
  const holder = { id: 'self', pid: process.pid, bootId: getBootId(), processStartTime: getProcessStartTime(process.pid) };
  assert.equal(resolveHolderLiveness(holder, true), 'held');
});

test('resolveHolderLiveness: dead pid, isAlive=false -> dead, regardless of otherwise-matching recorded fields', () => {
  const pid = deadPid();
  const holder = { id: 'gone', pid, bootId: getBootId(), processStartTime: '12345' };
  assert.equal(resolveHolderLiveness(holder, false), 'dead');
});

test('resolveHolderLiveness: isAlive=false short-circuits to dead even when processStartTime would otherwise match', () => {
  const holder = { id: 'self-but-reported-dead', pid: process.pid, bootId: getBootId(), processStartTime: getProcessStartTime(process.pid) };
  assert.equal(resolveHolderLiveness(holder, false), 'dead');
});

test('resolveHolderLiveness: pid reuse -- isAlive=true but a DIFFERENT recorded processStartTime -> dead (pid was reused by an unrelated process)', () => {
  const holder = { id: 'stale', pid: process.pid, bootId: getBootId(), processStartTime: 'not-the-real-starttime' };
  assert.equal(resolveHolderLiveness(holder, true), HAS_PROC_START_TIME ? 'dead' : 'held');
});

test('resolveHolderLiveness: missing recorded processStartTime (legacy holder), isAlive=true -> held (nothing to cross-check, stay conservative)', () => {
  const holder = { id: 'legacy', pid: process.pid };
  assert.equal(resolveHolderLiveness(holder, true), 'held');
});

test('resolveHolderLiveness: unreadable processStartTime for the recorded pid (getProcessStartTime -> null), isAlive=true -> held', () => {
  // A pid number unlikely to exist -- getProcessStartTime reads /proc/<pid>/stat
  // and returns null on ENOENT, independent of the injected isAlive fact.
  const unreadablePid = 999999999;
  const holder = { id: 'unreadable-stat', pid: unreadablePid, processStartTime: 'some-recorded-value' };
  assert.equal(getProcessStartTime(unreadablePid), null);
  assert.equal(resolveHolderLiveness(holder, true), 'held');
});

test('resolveHolderLiveness: missing recorded bootId, isAlive=true, processStartTime matches -> held (bootId check skipped entirely)', () => {
  const holder = { id: 'no-boot-id', pid: process.pid, processStartTime: getProcessStartTime(process.pid) };
  assert.equal(resolveHolderLiveness(holder, true), 'held');
});

test('resolveHolderLiveness: recorded bootId differs from the current boot -> dead, even with isAlive=true and a matching processStartTime', () => {
  const holder = { id: 'pre-reboot', pid: process.pid, bootId: 'a-different-boot-id-entirely', processStartTime: getProcessStartTime(process.pid) };
  assert.equal(resolveHolderLiveness(holder, true), HAS_BOOT_ID ? 'dead' : 'held');
});

test('resolveHolderLiveness: no pid at all -> dead, regardless of isAlive', () => {
  assert.equal(resolveHolderLiveness({ id: 'no-pid' }, true), 'dead');
  assert.equal(resolveHolderLiveness(null, true), 'dead');
  assert.equal(resolveHolderLiveness(undefined, false), 'dead');
});
