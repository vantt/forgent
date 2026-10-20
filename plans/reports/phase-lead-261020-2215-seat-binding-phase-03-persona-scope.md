# Seat Binding phase 03: persona scope in the loader and agent-definitions

Branch `worktree-agent-a9867440237cda6bf`, merged with `seat-binding-wave` (a287c9d79; one CHANGELOG conflict, both lines kept).

## What changed

- Convention (`packages/convention`): `convention.rules.v1.json` gains identifiers `workflow-name` and `agent-name` and a `definitionFiles` section (`wf.<name>.yaml`, `agent.<name>.yaml`). Rust `rules.rs` reads it (`DefinitionFileRule`, `RuleSet::definition_file`); golden vectors `definitionFileCases` plus new `identifierCases`; `golden.rs` runs them.
- `src/convention/seat-id.mjs` now also holds `definitionNameOf` and `definitionFileName` (JS reader of the same contract entries).
- `src/workflow/loader.mjs`: discovers packaged workflows `<wf>/wf.<wf>.yaml` beside flat files (core and domains), keeps `{sourcePath, workflowDir, owningDomain|null}` from location alone. New exports `loadWorkflowWithSource` and `workflowPersonaScope(id, options)` (null for an unregistered id). One id as packaged and flat is a load error naming both files. `discoverWorkflows` and `loadWorkflow` keep their return shape.
- `src/runner/agent-definitions.mjs`: `resolveAgentDefinition(name, { projectRoot, workflow: { workflowDir, owningDomain } })` reads workspace `fgos/agents`, workflow folder (`agent.<name>.yaml`), owning domain `domains/<d>/agents`, core. A domain persona is visible only to that domain's workflows; a lookup with no workflow (`fgos run --persona`) reads workspace and core only. Result adds `identity` = `<layer>:<dir>/<name>` (layers: workspace, workflow, domain, core) beside `digest`, `tier` (the layer), `source`, `text`.
- Persona files carrying `tier` or `prefer` are refused: `persona-model-taste-not-allowed`, pointing to `capabilities.<cap>.personas.<name>`. Enforced in `shapeProblemOf`, so every reader of the shape check gets it. `rigor` untouched; no seat-choice code reads it.
- Call sites: `run.mjs` (`runUnit` option `personaScope`; the unit persona pin now carries `identity`), `workflow/runner.mjs` (computes the scope once per advance from the workflow id and passes it), `case-start.mjs` (`--seats @name` resolves in the same scope), `seats.mjs` and `unit-handoff.mjs` (persona pins carry `identity`). `fgos agents` listing code and output unchanged (`scanAgentTiers` untouched). `bin/fgos.mjs` untouched.
- CHANGELOG: one line under Unreleased.

## Tests (owning proofs)

- `test/runner/agent-definitions.test.mjs`: adjacent persona shadows only its workflow; another domain / core workflow / no workflow cannot see a domain persona and still resolves core; model taste refused with the pointer; `rigor` allowed; existing cases updated to pass the domain explicitly.
- `test/workflow/workflow-loader-persona-scope.test.mjs` (new): packaged discovery and `owningDomain`; packaged+flat clash; persona scope end to end from a loaded workflow.
- `test/convention/definition-files.test.mjs` (new): shared golden vectors; file name round trip.
- `test/workflow/seats.test.mjs`: persona fixture and expected provenance now carry `identity`.
- Rust: `definition_file_cases_are_the_behavior_source`.

## Verified results (observed)

- `cargo test -p fgos-convention` (private target dir): 10 passed, 3 suites.
- Together in one run: agent-definitions, seat-id, convention-client, definition-files, workflow-loader-persona-scope, architecture: 54 pass, 0 fail (before the seats fixture change).
- `test/workflow/seats.test.mjs` alone: 11 pass, 0 fail (after the fixture change).
- Group `test/workflow/**`, `test/runner/**`, `test/setup/**` (240 files, concurrency 2, env as asked), run before the seats fixture fix: 4217 tests, 4205 pass, 7 fail, 2 cancelled, 3 skipped. The 7 failures:
  - `seats.test.mjs` persona provenance: mine, fixed (rerun 11/11).
  - `conductor-case.test.mjs` "moves past its entry milestone": not mine; fails the same way with `src` and `packages` restored to the track base.
  - `assignment-cwd-mutex-concurrency.test.mjs` (2), `execution/run.test.mjs` (1), `holder-lock-checks.test.mjs` (1), `discussion-workflows.test.mjs` "executes group-cognition end-to-end": timeouts under load (other phases and sessions were running); those four files rerun alone: 113 pass, 0 fail.
  - The group was not rerun whole after the fixture fix.

## Concerns

- The new definition-file readers live in `src/convention/seat-id.mjs`, not a module of their own, because a new `src/` file needs an architecture manifest row and `docs/architecture-manifest.json` belongs to the parallel phase. A later move to its own file is a one-row manifest change.
- Domain personas are no longer visible to `fgos run --persona` or to core workflows. Phase 00 listed no cross-domain use; `domains/marketing/workflows/content-publish.yaml` names persona `brand-guardian`, which exists nowhere (unchanged behavior: the unit renders by name).
- `conductor-case.test.mjs` failure exists on the track base and is outside this phase.
