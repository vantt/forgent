import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { planReconciliation, applyReconciliation } from '../../src/runner/dispatch/reconciliation-planner.mjs';
import { dispatchLockFile } from '../../src/runner/main-checkout-lock.mjs';

function root() { const out = fs.mkdtempSync(path.join(os.tmpdir(), 'dispatch-reconcile-')); fs.mkdirSync(path.join(out, '.fgos'), { recursive: true }); return out; }
function hasProcfsStat() { return fs.existsSync(`/proc/${process.pid}/stat`); }
// Real production per-cwd dispatch lock path and record shape (see
// reconciliation-planner.mjs's own lockFile/cwdLockHolder doc comments):
// `dispatch--<encodeURIComponent(cwd)>.lock`, `{pid: "<pid>:<acquiredAtMs>:
// <rand>", ts: <int>}`. `dir` doubles as the cwd under test unless a
// different `cwd` is supplied.
function lockPathFor(dir, cwd = dir) { return path.join(dir, '.fgos', `dispatch--${encodeURIComponent(cwd)}.lock`); }
function deadLock(dir, cwd = dir, extra = {}) {
  const ts = Date.now();
  fs.writeFileSync(lockPathFor(dir, cwd), JSON.stringify({ pid: `99999999:${ts}:deadfixture`, ts, ...extra }));
}

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
function deadClaim(dir, assignmentId, extra = {}) { const d = path.join(dir, '.fgos', 'assignments', assignmentId); fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(path.join(d, 'dispatch.claim'), JSON.stringify({ pid: 99999999, startTime: '1', ...extra })); }

test('reconcile clears only a dead-proven cwd lock and replay is idempotent', () => {
  const dir = root(); deadLock(dir); const plan = planReconciliation(dir, { cwd: dir, now: '2026-09-15T00:00:00.000Z' });
  assert.equal(plan.outcome, 'planned'); assert.match(plan.snapshot.resourceIncarnation, /^pid:/);
  assert.equal(applyReconciliation(dir, plan, { now: '2026-09-15T00:00:01.000Z' }).outcome, 'applied');
  assert.equal(fs.existsSync(lockPathFor(dir)), false);
  assert.equal(applyReconciliation(dir, plan, { now: '2026-09-15T00:00:02.000Z' }).outcome, 'already-applied');
});

test('reconcile refuses a live holder proof and never unlinks a successor', () => {
  if (!hasProcfsStat()) return;
  const dir = root();
  const now = Date.now();
  fs.writeFileSync(lockPathFor(dir), JSON.stringify({ pid: `${process.pid}:${now}:x`, ts: now }));
  // The real process (self) is live and started before `now`, so this is
  // proof of a live incarnation, not dead proof.
  const plan = planReconciliation(dir, { cwd: dir, now: '2026-09-15T00:00:00.000Z' }); assert.equal(plan.outcome, 'refused');
  assert.equal(planReconciliation(dir, { action: 'kill-process' }).outcome, 'refused');
});

test('planReconciliation refuses a live holder (real resource-incarnation match) and never produces a plan', () => {
  if (!hasProcfsStat()) return;
  const dir = root();
  const now = Date.now();
  fs.writeFileSync(lockPathFor(dir), JSON.stringify({ pid: `${process.pid}:${now}:x`, ts: now }));
  const plan = planReconciliation(dir, { cwd: dir, now: '2026-09-15T00:00:00.000Z' });
  assert.equal(plan.outcome, 'refused');
  assert.match(plan.reason, /live/);
});

test('cwdLockHolder refuses/unparses any record not matching the real production composite-identity shape, including the old fixture-only {pid: integer, startTime} shape', () => {
  const dir = root();
  fs.writeFileSync(lockPathFor(dir), JSON.stringify({ pid: process.pid, startTime: '1' }));
  const plan = planReconciliation(dir, { cwd: dir, now: '2026-09-15T00:00:00.000Z' });
  assert.equal(plan.outcome, 'needs-input');
  assert.match(plan.reason, /verifiable resource incarnation/);
});

test('clear-cwd-lock plans against the exact file the real production dispatchLockFile export names, proving reconciliation-planner.mjs\'s own local path computation can never silently drift from it', () => {
  for (const cwd of ['/path/to/worktree-a', '/tmp/has spaces/and?query=1']) {
    const dir = root();
    const ts = Date.now();
    const realPath = path.join(dir, '.fgos', dispatchLockFile(cwd));
    fs.writeFileSync(realPath, JSON.stringify({ pid: `99999999:${ts}:deadfixture`, ts }));
    const plan = planReconciliation(dir, { cwd, now: '2026-09-15T00:00:00.000Z' });
    assert.equal(plan.outcome, 'planned', `reconciliation-planner.mjs's own lock-path computation must resolve to the exact file dispatchLockFile(${JSON.stringify(cwd)}) names`);
    assert.equal(plan.proposedAction.path, realPath);
  }
});

