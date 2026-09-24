# Implementation Report: Unit I08b — Remediation of I08 Base Defects (F4, F5, F6, F7, F10)

- **Track**: `plans/260920-2217-dispatch-engine-hardening/plan.md` (Unit I08b / Phase 08 Remediation)
- **Unified Track**: `plans/260919-coordination-skill-harness-simplification/plan.md`
- **Date**: 2026-09-24
- **Branch**: `coordination-skill-harness-i08b-remediation`
- **Worktree**: `/home/vantt/projects/forgentX/.claude/worktrees/coordination-skill-harness-i08b-remediation`
- **Baseline & Lineage**:
  - I08 Candidate Baseline: `4e9de19541f2acde2380ff4f78147e389385e95c`
  - Evaluated Candidate SHA (Approved in Review): `0617c6e41ebec1aa8e73065eac69cd5eb9684343`
  - Integrated Remote Main Merged: `origin/main@4ad0b8ca6576252be01159fcf5853c966ba54743`
  - Synchronization Commit: `355f9dbd` (`chore(dispatch): synchronize origin/main@4ad0b8ca into Unit I08b candidate`)
- **Status**: `ready for independent re-review (synchronized candidate)`
- **Capability**: `code:implement`
- **Depends-on**: `Unit I08`
- **Unblocks**: Re-verification of Unit I08 and subsequent Unit I11

---

## 1. Executive Summary

During the execution of **Unit I08** (`code:test`), comprehensive end-to-end verification and latency benchmark harness uncovered two **HIGH** severity defects (F4, F5) and three related **MEDIUM** defects (F6, F7, F10) pre-existing in base code (`main@6f3fb903`). This triggered the I08 stop condition (`stop: redirect/governance bypass`), halting forward progress into Unit I11.

**Unit I08b** (`code:implement`) definitively remediates all 5 defects in production code, updates tests that pinned old silent fallback behaviors, introduces a dedicated 5-part regression test suite, verifies focused and affected matrix suites, and preserves full dual-door parity and clean repository hygiene.

### Defect Remediation Scorecard

| Defect | Severity | Area | Root Cause & Resolution | Production Files Changed | Verification Test |
|---|---|---|---|---|---|
| **F4** | HIGH | Bound Precision / CLI | Explicit unregistered executor IDs silently fell back to global executor with exit 0. Resolved by failing closed with exit 1 (`DispatchError('executor-not-found')`) across public CLI, compat door, and `executeExecutorCli`, while preserving implicit resolution for work item dispatches. Parity achieved via JSON serialization in `runDispatchCli` / `bin/fgos.mjs` while restoring `DispatchError extends Error`. | `src/runner/dispatch/cli.mjs`<br>`src/runner/dispatch/dispatch-error.mjs`<br>`bin/fgos.mjs` | Test F4 (`dispatch-i08b-remediation.test.mjs`) |
| **F5** | HIGH | Governance / Redirect | Cross-provider redirect checks compared raw `providerModel` strings without normalization, allowing spoofed provider bypasses and breaking valid intra-family redirects. Resolved by canonicalizing families with declared vendor precedence via `normalizeProviderFamily(deriveProviderFamily(entry, command), command)` (where declared `providerModel`/`provider` takes precedence over CLI harness commands like `pi`/`claude`) and recording canonical family provenance in `dispatch-plan.json`. | `src/runner/dispatch/assignment-runner.mjs`<br>`src/runner/dispatch/provider-adapter.mjs` | Test F5 (`dispatch-i08b-remediation.test.mjs`) |
| **F6** | MEDIUM | Transport / Doctor | `resolveHerdrBin()` failed to trim whitespace on environment variable and caller options. Resolved with `.trim()` while strictly preserving caller option precedence over env var. | `src/runner/dispatch/transport.mjs` | Test F6 (`dispatch-i08b-remediation.test.mjs`) |
| **F7** | MEDIUM | Result Truth / Settlement | `interpretRunResult` lacked `expectedRunId` checking and non-standard status validation across intake doors. Resolved by adding `expectedRunId` validation across all observation, settlement, and recovery callers (`watch.mjs` covered indirectly via `show-run.mjs`); mismatched `runId` or missing `runId` (when `expectedRunId` is provided) or non-standard status flags `contractCorrupt: true`, `resultCorrupt: true` and refuses settlement, while legacy leniency is preserved when `expectedRunId` is omitted. | `src/runner/dispatch/run-result.mjs`<br>`src/verbs/dispatch/show-run.mjs`<br>`src/runner/dispatch/herdr-round.mjs`<br>`src/runner/dispatch/assignment-runner.mjs`<br>`src/runner/dispatch/runtime-inspection.mjs`<br>`src/runner/dispatch/operation-choice.mjs`<br>`src/runner/coordination/session-engine.mjs`<br>`src/verbs/coordination/show.mjs` | Test F7 (`dispatch-i08b-remediation.test.mjs`) |
| **F10** | MEDIUM | Reconcile / CLI Validation | Bare `reconcile plan` returns exit 0 by design (default action is `clear-cwd-lock` per `runner.md:21`); defect was `--run` or `--assignment` without `--action` (or with `clear-cwd-lock`) inspecting CWD lock before validating missing action, returning exit 0 when no lock existed. Resolved by validating action requirement up front across CLI, verb, and planner, exiting with code 4. | `src/verbs/dispatch/reconcile.mjs`<br>`src/runner/dispatch/reconciliation-planner.mjs`<br>`bin/fgos.mjs` | Test F10 (`dispatch-i08b-remediation.test.mjs`) |

