# Phase 03D / Unit I11 Runtime Remediation Report

**Date:** 2026-09-25  
**Unit:** I11 (Remediation Round)  
**Track:** `coordination-skill-harness-simplification`  
**Capability:** `code:implement`  
**Baseline commit:** `main@585d5ad1febc8067caad61b9d8953cf2002a750e`  
**Worktree:** `/home/vantt/projects/forgentX/.claude/worktrees/coordination-skill-harness-i11-remediation`  
**Branch:** `coordination-skill-harness-i11-remediation`  
**Candidate SHA:** `15e3c4230`  
**Final Verdict:** `READY FOR INDEPENDENT RE-REVIEW`

---

## 1. Executive Summary

This remediation round resolves the three contract defects identified during the initial review of Unit I11:

1. **I11-F01 (HIGH) — Caveated Evidence Adjudicability Gate**:
   - **Root Cause**: `store.mjs` enforced shared-cwd caveat checks only when `disposition === 'cell-closed'`. Dispositions with acceptance semantics (e.g. `'accepted'`, `'accept'`) bypassed the caveat validation gate entirely, allowing caveated or non-attributable evidence to receive clean acceptance.
   - **Remediation**: Added `EVIDENCE_ACCEPTING_DISPOSITIONS` (`Set(['cell-closed', 'accepted', 'accept'])`) in `recordDriverDispositionLocked`. Every disposition accepting or closing evidence undergoes the exact same adjudicability gate under the held session events lock before any event mutation occurs. If unadjudicated shared-cwd caveats exist on the DAG, the call fails closed with a typed `CoordinationError('validation')` (`cannot record "${disposition}" disposition on caveated evidence`), ensuring 0 events are appended. Idempotent replay of previously-recorded dispositions continues to succeed with `{ appended: false }`.

2. **I11-F02 (HIGH) — Exact Node CWD Attribution via `dagNodeId`**:
   - **Root Cause**: `store.mjs` previously scanned all `manifest.assignmentRefs` linearly and took the first run cwd found without correlating the assignment to the requested DAG node. As a result, node A could borrow the working directory of sibling node B, producing false positive shared-cwd caveats or false attribution.
   - **Remediation**: Joined assignment records with declared DAG nodes strictly using `dagNodeId` from `assignment-created` events. Node cwd resolution inspects only runs belonging to assignments for that exact node (`asgnToNode.get(asgnId) === id`), evaluated in reverse chronological order (latest attempt first). Added fail-closed ownership verification: missing `dagNodeId`, conflicting/ambiguous `dagNodeId` across events (`corrupt-log`), or references to unknown DAG nodes throw immediately before mutation. In `dag-scheduler.mjs`, `resolveNodeCwd` also sorts attempts in reverse chronological order so the latest attempt cwd takes precedence.

3. **I11-F03 (MEDIUM, Approval-Blocking) — Scheduler Outcome Taxonomy Reservation**:
   - **Root Cause**: In `dag-scheduler.mjs` and `run.mjs`, unlinked, in-flight, or retried nodes with `authoritativeSettled: false` fell back to `schedulerOutcome ?? 'deferred'`, even in the absence of a `concurrency-cap` error.
   - **Remediation**:
     - `deferred` is strictly reserved for admission delays caused by authoritative capacity limits (`concurrency-cap` error code).
     - Unlinked, in-flight, or retry-pending nodes project as `materialized` with `authoritativeSettled: false`.
     - Dependent steps whose prerequisites did not settle are marked `blocked` with `blockedBy: [depId]`, unless all unsettled prerequisites were genuinely deferred by capacity (`concurrency-cap`), in which case the dependent is also marked `deferred`.
     - Unified outcome parity across `run`, `show`, `headless`, and cold resume projections.

---

## 2. Git Discipline & Safety Commitments

- **Exact Baseline Verification**: Verified `main` at `585d5ad1febc8067caad61b9d8953cf2002a750e`. Verified ancestors `ac19f6d1` (Unit I08) and `605d26fe` (Unit I10). No operations in progress.
- **Main Checkout Protection**: The main checkout `/home/vantt/projects/forgentX` contained dirty/untracked files. It was left completely untouched: zero file edits, no staging, no stashes, no reset, no commit, and no branch switches performed on the main checkout.
- **Isolated Worktree**: All changes, test executions, and commits were conducted inside `/home/vantt/projects/forgentX/.claude/worktrees/coordination-skill-harness-i11-remediation` on branch `coordination-skill-harness-i11-remediation`.
- **Scope Discipline**: No I12 refactoring, no Phase 4 expansion, no queue/daemon implementations, no new event families or stores introduced.

---

## 3. GitNexus Status & Impact Analysis

- **GitNexus Index Status**: `STALE / DEGRADED`.
  - The local GitNexus index reflects commit `16a7900` (stale relative to baseline `585d5ad1f`).
  - As mandated by the protocol, degraded status is explicitly acknowledged; stale index metrics were not used to claim low risk.
