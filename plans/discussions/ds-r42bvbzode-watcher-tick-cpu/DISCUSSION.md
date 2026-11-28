---
id: ds-r42bvbzode
title: "A watcher tick takes twenty minutes of CPU"
status: open
source:
  - p-q3kmkcn2kk
created: 2026-11-28
---

discussion: open

# A watcher tick takes twenty minutes of CPU

## 1. Trạng thái hiện tại

Round 1 (2026-11-28, shaper `watcher-tick-cpu`, fg-server2). Domain: coding (`domains/coding/AGENTS.md`).
Authority: the queue belongs to component `supervision`, the read it calls to component `event-store`
(`fgos authority locate`, 2026-11-28).

Scouted and measured, read-only. The 15 watcher definitions together cost about 11 s; the git-backed observe
sources are not the cost. The leading cause is the event queue: the watcher calls `Queue::raise` once per answered
row, and each call re-reads the whole `project` stream of the Event Store from zero. The definitions answer about
328 rows per tick, almost all duplicates, so one tick reads the stream about 328 times. Proposed direction (§3 R1,
R2): fold once per tick, and let the queue read through the Event Store's existing checkpointed read. No owner
question is open; nothing blocks.

## 2. Mục tiêu & đề bài

The watcher timer fires every 60 s, but on fg-server2 a full `fgos watcher tick` has taken 20-32 minutes of wall
time and as much CPU since 2026-11-27, with a 1.1 GB memory peak. Events (a dead lead, a plan that turns ready, a
parked event) reach the supervisor 20-30 minutes late and one core stays busy all day. The tick grew gradually,
not in one step: median about 100 s on 2026-11-24, 160 s on 2026-11-26, then 700-1300 s from 2026-11-27 (systemd
"Consumed" lines, §5). The goal is a tick that finishes in seconds on this repository, the cause named by
measurement, and a guard that keeps it from coming back. This serves mission #1/#2 directly: every project that
runs fgOS supervision runs this tick, and its cost grows with the project's own event history.

## 3. Vấn đề rõ / chưa rõ

| # | Point | State | Evidence / note |
|---|-------|-------|-----------------|
| C1 | Detection (15 definitions through `metrics query`) is not the cost | clear | Each definition timed alone with the watcher's `--since` (now − 1 day): 0.1-2.7 s, about 11 s in total including 15 process starts. The pace definition `watcher-active` (no window) 2.7 s. Raw `git log --all -- plans` over 870 refs: 2 s. |
| C2 | Where the time goes inside a tick | clear (strong lead, confirmed by the plan's first step) | Journal: the `review-source: plans refused` line appears ~20 s after start, then 20-30 min pass before `watcher tick: woke-supervisor`. After detection the tick loops over rows and calls `ports.queue.raise(event)` for each (`packages/supervision/rust/src/watcher.rs:401`). `Queue::raise` calls `self.fold()` (`packages/supervision/rust/src/queue.rs:216-226`), which calls `fgos_event_store::read::read` with `Cursor::default()` and no view (`queue.rs:332-356`): a read from zero of the whole stream, every row. |
| C3 | How many raises per tick | clear | Definition answers on 2026-11-28 ~19:30: 328 rows; `session-no-result` alone 284, `lead-ended` 15, `plan-done` 11. Nearly all are duplicates of events already raised. 22 min / 328 ≈ 4 s per full stream read, consistent with the backlog's 19 GB read through pipes (each read walks the store's git objects through the Git door under `bwrap`). |
| C4 | Why it grew gradually | clear | Cost ≈ rows × stream size; both grow (the `project` stream is never pruned, and `session-no-result` answers one row per subject over its window). |
| C5 | Existing incremental read | clear | The Event Store already has `read_checkpointed` and `read_with_view` (`packages/event-store/rust/src/read.rs:468-530`), used today only by the Node addon (`packages/git/node-addon/src/event_store.rs:448-459`). Prior art: no batch raise ever existed (`git log -S raise_many`, `-S raise_all`: nothing). |
| R1 | Fold once per tick | proposed | The watcher folds the queue once, decides new vs duplicate in memory, and appends only the new events. Turns 328 reads into one. Change stays inside `supervision`: the queue's raise takes a batch, the single-event raise of `supervisor raise` becomes a batch of one (one door, L10). |
| R2 | The queue reads through the checkpointed read | proposed | Makes the one fold cost the events since the last checkpoint, not the whole history, so the tick stops growing with the store. Reuses the existing event-store door; no new mechanism. Kept `debt-ok`: R1 alone may already reach the target. |
| R3 | `session-no-result` answering 284 rows per tick | out of scope | Duplicates cost nothing once R1 lands. Whether the definition is too noisy is its own question; not this topic. |
| R4 | `review-source: plans refused` log line every tick | out of scope | Noise from legacy plans without plan-v1 frontmatter; costs no time. |
| R5 | Other non-cached sources in one `metrics query` call (git-backed sources re-walk per definition; only the record store is read once) | out of scope | Measured cheap (C1). RUL104: no change without a real cost. |

## 4. Quyết định đã chốt

| D-ID | Decision | Rationale | Date |
|------|----------|-----------|------|

## 5. Q&A log

- 2026-11-28 19:25 (round 1, scout) — Journal of `fgos-watcher-e9756c48.service` on fg-server2, wall time per tick
  by 3-hour window: 2026-11-24 median 93-154 s; 2026-11-25 71-120 s; 2026-11-26 147-371 s; 2026-11-27 704-1241 s
  (one window at 45 s, 18:00-21:00); 2026-11-28 988-1767 s, latest ticks 1913 s and 1767 s.
- 2026-11-28 19:27 (round 1, measure) — Each `core/watcher/definitions/*.query.json` run alone through
  `fgos metrics query --def <d> --since <now−1d> --json` from the main checkout: total ~11 s, largest
  `discussion-settled` 2.7 s; 328 answered rows, 284 of them `session-no-result`.
- 2026-11-28 19:30 (round 1, read) — `Queue::raise` → `fold()` → `read(... Cursor::default() ...)` per row;
  event store offers `read_checkpointed` unused by the queue. Could not time one fold directly: from inside this
  confined head `fgos supervisor queue` and `fgos events status` are refused (request-socket ref and read-only
  `.git/fgos/events/locks`), so the per-read figure in C3 is derived, not measured. The plan's first step measures
  it on the live tick.

## 6. Thiết kế đã chốt {#design}

Not yet regenerated: no decision is settled.

## 7. Danh mục hạng mục / task {#tasks}

Not yet filled.
