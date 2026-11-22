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
import { ensureGitAddon } from '../helpers/git-addon.mjs';
import { markSuccessorAnswered, requestRotation, rotateHeadSession, rotationHolds, rotationIdOf } from '../../src/session-rotation/rotate.mjs';
import { lineageDirOf, readHeadPlacement, writeHeadPlacement } from '../../src/session-host/head-start.mjs';
import { taskOfHead } from '../../src/session-host/head-plan.mjs';
import { acquireSync, createLockScope } from '../../src/holder-lock/index.mjs';

ensureGitAddon();

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
/** Identity's record of the old head: its slot key (`ids.terminal.key`) is where the successor opens beside it. */
const OLD_RECORD = { id: 'fg-abc234/old-session', roles: ['head:planner-x'], ids: { terminal: { driver: 'herdr', key: 'cmd_old-slot', paneId: 'w1:p1' }, head: { persona: 'planner', name: 'x', gen: 1 } } };

function fakes(root, { onSleep = () => {}, holder = { live: true, session: 'old-session', record: OLD_RECORD }, placeFails = null, lock = undefined } = {}) {
  const calls = { end: [], place: [], restore: [], released: 0, order: [] };
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
    closed: () => true,
    restoreRole: (ask) => { calls.restore.push(ask); },
    config: () => ({ keep: 10, answerWaitMs: 5000 }),
    clock: { now: () => now, sleep: async (ms) => { now += ms; sleeps += 1; await onSleep(sleeps); } },
    pollMs: 1000,
    taskOfHead: (r, p, n, pt) => (p === 'lead' ? taskOfHead(r, p, n, pt) : null),
  };
  return { calls, ports, request: { persona: 'planner', name: 'x', reason: 'soft', projectRoot: root, stopFacts: { sessionId: 'oldsess1', pendingQuestion: 'Should the backlog rows be merged?' } } };
}

const pendingOf = (root) => JSON.parse(fs.readFileSync(path.join(lineageDirOf(root, 'planner', 'x'), 'rotation.json'), 'utf8'));

/** The successor's answer as its hook sends it: the id it read from its handoff, echoed exactly. */
const answer = (root, { rotationId = pendingOf(root).id, message = 'I read the handoff.' } = {}) => markSuccessorAnswered({
  projectRoot: root, persona: 'planner', name: 'x', key: 'head-planner-x-2', sessionId: 'new-session', rotationId, message,
});

test('a holder poll that sees two holders once and then one completes the rotation', async (t) => {
  const { root, dir } = project(t);
  let moved = false;
  let asks = 0;
  const { calls, ports, request } = fakes(root, {
    holder: () => {
      asks += 1;
      if (!moved) return { live: true, session: 'old-session', record: OLD_RECORD };
      if (asks % 2 === 0) throw Object.assign(new Error('ambiguous'), { code: 'identity-ambiguous' });
      return { live: true, session: 'new-session' };
    },
    onSleep: (n) => { if (n === 2) { answer(root); moved = true; } },
  });
  const result = await rotateHeadSession({ ...request, reason: 'hard' }, ports);
  assert.equal(result.rotated, true);
  assert.deepEqual(calls.end, ['/run/old']);
  // The abandon path would also finish the rotation but writes a `rotation-completed` incident; the poll writes none.
  assert.equal(fs.existsSync(path.join(dir, 'incidents.jsonl')), false, 'the ambiguous answer was polled again, not abandoned');
});

