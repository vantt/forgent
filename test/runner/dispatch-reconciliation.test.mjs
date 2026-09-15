import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { planReconciliation, applyReconciliation } from '../../src/runner/dispatch/reconciliation-planner.mjs';

function root() { const out = fs.mkdtempSync(path.join(os.tmpdir(), 'dispatch-reconcile-')); fs.mkdirSync(path.join(out, '.fgos'), { recursive: true }); return out; }
function deadLock(dir, extra = {}) { fs.writeFileSync(path.join(dir, '.fgos', 'dispatch.lock'), JSON.stringify({ pid: 99999999, startTime: '1', ...extra })); }

// collect-result fixture helpers -- same shapes as test/runner/dispatch-runtime-inspect.test.mjs,
// since collect-result's own plan/apply is built entirely on top of inspectDispatchRuntime's
// --run/--assignment views and must never disagree with what that module considers a Run,
// an owner, or a current admitted Run.
function assignmentDir(dir, id) { const d = path.join(dir, '.fgos', 'assignments', id); fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(path.join(d, 'assignment.json'), JSON.stringify({ assignmentId: id })); return d; }
function runDirFor(dir, id, attempt, value, result) { const d = path.join(dir, '.fgos', 'assignments', id, 'runs', attempt); fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(path.join(d, 'run.json'), JSON.stringify({ assignmentId: id, ...value })); if (result) fs.writeFileSync(path.join(d, 'result.json'), JSON.stringify(result)); return d; }
function admitGen(dir, id, epoch, value) { const d = path.join(dir, '.fgos', 'assignments', id, 'admission', 'generations'); fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(path.join(d, `${String(epoch).padStart(10, '0')}.json`), JSON.stringify(value)); }
const legacyResult = (runId, assignmentId) => ({ runId, assignmentId, status: 'done', confidence: 'reported' });
function deadClaim(dir, assignmentId, extra = {}) { const d = path.join(dir, '.fgos', 'assignments', assignmentId); fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(path.join(d, 'dispatch.claim'), JSON.stringify({ pid: 99999999, startTime: '1', ...extra })); }

test('reconcile clears only a dead-proven cwd lock and replay is idempotent', () => {
  const dir = root(); deadLock(dir); const plan = planReconciliation(dir, { now: '2026-09-15T00:00:00.000Z' });
  assert.equal(plan.outcome, 'planned'); assert.match(plan.snapshot.resourceIncarnation, /^pid:/);
  assert.equal(applyReconciliation(dir, plan, { now: '2026-09-15T00:00:01.000Z' }).outcome, 'applied');
  assert.equal(fs.existsSync(path.join(dir, '.fgos', 'dispatch.lock')), false);
  assert.equal(applyReconciliation(dir, plan, { now: '2026-09-15T00:00:02.000Z' }).outcome, 'already-applied');
});

test('reconcile refuses ttl-only or live/ambiguous proof and never unlinks a successor', () => {
  const dir = root(); fs.writeFileSync(path.join(dir, '.fgos', 'dispatch.lock'), JSON.stringify({ pid: process.pid, startTime: 'wrong', expiresAt: '2000-01-01T00:00:00.000Z' }));
  // Reused/mismatched incarnation is dead proof, but successor replacement is CAS-stale.
  const plan = planReconciliation(dir, { now: '2026-09-15T00:00:00.000Z' }); assert.equal(plan.outcome, 'planned');
  fs.writeFileSync(path.join(dir, '.fgos', 'dispatch.lock'), JSON.stringify({ pid: process.pid, startTime: 'other' }));
  assert.equal(applyReconciliation(dir, plan, { now: '2026-09-15T00:00:01.000Z' }).outcome, 'plan-stale');
  assert.equal(fs.existsSync(path.join(dir, '.fgos', 'dispatch.lock')), true);
  assert.equal(planReconciliation(dir, { action: 'kill-process' }).outcome, 'refused');
});

test('planReconciliation refuses a live holder (real resource-incarnation match) and never produces a plan', () => {
  const dir = root();
  const actualStart = fs.readFileSync(`/proc/${process.pid}/stat`, 'utf8').trim().split(' ')[21];
  fs.writeFileSync(path.join(dir, '.fgos', 'dispatch.lock'), JSON.stringify({ pid: process.pid, startTime: actualStart }));
  const plan = planReconciliation(dir, { now: '2026-09-15T00:00:00.000Z' });
  assert.equal(plan.outcome, 'refused');
  assert.match(plan.reason, /live/);
});

