# Integration Report: Unit I02 & Unit I03 — RunResult Truth, Superseeded Settlement (R5), and Quorum Integrity

**Track**: `plans/260919-coordination-skill-harness-simplification/plan.md`
**Date**: 2026-09-22
**Branch**: `coordination-integration-i02-result-truth`
**Worktree**: `/home/vantt/projects/forgentX/.claude/worktrees/coordination-integration-i02-result-truth`
**Baseline Commit**: `bd5951307ae510168393d2fb56358dbb0a2417c8` (`main`)
**Reference Commit**: `9049e6113efdac50afe25251e2aea9005adf589d` (`dispatch-hardening-phase01-r1r4`)

---

## 1. Executive Summary

Units **I02** and **I03** unify the Phase 01 RunResult truth contract (`9049e611`) with the newly merged Phase 2 unified integration baseline (`5a02e81a`) without destabilizing the shared coordination engine (`session-engine.mjs`).

- **Unit I02**: Successfully reconciled Phase 01 R1, R4, and implemented R5:
  - **R1 (Evaluator Truth)**: All on-disk result reading (`readLinkedRunResultFromDisk`, `findLatestRunResult`) routes strictly through `interpretRunResult(parsed)`. Invalid invariant claims and malformed v2 contracts are projected to `status: 'no-evidence'` and `confidence: 'failed'` (`contractCorrupt === true`), failing closed at all evaluation gates.
  - **R4 (Worker Artifact Path Resolution)**: In `session-engine.mjs:aggregationSourceFrom`, report resolution now dynamically leverages `resolveWorkerArtifactPath(runDir, /^report-(\d+)\.md$/, 'agent-report.md')`, ensuring that `herdr-spawn` workers publishing to `outbox/report-N.md` are correctly located and hashed (closing architecture review finding M14).
  - **R5 (Superseded Work Product Preservation)**: Evaluated and chosen disposition: **`IMPLEMENT`**. At settlement barriers in `assignment-runner.mjs`, if a controller is superseded mid-flight (`!isRunControlCurrent(...)`), its normalized output is saved atomically as `result.superseded.json` before raising `RunnerConfigError('run-control-superseded')`. Authoritative `result.json` is never written or overwritten, and `markRunSettled` is never called.
- **Unit I03 (Verification Matrix)**:
  - Added targeted mutation-sensitive tests in `coordination-session-engine.test.mjs` and `coordination-aggregation.test.mjs`.
  - Verified the entire 11-suite matrix with **315 tests passing, 0 failing**.
  - Verified GitNexus impact analysis: **LOW risk, 0 affected execution flows**.

---

## 2. Unit I02 Disposition & Implementation Details

### 2.1 R5 Disposition Choice: IMPLEMENT

We evaluated the three options:
1. **IMPLEMENT**: Preserves real work product in non-authoritative storage (`result.superseded.json`) per Decision D3 (`plans/260920-2217-dispatch-engine-hardening/phase-00-decision-gate-and-docs-truth.md`) and the contract in `docs/architect/agent-coordination/contracts/assignment-run-runresult.md:332`.
2. **DISCHARGE AS SUPERSEDED**: Rejected because silently dropping late results discards completed agent work without diagnostic trace.
3. **BLOCK**: Rejected because no dependencies or specifications were missing.

**Implementation**:
- Deferred the control token check in `assignment-runner.mjs` (both supervisor and CLI paths) until after worker output collection and `normalizeRunResultV2`.
- Encapsulated and exported the authoritative settlement gate `commitRunSettlement({ runDir, runId, controlEpoch, controlToken, runResult })` in `assignment-runner.mjs`.
- At the settlement barrier:
  ```javascript
  if (!isRunControlCurrent(runDir, { controlEpoch, controlToken })) {
    publishMutableProjection(path.join(runDir, 'result.superseded.json'), runResult);
    throw new RunnerConfigError(
      `executeAssignment: control token for Run "${runId}" (epoch ${controlEpoch}) is no longer current -- a newer controller has taken over; refusing to append a settlement from a superseded controller`,
      { code: 'run-control-superseded', phase: 'post-admission' },
    );
  }
  ```
