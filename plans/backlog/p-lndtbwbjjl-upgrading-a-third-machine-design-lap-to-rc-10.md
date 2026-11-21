---
id: p-lndtbwbjjl
title: Upgrading a third machine (design-lap) to rc.10 surfaced five setup/runtime faults (runner and config, priority medium)
status: proposed
priority: P2
area: runner
created: 2026-11-15
---

# Why

Reported by LAND on 2026-11-15: (a) cargo run outside a worktree ignores `rust-toolchain.toml`, so a stale default toolchain (1.96.1) is used unless `RUSTUP_TOOLCHAIN=1.99.0` is set; (b) a global `executors.<id>.invocations` REPLACES the standard invocation list instead of merging, so claude loses `credentialStore`/`sessionDir` and `probe-session` answers `dir-undeclared` until the key is removed; (c) the new `executor-family-unique` doctor check fails on a legacy `pi` executor sharing the openai family; (d) every run prints `credential refresh-ahead for thehive/thehive (pi): skipped (unexpected-shape)`; (e) `fgos run` with no `--provider` picks gemini through agy-herdr and ends `infra-exec-failed`/no report (predates rc.10), while deepseek through thehive passes.

# Done when

Each fault has a cause and a fix or a decision: (a) the documented build path pins the toolchain or doctor names it; (b) the invocation merge rule is explicit in config-standard and probe-session works with a global override; (c) the check's fix or message handles a legacy executor; (d) refresh-ahead noise is logged once or not on the normal path (with p-d3vxsgz6to); (e) the default pick and the agy-herdr failure are diagnosed.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
