// The only Node importer of the combined addon's Event Store exports.
import path from 'node:path';
import { loadNativeAddon } from '../git/native.mjs';
import { hotLockDepth } from '../holder-lock/hot-guard.mjs';
import { resolveStateRoot } from '../holder-lock/state-root.mjs';
import { eventStoreConfig } from './config.mjs';
import { registryFiles } from './consumers.mjs';

function refusal(code) { return Object.assign(new Error(code), { code }); }
function available() {
  if (process.platform !== 'linux') throw refusal('event-store-unsupported-platform');
}
function ranksOf(heldRanks) {
  const ranks = typeof heldRanks?.holding === 'function' ? heldRanks.holding().map(lock => lock.rank) : heldRanks;
  if (!Array.isArray(ranks) || ranks.some(rank => !Number.isInteger(rank) || rank < 0 || rank > 0xffffffff)) {
    throw refusal('event-store-held-ranks-required');
  }
  return ranks;
}
function outsideGate(heldRanks) {
  available();
  if (hotLockDepth() > 0) throw refusal('event-store-seal-under-state');
  const ranks = ranksOf(heldRanks);
  if (ranks.includes(60)) throw refusal('event-store-seal-under-state');
  return ranks;
}
function call(fn) {
  available();
  try { return fn(); } catch (error) {
    let code = error.message.match(/^([a-z][a-z-]*)(?::|$)/)?.[1];
    if (!code) {
      try {
        const operation = JSON.parse(error.message);
        code = operation.code;
        if (operation.cause) error.cause = operation.cause;
      } catch { /* Plain native error. */ }
    }
    if (code) error.code = code;
    throw error;
  }
}
// serde_json's map representation does not preserve JavaScript insertion order.
// Legacy view revisions depend on that order: parse the authenticated raw line.
function historical(result, key) {
  return { ...result, [key]: result[key].map(record => ({ ...record, event: JSON.parse(record.raw) })) };
}
const prepared = new Map();
/** Resolve before acquiring a hot mutex; pass the result as prefetched.eventStore. */
export function prepareStore(cwd, { stateRoot, trustedMain, loaderOptions, config } = {}) {
  available();
  const settings = eventStoreConfig(config);
  if (hotLockDepth() > 0) throw refusal('event-store-seal-under-state');
  if (typeof trustedMain !== 'string' || !trustedMain) throw refusal('event-store-trusted-main-required');
  const root = path.resolve(cwd);
  const trusted = path.resolve(trustedMain);
  const state = stateRoot ?? resolveStateRoot().stateRoot;
  const native = loadNativeAddon(loaderOptions);
  const key = JSON.stringify([root, trusted, state, loaderOptions ?? null, settings.remote]);
  if (prepared.has(key)) return prepared.get(key);
  const resolved = call(() => native.resolveEventStore(root, state, trusted));
  const store = openStore(resolved, resolved.machineId, registryFiles(), loaderOptions, settings.remote);
  prepared.set(key, store);
  return store;
}

