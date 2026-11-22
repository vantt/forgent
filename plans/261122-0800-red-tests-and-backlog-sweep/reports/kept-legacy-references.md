# Kept Legacy Portfolio References

References to `docs/backlog.md` and `docs/discussions` still present outside `plans/**`, `archive/**`, and `CHANGELOG.md` following phase 5 implementation.

## Drift Checker Analysis (`check-decision-citation-drift.test.mjs`)

`scripts/check-decision-citation-drift.mjs` defaults `backlogPath` to `plans/backlog` (`scripts/check-decision-citation-drift.mjs:421`) and collects markdown files recursively under that directory (`loadSourceFiles`). It does not scan `docs/backlog.md`. Therefore, the unit test fixture in `test/scripts/check-decision-citation-drift.test.mjs` was moved to `plans/backlog.md` rather than kept as legacy framing.

## Phase 5 Migrations Completed

- `apps/fgos/tests/session_write_publish.rs`: Updated `session write` requests, grants, git commits, and verifications from `docs/backlog.md` to `plans/backlog.md` (retaining `plans/backlog/*` in the grant).
- `packages/durable-file/rust/tests/dir_replace.rs`: Updated sample directory and path from `root/docs/backlog.md` to `root/plans/backlog.md`.
- `test/scripts/check-decision-citation-drift.test.mjs`: Updated pure function test fixtures from `docs/backlog.md` to `plans/backlog.md`.

## Kept and Handed References

