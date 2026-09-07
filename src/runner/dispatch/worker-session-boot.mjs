// Bring a worker's own herdr session up, and make sure it has somewhere to
// split a pane from.
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
// The bootstrap step here was not designed in advance; it was found by a probe
// failing. `herdr pane split` needs an existing pane to split FROM, and a
// freshly started session has none, so the first dispatch into a new worker
// session died in 8ms with herdr's own `pane_not_found`. A session is given a
// workspace before anything tries to split off it.

import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { createHerdrClient } from './herdr-agent.mjs';
import { isolatedSessionEnv, socketPathForSession, assertNotOperatorSession, WorkerSessionError } from './worker-session.mjs';

/** The session every confined worker shares unless an executor names another. */
export const DEFAULT_WORKER_SESSION = 'fgos-worker';

const sleep = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });


/** Is anything actually listening on this socket? Asked with the cheapest
 * call herdr answers, and a failure is read as "no" -- the point is to
 * distinguish a live server from the file a dead one left behind. */
function answersOn(socketPath, { herdrBin, cwd, env, run }) {
  try {
    createHerdrClient({ herdrBin, cwd, env, ...(run ? { run } : {}) }).paneList();
    return true;
  } catch {
    return false;
  }
}

/**
 * Ensure `sessionName` is running and has at least one pane, and return the
 * environment that addresses it.
 *
 * Refuses outright to touch the operator's own session — that assertion runs
 * before anything is started, so a mistake in configuration cannot reach the
 * point of spawning a server against the cockpit.
 *
 * Everything that touches the outside world is injectable, so the whole
 * lifecycle can be tested without a herdr install.
 */
export async function ensureWorkerSession(sessionName = DEFAULT_WORKER_SESSION, {
  callerEnv = process.env,
  workerHome,
  cwd,
  herdrBin = 'herdr',
  spawnFn = spawn,
  existsSync = fs.existsSync,
  // The herdr call boundary, injectable so the whole lifecycle is testable
  // without a herdr install and without a terminal.
  run,
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

  // A server that died without unlinking leaves its socket file behind. Read
  // as "already up", that file wedges every confined dispatch from then on:
  // nothing listens, the workspace call fails, and each round refuses with
  // `confinement-unavailable` until a person deletes the file by hand. The
  // file is evidence a server once ran, never that one is running -- so a
  // socket nobody answers is removed and started again.
  let socketPresent = existsSync(socketPath);
  if (socketPresent && !answersOn(socketPath, { herdrBin, cwd, env, run })) {
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
  }

  const client = createHerdrClient({ herdrBin, cwd, env, ...(run ? { run } : {}) });

  let panes = [];
  try {
    panes = client.paneList();
  } catch {
    // A server that just wrote its socket may not be answering yet; the
    // workspace call below is the real readiness test.
    panes = [];
  }

  let rootPaneId = panes[0] ?? null;
  if (!rootPaneId) {
    rootPaneId = client.workspaceCreate({
      cwd,
      label: 'fgos-worker',
      env: workerHome ? { HOME: workerHome } : undefined,
    });
    if (!rootPaneId) {
      throw new WorkerSessionError(
        'session-unavailable',
        `worker session "${sessionName}" is running but would not create a workspace to split from.`,
        { sessionName, socketPath },
      );
    }
  }

  return { sessionName, socketPath, env, rootPaneId, startedServer };
}
