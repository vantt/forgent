import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runGoalCheck, detachedWorktreeFgosHint } from '../../src/runner/goal-check.mjs';

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
  assert.equal(result.timedOut, false);
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
  // tsk-53o: a genuine verify failure must never be reported as a timeout —
  // this is the "not passed:true, but also not a timeout" boundary the
  // whole point of `timedOut` exists to distinguish from a real fail.
  assert.equal(result.timedOut, false);
});

test('runGoalCheck resolves {timedOut:false} on a genuine spawn failure (statusless, but not a timeout)', async () => {
  // A cwd that does not exist fails the underlying spawn syscall itself
  // (ENOENT) before any shell ever starts, even with shell:true — this hits
  // goal-check.mjs's `child.on('error', ...)` branch, the one OTHER
  // statusless outcome besides a real timeout. `timedOut` must distinguish
  // the two: this is the exact ambiguity tsk-53o's bug report describes
  // (return could not tell a real timeout apart from any other statusless
  // failure).
  const cwd = path.join(mkTempDir(), 'does-not-exist');
  const result = await runGoalCheck(makeItem('exit 0'), cwd);
  assert.equal(result.passed, false);
  assert.equal(result.status, null);
  assert.equal(result.timedOut, false);
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
  // tsk-53o: this is the field this whole item exists to add — a timeout
  // must be distinguishable from a genuine verify failure, which the
  // pre-fix {passed:false, status:null} shape alone could never prove.
  assert.equal(result.timedOut, true);
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

// --- output cap ------------------------------------------------------------
// runGoalCheck stops appending once captured output reaches the 10 MiB
// maxBuffer — a runaway-chatty verify never grows `output` without bound. The
// process still runs to completion and resolves with its real exit status;
// only the retained text is bounded (the over-cap chunks are dropped, not the
// exit code).

test('runGoalCheck caps captured output at maxBuffer but still resolves the real exit status', async () => {
  const cwd = mkTempDir();
  const maxBuffer = 10 * 1024 * 1024;
  const emitted = 11 * 1024 * 1024; // deliberately over the cap
  // Emit `emitted` bytes to stdout, then exit 0, entirely inside a real child.
  const script = `process.stdout.write('x'.repeat(${emitted}))`;
  const result = await runGoalCheck(
    makeItem(`${process.execPath} -e ${JSON.stringify(script)}`),
    cwd,
  );

  assert.equal(result.passed, true, 'an over-chatty verify that exits 0 still passes');
  assert.equal(result.status, 0);
  // Truncation: what we kept is bounded by maxBuffer and strictly less than
  // what the child actually wrote — proving the over-cap chunks were dropped.
  assert.ok(result.output.length <= maxBuffer, `output ${result.output.length} must not exceed maxBuffer ${maxBuffer}`);
  assert.ok(result.output.length < emitted, 'captured output must be smaller than the emitted stream');
});

// tsk-4o9: detachedWorktreeFgosHint -- advisory hint keyed on the real
// failure OUTPUT, never the verify command string (see plan.md's own
// false-positive analysis for why a string-match approach was rejected).

test('detachedWorktreeFgosHint returns null for output with no .fgos mention at all', () => {
  assert.equal(detachedWorktreeFgosHint('AssertionError: expected 1 to equal 2\n'), null);
});

test('detachedWorktreeFgosHint returns null when .fgos appears but nothing suggests it is missing', () => {
  // Mirrors the confirmed false-positive class (RESEARCH.md): tsk-f38/tsk-5hv's
  // own real verify greps for ".fgos/" only inside an rg exclusion glob --
  // a failure unrelated to that glob must never produce this hint.
  assert.equal(
    detachedWorktreeFgosHint("rg: pattern matched in some-other-file.mjs\n(excluded '.fgos/events.jsonl*' as configured)\n"),
    null,
  );
});

test('detachedWorktreeFgosHint returns null for a real missing-file error unrelated to .fgos', () => {
  assert.equal(detachedWorktreeFgosHint("Error: ENOENT: no such file or directory, open 'package.json'\n"), null);
});

test('detachedWorktreeFgosHint returns the hint for output shaped like a real .fgos/-missing failure', () => {
  const hint = detachedWorktreeFgosHint("Error: ENOENT: no such file or directory, open '.fgos/config.json'\n");
  assert.equal(typeof hint, 'string');
  assert.match(hint, /ADR0020/);
});

test('detachedWorktreeFgosHint recognizes "not found"/"no such file" phrasing too, not only ENOENT', () => {
  assert.equal(typeof detachedWorktreeFgosHint('.fgos/config.json: not found\n'), 'string');
  assert.equal(typeof detachedWorktreeFgosHint('cat: .fgos/config.json: no such file or directory\n'), 'string');
});

test('detachedWorktreeFgosHint returns null for non-string input', () => {
  assert.equal(detachedWorktreeFgosHint(undefined), null);
  assert.equal(detachedWorktreeFgosHint(null), null);
});
