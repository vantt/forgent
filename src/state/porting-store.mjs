// Porting owns project:porting and its view. `dir` selects only the view location.
import path from 'node:path';
import { transitionPorting, PortingError } from './porting.mjs';
import { readEventStoreConfig } from '../event-store/index.mjs';
import { prepareWorkStore } from './work-event-store.mjs';
import { withConsumerState } from './consumer-event-gate.mjs';
import { getMainFgosDir } from './runtime-coordination.mjs';
import { resolveWriterIdentity } from '../util/session-identity.mjs';
import { hotLockDepth, HotLockError } from './hot-lock.mjs';

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
export function foldPortingEvents(events, seed) {
  const view = seed ? structuredClone(seed) : { porting: {} };
  for (const event of events) {
    applyEvent(view, event);
  }
  return view;
}


function readState(store, { heldRanks = [] } = {}) {
  if (hotLockDepth()) throw Object.assign(new Error('event-store-full-read-under-state'), { code: 'event-store-full-read-under-state' });
  const read = store.read({ streams: ['project:porting'] }, heldRanks);
  if (read.deferred.length || read.missing.length) throw Object.assign(new Error('event-store-incomplete-history'), { code: 'event-store-incomplete-history' });
  return { view: foldPortingEvents([...read.legacy.map(record => record.event), ...read.sequence]), cursor: read.cursor };
}
function transact(dir, fn, options = {}) {
  if (hotLockDepth() > 0) throw new HotLockError('hot-lock-reentry', 'Porting cannot open a nested state transaction');
  const main = getMainFgosDir(dir);
  const writer = String(resolveWriterIdentity(main).id);
  const prepared = options.store ? options : { ...prepareWorkStore(dir, main), ...options };
  return withConsumerState(dir, main, writer, fn, { ...prepared, policy: {
    stream: 'project:porting', resource: 'porting-events', readState,
    fold: foldPortingEvents, lifecycle: new Set(),
    persist: tx => tx.writeJson(path.join(dir, 'porting/state.json'), { ...tx.view, cursor: tx.cursor }),
  } });
}
function withStateAndRefresh(dir, fn) {
  let tx;
  const event = transact(dir, current => { tx = current; return fn(current); });
  return { event, view: tx.view };
}
export function initStore(dir) { return rebuild(dir); }
export function addPorting(dir, entry) {
  if (!entry || typeof entry.id !== 'string' || !entry.id.trim()) throw new PortingError('validation', 'addPorting: entry requires a non-empty "id".');
  return withStateAndRefresh(dir, tx => {
    if (tx.view.porting[entry.id]) throw new PortingError('validation', `porting "${entry.id}" already exists.`);
    return tx.append({ type: 'porting.add', payload: { ...entry, status: 'candidate' } });
  });
}
export function movePorting(dir, { id, to, expectedStatus } = {}) {
  return withStateAndRefresh(dir, tx => {
    const porting = tx.view.porting[id];
    if (!porting) throw new PortingError('validation', `porting "${id}" not found.`);
    return tx.append(transitionPorting({ porting, to, expectedStatus }));
  });
}
export function listPorting(dir) {
  return readState(prepareWorkStore(dir, getMainFgosDir(dir)).store).view;
}
export function rebuild(dir) {
  let tx;
  transact(dir, current => { tx = current; }, { rebuild: true });
  return tx.view;
}
export function rebuildFromStore({ cwd, repoRoot, store, heldRanks = [], maxAttempts }) {
  const dir = path.join(cwd ?? repoRoot, '.fgos');
  const config = readEventStoreConfig(path.dirname(dir));
  if (maxAttempts !== undefined) config.rebuild.maxAttempts = maxAttempts;
  let tx;
  transact(dir, current => { tx = current; }, { config, store, heldRanks, rebuild: true });
  return tx.view;
}
