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
| **R2** | Production CLI door & envelope wrapping | **Satisfied** | Registered `fgos dispatch decide\|execute\|log` in `src/cli/command-registry.mjs` with `touchesState: true`, `externalEffect: true` (`[write+external]`). Delegating to `runDispatchCli` in `bin/fgos.mjs`, wrapped in `fgos.v1` envelope on success, preserving `{ error, errorClass }` and exit code 1 on dispatch failure. Retained `node src/runner/dispatch.mjs` as raw JSON compatibility alias. Updated `AGENTS.md` and `scripts/dispatch-decide-hook.mjs`. |
| **R3** | CLI validation, aliases & error categorization | **Satisfied** | Added `--run` alias for `--run-id` on `show-run`, `watch`, `recover`. Standardized run not-found errors to categorized exit code 2 (`precondition`) in `show-run.mjs` and `recover.mjs`, documented in `docs/io-contract.md`. Validated unknown sub-verb before requiring `runId` (exit 4). Added validation that `reconcile plan --run/--assignment` without `--action` exits 4 with actionable message. Preserved positional `undefined` semantics. Usage includes `fanout-batch` and `reconcile`. |
| **R4** | Watch settlement & corrupt evidence handling | **Satisfied** | `readRunSnapshot` in `src/verbs/dispatch/show-run.mjs` validates `result.json` via `interpretRunResult`; flags `settled: false`, `resultCorrupt: true` if missing, empty, invalid JSON, `{}`, or a directory. `watchRunUseCase` in `src/verbs/dispatch/watch.mjs` terminates with `stoppedBecause: 'terminal'` when `snapshot.settled` is true, or with `stoppedBecause: 'corrupt-evidence'` when `snapshot.resultCorrupt` is true or run is terminal with corrupt evidence. |
| **R5** | `RunObservation` closed vocabulary | **Satisfied** | Aligned `RunObservation` vocabulary to fact-grounded closed contract status sets in `src/runner/dispatch/runtime-inspection.mjs`: `phase` strictly in `[admitted, launched, bound, delivered, settled, unknown]` (`result.json` valid -> `settled`; active controller commands -> `bound`; controller alive -> `launched`; run status running -> `admitted`; run status settled without valid result -> `unknown`), `delivery` maps `not-sent` -> `not-started`, `resourceState` checks visibility session status freshness (<60s) for `live-proven` (otherwise `ambiguous`; absence proof unsupported maps to `ambiguous`), `evidenceCompleteness.resource` uses `stale` (when ambiguous), `missing` (when unobserved), or `complete`/`unsupported` (never `incomplete`), and `evidenceCompleteness.result` uses `corrupt` when terminal evidence is corrupt. |
| **R6** | Doctor & setup coherence | **Satisfied** | Updated `checkHerdrAvailable` in `src/setup/registrations.mjs` to resolve binary via `resolveHerdrBin()` (`process.env.FGOS_HERDR_BIN?.trim() || 'herdr'`). Added diagnosis of `FGOS_HERDR_ANCHOR_PANE`: fails closed (`passed: false`) if empty, whitespace, or fails resolution via `pane get`. Normalized anchor pane trimming between transport and doctor. Documented intentional host-global state directories (`~/.fgos/runtime/provider-capacity/` and `~/.local/state/fgos/attestations/`) in `docs/specs/distribution.md` (rows 5d and 5e). |
| **R7** | Polling & backoff performance | **Satisfied** | Replaced flat 250ms polling backoff with event-driven `fs.watch` on `receiptsDir` backed by 20ms fallback polling in `transport.mjs` and `assignment-runner.mjs`. Herdr round polling in `herdr-round.mjs` backs off to 1500ms after ack, and skips `paneProcessInfo` while status is `working`. Verified via $n=40$ benchmark: median 31ms, p95 40ms (exceeds p95 $\le$ base + 100ms threshold). |
| **R8** | Provider-family warning condition | **Satisfied** | `warnIfProviderFamilyUnreliable` in `src/runner/dispatch/config.mjs` skips warning when all declared executor invocations are non-CLI (`invocations.every(inv => inv.via !== 'cli')`). |
| **R9** | Registry & rendered help synchronization | **Satisfied** | Updated `command-registry.mjs`: accurate `cwd` description, `touchesState: true`, `externalEffect: true` with documentation comment describing execution vs inspect/show-run. Updated `renderHelpText` in `bin/fgos.mjs` to render all positional arguments (`positional: sub, run-id`). Help displays `[write+external]`. |

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
  - Set `touchesState: true`, `externalEffect: true`, rendering `[write+external]`.
  - Updated `invoke` to `'fgos dispatch <show-run|inspect|watch|recover|reconcile|decide|execute|log>'`.
