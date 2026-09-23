# Implementation Report: Unit I09 — Cold-Resumable Read-Only Coordination DAG Forward-Port

- **Track**: `plans/260919-coordination-skill-harness-simplification/plan.md` (Unit I09 / Phase 3B)
- **Parent Plan**: `plans/260917-cold-resumable-coordination-dag/plan.md` (Phases P00–P07)
- **Date**: 2026-09-23
- **Branch**: `coordination-skill-harness-i09-dag-forward-port`
- **Worktree**: `/home/vantt/projects/forgentX/.claude/worktrees/coordination-skill-harness-i09-dag-forward-port`
- **Base Commit**: `16a7900d9eacf1c1dfa6d0c77ff489c21080305e`
- **Integration Baseline**: `main@cc687d92b94c6652f1cb738b74d1cfa0c72571d2`
- **Evaluated Candidate SHA**: `a208bf555927b508ddfa0523009ce87aac1dd0af` (Approved by independent review; 0 blocker, 0 high)
- **Synchronization Merge Commit**: `c624fe583fe089cb177c44df315dc451ba1d8e1f`
- **Porting Evidence Tip**: `fc25949821fcc8f2894f8b05d0e25d87afbd6949`
- **Status**: `implemented` (synchronized with main@cc687d92; NOT integrated into main; I10 blocked)
- **Capability**: `code:implement`
- **Next Dependency Gate**: `I10` remains BLOCKED until synchronized tip is reviewed, integrated into main, and post-merge verification passes.

---

## 1. Executive Summary

Unit **I09** forward-ports the completed capability of the Cold-Resumable Read-Only Coordination DAG track (`plans/260917-cold-resumable-coordination-dag`) onto current `main` (`16a7900d9eacf1c1dfa6d0c77ff489c21080305e`).

This forward-port integrates cleanly with the post-Phase-2 unified runtime and preserves all integrated contracts from:
- **I02 / I03**: RunResult v2 truth, atomic CAS settlement, fail-closed verification (`main@4362bfec`).
- **I04**: Operation prompt-template registry, resolver, and execution provenance (`main@7472bd74`).
- **I06**: Dispatch governance, cross-provider redirect contract, and active PlacementPolicy binding (`main@3bab9b99`).

All historical porting evidence from commit `fc259498` has been reconciled against current contracts without copying stale compatibility shims, bypassing kernel authority, or altering legacy session semantics.

---

## 2. Invariants & Implementation Details

### 2.1 Immutable DAG Declaration & Fingerprint (`src/runner/coordination/dag-declaration.mjs`)
- **Normalization & Invariants**:
  - Implements `normalizeDagDeclaration(declaration)`: validates node identifiers, unique display labels, dependency existence, and acyclicity (via cycle detection).
  - Normalizes semantics with key sorting to ensure deterministic cryptographic fingerprints (`sha256`) regardless of JSON key ordering.
  - Generates immutable node identities (`dagNodeId`) and validates declaration schema version `DAG_DECLARATION_VERSION = '1'`.
- **Manifest Registration**: Registered as `infra` in `docs/architecture-manifest.json`.

### 2.2 Pure Request Compilation & Dependency Extraction (`src/verbs/coordination/dag-request-compiler.mjs`)
- **Pure Validation**:
  - Validates request steps before any session mutation or event appending.
  - Extracts explicit `dependsOn` declarations and implicit `$ref:` dependencies across `brief`, `parameters`, `authorization`, and bindings.
  - Enforces read-only individual operation constraints: rejects mutating actions (`action: "mutate"` or state modifications), fan-out steps, and unrecognized node references.
- **Manifest Registration**: Registered as `use-case` in `docs/architecture-manifest.json`.

### 2.3 Dynamic Ready-Frontier Scheduler (`src/verbs/coordination/dag-scheduler.mjs`)
- **Dynamic Scheduling**:
  - Replaces rigid wave-based execution with dynamic ready-frontier scheduling: upon every step completion (`Promise.race`), recalculates the ready frontier and immediately admits newly-unblocked nodes.
  - Enforces concurrency caps: defers nodes blocked by concurrency limits (`deferred` outcome) without aborting or failing the session.
  - Fail-Closed Integrity: captures integrity errors, corrupt definitions, and storage errors, waiting for active in-flight promises to settle before throwing fail-closed.
  - Dispatches exclusively through existing execution channels (`run.mjs` step interpreter reaching `Assignment -> DispatchPlan -> Run -> RunResult`).
- **Manifest Registration**: Registered as `use-case` in `docs/architecture-manifest.json`.

