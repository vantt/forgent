// The owning proof of the head request transport on the Node side: the client speaks the frames of
// head-request.v1.json to a socket this test serves, `startHead` is the one branch (confined asks through the socket,
// a confined worker with no socket is refused by name, anyone else calls the use case directly), and the payload entry
// turns one request into the one result line. What `session start` does stays in head-start.test.mjs; the supervisor's
// side of the wire is proven in packages/run-supervisor/rust/tests/head_request.rs.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { HeadRequestError, MAX_FRAME_BYTES, MAX_REQUEST_BYTES, requestHead, requestHeadStart, requestHeadWrite } from '../../src/session-host/head-request-client.mjs';
import { rotateHead, runHeadRequest, runStopSelf, runTicket, startHead } from '../../src/session-host/head-request.mjs';
import { lineageDirOf, openingText, writeHeadPlacement } from '../../src/session-host/head-start.mjs';
import { fgosDirFromRoot } from '../../src/util/fgos-file-registry.mjs';
import { HEAD_REQUEST_SOCKET_ENV } from '../../src/session-host/head-grants.mjs';

const scratch = (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-head-req-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
};

/** Serves one connection: reads one frame, answers with `reply(request)` as one frame. Returns the frames it saw. */
function serveOnce(t, socketPath, reply) {
  const seen = [];
  const server = net.createServer((conn) => {
    let received = Buffer.alloc(0);
    conn.on('data', (chunk) => {
      received = Buffer.concat([received, chunk]);
      if (received.length < 4 || received.length < 4 + received.readUInt32BE(0)) return;
      const request = JSON.parse(received.subarray(4, 4 + received.readUInt32BE(0)).toString('utf8'));
      seen.push(request);
      const body = Buffer.from(JSON.stringify(reply(request)));
      const head = Buffer.alloc(4);
      head.writeUInt32BE(body.length);
      conn.end(Buffer.concat([head, body]));
    });
  });
  server.listen(socketPath);
  t.after(() => server.close());
  return seen;
}

const listening = (server) => new Promise((resolve) => setImmediate(resolve, server));

test('the client sends one REQUEST frame, returns the data of a done reply and names a refusal by its code', async (t) => {
  const socketPath = path.join(scratch(t), 'req.sock');
  const seen = serveOnce(t, socketPath, (request) => (request.args.persona === 'planner'
    ? { type: 'REPLY', id: request.id, result: 'done', data: { key: 'head-planner-x-1' } }
    : { type: 'REPLY', id: request.id, result: 'refused', code: 'verb-failed', detail: 'bad-persona' }));
  await listening();
  assert.deepEqual(await requestHeadStart({ persona: 'planner', name: 'x' }, { socketPath }), { key: 'head-planner-x-1' });
  assert.equal(seen[0].type, 'REQUEST');
  assert.equal(seen[0].verb, 'session start');
  assert.match(seen[0].id, /^[a-f0-9]{16}$/);
  assert.deepEqual(seen[0].args, { persona: 'planner', name: 'x' });
});

test('the client sends session write with the whole content in one frame larger than a reply may be, and refuses one over the request limit', async (t) => {
  const socketPath = path.join(scratch(t), 'req.sock');
  const seen = serveOnce(t, socketPath, (request) => ({ type: 'REPLY', id: request.id, result: 'done', data: { path: request.args.path, bytes: request.args.content.length, commit: 'c0ffee' } }));
  await listening();
  const content = 'row\n'.repeat(MAX_FRAME_BYTES / 2);
  assert.deepEqual(await requestHeadWrite({ path: 'docs/backlog.md', content }, { socketPath }), { path: 'docs/backlog.md', bytes: content.length, commit: 'c0ffee' });
  assert.equal(seen[0].verb, 'session write');
  assert.deepEqual(seen[0].args, { path: 'docs/backlog.md', content });
  await assert.rejects(requestHeadWrite({ path: 'docs/backlog.md', content: 'x'.repeat(MAX_REQUEST_BYTES) }, { socketPath }), (err) => err.code === 'request-too-large');
});

test('a write that was made but not published is a HeadRequestError naming the land refusal, with the reply kept', async (t) => {
  const socketPath = path.join(scratch(t), 'req.sock');
  const publish = { refusal: 'land-remote-diverged', detail: 'the remote moved' };
  serveOnce(t, socketPath, (request) => ({ type: 'REPLY', id: request.id, result: 'done', data: { path: request.args.path, bytes: 1, publish } }));
  await listening();
  await assert.rejects(
    requestHeadWrite({ path: 'docs/backlog.md', content: 'x' }, { socketPath }),
    (err) => err instanceof HeadRequestError && err.code === 'write-not-published'
      && err.message === 'written, not published: land-remote-diverged the remote moved'
      && err.refusal === 'land-remote-diverged' && err.data.bytes === 1,
  );
});

test('a refused reply is a HeadRequestError carrying the supervisor\'s code, or the use case\'s own code when verb-failed wraps it', async (t) => {
  const socketPath = path.join(scratch(t), 'req.sock');
  serveOnce(t, socketPath, (request) => ({ type: 'REPLY', id: request.id, result: 'refused', code: 'verb-failed', detail: 'bad-persona' }));
  await listening();
  await assert.rejects(requestHeadStart({ persona: 'Bad', name: 'x' }, { socketPath }), (err) => err instanceof HeadRequestError && err.code === 'bad-persona' && err.supervisorCode === 'verb-failed' && err.detail === 'bad-persona');
  const crashed = path.join(scratch(t), 'c.sock');
  serveOnce(t, crashed, (request) => ({ type: 'REPLY', id: request.id, result: 'refused', code: 'verb-failed', detail: 'exit 1' }));
  await listening();
  await assert.rejects(requestHeadStart({ persona: 'x', name: 'x' }, { socketPath: crashed }), (err) => err.code === 'verb-failed');
});

test('a socket that is gone is request-socket-unavailable, and an unset variable is no-request-socket', async (t) => {
  const dir = scratch(t);
  await assert.rejects(requestHeadStart({ persona: 'planner', name: 'x' }, { socketPath: path.join(dir, 'gone.sock') }), (err) => err.code === 'request-socket-unavailable');
  await assert.rejects(requestHeadStart({ persona: 'planner', name: 'x' }, { socketPath: undefined }), (err) => err.code === 'no-request-socket');
});

