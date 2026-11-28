---
contract: plan-v1
title: "The watcher tick reads the supervision queue once: batch raise with one fold, and the fold through the checkpointed read"
status: running
priority: P1
blockedBy: []
base: f7ead28d30bd1afe43220ec35e23895f0434b5fb
footprint:
  - plans/261128-2236-watcher-tick-reads-queue-once/**
  - packages/supervision/rust/src/queue.rs
  - packages/supervision/rust/src/watcher.rs
  - packages/supervision/rust/tests/queue.rs
  - packages/supervision/rust/tests/watcher.rs
  - apps/fgos/src/wiring/supervision.rs
  - docs/platform/supervision/spec.md
  - changelog.d/261128-2236-watcher-tick-reads-queue-once.md
source:
  - plans/discussions/ds-r42bvbzode-watcher-tick-cpu/DISCUSSION.md
  - p-q3kmkcn2kk
created: 2026-11-28
host: fg-server2-jdp2bv
lead: head:lead-forgent-261128-2236-watche-dc5b6
---

# The watcher tick reads the supervision queue once

Written from the settled discussion `ds-r42bvbzode` (D1-D4, §6, §7). Every choice cites the decision it honors;
none is reopened. `host` is fg-server2 because the discussion names that machine for both live measurements (D1,
D4): the before figures and the after check are taken on its watcher and its Event Store.

Today a full `fgos watcher tick` takes 20-32 minutes on fg-server2. After detection (about 11 s, C1) the tick calls
`Queue::raise` once per answered row (`packages/supervision/rust/src/watcher.rs:420`), and every call folds the
queue by reading the whole `project` stream from zero (`packages/supervision/rust/src/queue.rs:216-226`, `fold` at
`:327`). About 328 rows answer per tick, almost all duplicates (C3), so one tick reads the stream about 328 times.

## Outcome

A full watcher tick on this repository finishes in seconds again. The raise step hands every answered row to the
queue as one batch; the queue folds once, marks each event `New` or `Duplicate` exactly as today, and appends only the
new ones in one append (D2). The single raise of `fgos supervisor raise` is a batch of one, and the per-row raise
path is gone (L10). The fold reads through the Event Store's existing `read_checkpointed`, so its cost follows the
events added since the last read, not the whole history (D3, debt-ok). The cause is confirmed by a live measurement
before any code changes (D1), and one watcher test keeps the one-read property (D4).

## Acceptance criteria

1. [core] Before any code change, one live full tick on fg-server2 is measured per step (detection, raise loop with
   its queue-read count, wake), and `reports/measure-before.md` names which step takes the time and how many queue
   reads it made (D1). If the raise loop is not the dominant cost, the plan stops here (pre-approved fallback, D1):
   phases 2-4 are withdrawn and the numbers go back to shaping.
2. [core] A tick whose definitions answer N rows reads the queue's stream once for the raise step. Owned by one test
   in `packages/supervision/rust/tests/watcher.rs` with a counting sink (N > 1 rows, one batch call, one fold); the
   batch semantics of D2 (an id raised before answers `Duplicate`, an id twice in one batch is appended once and
   answers `New` then `Duplicate`, an empty batch writes nothing, a bad event refuses `bad-event` and writes nothing)
   owned by `packages/supervision/rust/tests/queue.rs`. Verify: `cargo test -p fgos-supervision --test watcher
   --test queue`.
3. [core] After the change is released and activated on fg-server2, three consecutive full ticks each finish in at
   most 60 s wall time, recorded in `reports/measure-after.md` next to the before figures (D4).
4. [debt-ok] The queue's fold reads through `read_checkpointed`, and `reports/measure-after.md` shows one fold's cost
   on the live store before and after (D3).

## Non-goals

- The `session-no-result` definition's row volume (R3).
- The `review-source: plans refused` log line (R4).
- Caching git-backed observe sources inside one `metrics query` call (R5).
- Pruning or compacting the Event Store.
- Any change to the Event Store crate: it is used only through `read` and `read_checkpointed` (constraint, D3).
- Per-step timing measures in the tick's telemetry span: the measurement uses doors that exist today (RUL104).

## Authority map

| New thing | Model row | Note |
|---|---|---|
| Batch raise on the supervision queue (`Queue::raise` takes a batch, one fold, one append); the single raise becomes a batch of one | supervision | Changed contract of an existing door, not a new one. survivor: `Queue::raise` (batch form); retired: the per-event `Queue::raise(RaisedEvent)` in `packages/supervision/rust/src/queue.rs` and the per-event `EventSink::raise` in `packages/supervision/rust/src/watcher.rs`, every caller moved in the same change (L10). |
| The queue's fold reads through `read_checkpointed` with a checkpoint file | event-store | Reuse of the existing event-store read door (`packages/event-store/rust/src/read.rs:494`); nothing is added to the event-store component. |

Both rows were returned by `fgos authority locate "the supervision queue raises a batch of events with one fold of
its event-store stream"` on 2026-11-28 (`supervision` and `event-store`, matched on canonical). Nothing is declared.

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Measure one live tick before the change](phase-01-measure-before.md) | - | plans/261128-2236-watcher-tick-reads-queue-once/reports/measure-before.md | 1 | draft |
| 2 | [Batch raise with one fold](phase-02-batch-raise.md) | 1 | packages/supervision/rust/src/queue.rs, packages/supervision/rust/src/watcher.rs, packages/supervision/rust/tests/queue.rs, packages/supervision/rust/tests/watcher.rs, apps/fgos/src/wiring/supervision.rs, docs/platform/supervision/spec.md, changelog.d/261128-2236-watcher-tick-reads-queue-once.md | 2 | draft |
| 3 | [The fold reads through the checkpointed read](phase-03-checkpointed-fold.md) | 2 | packages/supervision/rust/src/queue.rs, packages/supervision/rust/tests/queue.rs | 3 | draft |
| 4 | [Integrate, release and measure live](phase-04-integrate-release-measure.md) | 2, 3 | plans/261128-2236-watcher-tick-reads-queue-once/reports/measure-after.md | 4 | draft |

The phases are serial. Phases 2 and 3 both write `queue.rs`, and phase 3 changes the fold that phase 2's batch
raise calls, so a parallel split would be a hot-file collision with nothing to gain: each phase is a few hours. Phase 3
stays its own phase because criterion 4 is `debt-ok`: if the checkpointed fold fails, its branch is dropped alone and
recorded as debt while phases 2 and 4 go on.

Contract check of this table, read by hand and by `node scripts/plan-contract-check.mjs --plan
plans/261128-2236-watcher-tick-reads-queue-once`: every phase sits in a later wave than its dependencies; no wave
holds two phases, so no footprints can overlap within a wave.

## Unattended run

### Host steps
| step | argv | executor |
|---|---|---|
| time one queue fold on the live store, three runs, before the change (phase 1) | fgos supervisor queue --json | supervisor |
| read the last full ticks' raised, duplicate and outcome per tick, before the change (phase 1) | fgos metrics query --kind fgos.watcher.tick --since <now-3h> --json | supervisor |
| re-time detection: every watcher definition in one call, as the tick runs it (phase 1) | fgos metrics query --def core/watcher/definitions --since <now-1d> --json | supervisor |
| full gate on the integrated tree (phase 4) | fgos release check --worktree <path> | lead |
| release and activate the landed change on fg-server2 (phase 4) | fgos release run | supervisor |
| time one queue fold on the live store, three runs, after activation (phase 4) | fgos supervisor queue --json | supervisor |
| read three consecutive full ticks after activation (phase 4) | fgos metrics query --kind fgos.watcher.tick --since <activation time> --json | supervisor |

`fgos supervisor queue` and `fgos release run` answer `allow` for the supervisor, `fgos release check` for the lead
(`packages/session-host/contracts/head-permissions.v1.json`). `fgos metrics query` has no row for any head persona,
so it answers `ask`: the table files one owner question carrying the exact argv when the supervisor sends it. That is
the table's normal path, not a widened grant; the lead asks the supervisor for these rows with
`fgos supervisor raise --kind coordination-help` naming the argv. Phase 1 needs only the `supervisor queue` timing to
decide dominance (the row count is already measured in DISCUSSION §5, 328 rows); the two `metrics query` rows refine
it and may be answered later without holding phase 2.

### Cleanup
Standing rule.

### Beyond the rule
None.

### Split
Serial: a measurement gate, the batch raise, the checkpointed fold, then one integration phase that releases and
measures. The fix goes out as one release rather than staged releases, because the
change is internal to one component, the event format and the stream are unchanged, and the reverse path is a single
revert of the phase commits plus `fgos release run --rollback`.

## Owner questions

None. The live reads that answer `ask` (above) file their own question at run time with the exact argv.

## Risks and rollback

- **Raise loop not dominant (D1).** Phase 1 stops the plan; phases 2-4 go `withdrawn` and the numbers return to
  shaping. Nothing was changed.
- **Order of actions inside a tick.** Today the tick runs each new event's action right after its own append; after
  the change all appends of the tick happen first, then the actions in row order. Counts, the wake choice (oldest
  event routed to a wake) and the `StartReview` retry on a duplicate are unchanged (D2); an action never read the
  queue, so no action can observe the difference. Phase 2's watcher tests keep the counts and wake choice.
- **A stale own-stream position during the batch append.** The batch keeps today's `retrying` loop: refold and retry
  the whole batch, so the `New`/`Duplicate` answers come from the fold the append was checked against.
- **Checkpoint file wrong or shared badly (D3).** `read_checkpointed` ignores a file that does not match the store
  and walks from zero, so the answer never depends on the file. If the checkpointed fold fails its tests or the live
  check, revert phase 3's checkpoint commit alone and record criterion 4 as debt; criteria 1-3 stand.
- **Rollback.** `git revert` of the phase 2 and phase 3 commits on main, then `fgos release run` (or
  `fgos release run --rollback` while the release step is in flight). No store data changes: the batch appends the same
  `supervision.event-raised` envelopes the per-row path appended, and the checkpoint file is a cache the store
  overrides.
