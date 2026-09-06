// dispatch/worker-session.mjs — address a worker into a herdr session of its own
// (Phase 01 group C2/C3 of plans/260906-1831-dispatch-visibility-v0).
//
// WHY. A worker running in a pane of the operator's own herdr session can list
// and drive every pane the operator has, including one parked waiting for a human
// answer. Measured 2026-09-06, and measured again as NOT fixable with environment
// variables: herdr injects `HERDR_SOCKET_PATH` into every pane it creates and
// overwrites any `--env` override, empty or not. The lever that does work is
// session topology: a worker launched into its own named session is handed THAT
// session's socket, and from inside it sees only its own panes, while the
// operator's cockpit held eighteen.
//
// WHAT THIS BOUNDARY IS, EXACTLY. Routing, not namespace. A worker that names the
// operator's absolute socket path still reaches every pane — also measured. That
// is enough for the failure this project has actually recorded, which is a worker
// drifting into the wrong pane rather than one deliberately hunting for it
// (ADR-0005 names unintentional drift as the real threat, and `tsk-1nih` is the
// incident). Closing the deliberate case needs a mount namespace or a separate OS
// user, and no observed threat here justifies either yet. Saying so plainly is
// part of the contract: a boundary described as stronger than it is, is worse
// than one described honestly.
//
// This module is deliberately pure. Starting and stopping a real herdr server is
// the caller's business; what belongs here is the addressing and the refusals,
// because those are what must be identical on every path and testable without a
// running server.

/** herdr's own naming rule for a session directory. Anything outside this could
 * escape the sessions directory or collide with the default session's own files. */
const SESSION_NAME = /^[a-z][a-z0-9_-]{0,31}$/;

/** The session herdr uses when nobody named one. On an operator machine this IS
 * the cockpit, so it is never a legal target for a worker. */
const DEFAULT_SESSION = 'default';

export class WorkerSessionError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'WorkerSessionError';
    this.code = code;
    Object.assign(this, details);
  }
}

function assertSessionName(name) {
  if (typeof name !== 'string' || !SESSION_NAME.test(name)) {
    throw new WorkerSessionError(
      'invalid-session-name',
      `invalid herdr session name ${JSON.stringify(name)}: expected a lowercase name matching ${SESSION_NAME}.`,
      { name },
    );
  }
}

/**
 * Where herdr keeps the API socket for a named session.
 *
 * The default session keeps a top-level socket; every other session gets its own
 * directory underneath. Both shapes were read off a live server rather than
 * guessed.
 */
export function socketPathForSession(name, { home = process.env.HOME } = {}) {
  assertSessionName(name);
  if (name === DEFAULT_SESSION) return `${home}/.config/herdr/herdr.sock`;
  return `${home}/.config/herdr/sessions/${name}/herdr.sock`;
}

/**
 * Refuse to launch a worker into the operator's own session (C3).
 *
 * Two ways a target can be the operator's: it matches the session the caller is
 * sitting in, which herdr reports as `HERDR_SESSION`, or it is `default`. The
 * second check matters on its own — a caller running outside herdr has no
 * `HERDR_SESSION` at all, and the absence of that variable is not evidence that
 * targeting `default` is safe.
 *
 * This is an assertion rather than a documented convention because the failure it
 * prevents has already happened once: a dispatch delivered into a live session
 * belonging to somebody else.
 */
export function assertNotOperatorSession(target, env = process.env) {
  assertSessionName(target);
  const callerSession = env.HERDR_SESSION;
  if (target === DEFAULT_SESSION || (callerSession && target === callerSession)) {
    throw new WorkerSessionError(
      'operator-session',
      `refusing to launch a worker into session "${target}": that is the operator's own session, where a stray command would land in a live pane.`,
      { target, callerSession: callerSession ?? null },
    );
  }
  return true;
}

/**
 * The environment a worker's pane should be addressed with.
 *
 * Points `HERDR_SESSION` and `HERDR_SOCKET_PATH` at the worker's own session, and
 * DROPS the caller's pane, tab and workspace identity. Those name panes inside the
 * operator's cockpit, which is precisely what the worker must not be able to
 * address; carrying them through would hand back by accident what the separate
 * session was chosen to take away.
 *
 * Returns a new object; the caller's own environment is never mutated.
 */
export function isolatedSessionEnv(callerEnv, target, { home = callerEnv?.HOME ?? process.env.HOME } = {}) {
  assertNotOperatorSession(target, callerEnv ?? {});
  const env = { ...(callerEnv ?? {}) };
  delete env.HERDR_PANE_ID;
  delete env.HERDR_TAB_ID;
  delete env.HERDR_WORKSPACE_ID;
  env.HERDR_SESSION = target;
  env.HERDR_SOCKET_PATH = socketPathForSession(target, { home });
  return env;
}
