# Team Dispatch V1 - Step 1-5 Audit Trace Index

Coordinator audit run: 2026-08-30. Baseline: HEAD 9235bbe1 + dirty worktree.
Test counts are live `node --test` results on the dirty worktree unless noted.

## Traceability Matrix

| Step | Requirement (source) | Code path | Positive test | Negative test | Live proof | Status | Gap |
|---|---|---|---|---|---|---|---|
| 02 | Operations preserved + validated + read surface (step-02) | `src/state/workflow-stage-graphs.mjs` (`operationsForStage`, `operationMap`), `domains/coding/workflows/feature.yaml` (15 ops), `src/setup/registrations.mjs` | `test/state/workflow-stage-graphs.test.mjs` 54/54 | bad taskSpec/role/reason/policy/duplicate-primary cases in same file + `test/setup/registrations.test.mjs` 48/48 | doctor `domain-workflow-operations-coverage` passed | done | none |
| 03 | Operation -> Assignment -> Run -> RunResult storage (step-03) | `src/runner/dispatch/assignment.mjs` (`asgn_` ids, builder refuses unknown op / unresolved taskSpec), `assignment-policy.mjs`, `cli.mjs` `decide/execute --assignment`, `assignment-runner.mjs` (`.fgos/assignments/<id>/runs/NN/`) | `test/runner/assignment.test.mjs` 15/15, `assignment-dispatch.test.mjs` 12/12 | unknown-op, missing-taskSpec, human-only-refusal cases in same files | fake-executor dispatch tests green | done | none |
| 04 | Evidence hardening: dirty-before subtraction, strict `agent-result.json`, malformed->failed, artifact paths in prompt (step-04) | `assignment-runner.mjs` `computeChangedFiles` (dirtyBefore set), `validateAgentResultClaim`, `isReadOnlyAssignment`, provenance `evidence.json` | `test/runner/assignment-runresult.test.mjs` 22/22 | malformed claim, pre-existing dirty file, zero-exit-no-artifact, control-plane-files-not-evidence cases | same suite green | done | none |
| 05 | Driver operation choice, `planning.validate-plan` reviewer Assignment, no-evidence/failed cannot advance (step-05) | `src/runner/dispatch/operation-choice.mjs` (`chooseStageOperation`), `src/runner/loop.mjs` secondary-op wiring, `domains/coding/task-specs/validate-plan.md` role prose reconciled (`role: reviewer`, MUST NOT call `fgos plan`) | `test/runner/operation-choice.test.mjs` 93/93; loop planning.validate-plan tests incl. worktree cwd-selection fix | human-only not executed, undeclared op refused, no-evidence stops | planning.validate-plan fake + runOnce tests green | done for planning.validate-plan | executing.review-item routing in-flight (see 6.0) |
| primary path | Existing primary Work path remains green (step-06 prereq) | `src/runner/loop.mjs`, engine verbs only | e2e `test/e2e/runner-loop.test.mjs` 15/15, `test/state/handoff.test.mjs` 18/18 | loop no-progress/caps tests | `test/runner/loop.test.mjs` 84 tests: 81 pass, **3 fail** | BLOCKED | 3 review-item verdict-routing tests red in worktree; HEAD baseline also carries 1 committed red (scout-blast-radius runOnce, fixed by worktree) |

## Doctor (2026-08-30)

Team Dispatch checks all pass: `task-specs-resolve`, `agent-claims-resolve`,
`domain-workflow-operations-coverage`, `config-not-stale`,
`dispatch-decide-hook-wired`, `main-checkout-hook-wired`.

Unrelated repo-state fails, recorded per step-06 section 6 (do not block):
`tool-registry-configured` (degraded posture), `root-drift` (3 branches),
`delivered-not-on-trunk`, `events-jsonl-not-truncated`,
`main-checkout-guard-warnings`, `readme-install-tag-exists`,
`doc-source-conservation`.

## In-Flight Worktree State (uncommitted, +5436/-290)

`operation-choice.mjs` +1169, `loop.mjs` +113, `assignment-runner.mjs` +299,
`store.mjs` +159, plus loop/operation-choice/runresult/dispatch/stage tests,
`review-item.md` output-contract prose, `bin/fgos.mjs`, gateway contract.
This overlaps Step 6 cells 6.2/6.4/6.5. It must reach green and be committed
(user decision) before cell-by-cell dispatch starts, or run-evidence
dirty-before discipline will blur every later cell.

## Verdict

Step 6 cannot start clean. Smallest blocking fix = Cell 6.0: finish the
in-flight `executing.review-item` verdict routing until `loop.test.mjs` is
green without weakening assertions. See `current-cell.md`.

## Cell Registry

| Cell | Scope | Status |
|---|---|---|
| 6.0 | Reconcile in-flight review-item verdict routing to green (blocking fix) | done |
| 6.1 | planning.validate-plan fake executor happy path | done |
| 6.2 | planning.validate-plan negative cases | done |
| 6.3 | planning.validate-plan live smoke | pending |
| 6.4 | executing.review-item fake executor | pending |
| 6.5 | executing.scout-blast-radius read-only researcher | pending |
| 6.6 | executing.scoped-subtask mutating helper | pending |
| 6.final | consolidate Step 6 | pending |

## Cell 6.0 Close Summary (2026-08-30)

Import fix + 4 resolver gate-exploit fixes (refs/heads qualification,
ahead-of-trunk diff gate, disjoint diff/verify gates, mtime-correlated
artifacts, inline-text evidence removed). Tests: 5 new negatives, 14 honest
re-groundings (1 documented assertion-contract change). Battery all green.
Deferred-hardening list lives in
`step-06-cell-0-reconcile-review-item.md` close-out section.

## Cell 6.2 Close Summary (2026-08-30)

Tests-first red-team hardening campaign, 5 rounds: round 0 closes the 3
proven Cell 6.1 exploits (companion-report-only classification,
runner-computed `planContentHash`, read-back re-validation); rounds 1-4
close the Cell 6.2 red-team exploits (claimSha256 + content compare,
dispatchedRuns manifest, manifest-pinned Symbol evidence scoping, settle-bound
`settleReports` + read-back re-derivation, monotonic re-derivation floor).
All RED tests verified red before each fix; no weakened assertions; no new
modules; `loop.mjs` untouched. Battery: operation-choice 118/118, loop
101/101 (cell 6.1 happy path 3/3), runresult 23/23, dispatch 12/12, e2e 15/15,
fgos-stage 19/19; red-team harnesses all at documented outcomes. Residual:
post-exit .fgos/ forgery inside accepted user decision A (semi-trusted
workers; minimal remaining forge = three result.json fields or the settle-set
class) — trust-boundary options B/C DEFERRED TO STEP 7. Deferred-hardening
bucket (persist dirty signal at settle for write-ops, plan hash binds
plan.md only, out-tree dead-ref hygiene, execFileSync timeout, rev-list perf)
lives in `step-06-cell-2-validate-plan-negative.md` Gaps.
