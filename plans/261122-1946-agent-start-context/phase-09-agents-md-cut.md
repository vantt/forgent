# Phase 9: AGENTS.md cut to the standing sheet (L8)

Slice 3, first half (ASC-D2, ASC-D7). Only fgOS-owned text moves. The AgentKit, GitNexus and MDView blocks stay
untouched.

## Inputs

- The discussion's `#advice` ("Proposed AGENTS.md split").
- L8, the placement test: `docs/platform/platform-foundations.md` (about lines 284-306).
- `AGENTS.md`, and the projection in `src/setup/instruction-projections.mjs` (about line 330).
- The anchor tests: `test/docs/rul11-anchor-phrase.test.mjs`, `test/docs/rul104-anchor-phrase.test.mjs` and
  `test/docs/agents-doctrine-anchors.test.mjs`.

## Footprint

`AGENTS.md`, `core/instructions/**`, `domains/coding/instructions/**`, `src/setup/instruction-projections.mjs`,
`test/setup/instruction-projections.test.mjs`, `test/docs/**`.

## Steps

1. Apply the L8 question ("must this rule hold when no workflow is running?") to each fgOS-owned section, and write
   the verdict in the commit body.
2. These sections stay as the standing sheet:
   - the mission boundary;
   - the product priority;
   - the laws index;
   - scratch artifacts;
   - destructive cleanup;
   - id minting;
   - the decision-question rule.

   omp and pi read only AGENTS.md, so the sheet must hold on its own.
3. Move the other sections into units with `when:` facts, without changing their wording:
   - before touching code;
   - the detail of the definition of done;
   - the install/setup/doctor gate;
   - the legacy-Node boundary;
   - dispatch;
   - the gateway;
   - the impact-analysis gate;
   - the RUL11 and RUL104 narratives.

   Repo-wide core doctrine goes to `core/instructions/`. Text about the fgOS repo's own code goes to
   `domains/coding/instructions/`, scoped to project `forgent` if the registry has that fact. Otherwise scope it to
   the coding domain, and say in the commit body which one was used.
4. Point the anchor tests at the new location of each anchor phrase. Do not weaken them.
5. Regenerate the projection and check that the output is stable.

## Verify

- `node scripts/run-tests.mjs test/docs test/setup` passes.
- The composer record of a planner head started on this repo lists the moved units.
- The fgOS-owned AGENTS.md bytes go down. Record the number for phase 11.

## Rollback

Revert the commit. AGENTS.md gets its sections back and the units are removed.
