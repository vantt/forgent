import { eventsContext } from './context.mjs';
export function syncUseCase(ctx, options = {}) {
  const { store, facts, heldRanks } = eventsContext(ctx, options);
  const result = store.sync({ remote: facts.remote, noPush: options.noPush ?? false }, heldRanks);
  return { ...result, status: store.status(heldRanks, facts.remote) };
}
