// The time one run may take: a duration a person types (`fgos run --timeout 90m`), checked against
// one floor and one ceiling, and the private-home reaper that must not take the home of a run
// still inside that time.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseRunTimeout, assertRunTimeoutMs, RUN_TIMEOUT_MAX_MS, RUN_TIMEOUT_MIN_MS, RunnerConfigError } from '../../src/runner/dispatch/config.mjs';
import { writeOwnershipMarker, readOwnershipMarker, reapOrphanedConfinementResources, OWNERSHIP_MARKER_FILE } from '../../src/runner/dispatch/confinement/cleanup.mjs';

test('parseRunTimeout reads a whole number with one unit', () => {
  assert.equal(parseRunTimeout('90m'), 5400000);
  assert.equal(parseRunTimeout('5400s'), 5400000);
  assert.equal(parseRunTimeout('2h'), 7200000);
  assert.equal(parseRunTimeout('600000ms'), 600000);
  for (const bad of ['', '90', 'm', '1.5h', '-5m', '90 m', '1h30m', '90min', 'abc']) {
    assert.throws(() => parseRunTimeout(bad), RunnerConfigError, bad);
  }
});

test('a run timeout is refused under one minute and over four hours', () => {
  assert.equal(RUN_TIMEOUT_MIN_MS, 60000);
  assert.equal(RUN_TIMEOUT_MAX_MS, 4 * 3600000);
  assert.equal(assertRunTimeoutMs(RUN_TIMEOUT_MAX_MS), RUN_TIMEOUT_MAX_MS);
  assert.throws(() => parseRunTimeout('30s'), /at least 1m/);
  assert.throws(() => parseRunTimeout('5h'), /at most 4h/);
  assert.throws(() => assertRunTimeoutMs(Number.NaN), RunnerConfigError);
});

test('the ownership marker records the run timeout of the dispatch that made the home', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-marker-timeout-'));
  try {
    writeOwnershipMarker(dir, { dispatchId: 'd-1', timeoutMs: 5400000 });
    assert.equal(readOwnershipMarker(dir).timeoutMs, 5400000);
    const plain = path.join(dir, 'plain');
    fs.mkdirSync(plain);
    writeOwnershipMarker(plain, { dispatchId: 'd-2' });
    assert.equal('timeoutMs' in readOwnershipMarker(plain), false);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

/** A home whose marker says it was made `ageMs` ago by `pid`, optionally for a run of `timeoutMs`. */
function agedHome(root, name, { ageMs, pid = process.pid, timeoutMs } = {}) {
  const home = path.join(root, name, 'home');
  fs.mkdirSync(home, { recursive: true });
  writeOwnershipMarker(home, { dispatchId: name, pid, ...(timeoutMs !== undefined ? { timeoutMs } : {}) });
  const markerPath = path.join(home, OWNERSHIP_MARKER_FILE);
  const marker = JSON.parse(fs.readFileSync(markerPath, 'utf8'));
  marker.createdAt = new Date(Date.now() - ageMs).toISOString();
  fs.writeFileSync(markerPath, JSON.stringify(marker));
  return home;
}

test('the reaper keeps the home of a live run still inside its own timeout, past the default hour', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-reap-long-run-'));
  try {
    const H = 3600000;
    // A 3h run, 2h in: its worker is still at work in this home.
    const inTime = agedHome(root, 'long-run', { ageMs: 2 * H, timeoutMs: 3 * H });
    // The same run long past its timeout and the settle grace: the dispatcher is stuck, reclaim it.
    const overdue = agedHome(root, 'overdue-run', { ageMs: 4 * H, timeoutMs: 3 * H });
    // No timeout recorded (an older marker): the default hour still applies.
    const legacy = agedHome(root, 'legacy-run', { ageMs: 2 * H });
    // A dead dispatcher's home goes whatever its timeout says.
    const dead = agedHome(root, 'dead-run', { ageMs: 60000, pid: 99999999, timeoutMs: 3 * H });
    // A marker asking for more than the ceiling is held to the ceiling, never kept forever.
    const forged = agedHome(root, 'forged-run', { ageMs: 5 * H, timeoutMs: 1000 * H });

    const { reaped, skipped } = reapOrphanedConfinementResources({ tempRoot: root });
    const reapedIds = reaped.map((r) => r.dispatchId).sort();
    assert.deepEqual(reapedIds, ['dead-run', 'forged-run', 'legacy-run', 'overdue-run']);
    assert.ok(fs.existsSync(inTime));
    assert.ok(skipped.some((s) => s.path === inTime && s.reason === 'process-alive-and-not-expired'));
    for (const gone of [overdue, legacy, dead, forged]) assert.ok(!fs.existsSync(gone), gone);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
