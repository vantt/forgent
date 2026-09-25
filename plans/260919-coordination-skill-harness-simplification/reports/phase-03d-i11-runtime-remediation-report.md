# Phase 03D / Unit I11 Runtime Remediation Report (Round 3)

**Date:** 2026-09-25
**Unit:** I11 (Remediation Round 3)
**Track:** `coordination-skill-harness-simplification`
**Capability:** `code:implement`
**Baseline commit:** `main@585d5ad1febc8067caad61b9d8953cf2002a750e`
**Worktree:** `/home/vantt/projects/forgentX/.claude/worktrees/coordination-skill-harness-i11-remediation`
**Branch:** `coordination-skill-harness-i11-remediation`
**Round 1 Candidate Code SHA:** `15e3c423851b9b55502c38b248a313b146ae1a8a` (docs tip `2927ed7a83d47ad04838634563a6e35ebcc7fe4b`)
**Round 2 Candidate Code SHA:** `46896eb9de353b4fa88132995e4dfa5766eabdfc` (docs tip `e4fe98b847e4dae33cf08da478c005d0cc0c8970`)
**Round 3 Candidate Code SHA:** `9cf843b6fbb786923992f9deb2f70deb447620a2`
**Final Verdict:** `READY FOR INDEPENDENT RE-REVIEW`

---

## 1. Executive Summary

This Round 3 remediation resolves the approval-blocking finding (I11R2-01) and regression lock gap (I11R2-03) from the Unit I11 Round 2 re-review (`REQUEST CHANGES` on candidate `46896eb9`):

1. **I11R2-01 (F02 - HIGH, Approval-Blocking) — Fail Closed on Missing/Invalid Linked `run.json`**:
   - **Finding**: In Round 2, `resolveNodeCwd` in `src/runner/coordination/dag-declaration.mjs` fell back to `defaultCwd` when a linked run did not have `run.json` or lacked a string `cwd`. When a linked `run.json` was deleted on a caveated session, store permitted clean acceptance, show reported `caveated=false`, and close bypassed caveat adjudication. Missing evidence silently converted into clean success.
   - **Remediation**:
     - In `src/runner/coordination/dag-declaration.mjs` (`resolveNodeCwd`):
       - If a run is linked via `result-linked` event or result entry:
         - If the run directory does not exist on disk, throws `CoordinationError('dangling-ref', ...)`.
         - If `run.json` is missing, contains malformed JSON, or contains a non-string or empty `cwd`, throws `CoordinationError('corrupt-log', ...)`.
       - For unlinked disk attempts:
         - If `run.json` exists on disk but has a non-string or empty `cwd`, throws `CoordinationError('corrupt-log', ...)`.
       - Added event tracking for `run-retried` events: retried runs invalidate prior `result-linked` pointers so retried nodes do not resolve against stale linked runs.
     - In `src/verbs/coordination/show.mjs`:
       - Run results are validated via `isAssignmentSettledWithEvidence` before caveat resolution so corrupt `result.json` throws `corrupt-log` directly.
       - Catches `dangling-ref` (e.g. ghost run events without disk presence) and sets node cwd to `null` without catching or suppressing `corrupt-log`.
     - In `src/verbs/coordination/run.mjs`:
       - Pre-schedule and post-schedule caveat resolutions catch `dangling-ref` and set node cwd to `null` without swallowing `corrupt-log`.
     - Across store, show, and close: missing or invalid linked `run.json` strictly fails closed with `corrupt-log`.

2. **I11R2-03 (F02 - LOW, Regression Lock) — Numeric Attempt Sort Lock**:
   - **Finding**: Mutation M2d (lexicographically sorting attempts) survived because existing fixtures used single-digit attempts.
   - **Remediation**:
     - Added Probe 5 Subcase 9 asserting that unlinked attempt resolution sorts numerically (`Number(a) - Number(b)`), testing attempts `9` and `10` where lexicographical sorting (`"10" < "9"`) would select attempt `9` instead of `10`.
     - Confirmed mutation M2d (reverting to `sort()`) fails with an `AssertionError`.

3. **I11R2-04 — Accounting & Hygiene**:
   - Updated tracking plans (`plan.md`, `plans/260917-cold-resumable-coordination-dag/plan.md`, `plans/260920-2217-dispatch-engine-hardening/plan.md`) with Round 3 candidate SHA `9cf843b6fbb786923992f9deb2f70deb447620a2` and Round 2 docs tip SHA `e4fe98b847e4dae33cf08da478c005d0cc0c8970`.
   - Verified `git diff --check` passes cleanly (no trailing whitespace).
   - Unit I12 remains strictly `BLOCKED`.

---

## 2. Git Discipline & Safety Commitments

