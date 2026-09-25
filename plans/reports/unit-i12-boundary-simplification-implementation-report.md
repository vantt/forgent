# Unit I12 / Phase 09 Boundary Simplification — Implementation Report

```txt
Document type: Implementation & Verification Report
Unit: I12 (Phase 09 — Boundary Placement + Simplification)
Parent Plan: plans/260919-coordination-skill-harness-simplification/plan.md
Phase Spec: plans/260920-2217-dispatch-engine-hardening/phase-09-boundary-simplification.md
Target Baseline: main@cfdaf4bc95d44a6132d03dfb635478b084e41b35
Candidate Code SHA: 94eb5b92ff2439c0fc63806d28929e0ddcf9a667
Branch: dispatch-hardening-i12-boundary-simplification
Isolated Worktree: /home/vantt/projects/forgentX/.claude/worktrees/dispatch-hardening-i12-boundary-simplification
Verdict: READY FOR INDEPENDENT REVIEW
```

---

## 1. Executive Summary & Baselines

Unit I12 executes Phase 09 (Boundary placement + simplification) of the Dispatch Engine Hardening track. All 9 discrete requirements ($R_1$ through $R_9$) have been decomposed into isolated, behavior-preserving, atomic refactoring cells. Every cell has undergone dedicated regression and boundary verification, culminating in clean passes across all focused suites and the entire repository test suite (`env -u CLAUDE_CODE_SESSION_ID npm test`: **7660 pass / 0 fail / 8 skipped / 65 todo**).

### 1.1 Ancestry & Git Verification Truth

```sh
# Working branch
Branch: dispatch-hardening-i12-boundary-simplification
Worktree: /home/vantt/projects/forgentX/.claude/worktrees/dispatch-hardening-i12-boundary-simplification

# Git ancestry checks
git rev-parse HEAD main origin/main
# HEAD:        4504a7923cece6038060e0d721f9cc6451c6f082
# main:        cfdaf4bc95d44a6132d03dfb635478b084e41b35
# origin/main: b39898aa2377c453c9f76cbe56e4ede95fdc96b0

git rev-list --left-right --count origin/main...main -> 0  38
git merge-base --is-ancestor 7d7dc2750f9fb80716a7cffae03d67605629cf9a main -> YES (0)
git merge-base --is-ancestor cfdaf4bc95d44a6132d03dfb635478b084e41b35 main -> YES (0)
git merge-base --is-ancestor cfdaf4bc95d44a6132d03dfb635478b084e41b35 HEAD -> YES (0)
```

- **Sequencer State**: `MERGE_HEAD`, `REBASE_HEAD`, `CHERRY_PICK_HEAD`, `REVERT_HEAD`, `BISECT_LOG` all absent.
- **Main Checkout Protection**: Working tree at `/home/vantt/projects/forgentX` untouched; pre-existing user-owned dirty/untracked files preserved with zero modification.

---

## 2. Cell Commits & Traceability ($R_1$–$R_9$)

