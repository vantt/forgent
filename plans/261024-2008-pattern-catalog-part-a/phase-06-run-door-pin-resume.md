# Phase 06: the run door resolves once, pins, and resumes on the pin

Depends on: 05 (and 03, 04). Blocks: 07, 08, 09. Effort: 10h. Risk: High (the run door, the record format, resume of in-flight units).

Run as (fgos-cook): two slices. 6a fresh-run resolution, pin write, selector conflict, verify refusal, old-door deletion. 6b resume on the pin, the record-read path, the fence, the summary. Activity `implement-item`, capability `code:implement`, pattern `reviewed` (by hand), rigor `high`, writes `run.mjs` in both (serial). Verify below, then the full gates at the end.

## Context links

- Spec sections 6, 7.2, 8.5, 10 (pin, consumers, resume), 11 item 5 (`verify-command-unsupported`), 13.1, scenarios S1, S3, S4 (wiring), S11, S15, S16 (wiring), S17, S20.
- Today: `run.mjs` `chosenPattern` :366, `declaredOperationOf` :288-319, fresh path resolution :703 and admission proposal :716-733, record write :766-773 (`seatSchema: 1`, `pattern: options.pattern ?? unit.pattern ?? 'solo'`), resume read :621-654, pattern pick :1442-1445, `runPattern` call :1460, fence :211-224 and `KNOWN_SEAT_SCHEMA = 1`, proof `test/runner/execution/run.test.mjs:731-738`.
- `legacy-seat-read.mjs` is "the one read path for records written before seats existed" (header); it gains the schema-1 decoder. `dry-bind.mjs:67` calls `runPattern(unit.pattern || 'solo', ...)` and loses the caller's `--pattern`; `run.mjs:421` copies it into the unit as a workaround.
- The unit summary is read by a Rust validator that checks only required fields and ignores extras, with `pattern` a nullable string (`packages/run-result/rust/src/unit_summary.rs:73-106`; contract `packages/run-result/contracts/unit-summary.read.v2.json`, `UNIT_SUMMARY_CONTRACT` version 2 at `unit-summary.mjs:17`): the optional `collaboration` summary field is therefore additive and the contract version stays 2; `pattern` stays the catalog name.
- Refusal surface convention: `RunnerConfigError(msg, { code, phase: 'pre-admission' })` (`run.mjs:415`).

## Requirements

1. **One resolution.** A fresh run calls `resolveCollaboration` once, before `port.admit`, with `callerObject` = `options.pattern` when an object, `callerString` = `options.pattern` when a string, `unit.pattern`, `options.activityUnit`, `options.request`, `inCase` = a case is named, `reason` = `caseRef.reason`, the live runner config, `shippedCatalog()` and `catalogLayersOf(mainRoot)` (phase 03; skipped when `options.runnerConfig` is injected). `CollaborationError` and `SeatResolutionError` from it are rethrown as `RunnerConfigError` with the same `code` and `phase: 'pre-admission'`, so nothing is reserved when it refuses. `chosenPattern` is deleted; the declared-operation check, the admission proposal (`pattern` = `effective.loop`, `seatLaunches` = `launchBound`), the door-choices dry bind and the run itself all read the result.
2. **The pin** (`collaboration`, spec section 10) is written on the unit record with `pattern.digest` = sha256 hex of `canonicalJson` of the merged entry, and `seatSchema: 2`. `KNOWN_SEAT_SCHEMA` becomes 2 (the new release resumes 1 and 2); a schema-1 host refuses a schema-2 record by the existing fence. `record.pattern` is the chosen name, display only. `snapshotRunnerConfig` already covers `patterns` and `loops` (phase 03).
3. **Consumers of the pin** (spec section 10 table): loop execution receives `effective.loop` and `effective.params`; the `maxRounds` readers take them (no re-expansion, no config read in a loop); `declaredSeatsOf` in `seat-resolver.mjs` reads only `params.seats` (the resolver slots `unit.seats` there), raw `unit.seats` is never re-read.
4. **Loop dispatch.** `loops/index.mjs` exports `runLoop(effective, unit, cfg, hooks)`; `runPattern`, `resolvePattern` and `PRESETS` re-exports are deleted. `dry-bind.mjs` takes an optional pre-resolved `collaboration` and otherwise resolves from `unit.pattern` (object or string) through the same function, so doctor, `workflow start` and `dispatch decide` see what a run sees.
5. **`verify-command-unsupported`**: a Unit-explicit `verify` (Unit file or `--verify`) on a loop with no verify checkpoint (`panel`, `debate`) refuses before admission; a capability-level `verify` on those loops is not refused and the unit reports `verify: { ran: false, reason }` as today. The loop capability is a table next to `PARAMS` (`solo` and `reviewed` run verify; `panel` and `debate` do not).
6. **Resume** uses the pin only. A record with no `collaboration` (every in-flight unit at upgrade) resumes through `collaborationOfRecord(record, { shipped })` in `legacy-seat-read.mjs`: the stored selector decodes to a catalog name (`consult`, `rfc`, `code-change`, `research-fan-out` keep their names; `research-fan-out-gated` maps to `research-fan-out`), the record's config snapshot `patterns.reviewed.*` is read as loop tuning, the shipped catalog supplies the pattern defaults, and the record's stored `seats` are the seats. It also returns the runner view the loops must run on: the snapshot runner with `patterns.reviewed` presented as `loops.reviewed`, because the loops resolve seats again from their `cfg` and a snapshot in the old shape would silently drop a tuned `checkersByRigor` (the standard sets `critical` to reviewer, red-team, tester; the code fallback has no tester). This function is the single record-read path for stored history, is pure (data passed in) and never reads live config. A pin that cannot be read, or names an unregistered pattern or loop, refuses `collaboration-pin-unusable`. Resume takes no new params and ignores a caller `--pattern` (as today).
7. `unit-summary.mjs` shows the pin when present (loop, effective params, both provenance dimensions) and nothing new when absent, so summaries of older records keep their bytes.
8. `legacy-seat-read.mjs` `isVerifyResult` and the `verif(y|ier)` regexes stay (history readers); the reserved ids make a worker-chosen id unable to match.
9. Old paths deleted in this phase: `src/runner/execution/patterns/presets.mjs`, `test/runner/execution/patterns/presets.test.mjs` (behavior owner now `catalog.test.mjs`; the roleUnit/`rfc` text cases move to `loops/role-tasks.test.mjs` if not already owned), `chosenPattern`, `runPattern`, the `resolvePattern` imports in `run.mjs`, `unit-summary.mjs`, `legacy-seat-read.mjs`, `loops/index.mjs`, and the two temporary adapters phase 04 left in `run.mjs`.

