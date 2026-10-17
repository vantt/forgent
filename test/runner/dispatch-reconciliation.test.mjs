import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { planReconciliation, applyReconciliation } from '../../src/runner/dispatch/reconciliation-planner.mjs';
import { acquireSync, createLockScope } from '../../src/holder-lock/index.mjs';
import { holdLockInChild } from '../helpers/hold-lock-in-child.mjs';

function root() { const out = fs.mkdtempSync(path.join(os.tmpdir(), 'dispatch-reconcile-')); fs.mkdirSync(path.join(out, '.fgos'), { recursive: true }); return out; }
const cwdLockParams = (dir, cwd = dir) => ({ fgosDir: path.join(dir, '.fgos'), cwd });

// collect-result fixture helpers -- same shapes as test/runner/dispatch-runtime-inspect.test.mjs,
// since collect-result's own plan/apply is built entirely on top of inspectDispatchRuntime's
// --run/--assignment views and must never disagree with what that module considers a Run,
// an owner, or a current admitted Run.
function assignmentDir(dir, id) { const d = path.join(dir, '.fgos', 'assignments', id); fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(path.join(d, 'assignment.json'), JSON.stringify({ assignmentId: id })); return d; }
function runDirFor(dir, id, attempt, value, result) { const d = path.join(dir, '.fgos', 'assignments', id, 'runs', attempt); fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(path.join(d, 'run.json'), JSON.stringify({ assignmentId: id, ...value })); if (result) fs.writeFileSync(path.join(d, 'result.json'), JSON.stringify(result)); return d; }
function admitGen(dir, id, epoch, value) { const d = path.join(dir, '.fgos', 'assignments', id, 'admission', 'generations'); fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(path.join(d, `${String(epoch).padStart(10, '0')}.json`), JSON.stringify(value)); }
const legacyResult = (runId, assignmentId) => ({ runId, assignmentId, status: 'done', confidence: 'reported' });
// Real control/generations/ ledger a live controller's own
// acquireRunControl publishes to (src/runner/dispatch/run-lock.mjs) -- F2's
// snapshot.controlEpoch now reads this, never run.json's own shadow field.
function publishControlGeneration(runDir, epoch) {
  const d = path.join(runDir, 'control', 'generations');
  fs.mkdirSync(d, { recursive: true });
  fs.writeFileSync(path.join(d, `${String(epoch).padStart(10, '0')}.json`), JSON.stringify({ epoch }));
}

test('clear-cwd-lock has nothing to clear when no dispatch holds the cwd, and a forged clear plan applies nothing', () => {
  const dir = root();
  const plan = planReconciliation(dir, { cwd: dir, now: '2026-09-15T00:00:00.000Z' });
  assert.equal(plan.outcome, 'blocked');
  assert.match(plan.reason, /no cwd lock is held/);
  const forged = { actionKey: 'reconcile_forged', snapshot: { expiresAt: '2099-01-01T00:00:00.000Z' }, proposedAction: { kind: 'clear-cwd-lock', cwd: dir } };
  assert.equal(applyReconciliation(dir, forged, { now: '2026-09-15T00:00:01.000Z' }).outcome, 'blocked');
  assert.equal(fs.existsSync(path.join(dir, '.fgos', 'dispatch', 'reconciliation-actions.jsonl')), false, 'nothing is recorded for a clear that has nothing to do');
  assert.equal(planReconciliation(dir, { action: 'kill-process' }).outcome, 'refused');
});