test('holder() start-time parser is paren-aware: a comm field containing a space does not desync the starttime column, so a live holder with such a comm is still detected live', () => {
  if (!hasProcfsStat()) return;
  const dir = root();
  const original = fs.readFileSync;
  const realStat = original.call(fs, `/proc/${process.pid}/stat`, 'utf8');
  const realLastParen = realStat.lastIndexOf(')');
  const realRest = realStat.slice(realLastParen + 2);
  // Splice in a comm field containing a space -- if the parser naively
  // split(' ') the whole line from the start, this would desync every
  // fixed-index field after it (including starttime) by one or more
  // positions; the paren-aware parser must still agree with the real
  // starttime because it anchors on the LAST ')', which this synthetic
  // stat line still has exactly one of.
  const syntheticStat = `${process.pid} (some weird name)${realRest}`;
  fs.readFileSync = function patchedReadFileSync(file, ...rest) {
    if (file === `/proc/${process.pid}/stat`) return syntheticStat;
    return original.call(fs, file, ...rest);
  };
  let plan;
  try {
    const realStartTime = Number(realRest.split(' ')[19]);
    const identityTs = Date.now();
    fs.writeFileSync(lockPathFor(dir), JSON.stringify({ pid: `${process.pid}:${identityTs}:x`, ts: identityTs }));
    plan = planReconciliation(dir, { cwd: dir, now: '2026-09-15T00:00:00.000Z' });
    void realStartTime; // the synthetic stat above already carries the real ticks verbatim
  } finally {
    fs.readFileSync = original;
  }
  assert.equal(plan.outcome, 'refused', 'a comm-with-space live holder must still be detected live, not miscounted as a different/dead incarnation');
  assert.match(plan.reason, /live/);
});

test('cwdLockHolder treats an unreadable (non-ENOENT) /proc read as ambiguous, never as proof of death', () => {
  const dir = root();
  const identityTs = Date.now();
  fs.writeFileSync(lockPathFor(dir), JSON.stringify({ pid: `${process.pid}:${identityTs}:x`, ts: identityTs }));
  const original = fs.readFileSync;
  fs.readFileSync = function patchedReadFileSync(file, ...rest) {
    if (file === `/proc/${process.pid}/stat`) {
      const err = new Error('EACCES: permission denied');
      err.code = 'EACCES';
      throw err;
    }
    return original.call(fs, file, ...rest);
  };
  let plan;
  try {
    plan = planReconciliation(dir, { cwd: dir, now: '2026-09-15T00:00:00.000Z' });
  } finally {
    fs.readFileSync = original;
  }
  // Must NOT be 'refused' (dead-cleared) or 'planned' (would let the caller
  // proceed to unlink a holder we could not actually prove is dead) -- an
  // unreadable /proc entry proves nothing either way.
  assert.notEqual(plan.outcome, 'planned', 'an unreadable /proc entry must never be treated as proven-dead');
  assert.equal(plan.outcome, 'needs-input');
});

test('apply against a dead holder proves plan-stale when a successor guard replaces it, and the successor bytes survive intact', () => {
  const dir = root(); deadLock(dir);
  const lockPath = lockPathFor(dir);
  const plan = planReconciliation(dir, { cwd: dir, now: '2026-09-15T00:00:00.000Z' });
  assert.equal(plan.outcome, 'planned');
  const successorTs = Date.now();
  const successorBytes = JSON.stringify({ pid: `12345:${successorTs}:z`, ts: successorTs });
  fs.writeFileSync(lockPath, successorBytes);
  const result = applyReconciliation(dir, plan, { now: '2026-09-15T00:00:01.000Z' });
  assert.equal(result.outcome, 'plan-stale');
  assert.equal(fs.readFileSync(lockPath, 'utf8'), successorBytes, "successor's own bytes must survive intact");
});

