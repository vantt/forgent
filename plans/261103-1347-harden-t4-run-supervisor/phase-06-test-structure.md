---
phase: 06
title: "Test structure: Node crash-matrix rows Rust owns retire (one wiring row kept), crash-matrix-adopt-resume collapsed to one case per resume branch, one wait helper per language"
status: pending
depends_on: [01, 04, 05]
parallel: "none (it touches Rust and Node test files several phases edit)"
effort: ~1d
net_size: "Node 0 / Rust 0 / tests −243 (estimate)"
---

# Phase 06 — Test structure

## Context

[plan.md](plan.md) RT-P12, RT-P17; arbitration §3 "Tests" row; baseline §3.1 (duplicate proofs) and §2.2 (file times: `crash-matrix-adopt-resume` 158 s, `direct-crash-matrix` 89 s, `terminal-crash-matrix` 28 s); design principle 8 (one owning proof, at most one wiring proof per boundary); seats' tests tables (correctness, red-team, simplicity).

Code read on `fcd42ecdc`:
- `test/run-supervisor/direct-crash-matrix.test.mjs` (300 lines): rows 1, 2, 2b, 3, 4, 5, 6, 7a, 7b, 7c, 7d, 8, 9 (`:45-275`).
- `test/run-supervisor/terminal-crash-matrix.test.mjs` (116 lines): rows 1, 2, 3 (`:35, :57, :78`).
- `test/run-supervisor/crash-matrix-adopt-resume.test.mjs` (431 lines): `MODES` direct (7 rows, `:103-160`) and terminal (8 rows, `:228-320`), two bodies per row (`:377` resume, `:398` two adopters) and one "resume after adopt closed" per mode (`:413`); `EXPECT` `:324-330`; a fixed `sleep(4_000)` at `:256`.
- `test/run-supervisor/sweep.test.mjs:116` "two adopters over one dead attempt remove its home once".
- Rust helpers: `tests/support/mod.rs:67` and `tests/portable/mod.rs:54` both define `wait_for`; `tests/support/supervisor.rs:218` and `tests/portable/supervisor.rs:256` both define `wait_until`. Node: `test/run-supervisor/support/direct-harness.mjs:13-21` and `support/terminal-harness.mjs:19-27` each define `sleep` and a poll loop.

## Requirements

- Each retired test is listed with (a) what it asserts, (b) the test that owns each assertion now, (c) anything no owner asserts; a test with a non-empty (c) is kept (RT-P12).
- The one wiring proof of the controller's `awaitSettledResult → adoptRun` loop stays: `direct-crash-matrix` row 3.
- The controller-only rows stay: `direct-crash-matrix` 1, 7a, 7b, 7c (until phase 07 re-points 7b), 7d, 9; `terminal-crash-matrix` 1.
- `crash-matrix-adopt-resume` keeps one case per distinct resume branch of spec §9.1 and mode (RT-P17): `no-binding` (relaunch, two attempts), `binding-no-gate-exit` (gate-lost, unit fails), `gate-exit-no-receipt` (exited from `gate-exit.json`), and one "steps pending" row (direct `result-no-finalize`, terminal `release-slot-pending`); one "resume after adopt closed" case (direct). The two-adopter body goes for every row; `sweep.test.mjs:116` stays as the one Node wiring of two adopters with real step bodies.
- The fixed `sleep(4_000)` (`:256`) becomes a wait on the record it is waiting for, if one is published; otherwise it stays and the report says why.
- One Rust wait helper (`wait_for`, `wait_until`) in one file both `support/` and `portable/` include; one Node poll helper both harnesses import. No other harness merge (the full `support/` + `portable/` merge was not accepted).
- Retired files reported to TEST for `test/suite-baseline.json`; never edit it.

## Files

**Create:** `packages/run-supervisor/rust/tests/support/wait.rs` only if no existing helper file can hold both (prefer `support/mod.rs` included by `portable/` with `#[path]`).

**Modify:** `test/run-supervisor/direct-crash-matrix.test.mjs`, `terminal-crash-matrix.test.mjs`, `crash-matrix-adopt-resume.test.mjs`, `support/direct-harness.mjs`, `support/terminal-harness.mjs`; `packages/run-supervisor/rust/tests/support/mod.rs`, `support/supervisor.rs`, `portable/mod.rs`, `portable/supervisor.rs` and the test files whose `use` lines change.

**Delete:** the duplicate `wait_for`/`wait_until` and the duplicate Node poll loop.

**Tests to retire** (owner after; the lead confirms each by reading the owner):