test('confined asks through its socket, a confined worker without one is refused, an unconfined caller starts the head itself', async () => {
  const asked = [];
  const request = async (args, { socketPath }) => { asked.push({ args, socketPath }); return { key: 'k' }; };
  const confined = { FGOS_CONFINED: '1', [HEAD_REQUEST_SOCKET_ENV]: '/run/s.sock' };
  assert.deepEqual(await startHead({ persona: 'planner', name: 'x', beside: 'cmd_1', projectRoot: '/p' }, { env: confined, request }), { key: 'k' });
  assert.deepEqual(asked, [{ args: { persona: 'planner', name: 'x', beside: 'cmd_1' }, socketPath: '/run/s.sock' }]);

  // A confined worker has no socket variable: the real client refuses it by name, nothing is started.
  await assert.rejects(startHead({ persona: 'planner', name: 'x' }, { env: { FGOS_CONFINED: '1' } }), (err) => err.code === 'no-request-socket');

  // Unconfined: straight into startHeadSession, which validates before it touches anything.
  await assert.rejects(startHead({ persona: 'Bad Persona', name: 'x', projectRoot: '/p' }, { env: {}, request }), (err) => err.code === 'bad-persona');
  assert.equal(asked.length, 1, 'an unconfined caller never goes through the socket');
});

test('the payload entry runs session start in the project of its envelope and reports one line', async (t) => {
  const runDir = scratch(t);
  fs.writeFileSync(path.join(runDir, 'envelope.json'), JSON.stringify({ v: 3, cwd: '/the/project', session: { role: 'head:secretary-miu', verbs: ['session start'], requestSocketPath: '/run/s.sock' } }));
  const calls = [];
  const ports = {
    host: { front: (placement) => { calls.push(placement); return { result: 'fronted' }; } },
    identity: () => ({ live: true }),
    rotationHolds: () => false,
  };
  // A live head is fronted instead of started: the whole use case runs, with its ports for Identity and the host faked.
  const lineage = path.join('/the/project', '.fgos', 'runtime', 'session-rotation', 'planner-x');
  assert.ok(lineage);
  const refused = await runHeadRequest({ runDir, request: { verb: 'session start', args: { persona: 'planner', name: 'x' } } }, ports);
  assert.equal(refused.exit, 70);
  assert.equal(refused.line.result, 'error');
  assert.equal(refused.line.code, 'placement-unknown', 'the use case ran in the envelope\'s project and found no recorded placement');

  const unknownVerb = await runHeadRequest({ runDir, request: { verb: 'session explode', args: {} } }, ports);
  assert.equal(unknownVerb.line.code, 'unknown-verb');
  const strayArg = await runHeadRequest({ runDir, request: { verb: 'session start', args: { persona: 'planner', name: 'x', projectRoot: '/etc' } } }, ports);
  assert.equal(strayArg.line.code, 'bad-args', 'the sandbox cannot choose the project');
  fs.writeFileSync(path.join(runDir, 'envelope.json'), JSON.stringify({ v: 3, cwd: '/p', session: null }));
  assert.equal((await runHeadRequest({ runDir, request: { verb: 'session start', args: {} } }, ports)).line.code, 'envelope-invalid');
});

test('a confined start or rotation never resolves the project root, an unconfined one resolves it through the resolver', async () => {
  let calls = 0;
  const projectRoot = () => { calls += 1; return '/p'; };
  const request = async () => ({ started: true, key: 'k' });
  const confined = { FGOS_CONFINED: '1', [HEAD_REQUEST_SOCKET_ENV]: '/s' };
  await startHead({ persona: 'planner', name: 'x', projectRoot }, { env: confined, request });
  await rotateHead({ persona: 'planner', name: 'x', reason: 'soft', projectRoot }, { env: confined, request });
  assert.equal(calls, 0);
  await assert.rejects(startHead({ persona: 'Bad Persona', name: 'x', projectRoot }, { env: {}, request }), (err) => err.code === 'bad-persona');
  await assert.rejects(rotateHead({ persona: 'planner', name: 'x', reason: 'never', projectRoot }, { env: {}, request }), (err) => err.code === 'bad-reason');
});

test('rotateHead is one branch: confined asks for session rotate through the socket, anyone else calls the one rotation entry', async () => {
  const asked = [];
  const request = async (args, options) => { asked.push({ args, socketPath: options.socketPath }); return { started: true, pid: 7 }; };
  const confined = { FGOS_CONFINED: '1', [HEAD_REQUEST_SOCKET_ENV]: '/run/s.sock' };
  assert.deepEqual(await rotateHead({ persona: 'planner', name: 'x', reason: 'soft', stopFacts: { delta: 'd' } }, { env: confined, request }), { started: true, pid: 7 });
  assert.deepEqual(asked, [{ args: { persona: 'planner', name: 'x', reason: 'soft', stopFacts: { delta: 'd' } }, socketPath: '/run/s.sock' }]);
  await assert.rejects(rotateHead({ persona: 'planner', name: 'x', reason: 'never', projectRoot: '/p' }, { env: {}, request }), (err) => err.code === 'bad-reason');
  assert.equal(asked.length, 1, 'an unconfined caller never goes through the socket');
});

test('the client names any verb it is given in the REQUEST frame', async (t) => {
  const socketPath = path.join(scratch(t), 'req.sock');
  const seen = serveOnce(t, socketPath, (request) => ({ type: 'REPLY', id: request.id, result: 'done', data: {} }));
  await listening();
  await requestHead('session answered', { persona: 'planner', name: 'x' }, { socketPath });
  assert.equal(seen[0].verb, 'session answered');
});

