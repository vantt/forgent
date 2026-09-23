# Independent Review Report: Unit I06 — Dispatch-Hardening Phase 05 Remainder

- **Track**: `plans/260919-coordination-skill-harness-simplification/plan.md` (Unit I06 / Phase 3A)
- **Parent Phase**: `plans/260920-2217-dispatch-engine-hardening/phase-05-policy-governance-coherence.md`
- **Date**: 2026-09-23
- **Branch**: `coordination-skill-harness-i06-dispatch-governance`
- **Worktree**: `/home/vantt/projects/forgentX/.claude/worktrees/coordination-skill-harness-i06-dispatch-governance`
- **Base Commit**: `15e4048503ca1ee02dae23263dee84b9c983386d` (`main`)
- **Candidate Lineage**: `b67f3794ae545d9ddcb3ce711879dd1c4dc1f012` -> `2e210796322cbb950a95703aa7b4d05ed357cd03`
- **Current Candidate Status**: `implemented` (ready for independent re-review verification; non-integrated candidate)
- **Next Dependency Gate**: Unit I08 (dispatch verification) and Unit I09 (DAG forward-port)

---

## 1. Verified Identity & Review History

| Field | Detail |
|---|---|
| **Base SHA** | `15e4048503ca1ee02dae23263dee84b9c983386d` (`main`, `origin/main`) |
| **Round 1 Candidate** | `b67f3794ae545d9ddcb3ce711879dd1c4dc1f012` |
| **Round 1 Verdict** | `REQUEST CHANGES` (I06-REV-01 whitespace gate; I06-REV-02 full-suite classification) |
| **Round 2 Candidate** | `2e210796322cbb950a95703aa7b4d05ed357cd03` |
| **Round 2 Verdict** | `REQUEST CHANGES` (I06-TM-01 cross-plan status accounting contract) |
| **Ancestry** | Base is direct ancestor of candidate; 0 behind / 1 ahead |
| **Branch / Worktree** | `coordination-skill-harness-i06-dispatch-governance` |
| **Integration Status** | **Not integrated**; candidate remains on isolated worktree branch |

---

## 2. Findings & Discharges

### 2.1 I06-REV-01 — Required Whitespace Gate (Discharged)
- **Finding**: Trailing double-space line breaks in `reports/phase-03a-i06-dispatch-governance-implementation.md:3-8` caused `git diff --check <base>...<candidate>` to exit 2.
- **Discharge Evidence**: Trailing whitespace removed across all lines; `git diff --check 15e4048503ca1ee02dae23263dee84b9c983386d...HEAD` exits 0 with zero warnings.

### 2.2 I06-REV-02 — Full-Suite Gate & Failure Classification (Discharged)
- **Finding**: `npm test` timed out after 600s with visible failures before timeout, including merge/approve tests and research fan-out concurrency.
- **Discharge Evidence**:
  1. **Pre-Existing Merge/Approve Defect**: Traced directly to commit `7e682516` on `main` introducing `os.tmpdir()` at `src/runner/merge.mjs:1790` without `import os from 'node:os'`. Reproduces identically on `main@15e4048503ca1ee02dae23263dee84b9c983386d`. Classified as pre-existing regression on `main`.
  2. **Unbuilt Rust Binaries**: `fgctl-upgrade.test.mjs` and `release-tree.test.mjs` require pre-compiled `target/release/fgctl` and `target/release/fgos`. Reproduces identically on `main`. Classified as environment/unbuilt binaries.
  3. **Baseline Citation Drift**: `runner.md:2922` unglossed citation is pre-existing on `main`.
  4. **Research Fan-Out Concurrency**: Re-verified in isolation via `node --test test/runner/coordination-research-fan-out.test.mjs`; all 14 tests pass (including `maxConcurrency: 1` and `maxConcurrency: 2` tests). Failure in full suite was due to process contention under heavy test load.

### 2.3 I06-TM-01 — Cross-Plan Status Accounting Contract (Discharged)
- **Finding**: Parent plan used non-vocabulary status `implemented-ready-for-review`; candidate SHA was omitted from parent plan and Phase 05 status; Phase 05 lacked explicit state, direct candidate evidence, last-verified revision, and next gate; no checked-in review report existed.
- **Discharge Evidence**:
  1. Updated `plans/260919-coordination-skill-harness-simplification/plan.md:799-815` with closed vocabulary `status: implemented`, exact candidate SHA and lineage, last-verified date/revision, candidate vs historical test evidence separation, and next dependency gates (I08, I09).
  2. Updated `plans/260920-2217-dispatch-engine-hardening/phase-05-policy-governance-coherence.md` with explicit state, candidate SHA, candidate test evidence, and next dependency gate.
  3. Updated implementation report with candidate SHA, status, and next gate.
  4. Checked in this independent review report (`phase-03a-i06-dispatch-governance-review.md`).
  5. Maintained non-integration stance across all documents.

---

## 3. Technical Requirements Disposition (R5–R8)

