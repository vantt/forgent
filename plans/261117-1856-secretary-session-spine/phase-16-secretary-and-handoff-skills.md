# Phase 16: Secretary persona, secretary skill and /handoff skill

Status `draft`: the skill texts name the head verb (owner question 1, phase 15).

## Inputs (read first)
- SM-D1, SM-D3, SM-D4, SM-D7, SM-D9, SM-D11, SM-D12 and section 6 "Miu, the front session".
- `core/agents/planner.yaml` (persona shape: `name, version, description, role, persona{voice,style,archetype},
  decision_boundary{can_decide,must_escalate}, rigor, tool-scope, skills`); `personaModelTasteProblem` refuses `tier`/`prefer`.
- Phase 3 rendering (what reaches the session: description, persona, decision boundary, skills line).
- `core/skills/_shared/decision-question.md`, the reader verb from phase 13, `fgos-clarifying` unsure verdict (phase 7),
  `fgos identity mint backlog`, the head verb from phase 15, `rotateHeadSession --now` (phase 14/15).
- Research report §4c (`/handoff` as a skill with `disable-model-invocation: true`; do not reuse `ak-handoff`'s schema).
- `scripts/project-agents.mjs` (projection of `core/agents` into `.claude/agents/*.md`).

## Files this phase may write
`core/agents/secretary.yaml`, `core/skills/fgos-secretary/**`, `core/skills/handoff/**`, `.claude/agents/**` (projection),
`plugins/fgOS/skills/**`, `.agents/skills/**`, `.claude/skills/**` (renders).

## Steps
1. `core/agents/secretary.yaml`: `description` = SM-D7 does, in one paragraph; `decision_boundary.can_decide` = order
   topics, route, create a backlog row, answer status from portfolio files; `must_escalate` = a real tie in order, an
   unclear domain (one line), anything outside the approved frame; never-list as `must_escalate`/description text; no
   model, family or tier; `skills: [fgos-secretary]`. Under 16 KB.
2. `core/skills/fgos-secretary/SKILL.md`: the procedure — clarify domain (unsure -> one line to the owner), backlog row
   per actionable request, route table (status -> portfolio; discussion -> `fgos head start shaper --name <slug>`
   with the domain's shaper or `fgos-shaping`; settled -> planner; ready -> supervisor), ordering by AGENTS.md product
   priority, reports of at most 10 lines with the full report in a file from `fgos convention path --kind report`,
   question batches from the phase 13 reader in the five-part form, peer messages only for decisions. Domain-free:
   no domain's steps.
3. `core/skills/handoff/SKILL.md`: `disable-model-invocation: true`; it runs `fgos head rotate <persona> --name <name> --now`
   for the current head session (persona and name from `FGOS_HEAD_ROLE`), and tells the person what happened. If not a
   head session, it says so and does nothing.
4. `node scripts/project-agents.mjs` and `npm run build:skills`; commit sources and generated files together.

## Verify
- `node --test test/runner/agent-definitions.test.mjs` ("every installed core definition resolves" covers `secretary`;
  the persona-taste refusal test passes, so no model leaked in).
- `npm run build:skills` and `node scripts/project-agents.mjs` leave no diff after the commit; render tests pass.

## Rollback
`git revert` the phase commit; rebuild renders and projections.