## Files (writes)

6a:
- `src/runner/execution/run.mjs`, `src/runner/execution/dry-bind.mjs`, `src/runner/execution/seat-resolver.mjs`, `src/runner/execution/loops/index.mjs`, `src/runner/execution/loops/{solo,reviewed,panel,debate}.mjs` (verify-capability table; drop any remaining config read)
- Delete `src/runner/execution/patterns/presets.mjs`, `test/runner/execution/patterns/presets.test.mjs`
- `src/workflow/runner.mjs` (:371) and `src/workflow/case-start.mjs` (:237), `src/setup/seat-binding-checks.mjs` (:87), `src/setup/blind-steps-proven-pools.mjs` (:119): callers of `simulateUnitBindings`; the signature stays compatible, so edit only if a test shows otherwise
- Tests: `test/runner/execution/run.test.mjs` (S3, S15, resolution surface), `test/runner/execution/run-case-admission.test.mjs` (S1, S16 wiring, S17, reason reaches the `route` event), `test/setup/seat-binding-dry-bind.test.mjs` (S4 wiring), `test/runner/execution/loops/{index,debate}.test.mjs` (`runPattern` to `runLoop`), `test/runner/driver-rununit.test.mjs` (S20 stays; `:265`, `:449`)
6b:
- `src/runner/execution/run.mjs`, `src/runner/execution/legacy-seat-read.mjs`, `src/runner/execution/unit-summary.mjs`
- Tests: `test/runner/execution/run.test.mjs` (extend the fence proof at `:731-738`: the "newer release" value becomes 3; add the pin cases), `test/runner/execution/legacy-seat-read.test.mjs` (owns the decoder), `test/runner/execution/unit-summary.test.mjs` (pin shown; older record bytes unchanged), `test/runner/execution/run-resume-order.test.mjs` (check)
- `docs/architecture-manifest.json`, `packages/git/contracts/mutation-census.v1.json` (regenerate)
- Re-grep for the full list before slicing: `git grep -n "resolvePattern\|runPattern\|chosenPattern\|PRESETS" -- src bin test`.

## Steps

