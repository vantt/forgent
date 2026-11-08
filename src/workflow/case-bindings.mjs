// src/workflow/case-bindings.mjs — which case owns which worktree: one record file per worktree identity
// Architecture guard: MUST NOT import src/state/** or src/runner/coordination/** (A4 boundary)
//
// The record is runtime state beside the ledger, never a ledger line. Its file is named by the worktree's
// identity (`cwdDevIno`, the key the dispatch-cwd lease uses, so every spelling of one directory is one
// file). Exclusive create is the cross-case mutex; the case's own `advance` hold orders the rest:
//
//   exclusive create {state: pending} + fsync  ->  `binding` event + fsync  ->  rename over the same
//   name as {state: committed}
//
// A missing file is the only answer that means `unbound`; anything unreadable, half-made or of another
// generation is an unsettled binding and refuses. A reader that cannot tell whether it sees the real
// directory (a confined worker sees it masked) answers `binding-view-unavailable`, never `unbound`.

import fs from 'node:fs';
import path from 'node:path';
import { cwdDevIno } from '../holder-lock/registry.mjs';
import { currentDispatchDepth } from '../runner/dispatch/adapters.mjs';
import { dispatchCwdHolder } from '../run-supervisor/cwd-lock.mjs';
import { installOnce, replaceDurably } from '../native/door.mjs';
import { appendWorkflowEvent, fsyncDirectory, readWorkflowEvents } from './store.mjs';
import { projectCase } from './case-projection.mjs';
import { runsRoot } from '../runner/execution/case-run-paths.mjs';

export const SENTINEL_NAME = '.root';

export function bindingsDir(mainRoot) {
  return path.join(runsRoot(mainRoot), '.bindings');
}

const recordPath = (mainRoot, key) => path.join(bindingsDir(mainRoot), `${key}.json`);

/**
 * Write the sentinel that tells a reader it is looking at the real bindings directory. Only the host
 * (dispatch depth 0) writes it, before any dispatch; a nested caller never does.
 *
 * @returns {boolean} whether the directory is real and marked
 */
export function ensureBindingsSentinel(mainRoot) {
  const sentinel = path.join(bindingsDir(mainRoot), SENTINEL_NAME);
  if (fs.existsSync(sentinel)) return true;
  if (currentDispatchDepth() !== 0) return false;
  try {
    fs.mkdirSync(bindingsDir(mainRoot), { recursive: true });
    installOnce(bindingsDir(mainRoot), SENTINEL_NAME, 'fgos workflow case bindings\n', 0o644);
    return true;
  } catch {
    return fs.existsSync(sentinel);
  }
}

/** The identity key of a worktree, or null when it does not exist. */
export function bindingKeyOf(worktree) {
  return cwdDevIno(worktree) ?? null;
}

function parseRecord(file) {
  try {
    const record = JSON.parse(fs.readFileSync(file, 'utf8'));
    return record && typeof record === 'object' && typeof record.caseId === 'string' && Number.isInteger(record.generation) ? record : null;
  } catch {
    return undefined;
  }
}

/**
 * What the binding of a worktree is, for the case `caseId`. Reads one file; never opens a ledger.
 *
 * @returns {{ answer: 'unbound' | 'bound' | 'worktree-already-bound' | 'binding-unsettled' | 'binding-view-unavailable' | 'worktree-missing', key?: string, record?: object }}
 */
export function readBinding({ mainRoot, worktree, caseId }) {
  const key = bindingKeyOf(worktree);
  if (key === null) return { answer: 'worktree-missing' };
  const file = recordPath(mainRoot, key);
  if (!fs.existsSync(file)) {
    return ensureBindingsSentinel(mainRoot) ? { answer: 'unbound', key } : { answer: 'binding-view-unavailable', key };
  }
  const record = parseRecord(file);
  if (!record || record.state !== 'committed') return { answer: 'binding-unsettled', key, ...(record ? { record } : {}) };
  if (record.caseId !== caseId) return { answer: 'worktree-already-bound', key, record };
  return { answer: 'bound', key, record };
}

/** Exclusive create of the pending record. Exactly one of any number of concurrent creators wins. */
export function createPendingBinding({ mainRoot, caseId, generation, worktree, commonDir = null, ref = null }) {
  const key = bindingKeyOf(worktree);
  if (key === null) return { created: false, answer: 'worktree-missing' };
  if (!ensureBindingsSentinel(mainRoot)) return { created: false, answer: 'binding-view-unavailable', key };
  const record = { state: 'pending', caseId, generation, worktreeRoot: fs.realpathSync(worktree), commonDir, ref, key };
  if (installOnce(bindingsDir(mainRoot), path.basename(recordPath(mainRoot, key)), JSON.stringify(record), 0o644) === 'already-exists') {
    return { created: false, ...readBinding({ mainRoot, worktree, caseId }) };
  }
  return { created: true, key, record };
}

