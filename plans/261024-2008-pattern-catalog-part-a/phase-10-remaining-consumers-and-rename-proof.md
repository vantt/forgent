# Phase 10: remaining consumers move to the catalog and the resolved loop; the rename is proven complete

Depends on: 05, 06, 09. Blocks: 12. Effort: 5h. Risk: Medium (behavior of workflow `--seats` and `acceptOutcomes` changes meaning).

Run as (fgos-cook): one slice. Activity `implement-item`, capability `code:implement`, pattern `reviewed` (by hand), rigor `standard`. This phase ends the code changes: after it, `git grep` for the old vocabulary is empty (principle 1, L10, RUL104: no dead paths).

## Context links

- Spec 9.2 (rows: `dry-bind.mjs`, `seats.mjs`, `capability-plan-lint.mjs`, `definition.mjs`), 13.1 (consumers to move), scenario S19.
- Today: `capability-plan-lint.mjs` `KNOWN_PATTERNS` (:58-67, used :500) duplicates the pattern names by hand; `src/workflow/definition.mjs:344,383` compares `template.pattern` with the literal `'reviewed'` (`acceptOutcomes` requires a reviewed template); `src/workflow/seats.mjs:91,159` and `src/workflow/unit-handoff.mjs:185` compare with the literal `'panel'` (a unit counts as a panel only when its pattern is the literal `panel`, documented at `seats.mjs:90`); `src/runner/execution/unit.mjs:132` documents "preset name".
- Layering: `src/workflow/definition.mjs` is `kernel` in `docs/architecture-manifest.json`; it cannot import the domain catalog.

## Requirements

1. `capability-plan-lint.mjs` judges `pattern.unknown` against the effective catalog names (keys of `config.runner.patterns`, which hold the shipped names too), not a private list; `KNOWN_PATTERNS` is deleted.
2. The loop-name literals move to the resolved loop. Default (spec 9.2 followed literally; unresolved question U2 states the alternative of keeping them as loop-name checks): `acceptOutcomes` validity is judged where the one resolution already runs (the `simulateUnitBindings` calls at `src/workflow/case-start.mjs:237` and `src/workflow/runner.mjs:371`; seat expansion is called at `case-start.mjs:209` and the overrides at `runner.mjs:366,387`): a template with `acceptOutcomes` whose resolved loop is not `reviewed` is refused with today's message; `definition.mjs` keeps only the structural check (unique `pass`/`findings`). `--seats` expansion (`seats.mjs:91,159`) and the seat-scoped overrides (`unit-handoff.mjs:185`) take a `loopOf(patternName)` function built from the runner config at their call sites, so a pattern whose loop is `panel` is a panel. A shipped panel that fixes its own seats (`research-fan-out`) is already refused by `expandWorkflowSeats` with the existing "fixes its own seats" message.
3. No identifier named `patternName` that means a loop remains outside `legacy-seat-read.mjs` (the historical decoder keeps old names on purpose); the word "preset" is gone from code comments and messages that mean a pattern; `unit.mjs:132` says "pattern name".
4. S19 proof: no `PRESETS`, `resolvePattern`, `runPattern`, `chosenPattern`, `KNOWN_PATTERNS`, `ALLOWED_PATTERNS_KEYS` or `src/runner/execution/patterns/presets.mjs` anywhere under `src/`, `bin/`, `scripts/`; `unknown-checker-seat` and `research-fan-out-gated` appear only in the retired-key table and the historical decoder; every path in `docs/architecture-manifest.json` for `src/runner/execution/{loops,patterns}` exists and every file there is listed; the census matches the staged files.

## Files (writes)

- `src/report/capability-plan-lint.mjs`, `src/workflow/definition.mjs`, `src/workflow/seats.mjs`, `src/workflow/unit-handoff.mjs`, `src/workflow/case-start.mjs`, `src/workflow/runner.mjs`, `src/runner/execution/unit.mjs` (comment), plus any file the sweep below finds
- Tests: `test/architecture.test.mjs` (owning proof for S19; add the vocabulary assertions), `test/report/capability-plan-lint.test.mjs` and `test/cli/plan-lint.test.mjs` (lint), `test/workflow/units-runner.test.mjs` and `test/workflow/workflow-runner.test.mjs` (the only tests that mention `acceptOutcomes`; they own the moved refusal), plus the seats tests found with `git grep -ln "expandWorkflowSeats\|seatedPanelUnits" -- test`
- `docs/architecture-manifest.json`, `packages/git/contracts/mutation-census.v1.json`

## Steps

1. Sweep: `git grep -n "patternName\|preset\|Preset\|KNOWN_PATTERNS\|resolvePattern\|PRESETS" -- src bin scripts`; list every hit in the notebook; each is moved, renamed or justified (the decoder).
2. Move the lint list; move the two workflow checks with their tests (the test of the `acceptOutcomes` refusal moves with it: name the new owner in the commit, e.g. the `workflow-runner` or `units-runner` proof; the behavior is kept).
3. Verify the three literal comparisons against their callers: `git grep -n "expandWorkflowSeats\|unitOverridesOf\|seatedPanelUnits" -- src` and pass the loop function where a runner config is in reach; where it is not (kernel code), keep structural checks only.
4. Add the S19 assertions.
5. Census, manifest.

## Verify

`node scripts/run-tests.mjs test/architecture.test.mjs test/workflow/units-runner.test.mjs test/workflow/workflow-runner.test.mjs test/workflow/architecture-advisory-workflow.test.mjs test/workflow/business-discussion-workflow.test.mjs test/setup/seat-binding-dry-bind.test.mjs` plus `test/report/capability-plan-lint.test.mjs` and `test/cli/plan-lint.test.mjs`. Then, sequentially: `npm test`.

## Risks and mitigations

| Risk | L x I | Mitigation |
|---|---|---|
| `--seats` now expands a unit whose pattern name resolves to panel, which it did not before | M x M | the only shipped such name has fixed seats and is refused with the existing message; if the owner meant the name-literal rule, phase 10 step 3 reverts to loop-name checks (U2) |
| moving the `acceptOutcomes` check from load time to start time changes when an author sees the error | M x L | same message; start-time dry-bind runs in doctor too (`checkSeatBindingDryBind`) |
| a sweep hit is a real consumer missed earlier | L x M | the S19 assertions fail the build |

## Rollback

Revert; the literal comparisons return, the old vocabulary assertions disappear.

## Acceptance (owned here)

S19 in `test/architecture.test.mjs`; the retired and moved tests named in the commit.
