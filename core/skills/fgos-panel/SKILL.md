---
name: fgos-panel
user-invocable: false
description: >-
  Route natural-language requests for a multi-agent panel, independent
  opinions, proposal review, option comparison, debate, or decision red-team
  to a registered discussion Workflow (`delphi`, `nominal-group`,
  `group-cognition`, `architecture-advisory`) or collaboration pattern preset
  (`rfc`, `consult`, `research-fan-out`) without asking the person for a
  protocol id. Covers architecture, coding-design, product, business,
  strategy, policy/process, and incident-reflection advisory cases. Does not
  implement code; use fgos-run only when the person explicitly requests
  a code change plus review/red-team.
---

# fgos-panel

The natural-language entrypoint for group thinking. The person names the
question and desired thinking shape; this skill selects a use-case preset and
routes it to the corresponding named Workflow (`core/workflows/*.yaml`) or
CollaborationPattern preset (`src/runner/execution/patterns/presets.mjs`).
This skill builds on the shared **Generic Driver Discipline**:
[`../_shared/coordination-driver.md`](../_shared/coordination-driver.md) defines
the domain-neutral cycle (`observe -> choose legal action -> dispatch -> verify
evidence -> disposition -> adapt -> explicit close -> continuity artifact`). The
Facade Hook Values table below fills that cycle's 9 hook slots, but governs
**only** Route step 5's own generic-preset path (the one case where this skill
itself observes and dispatches a session across turns — disposition and
adaptation bounds are never this route's own, per the `disposition criteria`/
`adaptation bounds` rows below) — it does **not** govern the delegated
`architecture-panel` (step 3) route, which keeps its own hook table
([`fgos-architecture-panel`](../fgos-architecture-panel/SKILL.md)'s own). The
delegated `code-change-panel` (step 4) route delegates execution to
`fgos-run`. Never assume this one table governs all five routes.

Read the canonical
[`Group Thinking Trigger Surface`](../../../docs/architect/agent-coordination/architecture/group-thinking-trigger-surface.md)
before routing. Its Surface Taxonomy is the only preset map. Do not recreate or
extend that map in this skill.

## Route

1. Extract the subject, any proposal/artifact, supplied options, and material
   scope or risk constraints from the request and current context.
2. Select exactly one preset from the canonical Surface Taxonomy:
   - `architecture-panel` or architectural `coding-design-panel` -> Workflow
     `architecture-advisory` (follow [`fgos-architecture-panel`](../fgos-architecture-panel/SKILL.md)
     or run `fgos workflow start architecture-advisory`).
   - `independent-feedback` / `reflection-review` -> Workflow `delphi`
     (`fgos workflow start delphi`).
   - `option-comparison` / `strategy-options` -> Workflow `nominal-group`
     (`fgos workflow start nominal-group`).
   - `group-cognition` / complex dialectical sense-making -> Workflow
     `group-cognition` (`fgos workflow start group-cognition`).
   - `proposal-review` / `business-review` -> preset `rfc` (pattern `reviewed`,
     1 critique round with red-team).
   - `consult` -> preset `consult` (pattern `solo`, role `advisor`).
   - `research-fan-out` -> preset `research-fan-out` (pattern `panel`, 3 members).
   - `code-change-panel` -> follow `fgos-run`.
3. For `architecture-panel`, follow [`fgos-architecture-panel`](../fgos-architecture-panel/SKILL.md).
4. For `code-change-panel`, continue only when the person explicitly asked to
   implement/change/fix code, then follow `fgos-run`. A coding decision,
   design review, or "plugin versus core" question is advisory and must not take
   this route.
5. For discussion workflows (`delphi`, `nominal-group`, `group-cognition`),
   start the workflow via `fgos workflow start <workflowId>` (or delegate to
   [`fgos-group-thinking`](../fgos-group-thinking/SKILL.md)). When the question has 2-4
   discrete candidate answers, pass `--stance-options` as described in its "Stance options" section.
   `start`, `answer` and `resume` return at once (the run continues detached); inspect progress and findings via
   `fgos workflow status <workflowRunId>`, polling until the run completes or parks at a gate.
   If a workflow parks at a human gate (such as `voting-ranking` in `nominal-group`),
   submit answers via `fgos workflow answer <workflowRunId> --step <stepId> --answer <text>`.
6. For single-unit presets (`rfc`, `consult`, `research-fan-out`), dispatch
   the unit via its resolved CollaborationPattern.
7. Return the resulting synthesized advice, consensus, or rankings along with
   the workflow/execution run reference. Status remains `fgos workflow status <workflowRunId>`.
## Facade Hook Values (Route Step 5's Generic-Preset Path Only)

| Hook Slot | Value |
|---|---|
| `unit of iteration` | One dispatched Workflow run (for `delphi`, `nominal-group`, `group-cognition`, or `architecture-advisory`) or one preset collaboration pattern run for the preset selected in Route step 2. |
| `open inputs` | (a) result kind: advisory, never work-product -- this route never implements code (Boundaries). (b) exactly one primary canonical capability, resolved directly from the selected preset or task capability in `runner.capabilities` (e.g. `advise`), never a keyword-matched guess. (c) the person's subject, proposal/artifact, supplied options, and material scope/risk constraint (Route step 1). |
| `evidence verification` | Read the advisory artifact and run state back through `fgos workflow status <workflowRunId>` or unit execution results; report only artifacts the real workflow run produced (Boundaries). |
| `disposition criteria` | None owned by this route. The selected Workflow's own steps, DAG dependencies, and unit patterns govern every finding; this skill never invents workflow semantics or gate rules in task prose (Boundaries). |
| `adaptation bounds` | None owned by this route. Bounded entirely by the selected Workflow definition steps or preset `maxRounds`. |
| `human-escalation triggers` | One concise question only when the subject is absent, a requested review has no accessible proposal/artifact, an explicit comparison has no supplied or discoverable options, a material scope/risk constraint cannot be obtained from evidence, or the only ambiguity is implementation authority (advice only or an actual code change) (Clarify Only Real Missing Input). Never ask for a protocol id, method name, role roster, provider, model, executor, or tier. |
| `close criteria` | The selected Workflow's completion status (`completed` with outcome `pass` or `findings`), or answer of all human gates. |
| `after-close action` | Return the advisory artifact and workflow run ID to the person. Never turn a coding advisory panel into a parallel implementation executor; never pin a provider, model, executor, or tier (Boundaries). |
| `continuity artifact` | `fgos workflow status <workflowRunId>`, unmodified -- replay/status remains this door. |

## Clarify Only Real Missing Input

Do not ask for a protocol id, method name, role roster, provider, model,
executor, tier, or request JSON.

Ask one concise question only if the subject is absent, a requested review has
no accessible proposal/artifact, an explicit comparison has no supplied or
discoverable options, or a material scope/risk constraint cannot be obtained
from evidence. If the only ambiguity is implementation authority, ask whether
the person wants advice only or an actual code change.

## Boundaries

- This is selection and request filling, not an execution engine. Workflow and
  CollaborationPattern definitions remain authoritative.
- Never invent workflow semantics, actors, transitions, visibility, grants,
  reopen, aggregation, quorum, or close rules in task prose.
- Never pin a provider, model, executor, or tier. Dispatch resolves the
  existing `advise` or coding capability through the Dispatch Control Plane.
- Never turn a coding advisory panel into a parallel implementation executor.
- Never claim that a ranking workflow selected a winner or that mediated
  feedback guarantees anonymity or consensus; report only artifacts the real
  session produced.