test('the payload entry runs session rotate and session answered for the envelope\'s own lineage only', async (t) => {
  const project = scratch(t);
  const runDir = scratch(t);
  const role = 'head:planner-x';
  fs.writeFileSync(path.join(runDir, 'envelope.json'), JSON.stringify({ v: 3, cwd: project, unitRunId: 'head-planner-x-2', session: { role, verbs: ['session rotate', 'session answered'], requestSocketPath: '/run/s.sock' } }));
  const spawned = [];
  const ports = { rotation: { holds: () => false, spawn: (spec) => { spawned.push(spec); return { pid: 99 }; } } };

  const rotate = await runHeadRequest({ runDir, request: { verb: 'session rotate', args: { persona: 'planner', name: 'x', reason: 'soft' } } }, ports);
  assert.deepEqual(rotate, { exit: 0, line: { result: 'done', data: { started: true, pid: 99 } } });
  assert.equal(spawned[0].cwd, project, 'the rotation runs in the envelope\'s project');
  const other = await runHeadRequest({ runDir, request: { verb: 'session rotate', args: { persona: 'planner', name: 'y', reason: 'soft' } } }, ports);
  assert.equal(other.line.code, 'role-mismatch', 'a head cannot rotate another lineage');
  assert.equal(spawned.length, 1);

  const noRotation = await runHeadRequest({ runDir, request: { verb: 'session answered', args: { persona: 'planner', name: 'x', sessionId: 's1', rotationId: '0123456789abcdef', message: 'ready' } } }, ports);
  assert.equal(noRotation.line.code, 'no-rotation-pending');
  const dir = path.join(project, '.fgos', 'runtime', 'session-rotation', 'planner-x');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'rotation.json'), JSON.stringify({ id: '0123456789abcdef', successorKey: 'head-planner-x-2', gen: 2 }));
  const answered = await runHeadRequest({ runDir, request: { verb: 'session answered', args: { persona: 'planner', name: 'x', sessionId: 's1', rotationId: '0123456789abcdef', message: 'ready' } } }, ports);
  assert.deepEqual(answered, { exit: 0, line: { result: 'done', data: { accepted: true, gen: 2 } } });
  assert.equal(JSON.parse(fs.readFileSync(path.join(dir, 'answered.json'), 'utf8')).key, 'head-planner-x-2', 'the key is the attempt\'s own, never the sandbox\'s');
  const restore = await runHeadRequest({ runDir, request: { verb: 'session restore role', args: { persona: 'planner', name: 'x' } } }, ports);
  assert.deepEqual(restore, { exit: 0, line: { result: 'done', data: {} } });
  const otherRestore = await runHeadRequest({ runDir, request: { verb: 'session restore role', args: { persona: 'planner', name: 'y' } } }, ports);
  assert.equal(otherRestore.line.code, 'role-mismatch');
  const stray = await runHeadRequest({ runDir, request: { verb: 'session answered', args: { persona: 'planner', name: 'x', sessionId: 's1', rotationId: '0123456789abcdef', message: 'm', key: 'head-planner-x-9' } } }, ports);
  assert.equal(stray.line.code, 'bad-args');
});

test('the payload entry hands each questions verb to the host route with the envelope\'s own run directory and returns its answer or its refusal code', async (t) => {
  const runDir = scratch(t);
  const project = scratch(t);
  fs.writeFileSync(path.join(runDir, 'envelope.json'), JSON.stringify({ v: 3, cwd: project, hostBin: '/the/fgos', session: { role: 'head:secretary-miu', verbs: ['questions ask'], requestSocketPath: '/run/s.sock' } }));
  const calls = [];
  const ports = { questions: (call) => { calls.push(call); if (call.request.verb === 'questions cancel') throw Object.assign(new Error('not yours'), { code: 'not-asker' }); return { id: 'q-1' }; } };
  for (const verb of ['questions ask', 'questions ack', 'questions answer']) {
    const done = await runHeadRequest({ runDir, request: { verb, args: { id: 'q-1', role: 'head:shaper-x' } } }, ports);
    assert.deepEqual(done, { exit: 0, line: { result: 'done', data: { id: 'q-1' } } });
  }
  assert.deepEqual(calls[0], { hostBin: '/the/fgos', runDir, cwd: project, request: { verb: 'questions ask', args: { id: 'q-1', role: 'head:shaper-x' } } });
  const refused = await runHeadRequest({ runDir, request: { verb: 'questions cancel', args: { id: 'q-1', reason: 'r' } } }, ports);
  assert.deepEqual(refused, { exit: 70, line: { result: 'error', code: 'not-asker', message: 'not yours' } });
  const notAnObject = await runHeadRequest({ runDir, request: { verb: 'questions ask', args: [] } }, ports);
  assert.equal(notAnObject.line.code, 'bad-args');
});

test('the default host call runs `internal head-questions --run-dir` with the request on stdin and reads its one line', async (t) => {
  const runDir = scratch(t);
  const project = scratch(t);
  const bin = path.join(scratch(t), 'fake-fgos');
  fs.writeFileSync(bin, '#!/bin/sh\ncat > "$0.stdin"\necho "$@" > "$0.argv"\nif [ -f "$0.fail" ]; then echo \'{"result":"error","code":"answer-not-owner","message":"no"}\'; exit 70; fi\necho \'{"result":"done","data":{"id":"q-9"}}\'\n', { mode: 0o755 });
  fs.writeFileSync(path.join(runDir, 'envelope.json'), JSON.stringify({ v: 3, cwd: project, hostBin: bin, session: { role: 'head:secretary-miu', verbs: [], requestSocketPath: '/run/s.sock' } }));
  const done = await runHeadRequest({ runDir, request: { verb: 'questions ack', args: { id: 'q-9' } } });
  assert.deepEqual(done, { exit: 0, line: { result: 'done', data: { id: 'q-9' } } });
  assert.equal(fs.readFileSync(`${bin}.argv`, 'utf8').trim(), `internal head-questions --run-dir ${runDir}`);
  assert.deepEqual(JSON.parse(fs.readFileSync(`${bin}.stdin`, 'utf8')), { v: 1, verb: 'questions ack', args: { id: 'q-9' } });
  fs.writeFileSync(`${bin}.fail`, '');
  const refused = await runHeadRequest({ runDir, request: { verb: 'questions answer', args: { id: 'q-9', option: 'A' } } });
  assert.deepEqual(refused, { exit: 70, line: { result: 'error', code: 'answer-not-owner', message: 'no' } });
  fs.writeFileSync(path.join(runDir, 'envelope.json'), JSON.stringify({ v: 3, cwd: project, hostBin: path.join(project, 'missing'), session: { role: 'head:secretary-miu' } }));
  assert.equal((await runHeadRequest({ runDir, request: { verb: 'questions ack', args: { id: 'q-9' } } })).line.code, 'internal');
});

test('a busy reply of the supervisor reaches the caller as the code busy, so the questions client can retry it', async (t) => {
  const socketPath = path.join(scratch(t), 'req.sock');
  serveOnce(t, socketPath, (request) => ({ type: 'REPLY', id: request.id, result: 'refused', code: 'busy' }));
  await listening();
  await assert.rejects(requestHead('questions ask', { input: {}, ref: 'plan:p' }, { socketPath }), (err) => err.code === 'busy');
});

// ---- the confined door for long verbs: tickets, bindings, host verbs, stop, forQuestion ------------------

const PLAN = { dir: 'p', footprint: ['src/a/**', 'docs/x.md'] };

