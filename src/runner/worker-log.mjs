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
 * the resolved log path.
 */
export function appendWorkerLog(dir, workId, entry = {}) {
  const logsDir = path.join(dir, 'logs');
  fs.mkdirSync(logsDir, { recursive: true });
  const logPath = path.join(logsDir, `${workId}.log`);
  fs.appendFileSync(logPath, formatEntry(workId, entry), 'utf8');
  return logPath;
}
