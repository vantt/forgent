# HARDEN T9 P07: the Unit run settles one final outcome with the `unit-run-result` facts

Branch `harden/t9-p07-unit-run-result-fields`, from origin/main `d66e89d3c`. Contract text: `docs/platform/runner/contracts/unit-run-result.md` at `d66e89d3c` (code and text agree on every field written; the gaps are listed below).

## What changed

- **Scope rule down.** `applyScopeRule` and `finishUnit` in `src/runner/execution/run.mjs` run before the unit record settles; `foldUnitOutcome`, `outOfScopeWrites`, `workflowChangedPaths` and the Workflow-side `unit.json` read are deleted from `src/workflow/unit-handoff.mjs`; `runner.mjs` records what Execution handed up. `rg "foldUnitOutcome|outOfScopeWrites" src test bin` finds nothing. `fgos run` (case, standalone, Work) now refuses a pass that wrote outside its scope.
- **Rule and derivations in the outcome module** (`outcome.mjs`): `outcomeAfterScopeRule`, `evaluationsOf`, next to `infrastructure()`. `NOT_STARTED_OUTCOME` gets exit code 11 so a refunded run exits as before.
- **Branch-level check** beside the resume check in `unit-run-start.mjs`: option `branchBase { branch, baseSha, outOfScopeOnBranch }` of `runUnit` (validated before admission, recorded in `unit.json`, a resume reads it back; the base Unit's inherited paths are an input, so the Playbook runner reads nothing from `unit.json`). `runner.mjs` passes it, the recovery re-run passes its new branch.
- **Fields at the settle site** (`data` of `runUnit`): `outcome` final, `infrastructure`, `outOfScope`, `outOfScopeOnBranch`, `evaluations[]`, `started {value, reason}`, `launches {ceiling, used, ceilingHit}`, `settled {unit, case, settleError?}`, `warnings[] {code, message}`; per attempt `infrastructure` (boolean) and `runResult.activity {turns, toolUses, transcriptPath}`. The verify seat's reason moved from `infrastructure: 'timeout'` to `infrastructure: true` plus `infrastructureReason` (two assertions in `run-verify-pin.test.mjs` follow).
- **Port settle shape**: `admission.port.settle` carries `contract: { id: 'unit-run-result', version: 1 }` and the Unit shape (`UNIT_RUN_RESULT_CONTRACT`, typedef `UnitRunSettle` in `case-admission-port.mjs`), plus the flat `results`, `seatLaunchesUsed`, `frameExhausted` Workflow still reads until P09.
- **Report read**: `reportDigest(unitRunId, seat, mainRoot)` in `handoff-refs.mjs` returns `{ path, bytes, sha256 }`. `digestUnitRunReports` (`ref-digests.mjs`) and `approvedReportDigests` (`unit-handoff.mjs`) call it; both Workflow hash copies of report bytes are gone.
- **Fixtures**: ten golden files `packages/run-result/contracts/fixtures/unit-result.<id>.v1.json` (pass, findings, findings-out-of-scope, execution-failure, policy-refusal, provider-limit, blocked, not-started, undetermined, crash-recovered) with a README; owners `test/runner/execution/unit-run-result-fixtures.test.mjs` (Node) and `packages/run-result/rust/tests/unit_result_fixtures.rs` (Rust: each attempt's outcome agrees with `derive_outcome`). Two real-run tests compare the facts of a run with the golden `pass` and `findings-out-of-scope`.
- Contract §8 now links the fixtures folder. RunResult stays version 3, `unit-summary` stays version 2 (decided in the contract).

## Behaviour changes a reader will see

1. A pass that wrote outside its scope is `findings` for everyone: `fgos run --case`, standalone runs and Work's fan-out (`fanout-batch.mjs` reads `unit.outcome`; `work-dispatch.mjs` reads the seat outcome first and is unchanged). CHANGELOG line added.
2. A run none of whose seats got its brief is `not-started` in `data.outcome` (was `execution-failure`), the same value the case reservation already settled with; `started.value` false, exit code 11 as before.
3. Out-of-scope paths now also come from the recorded attempts in `unit.json` (not only this run's results), so a resumed run keeps what the first controller reported.
4. A known out-of-scope path wins over a check that cannot run (findings, not execution-failure); a check that cannot run on a clean unit stays infrastructure.

## Gate

Focused: `run-case-admission`, `run-summary-resume`, `run-brief-not-delivered`, `run-verify-pin`, `handoff-refs`, `unit-run-result-fixtures`, `operation-choice`, `test/workflow/*`, `test/runner/execution/*`, `test/cli/execution-outcome-exit-codes`, architecture, doc-health, decision-citation-drift; census scan 0 undeclared (regenerated with `--write-census`); `cargo fmt --all --check`, `clippy -p fgos-run-result --all-targets -D warnings`, `cargo test -p fgos-run-result --test unit_result_fixtures`, `cargo check --all-targets` for `x86_64-pc-windows-msvc` and `aarch64-apple-darwin`. Full `npm test`: see the final lines of this report.

Two things found only by the full suite: the settled RunResult is frozen with accessors (`status`, `confidence`), so `activity` is added on a descriptor-preserving copy (`withActivity` in `run.mjs`; `unfrozenCopy` in `assignment-runner.mjs` does the same and stays private, a follow-up could share it); a spread copy broke ten Work operation tests.

## Tests

Retired: `test/workflow/unit-handoff.test.mjs` "write check cannot run" (now owned by `run-case-admission.test.mjs`, same assertions plus the settle). Changed because behaviour changed: `run-summary-resume.test.mjs` (two cases: the unit with a path outside the scope ends findings; the resume case's foreign and signal files are out of scope), `run-brief-not-delivered.test.mjs` (`not-started`), `run-verify-pin.test.mjs` (`infrastructureReason`). Workflow keeps its end-to-end wiring proofs in `units-runner.test.mjs` (stray file, inherited writer).

## Gaps against the contract (nothing silently invented)

- `activity.turns` and `activity.toolUses` have no source today and read `null`; `transcriptPath` is read from `steps/finalize-home.json` (null for confined claude until the seat store lands).
- Attempt `output { report, claim, complete, incompleteReason }` is not written: `complete` must be declared by the adapter that wrote the report (Dispatch adapters, outside this phase). `reportDigest` is the read it will use.
- `binding.family`, provenance-label single-writer and `durationMs`/`usage` fill are other phases.
- `not-started` as `data.outcome` is my reading of "the refund is already applied" (section 3); COOK should confirm.
- The fixture `crash-recovered` is a resumed run (failed seat bound again, run passes); the reason code written when Workflow's hold releases a dead reservation as `not-started` (`case-runtime.mjs`) is Workflow's and was not given a name here.
- The case gate (`case-gate.mjs`) still settles through the port with its own small payload (no Unit shape): P09/P23.
- The contract's "Today" column and the area spec are stale for the fields now written (DOC/COOK, P16).

## Authority

- The rule "writing outside the declared writes is not a pass" and the final outcome were held in Workflow (`foldUnitOutcome`); now in Execution's outcome module, applied before settle. Done.
- Infrastructure rerun list: Workflow still holds `INFRASTRUCTURE_OUTCOMES`/`isRerunnable` in `store.mjs` (P09 reads `infrastructure` instead; `unit.complete` already carries the final outcome and `outOfScope` it needs).
- `receiptsFromResults` (Workflow) still decides which results are verdicts; `evaluations[]` is now the Execution answer, P09 switches it.
- Report bytes were hashed by Workflow twice; the one read is Execution's `reportDigest`. `digestSubject`/`digestContextRefs` stay Workflow's (subject facts).
- `unit-state.mjs:44` still spells `'unknown'`/`'undetermined'`; not touched (the settle path does not read it).

## Lessons

- A behaviour move that makes a rule apply to every caller breaks tests that pinned the old gap; reading each failing assertion against the rule first (three here) was faster than treating them as regressions.
- The Work layer reads `unit.outcome` in two places with different precedence; a grep for `\.outcome` over `src/runner/*.mjs` before the move found both in a minute.
- Briefs should say whether "final outcome" includes the refund; the contract's "Today" column describes a gap in the same sentence, which reads both ways.
