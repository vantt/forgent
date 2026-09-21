// process-identity.mjs — pure /proc reads for cross-checking a recorded
// process identity against the live process table (boot id + start time).
// fs-only leaf: no child_process, no spawn/kill, so any module that imports
// this (including run-lock.mjs, a banned-from-process-control ledger writer
// per test/runner/dispatch-reconciliation-import-graph.test.mjs) never pulls
// a process-control adapter into its own import graph. Hoisted out of
// cli-spawn-supervisor.mjs (Phase 02 H1), which re-exports both names
// unchanged so its own existing importers are unaffected.

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
