# Doctor check: blind steps use proven pools, 2026-10-05

## What the check does

`blind-steps-use-proven-pools` (`src/setup/blind-steps-proven-pools.mjs`, registered in `src/setup/registrations.mjs`). For every Workflow unit with `blind: true` (core and domain workflows, found by the same loader as `workflow-pools-satisfy-independence`, which now exports `loadWorkflowDefinitions`), it:

1. gets the pattern's roles from `simulateUnitBindings()` (the runner's own pattern code, bind-only role runner);
2. for each role walks every candidate the capability pool could bind by calling the runner's own `bind()` with `blind: true`, again and again with `skipCandidateIndex` (the same walk a quota fallback takes), once with a herdr session and once without, since that decides which invocation a candidate takes;
3. classifies each candidate as (provider family from `deriveProviderFamily`, transport `herdr`|`cli` from the invocation's adapter, confinement backend) and reports each one not in the table.

No pool resolution is reimplemented. Read-only, no model call, never throws (unloadable config, missing yaml, per-unit errors become a passing note or a named problem). With no blind unit: passes, "not applicable". Failure message names workflow/step/unit, executor, invocation, family, transport, and the fix: remove the executor from the capability's prefer pool for the blind step, or run the blind canary for that pair and add a row to `BLIND_PROVEN_PAIRS`.

A candidate bind() itself refuses for a blind role (in-process, no confined invocation for the posture) is not a candidate and is not reported here.

## Allow-list and evidence

`BLIND_PROVEN_PAIRS` in the same module, one table, extendable by adding a row:

| Family (as bind derives it) | Transport | Backend | Canary executor / invocation |
|---|---|---|---|
| claude | herdr | bwrap | claude-herdr / claude-herdr-bwrap |
| openai | herdr | bwrap | openai / codex-herdr-fgovn |
| openai | cli | bwrap | openai / codex-cli-bwrap |
| xai | herdr | bwrap | xai / pi-herdr-vantt |
| z-ai (glm) | cli | bwrap | glm / pi-cli-bwrap-openrouter |
| deepseek | cli | bwrap | deepseek / pi-cli-bwrap-openrouter |

Evidence: `plans/reports/read-confinement-slice-2-261005.md`, canary table. agy (gemini) is absent: its herdr invocation fails with or without blind, its cli run was inconclusive on a provider quota. Note glm's family in config is `z-ai` (its `providerModel`), so the row uses that. A proven family on a transport not in the table (for example xai through cli) is reported; this is stricter than "family proven" on purpose, since the canary proved pairs.

## Results

- This repo (`/home/vantt/projects/forgentX`): pass, 4 blind units (delphi propose-round-1 and -2, nominal-group generate-ideas, group-cognition sense-making-panel). `delphi:propose`, `nominal-group:generate` and `group-cognition:explore` have no prefer pool in this repo's config, so there is nothing that could bind and the pass is vacuous here. architecture-advisory and business-discussion are not blind and are not evaluated (their pools include gemini).
- `/home/vantt/projects/mdview` (read-only, no `--fix`): pass, 4 blind units. Here `nominal-group:generate` has a real pool (claude-herdr, xai via pi-herdr-vantt, openai, glm via pi-cli-bwrap-openrouter), all proven pairs. `delphi:propose` and `group-cognition:explore` have no pool.

Both were run through the registered check function (`DOCTOR_CHECKS` entry) rather than the full `fgos doctor`, to avoid running unrelated checks.

## Tests

`test/setup/blind-steps-proven-pools-check.test.mjs` (hermetic fixture configs, temp package root and project dir): registration, table content (exactly the six pairs, no gemini), not applicable with no blind unit, proven-only pool passes, gemini in pool fails naming executor, invocation and the fix, proven family on an unproven transport fails, unconfined invocation is not reported, bare-verb capability pool, unloadable config passes with a note, registered check runs against shipped workflows. `test/setup/checks.test.mjs` registry list updated. Narrow run green: `test/architecture.test.mjs`, `test/setup/checks.test.mjs`, the new file and `workflow-pool-independence-check.test.mjs` (148 tests). Full suite and the rest of `test/setup` not run (the directory form of `node --test` is unsupported here and the sandbox refused a glob).

## Files

New: `src/setup/blind-steps-proven-pools.mjs`, `test/setup/blind-steps-proven-pools-check.test.mjs`. Changed: `src/setup/registrations.mjs`, `src/setup/workflow-pool-independence.mjs` (one `export`), `test/setup/checks.test.mjs`, `docs/specs/distribution.md`, `docs/how-to/install-fgos-in-a-project-and-use-doctor.md`, `docs/architecture-manifest.json`, `CHANGELOG.md`. No component-boundary change.

Status: DONE
