import fs from 'node:fs';
import path from 'node:path';
import { consumers, loadRebuildModule } from '../../event-store/index.mjs';
import { viewRevision } from '../../state/replay.mjs';
import { eventsContext } from './context.mjs';

const sizeOf = value => Array.isArray(value) ? value.length : value && typeof value === 'object' ? Object.keys(value).length : undefined;

// What a rebuilt view holds, never the view itself: the size of every collection it keeps.
function countsOf(view) {
  const counts = {};
  for (const [key, value] of Object.entries(view ?? {})) {
    const size = sizeOf(value);
    if (size !== undefined) counts[key] = size;
  }
  return counts;
}

// What the consumer's freshly installed cache says it covers. A consumer whose cache carries no cursor reports null.
function coverOf(root, entry) {
  let cursor;
  try { cursor = JSON.parse(fs.readFileSync(path.join(root, entry.cachePath), 'utf8')).cursor; } catch { return null; }
  if (!cursor || typeof cursor !== 'object') return null;
  return { streams: sizeOf(cursor.streams) ?? 0, covered: sizeOf(cursor.cover) ?? 0, deferred: sizeOf(cursor.deferred) ?? 0 };
}

/** The store part of the rebuild door: every consumer refolds from the store and replaces its own cache atomically. */
export async function rebuildStoreUseCase(ctx, options = {}) {
  const { store, config, heldRanks, facts } = eventsContext(ctx, options);
  const entries = consumers();
  // Resolve every module before invoking any consumer: an incomplete cutover fails early.
  const modules = await Promise.all(entries.map(entry => loadRebuildModule(entry.id)));
  for (let i = 0; i < entries.length; i++) if (typeof modules[i].rebuildFromStore !== 'function') throw new Error(`event-store-consumer-registry: ${entries[i].id} lacks rebuildFromStore`);
  const rebuilt = [];
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const view = await modules[i].rebuildFromStore({ ...ctx, store, heldRanks, maxAttempts: config.rebuild.maxAttempts });
    rebuilt.push({ consumer: entry.id, counts: countsOf(view), revision: viewRevision(view), cover: coverOf(facts.trustedMain, entry) });
  }
  return { rebuilt };
}