---

## 2. Detailed Technical Remediations

### 2.1 F4 (HIGH) — Bound Precision: Unregistered Executor Nominated Explicitly Fails Closed

- **Problem**: When a caller explicitly passed an unregistered executor ID (e.g., `fgos dispatch execute <id>` or `node src/runner/dispatch.mjs execute <id>`), `executeExecutorCli` silently fell through to the global Claude executor, executing with exit code 0 rather than failing closed. This contradicted `fgos dispatch decide <id>`, which correctly returned `{ mechanism: 'unavailable', configured: false, reasonCodes: ['selector.unregistered'] }`.
- **Remediation**:
  1. `src/runner/dispatch/dispatch-error.mjs`: Restored standard `DispatchError extends Error` (reverting unnecessary `extends RunnerConfigError` hierarchy change). Dual-door `{ errorClass, error }` parity is established via structured serialization in `runDispatchCli` (`src/runner/dispatch/cli.mjs`) and `bin/fgos.mjs` before exiting with code 1, while preserving `instanceof RunnerConfigError` distinctions for programmatic callers.
  2. `src/runner/dispatch/cli.mjs`:
     - When `!work` (an explicit executor nomination) and `!resolved.configured || !resolved.executor`: throws `new DispatchError('executor-not-found', 'no executor registered for id "' + executorIdArg + '"', { executorId: executorIdArg })`.
     - Updated comment at lines 683-694 to document the explicit fail-closed contract, removing dead `mechanism === 'unavailable'` check.
     - Classified governance gate rejections into `errorClass: 'governance-refused'` in CLI entrypoints using `err.code` where available (`redirect.cross-provider-not-permitted`, `governance.*`).
  3. **Implicit Resolution Preserved**: When `work` is present (such as in `spawnWorker` or fanout batch execution), `executorIdArg` represents a stage skill (e.g. `fgos-coding-implement`). If unconfigured, it safely falls through to the global executor default (`cfg.executor`), ensuring automated runner operations never fail spuriously.
  4. **Pinned Test Updates**:
     - `test/runner/dispatch.test.mjs`: Updated line 3702 to assert that explicit unregistered executor throws `DispatchError('executor-not-found')`. Updated subsequent downstream tests (lines 3736, 3756, 3774, 3799, 5528) to use configured executor `'claude'` with `allowCrossProvider: true`.
     - `test/cli/dispatch-operability.test.mjs`: Updated line 128 to use configured `'claude'` instead of dummy unregistered name `'depth-test-exec'` when testing `dispatch-depth-exceeded` error preservation.

