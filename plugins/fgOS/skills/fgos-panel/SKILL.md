---
name: fgos-panel
user-invocable: false
description: >-
  Route natural-language requests for a multi-agent panel, independent
  opinions, proposal review, option comparison, debate, or decision red-team
  to an existing registered group-thinking protocol without asking the person
  for a protocol id. Covers architecture, coding-design, product, business,
  strategy, policy/process, and incident-reflection advisory cases. Does not
  implement code; use fgos-code-panel only when the person explicitly requests
  a code change plus review/red-team.
---

# fgos-panel

The natural-language entrypoint for group thinking. The person names the
question and desired thinking shape; this skill selects a use-case preset and
passes its registered protocol id to [`fgos-group-thinking`](../fgos-group-thinking/SKILL.md).

This skill builds on the shared **Generic Driver Discipline**:
[`../_shared/coordination-driver.md`](../_shared/coordination-driver.md) defines
the domain-neutral cycle (`observe -> choose legal action -> dispatch -> verify
evidence -> disposition -> adapt -> explicit close -> continuity artifact`). The
Facade Hook Values table below fills that cycle's 9 hook slots, but governs
**only** Route step 5's own generic-preset path (the one case where this skill
itself observes, dispatches, and dispositions a session across turns) — it does
**not** govern the delegated `architecture-panel` (step 3) or `code-change-panel`
(step 4) routes, each of which keeps its own hook table
([`fgos-architecture-panel`](../fgos-architecture-panel/SKILL.md)'s own;
`fgos-code-panel`'s own). Never assume this one table governs all five routes.

Read the canonical
[`Group Thinking Trigger Surface`](../../../docs/architect/agent-coordination/architecture/group-thinking-trigger-surface.md)
before routing. Its Surface Taxonomy is the only preset map. Do not recreate or
extend that map in this skill.

## Route

1. Extract the subject, any proposal/artifact, supplied options, and material
   scope or risk constraints from the request and current context.
2. Select exactly one preset from the canonical Surface Taxonomy.
3. For `architecture-panel` or architectural `coding-design-panel`, follow
   [`fgos-architecture-panel`](../fgos-architecture-panel/SKILL.md). The person
   still never supplies its protocol id.
4. For `code-change-panel`, continue only when the person explicitly asked to
   implement/change/fix code, then follow
   `fgos-code-panel`. A coding decision, design
   review, or "plugin versus core" question is advisory and must not take this
   route.
5. For other presets, read the selected registered FlowDefinition to learn its
   real actors, operations, gates, and bounds. Fill the person's content into
   the standard declared-protocol request shape, then invoke the unchanged
   `fgos-group-thinking` pack gate with the preset's explicit id.
6. Return the advisory artifact and coordination id. Replay/status remains
   `fgos coordination show <coordinationId> --json`.

## Facade Hook Values (Route Step 5's Generic-Preset Path Only)

| Hook Slot | Value |
|---|---|
| `unit of iteration` | One dispatched session for the single non-architecture, non-code-change preset selected in Route step 2 -- one full pass through the unmodified `fgos-group-thinking` pack gate to a returned advisory artifact and coordination id. |
| `open inputs` | (a) result kind: advisory, never work-product -- this route never implements code (Boundaries). (b) exactly one primary canonical capability, resolved by declaring `DemandFacts` from the extracted request (`outputKind: "decision"`, `domain` from the subject when known or empty, `mutates: false`, `needsIndependentReview` per the selected preset's own collaboration shape, `hasPlanOrTrack: false`, `size`, `rigor`) and calling `fgos capability match --demand '<json>'` (`../_shared/capability-matching.md`) -- following `fgos-plan-loop`'s/Phase 6's own cited pattern of declaring `DemandFacts` and calling the real match door, never a keyword-matched guess. (c) the person's subject, proposal/artifact, supplied options, and material scope/risk constraint (Route step 1), filled into the selected FlowDefinition's declared request shape (Route step 5). |
| `evidence verification` | Read the advisory artifact and coordination id back through `fgos coordination show <coordinationId> --json` (Route step 6); never claim a ranking protocol selected a winner, or that mediated feedback guarantees anonymity or consensus -- report only artifacts the real session produced (Boundaries). |
| `disposition criteria` | None owned by this route. The selected FlowDefinition's own actors, aggregation, and quorum rules govern every finding; this skill never invents protocol semantics, transitions, visibility, grants, reopen, aggregation, or close rules in task prose (Boundaries). |
| `adaptation bounds` | None owned by this route. Bounded entirely by the selected FlowDefinition's own declared `activation`/`maxInvocations` -- this skill asserts no revision or retry limit of its own. |
| `human-escalation triggers` | One concise question only when the subject is absent, a requested review has no accessible proposal/artifact, an explicit comparison has no supplied or discoverable options, a material scope/risk constraint cannot be obtained from evidence, or the only ambiguity is implementation authority (advice only or an actual code change) (Clarify Only Real Missing Input). Never ask for a protocol id, method name, role roster, provider, model, executor, or tier. |
| `close criteria` | The selected FlowDefinition's own close rules, unmodified -- pack membership and FlowDefinition validation remain authoritative (Boundaries). This route asserts no close condition of its own beyond what the door itself reports. |
| `after-close action` | Return the advisory artifact and coordination id to the person (Route step 6). Never turn a coding advisory panel into a parallel implementation executor; never pin a provider, model, executor, or tier (Boundaries). |
| `continuity artifact` | `fgos coordination show <coordinationId> --json`, unmodified -- replay/status remains this one door (Route step 6). |

## Clarify Only Real Missing Input

Do not ask for a protocol id, method name, role roster, provider, model,
executor, tier, or request JSON.

Ask one concise question only if the subject is absent, a requested review has
no accessible proposal/artifact, an explicit comparison has no supplied or
discoverable options, or a material scope/risk constraint cannot be obtained
from evidence. If the only ambiguity is implementation authority, ask whether
the person wants advice only or an actual code change.

## Boundaries

- This is selection and request filling, not a protocol resolver or execution
  engine. Pack membership and FlowDefinition validation remain authoritative.
- Never invent protocol semantics, actors, transitions, visibility, grants,
  reopen, aggregation, quorum, or close rules in task prose.
- Never pin a provider, model, executor, or tier. Dispatch resolves the
  existing `advise` or coding capability through the Dispatch Control Plane.
- Never turn a coding advisory panel into a parallel implementation executor.
- Never claim that a ranking protocol selected a winner or that mediated
  feedback guarantees anonymity or consensus; report only artifacts the real
  session produced.
