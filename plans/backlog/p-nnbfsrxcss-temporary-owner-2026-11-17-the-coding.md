---
id: p-nnbfsrxcss
title: "TEMPORARY (owner 2026-11-17): the coding capability rows stay as named debt until S7; plan the real fix (capability, priority high)"
status: proposed
priority: P1
area: runner
created: 2026-11-17
---

# Why

Capability step 2 (S5, plans/261115-2328-execution-read-door, Q3 = c) deletes the council, business and marketing rows, but keeps `fgos-coding-implement`, `code:implement|review|debug|test|refactor`, `docs:write` and `coding:*` as `doors` debt with `retiredBy: S7`. They still carry behaviour that belongs elsewhere: the coding skills' `decide --for code:implement` routes only through the row's prefer pool (`fgos-coding-implement/SKILL.md:64`); Work dispatch names `fgos-coding-implement` and `code:review` (`work-dispatch.mjs:301`, `work-compat.mjs:57`); `code:review` and `code:debug` carry `host-write-denied` confinement and bwrap pins; `fgos-coding-implement` pins `gemini#omp-herdr-bwrap`; the default red-team checker is keyed by `code`/`code:*` (`seat-resolver.mjs:35-38`); `coding:*` and `docs:write` carry tiers. The owner accepted this as a stopgap only.

# Done when

A written plan (owner-reviewed) decides where each of those behaviours lives for good (generic job + unit tier, confinement on the generic `review` job or the unit, the red-team default keyed by something other than a business row, how skills and Work name their job) and removes every coding row with no debt left; it is scheduled with the S7 Work step or earlier if the plan shows it can be done without touching Work.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