- **Baseline**: Verified `main` at `585d5ad1febc8067caad61b9d8953cf2002a750e`. Ancestors `ac19f6d1` (Unit I08) and `605d26fe` (Unit I10) confirmed. No operations in progress.
- **Main Checkout Protection**: Main checkout `/home/vantt/projects/forgentX` was left untouched: zero file edits, no staging, no stashes, no reset, and no commits performed on main.
- **Isolated Worktree**: All development, testing, and commits performed strictly within worktree `/home/vantt/projects/forgentX/.claude/worktrees/coordination-skill-harness-i11-remediation` on branch `coordination-skill-harness-i11-remediation`.
- **Atomic Two-Commit Structure**:
  1. Commit 1 (Code & Tests): `9cf843b6fbb786923992f9deb2f70deb447620a2`
  2. Commit 2 (Docs & Plans): `docs(coordination): record Unit I11 round 3 remediation and update tracking plans`

---

## 3. GitNexus Status & Impact Analysis

- **GitNexus Status**: `STALE / DEGRADED` (index at `16a7900d`, stale relative to baseline `585d5ad1f`). Degraded status acknowledged; risk levels evaluated manually through source call graphs and git history.
- **Manual Impact Analysis**:
  - `resolveNodeCwd` (`src/runner/coordination/dag-declaration.mjs`):
    - Callers: `store.mjs`, `dag-scheduler.mjs`, `close.mjs`, `show.mjs`, `session-engine.mjs`, `run.mjs`.
    - Impact: All callers fail closed when a linked run lacks `run.json` or string `cwd`. Ghost runs without disk directories raise `dangling-ref`, which CLI verbs handle safely while preserving `corrupt-log` failures.
  - `showCoordinationSession` (`src/verbs/coordination/show.mjs`):
    - Validates `RunResult` payload integrity upfront so corrupt `result.json` produces clear `corrupt-log` errors.

---

## 4. Verification & Mutation Proofs

### 4.1 Mutation Proofs
- **Silent Fallback Mutation (I11R2-01)**: Reverting fail-closed behavior to silent fallback on missing `run.json` causes Probe 5 Subcase 8 to fail (`Missing expected exception: store must throw corrupt-log when linked run.json is deleted`). -> **RED**
- **M2d Lexicographical Sort Mutation (I11R2-03)**: Changing `.sort((a, b) => Number(a) - Number(b))` to `.sort()` causes Probe 5 Subcase 9 to fail (`AssertionError: unlinked attempt resolution must sort numerically (10 > 9)`). -> **RED**
- **M1 (Disable F01 Allow-List Gate)**: Reverting the allow-list gate causes Probe 2 to fail on casing, whitespace, and synonym variants. -> **RED**
- **M2 (Remove dagNodeId Filtering in F02)**: Removing `dagNodeId` filtering causes Probe 5 to fail across reversed manifest order and sibling isolation subcases. -> **RED**
- **M3a (Restore Fallback `?? 'deferred'` in F03)**: Restoring fallback `?? 'deferred'` causes Probe 6 subcase 3 to fail (`assert.strictEqual(result.outcome, 'materialized')`). -> **RED**

### 4.2 Test Suite Matrix
- **Deferred Probes (`test/runner/coordination-dag-deferred-probes.test.mjs`)**:
  - **6 passed / 0 fail / 0 todo**
  - Subcase 8 verifies missing/corrupt linked `run.json` throws `corrupt-log` across store, show, and close.
  - Subcase 9 locks numeric sorting for unlinked attempts (`10 > 9`).
- **Focused DAG Suite** (6 files):
  - **59 passed / 0 fail / 0 todo**
- **Core Coordination Suite** (`store`, `replay`, `session-engine`, `run-driver-steps`):
  - **191 passed / 0 fail / 0 todo**
- **Coordination-Wide Suite**:
  - **1045 passed / 0 fail / 0 todo**
- **Timing Debt Suite** (3 runs):
  - **30 passed / 0 fail / 0 todo**
- **Full Suite (`npm test`)**:
  - **7652 passed / 0 failed / 8 skipped / 65 todo** (Exit code: 0)

---

## 5. Review & Ratification Verdict

- Independent reviewer re-review round 3: **APPROVE** (`code-review-260925-2137-unit-i11-remediation-round3-re-review-report.md`).
- Track Manager gate assessment:
  - F01, F02, F03, and I11R2-01 independently resolved.
  - I11R3-02 ratified.
  - Synchronized merge tip `3d706b8901bb8787f8c6c9b35641b9a4acaeea3b` APPROVED for integration.
  - User-authorized fast-forward of `main@23fd6f96` to `3d706b89`.

---

## 6. Integration & Post-Merge Verification

- **Integrated Commit SHA:** `main@3d706b8901bb8787f8c6c9b35641b9a4acaeea3b`
- **Post-Merge Verification Results:**
  - Focused test matrix (155 tests across DAG, driver steps, live-proof, start-status): **155 passed / 0 fail / 0 todo**
  - Full suite (`npm test`): **7652 passed / 0 failed / 8 skipped / 65 todo** (Exit code: 0)
  - Post-merge candidate regressions: **0**
- **Status:** Integrated at `main@3d706b89`. Awaiting Track Manager final `VERIFIED` declaration.
- **Unit I12:** Remains strictly **BLOCKED** until Track Manager authorizes opening I12.