- **Manual Impact Analysis & Blast Radius**:
  - `recordDriverDisposition` / `recordDriverDispositionLocked` (`src/runner/coordination/store.mjs`):
    - Upstream callers: CLI driver command (`src/cli/commands/coordination.mjs`), test harness (`test/runner/coordination-store.test.mjs`, `test/runner/coordination-dag-deferred-probes.test.mjs`, `test/verbs/coordination-close.test.mjs`).
    - Impact: Dispositions `'accepted'` and `'accept'` now execute caveat check under lock. Safe fail-closed hardening with 0 schema modifications.
  - `resolveNodeCwd` (`src/verbs/coordination/dag-scheduler.mjs`):
    - Upstream callers: `src/verbs/coordination/close.mjs`, `src/verbs/coordination/run.mjs`, `src/verbs/coordination/show.mjs`.
    - Impact: Reverse-chronological attempt inspection ensures latest run attempt is attributed.
  - `scheduleDagSteps` (`src/verbs/coordination/dag-scheduler.mjs`):
    - Upstream callers: `src/verbs/coordination/run.mjs`.
    - Impact: Accurate outcome taxonomy (`materialized` / `blocked` vs `deferred`), preserving concurrency-cap retry mechanics.

---

## 4. Modified Files & Diff Summary

| File | Changes | Description |
|---|---|---|
| `src/runner/coordination/store.mjs` | +118 / -11 | Enforce caveat gate on `accepted`/`accept`; join `dagNodeId` for node cwd resolution; fail-closed ownership verification |
| `src/verbs/coordination/dag-scheduler.mjs` | +25 / -5 | Reserve `deferred` for `concurrency-cap`; distinguish `blocked` vs `deferred` pending steps; reverse sort attempts in `resolveNodeCwd` |
| `src/verbs/coordination/run.mjs` | +13 / -3 | Resumed unlinked/retried DAG nodes project `schedulerOutcome: 'materialized'`; normalize `blockedBy` arrays |
| `test/runner/coordination-dag-deferred-probes.test.mjs` | +754 / -198 | Converted 3 TODO probes into permanent ordinary tests; added F02 matrix (6 subcases) and F03 matrix (4 subcases) |
| `test/runner/coordination-p07-migration-and-adversarial.test.mjs` | +2 / -2 | Aligned Probe R2 assertions with non-deferred taxonomy for retried predecessor (`materialized`) and successor (`blocked`) |

---

## 5. Verification Matrix Results

### 5.1 Remediation Probes (`test/runner/coordination-dag-deferred-probes.test.mjs`)
- Result: **6 passed / 0 todo / 0 failed** (duration: ~2.0s)
  1. Unlinked node on resume carries accurate non-deferred outcome taxonomy and projection parity (`materialized`, not `deferred`).
  2. Driver disposition on caveated findings refuses `accepted`, `accept`, and `cell-closed` at store level; no events appended; stale action key refused.
  3. Caveated session cannot close or discharge caveat and requires cancellation and recheck in new session.
  4. Distinct node cwds allow `cell-closed` and `accepted` disposition without false positive caveats; idempotent replay verified.
  5. F02 node cwd attribution matrix: shared-cwd caveat, reverse order, multiple attempts, ownership validation (missing, conflicting, unknown), sibling isolation.
  6. F03 scheduler outcome matrix: concurrency-cap deferral & retry, non-cap refusal, corrupt/unlinked evidence, cold resume parity.

### 5.2 Focused DAG Matrix (5 test files, 49 tests)
- `test/runner/coordination-dag-corrupt-evidence.test.mjs` (9 passed, 0 failed)
- `test/runner/coordination-dag-cold-resume.test.mjs` (9 passed, 0 failed)
- `test/runner/coordination-dag-concurrency.test.mjs` (9 passed, 0 failed)
- `test/runner/coordination-p07-migration-and-adversarial.test.mjs` (16 passed, 0 failed)
- `test/runner/coordination-dag-deferred-probes.test.mjs` (6 passed, 0 failed)
- Result: **49 passed / 0 failed** (100% pass)

### 5.3 Core & Verb Suites
- `test/runner/coordination-store.test.mjs`, `coordination-replay.test.mjs`, `coordination-session-engine.test.mjs`: **105 passed / 0 failed**
- `test/verbs/coordination-run-driver-steps.test.mjs`: **86 passed / 0 failed**
- `test/verbs/coordination-run.test.mjs`, `coordination-show.test.mjs`, `coordination-chain.test.mjs`, `coordination-recovery.test.mjs`: **16 passed / 0 failed**
- Dispatch dependency matrix (`run-result`, `dispatch-governance`, `dispatch-assignment`, `reconcile-run`, `recovery`): **33 passed / 0 failed**
- Coordination-wide suite (`test/runner/coordination-*.test.mjs`, `test/verbs/coordination-*.test.mjs`, `test/cli/coordination.test.mjs`): **1045 passed / 0 failed / 0 todo**

### 5.4 Full Repository Test Suite (`npm test`)
- Command: `env -u CLAUDE_CODE_SESSION_ID npm test`
- Total Tests: **7,725**
- Passed: **7,652**
- Failed: **0**
- Skipped: **8**
- Todo: **65**
- Duration: **404.1s**
- Exit Code: **0**

### 5.5 Git Hygiene
- `git diff --check`: Clean (0 whitespace/formatting errors).
- `git status`: Clean working directory (excluding symlinked ignored directories).

---

## 6. Status of Dependent Units & Next Actions

- **Unit I11**: Remediation implemented and verified across all matrices. Status transitioned to **READY FOR INDEPENDENT RE-REVIEW**.
  - *Per track policy, Unit I11 is NOT self-declared VERIFIED or APPROVED.*
- **Unit I12**: Remains strictly **BLOCKED** pending independent review approval of Unit I11.
- Candidate branch `coordination-skill-harness-i11-remediation` at commit `15e3c4230` is handed off to Track Manager for independent re-review.