### 2.2 F5 (HIGH) — Canonicalize Provider Family Based on Real Command and Declared Vendor

- **Problem**: In `src/runner/dispatch/assignment-runner.mjs`, `resolveReadOnlyRedirect` and `policyForActualExecutor` compared raw `providerModel` strings. An executor declaring a CLI harness like `pi` running `deepseek` could be conflated with `pi` running `openai` if command alone was inspected, or conversely, valid intra-family redirects (such as `openai` to `openai-codex`) were blocked as cross-provider, and `dispatch-plan.json` provenance recorded un-normalized provider names.
- **Remediation**:
  1. In `src/runner/dispatch/provider-adapter.mjs`:
     - Updated `normalizeProviderFamily(providerFamily, command)` to establish that declared vendor (`providerModel`/`provider`) strictly takes precedence over CLI harness commands (`pi`, `claude` are harnesses; vendor specifies the model egress boundary).
  2. In `src/runner/dispatch/assignment-runner.mjs`:
     - Both source and target provider families are computed using:
       ```javascript
       const sourceProvider = resolveProviderFamilyForExecutor(sourceExecutorEntry, sourceCommand);
       const selectedProvider = resolveProviderFamilyForExecutor(targetExecutorEntry, targetCommand);
       ```
     - `isCrossProvider` evaluates whether `selectedProvider !== sourceProvider`.
     - Cross-provider redirects without `crossProvider: true` fail closed before worker spawn with `RunnerConfigError('redirect.cross-provider-not-permitted')`.
     - Intra-family redirects (e.g. `openai` -> `openai-codex`, both canonical family `openai-codex`) are permitted without requiring `crossProvider: true`.
     - Recorded provenance in `dispatch-plan.json` under `redirectDecision.sourceProvider` and `redirectDecision.selectedProvider` records the canonical family.
     - In `policyForActualExecutor`, applied identical canonical family calculation to ensure model policy tier lookups align with the target executor's true provider family.

### 2.3 F6 (MEDIUM) — Sửa Path và Thứ tự Ưu tiên cho `resolveHerdrBin`

- **Problem**: `resolveHerdrBin` used `optsHerdrBin ?? process.env.FGOS_HERDR_BIN ?? 'herdr'` without trimming whitespace, which caused failures if environment variables or options contained leading/trailing spaces.
- **Remediation**:
  - In `src/runner/dispatch/transport.mjs`:
    ```javascript
    export function resolveHerdrBin(optsHerdrBin) {
      return optsHerdrBin?.trim() || process.env.FGOS_HERDR_BIN?.trim() || 'herdr';
    }
    ```
  - Preserved caller option precedence over environment variables, with whitespace-only values falling back cleanly.

### 2.4 F7 (MEDIUM) — Mở rộng Kiểm tra expectedRunId và Closed Vocabulary cho Mọi Cửa Tiếp nhận

