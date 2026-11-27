# Phase 2: Release checks run in a check checkout (rule, port and host adapter)

Capability: `code:implement`, then `code:review`. Starts after phase 1 is on main.

## Inputs

- `plans/261127-1224-release-checks-clean-tip/plan.md`: Outcome, "Decisions settled inside the frame" (all three
  points and the paragraph after them), acceptance criteria 1 and 3.
- `packages/session-host/rust/src/release.rs`: `ReleasePorts`, `Outcome` (`code`, `report_line`, `to_value`),
  `steps` (the `for check in &recipe.checks` loop, the two `land_check` calls), `rollback_steps`.
- `packages/session-host/rust/tests/release.rs`: the `Fixture` and its `ReleasePorts` impl; existing tests
  `the_first_failing_check_refuses_the_release_before_anything_is_applied` and
  `every_outcome_that_changed_or_refused_something_reports_to_the_owner`.
- `packages/run-supervisor/rust/src/head_request.rs`: `HostRelease` (`host_json`, `recipe_command`
  `current_dir(&self.cfg.cwd)`, `trunk_tip` via `fgos_git::GitDriver::open_at`, `run`, `report`, `log`),
  `RELEASE_STEP_TIMEOUT`.
- `packages/run-supervisor/rust/tests/head_request.rs`: `release_host` (the fake host script), `commit_in`,
  `release_run_answers_with_a_ticket_and_the_detached_run_rolls_back_on_a_failed_probe` (its recipe has
  `"checks": [["true"]]`).
- `packages/run-supervisor/contracts/head-request.v1.json`: the `release run` entry (`does`, `result`).
- Phase 1's Git driver method (in `packages/git/rust/src/worktree.rs`).
- The verbs: `fgos worktree create <path> --detach --base <ref>` and `fgos worktree remove <path> --delivered-to <ref>
  --discard-ignored` (`apps/fgos/src/wiring/worktree.rs`, read only).

## Files this phase may write

`packages/session-host/rust/src/release.rs`, `packages/session-host/rust/tests/release.rs`,
`packages/run-supervisor/rust/src/head_request.rs`, `packages/run-supervisor/rust/tests/head_request.rs`,
`packages/run-supervisor/contracts/head-request.v1.json`.

## Steps

1. Impact: `fgos dispatch decide --for impact-analysis --json`; with GitNexus present, `impact` upstream on
   `ReleasePorts`, `steps` and `HostRelease`; report the blast radius in the review note.
2. `release.rs`, the port: `ReleasePorts` gains `make_check_checkout(&self, tip: &str) -> Result<PathBuf, String>`
   and `remove_check_checkout(&self, path: &Path, tip: &str) -> Result<(), String>`; `run` gains the directory it
   runs in (`Option<&Path>`, `None` = the project root). Doc comments say what each does. Every implementer moves
   in this phase (the fixture and `HostRelease`); no old signature stays (L10).
3. `release.rs`, the rule, in `steps`: when `recipe.checks` is empty, make no checkout. Otherwise, after the first
   `land_check` and before the first check, `make_check_checkout(tip)`; an error ends the run with the new outcome
   code `check-checkout-failed` (add it to `Outcome`/`failed` codes; it reports to the owner like `checks-failed`).
   Run each check with `Some(path)`. After the loop ends (all passed, or the first non-zero, or a check that did not
   run), call `remove_check_checkout(path, tip)` before returning or going on; an error there writes one report
   line (`the release check checkout at <path> was not removed: <why>`) and one log line, and the outcome is
   unchanged. `apply`, `probe`, `rollback` and `run_rollback` pass `None`.
4. `tests/release.rs`: update the `Fixture` impl for the new signatures (record the directory each argv ran in, the
   checkouts made and removed, an optional make failure and an optional remove failure). Write the **one owning
   test** of acceptance criterion 1, named for the behaviour, e.g.
   `the_checks_run_in_a_checkout_of_the_tip_made_before_them_and_removed_after_them_and_nothing_else_does`, covering:
   checks ran in the checkout and apply/probe/rollback in the root; made after the slot look, removed after the
   checks on both pass and first failure; no checks makes none; a make failure is `check-checkout-failed` with
   nothing run; a remove failure is reported and the outcome stands. Its doc comment says why no existing test
   proves it (none observes the directory a check runs in). Existing tests keep their assertions.
5. `head_request.rs`, the adapter:
   - `make_check_checkout`: path `<parent of cfg.cwd>/<cfg.cwd's directory name>-worktrees/release-check-<request
     id>`; `host_json(["worktree", "create", <path>, "--detach", "--base", <tip>, "--json"])`; then open the new
     checkout with `fgos_git::GitDriver::open_at` and call phase 1's method with the tip, so the checkout holds the
     tip's committed `.fgos`. An error at either step returns `Err` (the run ends `check-checkout-failed`); a
     checkout created before the second step failed is removed best-effort through the same remove path.
   - `remove_check_checkout`: `host_json(["worktree", "remove", <path>, "--delivered-to", <tip>,
     "--discard-ignored", "--json"])`.
   - `run`: `recipe_command` takes the directory; `current_dir` is it, or `cfg.cwd` for `None`.
6. `tests/head_request.rs`: in `release_host`, add a `worktree)` case that does what the verb does for this test's
   purpose (`create`: `git -C <project> worktree add --detach <path> <base>` and print a done envelope; `remove`:
   `git -C <project> worktree remove --force <path>` and print a done envelope). Extend the existing test whose
   recipe has `"checks": [["true"]]` (no new test): its check becomes an argv that writes a marker relative to its
   directory, then assert the marker landed in a path under `<dir>-worktrees/release-check-<id>`, not in the
   project root, and that the checkout directory is gone after the run.
7. `head-request.v1.json`, `release run`: in `does`, replace "Argv run with no shell, from the project root" with:
   the checks run with no shell in an exact checkout of the trunk tip (made through `fgos worktree create --detach
   --base <tip>` under `<project>-worktrees/release-check-<id>`, holding the tip's committed `.fgos`, removed with
   `fgos worktree remove --delivered-to <tip> --discard-ignored` after the checks, a refused removal reported, not
   fatal); `apply`, `probe` and `rollback` run with no shell from the project root. In `result`, add
   `check-checkout-failed`.
8. Commit message describes behaviour (no plan or phase ids).

## Verify

Hand the cargo commands to lead:SUPERVISOR as one job (p-ymhj4xcf6x), with the worktree path:

```bash
cargo test -p fgos-session-host --test release
cargo test -p fgos-run-supervisor --test head_request
cargo build -p fgos-run-supervisor --features supervise
```

In the unit: `node -e "JSON.parse(require('fs').readFileSync('packages/run-supervisor/contracts/head-request.v1.json','utf8'))"`.

Pass: all green; the new owning test fails on the parent commit (run once there, in the same job); the contract
parses.

## Rollback

Revert this phase's commit: checks run in the project root again; phase 1's method stays, used by Land only.
