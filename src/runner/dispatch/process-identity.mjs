// process-identity.mjs — pure /proc reads for cross-checking a recorded
// process identity against the live process table (boot id + start time).
// fs-only leaf: no child_process, no spawn/kill, so any module that imports
// this (including run-lock.mjs, a banned-from-process-control ledger writer
// per test/runner/dispatch-reconciliation-import-graph.test.mjs) never pulls
// a process-control adapter into its own import graph. Hoisted out of
// detached-run-supervisor.mjs (Phase 02 H1), which re-exports both names
// unchanged so its own existing importers are unaffected.
//
// `resolveHolderLiveness` below is the data-plane half of run-lock.mjs's own
// judge of the same name (dispatch-engine-liveness-hardening Phase 1):
// the bootId/processStartTime comparison, with ZERO process-control
// dependency of its own. The control-plane half -- "is this pid currently
// alive" -- is legitimately caller-specific (run-lock.mjs's own
// isProcessAlive uses `process.kill(pid, 0)`, itself a banned call pattern
// for this leaf) and is deliberately NOT reproduced here: callers compute it
// however they already do and pass the boolean in. run-lock.mjs's own
// `resolveHolderLiveness(holder)` is now a thin backward-compatible wrapper
// around this function.

import fs from 'node:fs';

export function getBootId() {
  try {
    return fs.readFileSync('/proc/sys/kernel/random/boot_id', 'utf8').trim();
  } catch {
    return 'unknown-boot';
  }
}

export function getProcessStartTime(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return null;
  try {
    const stat = fs.readFileSync(`/proc/${pid}/stat`, 'utf8');
    const lastParen = stat.lastIndexOf(')');
    if (lastParen !== -1) {
      const rest = stat.slice(lastParen + 2).split(' ');
      return rest[19] || null;
    }
  } catch {}
  return null;
}

/** Whether a recorded holder is still the live process that acquired
 * something, given `isAlive` -- the caller's own already-computed pid
 * liveness fact (this function performs no process-control call itself).
 * Fails closed toward 'held' whenever that cannot be disproven:
 *  - no pid recorded -> 'dead'.
 *  - bootId recorded and differs from the current boot -> 'dead' (the host
 *    rebooted since acquisition; that pid cannot still be this holder).
 *  - `isAlive` is false -> 'dead'.
 *  - pid alive but no recorded processStartTime (legacy holder record) ->
 *    'held' (nothing to cross-check against; stay conservative).
 *  - pid alive but /proc/<pid>/stat unreadable -> 'held' (unknown is not
 *    dead).
 *  - pid alive and processStartTime matches -> 'held' (same process).
 *  - pid alive but processStartTime differs -> 'dead' (pid was reused by a
 *    different process). */
export function resolveHolderLiveness(holder, isAlive) {
  if (!holder || !Number.isInteger(holder.pid)) return 'dead';
  const currentBootId = getBootId();
  if (holder.bootId && currentBootId && currentBootId !== 'unknown-boot' && holder.bootId !== currentBootId) {
    return 'dead';
  }
  if (!isAlive) return 'dead';
  if (!holder.processStartTime) return 'held';
  const liveStartTime = getProcessStartTime(holder.pid);
  if (liveStartTime === null) return 'held';
  return liveStartTime === holder.processStartTime ? 'held' : 'dead';
}
