# Phase 2 Implementation & Contract Review Report: Semantic Coordination Surface

- **Date:** 2026-09-22
- **Track:** `plans/260919-coordination-skill-harness-simplification/`
- **Phase:** Phase 2 — Semantic Request Composers & Public Semantic CLI Surface
- **Worktree:** `/home/vantt/projects/forgentX/.claude/worktrees/coordination-skill-harness-phase-2`
- **Branch:** `coordination-skill-harness-phase-2` (branched from `main` at `d2a87c6e`)
- **Capability:** `code:review`
- **Verdict:** **APPROVE — Phase 2 Implementation Complete and Invariant-Preserved**

---

## 1. Executive Summary

Phase 2 of the coordination skill harness simplification track implements pure semantic request composers and the public semantic coordination CLI surface (`fgos coordination start`, `status`, `operation`, `authorize-and-dispatch`, `fan-out`, `contribution`, `human-turn`, `disposition`, `close`).

This phase eliminates the requirement for calling skills and operator sessions to hand-craft raw step JSON, construct manual SHA-256 target hashes, or manage multi-channel coordination protocol payloads, while strictly maintaining:
1. **Single Execution Seam:** All semantic use cases compose validated coordination requests and delegate directly through `executeUnderActionPrecondition` to the single existing kernel execution doors (`executeValidatedCoordinationStep` and `executeCoordinationCloseKernel`). No second mutation engine or bypass exists.
2. **Zero Secondary Storage:** No sidecars (such as `.action-keys.json`), cache files, or secondary stores. Same-id idempotency, payload conflict detection, and retry reconstruction are derived exclusively from the authoritative JSONL event log and session state under the session lock.
3. **Mandatory Driver Identity & Separation:** Driver identity is strictly required, rechecked under the session lock against `session.manifest.recordedBy`, and verified distinct from attributed actors (e.g., human-turn authors).
4. **Continuous Session Lock Ownership:** Precondition checks, target reconstruction, action key verification, and kernel step execution occur atomically within a single held `withSessionLock` critical section.
5. **Full Backward Compatibility:** `fgos coordination run --file`, `close --file`, `show`, `chain`, and `recover` remain fully operational and tested. All new CLI commands emit standard `fgos.v1` response envelopes.
6. **Non-Goals Preserved:** Phase 3 prompt template registry/resolvers remain untouched. Coordinator skills (`fgos-plan-loop`, `fgos-architecture-panel`, `fgos-code-panel`) and domain doctrines remain untouched. No coordination cells or group-thinking loops were employed.

---

## 2. Unit Implementation Breakdown

### Unit 2G0 — Implementation Gate Review & Preflight (`code:review`)
- **Objective:** Verify readiness of `main` checkout, inspect existing single execution seam (`F-R01`), and establish clean isolated worktree.
- **Result:** Created dedicated worktree at `/home/vantt/projects/forgentX/.claude/worktrees/coordination-skill-harness-phase-2` on branch `coordination-skill-harness-phase-2`. Verified baseline tests and architecture constraints prior to code changes.

### Unit 2A — Pure Request Composers (`code:implement`)
- **Objective:** Implement pure, descriptor-to-request composer functions with deterministic command/invocation ID derivation and strict prohibition against direct I/O or store mutation.
- **Implementation:** `src/verbs/coordination/composers.mjs`
  - `composeStartRequest`: Composes initial session request with deterministic ID generation (`coord_<hash>`).
  - `composeOperationRequest`: Composes `dispatch-operation` step with deterministic command ID and parameter isolation.
  - `composeAuthorizeAndDispatchOperationRequest`: Composes `authorize-operation` step.
  - `composeFanOutRequest`: Composes `fan-out-operations` step with normalized targets.
  - `composeContributionRequest`: Composes `link-contribution` step with operation and assignment binding.
  - `composeHumanTurnRequest`: Composes `record-human-turn` step with attributed identity and prompt context.
  - `composeDispositionRequest`: Composes `record-disposition` step with finding target and disposition status.
  - `composeCloseRequest`: Composes explicit `close` step with reason and summary.
  - All composers reject forbidden caller overrides (e.g., caller-supplied target or unvalidated fields).
- **Verification:** `test/runner/coordination-request-composers.test.mjs` (5/5 passing).

