---
id: ds-sovgvawfyv
title: "Red tests on main and the docs/backlog.md sweep"
status: settled
source:
  - p-vnsigyw6h7
created: 2026-11-22
---

discussion: settled

## Hand-off to the planner

- **Outcome:** `npm test` and `cargo test --workspace` are green on main, and no file still names `docs/backlog.md` or `docs/discussions` except the migration reader, the pre-move history fallback and their tests.
- **Constraints (owner, 2026-11-22 07:52):** P1, ranked below plan `261122-0118-heads-stable-and-able`. ONE lane. The footprint is disjoint from 0118's; 0118 holds `test/session-host/head-start.test.mjs`, so that case goes to 0118 or waits for it. No assertion is weakened; a stale test is updated to the landed behaviour.
- **Non-goals:** the execution-door seam reds (`dispatch-reconciliation-import-graph`), which lead:S6A fixed in p20-3a; the reds that look environmental (one-door scan, install-packaging EISDIR, `cli_tests.rs:3666`, `supervise_portable.rs:274`, `mailbox-live-confined.test.mjs:289`), which are only re-measured and shown environmental or opened as their own row.
- **Acceptance criteria:** every red in the Notes triage of `p-vnsigyw6h7` is green or shown environmental with evidence; the path sweep is redone on the current tip, not copied from the abandoned `261120-0625-work-data-model-p05k` draft; `policy.v1.json` changes go through its golden recorder; both suites green.
- **Evidence:** the Notes of `plans/backlog/p-vnsigyw6h7-two-tests-are-red-on-main-head-start-probe.md` (cause commit per red); full-suite logs `forgent-worktrees/main-npm-test-ce1ef4d36.log` and `main-cargo-test-ce1ef4d36.log`.
- **Open points:** none.

## Log

- 2026-11-22 08:20, lead:SUPERVISOR: written for the secretary, who cannot create files, so the supervisor head can start one planner. No shaping rounds were needed; the backlog row carries the triage.
