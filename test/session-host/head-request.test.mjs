// The owning proof of the head request transport on the Node side: the client speaks the frames of
// head-request.v1.json to a socket this test serves, `startHead` is the one branch (confined asks through the socket,
// a confined worker with no socket is refused by name, anyone else calls the use case directly), and the payload entry
// turns one request into the one result line. What `head start` does stays in head-start.test.mjs; the supervisor's
// side of the wire is proven in packages/run-supervisor/rust/tests/head_request.rs.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { HeadRequestError, requestHeadStart, runHeadRequest, startHead } from '../../src/session-host/head-request.mjs';
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
  assert.equal(seen[0].verb, 'head start');
  assert.match(seen[0].id, /^[a-f0-9]{16}$/);
  assert.deepEqual(seen[0].args, { persona: 'planner', name: 'x' });
});

test('a refused reply is a HeadRequestError carrying the supervisor\'s code and detail', async (t) => {
  const socketPath = path.join(scratch(t), 'req.sock');
  serveOnce(t, socketPath, (request) => ({ type: 'REPLY', id: request.id, result: 'refused', code: 'verb-failed', detail: 'bad-persona' }));
  await listening();
  await assert.rejects(requestHeadStart({ persona: 'Bad', name: 'x' }, { socketPath }), (err) => err instanceof HeadRequestError && err.code === 'verb-failed' && err.detail === 'bad-persona');
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

test('the payload entry runs head start in the project of its envelope and reports one line', async (t) => {
  const runDir = scratch(t);
  fs.writeFileSync(path.join(runDir, 'envelope.json'), JSON.stringify({ v: 3, cwd: '/the/project', session: { role: 'head:secretary-miu', verbs: ['head start'], requestSocketPath: '/run/s.sock' } }));
  const calls = [];
  const ports = {
    host: { front: (placement) => { calls.push(placement); return { result: 'fronted' }; } },
    identity: () => ({ live: true }),
  };
  // A live head is fronted instead of started: the whole use case runs, with its ports for Identity and the host faked.
  const lineage = path.join('/the/project', '.fgos', 'runtime', 'session-rotation', 'planner-x');
  assert.ok(lineage);
  const refused = await runHeadRequest({ runDir, request: { verb: 'head start', args: { persona: 'planner', name: 'x' } } }, ports);
  assert.equal(refused.exit, 70);
  assert.equal(refused.line.result, 'error');
  assert.equal(refused.line.code, 'placement-unknown', 'the use case ran in the envelope\'s project and found no recorded placement');

  const unknownVerb = await runHeadRequest({ runDir, request: { verb: 'land', args: {} } }, ports);
  assert.equal(unknownVerb.line.code, 'unknown-verb');
  const strayArg = await runHeadRequest({ runDir, request: { verb: 'head start', args: { persona: 'planner', name: 'x', projectRoot: '/etc' } } }, ports);
  assert.equal(strayArg.line.code, 'bad-args', 'the sandbox cannot choose the project');
  fs.writeFileSync(path.join(runDir, 'envelope.json'), JSON.stringify({ v: 3, cwd: '/p', session: null }));
  assert.equal((await runHeadRequest({ runDir, request: { verb: 'head start', args: {} } }, ports)).line.code, 'envelope-invalid');
});
