import path from 'node:path';
import { eventsContext } from './context.mjs';

const STREAM = /^[a-z][a-z0-9-]*$/;
const refusal = (message) => Object.assign(new Error(message), { code: 'validation', category: 'validation' });

/**
 * Seal the open batch of one stream now, waiting for the seal lock (a bounded wait, never try-and-skip), so the
 * events certified here include every append that finished before this call. Nothing open: returns at once. A lock
 * still held after the wait answers `{ busy: true }`, not a failure.
 * `history` names the consumer's history checkpoint the seal extends; it must be a file under the main `.fgos/cache`.
 */
export function sealUseCase(ctx, { stream, history } = {}) {
  if (typeof stream !== 'string' || !STREAM.test(stream)) throw refusal('events seal requires --stream <name>');
  const { store, heldRanks, facts } = eventsContext(ctx);
  let checkpointPath;
  if (history !== undefined) {
    const cacheDir = path.join(facts.trustedMain, '.fgos', 'cache') + path.sep;
    if (typeof history !== 'string' || !path.isAbsolute(history) || !path.resolve(history).startsWith(cacheDir)) {
      throw refusal(`events seal --history must be a file under ${cacheDir}`);
    }
    checkpointPath = path.resolve(history);
  }
  try {
    return store.seal(stream, heldRanks, checkpointPath ? { checkpointPath } : {});
  } catch (error) {
    // Still busy after the bounded wait: the holder, or the next seal, certifies the backlog.
    if (error.code === 'event-store-lock-timeout') return { busy: true };
    throw error;
  }
}