/** An attempt directory of a head `persona`-`name` in `project`, and the ports a ticket verb needs (no real runner or git). */
function headCase(t, { persona = 'lead', name = 'proj-p', writes = ['plans/p'] } = {}) {
  const runDir = scratch(t);
  const project = scratch(t);
  fs.writeFileSync(path.join(runDir, 'envelope.json'), JSON.stringify({ v: 3, cwd: project, hostBin: '/the/fgos', unitRunId: 'head-x-1', session: { role: `head:${persona}-${name}`, persona, name, verbs: [], writes, requestSocketPath: '/run/s.sock' } }));
  const spawned = [];
  const ports = { planOf: async () => PLAN, spawnRunner: (call) => { spawned.push(call); return { pid: 4242 }; }, observe: () => null };
  const ask = (verb, args, id = 't1', extra = {}) => runHeadRequest({ runDir, request: { id, verb, args } }, { ...ports, ...extra });
  const ticketFile = (id) => path.join(fgosDirFromRoot(project), 'runtime', 'head-tickets', `${persona}-${name}`, `${id}.json`);
  return { runDir, project, spawned, ask, ticketFile, ports };
}

test('a client call of a new verb reaches the route as one REQUEST frame and returns its data', async (t) => {
  const socketPath = path.join(scratch(t), 'req.sock');
  const seen = serveOnce(t, socketPath, (request) => ({ type: 'REPLY', id: request.id, result: 'done', data: { ticket: request.id, state: 'running' } }));
  await listening();
  const answer = await requestHead('land', { paths: ['plans/p/a.md'], message: 'docs: a' }, { socketPath });
  assert.equal(answer.state, 'running');
  assert.equal(seen[0].verb, 'land');
});

test('a land answers a ticket at once, the runner finishes it and request result reads the outcome', async (t) => {
  const { ask, spawned, ticketFile } = headCase(t);
  const started = await ask('land', { paths: ['plans/p/a.md'], message: 'docs(p): a', tests: ['test/a.test.mjs'] });
  assert.deepEqual(started, { exit: 0, line: { result: 'done', data: { ticket: 't1', state: 'running' } } });
  assert.equal(spawned[0].ticketFile, ticketFile('t1'));
  const written = JSON.parse(fs.readFileSync(ticketFile('t1'), 'utf8'));
  assert.deepEqual([written.state, written.verb, written.runner], ['running', 'land', null]);
  assert.deepEqual(written.argv, ['land', '--json', '--paths', 'plans/p/a.md', '--message', 'docs(p): a', '--footprint', 'src/a/**,docs/x.md', '--test', 'test/a.test.mjs']);
  assert.equal((await ask('request result', { id: 't1' }, 'r1')).line.data.state, 'running');
  runTicket(ticketFile('t1'), { selfRecord: () => ({ pid: 1, startTime: 1 }), exec: () => ({ status: 0, stdout: 'noise\n{"result":"done","data":{"mainSha":"abc"}}\n' }) });
  const done = (await ask('request result', { id: 't1' }, 'r2')).line.data;
  assert.deepEqual([done.state, done.exit, done.result.data.mainSha], ['done', 0, 'abc']);
  runTicket(ticketFile('t1'), { exec: () => assert.fail('a finished ticket is never run twice') });
});

test('request result without an id lists the role tickets newest first and never another role', async (t) => {
  const { ask, ticketFile, project } = headCase(t);
  await ask('land', { paths: ['plans/p/a.md'], message: 'm' }, 'old');
  await new Promise((resolve) => setTimeout(resolve, 5));
  await ask('run', { prompt: 'do it' }, 'new');
  const other = path.join(fgosDirFromRoot(project), 'runtime', 'head-tickets', 'lead-other');
  fs.mkdirSync(other, { recursive: true });
  fs.writeFileSync(path.join(other, 'foreign.json'), JSON.stringify({ id: 'foreign', verb: 'land', state: 'running', startedAt: new Date().toISOString() }));
  const list = (await ask('request result', {}, 'r1')).line.data.tickets;
  assert.deepEqual(list.map((x) => x.id), ['new', 'old']);
  assert.equal((await ask('request result', { id: 'foreign' }, 'r2')).line.code, 'ticket-unknown');
  assert.equal((await ask('request result', { id: '../x' }, 'r3')).line.code, 'ticket-unknown');
  assert.ok(fs.existsSync(ticketFile('old')));
});

test('a ticket id that was used already refuses ticket-used and leaves the first ticket as it was', async (t) => {
  const { ask, ticketFile } = headCase(t);
  await ask('land', { paths: ['plans/p/a.md'], message: 'm' });
  const before = fs.readFileSync(ticketFile('t1'), 'utf8');
  assert.equal((await ask('land', { paths: ['plans/p/b.md'], message: 'm' })).line.code, 'ticket-used');
  assert.equal(fs.readFileSync(ticketFile('t1'), 'utf8'), before);
});

test('a land with several tests emits one --test flag per path', async (t) => {
  const { ask, ticketFile } = headCase(t);
  await ask('land', { paths: ['plans/p/a.md'], message: 'm', tests: ['test/a.test.mjs', 'test/b.test.mjs'] });
  assert.deepEqual(JSON.parse(fs.readFileSync(ticketFile('t1'), 'utf8')).argv, ['land', '--json', '--paths', 'plans/p/a.md', '--message', 'm', '--footprint', 'src/a/**,docs/x.md', '--test', 'test/a.test.mjs', '--test', 'test/b.test.mjs']);
});

test('the process identity of the started runner is on the ticket before the reply, so a runner that died at once reads failed', async (t) => {
  const { ask, ticketFile } = headCase(t);
  const started = await ask('run', { prompt: 'x' }, 't1', { observe: (pid) => ({ pid, startTime: 7 }) });
  assert.equal(started.line.data.state, 'running');
  assert.deepEqual(JSON.parse(fs.readFileSync(ticketFile('t1'), 'utf8')).runner, { pid: 4242, startTime: 7 });
  const gone = (await ask('request result', { id: 't1' }, 'r1', { judge: () => 'dead' })).line.data;
  assert.deepEqual([gone.state, gone.code], ['failed', 'runner-gone']);
});

test('the runner record is judged: dead is failed with runner-gone, unknown stays running', async (t) => {
  const { ask, ticketFile } = headCase(t);
  await ask('run', { prompt: 'x' });
  runTicketStart(ticketFile('t1'));
  const gone = (await ask('request result', { id: 't1' }, 'r1', { judge: () => 'dead' })).line.data;
  assert.deepEqual([gone.state, gone.code], ['failed', 'runner-gone']);
  assert.equal((await ask('request result', { id: 't1' }, 'r2', { judge: () => 'unknown' })).line.data.state, 'running');
});

const SELF = () => ({ pid: 1, startTime: 1 });

