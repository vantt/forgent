// The owning proof of the rotation executor: the two-step replacement (the old session is retired only after the
// successor answered and Identity names it holder), what a failure leaves behind, the one-rotation-per-lineage lock,
// the answer record, and the one entry that starts the detached executor. The Session Host, Identity, the launch and
// the clock are fakes; the lineage files are real files in a scratch project.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { answerNamesQuestion, markSuccessorAnswered, requestRotation, rotateHeadSession, rotationHolds } from '../../src/session-rotation/rotate.mjs';
import { lineageDirOf, readHeadPlacement, writeHeadPlacement } from '../../src/session-host/head-start.mjs';
import { acquireSync, createLockScope } from '../../src/holder-lock/index.mjs';

const OLD = { host: 'terminal', key: 'cmd_old' };
const NEW = { host: 'terminal', key: 'cmd_new' };

function project(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-rotate-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  // The old head's attempt directory exists, so the successor is generation 2.
  fs.mkdirSync(path.join(root, '.fgos', 'assignments', 'head-planner-x-1'), { recursive: true });
  const dir = lineageDirOf(root, 'planner', 'x');
  writeHeadPlacement(dir, { role: 'head:planner-x', gen: 1, placement: OLD, persona: 'planner', startedAt: '2026-11-18T00:00:00Z' });
  return { root, dir };
}

/**
 * Fakes whose clock only moves when the executor sleeps. `onSleep(n)` runs at the n-th sleep (1-based): where a test
 * lets the successor answer. `holder` is what Identity says holds the role at that moment.
 */
function fakes(root, { onSleep = () => {}, holder = { live: true, session: 'old-session' }, placeFails = null, lock = undefined } = {}) {
  const calls = { retire: [], place: [], released: 0, order: [] };
  let now = 0;
  let sleeps = 0;
  const ports = {
    host: { retire: (placement, disposition) => { calls.retire.push([placement.key, disposition]); calls.order.push(`retire ${placement.key}`); return { result: 'retired' }; } },
    identity: () => (typeof holder === 'function' ? holder() : holder),
    lock: lock ?? (() => ({ release() { calls.released += 1; } })),
    place: (request) => {
      calls.place.push(request);
      calls.order.push('place');
      if (placeFails) throw Object.assign(new Error('seat refused'), { code: placeFails });
      return { role: 'head:planner-x', gen: request.gen, key: NEW.key, placement: NEW, runDir: '/run/new', cli: null, persona: 'planner' };
    },
    config: () => ({ keep: 10, answerWaitMs: 5000 }),
    clock: { now: () => now, sleep: async (ms) => { now += ms; sleeps += 1; await onSleep(sleeps); } },
    pollMs: 1000,
  };
  return { calls, ports, request: { persona: 'planner', name: 'x', reason: 'soft', projectRoot: root, stopFacts: { sessionId: 'oldsess1', pendingQuestion: 'Should the backlog rows be merged?' } } };
}

const answer = (root, message = 'I resumed the question whether the backlog rows should be merged.') => markSuccessorAnswered({
  projectRoot: root, persona: 'planner', name: 'x', key: 'head-planner-x-2', sessionId: 'new-session', message,
});

test('the old session is retired only after the successor answered and Identity names it the holder', async (t) => {
  const { root, dir } = project(t);
  let moved = false;
  const { calls, ports, request } = fakes(root, {
    holder: () => ({ live: true, session: moved ? 'new-session' : 'old-session' }),
    onSleep: (n) => { if (n === 2) { answer(root); moved = true; } },
  });
  const result = await rotateHeadSession({ ...request, reason: 'hard' }, ports);
  assert.deepEqual(result, { rotated: true, key: 'cmd_new', gen: 2, oldRetired: true });
  assert.deepEqual(calls.order, ['place', 'retire cmd_old'], 'the successor starts first, the old pane closes last');
  assert.equal(calls.place[0].beside, 'cmd_old', 'the successor opens in the old session\'s tab');
  assert.equal(calls.place[0].gen, 2);
  assert.deepEqual(calls.retire, [['cmd_old', 'close']]);
  assert.equal(readHeadPlacement(dir).placement.key, 'cmd_new', 'the placement record follows the role');
  assert.equal(readHeadPlacement(dir).gen, 2);
  assert.equal(fs.existsSync(path.join(dir, 'rotation.json')), false, 'no rotation is left pending');
  const latest = JSON.parse(fs.readFileSync(path.join(dir, 'latest.json'), 'utf8'));
  assert.match(fs.readFileSync(path.join(dir, latest.file), 'utf8'), /backlog rows/, 'a rotation hands the question over in the handoff');
  assert.equal(calls.released, 1, 'the lineage lock is given back');
});

