// process-identity.mjs — the Node leaf of process facts: judge a recorded
// process identity against the live process table, with the same rules and
// the same vectors as the Rust crate (`packages/process/rust`,
// `packages/process/contracts/process-facts.judge.v1.json`). There is one
// judgement table; this file and `facts::judge` are two readers of it.
//
// fs-only leaf plus the one liveness probe the reconcile import graph
// allows (`process.kill(pid, 0)` delivers no signal: it asks whether a pid
// exists; see test/runner/dispatch-reconciliation-import-graph.test.mjs).
// No child_process, no spawn, no real signal, so run-lock.mjs and
// provider-capacity.mjs (banned from process control) can import it.
//
// `resolveHolderLiveness` is the adapter every lock keeps calling: it maps
// the judge's verdict onto the two answers a lock needs, `dead` (reclaim)
// or `held` (do not). `alive` and `unknown` are both `held`: a record this
// observer cannot disprove is never reclaimed. A record without a pid is
// therefore `held`, where it used to be `dead`; a zombie is `dead`, where
// `process.kill(pid, 0)` alone used to say alive.

import fs from 'node:fs';
import os from 'node:os';

// The inode of the initial PID namespace is fixed by the kernel
// (PROC_PID_INIT_INO), so "am I in the initial namespace" is one compare.
const INIT_PID_NS = 'pid:[4026531836]';

export function getBootId() {
  try {
    return fs.readFileSync('/proc/sys/kernel/random/boot_id', 'utf8').trim();
  } catch {
    return 'unknown-boot';
  }
}

/** `[state, startTime]` from one /proc/<pid>/stat line, or null. The command
 * name sits in parentheses and may hold spaces, so fields are counted from
 * the last `)`: state first, start time twentieth. */
function parseProcStat(stat) {
  const lastParen = stat.lastIndexOf(')');
  if (lastParen === -1) return null;
  const rest = stat.slice(lastParen + 2).split(' ');
  if (!rest[0] || !rest[19]) return null;
  return [rest[0], rest[19]];
}

export function getProcessStartTime(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return null;
  try {
    const parsed = parseProcStat(fs.readFileSync(`/proc/${pid}/stat`, 'utf8'));
    return parsed ? parsed[1] : null;
  } catch {}
  return null;
}

/** The PID namespace this process runs in: `pid:[<inode>]` on Linux, `none`
 * where there are no namespaces, `unknown` when Linux refused the read. */
export function getPidNs() {
  if (process.platform !== 'linux') return 'none';
  try {
    return fs.readlinkSync('/proc/self/ns/pid');
  } catch {
    return 'unknown';
  }
}

/** Does any process own `pid`? EPERM means it exists under another user.
 * Signal 0 is delivered to nothing; this is the one probe every lock's own
 * `isPidAlive` copy performs, kept here so those copies can go. */
export function pidExists(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err.code === 'EPERM';
  }
}

/** The observer facts of this process: who is judging. `inInitPidNs` is
 * false whenever the namespace could not be read, so a sandboxed observer
 * never cleans a host record by accident. */
export function localObserver() {
  const bootId = getBootId();
  const pidNs = getPidNs();
  return {
    host: os.hostname(),
    bootId: bootId === 'unknown-boot' ? null : bootId,
    pidNs,
    inInitPidNs: pidNs === 'none' || pidNs === INIT_PID_NS,
  };
}

/** One look at `pid` in the process table: `{kind: 'absent' | 'zombie' |
 * 'live' | 'unreadable', startTime?, cause?}`. `isAlive`, when given, is the
 * caller's own existence fact (every lock already computes it); otherwise
 * `pidExists` decides. A pid that exists but whose stat cannot be read (a
 * hidden /proc, another OS) is `unreadable`, never absent. */
export function observeProcess(pid, isAlive) {
  const exists = isAlive === undefined ? pidExists(pid) : Boolean(isAlive);
  if (!exists) return { kind: 'absent' };
  let stat;
  try {
    stat = fs.readFileSync(`/proc/${pid}/stat`, 'utf8');
  } catch {
    return { kind: 'unreadable', cause: 'permission' };
  }
  const parsed = parseProcStat(stat);
  if (!parsed) return { kind: 'unreadable', cause: 'driver-missing' };
  const [state, startTime] = parsed;
  if (state === 'Z' || state === 'X') return { kind: 'zombie' };
  return { kind: 'live', startTime };
}

/** Judge `record` -> 'alive' | 'dead' | 'unknown', as `observer` sees the
 * world through `observe(pid)`. Same order as the Rust judge, each step
 * pinned by a vector: another host or another PID namespace says nothing
 * about this table (a dead anchor is the one exception); an observer outside
 * the initial namespace never judges a record without a namespace; a boot id
 * that differs from the running kernel's is a reboot (a recorded
 * `unknown-boot`, what `getBootId` writes when it cannot read one, names no
 * boot and is skipped); a record without a positive-integer pid that fits a
 * pid proves nothing; then the table decides: absent or zombie is dead, a
 * matching start time is alive, a different one is a reused pid, an
 * unreadable one is unknown. `processStartTime` is read as `startTime` (the
 * field name records carried before the tuple existed). */
export function judge(record, { observer = localObserver(), observe = (pid) => observeProcess(pid) } = {}) {
  if (!record || typeof record !== 'object') return 'unknown';
  if (typeof record.host === 'string' && record.host !== observer.host) return 'unknown';
  if (typeof record.pidNs === 'string') {
    if (record.pidNs !== observer.pidNs) {
      return record.anchor && judge(record.anchor, { observer, observe }) === 'dead' ? 'dead' : 'unknown';
    }
  } else if (!observer.inInitPidNs) {
    return 'unknown';
  }
  if (typeof record.bootId === 'string' && record.bootId && record.bootId !== 'unknown-boot' && observer.bootId && record.bootId !== observer.bootId) {
    return 'dead';
  }
  const pid = record.pid;
  if (!Number.isInteger(pid) || pid <= 0 || pid > 0xffff_ffff) return 'unknown';
  const seen = observe(pid);
  if (seen.kind === 'absent' || seen.kind === 'zombie') return 'dead';
  if (seen.kind !== 'live') return 'unknown';
  const recorded = record.startTime ?? record.processStartTime;
  if (recorded === undefined || recorded === null || recorded === '') return 'unknown';
  return String(recorded) === seen.startTime ? 'alive' : 'dead';
}

/** Whether a recorded holder still holds what it acquired: 'dead' only when
 * the judge proves it, 'held' otherwise (alive, or nothing provable from
 * here). `isAlive` is the caller's own existence fact for the holder's pid,
 * as every lock already computes it; left out, `pidExists` decides. It
 * speaks only for that pid: an anchor the judge looks up is observed afresh. */
export function resolveHolderLiveness(holder, isAlive) {
  const holderPid = holder && typeof holder === 'object' ? holder.pid : undefined;
  const verdict = judge(holder, { observe: (pid) => observeProcess(pid, pid === holderPid ? isAlive : undefined) });
  return verdict === 'dead' ? 'dead' : 'held';
}
