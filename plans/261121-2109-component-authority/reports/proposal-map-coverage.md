# Proposal map coverage check (phase 6 step 2)

Source: `docs/platform/proposals/component-authority-boundary-map.md` §6 (14 Owns/Must-not-own rows) and §7 (contract dependency matrix).
Target: `packages/component-authority/model/components.json` and `contracts.json`.

This run **lists gaps only** — it does not edit model rows.

## Method

- Match each proposal component name to a model row by preferred id / alias / token overlap.
- Treat a proposal Owns or Must-not-own clause as **present** when enough content tokens appear in the matched row's `owns` / `mustNotOwn` / `meaning` / `aliases` blob (overlap heuristic; not a semantic proof).
- For §7 matrix rows, look for provider/consumer component ids on any contract row (`provider`, `consumers`) or for both ends existing as component rows. The model indexes contracts, not free-form allowed/forbidden dependency prose — matrix prose is reported as present only when both ends exist as components or appear on a contract edge.

## §6 component rows (14)

| # | Proposal component | Model id | Match | Owns present | Owns gaps | Must-not-own present | Must-not-own gaps | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Work Lifecycle Engine | `work-state` | alias/id | 1/1 | — | 1/2 | Agent runtime | — |
| 2 | Work Driver / Domain Workflow Interpreter | — | MISSING | 0/1 | Ready-work selection, automation loop policy, declared Stage Operation choice, cross-flow routing, park/halt behavior, recovery/anti-loop around Work execution, invoking lifecycle verbs and dispatch surfaces | 0/3 | Domain workflow semantics, lifecycle writes outside Work Lifecycle verbs, dispatch target choice; RunResult confidence, coding repository isolation; CoordinationSession progress | no dedicated model row; work-state aliases include "Work Driver" (conflates Lifecycle + Driver) |
| 3 | Agent Coordination Engine | `agent-coordination-engine` | alias/id | 2/3 | Team Cognition invocation, optional protocol/dynamic planning consumption | 1/1 | — | — |
| 4 | Team Cognition Engine | `team-cognition-engine` | alias/id | 1/1 | — | 2/4 | Assignment dispatch; RunResult confidence upgrades | — |
| 5 | Dispatch And Execution Engine | `execution-core` | alias/id | 1/2 | Assignment-to-DispatchPlan resolution, executor/provider/model/tier/mechanism/adapter selection, governance/egress | 1/2 | Semantic operation choice | related rows also present: dispatch-transport, runner, seat-binding |
| 6 | Run Result Evaluator | `run-result` | alias/id | 2/2 | — | 2/2 | — | — |
| 7 | Domain Registry And Definition Loader | `domain-registry-loader` | alias/id | 1/1 | — | 2/2 | — | — |
| 8 | Coding Domain Component | `coding-domain` | alias/id | 1/1 | — | 1/1 | — | — |
| 9 | Setup, Doctor, And Distribution Health | `packaging-distribution` | alias/id | 1/1 | — | 1/1 | — | — |
| 10 | Host And Surface Layer | `host-surface` | alias/id | 1/1 | — | 0/2 | Work truth; CoordinationSession truth, dispatch governance, evidence confidence | — |
| 11 | Group-Thinking Protocol Pack | `group-thinking` | alias/id | 1/1 | — | 1/2 | Work lifecycle, or hidden protocol semantics in prompts/adapters | — |
| 12 | fgos-group-thinking Skill | `group-thinking` | alias/id | 1/1 | — | 1/1 | — | skill folded into group-thinking row (not a separate component) |
| 13 | Learning, Knowledge, And Documentation Registry | `learning-docs-registry` | alias/id | 1/1 | — | 1/3 | Agent Coordination runtime; RunResult confidence | — |
| 14 | Observe (Metrics & Friction) | `observe` | alias/id | 1/1 | — | 2/3 | RunResult confidence truth | — |

## §7 contract dependency matrix

