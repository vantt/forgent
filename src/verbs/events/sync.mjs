import { eventsContext } from './context.mjs';
export function syncUseCase(ctx, options = {}) {
  const { store, facts, heldRanks } = eventsContext(ctx, options);
  const result = store.sync({ remote: facts.remote, noPush: options.noPush ?? false, opportunistic: options.opportunistic ?? false }, heldRanks);
  // The background publish (opportunistic) has no reader for a status, and the status walks every ref.
  return options.opportunistic ? result : { ...result, status: store.status(heldRanks, facts.remote) };
}
