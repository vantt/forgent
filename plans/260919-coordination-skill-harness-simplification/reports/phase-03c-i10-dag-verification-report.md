# Implementation & Verification Report: Unit I10 — DAG Migration, Cold Resume, Concurrency, and Corrupt Evidence

- **Track**: `plans/260919-coordination-skill-harness-simplification/plan.md` (Unit I10 / Phase 3C)
- **Parent Plan**: `plans/260917-cold-resumable-coordination-dag/plan.md` (Phases P00–P07)
- **Date**: 2026-09-24
- **Branch**: `coordination-skill-harness-i10-dag-verification`
- **Worktree**: `/home/vantt/projects/forgentX/.claude/worktrees/coordination-skill-harness-i10-dag-verification`
- **Implementation Base Commit**: `c386e9f30b1ac60d78675f688e8d10146f5e8949` (`origin/main`, clean rebase, descendant containing `1ca4023c` and `60132825`)
- **Production Fix Commit SHA**: `3c49cf4205060fea998abfb2e9ef5df7b816a252` (`fix(coordination): require valid on-disk RunResult evidence for DAG node settlement and descendant admission`)
- **Candidate Test Commit SHA**: `97420638c7c0360823b64a4a4b74d05eeee8723d` (`test(coordination): verify DAG migration, cold resume, concurrency, and corrupt evidence`)
- **Evaluated Candidate SHA**: `27ffb3767f1bec58f48ef611fb8a6353f8cdb76a` (`docs(coordination): record DAG verification and production fix evidence accounting`, approved in independent review: 0 blocker, 0 high)
- **Synchronized Candidate SHA**: `d1b52e44f65e013fda61c4a0376d7bd2b6a6ed72` (`merge: synchronize origin/main into coordination-skill-harness-i10-dag-verification`)
- **Integration SHA**: (pending merge into main)
- **I09 Integrated Commit SHA**: `1ca4023c98c2f449cb58cba481e82cab49ba51ba`
- **I09-REV-15 Fix SHA**: `601328256e4e8f26fbf4b44aaaefab23e6821162`
- **Status**: `approved candidate synchronized, pending integration`
- **Capability**: `code:test`
- **Next Dependency Gate**: `I11` remains BLOCKED pending I08 and I10 integration approval

---

## 1. Executive Summary & Review Findings Resolution (R1–R7, S1–S3, G1–G6, H1–H4)

Unit **I10** delivers exhaustive verification, adversarial migration testing, cold resume equivalence proofs, concurrency and OS-process race validation, corrupt evidence fail-closed checks, and dedicated verification probes for existing deferred findings (I09-REV-12, I09-REV-13, REV-05 policy, and resolveNodeCwd consistency) for the integrated Cold-Resumable Read-Only Coordination DAG (I09).

This unit strictly preserves all platform operating laws, platform foundations (L1–L8), and architecture invariants:
- Immutable DAG declaration, deterministic fingerprinting, and stable node identities;
- Atomic declaration-before-materialization;
- Derived DAG state only — zero new task lifecycles, databases, or store engines;
- Execution strictly follows `Assignment -> DispatchPlan -> Run -> RunResult`;
- I02 RunResult v2 truth, non-authoritative superseded evidence preservation, and settlement CAS;
- I04 template/effective-contract provenance;
- I06 PlacementPolicy and redirect governance;
- Fail-closed behavior for corrupt evidence, missing sessions/definitions/snapshots, and version mismatches;
- **Track Manager Authorized Production Fix**: Per user/Track Manager instruction ("fix đi nghiêm túc vào"), production defect F1 was fixed directly in `src/verbs/coordination/dag-scheduler.mjs`, `run.mjs`, `show.mjs`, and `src/runner/coordination/session-engine.mjs` (commit `3c49cf4205060fea998abfb2e9ef5df7b816a252`) to fail closed when on-disk RunResult is missing or corrupt.

Following Track Manager review rounds (vòng 1 through vòng 6), this revision addresses all findings and directives:

