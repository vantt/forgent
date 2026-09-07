import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  readVisibility,
  writeVisibility,
  markDetached,
  claimActor,
  releaseActor,
  findAgentBinding,
  findWorkerResult,
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

test('one actor drives; a second is refused while the first is alive and unexpired', () => {
  const dir = makeRunDir();
  try {
    claimActor(dir, { pid: 111, token: 't1', leaseMs: 60000, now: 1000, isPidAlive: () => true });
    assert.throws(
      () => claimActor(dir, { pid: 222, token: 't2', now: 2000, isPidAlive: () => true }),
      (e) => e.code === 'actor-held' && e.holderPid === 111,
    );
  } finally { cleanup(dir); }
});

test('a dead holder does not strand the run -- the seat can be taken', () => {
  const dir = makeRunDir();
  try {
    claimActor(dir, { pid: 111, token: 't1', leaseMs: 60000, now: 1000, isPidAlive: () => true });
    const taken = claimActor(dir, { pid: 222, token: 't2', now: 2000, isPidAlive: () => false });
    assert.equal(taken.pid, 222);
    assert.equal(readVisibility(dir).actor.pid, 222);
  } finally { cleanup(dir); }
});

test('an expired lease can be taken over even by a still-running holder', () => {
  const dir = makeRunDir();
  try {
    claimActor(dir, { pid: 111, token: 't1', leaseMs: 1000, now: 1000, isPidAlive: () => true });
    const taken = claimActor(dir, { pid: 222, token: 't2', now: 99999, isPidAlive: () => true });
    assert.equal(taken.pid, 222);
  } finally { cleanup(dir); }
});

test('the same actor renewing its own lease is never blocked by itself', () => {
  const dir = makeRunDir();
  try {
    claimActor(dir, { pid: 111, token: 't1', leaseMs: 1000, now: 1000, isPidAlive: () => true });
    const renewed = claimActor(dir, { pid: 111, token: 't1', leaseMs: 1000, now: 1500, isPidAlive: () => true });
    assert.equal(renewed.pid, 111);
  } finally { cleanup(dir); }
});

test('an actor that already lost the seat cannot release the winner claim on its way out', () => {
  const dir = makeRunDir();
  try {
    claimActor(dir, { pid: 111, token: 't1', leaseMs: 1000, now: 1000, isPidAlive: () => true });
    claimActor(dir, { pid: 222, token: 't2', now: 99999, isPidAlive: () => true });
    assert.equal(releaseActor(dir, { pid: 111, token: 't1' }), false);
    assert.equal(readVisibility(dir).actor.pid, 222, 'the winner still holds it');
    assert.equal(releaseActor(dir, { pid: 222, token: 't2' }), true);
    assert.equal(readVisibility(dir).actor, null);
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