- In `src/runner/dispatch/cli.mjs`:
  - Updated `runDispatchCli(argv = process.argv.slice(2), { returnResult = false } = {})`.
  - When `returnResult: true`, sub-verbs `decide`, `execute`, `log`, `fanout-batch`, and `reconcile` return their resolved data object directly and throw errors rather than exiting the process.
  - Attached `err.errorClass = err.errorClass || 'dispatch-error'` when throwing during `execute`.
- In `bin/fgos.mjs`:
  - Imported `runDispatchCli`.
  - Handled `sub === 'decide' || sub === 'execute' || sub === 'log'` by delegating to `await runDispatchCli(rawArgv, { returnResult: true })`.
  - The returned data object is wrapped in the standard `fgos.v1` output envelope via `wrapEnvelope(data)`.
  - If a dispatch failure throws, catches and writes `{ error, errorClass }` directly to stdout, exiting with code 1, exactly preserving the compatibility door contract (`node src/runner/dispatch.mjs execute`). Set `err.isDispatchExecute` to ensure exit 1 across all execute failures (L3).
  - Calling `node src/runner/dispatch.mjs` directly remains an exact backwards-compatibility alias that outputs raw JSON without envelope.
- In `AGENTS.md` and `scripts/dispatch-decide-hook.mjs`:
  - Documented `fgos dispatch execute` alongside `node src/runner/dispatch.mjs execute`.

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

### 2.4 R4 — Watch Settlement & Result Interpretation
- In `src/verbs/dispatch/show-run.mjs`:
  - `readRunSnapshot(runDir)` validates `result.json` through `interpretRunResult(resultFile)`.
  - If missing, or if empty, directory, invalid JSON, `{}`, or corrupt contract, sets `settled: false`, `resultCorrupt: true`.
- In `src/runner/dispatch/run-result.mjs`:
  - In `interpretRunResult`, checks if `!rawObj.contract && !rawObj.status && !rawObj.runId` and returns `contract-corrupt` with `corrupt: true`.
- In `src/verbs/dispatch/watch.mjs`:
  - In `watchRunUseCase`: terminates with `stoppedBecause: 'terminal'` when `snapshot.settled` is true; terminates with `stoppedBecause: 'corrupt-evidence'` when `snapshot.resultCorrupt` is true or run is terminal with corrupt evidence; terminates with `stoppedBecause: 'terminal'` when run status is in `TERMINAL_RUN_STATUSES`. Does not hang without `--ticks`.

### 2.5 R5 — `RunObservation` Closed Vocabulary
- In `src/runner/dispatch/runtime-inspection.mjs`:
  - `derivePhase`: returns `'settled'` only when valid `result.json` exists without corruption; `'bound'` when active controller commands exist; `'launched'` when controller is alive; `'admitted'` when `run.status === 'running'`; `'unknown'` when `run.status === 'settled'` without valid result. Closed vocabulary: `['admitted', 'launched', 'bound', 'delivered', 'settled', 'unknown']`.
  - `deriveDelivery`: maps `'not-sent'` to `'not-started'`.
  - `deriveResourceState`: checks visibility session status freshness (<60s) for `'live-proven'`, otherwise `'ambiguous'`. Absence proof unsupported maps to `'ambiguous'`.
  - `evidenceCompleteness`: maps resource completeness to `'stale'` when ambiguous, `'missing'` when unobserved, and `'complete'` when observed and live/dead proven. Maps result completeness to `'corrupt'` when `terminal.corrupt` is true. Emits `'unsupported'` for workspace completeness when unsupported. All values strictly adhere to `['complete', 'missing', 'stale', 'corrupt', 'conflicting', 'unsupported']`.

### 2.6 R6 — Doctor and Setup Coherence
- In `src/runner/dispatch/transport.mjs`:
  - Exported `resolveHerdrBin() = process.env.FGOS_HERDR_BIN?.trim() || 'herdr'`.
  - Normalized anchor pane trimming: `process.env.FGOS_HERDR_ANCHOR_PANE?.trim() || undefined`.
- In `src/setup/registrations.mjs`:
  - Updated `checkHerdrAvailable` and `defaultHerdrRun` to resolve herdr binary via `resolveHerdrBin()`.
  - Added diagnosis for `FGOS_HERDR_ANCHOR_PANE`: fails closed (`passed: false`) if empty, whitespace, or if `pane get <id>` fails resolution.
