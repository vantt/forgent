import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { resolveWorkerArtifactPath } from '../../src/runner/dispatch/assignment-runner.mjs';
import {
  readVisibility,
  writeVisibility,
  markDetached,
  findAgentBinding,
  findWorkerResult,
  classifyRunOutcome,
  findRunningRuns,
  reconcileRun,
  markRunSettled,
  VisibilityError,
  VISIBILITY_STATES,
} from '../../src/runner/dispatch/visibility-session.mjs';

function makeRunDir({ runStatus = 'running', withResult = false, withCollected = false } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-run-'));
  fs.writeFileSync(path.join(dir, 'run.json'), JSON.stringify({ runId: 'r1', assignmentId: 'a1', status: runStatus }, null, 2));
  if (withResult) {
    fs.mkdirSync(path.join(dir, 'outbox'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'outbox', 'result-1.json'), JSON.stringify({ status: 'settled' }));
  }
  if (withCollected) {
    fs.writeFileSync(path.join(dir, 'result.json'), JSON.stringify({ status: 'done' }));
  }
  return dir;
}

const cleanup = (dir) => fs.rmSync(dir, { recursive: true, force: true });

test('bindings accumulate -- a later write never erases one an earlier write learned', () => {
  const dir = makeRunDir();
  try {
    writeVisibility(dir, { status: 'pane-created', paneId: 'wS:p9' });
    writeVisibility(dir, { status: 'agent-ready', agentSession: { value: 'abc' } });
    const v = readVisibility(dir);
    assert.equal(v.paneId, 'wS:p9', 'the pane id survives a write that did not mention it');
    assert.equal(v.agentSession.value, 'abc');
    assert.equal(v.status, 'agent-ready');
    assert.ok(v.lastSeenAt);
  } finally { cleanup(dir); }
});

test('an unrecognized status is refused rather than written', () => {
  const dir = makeRunDir();
  try {
    assert.throws(() => writeVisibility(dir, { status: 'vibing' }), (e) => e instanceof VisibilityError && e.code === 'unknown-state');
    assert.equal(readVisibility(dir), null, 'nothing was written');
  } finally { cleanup(dir); }
});

test('a corrupt visibility file is reported, never silently replaced', () => {
  const dir = makeRunDir();
  try {
    fs.writeFileSync(path.join(dir, 'visibility.json'), 'not json');
    assert.throws(() => readVisibility(dir), (e) => e.code === 'corrupt');
    assert.throws(() => writeVisibility(dir, { status: 'working' }), (e) => e.code === 'corrupt');
  } finally { cleanup(dir); }
});

test('losing the observer detaches the view and leaves the run alone', () => {
  const dir = makeRunDir();
  try {
    writeVisibility(dir, { status: 'working', paneId: 'wS:p9' });
    markDetached(dir);
    assert.equal(readVisibility(dir).status, 'detached');
    assert.equal(JSON.parse(fs.readFileSync(path.join(dir, 'run.json'), 'utf8')).status, 'running',
      'a lost observer is not a dead worker');
  } finally { cleanup(dir); }
});

test('reattach matches by pane id first, then by agent session', () => {
  const agents = [
    { pane_id: 'wS:p1', agent_session: { value: 'other' } },
    { pane_id: 'wS:p9', agent_session: { value: 'mine' } },
  ];
  assert.equal(findAgentBinding(agents, { paneId: 'wS:p9' }).agent_session.value, 'mine');
  assert.equal(findAgentBinding(agents, { paneId: 'wS:gone', agentSession: { value: 'mine' } }).pane_id, 'wS:p9');
});

test('a handle that finds nothing means gone, never somebody else pane', () => {
  const agents = [{ pane_id: 'wS:p1', agent_session: { value: 'other' } }];
  assert.equal(findAgentBinding(agents, { paneId: 'wS:closed', agentSession: { value: 'mine' } }), null);
  assert.equal(findAgentBinding([], { paneId: 'wS:p1' }), null);
  assert.equal(findAgentBinding(null, { paneId: 'wS:p1' }), null);
});

// The crash fixture: a run directory left exactly as a killed dispatch would
// leave it -- run.json still says running, and no process is around to
// finish the sentence.

