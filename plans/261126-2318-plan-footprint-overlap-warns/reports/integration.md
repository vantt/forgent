# Phase 3 integration

Combined tree: trunk `d513bd76e7` (contains phase 3, landed as `a2ca43c722`, plus the supervision test-helper fix
`36b7763319`). Run unconfined by the supervisor in `forgent-worktrees/2318-integration`, 2026-11-27.

## npm test

6561 pass, 2 fail. Neither failure comes from this plan.

| Failing test | Cause | Owner |
|---|---|---|
| personas golden (shaper) | stale shaper description in `packages/agent-start-context/goldens/` | plan `261125-1557-shaper-worktree` phase 8, fixed by `31b1a9955c`, which landed after this tip |
| `approve --no-wait` with the merge slot held | merge-slot contention: the supervisor landed on the same machine while the suite ran | environment, not code; no change in this plan touches the merge slot |

This plan changed only rules, docs, skill surfaces and the effective rules projection (`d8a925ec5e`,
`ae0d3fb43b`, `dbed9692af`); the code changes for acceptance criteria 1 to 3 landed with the
orchestration-skeleton plan (phases 1 and 2).

## cargo test --workspace

4757 pass, 5 fail. None comes from this plan: its three commits touch no Rust source or test (checked with
`git show --stat`).

| Failing test | Cause | Owner |
|---|---|---|
| rotation hook, hand-opened session | known baseline: a fresh worktree has no project config | baseline, not this plan |
| agent-file golden (shaper) | stale shaper description | plan `261125-1557-shaper-worktree` phase 8, fixed by `31b1a9955c` (rewrites `goldens/agent-file/shaper.md`) |
| head-opening golden (shaper) | stale shaper description | same, `31b1a9955c` (rewrites `goldens/opening/shaper-*.txt`) |
| `machine_private_roots` | known baseline | baseline, not this plan |
| `session_write_publish` `save_commits_only_the_requested_changed_paths` | `save-commit-refused` / `commit-rejected` on the session-save path | plan `261125-1557-shaper-worktree` |

## Verdict

Integration passes for this plan: every failure in both suites is attributed outside it, and none touches a path
this plan changed. Acceptance criterion 5 is met on the combined tree `d513bd76e7`.
