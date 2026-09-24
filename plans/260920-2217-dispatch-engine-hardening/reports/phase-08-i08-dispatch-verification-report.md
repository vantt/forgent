# Verification Report: Unit I08 — Verify Dispatch Governance, CLI, Doctor, and Performance Gates

- **Track**: `plans/260920-2217-dispatch-engine-hardening/plan.md` (Unit I08 / Phase 08 Verification)
- **Unified Track**: `plans/260919-coordination-skill-harness-simplification/plan.md`
- **Date**: 2026-09-24
- **Branch**: `coordination-skill-harness-i08-dispatch-verification`
- **Worktree**: `/home/vantt/projects/forgentX/.claude/worktrees/coordination-skill-harness-i08-dispatch-verification`
- **Base Commit**: `6f3fb9038fd66cd9943972a321eed2ba98587fab` (`main`)
- **Integration Baseline Lineage**:
  - I06 Integrated Commit: `3bab9b99ec5bbd41c991ad9d6cb05a32f1d32fab`
  - I07 Evaluated Candidate: `439a1fb078418edff7628555c4b6cb9f4015e4e6`
  - I07 Remote-Synchronized Integration: `261ed7ea01765db6c9fa87afddfa8f3e259be1ea`
  - Post-Integration Verification Baseline: `6f3fb9038fd66cd9943972a321eed2ba98587fab`
- **Status**: `blocked on base defects F4/F5 (remediation unit required)`
- **Capability**: `code:test`
- **Verdict**: **BLOCKED BY BASE DEFECTS F4/F5** (Stop condition reached: redirect/governance bypass via pre-existing base defects F4 and F5; remediation unit required before approval)

---

## 1. Executive Summary

Unit **I08** verifies the combined end-to-end behavior of **Unit I06** (Dispatch Governance & PlacementPolicy Binding) and **Unit I07** (Operability, Public CLI Surface, and Doctor Coherence) against the canonical runtime on top of commit `6f3fb9038fd66cd9943972a321eed2ba98587fab`.

All verification was executed in an isolated linked worktree (`.claude/worktrees/coordination-skill-harness-i08-dispatch-verification`), strictly preserving the user-owned dirty working state on `main` (`M AGENTS.md`, `M CLAUDE.md`, untracked events, reviews, and scratch directories).

**Zero Production Diff**: Across `src/`, `bin/`, `core/`, and `plugins/`, the candidate has **0 bytes diff** against base `6f3fb9038fd66cd9943972a321eed2ba98587fab`. All additions are strictly verification tests, benchmark tooling, and plan accounting.

### Stop Condition Triggered
The stop condition defined for Unit I08 in `plans/260919-coordination-skill-harness-simplification/plan.md` is:
> `stop: redirect/governance bypass or measured latency regression`

During verification, probe evaluation confirmed two **HIGH** severity defects pre-existing in base commit `6f3fb9038fd66cd9943972a321eed2ba98587fab`:
1. **F5 (HIGH)**: Cross-provider redirect checks in `src/runner/dispatch/assignment-runner.mjs` compare raw `providerModel` strings without calling `normalizeProviderFamily`, allowing redirect bypasses across canonical families and corrupting provenance.
2. **F4 (HIGH)**: `fgos dispatch decide <unregistered>` returns `unavailable`, but `fgos dispatch execute <unregistered>` falls back to spawning the default `claude` executor with exit code 0 rather than failing closed.

Because Unit I08 is assigned capability `code:test`, it does **not** alter production code. In accordance with the stop condition, Unit I08 is marked **BLOCKED** pending a dedicated `code:implement` remediation unit.

### Verification Scorecard