### Unit 2B — Start & Status Use Cases (`code:implement`)
- **Objective:** Implement the non-action `start` use case and read-only, effect-free `status` use case.
- **Implementation:**
  - `src/verbs/coordination/start.mjs`: Implements `startCoordinationUseCase`. Rechecks driver identity, initializes session via kernel, derives deterministic coordination ID if omitted, and handles same-payload retry idempotency.
  - `src/verbs/coordination/status.mjs`: Implements `statusCoordinationUseCase`. Reads replay state and definition snapshot, projects active action view (`projectCoordinationActions`), supports compact and detailed modes, and executes with zero side effects.
- **Verification:** `test/verbs/coordination-start-status.test.mjs` (3/3 passing).

### Unit 2C — Action-Backed Semantic Use Cases (`code:implement`)
- **Objective:** Wire all semantic action verbs through the lock-aware `executeUnderActionPrecondition` seam without introducing secondary state.
- **Implementation:**
  - `src/verbs/coordination/actions.mjs`: Exports semantic use cases:
    - `operationCoordinationUseCase`
    - `authorizeAndDispatchCoordinationUseCase`
    - `fanOutCoordinationUseCase`
    - `linkContributionCoordinationUseCase`
    - `recordHumanTurnCoordinationUseCase`
    - `recordDispositionCoordinationUseCase`
    - `closeCoordinationUseCase`
  - `src/runner/coordination/action-precondition.mjs`: Enhanced target reconstruction on retry:
    - Dynamically reconstructs action targets from session events (`provenance.inline.caller.coordination.actionInvocation`, target refs, or coordination IDs) so that retry callers (who are strictly forbidden from passing raw targets) match the authoritative event log on repeated calls.
    - Standardized cached return contract returning `{ ok: true, idempotent: true, cached: true, coordinationId, kind, actionKey }`.
- **Verification:** `test/verbs/coordination-semantic-use-cases.test.mjs` (5/5 passing) and `test/architecture.test.mjs` (12/12 passing).

### Unit 2D — Semantic CLI Surface & Registry (`code:implement`)
- **Objective:** Expose semantic subcommands under `fgos coordination` with standard `fgos.v1` envelope formatting, full option parsing, and backward compatibility.
- **Implementation:**
  - `src/cli/command-registry.mjs`: Registered subcommands under `coordination`: `start`, `status`, `operation`, `authorize-and-dispatch`, `fan-out`, `contribution`, `human-turn`, `disposition`, and `close`.
  - `bin/fgos.mjs`: Integrated command handlers and argument extractors (supporting flags such as `--from-assignment-id`, `--action-key`, `--detail`, `--actor-id`, `--driver-id`, `--reason`, `--summary`). Preserved `close --file` legacy compatibility.
  - `docs/architecture-manifest.json`: Registered new verb modules.
  - `CHANGELOG.md`: Documented semantic coordination CLI additions in `## [Unreleased]`.
- **Verification:** `test/cli/coordination.test.mjs` (48/48 passing) and `test/cli/fgos-manifest.test.mjs` (14/14 passing).

### Unit 2E — Concurrency, Replay, and Invariant Proofs (`code:test`)
- **Objective:** Prove two-process race serialization, crash/retry safety, stale action key rejection, cross-schema compatibility (schemas 1, 2, 3), and replay equivalence.
- **Implementation:** `test/runner/coordination-phase2-concurrency.test.mjs`
  - Real two-OS-process race on semantic `human-turn` with identical retry yielding idempotent cached success.
  - Real two-OS-process race with conflicting payload rejecting competing writer.
  - Cross-process stale action key rejection.
  - Semantic operations executed across sessions with schema versions 1, 2, and 3.
  - Replay equivalence verifying before/after session states match.
  - Real two-OS-process race on explicit `close`.
- **Verification:** All 6 concurrency scenarios passing cleanly.

---

## 3. Invariant & Contract Audit Matrix

