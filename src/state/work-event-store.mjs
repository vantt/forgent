// Work's consumer policy. The Event Store owns bytes and cursors; the state
// mutex owns serialization and effect ordering; Work owns its fold and cache.
import path from 'node:path';
import { prepareStore, readEventStoreConfig } from '../event-store/index.mjs';
import { hotLockDepth, HotLockError } from './hot-lock.mjs';
import { withConsumerState } from './consumer-event-gate.mjs';
import { foldEvents, serializeView, VIEW_SCHEMA_VERSION } from './replay.mjs';
import { resolveFgosFile, FGOS_FILE } from './fgos-file-registry.mjs';
import fs from 'node:fs';
import { isDeepStrictEqual } from 'node:util';

const lifecycle = new Set(JSON.parse(fs.readFileSync(new URL('../../packages/work-state/contracts/event-streams.v1.json', import.meta.url))).types.filter(t => t.sealOnWrite).map(t => t.type));
const refusal = code => Object.assign(new Error(code), { code });

export function prepareWorkStore(dir, mainFgosDir) {
  const config = readEventStoreConfig(path.dirname(mainFgosDir));
  const store = prepareStore(path.dirname(dir), { trustedMain: path.dirname(mainFgosDir), config: { eventStore: config } });
  return { store, config };
}

/** Full history is read only outside the mutex. Legacy order stays untouched. */
export function readWorkState(store, { cachePath, heldRanks = [], requireComplete = false } = {}) {
  if (hotLockDepth() > 0) throw refusal('event-store-full-read-under-state');
  const read = store.read({ streams: ['project'] }, heldRanks);
  if (requireComplete && (read.deferred.length || read.missing.length)) throw refusal('event-store-incomplete-history');
  const events = [...read.legacy.map(record => record.event), ...read.sequence];
  // A cache never establishes coverage: first authenticate it against the
  // reader's cursor. Old snapshots and damaged/schema-stale caches refold.
  if (cachePath) {
    let cached;
    try { cached = JSON.parse(fs.readFileSync(cachePath, 'utf8')); }
    catch (error) { if (error.code !== 'ENOENT' && !(error instanceof SyntaxError)) throw error; }
    if (cached && typeof cached === 'object' && !Array.isArray(cached)) {
      const { revision, viewSchemaVersion, cursor, snapshot, ...view } = cached;
      if (viewSchemaVersion === VIEW_SCHEMA_VERSION && snapshot === undefined
        && isDeepStrictEqual(cursor, read.cursor) && serializeView(view).revision === revision) {
        return { view, cursor: read.cursor, events };
      }
    }
  }
  return { view: foldEvents(events), cursor: read.cursor, events };
}

function persist(tx) {
  const { viewStr, revision } = serializeView(tx.view);
  tx.writeText(resolveFgosFile(tx.mainFgosDir, FGOS_FILE.STATE),
    `${viewStr.slice(0, -1)},"revision":${JSON.stringify(revision)},"viewSchemaVersion":${VIEW_SCHEMA_VERSION},"cursor":${JSON.stringify(tx.cursor)}}\n`);
}

export function withWorkState(dir, mainFgosDir, writer, fn, options = {}) {
  if (hotLockDepth() > 0) throw new HotLockError('hot-lock-reentry', 'Work cannot open a nested state transaction');
  const prepared = options.store ? options : { ...prepareWorkStore(dir, mainFgosDir), ...options };
  return withConsumerState(dir, mainFgosDir, writer, fn, { ...prepared, policy: {
    stream: 'project', resource: 'state', fold: foldEvents, lifecycle, persist,
    readState: (store, { heldRanks, rebuild }) => readWorkState(store, { heldRanks,
      ...(rebuild ? {} : { cachePath: resolveFgosFile(mainFgosDir, FGOS_FILE.STATE) }) }),
    prepareEvents(tx, events) {
      const states = new Map();
      for (const event of events) {
        const id = event.payload?.id;
        if (!event.type.startsWith('work.') || !id || event.type === 'work.discovery') continue;
        const item = states.get(id) ?? { exists: !!tx.view.work[id], status: tx.view.work[id]?.status };
        const transitions = event.type === 'work.move' || (event.type === 'work.step' && event.payload.toStatus !== undefined);
        const { expectedStatus, ...condition } = event.payload.precondition ?? {};
        event.payload.precondition = { ...condition, exists: item.exists,
          ...(transitions && item.exists ? { expectedStatus: item.status } : {}) };
        if (event.type === 'work.add') { item.exists = true; item.status = event.payload.status ?? 'todo'; }
        if (event.type === 'work.move') item.status = event.payload.to;
        if (event.type === 'work.step' && event.payload.toStatus !== undefined) item.status = event.payload.toStatus;
        states.set(id, item);
      }
    },
  } });
}
