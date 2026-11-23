# Secretary Wake: Before and After the 15-Minute Tick

Phase 10 measure (step 4) for `plans/261122-0118-heads-stable-and-able`, written 2026-11-23 21:30 (+07) by
head:lead-forgent-261122-0118-heads-b52f9. Capability `code:test`: an evidence read that changes no code.

## Result

The tick (option C's half A, landed as `2fa775706`) cut the owner's wait for a question by about five times at the
median. It did not hold its promised bound, "at most one tick", through the whole window.

| | Before (2026-11-21 14:06Z to 2026-11-22 14:06Z) | After (2026-11-22 14:06Z to 2026-11-23 14:06Z) |
|---|---|---|
| Questions seen by the owner | 11 | 19 |
| Ask to seen, median | 76.4 min | 15.5 min |
| Ask to seen, maximum | 863.6 min | 203.1 min |
| Seen within 21 min | 4 of 11 | 12 of 19 |

"Seen" and the commands are phase 8's (`question-relay.md`). Before the rule there was no relay record, so the "before"
column uses answer times only.

## Was the tick live?

The tick shows in each generation's `supervisor.log` as a `questions list` request every 15 minutes. The command is
`.fgos/assignments/head-secretary-miu-<gen>/runs/01/supervisor.log`, with lines `head-request <ticket> questions list
done`; the ticket ends in epoch milliseconds. Gen 31 never started (`start-refused`, provider capacity, 15:27Z).

| gen | live (UTC) | `questions list` calls | gaps between them (min) | tick held |
|---|---|---|---|---|
| 30 | 11-22 14:06 to 15:23 | 6 | 15, 15, 15, 15, 15 | yes |
| 32 | 11-22 15:29 to 23:26 | 2 | 28; then silent 17:07 to 23:26 | **no** |
| 33 | 11-22 23:26 to 23:44 | 2 | 18 | yes (short) |
| 34 | 11-22 23:48 to 11-23 01:16 | 4 | 16, 41, 32 | **partly** |
| 35 | 11-23 01:16 to 05:47 | 8 | 165, 0, 55, 1, 1, 49, 0 | **no** |
| 36 | 11-23 05:47 to 05:49 | 1 | - | too short |
| 37 | 11-23 05:54 to 07:30 | 3 | 66, 28 | **no** |
| 38 | 11-23 07:31 to 07:55 | 1 | - | no call after start |
| 39 | 11-23 07:55 to 08:49 | 4 | 24, 15, 15 | yes |
| 40 | 11-23 08:49 to 09:52 | 5 | 18, 15, 15, 15 | yes |
| 41 | 11-23 09:52 to 12:19 | 11 | 13, 15 x8, 8 | yes |
| 42 | 11-23 12:19 to 13:05 | 7 | 13, 15, 1, 12, 3, 2 | yes |
| 43 | 11-23 13:05 to 14:00 | 7 | 9, 0, 7, 8, 15, 15 | yes |

The tick held in 7 of the 13 generations in the table (gens 30, 33 and 39 to 43). It did not fire for hours in gens 32,
35 and 37, and only partly in gen 34. Gen 32 made no request of any kind from 17:07Z to 23:26Z, and gen 35 none from
01:29Z to 04:02Z. Those two silences hold the four longest waits of the window (110 to 203 minutes). From gen 39 on
(07:55Z), the tick held in every generation.

## Why some generations did not tick

Not settled. The tick is armed in the turn that runs the start ritual, so a generation that never armed it, or whose
loop stopped, would look like this. Which one it was is in Miu's transcripts, which sit in her private confined home and
cannot be read from this lead's sandbox. The `B` half of option C, a watcher wake owned by plan
`261122-0056-orchestration-skeleton` (handoff raised 2026-11-22), would not depend on the tick being armed.

## Verdict for the phase

- Delivered: the timer is in the secretary skill and is re-armed on every start, the `coordination-handoff` for the
  event-driven half is raised, and this before/after measure is done.
- Not met: the bound "at most one tick" in generations 32 and 34 to 37 (2026-11-22 15:29Z to 2026-11-23 07:30Z).
- Carried: the cause of the missed ticks, and the 15 answered questions with no relay record (`question-relay.md`), are
  raised to the supervisor as a follow-up item. This plan does not fix them; the fix needs Miu's transcripts.