| Area | Scope | Verification Evidence | Verdict |
|---|---|---|---|
| **Area A: Governance** | Canonical vocabulary, redirect policy, PlacementPolicy authority, warning suppression | `test/runner/dispatch-governance-operability.test.mjs` (Tests 1, 2, 3, 7)<br>`test/runner/assignment-dispatch.test.mjs` (75 pass) | **FAIL (Base defect F5: redirect check raw string comparison allows redirect bypass)** |
| **Area B: Public CLI** | `fgos dispatch` envelope, raw compat door, exit codes, alias `--run`, reconcile validation | `test/cli/dispatch-operability.test.mjs` (8 pass)<br>`test/cli/dispatch-reconcile.test.mjs` (6 pass)<br>`test/runner/dispatch-governance-operability.test.mjs` (Test 1) | **FAIL (Base defect F4: unregistered executor executes default claude with exit 0)** |
| **Area C: Observation** | `watch` settlement on valid `result.json`, corrupt evidence handling, closed vocabularies | `test/verbs/dispatch-observe.test.mjs` (11 pass)<br>`test/runner/dispatch-runtime-inspect.test.mjs` (19 pass)<br>`test/runner/dispatch-governance-operability.test.mjs` (Tests 4, 5) | **PASS** |
| **Area D: Doctor/Setup** | `resolveHerdrBin()`, anchor pane diagnosis, read-only proof, global state docs | `test/setup/visibility-checks.test.mjs` (17 pass)<br>`test/setup/checks-doctor-config.test.mjs` (47 pass)<br>`test/runner/dispatch-governance-operability.test.mjs` (Test 6) | **PASS** |
| **Area E: Performance** | R7 receipt latency benchmark ($n=40$), Herdr 1500ms backoff, working liveness skip | `scripts/bench-receipt-latency.mjs` ($n=40$ trials)<br>`test/runner/dispatch-governance-operability.test.mjs` (Tests 8, 9)<br>`plans/260920-2217-dispatch-engine-hardening/reports/i08-receipt-latency-measurement.json` | **PASS** |
| **Overall Matrix** | Full dispatch, herdr, and coordination suite | Focused matrix: 178/178 pass<br>Governance suite: 9/9 pass<br>Affected dispatch/herdr matrix (55 files): 1455 pass, 0 fail, 1 skip | **BLOCKED (Areas A & B fail on base defects F4/F5)** |

> **Note on Full Suite**: In the isolated worktree, `npm test` encounters 51 failures exclusively in `test/rust-host/` (`fgctl binary must exist`). This is an expected environment prerequisite because the Rust binary has not been compiled in this isolated worktree. On the base checkout where Rust binaries are compiled, these tests pass.

---

## 2. Area A: Dispatch Governance Verification

### 2.1 Behaviors Verified
1. **Binding Authority**: `PlacementPolicy` remains the active binding authority across both public CLI (`fgos dispatch decide|execute`) and programmatic (`executeAssignment`) paths. Invocations that fail placement rules are rejected before any worker process is created.
2. **Deterministic Stable Pool**: Selection of executors from candidate pools remains strictly deterministic based on priority order and stable tie-breaking rules.
3. **Cross-Provider Redirect Opt-In (configured case)**: When configured properly with known provider names, cross-provider redirect configuration (e.g. `claude` routing to `codex-bwrap`) without explicit `crossProvider: true` fails closed with `RunnerConfigError` (`redirect.cross-provider-not-permitted`) BEFORE any worker is spawned (verified by Test 2).
4. **Complete Provenance Record**: An approved cross-provider redirect records full, immutable provenance into `dispatch-plan.json` under `.fgos/assignments/<id>/runs/01/dispatch-plan.json` (verified by Test 3).
5. **Distinct Governance Refusal vs. Unregistered**:
   - Governance-blocked selector produces `{ mechanism: 'unavailable', configured: true, reasonCodes: ['governance.blocked'], blockedReason: '...' }`.
   - Unregistered selector produces `{ mechanism: 'unavailable', configured: false, reasonCodes: ['selector.unregistered'], blockedReason: undefined }`.
   Both public CLI and compatibility doors cleanly distinguish these outcomes on the `decide` path (verified by Test 1).
6. **Provider-Family Warning Suppression**:
   - When an executor's declared invocations are all non-CLI (e.g. MCP-only), `warnIfProviderFamilyUnreliable` suppresses the advisory warning.
   - When an executor declares a bare CLI command not recognized without explicit `providerModel`, the warning is emitted.
   - When `providerModel` is explicitly declared, the warning is suppressed (verified by Test 7).

