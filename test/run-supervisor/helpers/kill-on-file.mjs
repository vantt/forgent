// Stop processes from outside the moment a file of the attempt shows up (or a process of it appears): the
// crash happens where the state on disk says it should, never through a branch in the code under test.
import fs from 'node:fs';

const gone = (pid) => { try { process.kill(pid, 0); return false; } catch (err) { return err.code !== 'EPERM'; } };

/** Send `signal` to every pid; one that is already gone is not an error. Returns the pids it reached. */
export function signalPids(pids, signal = 'SIGKILL') {
  const reached = [];
  for (const pid of pids) {
    if (!Number.isInteger(pid) || pid <= 1) continue;
    try { process.kill(pid, signal); reached.push(pid); } catch { /* gone */ }
  }
  return reached;
}

export async function waitGone(pids, { timeoutMs = 30_000 } = {}) {
  const deadline = Date.now() + timeoutMs;
  for (const pid of pids) {
    while (!gone(pid)) {
      if (Date.now() > deadline) throw new Error(`pid ${pid} is still alive after ${timeoutMs} ms`);
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }
}

/** Every process whose argv (read from /proc) satisfies `match(args)`; a process that ends meanwhile is skipped. */
export function findProcesses(match) {
  const found = [];
  for (const entry of fs.readdirSync('/proc')) {
    if (!/^\d+$/.test(entry)) continue;
    try {
      const args = fs.readFileSync(`/proc/${entry}/cmdline`, 'utf8').split('\0').filter(Boolean);
      if (args.length > 0 && match(args)) found.push(Number(entry));
    } catch { /* gone */ }
  }
  return found;
}

/**
 * Look without pause (the edge is a few milliseconds wide) until `appears` holds, then signal the pids
 * `targets()` names at that instant. `appears` is a path or a predicate. Resolves with the pids that were
 * signalled, or null when the deadline passed first.
 */
export async function killOnFile({ appears, targets, signal = 'SIGKILL', timeoutMs = 60_000 }) {
  const seen = typeof appears === 'function' ? appears : () => fs.existsSync(appears);
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    if (seen()) return signalPids(targets(), signal);
    if (Date.now() > deadline) return null;
    await new Promise((resolve) => setImmediate(resolve));
  }
}

/** Freeze (SIGSTOP) every process matching `match` the first time one is seen; resolves with the frozen pids. */
export async function freezeOnProcess({ match, timeoutMs = 120_000 }) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const seen = findProcesses(match);
    if (seen.length > 0) return signalPids(seen, 'SIGSTOP');
    if (Date.now() > deadline) return null;
    await new Promise((resolve) => setImmediate(resolve));
  }
}

/** Direct children of `pid`, from /proc (one small read, so it can be looked at in a tight loop). */
export function childrenOf(pid) {
  const kids = [];
  try {
    for (const task of fs.readdirSync(`/proc/${pid}/task`)) {
      try { kids.push(...fs.readFileSync(`/proc/${pid}/task/${task}/children`, 'utf8').split(' ').filter(Boolean).map(Number)); } catch { /* task ended */ }
    }
  } catch { /* process gone */ }
  return kids;
}

const argsOf = (pid) => { try { return fs.readFileSync(`/proc/${pid}/cmdline`, 'utf8').split('\0').filter(Boolean); } catch { return []; } };

/**
 * Freeze (SIGSTOP) the first child of `parent` whose argv satisfies `match`, looking at its children without
 * pause: a step lives for tens of milliseconds, too short for a scan of the whole process table to be sure of it.
 */
export async function freezeChildOf({ parent, match, timeoutMs = 120_000 }) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const hit = childrenOf(parent).filter((pid) => match(argsOf(pid)));
    if (hit.length > 0) return signalPids(hit, 'SIGSTOP');
    if (Date.now() > deadline) return null;
    await new Promise((resolve) => setImmediate(resolve));
  }
}
