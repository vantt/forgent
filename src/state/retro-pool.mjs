// retro-pool.mjs (tsk-3o3) — picks the next single item for a
// retro-loop iteration to run `fgos-coding-compounding` synthesis on. PURE: no
// fs, no `.fgos/` read, same discipline as cleanup-pool.mjs/
// discover-pool.mjs/frontier.mjs/impact.mjs.
//
// Unlike cleanup-pool.mjs there is no TTL gate here — an item sitting at
// status `retrospective` is already ready for synthesis the moment it
// arrives there (the `delivered -> retrospective` sweep, `fgos
// retrospective`, is the only gate, and it is mechanical/idempotent —
// docs/history/fgos-retro-loop/CONTEXT.md D1).
function isCandidate(item) {
  return item.status === 'retrospective';
}

// The specific latest `delivered -> retrospective` transition event for
// `id` — mirrors cleanup-pool.mjs's `latestCleanupEntry` shape, just
// matching `to: 'retrospective'` instead of `to: 'cleanup'`. Returns
// `undefined` when the item never actually entered `retrospective`.
function latestRetrospectiveEntry(rawEvents, id) {
  const entries = (rawEvents ?? []).filter(
    (e) => e.type === 'work.move' && e.payload?.id === id && e.payload?.to === 'retrospective',
  );
  return entries.at(-1);
}

/**
 * Pick the single next `status:retrospective` item, or `null` when none
 * qualify. FIFO by the item's own `delivered -> retrospective` entry
 * timestamp, oldest first — same ordering rationale as
 * `pickNextCleanupItem`: this is housekeeping/synthesis work, not
 * merge-readiness, so no priority/tier weighting.
 */
export function pickNextRetrospectiveItem(view, rawEvents) {
  const work = view?.work ?? {};
  const candidates = [];
  for (const id of Object.keys(work)) {
    const item = work[id];
    if (!isCandidate(item)) continue;
    const entered = latestRetrospectiveEntry(rawEvents, id);
    if (!entered) continue;
    candidates.push({ id, enteredAt: new Date(entered.ts).getTime() });
  }

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => a.enteredAt - b.enteredAt);
  return { id: candidates[0].id };
}