test('the old session is ended only after the successor answered and Identity names it the holder', async (t) => {
  const { root, dir } = project(t);
  let moved = false;
  const { calls, ports, request } = fakes(root, {
    holder: () => (moved ? { live: true, session: 'new-session' } : { live: true, session: 'old-session', record: OLD_RECORD }),
    onSleep: (n) => {
      if (n === 2) {
        const pending = pendingOf(root);
        assert.equal(pending.executor.pid, process.pid, 'the executor records itself through the process door');
        assert.equal(typeof pending.executor.startTime, 'string');
        assert.equal(pending.old.runDir, '/run/old');
        assert.equal(pending.successor.runDir, '/run/new');
        answer(root); moved = true;
      }
    },
  });
  const result = await rotateHeadSession({ ...request, reason: 'hard' }, ports);
  assert.deepEqual(result, { rotated: true, key: 'cmd_new', gen: 2, oldEnded: true });
  assert.deepEqual(calls.order, ['place', 'end /run/old'], 'the successor starts first, the old session is ended last');
  assert.equal(calls.place[0].beside, 'cmd_old-slot', 'the successor opens beside the slot the role holder\'s record names');
  assert.equal(calls.place[0].gen, 2, 'the successor is the next generation of the lineage the record names (1)');
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

test('a manual rotation is recorded as manual and hands off the old session\'s final message and the persona\'s existing portfolio', async (t) => {
  const { root, dir } = project(t);
  const { ports, request } = fakes(root);
  ports.config = () => ({ keep: 10, answerWaitMs: 5000, personas: { planner: { reload: ['plans/backlog.md', 'plans/board/plan.md', 'plans/discussions'] } } });
  fs.mkdirSync(path.join(root, 'plans', 'discussions'), { recursive: true });
  fs.writeFileSync(path.join(root, 'plans', 'backlog.md'), '# Backlog\n');
  ports.sessionDir = (runDir, key) => { assert.deepEqual([runDir, key], ['/run/old', 'cmd_old']); return '/sessions/projects'; };
  // The turn that asked for the rotation is still going on the first read; its final message is the one handed over.
  const reads = [{ result: 'found', message: 'Rotating now.', turnEnded: false }, { result: 'found', message: 'Open questions:\n1. Which db?', turnEnded: true }];
  ports.lastMessage = ({ projectsDir }) => { assert.equal(projectsDir, '/sessions/projects'); return reads.shift(); };
  await rotateHeadSession({ ...request, reason: 'manual', stopFacts: {} }, ports);
  const latest = JSON.parse(fs.readFileSync(path.join(dir, 'latest.json'), 'utf8'));
  assert.equal(latest.rotate, 'manual');
  const text = fs.readFileSync(path.join(dir, latest.file), 'utf8');
  assert.match(text, /^- rotation: manual$/m);
  assert.match(text, /## Last assistant message \(verbatim\)\n\n```text\nOpen questions:\n1\. Which db\?\n```\n/);
  assert.match(text, /^- plans\/backlog\.md\n- plans\/discussions$/m, 'the persona\'s reload paths are the portfolio, and one the project does not have is left out');
  assert.doesNotMatch(text, /plans\/board/);
  assert.deepEqual(reads, [], 'the reader is asked again until the old turn ended');
});

test('a manual rotation keeps the end of a long last message, where the open questions are, and marks the cut', async (t) => {
  const { root, dir } = project(t);
  const { ports, request } = fakes(root);
  const long = `START${'x'.repeat(9000)}\nOpen questions:\n1. Which db?`;
  Object.assign(ports, { sessionDir: () => '/s', lastMessage: () => ({ result: 'found', message: long, turnEnded: true }) });
  await rotateHeadSession({ ...request, reason: 'manual', stopFacts: {} }, ports);
  const latest = JSON.parse(fs.readFileSync(path.join(dir, 'latest.json'), 'utf8'));
  const text = fs.readFileSync(path.join(dir, latest.file), 'utf8');
  const section = text.slice(text.indexOf('```text\n') + 8, text.indexOf('\n```\n'));
  assert.ok(section.startsWith('…(earlier text cut)\n') && section.endsWith('Open questions:\n1. Which db?'), section.slice(0, 80));
  assert.equal(section.length, 8000);
  assert.doesNotMatch(section, /START/);
});

test('a manual rotation whose old transcript cannot be found says so in the handoff and still rotates', async (t) => {
  for (const [sessionDir, lastMessage, says] of [
    [() => null, () => assert.fail('nothing to read'), /\(not found: the old session's launch recorded no session folder\)/],
    [() => '/s', () => ({ result: 'not-found', detail: 'no session transcript under /s' }), /\(not found: no session transcript under \/s\)/],
    [() => '/s', () => { throw Object.assign(new Error('no host'), { code: 'session-host-no-host-binary' }); }, /\(not found: .*session-host-no-host-binary\)/],
  ]) {
    const { root, dir } = project(t);
    const { calls, ports, request } = fakes(root);
    Object.assign(ports, { sessionDir, lastMessage });
    await rotateHeadSession({ ...request, reason: 'manual', stopFacts: {} }, ports);
    assert.equal(calls.place.length, 1, 'the successor is still started');
    const latest = JSON.parse(fs.readFileSync(path.join(dir, 'latest.json'), 'utf8'));
    assert.match(fs.readFileSync(path.join(dir, latest.file), 'utf8'), says);
  }
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

test('requestRotation validates sessionCrons and backgroundTasks in stopFacts', (t) => {
  const { root } = project(t);
  const ports = { holds: () => true };
  const valid = requestRotation({
    persona: 'planner', name: 'x', reason: 'hard', projectRoot: root,
    stopFacts: {
      sessionCrons: [{ schedule: '*/5 * * * *', prompt: 'ping', recurring: true }],
      backgroundTasks: [{ id: 'b1', command: 'sleep 5', description: 'test task' }],
    },
  }, ports);
  assert.equal(valid.started, false);
  assert.throws(() => requestRotation({ persona: 'planner', name: 'x', reason: 'soft', projectRoot: root, stopFacts: { sessionCrons: 'not-array' } }, ports), { code: 'bad-stop-facts' });
  assert.throws(() => requestRotation({ persona: 'planner', name: 'x', reason: 'soft', projectRoot: root, stopFacts: { sessionCrons: ['not-object'] } }, ports), { code: 'bad-stop-facts' });
  assert.throws(() => requestRotation({ persona: 'planner', name: 'x', reason: 'soft', projectRoot: root, stopFacts: { sessionCrons: [{ prompt: 123 }] } }, ports), { code: 'bad-stop-facts' });
  assert.throws(() => requestRotation({ persona: 'planner', name: 'x', reason: 'soft', projectRoot: root, stopFacts: { sessionCrons: [{ recurring: 'yes' }] } }, ports), { code: 'bad-stop-facts' });
  assert.throws(() => requestRotation({ persona: 'planner', name: 'x', reason: 'soft', projectRoot: root, stopFacts: { sessionCrons: [{ prompt: 'x'.repeat(8001) }] } }, ports), { code: 'bad-stop-facts' });
  assert.throws(() => requestRotation({ persona: 'planner', name: 'x', reason: 'soft', projectRoot: root, stopFacts: { sessionCrons: [{ unknownField: 'val' }] } }, ports), { code: 'bad-stop-facts' });
  assert.throws(() => requestRotation({ persona: 'planner', name: 'x', reason: 'soft', projectRoot: root, stopFacts: { backgroundTasks: 'not-array' } }, ports), { code: 'bad-stop-facts' });
  assert.throws(() => requestRotation({ persona: 'planner', name: 'x', reason: 'soft', projectRoot: root, stopFacts: { backgroundTasks: ['not-object'] } }, ports), { code: 'bad-stop-facts' });
  assert.throws(() => requestRotation({ persona: 'planner', name: 'x', reason: 'soft', projectRoot: root, stopFacts: { backgroundTasks: [{ command: 123 }] } }, ports), { code: 'bad-stop-facts' });
  assert.throws(() => requestRotation({ persona: 'planner', name: 'x', reason: 'soft', projectRoot: root, stopFacts: { backgroundTasks: [{ id: 'x'.repeat(8001) }] } }, ports), { code: 'bad-stop-facts' });
  assert.throws(() => requestRotation({ persona: 'planner', name: 'x', reason: 'soft', projectRoot: root, stopFacts: { backgroundTasks: [{ unknownField: 'val' }] } }, ports), { code: 'bad-stop-facts' });
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

test('a late take that landed on the ended successor gives the role back to the old head, and says so when the old head is gone too', async (t) => {
  const { root, dir } = project(t);
  const incidents = () => fs.readFileSync(path.join(dir, 'incidents.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l).event);
  // Identity names the old head until the successor is asked to stop; then nobody live holds the role.
  let successorEnded = false;
  const first = fakes(root, { holder: () => (successorEnded ? { live: false } : { live: true, session: 'old-session' }) });
  const end = first.ports.end;
  first.ports.end = (runDir) => { if (runDir === '/run/new') successorEnded = true; return end(runDir); };
  const result = await rotateHeadSession(first.request, first.ports);
  assert.equal(result.reason, 'no-answer');
  assert.deepEqual(first.calls.restore, [{ runDir: '/run/old', persona: 'planner', name: 'x' }], 'the old head\'s own supervisor registers the role again');
  assert.deepEqual(incidents(), ['role-restored', 'rotation-failed']);

  fs.rmSync(path.join(dir, 'incidents.jsonl'));
  successorEnded = false;
  const second = fakes(root, { holder: () => (successorEnded ? { live: false } : { live: true, session: 'old-session' }) });
  const end2 = second.ports.end;
  second.ports.end = (runDir) => { if (runDir === '/run/new') successorEnded = true; return end2(runDir); };
  second.ports.restoreRole = () => { throw Object.assign(new Error('gone'), { code: 'request-socket-unavailable' }); };
  await rotateHeadSession({ ...second.request, stopFacts: { sessionId: 'oldsess2' } }, second.ports);
  assert.deepEqual(incidents(), ['no-live-head', 'rotation-failed']);

  // A live holder after the successor closed means nothing is restored.
  fs.rmSync(path.join(dir, 'incidents.jsonl'));
  const third = fakes(root);
  await rotateHeadSession({ ...third.request, stopFacts: { sessionId: 'oldsess3' } }, third.ports);
  assert.deepEqual(third.calls.restore, []);
  assert.deepEqual(incidents(), ['rotation-failed']);
});

test('the detached entry still settles and records no-live-head when both heads end while it waits for the successor', (t) => {
  const { root, dir } = project(t);
  const entry = fileURLToPath(new URL('../../src/session-rotation/rotate.mjs', import.meta.url));
  const oldRun = path.join(root, 'run-old');
  fs.mkdirSync(oldRun, { recursive: true });
  // The old head's supervisor is gone: its request socket path leads nowhere.
  fs.writeFileSync(path.join(oldRun, 'envelope.json'), JSON.stringify({ session: { requestSocketPath: path.join(root, 'gone.sock') } }));
  writeHeadPlacement(dir, { role: 'head:planner-x', gen: 1, placement: OLD, runDir: oldRun, persona: 'planner', startedAt: '2026-11-18T00:00:00Z' });
  const file = path.join(dir, 'request-gone.json');
  fs.writeFileSync(file, JSON.stringify({ persona: 'planner', name: 'x', reason: 'soft', projectRoot: root, stopFacts: { sessionId: 'oldsess1' } }));

  // The real entry file runs as the main module with its own default role-restore path; only the outside world
  // (Identity, the seat launch, the stop request) is replaced, through the port argument of the one call it makes.
  const hooks = path.join(root, 'hooks.mjs');
  fs.writeFileSync(hooks, `export async function load(url, context, next) {
  const out = await next(url, context);
  if (!url.endsWith('/session-rotation/rotate.mjs')) return out;
  const needle = 'await rotateHeadSession(request)';
  const source = String(out.source);
  if (!source.includes(needle)) throw new Error('the entry no longer calls rotateHeadSession(request)');
  return { ...out, source: source.replace(needle, 'await rotateHeadSession(request, globalThis.__rotatePorts)') };
}\n`);
  const child = path.join(root, 'child.mjs');
  fs.writeFileSync(child, `import { register } from 'node:module';
register(${JSON.stringify(new URL(`file://${hooks}`).href)});
let ended = false;
globalThis.__rotatePorts = {
  lock: () => ({ release() {} }),
  config: () => ({ keep: 10, answerWaitMs: 50 }),
  clock: { now: () => Date.now(), sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)) },
  pollMs: 5,
  identity: () => (ended ? { live: false } : { live: true, session: 'old-session' }),
  place: (request) => ({ role: 'head:planner-x', gen: request.gen, key: 'cmd_new', placement: { host: 'terminal', key: 'cmd_new' }, runDir: ${JSON.stringify(path.join(root, 'run-new'))}, cli: null, persona: 'planner' }),
  end: (runDir) => { if (runDir.endsWith('run-new')) ended = true; return true; },
  closed: () => true,
  taskOfHead: async () => null,
};
process.argv = [process.execPath, ${JSON.stringify(entry)}, '--request', ${JSON.stringify(file)}];
await import(${JSON.stringify(new URL(`file://${entry}`).href)});
`);
  const run = spawnSync(process.execPath, [child], { encoding: 'utf8', timeout: 30_000 });
  assert.doesNotMatch(run.stderr, /unsettled top-level await/);
  assert.equal(run.status, 1, run.stderr);
  assert.equal(JSON.parse(run.stdout.trim()).reason, 'no-answer');
  const events = fs.readFileSync(path.join(dir, 'incidents.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l).event);
  assert.deepEqual(events, ['no-live-head', 'rotation-failed']);
});

test('every stop request leaves one trace line with its measure and outcome; below threshold starts nothing', (t) => {
  const { root, dir } = project(t);
  const measure = (fraction, decision) => ({ fraction, source: 'transcript', stale: true, decision });
  const never = { holds: () => assert.fail('a below-threshold stop takes no lock'), spawn: () => assert.fail('no executor') };
  assert.deepEqual(requestRotation({ persona: 'planner', name: 'x', reason: 'none', projectRoot: root, measure: measure(0.33, 'below-soft') }, never), { started: false, reason: 'below-threshold' });
  assert.deepEqual(requestRotation({ persona: 'planner', name: 'x', reason: 'soft', projectRoot: root, measure: measure(0.5, 'at-or-above-soft') }, { holds: () => true, spawn: never.spawn }), { started: false, reason: 'rotation-in-progress' });
  assert.throws(() => requestRotation({ persona: 'planner', name: 'x', reason: 'none', projectRoot: root }, never), (err) => err.code === 'bad-reason', 'none needs a measure');
  assert.throws(() => requestRotation({ persona: 'planner', name: 'x', reason: 'none', projectRoot: root, measure: { ...measure(2, 'x'), extra: 1 } }, never), (err) => err.code === 'bad-measure');
  const lines = fs.readFileSync(path.join(dir, 'stop-trace.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  assert.deepEqual(lines.map(({ at, ...rest }) => rest), [
    { fraction: 0.33, source: 'transcript', stale: true, decision: 'below-soft', reason: 'none', outcome: 'below-threshold' },
    { fraction: 0.5, source: 'transcript', stale: true, decision: 'at-or-above-soft', reason: 'soft', outcome: 'rotation-in-progress' },
  ]);
});

// These crash cases have no other owner: the executor proofs above never leave a dead executor on disk.
function orphan(root, dir, { savedSuccessor = true } = {}) {
  const successor = { key: NEW.key, placement: NEW, runDir: '/run/new', persona: 'planner' };
  const record = {
    id: '0123456789abcdef', gen: 2, successorKey: 'head-planner-x-2',
    executor: { pid: 123, startTime: '100', host: 'fixture' },
    old: readHeadPlacement(dir), startedAt: '2026-11-22T00:00:00Z',
    ...(savedSuccessor ? { successor } : {}),
  };
  fs.writeFileSync(path.join(dir, 'rotation.json'), JSON.stringify(record));
  return record;
}

const orphanEvents = (dir) => fs.readFileSync(path.join(dir, 'incidents.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);

test('the next rotate completes a dead executor rotation from Identity before taking its own rotation lock', async (t) => {
  const { root, dir } = project(t);
  const pending = orphan(root, dir);
  const { calls, ports, request } = fakes(root, {
    holder: { live: true, session: 'new-session', record: { ids: { head: { persona: 'planner', name: 'x', gen: 2 } } } },
  });
  ports.judge = (record) => { assert.deepEqual(record, pending.executor); return 'dead'; };
  let locks = 0;
  ports.lock = () => {
    locks += 1;
    if (locks === 1) return { release() { calls.released += 1; } };
    assert.equal(readHeadPlacement(dir).placement.key, NEW.key, 'recovery precedes the new rotation lock');
    assert.equal(fs.existsSync(path.join(dir, 'rotation.json')), false);
    return null;
  };
  assert.equal((await rotateHeadSession(request, ports)).reason, 'rotation-in-progress');
  assert.deepEqual(calls.end, ['/run/old']);
  assert.equal(calls.released, 1);
  assert.deepEqual(orphanEvents(dir).map(({ event, outcome }) => [event, outcome]), [['resolved-orphan', 'completed']]);
});

test('a dead executor with the old Identity holder abandons before accepting a late successor answer', (t) => {
  const { root, dir } = project(t);
  orphan(root, dir);
  const { calls, ports } = fakes(root);
  ports.judge = () => 'dead';
  const late = () => markSuccessorAnswered({ projectRoot: root, persona: 'planner', name: 'x', key: 'head-planner-x-2', sessionId: 'new-session', rotationId: '0123456789abcdef', message: 'ready' }, ports);
  assert.throws(late, { code: 'no-rotation-pending' });
  assert.throws(late, { code: 'no-rotation-pending' });
  assert.deepEqual(calls.end, ['/run/new']);
  assert.equal(readHeadPlacement(dir).placement.key, OLD.key);
  assert.equal(fs.existsSync(path.join(dir, 'answered.json')), false);
  assert.deepEqual(orphanEvents(dir).map(({ event, outcome }) => [event, outcome]), [['resolved-orphan', 'abandoned']]);
});

test('orphan recovery finds the supervised successor when the executor died before saving its returned placement', (t) => {
  const { root, dir } = project(t);
  orphan(root, dir, { savedSuccessor: false });
  const runDir = path.join(root, '.fgos/assignments/head-planner-x-2/runs/01');
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, 'envelope.json'), JSON.stringify({ host: 'terminal', slot: { key: NEW.key } }));
  const { calls, ports } = fakes(root, { holder: { live: true, session: 'new-session', record: { ids: { terminal: { key: NEW.key } } } } });
  ports.judge = () => 'dead';
  assert.throws(() => markSuccessorAnswered({ projectRoot: root, persona: 'planner', name: 'x', key: 'head-planner-x-2', sessionId: 'new-session', rotationId: '0123456789abcdef', message: 'ready' }, ports), { code: 'no-rotation-pending' });
  assert.equal(readHeadPlacement(dir).runDir, runDir);
  assert.deepEqual(calls.end, ['/run/old']);
});

test('only a proven-live executor holds off the next rotation; legacy, unknown and malformed records do not wedge it', async (t) => {
  for (const executor of [undefined, { pid: 123, startTime: '100' }, {}, { pid: '123', startTime: '100' }, { pid: 123 }, { pid: 123, startTime: 100 }, { pid: -1, startTime: '' }, 'bad']) {
    const { root, dir } = project(t);
    const pending = orphan(root, dir);
    pending.executor = executor;
    fs.writeFileSync(path.join(dir, 'rotation.json'), JSON.stringify(pending));
    let moved = false;
    const { calls, ports, request } = fakes(root, {
      holder: () => ({ live: true, session: moved ? 'new-session' : 'old-session', record: OLD_RECORD }),
      onSleep: () => { answer(root); moved = true; },
    });
    ports.judge = (record) => {
      assert.deepEqual(record, { pid: 123, startTime: '100' }, 'malformed executors never reach the process door');
      return 'unknown';
    };
    assert.equal((await rotateHeadSession(request, ports)).rotated, true);
    assert.equal(calls.place.length, 1);
    assert.deepEqual(calls.end, ['/run/old'], 'unproven executors are not reclaimed as dead');
    assert.equal(fs.existsSync(path.join(dir, 'rotation.json')), false);
  }
  const { root, dir } = project(t);
  const pending = orphan(root, dir);
  const { calls, ports, request } = fakes(root);
  ports.judge = () => 'alive';
  assert.deepEqual(await rotateHeadSession(request, ports), { rotated: false, reason: 'rotation-in-progress' });
  assert.deepEqual(pendingOf(root), pending);
  assert.deepEqual(calls.place, []);
  assert.deepEqual(calls.end, []);
});

test('an orphan recovery with a busy lock returns the normal rotation-in-progress result', async (t) => {
  const { root, dir } = project(t);
  const pending = orphan(root, dir);
  const { calls, ports, request } = fakes(root, { lock: () => null });
  ports.judge = () => 'dead';
  assert.deepEqual(await rotateHeadSession(request, ports), { rotated: false, reason: 'rotation-in-progress' });
  assert.deepEqual(pendingOf(root), pending);
  assert.deepEqual(calls.end, []);
  assert.deepEqual(calls.place, []);
});

test('a failed orphan recovery stays retryable while a successor run exists but its placement cannot yet be located', async (t) => {
  const { root, dir } = project(t);
  const { calls, ports, request } = fakes(root);
  orphan(root, dir);
  ports.judge = () => 'dead';
  ports.identity = () => { throw Object.assign(new Error('Identity unavailable'), { code: 'identity-unavailable' }); };
  await assert.rejects(rotateHeadSession(request, ports), { code: 'identity-unavailable' });
  assert.ok(pendingOf(root));
  assert.deepEqual(calls.end, []);
  ports.identity = () => ({ live: true, session: 'old-session' });
  ports.end = () => false;
  await assert.rejects(rotateHeadSession(request, ports), { code: 'cancel-unwritable' });
  assert.ok(pendingOf(root));
  assert.equal(fs.existsSync(path.join(dir, 'incidents.jsonl')), false);
  orphan(root, dir, { savedSuccessor: false });
  const runDir = path.join(root, '.fgos/assignments/head-planner-x-2/runs/01');
  fs.mkdirSync(runDir, { recursive: true });
  ports.identity = () => ({ live: true, record: { ids: { head: { persona: 'planner', name: 'x', gen: 2 } } } });
  ports.end = () => assert.fail('an unknown successor placement must not be guessed');
  await assert.rejects(rotateHeadSession(request, ports), { code: 'placement-unknown' });
  assert.ok(pendingOf(root), 'an existing but unlocated successor stays pending for recovery');
});

test('an orphan with no successor run abandons even when Identity names the successor', (t) => {
  for (const namesSuccessor of [false, true]) {
    const { root, dir } = project(t);
    orphan(root, dir, { savedSuccessor: false });
    const { calls, ports } = fakes(root, { holder: namesSuccessor
      ? { live: true, record: { ids: { head: { persona: 'planner', name: 'x', gen: 2 } } } }
      : { live: true, session: 'old-session', record: OLD_RECORD } });
    ports.judge = () => 'dead';
    assert.throws(() => markSuccessorAnswered({ projectRoot: root, persona: 'planner', name: 'x', key: 'head-planner-x-2', sessionId: 'new-session', rotationId: '0123456789abcdef', message: 'ready' }, ports), { code: 'no-rotation-pending' });
    assert.equal(fs.existsSync(path.join(dir, 'rotation.json')), false);
    assert.deepEqual(calls.end, []);
    assert.equal(readHeadPlacement(dir).placement.key, OLD.key);
    assert.deepEqual(orphanEvents(dir).map(({ event, outcome }) => [event, outcome]), [['resolved-orphan', 'abandoned']]);
  }
});

test('an orphan run without an envelope is abandoned when Identity still names the predecessor', (t) => {
  const { root, dir } = project(t);
  orphan(root, dir, { savedSuccessor: false });
  const runDir = path.join(root, '.fgos/assignments/head-planner-x-2/runs/01');
  fs.mkdirSync(runDir, { recursive: true });
  const { calls, ports } = fakes(root);
  ports.judge = () => 'dead';
  assert.throws(() => markSuccessorAnswered({ projectRoot: root, persona: 'planner', name: 'x', key: 'head-planner-x-2', sessionId: 'new-session', rotationId: '0123456789abcdef', message: 'ready' }, ports), { code: 'no-rotation-pending' });
  assert.deepEqual(calls.end, [runDir]);
  assert.equal(fs.existsSync(path.join(dir, 'rotation.json')), false);
  assert.deepEqual(orphanEvents(dir).map(({ event, outcome }) => [event, outcome]), [['resolved-orphan', 'abandoned']]);
});

test('a Stop rejected for a malformed measure leaves an incident without accepting the malformed number', (t) => {
  const { root, dir } = project(t);
  const malformed = { fraction: { '$serde_json::private::Number': '0.33' }, source: 'transcript', stale: true, decision: 'below-soft' };
  assert.throws(() => requestRotation({ persona: 'planner', name: 'x', reason: 'none', projectRoot: root, measure: malformed }), { code: 'bad-measure' });
  assert.deepEqual(orphanEvents(dir).map(({ event, code }) => [event, code]), [['stop-failed', 'bad-measure']]);
  assert.equal(fs.existsSync(path.join(dir, 'stop-trace.jsonl')), false, 'an invalid measure never becomes a trusted trace');
  assert.throws(() => requestRotation({ persona: '../escape', name: 'x', reason: 'none', projectRoot: root, measure: malformed }), { code: 'bad-persona' });
  assert.equal(orphanEvents(dir).length, 1, 'an invalid lineage writes no incident');
});

test('a stop whose host-side start throws leaves a best-effort incident before returning the error', (t) => {
  const { root, dir } = project(t);
  assert.throws(() => requestRotation({ persona: 'planner', name: 'x', reason: 'soft', projectRoot: root, measure: { fraction: 0.5, source: 'transcript', stale: true, decision: 'at-or-above-soft' } }, {
    holds: () => { throw Object.assign(new Error('probe unavailable'), { code: 'lock-driver-unavailable' }); },
  }), { code: 'lock-driver-unavailable' });
  assert.deepEqual(orphanEvents(dir).map(({ event, code }) => [event, code]), [['stop-failed', 'lock-driver-unavailable']]);
});

test('the stop trace keeps its newest lines once it passes its size bound', (t) => {
  const { root, dir } = project(t);
  const never = { holds: () => false, spawn: () => assert.fail('no executor') };
  const big = 'd'.repeat(55);
  for (let i = 0; i < 3500; i += 1) requestRotation({ persona: 'planner', name: 'x', reason: 'none', projectRoot: root, measure: { fraction: i, source: null, stale: false, decision: big } }, never);
  const lines = fs.readFileSync(path.join(dir, 'stop-trace.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  assert.ok(lines.length <= 3500 && lines.length >= 500, `kept ${lines.length}`);
  assert.equal(lines.at(-1).fraction, 3499, 'the newest line is kept');
});

test('a manual rotation retries when the transcript directory is not readable until the run copy appears', async (t) => {
  const { root, dir } = project(t);
  const { ports, request } = fakes(root);
  let pass = 0;
  ports.sessionDir = () => {
    pass += 1;
    return pass === 1 ? '/private-home/projects' : '/run/old/transcript/projects';
  };
  ports.lastMessage = ({ projectsDir }) => {
    if (projectsDir === '/private-home/projects') {
      return { result: 'not-found', detail: '/private-home/projects is not a readable directory' };
    }
    return { result: 'found', message: 'Resuming work on phase 12.', turnEnded: true };
  };
  await rotateHeadSession({ ...request, reason: 'manual', stopFacts: {} }, ports);
  const latest = JSON.parse(fs.readFileSync(path.join(dir, 'latest.json'), 'utf8'));
  const text = fs.readFileSync(path.join(dir, latest.file), 'utf8');
  assert.match(text, /Resuming work on phase 12\./);
  assert.ok(pass >= 2, 'sessionDir was resolved again on the next pass');
});

test('a lead\'s handoff lists its plan.md even when stopFacts portfolio is empty', async (t) => {
  const { root } = project(t);
  const planDir = '261122-0118-heads-stable-and-able';
  const planFile = path.join(root, 'plans', planDir, 'plan.md');
  fs.mkdirSync(path.dirname(planFile), { recursive: true });
  fs.writeFileSync(planFile, '# Phase 12\n');
  const leadDir = lineageDirOf(root, 'lead', 'sv-p12');
  writeHeadPlacement(leadDir, { role: 'head:lead-sv-p12', gen: 1, placement: OLD, runDir: '/run/old', persona: 'lead', startedAt: '2026-11-22T00:00:00Z' });
  fs.mkdirSync(path.join(root, '.fgos', 'assignments', 'head-lead-sv-p12-1'), { recursive: true });

  const { ports } = fakes(root, {
    holder: { live: true, session: 'old-session', record: { id: 'fg-lead/old', roles: ['head:lead-sv-p12'], ids: { terminal: { driver: 'herdr', key: 'cmd_old-slot', paneId: 'w1:p1' }, head: { persona: 'lead', name: 'sv-p12', gen: 1 } } } },
  });
  ports.planOfHead = () => ({ dir: planDir, footprint: [] });
  ports.place = (req) => ({ role: 'head:lead-sv-p12', gen: req.gen, key: NEW.key, placement: NEW, runDir: '/run/new', cli: null, persona: 'lead' });

  // Hook sends portfolio: [] for lead
  await rotateHeadSession({ persona: 'lead', name: 'sv-p12', reason: 'soft', projectRoot: root, stopFacts: { portfolio: [] } }, ports);
  const latest = JSON.parse(fs.readFileSync(path.join(leadDir, 'latest.json'), 'utf8'));
  const text = fs.readFileSync(path.join(leadDir, latest.file), 'utf8');
  assert.match(text, /^- plans\/261122-0118-heads-stable-and-able\/plan\.md$/m, 'lead handoff carries its plan.md');
});

test('a task path already in the stop-facts portfolio is listed once', async (t) => {
  const { root } = project(t);
  const planDir = '261122-0118-heads-stable-and-able';
  const planFile = path.join(root, 'plans', planDir, 'plan.md');
  fs.mkdirSync(path.dirname(planFile), { recursive: true });
  fs.writeFileSync(planFile, '# Phase 12\n');
  const leadDir = lineageDirOf(root, 'lead', 'sv-p12');
  writeHeadPlacement(leadDir, { role: 'head:lead-sv-p12', gen: 1, placement: OLD, runDir: '/run/old', persona: 'lead', startedAt: '2026-11-22T00:00:00Z' });
  fs.mkdirSync(path.join(root, '.fgos', 'assignments', 'head-lead-sv-p12-1'), { recursive: true });

  const { ports } = fakes(root, {
    holder: { live: true, session: 'old-session', record: { id: 'fg-lead/old', roles: ['head:lead-sv-p12'], ids: { terminal: { driver: 'herdr', key: 'cmd_old-slot', paneId: 'w1:p1' }, head: { persona: 'lead', name: 'sv-p12', gen: 1 } } } },
  });
  ports.planOfHead = () => ({ dir: planDir, footprint: [] });
  ports.place = (req) => ({ role: 'head:lead-sv-p12', gen: req.gen, key: NEW.key, placement: NEW, runDir: '/run/new', cli: null, persona: 'lead' });

  const taskPath = `plans/${planDir}/plan.md`;
  await rotateHeadSession({
    persona: 'lead', name: 'sv-p12', reason: 'soft', projectRoot: root,
    stopFacts: { portfolio: [taskPath] },
  }, ports);
  const latest = JSON.parse(fs.readFileSync(path.join(leadDir, 'latest.json'), 'utf8'));
  const text = fs.readFileSync(path.join(leadDir, latest.file), 'utf8');
  const lines = text.split('\n').filter((l) => l === `- ${taskPath}`);
  assert.equal(lines.length, 1, 'task path is listed exactly once in portfolio');
});

test('a taskOfHead failure records a task-failed incident and rotation continues with no task path', async (t) => {
  const { root, dir } = project(t);
  let moved = false;
  const { calls, ports, request } = fakes(root, {
    holder: () => (moved ? { live: true, session: 'new-session' } : { live: true, session: 'old-session', record: OLD_RECORD }),
    onSleep: (n) => { if (n === 2) { answer(root); moved = true; } },
  });
  ports.taskOfHead = () => {
    throw Object.assign(new Error('plan ambiguous: multiple plans found'), { code: 'plan-ambiguous' });
  };
  const result = await rotateHeadSession({ ...request, reason: 'hard' }, ports);
  assert.equal(result.rotated, true);
  const incidents = fs.readFileSync(path.join(dir, 'incidents.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  const taskIncident = incidents.find((i) => i.event === 'task-failed');
  assert.ok(taskIncident, 'task-failed incident was recorded');
  assert.equal(taskIncident.code, 'plan-ambiguous');
  assert.match(taskIncident.detail, /plan ambiguous/);
});

test('an old run closed mid-rotation logs old-not-live', async (t) => {
  const { root, dir } = project(t);
  const oldRunDir = path.join(root, 'run-old');
  fs.mkdirSync(oldRunDir, { recursive: true });
  writeHeadPlacement(dir, { role: 'head:planner-x', gen: 1, placement: OLD, runDir: oldRunDir, persona: 'planner', startedAt: '2026-11-18T00:00:00Z' });

  // 1. closed before placeHead
  fs.writeFileSync(path.join(oldRunDir, 'closed.json'), '{}');
  let lastMessageCalled = false;
  const { calls: calls1, ports: ports1, request: request1 } = fakes(root);
  ports1.lastMessage = () => { lastMessageCalled = true; return { result: 'found', message: 'msg', turnEnded: true }; };
  const result1 = await rotateHeadSession({ ...request1, reason: 'manual', stopFacts: {} }, ports1);
  assert.equal(result1.rotated, false);
  assert.equal(result1.reason, 'old-not-live');
  assert.deepEqual(calls1.place, [], 'placeHead was not called');
  assert.equal(lastMessageCalled, false, 'lastMessageOfOld was not called before abandoned');
  assert.equal(fs.existsSync(path.join(dir, 'latest.json')), false, 'no handoff was written when closed before placeHead');

  // 2. closed appearing mid-rotation when placeHead fails (e.g. no-envelope beside closed pane)
  const { root: root2, dir: dir2 } = project(t);
  const oldRunDir2 = path.join(root2, 'run-old');
  fs.mkdirSync(oldRunDir2, { recursive: true });
  writeHeadPlacement(dir2, { role: 'head:planner-x', gen: 1, placement: OLD, runDir: oldRunDir2, persona: 'planner', startedAt: '2026-11-18T00:00:00Z' });

  const { ports: ports2, request: request2 } = fakes(root2, {
    placeFails: 'no-envelope',
  });
  const origPlace = ports2.place;
  ports2.place = (req) => {
    fs.writeFileSync(path.join(oldRunDir2, 'cancel-requested.json'), '{}');
    return origPlace(req);
  };
  const result2 = await rotateHeadSession(request2, ports2);
  assert.equal(result2.rotated, false);
  assert.equal(result2.reason, 'old-not-live', 'abandoned with old-not-live, never start-refused');
  const incident2 = JSON.parse(fs.readFileSync(path.join(dir2, 'incidents.jsonl'), 'utf8').trim());
  assert.equal(incident2.event, 'rotation-failed');
  assert.equal(incident2.code, 'old-not-live');
  assert.match(incident2.detail, /no-envelope/, 'detail keeps original placement error code');
  assert.match(incident2.detail, /the old run was asked to stop or had closed/, 'detail says old run was asked to stop or had closed');
  assert.doesNotMatch(incident2.detail, /not held by a live session/, 'detail does not say not held by a live session');
  assert.equal(result2.detail, incident2.detail);
});