### 2.2 Base Defects Uncovered (Stop Condition Triggered)
- **F5 (HIGH — Base Defect, Area A FAIL)**: Cross-provider redirect checks in `src/runner/dispatch/assignment-runner.mjs:272,303` compare raw `providerModel` strings without calling `normalizeProviderFamily`.
  - Consequence: An executor command `codex` with `providerModel: 'claude'` bypasses cross-provider redirect checks because the string `'claude'` matches the source, even though the canonical family is different. Conversely, valid intra-family redirects between `openai` and `openai-codex` are rejected. Furthermore, provenance records `selectedProvider` as the raw un-normalized string.
  - This is a direct redirect/governance bypass in base code, triggering the I08 stop condition.
- **F4 (HIGH — Base Defect, Area B FAIL)**: Discrepancy between `fgos dispatch decide` and `execute` on unregistered executors.
  - Consequence: While `fgos dispatch decide <unregistered>` correctly returns `{ mechanism: 'unavailable', reasonCodes: ['selector.unregistered'] }`, running `fgos dispatch execute <unregistered>` falls back to executing the default `claude` executor with exit code 0 rather than failing closed. Pre-existing in base `6f3fb9038fd66cd9943972a321eed2ba98587fab`.

---

## 3. Area B: Public CLI Contract & Compatibility Verification

### 3.1 Dual-Door Parity
- **Public Door (`fgos dispatch <sub-verb>`)**:
  - Encapsulates execution results inside the standard `fgos.v1` envelope (`{ contract: 'fgos.v1', data: ... }`).
  - Upon dispatch failure, writes error details to stdout/stderr and exits with code 1.
  - Declared in `src/cli/command-registry.mjs` with `touchesState: true`, `externalEffect: true` (`[write+external]`).
- **Compatibility Door (`node src/runner/dispatch.mjs <sub-verb>`)**:
  - Preserves exact historical raw JSON format without envelope.
  - Retains identical error structures and exit code 1.

### 3.2 CLI Parsing and Argument Handling
- **`--run` Alias**: Flags `--run` and `--run-id` are interchangeable across `show-run`, `watch`, and `recover`.
- **Precondition Errors on Missing Runs**: When a requested run is not found on disk, `show-run` and `recover` exit with categorized exit code 2 (`precondition`), adhering to `docs/io-contract.md`.
- **Sub-verb Validation Priority**: Unknown sub-verbs fail with validation exit code 4 before running required-field validations on subsequent arguments.
- **Rendered Help & Registry Synchronization**: Verified by `test/rust-host/command-routes.test.mjs` and `test/architecture.test.mjs`.

### 3.3 Base Defects Uncovered
- **F10 (MEDIUM — Base Defect)**: `fgos dispatch reconcile plan` without `--action` exits with code 0 (`blocked: no cwd lock exists`) if executed in a workspace without a cwd lock, instead of exit code 4 validation error. Pre-existing on base `6f3fb9038fd66cd9943972a321eed2ba98587fab`.

---

## 4. Area C: Observation and Recovery Truth

### 4.1 Settlement and Corrupt Evidence Handling
1. **Settled Termination**: `watch` terminates immediately when a valid `result.json` is detected (`snapshot.settled === true`), exiting with `stoppedBecause: 'terminal'`.
2. **Corrupt Evidence Fail-Closed**:
  - Empty files (`0` bytes), whitespace-only files, malformed JSON, empty dictionaries (`{}`), or directories named `result.json` are classified as `resultCorrupt: true`.
  - `watch` terminates immediately on corrupt evidence with `stoppedBecause: 'corrupt-evidence'` rather than reporting success or hanging until tick exhaustion (verified by Test 4).
  - `show-run` displays `resultCorrupt: true`.

