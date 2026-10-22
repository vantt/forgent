import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ensureWorkerSession, DEFAULT_WORKER_SESSION } from '../../src/runner/dispatch/worker-session-boot.mjs';

// Everything that touches the outside world is injected, so the whole session
// lifecycle is exercised here without a herdr install and without a terminal.

/** A terminal-control client whose `capabilities` answers come from `answers` (true = a server answers; the last repeats). */
function fakeTerminal(answers = [true]) {
  let asked = 0;
  const client = {
    capabilities() {
      const up = answers[Math.min(asked, answers.length - 1)];
      asked += 1;
      return { result: 'capabilities', driver: 'herdr', capabilities: [], serverIncarnation: up ? { pid: 1 } : null };
    },
  };
  return { client, asked: () => asked, terminalControlFor: () => client };
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
  const terminal = fakeTerminal([true]);
  let spawned = 0;
  const out = await ensureWorkerSession('fgos-worker', baseOpts({
    existsSync: () => true,
    spawnFn: () => { spawned += 1; return { unref() {} }; },
    terminalControlFor: terminal.terminalControlFor,
  }));
  assert.equal(spawned, 0, 'a running session is not started again');
  assert.equal(out.startedServer, false);
  assert.equal(out.socketPath, '/home/op/.config/herdr/sessions/fgos-worker/herdr.sock');
  assert.equal(out.env.HERDR_SOCKET_PATH, out.socketPath);
  assert.equal(out.env.HERDR_SESSION, 'fgos-worker');
});

