---
id: ds-owool5pjhn
title: "Delete the dead tier-5 Node execution modules and their tests"
status: settled
source:
  - p-24xw2cwdvo
created: 2026-11-22
---

discussion: settled

## Hand-off to the planner

Seeded by the secretary from backlog row `p-24xw2cwdvo` on lead:SUPERVISOR's request, 2026-11-22 18:24. The owner decided at 18:23 (option B of lead:S6A's question) and at 18:27 that this deletion runs immediately after its blockers; the row already holds Why, Done when and Notes, so no shaping round is needed.

- **Outcome:** the dead Node execution modules (about 80 files in `src/runner/dispatch`, `src/runner/execution`, `src/run-supervisor`, reachable only from tests) and the about 170 test files that test them directly are deleted. Every production caller already reaches Execution only through the door.
- **Constraints:** priority P1. `blockedBy`: plan `261122-0118-heads-stable-and-able` and plan `261118-1341-s6a-execution-tier-rust` (its phase 22). The plan is ordered first after those two. The deletion is mechanical because lead:S6A's facades are in place. Run one suite at a time and keep cargo builds inside one worktree (disk and memory). L10: nothing replaced stays behind.
- **Non-goals:** new behaviour; changing the Rust engine; touching the files `261122-0118` still edits before it lands.
- **Acceptance criteria:** the listed Node modules are gone; every retired test names the Rust test that now owns its behaviour (design principle 8) or states the behaviour was removed; no production or test import of a deleted path remains; `npm test` and `cargo test --workspace` are green.
- **Open points:** none blocking. Prior art: the planner reads lead:S6A's phase 21 and 22 records for the exact file list.
- **Source ids:** `p-24xw2cwdvo`.
