// Seal policy of a long-lived writer (spec §16). A CLI command seals each `sealOnWrite` append at once. A process
// that declares itself long-lived (`scope`, entered by the runner's own entry points) only marks the seal pending
// and seals it once: when a unit of work ends (`flush`), when the process leaves the scope, or at the latest
// `eventStore.seal.coalesceSec` after the first pending event. Appends stay durable the moment they return, so a
// kill with a pending seal loses nothing: the events sit in the open batch and the next trigger seals them.
const realClock = { now: () => Date.now(), setTimer: (fn, ms) => setTimeout(fn, ms), clearTimer: (timer) => clearTimeout(timer) };

export function createSealCoalescer(clock = realClock) {
  let depth = 0;
  let pending = []; // { store, stream }, one per distinct pair
  let firstAt = 0;
  let timer = null;

  function flush(heldRanks = []) {
    if (timer !== null) { clock.clearTimer(timer); timer = null; }
    const due = pending;
    pending = [];
    for (const { store, stream } of due) {
      // Opportunistic like the immediate seal: a failure never turns an acknowledged append into a refusal and the
      // durable open batch stays available for the next trigger.
      try { store.seal(stream, heldRanks, { opportunistic: true }); } catch { /* retried by the next trigger */ }
    }
  }

  return {
    get active() { return depth > 0; },
    get pending() { return pending.length > 0; },
    flush,
    /** Seal `stream` now (CLI mode) or mark it pending (long-lived mode). `heldRanks` are the caller's held lock ranks. */
    seal(store, stream, heldRanks, coalesceSec) {
      if (depth === 0) { store.seal(stream, heldRanks, { opportunistic: true }); return; }
      if (!pending.some((entry) => entry.store === store && entry.stream === stream)) pending.push({ store, stream });
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
