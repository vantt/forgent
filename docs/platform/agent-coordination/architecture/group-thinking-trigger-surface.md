# Group Thinking Trigger Surface

Document type: Architecture
Design status: Accepted
Implementation: Implemented as skill and documentation routing
Last reviewed: 2026-09-09
Canonical for: end-user vocabulary, use-case presets, and the boundary between
the group-thinking UX surface and coordination protocol core
Related: [Protocol Model](protocol-model.md),
[Dispatch Control Plane](dispatch-control-plane.md),
[FlowDefinition Contract](../contracts/flow-definition.md), and
[Group Thinking Protocol Pack](../../../../core/protocol-packs/group-thinking.json)

## Decision

`panel` is the canonical end-user noun for asking several agents to think
together. A person describes the outcome they want, such as review, compare,
debate, red-team, or independent opinions. They do not select a protocol.

`fgos-advise` (formerly `fgos-panel`) owns this surface routing. It picks one
request kind and route and then hands the registered Workflow or preset id to
`fgos-group-thinking`, which remains the execution door. No CLI verb, protocol, capability, or execution path is
added by this surface.

## Baseline UX Audit

This table records the surface before `fgos-panel` (now `fgos-advise`) was introduced.

| Current trigger | User mental model | Required knowledge | Problem | Proposed surface |
|---|---|---|---|---|
| `fgos-group-thinking` | "Ask several agents" | Exact pack member id and request shape | Internal selection gate leaked protocol identity to the person and its description missed natural requests | `fgos-advise` selects a preset; `fgos-group-thinking` remains the internal pack gate |
| `fgos-architecture-panel` | Architecture advisory board | Only the architecture question | Good entrypoint, but intentionally limited to software architecture | Keep it; route architecture intents here from `fgos-advise` |
| `fgos-code-panel` | Usually "several agents discuss code" | Must know it actually implements, reviews, and red-teams a change | Name can capture advisory coding-decision requests even though it is a mutating implementation workflow | Keep for explicit implementation; route advisory coding decisions to `fgos-architecture-panel` or a non-mutating preset |
| Raw protocol id | Runtime implementation identity | Registry id/version | Precise for machines, hostile to recall and discovery | Hide behind preset selection |
| RFC-Review-Lite | Structured proposal critique | RFC vocabulary and protocol behavior | "RFC" sounds coding-specific although the protocol can review any concrete proposal | Surface name `proposal-review` |
| Nominal-Group-Lite | Independent ideation and ranking | NGT method and its no-winner limitation | Method name is unfamiliar to most users | Surface names `option-comparison` and `strategy-options` |
| Delphi-Feedback-Lite | Iterative, mediated feedback | Delphi method and its bounded-round limitation | Method name implies expertise and stronger consensus/anonymity than the lite protocol claims | Surface names `independent-feedback` and `reflection-review` |
| Direct `fgos coordination run/show` | Low-level session control | Request JSON, operation ids, actors, grants, resume ids | Correct power-user door, too low-level as a first contact | Surface launches through `run`; replay remains `show` |
| "Get independent opinions" | Fresh views before commitment | Nothing beyond the question | Previously had no reliable skill trigger and could collapse to one-agent advice | `independent-feedback` or `option-comparison`, based on whether options exist |
| "Red-team this decision" | Attack assumptions and failure modes | Nothing beyond the decision/proposal | Could misroute to code implementation red-team | `architecture-panel` for architecture; otherwise `proposal-review` |
| "Coding decision panel" | Advisory design choice | Nothing beyond the choice | Could misroute to mutating `fgos-code-panel` | Non-mutating `architecture-panel` or `option-comparison`; use `fgos-code-panel` only when implementation is explicitly requested |
| "Business panel" | Multi-perspective business decision | Nothing beyond the business question | Existing named skills look coding-specific | Generic `option-comparison`, `proposal-review`, or `independent-feedback` preset |

## Vocabulary Evaluation

| Term | Recall | Ambiguity | Cross-domain fit | Scale across protocols | Decision |
|---|---|---|---|---|---|
| `panel` | High | Low: clearly several viewpoints | Strong | Strong | Canonical noun; the skill is now `fgos-advise` |
| `review` | High | Medium: may mean single reviewer | Strong | Strong | Intent verb; selects proposal review when group thinking is explicit |
| `compare` | High | Low when options are supplied | Strong | Strong | Intent verb for option comparison |
| `red-team` | High | Medium: attack only, not always synthesis | Strong | Strong | Intent verb, never a separate protocol identity |
| `debate` | High | Medium: can imply unbounded argument | Strong | Medium | Alias for competing claims; chosen preset still supplies bounds |
| `advisory` | Medium | Low | Strong | Strong | Artifact/authority qualifier, not the primary trigger |
| `council` | Medium | High: can imply decision authority | Strong | Medium | Accepted natural-language alias, not canonical naming |
| `decision` | High | Very high and overlaps product ontology | Strong | Weak | Context word only, never a route identity |
| `workshop` | High | High: implies synchronous facilitation and creation | Strong | Medium | Use only for strategy brainstorming language, not canonical naming |
| `consult` | Medium | Medium: often sounds single-expert | Strong | Medium | Not selected as the skill name |

