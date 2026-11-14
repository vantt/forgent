#!/usr/bin/env node
// test-file-watchdog.mjs -- per-file time limit for the full-suite door.
//
// `node --test` has no per-file timeout: `--test-timeout` bounds one test, but
// a test file whose process stays alive (an orphaned contender, an unref'd
// handle, a starved event loop) holds the whole run until something outside
// kills it -- a ~58 minute hang observed under machine load. `node --test`
// runs every file as a child process of its own, so this supervisor, started
// as a sibling process by run-tests.mjs (which blocks in spawnSync and cannot
// watch anything itself), scans the process table for such children, and
// SIGKILLs the whole tree of any that outlived its limit. `node --test` then
// reports that file as failed and carries on with the rest of the suite.
//
// Needs `ps` (Linux/macOS); on a platform without it the caller skips the
// watchdog and says so.
//
// Process facts: the `ps -A` table is a reader the process door cannot replace (its views carry no parent
// pid or elapsed time, and its scan is Linux-only). Every signal goes through the door, to an identity read
// before the signal, never to a bare pid; a refusal is printed once, with a next step, and the file stays a
// timeout the next poll retries.

import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { worktreeRegistrationsUnder } from './git-dir-layout.mjs';
import { pruneMissingCheckouts } from './git-ports.mjs';
import { judge, observe, scan, signalByIdentity } from '../../src/native/process-identity.mjs';
import { stopProcessesInside } from '../../src/runner/dispatch/stop-processes-inside.mjs';

// ps prints whole seconds from a clock sampled per process, so a child may
// read a little older than its parent; the ceiling applies when the parent is
// not in the snapshot.
const ELAPSED_SLACK_MS = 60_000;
const MAX_ELAPSED_MS = 7 * 24 * 60 * 60 * 1000;

/** `[[dd-]hh:]mm:ss` as printed by `ps -o etime=`, to milliseconds. */
export function parseEtime(etime) {
  const m = /^(?:(?:(\d+)-)?(\d+):)?(\d+):(\d+)$/.exec(String(etime).trim());
  if (!m) return NaN;
  const [, d = 0, h = 0, min, s] = m;
  return (((Number(d) * 24 + Number(h)) * 60 + Number(min)) * 60 + Number(s)) * 1000;
}

/** Parses `ps -A -o pid=,ppid=,etime=,args=` output into process records. */
export function parsePs(text) {
  const procs = [];
  for (const line of text.split('\n')) {
    const m = /^\s*(\d+)\s+(\d+)\s+(\S+)\s+(.*)$/.exec(line);
    if (!m) continue;
    procs.push({ pid: Number(m[1]), ppid: Number(m[2]), elapsedMs: parseEtime(m[3]), args: m[4] });
  }
  return procs;
}

/** pid plus every descendant of pid, deepest first (children die before parents). */
export function treeOf(procs, pid) {
  const byParent = new Map();
  for (const p of procs) {
    if (!byParent.has(p.ppid)) byParent.set(p.ppid, []);
    byParent.get(p.ppid).push(p.pid);
  }
  const order = [];
  (function visit(id) {
    for (const child of byParent.get(id) ?? []) visit(child);
    order.push(id);
  })(pid);
  return order;
}

/**
 * Test-file child processes under `rootPid` that outlived their limit.
 * `limits` maps a test-file path, as passed to `node --test`, to its limit in
 * ms; a process is a test file's runner when its command line ends with that
 * path -- except the `node --test` process itself, whose own command line
 * lists the files too.
 */
