// cleanup-pool.mjs (tsk-dvc) — picks the next single item for a
// cleanup-loop iteration to run `fgos cleanup` on. PURE: no fs, no
// `.fgos/` read, same discipline as discover-pool.mjs/frontier.mjs/
// impact.mjs. This TTL pre-filter is a SCHEDULING OPTIMIZATION, not a
// correctness guard (tsk-4jf, restore-to-decision): `bin/fgos.mjs`'s
// `case 'cleanup'` is itself now a safe no-op when TTL alone hasn't
// elapsed (`assessCleanupReadiness`'s `notReadyYet` never parks
// `blocked` on its own), so calling `fgos cleanup <id>` on a
// TTL-not-elapsed item is harmless either way — this filter exists only
// to skip a verb call already known in advance to be a no-op, saving the
// wasted round trip, not to prevent a bad outcome.
import { checkCleanupTTLElapsed } from './cleanup-harness.mjs';

function isCandidate(item) {
  return item.status === 'cleanup';
}

// The specific latest `retrospective -> cleanup` transition event for
// `id` — the exact same event `checkCleanupTTLElapsed` reads. Mirrors
// that function's own filter rather than importing a timestamp it
// doesn't export. Returns `undefined` when the item never actually
// entered `cleanup`.
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