test('a crashed run that left a worker result reconciles to settled', () => {
  const dir = makeRunDir({ withResult: true });
  try {
    const r = reconcileRun(dir, { liveness: 'absent' });
    assert.equal(r.outcome, 'settled', 'the result file outranks a missing process');
    assert.equal(JSON.parse(fs.readFileSync(path.join(dir, 'run.json'), 'utf8')).status, 'settled');
  } finally { cleanup(dir); }
});

test('a crashed run with no result and a provably absent worker reconciles to died', () => {
  const dir = makeRunDir();
  try {
    writeVisibility(dir, { status: 'working', paneId: 'wS:p9' });
    const r = reconcileRun(dir, { liveness: 'absent' });
    assert.equal(r.outcome, 'died');
    assert.equal(JSON.parse(fs.readFileSync(path.join(dir, 'run.json'), 'utf8')).status, 'died');
    assert.equal(readVisibility(dir).status, 'died');
  } finally { cleanup(dir); }
});

test('a crashed run nobody can read reconciles to unknown -- not success, not death', () => {
  const dir = makeRunDir();
  try {
    const r = reconcileRun(dir, { liveness: 'unknown' });
    assert.equal(r.outcome, 'unknown');
    const runMeta = JSON.parse(fs.readFileSync(path.join(dir, 'run.json'), 'utf8'));
    assert.equal(runMeta.status, 'unknown');
    assert.notEqual(runMeta.status, 'running', 'it must not still claim to be working');
    assert.ok(runMeta.reconciledAt);
  } finally { cleanup(dir); }
});

test('reconciling twice is not an error and does not keep rewriting', () => {
  const dir = makeRunDir({ withResult: true });
  try {
    assert.equal(reconcileRun(dir, { liveness: 'absent' }).changed, true);
    assert.equal(reconcileRun(dir, { liveness: 'absent' }).changed, false);
  } finally { cleanup(dir); }
});

test('reconciling a directory with no run.json says so instead of inventing one', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-norun-'));
  try {
    assert.throws(() => reconcileRun(dir), (e) => e.code === 'missing-run');
  } finally { cleanup(dir); }
});

test('the worker own result is preferred over the collector result.json', () => {
  const dir = makeRunDir({ withResult: true, withCollected: true });
  try {
    assert.match(findWorkerResult(dir), /outbox[/\\]result-1\.json$/);
  } finally { cleanup(dir); }
});

test('the collector result still counts when the worker outbox is empty', () => {
  const dir = makeRunDir({ withCollected: true });
  try {
    assert.match(findWorkerResult(dir), /result\.json$/);
    assert.equal(reconcileRun(dir, { liveness: 'absent' }).outcome, 'settled');
  } finally { cleanup(dir); }
});

test('the normal path marks a run settled exactly once', () => {
  const dir = makeRunDir();
  try {
    assert.equal(markRunSettled(dir), true);
    const runMeta = JSON.parse(fs.readFileSync(path.join(dir, 'run.json'), 'utf8'));
    assert.equal(runMeta.status, 'settled');
    assert.ok(runMeta.settledAt);
    assert.equal(markRunSettled(dir), false, 'already settled, nothing to do');
  } finally { cleanup(dir); }
});

test('every declared visibility state is one writeVisibility will accept', () => {
  const dir = makeRunDir();
  try {
    for (const status of VISIBILITY_STATES) {
      assert.equal(writeVisibility(dir, { status }).status, status);
    }
  } finally { cleanup(dir); }
});


test('the latest round is chosen by number, not by filename', () => {
  const dir = makeRunDir();
  try {
    fs.mkdirSync(path.join(dir, 'outbox'), { recursive: true });
    for (const n of [9, 11]) {
      fs.writeFileSync(path.join(dir, 'outbox', `result-${n}.json`), JSON.stringify({ round: n }));
    }
    // Sorted as text, "result-9" comes after "result-11", so a lexicographic
    // sort reconciles a resumed Run on the older round. The collector orders
    // the same files numerically; these two read one directory and must agree.
    assert.match(findWorkerResult(dir), /result-11\.json$/);
  } finally { cleanup(dir); }
});


test('classifyRunOutcome decides without writing anything', () => {
  const dir = makeRunDir({ withResult: true });
  try {
    const before = fs.readFileSync(path.join(dir, 'run.json'), 'utf8');
    const v = classifyRunOutcome(dir, { liveness: 'unknown' });
    assert.equal(v.outcome, 'settled');
    assert.equal(v.changed, true);
    assert.equal(fs.readFileSync(path.join(dir, 'run.json'), 'utf8'), before,
      'a read-only caller must be able to ask without changing the answer');
  } finally { cleanup(dir); }
});

