import { eventStoreFacts, readEventStoreConfig, prepareStore } from '../../event-store/index.mjs';

/** What a detached seal or publish child reports when the state root it was started for is gone. */
export const STATE_ROOT_GONE = Object.freeze({ skipped: 'state root gone' });

/**
 * `detached` marks a background seal or publish child: it never recreates a state root its owner tore down, and answers
 * `null` instead (also when the CLI entry already found the root gone, `ctx.stateRootGone`), which its caller reports
 * as `STATE_ROOT_GONE`.
 */
export function eventsContext(ctx, options = {}) {
  if (ctx.stateRootGone) return null;
  const detached = options.detached ?? false;
  const cwd = ctx.cwd ?? ctx.repoRoot;
  const base = { stateRoot: ctx.stateRoot, trustedMain: ctx.trustedMain ?? cwd, loaderOptions: ctx.loaderOptions, detached };
  // Git discovers and authenticates the main checkout, including linked/subdir cwd.
  let resolved;
  try {
    resolved = eventStoreFacts(cwd, base);
  } catch (error) {
    if (detached && error.code === 'state-root-gone') return null;
    throw error;
  }
  const config = readEventStoreConfig(resolved.trustedMain, ctx.globalConfigPath, { strict: true });
  const remote = options.remote ?? config.remote;
  const facts = remote === 'origin' ? resolved : eventStoreFacts(cwd, { ...base, remote });
  const store = prepareStore(cwd, { ...base, trustedMain: facts.trustedMain, config: { eventStore: config } });
  return { cwd, config, facts, store, heldRanks: ctx.heldRanks ?? [] };
}
