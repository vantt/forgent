# Integration report

Tree: `0401d2a3a03d` (phases 1 and 2 landed; base `628d1ee21`). Run on 2026-11-26 in the phase-3 worktree, `--offline`.

## Acceptance criteria

1. **Met.** `cargo test -p fgos-config --features host-provider`: 35 suites ok, 0 failed. The new case is `packages/config/rust/tests/stripped_project_file.rs`, test `a_write_never_creates_a_project_file_the_index_tracks_and_the_working_copy_lacks` (1 passed). It asserts `config-project-file-stripped` for set, patch and project init (lines 109, 130, 148, 170, 195), with a `.fgos` listing (names, bytes, modes) compared before and after.
2. **Met.** The same test, lines 198-213: once the path is untracked the file is created (`done.created`), and a plain directory with no repository creates it too.
3. **Met.** `packages/config/contracts/failure-codes.v1.json:30` lists the code; `fixtures/write.v1.json:629`; `docs/platform/config/spec.md:217` (section 6 rule), `:353` (section 14 row), `:429` (decision history). `failure_matrix` (1 passed) and `fixture_shape` (2 passed) are inside the green 35 suites. `CHANGELOG.md` is deliberately not touched (carried by the launcher plan).
4. **Met, with one gap.** `reports/commit-proofs.md` names the owner of each guard: store-path/skip-worktree drop is `scoped_commit_drops_store_paths_and_ignores_absent_skip_worktree_paths`, and `cargo test -p fgos-git --test scoped_commit_sync` ran 37 passed, 0 failed. Both pre-commit `.fgos` guards are owned by `test/e2e/main-checkout-lock-hook-worktree-commit.test.mjs` (tests `tsk-56u`, `tsk-5pb`). The land `.fgos` restore has no owning test (see Follow-ups).
5. **Met: every failure is shown to come from outside the plan** (full gates below, run unconfined; the sandbox notes that follow are the first attempt).
   - `npm test` did not run. It compiled, then aborted before any test with `EROFS: read-only file system, open '/home/vantt/.local/state/fgos/locks/full-suite.lock'` (`scripts/lib/full-suite-queue.mjs:66`), exit 1. The full Node gate **did not run** on this machine (the sandbox cannot write the state-root lock). This is a different early exit from q-cmio6uyrqz (exit 228).
   - Plan-relevant Node suites ran directly: `node scripts/run-tests.mjs test/scripts/check-decision-citation-drift.test.mjs test/scripts/doc-health.test.mjs` gave 38 tests, 38 pass, 0 fail.
   - `cargo test --workspace` (with `--no-fail-fast`) has 22 failing tests in 9 binaries. All sit in files that have no commit in `628d1ee21..HEAD`, and none reads a file in the plan footprint. The footprint files changed in that range are in `packages/config/**`, `apps/fgos/src/wiring/init.rs`, `docs/platform/config/spec.md`, `scoped_commit_sync.rs`; the range also holds other plans' commits (e.g. `33866f766` mailbox), none of them in a failing test file.

## Failures outside the plan footprint

`git log --oneline 628d1ee21..HEAD -- <file>` was empty for each failing file below (the only touch to `apps/fgos/src/routing.rs` / `mailbox_routes.rs` is `33866f766`, a mailbox fix, not a failing test file).

| Test(s) | Failure | Cause seen |
|---|---|---|
| `apps/fgos` `wiring::doctor::confinement::tests` (7), `internal_lock_routes` (2), `confinement_cleanup` (3), `planning` (1), holder-lock `status::tests::a_holder_that_is_not_a_fgos_process...` (1) | assertion mismatches on dead-process/home counts (e.g. `left: 12, right: 10`) | process/home liveness checks under this sandbox; no config or git-commit code involved |
| `migrate_portfolio::in_a_git_checkout_an_untracked_file_is_never_rewritten` (1), `fgos-distribution` lib (5) | `git-floor-probe-failed: git-driver-io: Read-only file system (os error 30)` | sandbox read-only filesystem; the distribution tests also hit it before reaching any config code |
| `cli_tests::the_execution_route_run_unit_op_refuses_an_option_outside_the_contract...` (1) | `cli_tests.rs:5615` message lacks "objective" (run-unit refusal text) | run-unit refusal wording; not a config write or init path |
| `fgos-component-authority` `model_checks::every_top_level_package_contract_file...` (1) | `packages/agent-context-engine/contracts/effective-rules.v1.json must have exactly one row, found 0` | another plan's contract (`261125-1631-agent-context-engine`); not `packages/config` |

I did not rerun these on the base commit, so "pre-existing on base" is not proven; the evidence is that no failing test file changed and no failure names a footprint file.

## Full gates (unconfined run, main at c5459cba8)

Run by lead:SUPERVISOR on 2026-11-26 10:54 to 11:20 +07 (owner question q-lquw5eeksv). Source: `plans/reports/supervisor-261126-1021-wake-drain.md`, section "lead:SUPERVISOR results".

- `npm test`: exit 1. 6621 tests: 6577 pass, 17 fail, 27 skipped. The 17 failures are in `test/run-supervisor/terminal-cutover.test.mjs` (8), `test/runner/provider-per-cli-credential-sources.test.mjs` (3), `test/workflow/guide-schema.test.mjs` (2), `test/workflow/case-close.test.mjs` (1), `test/install-packaging.test.mjs` (1), `test/scripts/convention-conformance.test.mjs` (1) and `test/git/one-door.test.mjs` (1). Each of these files already failed in the full runs of 2026-11-25 (eb1b2a662, 87abd4c89), before this plan's first land (83e0d71).
- `cargo test --workspace --no-fail-fast`: exit 101. 4492 pass, 2 fail. `every_top_level_package_contract_file_and_every_prose_contract_has_exactly_one_row` also failed on 2026-11-25 (a contract with no row). `an_interrupt_of_the_host_ends_the_bridge_child_and_everything_it_started` fails only in the full run and passed 3 of 3 when run alone, so it is load-sensitive.
- None of the failing files is in this plan's footprint. Not done: a rerun on base `83e0d71^`. The claim that these failures predate the plan rests on the earlier full runs and on the fact that the failing files are the same.

## Follow-ups

- `packages/git/rust/src/land.rs:578-605` (land resets skip-worktree and restores tracked `.fgos` entries from `req.target`) has no owning test. The owning file `packages/git/rust/tests/land.rs` is outside this plan's footprint. Needs its own item to add one proof there. I did not raise it as an event (instructed not to).
- The land.rs follow-up is backlog row p-imgwkzc7zs.