test('without a liveness probe the answer is unknown, never died', () => {
  const dir = makeRunDir();
  try {
    // `fgos stale` has no herdr client and does not start one. Reporting
    // "died" from that position would assert something about a process
    // nobody looked at.
    assert.equal(classifyRunOutcome(dir, { liveness: 'unknown' }).outcome, 'unknown');
    assert.equal(classifyRunOutcome(dir, { liveness: 'absent' }).outcome, 'died');
  } finally { cleanup(dir); }
});

test('findRunningRuns sees both run layouts and ignores runs that already settled', () => {
  const fgosDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-scan-'));
  try {
    const mk = (rel, status, runId) => {
      const d = path.join(fgosDir, rel);
      fs.mkdirSync(d, { recursive: true });
      fs.writeFileSync(path.join(d, 'run.json'), JSON.stringify({ runId, status }));
      return d;
    };
    mk('assignments/asgn_a/runs/01', 'running', 'r-assignment');
    mk('assignments/asgn_a/runs/02', 'settled', 'r-done');
    // The flat layout a runner dispatch writes when it has no Assignment.
    mk('dispatch-runs/tsk-x/1700000000000', 'running', 'r-dispatch');

    const ids = findRunningRuns(fgosDir).map((r) => r.runId).sort();
    assert.deepEqual(ids, ['r-assignment', 'r-dispatch']);
  } finally { fs.rmSync(fgosDir, { recursive: true, force: true }); }
});

test('the actor lease is gone, not merely unused', async () => {
  // It promised one-driver-at-a-time that a check-then-write cannot deliver.
  // Leaving it exported would invite a caller to rely on it.
  const mod = await import('../../src/runner/dispatch/visibility-session.mjs');
  assert.equal(mod.claimActor, undefined);
  assert.equal(mod.releaseActor, undefined);
});

test('a run whose driver just checked in is busy, not orphaned', () => {
  const fgosDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-beat-'));
  try {
    const mk = (rel, runId, lastSeenAt) => {
      const d = path.join(fgosDir, rel);
      fs.mkdirSync(d, { recursive: true });
      fs.writeFileSync(path.join(d, 'run.json'), JSON.stringify({ runId, status: 'running' }));
      if (lastSeenAt) fs.writeFileSync(path.join(d, 'visibility.json'), JSON.stringify({ status: 'briefed', lastSeenAt }));
    };
    const now = Date.now();
    mk('dispatch-runs/w/1', 'beating', new Date(now - 5000).toISOString());
    mk('dispatch-runs/w/2', 'silent', new Date(now - 600000).toISOString());
    mk('dispatch-runs/w/3', 'never-wrote-one', null);

    // Writing `unknown` over a run five minutes into a 35-minute ceiling
    // stops every watcher on a run that is still being driven.
    const ids = findRunningRuns(fgosDir, { now: () => now }).map((r) => r.runId).sort();
    assert.deepEqual(ids, ['never-wrote-one', 'silent']);

    // The window is a parameter, not a belief: shrink it and the same live
    // run reads as abandoned.
    assert.equal(findRunningRuns(fgosDir, { now: () => now, driverFreshMs: 1000 }).length, 3);
  } finally { fs.rmSync(fgosDir, { recursive: true, force: true }); }
});

test('a crashed cli-spawn run that did write its claim reconciles to settled, not unknown', () => {
  const dir = makeRunDir();
  try {
    // The name a cli-spawn worker is told to use by the assignment prompt.
    fs.writeFileSync(path.join(dir, 'agent-result.json'), JSON.stringify({ status: 'settled' }));

    // Both readers of this directory must reach the same file. They used not
    // to: reconciliation knew only the outbox and the collector's own
    // result.json, so a worker that HAD reported was read as having vanished.
    assert.match(findWorkerResult(dir), /agent-result\.json$/);
    assert.equal(
      findWorkerResult(dir),
      resolveWorkerArtifactPath(dir, /^result-(\d+)\.json$/, 'agent-result.json'),
      'the collector and reconciliation resolve one claim to one path',
    );
    assert.equal(reconcileRun(dir, { liveness: 'absent' }).outcome, 'settled');
  } finally { cleanup(dir); }
});
