// The owning proof of the rotation executor: the two-step replacement (the old session is ended only after the
// successor answered and Identity names it holder), what a failure leaves behind, the one-rotation-per-lineage lock,
// the answer record, and the one entry that starts the detached executor. The Session Host, Identity, the launch and
// the clock are fakes; the lineage files are real files in a scratch project.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { markSuccessorAnswered, requestRotation, rotateHeadSession, rotationHolds, rotationIdOf } from '../../src/session-rotation/rotate.mjs';
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
  writeHeadPlacement(dir, { role: 'head:planner-x', gen: 1, placement: OLD, runDir: '/run/old', persona: 'planner', startedAt: '2026-11-18T00:00:00Z' });
  return { root, dir };
}

/**
 * Fakes whose clock only moves when the executor sleeps. `onSleep(n)` runs at the n-th sleep (1-based): where a test
 * lets the successor answer. `holder` is what Identity says holds the role at that moment.
 */
function fakes(root, { onSleep = () => {}, holder = { live: true, session: 'old-session' }, placeFails = null, lock = undefined } = {}) {
  const calls = { end: [], place: [], released: 0, order: [] };
  let now = 0;
  let sleeps = 0;
  const ports = {
    end: (runDir) => { calls.end.push(runDir); calls.order.push(`end ${runDir}`); return true; },
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

const pendingOf = (root) => JSON.parse(fs.readFileSync(path.join(lineageDirOf(root, 'planner', 'x'), 'rotation.json'), 'utf8'));

/** The successor's answer as its hook sends it: the id it read from its handoff, echoed exactly. */
const answer = (root, { rotationId = pendingOf(root).id, message = 'I read the handoff.' } = {}) => markSuccessorAnswered({
  projectRoot: root, persona: 'planner', name: 'x', key: 'head-planner-x-2', sessionId: 'new-session', rotationId, message,
});

test('the old session is ended only after the successor answered and Identity names it the holder', async (t) => {
  const { root, dir } = project(t);
  let moved = false;
  const { calls, ports, request } = fakes(root, {
    holder: () => ({ live: true, session: moved ? 'new-session' : 'old-session' }),
    onSleep: (n) => { if (n === 2) { answer(root); moved = true; } },
  });
  const result = await rotateHeadSession({ ...request, reason: 'hard' }, ports);
  assert.deepEqual(result, { rotated: true, key: 'cmd_new', gen: 2, oldEnded: true });
  assert.deepEqual(calls.order, ['place', 'end /run/old'], 'the successor starts first, the old session is ended last');
  assert.equal(calls.place[0].beside, 'cmd_old', 'the successor opens in the old session\'s tab');
  assert.equal(calls.place[0].gen, 2);
  assert.deepEqual(calls.end, ['/run/old']);
  assert.equal(readHeadPlacement(dir).placement.key, 'cmd_new', 'the placement record follows the role');
  assert.equal(readHeadPlacement(dir).gen, 2);
  assert.equal(fs.existsSync(path.join(dir, 'rotation.json')), false, 'no rotation is left pending');
  const latest = JSON.parse(fs.readFileSync(path.join(dir, 'latest.json'), 'utf8'));
  const handoffText = fs.readFileSync(path.join(dir, latest.file), 'utf8');
  assert.match(handoffText, /backlog rows/, 'a rotation hands the question over in the handoff');
  assert.match(rotationIdOf(handoffText) ?? '', /^[a-f0-9]{16}$/, 'the handoff carries the id the successor must echo');
  assert.equal(calls.released, 1, 'the lineage lock is given back');
});

test('a successor that never answers is ended, the old session stays, and one incident line says why', async (t) => {
  const { root, dir } = project(t);
  const { calls, ports, request } = fakes(root);
  const result = await rotateHeadSession(request, ports);
  assert.equal(result.rotated, false);
  assert.equal(result.reason, 'no-answer');
  assert.deepEqual(calls.end, ['/run/new'], 'only the successor is ended, never the old session');
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
  assert.deepEqual(calls.end, ['/run/new']);
});

test('a successor refused at start leaves the old session alone and ends nothing', async (t) => {
  const { root, dir } = project(t);
  const { calls, ports, request } = fakes(root, { placeFails: 'bind-refused' });
  const result = await rotateHeadSession(request, ports);
  assert.equal(result.reason, 'bind-refused');
  assert.deepEqual(calls.end, []);
  assert.equal(readHeadPlacement(dir).placement.key, 'cmd_old');
});

test('a second rotation request while one runs is a no-op', async (t) => {
  const { root } = project(t);
  const { calls, ports, request } = fakes(root, { lock: () => null });
  assert.deepEqual(await rotateHeadSession(request, ports), { rotated: false, reason: 'rotation-in-progress' });
  assert.deepEqual(calls.place, []);
  assert.deepEqual(calls.end, []);
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

test('an answer must echo the pending rotation id exactly, and nothing else moves the role', (t) => {
  const { root, dir } = project(t);
  fs.writeFileSync(path.join(dir, 'rotation.json'), JSON.stringify({ id: '0123456789abcdef', successorKey: 'head-planner-x-2', gen: 2 }));
  assert.throws(() => answer(root, { rotationId: 'fedcba9876543210' }), { code: 'answer-mismatch' });
  assert.throws(() => answer(root, { rotationId: '0123456789ABCDEF' }), { code: 'bad-args' });
  assert.throws(() => answer(root, { rotationId: null }), { code: 'bad-args' });
  assert.equal(fs.existsSync(path.join(dir, 'answered.json')), false);
  assert.equal(answer(root).accepted, true);
  assert.equal(JSON.parse(fs.readFileSync(path.join(dir, 'answered.json'), 'utf8')).sessionId, 'new-session');
  fs.rmSync(path.join(dir, 'rotation.json'));
  assert.throws(() => answer(root, { rotationId: '0123456789abcdef' }), { code: 'no-rotation-pending' }, 'a late answer after the executor gave up is refused');
});

test('an answer is refused unless the lineage waits for that very successor', (t) => {
  const { root, dir } = project(t);
  assert.throws(() => answer(root, { rotationId: '0123456789abcdef' }), { code: 'no-rotation-pending' });
  fs.writeFileSync(path.join(dir, 'rotation.json'), JSON.stringify({ id: '0123456789abcdef', successorKey: 'head-planner-x-9', gen: 9 }));
  assert.throws(() => answer(root, { rotationId: '0123456789abcdef' }), { code: 'no-rotation-pending' });
});

test('a role that moved after the deadline completes the rotation instead of ending the role holder', async (t) => {
  const { root, dir } = project(t);
  // Identity names the successor only once the executor has removed rotation.json: the role moved at the deadline.
  const { calls, ports, request } = fakes(root, {
    holder: () => ({ live: true, session: fs.existsSync(path.join(dir, 'rotation.json')) ? 'old-session' : 'new-session' }),
    onSleep: (n) => { if (n === 1) answer(root); },
  });
  const result = await rotateHeadSession(request, ports);
  assert.equal(result.rotated, true);
  assert.deepEqual(calls.end, ['/run/old'], 'only the old session is ended, never the successor');
  assert.equal(readHeadPlacement(dir).placement.key, 'cmd_new');
  const line = JSON.parse(fs.readFileSync(path.join(dir, 'incidents.jsonl'), 'utf8').trim());
  assert.equal(line.event, 'rotation-completed');
  assert.match(line.how, /no-answer.*already named the successor/);
});

test('a failure after the successor holds the role keeps it alive and names the failed step', async (t) => {
  const { root, dir } = project(t);
  let moved = false;
  const { calls, ports, request } = fakes(root, {
    holder: () => ({ live: true, session: moved ? 'new-session' : 'old-session' }),
    onSleep: (n) => { if (n === 1) { answer(root); moved = true; } },
  });
  ports.recordPlacement = () => { throw new Error('disk full'); };
  const result = await rotateHeadSession(request, ports);
  assert.equal(result.rotated, true);
  assert.deepEqual(calls.end, ['/run/old'], 'the role holder is never ended by a later step');
  assert.equal(fs.existsSync(path.join(dir, 'rotation.json')), false);
  const line = JSON.parse(fs.readFileSync(path.join(dir, 'incidents.jsonl'), 'utf8').trim());
  assert.deepEqual({ event: line.event, step: line.step }, { event: 'step-failed', step: 'record-placement' });
  assert.match(line.detail, /disk full/);
});

test('when Identity cannot say who holds the role at the deadline nothing is ended', async (t) => {
  const { root, dir } = project(t);
  let calls_ = 0;
  const { calls, ports, request } = fakes(root, { holder: () => { calls_ += 1; if (calls_ > 1) throw Object.assign(new Error('down'), { code: 'identity-unavailable' }); return { live: true, session: 'old-session' }; } });
  const result = await rotateHeadSession(request, ports);
  assert.equal(result.successor, 'kept');
  assert.deepEqual(calls.end, []);
  assert.equal(JSON.parse(fs.readFileSync(path.join(dir, 'incidents.jsonl'), 'utf8').trim()).successor, 'kept');
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

test('the detached entry reads its request file, removes it and prints one result line', (t) => {
  const { root, dir } = project(t);
  const entry = fileURLToPath(new URL('../../src/session-rotation/rotate.mjs', import.meta.url));
  const file = path.join(dir, 'request-x.json');
  fs.writeFileSync(file, '{ not json');
  const bad = spawnSync(process.execPath, [entry, '--request', file], { encoding: 'utf8' });
  assert.equal(bad.status, 1);
  assert.equal(JSON.parse(bad.stdout).reason, 'bad-request');
  assert.equal(fs.existsSync(file), false, 'the request file is consumed even when it is unusable');
  assert.equal(spawnSync(process.execPath, [entry], { encoding: 'utf8' }).status, 2, 'no request file is a usage error');
  assert.ok(root);
});