- **R5 Conflict & Concurrency Contract (I02-REV-01)**:
  1. **Non-Authoritative Status**: `result.superseded.json` is strictly a diagnostic projection; it is never returned as an authoritative RunResult, never read by `readLinkedRunResultFromDisk` or `findLatestRunResult`, and never consumed by quorum evaluation, replay, or session closing.
  2. **Publication Atomicity**: Writes to both `result.json` and `result.superseded.json` use `publishMutableProjection`, writing to a process-unique temporary file (`.tmp-${pid}-${now}-${rand}`), fsyncing, and performing atomic POSIX replacement (`fs.renameSync`). Under concurrent OS execution, no reader ever observes a partial, torn, or corrupted file.
  3. **Same-Payload Retry Determinism**: Multiple concurrent or sequential retried stale attempts producing identical normalized work products converge deterministically to the identical byte representation in `result.superseded.json`.
  4. **Conflicting Late Payloads (Atomic Last-Writer-Wins)**: If multiple distinct stale workers race with conflicting payloads, atomic rename guarantees last-writer-wins. `result.superseded.json` always contains a complete, valid JSON payload of the latest writer, never torn or mixed.
  5. **Authoritative Result Invariant**: Authoritative `result.json` is never overwritten, modified, or touched by any late or superseded worker.
  6. **Two-OS-Process Concurrency Proof**: Verified via real multi-process execution in `test/runner/assignment-dispatch.test.mjs` running concurrent child processes.

### 2.2 Reconciled Fixes & Test Fixtures

- **`test/runner/coordination-research-fan-out.test.mjs`**: Fixed 2 test fixtures that asserted top-level `confidence = 'verified'` while leaving `classification.confidence.level` mismatched. `interpretRunResult` detects this mismatch as `contractCorrupt` and fails closed.
- **`test/runner/coordination-session-engine.test.mjs`**: Updated orphan result test to expect `classification.provenance: 'legacy-derived'`.
- **`test/runner/assignment-dispatch.test.mjs`**: Added comprehensive test cases for superseded control tokens and verified that late writers cannot overwrite authoritative `result.json` written by fresher controllers.

---

## 3. Unit I03 Mutation-Sensitive Tests

1. **Contract-corrupt RunResult fails closed in Quorum**:
   - Fixture: valid JSON with RunResult v2 contract declaring `execution.completed` with exit code 0 alongside `failure.family: 'provider'`.
   - Verified: `evaluateSessionQuorum` classifies the actor as failed (`status: 'no-evidence'`, `confidence: 'failed'`), and `closeSessionByQuorum` throws `CoordinationError('validation')`.
2. **Raw valid JSON with unknown/invalid RunResult contract fails closed**:
   - Fixture: valid JSON with unknown contract `{ id: 'some-future-contract', version: 99 }`.
   - Verified: `interpretRunResult` detects non-standard contract, fails closed to `status: 'no-evidence'`, actor is classified into `failed`, quorum cannot be satisfied.
3. **Preserved `result.superseded.json` cannot be consumed**:
   - Fixture: `result.json` moved to `result.superseded.json`.
   - Verified: Quorum evaluation and `closeSessionByQuorum` refuse with `dangling-ref`. `findLatestRunResult` returns `null` (does not adopt superseded result).
4. **`aggregationSourceFrom` resolves `herdr-spawn` worker report at `outbox/report-1.md` (M14)**:
   - Fixture: Worker writes report and result in `outbox/` directory only.
   - Verified: `executeAssignment` records `outbox/report-1.md` in `settleReports`, `aggregationSourceFrom` locates the report, SHA256 pin matches, and `validateSessionAggregation` reaches `outcome: 'consensus'`.

---

## 4. Full Verification Matrix Results

All 11 required test suites were executed via `node --test` inside `.claude/worktrees/coordination-integration-i02-result-truth`:

| Test Suite | Result | Duration | Key Coverage |
|---|---|---|---|
| `test/runner/run-result-v2.test.mjs` | 13 pass / 0 fail | ~2.5s | V2 contract normalization, validation, corruption detection |
| `test/runner/assignment-runresult.test.mjs` | 31 pass / 0 fail | ~5.2s | RunResult classification, evidence collection, contract persistence |
| `test/runner/assignment-dispatch.test.mjs` | 73 pass / 0 fail | ~12.8s | Fenced execution, R5 superseded settlement, two-process concurrency proof |
| `test/runner/coordination-session-engine.test.mjs` | 23 pass / 0 fail | ~24.5s | Dynamic consults, primary task, crash self-healing, I03 quorum tests |
| `test/runner/coordination-research-fan-out.test.mjs` | 12 pass / 0 fail | ~12.8s | Multi-provider fan-out, fan-in synthesis, verified evidence gating |
| `test/runner/coordination-recovery-and-quorum.test.mjs` | 46 pass / 0 fail | ~19.2s | Quorum policies, partial completion, retry lifecycle, schema-2 recovery |
| `test/runner/coordination-replay.test.mjs` | 29 pass / 0 fail | ~3.8s | Replay consistency, corruption rejection, lineage assertions |
| `test/runner/coordination-legacy-schema-compatibility.test.mjs` | 3 pass / 0 fail | ~0.8s | Schemas 1, 2, and 3 atomic precondition checks |
| `test/runner/coordination-stale-action-proof.test.mjs` | 21 pass / 0 fail | ~11.5s | Stale action key rejection, concurrency fences, idempotent retries |
| `test/runner/coordination-phase2-concurrency.test.mjs` | 16 pass / 0 fail | ~7.2s | Two-OS-process races, lock ordering, multi-writer coordination |
| `test/runner/coordination-aggregation.test.mjs` | 47 pass / 0 fail | ~20.1s | Cognitive aggregation, consensus evaluation, M14 outbox resolution |
| **Total** | **315 pass / 0 fail** | **100% Green** | |

---

## 5. GitNexus Impact & Static Analysis

Running `node /home/vantt/projects/forgentX/.gitnexus/run.cjs detect-changes --scope compare --base-ref main --repo forgent`:
- **Risk Level**: **LOW**
- **Affected execution flows**: 0
- **Modified symbols**:
  - `loadDefinitionForSession` (`src/runner/coordination/session-engine.mjs`)
  - `findLatestRunResult` (`src/runner/coordination/session-engine.mjs`)
  - `classifySessionQuorum` (`src/runner/coordination/session-engine.mjs`)
  - `digest` (`src/runner/coordination/session-engine.mjs`)
  - `commitRunSettlement` (`src/runner/dispatch/assignment-runner.mjs`)
  - `executeAssignment` (`src/runner/dispatch/assignment-runner.mjs`)
  - `settleReceiptRunFromOutcome` (`src/runner/dispatch/assignment-runner.mjs`)

---

## 6. Independent Review Findings Resolution

### I02-REV-01 (HIGH — R5 contract & concurrency proof gap)
- **Finding**: Preservation contract for `result.superseded.json` was under-specified, and concurrency proof lacked a real two-OS-process race test.
- **Resolution**:
  1. Extracted and exported `commitRunSettlement` in `src/runner/dispatch/assignment-runner.mjs` with an explicit docstring formalizing:
     - Non-authoritative diagnostic status (ignored by quorum, replay, close).
     - Atomic publication via `publishMutableProjection` (POSIX `fs.renameSync` from a unique tmp file, fsynced).
     - Same-payload retry determinism (concurrent/retried attempts converge to byte-identical JSON).
     - Conflicting late payloads resolution (atomic last-writer-wins without file corruption).
     - Immutability of authoritative `result.json`.
  2. Implemented real two-OS-process concurrency tests in `test/runner/assignment-dispatch.test.mjs` using `spawnCommitRunSettlement`:
     - Tested identical stale payload retry race (both throw `run-control-superseded`, `result.json` untouched, `result.superseded.json` deterministically matches).
     - Tested conflicting stale payloads race (both throw `run-control-superseded`, `result.json` untouched, `result.superseded.json` is valid parseable JSON containing full payload of either Worker A or Worker B).
     - Tested non-authoritative isolation (`findLatestRunResult` and `readLinkedRunResultFromDisk` never adopt `result.superseded.json`).
  3. Documented the explicit policy in `phase-01-result-truth.md` and this integration report.

