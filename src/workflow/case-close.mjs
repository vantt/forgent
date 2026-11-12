// src/workflow/case-close.mjs — close a case under its `advance` hold: `case.closed`, then release the bindings that are quiet
// Architecture guard: MUST NOT import src/state/** or src/runner/coordination/** (A4 boundary)
//
// The one place a case is closed, so `fgos workflow close` and a Playbook proposer that finished its
// case close it by the same rules: refused while a closure milestone is stale or a consent gate is
// parked; every binding whose attempt is quiet is released, the others are kept and named.

import fs from 'node:fs';
import path from 'node:path';

import { appendWorkflowEvent, eventsFilePath, projectWorkflowState, readWorkflowEvents } from './store.mjs';
import { readCaseProjection } from './case-projection.mjs';
import { listBindingRecords, unbindWorktree } from './case-bindings.mjs';
import { tryAcquireAdvanceLock } from './case-lock.mjs';
import { RunnerConfigError } from '../runner/dispatch/runner-config-error.mjs';
import { isCaseId, runDirOf, runsRoot } from '../runner/execution/case-run-paths.mjs';
import { assignmentDir } from '../runner/dispatch/assignment-layout.mjs';
import { deriveUnitState } from '../runner/execution/unit-state.mjs';
import { unitControllerHeld } from '../runner/execution/unit-control.mjs';
import { custodyHeld } from '../runner/execution/custody-door.mjs';
import { realpathOrNull } from '../run-supervisor/payload-root.mjs';

/**
 * @param {object} params
 * @param {string} params.mainRoot
 * @param {string} params.workflowRunId
 * @param {object} params.hold the case's `advance` hold
 * @param {string} [params.reason] recorded on the ledger
 * @returns {{ closed: true, unbound: string[], kept: Array<{ key: string, reason: string }> } | { closed: false, code: 'case-closed' | 'close-refused', reasons: string[] }}
 */
export function closeCaseUnderHold({ mainRoot, workflowRunId, hold, reason }) {
  const { projection } = readCaseProjection(mainRoot, workflowRunId);
  if (!projection.open) return { closed: false, code: 'case-closed', reasons: ['case-closed'] };
  if (!projection.closable.ok) return { closed: false, code: 'close-refused', reasons: projection.closable.reasons };
  appendWorkflowEvent({
    repoRoot: mainRoot,
    workflowRunId,
    hold,
    event: { type: 'case.closed', payload: { closedAt: new Date().toISOString(), ...(reason ? { reason } : {}) } },
  });
  const unbound = [];
  const kept = [];
  for (const binding of projection.bindings) {
    const result = unbindWorktree({ mainRoot, hold, caseId: workflowRunId, generation: binding.generation, key: binding.key, worktree: binding.worktreeRoot });
    if (result.unbound) unbound.push(binding.key);
    else kept.push({ key: binding.key, reason: result.reason });
  }
  return { closed: true, unbound, kept };
}

// ---- retiring finished cases ----------------------------------------------------------------------------
//
// A case that ended long ago, its ledger, and the Unit runs it names are removed together: Unit runs first,
// the ledger last, so a failure half-way leaves the ledger to name what is still there. What is kept, and
// why, is the result: an open or failed case, one an open case inherits from or reads a report of, one a
// worktree binding names, a Unit run that is unsettled or has a live controller or custody, and anything
// that is a link. Nothing here follows a link; a Unit run is removed only when its own `unit.json` names
// the case being removed. Unit runs that no case names (plain `fgos run`) are never touched.

export const DEFAULT_PRUNE_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

const readJsonFile = (file) => { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; } };
const lstatOrNull = (p) => { try { return fs.lstatSync(p); } catch { return null; } };