test('apply detects a controlEpoch change on the still-dead holder between planning and apply as plan-stale', () => {
  const dir = root();
  fs.writeFileSync(path.join(dir, '.fgos', 'dispatch.lock'), JSON.stringify({ pid: 99999999, startTime: '1', controlEpoch: 1 }));
  const plan = planReconciliation(dir, { now: '2026-09-15T00:00:00.000Z' });
  assert.equal(plan.outcome, 'planned');
  assert.equal(plan.snapshot.controlEpoch, 1);
  fs.writeFileSync(path.join(dir, '.fgos', 'dispatch.lock'), JSON.stringify({ pid: 99999999, startTime: '1', controlEpoch: 2 }));
  const result = applyReconciliation(dir, plan, { now: '2026-09-15T00:00:01.000Z' });
  assert.equal(result.outcome, 'plan-stale');
  assert.equal(fs.existsSync(path.join(dir, '.fgos', 'dispatch.lock')), true);
});

test('apply against a dead holder proves plan-stale when a successor guard replaces it, and the successor bytes survive intact', () => {
  const dir = root(); deadLock(dir);
  const lockPath = path.join(dir, '.fgos', 'dispatch.lock');
  const plan = planReconciliation(dir, { now: '2026-09-15T00:00:00.000Z' });
  assert.equal(plan.outcome, 'planned');
  const successorBytes = JSON.stringify({ pid: 12345, startTime: 'successor-incarnation' });
  fs.writeFileSync(lockPath, successorBytes);
  const result = applyReconciliation(dir, plan, { now: '2026-09-15T00:00:01.000Z' });
  assert.equal(result.outcome, 'plan-stale');
  assert.equal(fs.readFileSync(lockPath, 'utf8'), successorBytes, "successor's own bytes must survive intact");
});

test('a cwd lock removed by a concurrent cleanup before apply\'s final re-read returns plan-stale, not a throw', () => {
  const dir = root(); deadLock(dir);
  const lockPath = path.join(dir, '.fgos', 'dispatch.lock');
  const plan = planReconciliation(dir, { now: '2026-09-15T00:00:00.000Z' });
  assert.equal(plan.outcome, 'planned');
  const original = fs.readFileSync;
  // applyReconciliation reads lockPath 3 times before its own explicit
  // final re-read: twice inside the internal `fresh = planReconciliation(...)`
  // re-verify (its own `raw` read, then `json(file)`'s internal read), and
  // once more inside `inspectDispatchRuntime`'s cwd-evidence lookup. Only the
  // 4th read is the actual target this test races against -- delete the
  // file BEFORE that read runs (not after, which would let the read still
  // succeed and only make the later unlink hit ENOENT instead, a different,
  // already-tolerated branch), so the read itself genuinely throws ENOENT.
  let lockPathReads = 0;
  fs.readFileSync = function patchedReadFileSync(file, ...rest) {
    if (file === lockPath) {
      lockPathReads += 1;
      if (lockPathReads === 4) fs.unlinkSync(lockPath); // simulate a concurrent cleanup racing the final re-read
    }
    return original.call(fs, file, ...rest);
  };
  let result;
  try {
    result = applyReconciliation(dir, plan, { now: '2026-09-15T00:00:01.000Z' });
  } finally {
    fs.readFileSync = original;
  }
  assert.equal(result.outcome, 'plan-stale');
  assert.match(result.reason, /already removed/);
  assert.equal(fs.existsSync(lockPath), false);
});

test('apply blocks a dead-holder cleanup when an active assignment Run is still bound to this cwd', () => {
  const dir = root(); deadLock(dir);
  const plan = planReconciliation(dir, { now: '2026-09-15T00:00:00.000Z' });
  assert.equal(plan.outcome, 'planned');
  const runDir = path.join(dir, '.fgos', 'assignments', 'asgn-x', 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, 'run.json'), JSON.stringify({ runId: 'run-x', assignmentId: 'asgn-x', cwd: dir }));
  const result = applyReconciliation(dir, plan, { now: '2026-09-15T00:00:01.000Z' });
  assert.equal(result.outcome, 'blocked');
  assert.match(result.reason, /active Run/);
  assert.equal(fs.existsSync(path.join(dir, '.fgos', 'dispatch.lock')), true);
});