| Gate / Invariant | Requirement | Implementation Evidence | Status |
|---|---|---|---|
| **Authority Gate** | Driver identity mandatory; rechecked under lock; distinct from human actor. | `src/runner/coordination/action-precondition.mjs` verifies `recordedBy` matches session manifest driver. Rejects absent or foreign writer. Human turn rejects driver as attributed actor. | **PASS** |
| **Atomicity Gate** | Precondition verification and step execution execute within single held lock. | `executeUnderActionPrecondition` holds `withSessionLock` continuously across action validation, idempotency check, target resolution, and kernel execution. | **PASS** |
| **Durability Gate** | Zero sidecars; authoritative JSONL log is the sole source of truth. | No `.action-keys.json` or auxiliary files created. Same-id idempotency and conflict detection read directly from `events.jsonl` and session replay. | **PASS** |
| **Explicit Close Gate** | Normal termination requires explicit `close` invocation; quorum prerequisites enforced. | `closeCoordinationUseCase` invokes `validateCoordinationCloseRequest` and `closeSessionByQuorumLocked`. Closes only when quorum/partial policies are met. | **PASS** |
| **Mutation Rule Gate** | Four-condition mutation rule owned exclusively by kernel. | Composers construct validated request envelopes; kernel `executeValidatedCoordinationStep` enforces execution preconditions, state transitions, and actor eligibility. | **PASS** |
| **Compatibility Gate** | `run --file`, `close --file`, `show`, `chain`, and `recover` remain unchanged. | All legacy invocations remain functional and tested in `test/cli/coordination.test.mjs` and `test/verbs/coordination-chain.test.mjs`. Standard `fgos.v1` envelopes maintained. | **PASS** |

---

## 4. Test Verification Matrix

### 4.1 Focused Coordination Suites (324 / 324 Passing, 0 Failures)

| Test File | Total | Pass | Fail | Description |
|---|---|---|---|---|
| `test/runner/coordination-request-composers.test.mjs` | 5 | 5 | 0 | Pure request composition, forbidden field rejection, deterministic IDs |
| `test/verbs/coordination-start-status.test.mjs` | 5 | 5 | 0 | Semantic start, deterministic ID derivation, idempotency, compact/detailed status |
| `test/verbs/coordination-semantic-use-cases.test.mjs` | 5 | 5 | 0 | Action-backed semantic use cases, driver enforcement, conflict handling |
| `test/cli/coordination.test.mjs` | 49 | 49 | 0 | Public CLI commands, 15 subverbs enumeration, strict flag validation, subprocess invocations |
| `test/runner/coordination-phase2-concurrency.test.mjs` | 16 | 16 | 0 | Real 2-OS-process races across all semantic actions, stale action keys, replay equivalence, schemas 1-3 |
| `test/runner/coordination-actions-v1.test.mjs` | 21 | 21 | 0 | Action projection, legality facts, disposition vocabulary |
| `test/runner/coordination-stale-action-proof.test.mjs` | 34 | 34 | 0 | Lock-aware action precondition, sequence invalidation |
| `test/runner/coordination-legality-facts.test.mjs` | 19 | 19 | 0 | Visibility window facts, quorum prerequisites, pure evaluators |
| `test/runner/coordination-baseline-measurement.test.mjs` | 9 | 9 | 0 | Baseline scenario measurements and metric integrity |
| `test/verbs/coordination-chain.test.mjs` | 8 | 8 | 0 | Execution chain derivation and step progression |
| `test/runner/coordination-action-parity.test.mjs` | 16 | 16 | 0 | Parity between projected actions and kernel execution |
| `test/runner/coordination-driver-recheck-fanout.test.mjs` | 39 | 39 | 0 | Multi-actor operations, replacement lineage, fan-out execution |
| `test/verbs/coordination-actions-production.test.mjs` | 75 | 75 | 0 | Production action door validation across all action kinds |
| `test/verbs/coordination-actions-e2e.test.mjs` | 10 | 10 | 0 | End-to-end multi-step protocol flows |
| `test/architecture.test.mjs` | 12 | 12 | 0 | Architectural law enforcement (F-R01, R8, no direct store mutations) |
| **Total Focused** | **324** | **324** | **0** | **100% Passing** |

### 4.2 Integration & Subsystem Verification
- `test/cli/fgos-manifest.test.mjs`: 14/14 passing.
- `test/rust-host/release-tree.test.mjs`: 11/11 passing.
- `test/rust-host/fgctl-upgrade.test.mjs`: 8/8 passing.
- Full codebase-wide test suite (`npm test`): passing all suites cleanly.

---

