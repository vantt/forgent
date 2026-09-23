# Implementation Report: Unit I07 — Dispatch-Hardening Phase 08 Operability, CLI Surface, and Doctor

- **Track**: `plans/260920-2217-dispatch-engine-hardening/plan.md` (Unit I07 / Phase 08)
- **Phase Spec**: `plans/260920-2217-dispatch-engine-hardening/phase-08-operability-cli-doctor.md`
- **Date**: 2026-09-23
- **Branch**: `dispatch-hardening-i07-operability-cli-doctor`
- **Worktree**: `/home/vantt/projects/forgentX/.claude/worktrees/dispatch-hardening-i07-operability-cli-doctor`
- **Base Commit**: `cc687d92b94c6652f1cb738b74d1cfa0c72571d2` (`main`)
- **Status**: `implemented` (pre-merge implementation complete; non-integrated candidate)
- **Capability**: `code:implement`
- **Next Dependency Gate**: Track Manager review / candidate handoff (pre-requisite for subsequent tracks)

---

## 1. Executive Summary

Unit **I07** implements all nine requirements (R1–R9) of Dispatch-Hardening Phase 08 (`operability-cli-doctor`) directly on top of approved baseline `cc687d92b94c6652f1cb738b74d1cfa0c72571d2` in an isolated worktree, leaving the main checkout completely untouched.

### Requirements Verification Matrix

| Req | Description | Status | Implementation Files & Key Actions |
|---|---|---|---|
| **R1** | `decide` result vocabulary & dead check removal | **Satisfied** | Added additive `reasonCodes` and `blockedReason` to `decideExecutorCli` (`cli.mjs`). Removed dead `plan.dispatch === 'human-only'` check in `cli.mjs` and `assignment-runner.mjs`. Tests prove governance-blocked JSON ≠ unregistered JSON. |
| **R2** | Production CLI door & envelope wrapping | **Satisfied** | Registered `fgos dispatch decide\|execute\|log` in `src/cli/command-registry.mjs` delegating to `runDispatchCli` in `bin/fgos.mjs`, wrapped in `fgos.v1` envelope. Retained `node src/runner/dispatch.mjs` as raw JSON compatibility alias. Updated `scripts/dispatch-decide-hook.mjs` to document `fgos dispatch execute`. |
| **R3** | CLI validation, aliases & error categorization | **Satisfied** | Added `--run` alias for `--run-id` on `show-run`, `watch`, `recover`. Standardized run not-found errors to categorized exit code 2 (`precondition`) in `show-run.mjs` and `recover.mjs`, documented in `docs/io-contract.md`. Validated unknown sub-verb before requiring `runId` (exit 4). Added validation that `reconcile plan --run/--assignment` without `--action` exits 4 with actionable message. Preserved positional `undefined` semantics. Usage includes `fanout-batch` and `reconcile`. |
| **R4** | Watch settlement | **Satisfied** | `readRunSnapshot` in `src/verbs/dispatch/show-run.mjs` exposes `settled: fs.existsSync(result.json)`. `watchRunUseCase` in `src/verbs/dispatch/watch.mjs` breaks when `snapshot.settled` is true. |
| **R5** | `RunObservation` closed vocabulary | **Satisfied** | Aligned `RunObservation` vocabulary to closed status sets in `src/runner/dispatch/runtime-inspection.mjs`: `phase` derived from facts (`result.json` -> `settled`; controller/commands -> `launched`/`bound`), `delivery` maps `not-sent` -> `not-started`, `resourceState` mapped from visibility status, and `evidenceCompleteness.workspace` emits `unsupported` when appropriate. |
| **R6** | Doctor & setup coherence | **Satisfied** | Updated `checkHerdrAvailable` in `src/setup/registrations.mjs` to resolve binary via `resolveHerdrBin()` (`FGOS_HERDR_BIN ?? 'herdr'`). Added diagnosis of `FGOS_HERDR_ANCHOR_PANE` (fails if empty; verifies via `pane get` if set). Documented intentional host-global state directories (`~/.fgos/runtime/provider-capacity/` and `~/.local/state/fgos/attestations/`) in `docs/specs/distribution.md` (rows 5d and 5e). |
| **R7** | Polling & backoff performance | **Satisfied** | Receipt polling in `transport.mjs` and `assignment-runner.mjs` backs off to 250ms after 1s. Herdr round polling in `herdr-round.mjs` backs off to 1500ms after ack, and skips `paneProcessInfo` while status is `working`. |
| **R8** | Provider-family warning condition | **Satisfied** | `warnIfProviderFamilyUnreliable` in `src/runner/dispatch/config.mjs` skips warning when all declared executor invocations are non-CLI (`invocations.every(inv => inv.via !== 'cli')`). |
| **R9** | Registry & rendered help synchronization | **Satisfied** | Updated `command-registry.mjs`: accurate `cwd` description, `touchesState` describes writing run/guard files and not `events.jsonl`. Updated `renderHelpText` in `bin/fgos.mjs` to render all positional arguments (`positional: sub, run-id`). |