1. **S1 / R1 (BLOCKER) Baseline Defect F1 Resolved & Stop Condition Cleared**:
   - Production defect F1 resolved: `showCoordinationUseCase` (`src/verbs/coordination/show.mjs`) verifies that an assignment in `settledAssignmentIds` has valid on-disk `RunResult` evidence before projecting the node as `settled` and before considering dependency edges satisfied.
   - `runCoordinationUseCase` (`src/verbs/coordination/run.mjs`) checks on-disk `RunResult` validity for resumed assignments; if evidence is missing or corrupt, it refuses the node and propagates `blocked` to all descendant steps via `scheduleDagSteps` (`src/verbs/coordination/dag-scheduler.mjs`).
   - The probe in `test/runner/coordination-dag-corrupt-evidence.test.mjs` was un-todo'd and now executes live, asserting `produceNode.settled === false` and `reviewStepResult.schedulerOutcome === 'blocked'`, passing cleanly.
   - The stop condition of Unit I10 ("corrupt evidence settles a node") is **RESOLVED** and no longer triggered.
2. **S2 (HIGH) Real Driver Midway Termination via SIGKILL (B7)**:
   - In `coordination-dag-cold-resume.test.mjs`, B7 was updated to execute a real driver subprocess running `runCoordinationUseCase` while the executor is in-flight and blocked on a gate file (after `assignment-created`, before `result-linked`).
   - The test sends `SIGKILL` directly to the active driver process.
   - Immediately post-crash, the test asserts that the in-flight node is NOT considered settled (`produceNode.settled === false`, `reviewNode.settled === false`), and that only 1 assignment was created.
   - Following release of the gate and linking the result, an external clean Node subprocess performs a cold resume via `runCoordinationUseCase`.
   - The cold resume asserts: zero duplicate assignments across the session lifecycle, produce recognized as resumed, and the frontier cleanly advances to dispatch and settle review (`review.settled === true`).
3. **S3 / R3 (HIGH/LOW) Concurrency, Timing & Active Dispatch Conflict (C1 & C7)**:
   - **C1**: Barrier timeout restored to 4000ms, adhering to REV-15 generous timing margins to prevent flakes under heavy load.
   - **C6**: Replaced sequential subprocess calls with real concurrent OS subprocesses (`spawn` + `Promise.all([runChild(), runChild()])`) on an opened session, validating real cross-process locking, serialization, and idempotent evidence reuse.
   - **C7**: Updated C7 so Writer A is actively dispatching (`Atomics.wait(..., 150)`) when conflicting Writer B concurrently attempts mutation; Writer B fails with exit code 42 (`CoordinationError('conflict')`) and zero event leakage while Writer A completes cleanly with 100% of steps settled.
   - **Report terminology**: Removed any overclaim regarding `c386e9f3` being the "Last Independently Verified Baseline".
4. **R4 (MEDIUM) Plan Labels Stripped & Clean Git History**:
   - Stripped all plan labels (`F1`, `I09-REV-12`, `I09-REV-13`, `REV-05`, `I11`, `store.mjs:1508-1523`, `Area A-E`, `Unit I10`) from all test titles, descriptions, todo strings, and comments.
   - Test files follow permanent standard names: `test/runner/coordination-dag-*.test.mjs`.
   - Branch history maintained as clean conventional commits.
5. **R5 (MEDIUM) Target Contracts Asserted via `{ todo: ... }`**:
   - Converted tests for known defects to `{ todo: ... }` asserting the TRUE contract:
     - `corrupt-evidence.test.mjs`: asserts `produceNode.settled === false` and door `run` blocks descendant dispatch.
     - `deferred-probes.test.mjs` (REV-12): asserts `produceRun.schedulerOutcome !== 'deferred'`.
     - `deferred-probes.test.mjs` (REV-13): asserts `recordDriverDisposition('accepted')` throws on caveated findings.
     - `deferred-probes.test.mjs` (store-scan): exercises production door `recordDriverDisposition('cell-closed')` with two nodes having distinct cwds, asserting disposition succeeds without false-positive shared-cwd caveats.