| Requirement | Reviewer Disposition | Implementation Evidence |
|---|---|---|
| **R5 (Provider/Model Boundary)** | **PASS** | `deriveProviderFamily` and `normalizeProviderFamily` verified as single canonical path in `src/runner/dispatch/assignment-policy.mjs`. Model resolution independently decoupled via `modelForTier`, `modelForExecution`, and `resolveVerifiedAssignmentModel`. No artificial abstractions added. |
| **R6 (Cross-Provider Redirect)** | **PASS** | `crossProvider: boolean` schema normalization in `config.mjs`. Typed refusal `redirect.cross-provider-not-permitted` enforced in `assignment-runner.mjs`. Governance checks (`disallowedProviders`, `disallowedExecutors`, `allowCrossProvider`) preserved. Full redirect provenance recorded in `compiledPlan.redirectDecision` and `dispatch-plan.json`. 11 unit tests in `dispatch-cross-provider-redirect.test.mjs` pass. |
| **R7 (PlacementPolicy Authority)** | **PASS** | Authority settled under Disposition 1: `PlacementPolicy` is the active production binder for model and redirect selection. Deduplicated `stableIndex` in `assignment-runner.mjs` to import canonical `stablePoolIndex` from `placement-policy.mjs`. Updated doc comment in `placement-policy.mjs:405-411` to document shared canonical status. Preserved `evaluatePlacementPolicyShadow` for test compatibility. |
| **R8 (Adapter Registry Leaf)** | **PASS** | Pure leaf module `src/runner/dispatch/adapters.mjs` created. `config.mjs` imports from it, cutting circular dependency with `transport.mjs`. Architecture cycle-cut and call-site posture tests pass (13 pass / 0 fail). |

---

## 4. Real I04 Overlap Analysis

### 4.1 Scope Comparison
- **Unit I04** (`coordination template registry/resolver/provenance`):
  - Focus: `src/runner/coordination/templates/`, template registries, parameter substitution, template integrity digests, and prompt preparation.
  - Lifecycle locus: Upstream of dispatch, during session action composition and Assignment synthesis.
- **Unit I06** (`dispatch governance remainder`):
  - Focus: `src/runner/dispatch/` (`config.mjs`, `transport.mjs`, `adapters.mjs`, `placement-policy.mjs`, `assignment-runner.mjs`), executor selection, cross-provider redirects, PlacementPolicy binding, and adapter invocation.
  - Lifecycle locus: Downstream of Assignment creation, during run admission, worker execution, and result settlement.

### 4.2 Shared Boundary & Interaction
- The contract boundary connecting I04 and I06 is the immutable `Assignment` data model defined in `docs/platform/agent-coordination/contracts/assignment-run-runresult.md`:
  - I04 resolves prompt templates and attaches the resolved prompt envelope and template provenance into the `Assignment`.
  - I06 receives the prepared `Assignment`, resolves executor governance policies (`disallowedProviders`, `disallowedExecutors`, `allowCrossProvider`), evaluates redirect pool eligibility (`crossProvider: true`), recomputes model verification via `PlacementPolicy`, and appends `redirectDecision` into the committed `dispatch-plan.json`.

### 4.3 Conflict Assessment
- **Zero File Overlap**: I06 modifications are strictly confined to `src/runner/dispatch/*` and root test fixtures (`test/architecture.test.mjs`, `test/runner/assignment-dispatch.test.mjs`). No files under `src/runner/coordination/templates/` were touched.
- **Zero Symbol Collisions**: I04 template symbols and I06 dispatch policy symbols operate in distinct namespaces.
- **Contract Agreement**: Both units conform to `docs/platform/agent-coordination/contracts/assignment-run-runresult.md`. Template provenance (`promptEnvelope`) and dispatch provenance (`redirectDecision`) reside in non-overlapping fields of the Run metadata.

---

## 5. Re-Verification Test Matrix

All tests verified against candidate branch in worktree:

1. **Focused Dispatch Smoke & Placement Policy**:
   ```bash
   node --test \
     test/architecture.test.mjs \
     test/runner/dispatch-cross-provider-redirect.test.mjs \
     test/runner/placement-policy-matrix-coverage.test.mjs \
     test/runner/placement-policy-redirect-selection.test.mjs \
     test/runner/placement-policy.test.mjs \
     test/runner/dispatch-coordination-role-tiers.test.mjs
   ```
   **Result**: 101 tests, 5 suites, 101 pass, 0 fail (~4.1s).

2. **Mandatory Assignment Dispatch**:
   ```bash
   node --test test/runner/assignment-dispatch.test.mjs
   ```
   **Result**: 75 tests, 75 pass, 0 fail (~15.9s).

3. **11-Suite Coordination Matrix**:
   **Result**: 317 tests, 317 pass, 0 fail (~34.2s).

4. **Full Dispatch Matrix**:
   **Result**: 560 tests, 560 pass, 0 fail (~30.4s).

5. **Whitespace Gate**:
   ```bash
   git diff --check 15e4048503ca1ee02dae23263dee84b9c983386d...HEAD
   ```
   **Result**: Exit 0 (clean).
