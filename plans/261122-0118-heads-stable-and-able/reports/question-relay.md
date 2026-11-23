# Question Relay: Time From Ask to Owner Seeing It

Phase 8 measure (step 4) for `plans/261122-0118-heads-stable-and-able`, written 2026-11-23 21:30 (+07) by
head:lead-forgent-261122-0118-heads-b52f9. Capability `code:test`: an evidence read that changes no code.

## Result

19 owner questions were seen by the owner in the window, and 7 more were withdrawn by their askers before anyone saw
them. The ask-to-seen time has a **median of 15.5 minutes and a maximum of 203.1 minutes**. In the 24 hours before the
rule went live (no relay record existed, so only answer times), it was median 76.4 and maximum 863.6 minutes over 11
questions.

Five waits were over 30 minutes. Four of them (110 to 203 minutes) fall in hours when Miu's 15-minute tick did not fire;
see `secretary-wake.md`. The fifth is `q-klz3vkxjee` (51.9 minutes). A tick came 1 minute after it was asked, but there
is no relay record, and the answer came 52 minutes later. Apart from that one, every question asked while the tick was
live was seen within 21 minutes.

Only 4 of the 19 have a `fgos.coordination.question-relayed` record. The other 15 were answered through the secretary
(`answer.via: secretary`) with no relay record before the answer. So either Miu relayed them without recording the relay,
or the owner raised them first. The question store cannot tell these apart, and Miu's transcripts are in her private
confined home, which this lead cannot read. Their seen time is therefore the answer time (step 1's rule), which is an
upper bound. The missing records are carried to the secretary-wake follow-up item.

## Window and rule

- **Window:** `2026-11-22T14:06Z` to `2026-11-23T14:06Z` (21:06 to 21:06 +07). It starts with Miu gen 30, the first
  generation started after both the relay rule (`827bbb7e1`) and the tick (`2fa775706`) landed.
- **Seen** (phase 8 step 1): the earlier of the relay record's `relayedAt` and the answer's `answeredAt`. A question
  cancelled before either was not seen and is left out of the times.
- **Commands:**
  1. Relay records: `fgos metrics query --kind fgos.coordination.question-relayed --by fgos.coordination.questionId,fgos.coordination.askedAt,fgos.coordination.relayedAt --json`
  2. Questions with ask, answer and cancel times: `fgos questions` (it refreshes the fold), then read
     `.fgos/cache/questions.json` (`questions[].asked.askedAt`, `.answer.answeredAt`, `.answer.via`, `.cancelled.at`) and
     keep `askedAt` inside the window.
  3. Miu's ticks: `head-request <ticket> questions list done` lines in
     `.fgos/assignments/head-secretary-miu-<gen>/runs/01/supervisor.log`; the ticket id ends in its epoch milliseconds.
  4. The "before" figures use command 2 over `2026-11-21T14:06Z` to `2026-11-22T14:06Z`.

## Every question of the window

Times are UTC; "next tick" is the minutes from the ask to Miu's next `questions list`.

| question | asked | asker | seen by | ask to seen (min) | next tick (min) |
|---|---|---|---|---|---|
| q-yoxcjqa46z | 11-22 14:51 | supervisor | relay | 14.7 | 14.5 |
| q-dcbq73d2rr | 11-22 14:51 | supervisor | relay | 14.7 | 14.4 |
| q-zcileomdpa | 11-22 19:18 | supervisor | cancelled 11-23 00:01, unseen | - | 248.4 |
| q-4lmw3q6la7 | 11-22 20:34 | supervisor | answer | 203.1 | 172.0 |
| q-br5rlczzav | 11-22 21:37 | supervisor | cancelled 11-23 00:01, unseen | - | 109.1 |
| q-tvhmli3fns | 11-23 00:33 | planner | answer | 11.9 | 11.7 |
| q-7wfzidusod | 11-23 00:41 | supervisor | answer | 3.8 | 3.6 |
| q-swxkda2x5r | 11-23 02:04 | lead | answer | 119.7 | 117.7 |
| q-6rdolvgvz2 | 11-23 02:07 | lead | cancelled by asker 02:14 | - | 114.4 |
| q-3iylevstr2 | 11-23 02:13 | lead | answer | 110.8 | 108.8 |
| q-sieckdvccb | 11-23 02:14 | lead | answer | 162.8 | 107.3 |
| q-3hu7p6iy6p | 11-23 03:32 | lead | cancelled by asker 03:35 | - | 29.8 |
| q-7x7b33ekew | 11-23 03:34 | lead | answer | 28.1 | 27.9 |
| q-klz3vkxjee | 11-23 04:55 | lead | answer | 51.9 | 1.0 |
| q-75yeaifwzn | 11-23 05:46 | lead | answer | 2.8 | 1.3 |
| q-n2o2nbs2or | 11-23 07:59 | shaper | answer | 20.3 | 20.2 |
| q-jwnker2n4y | 11-23 08:27 | shaper | cancelled by asker 08:57 | - | 7.3 |
| q-nudu6zlusf | 11-23 09:58 | supervisor | relay | 7.2 | 7.0 |
| q-7t27x2qfk2 | 11-23 10:44 | supervisor | relay | 6.1 | 6.0 |
| q-ec5bdhkwoz | 11-23 12:16 | supervisor | answer | 21.1 | 3.1 |
| q-ptcieh72p6 | 11-23 12:59 | supervisor | answer | 4.7 | 3.4 |
| q-bioobcr52m | 11-23 13:06 | lead | answer | 15.5 | 9.1 |
| q-jol5tcok22 | 11-23 13:06 | lead | answer | 15.5 | 9.0 |
| q-p5p5q5jlvy | 11-23 13:09 | supervisor | cancelled by asker 13:10 | - | 5.3 |
| q-hlbqhlyrct | 11-23 13:10 | supervisor | answer | 11.0 | 4.4 |
| q-werrxi4i7i | 11-23 13:15 | shaper | cancelled by asker 13:27 | - | 6.4 |

## What woke the secretary

This cannot be decided per question from here. The relay record has no trigger field, and the turn's prompt (tick or
owner typing) is only in Miu's own transcript. The proxy is whether the next tick came within one interval. It did for
the 4 recorded relays, all seen within 15 minutes. For the 4 longest waits there was no tick for 107 to 172 minutes, so
the first turn that could relay was the owner's own or a later restart.

## Unresolved

- Why 15 of 19 answered questions carry no relay record (missed record or owner-first). The rule is in the skill; the
  reason needs Miu's transcripts.