test('apply blocks a dead-holder cleanup when a pending (unsettled) dispatch launch is still bound to this cwd', () => {
  const dir = root(); deadLock(dir);
  const plan = planReconciliation(dir, { now: '2026-09-15T00:00:00.000Z' });
  assert.equal(plan.outcome, 'planned');
  const runDir = path.join(dir, '.fgos', 'dispatch-runs', 'fanout-group-x', '01');
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, 'run.json'), JSON.stringify({ runId: 'run-launch-x', cwd: dir }));
  // No result.json yet: this launch was admitted but has not settled.
  const result = applyReconciliation(dir, plan, { now: '2026-09-15T00:00:01.000Z' });
  assert.equal(result.outcome, 'blocked');
  assert.match(result.reason, /active Run/);
  assert.equal(fs.existsSync(path.join(dir, '.fgos', 'dispatch.lock')), true);
});

test('reconcile collect-result links an already-written valid result for a standalone Assignment Run', () => {
  const dir = root();
  assignmentDir(dir, 'a');
  runDirFor(dir, 'a', '01', { runId: 'run-1' }, legacyResult('run-1', 'a'));
  admitGen(dir, 'a', 1, { runId: 'run-1', attempt: 1 });
  const plan = planReconciliation(dir, { action: 'collect-result', runId: 'run-1', now: '2026-09-15T00:00:00.000Z' });
  assert.equal(plan.outcome, 'planned');
  assert.equal(plan.proposedAction.kind, 'collect-result');
  assert.equal(plan.snapshot.ownerAuthority.kind, 'standalone-run');
  const applied = applyReconciliation(dir, plan, { now: '2026-09-15T00:00:01.000Z' });
  assert.equal(applied.outcome, 'applied');
  const runJson = JSON.parse(fs.readFileSync(path.join(dir, '.fgos', 'assignments', 'a', 'runs', '01', 'run.json'), 'utf8'));
  assert.equal(runJson.resultCollectedAt, '2026-09-15T00:00:01.000Z');
  assert.equal(runJson.runId, 'run-1', 'the patch must be additive, never dropping existing run.json fields');
});

test('reconcile collect-result action-key replay returns the recorded outcome without re-mutating', () => {
  const dir = root();
  assignmentDir(dir, 'a');
  runDirFor(dir, 'a', '01', { runId: 'run-1' }, legacyResult('run-1', 'a'));
  admitGen(dir, 'a', 1, { runId: 'run-1', attempt: 1 });
  const plan = planReconciliation(dir, { action: 'collect-result', runId: 'run-1', now: '2026-09-15T00:00:00.000Z' });
  assert.equal(applyReconciliation(dir, plan, { now: '2026-09-15T00:00:01.000Z' }).outcome, 'applied');
  const replay = applyReconciliation(dir, plan, { now: '2026-09-15T00:00:02.000Z' });
  assert.equal(replay.outcome, 'already-applied');
  assert.equal(replay.priorOutcome, 'applied');
  const runJson = JSON.parse(fs.readFileSync(path.join(dir, '.fgos', 'assignments', 'a', 'runs', '01', 'run.json'), 'utf8'));
  assert.equal(runJson.resultCollectedAt, '2026-09-15T00:00:01.000Z', 'the replay must not overwrite the timestamp the first apply recorded');
});

test('reconcile collect-result needs-input on a corrupt/unparseable result and never auto-collects it', () => {
  const dir = root();
  assignmentDir(dir, 'a');
  runDirFor(dir, 'a', '01', { runId: 'run-corrupt' }, { contract: { id: 'assignment-run-result', version: 2 }, runId: 'run-corrupt' });
  admitGen(dir, 'a', 1, { runId: 'run-corrupt', attempt: 1 });
  const plan = planReconciliation(dir, { action: 'collect-result', runId: 'run-corrupt', now: '2026-09-15T00:00:00.000Z' });
  assert.equal(plan.outcome, 'needs-input');
  assert.match(plan.reason, /corrupt/);
});