test('clear-cwd-lock refuses while a live dispatch in another process holds the cwd, also through a symlink, and has nothing to clear once that holder is SIGKILLed', async () => {
  if (process.platform === 'win32') return;
  const dir = root();
  const link = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'dispatch-reconcile-link-')), 'cwd');
  fs.symlinkSync(dir, link);
  const { child, exited } = await holdLockInChild('dispatch-cwd', cwdLockParams(dir));
  try {
    const plan = planReconciliation(dir, { cwd: dir, now: '2026-09-15T00:00:00.000Z' });
    assert.equal(plan.outcome, 'refused');
    assert.match(plan.reason, /live dispatch/);
    assert.equal(planReconciliation(dir, { cwd: link, now: '2026-09-15T00:00:00.000Z' }).outcome, 'refused', 'the same directory through a symlink is the same lock');
  } finally {
    child.kill('SIGKILL');
    await exited;
  }
  const after = planReconciliation(dir, { cwd: dir, now: '2026-09-15T00:00:01.000Z' });
  assert.equal(after.outcome, 'blocked', 'a killed holder released the lock at once: nothing is left to clear');
});

test('a reconcile apply is refused while another process holds reconcile.lock, and proceeds the moment that holder is SIGKILLed', async () => {
  if (process.platform === 'win32') return;
  const dir = root();
  const runId = 'run_lock';
  assignmentDir(dir, 'asgn_lock');
  runDirFor(dir, 'asgn_lock', '01', { runId, status: 'running' }, legacyResult(runId, 'asgn_lock'));
  admitGen(dir, 'asgn_lock', 1, { runId, attempt: 1 });
  const now = '2026-09-15T00:00:00.000Z';
  const plan = planReconciliation(dir, { action: 'repair-projection', runId, now });
  assert.equal(plan.outcome, 'planned');
  const { child, exited } = await holdLockInChild('reconcile', { fgosDir: path.join(dir, '.fgos') });
  try {
    const refused = applyReconciliation(dir, plan, { now });
    assert.equal(refused.outcome, 'blocked');
    assert.match(refused.reason, /another reconcile apply is in progress/);
  } finally {
    child.kill('SIGKILL');
    await exited;
  }
  assert.equal(applyReconciliation(dir, plan, { now }).outcome, 'applied');
});