6. **Round 5 Findings Resolution (G1–G6)**:
   - **G1 (HIGH)**: Real SHA recorded accurately across all plans; ancestry direction corrected: base `c386e9f3` is a descendant containing `1ca4023c` and `60132825`.
   - **G2 (HIGH)**: Status set to `ready for independent review, not integrated` across all 3 plans and report (never self-declared `VERIFIED`).
   - **G3 (CLARIFICATION)**: Production fix confirmed authorized by user directive "fix đi nghiêm túc vào".
   - **G4 (MEDIUM)**: `show` projection surfaces corrupt evidence explicitly (`refusedReason: 'corrupt-evidence'`, `schedulerOutcome: 'refused'`) instead of masking it under `materialized`. Unification of `replaySession().dag.nodes[].settled` with on-disk evidence verification is explicitly deferred to Unit I11.
   - **G5 (MEDIUM)**: Eliminated duplicated reader logic by exporting and reusing canonical `readLinkedRunResultFromDisk` (`session-engine.mjs:302`) in `run.mjs` and `show.mjs`.
   - **G6 (LOW)**: `CHANGELOG.md` entry added under `## [Unreleased]` and proposal `docs/architect/agent-coordination/proposals/dag-request-scheduler.md` updated with RunResult evidence requirement.
7. **Round 6 Findings Resolution (H1–H4)**:
   - **H1 (HIGH) Resolved**: In `src/verbs/coordination/show.mjs`, `hasCorruptEvidence` only flags an assignment if it is present in `settledAssignmentIds` (settled in event log) and lacks valid on-disk evidence (`!isAssignmentSettledWithEvidence(a.assignmentId)`). Retried nodes (`recordRunRetry`) that are awaiting retry carry valid evidence from their attempt and are not settled, so they remain `materialized` (not `refused` or `corrupt-evidence`). Tested and verified in `coordination-dag-cold-resume.test.mjs` (test B6) and `coordination-dag-corrupt-evidence.test.mjs` (test 3).
   - **H2 (HIGH) Resolved**: Reverted non-object throw in `readLinkedRunResultFromDisk` (`src/runner/coordination/session-engine.mjs`) to preserve the I02 RunResult contract for non-DAG callers. When `result.json` is `null`, `[]`, or a primitive, `interpretRunResult` deterministically maps it to `status: 'no-evidence'`, `confidence: 'failed'`, and `contractCorrupt: true`. Quorum, fan-in, recovery, and close callers fail closed by reading those flags without throwing `corrupt-log`. Tested and verified in `coordination-dag-corrupt-evidence.test.mjs` (test 9: non-DAG quorum evaluation succeeds without throw and classifies branch as failed).
   - **H3 (CONFIRMED)**: Production fix confirmed authorized by user/Track Manager instructions ("fix đi nghiêm túc vào").
   - **H4 (ACCOUNTING & SCOPE)**: Track Manager ghi nhận dời việc thống nhất `replaySession().dag.settled` sang I11. Note that pre-existing 3500ms wall-clock threshold in `test/runner/coordination-research-fan-out.test.mjs:495` can flake under high system load; this pre-existing debt is not touched in I10.

---

## 2. Invariants & Proof Areas Covered

### Area A: Migration / Version Matrix
- **File**: `test/runner/coordination-dag-migration-matrix.test.mjs` (10 tests)
- **Covered Invariants**:
  - Old binary reading/appending to old legacy sessions (Schema 1 and Schema 2) preserves sequential non-DAG behavior.
  - New reader reads supported legacy sessions without rewriting historical manifests, events, or snapshots (`dag.kind === 'legacy-non-dag'`).
  - New binary reading legacy sessions refuses conversion to DAG mode on resume and rejects hand-appended `dag-declared` events outside Schema 3.
  - Old binary reading a new Schema 3 DAG session fails loudly with `schema-version-mismatch` / `unsupported-newer-schema`.
  - Old binary attempting to append (`createSessionAssignment`, `bindActor`, `linkResult`, `transitionSessionStatus`) into a Schema 3 DAG session is rejected and leaves `events.jsonl` byte-identical.
  - Mixed-worktree/mixed-version append attempts from a legacy checkout into an active Schema 3 DAG session are rejected before events lock writes.
  - Unsupported or newer schemas (`schemaVersion: "4"` or unknown) fail closed.
  - Real sequential append and interop on legacy Schema 1 and Schema 2 sessions without DAG conversion.
  - Missing session throws `CoordinationError('not-found')`; missing definition throws `FlowDefinitionError('not-found')`; missing/corrupt snapshot throws `CoordinationError('corrupt-log')`.
  - Corrupt manifest, truncated event log, and tampered declaration fingerprint fail closed.

