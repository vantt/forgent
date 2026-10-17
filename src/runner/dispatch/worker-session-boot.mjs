// Bring a worker's own herdr session up.
//
// This is the step that closes the escape hole the isolation probes measured.
// The finding, in one line: `HERDR_SOCKET_PATH` is injected by herdr into every
// pane it creates and CANNOT be cleared or redirected through `--env` — herdr
// overwrites even a non-empty override with the real socket of whichever
// session owns the pane. So a worker cannot be denied a cockpit socket. It can
// only be given a different one, by living in a different session.
//
// A private HOME is still worth having: it closes the second route, the
// `$HOME/.config/herdr/herdr.sock` fallback, which a worker would otherwise
// find with no environment variable at all. Neither measure closes the hole
// alone, which is why the config door refuses `bypass` unless both are declared.
//
// Bringing a session up is the one herdr thing this module still does itself:
// starting a server process is not a terminal operation. Everything that talks
// to a running server goes through terminal-control, including the first
// workspace of a fresh session, which the driver creates when the first tab of
// a group asks for one (`herdr tab create` needs a workspace to hold the tab).

import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { createRoundTerminalControl } from './terminal-slot.mjs';
import { isolatedSessionEnv, socketPathForSession, assertNotOperatorSession, WorkerSessionError } from './worker-session.mjs';

/** The session every confined worker shares unless an executor names another. */
export const DEFAULT_WORKER_SESSION = 'fgos-worker';

const sleep = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

/** Is a server actually answering on the session `env` addresses? Asked with the
 * cheapest call terminal-control answers, and a failure is read as "no" -- the
 * point is to tell a live server from the socket file a dead one left behind. */
function serverAnswers(terminalControl) {
  try {
    const answer = terminalControl.capabilities();
    return answer?.result === 'capabilities' && answer.serverIncarnation != null;
  } catch {
    return false;
  }
}

/**
 * Ensure `sessionName` is running, and return the environment that addresses it.
 *
 * Refuses outright to touch the operator's own session -- that assertion runs
 * before anything is started, so a mistake in configuration cannot reach the
 * point of spawning a server against the cockpit.
 *
 * Everything that touches the outside world is injectable, so the whole
 * lifecycle can be tested without a herdr install.
 */
export async function ensureWorkerSession(sessionName = DEFAULT_WORKER_SESSION, {
  callerEnv = process.env,
  herdrBin = 'herdr',
  spawnFn = spawn,
  existsSync = fs.existsSync,
  // The terminal-control client that asks a session whether it answers.
  terminalControlFor = (env) => createRoundTerminalControl({ herdrBin, herdrEnv: env }),
  sleepFn = sleep,
  unlinkFn = fs.unlinkSync,
  timeoutMs = 30000,
  pollMs = 500,
} = {}) {
  // Before any process is started: never the operator's session.
  assertNotOperatorSession(sessionName, callerEnv);

  const operatorHome = callerEnv?.HOME ?? process.env.HOME;
  const socketPath = socketPathForSession(sessionName, { home: operatorHome });
  const env = isolatedSessionEnv(callerEnv, sessionName, { home: operatorHome });
  const terminalControl = terminalControlFor(env);

  // A server that died without unlinking leaves its socket file behind. Read
  // as "already up", that file wedges every confined dispatch from then on:
  // nothing listens, the first pane call fails, and each round refuses with
  // `confinement-unavailable` until a person deletes the file by hand. The
  // file is evidence a server once ran, never that one is running -- so a
  // socket nobody answers is removed and started again.
  let socketPresent = existsSync(socketPath);
  if (socketPresent && !serverAnswers(terminalControl)) {
    try { unlinkFn(socketPath); } catch { /* a socket we cannot remove is reported by the wait below */ }
    socketPresent = existsSync(socketPath);
  }

  let startedServer = false;
  if (!socketPresent) {
    // Detached on purpose: the session has to outlive this dispatch, or the
    // next one pays the startup cost again and any pane kept for forensics
    // dies with the process that was reading it.
    const child = spawnFn(herdrBin, ['--session', sessionName, 'server'], { detached: true, stdio: 'ignore' });
    child?.unref?.();
    startedServer = true;

    const deadline = Date.now() + timeoutMs;
    while (!existsSync(socketPath)) {
      if (Date.now() >= deadline) {
        throw new WorkerSessionError(
          'session-unavailable',
          `worker session "${sessionName}" did not come up within ${timeoutMs}ms (no socket at ${socketPath}).`,
          { sessionName, socketPath },
        );
      }
      await sleepFn(pollMs);
    }
    // The socket file appears before the server answers on it.
    while (!serverAnswers(terminalControl)) {
      if (Date.now() >= deadline) {
        throw new WorkerSessionError(
          'session-unavailable',
          `worker session "${sessionName}" wrote its socket but did not answer within ${timeoutMs}ms (${socketPath}).`,
          { sessionName, socketPath },
        );
      }
      await sleepFn(pollMs);
    }
  }

  return { sessionName, socketPath, env, startedServer };
}