test('the addressing environment drops the caller pane identity', async () => {
  const out = await ensureWorkerSession('fgos-worker', baseOpts({
    callerEnv: { HOME: '/home/op', HERDR_PANE_ID: 'wS:p1', HERDR_TAB_ID: 'wS:t1', HERDR_WORKSPACE_ID: 'wS' },
    existsSync: () => true,
    terminalControlFor: fakeTerminal([true]).terminalControlFor,
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
  await ensureWorkerSession('fgos-worker', baseOpts({ callerEnv, existsSync: () => true, terminalControlFor: fakeTerminal([true]).terminalControlFor }));
  assert.equal(callerEnv.HERDR_PANE_ID, 'wS:p1', 'the caller keeps its own pane identity');
  assert.equal(callerEnv.HERDR_SESSION, undefined);
});

test('the shared worker session has a name, so a reader can see which one it is', () => {
  assert.equal(DEFAULT_WORKER_SESSION, 'fgos-worker');
  assert.notEqual(DEFAULT_WORKER_SESSION, 'default');
});

/** What the OS says about the socket: `connects` is a list of 'refused' | 'accepted', the last repeating. */
function fakeSocket(connects, { statSeq } = {}) {
  let n = 0;
  let looks = 0;
  return {
    connectFn: async () => {
      const outcome = connects[Math.min(n, connects.length - 1)];
      n += 1;
      if (outcome === 'refused') throw Object.assign(new Error('refused'), { code: 'ECONNREFUSED' });
    },
    statFn: () => {
      const st = statSeq ? statSeq[Math.min(looks, statSeq.length - 1)] : { ino: 7, mtimeMs: 1 };
      looks += 1;
      return st;
    },
  };
}

/** A terminal client that answers only once `isUp()` says a server was started. */
const terminalUpWhen = (isUp) => ({
  terminalControlFor: () => ({
    capabilities: () => ({ result: 'capabilities', driver: 'herdr', capabilities: [], serverIncarnation: isUp() ? { pid: 1 } : null }),
  }),
});

test('a socket file a dead server left behind is cleared, not treated as a live session', async () => {
  // The trap this closes: the file is evidence a server once ran, never that
  // one is running. Read as "already up" it wedges every confined dispatch
  // from then on, each refusing with confinement-unavailable until somebody
  // deletes the file by hand. The OS refusing the connect twice is the proof.
  let unlinked = null;
  let spawned = 0;
  let present = true;
  const res = await ensureWorkerSession(DEFAULT_WORKER_SESSION, baseOpts({
    ...terminalUpWhen(() => spawned > 0),
    ...fakeSocket(['refused']),
    existsSync: () => present,
    unlinkFn: (p) => { unlinked = p; present = false; },
    spawnFn: () => { spawned += 1; present = true; return { unref() {} }; },
  }));

  assert.match(unlinked ?? '', /fgos-worker\/herdr\.sock$/, 'the dead socket was removed');
  assert.equal(spawned, 1, 'and a server was actually started in its place');
  assert.equal(res.startedServer, true);
});

test('a route that does not answer keeps the socket and starts nothing while the server is unproven dead', async () => {
  // The route failing (no host binary, a timeout, a version mismatch) says
  // nothing about the server; a connect that works says one is listening.
  let unlinked = 0;
  let spawned = 0;
  await assert.rejects(
    () => ensureWorkerSession(DEFAULT_WORKER_SESSION, baseOpts({
      terminalControlFor: () => ({ capabilities() { throw new Error('host binary missing'); } }),
      ...fakeSocket(['accepted']),
      existsSync: () => true,
      unlinkFn: () => { unlinked += 1; },
      spawnFn: () => { spawned += 1; return { unref() {} }; },
    })),
    (e) => e.code === 'worker-session-server-unknown' && /worker-session-server-unknown/.test(e.message),
  );
  assert.equal(unlinked, 0, 'the socket stays');
  assert.equal(spawned, 0, 'no second server is started');
});

test('an answer without a server incarnation keeps the socket', async () => {
  let unlinked = 0;
  await assert.rejects(
    () => ensureWorkerSession(DEFAULT_WORKER_SESSION, baseOpts({
      terminalControlFor: fakeTerminal([false]).terminalControlFor,
      ...fakeSocket(['accepted']),
      existsSync: () => true,
      unlinkFn: () => { unlinked += 1; },
      spawnFn: () => ({ unref() {} }),
    })),
    (e) => e.code === 'worker-session-server-unknown',
  );
  assert.equal(unlinked, 0);
});

test('a socket refused once and then answering is not removed', async () => {
  // A socket file exists between bind() and listen(): one refusal can be a
  // server that is still starting.
  let unlinked = 0;
  let spawned = 0;
  const res = await ensureWorkerSession(DEFAULT_WORKER_SESSION, baseOpts({
    terminalControlFor: fakeTerminal([false, true]).terminalControlFor,
    ...fakeSocket(['refused']),
    existsSync: () => true,
    unlinkFn: () => { unlinked += 1; },
    spawnFn: () => { spawned += 1; return { unref() {} }; },
  }));
  assert.equal(unlinked, 0);
  assert.equal(spawned, 0);
  assert.equal(res.startedServer, false);
});

test('two refusals on different socket files are not proof the server is dead', async () => {
  let unlinked = 0;
  await assert.rejects(
    () => ensureWorkerSession(DEFAULT_WORKER_SESSION, baseOpts({
      terminalControlFor: fakeTerminal([false]).terminalControlFor,
      ...fakeSocket(['refused'], { statSeq: [{ ino: 7, mtimeMs: 1 }, { ino: 8, mtimeMs: 2 }] }),
      existsSync: () => true,
      unlinkFn: () => { unlinked += 1; },
      spawnFn: () => ({ unref() {} }),
    })),
    (e) => e.code === 'worker-session-server-unknown',
  );
  assert.equal(unlinked, 0);
});

test('a socket that answers is left alone -- a live session is never restarted', async () => {
  let unlinked = 0;
  let spawned = 0;
  const res = await ensureWorkerSession(DEFAULT_WORKER_SESSION, baseOpts({
    terminalControlFor: fakeTerminal([true]).terminalControlFor,
    existsSync: () => true,
    unlinkFn: () => { unlinked += 1; },
    spawnFn: () => { spawned += 1; return { unref() {} }; },
  }));
  assert.equal(unlinked, 0);
  assert.equal(spawned, 0);
  assert.equal(res.startedServer, false);
});

test('a server that wrote its socket but never answers is reported by name', async () => {
  let present = false;
  await assert.rejects(
    () => ensureWorkerSession('fgos-worker', baseOpts({
      terminalControlFor: fakeTerminal([false]).terminalControlFor,
      existsSync: () => present,
      spawnFn: () => { present = true; return { unref() {} }; },
      sleepFn: async () => {},
      timeoutMs: 20,
      pollMs: 1,
    })),
    (e) => e.code === 'session-unavailable' && /did not answer/.test(e.message),
  );
});
