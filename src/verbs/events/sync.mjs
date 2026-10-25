import { eventsContext } from './context.mjs';

/**
 * The background publish of a command's end trigger (`opportunistic`): it tries the seal lock, returns no status (the
 * status walks every ref and nobody reads it here), and answers a failed attempt as `{ error }` when the sync itself
 * persisted it (doctor's `event-store-sync` row reads that record). Only a failure before the sync could record its
 * attempt, such as a refused lock directory, throws, so the CLI leaves its fault record.
 */
export function syncUseCase(ctx, options = {}) {
  const { store, facts, heldRanks } = eventsContext(ctx, options);
  const request = { remote: facts.remote, noPush: options.noPush ?? false, opportunistic: options.opportunistic ?? false };
  if (!options.opportunistic) return { ...store.sync(request, heldRanks), status: store.status(heldRanks, facts.remote) };
  const startedSec = Math.floor(Date.now() / 1000);
  try {
    return store.sync(request, heldRanks);
  } catch (error) {
    const attempt = store.maintenance(heldRanks).lastAttempt;
    if (attempt && attempt.time >= startedSec) return { error: error.code ?? error.message };
    throw error;
  }
}
