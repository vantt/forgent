import path from 'node:path';
import { eventsContext } from './context.mjs';

export function exportUseCase(ctx, options = {}) {
  if (typeof options.out !== 'string' || !options.out) throw new Error('events export requires --out <dir>');
  const { store, heldRanks, config } = eventsContext(ctx, options);
  const streams = options.stream ? [options.stream] : store.status(heldRanks, config.remote).streams.map(row => row.stream);
  const since = typeof options.since === 'string' ? JSON.parse(options.since) : options.since ?? null;
  const out = path.resolve(ctx.cwd ?? ctx.repoRoot, options.out);
  return store.exportJsonl({ streams, since, out }, heldRanks);
}
