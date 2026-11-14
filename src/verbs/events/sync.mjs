import { eventsContext, STATE_ROOT_GONE } from './context.mjs';

/**
 * The background publish of a command's end trigger (`opportunistic`): it tries the seal lock, returns no status (the
 * status walks every ref and nobody reads it here), and answers a failed attempt as `{ error }` when the sync itself
 * persisted it (`event-store-incidents` and `events status` read that record). Only a failure before the sync could record its
 * attempt, such as a refused lock directory, throws, so the CLI leaves its fault record. A state root that is gone is
 * skipped (`STATE_ROOT_GONE`): the owner tore it down, and the child does not rebuild it.
 */
export function syncUseCase(ctx, options = {}) {
  const context = eventsContext(ctx, { ...options, detached: options.opportunistic ?? false });
  if (!context) return STATE_ROOT_GONE;
  const { store, facts, heldRanks } = context;
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
