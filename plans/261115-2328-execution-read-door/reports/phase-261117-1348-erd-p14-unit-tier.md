# Phase 14 report: a registered workflow unit declares the tier it needs

## What changed
- `src/workflow/definition.mjs`: a unit (flat or `template`) of a registered definition may carry `tier`; step and workflow level `tier` stay refused. `rejectInfraFields` takes an allow list.
- `src/workflow/checked.mjs`: the unit tier is checked against the ladder; a `units-file` source is refused it by name.
- `src/workflow/units-source.mjs`, `src/runner/execution/unit-run-start.mjs`: units files, stdin and `fgos run --unit` refuse a unit `tier` (`assertNoUnitTier`, same reason as the seat tier).
- `src/runner/execution/unit.mjs`: `tier` leaves the G2 refusal list; validated against the ladder and kept on the unit (so the unit record replays it).
- `src/runner/execution/seat-resolver.mjs`: `workflowTierOf` = seat tier, else unit tier (`workflow:<id>/<unit>`); `bindSeatOf` uses it for unlisted producer seats too; new `assertNoUnitTier`.
- `src/workflow/steps.mjs`: `unitFieldsOfTemplate` carries `tier` so the runner's unit data has it.
- Docs: `docs/platform/seat-binding/spec.md` 6.1 row, `docs/platform/workflow/spec.md` (line on `tier` khuyến nghị). Census regenerated.
- Crate untouched; no new key besides unit `tier`, no ceiling.

## Retired test -> owner now
None retired. `unit.test.mjs` G2 list and message no longer name `tier` (behaviour moved: unit tier is now accepted and ladder-checked, owned by the new `validateUnit` tier test).

## Gates run (all green)
bind, bind-tier-composition, seat-resolver, unit, definition, core-workflow-seats, units-source, units-runner, run-sync, work-unit-for, seats, workflow-runner-resume/seats, discussion-workflows, playbook-proposer, unit-run-result-contract, unit-run-record, guide-schema, cli/run-verb, git-mutation-census, architecture, doc-health, check-decision-citation-drift; `git-one-door-scan` 0 undeclared. No Rust touched. No full npm test run.

## Left
Nothing in scope. Proposed `## [Unreleased]` line: "A registered workflow definition's unit may declare `tier`, covering every seat the unit runs."

## Unresolved
None.
