# HARDEN T9 P20: one Execution outcome module

Date 2026-11-12, lead for P20 on fg-server2. Branch `harden/t9-p20-outcome-module`.

## Result

`src/runner/execution/outcome.mjs` (`git mv` of `outcome-exit.mjs`, no second file) now holds the closed seat-outcome table with its classes, `NOT_STARTED_OUTCOME`, `UNDETERMINED_OUTCOME`, `ERROR_OUTCOMES`, the predicates `isVerdict`, `isInfrastructure`, `rebindsOnResume`, `infrastructure(unitResult)`, `outcomeClass`, and the exit-code table with `exitCodeForOutcome`. Contract text: unit-run-result sections 3 and 5 (code agrees with both; no stop needed).

- Copies: step 1 diffed the nine copies (5 `VALID_OUTCOMES`, 4 `ERROR_OUTCOMES`): all identical, same order. `rg "(VALID|ERROR)_OUTCOMES = " src` now finds only the module (plus the unrelated attestation-store set P22 renames).
- Imports: `loops/{solo,reviewed,debate,panel,index,history-outcome}`, `unit-summary.mjs` (also lost its own `UNDETERMINED_OUTCOME`; no other importer), `run.mjs` (`seatStateOf` calls `rebindsOnResume`; the two `'not-started'` literals use `NOT_STARTED_OUTCOME`), `verb-exit.mjs`, `bin/fgos.mjs` comment, tests.
- Behaviour: `rebindsOnResume` = today's list exactly (`execution-failure`, `policy-refusal`, `provider-limit`, `blocked`). Unknown or missing outcome is class null, never a verdict.
- `partial-writes` kept in the exit table: no producer of it as an outcome (only a `fallbackExhausted`/`retryStopped` reason, the seat ends `provider-limit`), but `fgos` help text (`command-registry.mjs`), CHANGELOG and the help test promise exit 12. Named in the module as a reserved code, not an outcome.
- `refused` stays Workflow's, named in the module comment as not an Execution outcome. `infrastructure()` therefore does not count `result.refused` as a verdict the way Workflow's `isRerunnable` does; P09 must carry that when it switches Workflow.
- Layer: module is `domain` in the architecture manifest (imports `isVerdictResult` from `legacy-seat-read.mjs`, also domain; `unit-summary` is infra above it). Manifest row renamed.
- Tests: the closed-table proof moved from `loops/index.test.mjs` to `test/cli/execution-outcome-exit-codes.test.mjs` (the module's owning test), which also gained the class and predicate proofs. `solo.test.mjs` imports the table from the module. No other test retired.
- Work code: none touched.
- Net Node (src+bin): +97 -107 = -10 (planned -40: the module also carries the new classes and predicates the loops did not have); tests +50 -12.

## Verification

- Focused (loops, unit-summary, exit codes, verb-exit, help, architecture, doc-health, decision drift, loop-rununit, provider-failover): 243 pass, 0 fail after rebase on `ed7a7993b`.
- Full `npm test` before the last rebase: 8761 tests, 3 fail. (1) doc-health dead reference in COOK's contract: red on origin/main too, fixed on main by `ed7a7993b`. (2) V7n addendum, known red. (3) orphan sweep in `mailbox-live-confined.test.mjs`, known load flake, 19/19 pass alone. No run-tests ERROR lines.
- One-door census regenerated with `--write-census` (rebase conflict resolved by regeneration), 0 undeclared.

## Authority

- Outcome table, classes, rerun predicates: Execution `outcome.mjs`, one owner now. Rust `run-result::derive_outcome` stays the category authority beneath.
- Still held in two layers: Workflow `isRerunnable` / `INFRASTRUCTURE_OUTCOMES` (`src/workflow/store.mjs:262-264`) duplicates `infrastructure()`. Belongs in Execution; P09 switches it (owns store.mjs).
- Workflow's `refused` is Workflow's acceptance value; stays there.
- `src/runner/execution/unit-state.mjs:44` still spells `'unknown'`/`'undetermined'` as literals; outside this phase's files, mechanical to switch when that file is next touched.

## Lessons

- Layer direction in `architecture-manifest.json` runs kernel < domain < infra < use-case < entry; I first retiered the wrong way. Read the `layers` array before placing a shared module.
- A rebase on top of a census-touching lane conflicts on `mutation-census.v1.json`; regenerate with the scan instead of merging, as the rule says.
- A backgrounded `( ... ) &` inside the Bash tool returns at once; wait with a loop on the log's own `done-` marker, not on the notification.