1. 6a: wire the resolution; build the pin object; thread `effective` to the three places the old `patternName` went; replace `declaredOperationOf`'s `resolvePattern` with the effective loop.
2. 6a tests (plain-word titles, no decision codes):
   - S1 a `--case --activity` dispatch with no selector runs the activity's `unit` and the pin shows `baseline.source: 'activity'` and provenance (non-coding workflow fixture local to the test; the file already has case fixtures); S17 solo-shaped `seats` with no `pattern` on a `reviewed` activity refuses `seat-multiplicity`; `--pattern solo` with `--reason` runs and the pin records the swap; the same swap without `--reason` refuses `request-reason-required`.
   - S3 two explicit selectors naming different patterns refuse `selector-conflict` before admission and reserve nothing; same name or one selector runs.
   - S15 capability-level `verify` on panel is neither run nor refused; Unit-explicit `verify` on panel refuses `verify-command-unsupported`.
   - S16 wiring: a request whose effective params exceed `seatLaunchesPerDispatch` refuses `seat-launch-ceiling-exceeded` at admission (the owner is the existing `test/workflow/case-admission.test.mjs`; this is its one wiring proof).
   - A case-named request reason reaches `proposal.reason` and the `route` event.
3. 6b: resume paths; the decoder; fence 2; the summary.
4. 6b tests: S11 a pinned unit keeps its effective meaning after a catalog and config edit; an unreadable pin refuses `collaboration-pin-unusable`; a schema-1 host (the test writes `seatSchema: 3` for "newer") refuses; an unpinned schema-1 record resumes through the decoder (snapshot `patterns.reviewed.maxRounds` read as tuning, stored `research-fan-out-gated` runs as `research-fan-out`, and a critical-rigor record whose snapshot lists `tester` resumes with the `tester` seat).
5. Delete the old door as listed; `git grep` for the four symbols is empty; census, manifest.
6. End-of-phase: merge `origin/main`, full gates.

## Verify

- 6a: `node scripts/run-tests.mjs test/runner/execution/run.test.mjs test/runner/execution/run-case-admission.test.mjs test/setup/seat-binding-dry-bind.test.mjs test/runner/execution/loops/index.test.mjs test/runner/execution/loops/debate.test.mjs test/runner/driver-rununit.test.mjs test/workflow/case-admission.test.mjs test/workflow/workflow-runner.test.mjs test/architecture.test.mjs`
- 6b: `node scripts/run-tests.mjs test/runner/execution/run.test.mjs test/runner/execution/legacy-seat-read.test.mjs test/runner/execution/unit-summary.test.mjs test/runner/execution/run-resume-order.test.mjs`
- End of phase, sequentially: `npm test`, then `cargo test --workspace --no-fail-fast` (the run door is shared and the addon is staged; no Rust file changed, but the bundle did in phase 03). Known unrelated reds: fgctl-upgrade, fgctl-init-download-sources, dev-host concurrent-consumers, holder_lock_gate_passes, killed_move_repairs.

## Risks and mitigations

| Risk | L x I | Mitigation |
|---|---|---|
| `--case --activity` without a selector now runs the activity's unit, launches more seats, can newly refuse (census 9.2) | H x M | by design; the escape is `--pattern solo --reason`; the skill text is corrected in phase 11 |
| an in-flight schema-1 unit resumes differently from before | M x H | the decoder reproduces schema 1 meaning from the record only; test with a stored `research-fan-out-gated` and a snapshot with `patterns.reviewed.maxRounds: 3`; reversal condition in spec 13.2 item 5 |
| the digest diverges from loop code after a release | L x M | `collaboration-pin-unusable` on unregistered loop; the pin, not the digest, drives execution |
| `run.mjs` is a hot file (1,600 lines): merge conflicts with other lanes | M x M | merge `origin/main` at phase start and end; the board file-collision row for the runner lane is read and updated at landing (AGENTS.md) |
| a worker run in the case reads a half-edited run door | L x H | the conductor runs slices serially in one worktree; tests run at every slice end |
| a summary consumer chokes on the new optional field | L x M | the Rust reader ignores extras (cited above); `unit-summary.test.mjs` keeps the older-record bytes golden |
| dry-bind regression: doctor and `workflow start` refuse a shipped workflow | M x M | `test/setup/seat-binding-dry-bind.test.mjs` plus the shipped-workflow doctor row; the activity-unit doctor check is phase 09 |

## Rollback

Revert 6b then 6a. A unit created by 6a carries `seatSchema: 2` and is refused by the older host; for local use before landing, delete such records (`.fgos/assignments/<id>`) in the case worktree only. Nothing has landed on main until phase 12.

## Acceptance (owned here)

S1, S3, S11, S15, S17 and the S4 and S16 wiring proofs, S20 kept (`test/runner/driver-rununit.test.mjs:265,449`). Retired tests and their new owners: `presets.test.mjs` to `catalog.test.mjs` (resolution) and `loops/role-tasks.test.mjs` (role text); `loops/index.test.mjs` `runPattern` cases to `runLoop` in the same file.
