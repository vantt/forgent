// The only Node importer of the combined addon's Event Store exports.
import path from 'node:path';
import { loadNativeAddon } from '../git/native.mjs';
import { hotLockDepth } from '../holder-lock/hot-guard.mjs';
import { resolveStateRoot } from '../holder-lock/state-root.mjs';
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
  if (ranks.some(rank => rank >= 58)) throw refusal('lock-order-violation');
  return ranks;
}
function call(fn) {
  available();
  try { return fn(); } catch (error) {
    const code = error.message.match(/\b(event-store-[a-z-]+|lock-order-violation)\b/)?.[1];
    if (code) error.code = code;
    throw error;
  }
}
/** Compatibility entry used by the combined-addon tests; no repository resolution. */
export function createEventStore(commonDir, contracts = [], loaderOptions) {
  available();
  if (hotLockDepth() > 0) throw refusal('event-store-seal-under-state');
  return call(() => new (loadNativeAddon(loaderOptions).EventStore)(commonDir, contracts));
}

const prepared = new Map();
/** Resolve before acquiring a hot mutex; pass the result as prefetched.eventStore. */
export function prepareStore(cwd, { stateRoot, trustedMain = cwd, loaderOptions } = {}) {
  available();
  if (hotLockDepth() > 0) throw refusal('event-store-seal-under-state');
  const root = path.resolve(cwd);
  const trusted = path.resolve(trustedMain);
  const state = stateRoot ?? resolveStateRoot().stateRoot;
  const key = JSON.stringify([root, trusted, state]);
  if (prepared.has(key)) return prepared.get(key);
  const native = loadNativeAddon(loaderOptions);
  const resolved = call(() => native.resolveEventStore(root, state, trusted));
  const store = openStore(resolved, resolved.machineId, registryFiles(), loaderOptions);
  prepared.set(key, store);
  return store;
}

/** Open only an opaque root obtained from Git's resolver outside the gate. */
export function openStore(resolvedRoot, machineId, files, loaderOptions) {
  available();
  if (hotLockDepth() > 0) throw refusal('event-store-seal-under-state');
  const native = call(() => loadNativeAddon(loaderOptions).openStore(resolvedRoot, machineId, files));
  const facade = {
    commonDir: resolvedRoot.commonDir,
    machineId,
    append(stream, events, cursor, writer, heldRanks) {
      available();
      const ranks = ranksOf(heldRanks);
      return call(() => native.append(stream, events, cursor, writer, machineId, ranks));
    },
    readInGate(origin, stream, cursorSeq) { return call(() => native.readInGate(origin, stream, cursorSeq)); },
    read({ streams, cursor = null, folded = [], project = true }, heldRanks) {
      const ranks = outsideGate(heldRanks);
      return call(() => native.read(streams, cursor, folded, project, ranks, hotLockDepth()));
    },
    seal(stream, heldRanks) {
      const ranks = outsideGate(heldRanks);
      return call(() => native.seal(stream, ranks, hotLockDepth()));
    },
    sealIfDue(stream, intervalSec, heldRanks) {
      const ranks = outsideGate(heldRanks);
      return call(() => native.sealIfDue(stream, intervalSec, ranks, hotLockDepth()));
    },
    sealAll(streams, heldRanks) {
      const ranks = outsideGate(heldRanks);
      return call(() => native.sealAll(streams, ranks, hotLockDepth()));
    },
    sync({ remote = 'origin', noPush = false } = {}, heldRanks) {
      const ranks = outsideGate(heldRanks);
      return call(() => native.sync(remote, noPush, ranks, hotLockDepth()));
    },
    status(heldRanks) {
      const ranks = outsideGate(heldRanks);
      return call(() => native.status(ranks, hotLockDepth()));
    },
    unpublishedSummary(remote, heldRanks) {
      const ranks = outsideGate(heldRanks);
      return call(() => native.unpublishedSummary(remote, ranks, hotLockDepth()));
    },
  };
  return Object.freeze(facade);
}
