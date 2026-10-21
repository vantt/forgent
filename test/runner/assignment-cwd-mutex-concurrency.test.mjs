// dispatch-engine-liveness-hardening Phase 8 (S4): the cli-spawn detached-
// supervisor path had no per-cwd dispatch lock coverage at all, so two
// DIFFERENT MUTATING Assignments (real, independent admission ledgers)
// could mutate the SAME cwd concurrently. This proves the fix against the
// REAL cli-spawn adapter path (the run supervisor, the default adapter
// for Assignment execution) with a real detached supervisor/worker
// subprocess tree, not a hand-constructed fixture -- mirroring
// assignment-dispatch.test.mjs's own S1 live-probe test style for the same
// adapter. Uses `implement-item` (a KNOWN_MUTATING_OPS operation) rather
// than a read-only one deliberately: the lock is gated on
// `effectiveMutation === 'mutating'`: concurrent READ-ONLY dispatch to the
// SAME cwd is intentional and must keep working unblocked (the last test
// below proves it).
//
// Two concurrent executeAssignment() calls in the SAME process (rather than
// two spawned OS processes) is deliberate and still proves real admission-
// time contention: each call opens its own description of the kernel lock
// file, and two descriptions exclude each other even inside one process.

import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildAssignment } from '../helpers/declared-assignment.mjs';
import { executeAssignment as executeAssignmentRaw } from '../../src/runner/dispatch/assignment-runner.mjs';
import { bindableExecute } from '../helpers/work-seat-config.mjs';
const executeAssignment = bindableExecute(executeAssignmentRaw);

function mkTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-cwd-mutex-test-'));
}

function waitFor(predicate, { timeoutMs = 10000, intervalMs = 50 } = {}) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;
    const tick = () => {
      let value;
      try {
        value = predicate();
      } catch (err) {
        reject(err);
        return;
      }
      if (value) {
        resolve(value);
        return;
      }
      if (Date.now() > deadline) {
        reject(new Error(`waitFor: timed out after ${timeoutMs}ms`));
        return;
      }
      setTimeout(tick, intervalMs);
    };
    tick();
  });
}

function isPidAliveForTest(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err.code === 'EPERM';
  }
}

// Writes agent-result.json's runDir a liveness marker, then hangs forever --
// never settles, so the Run (and the supervisor/worker subprocess tree
// underneath it) stays genuinely alive for as long as the test needs it.
function writeStallingExecutor(dir) {
  const scriptPath = path.join(dir, 'stalling-executor.mjs');
  fs.writeFileSync(
    scriptPath,
    `
    import fs from 'node:fs';
    import path from 'node:path';
    const prompt = process.argv.slice(2).join(' ');
    const match = /Write structured JSON to (\\S+agent-result\\.json)/.exec(prompt);
    if (match) {
      const runDir = path.dirname(match[1]);
      fs.mkdirSync(runDir, { recursive: true });
      fs.writeFileSync(path.join(runDir, 'worker-alive.pid'), String(process.pid));
    }
    setInterval(() => {}, 60000);
    `,
  );
  return scriptPath;
}

function admissionRunnerConfig(executorScript) {
  return { executor: { allowCrossProvider: true, command: process.execPath, args: [executorScript, '{prompt}'] }, modelPolicies: { claude: { standard: 'test-model' } }, defaults: { tier: 'standard' }, patterns: { seatBinding: { schema: 1 } }, timeoutMs: 5000 };
}

// The supervisor and the gate of an attempt, as the supervisor bound them (host pids).
function supervisorBindingPids(runDir) {
  try {
    const binding = JSON.parse(fs.readFileSync(path.join(runDir, 'supervisor-binding.json'), 'utf8'));
    return [binding.supervisor?.pid, binding.gate?.pid].filter(Number.isInteger);
  } catch {
    return [];
  }
}

