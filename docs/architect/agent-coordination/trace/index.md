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
| 6.3 | planning.validate-plan live smoke | done |
| 6.4 | executing.review-item fake executor | done |
| 6.5 | executing.scout-blast-radius read-only researcher | done |
| 6.6 | executing.scoped-subtask mutating helper | in-progress |
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

## Cell 6.4 Close Summary (2026-08-31)

Audit-only cell, no production code touched. Confirmed the `lastRunResult`
self-fetch asymmetry between planning (`validate-plan`, self-fetches
across separate `runOnce` calls) and executing (`review-item`, no
self-fetch) is by design, not a gap: every real caller dispatches +
interprets `review-item` inline in one `executeDriverOperationChoice`
call (no code path ever produces a "dispatched but uninterpreted"
review-item Assignment for a later call to discover), and a review-item
stop parks the item at `blocked` (removed from auto-resweep) rather than
leaving it `todo`/re-swept indefinitely like a failed plan validation —
so review-item has no unbounded-resweep cost to guard against with a
cache, and caching a stale verdict there would risk reusing outdated
review evidence instead of re-reviewing fresh diff/verify state.
Coordinator independently spot-verified the two load-bearing citations
(`executeDriverOperationChoice`'s inline dispatch+interpret;
`bin/fgos.mjs`'s `fgos plan` verb forcing `validate-plan` regardless of
`chooseStageOperation`'s raw choice). Gap analysis vs step-06 §6 found
Cell 6.0 already covers reject-routes-to-fix, APPROVED pass/fail-verify,
missing-evidence-gate, and governance-blocked-executor for `review-item`
specifically; one real coverage gap found (Herdr/visibility-neutrality
test existed only for `validate-plan`, not `review-item`'s structurally
distinct interpretation branch) and filled with one new test. Battery:
293/293 green. Given zero production code changed, closed after direct
coordinator verification rather than a full separate Reviewer/Red-team
pass. Full detail in `step-06-cell-4-review-item.md`.

## Cell 6.5 Close Summary (2026-08-31)

Audit found all step-06 §6 scenarios for `scout-blast-radius` already
covered from prior work, plus one genuine production gap: the
posture-evidence check (`operation-choice.mjs:1764-1768`) accepted any
bare technique-word (`rg`/`graph`/`posture`) as sufficient, never
requiring an explicit posture state, and never requiring a
degraded/inactive claim to be backed by an actual `rg` cross-check per
the task-spec — the exact "stale index silently treated as full coverage"
failure mode the root `CLAUDE.md` impact-analysis gate warns against,
recurring at the automated evidence-check layer. Fixed: now requires an
explicit state token (`active`/`full`/`degraded`/`inactive`) plus, for
`degraded`/`inactive`, a cross-check mention. 4 new tests target exactly
the fix's 4 cases; all 8 pre-existing scout-blast-radius tests re-verified
individually against the new logic (none regressed, one already-positive
fixture needed zero changes). Coordinator independently re-ran the diff
and full battery (297/297 green) before closing without a separate
Reviewer/Red-team round, given the narrow single-block scope and
per-fixture trace already on record. Full detail in
`step-06-cell-5-scout-blast-radius.md`.

## Cell 6.3 Close Summary (2026-08-31)

First LIVE (non-fake-executor) proof: one real out-of-process `claude`
reviewer subprocess ran `planning.validate-plan` against throwaway item
`tsk-5ka` (verdict READY, `changedFiles: []`, no in-Assignment lifecycle
move; parked `wontfix` afterward via real engine verb). Reviewer verified
the evidence chain independently (hashes, timing, event log — not
narrative trust): SAFE, no blockers. Red-team found one MEDIUM
design-gap: reviewer-role dispatch resolved the identical git-write
executor profile as a worker (prompt-discipline + incidental-allowlist +
post-hoc-rollback boundary, not a scoped permission profile) — user
elected to fix now rather than defer. Fix Round 1 added a scoped
`runner.executors.claude-reviewer` profile (git-write grant dropped),
gated on `READ_ONLY_ROLES`; a follow-up review pass found that gate
missed operation-based read-only ops (`judge-ambiguity`/`lock-decisions`/
`shape-plan` at their real default `role: implementer` wiring) — HIGH,
fix overstated. Fix Round 2 widened the gate to
`isReadOnlyAssignment(...)`, closing the coverage hole, re-verified by
the coordinator directly (diff read line-by-line, full battery re-run).
Accepted residual: tool-family gate (no git-write, any path), not
per-run path-scoped Write enforcement — Claude Code's own permission
syntax doesn't consult `Write(path)` rules, only `Edit(path)`; wiring
`Edit(<runDir>/**)` needs a new templating dimension, out of this cell's
scope. Existing settle-time fail-closed rollback remains the
defense-in-depth for that residual. Battery: 292/292 green. Full history
in `step-06-cell-3-validate-plan-live-smoke.md`.