| Retired | Owner now |
|---|---|
| `direct-crash-matrix` 2 (SIGINT) | `cancel-registry.test.mjs` 1 "SIGINT after the binding: cancel request, receipt cancelled, the resume line, exit 130" |
| `direct-crash-matrix` 2b (SIGTERM) | `cancel-registry.test.mjs` 3 "SIGTERM exits 143" |
| `direct-crash-matrix` 4 (soft deadline, controller dead) | `supervise_lifecycle::a_soft_deadline_stops_the_agent_and_every_descendant`, `supervise_portable::a_soft_deadline_stops_the_agent_and_its_children` |
| `direct-crash-matrix` 5 (hard ceiling, nobody left) | `gate_ceiling::the_hard_ceiling_is_enforced_with_no_supervisor_left`, `gate_portable` (same title) |
| `direct-crash-matrix` 6 (two `fgos run` over one attempt) | `adopt_concurrency::adopt_racing_adopters_leave_exactly_one_winner_and_one_run_of_each_step`; Node wiring `sweep.test.mjs` "two adopters over one dead attempt remove its home once" |
| `direct-crash-matrix` 8 (no lock descriptor reaches the agent) | `gate_terminal_socket::neither_the_agent_nor_its_child_holds_a_lock_description`, `supervise_portable::neither_the_agent_nor_a_step_holds_a_handle_on_the_attempt_lock`, `steps_runner::a_step_holds_no_lock_description`, `gate_pid1::no_process_of_the_attempt_but_the_gate_holds_the_lock` |
| `terminal-crash-matrix` 2 (soft deadline, pane closes) | the fake-herdr test that stops a terminal attempt at its soft deadline and asserts the captured pane closes; if none asserts the close after a deadline, keep row 2 |
| `terminal-crash-matrix` 3 (supervisor killed after the brief) | `supervise_terminal_fake_herdr::a_supervisor_killed_after_the_brief_leaves_the_gate_running_and_adopt_releases_the_slot` |
| `crash-matrix-adopt-resume` "two adopters at once" × every row | `adopt_concurrency` (as above); Node wiring `sweep.test.mjs:116` |
| `crash-matrix-adopt-resume` resume body for `settled-no-result`, `receipt-not-settled`, `all-steps-no-closed` (both modes) and the terminal twins of the kept rows beyond one "steps pending" row | `adopt_matrix::adopt_a_receipt_that_exists_stands_and_only_the_missing_steps_run`, `adopt_matrix::adopt_a_step_that_asks_for_a_retry_leaves_the_attempt_open_for_the_next_adopter`, `release_slot_step` cases; the resume wiring stays in the kept rows |
| `crash-matrix-adopt-resume` "resume after adopt closed" (terminal) | the direct case of the same body |

## Net size

Tests: `direct-crash-matrix` −110, `terminal-crash-matrix` −45, `crash-matrix-adopt-resume` −40 (data rows and the second body), helpers −30, sleep 0 → about −243 lines; about 40 tests fewer; the batch floor file `crash-matrix-adopt-resume` from 158 s to an estimated ≤ 60 s.

## Steps

1. For each candidate, read it and its named owner; fill the (a)/(b)/(c) table in the report.
2. Retire, file by file; run the file and its owners.
3. Helpers (Rust, then Node).
4. Time the three Node files and the Rust crate before and after, same machine and load band.

## Validation (focused)

- FR `test/run-supervisor/direct-crash-matrix.test.mjs test/run-supervisor/terminal-crash-matrix.test.mjs test/run-supervisor/crash-matrix-adopt-resume.test.mjs test/run-supervisor/cancel-registry.test.mjs test/run-supervisor/sweep.test.mjs`
- `cargo test -p fgos-run-supervisor` (whole crate: every test file uses the helpers)
- Report: tests and seconds before/after per file.

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| A retired row proved a Node-side wiring no Rust test sees (real step bodies, real home removal) | M × M | The (a)/(b)/(c) table; a row with a non-empty (c) stays. |
| A collapsed resume row hid a distinct branch | M × M | One kept case per §9.1 branch; the dropped rows name their adopt-matrix owner. |
| Shared helper changes a timeout default | L × L | Keep the parameters explicit at each call. |

## Rollback

Revert the merge. Tests only.

## Done when

The table is complete, every retired test has an owner, the Node floor file is under a minute (or the report says why), helpers single; landed (tests only: no release change needed; guide section says "no action").

## Lead brief essentials

Retire list above; never retire without reading the owner. Find the owning test before writing a new one. Report retired files to TEST. All plan.md lead rules apply.
