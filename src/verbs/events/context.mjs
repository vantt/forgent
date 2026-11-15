import { eventStoreFacts, readEventStoreConfig, prepareStore } from '../../event-store/index.mjs';

/**
 * The store of the project `rebuild` runs for: Git discovers and authenticates the main checkout (including a
 * linked or subdirectory cwd), the strict `eventStore` config decides the remote, and the store is opened for it.
 * The `events sync|status|seal|export` verbs run in the host.
 */
export function eventsContext(ctx) {
  const cwd = ctx.cwd ?? ctx.repoRoot;
  const base = { stateRoot: ctx.stateRoot, trustedMain: ctx.trustedMain ?? cwd, loaderOptions: ctx.loaderOptions };
  const resolved = eventStoreFacts(cwd, base);
  const config = readEventStoreConfig(resolved.trustedMain, ctx.globalConfigPath, { strict: true });
  const facts = config.remote === 'origin' ? resolved : eventStoreFacts(cwd, { ...base, remote: config.remote });
  const store = prepareStore(cwd, { ...base, trustedMain: facts.trustedMain, config: { eventStore: config } });
  return { cwd, config, facts, store, heldRanks: ctx.heldRanks ?? [] };
}
