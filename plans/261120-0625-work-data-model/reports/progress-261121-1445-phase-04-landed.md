# Progress: phase 4 landed

Lead: head:lead-forgent-261120-0625-work-d-ce9f6. Date: 2026-11-21, Asia/Saigon.

## Outcome

Phase 4 landed on main as `7fc96fde1` (`land work-data-model/p04c`). The land gates passed, including `cargo fmt --all --check` and the phase tests `test/session-host/head-grants.test.mjs` and `test/session-host/head-permission-mode.test.mjs`. Phase 5 is next.

## What ran

- The owner answered `q-b3acdzi4ur` with "option 1". The answer was already in the plan and the footprint (`97646a40a`). The lead acked it and landed step 5 into the phase file (`a9ba3a599`).
- Unit `c-2475-1795246135148` (outcome `pass`) committed `d4209e0fd` on `work-data-model/p04b`. In `requirementOf`, the sandbox now maps a `dir/*` grant entry to `dir`. Its new test used the invalid role `head:supervisor` and failed. The fix unit `c-4669` changed the role but ended `blocked` without committing (see below).
- A code-reviewer found one blocking issue. `confinement/resources.mjs` refuses a launch with `workspace-path-missing` when a granted path does not exist. Neither `plans/backlog` nor the shaper's new `plans/discussions` exists on main yet. The lead confirmed this by reading the file and the tree.
- Unit `c-19803` (outcome `pass`) committed `38c54bbe6`:
  - `sandboxPathsOf` drops any entry nested under another one, so `plans` covers `plans/backlog`.
  - The shaper grant goes back to `docs/discussions` only.
  - Phase 5 now swaps the head grants in the commit that creates the directories (phase-05-migration.md step 5, landed as `0c8868dac`).
- The runner did not commit the test edit, because that file was already dirty when the round started. The lead's session cannot write the worktree's git index (read-only file system). So the lead created worktree `-p04c` from the p04b tip. Unit `c-22203` re-applied the reviewed test diff there and the runner committed it as `5210b3bb5`. The test now proves that every sandbox path of the secretary, supervisor, shaper and planner exists, has no glob, and is not nested under another path.
- The reviewer re-reviewed p04c and found nothing blocking.
- The first land failed the `cargo fmt` gate. The worker sandbox refuses `rustfmt`. The lead generated rustfmt's output as a diff in scratch space. Unit `c-34201` applied it, and the runner committed `17a44095d`.
- One land was refused `land-target-changed` because main moved. The retry landed.

## Verify by the lead

- `cargo test -p fgos --test session_write_publish`: 5 of 5 passed.
- `cargo test -p fgos-run-supervisor --test head_request`: 46 passed and 1 failed in one run. The failing test was `a_ticket_verb_answers_at_once_while_its_detached_runner_outlives_the_route_child`, a 10 s timing assertion, and it failed while a unit ran in parallel. It passed 3 of 3 runs alone.
- `cargo clippy -p fgos -p fgos-run-supervisor --all-targets -- -D warnings`: clean.
- In a plain `node --test` run, `head-grants` passed 6 of 6, and the new head-permission-mode test passed. Four head-launch tests fail there with `git-addon-not-shipped`, identically on main. The land gate runs them with the staged addon.

## Non-blocking, left for later

- No current role reaches the `dir/*`→`dir` mapping branch, because a parent grant covers every `/*` entry. A role holding only a `dir/*` grant would get write access at every depth in the sandbox.
- Node's `inGrant` (`src/session-host/head-request.mjs:133`) reads `plans/backlog/*` as a plain string. For a path land it works only because `plans` covers it.
- The earlier notes from progress-261121-1326 still stand: the `Dir::replace` race, the `#[path]` include of `portfolio.rs`, and discussions sitting two levels deep.
- Two tool frictions to report:
  - `fgos request result <id> --wait 50` is refused with bad-args, and `--wait=50` is ignored, so the lead polled instead.
  - The runner silently leaves out a `--writes` path that was dirty before the round, even when the round edits it.