test('a reconcile apply holds reconcile.lock only while it runs', () => {
  const dir = root();
  const runId = 'run_release';
  assignmentDir(dir, 'asgn_release');
  runDirFor(dir, 'asgn_release', '01', { runId, status: 'running' }, legacyResult(runId, 'asgn_release'));
  admitGen(dir, 'asgn_release', 1, { runId, attempt: 1 });
  const now = '2026-09-15T00:00:00.000Z';
  const plan = planReconciliation(dir, { action: 'repair-projection', runId, now });
  assert.equal(applyReconciliation(dir, plan, { now }).outcome, 'applied');
  const res = acquireSync(createLockScope('test'), 'reconcile', { fgosDir: path.join(dir, '.fgos') });
  assert.equal(res.result, 'acquired', 'the apply released reconcile.lock when it returned');
  res.handle.release();
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

// S5: `clear-assignment-claim` (and the `dispatch.claim` file it existed to
// clear) was removed once `executeAssignment()`'s own `admitRunAttempt`
// in-flight check (assignment-runner.mjs) was confirmed to fully subsume the
// race it guarded against -- the real production `dispatch.claim` file was
// also always 0 bytes with no holder identity, so this action could never
// actually resolve a refusal in production (audit S5's own "two
// half-mechanisms dead end" finding). `planReconciliation` now treats it
// like any other unrecognized action name -- refused, plainly, never a
// half-working door.
test('reconcile refuses the retired clear-assignment-claim action as unsupported, never as a half-working door', () => {
  const dir = root();
  assignmentDir(dir, 'a');
  const plan = planReconciliation(dir, { action: 'clear-assignment-claim', now: '2026-09-15T00:00:00.000Z' });
  assert.equal(plan.outcome, 'refused');
  assert.match(plan.reason, /unsupported reconciliation action/);
});

test('reconcile repair-projection rewrites a stale "running" status to settled once a valid terminal RunResult exists, and replay is idempotent', () => {
  const dir = root();
  assignmentDir(dir, 'a');
  runDirFor(dir, 'a', '01', { runId: 'run-stale', status: 'running', controlEpoch: 1 }, legacyResult('run-stale', 'a'));
  admitGen(dir, 'a', 1, { runId: 'run-stale', attempt: 1 });
  const plan = planReconciliation(dir, { action: 'repair-projection', runId: 'run-stale', now: '2026-09-15T00:00:00.000Z' });
  assert.equal(plan.outcome, 'planned');
  assert.equal(plan.proposedAction.kind, 'repair-projection');
  assert.equal(plan.snapshot.currentStatus, 'running');
  const applied = applyReconciliation(dir, plan, { now: '2026-09-15T00:00:01.000Z' });
  assert.equal(applied.outcome, 'applied');
  const runJson = JSON.parse(fs.readFileSync(path.join(dir, '.fgos', 'assignments', 'a', 'runs', '01', 'run.json'), 'utf8'));
  assert.equal(runJson.status, 'settled');
  assert.equal(runJson.settledAt, '2026-09-15T00:00:01.000Z', 'settledAt must use reconcile\'s own injected now, not wall-clock time');
  assert.equal(runJson.runId, 'run-stale', 'the patch must be additive, never dropping existing run.json fields');
  assert.equal(runJson.controlEpoch, 1, 'the patch must preserve the unrelated controlEpoch field');
  const replay = applyReconciliation(dir, plan, { now: '2026-09-15T00:00:02.000Z' });
  assert.equal(replay.outcome, 'already-applied');
  assert.equal(replay.priorOutcome, 'applied');
});

test('reconcile repair-projection action-key replay returns the recorded outcome without re-mutating', () => {
  const dir = root();
  assignmentDir(dir, 'a');
  runDirFor(dir, 'a', '01', { runId: 'run-stale-2', status: 'running' }, legacyResult('run-stale-2', 'a'));
  admitGen(dir, 'a', 1, { runId: 'run-stale-2', attempt: 1 });
  const plan = planReconciliation(dir, { action: 'repair-projection', runId: 'run-stale-2', now: '2026-09-15T00:00:00.000Z' });
  assert.equal(applyReconciliation(dir, plan, { now: '2026-09-15T00:00:01.000Z' }).outcome, 'applied');
  const replay = applyReconciliation(dir, plan, { now: '2026-09-15T00:00:02.000Z' });
  assert.equal(replay.outcome, 'already-applied');
  assert.equal(replay.priorOutcome, 'applied');
  const runJson = JSON.parse(fs.readFileSync(path.join(dir, '.fgos', 'assignments', 'a', 'runs', '01', 'run.json'), 'utf8'));
  assert.equal(runJson.status, 'settled', 'the replay must not re-run the mutation');
});

test('reconcile repair-projection is blocked (not refused) when no terminal result exists yet, and refuses without a runId', () => {
  const dir = root();
  assignmentDir(dir, 'a');
  runDirFor(dir, 'a', '01', { runId: 'run-pending', status: 'running' });
  admitGen(dir, 'a', 1, { runId: 'run-pending', attempt: 1 });
  const pending = planReconciliation(dir, { action: 'repair-projection', runId: 'run-pending', now: '2026-09-15T00:00:00.000Z' });
  assert.equal(pending.outcome, 'blocked');
  assert.match(pending.reason, /no terminal result/);
  const noRunId = planReconciliation(dir, { action: 'repair-projection', now: '2026-09-15T00:00:00.000Z' });
  assert.equal(noRunId.outcome, 'refused');
});

test('reconcile repair-projection needs-input on a corrupt/contract-corrupt result and never repairs on unproven settlement', () => {
  const dir = root();
  assignmentDir(dir, 'a');
  runDirFor(dir, 'a', '01', { runId: 'run-corrupt', status: 'running' }, { contract: { id: 'assignment-run-result', version: 2 }, runId: 'run-corrupt' });
  admitGen(dir, 'a', 1, { runId: 'run-corrupt', attempt: 1 });
  const plan = planReconciliation(dir, { action: 'repair-projection', runId: 'run-corrupt', now: '2026-09-15T00:00:00.000Z' });
  assert.equal(plan.outcome, 'needs-input');
  assert.match(plan.reason, /corrupt/);
  const runJson = JSON.parse(fs.readFileSync(path.join(dir, '.fgos', 'assignments', 'a', 'runs', '01', 'run.json'), 'utf8'));
  assert.equal(runJson.status, 'running', 'an unproven result must never trigger a repair');
});

test('reconcile repair-projection blocks as a no-op when status already reflects settlement', () => {
  const dir = root();
  assignmentDir(dir, 'a');
  runDirFor(dir, 'a', '01', { runId: 'run-already-settled', status: 'settled' }, legacyResult('run-already-settled', 'a'));
  admitGen(dir, 'a', 1, { runId: 'run-already-settled', attempt: 1 });
  const plan = planReconciliation(dir, { action: 'repair-projection', runId: 'run-already-settled', now: '2026-09-15T00:00:00.000Z' });
  assert.equal(plan.outcome, 'blocked');
  assert.match(plan.reason, /already reflects settlement/);
});

test('reconcile repair-projection repairs (not blocks) when status is absent even though a terminal result already exists', () => {
  // Unlike the retired `phase` field, `status` has a real production writer
  // (visibility-session.mjs stamps it when a run.json is first materialized),
  // so an absent status is itself the defect this action exists to close --
  // never a legitimately-already-correct state to leave alone.
  const dir = root();
  assignmentDir(dir, 'a');
  runDirFor(dir, 'a', '01', { runId: 'run-no-status-field' }, legacyResult('run-no-status-field', 'a'));
  admitGen(dir, 'a', 1, { runId: 'run-no-status-field', attempt: 1 });
  const plan = planReconciliation(dir, { action: 'repair-projection', runId: 'run-no-status-field', now: '2026-09-15T00:00:00.000Z' });
  assert.equal(plan.outcome, 'planned');
  assert.equal(plan.snapshot.currentStatus, null);
  const applied = applyReconciliation(dir, plan, { now: '2026-09-15T00:00:01.000Z' });
  assert.equal(applied.outcome, 'applied');
  const runJson = JSON.parse(fs.readFileSync(path.join(dir, '.fgos', 'assignments', 'a', 'runs', '01', 'run.json'), 'utf8'));
  assert.equal(runJson.status, 'settled');
});

test('reconcile repair-projection apply detects a REAL control-epoch change (control/generations/) between planning and apply as plan-stale, never a run.json.controlEpoch field edit', () => {
  const dir = root();
  assignmentDir(dir, 'a');
  const runDir = runDirFor(dir, 'a', '01', { runId: 'run-epoch', status: 'running' }, legacyResult('run-epoch', 'a'));
  admitGen(dir, 'a', 1, { runId: 'run-epoch', attempt: 1 });
  publishControlGeneration(runDir, 1);
  const plan = planReconciliation(dir, { action: 'repair-projection', runId: 'run-epoch', now: '2026-09-15T00:00:00.000Z' });
  assert.equal(plan.outcome, 'planned');
  assert.equal(plan.snapshot.controlEpoch, 1);
  // A live controller re-driving the Run bumps the REAL ledger -- run.json
  // itself is never touched here, proving F2's fix reads the real ledger,
  // not a shadow field that would otherwise miss this entirely.
  publishControlGeneration(runDir, 2);
  const result = applyReconciliation(dir, plan, { now: '2026-09-15T00:00:01.000Z' });
  assert.equal(result.outcome, 'plan-stale');
  const runJson = JSON.parse(fs.readFileSync(path.join(runDir, 'run.json'), 'utf8'));
  assert.equal(runJson.status, 'running', 'a successor incarnation (bumped controlEpoch) must never be overwritten');
});