| Requirement | Commit SHA | Description |
|---|---|---|
| **R1** | `f4d6fb708` | Move `fanoutBatchExecutorCli` to Work Driver (`src/runner/fanout-batch.mjs`), isolate `logExecutorDispatch` (`src/runner/dispatch-log.mjs`), ensure `src/runner/dispatch/**` has zero references to `pick`, `return`, `claim`, or `appendEvent`. Register files in `docs/architecture-manifest.json`. |
| **R2** | `33e5b6c04` | Relocate Work/stage/skill lookups (`executorIdForWork`, `resolveCapabilityIdentityDetails`, `buildPrompt`) from dispatch core into `src/runner/dispatch/operation-choice.mjs` with backward-compatible re-exports. Dispatch core contains zero direct `workflow-stage-graphs` imports. |
| **R3** | `598e5b43b` | Split `assignment-runner.mjs` into dedicated `src/runner/dispatch/settlement.mjs` (unified single settlement pipeline replacing duplicated settlement code) and `src/runner/dispatch/reconcile-cli-spawn.mjs`. Relocate dispatch depth helpers to `adapters.mjs`. |
| **R4** | `5b8a1b2a0` | Consolidate Confinement Authority preparation into unified `assessAndPrepare(request, opts)` in `src/runner/dispatch/confinement/authority.mjs`. Driver claims populate attestation directly (no argv parsing). Extract leaf proof helpers to `src/runner/dispatch/proof-helpers.mjs`, removing adapter imports from authority. |
| **R5** | `91d9109f5` | Extract Herdr S2 proof layer (~530 lines) into `src/runner/dispatch/herdr-reconcile.mjs` ("infra" in architecture manifest). Unify terminal outcome receipt publication for both failed and settled runs into `publishHerdrCompletionReceipt`. |
| **R6** | `78de9c055` | Unify claim schema and result path in `src/runner/dispatch/brief.mjs`, render `effectiveContract` referencing `p.resultPath`, add Linux kernel `MAX_ARG_STRLEN` (128 KiB) size hint guard before CLI spawn, and remove unused `prepareDispatch`. |
| **R7** | `ace4bbfc4` | Enforce controller directory ownership for `replacement-authority` in `src/runner/dispatch/recovery-planner.mjs` (worker-supplied outbox evidence parks), populate `gatewaySessionId` on Herdr rounds, and document in-process handback return semantics. |
| **R8** | `f528dabbc` | Stamp `contract: 'dispatch-run.legacy'` in `openDispatchRun` (`src/runner/dispatch/cli.mjs`) and add regression test verifying legacy run contract preservation and launcher ownership. |
| **R9** | `94eb5b92f` | Cache falsification probe attestations by fingerprint with 1-hour TTL in `src/runner/dispatch/confinement/attestation-store.mjs` (~213 ms saved per launch). Memoize `allRuns` per verb call via `withRunsCache` in `src/runner/dispatch/runtime-inspection.mjs`. |
| **Docs** | `4504a7923` | Update component boundaries, `OccupancyPort`, Source Inventory in `docs/platform/` & `docs/architect/`, `CHANGELOG.md`, and `plan.md`. |

---

## 3. Diff Statistics & Module Inventory

### 3.1 Total Diff Stat (`cfdaf4bc`..HEAD)

```txt
42 files changed, 3634 insertions(+), 3174 deletions(-)
```

### 3.2 Key File Additions & Relocations

- `src/runner/fanout-batch.mjs` (+187 lines, Work Driver layer)
- `src/runner/dispatch-log.mjs` (+36 lines, Audit Seam)
- `src/runner/dispatch/operation-choice.mjs` (+238 lines, Work Driver compatibility boundary)
- `src/runner/dispatch/settlement.mjs` (+797 lines, unified settlement pipeline)
- `src/runner/dispatch/reconcile-cli-spawn.mjs` (+365 lines, cli-spawn supervisor reconciliation)
- `src/runner/dispatch/proof-helpers.mjs` (+208 lines, leaf proof utilities)
- `src/runner/dispatch/herdr-reconcile.mjs` (+621 lines, Herdr S2 proof layer)
- `test/runner/dispatch-r9-performance-cache.test.mjs` (+110 lines, R9 unit tests)

---

## 4. Verification Evidence & Test Execution

### 4.1 Focused & Boundary Test Suites

1. **R1–R3 Boundary & Import Graph Tests**:
   - Command: `node --test test/runner/dispatch-reconciliation-import-graph.test.mjs`
   - Result: **52 pass / 0 fail / 0 skip** (Exit 0)
   - Verified:
     - `src/runner/dispatch/**` contains 0 references to `pick`, `return`, `claim`, or `appendEvent`.
     - `src/runner/dispatch/resolve.mjs` & `prepare.mjs` contain 0 direct imports of `workflow-stage-graphs`.
     - Transitive import graph of `reconcile` strictly excludes process-control/retry/admission/takeover modules.

2. **R1, R7, R8 Production Call Sites**:
   - Command: `node --test test/runner/dispatch-production-call-sites.test.mjs`
   - Result: **14 pass / 0 fail** (Exit 0)
   - Verified:
     - `fanoutBatchExecutorCli` in Work Driver coordinates `pick -> execute -> return` and recovers with `return --to blocked` on execution failure.
     - `dispatchDeclaredOperation` routes to adapter in production coordination flow.
     - `openDispatchRun` stamps `contract: 'dispatch-run.legacy'`.

3. **R4–R5 Confinement Authority & Herdr Tests**:
   - Command: `node --test test/runner/dispatch-confinement-authority.test.mjs test/runner/dispatch-confinement-p04.test.mjs test/runner/dispatch-confinement-p05.test.mjs`
   - Result: **64 pass / 0 fail** (Exit 0)
   - Verified:
     - `assessAndPrepare` unified door preserves all 8 local-bwrap-v1 falsification probes and fail-closed behaviors.
     - `authority.mjs` contains 0 adapter layer imports.
     - `publishHerdrCompletionReceipt` commits terminal outcome for both failed and settled runs.