/** Every Unit run id and case id a ledger names, read from the events themselves (never from a path it holds). */
function refsOfEvents(events) {
  const unitRuns = new Set();
  const cases = new Set();
  const scanString = (text) => {
    for (const m of text.matchAll(/unit-run:([^/\s"'\\]+)/g)) unitRuns.add(m[1]);
    for (const m of text.matchAll(/assignments\/([^/\s"'\\]+)/g)) unitRuns.add(m[1]);
    for (const m of text.matchAll(/gate-answer:([^/\s"'\\]+)\//g)) cases.add(m[1]);
  };
  const walk = (value, key) => {
    if (typeof value === 'string') {
      scanString(value);
      if (key === 'unitRunId') unitRuns.add(value);
      if (key === 'fromCase' || key === 'caseId' || key === 'parentCaseId') cases.add(value);
    } else if (Array.isArray(value)) {
      for (const item of value) walk(item, key);
    } else if (value && typeof value === 'object') {
      for (const [k, v] of Object.entries(value)) walk(v, k);
    }
  };
  for (const event of events) walk(event.payload, null);
  return { unitRuns, cases };
}

/** The moment a finished case ended (ms), or null when it did not finish. */
function endOfCase(events) {
  const closed = events.find((e) => e.type === 'case.closed');
  const stamp = (e) => Date.parse(e?.payload?.closedAt ?? e?.ts);
  if (closed) return Number.isFinite(stamp(closed)) ? stamp(closed) : null;
  if (events.some((e) => e.type === 'case.opened')) return null;
  if (projectWorkflowState(events).status !== 'completed') return null;
  const last = Date.parse(events[events.length - 1]?.ts);
  return Number.isFinite(last) ? last : null;
}

/** Ledgers by case id: `{ events, refs, end }`, or `{ unreadable }` when one does not fold. A stat-keyed cache spares re-reading. */
function scanLedgers(mainRoot, cache) {
  const root = runsRoot(mainRoot);
  const ledgers = new Map();
  let names;
  try { names = fs.readdirSync(root); } catch { return ledgers; }
  for (const id of names) {
    if (!isCaseId(id)) continue;
    const dirStat = lstatOrNull(path.join(root, id));
    if (!dirStat?.isDirectory()) continue;
    const fileStat = lstatOrNull(eventsFilePath(mainRoot, id));
    const key = fileStat ? `${fileStat.mtimeMs}:${fileStat.size}:${fileStat.ino}` : 'none';
    const hit = cache.get(id);
    if (hit?.key === key) { ledgers.set(id, hit.value); continue; }
    let value;
    try {
      const events = readWorkflowEvents({ repoRoot: mainRoot, workflowRunId: id });
      value = events.length === 0 ? { unreadable: true } : { events, refs: refsOfEvents(events), end: endOfCase(events) };
    } catch {
      value = { unreadable: true };
    }
    cache.set(id, { key, value });
    ledgers.set(id, value);
  }
  return ledgers;
}

/** The cases that are old and finished: the candidates, and why each other ledger is kept. */
function splitLedgers(ledgers, cutoff, kept) {
  const candidates = new Set();
  for (const [id, ledger] of ledgers) {
    if (ledger.unreadable) kept.push({ id, reason: 'unreadable' });
    else if (ledger.end === null) kept.push({ id, reason: 'not-finished' });
    else if (ledger.end > cutoff) kept.push({ id, reason: 'too-recent' });
    else candidates.add(id);
  }
  return candidates;
}

/** What the ledgers outside `candidates` and the binding records still name. Candidates they name leave the set. */
function protectCandidates({ mainRoot, ledgers, candidates, kept }) {
  const bound = new Set(listBindingRecords(mainRoot).map((b) => b.record?.caseId).filter(Boolean));
  for (const id of [...candidates]) {
    if (bound.has(id)) { candidates.delete(id); kept.push({ id, reason: 'binding-held' }); }
  }
  for (let moved = true; moved;) {
    moved = false;
    for (const [id, ledger] of ledgers) {
      if (candidates.has(id) || ledger.unreadable) continue;
      for (const named of ledger.refs.cases) {
        if (named !== id && candidates.delete(named)) { kept.push({ id: named, reason: 'named-by-other-case' }); moved = true; }
      }
    }
  }
  const namedUnitRuns = new Set();
  for (const [id, ledger] of ledgers) {
    if (!candidates.has(id) && !ledger.unreadable) for (const run of ledger.refs.unitRuns) namedUnitRuns.add(run);
  }
  return namedUnitRuns;
}

function treeBytes(dir) {
  let total = 0;
  const stack = [dir];
  while (stack.length > 0) {
    const current = stack.pop();
    const stat = lstatOrNull(current);
    if (!stat) continue;
    total += stat.size;
    if (stat.isDirectory()) {
      let names = [];
      try { names = fs.readdirSync(current); } catch { /* unreadable: counted as itself */ }
      for (const name of names) stack.push(path.join(current, name));
    }
  }
  return total;
}

// A summary-less run has no verdict; the probe is never asked to judge a live attempt, so such a run stays unsettled.
const NO_PROBE = () => ({ state: 'unprobed' });

// The reasons a Unit run stays, in the order they are asked (the first that fires wins). `blocks`: the case's ledger
// and every other Unit run of it stay too, so a kept ledger never names a removed run. A run that another case owns or
// names stays alone: nothing kept then names it from this case.
const KEEP_REASONS = [
  { reason: 'unit-record-missing', blocks: true, fires: ({ expected }) => !lstatOrNull(path.join(expected, 'unit.json'))?.isFile() },
  { reason: 'names-other-case', blocks: false, fires: ({ record, caseId }) => record?.workflow?.caseId !== caseId },
  { reason: 'named-by-other-case', blocks: false, fires: ({ unitRunId, namedElsewhere }) => namedElsewhere.has(unitRunId) },
  { reason: 'controller-held', blocks: true, fires: ({ expected }) => unitControllerHeld(expected) },
  { reason: 'custody-held', blocks: true, fires: ({ record, fgosDir }) => typeof record.worktree === 'string' && custodyHeld(fgosDir, record.worktree) },
  { reason: 'unsettled', blocks: true, fires: ({ expected }) => { const { unitState } = deriveUnitState(expected, { probe: NO_PROBE }); return unitState !== 'completed' && unitState !== 'failed'; } },
];

/**
 * Where one named Unit run of `caseId` stands: `{ dir }` when it may go, `{ gone: true }` when there is nothing
 * to remove, `{ keep, blocks }` otherwise. The path is checked first: it decides whether the directory may be read at all.
 */
function judgeUnitRun({ fgosDir, caseId, unitRunId, namedElsewhere }) {
  const dir = assignmentDir(fgosDir, unitRunId);
  if (dir === null) {
    const plain = typeof unitRunId === 'string' && unitRunId !== '' && unitRunId !== '.' && unitRunId !== '..' && !/[/\\]/.test(unitRunId);
    return { keep: plain && lstatOrNull(path.join(fgosDir, 'assignments', unitRunId))?.isSymbolicLink() ? 'link' : 'unsafe-path', blocks: true };
  }
  const base = realpathOrNull(path.join(fgosDir, 'assignments')) ?? path.join(fgosDir, 'assignments');
  const expected = path.join(base, unitRunId);
  const stat = lstatOrNull(expected);
  if (stat === null) return { gone: true };
  if (stat.isSymbolicLink() || !stat.isDirectory() || realpathOrNull(expected) !== expected) return { keep: 'link', blocks: true };
  const facts = { fgosDir, caseId, unitRunId, namedElsewhere, expected, record: readJsonFile(path.join(expected, 'unit.json')) };
  const row = KEEP_REASONS.find((candidate) => candidate.fires(facts));
  return row ? { keep: row.reason, blocks: row.blocks } : { dir: expected };
}

/**
 * Judge every Unit run a ledger names. `blocked` when any must stay with the ledger: then no run of it goes, and each
 * that would have gone is listed as `case-kept`, so a dry run and an apply say the same.
 */
function judgeCase({ mainRoot, caseId, ledger, namedElsewhere, kept }) {
  const fgosDir = path.join(mainRoot, '.fgos');
  const doomed = [];
  let blocked = false;
  for (const unitRunId of ledger.refs.unitRuns) {
    const verdict = judgeUnitRun({ fgosDir, caseId, unitRunId, namedElsewhere });
    if (verdict.dir) doomed.push({ id: unitRunId, dir: verdict.dir });
    else if (verdict.keep) {
      kept.push({ id: unitRunId, reason: verdict.keep });
      if (verdict.blocks) blocked = true;
    }
  }
  if (blocked) {
    for (const unit of doomed) kept.push({ id: unit.id, reason: 'case-kept' });
    return { doomed: [], blocked };
  }
  return { doomed, blocked };
}

// A concurrent prune that reaches a case this one is deleting takes its hold first, which writes into the directory
// under deletion, so the delete can meet a directory that is not empty. Deleting is idempotent: go on until it is empty.
function removeCaseDir(mainRoot, caseId) {
  fs.rmSync(runDirOf(mainRoot, caseId), { recursive: true, force: true, maxRetries: 10, retryDelay: 20 });
}

/**
 * Remove the cases that ended more than `olderThanMs` ago, with the Unit runs they name.
 *
 * @param {object} params
 * @param {string} params.mainRoot
 * @param {number} params.olderThanMs
 * @param {boolean} [params.apply] false (the default) only reports what would go
 * @param {number} [params.now] ms since epoch, for the age cut
 * @returns {{ cases: string[], unitRuns: string[], kept: Array<{ id: string, reason: string }>, bytes: number }}
 *   what went (or would go), what stayed and why, and the bytes of what went
 */
export function pruneFinishedCases({ mainRoot, olderThanMs, apply = false, now = Date.now() }) {
  if (!Number.isFinite(olderThanMs) || olderThanMs < 0) throw new RunnerConfigError('prune needs a non-negative age', { code: 'invalid-prune-age' });
  const cache = new Map();
  const kept = [];
  const result = { cases: [], unitRuns: [], kept, bytes: 0 };
  let ledgers = scanLedgers(mainRoot, cache);
  const candidates = splitLedgers(ledgers, now - olderThanMs, kept);
  let namedElsewhere = protectCandidates({ mainRoot, ledgers, candidates, kept });

  for (const caseId of [...candidates].sort()) {
    let hold = null;
    try {
      if (apply) {
        hold = tryAcquireAdvanceLock(mainRoot, caseId);
        if (hold === null) { kept.push({ id: caseId, reason: 'advance-held' }); continue; }
        // Under the hold nothing else advances this case: look again at it and at what names it.
        ledgers = scanLedgers(mainRoot, cache);
        const fresh = splitLedgers(ledgers, now - olderThanMs, []);
        namedElsewhere = protectCandidates({ mainRoot, ledgers, candidates: fresh, kept: [] });
        if (!fresh.has(caseId)) {
          // Taking the hold of a directory a concurrent prune just removed makes an empty stub: take it away again.
          if (!lstatOrNull(eventsFilePath(mainRoot, caseId))) removeCaseDir(mainRoot, caseId);
          else kept.push({ id: caseId, reason: 'no-longer-prunable' });
          continue;
        }
      }
      const { doomed, blocked } = judgeCase({ mainRoot, caseId, ledger: ledgers.get(caseId), namedElsewhere, kept });
      let bytes = 0;
      const removed = [];
      let failed = false;
      for (const unit of doomed) {
        const size = treeBytes(unit.dir);
        if (apply) {
          try { fs.rmSync(unit.dir, { recursive: true, force: true }); } catch { kept.push({ id: unit.id, reason: 'delete-failed' }); failed = true; break; }
        }
        bytes += size;
        removed.push(unit.id);
      }
      result.unitRuns.push(...removed);
      result.bytes += bytes;
      // A removal that fails midway still leaves this ledger naming the runs already removed: deleting the ledger
      // first would orphan the rest. The next prune finds the removed runs gone and carries on.
      if (blocked || failed) { kept.push({ id: caseId, reason: 'unit-run-kept' }); continue; }
      const ledgerBytes = treeBytes(runDirOf(mainRoot, caseId));
      if (apply) {
        try { removeCaseDir(mainRoot, caseId); } catch { kept.push({ id: caseId, reason: 'delete-failed' }); continue; }
      }
      result.bytes += ledgerBytes;
      result.cases.push(caseId);
    } catch (err) {
      // A case whose ledger is gone went with a concurrent prune, whether it vanished before the hold or under it:
      // what is left of its directory is the stub that taking the hold made.
      if (lstatOrNull(eventsFilePath(mainRoot, caseId))) kept.push({ id: caseId, reason: 'error' });
      else { try { removeCaseDir(mainRoot, caseId); } catch { kept.push({ id: caseId, reason: 'error' }); } }
    } finally {
      try { hold?.release(); } catch { /* the directory went with the case */ }
    }
  }
  return result;
}
