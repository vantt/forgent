# Group Thinking Trigger Surface

```txt
Document type: Architecture
Audience: Maintainer, implementation agent and independent reviewer
Purpose: Preserve current contracts and explicitly distinguish unimplemented design from retired engine history
Design status: Candidate
Implementation: Section-specific; proposal schemas and dated findings are not blanket implementation claims
Provenance: Restored from 7880fbc74b07c3667ebaa61f2b0561b5d80471b5 after independent liveness review
Writer type: Human + agent coauthor
Canonical for: The current subject and design boundaries stated in this file; not retired engine authority
Use this when: Reading the surviving contract, its implementation limits or current proposals
Do not use this for: Reinstating the retired coordination engine or treating proposal details as shipped behavior
Last reviewed: Pending independent liveness re-review
Related:
- docs/platform/agent-coordination/README.md
- docs/specs/runner.md
Supersedes: Incorrect whole-file retirement or over-removal only
Superseded by: None for the surviving current subject
Added in candidate: Liveness evidence and explicit implementation/proposal distinction
```

Complete pre-rework input: [historical snapshot](../history/retired-engine/files/architecture/group-thinking-trigger-surface.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.

## Decision

`panel` is the canonical end-user noun for asking several agents to think
together. A person describes the outcome they want, such as review, compare,
debate, red-team, or independent opinions. They do not select a protocol.

`fgos-panel` owns intent-first selection and routes to a named Workflow or a
CollaborationPattern preset. For discussion Workflows it may start the Workflow
directly or delegate to `fgos-group-thinking` after selecting the name. The latter
is not a current protocol-pack gate. This surface adds no private execution path.

## Baseline UX Audit

This is a dated pre-introduction UX audit, not a list of currently installed skills or commands. In particular `fgos-code-panel` and the protocol-pack gate below are historical; today's explicit implementation route is `fgos-run`.

| Current trigger | User mental model | Required knowledge | Problem | Proposed surface |
|---|---|---|---|---|
| `fgos-group-thinking` | "Ask several agents" | Exact pack member id and request shape | Internal selection gate leaked protocol identity to the person and its description missed natural requests | `fgos-panel` selects a preset; `fgos-group-thinking` remains the internal pack gate |
| `fgos-architecture-panel` | Architecture advisory board | Only the architecture question | Good entrypoint, but intentionally limited to software architecture | Keep it; route architecture intents here from `fgos-panel` |
| `fgos-code-panel` | Usually "several agents discuss code" | Must know it actually implements, reviews, and red-teams a change | Name can capture advisory coding-decision requests even though it is a mutating implementation workflow | Keep for explicit implementation; route advisory coding decisions to `fgos-architecture-panel` or a non-mutating preset |
| Raw protocol id | Runtime implementation identity | Registry id/version | Precise for machines, hostile to recall and discovery | Hide behind preset selection |
| RFC-Review-Lite | Structured proposal critique | RFC vocabulary and protocol behavior | "RFC" sounds coding-specific although the protocol can review any concrete proposal | Surface name `proposal-review` |
| Nominal-Group-Lite | Independent ideation and ranking | NGT method and its no-winner limitation | Method name is unfamiliar to most users | Surface names `option-comparison` and `strategy-options` |
| Delphi-Feedback-Lite | Iterative, mediated feedback | Delphi method and its bounded-round limitation | Method name implies expertise and stronger consensus/anonymity than the lite protocol claims | Surface names `independent-feedback` and `reflection-review` |
| Historical coordination run/show | Retired session-engine UX | Preserved in the historical snapshot | Not a current execution door | Use current Workflow/Unit owners |
| "Get independent opinions" | Fresh views before commitment | Nothing beyond the question | Previously had no reliable skill trigger and could collapse to one-agent advice | `independent-feedback` or `option-comparison`, based on whether options exist |
| "Red-team this decision" | Attack assumptions and failure modes | Nothing beyond the decision/proposal | Could misroute to code implementation red-team | `architecture-panel` for architecture; otherwise `proposal-review` |
| "Coding decision panel" | Advisory design choice | Nothing beyond the choice | Historical misroute to mutating `fgos-code-panel` | Current advisory route is `architecture-panel`/`option-comparison`; explicit implementation uses `fgos-run`, not the removed code-panel skill |
| "Business panel" | Multi-perspective business decision | Nothing beyond the business question | Existing named skills look coding-specific | Generic `option-comparison`, `proposal-review`, or `independent-feedback` preset |

## Vocabulary Evaluation

| Term | Recall | Ambiguity | Cross-domain fit | Scale across protocols | Decision |
|---|---|---|---|---|---|
| `panel` | High | Low: clearly several viewpoints | Strong | Strong | Canonical noun and skill name |
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

This candidate map reflects the current routes in `core/skills/fgos-panel/SKILL.md:45-59`; it is not yet the skill's linked authority. The skill still links the legacy docs/architect taxonomy at lines 36-39. Repointing that consumer belongs to the authorized link cutover, not this truth pass. The current execution owners below are Workflow/CollaborationPattern owners, not a second sequencer; the former protocol-id mapping is historical.

| Requested use case | Selected surface | Current execution owner |
|---|---|---|
| Architecture advice or architectural coding design | architecture-panel / coding-design-panel | architecture-advisory Workflow via fgos-architecture-panel |
| Independent feedback or reflection review | independent-feedback / reflection-review | delphi Workflow |
| Option or strategy comparison | option-comparison / strategy-options | nominal-group Workflow |
| Complex dialectical sense-making | group-cognition | group-cognition Workflow |
| Proposal or business review | proposal-review / business-review | rfc preset, reviewed pattern with red-team |
| One bounded advice request | consult | consult preset, solo advisor |
| Independent research branches | research-fan-out | research-fan-out preset, panel of three |
| Explicit implementation/change/fix request | code-change-panel | fgos-run; advice alone cannot authorize this route |

## Happy Path Routing

| User phrase | Expected route |
|---|---|
| "run a panel on whether we should split this service" | `architecture-panel` -> `fgos-architecture-panel` -> `architecture-advisory` Workflow |
| "compare these 3 implementation options" | `option-comparison` when the options are concrete; upgrade to `architecture-panel` if repository investigation and a full architecture recommendation are requested |
| "red-team this architecture decision" | `architecture-panel`; reviewer/red-team checks belong to the registered advisory synthesis unit |
| "get independent opinions before I commit" | `independent-feedback`; ask only for the subject if it is absent |
| "review this proposal with group thinking" | `proposal-review`; use the proposal text or artifact already in scope |
| "business panel: should we change pricing?" | `strategy-options` if alternatives must be generated/compared; `business-review` if a concrete pricing proposal exists |
| "coding panel: should this be a plugin or core feature?" | `coding-design-panel` -> `architecture-panel`; never the mutating `code-change-panel` route because no implementation was requested |

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

Workflow definitions, Unit contracts and CollaborationPattern own executable semantics, gates and legal outcomes. Dispatch resolves capability/executor/provider routing; this facade cannot pin those choices.

### Surface owns

Extract the subject, accessible artifact/options and material scope, select the canonical preset, fill the request and return attributed findings and the real run reference. Ask only for missing material inputs or advice-versus-implementation authority.

### Forbidden coupling

Do not invent actors, grants, transitions, quorum, close rules, routing pins or an alternate session engine in task prose. Status and human answers use the registered Workflow doors. Evidence: core/skills/fgos-panel/SKILL.md:65-108.

A purpose/use-case preset is not another dispatch ontology or routing identity.
Selection fills the existing advisory/coding capability and task contract; it
must not manufacture a capability merely because an alias is used in conversation.

## Entry Point Choice

Use fgos-panel for intent-first preset selection, fgos-group-thinking for named discussion Workflow use, and fgos-architecture-panel for architecture-advisory. Only explicit code implementation/change requests route to fgos-run. Workflow status, answer and resume use the Workflow run id; the retired coordination run/show doors are not current. Evidence: core/skills/fgos-panel/SKILL.md:45-75.

## Alternatives Considered

### A. Keep only `fgos-group-thinking`

Historically this left protocol-pack selection exposed to the person. The
current named-Workflow skill can execute an already selected method, but it does
not replace intent-first surface selection.

### B. Add `fgos-panel`

Selected. Natural requests use one surface and the canonical table, while named
Workflow/CollaborationPattern owners retain execution semantics. Selection is
not permission to implement an advisory request.

### C. Rename or deprecate the existing skills

The earlier keep-all-skills decision was dated migration reasoning.
`fgos-code-panel` is no longer a current installed implementation facade;
explicit code-change requests route to `fgos-run`. `fgos-architecture-panel`
retains the specialized advisory route and `fgos-group-thinking` handles named
discussion Workflows.