- **Problem**: `interpretRunResult` accepted `result.json` regardless of whether the `runId` inside `result.json` matched the run currently being observed, settled, or reconciled, or if it had a missing `runId` or non-standard status string like `'totally-bogus'`.
- **Remediation**:
  1. `src/runner/dispatch/run-result.mjs`:
     - Added `expectedRunId` parameter to `validateRunResultV2` and `interpretRunResult`.
     - Exported `RECOGNIZED_LEGACY_STATUSES = Object.freeze(['done', 'failed', 'blocked', 'no-evidence'])`.
     - When `expectedRunId` is provided:
       * Missing `runId` fails closed as contract-corrupt (`run-id-missing`).
       * Mismatched `runId` (`rawObj.runId !== expectedRunId`) fails closed as contract-corrupt (`run-id-mismatch`).
     - For legacy results, an explicit status not in `RECOGNIZED_LEGACY_STATUSES` fails closed as contract-corrupt (`non-standard-status`).
     - Returns immutable `contract-corrupt` result with `contractCorrupt: true`, `resultCorrupt: true`, `corrupt: true`, `status: 'no-evidence'`, `confidence: 'failed'`, and `classification.provenance: 'contract-corrupt'`.
     - When `expectedRunId` is omitted, legacy leniency is preserved.
  2. Wired `expectedRunId` throughout all intake, observation, and settlement doors:
     - `src/verbs/dispatch/show-run.mjs`: `readRunSnapshot` passes `{ expectedRunId: run?.runId }`, setting `resultCorrupt: true` on mismatch or missing runId and preventing `settled = true`.
     - `src/verbs/dispatch/watch.mjs`: Covered indirectly via `show-run.mjs`'s `readRunSnapshot`, halting promptly with `stoppedBecause: 'corrupt-evidence'`.
     - `src/runner/dispatch/herdr-round.mjs`: `reconcileHerdrSpawnRun` checks `hasMismatch = Boolean(expectedRunId && settledResult?.runId && settledResult.runId !== expectedRunId)`, returning `{ status: 'corrupt', corrupt: true, resultCorrupt: true }` and never settling.
     - `src/runner/dispatch/assignment-runner.mjs`: All settlement and recovery call sites (lines 2144, 2218, 3180, 3285, 3530) pass `expectedRunId` and reject corrupt evidence.
     - `src/runner/dispatch/runtime-inspection.mjs`: Passes `expectedRunId: l.run?.runId`.
     - `src/runner/coordination/session-engine.mjs`: `readLinkedRunResultFromDisk` and `findLatestRunResult` pass `expectedRunId`.
     - `src/verbs/coordination/show.mjs`: `readRunResultForAssignment` passes `expectedRunId`.
     - `src/runner/dispatch/operation-choice.mjs`: `inspectAssignmentRunOnDisk` passes `expectedRunId`.

### 2.5 F10 (MEDIUM) — Validate Action trước khi kiểm tra CWD Lock

- **Problem**: Running `fgos dispatch reconcile plan --run <id>` (or `--assignment <id>`) without `--action` (or with `clear-cwd-lock`) checked for the presence of a CWD lock before validating required flags. In a workspace without a lock, it exited with code 0 (`blocked: no cwd lock exists`) rather than exit code 4 (validation error). Note: bare `reconcile plan` without `--run` or `--assignment` returning exit 0 when no lock exists is the intended spec behavior (`docs/specs/runner.md:21`: `clear-cwd-lock` is the default action).
- **Remediation**:
  1. `src/verbs/dispatch/reconcile.mjs`: In `reconcilePlanUseCase`, if `flags.run` or `flags.assignment` is provided without a valid `--action` (or with `clear-cwd-lock`), immediately throws `new DispatchReconcileError(...)` with `this.category = 'validation'`, exiting with code 4 before any lock check.
  2. `src/runner/dispatch/reconciliation-planner.mjs`: In `planReconciliation`, returns `{ outcome: 'refused', reason: 'reconcile plan with --run or --assignment requires --action...' }` prior to examining CWD lock existence.
  3. `bin/fgos.mjs`: Throws `StoreError('validation', ...)` (exit code 4) when `--action` is missing or invalid.

---

## 3. Dedicated Regression Test Suite

Created dedicated automated regression test suite:
`test/runner/dispatch-i08b-remediation.test.mjs`

| Test Case | Defect | Assertions Verified |
|---|---|---|
| **Test 1** | **F4** | Explicit unregistered executor fails closed with exit 1 across public CLI (`fgos dispatch execute <id>`), compat door (`node src/runner/dispatch.mjs execute <id>`), and `executeExecutorCli`. Returns `errorClass: 'executor-not-found'`. |
| **Test 2** | **F5** | Declared vendor takes precedence over CLI harness (`pi`, `claude`). `pi` running `deepseek` vs `pi` running `openai` is caught as cross-provider and fails closed before worker spawn with `redirect.cross-provider-not-permitted`. Intra-family redirect (`pi` + `openai` to `codex`) executes without error and records canonical family `openai-codex` in `dispatch-plan.json`. |
| **Test 3** | **F6** | `resolveHerdrBin` trims whitespace on both options and environment variables, honoring option precedence over env var, and falling back to default `'herdr'`. |
| **Test 4** | **F7** | `result.json` with mismatched `runId` or missing `runId` when `expectedRunId` is passed, or with non-standard status, is flagged `contractCorrupt: true`, `resultCorrupt: true` across `interpretRunResult`, `show-run`, `watchRunUseCase` (`stoppedBecause: 'corrupt-evidence'`), and `reconcileHerdrSpawnRun` (`status: 'corrupt'`, never settles). Legacy leniency preserved when `expectedRunId` is omitted. |
| **Test 5** | **F10** | `fgos dispatch reconcile plan` with `--run` or `--assignment` without `--action` exits with code 4 (validation error) before evaluating CWD lock existence. Direct use case throws `category: 'validation'`. |

