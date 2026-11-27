# Integration: a shaper runs in its own worktree and branch

Plan `261125-1557-shaper-worktree`. Closed 2026-11-28. The lead wrote this report from the supervisor's gate and
live-proof results; confined units cannot run cargo, so the supervisor ran every cargo gate, every full suite and every
live step. The step-by-step evidence of the four live runs is in `live-proof.md`.

## Resource check

`fgos resource-check --plan plans/261125-1557-shaper-worktree` answered `resource-check: accept (10 units, 0 findings)`.
The collisions it lists (2 x 10, 3 x 9, 4 x 7, 4 x 8 and 4 x 10) are between phases that the dependency column already
runs one after another.

## Phases and their lands on main

| Phase | What | Land |
|---|---|---|
| 1 | A head launch can run in a linked worktree (`workdir`) | `c720048bce` |
| 2 | The `session save` verb | `c04fc351fc` |
| 3 | A shaper lands its own discussion branch | `02cc221e55` |
| 4 | The shaper start creates or reuses its worktree | `f4a5ba2c5e` |
| 5 | Skill, specs and changelog fragment | `63606ea634`; goldens recaptured in `34d81c9b71` (phase 8 branch) |
| 7 | The worktrees directory is created, and the worktree links the installation so hooks run (defects A, B) | `af9a5d5b15` |
| 8 | The rotation hook finds the project `.fgos` from `FGOS_HEAD_PROJECT_ROOT` (defect D) | `31b1a9955c` |
| 9 | The head request handler acts on the launch project root carried in the envelope's session fields (defect E) | `35c609b820` |
| 10 | Two test fixes from the main suites: the expected session fields, and the git identity of the save fixture | `5222ea07d3` |

## Suites on main

The suites ran on main 512da89724 (it contains phase 9). After phase 10, the supervisor reran the two affected targets.

- `npm test`: 6562 pass and 3 fail. Two failures are known baseline in a fresh worktree: `run-doors-doctrine` and the
  personas golden (`rules.json` missing). The third, `head-start.test.mjs` with the stale session-fields
  expectation, was fixed by phase 10. After the land, `head-start.test.mjs` passes 34/34.
- `cargo test --workspace`: 4760 pass and 2 fail.
  - The hand-opened rules test in `session_rotation_hook` is known baseline.
  - The save test `save_commits_only_the_requested_changed_paths_on_the_worktree_branch_and_never_moves_main` failed
    only in the integration binary. Another test in that binary replaces `HOME` for the whole process, which left the
    commit with no git identity. Phase 10 fixed the fixture: `cargo test -p fgos --test session_write_publish` passes
    6/6, and `--bin fgos session_write_publish` passes 1/1.
  - The phase 8 test `a_head_in_a_worktree_with_its_own_fgos_resolves_the_project_fgos_from_the_launch_root` passes.
- Owning proofs named by the criteria and the phase gates: `session_attempt`, the `transport_round` test (39/39),
  `head_request`, `permissions`, `session-verb.test.mjs`, `head-request.test.mjs` (90/90 outside the sandbox) and
  `head-start.test.mjs` all passed in the gates of their phases.

## Live proof (criterion 6)

Run 4 was on release 13476a30 (main 5a30a00947), in a fresh scratch project. Every step passed (section "Rerun on
5a30a00947" of `live-proof.md`):

- The first shaper start on a fresh project creates `<project>-worktrees/` and the worktree.
- Two rounds are saved on the discussion branch (`c655837928`, `384d102ee6`). The main checkout's `git status` stays
  clean, and the main tip does not move.
- The questions and mailbox hooks answer inside the shaper, and the identity holder is the shaper's CLI session.
- One rotation completes. The successor answers after 22 s, takes the role as gen 2, and its save of round 3
  (`37d79df863`) is accepted. The gen 1 stop trace and the land ticket are under the project's `.fgos`, and the
  worktree has no `.fgos/runtime`.
- The land is done by gen 2. It puts one commit on main's first-parent line (`f1b7d7e31d`), touching only the
  discussion directory.
- Stop and cleanup pass.

Earlier runs found defects A and B (fixed by phase 7), D (phase 8) and E (phase 9).

## Not done here, tracked elsewhere

- C: a branch land is a merge commit, so the round commits are reachable from main. Criterion 6 counts main's
  first-parent line, and the land shape is a non-goal.
- The `.fgos/installation` link shows as untracked in the shaper worktree (p-6sd4fslxv7, worktree reaping).
- `fgos land status` is parsed as a branch name.
- One successor bind was refused `busy`, and a Stop-hook measurement request that is refused `busy` loses its context
  measurement.

The supervisor holds these as items. None of them blocks an acceptance criterion.
