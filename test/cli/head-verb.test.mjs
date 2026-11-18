// The one wiring proof of `fgos head`: the CLI arm parses the verb, refuses a malformed call with the documented exit
// code and hands a valid one to the use cases (startHead, rotateHead) without logic of its own. What starting and
// rotating a head do is proven in test/session-host/head-start.test.mjs and test/session-rotation/rotate.test.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initGitCwd, run, tmpCwd } from './helpers/fgos-cli-harness.mjs';

const EXIT_VALIDATION = 4;
const EXIT_PRECONDITION = 2;

function project() {
  const cwd = tmpCwd();
  initGitCwd(cwd);
  return cwd;
}

test('a head call without a persona or --name, or with a malformed one, is refused as validation naming the cause', () => {
  const cwd = project();
  const cases = [
    [['head', 'start', 'secretary'], /--name/],
    [['head', 'rotate', '--name', 'miu'], /persona/],
    [['head', 'start', 'secretary', '--name', 'Bad_Name'], /bad-name/],
    [['head', 'rotate', 'Bad_Persona', '--name', 'miu'], /bad-persona/],
    [['head', 'bogus', 'secretary', '--name', 'miu'], /sub-verb/],
  ];
  for (const [args, message] of cases) {
    const result = run(cwd, args);
    assert.equal(result.status, EXIT_VALIDATION, `${args.join(' ')}: ${result.stderr}`);
    assert.match(result.stderr, message);
  }
});

test('a confined caller without a request socket is refused as precondition by both subcommands, starting nothing', () => {
  const cwd = project();
  for (const sub of ['start', 'rotate']) {
    const result = run(cwd, ['head', sub, 'secretary', '--name', 'miu'], { FGOS_CONFINED: '1', FGOS_HEAD_REQUEST_SOCKET: '' });
    assert.equal(result.status, EXIT_PRECONDITION, `${sub}: ${result.stderr}`);
    assert.match(result.stderr, /no-request-socket/);
  }
});