### 2.4 Schema, Storage, and Replay Reconciliation
- **Schema (`src/runner/coordination/schema.mjs`)**:
  - Added `dag-declared` event type in `SCHEMA_VERSION_3`.
  - Added `dagNodeId` attribute on assignment events.
  - Preserved `unsupported-newer-schema` error code.
- **Store (`src/runner/coordination/store.mjs`)**:
  - Atomically writes `dag-declared` event during `openSession` when a DAG declaration is present.
  - Stores `dagNodeId` on assignment records and preserves assignment lifecycle invariants.
  - Preserved `concurrency-cap` validation code.
- **Replay (`src/runner/coordination/replay.mjs`)**:
  - Replays `dag-declared` events into `replayed.dag` projection with derived node statuses (`pending`, `materialized`, `settled`, `refused`, `blocked`). An assignment is only considered settled if its `result-linked` event is authoritative (not superseded by a subsequent `run-retried` event).
  - Detects dangling DAG references and rejects corrupt declarations.
  - Differentiates between DAG and non-DAG Schema 3 sessions cleanly: a session is classified as `dag` iff `manifest.schemaVersion === SCHEMA_VERSION_3 && Boolean(dagDeclaration)`. Schema 3 sessions without DAG declarations (such as Phase 2 snapshot sessions) remain `legacy-non-dag`.

### 2.5 Verb Wiring & Projections
- **`run.mjs`**:
  - Compiles DAG requests and drives execution through `scheduleDagSteps`.
  - Enforces strict request equivalence on resume: checks `resumed.dag?.kind === 'dag'`, validates fingerprint equivalence, and prevents converting legacy sessions to DAG mode or vice versa.
  - Propagates corrupt manifest errors cleanly via `CoordinationError('not-found')`.
- **`show.mjs`**:
  - Derives and projects `sessionStatus`, `sessionPhase`, `schemaMode`, and `dag` execution summary.
  - Implements shared-cwd concurrency attribution caveats (`non-attributable-verdict`) for concurrent read-only nodes.
  - Fail-closed on corrupt RunResult logs.
- **`chain.mjs`**:
  - Exposes DAG action hints, `schemaMode` (`dag`, `legacy-non-dag`, `unsupported-newer-schema`), and cell status.
- **`headless-adapter.mjs`**:
  - Exports `showCoordinationHeadless` and `chainCoordinationHeadless` for clean programmatic consumers.
- **`recover.mjs`**:
  - Preserved `not-found` exit category and error handling.

---

## 3. Verification & Test Evidence

### 3.1 Targeted DAG & Coordination Matrix
All focused unit and integration test suites pass with 0 failures (538 total tests):
1. `test/skills/coordination-dag-driver-skill-contract.test.mjs` (3 pass / 0 fail)
2. `test/runner/coordination-schema.test.mjs` (51 pass / 0 fail)
3. `test/runner/coordination-replay.test.mjs` (35 pass / 0 fail)
4. `test/runner/coordination-store.test.mjs` (47 pass / 0 fail)
5. `test/runner/coordination-r5-hard-budgets.test.mjs` (43 pass / 0 fail)
6. `test/runner/coordination-headless-adapter-identity.test.mjs` (7 pass / 0 fail)
7. `test/runner/coordination-p07-migration-and-adversarial.test.mjs` (16 pass / 0 fail)
8. `test/verbs/coordination-chain.test.mjs` (16 pass / 0 fail)
9. `test/verbs/coordination-recovery.test.mjs` (20 pass / 0 fail)
10. `test/verbs/coordination-run-driver-steps.test.mjs` (86 pass / 0 fail)
11. `test/runner/coordination-session-engine.test.mjs`, `test/cli/coordination.test.mjs`, `test/runner/coordination-declared-vs-agent-led-equivalence.test.mjs` (73 pass / 0 fail)
12. `test/verbs/coordination-launch-master-loop.test.mjs` (16 pass / 0 fail)
13. `test/architecture.test.mjs` (13 pass / 0 fail)
14. `test/setup/checks.test.mjs` (112 pass / 0 fail)

### 3.2 Documentation & Skill Projections
- Added example DAG request: `docs/how-to/coordination-examples/dag-read-only-request.json`.
- Updated `docs/how-to/run-a-coordination-session.md` and `CHANGELOG.md`.
- Updated skill doctrine in `core/skills/fgos-plan-loop/SKILL.md` and `domains/coding/skills/fgos-code-panel/SKILL.md`.
- Synchronized projected skill wrappers via `npm run build:skills`.

---

## 4. Review Findings Reconciliation & Resolution

All review findings from the independent review rounds (evaluated commits `d52093fb` and `3cc74b41`) have been resolved, verified, and locked:

### 4.1 I09-REV-01 (BLOCKER) — Authoritative Settlement & Superseded Link / Retry Invariant
- **Finding**: A node whose latest assignment was retried (`run-retried`) was prematurely marked settled because code checked for any linked result rather than an authoritative link.
- **Resolution**:
  - Implemented `getAuthoritativeSettledAssignmentIds(assignments)` to ensure an assignment is authoritative only when no subsequent `run-retried` event supersedes its `result-linked` event.
  - Aligned `replay.mjs`, `run.mjs` (`resumedDagStates`), and `show.mjs` to use this authoritative settlement check.
  - In `run.mjs` invocation and resume paths, if an assignment's link was superseded by retry, marked `authoritativeSettled = false`, `settled = false`, and `schedulerOutcome = 'deferred'`.
  - In `dag-scheduler.mjs`, verified `isSettled = settled.result?.authoritativeSettled !== false && settled.result?.settled !== false`. Only unblocks concurrency-deferred candidates, preventing premature dispatch of dependent successors (Probe R and Probe R2 resolved).
  - Added regression test `Phase 07: DAG resume with retried predecessor does not dispatch successor (REV-01 Probe R2)` in `test/runner/coordination-p07-migration-and-adversarial.test.mjs`.

### 4.2 I09-REV-02 (HIGH) — Standalone Schema-3 Legacy Replay Compatibility
- **Finding**: Standalone schema-3 sessions created on base threw a spurious `dangling-ref` error on replay.
- **Resolution**: Relaxed the eager guard in `replay.mjs`. A session is treated as DAG iff a `dag-declared` event is present; schema-3 sessions without DAG declarations (such as Phase 2 snapshot sessions) cleanly replay as `legacy-non-dag`. Verified with regression test in `coordination-replay.test.mjs`.

### 4.3 I09-REV-03 (HIGH) — Restored Schema 3 for Standalone / Agent-Led Sessions
- **Finding**: Standalone sessions were downgraded to schema version 1 in `run.mjs`.
- **Resolution**: Restored `SCHEMA_VERSION_3` in `openStandaloneSession` in `run.mjs`.

### 4.4 I09-REV-04 (HIGH) — Preserve Legacy Session Invariants on Resume
- **Finding**: Resuming a legacy session attached `dagNodeId` to newly created assignments, breaking backwards compatibility.
- **Resolution**: In `run.mjs`, restricted `dagNodeId` attachment strictly to sessions with active DAG declarations (`request.dag && Boolean(manifest.dagDeclaration)`).

### 4.5 I09-REV-05 (HIGH) — Fail-Closed Shared-CWD Concurrency Attribution Caveats
- **Finding**: Shared-cwd concurrency caveats (`non-attributable-verdict`) in `show.mjs` did not block session closure at the kernel / engine level.
- **Resolution**:
  - Implemented fail-closed enforcement across all close doors:
    1. In `src/verbs/coordination/close.mjs`: `checkDagCloseCaveats` evaluates active DAG shared-cwd caveats in both keyed (`executeUnderActionPrecondition`) and unkeyed close use cases, refusing closure with `closed = false` and `closeRefusalReason = 'recheck-required: concurrent read-only nodes sharing cwd carry non-attributable-verdict caveats'`.
    2. In `src/runner/coordination/session-engine.mjs`: `closeSessionByQuorumLocked` asserts absence of shared-cwd caveats, throwing `CoordinationError('refusal')` if unadjudicated caveats remain.
    3. In `src/runner/coordination/store.mjs`: `recordDriverDispositionLocked` asserts absence of shared-cwd caveats before recording `disposition = 'cell-closed'`, throwing `CoordinationError('validation')`.
  - Added regression tests verifying closure refusal and disposition rejection when shared-cwd caveats exist.
- **Policy Confirmation (Option a)**:
  - Confirmed by Track Manager: shared-cwd read-only DAG caveat cannot be discharged in the original session;
  - The original session must be cancelled;
  - Recheck must run in a separate session;
  - No adjudication event, lifecycle, or store added (candidate has no intra-session adjudication state/event; adding one would exceed I09 scope).

### 4.6 I09-REV-06 (MEDIUM) — Strict Task-Claim Collision Semantics
- **Finding**: The task claim collision guard in `store.mjs` diverged from base.
- **Resolution**: Restored exact verbatim check from base in `store.mjs`.

### 4.7 I09-REV-07 (LOW) — Clean State on Node Retry Settlement
- **Finding**: Nodes that settled after a transient error/retry retained stale error state in scheduler tracking.
- **Resolution**: In `dag-scheduler.mjs`, cleared `candidate.error` when a deferred/retried node successfully settles.