**Execution Result**:
```
✔ F4: explicit unregistered executor fails closed across public CLI, compat door, and executeExecutorCli (250ms)
✔ F5: declared vendor takes precedence over CLI harness; cross-vendor redirect is blocked, intra-family is allowed (185ms)
✔ F6: resolveHerdrBin trims whitespace and honors caller opts over env (0.4ms)
✔ F7: result.json with mismatched runId is flagged contract-corrupt and never settles (2.5ms)
✔ F10: reconcile plan with --run or --assignment requires --action before checking cwd lock (385ms)
ℹ tests 5 | pass 5 | fail 0 | duration_ms 926ms
```

---

## 4. Verification Evidence & Test Matrix

### 4.1 Verification Matrix Summary

| Test Suite | Scope | Target | Result | Status |
|---|---|---|---|---|
| `test/runner/dispatch-i08b-remediation.test.mjs` | Dedicated I08b regression tests (F4, F5, F6, F7, F10) | 5 tests | **5 passed / 0 failed** | **PASS** |
| `test/runner/dispatch-governance-operability.test.mjs` | Permanent I08 governance & operability suite | 9 tests | **9 passed / 0 failed** | **PASS** |
| Focused Matrix (10 files) | Core dispatch, CLI, reconciliation, observation, setup | 10 files | **184 passed / 0 failed** (189 with regression) | **PASS** |
| Root Dispatch Suite | Root comprehensive dispatch test (`dispatch.test.mjs`) | 1 file | **387 passed / 0 failed** | **PASS** |
| Affected Matrix (53 files) | Full dispatch and herdr test suite (synchronized SHA) | 53 files | **1456 passed / 0 failed / 1 skipped** | **PASS** |
| Full Repository Suite | Full test suite (`npm test`, synchronized SHA) | Entire repo | **7603 passed / 0 failed / 8 skipped / 65 todo** (401s) | **PASS** |
| Whitespace & Formatting | `git diff --check origin/main...HEAD` | Synchronized diff | **0 warnings / 0 errors** | **PASS** |

### 4.2 Detailed Matrix Breakdown

1. **Dedicated Remediation Suite**:
   - `test/runner/dispatch-i08b-remediation.test.mjs`: 5/5 PASS (0.93s).
2. **Permanent Verification Suite**:
   - `test/runner/dispatch-governance-operability.test.mjs`: 9/9 PASS (2.39s).
3. **Core Focused Matrix (10 files)**:
   - Core 10 focused suites pass completely with **184 passed / 0 failed** (189 total when combined with the 5 dedicated regression tests):
     * `test/cli/dispatch-operability.test.mjs`: 11/11 PASS (includes F4/F6 exit 1 and errorClass tests).
     * `test/cli/dispatch-reconcile.test.mjs`: 6/6 PASS.
     * `test/verbs/dispatch-observe.test.mjs`: 12/12 PASS (`watch.mjs` is covered indirectly via `show-run.mjs` / `readRunSnapshot`).
     * `test/runner/dispatch-runtime-inspect.test.mjs`: 20/20 PASS.
     * `test/runner/dispatch-confinement-authority.test.mjs`: 27/27 PASS.
     * `test/runner/herdr-round-reconcile.test.mjs`: 2/2 PASS (includes tampered result test).
     * `test/setup/visibility-checks.test.mjs`: 18/18 PASS.
     * `test/setup/checks-doctor-config.test.mjs`: 65/65 PASS.
     * `test/runner/run-result-v2.test.mjs`: 14/14 PASS.
     * `test/runner/dispatch-governance-operability.test.mjs`: 9/9 PASS.
     * **Sum**: 11 + 6 + 12 + 20 + 27 + 2 + 18 + 65 + 14 + 9 = **184 pass** (+ 5 regression = **189 pass**).
   - In addition, the comprehensive root dispatch suite (`test/runner/dispatch.test.mjs`) passes 387/387 tests with 0 failures.