- In `docs/specs/distribution.md`:
  - Documented rows 5d and 5e for intentional host-global-only state directories: `~/.fgos/runtime/provider-capacity/` and `~/.local/state/fgos/attestations/`.

### 2.7 R7 — Polling and Backoff Performance
- In `src/runner/dispatch/transport.mjs` and `src/runner/dispatch/assignment-runner.mjs`:
  - Replaced 250ms polling delay with event-driven `fs.watch` on `receiptsDir` with a 20ms fallback timer.
  - When receipt is written, file change triggers immediate loop continuation, eliminating polling latency while maintaining low CPU overhead.
  - Verified with 40-trial latency benchmark:
    - Base (`cc687d92`): median 26ms, p95 46ms.
    - Candidate with event-driven polling: median 31ms, p95 40ms.
    - Result: $\Delta\text{median} = +5\text{ms}$, $\Delta\text{p95} = -6\text{ms}$ vs base, well below the 100ms regression threshold.
- In `src/runner/dispatch/herdr-round.mjs`:
  - Skips `readLiveness` / `paneProcessInfo` while `agentState === 'working'`.
  - Herdr poll interval backs off to 1500ms after `ackSeen`.

### 2.8 R8 — Provider-Family Warning
- In `src/runner/dispatch/config.mjs`:
  - `warnIfProviderFamilyUnreliable`: checks `const allNonCli = Array.isArray(invocations) && invocations.length > 0 && invocations.every((inv) => inv?.via && inv.via !== 'cli');`. If true, returns `false` (warning skipped).

### 2.9 R9 — Registry and Help Truth
- In `src/cli/command-registry.mjs`:
  - Updated `dispatch.parameters.properties.cwd.description` to accurately describe session/worker directory.
  - Updated `dispatch.touchesState: true`, `dispatch.externalEffect: true`, with documentation comment explaining writes to run/guard directories.
- In `bin/fgos.mjs`:
  - In `renderHelpText`, updated positional argument rendering: `if (positional.length) lines.push(\`  positional: \${positional.join(', ')}\`)`.
  - Renders `fgos dispatch <show-run|inspect|watch|recover|reconcile|decide|execute|log> [runId] [write+external]`.

---

## 3. Blast Radius & GitNexus Posture

- **GitNexus Status**: Stale in main checkout (`16a7900` vs `cc687d9`), not present in isolated linked worktree. Per repository instructions, no manual modifications made to main checkout; callers, exports, and imports were verified exhaustively using `grep` and `rg`.
- **Symbol Impact Analysis**:
  - `runDispatchCli`: only caller is `src/runner/dispatch.mjs:108` script guard and the new delegation in `bin/fgos.mjs:2550`. Blast radius is low and strictly bounded.
  - `decideExecutorCli`: callers include `bin/fgos.mjs`, `scripts/dispatch-decide-hook.mjs`, `assignment-runner.mjs`, `cli.mjs`. All additive properties (`reasonCodes`, `blockedReason`) preserve backward compatibility for existing callers.
  - `readRunSnapshot`: called by `show-run.mjs`, `watch.mjs`, `recover.mjs`. Uses `interpretRunResult` to ensure validation agreement across all dispatch readers.
  - `interpretRunResult`: called by `show-run.mjs`, `runtime-inspection.mjs`, `session-engine.mjs`, `assignment-runner.mjs`. Rejects vacuous `{}` as `contract-corrupt`.
  - `resolveHerdrBin`: used by `transport.mjs` and `setup/registrations.mjs`. Blast radius bounded.
  - `inspectDispatchRuntime`: tested via `dispatch-runtime-inspect.test.mjs` and `dispatch-inspect.test.mjs`.

---

## 4. Verification Evidence

### 4.1 Focused Test Suites

All targeted and blast-radius suites passed cleanly (0 failures):

1. **`test/cli/dispatch-operability.test.mjs`** (NEW - 11 tests, 0 failures):
   - `fgos dispatch decide` returns `fgos.v1` envelope with `reasonCodes`.
   - `node src/runner/dispatch.mjs decide` returns raw JSON without envelope.
   - Unknown dispatch sub-verb rejects before requiring `runId` (exit 4).
   - `--run` alias works on `show-run` and not-found maps to exit 2 (`precondition`).
   - `--run` alias works on `recover` and not-found maps to exit 2 (`precondition`).
   - `dispatch reconcile plan --run` without `--action` exits 4 with actionable validation.
   - `dispatch reconcile plan --assignment` without `--action` exits 4 with actionable validation.
   - `fgos dispatch --help` correctly renders compound positional fields `sub, run-id`.
   - `fgos dispatch` registry entry has `touchesState: true` and `externalEffect: true`, rendering `[write+external]`.
   - `fgos dispatch execute` preserves `{ error, errorClass }` payload and exit code 1 identically to `node src/runner/dispatch.mjs execute`.
   - `fgos dispatch execute` and `node src/runner/dispatch.mjs execute` exit 1 on all execute errors (L3).