test('a failed host run leaves its argv and the host refusal code and message in the ticket, and request result returns them', async (t) => {
  const { ask, ticketFile } = headCase(t);
  await ask('run', { prompt: 'do it', writes: ['src/a/b.mjs'], worktree: '../wt' });
  runTicket(ticketFile('t1'), { selfRecord: SELF, exec: () => ({ status: 4, stdout: '{"result":"error","code":"writes-need-worktree","message":"--writes needs a linked worktree"}\n', stderr: '' }) });
  const failed = (await ask('request result', { id: 't1' }, 'r1')).line.data;
  assert.deepEqual([failed.state, failed.exit, failed.code, failed.message], ['failed', 4, 'writes-need-worktree', '--writes needs a linked worktree']);
  assert.deepEqual(failed.argv, ['run', '--json', 'do it', '--writes', 'src/a/b.mjs', '--worktree', '../wt']);
  assert.equal(JSON.parse(fs.readFileSync(ticketFile('t1'), 'utf8')).code, 'writes-need-worktree');
});

test('a host refusal printed only on stderr as `fgos: <message> [<code>]` is parsed into the ticket code and message', async (t) => {
  const { ask, ticketFile } = headCase(t);
  await ask('run', { prompt: 'x' });
  runTicket(ticketFile('t1'), { selfRecord: SELF, exec: () => ({ status: 4, stdout: '', stderr: 'warming up\nfgos: unknown provider "zz" [provider-unknown]\n' }) });
  const failed = (await ask('request result', { id: 't1' }, 'r1')).line.data;
  assert.deepEqual([failed.code, failed.message, failed.exit], ['provider-unknown', 'unknown provider "zz"', 4]);
  assert.match(failed.stderrTail, /provider-unknown/);
});

test('a failed ticket bounds the stored message and stderr tail, and an unreadable failure keeps exit-N', async (t) => {
  const { ask, ticketFile } = headCase(t);
  await ask('run', { prompt: 'x' });
  const lines = Array.from({ length: 200 }, (_, i) => `line ${i} ${'y'.repeat(50)}`).join('\n');
  runTicket(ticketFile('t1'), { selfRecord: SELF, exec: () => ({ status: 7, stdout: JSON.stringify({ message: 'm'.repeat(5000) }), stderr: lines }) });
  const failed = (await ask('request result', { id: 't1' }, 'r1')).line.data;
  assert.equal(failed.code, 'exit-7');
  assert.equal(failed.message.length, 1024);
  assert.ok(failed.stderrTail.length <= 1024);
  assert.ok(failed.stderrTail.split('\n').length <= 12);
  assert.ok(failed.stderrTail.endsWith('y'.repeat(50)));
});

/** Gives a ticket the runner record its detached runner writes first. */
function runTicketStart(file) {
  const ticket = JSON.parse(fs.readFileSync(file, 'utf8'));
  fs.writeFileSync(file, JSON.stringify({ ...ticket, runner: { pid: 999999, startTime: 1 } }));
}

test('request result waits for a running ticket to end, at most the seconds asked', async (t) => {
  const { ask, ticketFile } = headCase(t);
  await ask('run', { prompt: 'x' });
  let polls = 0;
  const sleep = async () => {
    polls += 1;
    if (polls === 2) runTicket(ticketFile('t1'), { selfRecord: () => ({ pid: 1, startTime: 1 }), exec: () => ({ status: 0, stdout: '{"data":{"results":[{"unitRunId":"unit-run-77-abc"}]}}\n' }) });
  };
  const waited = (await ask('request result', { id: 't1', wait: 30 }, 'r1', { sleep })).line.data;
  assert.deepEqual([waited.state, waited.unitRunId, waited.assignment.dir], ['done', 'unit-run-77-abc', '.fgos/assignments/unit-run-77-abc']);
  assert.equal(waited.assignment.present, false);
  assert.equal((await ask('request result', { id: 't1', wait: 'soon' }, 'r2')).line.code, 'bad-args');
});

test('request result of a run ticket reads the settled outcome from its assignment record', async (t) => {
  const { ask, ticketFile, project } = headCase(t);
  await ask('run', { prompt: 'x' });
  runTicket(ticketFile('t1'), { selfRecord: () => ({ pid: 1, startTime: 1 }), exec: () => ({ status: 0, stdout: '{"data":{"results":[{"unitRunId":"unit-run-5-abc"}]}}\n' }) });
  const unitDir = path.join(fgosDirFromRoot(project), 'assignments', 'unit-run-5-abc');
  fs.mkdirSync(unitDir, { recursive: true });
  fs.writeFileSync(path.join(unitDir, 'unit.json'), JSON.stringify({ execution: { status: 'settled' } }));
  fs.writeFileSync(path.join(unitDir, 'unit-summary.json'), JSON.stringify({ outcome: 'pass', settledAt: '2026-11-19T01:00:00Z' }));
  const view = (await ask('request result', { id: 't1' }, 'r1')).line.data;
  assert.deepEqual(view.assignment, { dir: '.fgos/assignments/unit-run-5-abc', present: true, settled: true, outcome: 'pass', settledAt: '2026-11-19T01:00:00Z' });
});

test('a run ticket starts fgos run without the dispatch depth marker, with the prompt as its own argument', async (t) => {
  const { ask, ticketFile } = headCase(t);
  process.env.FGOS_DISPATCH_DEPTH = '2';
  t.after(() => { delete process.env.FGOS_DISPATCH_DEPTH; });
  await ask('run', { prompt: 'do the work', writes: ['src/a/b.mjs'], provider: 'codex', worktree: '../wt' });
  const ticket = JSON.parse(fs.readFileSync(ticketFile('t1'), 'utf8'));
  assert.deepEqual(ticket.argv, ['run', '--json', 'do the work', '--writes', 'src/a/b.mjs', '--provider', 'codex', '--worktree', '../wt']);
  let seen;
  runTicket(ticketFile('t1'), { selfRecord: () => ({ pid: 1, startTime: 1 }), exec: (bin, argv, options) => { seen = { bin, argv, env: options.env }; return { status: 0, stdout: '{}' }; } });
  assert.equal(seen.bin, '/the/fgos');
  assert.equal(seen.argv[0], 'run');
  assert.equal(Object.hasOwn(seen.env, 'FGOS_DISPATCH_DEPTH'), false);
});

