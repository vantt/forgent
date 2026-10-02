// dispatch-engine-liveness-hardening Phase 8 (S4): the cli-spawn detached-
// supervisor path had no acquireMainCheckoutLock coverage at all, so two
// DIFFERENT MUTATING Assignments (real, independent admission ledgers)
// could mutate the SAME cwd concurrently. This proves the fix against the
// REAL cli-spawn adapter path (useSupervisorRecovery, the default adapter
// for Assignment execution) with a real detached supervisor/worker
// subprocess tree, not a hand-constructed fixture -- mirroring
// assignment-dispatch.test.mjs's own S1 live-probe test style for the same
// adapter. Uses `implement-item` (a KNOWN_MUTATING_OPS operation) rather
// than a read-only one deliberately: the lock is gated on
// `effectiveMutation === 'mutating'` because this repo's own test suite
// (assignment-dispatch.test.mjs's "genuinely concurrent invocations under
// the same --work id" Red-Team fix tests) already proves concurrent
// READ-ONLY dispatch to the SAME cwd through this exact door is intentional
// and must keep working unblocked.
//
// Two concurrent executeAssignment() calls in the SAME process (rather than
// two spawned OS processes) is deliberate and still proves real admission-
// time contention: acquireMainCheckoutLock's own per-call composite string
// identity (`${pid}:${ts}:${rand}`) never self-recognizes a second, unrelated
// call from the same process as a refresh of the first (see
// assignment-runner.mjs's own comment on this), and a composite identity's
// held-ness is judged by the EMBEDDED pid's real liveness -- so the lock
// genuinely contends here exactly as it would across two real OS processes.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildAssignment } from '../helpers/declared-assignment.mjs';
import { executeAssignment } from '../../src/runner/dispatch/assignment-runner.mjs';

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
  return { executor: { allowCrossProvider: true, command: process.execPath, args: [executorScript, '{prompt}'] }, modelPolicies: { claude: { standard: 'test-model' } }, rigorToTier: { low: 'nano', standard: 'standard', high: 'flagship', critical: 'frontier' }, timeoutMs: 5000 };
}

function supervisorBindingPids(runDir) {
  const bindingDir = path.join(runDir, 'protected', 'supervisor-binding');
  if (!fs.existsSync(bindingDir)) return [];
  const pids = [];
  for (const f of fs.readdirSync(bindingDir)) {
    if (!f.endsWith('.json')) continue;
    try {
      const rec = JSON.parse(fs.readFileSync(path.join(bindingDir, f), 'utf8'));
      if (rec.supervisor?.pid) pids.push(rec.supervisor.pid);
      if (rec.worker?.pid) pids.push(rec.worker.pid);
    } catch {}
  }
  return pids;
}

test('executeAssignment: a second, DIFFERENT Assignment targeting the same cwd is refused while the first cli-spawn Run is still live, and --force-shared-cwd (opts.forceSharedCwd) lets it proceed anyway', { timeout: 30000 }, async () => {
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
        assert.equal(err.errorClass, 'dispatch-in-flight', `expected dispatch-in-flight, got ${err.errorClass}: ${err.message}`);
        assert.equal(err.cwd, tempDir);
        assert.ok(typeof err.holderPid === 'string' && err.holderPid.startsWith(`${process.pid}:`), `holder identity must name the current holder; got ${err.holderPid}`);
        assert.ok(err.message.includes(tempDir), 'refusal message must name the contended cwd');
        return true;
      },
    );

    // 3. The explicit override lets a caller who knows this is safe proceed
    // anyway -- fire Assignment C with forceSharedCwd:true and prove it
    // reaches its OWN real supervisor spawn (never refused), even though
    // Assignment A's lock is still held for the exact same cwd.
    pendingC = executeAssignment(assignmentC, { cwd: tempDir, repoRoot: tempDir, runnerConfig, forceSharedCwd: true }).catch((err) => ({ __rejected: err }));
    await waitFor(() => fs.existsSync(markerC) && fs.readFileSync(markerC, 'utf8'));
    const workerPidC = Number(fs.readFileSync(markerC, 'utf8'));
    assert.ok(isPidAliveForTest(workerPidC), 'forceSharedCwd must let Assignment C reach a real worker spawn, not be refused');

    // Neither A nor C must have already settled as a rejection at this point
    // (both are deliberately still in flight, stalled by their own
    // never-settling executor) -- a same-tick resolution to __rejected would
    // mean something else refused/failed them for an unrelated reason.
    const raceTimeout = Symbol('pending');
    const aState = await Promise.race([pendingA, new Promise((r) => setTimeout(() => r(raceTimeout), 50))]);
    const cState = await Promise.race([pendingC, new Promise((r) => setTimeout(() => r(raceTimeout), 50))]);
    assert.equal(aState, raceTimeout, `Assignment A must still be in flight, not settled: ${JSON.stringify(aState)}`);
    assert.equal(cState, raceTimeout, `Assignment C must still be in flight (forceSharedCwd), not settled/refused: ${JSON.stringify(cState)}`);
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