4. **R6 Brief & Prompt Tests**:
   - Command: `node --test test/runner/dispatch-brief.test.mjs test/runner/assignment-dispatch.test.mjs`
   - Result: **Pass / 0 fail** (Exit 0)
   - Verified:
     - Brief schema unification: single result path in `effectiveContract`.
     - Prompt size hint warnings trigger on arguments exceeding 128 KiB.

5. **R7 Recovery & Controller Authority**:
   - Command: `node --test test/verbs/dispatch-recovery.test.mjs`
   - Result: **40 pass / 0 fail** (Exit 0)
   - Verified:
     - Worker-supplied `replacement-authority` in `outbox/` is strictly rejected and parks.
     - Controller-provided `replacement-authority` in `controller/` enables valid reassignment.

6. **R9 Performance Cache Tests**:
   - Command: `node --test test/runner/dispatch-r9-performance-cache.test.mjs`
   - Result: **2 pass / 0 fail** (Exit 0)
   - Verified:
     - Probe cache hit returns cached record within 1-hour TTL; fingerprint changes or expiration trigger cache miss.
     - `allRuns` memoizes within `withRunsCache` scope; explicit bypass and `clearAllRunsCache` invalidate cleanly.

7. **Architecture Manifest & Layer Integrity**:
   - Command: `node --test test/architecture.test.mjs`
   - Result: **13 pass / 0 fail** (Exit 0)
   - Verified: 1:1 manifest sync, one-way downward import rules, domain-siloing, and layer compliance.

### 4.2 Full Repository Test Suite

- **Command**: `env -u CLAUDE_CODE_SESSION_ID npm test`
- **Exit Code**: **0**
- **Test Summary**:
  - Total tests: **7733**
  - Test suites: **27**
  - **Pass**: **7660**
  - **Fail**: **0**
  - Cancelled: **0**
  - Skipped: **8**
  - Todo: **65**
  - Duration: **395583 ms** (~6.5 minutes)
- **Comparison to I11 Baseline**:
  - Baseline I11: 7652 pass / 0 fail.
  - Candidate I12: 7660 pass (+8 net new passing tests across R1, R7, R8, R9) / 0 fail.
  - Candidate regressions: **0**.

---

## 5. Architecture & Documentation Alignments

1. **`docs/platform/component-boundary.md`**:
   - Updated component map noting that `fanoutBatchExecutorCli` (`src/runner/fanout-batch.mjs`), worker slots (`OccupancyPort`), and fail-safe claim settlement (`fgos return --to blocked`) belong exclusively to Work Lifecycle Engine / Work Driver.
   - Clarified that Dispatch And Execution Engine strictly forbids Work lifecycle mutation, event append, and workflow lookups.

2. **`docs/platform/agent-coordination/architecture/dispatch-control-plane.md` & `docs/architect/agent-coordination/architecture/dispatch-control-plane.md`**:
   - Updated `## Source Inventory` to register new modules: `settlement.mjs`, `reconcile-cli-spawn.mjs`, `herdr-reconcile.mjs`, and `proof-helpers.mjs`.

3. **`docs/architect/component-boundary/component-boundary-advisory.md`**:
   - §9 Hexagonal Architecture View: registered `OccupancyPort` under `Work Lifecycle Engine:`.
   - §12 Dispatch As A Replaceable System: documented separation of Work lifecycle mutation (`src/runner/fanout-batch.mjs`) and event logging (`src/runner/dispatch-log.mjs`).

4. **`CHANGELOG.md`**:
   - Added comprehensive unreleased entry detailing Phase 09 / Unit I12 boundary simplifications.

5. **`plans/260919-coordination-skill-harness-simplification/plan.md`**:
   - Advanced Unit I12 status to `CANDIDATE READY FOR REVIEW`. Unit I13 remains untouched.

---

## 6. Unresolved Debt Classification

- **BLOCKER**: 0
- **HIGH**: 0
- **MEDIUM**: 0
- **LOW**:
  - *Timing instability in parallel merge stress tests*: Inherited from I08/I11; 100% green in candidate verification run.
  - *Module-purity debt*: Pre-existing filesystem cwd resolution in declaration layer acknowledged in plan; unaffected by I12 boundary placement.

---

## 7. Recommendation & Next Steps

All requirements $R_1$–$R_9$ of Unit I12 have been executed and verified in an isolated worktree with atomic commits. Zero behavioral drift or test regressions have been introduced against `main@cfdaf4bc`.

**Final Unit I12 Verdict**: `READY FOR INDEPENDENT REVIEW`.