test('a cwd lock removed by a concurrent cleanup before apply\'s final re-read returns plan-stale, not a throw', () => {
  const dir = root(); deadLock(dir);
  const lockPath = lockPathFor(dir);
  const plan = planReconciliation(dir, { cwd: dir, now: '2026-09-15T00:00:00.000Z' });
  assert.equal(plan.outcome, 'planned');
  const original = fs.readFileSync;
  // applyReconciliation reads lockPath twice before its own explicit final
  // re-read: inside the internal `fresh = planReconciliation(...)`
  // re-verify (its own `raw` read, then `json(file)`'s internal read).
  // Only the 3rd read is the actual target this test races against --
  // delete the file BEFORE that read runs (not after, which would let the
  // read still succeed and only make the later unlink hit ENOENT instead, a
  // different, already-tolerated branch), so the read itself genuinely
  // throws ENOENT.
  let lockPathReads = 0;
  fs.readFileSync = function patchedReadFileSync(file, ...rest) {
    if (file === lockPath) {
      lockPathReads += 1;
      if (lockPathReads === 3) fs.unlinkSync(lockPath); // simulate a concurrent cleanup racing the final re-read
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
  const plan = planReconciliation(dir, { cwd: dir, now: '2026-09-15T00:00:00.000Z' });
  assert.equal(plan.outcome, 'planned');
  const runDir = path.join(dir, '.fgos', 'assignments', 'asgn-x', 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, 'run.json'), JSON.stringify({ runId: 'run-x', assignmentId: 'asgn-x', cwd: dir }));
  const result = applyReconciliation(dir, plan, { now: '2026-09-15T00:00:01.000Z' });
  assert.equal(result.outcome, 'blocked');
  assert.match(result.reason, /active Run/);
  assert.equal(fs.existsSync(lockPathFor(dir)), true);
});

test('apply blocks a dead-holder cleanup when a pending (unsettled) dispatch launch is still bound to this cwd', () => {
  const dir = root(); deadLock(dir);
  const plan = planReconciliation(dir, { cwd: dir, now: '2026-09-15T00:00:00.000Z' });
  assert.equal(plan.outcome, 'planned');
  const runDir = path.join(dir, '.fgos', 'dispatch-runs', 'fanout-group-x', '01');
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, 'run.json'), JSON.stringify({ runId: 'run-launch-x', cwd: dir }));
  // No result.json yet: this launch was admitted but has not settled.
  const result = applyReconciliation(dir, plan, { now: '2026-09-15T00:00:01.000Z' });
  assert.equal(result.outcome, 'blocked');
  assert.match(result.reason, /active Run/);
  assert.equal(fs.existsSync(lockPathFor(dir)), true);
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

test('reconcile clear-assignment-claim refuses a CoordinationSession-owned claim: clearing it belongs to its own recovery door, not this one', () => {
  const dir = root();
  assignmentDir(dir, 'a');
  // A real session-engine.mjs claim is 0 bytes -- no holder identity at all,
  // which on its own would only ever reach the generic corrupt/unparseable
  // needs-input branch. The CoordinationSession-ownership check must refuse
  // BEFORE that parse is attempted, naming the real owning door.
  const claimDir = path.join(dir, '.fgos', 'assignments', 'a');
  fs.mkdirSync(claimDir, { recursive: true });
  fs.writeFileSync(path.join(claimDir, 'dispatch.claim'), '');
  const sessionDir = path.join(dir, '.fgos', 'coordination', 'sessions', 'sess-1');
  fs.mkdirSync(sessionDir, { recursive: true });
  fs.writeFileSync(path.join(sessionDir, 'session.json'), JSON.stringify({ assignmentRefs: ['a'] }));
  const plan = planReconciliation(dir, { action: 'clear-assignment-claim', assignmentId: 'a', now: '2026-09-15T00:00:00.000Z' });
  assert.equal(plan.outcome, 'refused');
  assert.match(plan.reason, /CoordinationSession/);
  assert.equal(fs.existsSync(path.join(claimDir, 'dispatch.claim')), true);
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

test('reconcile clear-assignment-claim refuses a path-escaping assignmentId and never reads/writes outside .fgos/assignments/', () => {
  const dir = root();
  // A file placed exactly where `../../outside-target` would resolve to
  // (one level above `.fgos/assignments`) proves the guard refuses BEFORE
  // ever joining the raw id into a path, not merely that the join happens
  // to miss by chance.
  const outsideFile = path.join(dir, '.fgos', 'outside-target', 'dispatch.claim');
  fs.mkdirSync(path.dirname(outsideFile), { recursive: true });
  fs.writeFileSync(outsideFile, JSON.stringify({ pid: 99999999, startTime: '1' }));
  const plan = planReconciliation(dir, { action: 'clear-assignment-claim', assignmentId: '../outside-target', now: '2026-09-15T00:00:00.000Z' });
  assert.notEqual(plan.outcome, 'planned');
  assert.notEqual(plan.outcome, 'applied');
  assert.equal(fs.existsSync(outsideFile), true, 'a path-escaping assignmentId must never reach a file outside .fgos/assignments/');
});

test('reconcile clear-assignment-claim refuses without an assignmentId, and is blocked for an unknown assignment', () => {
  const dir = root();
  const noId = planReconciliation(dir, { action: 'clear-assignment-claim', now: '2026-09-15T00:00:00.000Z' });
  assert.equal(noId.outcome, 'refused');
  const unknown = planReconciliation(dir, { action: 'clear-assignment-claim', assignmentId: 'does-not-exist', now: '2026-09-15T00:00:00.000Z' });
  assert.equal(unknown.outcome, 'blocked');
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