test('reconcile collect-result refuses a CoordinationSession-owned Run: linking belongs to its own recovery door, not this one', () => {
  const dir = root();
  assignmentDir(dir, 'a');
  runDirFor(dir, 'a', '01', { runId: 'run-sess', coordinationId: 'sess-1' }, legacyResult('run-sess', 'a'));
  admitGen(dir, 'a', 1, { runId: 'run-sess', attempt: 1 });
  const sessionDir = path.join(dir, '.fgos', 'coordination', 'sessions', 'sess-1');
  fs.mkdirSync(sessionDir, { recursive: true });
  fs.writeFileSync(path.join(sessionDir, 'session.json'), JSON.stringify({ assignmentRefs: ['a'] }));
  const plan = planReconciliation(dir, { action: 'collect-result', runId: 'run-sess', now: '2026-09-15T00:00:00.000Z' });
  assert.equal(plan.outcome, 'refused');
  assert.match(plan.reason, /CoordinationSession/);
});

test('reconcile collect-result blocks when a newer current Run supersedes the target for its assignment', () => {
  const dir = root();
  assignmentDir(dir, 'a');
  runDirFor(dir, 'a', '01', { runId: 'run-old' }, legacyResult('run-old', 'a'));
  runDirFor(dir, 'a', '02', { runId: 'run-new' }, legacyResult('run-new', 'a'));
  admitGen(dir, 'a', 1, { runId: 'run-old', attempt: 1 });
  admitGen(dir, 'a', 2, { runId: 'run-new', attempt: 2, predecessorRunId: 'run-old' });
  const plan = planReconciliation(dir, { action: 'collect-result', runId: 'run-old', now: '2026-09-15T00:00:00.000Z' });
  assert.equal(plan.outcome, 'blocked');
  assert.match(plan.reason, /supersedes/);
});

test('reconcile collect-result is blocked (not refused/applied) when no result exists yet, and refuses without a runId', () => {
  const dir = root();
  assignmentDir(dir, 'a');
  runDirFor(dir, 'a', '01', { runId: 'run-pending' });
  admitGen(dir, 'a', 1, { runId: 'run-pending', attempt: 1 });
  const pending = planReconciliation(dir, { action: 'collect-result', runId: 'run-pending', now: '2026-09-15T00:00:00.000Z' });
  assert.equal(pending.outcome, 'blocked');
  const noRunId = planReconciliation(dir, { action: 'collect-result', now: '2026-09-15T00:00:00.000Z' });
  assert.equal(noRunId.outcome, 'refused');
});

test('reconcile clear-assignment-claim clears a dead-holder claim when nothing is pending, and replay is idempotent', () => {
  const dir = root();
  assignmentDir(dir, 'a');
  deadClaim(dir, 'a');
  const plan = planReconciliation(dir, { action: 'clear-assignment-claim', assignmentId: 'a', now: '2026-09-15T00:00:00.000Z' });
  assert.equal(plan.outcome, 'planned');
  assert.equal(plan.proposedAction.kind, 'clear-assignment-claim');
  const applied = applyReconciliation(dir, plan, { now: '2026-09-15T00:00:01.000Z' });
  assert.equal(applied.outcome, 'applied');
  assert.equal(fs.existsSync(path.join(dir, '.fgos', 'assignments', 'a', 'dispatch.claim')), false);
  const replay = applyReconciliation(dir, plan, { now: '2026-09-15T00:00:02.000Z' });
  assert.equal(replay.outcome, 'already-applied');
  assert.equal(replay.priorOutcome, 'applied');
});

test('reconcile clear-assignment-claim blocks when a pending (unmaterialized) launch is admitted for the assignment', () => {
  const dir = root();
  assignmentDir(dir, 'a');
  deadClaim(dir, 'a');
  admitGen(dir, 'a', 1, { runId: 'run-pending-launch', attempt: 1 });
  // No runDirFor call: the admitted runId never materialized a run.json.
  const plan = planReconciliation(dir, { action: 'clear-assignment-claim', assignmentId: 'a', now: '2026-09-15T00:00:00.000Z' });
  assert.equal(plan.outcome, 'blocked');
  assert.match(plan.reason, /pending launch/);
  assert.equal(fs.existsSync(path.join(dir, '.fgos', 'assignments', 'a', 'dispatch.claim')), true);
});

