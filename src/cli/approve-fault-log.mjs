// approve-fault-log.mjs — records a post-success `moveWork` failure inside
// `approve` (tsk-480), so a real, already-landed merge or already-passed
// verify is never left with zero trace just because the immediately
// following status write hits `events.lock` contention.
//
// Deliberately NOT `events.jsonl` — same reasoning as
// `invocation-fault-log.mjs`: that file is the FSM rebuild source, a pure
// diagnostic record has no business in it — and deliberately NOT sharing
// `events.lock` (CONTEXT.md D2): a plain `fs.appendFileSync` to its own
// file, so a record here can still succeed while `events.lock` stays
// contended. Never throws into its caller — a failure recording the
// failure must not mask (or replace) the original error.
//
// Simpler than `invocation-fault-log.mjs`'s own resolver: this is only ever
// called from `approve`'s local-merge/verify-only success paths, all of
// which run after `isMainWorktree`'s guard already passed — `dir` is
// guaranteed to exist by that point, so no main-checkout fallback is
// needed here.

import fs from 'node:fs';
import path from 'node:path';

export const APPROVE_FAULT_LOG_BASENAME = 'approve-post-success-faults.jsonl';

/**
 * Append one record. Returns the path written, or `null` when nothing was
 * written (the caller uses that to decide whether it can point a human at
 * a real file).
 */
export function recordApprovePostSuccessFault(dir, { id, phase, detail, mergedSha, mergedInto }) {
  try {
    const logDir = path.join(dir, 'logs');
    const logPath = path.join(logDir, APPROVE_FAULT_LOG_BASENAME);
    const record = { ts: new Date().toISOString(), id, phase };
    if (detail !== undefined) record.detail = detail;
    if (mergedSha !== undefined) record.mergedSha = mergedSha;
    if (mergedInto !== undefined) record.mergedInto = mergedInto;
    fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(logPath, `${JSON.stringify(record)}\n`);
    return logPath;
  } catch {
    return null;
  }
}
