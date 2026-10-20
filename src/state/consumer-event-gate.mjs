// Shared read-check-append gate; consumers own folding, paths and preconditions.
import path from 'node:path';
import { readEventStoreConfig } from '../event-store/index.mjs';
import { withStateTx, hotLockDepth, HotLockError } from './hot-lock.mjs';
const refusal = code => Object.assign(new Error(code), { code });

function advance(cursor, events) {
  const next = { ...cursor, cover: { ...cursor.cover } };
  for (const event of events) next.cover[`${event.origin}:${event.stream}`] = event.seq;
  return next;
}

/**
 * Catch up outside the mutex, then fold only the own-stream tail inside it.
 * `rebuild` demands a current candidate rather than installing a stale fold.
 * `beforeGate` computes evidence that requires full history outside the gate.
 * An already-prepared store is also accepted (the same native facade, useful
 * to callers that already resolved repository authority).
 */
export function withConsumerState(dir, mainFgosDir, writer, fn, { store, config, rebuild = false, beforeGate, heldRanks = [], policy } = {}) {
  const { stream, resource, readState, fold, persist, prepareEvents, lifecycle } = policy;
  if (hotLockDepth() > 0) throw new HotLockError('hot-lock-reentry', 'Work cannot open a nested state transaction');
  if (!store) throw new TypeError('a prepared consumer store is required');
  config ??= readEventStoreConfig(path.dirname(dir));
  const attempts = config.rebuild.maxAttempts;
  const extraRoots = path.resolve(mainFgosDir) === path.resolve(dir) ? [] : [dir];
  let recoveryAttempted = false;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const candidate = readState(store, { heldRanks, rebuild });
    const evidence = beforeGate?.(candidate);
    let sealedType = false;
    try {
      const result = withStateTx(mainFgosDir, tx => {
        const origin = store.ownOrigin;
        const tail = store.readInGate(origin, stream, candidate.cursor.cover[`${origin}:${stream}`] ?? 0).events;
        if (rebuild && tail.length) throw refusal('event-store-rebuild-raced');
        // A gated own-stream extension is the proven incremental case (§12).
        // Foreign/deferred changes are handled by the full read next time.
        if (tail.some(event =>
          Object.entries(event.seen).some(([key, seq]) => (candidate.cursor.cover[key] ?? 0) < seq)
          || Object.entries(candidate.cursor.cover).some(([key, seq]) => key !== `${origin}:${stream}` && (event.seen[key] ?? 0) < seq))) {
          throw refusal('catch-up-required');
        }
        tx.view = fold(tail, candidate.view);
        tx.cursor = advance(candidate.cursor, tail);
        tx.evidence = evidence;
        tx.tail = tail;
        return fn(tx);
      }, { resource, prefetched: {
        mainFgosDir, writer, extraRoots, eventStore: store, stageEffects: true,
        commitEvents(tx, events) {
          if (!events.length) return;
          prepareEvents?.(tx, events);
          const appended = store.append(stream, events.map(event => ({ eventType: event.type, schemaVersion: 1, payload: event.payload, ts: event.ts })), tx.cursor.cover, String(writer), [...heldRanks, 60]);
          for (let i = 0; i < events.length; i += 1) Object.assign(events[i], appended.events[i]);
          tx.view = fold(appended.events, tx.view);
          tx.cursor = advance(tx.cursor, appended.events);
          sealedType = events.some(event => lifecycle.has(event.type));
        },
        afterApply: tx => persist(tx),
      } });
      // Opportunistic failures do not turn an acknowledged mutation into a
      // refusal. Explicit seal/doctor retain the diagnostic failure surface.
      try {
        if (sealedType) store.seal(stream, heldRanks, { opportunistic: true });
        else store.sealIfDue(stream, config.seal.intervalSec, heldRanks);
      } catch { /* The durable open batch remains available for the next seal. */ }
      return result;
    } catch (error) {
      if (error.code === 'event-store-seq-recovery-conflict') {
        if (recoveryAttempted) throw error;
        recoveryAttempted = true;
        store.seal(stream, heldRanks);
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
