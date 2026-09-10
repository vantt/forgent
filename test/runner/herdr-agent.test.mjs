import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createHerdrClient,
  createBatchTab,
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

test('paneSplit given an explicit pane anchors the split there instead of leaving it implicit', () => {
  const { run, calls } = fakeBackend(() => ok({ pane: { pane_id: 'w9:p4' } }));
  const client = createHerdrClient({ run });
  const paneId = client.paneSplit({ pane: 'w9:p1', direction: 'down' });
  assert.equal(paneId, 'w9:p4');
  assert.deepEqual(calls[0].args, ['pane', 'split', '--pane', 'w9:p1', '--direction', 'down', '--no-focus']);
});

test('tabCreate labels the tab in the same call and returns its tab_id and root pane_id', () => {
  const { run, calls } = fakeBackend(() => ok({
    tab: { tab_id: 'w9:t2' },
    root_pane: { pane_id: 'w9:p1' },
  }));
  const client = createHerdrClient({ run });
  const { tabId, paneId } = client.tabCreate({ label: 'fgos-lead-tsk-1', cwd: '/tmp/work' });
  assert.deepEqual({ tabId, paneId }, { tabId: 'w9:t2', paneId: 'w9:p1' });
  assert.deepEqual(calls[0].args, ['tab', 'create', '--cwd', '/tmp/work', '--label', 'fgos-lead-tsk-1', '--no-focus']);
});

test('tabCreate fails loudly when the response is missing either id, never guessing one', () => {
  const { run } = fakeBackend(() => ok({ tab: { tab_id: 'w9:t2' } }));
  const client = createHerdrClient({ run });
  assert.throws(() => client.tabCreate({ label: 'x' }), (err) => err.code === 'herdr_unparseable');
});

test('createBatchTab creates its tab at most once, no matter how many rounds ensure() it', () => {
  const { run, calls } = fakeBackend(() => ok({ tab: { tab_id: 'w9:t2' }, root_pane: { pane_id: 'w9:p1' } }));
  const client = createHerdrClient({ run });
  const batch = createBatchTab({ label: 'fgos-lead-tsk-1', cwd: '/tmp/work' });

  assert.equal(batch.ensure(client), 'w9:p1');
  assert.equal(batch.ensure(client), 'w9:p1');
  assert.equal(batch.ensure(client), 'w9:p1');

  const tabCreateCalls = calls.filter((c) => c.args[0] === 'tab' && c.args[1] === 'create');
  assert.equal(tabCreateCalls.length, 1, 'three rounds of one batch must open exactly one tab');
});

test('createBatchTab never calls tab create until the first ensure()', () => {
  const { calls } = fakeBackend(() => ok({ tab: { tab_id: 'w9:t2' }, root_pane: { pane_id: 'w9:p1' } }));
  createBatchTab({ label: 'unused' });
  assert.equal(calls.length, 0, 'a request whose actors never reach a herdr round must never touch herdr');
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

test('a herdr error envelope on STDERR is still a named failure, not an unparseable one', () => {
  // Measured against herdr 0.8.2: `agent start` timing out writes a
  // well-formed error envelope to stderr and NOTHING to stdout. Reading only
  // stdout turned that named failure into `herdr_unparseable`, which is the
  // exact outcome this module exists to prevent -- found live while probing
  // the configured agy and codex executors.
  const { run } = fakeBackend(() => ({
    status: 1,
    stdout: '',
    stderr: JSON.stringify({ error: { code: 'timeout', message: 'timed out waiting for agent startup' }, id: 'cli:agent:start' }) + '\n',
  }));
  const client = createHerdrClient({ run });
  assert.throws(
    () => client.agentStart('w1', { kind: 'agy', paneId: 'p1' }),
    (err) => err.code === 'timeout' && /timed out waiting for agent startup/.test(err.message),
  );
});

test('stdout still wins when both streams carry something', () => {
  const { run } = fakeBackend(() => ({
    status: 0,
    stdout: JSON.stringify({ id: 'x', result: { agent: { agent_status: 'idle' } } }),
    stderr: 'a warning nobody should parse as the answer',
  }));
  const client = createHerdrClient({ run });
  assert.equal(client.agentGet('w1').agentStatus, 'idle');
});

test('neither stream parseable is still reported as unparseable, naming both', () => {
  const { run } = fakeBackend(() => ({ status: 2, stdout: 'not json', stderr: 'also not json' }));
  const client = createHerdrClient({ run });
  assert.throws(
    () => client.agentGet('w1'),
    (err) => err.code === 'herdr_unparseable' && /stdout or stderr/.test(err.message),
  );
});

test('a long work id loses its middle, never the suffix that makes it unique', () => {
  const longId = 'tsk-a-very-long-work-item-identifier-indeed-here';
  const first = normalizeAgentName(`fgos-${longId}-${(1700000000000).toString(36)}`);
  const second = normalizeAgentName(`fgos-${longId}-${(1700000000001).toString(36)}`);

  // 32 is herdr's own limit, from its own refusal message. This assertion
  // said 48 and passed while the code was wrong: 48 is not a limit anything
  // has, and the first dispatch of a real capability was refused at 35.
  assert.ok(first.length <= 32, `still within what herdr accepts, got ${first.length}`);
  // Truncating the tail would take the timestamp with it, and herdr addresses
  // agents by name -- two rounds of one item would then be the same agent.
  assert.notEqual(first, second, 'two rounds of the same item are two agents');
  // Half the budget is head, half is the tail that makes it unique, so at
  // herdr's 32 the recognisable prefix is 16 characters.
  assert.ok(first.startsWith('fgos-tsk-a-very-'), `enough head to recognise the item, got ${first}`);
  assert.ok(first.endsWith((1700000000000).toString(36)), 'and all of the suffix that distinguishes the round');
});

test('a name that already fits is untouched', () => {
  assert.equal(normalizeAgentName('fgos-tsk-1-abc'), 'fgos-tsk-1-abc');
});

test('a real capability id fits -- the name that herdr actually refused', () => {
  // `executeExecutorCli` passes the capability id as the workId, so a dispatch
  // of `fgos-coding-implement` builds `fgos-fgos-coding-implement-<ts36>`:
  // 35 characters, three over what herdr accepts, and refused as
  // `invalid_agent_name` after the pane was already open.
  const name = normalizeAgentName(`fgos-fgos-coding-implement-${(1788794800000).toString(36)}`);
  assert.ok(name.length <= 32, `got ${name.length}: ${name}`);
  assert.match(name, /^[a-z][a-z0-9_-]*$/, "and still matches herdr's own character rule");
});