export function findOverdue(procs, rootPid, limits) {
  const inTree = new Set(treeOf(procs, rootPid));
  // A descendant cannot be older than the run that spawned it. `ps` can print a
  // garbage start time for a process caught mid-fork (an etime of hundreds of
  // millions of days); such an elapsed value is unknown, never a timeout.
  const root = procs.find((p) => p.pid === rootPid);
  const maxPlausibleMs = Number.isFinite(root?.elapsedMs) ? root.elapsedMs + ELAPSED_SLACK_MS : MAX_ELAPSED_MS;
  const overdue = [];
  for (const p of procs) {
    if (p.pid === rootPid || !inTree.has(p.pid) || !Number.isFinite(p.elapsedMs) || p.elapsedMs > maxPlausibleMs || /\s--test\s/.test(p.args)) continue;
    for (const [file, limitMs] of Object.entries(limits)) {
      if (p.args.endsWith(` ${file}`) && p.elapsedMs >= limitMs) {
        overdue.push({ pid: p.pid, file, elapsedMs: p.elapsedMs, limitMs });
        break;
      }
    }
  }
  return overdue;
}

/** Whether the launcher's recorded identity may still be running ('unknown' counts: only a proven death ends the run). */
const isAlive = (record) => judge(record) !== 'dead';

/** What to do about a process the door would not stop: the line every refusal message ends with. */
export const refusalAdvice = (pid, why) => `pid ${pid}: ${why}; check \`ps -o pid,lstart,args -p ${pid}\`, then stop it`;

/**
 * A run's own dirs after its launcher was killed: stop, by the identity the door's scan read, every process whose
 * environment names one of `dirs` as its temp root or fixture root (only this run's tests inherit those), then remove the dirs.
 * Another run has dirs of its own, so it is never matched. Where the door cannot scan (macOS) only the removal happens.
 * A refused stop is printed with a next step. A linked checkout of `repo` that a test registered inside those dirs
 * leaves a registration behind once the dirs go, and every later worktree add there refuses; it is pruned through
 * the Worktree port. Returns those registrations, each with `removed` (and `reason` when it stayed).
 */
export function reapRunDirs(dirs, { repo = null, prune = undefined } = {}) {
  const envKeys = ['TMPDIR', 'FGOS_TEST_FIXTURE_ROOT'];
  let views;
  try { views = scan({ envKeys }); } catch (err) { views = 'unsupported'; console.error(`test-file-watchdog: cannot scan the process table: ${err.message}`); }
  for (const dir of dirs) {
    try {
      const { left } = stopProcessesInside(dir, { envKeys, views, graceMs: 500 });
      for (const view of left) console.error(`test-file-watchdog: ${refusalAdvice(view.pid, 'still running after the stop')}`);
    } catch (err) {
      console.error(`test-file-watchdog: ${err.message}`);
    }
  }
  // Read before the dirs go: the roots are compared by their real paths.
  const registrations = repo ? worktreeRegistrationsUnder(repo, dirs) : [];
  for (const dir of dirs) {
    try { fs.rmSync(dir, { recursive: true, force: true, maxRetries: 3 }); } catch { /* best effort */ }
  }
  return registrations.length ? pruneMissingCheckouts(repo, registrations, { prune }) : [];
}

function snapshot() {
  return parsePs(execFileSync('ps', ['-A', '-o', 'pid=,ppid=,etime=,args='], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }));
}

/**
 * Kills the tree under `rootPid` that `procs` showed. Every member is observed first (its identity), then the table is
 * read again: only a member still in the tree, with the command line it had (and the root with its parent), is signalled, and by the identity
 * observed, so a pid that went to another process in between receives nothing. Returns the refusals as advice lines.
 */
function killTree(procs, rootPid) {
  const seen = treeOf(procs, rootPid).map((pid) => ({ pid, view: observe(pid) })).filter(({ view }) => view.kind === 'live');
  const after = snapshot();
  const still = new Map(treeOf(after, rootPid).map((pid) => [pid, after.find((p) => p.pid === pid)?.args]));
  const refused = [];
  for (const { pid, view } of seen) {
    if (still.get(pid) === undefined || still.get(pid) !== procs.find((p) => p.pid === pid)?.args) continue;
    // The root keeps its parent: a pid reused for another process would almost surely have a different one.
    if (pid === rootPid && after.find((p) => p.pid === pid)?.ppid !== procs.find((p) => p.pid === pid)?.ppid) continue;
    const outcome = signalByIdentity(view, 'kill');
    if (!['sent', 'not-found', 'identity-mismatch'].includes(outcome)) refused.push(refusalAdvice(pid, `the kill was refused (${outcome})`));
  }
  return refused;
}

