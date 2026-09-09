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
   [`fgos-code-panel`](../fgos-code-panel/SKILL.md). A coding decision, design
   review, or "plugin versus core" question is advisory and must not take this
   route.
5. For other presets, read the selected registered FlowDefinition to learn its
   real actors, operations, gates, and bounds. Fill the person's content into
   the standard declared-protocol request shape, then invoke the unchanged
   `fgos-group-thinking` pack gate with the preset's explicit id.
6. Return the advisory artifact and coordination id. Replay/status remains
   `fgos coordination show <coordinationId> --json`.

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
