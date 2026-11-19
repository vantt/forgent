// The one wiring proof of `fgos session`: the CLI arm parses the verb, refuses a malformed call with the documented exit
// code and hands a valid one to the use cases (startHead, rotateHead, requestHeadWrite) without logic of its own. What
// starting and rotating a head do is proven in test/session-host/head-start.test.mjs and
// test/session-rotation/rotate.test.mjs; what session write does, in packages/run-supervisor/rust/tests/head_request.rs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import { FGOS, initGitCwd, run, tmpCwd } from './helpers/fgos-cli-harness.mjs';

const EXIT_VALIDATION = 4;
const EXIT_PRECONDITION = 2;
const unconfined = { FGOS_CONFINED: '', FGOS_HEAD_REQUEST_SOCKET: '' };

function project() {
  const cwd = tmpCwd();
  initGitCwd(cwd);
  return cwd;
}

test('a session call without a persona or --name, or with a malformed one, is refused as validation naming the cause', () => {
  const cwd = project();
  const cases = [
    [['session', 'start', 'secretary'], /--name/],
    [['session', 'rotate', '--name', 'miu'], /persona/],
    [['session', 'start', 'secretary', '--name', 'Bad_Name'], /bad-name/],
    [['session', 'rotate', 'Bad_Persona', '--name', 'miu'], /bad-persona/],
    [['session', 'bogus', 'secretary', '--name', 'miu'], /sub-verb/],
    [['session', 'end', 'secretary', '--name', 'miu'], /unknown session sub-verb "end"/],
    [['session', 'write'], /requires a path/],
    [['session', 'stop', 'secretary'], /--name/],
    [['session', 'stop', 'Bad_Persona', '--name', 'miu'], /bad-persona/],
    [['session', 'start', 'secretary', '--name', 'miu', '--for-question'], /--for-question/],
  ];
  for (const [args, message] of cases) {
    const result = run(cwd, args, unconfined);
    assert.equal(result.status, EXIT_VALIDATION, `${args.join(' ')}: ${result.stderr}`);
    assert.match(result.stderr, message);
  }
});

test('session stop of a head that is not live answers stopped false', () => {
  const stopped = run(project(), ['session', 'stop', 'secretary', '--name', 'miu', '--json'], unconfined);
  assert.equal(stopped.status, 0, stopped.stderr);
  assert.match(stopped.stdout, /"stopped":\s*false/);
  assert.match(stopped.stdout, /not-live/);
});

test('request result reads the tickets of FGOS_HEAD_ROLE and refuses a missing role or an unknown ticket', () => {
  const cwd = project();
  const noRole = run(cwd, ['request', 'result'], { ...unconfined, FGOS_HEAD_ROLE: '' });
  assert.equal(noRole.status, EXIT_PRECONDITION, noRole.stderr);
  assert.match(noRole.stderr, /no-head-role/);

  const listed = run(cwd, ['request', 'result', '--json'], { ...unconfined, FGOS_HEAD_ROLE: 'head:lead-demo' });
  assert.equal(listed.status, 0, listed.stderr);
  assert.match(listed.stdout, /"tickets":\s*\[\]/);

  const unknown = run(cwd, ['request', 'result', 'nope1', '--json'], { ...unconfined, FGOS_HEAD_ROLE: 'head:lead-demo' });
  assert.equal(unknown.status, EXIT_PRECONDITION, unknown.stderr);
  assert.match(unknown.stderr, /ticket-unknown/);
});

test('a confined caller without a request socket is refused as precondition by every subcommand, starting or writing nothing', () => {
  const cwd = project();
  for (const args of [['start', 'secretary', '--name', 'miu'], ['rotate', 'secretary', '--name', 'miu'], ['stop', 'secretary', '--name', 'miu'], ['write', 'docs/backlog.md']]) {
    const sub = args[0];
    const result = run(cwd, ['session', ...args], { FGOS_CONFINED: '1', FGOS_HEAD_REQUEST_SOCKET: '' });
    assert.equal(result.status, EXIT_PRECONDITION, `${sub}: ${result.stderr}`);
    assert.match(result.stderr, /no-request-socket/);
  }
});

test('a published session write prints the commit it landed as one line', async () => {
  const cwd = project();
  const socketPath = path.join(cwd, 'req.sock');
  const server = net.createServer((conn) => {
    let received = Buffer.alloc(0);
    conn.on('data', (chunk) => {
      received = Buffer.concat([received, chunk]);
      if (received.length < 4 || received.length < 4 + received.readUInt32BE(0)) return;
      const request = JSON.parse(received.subarray(4, 4 + received.readUInt32BE(0)).toString('utf8'));
      const body = Buffer.from(JSON.stringify({ type: 'REPLY', id: request.id, result: 'done', data: { path: request.args.path, bytes: 4, commit: 'c0ffee' } }));
      const head = Buffer.alloc(4);
      head.writeUInt32BE(body.length);
      conn.end(Buffer.concat([head, body]));
    });
  });
  await new Promise((resolve) => server.listen(socketPath, resolve));
  try {
    const child = spawn(process.execPath, [FGOS, 'session', 'write', 'docs/backlog.md'], {
      cwd, env: { ...process.env, FGOS_CONFINED: '1', FGOS_HEAD_REQUEST_SOCKET: socketPath },
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.stdin.end('new\n');
    const status = await new Promise((resolve) => child.on('close', resolve));
    assert.equal(status, 0, stderr);
    assert.equal(stdout, 'committed c0ffee\n');
  } finally {
    server.close();
  }
});
