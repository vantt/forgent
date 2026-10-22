// porting-store.mjs — the single write door for porting records. Porting owns the
// `project:porting` stream and its view; Work's `project` stream is never touched.
//
// Events go through the same consumer gate Work uses (`withConsumerState`, resource
// `porting-events`). `dir` only names the clone the records belong to: the view and its
// cursor live in the untracked `.fgos` cache the consumer registry declares, never in a
// tracked file, so a porting mutation leaves the working tree clean.
//
// The fold is this module's own small function, not a share of replay.mjs's `foldEvents`
// (which destructures work-item fields only) — a new domain's fold is its own concern.

import { transitionPorting, PortingError } from './porting.mjs';
import { readEventStoreConfig } from '../event-store/index.mjs';
import { prepareWorkStore } from './work-event-store.mjs';
import { withConsumerState } from './consumer-event-gate.mjs';
import { getMainFgosDir } from './runtime-coordination.mjs';
import { resolveFgosFile, FGOS_FILE } from './fgos-file-registry.mjs';
import { resolveWriterIdentity } from '../util/session-identity.mjs';
import { hotLockDepth, HotLockError } from './hot-lock.mjs';
import path from 'node:path';

const STREAM = 'project:porting';

const refusal = code => Object.assign(new Error(code), { code });

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

/**
 * Fold an ordered array of porting events into a view, optionally continuing from `seed`.
 * Deterministic: folding the same events twice always yields deep-equal views.
 */
export function foldPortingEvents(events, seed) {
  const view = seed ? structuredClone(seed) : { porting: {} };
  for (const event of events) applyEvent(view, event);
  return view;
}

// Full history is read outside the mutex. An incomplete history (a deferred or missing
// foreign event) refuses rather than folding a partial view.
function readState(store, { heldRanks = [] } = {}) {
  if (hotLockDepth() > 0) throw refusal('event-store-full-read-under-state');
  const read = store.read({ streams: [STREAM] }, heldRanks);
  if (read.deferred.length || read.missing.length) throw refusal('event-store-incomplete-history');
  return { view: foldPortingEvents([...read.legacy.map(record => record.event), ...read.sequence]), cursor: read.cursor };
}

function transact(dir, fn, options = {}) {
  if (hotLockDepth() > 0) throw new HotLockError('hot-lock-reentry', 'Porting cannot open a nested state transaction');
  const main = getMainFgosDir(dir);
  // The writer identity may need a child process, so it is resolved before the mutex.
  const writer = String(resolveWriterIdentity(main).id);
  const prepared = options.store ? options : { ...prepareWorkStore(dir, main), ...options };
  const cache = resolveFgosFile(main, FGOS_FILE.PORTING_STATE);
  return withConsumerState(dir, main, writer, fn, { ...prepared, policy: {
    stream: STREAM, resource: 'porting-events', readState,
    fold: foldPortingEvents, lifecycle: new Set(),
    persist: tx => tx.writeJson(cache, { ...tx.view, cursor: tx.cursor }),
  } });
}

function withStateAndRefresh(dir, fn) {
  let tx;
  const event = transact(dir, current => { tx = current; return fn(current); });
  return { event, view: tx.view };
}

/** Write the view cache from the recorded history. Safe to call repeatedly. */
export function initStore(dir) { return rebuild(dir); }

/**
 * Seed a new candidate porting record. `status` is always forced to `'candidate'` — the
 * only legal entry point per porting.mjs's TRANSITIONS table. The duplicate check reads
 * the view the gate just caught up, inside the held `porting-events` section, so two
 * processes racing the same id cannot both append a `porting.add`.
 */
export function addPorting(dir, entry) {
  if (!entry || typeof entry.id !== 'string' || !entry.id.trim()) {
    throw new PortingError('validation', 'addPorting: entry requires a non-empty "id".');
  }
  return withStateAndRefresh(dir, tx => {
    if (tx.view.porting[entry.id]) throw new PortingError('validation', `porting "${entry.id}" already exists.`);
    return tx.append({ type: 'porting.add', payload: { ...entry, status: 'candidate' } });
  });
}

/**
 * Move a porting record to a new status. The lookup, the compare-and-set decision
 * (delegated to porting.mjs, which never writes) and the append share one held section,
 * so a stale `expectedStatus` cannot slip past the check before a racing write lands.
 */
export function movePorting(dir, { id, to, expectedStatus } = {}) {
  return withStateAndRefresh(dir, tx => {
    const porting = tx.view.porting[id];
    if (!porting) throw new PortingError('validation', `porting "${id}" not found.`);
    return tx.append(transitionPorting({ porting, to, expectedStatus })); // PortingError: precondition | conflict
  });
}

/** Read-only: the current view, folded from the full history (never off the cache file). */
export function listPorting(dir) {
  return readState(prepareWorkStore(dir, getMainFgosDir(dir)).store).view;
}

/** Rebuild the view cache from the recorded history alone. */
export function rebuild(dir) {
  let tx;
  transact(dir, current => { tx = current; }, { rebuild: true });
  return tx.view;
}

/** The consumer registry's rebuild port, using the store the caller already prepared. */
export function rebuildFromStore({ cwd, repoRoot, store, maxAttempts, heldRanks = [], globalConfigPath }) {
  const dir = getMainFgosDir(path.join(cwd ?? repoRoot, '.fgos'));
  const config = readEventStoreConfig(path.dirname(dir), globalConfigPath);
  if (maxAttempts !== undefined) config.rebuild.maxAttempts = maxAttempts;
  let tx;
  transact(dir, current => { tx = current; }, { config, store, heldRanks, rebuild: true });
  return tx.view;
}