test('reconcile clear-assignment-claim blocks when an admitted current Run has not settled', () => {
  const dir = root();
  assignmentDir(dir, 'a');
  deadClaim(dir, 'a');
  runDirFor(dir, 'a', '01', { runId: 'run-unsettled' });
  admitGen(dir, 'a', 1, { runId: 'run-unsettled', attempt: 1 });
  const plan = planReconciliation(dir, { action: 'clear-assignment-claim', assignmentId: 'a', now: '2026-09-15T00:00:00.000Z' });
  assert.equal(plan.outcome, 'blocked');
  assert.match(plan.reason, /unsettled Run/);
});

test('reconcile clear-assignment-claim blocks when the current Run settled but its result is still pending collect-result', () => {
  const dir = root();
  assignmentDir(dir, 'a');
  deadClaim(dir, 'a');
  runDirFor(dir, 'a', '01', { runId: 'run-uncollected' }, legacyResult('run-uncollected', 'a'));
  admitGen(dir, 'a', 1, { runId: 'run-uncollected', attempt: 1 });
  const plan = planReconciliation(dir, { action: 'clear-assignment-claim', assignmentId: 'a', now: '2026-09-15T00:00:00.000Z' });
  assert.equal(plan.outcome, 'blocked');
  assert.match(plan.reason, /pending collection/);
  // Collecting the result first must unblock the claim clear.
  const collectPlan = planReconciliation(dir, { action: 'collect-result', runId: 'run-uncollected', now: '2026-09-15T00:00:01.000Z' });
  assert.equal(applyReconciliation(dir, collectPlan, { now: '2026-09-15T00:00:02.000Z' }).outcome, 'applied');
  const claimPlan = planReconciliation(dir, { action: 'clear-assignment-claim', assignmentId: 'a', now: '2026-09-15T00:00:03.000Z' });
  assert.equal(claimPlan.outcome, 'planned');
});

test('reconcile clear-assignment-claim needs-input on a corrupt/unparseable claim, and on conflicting admission facts', () => {
  const dir = root();
  assignmentDir(dir, 'a');
  const claimDir = path.join(dir, '.fgos', 'assignments', 'a');
  fs.mkdirSync(claimDir, { recursive: true });
  fs.writeFileSync(path.join(claimDir, 'dispatch.claim'), '{ not json');
  const corrupt = planReconciliation(dir, { action: 'clear-assignment-claim', assignmentId: 'a', now: '2026-09-15T00:00:00.000Z' });
  assert.equal(corrupt.outcome, 'needs-input');
  assert.match(corrupt.reason, /corrupt/);

  const dir2 = root();
  assignmentDir(dir2, 'b');
  deadClaim(dir2, 'b');
  runDirFor(dir2, 'b', '01', { runId: 'run-a' }, legacyResult('run-a', 'b'));
  runDirFor(dir2, 'b', '02', { runId: 'run-b' }, legacyResult('run-b', 'b'));
  admitGen(dir2, 'b', 1, { runId: 'run-a', attempt: 1 });
  fs.writeFileSync(path.join(dir2, '.fgos', 'assignments', 'b', 'admission', 'generations', '0000000002.json'), JSON.stringify({ runId: 'run-b', attempt: 1 }));
  const conflicting = planReconciliation(dir2, { action: 'clear-assignment-claim', assignmentId: 'b', now: '2026-09-15T00:00:00.000Z' });
  assert.equal(conflicting.outcome, 'needs-input');
});

test('reconcile clear-assignment-claim refuses without an assignmentId, and is blocked for an unknown assignment', () => {
  const dir = root();
  const noId = planReconciliation(dir, { action: 'clear-assignment-claim', now: '2026-09-15T00:00:00.000Z' });
  assert.equal(noId.outcome, 'refused');
  const unknown = planReconciliation(dir, { action: 'clear-assignment-claim', assignmentId: 'does-not-exist', now: '2026-09-15T00:00:00.000Z' });
  assert.equal(unknown.outcome, 'blocked');
});
