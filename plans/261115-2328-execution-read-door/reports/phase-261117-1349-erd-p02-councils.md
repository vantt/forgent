# Councils move to the `council` domain

## What changed
- `git mv` of the seven council workflows from `core/workflows/` to `domains/council/workflows/`; `core/workflows/` is gone (empty). Workflow ids unchanged. The `# core/workflows/...` header comments in five of them now name the new path.
- `domains/council/AGENTS.md` added (doctrine paragraph). No `registry.yaml`, no `compiled.json`; the Work domain set is unchanged.
- `docs/architecture-manifest.json`: `council` added to the `domains` list. Needed: the instruction registry refuses a domain directory that is not a known owner (`UNKNOWN_OWNER`, seen when running `npm run build:skills`). Only the `domains` list changed, no `doors` row.
- References updated: 3 skill sources (`fgos-advise` x2, `fgos-group-thinking`), their two render surfaces (`.agents/skills`, `plugins/fgOS/skills`, via `npm run build:skills`), 13 docs (architecture-advisory playbooks, workflow spec, seat-binding spec, runner architecture, how-tos, distillery matrix, reading map, vision, unit-run-result contract), 3 tests.
- Mutation census regenerated.
- Left alone: `plans/`, `archive/`, `CHANGELOG.md` history; the loader's `core/workflows` constant (project override directory, other files may still live there in a project root).

## Retired test -> owner now
None retired. Test edits: `discussion-workflows`, `core-workflow-seats`, `playbook-observable-order` read the new directory. New proof: `discussion-workflows.test.mjs` "the seven councils ship in the council domain..." (owningDomain `council`, source path, no `registry.yaml`). The Work domain set assertion already exists in `test/state/domain-registry.test.mjs` ("DOMAINS has exactly four entries") and passes unchanged, so no second copy was added.

## Gates (one file per run)
Pass: discussion-workflows 7, core-workflow-seats 8, playbook-observable-order 3, domain-registry 31, domain-dirs 6, architecture 71, git-mutation-census 1 (after regenerating), doc-health 8 (after removing two dead `core/workflows` references), check-decision-citation-drift 33, seat-binding-dry-bind 25 (doctor row unchanged), workflow-loader-catalog 4, workflow-loader-persona-scope 4, yaml-parse-failures 6. `git-one-door-scan`: 0 undeclared sites. Not run: `fgos workflow` live listing (covered by the loader test above), full `npm test`, cargo (no Rust touched).

## Persona lookup
Council personas remain in `core/agents`; `advisor` is still unresolved as before (F7), unchanged by this move.

## Unresolved
- Q1 name default `council` used; a later answer is a rename (directory, manifest entry, one test).
- Proposed `## [Unreleased]` line: "Council workflows now ship in the `council` domain; ids and `fgos workflow start <name>` are unchanged."
