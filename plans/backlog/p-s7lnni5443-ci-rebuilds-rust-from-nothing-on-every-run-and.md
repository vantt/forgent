---
id: p-s7lnni5443
title: CI rebuilds Rust from nothing on every run and every main push queues a full run (CI, priority high; owner 2026-11-13, scheduled 2026-11-15 right after the capability-reads plan)
status: done
priority: P1
area: platform-foundations
created: 2026-11-13
---

# Why

GitHub-hosted runners keep no Rust build cache between runs, so each run pays the full compile; every push to main, including board-only and plan-only commits, starts the whole CI and Release-assets workflows with no cancel of older runs. On 2026-11-14/15 this queued 15+ main runs for hours and starved the rc.9 publish job for about 80 minutes; superseded runs had to be cancelled by hand. Done 2026-11-15: cache and cancel landed (ccd8a2c43); main keeps its running run (cabfecd2c), because cancelling left no run finished and no cache saved. Measured on green main: test job 54 min cold and 43.3 min warm (before: 36-46 min), cargo job 14.4-14.8 min warm (before: 15-17). The cache barely helps, because the wall time is test execution. Sharding the test job is the follow-up (plans/261115-1744-ci-test-shards).

# Done when

Test workflows restore and save a Rust build cache keyed on Cargo.lock and the toolchain (the release build stays on clean runners); main-push workflows use a concurrency group with cancel-in-progress so only the newest head runs; commits that touch only `plans/**` (and other docs-only paths named in the change) start no test workflow; a measured before/after run time is recorded.

# Notes

Migrated from the legacy backlog table. Original status: done.
