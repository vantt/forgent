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
import { dispatchCwdHolder } from '../runner/dispatch/cwd-lock.mjs';
import { installOnce, replaceDurably } from '../native/door.mjs';
import { appendWorkflowEvent, readWorkflowEvents } from './store.mjs';

export const SENTINEL_NAME = '.root';

export function bindingsDir(mainRoot) {
  return path.join(mainRoot, '.fgos', 'workflow-runs', '.bindings');
}

const recordPath = (mainRoot, key) => path.join(bindingsDir(mainRoot), `${key}.json`);

function fsyncDir(dir) {
  const fd = fs.openSync(dir, 'r');
  try {
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
}

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
export function nextGeneration(events, caseId) {
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
  fsyncDir(bindingsDir(mainRoot));
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

/**
 * Settle the records a crash left for one case, under its `advance` hold: a pending record whose
 * `binding` event is on the ledger is committed; one with no event never reached anything and is removed.
 */
export function repairCaseBindings({ mainRoot, caseId }) {
  const events = readWorkflowEvents({ repoRoot: mainRoot, workflowRunId: caseId });
  const actions = [];
  for (const { key, file, record } of listBindingRecords(mainRoot)) {
    if (!record || record.caseId !== caseId || record.state !== 'pending') continue;
    const recorded = events.some((e) => e.type === 'binding' && e.payload?.caseId === caseId
      && e.payload.generation === record.generation && e.payload.state === 'bound');
    if (recorded) {
      commitBinding({ mainRoot, key, caseId, generation: record.generation });
      actions.push({ key, action: 'committed' });
    } else {
      fs.unlinkSync(file);
      actions.push({ key, action: 'removed' });
    }
  }
  return actions;
}
