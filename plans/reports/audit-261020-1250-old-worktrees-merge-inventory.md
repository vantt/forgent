# Old worktrees merge inventory (2026-10-20)

Read-only inventory of every registered worktree of this repo against `main` (b09607b7e). Nothing was removed, merged or reset.

Method per worktree: `merge-base --is-ancestor`, `git cherry main <tip>` (count of `+`), `git log main..<tip>`, subject search on main for each `+` commit, `merge-tree --write-tree`, `status --porcelain`, and a `/proc/*/cwd` scan.

## Summary

| Class | Count | Meaning |
|---|---|---|
| A | 27 | Merged by ancestry or by content; safe to remove (dirty files noted) |
| B | 0 | No unlanded work that is worth merging |
| C | 3 | Superseded or frozen snapshot, obsolete |
| D | 3 | Needs owner (long-lived plan branches or active in use) |
| Skipped | 4 | Active today (created after 11:00) or the excluded worktree |

No class B: every `+` commit on an old agent worktree was found on main under a different sha by subject, and the review-lint lint belongs to the DOC plan lineage.

## Skipped

- `.claude/worktrees/agent-af81a7cb0fb786dcc` - excluded by instruction (its 4 `+` commits are not on main yet: skill prune, worktree provisioning, ak:cook declare, no cargo build per worktree).
- `.claude/worktrees/agent-a3e879bcf16da9b0b` - created 12:22 today, locked by a live claude agent pid 1087187.
- `forgentX-doc-authority-step3-b` (branch `plan/260925-doc-authority-step3-b`) - created 11:29 today; already merged into the DOC plan branch (18284b524 is the merge).
- `.claude/worktrees/agent-ac970642d8c2e90a0` is locked by the same live pid but is old work, so it is listed in A below, with the lock noted.

## A. Merged, safe to remove

Fully contained in main (tip is an ancestor, or `git cherry` shows no `+`):

| Path | Branch | Note |
|---|---|---|
| forgentX-r2r-fix | fix/request-to-run-round | ancestor; 1 untracked `.fgos/events/*.jsonl` |
| forgentX-worktrees/single-door-mechanisms | feat/single-door-mechanisms | ancestor; 8 modified plan phase files (263+/336-); plan dir is on main, edits are uncommitted drift, check before discarding |
| .claude/worktrees/agent-a2405e5c58972d229 | worktree-agent-a2405e5c58972d229 | ancestor |
| .claude/worktrees/integ-two-fixes-261015 | detached 47f21972f | ancestor; modified `apps/fgos/tests/cli_tests.rs` (47f21972f is the main commit for the stdin-hang fix) |
| .claude/worktrees/verify-44a | detached | ancestor |
| .claude/worktrees/verify-integration | detached | ancestor |
| .claude/worktrees/wd-p04 | win-driver/p04-windows-borrowing | ancestor; modified `Cargo.lock` |
| .claude/worktrees/agent-a58544de525ae188a | worktree-agent-a58544de525ae188a | cherry: all `-` |
| .claude/worktrees/agent-a969635061a37a412 | worktree-agent-a969635061a37a412 | cherry: all `-` |
| .claude/worktrees/agent-a9c8d39c7a78a7f57 | worktree-agent-a9c8d39c7a78a7f57 | cherry: all `-` |
| .claude/worktrees/agent-ac1e545070507d14d | worktree-agent-ac1e545070507d14d | cherry: all `-` |
| .claude/worktrees/agent-ac970642d8c2e90a0 | worktree-agent-ac970642d8c2e90a0 | cherry: all 12 `-`; locked by live pid 1087187, unlock first |
| .claude/worktrees/agent-ad4b6fd613baf4808 | worktree-agent-ad4b6fd613baf4808 | cherry: all `-` |
| .claude/worktrees/agent-ae86665b911b82fc1 | worktree-agent-ae86665b911b82fc1 | cherry: all `-` |
| .claude/worktrees/fix-cli-tests-main | fix/cli-tests-main | cherry: all `-` |
| .claude/worktrees/integ-step1-261015 | integ/step1-261015 | cherry: all `-` |
| .claude/worktrees/plan-run-supervisor-6x | plan/run-supervisor-6-2-6-3-6-4 | cherry: all `-` |

Merged by content under a different sha (each `+` commit found on main by identical subject; merge-tree conflicts are only because main moved on):

