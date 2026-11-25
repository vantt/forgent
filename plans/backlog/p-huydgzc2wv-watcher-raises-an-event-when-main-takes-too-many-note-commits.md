---
id: p-huydgzc2wv
title: "The watcher counts the commits main takes by kind and raises an event when notes outrun code (supervision; source: owner, 2026-11-25)"
status: proposed
priority: P1
area: supervision
created: 2026-11-25
---

# Why

The rule "land on main only what another session must rely on later" (`AGENTS.md`, section "Writes to main") is an instruction, so nothing proves a head follows it. On 2026-11-25 main took about 21 commits an hour and 88% were not code: wake reports, parked notes, discussion rounds and backlog rows. The report writer was fixed by changing a skill and the number of report commits fell from 19 to 0, but the total stayed near 21 an hour because notes, discussion rounds and backlog rows filled the space. Measuring by hand took several turns and could not say which head wrote what, because every head commits under one author name.

# Done when

The watcher reads the commits main took in the last hour, sorts them by what they touched (code or config, plan status change, plan note, wake or progress report, discussion round, backlog row) and raises one event when the share of notes, reports and discussion rounds exceeds a configured threshold or the total exceeds a configured rate. The event names the kinds and the counts, not a head, until commits carry the head role. The thresholds live in `core/config-standard`. No new store: the count is a projection read from git, recomputed each tick.

# Notes

Owner approved the mechanism on 2026-11-25 (`ok` to "count commits by kind in the watcher"). It fits the keeper plan `261122-0056-orchestration-skeleton`: the keeper needs a "needs judgement" source, and a high note share is one. It should not wait for that plan if a small definition under `core/watcher/definitions/` is enough, because the watcher already raises events from queries. A later improvement is a commit trailer with the head role so the event can name the writer; do not plan that here. Related: p-rjzck3f7mg (the reduction itself), p-427ymxp33q (the land gate).
