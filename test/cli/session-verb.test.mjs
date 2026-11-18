// The one wiring proof of `fgos session`: the CLI arm parses the verb, refuses a malformed call with the documented exit
// code and hands a valid one to the use cases (startHead, rotateHead, requestHeadWrite) without logic of its own. What
// starting and rotating a head do is proven in test/session-host/head-start.test.mjs and
// test/session-rotation/rotate.test.mjs; what session write does, in packages/run-supervisor/rust/tests/head_request.rs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initGitCwd, run, tmpCwd } from './helpers/fgos-cli-harness.mjs';

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
  ];
  for (const [args, message] of cases) {
    const result = run(cwd, args, unconfined);
    assert.equal(result.status, EXIT_VALIDATION, `${args.join(' ')}: ${result.stderr}`);
    assert.match(result.stderr, message);
  }
});

test('a confined caller without a request socket is refused as precondition by every subcommand, starting or writing nothing', () => {
  const cwd = project();
  for (const args of [['start', 'secretary', '--name', 'miu'], ['rotate', 'secretary', '--name', 'miu'], ['write', 'docs/backlog.md']]) {
    const sub = args[0];
    const result = run(cwd, ['session', ...args], { FGOS_CONFINED: '1', FGOS_HEAD_REQUEST_SOCKET: '' });
    assert.equal(result.status, EXIT_PRECONDITION, `${sub}: ${result.stderr}`);
    assert.match(result.stderr, /no-request-socket/);
  }
});