/** Open only an opaque root obtained from Git's resolver outside the gate. */
export function openStore(resolvedRoot, machineId, files, loaderOptions, remote = 'origin') {
  available();
  if (hotLockDepth() > 0) throw refusal('event-store-seal-under-state');
  const native = call(() => loadNativeAddon(loaderOptions).openStore(resolvedRoot, machineId, files, remote));
  const views = new WeakMap();
  const facade = {
    commonDir: resolvedRoot.commonDir,
    machineId,
    // null means this clone has no local store identity yet (no append).
    get ownOrigin() { return call(() => native.ownOrigin); },
    /** Settle the store's write admission (the legacy-migration check) outside the gate, where Git may be asked.
     * It never refuses by itself: the append that needs the answer raises it. */
    admitWrites(heldRanks) {
      const ranks = outsideGate(heldRanks);
      call(() => native.admitWrites(ranks, hotLockDepth()));
    },
    append(stream, events, cursor, writer, heldRanks) {
      available();
      const ranks = ranksOf(heldRanks);
      return call(() => native.append(stream, events, cursor, writer, ranks));
    },
    readInGate(origin, stream, cursorSeq) { return call(() => native.readInGate(origin, stream, cursorSeq)); },
    /** `checkpoint: { path, reuse }` names the consumer's cache file of the history a complete read folded: a read
     * that holds no retained history of its own continues from it (`reuse`), and every read replaces it when it
     * certified new commits. A file that does not match the store is ignored; the answer never depends on it. */
    read({ streams, cursor = null, folded = [], project = true, checkpoint }, heldRanks) {
      const ranks = outsideGate(heldRanks);
      const retained = JSON.stringify(folded);
      const response = call(() => native.read({ streams, cursor, folded: retained, project, view: views.get(folded), checkpoint }, ranks, hotLockDepth()));
      const { sequencePrefix, ...result } = historical(response.result, 'legacy');
      // Preserve independent snapshots and use the exact bytes native verified,
      // including when a caller supplied objects with custom JSON serialization.
      result.sequence = (sequencePrefix ? JSON.parse(retained).slice(0, sequencePrefix) : []).concat(result.sequence);
      views.set(result.sequence, response.view);
      return result;
    },
    seal(stream, heldRanks, { opportunistic = false } = {}) {
      const ranks = outsideGate(heldRanks);
      return call(() => native.seal(stream, ranks, hotLockDepth(), opportunistic));
    },
    sealIfDue(stream, intervalSec, heldRanks) {
      const ranks = outsideGate(heldRanks);
      return call(() => native.sealIfDue(stream, intervalSec, ranks, hotLockDepth()));
    },
    sealAll(streams, heldRanks) {
      const ranks = outsideGate(heldRanks);
      return call(() => native.sealAll(streams, ranks, hotLockDepth()));
    },
    promote({ branch, throughSeq, cursor, writer, ts = new Date().toISOString() }, heldRanks) {
      const ranks = outsideGate(heldRanks);
      return call(() => native.promote({ branch, throughSeq, cursor, writer, ts }, ranks, hotLockDepth()));
    },
    /** `opportunistic` tries the seal lock and returns `{ busy: true }` instead of waiting when another process holds it. */
    sync({ remote = 'origin', noPush = false, opportunistic = false } = {}, heldRanks) {
      const ranks = outsideGate(heldRanks);
      return call(() => native.sync(remote, noPush, ranks, hotLockDepth(), opportunistic));
    },
    maintenance(heldRanks) {
      const ranks = outsideGate(heldRanks);
      return call(() => native.maintenance(ranks, hotLockDepth()));
    },
    status(heldRanks, remote = 'origin') {
      const ranks = outsideGate(heldRanks);
      return call(() => native.status(remote, ranks, hotLockDepth()));
    },
    exportJsonl({ streams, since = null, out }, heldRanks) {
      const ranks = outsideGate(heldRanks);
      return call(() => native.exportJsonl(streams, since, out, ranks, hotLockDepth()));
    },
    exportLegacyLayout({ streams, since = null, out }, heldRanks) {
      const ranks = outsideGate(heldRanks);
      return call(() => native.exportLegacyLayout(streams, since, out, ranks, hotLockDepth()));
    },
    readLegacyFromHead({ check = false } = {}, heldRanks) {
      const ranks = outsideGate(heldRanks);
      return historical(call(() => native.readLegacyFromHead(check, ranks, hotLockDepth())), 'events');
    },
    importLegacy({ expectedHead }, heldRanks) {
      const ranks = outsideGate(heldRanks);
      return call(() => native.importLegacy(expectedHead, ranks, hotLockDepth()));
    },
    legacyLayout(heldRanks) {
      const ranks = outsideGate(heldRanks);
      return call(() => native.legacyLayout(ranks, hotLockDepth()));
    },
    unpublishedSummary(remote, heldRanks) {
      const ranks = outsideGate(heldRanks);
      return call(() => native.unpublishedSummary(remote, ranks, hotLockDepth()));
    },
  };
  return Object.freeze(facade);
}

/** Read facts without requiring a machine id or creating a store. */
export function eventStoreFacts(cwd, { stateRoot, trustedMain = cwd, remote = 'origin', loaderOptions } = {}) {
  outsideGate([]);
  return call(() => loadNativeAddon(loaderOptions).eventStoreFacts(cwd, stateRoot ?? resolveStateRoot().stateRoot, trustedMain, remote));
}
export function ensureEventStoreRefspecs(cwd, { stateRoot, trustedMain = cwd, remote = 'origin', loaderOptions } = {}) {
  outsideGate([]);
  return call(() => loadNativeAddon(loaderOptions).ensureEventStoreRefspecs(cwd, stateRoot ?? resolveStateRoot().stateRoot, trustedMain, remote));
}
export function eventStoreAddonAvailable(loaderOptions) {
  outsideGate([]);
  const native = call(() => loadNativeAddon(loaderOptions));
  return typeof native.resolveEventStore === 'function' && typeof native.openStore === 'function'
    && typeof native.eventStoreFacts === 'function' && typeof native.ensureEventStoreRefspecs === 'function'
    && typeof native.eventStoreBranchKey === 'function'
    && ['read', 'append', 'admitWrites', 'promote', 'sync', 'maintenance', 'status', 'exportJsonl', 'exportLegacyLayout', 'readLegacyFromHead', 'importLegacy', 'legacyLayout'].every(name => typeof native.EventStore?.prototype?.[name] === 'function');
}

/** Decode an explicit legacy inventory through the crate's frozen ordering rule. */
export function decodeLegacyFiles(files, loaderOptions) {
  return call(() => loadNativeAddon(loaderOptions).decodeLegacyFiles(files))
    .map(record => ({ ...record, event: JSON.parse(record.raw) }));
}

/** Branch stream key, defined and validated by the crate. */
export function branchKey(branch, loaderOptions) {
  return call(() => loadNativeAddon(loaderOptions).eventStoreBranchKey(branch));
}