| Relation | Ends in model | Contract edge | Allowed prose | Forbidden prose | Gap |
| --- | --- | --- | --- | --- | --- |
| Agent Coordination Engine -> Dispatch And Execution Engine | 5/5 (`agent-coordination-engine`, `agent-coordination`, `execution-core`, `dispatch-transport`, `runner`) | `CTR012` (agent-coordination → workflow,execution-core) | not modeled (prose-only) | not modeled (prose-only) | — |
| Agent Coordination Engine -> Run Result Evaluator | 2/2 (`agent-coordination-engine`, `run-result`) | — | not modeled (prose-only) | not modeled (prose-only) | no contract row links these ends via provider/consumers |
| Agent Coordination Engine -> Team Cognition Engine | 2/2 (`agent-coordination-engine`, `team-cognition-engine`) | — | not modeled (prose-only) | not modeled (prose-only) | no contract row links these ends via provider/consumers |
| Team Cognition Engine -> Run Result Evaluator outputs | 2/2 (`team-cognition-engine`, `run-result`) | — | not modeled (prose-only) | not modeled (prose-only) | no contract row links these ends via provider/consumers |
| Work Driver -> Work Lifecycle Engine | 1/1 (`work-state`) | `CTR002` (work-state → ) | not modeled (prose-only) | not modeled (prose-only) | Work Driver has no dedicated component row |
| Work Driver -> Domain Registry And Definition Loader | 1/1 (`domain-registry-loader`) | — | not modeled (prose-only) | not modeled (prose-only) | Work Driver has no dedicated component row |
| Work Driver -> Agent Coordination | 2/2 (`agent-coordination`, `agent-coordination-engine`) | `CTR012` (agent-coordination → workflow,execution-core) | not modeled (prose-only) | not modeled (prose-only) | Work Driver has no dedicated component row |
| Domain Component -> Work Driver / Agent Coordination | 4/4 (`coding-domain`, `domain-components`, `agent-coordination-engine`, `workflow`) | — | not modeled (prose-only) | not modeled (prose-only) | no contract row links these ends via provider/consumers |
| Host Surface -> platform engines | 1/1 (`host-surface`) | `CTR001` (host-surface → ) | not modeled (prose-only) | not modeled (prose-only) | — |
| Group-Thinking Protocol Pack -> Agent Coordination / Team Cognition | 3/3 (`group-thinking`, `agent-coordination-engine`, `team-cognition-engine`) | — | not modeled (prose-only) | not modeled (prose-only) | no contract row links these ends via provider/consumers |
| fgos-group-thinking Skill -> Group-Thinking Protocol Pack / Host Surface | 2/2 (`group-thinking`, `host-surface`) | `CTR001` (host-surface → ) | not modeled (prose-only) | not modeled (prose-only) | — |
| Sibling components under one parent | 0/n/a (no concrete ends) | — | not modeled (prose-only) | not modeled (prose-only) | generic rule — not a concrete provider/consumer edge in the model |
| Observe -> Substrate Sources | 1/1 (`observe`) | `CTR008` (observe → ) | not modeled (prose-only) | not modeled (prose-only) | — |
| Platform Components -> Observe | 1/1 (`observe`) | — | not modeled (prose-only) | not modeled (prose-only) | — |

## Gap list (do not fix in this run)

1. **Work Lifecycle Engine** (model `work-state`)
   - Must-not-own gaps: Agent runtime
2. **Work Driver / Domain Workflow Interpreter** (model `(missing)`)
   - Owns gaps: Ready-work selection, automation loop policy, declared Stage Operation choice, cross-flow routing, park/halt behavior, recovery/anti-loop around Work execution, invoking lifecycle verbs and dispatch surfaces
   - Must-not-own gaps: Domain workflow semantics, lifecycle writes outside Work Lifecycle verbs, dispatch target choice; RunResult confidence, coding repository isolation; CoordinationSession progress
3. **Agent Coordination Engine** (model `agent-coordination-engine`)
   - Owns gaps: Team Cognition invocation, optional protocol/dynamic planning consumption
4. **Team Cognition Engine** (model `team-cognition-engine`)
   - Must-not-own gaps: Assignment dispatch; RunResult confidence upgrades
5. **Dispatch And Execution Engine** (model `execution-core`)
   - Owns gaps: Assignment-to-DispatchPlan resolution, executor/provider/model/tier/mechanism/adapter selection, governance/egress
   - Must-not-own gaps: Semantic operation choice
6. **Host And Surface Layer** (model `host-surface`)
   - Must-not-own gaps: Work truth; CoordinationSession truth, dispatch governance, evidence confidence
7. **Group-Thinking Protocol Pack** (model `group-thinking`)
   - Must-not-own gaps: Work lifecycle, or hidden protocol semantics in prompts/adapters
8. **Learning, Knowledge, And Documentation Registry** (model `learning-docs-registry`)
   - Must-not-own gaps: Agent Coordination runtime; RunResult confidence
9. **Observe (Metrics & Friction)** (model `observe`)
   - Must-not-own gaps: RunResult confidence truth
10. **Matrix** Agent Coordination Engine -> Run Result Evaluator: no contract row links these ends via provider/consumers
11. **Matrix** Agent Coordination Engine -> Team Cognition Engine: no contract row links these ends via provider/consumers
12. **Matrix** Team Cognition Engine -> Run Result Evaluator outputs: no contract row links these ends via provider/consumers
13. **Matrix** Work Driver -> Work Lifecycle Engine: Work Driver has no dedicated component row
14. **Matrix** Work Driver -> Domain Registry And Definition Loader: Work Driver has no dedicated component row
15. **Matrix** Work Driver -> Agent Coordination: Work Driver has no dedicated component row
16. **Matrix** Domain Component -> Work Driver / Agent Coordination: no contract row links these ends via provider/consumers
17. **Matrix** Group-Thinking Protocol Pack -> Agent Coordination / Team Cognition: no contract row links these ends via provider/consumers
18. **Matrix** Sibling components under one parent: generic rule — not a concrete provider/consumer edge in the model

## Intentional shape differences (not gaps to "fix" blindly)

- Proposal used human product names; model uses kebab ids (`work-state`, `execution-core`, …).
- `fgos-group-thinking` Skill is folded into `group-thinking` (one row covers pack + skill).
- `work-state` aliases both "Work Lifecycle Engine" and "Work Driver" — Driver is not a separate component; that alias is itself a model smell listed above.
- Dispatch authority is split across `execution-core`, `dispatch-transport`, `runner`, and `seat-binding` rather than one "Dispatch And Execution Engine" row.
- §7 matrix allowed/forbidden dependency prose is not a model field; `contracts.json` only holds provider/consumers edges (and most rows still have empty `consumers`).
- Architecture-map old §6 Module/Nhà/Physics/Vai table and long §7 "Hợp đồng" prose are not model fields; phase 6 keeps slice tables and the scope-rule/mermaid hand-written outside markers.
