// store.mjs — the single write door onto `.fgos/` (per D3/D5).
//
// This is the sole module that resolves `.fgos/` paths; byte-level append is
// delegated to events.mjs. Every other module here is a pure lib that takes
// an explicit path (events.mjs) or no path at all (fsm.mjs, replay.mjs,
// work.mjs) — this module is what wires "some directory" to the two files
// that live in it: `events.jsonl` (truth, per D3) and `state.json` (view,
// per D4).
//
// Write order, always: append the event to the log FIRST, then rebuild and
// overwrite the view SECOND. If a crash lands between the two, the log (the
// only truth) already has the event — the view is merely stale, and
// `rebuild()` below is the documented recovery path (per the plan's risk
// map). The view is never written before the event that produced it exists.
//
// This module is also the CLI's single facade for the error-classification
// contract (R4): EXIT_CODES + categoryOf are the one source for
// category -> exit code, and the four error classes raised anywhere in the
// state layer are re-exported from here so bin/fgos.mjs never needs to
// import fsm.mjs/work.mjs/events.mjs directly.

import fs from 'node:fs';
import path from 'node:path';
import { appendEvent } from './events.mjs';
import { rebuildView } from './replay.mjs';
import { transitionWork, FsmError } from './fsm.mjs';
import { validateWork, WorkValidationError } from './work.mjs';
import { EventLogError } from './events.mjs';

export { FsmError, WorkValidationError, EventLogError };

/** Error raised by this module. `category` is the CLI exit-code contract (R4). */
export class StoreError extends Error {
  constructor(category, message) {
    super(message);
    this.name = 'StoreError';
    this.category = category;
  }
}

/** The one category -> exit-code map (R4). Values unchanged from the prior duplicate in bin/fgos.mjs. */
export const EXIT_CODES = Object.freeze({
  precondition: 2,
  conflict: 3,
  validation: 4,
  'corrupt-log': 5,
});

/**
 * Classify any error raised by this module's domain (StoreError, FsmError,
 * WorkValidationError, EventLogError all set `.category`) by reading the
 * property directly rather than an instanceof-chain — a new error class only
 * needs to set `.category` to participate, nothing here has to change.
 * Anything without a recognized `.category` falls back to 'unexpected'
 * (callers map that to exit 1).
 */
export function categoryOf(err) {
  return err && typeof err.category === 'string' ? err.category : 'unexpected';
}

function paths(dir) {
  return { logPath: path.join(dir, 'events.jsonl'), viewPath: path.join(dir, 'state.json') };
}

function writeView(viewPath, view) {
  fs.mkdirSync(path.dirname(viewPath), { recursive: true });
  fs.writeFileSync(viewPath, `${JSON.stringify(view, null, 2)}\n`, 'utf8');
}

// Shared tail of every mutation: rebuild the view fresh from the (now
// updated) log and overwrite state.json. Always called AFTER the event that
// caused the change has already been appended — never before.
function refreshView(dir) {
  const { logPath, viewPath } = paths(dir);
  const view = rebuildView(logPath);
  writeView(viewPath, view);
  return view;
}

/**
 * Create `dir` (e.g. `.fgos/`) if missing, ensure the event log file exists,
 * and (re)write the view from it. Safe to call on an already-initialized
 * dir — idempotent.
 */
export function initStore(dir) {
  const { logPath } = paths(dir);
  fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(logPath)) {
    fs.writeFileSync(logPath, '', 'utf8');
  }
  return refreshView(dir);
}

/**
 * Add a new work item. Validates shape + deps against the log's own current
 * ids (read fresh, never off the possibly-stale view) BEFORE writing
 * anything — an invalid item never reaches the log.
 */
export function addWork(dir, work) {
  const { logPath } = paths(dir);
  const before = rebuildView(logPath);

  if (before.work[work?.id]) {
    throw new StoreError('validation', `work "${work.id}" already exists.`);
  }
  validateWork(work, Object.keys(before.work));

  const event = appendEvent(logPath, { type: 'work.add', payload: work });
  const view = refreshView(dir);
  return { event, view };
}

/**
 * Move a work item to a new status. Looks the item up fresh from the log,
 * delegates the precondition/CAS decision to fsm.mjs (pure — never writes),
 * and only then appends the event it returns.
 */
export function moveWork(dir, { id, to, expectedStatus } = {}) {
  const { logPath } = paths(dir);
  const before = rebuildView(logPath);
  const work = before.work[id];
  if (!work) {
    throw new StoreError('validation', `work "${id}" not found.`);
  }

  const rawEvent = transitionWork({ work, to, expectedStatus }); // FsmError: precondition | conflict
  const event = appendEvent(logPath, rawEvent); // captures the real seq; rawEvent itself has none
  const view = refreshView(dir);
  return { event, view };
}

/** Log a decision event (no FSM/work validation — decisions are freeform). */
export function addDecision(dir, payload) {
  const { logPath } = paths(dir);
  if (!payload || typeof payload.text !== 'string' || !payload.text.trim()) {
    throw new StoreError('validation', 'decision requires a non-empty "text".');
  }
  const event = appendEvent(logPath, { type: 'decision', payload });
  const view = refreshView(dir);
  return { event, view };
}

/** Read-only: the current view, rebuilt fresh from the log (never off a stale file). */
export function listWork(dir) {
  const { logPath } = paths(dir);
  return rebuildView(logPath);
}

/**
 * Rebuild `state.json` from the log alone — the recovery path for a
 * missing, deleted, or stale view (per D3: the view is always derivable from
 * zero, and never itself the truth).
 */
export function rebuild(dir) {
  return refreshView(dir);
}
