import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  socketPathForSession,
  assertNotOperatorSession,
  isolatedSessionEnv,
  WorkerSessionError,
} from '../../src/runner/dispatch/worker-session.mjs';

// Phase 01 group C2/C3. These are pure functions over strings and an env object:
// no herdr server is started here, and nothing in this file touches the operator's
// live session. The parts that genuinely need a running server are proved by the
// live probes under
// docs/architect/agent-coordination/verification/visibility-herdr/proofs/2026-09-06-isolation/,
// which measured that a named session starts headless with its own socket, that a
// pane created inside it is handed THAT session's socket rather than the
// operator's, and that from inside it sees only its own panes.
//
// The rule under test is C3: a worker must never be launched into the operator's
// own session. That is an assertion, not a convention, because the failure it
// prevents has already happened once in this project -- a dispatch typing into a
// live session belonging to someone else, with an item parked awaiting a human as
// the sharpest case.

test('C2: a session name resolves to that session own socket, never the default one', () => {
  const home = '/home/someone';
  assert.equal(
    socketPathForSession('fgos-workers', { home }),
    '/home/someone/.config/herdr/sessions/fgos-workers/herdr.sock',
  );
  assert.equal(
    socketPathForSession('default', { home }),
    '/home/someone/.config/herdr/herdr.sock',
    'the default session keeps its own top-level socket path',
  );
});

test('C2: a session name that could escape its directory is refused', () => {
  for (const bad of ['../default', 'a/b', '', '.', '..', 'has space', 'UPPER']) {
    assert.throws(
      () => socketPathForSession(bad, { home: '/home/someone' }),
      (err) => err instanceof WorkerSessionError && err.code === 'invalid-session-name',
      `expected refusal for session name: ${JSON.stringify(bad)}`,
    );
  }
});

test('C3: launching into the session the caller is sitting in is refused by name', () => {
  assert.throws(
    () => assertNotOperatorSession('cockpit', { HERDR_SESSION: 'cockpit' }),
    (err) => {
      assert.ok(err instanceof WorkerSessionError);
      assert.equal(err.code, 'operator-session');
      return true;
    },
  );
});

test('C3: the default session is refused even when the caller reports no session at all', () => {
  // A caller outside herdr has no HERDR_SESSION, but `default` is still the
  // operator's cockpit on this machine -- absence of the variable is not evidence
  // that targeting default is safe.
  assert.throws(
    () => assertNotOperatorSession('default', {}),
    (err) => err instanceof WorkerSessionError && err.code === 'operator-session',
  );
});

test('C3: a distinct session name passes', () => {
  assert.equal(assertNotOperatorSession('fgos-workers', { HERDR_SESSION: 'cockpit' }), true);
  assert.equal(assertNotOperatorSession('fgos-workers', {}), true);
});

test('C2: the env handed to a worker points at its own session and drops the caller pane identity', () => {
  const callerEnv = {
    PATH: '/usr/bin',
    HERDR_SESSION: 'cockpit',
    HERDR_SOCKET_PATH: '/home/someone/.config/herdr/herdr.sock',
    HERDR_PANE_ID: 'wS:p231',
    HERDR_TAB_ID: 'wS:t7T',
    HERDR_WORKSPACE_ID: 'wS',
  };
  const env = isolatedSessionEnv(callerEnv, 'fgos-workers', { home: '/home/someone' });

  assert.equal(env.HERDR_SESSION, 'fgos-workers');
  assert.equal(env.HERDR_SOCKET_PATH, '/home/someone/.config/herdr/sessions/fgos-workers/herdr.sock');
  assert.equal(env.PATH, '/usr/bin', 'unrelated variables pass through');

  // The caller's own pane identity must not travel with the worker: it names a
  // pane in the operator's cockpit, which is exactly what the worker must not be
  // able to address.
  for (const k of ['HERDR_PANE_ID', 'HERDR_TAB_ID', 'HERDR_WORKSPACE_ID']) {
    assert.equal(env[k], undefined, `${k} must not reach the worker`);
  }
});

test('isolatedSessionEnv does not mutate the caller env it was handed', () => {
  const callerEnv = { HERDR_PANE_ID: 'wS:p231', HERDR_SESSION: 'cockpit' };
  const before = { ...callerEnv };
  isolatedSessionEnv(callerEnv, 'fgos-workers', { home: '/home/someone' });
  assert.deepEqual(callerEnv, before, 'the caller keeps its own environment intact');
});

test('C3 is enforced inside isolatedSessionEnv too, not only when asked separately', () => {
  assert.throws(
    () => isolatedSessionEnv({ HERDR_SESSION: 'cockpit' }, 'cockpit', { home: '/home/someone' }),
    (err) => err instanceof WorkerSessionError && err.code === 'operator-session',
  );
});