2. **`test/cli/dispatch-inspect.test.mjs`** & **`test/cli/dispatch-reconcile.test.mjs`**:
   - 6/6 pass on reconcile CLI tests.
   - All inspect selector CLI tests pass.
3. **`test/verbs/dispatch-observe.test.mjs`** (12 tests, 0 failures):
   - Tested `readRunSnapshot` and `watchRunUseCase` for all 5 probe cases without `--ticks`:
     1. Chưa có (absent) -> watch continues without premature termination.
     2. Hợp lệ (valid) -> watch terminates immediately with `stoppedBecause: 'terminal'`, `settled: true`.
     3. Hỏng (invalid JSON) -> watch terminates with `stoppedBecause: 'corrupt-evidence'`, `settled: false`.
     4. {} (empty object) -> watch terminates with `stoppedBecause: 'corrupt-evidence'`, `settled: false`.
     5. Status terminal kèm result hỏng -> watch terminates with `stoppedBecause: 'corrupt-evidence'`, `settled: false`.
     6. Directory result.json -> watch terminates with `stoppedBecause: 'corrupt-evidence'`, `settled: false`.
4. **`test/runner/dispatch-runtime-inspect.test.mjs`** (19 tests, 0 failures):
   - Verified closed vocabulary for `phase` (`['admitted', 'launched', 'bound', 'delivered', 'settled', 'unknown']`).
   - Tested `evidenceCompleteness.resource` uses `stale` when ambiguous (never `incomplete`).
   - Tested `evidenceCompleteness.result` uses `corrupt` when terminal evidence is corrupt.
5. **`test/setup/visibility-checks.test.mjs`** & **`test/setup/*.test.mjs`** (608 tests, 0 failures):
   - Verified `checkHerdrAvailable` with `FGOS_HERDR_BIN` override and `FGOS_HERDR_ANCHOR_PANE` validation.
   - Verified fail-closed behavior when anchor pane cannot be resolved (`pane get` fails).
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

### 4.2 Latency Benchmark Measurement & Reproducibility (R7 / L4)

- **Benchmark Method**: 40 iterations executing an assignment via `executeAssignment` with a worker shell script sleeping 1100ms:
```javascript
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { executeAssignment } from './src/runner/dispatch/assignment-runner.mjs';

const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-bench-'));
const workerScript = path.join(workDir, 'worker.sh');
fs.writeFileSync(workerScript, '#!/bin/sh\nsleep 1.1\nexit 0\n', { mode: 0o755 });

const latencies = [];
for (let i = 0; i < 40; i++) {
  const asgnId = `asgn_bench_${i}`;
  const t0 = Date.now();
  // executeAssignment creates assignment, spawns worker, waits for supervisor receipt, returns
  await executeAssignment({
    assignmentId: asgnId,
    repoRoot: workDir,
    executor: {
      id: 'bench-exec',
      adapter: 'cli-spawn-supervisor',
      command: workerScript,
    },
  });
  const elapsed = Date.now() - t0;
  latencies.push(elapsed - 1100);
}
latencies.sort((a, b) => a - b);
const median = latencies[Math.floor(latencies.length / 2)];
const p95 = latencies[Math.floor(latencies.length * 0.95)];
console.log(JSON.stringify({ n: latencies.length, median, p95, min: latencies[0], max: latencies.at(-1) }));
```
- **Results**:
  - Baseline `cc687d92`: median 26ms, p95 46ms.
  - Candidate (event-driven `fs.watch` + 20ms fallback): median 31ms, p95 40ms ($n=40$).
  - Delta vs Base: $\Delta\text{median} = +5\text{ms}$, $\Delta\text{p95} = -6\text{ms}$.
  - Meets threshold of p95 latency $\le \text{base} + 100\text{ms}$.

---

## 5. Review Findings Resolution (F1–F8, N1–N3, L1–L4)