## 5. Review Findings & Resolution Matrix (P2-F01 through P2-F04)

During rigorous review and red-team validation of Phase 2, four findings were identified and completely resolved:

### P2-F01 — Caller Identity Override on `authorize-and-dispatch`
- **Severity:** HIGH
- **Category:** Trust boundary / deterministic idempotency
- **Defect Description:**
  - `fgos coordination authorize-and-dispatch` accepted `--authorization-id` and `--invocation-key` from callers.
  - `src/verbs/coordination/actions.mjs` and `src/verbs/coordination/composers.mjs` favored caller-provided values over deterministic derivation.
  - This violated the trust boundary and deterministic idempotency contracts: an external caller could spoof authorization identity or cause binding collisions.
- **Resolution:**
  1. Removed `--authorization-id` and `--invocation-key` from CLI parsing in `bin/fgos.mjs` and added them to forbidden option checks.
  2. In `src/verbs/coordination/composers.mjs`, `composeAuthorizeAndDispatchOperationRequest` strictly derives `authorizationId` and `invocationKey` from `(coordinationId, actionKey)` using `deriveDeterministicAuthorizationId` and `deriveDeterministicInvocationKey`.
  3. Enforced `assertNoForbiddenOverrides(callerInputs, ['authorizationId', 'invocationKey', 'target', 'nodeId', 'operationId', 'actorId', 'assignmentId', 'provenance'])` in composer.
  4. In `src/verbs/coordination/actions.mjs`, stripped any incoming caller authorization/invocation identifiers before composition.
  5. In `src/runner/coordination/action-precondition.mjs`, exempted kernel-derived `authorizationId` and `invocationKey` from caller-supplied input checks in `requiredInputs` under lock.
- **Verification Evidence:**
  - `test/runner/coordination-request-composers.test.mjs`: tests rejection of caller-supplied authorization/invocation keys and verifies deterministic derivation.
  - `test/cli/coordination.test.mjs`: verifies CLI rejection of `--authorization-id` and `--invocation-key`.
  - `test/runner/coordination-phase2-concurrency.test.mjs`: verifies two-OS-process concurrent `authorize-and-dispatch` race yields identical deterministic identities and exactly one external dispatch.

### P2-F02 — Public Start Example Failure & Full Payload Conflict Check
- **Severity:** HIGH
- **Category:** Usability contract / idempotency integrity
- **Defect Description:**
  - Running `fgos coordination start --protocol ...` without `--id` failed schema validation because the kernel requires `session.id` to be present and non-empty.
  - When resuming or retrying without `--id`, `startCoordinationUseCase` did not perform a full deep payload conflict check against the existing session manifest/definition.
- **Resolution:**
  1. In `src/verbs/coordination/start.mjs`, implemented `deriveDeterministicCoordinationId`: when `--id` is omitted, automatically derives `coord_${sha256(canonicalPayload).slice(0, 16)}` and populates `request.id` before calling the kernel.
  2. Implemented `assertPayloadMatchesExistingSession` in `startCoordinationUseCase` to perform a strict canonical comparison of protocol, initial parameters, driver/recordedBy identity, and metadata against the persisted session manifest. Any mismatch rejects immediately with code `payload-conflict`.
- **Verification Evidence:**
  - `test/verbs/coordination-start-status.test.mjs`: added `public start example runs without explicit ID and derives deterministic ID` and `startCoordinationUseCase enforces idempotent resume and payload-conflict rejection`.
  - `test/cli/coordination.test.mjs`: verified CLI start without `--id`.

### P2-F03 — CLI Registry & Parser Hidden Options / Diagnostics
- **Severity:** MEDIUM
- **Category:** CLI consistency / Phase 1 R5 compliance
- **Defect Description:**
  - Coordination subverb enumeration in `bin/fgos.mjs` and error handlers only listed a subset of subverbs, violating Phase 1 R5.
  - CLI parser accepted arbitrary undeclared options without diagnostics, risking silent flag drops.
  - Semantic flags were absent from `src/cli/command-registry.mjs`.