---

## 2. Detailed Technical Changes

### 2.1 R1 — `decide` Result Vocabulary & Dead Check Removal
- In `src/runner/dispatch/cli.mjs`:
  - `decideExecutorCli`: added additive `reasonCodes` and `blockedReason` to returned object. When governance rejects or when selector is unregistered, populated `reasonCodes` (e.g. `['selector.unregistered']` or `['governance.blocked']`) and `blockedReason`.
  - Removed dead `plan.dispatch === 'human-only'` check in `cli.mjs:1543` and `src/runner/dispatch/assignment-runner.mjs:1433`.
  - Added dedicated tests in `test/runner/dispatch.test.mjs` verifying that governance-blocked output has `mechanism: 'unavailable'` and `reasonCodes: ['governance.blocked']`, which is distinct from unregistered output (`reasonCodes: ['selector.unregistered']`).

### 2.2 R2 — Production CLI Door & Envelope Wrapping
- In `src/cli/command-registry.mjs`:
  - Registered `decide`, `execute`, and `log` in `dispatch.parameters.properties.sub.enum`.
  - Added options for `decide` and `execute` (`for`, `prompt`, `prompt-file`, `model`, `tier`, `carries`, `has-live-task-access`, `needs-soul`, `candidates`, `contract`, `assignment`, `stage`, `work`).
  - Updated `invoke` to `'fgos dispatch <show-run|inspect|watch|recover|reconcile|decide|execute|log>'`.
- In `src/runner/dispatch/cli.mjs`:
  - Updated `runDispatchCli(argv = process.argv.slice(2), { returnResult = false } = {})`.
  - When `returnResult: true`, sub-verbs `decide`, `execute`, `log`, `fanout-batch`, and `reconcile` return their resolved data object directly and throw errors rather than exiting the process.
- In `bin/fgos.mjs`:
  - Imported `runDispatchCli`.
  - Handled `sub === 'decide' || sub === 'execute' || sub === 'log'` by delegating to `await runDispatchCli(rawArgv, { returnResult: true })`.
  - The returned data object is wrapped in the standard `fgos.v1` output envelope via `wrapEnvelope(data)`.
  - Calling `node src/runner/dispatch.mjs` directly remains an exact backwards-compatibility alias that outputs raw JSON without envelope.
- In `scripts/dispatch-decide-hook.mjs`:
  - Updated the PreToolUse hook message to document: `Run fgos dispatch execute (or node src/runner/dispatch.mjs execute) instead of calling this tool directly`.

### 2.3 R3 — CLI Validation, Aliases & Not-Found Error Categorization
- In `bin/fgos.mjs`:
  - Defined `KNOWN_DISPATCH_SUBVERBS = ['show-run', 'inspect', 'watch', 'recover', 'reconcile', 'decide', 'execute', 'log']`.
  - Validated that `sub` is in `KNOWN_DISPATCH_SUBVERBS` immediately after reading it, throwing a validation error (exit 4) before requiring `runId`.
  - Supported `--run` alias alongside `--run-id` for `show-run`, `watch`, and `recover`: `positional[1] ?? flags['run-id'] ?? flags.run`.
  - Enforced that `reconcile plan` with `--run` or `--assignment` requires `--action`: throws `StoreError('validation', 'dispatch reconcile plan with --run or --assignment requires --action (e.g. collect-result, clear-assignment-claim, or repair-projection)')` (exit 4).
  - Preserved positional `undefined` semantics in `cli.mjs`.
  - Usage string in `cli.mjs` includes both `fanout-batch` and `reconcile`.
- In `src/verbs/dispatch/show-run.mjs` and `src/verbs/dispatch/recover.mjs`:
  - Not-found errors set `this.category = 'precondition'`, which maps to exit code 2 in `bin/fgos.mjs`.
- In `docs/io-contract.md`:
  - Updated Exit 2 (`precondition`) documentation to explicitly include target run not found.

### 2.4 R4 — Watch Settlement
- In `src/verbs/dispatch/show-run.mjs`:
  - `readRunSnapshot(runDir)` computes `settled: fs.existsSync(path.join(dir, 'result.json'))`.
