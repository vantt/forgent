import { eventsContext } from './context.mjs';
export function statusUseCase(ctx, options = {}) {
  const { store, facts, heldRanks } = eventsContext(ctx, options);
  const status = store.status(heldRanks, facts.remote);
  return { ...status, remote: facts.remote, remoteUrl: facts.remoteFact.url, refspecMissing: facts.remoteFact.configured && facts.expectedFetchRefspecs.some(r => !facts.fetchRefspecs.includes(r)), facts };
}
