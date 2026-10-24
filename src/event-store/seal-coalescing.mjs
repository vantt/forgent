// Seal policy of a writer (spec §16). A CLI command (`handOff`, entered by the CLI entry) records each `sealOnWrite`
// append as pending and, once its answer is printed, hands the seal to one short detached child; any other
// process outside a scope seals at once. A process
// that declares itself long-lived (`scope`, entered by the runner's own entry points) only marks the seal pending
// and seals it once: when a unit of work ends (`flush`), when the process leaves the scope, or at the latest
// `eventStore.seal.coalesceSec` after the first pending event. Appends stay durable the moment they return, so a
// kill with a pending seal loses nothing: the events sit in the open batch and the next trigger seals them.
const realClock = { now: () => Date.now(), setTimer: (fn, ms) => setTimeout(fn, ms), clearTimer: (timer) => clearTimeout(timer) };

const sealOptions = (checkpointPath) => (checkpointPath ? { opportunistic: true, checkpointPath } : { opportunistic: true });

export function createSealCoalescer(clock = realClock) {
  let depth = 0;
  let pending = []; // { store, stream, checkpointPath }, one per distinct pair
  let firstAt = 0;
  let timer = null;
  let handingOff = false;
  let handed = []; // { root, stream, checkpointPath }, one per distinct pair, for the CLI entry to hand to a child

  function flush(heldRanks = []) {
    if (timer !== null) { clock.clearTimer(timer); timer = null; }
    const due = pending;
    pending = [];
    for (const { store, stream, checkpointPath } of due) {
      // Opportunistic like the immediate seal: a failure never turns an acknowledged append into a refusal and the
      // durable open batch stays available for the next trigger.
      try { store.seal(stream, heldRanks, sealOptions(checkpointPath)); } catch { /* retried by the next trigger */ }
    }
  }

  return {
    get active() { return depth > 0; },
    get pending() { return pending.length > 0; },
    flush,
    /** The CLI entry declares that this process seals by handing off: appends only record a pending seal. */
    handOff() { handingOff = true; },
    /** The seals recorded since the last call, for the CLI entry to hand to a child once the gate is released. */
    takeHandedOff() { const out = handed; handed = []; return out; },
    /** Seal `stream` now (CLI mode) or mark it pending (long-lived mode). `heldRanks` are the caller's held lock ranks;
     * `checkpointPath` is the consumer's history checkpoint the seal extends; `root` is the main checkout the store belongs
     * to, which a hand-off names to its child. */
    seal(store, stream, heldRanks, coalesceSec, checkpointPath, root) {
      if (depth === 0 && handingOff) {
        if (!handed.some((entry) => entry.root === root && entry.stream === stream)) handed.push({ root, stream, checkpointPath });
        return;
      }
      if (depth === 0) { store.seal(stream, heldRanks, sealOptions(checkpointPath)); return; }
      if (!pending.some((entry) => entry.store === store && entry.stream === stream)) pending.push({ store, stream, checkpointPath });
      if (timer === null && pending.length === 1) {
        firstAt = clock.now();
        timer = clock.setTimer(() => { timer = null; flush([]); }, coalesceSec * 1000);
        timer?.unref?.();
      } else if (clock.now() - firstAt >= coalesceSec * 1000) flush(heldRanks);
    },
    /** Run `fn` as a long-lived writer; the pending seal is flushed when `fn` settles. Sync and async functions both work. */
    scope(fn) {
      depth += 1;
      const leave = () => { depth -= 1; flush([]); };
      let result;
      try { result = fn(); } catch (error) { leave(); throw error; }
      if (typeof result?.then !== 'function') { leave(); return result; }
      return result.finally(leave);
    },
  };
}

/** The coalescer of this process; the consumer gate and the runner share it. */
export const processSealCoalescer = createSealCoalescer();
