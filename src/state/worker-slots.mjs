// worker-slots.mjs — the worker-slot ledger: how many work items are running
// right now, and whether there is room to start another. PURE: no fs, no
// `.fgos/` read, same discipline as plan-pool.mjs/cleanup-pool.mjs/
// frontier.mjs — every caller folds the view itself and hands it in.
//
// The concept is a "worker slot", never "executor": docs/decisions/0026:73-87
// already locked that word for a narrower, unrelated thing (a subTask-scale
// helper unit, not a rootTask lifecycle) and says explicitly that the two do
// not merge.
//
// Two faces, deliberately separate (docs/history/orchestrator-worker-slots/
// plan.md §Shape T1):
//
//   - the read-only face a launcher asks BEFORE it stands a worker up —
//     herdr-plugin opening a pane, fgos-fanout firing an Agent. Cheap, holds
//     nothing, reserves nothing. Those two reach it through `fgos slots`
//     rather than by importing this file: one is Rust and one is prose, and
//     decision 0014 makes the CLI the door.
//   - the enforcing face, called inside claimWork so no claim path can slip
//     past even if a future launcher forgets to ask first.
//
// Both are needed. claimWork only runs AFTER a worker is already standing
// (herdr opens a pane -> claude boots -> /fgOS:discover-next -> take/pick),
// so an enforcing gate alone would cost a whole pane to learn "no room"; a
// pre-check alone would miss any claim path that skips the launcher.
//
// The race between the two faces is accepted on purpose (plan.md): between
// "asked, saw room" and "actually claimed" another launcher can take the last
// slot. No reservation or TTL is added to close it, so a launcher must treat
// a grant as advice and a refusal as final — the enforcing face is the one
// that decides, and it never lets `occupied` exceed `ceiling`.
//
// The ceiling is therefore HARD, not soft at the top edge: the original
// design called for a bounded overshoot (D7/D8), but the enforcing gate
// claims one item at a time and never had a way to honor a batch grant, so
// no overshoot was ever possible. See `hasWorkerSlotRoom` for the full
// supersede.

/**
 * The admin lane (merge/retro/cleanup loops, plus one spare) is a FIXED
 * reservation, not a count (D9). It is deliberately not subtracted from the
 * execution ceiling below: the two lanes measure different things and share
 * no pool. What occupies an admin slot is a long-running loop PROCESS, while
 * the execution ceiling counts work items — and RESEARCH.md F-B established
 * the admin lane never claims a work item at all: every edge it walks is
 * `awaiting-approval -> delivered -> retrospective -> cleanup -> done`, and
 * the only three edges INTO `doing` are `todo`/`blocked`/`awaiting-human`
 * (status-fsm.mjs:100,104,146). So there is nothing here to count, and
 * nothing for a liveness filter to reclaim — the reservation is constant by
 * definition.
 *
 * Constant by definition is also why this is NOT project config (tsk-1oz).
 * It was briefly registered as a `workerSlots.adminReservation` key that
 * `fgos setup` wrote and `fgos doctor` displayed, but nothing ever read:
 * every consumer reports this constant. A dial wired to nothing is worse
 * than no dial, so the key is gone and the number lives here, reported
 * through `fgos slots` for anyone who needs to see it.
 */
export const ADMIN_LANE_RESERVATION = 4;

/**
 * The RECOMMENDED starting ceiling — a suggestion a person copies, never a
 * value the system applies on its own.
 *
 * It is NOT a fallback for a silent config, and (tsk-1oz) it is NOT what
 * `fgos setup` writes either: setup writes `ceiling: null`, present but
 * unarmed. Both would refuse the very next claim in any repo already running
 * more items than this number, and `fgos doctor` asks every project to run
 * `fgos setup` as routine maintenance — so writing a live number would arm
 * the gate on a command nobody runs meaning "cap me now", and freeze the
 * backlog until someone parked work by hand.
 *
 * An absent, null, or malformed `workerSlots.ceiling` therefore means no
 * ceiling at all: the gate stays inert and behavior is identical to before
 * it existed, the same discipline shared-config-file.mjs documents for
 * invariantChecks. A person arms it by writing a real count, which is the
 * only moment the intent is unambiguous. `fgos doctor`'s
 * `worker-slots-ceiling-usable` check reports which of the two a project is
 * in, so "unarmed" is visible rather than silent.
 */