| Path | Branch | `+` commit -> main sha |
|---|---|---|
| agent-a068b1ed9ad8afeb2 | worktree-agent-a068b1ed9ad8afeb2 | a72d263bc -> e8176287f; 49cfc4be3 -> f43e5e9da (other 2 are `-`) |
| agent-a1821bf555f8d8f52 | worktree-agent-a1821bf555f8d8f52 | a9fa1dd52 -> bde2b3878 |
| agent-a6dbc8281e4cb116c | worktree-agent-a6dbc8281e4cb116c | d710f5fc8 -> 6ce17f136 |
| agent-ab26cb34a16183035 | worktree-agent-ab26cb34a16183035 | a8b589b76 -> 7f1f4c2d2 |
| agent-acb5eed91904cce85 | worktree-agent-acb5eed91904cce85 | c53083b7e -> 6df4a192b; b4d14c4cc -> 7cfc29dd9; 05403d1a1 -> a0ca617ea; ff79893a0 -> 4489e727e |
| agent-adb2039e8fc60c963 | worktree-agent-adb2039e8fc60c963 | 462aedb7e -> 6449c06a3; da51363bc -> ce1499664; 97a462990 -> f0378823f |
| agent-af8586ac97034ccd2 | worktree-agent-af8586ac97034ccd2 | e928f680f -> 47f21972f (stdin fix) |

All under `/home/vantt/projects/forgentX/.claude/worktrees/`. Nothing dirty in these.

Also content-landed, superseded plan work:

| Path | Branch | Evidence | Note |
|---|---|---|---|
| .claude/worktrees/tsk-1my-tTpnWe | fgw/tsk-1my | `plan-out` and `breaker-unreadable` are in main `scripts/test-select.mjs` (later commits cc687d92b, af55cbcc9) | 99 dirty entries = 96 tracked `.fgos/*` files deleted + 3 untracked plan files (`nightly-ledger.json`, `plans/260922-test-suite-optimization/`, `plans/reports/promotion-ledger.json`); not worth keeping |
| .claude/worktrees/tsk-55p1-kIU0wE | fgw/tsk-55p1 | junit in main `ci.yml`, `scripts/write-test-marker.mjs` on main (e4467d2f3, 2b9711e0c) | same dirty shape (98 entries) |

merge-tree for `fgw/tsk-1my` conflicts (CHANGELOG, test-select), confirming the change was re-landed differently, so a merge would be wrong.

## C. Superseded or obsolete

| Path | Branch | Reason |
|---|---|---|
| forgentX-worktrees/advisory-capability-completion | feat/advisory-capability-completion | 1 commit, a frozen pre-M runtime and acceptance snapshot (2026-10-08, 55 files); advisory path M landed on main afterwards (see main history around fdd8cdcac and the advisory path M memory); merge-tree conflicts |
| /tmp/fgos-wf-wt-CLeDN1 | wf/wf-run-1792003927866-ceb23be6/w-a | workflow-run scratch worktree, 1 report-only commit ("gm1 chain A report"), merges clean but is a stray run artifact |
| forgentX-review-lint | tool/review-report-lint | see D note: its lint commit is inside the DOC plan lineage; the branch itself is a stale base of the DOC plan (581 ahead, 971 files, merge-tree conflicts) so merging it would drag the whole plan |

The review-lint commit (3553347a6, `scripts/propose-doc-decisions.mjs`, `scripts/check-doc-inventory-gates.mjs`, new `test/scripts/doc-review-format.test.mjs`) is an ancestor of both `plan/260925-documentation-authority-unification` and `forgentX-s8-review`. The files do not exist on main yet. They land with the DOC plan, not through this branch. The worktree itself can go after the DOC lead confirms.

## D. Needs owner

| Path | Branch | Why |
|---|---|---|
| forgentX-phase00-documentation-authority-unification | plan/260925-documentation-authority-unification | DOC plan is `running` on the program board (Phase 8 step 3); tip 18284b524 today, 921 ahead of main, main is 11 ahead of the merge base 44daae2a0; only `mdview serve` processes hold the cwd. Its landing is the DOC lead's call |
| forgentX-s8-review | detached 18824b36a | contained in the DOC plan branch (it is the plan branch tip from earlier today); merge-tree with main is clean; 3 untracked items (`nightly-ledger.json`, `plans/260922-test-suite-optimization/`, `plans/reports/promotion-ledger.json`), the last two look like test-suite-optimization outputs worth a look before removal |
| .claude/worktrees/agent-af81a7cb0fb786dcc | worktree-agent-af81a7cb0fb786dcc | excluded by instruction, listed so its 4 unlanded commits are not forgotten (merge-tree conflicts with main) |

## Other repos

`mdview` has `/home/vantt/projects/mdview--wt--dogfood-agents` (branch `dogfood/agents-description`, ff70efd). `mcp-skill-hub` has no extra worktree. Not analysed.

## Notes for the cleaner

- Dirty files in A: none carry unique work (events log, plan-file edits already on main, deleted `.fgos` tracked files, Cargo.lock, one test file touched). The two with real edits worth a glance before `--force` removal: `single-door-mechanisms` (8 plan files) and `integ-two-fixes-261015` (cli_tests.rs).
- `agent-ac970642d8c2e90a0` carries a lock held by live pid 1087187 (the same pid as the locked a3e879); do not remove it until that session is gone.
- Branch names to delete alongside: all `worktree-agent-*` listed in A, plus the fix/feat/fgw/win-driver/integ branches listed there. The two `plan/260925-*` branches and the `plan/run-supervisor-6-2-6-3-6-4` branch should be kept until the owner says otherwise (the latter is fully merged by cherry, so it is safe).
