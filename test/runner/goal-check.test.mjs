import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runGoalCheck } from '../../src/runner/goal-check.mjs';

// runGoalCheck runs `item.verify` — a real shell command string, via a real
// shell (shell:true is intentional here, per goal-check.mjs's own doc
// comment — unlike dispatch.mjs's argv-array/shell:false discipline) — and
// judges only by its exit status. Every test below exercises a REAL,
// short-lived child process (never mocked), mirroring dispatch.test.mjs's
// own fake-executor-via-mkdtemp pattern.

function mkTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-goal-check-test-'));
}

function makeItem(verify) {
  return { id: 'demo-item', verify };
}

// --- pass ------------------------------------------------------------------

test('runGoalCheck resolves {passed:true, status:0} when verify exits 0', async () => {
  const cwd = mkTempDir();
  const result = await runGoalCheck(makeItem('exit 0'), cwd);
  assert.equal(result.passed, true);
  assert.equal(result.status, 0);
});

test('runGoalCheck runs the verify command inside the given cwd', async () => {
  const cwd = mkTempDir();
  fs.writeFileSync(path.join(cwd, 'marker.txt'), 'present\n');
  const result = await runGoalCheck(makeItem('test -f marker.txt'), cwd);
  assert.equal(result.passed, true);
  assert.equal(result.status, 0);
});

// --- fail --------------------------------------------------------------

test('runGoalCheck resolves {passed:false, status:<nonzero>} when verify exits nonzero', async () => {
  const cwd = mkTempDir();
  const result = await runGoalCheck(makeItem('exit 7'), cwd);
  assert.equal(result.passed, false);
  assert.equal(result.status, 7);
});

// --- timeout: a defined RESOLVED outcome, never a throw/reject -------------

test('runGoalCheck resolves (never throws/rejects) {passed:false, status:null} on a timeout, and kills the process', async () => {
  const cwd = mkTempDir();
  const scriptPath = path.join(cwd, 'hang.mjs');
  // A short busy-wait, not a long one: `verify` runs via a real shell
  // (shell:true), and a shell running a single command can FORK rather than
  // exec into it — the timeout only kills the directly-spawned shell (same
  // known GRANDCHILD-SIGTERM limitation dispatch.mjs already documents for
  // spawnWorker, per this cell's action), so the grandchild busy-wait below
  // keeps running for its own full duration regardless. 1.5s (well past the
  // 200ms timeout, so the timeout path is genuinely exercised) keeps that
  // orphaned runtime bounded instead of blocking this suite for real minutes.
  fs.writeFileSync(
    scriptPath,
    `const until = Date.now() + 1500; while (Date.now() < until) { /* busy-wait past the 200ms timeout below */ }`,
  );

  const result = await runGoalCheck(makeItem(`${process.execPath} ${JSON.stringify(scriptPath)}`), cwd, 200);
  assert.equal(result.passed, false);
  assert.equal(result.status, null);
});

// --- output: both stdout and stderr are captured ---------------------------

test('runGoalCheck output captures both stdout and stderr', async () => {
  const cwd = mkTempDir();
  const result = await runGoalCheck(makeItem('echo out-marker && echo err-marker 1>&2'), cwd);
  assert.match(result.output, /out-marker/);
  assert.match(result.output, /err-marker/);
});

test('runGoalCheck output is captured even on a failing verify (exit nonzero)', async () => {
  const cwd = mkTempDir();
  const result = await runGoalCheck(makeItem('echo failure-detail 1>&2; exit 3'), cwd);
  assert.equal(result.passed, false);
  assert.equal(result.status, 3);
  assert.match(result.output, /failure-detail/);
});
