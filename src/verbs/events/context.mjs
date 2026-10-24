import { eventStoreFacts, readEventStoreConfig, prepareStore } from '../../event-store/index.mjs';

export function eventsContext(ctx, options = {}) {
  const cwd = ctx.cwd ?? ctx.repoRoot;
  const base = { stateRoot: ctx.stateRoot, trustedMain: ctx.trustedMain ?? cwd, loaderOptions: ctx.loaderOptions };
  // Git discovers and authenticates the main checkout, including linked/subdir cwd.
  const resolved = eventStoreFacts(cwd, base);
  const config = readEventStoreConfig(resolved.trustedMain, ctx.globalConfigPath, { strict: true });
  const remote = options.remote ?? config.remote;
  const facts = remote === 'origin' ? resolved : eventStoreFacts(cwd, { ...base, remote });
  const store = prepareStore(cwd, { ...base, trustedMain: facts.trustedMain, config: { eventStore: config } });
  return { cwd, config, facts, store, heldRanks: ctx.heldRanks ?? [] };
}
