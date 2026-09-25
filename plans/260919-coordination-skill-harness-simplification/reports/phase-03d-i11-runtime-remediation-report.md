# Phase 03D / Unit I11 Runtime Remediation Report (Round 2)

**Date:** 2026-09-25  
**Unit:** I11 (Remediation Round 2)
**Track:** `coordination-skill-harness-simplification`  
**Capability:** `code:implement`  
**Baseline commit:** `main@585d5ad1febc8067caad61b9d8953cf2002a750e`  
**Worktree:** `/home/vantt/projects/forgentX/.claude/worktrees/coordination-skill-harness-i11-remediation`  
**Branch:** `coordination-skill-harness-i11-remediation`  
**Candidate Code SHA:** `46896eb9de353b4fa88132995e4dfa5766eabdfc`
**Final Verdict:** `READY FOR INDEPENDENT RE-REVIEW`

---

## 1. Executive Summary

This Round 2 remediation addresses all findings raised in the Unit I11 re-review (`REQUEST CHANGES` on candidate `15e3c423`):

1. **I11R-01 (F01 - HIGH) — Invert Caveat Gate to Explicit Allow-List**:
   - **Finding**: The prior gate only checked exact strings `accepted`, `accept`, `cell-closed`. Any case variant (`Accepted`, `ACCEPTED`), whitespace (` accepted `), or semantic synonym (`approved`, `resolved`, `partially-accepted`, `cell-close`) bypassed the gate and appended disposition events on caveated sessions.
   - **Remediation**: In `src/runner/coordination/store.mjs`, inverted the check to an explicit allow-list `NON_ACCEPTING_DISPOSITIONS = new Set(['rejected', 'reject', 'deferred', 'defer', 'recheck-required'])`. The disposition string is normalized via `trim().toLowerCase()`. Any disposition outside this allow-list is treated as having acceptance meaning and is strictly refused on caveated evidence under the held lock before any event mutation occurs (0 events appended). Idempotent replay of previously-recorded dispositions continues to succeed with `{ appended: false }`, but replaying with changed evidence fails closed with validation error.

2. **I11R-02 (F02 - HIGH) — Single Authoritative CWD Resolver & Target Run Evidence**:
   - **Finding**: Store, run, show, and close used divergent cwd resolution logic. Cwd was chosen by directory listing of attempts rather than the authoritative result-linked run. A target node lacking run evidence could be accepted due to fallback to `opts.cwd`.
   - **Remediation**:
     - Centralized canonical cwd resolution into `resolveNodeCwd` in `src/runner/coordination/dag-declaration.mjs`, re-exported by `src/verbs/coordination/dag-scheduler.mjs` and used uniformly by `store.mjs`, `close.mjs`, `show.mjs`, `session-engine.mjs`, and `run.mjs`.
     - In `resolveNodeCwd`, matching assignments are inspected for result-linked runs first (`result-linked.runId` in `events` or `results`), reading the linked attempt's `run.json`. Corrupt `run.json` fails closed with a typed `CoordinationError('corrupt-log')`.
     - When unlinked, directory attempts in `runs/` are sorted numerically (`Number(a) - Number(b)`), handling unpadded directory names (e.g. `'9'` vs `'10'`), and scanned in reverse order.
     - In `store.mjs`, if a disposition has acceptance meaning and targets an assignment, it validates that authoritative run evidence exists (linked run or readable disk run). If absent, it throws `CoordinationError('validation', ... has no run evidence ...)`.
     - Fallback across all gates consistently defaults to `opts.cwd ?? process.cwd()`.

3. **I11R-03 / I11R-04 (F03 - HIGH/MEDIUM) — Scheduler Outcome Reservation & M3a Regression Lock**:
   - **Finding**: Re-review noted that restoring fallback `?? 'deferred'` in `dag-scheduler.mjs` left all 59 tests green (missing regression lock, mutation M3a survived). Additionally, descendants of a concurrency-cap deferred node were being marked `deferred` even though they did not experience concurrency-cap errors, violating proposal §4: *"No other error is deferred"*.
   - **Remediation**:
     - In `src/verbs/coordination/dag-scheduler.mjs`, pending steps whose dependencies did not settle are unconditionally marked `blocked` with `blockedBy = [unsettledDepNodeLabels]`, never `deferred`.
     - Missing or unlinked evidence without an explicit `schedulerOutcome` defaults to `'materialized'`, not `'deferred'`.
     - In `docs/platform/agent-coordination/proposals/dag-request-scheduler.md` §4.1, documented `materialized` in the outcome vocabulary (`settled | refused | blocked | deferred | materialized`).
     - Added probe 6 subcase 3 which explicitly asserts that unsettled step results without `schedulerOutcome` default to `materialized`. When fallback `?? 'deferred'` is restored, probe 6 fails with a strict equality assertion error (mutation M3a killed).

4. **I11R-05 — Accounting & Tracking Hygiene**:
   - Tracking plans updated to state "REMEDIATION ROUND 2 READY FOR INDEPENDENT RE-REVIEW" (removing "resolved" claims).
   - Candidate code SHA `46896eb9de353b4fa88132995e4dfa5766eabdfc` and docs tip SHA recorded.
   - Removed duplicate `assertDispositionRefOwnedBySession` call loop in `store.mjs`.
   - Unit I12 remains strictly `BLOCKED`.

