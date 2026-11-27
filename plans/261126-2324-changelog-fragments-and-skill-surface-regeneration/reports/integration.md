# Phase 3: land config and integration

## Release (step 1)

Active release `sha256:05acb89c` was built from main `dc49aa8816`, which includes phase 1 (`ca75d69142`):
`git merge-base --is-ancestor ca75d69142 dc49aa8816` passes.

## Config (steps 2-4)

- Step 2: main's `.fgos/config.yaml` also held uncommitted edits from someone else: the owner's `release:` recipe and
  two `@fgos:doc` lines refreshed by the new release. The lead asked `q-3tnpgr43i6`. lead:SUPERVISOR decided inside
  the owner's frame to land the whole file in one commit, and the lead cancelled the question.
- Step 3: the lead's `fgos config set` was refused with `config-write-confined`, because a confined session cannot
  write config. lead:SUPERVISOR ran the three sets unconfined, and `fgos config check` passed.
- Step 4 (corrected brief): `fgos land --paths .fgos/config.yaml` answers `land-paths-empty`, by design.
  ScopedCommit leaves out every `.fgos/**` path (`packages/git/rust/src/scoped_commit.rs` `is_store_path`;
  `docs/platform/git/spec.md` "Store exclusion"), so the land door cannot carry the project config. Every recent
  config-only commit (`c0416313de`, `fe4e0bb22a`, `6d0f6b92cc`, `0dd71aa83f`, `325f6c40a1`) was a plain
  `git commit` in the main checkout, pushed right away. Phase 3 used the same route: `2e033ea268`, with the
  pre-commit hook on, pushed `b34836ac70..2e033ea268`.
- On main, `land.regenerate` now reads:
  - `run`: `npm run build:skills && node scripts/export-command-selectors.mjs && node scripts/git-one-door-scan.mjs --root . --write-census`
  - `files`: the three contract files, plus `.agents/skills/**`, `.claude/skills/**` and `plugins/fgOS/skills/**`.
    `AGENTS.md` is not declared.
  - `when`: `src/**`, `apps/**`, `packages/**`, `bin/**`, `scripts/**`, `core/**` and `domains/**`.

## Integration gates (step 5)

lead:SUPERVISOR ran these unconfined in `forgent-worktrees/2324-p03-gate` at trunk tip `4e702f9847`, which includes
phases 1 and 2. Logs are in `.fgos/runtime/tmp/2324-p03-gate/`.

| Command | Result |
|---|---|
| `npm test` | exit 1: 6548 passed, 5 failed. None of the failures is caused by this plan (judged below). |
| `cargo test --workspace` | exit 101: 454 test binaries ok, 7 tests failed. None of the failures is caused by this plan (judged below). The `fgos-supervision` land suite passed 76/0, including all seven phase 1 tests. |

### npm test failures

None of the five failing files is a file this plan changed, and none of them covers the land regeneration or
`scripts/prepare-release.mjs`.

1. `test/direct/merge-gate.test.mjs:358` (approve `--no-wait` with the merge slot held), (3)
   `test/runner/loop.test.mjs` (hit the 600 s per-file limit) and (4)
   `test/scripts/mailbox-live-confined.test.mjs:390` (two heads in two sandboxes, "both heads registered" was false).
   lead:SUPERVISOR judged these load-sensitive or known flakes.
2. `test/docs/run-doors-doctrine.test.mjs:25` and (5) `test/scripts/project-agents.test.mjs:183` both fail with
   `start-rule-set-invalid: rule-set-malformed: the file is not valid JSON: EOF while parsing a value at line 1
   column 0`. This is an environment gap in a fresh linked worktree, not drift in docs or golden files:
   - `.fgos/instructions/effective/rules.json` is tracked, but skip-worktree in a linked worktree, so the
     checkout leaves it absent. It is absent in every other linked worktree checked under `forgent-worktrees/`.
   - The start-context door reads it with `std::fs::read(..).unwrap_or_default()`
     (`apps/fgos/src/wiring/start_context.rs:131`, from `af2df3b6e1`). An absent file therefore becomes empty
     bytes and is reported as malformed JSON.
   - In the gate worktree the file was created at 17:48:43 (+07), during the suite, with a valid 47 KB set.
     Tests that ran before then saw it absent.
   - On the main checkout, where the file exists, `node --test test/docs/run-doors-doctrine.test.mjs` passes.
     `project-agents.test.mjs` could not run in the lead's sandbox, which lacks the native addon.
   - Owner: the agent-start-context host door (`af2df3b6e1`). Two follow-ups for that owner: an absent rule set
     should be refused as absent rather than as malformed JSON, and the suite should compile the rule set, or these
     tests should, before reading it from a fresh worktree.

### cargo test failures

The log is `.fgos/runtime/tmp/2324-p03-gate/cargo-test.log`. None of the failing tests is in a crate or file this plan
changed.

- `wiring::session_rotation_hook::tests::a_session_opened_by_hand_gets_the_rules_scoped_to_hand_opened_sessions...`:
  the same cause as npm (2) and (5). The rule set is absent in a fresh linked worktree. Owner: agent-start-context
  (`af2df3b6e1`).
- `a_caller_under_an_agent_cli_cannot_confirm_a_writer_dead`: environment. It was run from an agent CLI session, which
  is the condition this test refuses.
- `init::tests::holder_lock_gate_drains_a_borrowed_git_background_gc`,
  `machine_private_roots_hide_every_listed_root_that_exists_and_refuse_the_unsafe_ones_by_name` and
  `processes_sharing_a_writer_id_never_interleave_snapshot_lines`: lead:SUPERVISOR judged these load- or
  environment-sensitive. They are not in the land or release-preparation code.
- `release_run_reads_the_merge_slot_out_of_the_hosts_pretty_envelopes_and_the_released_commit_out_of_its_own_record`
  and `the_rollback_refuses_without_a_step_in_flight_and_runs_when_a_dead_run_left_one`: in the release-run area.
  The same two fail in plan 1224's gate, so they are not from this plan.

### Acceptance criteria

1. Met. At gate tip `4e702f9847`, the land suite passes, including
   `two_branches_that_change_a_file_under_a_declared_glob_land_one_after_the_other_the_second_regenerated`. On main,
   `land.regenerate` lists the three skill globs, runs `npm run build:skills`, and has `domains/**` in `when` (`2e033ea268`).
2. Met. `the release section holds the Unreleased lines then each changelog fragment in name order, and the fragments
   are deleted` passes in the gate's npm run.
3. Met. `changelog.d/README.md` states the scheme, and
   `changelog.d/261126-2324-changelog-fragments-and-skill-surface-regeneration.md` is this plan's own entry.
4. Met with named exceptions. Neither suite is fully green: npm has 5 failures and cargo has 7. Every failure is
   judged above as unrelated to this plan and named with its owner. Under step 5, an unrelated failure does not block.

## Evidence on the real config (step 6)

As of 2026-11-27 17:45 (+07), no land has run since `2e033ea268`. The newest land log,
`.fgos/runtime/land/land-3251927-1795761440720398787-2.log`, is from 13:39 and predates the config. The first land
that touches `core/**` or `domains/**` after this will show the rebuild in its log.

## Follow-up outside this plan

The land door has no route for committing the project config (`.fgos/config.yaml`), so it lands through a plain
`git commit` in the main checkout. This is a candidate backlog row for the secretary, not part of this plan.