export const DEFAULT_WORKER_SLOT_CEILING = 8;

/**
 * Fold execution-lane occupancy straight off the view (D2): one running work
 * item is one occupied slot, whichever launcher stood it up (D7). No new
 * event type, no new field, and no periodic liveness filter — A6 was dropped
 * rather than deferred, because every flow has a ceiling and a parked item
 * leaves `doing` on its own (status-fsm.mjs's `doing -> awaiting-human` and
 * `doing -> blocked` edges), which frees the slot mechanically. An item stuck
 * at `doing` forever is an INCIDENT — a dead process, a closed terminal —
 * handled out of band by `/fgOS:stale`, never something this count filters
 * for.
 *
 * `sessionId` is the item's folded `writer.id`. Treat it as "the last session
 * that wrote to this item", not a guaranteed "the session that claimed it":
 * replay.mjs folds `writer` latest-write-wins on `work.edit` as well as
 * `work.move`, so an unrelated edit after the claim overwrites it. The
 * occupancy COUNT is unaffected either way, since the unit is the work item.
 *
 * `excludeId` omits one item from the count — the item a caller is about to
 * claim. An item already sitting at `doing` (a `blocked` branch-take, or a
 * stale-claim reclaim) is already holding its slot, so counting it again
 * would refuse the one claim that cannot possibly consume a new slot, and
 * would leave a stale item at the ceiling permanently unreclaimable.
 */
export function countWorkerSlots(view, { excludeId } = {}) {
  const work = view?.work ?? {};
  const items = [];
  for (const id of Object.keys(work)) {
    const item = work[id];
    if (!item || item.status !== 'doing') continue;
    if (excludeId !== undefined && id === excludeId) continue;
    items.push({ id, sessionId: item.writer?.id, claimRole: item.claimRole });
  }
  return {
    execution: { occupied: items.length, items },
    admin: { reserved: ADMIN_LANE_RESERVATION },
  };
}

/**
 * Is there room in the execution lane, and for how many?
 *
 * `granted` is how many of `batchSize` the caller may actually stand up:
 * `min(batchSize, free)` once a ceiling is armed, the whole batch when none
 * is. A launcher trims its batch to this number.
 *
 * This SUPERSEDES the whole-batch rule (DISCUSSION.md D8), which said a
 * pre-computed batch passes whole while any slot is free, overshooting the
 * ceiling by a bounded margin that could not compound. That rule was never
 * implemented and could not be, without machinery the same plan rejected:
 * the enforcing gate lives inside `claimWork`, which claims exactly ONE item
 * and re-folds the log per call, so it has no concept of a batch to honor a
 * whole-batch grant with. Nothing overshot — a batch of five against one
 * free slot landed one item and refused four, deterministically, every time.
 * Honoring the original rule would have required a reservation token held
 * across claims, which is the reservation/TTL machinery the plan turned down
 * on purpose.
 *
 * So the ceiling is hard, not soft: `occupied` never exceeds `ceiling`. The
 * launcher-side cost the old rule was avoiding — a batch split across two
 * waves — is real but cheap, and strictly cheaper than standing up workers
 * that die at the claim door. `granted` is the number that makes trimming
 * possible instead of leaving each launcher to guess.
 *
 * A `ceiling` that is absent or not a positive integer means no ceiling —
 * `allowed: true`, always. Callers configure a real number through
 * `workerSlots.ceiling`; silence is not a reason to start refusing work.
 */
export function hasWorkerSlotRoom(view, { ceiling, batchSize = 1, excludeId } = {}) {
  const { execution } = countWorkerSlots(view, { excludeId });
  const occupied = execution.occupied;
  const size = Number.isInteger(batchSize) && batchSize > 0 ? batchSize : 1;

  if (!Number.isInteger(ceiling) || ceiling <= 0) {
    return { allowed: true, occupied, ceiling: null, free: null, granted: size, reason: 'no-ceiling-configured' };
  }

  const free = Math.max(0, ceiling - occupied);
  if (free === 0) {
    return { allowed: false, occupied, ceiling, free, granted: 0, reason: 'ceiling-reached' };
  }
  return { allowed: true, occupied, ceiling, free, granted: Math.min(size, free), reason: 'room-available' };
}