/** Turn this case's pending record, of this generation, into a committed one. Only its owner may. */
export function commitBinding({ mainRoot, key, caseId, generation }) {
  const file = recordPath(mainRoot, key);
  const record = parseRecord(file);
  if (!record || record.caseId !== caseId || record.generation !== generation || record.state !== 'pending') {
    return { committed: false, answer: 'binding-unsettled' };
  }
  replaceDurably(bindingsDir(mainRoot), path.basename(file), JSON.stringify({ ...record, state: 'committed' }), 0o644);
  return { committed: true };
}

/** The next generation a case's bindings use: one past the highest its ledger has recorded. */
function nextGeneration(events, caseId) {
  return events
    .filter((e) => e.type === 'binding' && e.payload?.caseId === caseId)
    .reduce((max, e) => Math.max(max, e.payload.generation ?? 0), 0) + 1;
}

/**
 * Bind a worktree to a case, under the case's `advance` hold: pending record, `binding` event, committed record.
 *
 * @returns {{ ok: true, key: string, generation: number, already?: true } | { ok: false, answer: string, record?: object }}
 */
export function bindWorktree({ mainRoot, hold, caseId, worktree, commonDir = null, ref = null }) {
  const existing = readBinding({ mainRoot, worktree, caseId });
  if (existing.answer === 'bound') return { ok: true, key: existing.key, generation: existing.record.generation, already: true };
  if (existing.answer !== 'unbound') return { ok: false, answer: existing.answer, ...(existing.record ? { record: existing.record } : {}) };

  const generation = nextGeneration(readWorkflowEvents({ repoRoot: mainRoot, workflowRunId: caseId }), caseId);
  const made = createPendingBinding({ mainRoot, caseId, generation, worktree, commonDir, ref });
  if (!made.created) return { ok: false, answer: made.answer, ...(made.record ? { record: made.record } : {}) };
  appendWorkflowEvent({
    repoRoot: mainRoot,
    workflowRunId: caseId,
    hold,
    event: { type: 'binding', payload: { caseId, generation, key: made.key, worktreeRoot: made.record.worktreeRoot, commonDir, ref, state: 'bound' } },
  });
  commitBinding({ mainRoot, key: made.key, caseId, generation });
  return { ok: true, key: made.key, generation };
}

/**
 * Release a binding once its attempt is quiet, and only the generation that is asked for, so a late
 * cleanup never removes a newer owner. Quiet means the worktree's custody lease is free; a worktree that
 * is gone has nothing running in it.
 *
 * @returns {{ unbound: boolean, reason?: string }}
 */
export function unbindWorktree({ mainRoot, hold, caseId, generation, key, worktree }) {
  const file = recordPath(mainRoot, key);
  if (!fs.existsSync(file)) return { unbound: true, reason: 'no-record' };
  const record = parseRecord(file);
  if (!record || record.caseId !== caseId || record.generation !== generation) return { unbound: false, reason: 'generation-mismatch' };
  if (dispatchCwdHolder(path.join(mainRoot, '.fgos'), worktree ?? record.worktreeRoot) !== null) return { unbound: false, reason: 'attempt-not-quiet' };
  appendWorkflowEvent({
    repoRoot: mainRoot,
    workflowRunId: caseId,
    hold,
    event: { type: 'binding', payload: { caseId, generation, key, worktreeRoot: record.worktreeRoot, state: 'unbound' } },
  });
  fs.unlinkSync(file);
  fsyncDirectory(bindingsDir(mainRoot));
  return { unbound: true };
}

/** Every record file, parsed (undefined for one that does not parse). */
export function listBindingRecords(mainRoot) {
  const dir = bindingsDir(mainRoot);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .map((name) => ({ key: name.slice(0, -'.json'.length), file: path.join(dir, name), record: parseRecord(path.join(dir, name)) }));
}

/** The bindings a ledger says are held now, by identity key: the last `binding` event of each key. */
function boundByLedger(events, caseId) {
  const latest = new Map();
  for (const e of events) if (e.type === 'binding' && e.payload?.caseId === caseId) latest.set(e.payload.key ?? e.payload.worktreeRoot, e.payload);
  return [...latest.values()].filter((b) => b.state === 'bound');
}