### Area B: Cold Resume and Equivalence
- **File**: `test/runner/coordination-dag-cold-resume.test.mjs` (9 tests)
- **Covered Invariants**:
  - Identical request resumes the existing immutable DAG declaration with stable fingerprint and node identities.
  - Stable DAG fingerprint across semantic key ordering and property sorting.
  - Semantically changed request (drifted objective, dependsOn, targetActorId, steps) refuses before session mutation with zero event log leakage.
  - Driver identity drift (alien writer attempting to resume) and snapshot tampering refuse pre-mutation.
  - Already settled nodes are not redispatched on resume.
  - In-flight/unlinked or retried nodes do not falsely settle descendants.
  - Driver process termination midway (SIGKILL while executor is in-flight at gate) recovers cleanly on resume in external clean Node subprocess without duplicate assignments, and advances the DAG frontier to completion.
  - Session cancellation blocks unadmitted successors (`blockedBy: ['terminal-session']`) while preserving valid in-flight peer evidence.
  - Fail-closed integrity detection halts processing and appends zero events.

### Area C: Concurrency and Scheduler Determinism
- **File**: `test/runner/coordination-dag-concurrency.test.mjs` (9 tests)
- **Covered Invariants**:
  - Independent read-only nodes overlap during dispatch; overlap groups (`dag-overlap-N`) are recorded. Barrier timeout 4000ms.
  - Dependency edges prevent premature dispatch of successors.
  - Diamond fan-in waits for all authoritative predecessors before admitting the join step.
  - Concurrency cap (`concurrency-cap` error) is the only deferrable admission refusal; capacity exhaustion defers without failing the session, and retries dynamically upon predecessor settlement.
  - Bounds exhaustion (`maxAssignments`, `maxRounds`, `wallTimeMs`, `maxTaskDepth`) and invalid requests (mutation/fan-out in DAG) are rejected with typed refusals, never mislabeled as concurrency deferrals.
  - Concurrent writers serialize under events lock in-process (`Promise.all`) and cross-process (real OS subprocesses via `spawn` + `Promise.all`) without duplicate assignments; idempotent requests reuse evidence safely.
  - Conflicting concurrent writers fail during active writer dispatch before duplicate mutation or external dispatch; zero events leak into `events.jsonl`.
  - Actor replacement and retry preserve scheduler integrity without double-dispatch.
  - External in-flight work is tracked, triggers `concurrency-cap` deferral, and unblocks upon settling the external task.

### Area D: Corrupt / Missing Evidence
- **File**: `test/runner/coordination-dag-corrupt-evidence.test.mjs` (9 tests)
- **Covered Invariants**:
  - Corrupt RunResult (`result.json` malformed/truncated) fails closed (`corrupt-log`) and cannot settle a node.
  - Malformed or missing result links fail closed and cannot unblock descendants.
  - Superseded/retried results (`run-retried` intervening) lose authoritative status and cannot unblock successors; linking a new run with real RunResult on disk restores settlement; retried nodes remain `materialized` under `show` projection.
  - Corrupt declaration, fingerprint, or definition snapshot fails closed on replay.
  - Scheduler errors throw or report typed refusals through `scheduleDagSteps` and `runCoordinationUseCase` door; never silently return "no work".
  - Corrupt or caveated evidence cannot satisfy quorum (`evaluateSessionQuorum`), explicit close (`closeCoordinationUseCase`), or cell-closed disposition.
  - Status separation is preserved across `sessionStatus`, `sessionPhase`, `schedulerOutcome`, and `runResultStatus` in `run` and `show` projections.
  - Negative probe for defect F1 un-todo'd and passes live: missing or corrupt RunResult on disk fails closed, sets `settled: false`, and blocks descendant admission.
  - Non-DAG session with non-object result.json evaluates quorum without throwing and classifies branch as failed via interpretRunResult fail-closed flags (`status: 'no-evidence'`, `confidence: 'failed'`, `contractCorrupt: true`).

