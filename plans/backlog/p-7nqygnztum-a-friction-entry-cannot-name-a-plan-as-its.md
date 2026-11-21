---
id: p-7nqygnztum
title: "A friction entry cannot name a plan as its subject (observe, priority low; source: `plans/261117-1435-solo-driving-trial/reports/measures-template.md` (phase 1 baseline))"
status: done
priority: P3
area: observe
created: 2026-11-17
---

# Why

`fgos friction record` takes only the subject kinds run, session, executor, case and work, so friction found while driving a plan (the solo-driving trial baseline, 2026-11-17) had to be filed under the session instead of the plan it belongs to, and `fgos friction show <plan>` cannot list it.

# Done when

`plan` is a subject kind, keyed by the plan directory or id through the one convention door, accepted by `friction record` and listed by `friction show`, with one test at the layer that owns the kind list.

# Notes

Migrated from the legacy backlog table. Original status: done (main `3a06491f2`, plan `plans/261118-0936-ops-metrics`: a friction names its plan as a ref, not as its subject: `fgos friction record --ref plan:<dir>` (also `backlog:<id>`, `phase:<id>`), read by `fgos metrics query --kind fgos.friction.recorded --ref plan:<dir>` and counted in `friction rank` `distinctRefs`; `friction show` still lists by subject; the ref kind list is owned by `packages/observe/rust/friction-kinds.json` and its tests in `packages/observe/rust/src/friction.rs`).