---

## 2. Git Discipline & Safety Commitments

- **Baseline**: Verified `main` at `585d5ad1febc8067caad61b9d8953cf2002a750e`. Ancestors `ac19f6d1` (Unit I08) and `605d26fe` (Unit I10) confirmed. No operations in progress.
- **Main Checkout Protection**: Main checkout `/home/vantt/projects/forgentX` was left untouched: zero file edits, no staging, no stashes, no reset, and no commits performed on main.
- **Isolated Worktree**: All development, testing, and commits performed strictly within worktree `/home/vantt/projects/forgentX/.claude/worktrees/coordination-skill-harness-i11-remediation` on branch `coordination-skill-harness-i11-remediation`.
- **Atomic Two-Commit Structure**:
  1. Commit 1 (Code & Tests): `46896eb9de353b4fa88132995e4dfa5766eabdfc`
  2. Commit 2 (Docs & Plans): tracked immediately following this report.

---

## 3. GitNexus Status & Impact Analysis

- **GitNexus Status**: `STALE / DEGRADED` (index at `16a7900d`, stale relative to baseline `585d5ad1f`). Degraded status acknowledged; risk levels evaluated manually through source call graphs and git history.
- **Manual Impact Analysis**:
  - `resolveNodeCwd` (`src/runner/coordination/dag-declaration.mjs`):
    - Callers: `store.mjs`, `dag-scheduler.mjs`, `close.mjs`, `show.mjs`, `session-engine.mjs`, `run.mjs`.
    - Impact: All callers now share identical logic for finding node cwd: prioritizing linked run, numeric sorting of attempts, and fail-closed handling of corrupt `run.json`.
  - `recordDriverDispositionLocked` (`src/runner/coordination/store.mjs`):
    - Callers: CLI `fgos coordination disposition`, session engine.
    - Impact: Any disposition with acceptance semantics is subject to the caveat adjudicability gate. Targets without run evidence fail closed.
  - `scheduleDagSteps` (`src/verbs/coordination/dag-scheduler.mjs`):
    - Callers: `run.mjs`.
    - Impact: Steps blocked by deferred predecessors correctly receive `blocked` (with `blockedBy`), preserving §4 invariant.

---

## 4. Verification & Mutation Proofs

### 4.1 Mutation Proofs
- **M1 (Disable F01 Allow-List Gate)**: Reverting the allow-list gate causes Probe 2 to fail on case variants, whitespace variants, and synonym variants (`Accepted`, `APPROVED`, etc.). -> **RED**
- **M2 (Remove dagNodeId Filtering in F02)**: Removing `dagNodeId` filtering causes Probe 5 to fail across reversed manifest order, Case L, Case R, and sibling isolation subcases. -> **RED**
- **M3a (Restore Fallback `?? 'deferred'` in F03)**: Restoring fallback `?? 'deferred'` causes Probe 6 subcase 3 to fail (`assert.strictEqual(result.outcome, 'materialized')`). -> **RED**

### 4.2 Test Suite Matrix
- **Deferred Probes (`test/runner/coordination-dag-deferred-probes.test.mjs`)**:
  - **6 passed / 0 fail / 0 todo**
  - Probe 1: Unlinked node outcome taxonomy & projection parity (`materialized`).
  - Probe 2: F01 allow-list gate refuses all 11 accepting casing/whitespace/synonym variants; 0 events appended; `rejected` allowed; idempotent replay ok; tampering fails closed.
  - Probe 3: Caveated session cannot close or discharge caveat.
  - Probe 4: Distinct node cwds allow disposition without false positive caveats.
  - Probe 5: F02 node cwd attribution matrix: reversed manifest order, Case L (linked attempt 01 in shared cwd, unlinked 02 in distinct cwd), Case R, Case N (unpadded '9' vs '10'), target missing run refused, sibling at repo root fails closed with caveat refusal, corrupt sibling `run.json` throws `corrupt-log` at store and show.
  - Probe 6: F03 outcome matrix: concurrency-cap deferral & retry, descendant `blocked` with `blockedBy`, missing/unlinked evidence defaults to `materialized` (killing M3a), non-validation error throws.
- **Driver Steps Suite (`test/verbs/coordination-run-driver-steps.test.mjs`)**:
  - **86 passed / 0 fail / 0 todo**
- **Focused DAG Suite**:
  - 6 files, **43 passed / 0 fail / 0 todo**
- **Coordination Suite**:
  - **771 passed / 0 fail / 0 todo**
- **Full Suite (`npm test`)**:
  - **7652 passed / 0 failed / 8 skipped / 65 todo** (Exit code: 0)

---

## 5. Dependent Units & Next Actions

- **Unit I11**: Remediation Round 2 complete and verified across all matrices. Status transitioned to **READY FOR INDEPENDENT RE-REVIEW**.
  - *Per track policy, Unit I11 is NOT self-declared VERIFIED or APPROVED.*
- **Unit I12**: Remains strictly **BLOCKED** awaiting independent review approval of Unit I11.
- Candidate branch `coordination-skill-harness-i11-remediation` (code SHA `46896eb9de353b4fa88132995e4dfa5766eabdfc`) is handed off for independent re-review.
