---
id: p-du3gbevrs5
title: "The watcher's oldest-unhandled-event fallback wakes the supervisor even for kinds whose action is none (supervisor, priority high; source: owner via Miu, 2026-11-23, evidence from heads-stable phase 9)"
status: proposed
priority: P1
area: supervisor
created: 2026-11-23
---

# Why

Plan `261122-0118-heads-stable-and-able` phase 9 set `watcher.actions.session-idle: none` and measured 24 hours after: wakes went from 13.9 to 15.3 per hour and supervisor head starts from 4.8 to 7.5 per hour. All 319 `session-idle` rows were false and none was true. The cause is in `packages/supervision/rust/src/watcher.rs` (tick, lines 352-358): when no newly raised row routes to a wake, the tick wakes the supervisor on the oldest unhandled event of any kind and never reads that kind's `actions` entry, so an action of `none` only delays the wake by one tick. This has been so since the watcher was written (`4c0336ae8`, 2026-11-18). Evidence: `plans/261122-0118-heads-stable-and-able/reports/after-wake-and-idle.md`.

# Done when

The fallback skips kinds whose action is not `wake-supervisor`. One owning test in the watcher crate drives an unhandled `session-idle` row with action `none` and shows no wake. The same measurement as the phase 9 report, run again over 24 hours, shows the `session-idle` wakes near zero (they were 146 per day, about 40% of all wakes). This corrects existing code and adds no mechanism. A true idle lead must still reach the supervisor, so it is checked together with `p-4uqiyjwrtd`.

# Notes

Owner approved 2026-11-23. Raised by the lead of plan `261122-0118-heads-stable-and-able` as coordination-help `8b3c7ba3128e2c17`; related `p-4uqiyjwrtd`, `p-ogziciqtrb`.
