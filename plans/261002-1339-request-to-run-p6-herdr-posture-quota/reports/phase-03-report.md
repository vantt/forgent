# Phase 03 report

## Files changed
- src/setup/registrations.mjs: 13 Workflow capabilities (marketing/architecture/business) added to DEFAULT_CAPABILITY_SLOTS (description-only, no `prefer`, so merge never pins executors or overwrites project taste); new doctor check `workflow-capabilities-configured` (line-scans core/workflows + domains/*/workflows, no YAML dep because setup runs from dependency-less copies; exact name or bare verb, same as bind()).
- src/runner/execution/patterns/panel.mjs: synthesizer `independentOf` = all panelist roles; run.mjs resolveIndependence turns roles into executors, bind() compares provider families.
- src/workflow/runner.mjs: unit.scheduled records worktreePath+branch; at terminal state (complete/failed) `settleUnitWorktrees` removes worktrees of passed Units whose branch is in main and tree clean (cleanupWorkflowWorktree, branch deleted); keeps failed/unfinished/unmerged/dirty ones; one `workflow.worktrees` event {removed, kept[{unitId, worktreePath, branch, reason}]}, idempotent.
- src/workflow/store.mjs (not in the phase list, needed): projects worktree fields on unit state + `state.worktrees`.
- .fgos/config.json (worktree): semantically committed config + the 13 entries (== main checkout's uncommitted file; `ensureSharedConfigDefaults` then adds nothing). Large git diff stat is JSON re-format churn, JSON-level only the 13 keys added.
- docs/specs/distribution.md (Data Dictionary #7), CHANGELOG.md [Unreleased] (3 lines).
- Tests: test/setup/registrations.test.mjs (+2), checks-doctor-config.test.mjs (+2), checks.test.mjs (id list), runner/execution/patterns/panel.test.mjs, runner/execution/run.test.mjs (+2: synthesizer family differs / refused when no family left), workflow/workflow-runner.test.mjs (+2 cleanup rules), test/helpers/provider-families.mjs (default 3 -> 4 families: panel of 3 + synthesizer now needs a 4th).

## Follow-up (coordinator request)
- Registered the other 14 Workflow capabilities (delphi:*, group-cognition:*, nominal-group:*, coding:*) as description-only defaults in the same helper; worktree .fgos/config.json now has all 27 workflow capabilities (setup merge adds nothing more). CHANGELOG and distribution.md reworded to "every shipped Workflow". `fgos doctor --dir <worktree>` shows workflow-capabilities-configured passed. Plain `node bin/fgos.mjs doctor` from the worktree still reads the main checkout's config (not yet merged), so it shows failed until merge.
- Fixed the 9 posture fixture failures (test/cli/run-verb.test.mjs, test/workflow/{architecture-advisory,business-discussion,discussion-workflows,workflow-runner}): bwrap confinement on the cli-spawn invocation, seedFileLocalBwrapRegistry(), fixtures under /var/tmp, worker writes to worker-output/outbox when present. The prompt-recording test now has the worker write prompt.txt into its outbox (a confined worker cannot append to a file outside it) and reads the files back from .fgos/assignments; assertions unchanged.
- Full run (CLAUDE_CODE_SESSION_ID unset) of test/setup + test/workflow + test/runner + test/cli: 3873 tests, 3805 pass, 0 fail, 0 cancelled, 3 skipped (rest todo).

## Evidence (earlier, superseded by the full run above)
- test/setup + test/workflow + test/runner/execution (CLAUDE_CODE_SESSION_ID unset): 755 tests, 747 pass, 8 fail.
- All 8 failures are `posture-unavailable: Candidate "test-node" cannot apply posture "read-only"` from the phase-2 canApplyPosture change in src/runner/dispatch/confinement/policies.mjs (fixtures declare no bwrap backend): discussion-workflows x4 (delphi, nominal-group, group-cognition, CLI), architecture-advisory, business-discussion, workflow-runner x2 (parallel/gate, owner request). Not touched by this phase; need the fixtures/helper updated by the posture phase.
- Impact: GitNexus not queried (index stale per CLAUDE.md, degraded); callers checked by rg (panel.mjs only via run.mjs patterns, store projection consumers only in workflow/).

## Concerns
- Defaults carry no `prefer`: in a fresh project the 13 resolve but bind refuses until the project names executors (curated-default-never-pins doctrine). The repo's own config keeps the acceptance `prefer` pools.
- No Workflow "cancel" path exists in src/workflow, so cleanup runs on complete/failed only.
- `.pre-acceptance-261002` not created in worktree; controller deletes it on main at merge.

Status: DONE