// One refusal per behaviour: each case names the verb, its args, the code and what makes the request refuse.
const REFUSALS = [
  ['a land path outside the grant', 'land', { paths: ['src/x.mjs'], message: 'm' }, 'path-outside-grant'],
  ['a land path that climbs out of the grant', 'land', { paths: ['plans/p/../../x'], message: 'm' }, 'path-outside-grant'],
  ['a run write outside the footprint', 'run', { prompt: 'x', writes: ['src/other/b.mjs'] }, 'write-outside-footprint'],
  ['a run write glob wider than the footprint glob', 'run', { prompt: 'x', writes: ['src/a/**/*.mjs', 'src/**'] }, 'write-outside-footprint'],
  ['a literal run write whose subtree the footprint glob does not cover', 'run', { prompt: 'x', writes: ['src/a/b'] }, 'write-outside-footprint', { planOf: async () => ({ dir: 'p', footprint: ['src/a/*'] }) }],
  ['a run with a unit file', 'run', { unit: 'plans/p/u.json' }, 'bad-args'],
  ['a land of both a branch and paths', 'land', { branch: 'b', paths: ['plans/p/a'], message: 'm' }, 'bad-args'],
  ['a land with an unknown key', 'land', { paths: ['plans/p/a'], message: 'm', extra: 1 }, 'bad-args'],
  ['a run prompt that starts with a dash', 'run', { prompt: '--not-a-flag' }, 'bad-args'],
  ['a run provider that starts with a dash', 'run', { prompt: 'x', provider: '--writes' }, 'bad-args'],
  ['a run capability that starts with a dash', 'run', { prompt: 'x', capability: '-x' }, 'bad-args'],
  ['a run worktree that starts with a dash', 'run', { prompt: 'x', worktree: '--writes' }, 'bad-args'],
  ['a run write that starts with a dash', 'run', { prompt: 'x', writes: ['-x'] }, 'bad-args'],
  ['a land message that starts with a dash', 'land', { paths: ['plans/p/a.md'], message: '--branch' }, 'bad-args'],
  ['a land test path that starts with a dash', 'land', { paths: ['plans/p/a.md'], message: 'm', tests: ['--x'] }, 'bad-args'],
  ['a land branch that starts with a dash', 'land', { branch: '--footprint' }, 'bad-args'],
];
for (const [what, verb, args, code, extra] of REFUSALS) {
  test(`the route refuses ${what} with ${code}`, async (t) => {
    const { ask, spawned } = headCase(t);
    assert.equal((await ask(verb, args, 't1', extra)).line.code, code);
    assert.equal(spawned.length, 0);
  });
}

test('a run write inside a footprint directory or its glob is accepted', async (t) => {
  const { ask } = headCase(t);
  assert.equal((await ask('run', { prompt: 'x', writes: ['src/a/deep/f.mjs', 'src/a/*.mjs', 'docs/x.md'] })).exit, 0);
});

test('a lead paths land whose plan has no footprint is refused write-outside-footprint and never omits the bound', async (t) => {
  const lead = headCase(t);
  const refused = await lead.ask('land', { paths: ['plans/p/a.md'], message: 'm' }, 't4', { planOf: async () => ({ dir: 'p', footprint: [] }) });
  assert.equal(refused.line.code, 'write-outside-footprint');
  assert.equal(lead.spawned.length, 0);
});

test('request result refuses a role that is not a head role before it becomes a path', async (t) => {
  const bad = headCase(t);
  const envelopeFile = path.join(bad.runDir, 'envelope.json');
  const envelope = JSON.parse(fs.readFileSync(envelopeFile, 'utf8'));
  envelope.session.role = 'head:../../x';
  fs.writeFileSync(envelopeFile, JSON.stringify(envelope));
  assert.equal((await bad.ask('request result', {}, 'r9')).line.code, 'bad-role');
});

test('a lead paths land passes its plan footprint as --footprint', async (t) => {
  const lead = headCase(t);
  assert.equal((await lead.ask('land', { paths: ['plans/p/plan.md'], message: 'm' }, 't7')).exit, 0);
  assert.deepEqual(JSON.parse(fs.readFileSync(lead.ticketFile('t7'), 'utf8')).argv, ['land', '--json', '--paths', 'plans/p/plan.md', '--message', 'm', '--footprint', 'src/a/**,docs/x.md']);
});

test('a lead branch land passes its plan footprint as --footprint', async (t) => {
  const lead = headCase(t);
  assert.equal((await lead.ask('land', { branch: 'task/p-1' }, 't6')).exit, 0);
  assert.deepEqual(JSON.parse(fs.readFileSync(lead.ticketFile('t6'), 'utf8')).argv, ['land', '--json', '--branch', 'task/p-1', '--footprint', 'src/a/**,docs/x.md']);
});

test('a lead branch land whose plan has no footprint is refused write-outside-footprint and never omits the bound', async (t) => {
  const lead = headCase(t);
  const refused = await lead.ask('land', { branch: 'task/p-1' }, 't1', { planOf: async () => ({ dir: 'p', footprint: [] }) });
  assert.equal(refused.line.code, 'write-outside-footprint');
  assert.match(refused.line.message, /no footprint/);
  assert.equal(lead.spawned.length, 0);
});

test('a branch land from a planner is refused land-branch-lead-only', async (t) => {
  const planner = headCase(t, { persona: 'planner', name: 'proj-p', writes: ['docs/discussions'] });
  assert.equal((await planner.ask('land', { branch: 'task/p-1' })).line.code, 'land-branch-lead-only');
});

test('a paths land from a planner inside its grant is accepted', async (t) => {
  const planner = headCase(t, { persona: 'planner', name: 'proj-p', writes: ['docs/discussions'] });
  assert.equal((await planner.ask('land', { paths: ['docs/discussions/a.md'], message: 'm' })).exit, 0);
});

test('a run from a planner is refused role-mismatch', async (t) => {
  const planner = headCase(t, { persona: 'planner', name: 'proj-p', writes: ['docs/discussions'] });
  assert.equal((await planner.ask('run', { prompt: 'x' })).line.code, 'role-mismatch');
});

test('worktree create without a branch is refused, with one it runs the host verb', async (t) => {
  const { ask } = headCase(t);
  const calls = [];
  const hostCall = (call) => { calls.push(call); return { status: 0, stdout: '{"data":{"path":"/wt","branch":"task/x"}}\n' }; };
  assert.equal((await ask('worktree create', { path: '/w/p-wt' }, 'w1', { hostCall })).line.code, 'bad-args');
  assert.equal(calls.length, 0);
  const done = await ask('worktree create', { path: '/w/p-wt', branch: 'task/x', base: 'main' }, 'w2', { hostCall });
  assert.deepEqual(done.line.data, { path: '/wt', branch: 'task/x' });
  assert.deepEqual(calls[0].argv, ['worktree', 'create', '/w/p-wt', '--branch', 'task/x', '--base', 'main', '--json']);
  const failing = await ask('worktree create', { path: '/w/p-wt', branch: 'task/x' }, 'w3', { hostCall: () => ({ status: 1, stdout: '' }) });
  assert.equal(failing.line.code, 'worktree-create-failed');
});

