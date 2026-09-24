// Regression coverage for a suspected assignmentId allocator race: two real,
// separate OS processes racing claimAssignmentId() under the SAME
// assignmentsDir + writerId-derived work token + operation id (the exact
// shape a coordination-session dispatch reaches through
// createSessionAssignment(), src/runner/coordination/store.mjs:868) must
// never both succeed in claiming the same id -- claimAssignmentId's
// exclusive-create directory claim (fs.mkdirSync, no {recursive:true} --
// EEXIST on collision, rebuild-and-retry with a fresh disk scan) is meant to
// be atomic across processes, not just within one. This proves it, rather
// than assuming the in-process unit coverage (coordination-store.test.mjs)
// generalizes to real concurrent processes -- the same standard
// dispatch-reconciliation-concurrency.test.mjs's own 2-process CAS proof
// already holds for a different mechanism (the per-cwd dispatch lock).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const repoRoot = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const workerPath = path.join(repoRoot, 'test/runner/dispatch-assignment-id-claim-concurrency.helper.mjs');

function mkTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-assignment-id-race-'));
}

// Spawns a real, separate node process (not an in-process call) running the
// worker helper above -- stdio: 'pipe' so its single JSON result object
// comes back over a real OS pipe, the same channel a real concurrent caller
// would use.
function runWorker(assignmentsDir, writerId, operation, readyFile, goFile) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [workerPath, assignmentsDir, writerId, operation, readyFile, goFile], { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => { stdout += d; });
    child.stderr.on('data', (d) => { stderr += d; });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) { reject(new Error(`worker exited ${code}: ${stderr}`)); return; }
      try { resolve(JSON.parse(stdout)); } catch (err) { reject(new Error(`worker produced non-JSON stdout ${JSON.stringify(stdout)}: ${err.message}`)); }
    });
  });
}

test('two real concurrent OS processes claiming an assignmentId under the SAME writerId+operation prefix never collide: distinct ids, neither process\'s own marker file is overwritten by the other', async () => {
  const assignmentsDir = mkTempDir();
  const writerId = 'lead-executor-policy-dispatch-seams';
  const operation = 'review-candidate';

  const readyA = path.join(assignmentsDir, 'ready-a');
  const readyB = path.join(assignmentsDir, 'ready-b');
  const goFile = path.join(assignmentsDir, 'go');

  const childA = runWorker(assignmentsDir, writerId, operation, readyA, goFile);
  const childB = runWorker(assignmentsDir, writerId, operation, readyB, goFile);

  // Release both real processes together only once BOTH have signalled
  // ready, maximizing genuine overlap between their claimAssignmentId calls
  // instead of an incidentally-sequential run.
  const readyDeadline = Date.now() + 10000;
  while ((!fs.existsSync(readyA) || !fs.existsSync(readyB)) && Date.now() < readyDeadline) {
    await new Promise((r) => { setTimeout(r, 5); });
  }
  assert.equal(fs.existsSync(readyA), true, 'worker A never signalled ready');
  assert.equal(fs.existsSync(readyB), true, 'worker B never signalled ready');
  fs.writeFileSync(goFile, '1');

  const [resultA, resultB] = await Promise.all([childA, childB]);

  // The one invariant that must hold regardless of which real process wins
  // the exclusive-create race: two DIFFERENT ids, never the same one twice.
  assert.notEqual(resultA.assignmentId, resultB.assignmentId, `both processes claimed the SAME assignmentId -- a real collision: ${JSON.stringify({ resultA, resultB })}`);
  // Coordination's own createSessionAssignment (store.mjs:868) builds
  // through this exact inline shape too (provenance.kind: 'inline'), which
  // has no operation/stage param at all (INLINE_ASSIGNMENT_PARAM_WHITELIST)
  // -- createAssignmentId's own `operation || stage || 'op'` fallback always
  // resolves to the literal 'op' token here, matching the real bug report's
  // own observed id shape (asgn_lead_executor_policy_dispatch_seams_op_011)
  // exactly, not a sanitized operation name.
  const expectedPrefix = `asgn_${writerId.replace(/-/g, '_')}_op_`;
  assert.ok(resultA.assignmentId.startsWith(expectedPrefix), `unexpected id shape: ${resultA.assignmentId}`);
  assert.ok(resultB.assignmentId.startsWith(expectedPrefix), `unexpected id shape: ${resultB.assignmentId}`);

  // Each worker's own marker file, read back by ITSELF right after writing
  // it, must still carry its OWN pid -- if the other process's directory
  // claim or write had landed on top of this one (the exact "later write
  // overwrote the earlier session's evidence files" symptom the bug report
  // described), this would read back the OTHER worker's pid instead.
  assert.equal(resultA.readBackPid, resultA.pid, 'worker A read back a marker it did not write -- cross-process overwrite');
  assert.equal(resultB.readBackPid, resultB.pid, 'worker B read back a marker it did not write -- cross-process overwrite');

  // Independently re-verify from the parent process too, after both workers
  // exited: both claimed directories exist, each with its own untouched
  // marker naming its own pid.
  const markerA = JSON.parse(fs.readFileSync(path.join(assignmentsDir, resultA.assignmentId, 'claimed-by.json'), 'utf8'));
  const markerB = JSON.parse(fs.readFileSync(path.join(assignmentsDir, resultB.assignmentId, 'claimed-by.json'), 'utf8'));
  assert.equal(markerA.pid, resultA.pid);
  assert.equal(markerB.pid, resultB.pid);
});
