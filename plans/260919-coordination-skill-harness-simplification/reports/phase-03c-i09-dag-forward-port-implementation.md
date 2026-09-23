# Implementation Report: Unit I09 — Cold-Resumable Read-Only Coordination DAG Forward-Port

- **Track**: `plans/260919-coordination-skill-harness-simplification/plan.md` (Unit I09 / Phase 3B)
- **Parent Plan**: `plans/260917-cold-resumable-coordination-dag/plan.md` (Phases P00–P07)
- **Date**: 2026-09-23
- **Branch**: `coordination-skill-harness-i09-dag-forward-port`
- **Worktree**: `/home/vantt/projects/forgentX/.claude/worktrees/coordination-skill-harness-i09-dag-forward-port`
- **Base Commit**: `16a7900d9eacf1c1dfa6d0c77ff489c21080305e` (`main`)
- **Porting Evidence Tip**: `fc25949821fcc8f2894f8b05d0e25d87afbd6949`
- **Status**: `implemented` (pre-merge implementation complete; candidate ready for I10 test / I11 review)
- **Capability**: `code:implement`
- **Next Dependency Gate**: `I10` (test DAG migration, cold resume, concurrency, and corrupt evidence) -> `I11` (independent review)

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
All focused unit and integration test suites pass with 0 failures:
1. `test/skills/coordination-dag-driver-skill-contract.test.mjs` (3 pass / 0 fail)
2. `test/runner/coordination-schema.test.mjs` (51 pass / 0 fail)
3. `test/runner/coordination-replay.test.mjs` (33 pass / 0 fail)
4. `test/runner/coordination-store.test.mjs` (47 pass / 0 fail)
5. `test/runner/coordination-r5-hard-budgets.test.mjs` (43 pass / 0 fail)
6. `test/runner/coordination-headless-adapter-identity.test.mjs` (7 pass / 0 fail)
7. `test/runner/coordination-p07-migration-and-adversarial.test.mjs` (11 pass / 0 fail)
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

## 4. Disposition & Readiness

Unit **I09** implementation is complete, strictly isolated in worktree `coordination-skill-harness-i09-dag-forward-port`, and adheres to all platform operating laws and Git boundaries.

Ready to proceed to **Unit I10** (independent verification of DAG migration, cold resume, concurrency, and corrupt evidence).
