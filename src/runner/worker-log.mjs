// worker-log.mjs — the sole writer of `.fgos/logs/` (per D3, worker-dispatch-log).
//
// A narrow sibling facade to store.mjs, deliberately NOT folded into it: the
// store's single write door is scoped to the event-sourced FSM truth
// (`events.jsonl`) and its derived view (`state.json`) — structured, replayable
// domain events with CAS semantics. Worker dispatch output is unstructured
// operational text, a different concern. This module is the one writer of
// `.fgos/logs/*`, preserving single-door's spirit (one writer per resource)
// without touching the FSM contract.
//
// `.fgos/logs/` is git-ignored (per D4): worker-authored stdout/stderr is
// persisted locally so an orchestrator can recover what a worker actually did
// after the console tail scrolls past — but it never lands in a committed/
// git-tracked path (the half of the security panel's OUTPUT DISCIPLINE that
// still holds exactly, per D1).
//
// LIVE TEE (P39): appendWorkerLogChunk writes each stdout/stderr chunk to the
// same file AS IT ARRIVES, so `tail -f` shows a worker's output in real time
// while it is still running. appendWorkerLog's terminal block is unchanged —
// still the one write after dispatch settles, still the recovery record for
// every outcome including timeout/spawn-fail. Both go through this same sole
// writer of `.fgos/logs/`.

import fs from 'node:fs';
import path from 'node:path';

function section(label, text) {
  const body = typeof text === 'string' && text.trimEnd() !== '' ? text.trimEnd() : '(empty)';
  return `--- ${label} ---\n${body}`;
}

/** Render one readable, timestamped block. Every field is optional and
 * omitted from the header when absent, so a rich worker exit (tier/model/
 * status/stdout/stderr) and a bare WorktreeError (errorClass + message only)
 * both render without throwing on missing fields. */
function formatEntry(workId, entry) {
  const { attempt, errorClass, message, tier, model, status, signal, stdout, stderr } = entry;

  const header = [`work ${workId}`];
  if (attempt != null) header.push(`attempt ${attempt}`);
  if (errorClass) header.push(errorClass);
  if (tier != null && model != null) header.push(`tier ${tier} -> ${model}`);
  else if (tier != null) header.push(`tier ${tier}`);
  if (status != null) header.push(`exit ${status}`);
  if (signal != null) header.push(`signal ${signal}`);

  const lines = [`=== ${new Date().toISOString()} | ${header.join(' | ')} ===`];
  if (message) lines.push(`message: ${message}`);
  lines.push(section('STDOUT', stdout));
  lines.push(section('STDERR', stderr));
  return `${lines.join('\n')}\n\n`;
}

/**
 * Append one dispatch-outcome block to `.fgos/logs/<workId>.log`, creating the
 * logs directory on first write. Append-only: a retried item's later attempts
 * add fresh blocks to the same file rather than overwriting the first. Returns
 * the resolved log path, or `null` if the write failed.
 *
 * NEVER THROWS (review finding F-P1-1, review-20260717-daily-batch): this is
 * pure git-ignored observability, never load-bearing on the dispatch outcome
 * (per D1/D3). A real I/O failure (disk full, EACCES, read-only `.fgos/`)
 * must not abort an otherwise-successful dispatch, and must not mask the real
 * `DispatchError`/`WorktreeError` a caller is already handling when this is
 * called from a catch block. Failure degrades to a best-effort no-op.
 */
export function appendWorkerLog(dir, workId, entry = {}) {
  try {
    const logsDir = path.join(dir, 'logs');
    fs.mkdirSync(logsDir, { recursive: true });
    const logPath = path.join(logsDir, `${workId}.log`);
    fs.appendFileSync(logPath, formatEntry(workId, entry), 'utf8');
    return logPath;
  } catch {
    return null;
  }
}

/**
 * Append one raw stdout/stderr chunk to `.fgos/logs/<workId>.log` AS IT
 * ARRIVES — the live-tee counterpart to `appendWorkerLog`'s terminal block
 * (per P39, worker-dispatch-log's one-door extended, not replaced). Written
 * unwrapped (no timestamp/header, just the bytes) so `tail -f` reads exactly
 * what the worker is producing right now; the terminal block appended later
 * by `appendWorkerLog` is unchanged and still lands after every chunk. Each
 * work item writes only its own file, so N items dispatched concurrently
 * never interleave into each other's log.
 *
 * Synchronous (`fs.appendFileSync`), same discipline as `appendWorkerLog`:
 * creates the logs dir on first write and NEVER throws (F-P1-1) — a chunk
 * handler that threw would crash the whole dispatch, and this is pure
 * git-ignored observability, never load-bearing on the outcome.
 */
export function appendWorkerLogChunk(dir, workId, chunk) {
  if (!chunk) return null;
  try {
    const logsDir = path.join(dir, 'logs');
    fs.mkdirSync(logsDir, { recursive: true });
    const logPath = path.join(logsDir, `${workId}.log`);
    fs.appendFileSync(logPath, chunk, 'utf8');
    return logPath;
  } catch {
    return null;
  }
}
