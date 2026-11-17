# Phase 5: Docs and CHANGELOG

## Inputs (read first)
- `docs/reading-map.md` (names the area specs: run-result contract `docs/platform/runner/contracts/unit-run-result.md`; run supervisor `docs/platform/run-supervisor/spec.md`, which already names `dispatch inspect`, `unitState`, `attemptState`).
- `plan.md` here (shape of `verify`, view contract) and phases 1 to 3 as merged (read the code, not only the plan).
- `CHANGELOG.md` `## [Unreleased]`.

## Files this phase may write
`docs/platform/runner/contracts/unit-run-result.md`, `docs/platform/run-supervisor/spec.md`, `CHANGELOG.md` (this phase is the only
writer of `CHANGELOG.md` in the plan). Depends on phases 1, 2, 3 merged; reads phase 4's flag names from the registry.

## Steps
1. `unit-run-result.md`: in the field table, row `verify` states the two shapes, where each is stored (`unit.json` `settlement`, `unit-summary` v3 optional key, the `fgos run` result), "the last verify wins", "absent key in a summary means not recorded"; correct line 7 ("unit-summary stays version 2" is stale: v3 stores the infrastructure facts and the verify record). Add the decision (verify stored at unit level, not in `assignment-run-result`, and why) to its decision-history section if it has one, else to the section the contract keeps for settled facts.
2. `run-supervisor/spec.md`: where it says `dispatch inspect`, `dispatch show-run` and `fgos run --json` name the state (~line 260), add one sentence and one table row for `fgos dispatch inspect --attention --since <T>` (what it lists, that it reads only, that the deadline and idle rows come from the supervisor's records as phase 3's scout found).
3. `CHANGELOG.md` `[Unreleased]`, two lines in the file's voice: a run that ran verify keeps the command, exit, pass or fail and duration in its record; `fgos dispatch inspect --attention --since <time>` lists the runs that need a person across every worktree, one line each with the reason and next command.
4. Check every claim against the code (`rg` the field names; run the two commands) and every link in the touched sections.

## Verify
- `node --test test/scripts/doc-health.test.mjs` passes.
- `rg -n "attention" docs/platform/run-supervisor/spec.md CHANGELOG.md` shows the new text; `rg -n "stays version 2" docs/platform/runner/contracts/unit-run-result.md` finds nothing.

## Rollback
`git revert` the phase commit.
