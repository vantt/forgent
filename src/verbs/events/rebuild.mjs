import { consumers, loadRebuildModule } from '../../event-store/index.mjs';
import { eventsContext } from './context.mjs';

/** Dormant store part of the existing rebuild door; consumers own atomic installs. */
export async function rebuildStoreUseCase(ctx, options = {}) {
  const { store, config, heldRanks } = eventsContext(ctx, options);
  const entries = consumers();
  // Resolve every module before invoking any consumer: an incomplete cutover fails early.
  const modules = await Promise.all(entries.map(entry => loadRebuildModule(entry.id)));
  for (let i = 0; i < entries.length; i++) if (typeof modules[i].rebuildFromStore !== 'function') throw new Error(`event-store-consumer-registry: ${entries[i].id} lacks rebuildFromStore`);
  const results = [];
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    results.push({ consumer: entry.id, result: await modules[i].rebuildFromStore({ ...ctx, store, heldRanks, maxAttempts: config.rebuild.maxAttempts }) });
  }
  return { rebuilt: results };
}