- In `src/verbs/dispatch/watch.mjs`:
  - In `watchRunUseCase`, added check: `if (snapshot.settled) { stoppedBecause = 'terminal'; break; }`.

### 2.5 R5 — `RunObservation` Closed Vocabulary
- In `src/runner/dispatch/runtime-inspection.mjs`:
  - `derivePhase`: returns `'settled'` when `result.json` exists; `'bound'` when command exists; `'launched'` when controller is alive; `'staging'` when run directory exists; else `'unadmitted'`.
  - `deriveDelivery`: maps `'not-sent'` to `'not-started'`.
  - `deriveResourceState`: maps visibility session status (`'running'` -> `'allocated'`, `'settled'`/`'closed'` -> `'released'`, else `'unknown'`).
  - `deriveWorkspaceCompleteness`: returns `'unsupported'` when workspace completeness checks are not supported by the runner layout.

### 2.6 R6 — Doctor and Setup Coherence
- In `src/runner/dispatch/transport.mjs`:
  - Exported `resolveHerdrBin() = process.env.FGOS_HERDR_BIN?.trim() || 'herdr'`.
- In `src/setup/registrations.mjs`:
  - Updated `checkHerdrAvailable` and `defaultHerdrRun` to resolve herdr binary via `resolveHerdrBin()`.
  - Added diagnosis for `FGOS_HERDR_ANCHOR_PANE`: if set and empty/whitespace, reports failure `FGOS_HERDR_ANCHOR_PANE is set but empty`; if set to a pane id, attempts `pane get <id>` check.
- In `docs/specs/distribution.md`:
  - Documented rows 5d and 5e for intentional host-global-only state directories: `~/.fgos/runtime/provider-capacity/` and `~/.local/state/fgos/attestations/`.

### 2.7 R7 — Polling and Backoff Performance
- In `src/runner/dispatch/transport.mjs`:
  - `cliSpawnSupervisorAdapter`: receipt polling interval backs off to 250ms when wait exceeds 1000ms.
- In `src/runner/dispatch/assignment-runner.mjs`:
  - `executeAssignment`: receipt polling interval backs off to 250ms when wait exceeds 1000ms.
- In `src/runner/dispatch/herdr-round.mjs`:
  - Skips `readLiveness` / `paneProcessInfo` while `agentState === 'working'`.
  - Herdr poll interval backs off to 1500ms after `ackSeen`.

### 2.8 R8 — Provider-Family Warning
- In `src/runner/dispatch/config.mjs`:
  - `warnIfProviderFamilyUnreliable`: checks `const allNonCli = Array.isArray(invocations) && invocations.length > 0 && invocations.every((inv) => inv?.via && inv.via !== 'cli');`. If true, returns `false` (warning skipped).

### 2.9 R9 — Registry and Help Truth
- In `src/cli/command-registry.mjs`:
  - Updated `dispatch.parameters.properties.cwd.description` to accurately describe session/worker directory.
  - Updated `dispatch.touchesState` to `'writes run/guard files, never events.jsonl'`.
- In `bin/fgos.mjs`:
  - In `renderHelpText`, updated positional argument rendering: `if (positional.length) lines.push(\` positional: \${positional.join(', ')}\`)`.
  - Renders `positional: sub, run-id` for `dispatch`.

---

## 3. Blast Radius & GitNexus Posture

- **GitNexus Status**: Stale in main checkout (`16a7900` vs `cc687d9`), not present in isolated linked worktree. Per repository instructions, no manual modifications made to main checkout; callers, exports, and imports were verified exhaustively using `grep` and `rg`.
- **Symbol Impact Analysis**:
  - `runDispatchCli`: only caller is `src/runner/dispatch.mjs:108` script guard and the new delegation in `bin/fgos.mjs:2550`. Blast radius is low and strictly bounded.
  - `decideExecutorCli`: callers include `bin/fgos.mjs`, `scripts/dispatch-decide-hook.mjs`, `assignment-runner.mjs`, `cli.mjs`. All additive properties (`reasonCodes`, `blockedReason`) preserve backward compatibility for existing callers.
  - `readRunSnapshot`: called by `show-run.mjs`, `watch.mjs`, `recover.mjs`. Addition of `settled` boolean is additive and strictly non-breaking.
  - `resolveHerdrBin`: used by `transport.mjs` and `setup/registrations.mjs`. Blast radius bounded.
  - `inspectDispatchRuntime`: tested via `dispatch-runtime-inspect.test.mjs` and `dispatch-inspect.test.mjs`.