function main(argv) {
  const opts = Object.fromEntries(
    argv.map((a) => /^--([a-z-]+)=(.*)$/.exec(a)).filter(Boolean).map((m) => [m[1], m[2]]),
  );
  const parentPid = Number(opts.parent);
  // The launcher's own identity, taken by the launcher: a pid alone cannot say it is still that process.
  let parentRecord = null;
  try { parentRecord = JSON.parse(opts['parent-record'] ?? 'null'); } catch { /* refused below */ }
  const pollMs = Number(opts['poll-ms']);
  // The run dirs to remove if the launcher is killed; absent when the caller keeps them.
  const cleanDirs = opts.clean ? JSON.parse(opts.clean) : [];
  // The launcher blocks in spawnSync and cannot run a signal handler, so this sibling does its cleanup.
  const launcherGone = () => {
    for (const { name, checkout, removed, reason } of reapRunDirs(cleanDirs, { repo: opts.repo || null })) {
      console.error(`test-file-watchdog: registration ${name} (${checkout}) ${removed ? 'removed' : `still registered: ${reason}`}`);
    }
    process.exit(0);
  };
  const limits = JSON.parse(fs.readFileSync(opts.limits, 'utf8'));
  if (!Number.isInteger(parentPid) || !(pollMs > 0) || !opts.out || parentRecord?.pid !== parentPid) {
    console.error('test-file-watchdog: need --parent=<pid> --parent-record=<json> --poll-ms=<n> --limits=<json> --out=<file>');
    process.exit(2);
  }
  // A time limit that cannot kill is not a time limit: refuse to start where the door is unavailable.
  try { judge(parentRecord); } catch (err) {
    const failed = `process door unavailable, no time limit would hold: ${err.message}`;
    console.error(`test-file-watchdog: ${failed}`);
    fs.appendFileSync(opts.out, `${JSON.stringify({ failed })}\n`);
    process.exit(2);
  }
  // The launcher waits for this line before it starts a single test.
  fs.appendFileSync(opts.out, `${JSON.stringify({ ready: true })}\n`);
  const reported = new Set();
  const told = new Set();
  const timer = setInterval(() => {
    if (!isAlive(parentRecord)) launcherGone();
    let procs;
    try {
      procs = snapshot();
    } catch (err) {
      console.error(`test-file-watchdog: cannot read the process table: ${err.message}`);
      return;
    }
    for (const hit of findOverdue(procs, parentPid, limits)) {
      // Killing the file can finish node --test immediately. Publish first:
      // its caller stops us, reads this journal, and removes the temp dir.
      // A file whose kill was refused stays overdue; it is published once and retried each poll.
      if (!reported.has(hit.pid)) {
        reported.add(hit.pid);
        fs.appendFileSync(opts.out, `${JSON.stringify(hit)}\n`);
      }
      let refused;
      try { refused = killTree(procs, hit.pid); } catch (err) { refused = [refusalAdvice(hit.pid, `the kill failed (${err.message})`)]; }
      // Each refusal is said once, to the console and to the journal; the file stays overdue and is tried again next poll.
      const fresh = refused.filter((line) => !told.has(line));
      for (const line of fresh) { told.add(line); console.error(`test-file-watchdog: ${line}`); }
      if (fresh.length) fs.appendFileSync(opts.out, `${JSON.stringify({ pid: hit.pid, refused: fresh })}\n`);
    }
  }, pollMs);
  // The launcher stops this process with SIGTERM while it is still alive; a signal sent to the whole
  // group (or SIGINT/SIGHUP from a terminal) also reaches here after the launcher is dead.
  process.on('SIGTERM', () => {
    clearInterval(timer);
    if (isAlive(parentRecord)) process.exit(0);
    launcherGone();
  });
  for (const signal of ['SIGINT', 'SIGHUP']) process.on(signal, () => { clearInterval(timer); launcherGone(); });
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url))) {
  main(process.argv.slice(2));
}