### 4.8 I09-REV-08 (LOW) — Changelog & Documentation Consistency
- **Finding**: Minor status notes and changelog wording needed synchronization.
- **Resolution**: Synchronized `CHANGELOG.md` and report notes.

### 4.9 I09-REV-09 (MEDIUM) — Session Phase & Caveat Projection in `run.mjs`
- **Finding**: `run.mjs` returned `status: 'recheck-required'` directly as session status rather than maintaining phase alignment.
- **Resolution**: Restored `status = phase;` and projected `caveated: hasDagCaveat` on the use case return object.

### 4.10 I09-REV-10 (LOW) — Tracking & Metric Precision
- **Finding**: Updated test metrics, evaluation commit references, and status details required in plan and reports.
- **Resolution**: Fully updated `plan.md` and this implementation report with 538 tests passing across 14 suites and exact evaluation history.

### 4.11 I09-REV-11 (LOW) — Module Purity for `dag-declaration.mjs`
- **Finding**: `src/runner/coordination/dag-declaration.mjs` had filesystem imports (`node:fs`, `node:path`) via `resolveNodeCwd`, violating pure declaration layer boundaries.
- **Resolution**: Cut `resolveNodeCwd` from `dag-declaration.mjs`, making it 100% pure and memory-only. Relocated `resolveNodeCwd` to `src/verbs/coordination/dag-scheduler.mjs` and updated callers in `run.mjs` and `show.mjs`.

### 4.12 I09-REV-12 (MEDIUM) — Nhãn deferred bị dùng sai nghĩa (Verbatim Independent Review Finding)
- **Finding**:
  - Node đang chờ retry và node có assignment nhưng chưa có link (probe crash thật, kill -9 driver) đều được gán deferred mà không kèm evidence giải thích.
  - Proposal §4 quy định deferred chỉ dành cho concurrency-cap.
  - Kết quả không sai (không có settle giả, và recover vẫn là cửa khôi phục đúng), nhưng các outcome đang bị trộn nghĩa.
  - Đề xuất: dùng một outcome riêng, ví dụ awaiting-settlement, kèm lý do pending-retry hoặc unlinked-in-flight.
- **Accounting**: Non-blocking for integration; queued for taxonomy refinement during Unit I10/I11.

### 4.13 I09-REV-13 (MEDIUM) — Vẫn ghi được disposition trên finding bị caveat (Verbatim Independent Review Finding)
- **Finding**:
  - recordDriverDisposition vẫn cho ghi accepted/rejected khi target là kết quả của một node bị caveat.
  - cell-closed và close đã bị chặn nên đây không phải lỗ hổng để đóng cell, nhưng kernel vẫn nhận một phán quyết dựa trên evidence không quy trách nhiệm được.
- **Accounting**: Non-blocking for integration; queued for tightened disposition validation during Unit I10/I11.

### 4.14 Independent Review LOW Findings (Verbatim)
- **Finding**:
  - Logic resolve cwd bị lặp ở ba chỗ: session-engine, store và dag-scheduler. Bản trong store còn quét mọi assignment của session thay vì chỉ assignment của node.
  - Handoff không ghi SHA mà chỉ ghi tên branch.
- **Accounting**: Non-blocking for integration; queued for cleanup during Unit I10/I11.

---

## 5. Disposition & Readiness

### 5.1 Artifact & Commit Distinctions
- **Implementation Base**: `16a7900d9eacf1c1dfa6d0c77ff489c21080305e`
- **Current Integration Baseline**: `main@cc687d92b94c6652f1cb738b74d1cfa0c72571d2`
- **Evaluated Candidate**: `a208bf555927b508ddfa0523009ce87aac1dd0af` (Evaluated & APPROVED by independent review: 0 blocker, 0 high).
- **Synchronization Merge Commit**: `c624fe583fe089cb177c44df315dc451ba1d8e1f` (Merges `main@cc687d92` into branch `coordination-skill-harness-i09-dag-forward-port`; CHANGELOG conflict resolved preserving all entries).
- **Synchronized Candidate Tip**: Committed tip on branch `coordination-skill-harness-i09-dag-forward-port`.
- **Integration Status**: **NOT integrated into main yet**.
- **Next Gate**: **Unit I10 remains BLOCKED** until the synchronized candidate tip is independently re-reviewed, integrated into main, and post-merge verification passes.

### 5.2 Verification Summary
- `git diff --check`: clean (exit 0).
- Focused 14-suite matrix: 538 passed / 0 failed.
- Full suite verification and GitNexus impact analysis run on the synchronized candidate tip.