4. **Affected Matrix (53 files)**:
   - Evaluated across all 53 affected test files covering dispatch, herdr, assignment, run-result, placement, provider, and coordination-session: **1456 passed / 0 failed / 1 skipped** (the 1 skipped test is in `test/runner/herdr-spawn-adapter.test.mjs`, intentionally skipped when no live Herdr daemon is running; reflects +17 tests added by windows-ci-hardening on `origin/main@4ad0b8ca`, up from 1439 prior to synchronization).
5. **Full Repository Test Suite (`npm test`)**:
   - `node scripts/run-tests.mjs`: **7603 passed / 0 failed / 8 skipped / 65 todo** (duration 401s, exit code 0). Complete hermetic pass confirming zero cross-system regressions across all packages, schemas, and state stores.
6. **Clean Code & Whitespace Check**:
   - `git diff --check origin/main...HEAD`: Clean (0 errors, 0 warnings).

### 4.3 Follow-up Ledger

- **N10 (LOW-MEDIUM): Disentangle vendor boundary from adapter selection in ProviderAdapter**:
  - *Context*: `normalizeProviderFamily` currently serves two roles: (1) vendor boundary for dispatch governance (where declared vendor strictly takes precedence over CLI harness to prevent cross-vendor redirection), and (2) CLI adapter selection in `getProviderAdapter` (where selecting `PiProviderAdapter` vs `CodexProviderAdapter` needs the harness command to know which CLI args like `--tools` apply).
  - *Production Impact Today*: None. The sole production consumer is `resolveVerifiedProviderArgs` in `transport.mjs:203` which targets `claude` and falls back cleanly; `fgos doctor` on real configs produces output identical to base.
  - *Follow-up Action*: Before expanding ProviderAdapter roadmap (`design.md §3.5`) beyond Claude harness, refactor adapter selection to key on the invocation harness/command, while using declared vendor solely for endpoint/variant specialization. Add unit tests ensuring `pi` + `deepseek` retains `--tools`.

---

## 5. Architectural Invariants, Non-Goals, and Hygiene

- [x] **Preserve Main Working Tree**: Zero modifications were made to the dirty working state on the `main` checkout (`M AGENTS.md`, `M CLAUDE.md`, untracked event files, scratch directories).
- [x] **No Direct Push / No Direct Merge**: All work performed strictly within worktree `.claude/worktrees/coordination-skill-harness-i08b-remediation` on branch `coordination-skill-harness-i08b-remediation`.
- [x] **Dual-Door Contract Parity**: Exit code 1 and structured `{ error, errorClass }` responses remain identical between public CLI (`fgos dispatch execute`) and compatibility door (`node src/runner/dispatch.mjs execute`).
- [x] **Zero Regressions on Implicit Dispatch**: Implicit fallback to the global executor is preserved for work items without explicit executor nominations.
- [x] **Closed Vocabulary Integrity**: `RunObservation` and `RunResult` vocabularies strictly adhere to closed contract specifications.
- [x] **Plan Synchronization**: Updated all three plan tracking documents (`plans/260919-coordination-skill-harness-simplification/plan.md`, `plans/260920-2217-dispatch-engine-hardening/plan.md`, `plans/260920-2217-dispatch-engine-hardening/phase-08-operability-cli-doctor.md`).

---

## 6. Handoff & Candidate Commit

All production changes, test updates, regression tests, plan accounting, and implementation reporting are complete. The unit is ready for commit in the worktree and subsequent independent review by the Track Manager / Reviewer.