test('a successor that never answers is retired, the old session stays, and one incident line says why', async (t) => {
  const { root, dir } = project(t);
  const { calls, ports, request } = fakes(root);
  const result = await rotateHeadSession(request, ports);
  assert.equal(result.rotated, false);
  assert.equal(result.reason, 'no-answer');
  assert.deepEqual(calls.retire, [['cmd_new', 'close']], 'only the successor is retired, never the old session');
  assert.equal(readHeadPlacement(dir).placement.key, 'cmd_old');
  assert.equal(fs.existsSync(path.join(dir, 'rotation.json')), false);
  const lines = fs.readFileSync(path.join(dir, 'incidents.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  assert.equal(lines.length, 1);
  assert.equal(lines[0].code, 'no-answer');
  assert.equal(calls.released, 1);
});

test('an answer is not enough while Identity still names another session the holder', async (t) => {
  const { root } = project(t);
  const { calls, ports, request } = fakes(root, { onSleep: (n) => { if (n === 1) answer(root); } });
  const result = await rotateHeadSession(request, ports);
  assert.equal(result.reason, 'no-answer');
  assert.deepEqual(calls.retire, [['cmd_new', 'close']]);
});

test('a successor refused at start leaves the old session alone and retires nothing', async (t) => {
  const { root, dir } = project(t);
  const { calls, ports, request } = fakes(root, { placeFails: 'bind-refused' });
  const result = await rotateHeadSession(request, ports);
  assert.equal(result.reason, 'bind-refused');
  assert.deepEqual(calls.retire, []);
  assert.equal(readHeadPlacement(dir).placement.key, 'cmd_old');
});

test('a second rotation request while one runs is a no-op', async (t) => {
  const { root } = project(t);
  const { calls, ports, request } = fakes(root, { lock: () => null });
  assert.deepEqual(await rotateHeadSession(request, ports), { rotated: false, reason: 'rotation-in-progress' });
  assert.deepEqual(calls.place, []);
  assert.deepEqual(calls.retire, []);
});

test('the lineage lock is the real kernel lock: a held lock is seen by the probe and refuses a second rotation', async (t) => {
  const { root } = project(t);
  const lineage = { projectRoot: root, persona: 'planner', name: 'x' };
  assert.equal(rotationHolds(lineage), false);
  const held = acquireSync(createLockScope('session-rotation'), 'session-rotation', { fgosDir: path.join(root, '.fgos'), id: 'planner-x' });
  assert.equal(held.result, 'acquired');
  try {
    assert.equal(rotationHolds(lineage), true);
    const { calls, request } = fakes(root);
    assert.deepEqual(await rotateHeadSession(request, { place: () => assert.fail('must not start'), identity: () => ({ live: true }) }), { rotated: false, reason: 'rotation-in-progress' });
    assert.deepEqual(calls.place, []);
  } finally {
    held.handle.release();
  }
  assert.equal(rotationHolds(lineage), false);
});

test('a message about something else does not name the pending question and moves nothing', (t) => {
  const { root, dir } = project(t);
  fs.writeFileSync(path.join(dir, 'rotation.json'), JSON.stringify({ successorKey: 'head-planner-x-2', gen: 2, pendingQuestion: 'Should the backlog rows be merged?' }));
  assert.throws(() => answer(root, 'Ready, what are we doing today?'), { code: 'answer-mismatch' });
  assert.equal(fs.existsSync(path.join(dir, 'answered.json')), false);
  assert.equal(answer(root).accepted, true);
  assert.equal(JSON.parse(fs.readFileSync(path.join(dir, 'answered.json'), 'utf8')).sessionId, 'new-session');
});

test('an answer is refused unless the lineage waits for that very successor', (t) => {
  const { root, dir } = project(t);
  assert.throws(() => answer(root), { code: 'no-rotation-pending' });
  fs.writeFileSync(path.join(dir, 'rotation.json'), JSON.stringify({ successorKey: 'head-planner-x-9', gen: 9, pendingQuestion: null }));
  assert.throws(() => answer(root), { code: 'no-rotation-pending' });
});

test('with no pending question any non-empty first message passes, with one at least half of its words must appear', () => {
  assert.equal(answerNamesQuestion('No question is pending.', null), true);
  assert.equal(answerNamesQuestion('   ', null), false);
  assert.equal(answerNamesQuestion('Resumed: the backlog rows, merged or not', 'Should the backlog rows be merged?'), true);
  assert.equal(answerNamesQuestion('Nothing to report', 'Should the backlog rows be merged?'), false);
});

test('a request is checked, written beside the lineage and handed to one detached executor entry, returning at once', (t) => {
  const { root, dir } = project(t);
  const spawned = [];
  const ports = { holds: () => false, spawn: (spec) => { spawned.push(spec); return { pid: 4242 }; } };
  const result = requestRotation({ persona: 'planner', name: 'x', reason: 'hard', projectRoot: root, stopFacts: { pendingQuestion: 'q?' } }, ports);
  assert.deepEqual(result, { started: true, pid: 4242 });
  assert.equal(spawned[0].executable, process.execPath);
  assert.match(spawned[0].args[0], /session-rotation\/rotate\.mjs$/);
  assert.equal(spawned[0].args[1], '--request');
  const request = JSON.parse(fs.readFileSync(spawned[0].args[2], 'utf8'));
  assert.deepEqual({ persona: request.persona, reason: request.reason, projectRoot: request.projectRoot }, { persona: 'planner', reason: 'hard', projectRoot: root });
  assert.equal(path.dirname(spawned[0].args[2]), dir);

  assert.deepEqual(requestRotation({ persona: 'planner', name: 'x', reason: 'soft', projectRoot: root }, { holds: () => true, spawn: () => assert.fail('no executor') }), { started: false, reason: 'rotation-in-progress' });
  assert.deepEqual(requestRotation({ persona: 'planner', name: 'x', reason: 'soft', projectRoot: root }, { holds: () => false, spawn: () => ({ pid: null, error: 'ENOENT' }) }), { started: false, reason: 'spawn-failed' });
  assert.throws(() => requestRotation({ persona: 'planner', name: 'x', reason: 'sometimes', projectRoot: root }, ports), { code: 'bad-reason' });
  assert.throws(() => requestRotation({ persona: 'planner', name: 'x', reason: 'soft', projectRoot: root, stopFacts: { extra: 1 } }, ports), { code: 'bad-stop-facts' });
});
