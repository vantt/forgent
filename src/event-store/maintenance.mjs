// Consumer lifecycle policy for the Event Store (spec §16, §14): seal and publish at command, session and process
// boundaries, always outside every hot mutex. A trigger reads maintenance facts (the local open streams, their
// oldest unsealed age and the last push attempt), never the integrity status: no ref walk and no legacy read, so
// it costs a directory listing and a few first-line reads on every command.
import { spawnDetachedCli } from '../util/spawn-detached-fgos.mjs';
import { prepareStore, readEventStoreConfig } from './index.mjs';
import { processSealCoalescer } from './seal-coalescing.mjs';

/** A sync is due when none was attempted yet, the last one went to another remote, or the last attempt is older than
 * the interval. An attempt is any sync that ran, including one that failed before its push (an offline fetch), so an
 * offline machine tries once per interval, not once per command. */
function syncDue(config, lastAttempt, nowSec) {
  if (config.sync.intervalSec <= 0) return false;
  return !lastAttempt || lastAttempt.remote !== config.remote || nowSec - lastAttempt.time >= config.sync.intervalSec;
}

/** Start the one detached child that publishes for this clone; a spawn that cannot start is the trigger's error. */
function handSyncToChild(root) {
  const { error } = spawnDetachedCli({ cwd: root, args: ['events', 'sync', '--opportunistic', '--dir', root] });
  if (error) throw new Error(`event-store-sync-child: ${error}`);
}

/**
 * Run the opportunistic lifecycle policy for the store of `cwd`:
 * - default: seal each open stream whose oldest unsealed event is older than `eventStore.seal.intervalSec`;
 * - `shutdown`: seal every open stream (clean writer exit: session end, gateway or runner stop);
 * - `end`: as the default, then publish when a push is due, except for a dispatched worker (`dispatched`), which
 *   never pushes: only a session of the clone's owner does. The publish runs in a detached `fgos events sync` child,
 *   so no command waits on the network; it reaches the remote after at most the child's runtime. Every trigger except
 *   `shutdown` only tries the seal lock: when another process holds it, that process is sealing or publishing and this
 *   command (or its child) skips instead of waiting.
 *
 * `trustedMain` is the main checkout's root, or a function returning it. A trigger never fails its caller: every step is attempted on its own and the first failure is returned as
 * `{ error }` (its code, else its message). Durable open batches stay on disk and doctor reports the store, so the
 * next trigger simply retries.
 */
export function maintainEventStore(cwd, { trustedMain = cwd, shutdown = false, end = false, dispatched = false } = {}) {
  let error = null;
  const attempt = (step) => {
    try { return step(); } catch (cause) { error ??= cause.code ?? cause.message; return undefined; }
  };
  // `trustedMain` may be the root door's call, so a root that cannot be read is this trigger's error, never a fallback.
  const main = attempt(() => (typeof trustedMain === 'function' ? trustedMain() : trustedMain));
  if (!main) return { error };
  const config = attempt(() => readEventStoreConfig(main));
  if (!config) return { error };
  const store = attempt(() => prepareStore(cwd, { trustedMain: main, config: { eventStore: config } }));
  if (!store) return { error };
  const facts = attempt(() => store.maintenance([]));
  if (!facts) return { error };
  const streams = facts.streams.map((row) => row.stream);
  if (shutdown) attempt(() => store.sealAll(streams, []));
  else for (const stream of streams) attempt(() => store.sealIfDue(stream, config.seal.intervalSec, []));
  if (end && !dispatched && syncDue(config, facts.lastAttempt, Date.now() / 1000)) {
    attempt(() => handSyncToChild(main));
  }
  return { error };
}

/** A Work command's seals are not waited for: once its answer is printed, the pending seals go to one short detached
 * `fgos events seal` child per stream. No child (spawn failed, killed first) loses nothing: the events are durable and
 * the next trigger or the `event-store-incidents` pointer covers them (spec §16). */
function handSealsToChild() {
  for (const { root, stream, checkpointPath } of processSealCoalescer.takeHandedOff()) {
    spawnDetachedCli({ cwd: root, args: ['events', 'seal', '--stream', stream, ...(checkpointPath ? ['--history', checkpointPath] : []), '--dir', root] });
  }
}

/**
 * Run `fn` (a command's verb, its answer and its exit code) inside the Event Store lifecycle of spec §16, in this order:
 * the start trigger (only a dispatched worker, never the command that creates the store), the verb, the seal hand-off
 * to a child, the end trigger, then the Land release. Every step after the verb runs whether the verb returned or
 * threw, and the verb's result or error is returned or rethrown unchanged.
 *
 * Facts: `cwd` (the store's project root), `trustedMain` (as for `maintainEventStore`), `dispatched` (a dispatched
 * worker seals inline and never publishes or releases Land), `opensStore` (the verb opens the store: it carries both
 * triggers), `creating` (the verb creates the store: no start trigger), `landed` (the verb ran Land).
 * Callbacks keep this layer free of the shell and of Work: `recordFault(faultClass, message)` receives a trigger error,
 * which never fails the command, and `releaseLand(trustedMain)` releases the candidates Work recorded.
 */
export async function runWithEventStoreLifecycle(
  { cwd, trustedMain = cwd, dispatched = false, opensStore = false, creating = false, landed = false, recordFault, releaseLand },
  fn,
) {
  if (!dispatched) processSealCoalescer.handOff();
  let resolved;
  const main = () => {
    if (resolved === undefined) resolved = typeof trustedMain === 'function' ? trustedMain() : trustedMain;
    return resolved;
  };
  const trigger = (faultClass, policy) => {
    const { error } = maintainEventStore(cwd, { trustedMain: main, dispatched, ...policy });
    if (error) recordFault(faultClass, error);
  };
  if (opensStore && dispatched && !creating) trigger('event-store-start-trigger', {});
  try {
    return await fn();
  } finally {
    handSealsToChild();
    if (opensStore) {
      trigger('event-store-end-trigger', { end: true });
      // A dispatched worker never releases: only the clone owner's own session does (D13). A root that could not be
      // read was recorded by the trigger above; there is nothing to release against.
      if (landed && !dispatched) {
        let root = null;
        try { root = main(); } catch { /* recorded by the end trigger */ }
        // The release is a trigger of the tail like the end trigger: its failure is recorded and never fails the command.
        if (root) {
          try { await releaseLand(root); } catch (cause) { recordFault('event-store-land-release', cause.code ?? cause.message); }
        }
      }
    }
  }
}