### Area E: Existing Deferred Findings Probes
- **File**: `test/runner/coordination-dag-deferred-probes.test.mjs` (4 tests)
- **Probes Executed & Results**:
  1. **Outcome Taxonomy (I09-REV-12, OPEN, queued for I11)**:
     - Marked `{ todo: ... }`. In `run.mjs` (lines 744 & 754), `resumedDagStates` sets `outcome: 'deferred'` for unlinked or retried assignments on resume, even though `deferred` is conceptually reserved for `concurrency-cap`. Test asserts `produceRun.schedulerOutcome !== 'deferred'`.
  2. **Driver Disposition on Caveated Findings (I09-REV-13, OPEN, queued for I11)**:
     - Marked `{ todo: ... }`. In `store.mjs` (line 1500), only `disposition === 'cell-closed'` throws on shared-cwd caveats; `accepted` disposition succeeds. Test asserts `recordDriverDisposition('accepted')` should fail closed.
  3. **Cancellation and Separate-Session Recheck Policy**:
     - Passes cleanly. Verifies that a caveated session cannot close, is cancelled via `cancelSession`, and recheck runs in an isolated separate session without caveats to satisfy closure.
  4. **CWD Attribution Scan Defect (store-scan, OPEN)**:
     - Marked `{ todo: ... }`. Exercises production door `recordDriverDisposition('cell-closed')` with two nodes having distinct cwds. In baseline, `store.mjs:1508-1523` scans `manifest.assignmentRefs` without `dagNodeId` filtering, causing cross-node cwd attribution and false positive shared-cwd caveats. Test asserts cell-closed disposition succeeds when cwds are distinct.

---

## 3. Test Execution & Evidence Summary

### 3.1 Unit I10 Test Suites (41 tests: 38 passed, 3 todo, 0 failed)
1. `test/runner/coordination-dag-migration-matrix.test.mjs` (10 tests: 10 passed, 0 failed)
2. `test/runner/coordination-dag-cold-resume.test.mjs` (9 tests: 9 passed, 0 failed)
3. `test/runner/coordination-dag-concurrency.test.mjs` (9 tests: 9 passed, 0 failed)
4. `test/runner/coordination-dag-corrupt-evidence.test.mjs` (9 tests: 9 passed, 0 todo, 0 failed)
5. `test/runner/coordination-dag-deferred-probes.test.mjs` (4 tests: 1 passed, 3 todo, 0 failed)

Total Unit I10 Verification: **38 passed / 3 todo / 0 failed / 0 skipped** (duration: ~6.0s).

### 3.2 Baseline Focused Matrix (538 tests, 100% pass)
All 14 targeted baseline suites executed together:
1. `test/skills/coordination-dag-driver-skill-contract.test.mjs` (3 passed)
2. `test/runner/coordination-schema.test.mjs` (51 passed)
3. `test/runner/coordination-replay.test.mjs` (35 passed)
4. `test/runner/coordination-store.test.mjs` (47 passed)
5. `test/runner/coordination-r5-hard-budgets.test.mjs` (43 passed)
6. `test/runner/coordination-headless-adapter-identity.test.mjs` (7 passed)
7. `test/runner/coordination-p07-migration-and-adversarial.test.mjs` (16 passed)
8. `test/verbs/coordination-chain.test.mjs` (16 passed)
9. `test/verbs/coordination-recovery.test.mjs` (20 passed)
10. `test/verbs/coordination-run-driver-steps.test.mjs` (86 passed)
11. `test/runner/coordination-session-engine.test.mjs`, `test/cli/coordination.test.mjs`, `test/runner/coordination-declared-vs-agent-led-equivalence.test.mjs` (73 passed)
12. `test/verbs/coordination-launch-master-loop.test.mjs` (16 passed)
13. `test/architecture.test.mjs` (13 passed)
14. `test/setup/checks.test.mjs` (112 passed)

Result: **538 passed / 0 failed / 0 skipped** (duration: ~74.9s).

### 3.3 Timing Recheck Matrix (3 runs x 129 tests)
3 consecutive runs of `coordination-r5-hard-budgets.test.mjs` (43 tests) + `coordination-run-driver-steps.test.mjs` (86 tests):
- Run 1: 129 passed / 0 failed (~60.7s)
- Run 2: 129 passed / 0 failed (~33.2s)
- Run 3: 129 passed / 0 failed (~31.7s)

Result: **129/129 passed across all 3 runs** (zero flakiness or timing regressions).

