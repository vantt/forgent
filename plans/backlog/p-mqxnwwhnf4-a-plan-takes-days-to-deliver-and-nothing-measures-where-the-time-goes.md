---
id: p-mqxnwwhnf4
title: "A plan takes days to deliver and nothing measures where the time goes: build, waiting on the owner, a refused land, a busy machine (observe/supervision, priority high; source: owner via Miu, 2026-11-26 16:2x: 'a plan of ours takes too long to deliver and we cannot say why')"
status: proposed
priority: P1
area: observe
created: 2026-11-26
---

# Why

The owner sees plans of this system take days (plan 261124-2143 ran from 24/11 21:48 to 26/11 about 16:00 for 6 phases; 261125-2313 and 261125-1631 about 16 to 18 hours and still open) where plans elsewhere finish in about 30 minutes, and nothing says why. The secretary's reading from one session, not a measurement: owner questions that had one answer, refused lands (merge slot, foreign staged index, dirty overlap, resource recovery), a full disk and a read-only event store, an expired login, hard footprints that turn each widen into a question, and phases that depend on each other in a chain. The evidence from the when-to-ask shaper (ds-jxoz3h2qgk) covers only the questions part.

# Done when

For every finished plan and every phase, one report states the minutes spent in each cause: unit run, review, waiting on an owner question, refused or waiting land (by refusal code), waiting on a seat or account, waiting on the machine (disk, store). The report is read from records the system already writes or from one new record per wait, not from a head's memory, and a lead can record a wait (see p-dbh2oykqk5, where a lead's friction record is refused). A first read names the largest cause for the last five plans.

# Notes

Related open rows: p-kmavlfevvu (a coach learning from observe metrics and friction), p-24dxhwq7zr (councils cost, to be proven by measurement), p-dbh2oykqk5 (a lead cannot record friction), p-2la4xozwby (defect detection latency, one unmeasured driving measure). The ops-metrics plan (261118-0936-ops-metrics) is done and gave the metrics and friction doors this builds on. Owner order "ghi nhận", 2026-11-26.