test('executeAssignment: a second, DIFFERENT Assignment targeting the same cwd is refused while the first cli-spawn Run is still live, and --force-shared-cwd refuses a writer', { timeout: 30000 }, async () => {
  const tempDir = mkTempDir();
  const executorScript = writeStallingExecutor(tempDir);
  const runnerConfig = admissionRunnerConfig(executorScript);

  const assignmentA = buildAssignment({
    work: { id: 'tsk-cwd-mutex-a', status: 'doing', stage: 'planning', domain: 'coding' },
    stage: 'executing', operation: 'implement-item',
  });
  const assignmentB = buildAssignment({
    work: { id: 'tsk-cwd-mutex-b', status: 'doing', stage: 'planning', domain: 'coding' },
    stage: 'executing', operation: 'implement-item',
  });
  const assignmentC = buildAssignment({
    work: { id: 'tsk-cwd-mutex-c', status: 'doing', stage: 'planning', domain: 'coding' },
    stage: 'executing', operation: 'implement-item',
  });

  const runDirA = path.join(tempDir, '.fgos', 'assignments', assignmentA.assignmentId, 'runs', '01');
  const runDirC = path.join(tempDir, '.fgos', 'assignments', assignmentC.assignmentId, 'runs', '01');
  const markerA = path.join(runDirA, 'worker-alive.pid');
  const markerC = path.join(runDirC, 'worker-alive.pid');

  // Fire Assignment A's dispatch but do not await it yet -- it will acquire
  // the cwd lock, spawn a real detached supervisor, and then sit polling for
  // a receipt that never arrives (the stalling executor never settles).
  const pendingA = executeAssignment(assignmentA, { cwd: tempDir, repoRoot: tempDir, runnerConfig }).catch((err) => ({ __rejected: err }));
  // Declared here (not `const` inside the try below) so the finally block
  // can still reference it once assigned.
  let pendingC;

  try {
    // 1. Wait for Assignment A's own REAL worker to start -- proves A is
    // genuinely past admission, past the new cwd-lock acquisition, and has
    // a live detached supervisor/worker subprocess tree mutating this cwd.
    await waitFor(() => fs.existsSync(markerA) && fs.readFileSync(markerA, 'utf8'));
    const workerPidA = Number(fs.readFileSync(markerA, 'utf8'));
    assert.ok(isPidAliveForTest(workerPidA), 'precondition: Assignment A\'s worker pid must be alive');

    // 2. A SECOND, unrelated Assignment (different assignmentId, own
    // independent admission ledger) targeting the SAME cwd must be refused
    // by default -- naming the current holder, not silently double-dispatched.
    await assert.rejects(
      () => executeAssignment(assignmentB, { cwd: tempDir, repoRoot: tempDir, runnerConfig }),
      (err) => {
        assert.equal(err.errorClass, 'dispatch-in-flight', err.message);
        assert.equal(err.cwd, tempDir);
        if (process.platform === 'linux') {
          assert.ok([process.pid, ...supervisorBindingPids(runDirA)].includes(err.holderPid), 'refusal names the controller or a holder inside this attempt');
        }
        assert.ok(err.message.includes(tempDir), 'refusal message must name the contended cwd');
        return true;
      },
    );

    // A mutating caller cannot opt out of custody, even while another writer runs.
    await assert.rejects(
      () => executeAssignment(assignmentC, { cwd: tempDir, repoRoot: tempDir, runnerConfig, forceSharedCwd: true }),
      (err) => {
        assert.equal(err.code, 'custody-required');
        assert.equal(err.cwd, tempDir);
        assert.equal(typeof err.executorId, 'string');
        assert.equal(typeof err.capability, 'string');
        return true;
      },
    );
    assert.equal(fs.existsSync(markerC), false, 'refusal starts no producer');
    const raceTimeout = Symbol('pending');
    const aState = await Promise.race([pendingA, new Promise((r) => setTimeout(() => r(raceTimeout), 50))]);
    assert.equal(aState, raceTimeout, `Assignment A must still be in flight: ${JSON.stringify(aState)}`);
  } finally {
    // Process hygiene: kill every real detached supervisor/worker this test
    // spawned (for both A and C), then let the two pending executeAssignment
    // calls settle (their own receipt-poll loop notices the dead supervisor
    // and stops waiting) so the test process exits clean.
    for (const runDir of [runDirA, runDirC]) {
      for (const pid of supervisorBindingPids(runDir)) {
        if (isPidAliveForTest(pid)) {
          try { process.kill(pid, 'SIGKILL'); } catch {}
        }
      }
    }
    for (const markerPath of [markerA, markerC]) {
      if (fs.existsSync(markerPath)) {
        const pid = Number(fs.readFileSync(markerPath, 'utf8'));
        if (isPidAliveForTest(pid)) {
          try { process.kill(pid, 'SIGKILL'); } catch {}
        }
      }
    }
    await Promise.allSettled([pendingA, pendingC]);
  }
});

