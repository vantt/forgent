// porting-store.mjs — the single write door onto `<dir>/porting/` (per
// distillery-state-consumer D1(D5)/D2).
//
// SIBLING store, never the existing work-item store: `initStore`/`rebuild`
// here never touch `<dir>/events.jsonl` or `<dir>/state.json` at the root of
// `dir` — every path this module resolves is nested one level deeper, under
// `<dir>/porting/`. `events.mjs` (`appendEvent`/`readEvents`) is reused
// unchanged; `porting.mjs`'s `transitionPorting` decides transition legality
// — this module only wires "some directory" to the two files that live in
// its `porting/` subdir: `events.jsonl` (truth) and `state.json` (view).
//
// Write order, always: append the event to the log FIRST, then rebuild and
// overwrite the view SECOND — same crash-safety discipline as store.mjs. If
// a crash lands between the two, the log already has the event; the view is
// merely stale, and `rebuild()` below is the recovery path.
//
// The fold from events to view is this module's own small function, not a
// share of replay.mjs's `foldEvents` (which destructures work-item fields
// only) — a new domain's fold is that domain's own responsibility.

import fs from 'node:fs';
import path from 'node:path';
import { appendEvent, readEvents } from './events.mjs';
import { transitionPorting, PortingError } from './porting.mjs';

function paths(dir) {
  const base = path.join(dir, 'porting');
  return { base, logPath: path.join(base, 'events.jsonl'), viewPath: path.join(base, 'state.json') };
}

function applyEvent(view, event) {
  switch (event.type) {
    case 'porting.add': {
      const item = event.payload;
      if (item && typeof item === 'object' && typeof item.id === 'string') {
        view.porting[item.id] = { ...item };
      }
      break;
    }
    case 'porting.move': {
      const { id, to } = event.payload ?? {};
      const item = view.porting[id];
      if (item) {
        item.status = to;
      }
      break;
    }
    default:
      // Forward-compatible: an event type this view does not (yet) know how
      // to fold is skipped, not an error.
      break;
  }
}

// Fold an ordered array of porting events into a state view. Deterministic:
// folding the same log twice always yields deep-equal views.
function fold(events) {
  const view = { porting: {} };
  for (const event of events) {
    applyEvent(view, event);
  }
  return view;
}

function rebuildViewFromLog(logPath) {
  return fold(readEvents(logPath));
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
  const view = rebuildViewFromLog(logPath);
  writeView(viewPath, view);
  return view;
}

/**
 * Create `<dir>/porting/` if missing, ensure the event log file exists, and
 * (re)write the view from it. Safe to call on an already-initialized dir —
 * idempotent.
 */
export function initStore(dir) {
  const { base, logPath } = paths(dir);
  fs.mkdirSync(base, { recursive: true });
  if (!fs.existsSync(logPath)) {
    fs.writeFileSync(logPath, '', 'utf8');
  }
  return refreshView(dir);
}

/**
 * Seed a new candidate porting record. `status` is always forced to
 * `'candidate'` regardless of what the caller supplies — `candidate` is the
 * only legal entry point per porting.mjs's TRANSITIONS table. Validates
 * against the log's own current ids (read fresh, never off a possibly-stale
 * view) BEFORE writing anything — a duplicate id never reaches the log,
 * mirroring store.mjs's addWork dup-id guard.
 */
export function addPorting(dir, entry) {
  const { logPath } = paths(dir);
  if (!entry || typeof entry.id !== 'string' || !entry.id.trim()) {
    throw new PortingError('validation', 'addPorting: entry requires a non-empty "id".');
  }

  const before = rebuildViewFromLog(logPath);
  if (before.porting[entry.id]) {
    throw new PortingError('validation', `porting "${entry.id}" already exists.`);
  }

  const item = { ...entry, status: 'candidate' };
  const event = appendEvent(logPath, { type: 'porting.add', payload: item });
  const view = refreshView(dir);
  return { event, view };
}

/**
 * Move a porting record to a new status. Looks the record up fresh from the
 * log, delegates the precondition/CAS decision to porting.mjs (pure — never
 * writes), and only then appends the event it returns.
 */
export function movePorting(dir, { id, to, expectedStatus } = {}) {
  const { logPath } = paths(dir);
  const before = rebuildViewFromLog(logPath);
  const porting = before.porting[id];
  if (!porting) {
    throw new PortingError('validation', `porting "${id}" not found.`);
  }

  const rawEvent = transitionPorting({ porting, to, expectedStatus }); // PortingError: precondition | conflict
  const event = appendEvent(logPath, rawEvent);
  const view = refreshView(dir);
  return { event, view };
}

/** Read-only: the current view, rebuilt fresh from the log (never off a stale file). */
export function listPorting(dir) {
  const { logPath } = paths(dir);
  return rebuildViewFromLog(logPath);
}

/**
 * Rebuild `<dir>/porting/state.json` from the log alone — the recovery path
 * for a missing, deleted, or stale view (the view is always derivable from
 * zero, and never itself the truth).
 */
export function rebuild(dir) {
  return refreshView(dir);
}