### I02-REV-02 (MEDIUM — Candidate branch rebase and plan alignment)
- **Finding**: Candidate branch diverged from newly merged commit on `main` (`bfd1ecdb79a6d2209f8c510296976541e62da71d`), requiring rebase and reconciliation of `plan.md`.
- **Resolution**:
  1. Rebased `coordination-integration-i02-result-truth` linearly onto `main` (`bfd1ecdb`).
  2. Reconciled `plans/260919-coordination-skill-harness-simplification/plan.md` to preserve Phase 2A objectives/gates while integrating Units I02 and I03.
  3. Verified `git diff --check` passes with zero errors.

### I02-REV-03 (MEDIUM — Repository hygiene / operation-state marker)
- **Finding**: Worktree git directory contained a stale `REBASE_HEAD` marker left behind from an earlier operation, violating the approval gate requirement of no active or stale operation markers.
- **Resolution**:
  1. Confirmed no active rebase operation in progress.
  2. Cleaned stale `REBASE_HEAD` and `AUTO_MERGE` markers from `/home/vantt/projects/forgentX/.git/worktrees/coordination-integration-i02-result-truth/`.
  3. Rebased candidate branch directly on current local `main` (`bd5951307ae510168393d2fb56358dbb0a2417c8` / `22a5b100816fdedbaab50c79b1eba672acd64829`). Confirmed zero file overlap with test suite optimization changes and zero conflict.
  4. Verified with `find "$(git rev-parse --git-common-dir)" -name "*REBASE_HEAD*"` that zero `REBASE_HEAD` files exist across the entire repository.
  5. Re-ran focused smoke suite `node --test test/runner/assignment-dispatch.test.mjs`: 73 pass / 0 fail.

### I02-REV-04 (HIGH — Concurrency verification regression & test robustness)
- **Finding**: Smoke suite `node --test test/runner/assignment-dispatch.test.mjs` failed in `concurrent identical admission ... produces exactly one Run identity, never two` with `AssertionError: unsuccessful call must fail for an expected admission/control reason, got code: run-unreconciled`.
- **Root Cause & Contract Reconciliation**:
  1. In `src/runner/dispatch/assignment-runner.mjs:2075-2121`, when two genuinely concurrent OS processes attempt an identical admission tuple:
     - Process A admits and materializes Run "01", locking run control (`status: 'held'`).
     - Process B detects the existing admission and attempts post-admission resume via `reconcileCliSpawnRun`.
     - Because Process A is still actively running the executor worker, `reconcileCliSpawnRun` detects `rec.status === 'held'` and throws `RunnerConfigError` with `code: 'run-unreconciled'` (or `'run-in-flight'`), strictly refusing to launch a second worker over an unsettled, in-flight Run attempt.
     - This invariant is central to the single-controller execution contract (documented in `src/runner/coordination/session-engine.mjs:448, 523`).
  2. The test assertion at `test/runner/assignment-dispatch.test.mjs:2857` previously checked only pre-admission errors (`run-control-held`, `admission-invalid-predecessor`, `admission-duplicate-retry`), omitting the post-admission resume refusal codes.
  3. Assertion updated to include `['run-control-held', 'run-in-flight', 'run-unreconciled', 'admission-invalid-predecessor', 'admission-duplicate-retry']`.
  4. In `test/runner/assignment-dispatch.test.mjs:119`, `writeHangingExecutor` was updated to use synchronous `fs.writeSync(1, ...)` and `timeoutMs` adjusted to 500ms to eliminate buffered I/O race and false timeouts under heavy CPU contention.
- **Verification**:
  - `node --test --test-name-pattern="concurrent identical admission" test/runner/assignment-dispatch.test.mjs` passes consistently.
  - `node --test --test-name-pattern="captures timeout" test/runner/assignment-dispatch.test.mjs` passes consistently.
  - Full smoke suite `node --test test/runner/assignment-dispatch.test.mjs`: **74 pass / 0 fail**.