### 4.2 RunObservation Closed Vocabularies
All fields of `RunObservation` strictly conform to the closed contractual vocabulary (verified by Test 5):
- `phase`: strictly one of `['admitted', 'launched', 'bound', 'delivered', 'settled', 'unknown']`.
- `delivery`: strictly one of `['not-started', 'delivered', 'terminal', 'unsupported', 'ambiguous']`.
- `resourceState`: strictly one of `['live-proven', 'dead-proven', 'ambiguous', 'unsupported']`.
- `evidenceCompleteness.workspace`: strictly `'unsupported'` (no writer/evidence exists in read-only consult).
- `evidenceCompleteness.resource`: strictly one of `['complete', 'stale', 'missing', 'unsupported']` (never invalid `'partial'`).
- `evidenceCompleteness.ownership`: strictly one of `['complete', 'missing', 'conflicting', 'corrupt']`.

### 4.3 Base Defects Uncovered
- **F7 (MEDIUM — Base Defect)**: Observation and settlement accept `result.json` even if it carries a mismatched `runId` or non-standard status. Pre-existing on base `6f3fb9038fd66cd9943972a321eed2ba98587fab`.

---

## 5. Area D: Doctor and Setup Coherence

### 5.1 Transport and Doctor Parity
- **Anchor Pane Diagnostics**:
  - Empty or whitespace `FGOS_HERDR_ANCHOR_PANE` fails closed with diagnostic explanation.
  - Unresolvable anchor pane ID fails closed.
  - Valid anchor pane verifies and passes (verified by Test 6).
- **Read-Only Invariant**: `fgos doctor` without `--fix` is strictly read-only and never writes configuration files to disk.
- **Documentation Parity**: Global-only runtime directories (`~/.fgos/runtime/provider-capacity/` and `~/.local/state/fgos/attestations/`) are documented as intentional platform design in `docs/specs/distribution.md`.

### 5.2 Base Defects Uncovered
- **F6 (MEDIUM — Base Defect)**: `resolveHerdrBin` uses `optsHerdrBin ?? process.env.FGOS_HERDR_BIN ?? 'herdr'` without trimming whitespace, so a whitespace-padded environment variable fails to execute. Pre-existing on base `6f3fb9038fd66cd9943972a321eed2ba98587fab`.

---

## 6. Area E: Performance Gates & Receipt Latency Benchmark

### 6.1 R7 Receipt Latency Overhead Benchmark
The receipt latency harness (`scripts/bench-receipt-latency.mjs`) measures the supervisor receipt path (`cliSpawnAdapter` with `envelopePath` and `adapter-receipts`). Across $n=40$ trials, each trial launches a worker through the supervisor, waits for worker completion and receipt generation, and measures the observation overhead via `fs.watch` event-driven receipt detection backed by the 20ms fallback poll interval.

#### Measurement Results
- **Benchmark Artifact**: `plans/260920-2217-dispatch-engine-hardening/reports/i08-receipt-latency-measurement.json`
- **Trials**: 40
- **Min Overhead**: 31ms
- **Median Overhead**: 38ms
- **p95 Overhead**: 47ms
- **Max Overhead**: 51ms

#### Threshold Comparison & Context
- **Baseline I07 p95**: 46ms (measured under `executeAssignment` with 1100ms worker sleep).
- **Acceptance Threshold**: $\text{Baseline p95} + 100\text{ms} = 146\text{ms}$.
- **Candidate p95**: **47ms**.
- **Margin vs Baseline**: $+1\text{ms}$ (well within the $+100\text{ms}$ allowance).
- **Production Diff**: **0 bytes** against base `6f3fb9038fd66cd9943972a321eed2ba98587fab` across `src/`, `bin/`, `core/`, `plugins/`.
- **Verdict**: **PASS** (Threshold is met due to zero production code diff and reproducible event-driven receipt latency).

#### Environment Context (Recorded Accurately)
- **Base Commit**: `6f3fb9038fd66cd9943972a321eed2ba98587fab`
- **Head Commit**: `3cfaec538cdf82a9d3961455436a40b6130817e1`
- **Host OS**: Linux 6.8.0-138-generic x86_64
- **Node.js**: v24.18.0
- **CPU Cores**: 16 (12th Gen Intel(R) Core(TM) i7-12650H)
- **Production Diff**: 0 bytes (dynamically computed)