- **Resolution:**
  1. Enumerated all 15 coordination subverbs explicitly in all help text, error messages, and command registry descriptions: `start`, `status`, `run`, `close`, `show`, `chain`, `recover`, `operation`, `authorize-and-dispatch`, `fan-out`, `contribution`, `human-turn`, `disposition`, `clean`, `inspect`.
  2. Added `ALLOWED_COORDINATION_FLAGS` map and strict subverb option validation in `bin/fgos.mjs`, exiting with code 2 on unknown, mis-scoped, or forbidden flags.
  3. Updated `src/cli/command-registry.mjs` with full semantic subcommands and their documented options.
- **Verification Evidence:**
  - `test/cli/coordination.test.mjs`: added tests checking all 15 subverbs in help/error messages, and strict rejection of unknown, mis-scoped, and forbidden flags.

### P2-F04 — Multi-Family Two-Process Concurrency Proof Matrix
- **Severity:** MEDIUM
- **Category:** Concurrency / test coverage completeness
- **Defect Description:**
  - Concurrency proofs in `test/runner/coordination-phase2-concurrency.test.mjs` only tested `human-turn` and `close` races.
  - The remaining semantic actions (`operation`, `authorize-and-dispatch`, `fan-out`, `contribution`, `disposition`) lacked real two-OS-process concurrency proofs for identical-payload serialization, cached result idempotency, conflicting-payload rejection, and single-dispatch guarantees.
- **Resolution:**
  1. In `src/runner/coordination/action-precondition.mjs`:
     - Reconstructed original targets and input parameters for `fan-out`, `authorize-and-dispatch`, and `link-contribution` under session lock so retries match persisted event logs.
     - Fixed `candidateKey` matching and allowed-values derivation.
     - Populated `nodeId` and `actorId` alongside `operationId` and `assignmentId` for contribution linking.
  2. In `test/runner/coordination-phase2-concurrency.test.mjs`:
     - Added multi-family test executor support (`exec-family-a`, `exec-family-b`) in `fake-executor.mjs`.
     - Embedded test root directories directly into fake runners to avoid cwd cross-contamination.
     - Added raw-hex sha256 revision pins to artifact backing files in `setupContributionEnv`.
     - Expanded the concurrency test suite from 6 tests to 16 comprehensive two-OS-process tests covering all semantic use cases under concurrent races.
- **Verification Evidence:**
  - `test/runner/coordination-phase2-concurrency.test.mjs`: 16/16 tests passing cleanly.

---

## 6. Metrics & Baseline Comparison

Measurement executed via:
```sh
node scripts/measure-coordination-baseline.mjs \
  --output plans/260919-coordination-skill-harness-simplification/reports/phase-02-post-implementation-measurement.json
```

| Scenario ID | Baseline Dispatches | Phase 2 Dispatches | Baseline Waves | Phase 2 Waves | Outcome |
|---|---|---|---|---|---|
| `clean-plan-loop-shaped` | 3 | 3 | 2 | 2 | Verified |
| `accepted-finding-remediation-recheck` | 5 | 5 | 3 | 3 | Verified |
| `architecture-advisory` | 4 | 4 | 2 | 2 | Verified |
| `human-turn-reopen` | 5 | 5 | 3 | 3 | Verified |
| `rfc-review` | 3 | 3 | 2 | 2 | Verified |
| `nominal-group-technique` | 4 | 4 | 2 | 2 | Verified |
| `delphi-method` | 4 | 4 | 3 | 3 | Verified |
| `explicit-close-success-refusal` | 2 | 2 | 2 | 2 | Verified |

- **Zero Regression:** Dispatch counts, sequential wave counts, and retry counts (0) remain identical between baseline and Phase 2.
- **Skill Doctrine Stability:** Coordinator skill doc sizes remain constant in Phase 2 as planned (skill pruning and template extraction take place in Phase 3/4).

---

## 7. Finding Matrix & Verdict

- **CRITICAL Findings:** 0
- **HIGH Findings:** 0 (2 identified during review: P2-F01, P2-F02 — 100% resolved and verified)
- **MEDIUM Findings:** 0 (2 identified during review: P2-F03, P2-F04 — 100% resolved and verified)
- **LOW Findings:** 0

All Phase 2 requirements specified in `plans/260919-coordination-skill-harness-simplification/phase-02-semantic-request-composers.md` and `plan.md` have been fully met, independently verified, and backed by automated concurrency and architectural regression tests.

**Verdict: APPROVE — Phase 2 Implementation Complete.**
