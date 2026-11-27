# Integration gate, plan 261127-0143 (criterion 7)

Run by lead:SUPERVISOR, unconfined, on fg-server2, 2026-11-27 (event ce4f102dcd539e39). Every phase of the plan is on main: phase 1 is 5bb17fec3f, 1a6fb0235a and 98f70f24a6; phase 2 is 1bc47082a8; phase 3 is 46bb5977eb.

## npm test

- The release check run c-2794874 (`npm test -- --test-concurrency=12`) ran on main at about 9a5b0ff5cd, after all of the plan's code had landed. Exit 0: 6552 pass, 0 fail.
- Log: `.fgos/runtime/head-tickets/supervisor-forgent/c-2794874-1795767452888.log` on fg-server2.

## cargo test --workspace --no-fail-fast

- Tested commit: a8dd08119e. Environment: the release environment, `FGOS_STATE_ROOT` set and `TMPDIR=/var/tmp/r`. Exit 101: 458 test binaries pass, 4 tests fail. None of the four touches this plan's code.
  - `fgos-distribution init::tests::holder_lock_gate_drains_a_borrowed_git_background_gc`: passes alone (1/0, twice). It is timing-flaky under full-suite load.
  - `fgos-run-supervisor head_request release_run_answers_with_a_ticket_and_the_detached_run_rolls_back_on_a_failed_probe`: passes alone (1/0). It is load-flaky. This plan touched the same file; the test passes on main.
  - `fgos-execution-engine confinement_policy machine_private_roots_hide_every_listed_root...` fails only with an inherited `FGOS_STATE_ROOT` and passes without it. The cause is environment leakage, which existed before this plan.
  - `fgos-holder-lock status::tests::a_holder_that_is_not_a_fgos_process...` fails the same way: only with an inherited `FGOS_STATE_ROOT`, and it passes without it. It existed before this plan.
- The release recipe now strips `FGOS_STATE_ROOT` (`env -u`), and plan 261127-1224 makes that part of the release door.
- Log: `.fgos/runtime/tmp/cargo-ws-preview2.log` on fg-server2.

## Plan contract check

- `node scripts/plan-contract-check.mjs --plan plans/261127-0143-widen-running-plan-footprint`: exit 0 (ok).
- It warns about footprint overlaps with plans 1224 and 1535. These are warnings by design.

## Verdict

PASS for this plan. Every red above was shown to come from environment or load, and none is caused by the plan's code.