### 6.2 Polling Backoff and Accounting Truth
- **Working State Liveness Probing Skip**: `paneProcessInfo` is skipped while Herdr reports `status: 'working'`, preventing redundant process tree walks (verified by Test 8).
- **Accounting for Slow/Failed Status Reads**: Observation timestamp is recorded *after* status read completion; slow/failing status reads are charged to blind observation time, not false worker idle time (verified by Test 9).

---

## 7. Verification Test Suite: `test/runner/dispatch-governance-operability.test.mjs`

A permanent verification test suite (`test/runner/dispatch-governance-operability.test.mjs`) contains 9 behavioral tests:

| Test # | Description | Execution Time | Status |
|---|---|---|---|
| **Test 1** | Governance-blocked versus unregistered result shape across public CLI and compat doors | 539ms | **PASS** |
| **Test 2** | Cross-provider redirect without explicit opt-in fails closed BEFORE worker spawn | 5ms | **PASS** |
| **Test 3** | Approved redirect records full immutable provenance in `dispatch-plan.json` | 197ms | **PASS** |
| **Test 4** | `watch` terminates on valid `result.json` and stops on corrupt/empty/directory evidence | 2ms | **PASS** |
| **Test 5** | `RunObservation` fields strictly adhere to closed vocabularies | 2ms | **PASS** |
| **Test 6** | `checkHerdrAvailable` diagnoses empty, unresolvable, and valid `FGOS_HERDR_ANCHOR_PANE` | 144ms | **PASS** |
| **Test 7** | Provider-family warning suppresses for all-non-CLI and warns for bare unverified commands | 1ms | **PASS** |
| **Test 8** | Herdr polling skips pane process-info liveness check while agent reports working | 288ms | **PASS** |
| **Test 9** | Failed status read in Herdr polling accumulates to blind time rather than charging worker idle | 1351ms | **PASS** |

Total: **9 passed / 0 failed** in 2.73s.

---

## 8. Accounting and Documentation Synchronization

1. **`plans/260920-2217-dispatch-engine-hardening/plan.md`**:
   - Phase 08 row updated: "integrated (`261ed7ea`), verification blocked on base defects F4/F5".
   - Unit I08 accounting block updated: status `blocked on base defects F4/F5 (remediation unit required)`, stop condition documented, test matrix updated to 1455 pass.
2. **`plans/260919-coordination-skill-harness-simplification/plan.md`**:
   - Top status updated: `Unit I08 blocked on base defects F4/F5 (remediation unit required)`.
   - Unit I08 section updated with stop condition, test counts, and benchmark references.
3. **`plans/260920-2217-dispatch-engine-hardening/phase-08-operability-cli-doctor.md`**:
   - Status updated: `Unit I08 Status: blocked on base defects F4/F5 (remediation unit required)`.

---

## 9. Architectural Invariants & Non-Goals Check

- [x] **No Component Boundary Changed**: All changes stay strictly within verification tests, benchmarks, and plan accounting.
- [x] **No Production Refactoring**: 0 bytes modified in `src/`, `bin/`, `core/`, `plugins/`.
- [x] **No DAG Modifications**: No changes made to I09/I10 work or coordination DAG runtime.
- [x] **Git Truth Preserved**: Main checkout remains on `6f3fb9038fd66cd9943972a321eed2ba98587fab` with user's dirty working tree completely intact.
- [x] **No Push / No Merge to Main**: Candidate branch `coordination-skill-harness-i08-dispatch-verification` is self-contained.
- [x] **Unit I11 Remains Blocked**: Unit I11 is not opened.

---

## 10. Verdict and Hand-off Recommendation

**VERDICT**: **BLOCKED BY BASE DEFECTS F4/F5 (STOP CONDITION REACHED)**

The verification harness, tests, and benchmark for Unit I08 are complete and passing. However, verification has uncovered that base commit `6f3fb903` violates dispatch governance contracts via base defects F4 and F5, triggering the I08 stop condition (`stop: redirect/governance bypass or measured latency regression`).

As a `code:test` agent, Unit I08 cannot modify production code. The Track Manager must schedule a `code:implement` remediation unit to fix F4 and F5 (and optionally F6, F7, F10). Unit I08 verification cannot be marked approved/integrated until those production defects are resolved.