### 3.4 Clean Repository Check
- `git diff --check`: Clean (0 errors/warnings).
- Main checkout `/home/vantt/projects/forgentX`: Preserved intact (no modifications staged, committed, or deleted).

---

## 4. Git Commit Accounting & Callers Analysis

- **Base Commit**: `c386e9f30b1ac60d78675f688e8d10146f5e8949` (`origin/main`, clean rebase, descendant containing `1ca4023c` and `60132825`)
- **Production Fix Commit**: `3c49cf4205060fea998abfb2e9ef5df7b816a252` (`fix(coordination): require valid on-disk RunResult evidence for DAG node settlement and descendant admission`)
  - Implemented fail-closed RunResult validation on `showCoordinationUseCase` and `runCoordinationUseCase` when settling nodes or resuming DAG, and immediate blocked propagation in `dag-scheduler.mjs`.
  - Refined `showCoordinationUseCase` (`hasCorruptEvidence`) so retried predecessors awaiting retry remain `materialized` rather than falsely flagged as corrupt evidence.
  - Reverted non-object guard in `readLinkedRunResultFromDisk` (`session-engine.mjs:302`), preserving I02 `interpretRunResult` fail-closed mapping (`status: 'no-evidence'`, `confidence: 'failed'`, `contractCorrupt: true`) for quorum, fan-in, recovery, and close callers.
  - Exported canonical `readLinkedRunResultFromDisk` (`session-engine.mjs:302`) and reused it in `run.mjs` and `show.mjs`.
  - Updated `show` projection to surface corrupt evidence explicitly with `refusedReason: 'corrupt-evidence'` and `schedulerOutcome: 'refused'`.
  - Added entry under `## [Unreleased]` in `CHANGELOG.md` and updated `docs/architect/agent-coordination/proposals/dag-request-scheduler.md`.
- **Candidate Test Commit**: `97420638c7c0360823b64a4a4b74d05eeee8723d` (`test(coordination): verify DAG migration, cold resume, concurrency, and corrupt evidence`)
  - Contains all 5 test suites (41 tests total: 38 passed, 3 todo, 0 failed) adhering to permanent standard file names and free of plan-specific labels.
- **Evaluated Candidate SHA**: `27ffb3767f1bec58f48ef611fb8a6353f8cdb76a` (`docs(coordination): record DAG verification and production fix evidence accounting`, approved in independent review: 0 blocker, 0 high)
- **Synchronized Candidate SHA**: `d1b52e44f65e013fda61c4a0376d7bd2b6a6ed72` (`merge: synchronize origin/main into coordination-skill-harness-i10-dag-verification`)
- **Integration SHA**: (pending merge into main)

### Callers Analysis
- `readLinkedRunResultFromDisk` callers in source tree:
  - `src/runner/coordination/session-engine.mjs`: `createAndExecuteSessionTask` (line 477), context getters for binding outcomes (lines 1446, 1453, 1461, 1471, 1481, 1507), `resolveGatingActorOutcome` (line 3224), `classifySessionQuorum` (line 3372), `fanInBranches` (line 3815), `reconcileSessionRecovery` (line 3913), `validateSessionAggregation` (line 4164).
  - `src/verbs/coordination/run.mjs`: `executeDagPlan` (line 735).
  - `src/verbs/coordination/show.mjs`: `isAssignmentSettledWithEvidence` (line 181).
- `showCoordinationUseCase` callers in source tree:
  - `src/verbs/coordination/chain.mjs`: lines 117, 182.
  - `src/runner/coordination/headless-adapter.mjs`: lines 31 (re-export), 78 (`showCoordinationHeadless`).
  - CLI door: `bin/fgos.mjs` / `fgos coordination show`.

---

## 5. Next Steps

Unit I10 verification and production fix are complete and verified. Production defect F1 is resolved via fail-closed evidence validation, clearing the Unit I10 stop condition. Test 8 in `test/runner/coordination-dag-corrupt-evidence.test.mjs` passes live. All 41 DAG tests (38 passed, 3 todo, 0 failed), the 16-suite baseline matrix (538/538 pass), and 3x timing rechecks (129/129 pass) are 100% green.

Unit I10 is **ready for independent review, not integrated** and submitted for independent review. Unit **I11** remains blocked pending I08 and I10 integration approval.
