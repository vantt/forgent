// cleanup-pool.mjs (tsk-dvc) — picks the next single item for a
// cleanup-loop iteration to run `fgos cleanup` on. PURE: no fs, no
// `.fgos/` read, same discipline as discover-pool.mjs/frontier.mjs/
// impact.mjs. Exists specifically so cleanup-loop never calls `fgos
// cleanup <id>` on an item whose TTL hasn't elapsed yet — `assess
// CleanupReadiness` (cleanup-harness.mjs) treats "TTL not elapsed" as a
// failing check exactly like any other, and `bin/fgos.mjs`'s `case
// 'cleanup'` parks ANY failing check straight to `cleanup -> blocked`
// (docs/history/fgos-cleanup-loop/CONTEXT.md D1, "Why a naive loop
// doesn't work").
import { checkCleanupTTLElapsed } from './cleanup-harness.mjs';

function isCandidate(item) {
  return item.status === 'cleanup';
}

// The specific latest `retrospective -> cleanup` transition event for
// `id` — the exact same event `checkCleanupTTLElapsed` reads
// (cleanup-harness.mjs is out of scope to edit per CONTEXT.md's own
// feature boundary, so this mirrors its filter rather than importing a
// timestamp it doesn't export). Returns `undefined` when the item never
// actually entered `cleanup`.
function latestCleanupEntry(rawEvents, id) {
  const entries = (rawEvents ?? []).filter(
    (e) => e.type === 'work.move' && e.payload?.id === id && e.payload?.to === 'cleanup',
  );
  return entries.at(-1);
}

/**
 * Pick the single next `status:cleanup` item whose TTL has already
 * elapsed, or `null` when none qualify. D1
 * (docs/history/fgos-cleanup-loop/CONTEXT.md): FIFO by the item's own
 * `retrospective -> cleanup` entry timestamp, oldest first — no priority/
 * tier weighting, cleanup is housekeeping, not merge-readiness.
 */
export function pickNextCleanupItem(view, rawEvents, { ttlDays, now } = {}) {
  const work = view?.work ?? {};
  const candidates = [];
  for (const id of Object.keys(work)) {
    const item = work[id];
    if (!isCandidate(item)) continue;
    const ttl = checkCleanupTTLElapsed(rawEvents, id, { ttlDays, now });
    if (!ttl.ok) continue;
    const entered = latestCleanupEntry(rawEvents, id);
    candidates.push({ id, enteredAt: new Date(entered.ts).getTime() });
  }

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => a.enteredAt - b.enteredAt);
  return { id: candidates[0].id };
}
