// Work's consumer policy. The Event Store owns bytes and cursors; the state
// mutex owns serialization and effect ordering; Work owns its fold and cache.
import path from 'node:path';
import { prepareStore, readEventStoreConfig } from '../event-store/index.mjs';
import { withStateTx, hotLockDepth, HotLockError } from './hot-lock.mjs';
import { foldEvents, serializeView, VIEW_SCHEMA_VERSION } from './replay.mjs';
import { resolveFgosFile, FGOS_FILE } from './fgos-file-registry.mjs';
import fs from 'node:fs';
import { isDeepStrictEqual } from 'node:util';

const lifecycle = new Set(JSON.parse(fs.readFileSync(new URL('../../packages/work-state/contracts/event-streams.v1.json', import.meta.url))).types.filter(t => t.sealOnWrite).map(t => t.type));
const refusal = code => Object.assign(new Error(code), { code });

export function prepareWorkStore(dir, mainFgosDir) {
  const config = readEventStoreConfig(path.dirname(dir));
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

function advance(cursor, events) {
  const next = { ...cursor, cover: { ...cursor.cover } };
  for (const event of events) next.cover[`${event.origin}:${event.stream}`] = event.seq;
  return next;
}

function persist(tx) {
  const { viewStr, revision } = serializeView(tx.view);
  tx.writeText(resolveFgosFile(tx.mainFgosDir, FGOS_FILE.STATE),
    `${viewStr.slice(0, -1)},"revision":${JSON.stringify(revision)},"viewSchemaVersion":${VIEW_SCHEMA_VERSION},"cursor":${JSON.stringify(tx.cursor)}}\n`);
}

/**
 * Catch up outside the mutex, then fold only the own-stream tail inside it.
 * `rebuild` demands a current candidate rather than installing a stale fold.
 * `beforeGate` computes evidence that requires full history outside the gate.
 * An already-prepared store is also accepted (the same native facade, useful
 * to callers that already resolved repository authority).
 */
export function withWorkState(dir, mainFgosDir, writer, fn, { store, config, rebuild = false, beforeGate, heldRanks = [] } = {}) {
  if (hotLockDepth() > 0) throw new HotLockError('hot-lock-reentry', 'Work cannot open a nested state transaction');
  if (!store) ({ store, config } = prepareWorkStore(dir, mainFgosDir));
  config ??= readEventStoreConfig(path.dirname(dir));
  const attempts = config.rebuild.maxAttempts;
  const extraRoots = path.resolve(mainFgosDir) === path.resolve(dir) ? [] : [dir];
  let recoveryAttempted = false;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const candidate = readWorkState(store, { heldRanks, ...(rebuild ? {} : { cachePath: resolveFgosFile(mainFgosDir, FGOS_FILE.STATE) }) });
    const evidence = beforeGate?.(candidate);
    let sealedType = false;
    try {
      const result = withStateTx(mainFgosDir, tx => {
        const origin = store.ownOrigin;
        const tail = store.readInGate(origin, 'project', candidate.cursor.cover[`${origin}:project`] ?? 0).events;
        if (rebuild && tail.length) throw refusal('event-store-rebuild-raced');
        // A gated own-stream extension is the proven incremental case (§12).
        // Foreign/deferred changes are handled by the full read next time.
        if (tail.some(event =>
          Object.entries(event.seen).some(([key, seq]) => (candidate.cursor.cover[key] ?? 0) < seq)
          || Object.entries(candidate.cursor.cover).some(([key, seq]) => key !== `${origin}:project` && (event.seen[key] ?? 0) < seq))) {
          throw refusal('catch-up-required');
        }
        tx.view = foldEvents(tail, candidate.view);
        tx.cursor = advance(candidate.cursor, tail);
        tx.evidence = evidence;
        tx.tail = tail;
        return fn(tx);
      }, { prefetched: {
        mainFgosDir, writer, extraRoots, eventStore: store, stageEffects: true,
        commitEvents(tx, events) {
          if (!events.length) return;
          // Record the exact durable existence/status checked by the gate.
          // Advance a local fold for dependent events in the same batch.
          let decided = structuredClone(tx.view);
          for (const event of events) {
            const id = event.payload?.id;
            if (event.type.startsWith('work.') && id) {
              const item = decided.work[id];
              event.payload.precondition = { ...event.payload.precondition, exists: !!item, ...(item ? { expectedStatus: item.status } : {}) };
            }
            decided = foldEvents([event], decided);
          }
          const appended = store.append('project', events.map(event => ({ eventType: event.type, schemaVersion: 1, payload: event.payload, ts: event.ts })), tx.cursor.cover, String(writer), [...heldRanks, 60]);
          for (let i = 0; i < events.length; i += 1) Object.assign(events[i], appended.events[i]);
          tx.view = foldEvents(appended.events, tx.view);
          tx.cursor = advance(tx.cursor, appended.events);
          sealedType = events.some(event => lifecycle.has(event.type));
        },
        afterApply: persist,
      } });
      // Opportunistic failures do not turn an acknowledged mutation into a
      // refusal. Explicit seal/doctor retain the diagnostic failure surface.
      try {
        if (sealedType) store.seal('project', heldRanks, { opportunistic: true });
        else store.sealIfDue('project', config.seal.intervalSec, heldRanks);
      } catch { /* The durable open batch remains available for the next seal. */ }
      return result;
    } catch (error) {
      if (error.code === 'event-store-seq-recovery-conflict') {
        if (recoveryAttempted) throw error;
        recoveryAttempted = true;
        store.seal('project', heldRanks);
        continue;
      }
      if (error.code === 'catch-up-required' || error.code === 'event-store-rebuild-raced') continue;
      // In particular stale-cursor, ENOSPC and validation never retry a
      // callback or apply its staged claim/file effects.
      throw error;
    }
  }
  throw refusal('event-store-rebuild-busy');
}
