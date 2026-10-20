// Consumer lifecycle policy, always outside hot mutexes. Explicit verbs surface errors.
import { prepareStore, readEventStoreConfig } from './index.mjs';
export function maintainEventStore(cwd, { trustedMain = cwd, end = false, shutdown = false, dispatched = false } = {}) {
  try {
    const config = readEventStoreConfig(trustedMain);
    const store = prepareStore(cwd, { trustedMain, config: { eventStore: config } });
    const status = store.status([], config.remote);
    const streams = [...new Set(['project', 'project:porting', ...status.streams.map(row => row.stream)])];
    if (shutdown) store.sealAll(streams, []);
    else for (const stream of streams) store.sealIfDue(stream, config.seal.intervalSec, []);
    const last = status.lastPush;
    if (end && !dispatched && config.sync.intervalSec > 0
      && (!last || last.remote !== config.remote || Date.now() / 1000 - last.time >= config.sync.intervalSec)) {
      store.sync({ remote: config.remote }, []);
    }
  } catch { /* Durable open batches and doctor retain diagnostics for retry. */ }
}
