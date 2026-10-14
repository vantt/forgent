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

import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

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

function isAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err.code === 'EPERM';
  }
}

function snapshot() {
  return parsePs(execFileSync('ps', ['-A', '-o', 'pid=,ppid=,etime=,args='], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }));
}

function killTree(procs, pid) {
  for (const id of treeOf(procs, pid)) {
    try {
      process.kill(id, 'SIGKILL');
    } catch {
      // already gone
    }
  }
}

function main(argv) {
  const opts = Object.fromEntries(
    argv.map((a) => /^--([a-z-]+)=(.*)$/.exec(a)).filter(Boolean).map((m) => [m[1], m[2]]),
  );
  const parentPid = Number(opts.parent);
  const pollMs = Number(opts['poll-ms']);
  const limits = JSON.parse(fs.readFileSync(opts.limits, 'utf8'));
  if (!Number.isInteger(parentPid) || !(pollMs > 0) || !opts.out) {
    console.error('test-file-watchdog: need --parent=<pid> --poll-ms=<n> --limits=<json> --out=<file>');
    process.exit(2);
  }
  const timer = setInterval(() => {
    if (!isAlive(parentPid)) process.exit(0);
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
      fs.appendFileSync(opts.out, `${JSON.stringify(hit)}\n`);
      killTree(procs, hit.pid);
    }
  }, pollMs);
  process.on('SIGTERM', () => {
    clearInterval(timer);
    process.exit(0);
  });
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url))) {
  main(process.argv.slice(2));
}