test('worktree create refuses a relative path and a path inside the project root, naming why', async (t) => {
  const { ask, project } = headCase(t);
  const hostCall = () => { throw new Error('the host must not be called'); };
  const relative = await ask('worktree create', { path: '../wt', branch: 'task/x' }, 'w1', { hostCall });
  assert.equal(relative.line.code, 'bad-args');
  assert.match(relative.line.message, /absolute/);
  const inside = await ask('worktree create', { path: path.join(project, 'wt'), branch: 'task/x' }, 'w2', { hostCall });
  assert.equal(inside.line.code, 'bad-args');
  assert.match(inside.line.message, /outside the project root/);
});

test('worktree create keeps the host refusal code in the answer', async (t) => {
  const { ask } = headCase(t);
  const hostCall = () => ({ status: 1, stdout: '', stderr: 'fgos: the git admin name wt is in use [worktree-admin-name-in-use]\n' });
  const refused = await ask('worktree create', { path: '/w/wt', branch: 'task/x' }, 'w1', { hostCall });
  assert.equal(refused.line.code, 'worktree-admin-name-in-use');
  assert.match(refused.line.message, /admin name/);
});

test('supervisor done on an empty queue answers stopping and starts the stop of the caller own role', async (t) => {
  const { ask } = headCase(t, { persona: 'supervisor', name: 'proj', writes: [] });
  const stops = [];
  const base = { spawnStop: (call) => { stops.push(call); return { pid: 99 }; } };
  const busy = await ask('supervisor done', {}, 'd1', { ...base, hostCall: () => ({ status: 1, stdout: '{"code":"events-unhandled","message":"2 left"}\n' }) });
  assert.equal(busy.line.code, 'events-unhandled');
  assert.equal(stops.length, 0);
  const done = await ask('supervisor done', {}, 'd2', { ...base, hostCall: (call) => ({ status: 0, stdout: `{"data":{"done":true,"argv":${JSON.stringify(call.argv)}}}\n` }) });
  assert.deepEqual(done.line.data, { done: true, argv: ['supervisor', 'done', '--json'], stopping: true });
  assert.equal(stops.length, 1);
  assert.deepEqual([stops[0].persona, stops[0].name], ['supervisor', 'proj']);
});

const echoArgv = { hostCall: (call) => ({ status: 0, stdout: `{"data":{"argv":${JSON.stringify(call.argv)}}}\n` }) };

test('the confined reads supervisor queue, supervisor plans and slots run the host verb and return its JSON', async (t) => {
  const { ask } = headCase(t, { persona: 'supervisor', name: 'proj', writes: [] });
  assert.deepEqual((await ask('supervisor queue', {}, 'q1', echoArgv)).line.data.argv, ['supervisor', 'queue', '--json']);
  assert.deepEqual((await ask('supervisor plans', {}, 'q2', echoArgv)).line.data.argv, ['supervisor', 'plans', '--json']);
  assert.deepEqual((await ask('slots', {}, 'q3', echoArgv)).line.data.argv, ['slots', '--json']);
  assert.equal((await ask('slots', { x: 1 }, 'q4', echoArgv)).line.code, 'bad-args');
});

test('the confined questions list runs the host list for the open, answered or all questions and refuses another which', async (t) => {
  const { ask } = headCase(t, { persona: 'shaper', name: 'x', writes: [] });
  assert.deepEqual((await ask('questions list', {}, 'l1', echoArgv)).line.data.argv, ['questions', '--json']);
  assert.deepEqual((await ask('questions list', { which: 'answered' }, 'l2', echoArgv)).line.data.argv, ['questions', '--answered', '--json']);
  assert.deepEqual((await ask('questions list', { which: 'all' }, 'l3', echoArgv)).line.data.argv, ['questions', '--all', '--json']);
  assert.equal((await ask('questions list', { which: 'constructor' }, 'l4', echoArgv)).line.code, 'bad-args');
  assert.equal((await ask('questions list', { x: 1 }, 'l5', echoArgv)).line.code, 'bad-args');
});

test('a host refusal keeps its code, from the JSON line or from stderr', async (t) => {
  const { ask } = headCase(t, { persona: 'supervisor', name: 'proj', writes: [] });
  const json = await ask('supervisor queue', {}, 'q5', { hostCall: () => ({ status: 1, stdout: '{"code":"event-store-no-repository","message":"none"}\n' }) });
  assert.equal(json.line.code, 'event-store-no-repository');
  const stderr = await ask('supervisor handled', { events: ['nope'] }, 'q7', { hostCall: () => ({ status: 4, stdout: '', stderr: 'fgos: no event raised with id nope [event-unknown]\n' }) });
  assert.equal(stderr.line.code, 'event-unknown');
});

test('the host answer is read as one indented document, and an answer that is no JSON or too large is refused by name', async (t) => {
  const { ask } = headCase(t, { persona: 'supervisor', name: 'proj', writes: [] });
  const pretty = await ask('supervisor queue', {}, 'q6', { hostCall: () => ({ status: 0, stdout: JSON.stringify({ contract: 'fgos.v1', data: { events: [{ id: 'e1' }] } }, null, 2) }) });
  assert.deepEqual(pretty.line.data, { events: [{ id: 'e1' }] });
  const text = await ask('supervisor queue', {}, 'q8', { hostCall: () => ({ status: 0, stdout: 'queue: 2 events\n' }) });
  assert.equal(text.line.code, 'host-output-unreadable');
  const empty = await ask('supervisor queue', {}, 'q9', { hostCall: () => ({ status: 0, stdout: '' }) });
  assert.equal(empty.line.code, 'host-output-unreadable');
  const big = await ask('supervisor plans', {}, 'q10', { hostCall: () => ({ status: 0, stdout: JSON.stringify({ data: { plans: 'x'.repeat(61_000) } }) }) });
  assert.equal(big.line.code, 'reply-too-large');
  assert.match(big.line.message, /\d{5} bytes/);
});

test('supervisor handled sends every id to the host verb and refuses a bad id list', async (t) => {
  const { ask } = headCase(t, { persona: 'supervisor', name: 'proj', writes: [] });
  const handled = await ask('supervisor handled', { events: ['ev-1', 'ev-2', 'ev-3'] }, 'h1', echoArgv);
  assert.deepEqual(handled.line.data.argv, ['supervisor', 'handled', 'ev-1', 'ev-2', 'ev-3', '--json']);
  for (const events of [[], ['-x'], 'ev-1', [1]]) assert.equal((await ask('supervisor handled', { events }, 'h2', echoArgv)).line.code, 'bad-args');
  assert.equal((await ask('supervisor handled', { event: 'ev-1' }, 'h3', echoArgv)).line.code, 'bad-args', 'the single-id key is gone');
});

