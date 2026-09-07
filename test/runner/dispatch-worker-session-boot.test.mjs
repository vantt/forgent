import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ensureWorkerSession, DEFAULT_WORKER_SESSION } from '../../src/runner/dispatch/worker-session-boot.mjs';

// Everything that touches the outside world is injected, so the whole session
// lifecycle is exercised here without a herdr install and without a terminal.

function fakeHerdr({ panes = [], rootPane = 'w1:p1', failCreate = false } = {}) {
  const calls = [];
  const run = (bin, args) => {
    calls.push(args);
    const key = args.slice(0, 2).join(' ');
    if (key === 'pane list') return { status: 0, stdout: JSON.stringify({ id: 'x', result: { panes: panes.map((p) => ({ pane_id: p })) } }), stderr: '' };
    if (key === 'workspace create') {
      return failCreate
        ? { status: 1, stdout: JSON.stringify({ error: { code: 'no_space', message: 'nope' } }), stderr: '' }
        : { status: 0, stdout: JSON.stringify({ id: 'x', result: { root_pane: { pane_id: rootPane } } }), stderr: '' };
    }
    return { status: 0, stdout: JSON.stringify({ id: 'x', result: {} }), stderr: '' };
  };
  return { run, calls };
}

const baseOpts = (over = {}) => ({
  callerEnv: { HOME: '/home/op' },
  cwd: '/work',
  sleepFn: async () => {},
  ...over,
});

test('the operator session is refused before a single process is started', async () => {
  let spawned = 0;
  await assert.rejects(
    () => ensureWorkerSession('default', baseOpts({ spawnFn: () => { spawned += 1; return { unref() {} }; }, existsSync: () => false })),
    (e) => e.code === 'operator-session',
  );
  assert.equal(spawned, 0, 'nothing may be launched against the cockpit, not even to fail');
});

test('the session the caller is sitting in is refused too, whatever it is called', async () => {
  await assert.rejects(
    () => ensureWorkerSession('mine', baseOpts({ callerEnv: { HOME: '/home/op', HERDR_SESSION: 'mine' }, existsSync: () => false, spawnFn: () => ({ unref() {} }) })),
    (e) => e.code === 'operator-session',
  );
});

test('a session already up is reused, and its own socket is what addresses it', async () => {
  const { run, calls } = fakeHerdr({ panes: ['w1:p7'] });
  let spawned = 0;
  const out = await ensureWorkerSession('fgos-worker', baseOpts({
    existsSync: () => true,
    spawnFn: () => { spawned += 1; return { unref() {} }; },
    run,
  }));
  assert.equal(spawned, 0, 'a running session is not started again');
  assert.equal(out.startedServer, false);
  assert.equal(out.socketPath, '/home/op/.config/herdr/sessions/fgos-worker/herdr.sock');
  assert.equal(out.env.HERDR_SOCKET_PATH, out.socketPath);
  assert.equal(out.env.HERDR_SESSION, 'fgos-worker');
  void run; void calls;
});

test('the addressing environment drops the caller pane identity', async () => {
  const out = await ensureWorkerSession('fgos-worker', baseOpts({
    callerEnv: { HOME: '/home/op', HERDR_PANE_ID: 'wS:p1', HERDR_TAB_ID: 'wS:t1', HERDR_WORKSPACE_ID: 'wS' },
    existsSync: () => true,
    run: fakeHerdr({ panes: ['w1:p1'] }).run,
  }));
  assert.equal(out.env.HERDR_PANE_ID, undefined, 'a worker must not be handed a name for the operator\'s pane');
  assert.equal(out.env.HERDR_TAB_ID, undefined);
  assert.equal(out.env.HERDR_WORKSPACE_ID, undefined);
});

test('a session that never comes up is reported by name rather than hung on', async () => {
  let now = 0;
  await assert.rejects(
    () => ensureWorkerSession('fgos-worker', baseOpts({
      existsSync: () => false,
      spawnFn: () => ({ unref() {} }),
      sleepFn: async () => { now += 500; },
      timeoutMs: 1000,
      pollMs: 500,
    })),
    (e) => e.code === 'session-unavailable' && /did not come up/.test(e.message),
  );
});

test('the caller environment is never mutated on the way through', async () => {
  const callerEnv = { HOME: '/home/op', HERDR_PANE_ID: 'wS:p1' };
  await ensureWorkerSession('fgos-worker', baseOpts({ callerEnv, existsSync: () => true, run: fakeHerdr({ panes: ['w1:p1'] }).run }));
  assert.equal(callerEnv.HERDR_PANE_ID, 'wS:p1', 'the caller keeps its own pane identity');
  assert.equal(callerEnv.HERDR_SESSION, undefined);
});

test('the shared worker session has a name, so a reader can see which one it is', () => {
  assert.equal(DEFAULT_WORKER_SESSION, 'fgos-worker');
  assert.notEqual(DEFAULT_WORKER_SESSION, 'default');
});

test('a socket file a dead server left behind is cleared, not treated as a live session', async () => {
  // The trap this closes: the file is evidence a server once ran, never that
  // one is running. Read as "already up" it wedges every confined dispatch
  // from then on, each refusing with confinement-unavailable until somebody
  // deletes the file by hand.
  let unlinked = null;
  let spawned = 0;
  let listCalls = 0;
  const run = (bin, args) => {
    const key = args.slice(0, 2).join(' ');
    if (key === 'pane list') {
      listCalls += 1;
      // The first probe is the liveness check against the stale socket.
      if (listCalls === 1) return { status: 1, stdout: '', stderr: JSON.stringify({ error: { code: 'connection_refused', message: 'nothing there' } }) };
      return { status: 0, stdout: JSON.stringify({ id: 'x', result: { panes: [] } }), stderr: '' };
    }
    if (key === 'workspace create') return { status: 0, stdout: JSON.stringify({ id: 'x', result: { root_pane: { pane_id: 'w9:p1' } } }), stderr: '' };
    return { status: 0, stdout: JSON.stringify({ id: 'x', result: {} }), stderr: '' };
  };

  // Present at first; gone once unlinked, then written again by the server.
  let present = true;
  const res = await ensureWorkerSession(DEFAULT_WORKER_SESSION, baseOpts({
    run,
    existsSync: () => present,
    unlinkFn: (p) => { unlinked = p; present = false; },
    spawnFn: () => { spawned += 1; present = true; return { unref() {} }; },
  }));

  assert.match(unlinked ?? '', /fgos-worker\/herdr\.sock$/, 'the dead socket was removed');
  assert.equal(spawned, 1, 'and a server was actually started in its place');
  assert.equal(res.startedServer, true);
  assert.equal(res.rootPaneId, 'w9:p1');
});

test('a socket that answers is left alone -- a live session is never restarted', async () => {
  const herdr = fakeHerdr({ panes: ['w1:p1'] });
  let unlinked = 0;
  let spawned = 0;
  const res = await ensureWorkerSession(DEFAULT_WORKER_SESSION, baseOpts({
    run: herdr.run,
    existsSync: () => true,
    unlinkFn: () => { unlinked += 1; },
    spawnFn: () => { spawned += 1; return { unref() {} }; },
  }));
  assert.equal(unlinked, 0);
  assert.equal(spawned, 0);
  assert.equal(res.startedServer, false);
  assert.equal(res.rootPaneId, 'w1:p1');
});
