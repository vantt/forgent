# Phase 3: One persona door for head sessions

## Inputs (read first)
- `src/runner/agent-definitions.mjs` (`resolveAgentDefinition` l.252, `projectPersona` l.136, `PERSONA_KEYS` l.123,
  `BOUNDARY_KEYS` l.124, `readAgentDefinition` returns `skills` l.117 but nothing renders it).
- `src/runner/dispatch/assignment.mjs` `renderPersonaSection` (l.641, not exported; pinned text wins at l.650; called l.758, l.770).
- `src/runner/execution/unit-run-start.mjs` `unitPersonaPin` (l.42) for the pin shape `{name, digest, text, identity}`.
- `plan.md` "Persona protocol vs rendered sections"; SM-D10 in the discussion.
- `test/runner/agent-definitions.test.mjs` (owning tests of the door).

## Files this phase may write
`src/runner/agent-definitions.mjs`, `src/runner/dispatch/assignment.mjs`, `test/runner/agent-definitions.test.mjs`,
`test/runner/assignment.test.mjs` (today's owner of the persona-section cases, l.156-190 and l.502).

## Steps
1. Find whether the worker brief already renders a skills section (`rg -n "skills" src/runner/dispatch/assignment.mjs src/runner/execution`).
   Record the answer in the commit body.
2. Move the persona-section rendering into the agent-definitions door as one exported function
   `renderPersonaSection(personaRef, { projectRoot, workflow, pinnedText })` (same output bytes as today), and make
   `assignment.mjs` call it; delete its private copy (one door, L10).
3. Add `pinPersona(name, { projectRoot, workflow })` returning the same `{name, digest, text, identity}` shape
   `unitPersonaPin` returns, by reusing `resolveAgentDefinition`; leave `unitPersonaPin` calling it if that removes a
   duplicate, otherwise leave it as is.
<!-- Updated: Validation Session 1 - no brief skills section exists; the skills line goes in the one shared section -->
   Validation found none: `rg -n "kills" src/runner/dispatch/assignment.mjs` hits only workflow-op `skills` (l.294, 425,
   962), never a rendered section; personas already declare `skills:` (`core/agents/planner.yaml:20` and six others).
4. Skills: if step 1 found a brief skills section, export it from the same door and render a persona's `skills:` through
   it; if not, add `skills` to the projected persona and render it as one line `Skills to load: a, b` (the smallest
   extension; justified because without it the secretary protocol skill never reaches the session). The line is part
   of the one shared section, so worker briefs with a persona gain it too (SM-D10: "exactly as a worker brief does");
   name this worker-brief change in the commit body and run the brief tests below.
5. Move the render cases of `test/runner/assignment.test.mjs` to the door's test, keep one brief-wiring case there
   (principle 8), and name the new owner in the commit body. One owning test in `test/runner/agent-definitions.test.mjs`: "a head session and a worker brief render the same
   persona section for the same persona", plus the skills line case. Do not add a second test elsewhere.

## Verify
- `node --test test/runner/agent-definitions.test.mjs` passes.
- `node --test test/cli/run-verb.test.mjs test/workflow/workflow-runner-seats.test.mjs` pass (existing persona consumers; no edit).
- `rg -n "function renderPersonaSection" src` finds exactly one definition.

## Rollback
`git revert` the phase commit.