test('supervisor done reports stopping only when the detached stop process started', async (t) => {
  const { ask } = headCase(t, { persona: 'supervisor', name: 'proj', writes: [] });
  const hostCall = () => ({ status: 0, stdout: '{"data":{"done":true}}\n' });
  const failed = await ask('supervisor done', {}, 'd1', { hostCall, spawnStop: () => ({ pid: null, error: 'EAGAIN' }) });
  assert.deepEqual(failed.line.data, { done: true });
});

test('the detached stop of the own session waits for the route to exit, then stops the role', async () => {
  const order = [];
  let alive = 2;
  await runStopSelf({ persona: 'supervisor', name: 'proj', projectRoot: '/p', waitPid: 77 }, {
    observe: () => ({ pid: 77, startTime: 1 }),
    alive: () => { order.push('alive?'); alive -= 1; return alive > 0; },
    sleep: async () => { order.push('sleep'); },
    stop: { identity: () => { order.push('stop'); return { live: false }; }, host: {} },
  });
  assert.deepEqual(order.slice(0, 3), ['alive?', 'sleep', 'alive?']);
  assert.equal(order.at(-1), 'stop');
  assert.equal(order.filter((x) => x === 'alive?').length, 2);
});

/** A supervisor head, a stoppable `lead-proj-p` lineage with a placement, and the stop ports that end it. */
function stopCase(t) {
  const c = headCase(t, { persona: 'supervisor', name: 'proj', writes: [] });
  writeHeadPlacement(lineageDirOf(c.project, 'lead', 'proj-p'), { role: 'head:lead-proj-p', gen: 1, placement: { host: 'terminal', key: 'k1' }, runDir: '/r', persona: 'lead', startedAt: '2026-11-19T00:00:00Z' });
  const stop = { identity: () => ({ live: true }), host: { retireAsync: async () => ({ result: 'retired' }) }, end: () => true, closed: () => true, sleep: async () => {} };
  return { ...c, ports: { stop, plan: { handle: 'proj' }, askerAnswered: () => false } };
}

test('session stop of a lead of this project stops it', async (t) => {
  const { ask, ports } = stopCase(t);
  assert.deepEqual((await ask('session stop', { persona: 'lead', name: 'proj-p', reason: 'plan done' }, 's1', ports)).line.data, { stopped: true });
});

test('session stop of a persona-name that is no plan head of this project is refused role-mismatch', async (t) => {
  const { ask, ports } = stopCase(t);
  assert.equal((await ask('session stop', { persona: 'secretary', name: 'miu' }, 's2', ports)).line.code, 'role-mismatch');
  assert.equal((await ask('session stop', { persona: 'lead', name: 'other-p' }, 's3', ports)).line.code, 'role-mismatch');
});

test('session stop of the asker of an answered question is allowed', async (t) => {
  const { ask, ports } = stopCase(t);
  const answered = await ask('session stop', { persona: 'secretary', name: 'miu' }, 's4', { ...ports, askerAnswered: (role) => role === 'head:secretary-miu' });
  assert.equal(answered.line.data.stopped, false);
});

test('session stop by the asker of an answered question works in a project with no handle', async (t) => {
  const { ask, ports } = stopCase(t);
  const answered = await ask('session stop', { persona: 'secretary', name: 'miu' }, 's4b', { ...ports, plan: {}, askerAnswered: (role) => role === 'head:secretary-miu' });
  assert.equal(answered.line.data.stopped, false);
});

test('session stop of the caller own role is allowed', async (t) => {
  const { ask, ports } = stopCase(t);
  assert.equal((await ask('session stop', { persona: 'supervisor', name: 'proj' }, 's5', ports)).line.data.stopped, false);
});

test('session stop with a persona that is not a name is bad-persona', async (t) => {
  const { ask, ports } = stopCase(t);
  assert.equal((await ask('session stop', { persona: '../x', name: 'p' }, 's6', ports)).line.code, 'bad-persona');
});

test('the asker of an answered question is found in the asker roles of the host rows, and a host failure surfaces with its code', async (t) => {
  const { ask, ports } = stopCase(t);
  const { askerAnswered: _unused, ...withoutPort } = ports;
  const rows = { status: 0, stdout: JSON.stringify({ data: { questions: [{ id: 'q1', asker: { handle: 'claude-1@m', roles: ['head:secretary-miu'] } }] } }) };
  const calls = [];
  const hostCall = (call) => { calls.push(call.argv); return rows; };
  const found = await ask('session stop', { persona: 'secretary', name: 'miu' }, 's7', { ...withoutPort, hostCall });
  assert.equal(found.exit, 0);
  assert.deepEqual(calls[0], ['questions', '--answered', '--json']);
  const nobody = await ask('session stop', { persona: 'secretary', name: 'zed' }, 's8', { ...withoutPort, hostCall });
  assert.equal(nobody.line.code, 'role-mismatch');
  const failing = await ask('session stop', { persona: 'secretary', name: 'miu' }, 's9', { ...withoutPort, hostCall: () => ({ status: 1, stdout: '{"code":"store-unreadable","message":"x"}\n' }) });
  assert.equal(failing.line.code, 'store-unreadable');
});

test('session start passes forQuestion down to the opening, and the opening carries one line naming the question', async (t) => {
  const project = scratch(t);
  const seen = [];
  const ports = {
    pin: async () => ({ name: 'planner', text: '' }), handoff: async () => null, runnerConfig: async () => ({}), bind: async () => ({ cli: 'x' }),
    opening: async (ask) => { seen.push(ask.forQuestion); return 'opening'; },
    launch: async () => ({ placement: { host: 'terminal', key: 'k' }, runDir: '/r' }), identity: () => ({ live: false }), host: {},
  };
  await startHead({ persona: 'planner', name: 'q', forQuestion: 'q-42', projectRoot: project }, { env: {}, ports });
  assert.deepEqual(seen, ['q-42']);
  const text = openingText({ persona: 'planner', name: 'q', personaLines: ['P'], forQuestion: 'q-42' });
  assert.match(text, /You continue question q-42: write its answer back to its origin, then `fgos questions ack q-42` \(or `cancel`\)\./);
  assert.doesNotMatch(openingText({ persona: 'planner', name: 'q', personaLines: ['P'] }), /You continue question/);
  await assert.rejects(startHead({ persona: 'planner', name: 'q', forQuestion: 'bad id!', projectRoot: project }, { env: {}, ports }), (err) => err.code === 'bad-question');
});