## Surface Taxonomy

The kind-to-route map no longer lives in this document. It ships with the
skill that applies it:
[`request-kinds-and-routes.md`](../../../../core/skills/fgos-advise/references/request-kinds-and-routes.md)
(owner: [`fgos-advise`](../../../../core/skills/fgos-advise/SKILL.md), the
renamed `fgos-panel`). The protocol-id table that stood here named retired
`-lite` protocols; routes now name registered Workflows and presets directly.
Boundaries below still hold: the surface selects and fills request data, and
never defines actors, transitions, visibility, or close rules.

## Clarification Rules

Infer the preset from the person's wording and available context. Never ask for
a protocol id, protocol method name, role roster, provider, model, executor, or
request JSON.

Ask one concise question only when progress truly lacks one of these:

- The subject/question is absent: "What question should the panel examine?"
- Review is requested but the proposal/artifact is absent and cannot be read
  from the current context: "Which proposal or artifact should the panel review?"
- Comparison is explicitly requested but no options are supplied or discoverable:
  "Which options should the panel compare?"
- A chosen preset needs a material scope/risk constraint that cannot be obtained
  from available evidence: ask for that constraint, not for protocol mechanics.

If two presets are both plausible but would produce materially equivalent
advisory coverage, choose the narrower preset and proceed. If the choice would
change mutation authority, ask whether the person wants advice only or actual
implementation.

## Core / Surface Boundary

### Core owns

- Protocol registry membership and protocol id/version.
- FlowDefinition validation and protocol semantics.
- CoordinationSession state, actors and role binding.
- Visibility windows, authorization, reopen, completion, and close rules.
- Dispatch-plan resolution and governed execution.
- Evidence, RunResult, contribution ledger, result artifact, and replay shape.

### Surface owns

- Natural-language triggers and aliases.
- Selection of exactly one use-case preset from the table above.
- Filling objective, context, proposal/options, and expected-output request data.
- Passing the preset's explicit registered protocol id to the existing
  `fgos-group-thinking` gate.
- Returning the result and coordination id in terms the person used.

### Forbidden coupling

- Core protocols must not contain end-user synonym lists or business/coding
  marketing labels.
- A surface skill must not define protocol actors, transitions, visibility,
  authorization, reopen, quorum, or close semantics. It reads the registered
  FlowDefinition for those facts.
- A surface must not invent a protocol or accept an unregistered id.
- Protocol registry remains the source of truth; this table cannot make a
  protocol executable.
- Replay always uses `fgos coordination show <coordinationId> --json`.
- Dispatch always crosses the Dispatch Control Plane. Surface docs never pin a
  provider, model, executor, or tier.
- `purpose`/job/use-case preset is not a new dispatch ontology. Every advisory
  preset uses the existing `advise` capability.

## Entry Point Choice

| Need | Use |
|---|---|
| Natural-language group review, comparison, red-team, or independent views | `fgos-advise` |
| Deep software-architecture recommendation and dialogue | `fgos-architecture-panel` (also selected by `fgos-advise`) |
| Actual single code change plus independent review and red-team | `fgos-code-panel` |
| A known protocol id and low-level request/session operation | `fgos-group-thinking` or `fgos coordination run` |
| Replay/status for any of the above | `fgos coordination show <coordinationId> --json` |

## Alternatives Considered

### A. Keep only `fgos-group-thinking`

Smallest file change, but preserves the central failure: its pack gate correctly
requires an explicit id from its caller. Teaching protocol ids in examples would
make the person learn core vocabulary rather than fixing the surface.

### B. Add `fgos-advise`

Selected. It gives natural requests one memorable entrypoint, keeps all mapping
in this canonical table, and delegates unchanged execution to the pack gate and
registered protocol. Existing specialist skills remain available.

### C. Rename or deprecate the existing skills

Rejected for now. `fgos-group-thinking` is an accurate internal gate name,
`fgos-architecture-panel` is already a strong specialist surface, and
`fgos-code-panel` has a distinct mutating contract. Renaming creates migration
cost without improving the new happy path. Their descriptions instead state the
boundary and preserve backward compatibility.
