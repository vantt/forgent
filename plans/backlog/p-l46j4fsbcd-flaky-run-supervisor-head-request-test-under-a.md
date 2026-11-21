---
id: p-l46j4fsbcd
title: "Flaky run-supervisor head-request test under a full suite (run-supervisor, priority medium; source: lead:S6A, 2026-11-19)"
status: proposed
priority: P2
area: run-supervisor
created: 2026-11-19
---

# Why

`a_ticket_verb_answers_at_once_while_its_detached_runner_outlives_the_route_child` in `packages/run-supervisor/rust/tests/head_request.rs` failed once in a full `cargo test --workspace` run and passed alone and on rerun. A flaky gate test can refuse an unrelated lead's land.

# Done when

The cause is proven (timing bound, shared resource or leaked child) and fixed so the test is deterministic under a loaded full suite; no retry or skip added to make it pass.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