### Settlement Authority TOCTOU Resolution (HIGH — Atomic CAS & Barrier Concurrency Proof)
- **Finding**: Reviewer identified that in `commitRunSettlement`:
  ```javascript
  if (!isRunControlCurrent(...)) {
    publish result.superseded.json;
    throw ...;
  }
  publish result.json;
  markRunSettled;
  ```
  The check for current control epoch/token and the publication of `result.json` were separate operations outside an atomic CAS/lock boundary. An interleaving where:
  1. Old controller checks `isRunControlCurrent()` -> true.
  2. Newer controller takes over (acquires newer epoch) and settles (`publish result.json`).
  3. Old controller unpauses and executes `publishMutableProjection(result.json)` (via POSIX `renameSync`), overwriting the newer controller's authoritative result.
- **Root Cause & Contract Hardening**:
  1. `run-lock.mjs`: Implemented `settleRunControl(runDir, { controlEpoch, controlToken })`. It executes an atomic CAS via `publishNextGeneration` in `control/generations/`, validating that `{ controlEpoch, controlToken }` is still the current active generation and appending an immutable generation record with `purpose: 'settled'`.
  2. Updated `acquireRunControl` and `inspectRunControl` in `run-lock.mjs` to recognize `purpose: 'settled'` and refuse future controller acquisitions, closing any post-settlement takeover window.
  3. `assignment-runner.mjs`: `commitRunSettlement` now executes `settleRunControl` within the run-lock ledger. Furthermore, authoritative `result.json` is published via `publishImmutableProof` (`fs.linkSync`), failing closed with `EEXIST` so it can NEVER overwrite an existing authoritative result file.
  4. Added deterministic barrier hook `_beforeAuthoritativePublish` to `commitRunSettlement` for multi-process race verification.
- **Deterministic Two-Process Barrier Attack Verification**:
  - Added test in `test/runner/assignment-dispatch.test.mjs`: `executeAssignment: two-OS-process TOCTOU barrier race proves stale controller cannot overwrite authoritative result.json (R5 / I02-REV-04 settlement authority)`.
  - Step 1: Old writer starts under epoch 1, passes precondition (`isRunControlCurrent`).
  - Step 2: Old writer pauses at `_beforeAuthoritativePublish` barrier (writes `barrier-paused.json`, polls for release).
  - Step 3: Newer controller takes over, acquires epoch 2, commits settlement via `commitRunSettlement`, writes authoritative `result.json`.
  - Step 4: Newer controller releases Old Writer via `barrier-resume.json`.
  - Step 5: Old writer unpauses and attempts authoritative publication.
  - **Outcome**: Old writer is strictly refused (`settleRunControl` returns `superseded`, `publishImmutableProof` refuses with `EEXIST`), Old writer writes `result.superseded.json` and throws typed `run-control-superseded`.
  - Authoritative `result.json` remains byte-for-byte Newer Controller's output, completely untouched and uncorrupted.

---

---

## 7. Test Verification Accounting Summary

To ensure exact consistency and clarity across all review and doer records:

- **Full Doer Verification Matrix**: **11 suites, 317 tests passing, 0 failing**.
  - `test/runner/run-result-v2.test.mjs` (13 tests)
  - `test/runner/assignment-runresult.test.mjs` (31 tests)
  - `test/runner/assignment-dispatch.test.mjs` (75 tests, including two-OS-process reconciliation barrier race test)
  - `test/runner/coordination-session-engine.test.mjs` (23 tests)
  - `test/runner/coordination-research-fan-out.test.mjs` (12 tests)
  - `test/runner/coordination-recovery-and-quorum.test.mjs` (46 tests)
  - `test/runner/coordination-replay.test.mjs` (29 tests)
  - `test/runner/coordination-legacy-schema-compatibility.test.mjs` (3 tests)
  - `test/runner/coordination-stale-action-proof.test.mjs` (22 tests — note: resolved count discrepancy from 21)
  - `test/runner/coordination-phase2-concurrency.test.mjs` (16 tests)
  - `test/runner/coordination-aggregation.test.mjs` (47 tests)
- **Smoke Suite**: `node --test test/runner/assignment-dispatch.test.mjs` (**75 tests passing, 0 failing**).
- **Focused Fix Rechecks**:
  - 6 R5 concurrency, settlement authority & reconciliation barrier tests in `assignment-dispatch.test.mjs` (100% pass).
  - 76 run-lock tests in `test/runner/main-checkout-lock.test.mjs` (100% pass).
  - 20 CLI spawn reconciliation tests in `test/runner/cli-spawn-reconciliation.test.mjs` (100% pass).
  - 23 coordination session tests in `coordination-session-engine.test.mjs` / `coordination-session-cli.test.mjs` (100% pass).