test('executeAssignment: two DIFFERENT read-only Assignments on the same cwd run side by side -- the cwd lock is taken only for mutating work', { timeout: 30000 }, async () => {
  const tempDir = mkTempDir();
  const executorScript = writeStallingExecutor(tempDir);
  const runnerConfig = admissionRunnerConfig(executorScript);
  const readOnly = (id) => buildAssignment({
    work: { id, status: 'doing', workflowStep: 'planning', domain: 'coding' },
    stage: 'planning', operation: 'validate-plan',
  });
  const assignments = [readOnly('tsk-cwd-ro-a'), readOnly('tsk-cwd-ro-b')];
  const runDirs = assignments.map((a) => path.join(tempDir, '.fgos', 'assignments', a.assignmentId, 'runs', '01'));
  const markers = runDirs.map((d) => path.join(d, 'worker-alive.pid'));
  const pending = [];

  try {
    for (const [i, assignment] of assignments.entries()) {
      assert.notEqual(assignment.mutation, 'mutating', 'precondition: validate-plan is a read-only operation');
      pending.push(executeAssignment(assignment, { cwd: tempDir, repoRoot: tempDir, runnerConfig }).catch((err) => ({ __rejected: err })));
      // Each worker really starts while the other is still live: neither is refused dispatch-in-flight.
      await waitFor(() => fs.existsSync(markers[i]) && fs.readFileSync(markers[i], 'utf8'));
      assert.ok(isPidAliveForTest(Number(fs.readFileSync(markers[i], 'utf8'))));
    }
    const pendingMark = Symbol('pending');
    for (const p of pending) {
      assert.equal(await Promise.race([p, new Promise((r) => setTimeout(() => r(pendingMark), 50))]), pendingMark);
    }
  } finally {
    for (const runDir of runDirs) {
      for (const pid of supervisorBindingPids(runDir)) {
        if (isPidAliveForTest(pid)) try { process.kill(pid, 'SIGKILL'); } catch {}
      }
    }
    for (const marker of markers) {
      if (!fs.existsSync(marker)) continue;
      const pid = Number(fs.readFileSync(marker, 'utf8'));
      if (isPidAliveForTest(pid)) try { process.kill(pid, 'SIGKILL'); } catch {}
    }
    await Promise.allSettled(pending);
  }
});

test('a settled standalone Assignment survives a failed custody handoff with a warning', { timeout: 30000 }, async (t) => {
  const { resolveLock } = await import('../../src/holder-lock/index.mjs');
  const tempDir = mkTempDir();
  t.after(() => fs.rmSync(tempDir, { recursive: true, force: true }));
  const script = path.join(tempDir, 'settling-worker.mjs');
  const go = path.join(tempDir, 'handoff-test-go');
  fs.writeFileSync(script, `
    import fs from 'node:fs';
    import path from 'node:path';
    const match = /Write structured JSON to (\\S+agent-result\\.json)/.exec(process.argv.slice(2).join(' '));
    if (!match) throw new Error('result path missing');
    process.stdout.write('handoff barrier\\n');
    const until = Date.now() + 15000;
    while (!fs.existsSync(${JSON.stringify(go)})) {
      if (Date.now() > until) throw new Error('controller did not release barrier');
      await new Promise(r => setTimeout(r, 10));
    }
    fs.writeFileSync(path.join(path.dirname(match[1]), 'agent-report.md'), 'Successfully completed the handoff failure fixture with real supervisor settlement.');
    fs.writeFileSync(match[1], JSON.stringify({ status: 'done', summary: 'Completed fixture' }));
  `);
  const assignment = buildAssignment({
    work: { id: 'tsk-cwd-handoff-warning', status: 'doing', domain: 'coding' },
    stage: 'executing', operation: 'implement-item',
  });
  const record = `${resolveLock('dispatch-cwd', { fgosDir: path.join(tempDir, '.fgos'), cwd: tempDir }).v3Path}.predecessor.json`;
  const result = await executeAssignment(assignment, {
    cwd: tempDir, repoRoot: tempDir, runnerConfig: admissionRunnerConfig(script),
    onChunk: (_stream, text) => {
      if (text.includes('handoff barrier')) {
        fs.writeFileSync(record, 'broken record');
        fs.writeFileSync(go, 'continue');
      }
    },
  });
  assert.equal(result.classification.execution.status, 'completed');
  assert.equal(result.classification.execution.exitCode, 0);
  assert.equal(result.agentClaim.status, 'done');
  assert.ok(Object.isFrozen(result));
  assert.equal(result.warnings[0].code, 'custody-handoff-not-recorded');
  assert.equal(fs.readFileSync(record, 'utf8'), 'broken record');
});
