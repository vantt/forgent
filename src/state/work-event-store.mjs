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
// Store errors that mean the recorded history itself is damaged. The CLI reports these as a corrupt log (exit 5),
// the same category a damaged legacy log carried, rather than as an unexpected failure.
const DAMAGED_HISTORY = new Set(['event-store-integrity', 'event-store-chain-gap', 'event-store-seal-mismatch', 'event-store-ref-tampered', 'event-store-seq-conflict', 'event-store-order-cycle']);
function readStore(store, request, heldRanks) {
  try { return store.read(request, heldRanks); }
  catch (error) {
    if (DAMAGED_HISTORY.has(error.code)) error.category ??= 'corrupt-log';
    throw error;
  }
}
// A read that answered without a peer's mirror as it stands, or without its checkpoint, still answers; the
// reason is named on stderr once per process, never dropped.
const warned = new Set();
function warnAbout(read) {
  const notes = read.skippedMirrors.map(m => `${m.code} ${m.refName}: ${m.detail}`);
  if (read.checkpoint?.ignored) notes.push(`event-store-checkpoint-ignored: ${read.checkpoint.ignored}`);
  for (const note of notes) {
    if (warned.has(note)) continue;
    warned.add(note);
    process.stderr.write(`fgos: warning: ${note}\n`);
  }
}

export function prepareWorkStore(dir, mainFgosDir) {
  const config = readEventStoreConfig(path.dirname(mainFgosDir));
  const store = prepareStore(path.dirname(dir), { trustedMain: path.dirname(mainFgosDir), config: { eventStore: config } });
  return { store, config };
}

// A cached view is valid for exactly the history it folded. Sealing and ref
// movement change only certification and tip metadata, which never alter the
// fold, so those fields are refreshed from the read instead of compared. The
// legacy digest and the project-order flag are compared too: legacy events fold
// into the view, and neither value moves with a seal.
function sameFoldedHistory(cached, read) {
  return !!cached && ['cover', 'streams', 'deferred', 'projectOrder', 'legacyDigest']
    .every(key => isDeepStrictEqual(cached[key], read[key]));
}

// What this process's last catch-up of a store folded. A cursor is only coverage and cannot stand in for a lost
// view, so the reader needs the retained events beside it to walk just what is new (spec §15). A fresh process has
// none; it continues from the checkpoint file (`historyPath`, spec §15) when one matches the store, else reads from
// zero once. A long-lived one (gateway, runner) then catches up incrementally.
const retained = new WeakMap();

/** Full history is read only outside the mutex. Legacy order stays untouched. A read that names a cache path
 * continues from this process's last catch-up; one without (rebuild) always verifies from zero. `historyPath` names
 * the checkpoint file: a read holding no catch-up of its own continues from it, `rebuild` never does, and every read
 * replaces it when it certified new commits. */
export function readWorkState(store, { cachePath, historyPath, heldRanks = [], requireComplete = false, rebuild = false } = {}) {
  if (hotLockDepth() > 0) throw refusal('event-store-full-read-under-state');
  const prior = cachePath ? retained.get(store) : undefined;
  let read;
  try {
    read = readStore(store, { streams: ['project'], ...(prior ? { cursor: prior.cursor, folded: prior.folded } : {}),
      ...(historyPath ? { checkpoint: { path: historyPath, reuse: !rebuild } } : {}) }, heldRanks);
  } catch (error) {
    // A catch-up the store refused is not continued from: the next read starts over.
    retained.delete(store);
    throw error;
  }
  retained.set(store, { cursor: read.cursor, folded: read.sequence });
  warnAbout(read);
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
        && sameFoldedHistory(cursor, read.cursor) && serializeView(view).revision === revision) {
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
  const historyPath = resolveFgosFile(mainFgosDir, FGOS_FILE.EVENT_HISTORY);
  return withConsumerState(dir, mainFgosDir, writer, fn, { ...prepared, policy: {
    stream: 'project', resource: 'state', fold: foldEvents, lifecycle, persist,
    historyPath,
    readState: (store, { heldRanks, rebuild }) => readWorkState(store, { heldRanks, rebuild, historyPath,
      ...(rebuild ? {} : { cachePath: resolveFgosFile(mainFgosDir, FGOS_FILE.STATE) }) }),
    prepareEvents(tx, events) {
      // Each event records what its writer saw. Existence rides every Work event so a record for a vanished
      // item cannot apply; the status an item must still hold rides only the events that move it, so a
      // concurrent status change never drops an edit, a step change, an attempt or an outcome.
      const decided = new Map();
      for (const event of events) {
        const id = event.payload?.id;
        if (!event.type.startsWith('work.') || !id || event.type === 'work.discovery') continue;
        const current = decided.get(id) ?? { exists: !!tx.view.work[id], status: tx.view.work[id]?.status };
        const movesStatus = event.type === 'work.move';
        const { expectedStatus, ...condition } = event.payload.precondition ?? {};
        event.payload.precondition = { ...condition, exists: current.exists,
          ...(movesStatus && current.exists ? { expectedStatus: current.status } : {}) };
        if (event.type === 'work.add') decided.set(id, { exists: true, status: event.payload.status });
        else if (event.type === 'work.move' && current.exists) decided.set(id, { ...current, status: event.payload.to });
        else decided.set(id, current);
      }
    },
  } });
}