---

## 8. Resolution of Review Finding F-01 (Alternate Writers & Linearizable CAS)

- **Finding F-01 (BLOCKER)**:
  `commitRunSettlement()` was hardened with `settleRunControl()` + `publishImmutableProof()`, but alternate production `result.json` writers bypassed that boundary:
  1. Provider-capacity refusal path used `publishMutableProjection(result.json)` then `markRunSettled()`.
  2. CLI-spawn reconciliation path (`settleReceiptRunFromOutcome` and `settleFailedRunFromOutcome`) checked `isRunControlCurrent()` outside the write boundary then used `publishMutableProjection(result.json)`.
- **Resolution & Architecture**:
  1. **Provider-Capacity Refusal**:
     - Runs before main `acquireRunControl`. Now acquires an ephemeral control token (`purpose: 'provider-capacity-refusal'`) and commits through `commitRunSettlement({ runDir, runId, controlEpoch, controlToken, runResult })`.
     - The resulting `settled` generation record fences any future controller, closing the TOCTOU bypass.
  2. **Reconciliation Settlement Paths**:
     - `settleReceiptRunFromOutcome` and `settleFailedRunFromOutcome` now route authoritative `result.json` publication strictly through `commitRunSettlement()`.
     - Stale writers are atomically detected at the CAS boundary, write diagnostic `result.superseded.json`, and are refused with `run-control-superseded`. Authoritative `result.json` is never overwritten.
     - `reconcileCliSpawnRun` includes a ledger bootstrap if called with an explicit token on an empty ledger (e.g., direct-reconciler call sites), ensuring `settleRunControl` has a valid generation record to validate.
  3. **Deterministic Concurrency Proof**:
     - Added `reconcileCliSpawnRun: two-OS-process TOCTOU barrier race proves stale reconciler cannot overwrite authoritative result.json (R5 / F-01 settlement authority)` in `test/runner/assignment-dispatch.test.mjs`.
     - Verifies Old Reconciler passes pre-check, pauses before publication, Newer Controller settles epoch 2, Old Reconciler resumes and is strictly refused with `run-control-superseded` while authoritative `result.json` remains untouched.

---

## 9. Next Eligible Units & Integration Disposition

- **Candidate Branch**: `coordination-integration-i02-result-truth`
- **Candidate Branch Tip**: `46e09c30`
- **Code Fix SHA**: `f835c215` (alternate-writer CAS settlement & reconciliation barrier race proof)
- **Candidate Commit Lineage**:
  - `0c17bd62` (initial I02/I03 reconciliation and R5 implementation)
  - `2681b389` (settlement authority TOCTOU fix for commitRunSettlement)
  - `f835c215` (code fix resolving F-01 alternate writers and TOCTOU barrier race)
  - `46e09c30` (cross-plan status synchronization for F-02)
- **Final Local Main**: `2b8f7aeb` (clean integration of candidate branch tip `46e09c30`)
- **Local Main Integration Lineage**:
  - `73845314` (initial merge of `0c17bd62`)
  - `dca4efd5` (merge of `2681b389`)
  - `72894c98` (merge of code fix `f835c215`)
  - `2b8f7aeb` (merge of candidate branch tip `46e09c30`)
- **Origin/Main Status**: `origin/main` is at `ad8dbaf0` (**not pushed**; local main is ahead of origin by 6 commits; gate requires independent re-review approval before push).
- **Verification Matrix**: **11 suites, 317 tests pass / 0 fail** (focused matrix: 220 9-suite + 22 stale-action + 75 assignment-dispatch); 76 pass in run-lock; 20 pass in cli-spawn reconciliation.
- **Next Eligible Units**: Unit **I04** (Phase 3 operation prompt-template registry and resolver), **I06** (dispatch-hardening Phase 05 remainder), and **I07** (dispatch-hardening Phase 08). All prerequisites for DAG forward-port (I09) grounded in verified result truth.