| File | Disposition |
|---|---|
| apps/fgos/src/wiring/migrate.rs | kept: migrate verb wiring moving projects from legacy portfolio layout to plans/ |
| docs/history/backlog-execution-reconciliation/RECONCILIATION.md | kept: historical reconciliation record |
| docs/history/backlog-execution-reconciliation/plan.md | kept: historical plan record |
| docs/history/canonical-decision-projection/plan.md | kept: historical plan record |
| docs/history/checkpoint-distillate-gate-provenance/CONTEXT.md | kept: historical context record |
| docs/history/claim-reclaim-branchhead-reset/CONTEXT.md | kept: historical context record |
| docs/history/close-distribution-spec-doctor-fix/CONTEXT.md | kept: historical context record |
| docs/history/decision-schema-rationale-alternatives-source/CONTEXT.md | kept: historical context record |
| docs/history/decompose-locked-decision-footprint-coverage/CONTEXT.md | kept: historical context record |
| docs/history/discover-decompose-verb-split/CONTEXT.md | kept: historical context record |
| docs/history/discover-stage-graph-and-skill-layering/FINDINGS.md | kept: historical findings record |
| docs/history/fgos-coding-implement-decide-first-prose/plan.md | kept: historical plan record |
| docs/history/fgos-interface-daemon/CONTEXT.md | kept: historical context record |
| docs/history/fgos-mission-boundary/CONTEXT.md | kept: historical context record |
| docs/history/fgos-pick-worktree-relocation/CONTEXT.md | kept: historical context record |
| docs/history/fgos-planning-split-step-footprint/CONTEXT.md | kept: historical context record |
| docs/history/fgos-repo-prefix-path-fix/CONTEXT.md | kept: historical context record |
| docs/history/fgos-repo-prefix-path-fix/plan.md | kept: historical plan record |
| docs/history/fgos-skill-discovery-gap/plan.md | kept: historical plan record |
| docs/history/gateway-v1-route-prefix/RESEARCH.md | kept: historical research record |
| docs/history/herdr-web-dashboard-plan-realignment/plan.md | kept: historical plan record |
| docs/history/launcher-vocabulary-rename/CONTEXT.md | kept: historical context record |
| docs/history/launcher-vocabulary-rename/plan.md | kept: historical plan record |
| docs/history/merge-already-merged-idempotent/CONTEXT.md | kept: historical context record |
| docs/history/merge-loop-skill/CONTEXT.md | kept: historical context record |
| docs/history/parent-flag-cli/CONTEXT.md | kept: historical context record |
| docs/history/recording-points-audit/CONTEXT.md | kept: historical context record |
| docs/history/retire-fgos-runner-json-fallback/CONTEXT.md | kept: historical context record |
| docs/history/retire-fgos-runner-json-fallback/plan.md | kept: historical plan record |
| docs/history/return-close-pre-done-work/CONTEXT.md | kept: historical context record |
| docs/history/self-contained-id-references/CONTEXT.md | kept: historical context record |
| docs/history/self-contained-id-references/plan.md | kept: historical plan record |
| docs/history/spec-docs-lifecycle-realignment/RESEARCH.md | kept: historical research record |
| docs/history/spec-docs-lifecycle-realignment/plan-tsk-1uw.md | kept: historical plan record |
| docs/history/spec-docs-lifecycle-realignment/plan-tsk-1xn.md | kept: historical plan record |
| docs/history/spec-docs-lifecycle-realignment/plan-tsk-2t5.md | kept: historical plan record |
| docs/history/spec-docs-lifecycle-realignment/plan.md | kept: historical plan record |
| docs/history/tsk-1lv-1/plan.md | kept: historical plan record |
| docs/history/tsk-1lv-4/iron-law-evidence.md | kept: historical evidence record |
| docs/history/tsk-2gw-gitignore-docs-history-verification/plan.md | kept: historical plan record |
| docs/history/tsk-2sp-citation-drift-remaining-backlog/RESEARCH.md | kept: historical research record |
| docs/history/tsk-2sp-citation-drift-remaining-backlog/plan.md | kept: historical plan record |
| docs/history/tsk-2uo-launcher-vocabulary-guard-allowlist/plan.md | kept: historical plan record |
| docs/history/tsk-2yu-citation-baseline-cleanup/RESEARCH.md | kept: historical research record |
| docs/history/tsk-2yu-citation-baseline-cleanup/plan.md | kept: historical plan record |
| docs/history/tsk-2yu/iron-law-evidence.md | kept: historical evidence record |
| docs/history/tsk-3uw4-rul11-citation-gloss/RESEARCH.md | kept: historical research record |
| docs/history/tsk-3uw4-rul11-citation-gloss/plan.md | kept: historical plan record |
| docs/history/tsk-3x8-citation-drift-baseline-line-keying/RESEARCH.md | kept: historical research record |
| docs/history/tsk-4xg-plugin-marketplace-doctor-check/CONTEXT.md | kept: historical context record |
| docs/history/tsk-50i7-merge-commit-stderr-swallowed/CONTEXT.md | kept: historical context record |
| docs/history/tsk-6at-citation-drift-review-round/RESEARCH.md | kept: historical research record |
| docs/history/work-item-backlog-status/RESEARCH.md | kept: historical research record |
| docs/history/work-item-priority-matrix/CONTEXT.md | kept: historical context record |
| docs/platform/agent-coordination/verification/architecture-advisory-panel/proofs/P01.2/runs/1-context-investigator-raw.log | kept: verification proof log record |
| docs/platform/agent-coordination/verification/architecture-advisory-panel/proofs/P05.2/clear/attempt-1-superseded/asgn_coordinator_driver_op_001/runs/01/agent-result.json | kept: verification proof execution record |
| docs/platform/agent-coordination/verification/architecture-advisory-panel/proofs/P05.2/clear/attempt-1-superseded/asgn_coordinator_driver_op_001/runs/01/result.json | kept: verification proof execution result record |
| docs/platform/agent-coordination/verification/step-08-standalone-coordination/proofs/P05.2/case-brief.mjs | kept: verification proof test case brief |
| docs/platform/agent-coordination/verification/step-08-standalone-coordination/proofs/P05.2/r6-single-agent-baseline/assignment.json | kept: verification proof baseline assignment record |
| docs/platform/documentation/subcomponents/document-identity/verification/recall/trial-cases.json | kept: verification proof trial cases record |
| packages/convention/contracts/convention.golden.v1.json | kept: golden fixture for doc-backlog-1 pointer file rule |
| packages/convention/contracts/convention.rules.v1.json | kept: doc-backlog-1 rule for the pointer file docs/backlog.md that still exists |
| packages/execution/contracts/confinement-policy/policy.v1.json | handed to S6a |
| packages/execution/contracts/confinement-policy/resources.v1.json | handed to S6a |
| packages/execution/contracts/corpus/adopt-v3-envelope-attempt/runs/01/controller/evaluator-baseline.json | kept: recorded historical execution corpus |
| packages/execution/contracts/corpus/adopt-v3-envelope-attempt/runs/01/evidence.json | kept: recorded historical execution corpus |
| packages/execution/contracts/corpus/adopt-v3-envelope-attempt/runs/01/result.json | kept: recorded historical execution corpus |
| packages/execution/contracts/corpus/v3-open-attempt/producer/1/runs/01/controller/settle-context.json | kept: recorded historical execution corpus |
| packages/execution/contracts/run-result/readers.json | kept: recorded execution result reader test contract |
| packages/run-supervisor/rust/src/head_request.rs | handed to heads-stable-and-able |
| packages/run-supervisor/rust/tests/head_request.rs | handed to heads-stable-and-able |
| packages/supervision/rust/src/discussion_source.rs | kept: pre-migration reader for legacy discussion sources |
| packages/supervision/rust/tests/discussion_source.rs | kept: test for pre-migration discussion source reader |
| test/cli/session-verb.test.mjs | handed to S6a |
| test/golden-recorders/confinement-policy.recorder.mjs | handed to S6a |
| test/runner/dispatch-confinement-backend-p03.test.mjs | handed to phase 1 (confinement-portfolio-paths) |
| test/runner/dispatch-confinement-machine-private.test.mjs | handed to phase 1 (confinement-portfolio-paths) |
| test/runner/dispatch-confinement-policies.test.mjs | handed to phase 1 (confinement-portfolio-paths) |
| test/session-host/head-request.test.mjs | handed to heads-stable-and-able |
