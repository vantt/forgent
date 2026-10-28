// Stops every process that still runs from inside a directory that is about to be deleted.
//
// WHY. An agent CLI can start a background server of its own out of the HOME it was given: codex
// puts `app-server-daemon` under `<home>/packages/...` and leaves it running when the pane closes.
// Removing the home deletes the files but not the process, so one such daemon (tens of megabytes)
// survived every dispatch. A home is private to one dispatch, so nothing legitimate may still be
// running in it once the round is over.
//
// WHAT COUNTS AS "INSIDE". A process whose executable or working directory is inside `dir`. An
// argument that merely names the directory (a `rm -rf`, an editor) does not count. A caller may also
// name environment variables whose value, when inside `dir`, makes the process count: a detached
// child that will run a staged program later names it there before it runs anything from it.
//
// LINUX ONLY. The process door scans /proc. Where it cannot scan nothing is known to be running and it
// stops nothing; confinement itself is Linux-only, so the leak it closes is too. `processesInside` is the
// same look without the stop, for a caller that must leave a directory alone while it is in use.

import fs from 'node:fs';
import path from 'node:path';
import { judge, scan, signalByIdentity } from './process-identity.mjs';

const sleepSync = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

// readlink reports an executable that was deleted from under a running process as "<path> (deleted)".
const withoutDeletedSuffix = (p) => (typeof p === 'string' && p.endsWith(' (deleted)') ? p.slice(0, -' (deleted)'.length) : p);

/**
 * The process views (other than this one and its parent) whose executable or working directory is inside `dir`,
 * or whose environment variable named in `envKeys` holds a path inside `dir`.
 * A view is the door's `{pid, tuple, exe, cwd, ...}`; `tuple` is null when the identity could not be read.
 * @param {string} dir
 * @param {{ envKeys?: string[], views?: object[]|'unsupported' }} [options] `views` is a scan the caller already took, so one scan serves many directories
 * @returns {object[]}
 */
export function processesInside(dir, { envKeys = [], views = scan({ envKeys }) } = {}) {
  let root;
  try { root = fs.realpathSync(dir); } catch { root = path.resolve(dir); }
  const inside = (p) => typeof p === 'string' && (p === root || p.startsWith(root + path.sep));

  if (views === 'unsupported') return [];
  return views.filter((view) => view.pid !== process.pid && view.pid !== process.ppid
    && (inside(withoutDeletedSuffix(view.exe)) || inside(withoutDeletedSuffix(view.cwd))
      || envKeys.some((key) => inside(view.env?.[key]))));
}

const stillThere = (view) => view.tuple === null || judge(view.tuple) === 'alive';

/** Poll for up to `graceMs` while any of `views` is still alive; returns whether any still is. */
function waitWhileAlive(views, graceMs) {
  const deadline = Date.now() + graceMs;
  while (Date.now() < deadline && views.some(stillThere)) sleepSync(50);
  return views.some(stillThere);
}

/**
 * Stop what runs inside `dir`: SIGTERM, a grace window, SIGKILL, a second window. Each signal goes to the
 * recorded identity only, so a pid reused since the scan is never hit. A view without a readable identity
 * cannot be signalled safely and is reported in `left`, as is any view still alive after the kill window.
 * @param {string} dir directory whose processes are stopped
 * @param {{ graceMs?: number }} [options] how long each signal gets to take effect
 * @returns {{ found: number, stopped: number, left: object[] }}
 */
export function stopProcessesInside(dir, { graceMs = 1500 } = {}) {
  const found = processesInside(dir);
  const signalAll = (signal) => {
    for (const view of found) {
      if (view.tuple === null) continue;
      const outcome = signalByIdentity(view.tuple, signal);
      // 'sent', or nothing was sent because the process is not that one any more; anything else is not a stop.
      if (!['sent', 'identity-mismatch', 'not-found', 'unsupported'].includes(outcome)) {
        throw new Error(`stop-processes-inside-signal-refused: ${signal} to pid ${view.pid} gave ${outcome}`);
      }
    }
  };
  signalAll('term');
  if (waitWhileAlive(found, graceMs)) {
    signalAll('kill');
    waitWhileAlive(found, graceMs);
  }
  const left = found.filter(stillThere);
  return { found: found.length, stopped: found.length - left.length, left };
}
