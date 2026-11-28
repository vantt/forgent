# Integration: release checks run on a clean checkout of the tip

## Combined-tree gate (criterion 5)

Run by lead:SUPERVISOR on the p03 worktree, tip `103136ee8e` (phase 3 text on top of `c87c9f6f05`). Phase 3 landed
on main as `c579b64b2e`. Durations were not reported with the result.

- `npm test`: 6545 pass, 5 fail. Every failure is known on main and outside this plan's footprint: runner loop
  timeout, run-doors-doctrine, project-agents golden, mailbox-live-confined, claim-lock-window.
- `cargo test --workspace`: the failures are all known or environmental, and none is in a crate this plan
  touched in a way that the focused gates did not cover:
  - known on main: agent-cli confirm-dead, machine-private-roots, writer-id interleave;
  - inherited golden drift;
  - load and disk-full flakes: identity directory full, documentation locate sqlite lock, borrow_io.

The focused gates of phases 1 and 2 were green before they landed: `cargo test -p fgos-git --test land` and
`--test worktree` (landed `8a217935cb`), and `cargo test -p fgos-session-host --test release`,
`cargo test -p fgos-run-supervisor --test head_request` (58/58), plus the supervise build (landed `c87c9f6f05`).

Judgement: no failure comes from this change, so criterion 5 is met against the known baseline.

## Live release run (criterion 6)

Ticket `c-966306-1795794884379`, run by lead:SUPERVISOR from a release containing `c87c9f6f05`; log
`.fgos/runtime/head-tickets/supervisor-forgent/c-966306-1795794884379.log` (9695 lines, read by the lead).

- **Where the checks ran:** every compile and test path in the log is under
  `/home/vantt/projects/forgent-worktrees/release-check-c-966306-1795794884379/`, not the main checkout.
- **Removal:** after the run no `forgent-worktrees/release-check-*` directory exists, and the log has no removal
  report line, so the removal succeeded.
- **Outcome:** `checks-failed`, from the known baseline and not from this change. `npm test` ran 1435 s wall:
  6520 pass, 2 fail (`test/runner/loop.test.mjs` hit the 600 s per-file limit; mailbox-live-confined "both heads
  registered").
- **Cargo duration:** not measured. The cargo check runs after `npm test`, which failed, so it never started.
  The duration rule therefore cannot be judged from this run.
- **TMPDIR and `FGOS_*` were not exercised live.** The local recipe in `.fgos/config.yaml` still wraps each check
  in `env -u FGOS_STATE_ROOT TMPDIR=/var/tmp/r`, which overrides the environment the release run sets, and the
  log's temp paths are under `/var/tmp/r/`. Decisions 4 and 5 are proven by the wiring test (criterion 3,
  `head_request` 58/58). The wrapper is now redundant; dropping it is lead:SUPERVISOR's local recipe change.

Judgement: criterion 6 is met as written: the checks ran in `release-check-<id>` and the checkout is gone.

## Follow-up filed

`npm test` alone, from a cold checkout (it also builds and runs the 5054 Rust tests), took 1435 s, about 80% of the
30-minute `RELEASE_STEP_TIMEOUT`. That is above the plan's 20-minute threshold, so a backlog row is due:
**p-ibbgkehpsx: shared build cache for the release check checkout** (a `CARGO_TARGET_DIR` and npm cache the check
checkout reuses across release runs, so a cold build does not push a recipe step toward its timeout). The lead
cannot write `plans/backlog`; lead:SUPERVISOR lands the row.
