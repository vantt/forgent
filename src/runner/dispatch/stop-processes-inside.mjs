// Stops every process that still runs from inside a directory that is about to be deleted.
//
// WHY. An agent CLI can start a background server of its own out of the HOME it was given: codex
// puts `app-server-daemon` under `<home>/packages/...` and leaves it running when the pane closes.
// Removing the home deletes the files but not the process, so one such daemon (tens of megabytes)
// survived every dispatch. A home is private to one dispatch, so nothing legitimate may still be
// running in it once the round is over.
//
// WHAT COUNTS AS "INSIDE". A process whose executable or working directory is inside `dir`. An
// argument that merely names the directory (a `rm -rf`, an editor) does not count.
//
// LINUX ONLY. It reads /proc. Where /proc is absent nothing is known to be running and it stops
// nothing; confinement itself is Linux-only, so the leak it closes is too.

import fs from 'node:fs';
import path from 'node:path';

const sleepSync = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

const alive = (pid) => {
  try { process.kill(pid, 0); return true; } catch (err) { return err.code === 'EPERM'; }
};

// readlink reports an executable that was deleted from under a running process as "<path> (deleted)".
const withoutDeletedSuffix = (p) => (typeof p === 'string' && p.endsWith(' (deleted)') ? p.slice(0, -' (deleted)'.length) : p);

/**
 * @param {string} dir directory whose processes are stopped
 * @param {{ graceMs?: number }} [options] how long SIGTERM gets before SIGKILL
 * @returns {number} how many processes were found
 */
export function stopProcessesInside(dir, { graceMs = 1500 } = {}) {
  let root;
  try { root = fs.realpathSync(dir); } catch { root = path.resolve(dir); }
  const inside = (p) => typeof p === 'string' && (p === root || p.startsWith(root + path.sep));

  let names;
  try { names = fs.readdirSync('/proc'); } catch { return 0; }

  const found = [];
  for (const name of names) {
    if (!/^\d+$/.test(name)) continue;
    const pid = Number(name);
    if (pid === process.pid || pid === process.ppid) continue;
    let exe = null;
    let cwd = null;
    try { exe = fs.readlinkSync(`/proc/${pid}/exe`); } catch { /* not ours to read, or already gone */ }
    try { cwd = fs.readlinkSync(`/proc/${pid}/cwd`); } catch { /* same */ }
    if (inside(withoutDeletedSuffix(exe)) || inside(withoutDeletedSuffix(cwd))) found.push(pid);
  }

  for (const pid of found) {
    try { process.kill(pid, 'SIGTERM'); } catch { /* gone already */ }
  }
  const deadline = Date.now() + graceMs;
  while (Date.now() < deadline && found.some(alive)) sleepSync(50);
  for (const pid of found) {
    if (alive(pid)) {
      try { process.kill(pid, 'SIGKILL'); } catch { /* gone already */ }
    }
  }
  return found.length;
}