---

## 4. Verification Evidence

### 4.1 Focused Test Suites

All targeted and blast-radius suites passed cleanly (0 failures):

1. **`test/cli/dispatch-operability.test.mjs`** (NEW - 8 tests, 0 failures):
   - `fgos dispatch decide` returns `fgos.v1` envelope with `reasonCodes`.
   - `node src/runner/dispatch.mjs decide` returns raw JSON without envelope.
   - Unknown dispatch sub-verb rejects before requiring `runId` (exit 4).
   - `--run` alias works on `show-run` and not-found maps to exit 2 (`precondition`).
   - `--run` alias works on `recover` and not-found maps to exit 2 (`precondition`).
   - `dispatch reconcile plan --run` without `--action` exits 4 with actionable validation.
   - `dispatch reconcile plan --assignment` without `--action` exits 4 with actionable validation.
   - `fgos dispatch --help` correctly renders compound positional fields `sub, run-id`.
2. **`test/cli/dispatch-inspect.test.mjs`** & **`test/cli/dispatch-reconcile.test.mjs`**:
   - 6/6 pass on reconcile CLI tests.
   - All inspect selector CLI tests pass.
3. **`test/verbs/dispatch-observe.test.mjs`** (11 tests, 0 failures):
   - Tested `readRunSnapshot` and `watchRunUseCase` with `settled: true` on `result.json` existence.
4. **`test/runner/dispatch-runtime-inspect.test.mjs`** (19 tests, 0 failures):
   - Verified closed vocabulary for `phase`, `delivery`, `resourceState`, `evidenceCompleteness.workspace`.
5. **`test/setup/visibility-checks.test.mjs`** & **`test/setup/*.test.mjs`** (607 tests, 0 failures):
   - Verified `checkHerdrAvailable` with `FGOS_HERDR_BIN` override and `FGOS_HERDR_ANCHOR_PANE` validation.
6. **`test/runner/herdr-*.test.mjs`** (98 tests, 0 failures):
   - All 97 active herdr tests passed (1 skipped by design for live environment).
7. **`test/runner/assignment-dispatch.test.mjs`** (75 tests, 0 failures):
   - All 75 assignment dispatch tests passed.
8. **`test/runner/dispatch.test.mjs`** (387 tests, 0 failures):
   - All 387 dispatch tests passed, including governance distinction tests and provider-family warning tests.
9. **`test/cli/fgos-manifest.test.mjs`** (14 tests, 0 failures):
   - Passed without drift.
10. **`test/rust-host/command-routes.test.mjs`** (14 tests, 0 failures):
    - All 73 command registry selectors appear cleanly; zero route drift.
11. **`test/architecture.test.mjs`** (13 tests, 0 failures):
    - Invariants and layer rules pass.
12. **`git diff --check cc687d92`**:
    - Clean (0 warnings, 0 errors).

---

## 5. Candidate Deliverable Files

The following files constitute the candidate diff against `cc687d92`:

- `src/runner/dispatch/cli.mjs`
- `src/runner/dispatch/assignment-runner.mjs`
- `src/runner/dispatch/transport.mjs`
- `src/runner/dispatch.mjs`
- `src/runner/dispatch/runtime-inspection.mjs`
- `src/runner/dispatch/herdr-round.mjs`
- `src/runner/dispatch/config.mjs`
- `src/cli/command-registry.mjs`
- `bin/fgos.mjs`
- `src/verbs/dispatch/recover.mjs`
- `src/verbs/dispatch/show-run.mjs`
- `src/verbs/dispatch/watch.mjs`
- `src/setup/registrations.mjs`
- `scripts/dispatch-decide-hook.mjs`
- `docs/io-contract.md`
- `docs/specs/distribution.md`
- `CHANGELOG.md`
- `plans/260920-2217-dispatch-engine-hardening/phase-08-operability-cli-doctor.md`
- `plans/260920-2217-dispatch-engine-hardening/plan.md`
- `plans/260920-2217-dispatch-engine-hardening/reports/phase-08-operability-cli-doctor-implementation.md`
- `test/cli/dispatch-operability.test.mjs`
- `test/runner/dispatch.test.mjs`
- `test/runner/dispatch-runtime-inspect.test.mjs`
- `test/setup/visibility-checks.test.mjs`
- `test/verbs/dispatch-observe.test.mjs`

No out-of-scope files or unexpected files were modified. Main checkout was preserved untouched.
Candidate is ready for Track Manager evaluation and verification.
