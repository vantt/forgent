import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createHerdrClient,
  normalizeAgentName,
  isReadyState,
  READY_STATES,
  HerdrError,
} from '../../src/runner/dispatch/herdr-agent.mjs';

// These run against an injected backend, never a real herdr install: what is
// under test is the translation from herdr's two answer shapes into something
// a caller can act on, and that translation is the same whether or not a
// terminal exists on this machine.
//
// The two shapes are measured, not assumed (herdr 0.8.2):
//   success -> exit 0, {"id":"cli:agent:get","result":{...}}
//   failure -> exit 1, {"error":{"code":"...","message":"..."},"id":"..."}

function fakeBackend(handler) {
  const calls = [];
  const run = (bin, args, opts) => {
    calls.push({ bin, args, opts });
    return handler(args, calls.length);
  };
  return { run, calls };
}

const ok = (result) => ({ status: 0, stdout: JSON.stringify({ id: 'cli:test', result }), stderr: '' });
const herdrErr = (code, message = 'nope') => ({
  status: 1,
  stdout: JSON.stringify({ error: { code, message }, id: 'cli:test' }),
  stderr: '',
});

test('a herdr error envelope becomes a HerdrError carrying herdr own code', () => {
  const { run } = fakeBackend(() => herdrErr('agent_not_ready', 'agent never became ready'));
  const client = createHerdrClient({ run });
  assert.throws(
    () => client.agentGet('w1'),
    (err) => err instanceof HerdrError && err.code === 'agent_not_ready' && /never became ready/.test(err.message),
  );
});

test('a missing herdr binary is a different failure than a herdr that said no', () => {
  const { run } = fakeBackend(() => ({ status: null, stdout: '', stderr: 'spawn ENOENT', spawnCode: 'ENOENT' }));
  const client = createHerdrClient({ herdrBin: '/nowhere/herdr', run });
  assert.throws(() => client.agentGet('w1'), (err) => err.code === 'herdr_unavailable');
});

test('output that is not JSON is reported as unparseable, never guessed at', () => {
  const { run } = fakeBackend(() => ({ status: 0, stdout: 'Closed tab. Bye.', stderr: '' }));
  const client = createHerdrClient({ run });
  assert.throws(
    () => client.agentGet('w1'),
    (err) => err.code === 'herdr_unparseable' && /Closed tab/.test(err.message),
  );
});

test('paneSplit always asks for a fresh pane and returns its id', () => {
  const { run, calls } = fakeBackend(() => ok({ pane: { pane_id: 'w9:p3' } }));
  const client = createHerdrClient({ run });
  const paneId = client.paneSplit({ cwd: '/tmp/work', env: { FOO: 'bar' } });
  assert.equal(paneId, 'w9:p3');
  assert.deepEqual(calls[0].args, [
    'pane', 'split', '--direction', 'right', '--no-focus', '--cwd', '/tmp/work', '--env', 'FOO=bar',
  ]);
});

test('a pane split that returns no pane_id fails loudly instead of returning null', () => {
  const { run } = fakeBackend(() => ok({ nothing: true }));
  const client = createHerdrClient({ run });
  assert.throws(() => client.paneSplit({}), (err) => err.code === 'herdr_unparseable');
});

test('agentStart passes kind, pane and timeout, and puts agent args after the separator', () => {
  const { run, calls } = fakeBackend(() => ok({ agent: { agent_status: 'idle' } }));
  const client = createHerdrClient({ run });
  client.agentStart('fgos-w1', { kind: 'agy', paneId: 'w9:p3', timeoutMs: 30000, agentArgs: ['--mode', 'accept-edits'] });
  assert.deepEqual(calls[0].args, [
    'agent', 'start', 'fgos-w1', '--kind', 'agy', '--pane', 'w9:p3', '--timeout', '30000',
    '--', '--mode', 'accept-edits',
  ]);
});

test('agentStart gives the child process more time than the readiness wait it asked for', () => {
  const { run, calls } = fakeBackend(() => ok({}));
  const client = createHerdrClient({ run });
  client.agentStart('fgos-w1', { kind: 'claude', paneId: 'p', timeoutMs: 30000 });
  assert.ok(
    calls[0].opts.timeoutMs > 30000,
    'a herdr that is merely slow must not be killed and misreported as unreachable',
  );
});

test('agentPrompt sends the text as one argument and can wait for a specific state', () => {
  const { run, calls } = fakeBackend(() => ok({ agent: { agent_status: 'working' } }));
  const client = createHerdrClient({ run });
  client.agentPrompt('fgos-w1', 'Read /run/brief-1.md and do what it says.', { wait: true, until: ['working'], timeoutMs: 20000 });
  assert.deepEqual(calls[0].args, [
    'agent', 'prompt', 'fgos-w1', 'Read /run/brief-1.md and do what it says.',
    '--wait', '--until', 'working', '--timeout', '20000',
  ]);
});

test('agentGet unwraps the agent record into plain fields', () => {
  const { run } = fakeBackend(() => ok({
    agent: { agent_status: 'working', pane_id: 'w9:p3', state_change_seq: 42, agent_session: { value: 'abc' } },
  }));
  const client = createHerdrClient({ run });
  assert.deepEqual(client.agentGet('fgos-w1'), {
    agentStatus: 'working',
    agentSession: { value: 'abc' },
    paneId: 'w9:p3',
    stateChangeSeq: 42,
    terminalTitle: null,
  });
});

test('paneProcessInfo separates the shell from whatever else is in the foreground', () => {
  const { run } = fakeBackend(() => ok({
    process_info: {
      pane_id: 'w9:p3',
      shell_pid: 100,
      foreground_process_group_id: 200,
      foreground_processes: [{ pid: 200, name: 'claude' }],
    },
  }));
  const client = createHerdrClient({ run });
  const info = client.paneProcessInfo('w9:p3');
  assert.equal(info.shellPid, 100);
  assert.deepEqual(info.foregroundProcesses, [{ pid: 200, name: 'claude' }]);
});

test('paneClose never throws -- a pane that will not close is forensics, not a dispatch failure', () => {
  const { run } = fakeBackend(() => herdrErr('pane_not_found'));
  const client = createHerdrClient({ run });
  assert.equal(client.paneClose('w9:p3'), false);
});

test('done is a ready state, not an error -- a --no-focus pane settles there', () => {
  assert.deepEqual([...READY_STATES], ['idle', 'done']);
  assert.equal(isReadyState('done'), true);
  assert.equal(isReadyState('idle'), true);
  assert.equal(isReadyState('working'), false);
  assert.equal(isReadyState('blocked'), false);
});

test('agent names are normalized to something herdr accepts as a target', () => {
  assert.equal(normalizeAgentName('FGOS/Work Item 5'), 'fgos-work-item-5');
  assert.equal(normalizeAgentName('---'), 'fgos-agent');
  assert.equal(normalizeAgentName(''), 'fgos-agent');
  assert.ok(normalizeAgentName('x'.repeat(200)).length <= 48);
});