| Finding | Severity | Resolution Summary |
|---|---|---|
| **F1** | HIGH (R7) | Latency regression resolved by implementing event-driven `fs.watch` on `receiptsDir` backed by 20ms fallback polling in `transport.mjs` and `assignment-runner.mjs`. p95 latency reduced from 246ms to 40ms. |
| **F2** | HIGH (R9/R2) | `src/cli/command-registry.mjs`: set `touchesState: true`, `externalEffect: true`, rendering `[write+external]`. Documented writes to run/guard directories. |
| **F3** | MEDIUM (R5) | Fact-based `RunObservation`: verified freshness (<60s) for `live-proven`; mapped unsupported absence proof to `ambiguous`. |
| **F4** | MEDIUM (R4) | Corrupt/empty/directory `result.json` sets `settled: false`, `resultCorrupt: true`. |
| **F5** | MEDIUM (R6) | Doctor check `herdr-available` fails closed (`passed: false`) if anchor pane fails `pane get`. Normalized whitespace trimming across transport and doctor. |
| **F6** | MEDIUM (R2) | Preserved `{ error, errorClass }` payload on stdout and exit code 1 on dispatch failure across `fgos dispatch execute` and `node src/runner/dispatch.mjs execute`. |
| **F7** | MEDIUM | Updated `AGENTS.md` §Dispatch in worktree; updated `plan.md` Phase 08 status. |
| **F8** | LOW | Verified clean diff with `git diff --check cc687d92`. |
| **N1** | MEDIUM (R5) | Removed `running` from `VALID_PHASES`, mapped `status: 'running'` to `admitted`; removed `incomplete` from `evidenceCompleteness.resource`, mapping to `stale`; set `evidenceCompleteness.result` to `corrupt` when terminal evidence is corrupt. Tested in `dispatch-runtime-inspect.test.mjs`. |
| **N2** | MEDIUM (R4) | In `watch.mjs`, terminates with `stoppedBecause: 'corrupt-evidence'` on corrupt evidence (including terminal run with corrupt result), without hanging or reporting settled. Tested in `dispatch-observe.test.mjs`. |
| **N3** | MEDIUM (R4) | `show-run.mjs` and `runtime-inspection.mjs` agree via `interpretRunResult`; vacuous `{}` without contract, status, or runId is treated as `contract-corrupt` with `settled: false`, `resultCorrupt: true`. Tested in `dispatch-observe.test.mjs`. |
| **L1** | LOW | Updated Unit I07 status in `plans/260919-coordination-skill-harness-simplification/plan.md` to `implemented / ready for independent review`. |
| **L2** | LOW | Cleaned up internal plan references from comments in `config.mjs` and `CHANGELOG.md`. |
| **L3** | LOW | Tracked `err.isDispatchExecute` in `bin/fgos.mjs` so all dispatch execute errors exit 1 identically to compatibility door. Tested in `dispatch-operability.test.mjs`. |
| **L4** | LOW | Documented exact reproducible benchmark script and methodology in this report. |

---

## 6. Candidate Deliverable Files

The following files constitute the candidate diff against `cc687d92`:

- `AGENTS.md`
- `bin/fgos.mjs`
- `CHANGELOG.md`
- `docs/io-contract.md`
- `docs/specs/distribution.md`
- `plans/260919-coordination-skill-harness-simplification/plan.md`
- `plans/260920-2217-dispatch-engine-hardening/phase-08-operability-cli-doctor.md`
- `plans/260920-2217-dispatch-engine-hardening/plan.md`
- `plans/260920-2217-dispatch-engine-hardening/reports/phase-08-operability-cli-doctor-implementation.md`
- `scripts/dispatch-decide-hook.mjs`
- `src/cli/command-registry.mjs`
- `src/runner/dispatch/assignment-runner.mjs`
- `src/runner/dispatch/cli.mjs`
- `src/runner/dispatch/config.mjs`
- `src/runner/dispatch/herdr-round.mjs`
- `src/runner/dispatch/run-result.mjs`
- `src/runner/dispatch/runtime-inspection.mjs`
- `src/runner/dispatch/transport.mjs`
- `src/runner/dispatch.mjs`
- `src/setup/registrations.mjs`
- `src/verbs/dispatch/recover.mjs`
- `src/verbs/dispatch/show-run.mjs`
- `src/verbs/dispatch/watch.mjs`
- `test/cli/dispatch-operability.test.mjs`
- `test/runner/dispatch-runtime-inspect.test.mjs`
- `test/runner/dispatch.test.mjs`
- `test/setup/visibility-checks.test.mjs`
- `test/verbs/dispatch-observe.test.mjs`

No out-of-scope files or unexpected files were modified. Main checkout was preserved untouched.
Candidate is ready for Track Manager re-review and verification.