/** Cases whose ledger has a `binding` event: `{ caseId, events }`. A ledger that cannot be read is reported, not skipped. */
function casesWithBindings(mainRoot) {
  const runsDir = runsRoot(mainRoot);
  const cases = [];
  const unreadable = [];
  if (!fs.existsSync(runsDir)) return { cases, unreadable };
  for (const name of fs.readdirSync(runsDir)) {
    if (name.startsWith('.') || !fs.statSync(path.join(runsDir, name)).isDirectory()) continue;
    try {
      const events = readWorkflowEvents({ repoRoot: mainRoot, workflowRunId: name });
      if (events.some((e) => e.type === 'binding')) cases.push({ caseId: name, events });
    } catch (err) {
      unreadable.push(`${name}: ${err.message}`);
    }
  }
  return { cases, unreadable };
}

/**
 * Where the binding records and the ledgers disagree, as plain sentences: a record that does not parse, is
 * unsettled, is not bound on its case's ledger, or belongs to a closed case; an open case bound on its
 * ledger with no record; a ledger that cannot be read. Reads only; the case's own hold repairs.
 *
 * @returns {{ problems: string[], records: number }}
 */
export function inspectCaseBindings(mainRoot) {
  const problems = [];
  const { cases, unreadable } = casesWithBindings(mainRoot);
  for (const item of unreadable) problems.push(`ledger unreadable (${item})`);
  const byCase = new Map(cases.map((c) => [c.caseId, c]));
  const records = listBindingRecords(mainRoot);

  for (const { key, record } of records) {
    if (!record) { problems.push(`record ${key} does not parse (binding-unsettled)`); continue; }
    if (record.state !== 'committed') { problems.push(`record ${key} of case ${record.caseId} is ${record.state} (binding-unsettled); fgos workflow resume ${record.caseId} or close ${record.caseId} settles it`); continue; }
    const owner = byCase.get(record.caseId);
    const held = owner ? boundByLedger(owner.events, record.caseId).some((b) => b.generation === record.generation && (b.key ?? b.worktreeRoot) === key) : false;
    if (!held) problems.push(`record ${key} names case ${record.caseId} generation ${record.generation}, which its ledger does not show as bound`);
    else if (!projectCase(owner.events).open) problems.push(`record ${key} belongs to closed case ${record.caseId} and is still held; unbind it once the attempt is quiet`);
  }

  const files = new Set(records.map((r) => r.key));
  for (const { caseId, events } of cases) {
    if (!projectCase(events).open) continue;
    for (const b of boundByLedger(events, caseId)) {
      if (!files.has(b.key ?? '')) problems.push(`case ${caseId} is bound to ${b.worktreeRoot} on its ledger but has no record; fgos workflow resume ${caseId} rebuilds it`);
    }
  }
  return { problems, records: files.size };
}

/**
 * Settle what a crash left of one case's bindings, under that case's own `advance` hold and nobody else's.
 * It walks the records, so a record of a case that never recorded it is found too: a pending record whose
 * `binding` event is on the ledger is committed, one with no event never reached anything and is removed, a
 * committed one whose ledger's last event for its key is `unbound` at its generation lost only the unlink and
 * is removed; and an open case's bound worktree whose record is missing gets it back.
 */
export function repairCaseBindings({ mainRoot, caseId, events = readWorkflowEvents({ repoRoot: mainRoot, workflowRunId: caseId }) }) {
  const actions = [];
  const records = listBindingRecords(mainRoot);
  for (const { key, file, record } of records) {
    if (!record || record.caseId !== caseId) continue;
    const last = events.findLast((e) => e.type === 'binding' && e.payload?.caseId === caseId && e.payload.key === key);
    if (record.state === 'pending') {
      const recorded = events.some((e) => e.type === 'binding' && e.payload?.caseId === caseId
        && e.payload.generation === record.generation && e.payload.state === 'bound');
      if (recorded) {
        commitBinding({ mainRoot, key, caseId, generation: record.generation });
        actions.push({ key, action: 'committed' });
      } else {
        fs.unlinkSync(file);
        actions.push({ key, action: 'removed' });
      }
    } else if (last?.payload.state === 'unbound' && last.payload.generation === record.generation) {
      fs.unlinkSync(file);
      fsyncDirectory(bindingsDir(mainRoot));
      actions.push({ key, action: 'removed' });
    }
  }
  const bound = boundByLedger(events, caseId);
  if (bound.length === 0 || !projectCase(events).open) return actions;
  const existing = new Set(records.map((r) => r.key));
  for (const b of bound) {
    if (existing.has(b.key) || !fs.existsSync(b.worktreeRoot) || bindingKeyOf(b.worktreeRoot) !== b.key) continue;
    const made = createPendingBinding({ mainRoot, caseId, generation: b.generation, worktree: b.worktreeRoot, commonDir: b.commonDir ?? null, ref: b.ref ?? null });
    if (made.created && commitBinding({ mainRoot, key: made.key, caseId, generation: b.generation }).committed) actions.push({ key: made.key, action: 'rebuilt' });
  }
  return actions;
}
