// The attention view: the runs of the whole project that need a person. Kept out of runtime-inspection.mjs on
// purpose: it reads the execution outcome table (outcome.mjs, unit-run-history.mjs), and the reconcile import
// closure is an exact list that must not load the execution stack. Only the inspect verb imports this module.
import fs from 'node:fs';
import path from 'node:path';
import { attemptLockState } from './visibility-session.mjs';
import { allRuns, json, parseAttentionSince, result, workspace } from './runtime-inspection.mjs';
import { outcomeOfRunResult } from '../execution/unit-run-history.mjs';
import { ERROR_OUTCOMES } from '../execution/outcome.mjs';

const toMs = (value) => { const ms = typeof value === 'string' ? Date.parse(value) : NaN; return Number.isFinite(ms) ? ms : null; };
const seatGroup = (assignmentId) => String(assignmentId ?? '').replace(/-fb\d+(?=\/|$)/, '');

// The row a settled attempt earns, or null. Only an attempt that ended in error alerts (the outcome module's
// ERROR_OUTCOMES); `pass` and `findings` are verdicts, and findings belong to the unit's outcome, not to a row of
// the attempt. Early ends name themselves in the receipt reason.
function settledAttention(l, terminal) {
  const outcome = outcomeOfRunResult(terminal.value);
  if (!ERROR_OUTCOMES.includes(outcome)) return null;
  const receiptReason = String(json(path.join(l.runDir, 'receipt.json'))?.reason ?? '');
  const failure = terminal.value?.classification?.failure?.code;
  const named = failure ? ` (${failure})` : '';
  if (/^terminal:needs-/.test(receiptReason)) return { kind: 'needs-human', reason: `the run stopped for a person: ${receiptReason}` };
  if (outcome === 'blocked' || outcome === 'provider-limit' || /^terminal:blocked/.test(receiptReason)) return { kind: 'blocked', reason: `blocked${receiptReason ? `: ${receiptReason}` : named || ` (${outcome})`}` };
  if (outcome === 'policy-refusal') return { kind: 'refused', reason: `refused by policy${named}` };
  return { kind: 'failed', reason: `the run failed${named}` };
}

/**
 * The runs of the whole project (every worktree) that need a person, started or settled at or after `since`.
 * Computed from the run records on each call; nothing is stored. Idle is not reported: the supervisor keeps
 * its idle clock in memory and writes no readable record of the last real screen activity, and a file time
 * is not that (the run supervisor spec, "Idle in a pane").
 *
 * A run with no result is judged by its attempt lock. Held and past its declared timeout: `past-deadline`, timed at
 * the observation, since it is late now however long ago it started. Not held: `controller-dead`, unless a resume
 * already replaced the attempt or its unit settled.
 *
 * `view(runDir)` is the caller's read of the attempt's unit state (`{ attemptState, unitState, resumeCommand }`),
 * injected so this module stays below the verbs.
 *
 * @returns {{contract:{id:string,version:number}, since:string, observedAt:string, rows:object[], idle:{state:string,reason:string}, lines:string[]}}
 */
export function attentionView(root, { since }, { now = () => new Date().toISOString(), view = () => ({}), runsCache = null } = {}) {
  const sinceMs = parseAttentionSince(since), observedAt = now(), nowMs = Date.parse(observedAt);
  const valid = allRuns(root, { runsCache }).filter((l) => !l.malformed && l.run.runId);
  const settled = valid.map((l) => ({ l, terminal: result(l) }));
  const outcomes = new Map(settled.filter(({ terminal }) => terminal.present && !terminal.corrupt).map(({ l, terminal }) => [l, outcomeOfRunResult(terminal.value)]));
  // A failed attempt that a later attempt or fallback of the same seat settled as a pass is a measure, not an alert.
  const settledAtMs = (l, terminal) => toMs(terminal.value?.settledAt) ?? (() => { try { return fs.statSync(path.join(l.runDir, 'result.json')).mtimeMs; } catch { return null; } })();
  const passedAt = settled.filter(({ l }) => outcomes.get(l) === 'pass').map(({ l, terminal }) => ({ l, atMs: settledAtMs(l, terminal) ?? 0 }));
  const recovered = (l, atMs) => passedAt.some((o) => o.l !== l && seatGroup(o.l.assignmentId) === seatGroup(l.assignmentId) && o.atMs >= atMs);
  const rows = [];
  for (const { l, terminal } of settled) {
    const startedMs = toMs(l.run.startedAt);
    let found = null, atMs = startedMs, attempt = null;
    if (terminal.present) {
      atMs = settledAtMs(l, terminal) ?? startedMs;
      found = terminal.corrupt ? { kind: 'failed', reason: 'the run result is unreadable' } : settledAttention(l, terminal);
      if (found && !terminal.corrupt && recovered(l, atMs ?? 0)) found = null;
    } else if (l.run.settlement !== 'abandoned-legacy') {
      const lock = attemptLockState(l.runDir);
      if (lock === 'held' && startedMs !== null && Number.isFinite(l.run.timeoutMs) && nowMs - startedMs > l.run.timeoutMs) {
        found = { kind: 'past-deadline', reason: `still running ${Math.round((nowMs - startedMs) / 1000)}s after its declared timeout of ${Math.round(l.run.timeoutMs / 1000)}s (from the run record, not the supervisor's clock)` };
        atMs = nowMs;
      } else if (lock === 'free' && atMs !== null && atMs >= sinceMs) {
        attempt = view(l.runDir) ?? {};
        const goneOn = attempt.attemptState === 'superseded' || attempt.unitState === 'completed' || attempt.unitState === 'failed';
        if (!goneOn) found = { kind: 'controller-dead', reason: 'no result and nobody holds the attempt lock: its controller died' };
      }
    }
    if (!found || atMs === null || atMs < sinceMs) continue;
    attempt ??= view(l.runDir) ?? {};
    const live = found.kind === 'past-deadline';
    const nextCommand = attempt.resumeCommand ?? (live ? `fgos dispatch watch ${l.run.runId}` : `fgos dispatch inspect --run ${l.run.runId}`);
    const worktree = l.run.cwd ? workspace(l.run.cwd).root : null;
    rows.push({ runId: l.run.runId, assignmentId: l.assignmentId ?? null, worktree, kind: found.kind, reason: found.reason, nextCommand, line: `${found.kind} ${l.run.runId} ${worktree ?? '-'} ${found.reason} -> ${nextCommand}`, atMs });
  }
  rows.sort((a, b) => a.atMs - b.atMs || a.runId.localeCompare(b.runId));
  const out = rows.map(({ atMs, ...row }) => row);
  return { contract: { id: 'attention-view', version: 1 }, since, observedAt, rows: out, idle: { state: 'not-readable', reason: 'the supervisor keeps its idle clock in memory; no readable record, so no idle rows' }, lines: out.map((r) => r.line) };
}
