// Consumer lifecycle policy for the Event Store (spec §16, §14): seal and publish at command, session and process
// boundaries, always outside every hot mutex. A trigger reads maintenance facts (the local open streams, their
// oldest unsealed age and the last push attempt), never the integrity status: no ref walk and no legacy read, so
// it costs a directory listing and a few first-line reads on every command.
import { prepareStore, readEventStoreConfig } from './index.mjs';

/** A sync is due when none was attempted yet, the last one went to another remote, or the last attempt is older than
 * the interval. An attempt is any sync that ran, including one that failed before its push (an offline fetch), so an
 * offline machine tries once per interval, not once per command. */
function syncDue(config, lastAttempt, nowSec) {
  if (config.sync.intervalSec <= 0) return false;
  return !lastAttempt || lastAttempt.remote !== config.remote || nowSec - lastAttempt.time >= config.sync.intervalSec;
}

/**
 * Run the opportunistic lifecycle policy for the store of `cwd`:
 * - default: seal each open stream whose oldest unsealed event is older than `eventStore.seal.intervalSec`;
 * - `shutdown`: seal every open stream (clean writer exit: session end, gateway or runner stop);
 * - `end`: as the default, then publish when a push is due, except for a dispatched worker (`dispatched`), which
 *   never pushes: only a session of the clone's owner does. Every trigger except `shutdown` only tries the seal lock:
 *   when another process holds it, that process is sealing or publishing and this command skips instead of waiting.
 *
 * A trigger never fails its caller: every step is attempted on its own and the first failure is returned as
 * `{ error }` (its code, else its message). Durable open batches stay on disk and doctor reports the store, so the
 * next trigger simply retries.
 */
export function maintainEventStore(cwd, { trustedMain = cwd, shutdown = false, end = false, dispatched = false } = {}) {
  let error = null;
  const attempt = (step) => {
    try { return step(); } catch (cause) { error ??= cause.code ?? cause.message; return undefined; }
  };
  const config = attempt(() => readEventStoreConfig(trustedMain));
  if (!config) return { error };
  const store = attempt(() => prepareStore(cwd, { trustedMain, config: { eventStore: config } }));
  if (!store) return { error };
  const facts = attempt(() => store.maintenance([]));
  if (!facts) return { error };
  const streams = facts.streams.map((row) => row.stream);
  if (shutdown) attempt(() => store.sealAll(streams, []));
  else for (const stream of streams) attempt(() => store.sealIfDue(stream, config.seal.intervalSec, []));
  if (end && !dispatched && syncDue(config, facts.lastAttempt, Date.now() / 1000)) {
    attempt(() => store.sync({ remote: config.remote, opportunistic: true }, []));
  }
  return { error };
}
