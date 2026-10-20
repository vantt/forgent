// src/workflow/case-lock.mjs — the `advance` lock of a Workflow case: acquire, hold, liveness
// Architecture guard: MUST NOT import src/state/** or src/runner/coordination/** (A4 boundary)

import fs from 'node:fs';
import path from 'node:path';

import { RunnerConfigError } from '../runner/dispatch/config.mjs';
import { acquireSync, createLockScope, lockHolders, probe, resolveLock } from '../holder-lock/index.mjs';
import { createAdvanceHold, recoverWorkflowLedgerTail } from './store.mjs';
import { drainCaseInbox } from './case-runtime.mjs';

export const PROGRESS_LINE_LIMIT = 300;
// Set by the detached child that advances a case, so only it prints progress to its log.
export const ADVANCE_DETACHED_ENV = 'FGOS_WORKFLOW_ADVANCE_DETACHED';

// The advance lock is a kernel mutex on `<runDir>/locks/advance.lock` (src/holder-lock): the kernel
// lets one process advance a run at a time and releases it the moment that process dies, so a holder
// killed mid-advance never leaves the run stuck.
export function workflowRunDirOf(mainRoot, workflowRunId) {
  return path.join(mainRoot, '.fgos', 'workflow-runs', workflowRunId);
}

function advanceLockParams(mainRoot, workflowRunId) {
  return { fgosDir: path.join(mainRoot, '.fgos'), workflowRunDir: workflowRunDirOf(mainRoot, workflowRunId) };
}

/** Pid of a process holding the run's advance lock, or null when the kernel cannot list one. */
function advanceHolderPid(params) {
  const holders = lockHolders('advance', params);
  return holders.kind === 'list' && holders.pids.length > 0 ? holders.pids[0] : null;
}

/** `{ pid }` of the process currently advancing the run (pid null when unlistable), null when nothing holds it. */
function liveAdvanceHolder(mainRoot, workflowRunId) {
  const params = advanceLockParams(mainRoot, workflowRunId);
  // A run whose lock file was never created was never advanced under this lock: nothing to probe.
  if (!fs.existsSync(resolveLock('advance', params).v3Path)) return null;
  // The kernel's holder list takes no lock, so a status read never makes a concurrent advance see
  // the lock held; the probe, which does, is only for a platform that cannot list holders.
  const holders = lockHolders('advance', params);
  if (holders.kind === 'list') return holders.pids.length > 0 ? { pid: holders.pids[0] } : null;
  return probe('advance', params).result === 'free' ? null : { pid: null };
}

function advanceRefusal(workflowRunId, pid) {
  const holder = pid ? `process ${pid}` : 'another process';
  return new RunnerConfigError(
    `Workflow run "${workflowRunId}" is already being advanced by ${holder}; read progress with "fgos workflow status ${workflowRunId}" and retry once it parks or finishes`,
  );
}

/**
 * Take the run's `advance` once. Returns the hold the ledger demands for every append, or null when
 * another process holds it. A ledger that ends in an unfinished line (an append cut short by a crash)
 * is repaired here, by the one process allowed to, and whatever was left beside the ledger while nobody
 * held `advance` (settles, gate answers) is folded in, before anything reads or appends.
 */
export function tryAcquireAdvanceLock(mainRoot, workflowRunId) {
  const params = advanceLockParams(mainRoot, workflowRunId);
  // Taking the lock creates its directory; never bring back a run that was deleted.
  if (!fs.existsSync(params.workflowRunDir)) throw new RunnerConfigError(`Workflow run "${workflowRunId}" not found`);
  const res = acquireSync(createLockScope('advance'), 'advance', params);
  if (res.result !== 'acquired') return null;
  const hold = createAdvanceHold({ workflowRunId, release: () => res.handle.release() });
  try {
    recoverWorkflowLedgerTail({ repoRoot: mainRoot, workflowRunId, hold });
    drainCaseInbox({ mainRoot, caseId: workflowRunId, hold });
  } catch (err) {
    hold.release();
    throw err;
  }
  return hold;
}

/** Hold the run for this process while it advances, so two processes never advance one run at once; refuses when it is held. */
export function acquireAdvanceLock(mainRoot, workflowRunId) {
  const hold = tryAcquireAdvanceLock(mainRoot, workflowRunId);
  if (hold === null) throw advanceRefusal(workflowRunId, advanceHolderPid(advanceLockParams(mainRoot, workflowRunId)));
  return hold;
}

const ADVANCE_TAIL_LINES = 20;
const ADVANCE_TAIL_READ_BYTES = 64 * 1024;
// A recorded run whose advance has not taken the lock yet is still starting; past this age with no
// live holder it is a dead child.
const ADVANCE_STALE_MS = 30 * 1000;

function tailAdvanceLog(logPath) {
  let fd;
  try {
    fd = fs.openSync(logPath, 'r');
    const { size } = fs.fstatSync(fd);
    const length = Math.min(size, ADVANCE_TAIL_READ_BYTES);
    const buffer = Buffer.alloc(length);
    fs.readSync(fd, buffer, 0, length, size - length);
    return buffer
      .toString('utf8')
      .split('\n')
      .filter((line) => line.length > 0)
      .slice(-ADVANCE_TAIL_LINES)
      .map((line) => line.slice(0, PROGRESS_LINE_LIMIT));
  } catch {
    return [];
  } finally {
    if (fd !== undefined) fs.closeSync(fd);
  }
}

/** What the detached advance of a run is doing: liveness from the lock holder, plus its log tail. */
export function advanceReport(mainRoot, workflowRunId, state, events) {
  const runDir = workflowRunDirOf(mainRoot, workflowRunId);
  const holder = liveAdvanceHolder(mainRoot, workflowRunId);
  const logPath = path.join(runDir, 'advance.log');
  const advance = { running: holder !== null, pid: holder?.pid ?? null, logPath };
  if (state.status !== 'completed') {
    const lastLines = tailAdvanceLog(logPath);
    if (lastLines.length > 0) advance.lastLines = lastLines;
  }
  const lastTs = Date.parse(events[events.length - 1].ts);
  if (state.status === 'running' && holder === null && Date.now() - lastTs > ADVANCE_STALE_MS) {
    advance.hint = `The advance of this run is not running and nothing was recorded for a while; continue it with: fgos workflow resume ${workflowRunId}`;
  }
  return advance;
}

/** Run `advance(hold)` while this process holds the run's advance lock. */
export async function withAdvanceLock(mainRoot, workflowRunId, advance) {
  const hold = acquireAdvanceLock(mainRoot, workflowRunId);
  try {
    return await advance(hold);
  } finally {
    hold.release();
  }
}

/** Run `action(hold)` while this process holds the run's advance lock; for a caller that does not advance. */
export function withAdvanceLockSync(mainRoot, workflowRunId, action) {
  const hold = acquireAdvanceLock(mainRoot, workflowRunId);
  try {
    return action(hold);
  } finally {
    hold.release();
  }
}
