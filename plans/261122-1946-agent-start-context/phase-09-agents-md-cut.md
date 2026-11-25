# Phase 9: AGENTS.md cut to the standing sheet (L8)

Slice 3, first half (ASC-D2, ASC-D7). Only fgOS-owned text is affected. The AgentKit, GitNexus and MDView blocks stay
untouched. This is the phase that lowers the always-loaded bytes every CLI reads.

This phase moves no text. ACE phase 5 (plan `261125-1631`) has already moved every hand-written fgOS rule section of
AGENTS.md into an ACE unit with no `when:` restriction, so the rendered block still carries all of them. Here each of
those units gets its L8 verdict: a standing rule keeps no `when:` and stays in AGENTS.md; any other rule gets `when:`
facts and reaches agents only through `compose` at start. Selecting by facts is ASC's (ACE-D2); writing the `when:`
line in a unit is an ordinary rule edit that ACE's write-time check validates (ACE-D5).

## Inputs

- The discussion's `#advice` ("Proposed AGENTS.md split").
- L8, the placement test: `docs/platform/platform-foundations.md:284-306`.
- ACE phase 5's move table (`plans/261125-1631-agent-context-engine/reports/gather-table.md`): which unit holds each
  former AGENTS.md section.
- `reports/before-bytes.md` from phase 4.
- The anchor tests: `test/docs/rul11-anchor-phrase.test.mjs`, `test/docs/rul104-anchor-phrase.test.mjs`,
  `test/docs/agents-doctrine-anchors.test.mjs` and `test/docs/run-doors-doctrine.test.mjs` (ACE phase 5 already
  pointed them at the units).

## Footprint

`AGENTS.md`, `core/instructions/**`, `components/*/instructions/**`, `domains/*/instructions/**`,
`.fgos/instructions/effective/**`, `test/docs/**`.

## Steps

1. Apply the L8 question ("must this rule hold when no workflow is running?") to each unit from the move table, and
   write the verdict in the commit body. Re-read the units on the phase's base first.
2. These stay standing (no `when:`):
   - the mission boundary;
   - the product priority;
   - the laws index;
   - scratch artifacts;
   - destructive cleanup;
   - id minting;
   - the decision-question rule.

   omp and pi read only AGENTS.md, and Codex reads only its first 32 KiB, so the standing sheet must hold on its own
   and stay inside that limit.
3. Give these `when:` facts, without changing their wording:
   - before touching code;
   - the detail of the definition of done;
   - the install/setup/doctor gate;
   - the legacy-Node boundary;
   - dispatch;
   - the gateway;
   - the impact-analysis gate;
   - the RUL11 and RUL104 narratives.

   Rules about the fgOS repo's own code are scoped to project `forgent` if ACE's key registry has a value source for
   it; otherwise to the coding domain. Say in the commit body which was used.
4. Adjust the anchor tests only if a phrase now reaches agents through `compose` instead of AGENTS.md: assert it in
   the composed output for the matching facts. Do not weaken them.
5. Recompile the rule set (`fgos internal context-engine compile`) and regenerate the projection
   (`npm run build:skills`); check that the output is stable.

## Verify

- `fgos internal context-engine check` passes, and `node scripts/run-tests.mjs test/docs test/setup` passes.
- The composer record of a planner head started on this repo lists the scoped units.
- The fgOS-owned AGENTS.md bytes go down, and the whole file is below 32 KiB or the report says why not. Record the
  numbers for phase 11.

## Rollback

Revert the commit. The units lose their `when:` lines, and AGENTS.md carries every rule again.
