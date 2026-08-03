// judge-fail-log.mjs — the sole writer of judge fail-safe debug entries
// under `.fgos/logs/` (tsk-5d2 D1/D2/D3).
//
// A narrow sibling facade, same reasoning as worker-log.mjs's own D3
// SIBLING FACADE comment (store.mjs): judgeDiscovery/judgeDecompose's
// fail-safe fold-in (discovery.mjs/decompose.mjs's module headers) is
// designed to never throw and never change the verdict a normal caller
// receives — but today it also discards every real detail of WHY a
// fail-safe branch fired. This module adds a debug-only channel for that
// detail, entirely separate from the verdict contract. Reuses the same
// `.fgos/logs/` location and never-throws/git-ignored discipline
// worker-log.mjs already established (D1) rather than the
// docs/history/<docsRef>/ convention (scout-notes.md) — the exact repro
// case (tsk-sq9) carried no docsRef, so a docsRef-gated log would never
// have fired for it.
//
// One file per work item (`<id>-judge-fail.log`), distinct from
// worker-log.mjs's own `<workId>.log` — a judge fail-safe trace is a
// different concern from worker dispatch stdout/stderr, and reusing the
// exact same filename risks colliding with a real dispatch log for the
// same id.

import fs from 'node:fs';
import path from 'node:path';
import { resolveLogsDir } from '../runner/paths.mjs';

// Mirrors judge-executor.mjs's own SCOUT_OUTPUT_MAX_CHARS precedent — caps
// any raw stdout/stderr/stack field so one runaway attempt can never blow
// up the log file.
const RAW_TEXT_MAX_CHARS = 4000;

function truncate(text) {
  return text.length > RAW_TEXT_MAX_CHARS ? `${text.slice(0, RAW_TEXT_MAX_CHARS)}…` : text;
}

function section(label, text) {
  const body = typeof text === 'string' && text.trim() !== '' ? truncate(text) : '(empty)';
  return `--- ${label} ---\n${body}`;
}

// Renders one readable, timestamped block per distinct fail-safe branch
// (tsk-5d2 D3) — `reason` names which branch fired, and each branch's own
// detail fields are rendered only for that branch, so a reader never has
// to guess which fields apply.
function formatEntry(id, entry) {
  const { reason } = entry;
  const lines = [`=== ${new Date().toISOString()} | item ${id} | reason ${reason ?? 'unknown'} ===`];

  if (reason === 'outer-exception') {
    lines.push(`message: ${entry.message ?? '(no message)'}`);
    lines.push(section('STACK', entry.stack));
  } else if (reason === 'non-parse-exit') {
    if (entry.attempt != null) lines.push(`attempt: ${entry.attempt}`);
    if (entry.status != null) lines.push(`exit status: ${entry.status}`);
    if (entry.signal != null) lines.push(`signal: ${entry.signal}`);
    if (entry.error) lines.push(`spawn error: ${entry.error}`);
    lines.push(section('STDERR', entry.stderr));
  } else if (reason === 'parse-exhausted') {
    const attempts = Array.isArray(entry.attempts) ? entry.attempts : [];
    for (const a of attempts) {
      lines.push(section(`ATTEMPT ${a.attempt} STDOUT`, a.stdout));
    }
  } else if (reason === 'shape-invalid') {
    lines.push(section('PARSED VERDICT', entry.verdict));
  }

  return `${lines.join('\n')}\n\n`;
}

/**
 * Append one fail-safe debug block to `.fgos/logs/<id>-judge-fail.log`,
 * creating the logs directory on first write. Append-only: a later fail-safe
 * hit on the same item adds a fresh block rather than overwriting the file.
 *
 * NEVER THROWS (same F-P1-1 discipline `appendWorkerLog` already documents):
 * this is pure git-ignored observability, never load-bearing on the verdict
 * judgeDiscovery/judgeDecompose already computed. A missing/invalid `id`
 * (e.g. a unit-test caller that never threads one through) degrades to a
 * best-effort no-op, same as any other I/O failure here.
 */
export function appendJudgeFailLog(fgosDir, id, entry = {}) {
  if (typeof id !== 'string' || !id.trim()) return null;
  try {
    const logsDir = resolveLogsDir(fgosDir);
    fs.mkdirSync(logsDir, { recursive: true });
    const logPath = path.join(logsDir, `${id}-judge-fail.log`);
    fs.appendFileSync(logPath, formatEntry(id, entry), 'utf8');
    return logPath;
  } catch {
    return null;
  }
}
