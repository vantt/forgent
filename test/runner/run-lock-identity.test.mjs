// Phase 02 H1: acquireRunControl's reclaim decision must be proven-dead
// identity, not raw PID liveness alone -- a PID reused by an unrelated
// process after the real holder died must never be mistaken for the same
// holder. Exercises resolveHolderLiveness's full decision table through the
// real acquireRunControl entry point (fixtures craft the holder record
// directly rather than mocking /proc, since real PID liveness/bootId are
// the only fs state this depends on).

import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { acquireRunControl, buildRunControlHolder } from '../../src/runner/dispatch/run-lock.mjs';
import { selfRecord } from '../../src/runner/dispatch/process-identity.mjs';

function mkRunDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'run-lock-identity-'));
}

// Process identity is read from /proc, so only Linux can prove a pid was
// reused or the host rebooted. Elsewhere resolveHolderLiveness has nothing to
// cross-check and fails closed to 'held' by contract; the tests below assert
// whichever of the two behaviors this platform is supposed to have.
const HAS_PROC_START_TIME = selfRecord().startTime !== undefined;

// A definitely-dead PID: spawn a real child, let it exit, then reuse its pid.
function deadPid() {
  const result = spawnSync(process.execPath, ['-e', 'process.exit(0)']);
  return result.pid;
}

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
  const staleHolder = { id: 'stale-holder', pid: process.pid, bootId: selfRecord().bootId ?? 'unknown-boot', processStartTime: 'not-the-real-starttime', host: os.hostname() };
  const first = acquireRunControl(runDir, { holder: staleHolder });
  assert.equal(first.status, 'acquired');

  const contender = acquireRunControl(runDir, { holder: buildRunControlHolder('contender') });
  if (!HAS_PROC_START_TIME) {
    assert.equal(contender.status, 'held', 'without /proc the reused pid cannot be disproven, so the live pid keeps the lock');
    return;
  }
  assert.equal(contender.status, 'acquired');
  assert.equal(contender.controlEpoch, first.controlEpoch + 1);
});

test('acquireRunControl: a holder whose pid is genuinely dead IS reclaimed', () => {
  const runDir = mkRunDir();
  const pid = deadPid();
  const deadHolder = { id: 'dead-holder', pid, bootId: selfRecord().bootId ?? 'unknown-boot', processStartTime: '12345', host: os.hostname() };
  const first = acquireRunControl(runDir, { holder: deadHolder });
  assert.equal(first.status, 'acquired');

  const contender = acquireRunControl(runDir, { holder: buildRunControlHolder('contender') });
  assert.equal(contender.status, 'acquired');
});
