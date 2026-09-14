# Documentation System Design

```txt
Document type: Architecture design
Audience: Human reviewer, architect, maintainer, agent
Purpose: Propose the whole-system documentation model for fgOS
Design status: Accepted
Implementation: Partially promoted
Provenance: Human + agent coauthor, synthesized from discussion and panel review
Writer type: Human + agent coauthor
Canonical for: source design behind the promoted documentation governance
Use this when: Reviewing the rationale behind the documentation-system governance
Do not use this for: Migration execution details
Last reviewed: 2026-09-13
Related:
- `docs/architect/documentation-system-discussion.md`
```

This document is the source design for the fgOS documentation system. Its first
settled slice has been promoted into `docs/doc-governance.md`,
`docs/reading-map.md`, `docs/README.md`, `docs/platform/README.md`, and
`docs/templates/**`. Use the promoted files for day-to-day documentation
governance; use this design for rationale and future refinement.

## 1. Goal

fgOS needs a documentation system that is complete without becoming heavy,
simple without becoming shallow, and clear enough that both humans and agents
can use it safely.

The documentation system must support three jobs:

1. Help humans understand the system.
2. Help humans and agents shape, review, challenge, and approve architecture.
3. Help agents route, implement, verify, and leave durable knowledge behind.

The critical quality bar is human presence. If the docs are optimized for agent
execution but a human cannot scan, understand, challenge, and approve decisions,
the documentation system is failing.

## 2. Principles

### 2.1. Human-first structure

The folder tree, document structure, and writing style must be legible to a
human without requiring them to read governance first.

Spatial navigation matters. A person scanning the tree should see what is
platform-wide, what is area-specific, what is current state, what is rationale,
what is contract, what is proof, and what is history.

### 2.2. One claim, one owner

A rule, contract, behavior, or architectural claim should have one owning
document. Other documents may summarize and link to it, but must not fork its
authority.

### 2.3. Provenance is not authority

An agent may draft, summarize, cross-link, or detect drift. That provenance must
be visible, but agent authorship does not make a document authoritative.
Authority comes from document type, status, owner, evidence, and approval.

### 2.4. Discussion is preserved, then drained

Architecture shaping needs a temporary place to preserve ideas, objections,
tentative decisions, and evidence. That place must not become a shadow spec.
Settled content is promoted into canonical documents, then removed or marked as
promoted.

### 2.5. Documentation is a reading graph

Good docs are not only good files. They are also a navigable graph. A reader
must be able to move from portal to current state, rationale, contract,
decision, proof, proposal, and history through deliberate links.

### 2.6. Generated output never outranks source

Generated documents and indexes are projections. They must declare their source,
generator, freshness rule, and do-not-edit status. They never create new policy
or override their source.

## 3. Target Folder Structure

The target model keeps platform-wide authority at `docs/platform/` and keeps
area-specific docs under `docs/platform/<area>/`.

There is no `docs/platform/system/` folder and no `docs/platform/areas/` layer.
`system/` would look like another area, and `areas/` adds an unnecessary level.

```txt
docs/
  README.md
  doc-governance.md
  reading-map.md
  templates/

  platform/
    README.md
    vision.md
    platform-foundations.md
    architecture-map.md
    component-boundary.md

    contracts/
      routing-handoff-contract.md

    decisions/
    verification/
    history/

    <area>/
      README.md
      spec.md
      architecture/
      contracts/
      decisions/
      verification/
      operations/
      proposals/
      history/

  user/
    README.md
    tutorials/
    how-to/
    reference/
    explanation/

  generated/
    README.md

  knowledge/
    README.md

  history/
    README.md
```

External governed surfaces remain outside `docs/` when runtime/tooling needs
them there, but they are still governed by `docs/doc-governance.md`:

```txt
domains/
.agents/skills/
plugins/fgOS/skills/
plans/
```

## 4. Platform-wide Anchors

The root of `docs/platform/` holds cross-area platform authority.

| File | Role |
|---|---|
| `README.md` | Platform documentation portal and area registry |
| `vision.md` | Whole-platform mission, scope, non-scope, direction, and quality principles |
| `platform-foundations.md` | Cross-area platform laws and durable constraints |
| `architecture-map.md` | Whole-system architecture map |
| `component-boundary.md` | Layers, parent components, child components, responsibilities, and authority boundaries |
| `contracts/` | Cross-area contracts that no single area should own alone |
| `decisions/` | Platform-wide decisions |
| `verification/` | Cross-area proof and conformance evidence |
| `history/` | Retired or archived cross-area source material |

`component-boundary.md` is a system architecture document, not an area. It shows
how the whole system is decomposed into layers, parent components, child
components, responsibilities, and authority boundaries.

## 5. Area Shape

Each area lives directly under `docs/platform/<area>/`.

Minimum required shape:

```txt
docs/platform/<area>/
  README.md
  spec.md
  architecture/
  contracts/
  decisions/
  verification/
```

Optional folders are created only when needed:

```txt
operations/
playbooks/
proposals/
history/
generated/
```

Empty optional folders should not be created just to make the area look
complete. Absence should be meaningful.

## 6. Document Model

### 6.1. Area README

The area README is the human-first portal into one platform area.

It owns orientation, ownership summary, read-first routing, decision surface,
and participation path. It does not own exact behavior, detailed contracts, or
historical rationale.

Required sections:

```txt
# <Area Name>

<metadata header>

## 1. What This Area Owns
## 2. Current Shape
## 3. Read First
## 4. Decision Surface
## 5. Canonical Documents
## 6. Key Contracts
## 7. Related Areas
## 8. How To Change This Area
## 9. Maintenance Notes
```

`Decision Surface` is required, even when it says "No active open decision."

### 6.2. Spec

`spec.md` is the current behavior/state/reference layer for one area.

It answers: what does this area currently do, expose, preserve, and require?
It is not the home for long rationale, design alternatives, or raw history.

Required sections:

```txt
# Spec: <Area Name>

<metadata header>

## 1. Current Summary
## 2. Scope
## 3. Entry Points And Triggers
## 4. Actors And Access
## 5. Data / Concepts
## 6. Behaviors And Operations
## 7. Rules And Invariants
## 8. Contracts Owned
## 9. Contracts Consumed
## 10. Edge Cases Settled
## 11. Open Gaps
## 12. Verification
## 13. Pointers
## 14. Decision History Summary
```

Specs should be written in present tense. Open gaps must be explicit.

### 6.3. Architecture

Architecture docs are the why/shape/boundary/trade-off layer.

They answer: why is the system shaped this way, what boundaries matter, and what
would make the design change?

Required sections:

```txt
# <Architecture Topic>

<metadata header>

## 1. Problem And Forces
## 2. Chosen Shape
## 3. Boundaries And Responsibilities
## 4. Alternatives Considered
## 5. Trade-offs
## 6. Decision Surface
## 7. Consequences
## 8. Contracts Affected
## 9. Verification Expectations
## 10. Related Docs
```

Architecture docs should preserve meaningful rejected alternatives and dissent.
"No objections" is not the same as informed agreement.

### 6.4. Contract

Contracts are exact normative rules.

They answer: what must producers and consumers obey?

Required sections:

```txt
# Contract: <Name>

<metadata header>

## 1. Status And Authority
## 2. Parties
## 3. Definitions
## 4. Rules
## 5. Inputs And Outputs
## 6. Failure Behavior
## 7. Compatibility And Versioning
## 8. Examples
## 9. Verification
## 10. Change Procedure
## 11. Related Docs
```

Use explicit normative language: must, must not, may. Every normative rule
should be testable or have a named verification path.

### 6.5. Decision

Decision docs preserve decision provenance.

They answer: what was decided, why, by whom, against what alternatives, and what
does it supersede?

Required sections:

```txt
# Decision: <Title>

<metadata header>

## 1. Decision
## 2. Status
## 3. Context
## 4. Options Considered
## 5. Rationale
## 6. Consequences
## 7. Dissent / Uncertainty
## 8. Supersession
## 9. Evidence
## 10. Affected Docs
```

Historical decisions must not be rewritten to match today's rationale. Supersede
them with a new decision.

### 6.6. Verification

Verification docs preserve proof.

They answer: what claim is proven, by what command/test/evidence, and what gaps
remain?

Required sections:

```txt
# Verification: <Claim>

<metadata header>

## 1. Claim
## 2. Acceptance Evidence
## 3. Procedure
## 4. Current Evidence Status
## 5. Known Gaps
## 6. Traceability
## 7. Related Docs
```

### 6.7. Proposal

Proposals are non-canonical design candidates.

Required sections:

```txt
# Proposal: <Title>

<metadata header>

## 1. Problem
## 2. Proposed Change
## 3. Alternatives
## 4. Decision Requested
## 5. Impact Map
## 6. Unresolved Questions
## 7. Expiry / Promotion Outcome
```

### 6.8. Discussion Scratchpad

`DISCUSSION.md` or `<topic>-discussion.md` is a temporary shaping artifact.

It is non-canonical.

Required sections:

```txt
# <Topic> Discussion

<metadata header>

## 1. Current Summary
## 2. Open Questions
## 3. Tentative Decisions
## 4. Promoted Decisions
## 5. Rejected / Parked Alternatives
## 6. Evidence And Source Links
## 7. Promotion Targets
## 8. Raw Discussion Log
```

Lifecycle:

```txt
Open -> Active -> Stabilizing -> Promoting -> Drained -> Delete/Archive
```

Default outcome is delete after promotion. Archive only when the discussion
itself has long-term diagnostic or rationale value.

## 7. Authority Matrix

| Artifact | Authority | May establish | Must not establish |
|---|---|---|---|
| Discussion scratchpad | Non-canonical | Open questions, alternatives, evidence, provisional reasoning | Current behavior, binding rules, settled decisions |
| Spec | Canonical state authority | Current behavior, shared entities, observable flows | Long rationale or hidden design alternatives |
| Architecture | Canonical design authority | Why, boundaries, responsibility allocation, trade-offs | Detailed current implementation state as timeless truth |
| Contract | Canonical normative authority | Exact obligations, invariants, inputs/outputs, compatibility, handoff rules | Ambiguous rationale or optional guidance phrased as mandatory |
| Decision | Canonical decision provenance | Who decided what, when, why, alternatives, supersession | Silent rewriting of historical intent |
| Generated doc/index | Derived authority only | Faithful projection of declared sources | New policy, interpretation, independently edited facts |
| Guide/runbook | Operational guidance | Supported procedures and recovery paths | Override specs or contracts |
| History | Archive/evidence | Retired source material and context | Current authority |

Conflict rules:

- Contract overrides guide/runbook.
- Current spec overrides stale architecture wording about present behavior.
- Newer approved decision supersedes older decision.
- Generated output never overrides its source.
- A conflict is a documentation defect. It must be surfaced and reconciled, not
  silently fixed by an agent.

## 8. Metadata

Use compact metadata, either as front matter or as an equivalent registry entry.

Baseline fields:

```txt
title
doc_type
canonicality: canonical | discussion | generated
authority_scope
status: draft | proposed | approved | superseded | archived
owner
writers
approvers
approved_at
effective_at
last_reviewed_at
review_due
supersedes
superseded_by
depends_on
related_docs
evidence
change_trigger
```

Generated docs additionally declare:

```txt
source_of_truth
generator
generator_version
generated_at
freshness_check
do_not_edit: true
```

Metadata should not become ceremony. Each field must answer a practical
question: who owns this, what is it authoritative for, who approved it, what
evidence supports it, and when should it be reviewed?

## 9. Writing Method

Use these rules across canonical docs:

- Put the conclusion before the mechanism.
- Separate facts, decisions, requirements, proposals, and evidence visibly.
- Define stable terms once and link to their canonical definition.
- Make normative statements testable.
- Preserve meaningful dissent and rejected alternatives.
- Use diagrams only when they clarify boundaries, ownership, flow, or decision
  shape.
- Use numbered section headings in maintained docs so sections are easy to cite
  during review, discussion, decisions, and migration.
- Prefer progressive disclosure: portal -> overview -> spec -> architecture /
  contract / decision -> proof.
- Link to authority instead of copying authority.
- Treat agent authorship as provenance, not authority.

## 10. Linking Discipline

Every maintained document participates in the reading graph.

Area README links to:

- `spec.md`;
- main architecture docs;
- owned contracts;
- verification/proof docs;
- active proposals or discussions;
- related areas.

Spec links to:

- area README;
- contracts owned and consumed;
- architecture docs that explain non-obvious boundaries;
- verification docs/tests;
- relevant platform-level laws or component-boundary entries.

Architecture docs link to:

- affected spec;
- contracts created or changed by the design;
- decisions or proposals that justify it;
- verification expectations;
- `architecture-map.md` and `component-boundary.md` when cross-area.

Contracts link to:

- owner;
- consumers;
- source/implementation entry points when applicable;
- tests/proof;
- compatibility/version notes.

Decisions link to:

- affected specs;
- affected architecture docs;
- affected contracts;
- evidence/proposal/discussion source;
- superseded/superseding decisions.

Verification docs link to:

- the claim, spec, contract, or decision they prove;
- commands, test output, or evidence;
- known limitations.

Links should be typed where useful. Examples:

```txt
defines
constrains
implements
explains
evidenced_by
supersedes
consumes
```

## 11. Promotion Workflow

Architecture shaping follows this flow:

```txt
discussion -> proposal/decision -> canonical promotion -> verification -> archive/delete
```

Promotion rules:

1. Label discussion assertions as question, hypothesis, evidence, proposal, or
   settled candidate.
2. Identify the target canonical artifact before promotion:
   - current truth -> spec;
   - design rationale/boundary -> architecture;
   - mandatory precision -> contract;
   - choice/history -> decision;
   - proof -> verification.
3. Promotion carries evidence, owner, and review status.
4. Update affected documents enough that the reading graph remains truthful.
5. Replace promoted discussion content with a pointer to the canonical location.
6. Unresolved items stay unresolved with owner or next review trigger.
7. Agents may draft, cross-link, check consistency, and flag conflicts, but they
   must not silently elevate drafts to binding authority.

## 12. Framework Use

fgOS uses a native documentation model because system docs need authority,
provenance, lifecycle, human review, and agent collaboration rules.

External frameworks are influences:

- Diataxis is used for `docs/user/**`: tutorials, how-to, reference,
  explanation.
- Google developer documentation style informs clarity, directness, and
  scannable structure.
- OKF-like ideas inform typed metadata, indexes, git-readable knowledge, and
  human/agent portability.

These frameworks do not replace fgOS document taxonomy or authority rules.

## 13. Generated Docs

Generated docs must declare:

- source of truth;
- generator command/tool;
- generator version when available;
- generated timestamp;
- freshness check;
- do-not-edit status.

Generated files are projections. To change them, change their source or
generator.

Known generated/projection classes include:

- doc registry projections;
- decision indexes;
- end-user docs indexes;
- UI spec generated outputs;
- skill/agent wrapper mirrors.

`docs/specs/**` in the current repo should be treated as hand/agent-curated
living spec-state, not as generated output, unless a specific file proves
otherwise.

## 14. Failure Modes

The design must guard against these failures:

- Polished agent prose is mistaken for an approved decision.
- `DISCUSSION.md` becomes a fresher and easier-to-edit shadow spec.
- The same rule appears in spec, architecture, and contract without one owner.
- Agents silently reconcile contradictions instead of surfacing competing
  authorities.
- Generated files appear canonical because provenance or freshness is missing.
- Historical decisions are edited to match today instead of superseded.
- Links become a raw list rather than typed reading relationships.
- Agent authorship is captured, but human accountability and approval are not.
- Review dates lapse until "current behavior" becomes unverified.
- Operational convenience is promoted into normative contract without
  compatibility analysis and approval.

## 15. Migration Strategy

Migration should be staged.

1. Approve this design document.
2. Promote settled governance into `docs/doc-governance.md`.
3. Create or update `docs/README.md`, `docs/reading-map.md`, and
   `docs/platform/README.md`.
4. Create templates under `docs/templates/`.
5. Classify existing docs by type, authority, lifecycle, and provenance.
6. Move only one area at a time.
7. Add redirect/stub pointers when moving important existing paths.
8. Preserve provenance for migrated documents.
9. Delete temporary discussion files only after promotion or explicit discard.

No bulk migration should happen before governance and templates are reviewed.

## 16. Design Test

This documentation system succeeds when a human unfamiliar with an area can:

1. Find the area.
2. Understand what it owns.
3. Read the current behavior.
4. Understand the architecture rationale.
5. Find exact contracts.
6. See what is settled and what is open.
7. Review or challenge the right decision surface.
8. Find proof.
9. Understand how to make a change.

It also succeeds when an agent with no chat history can:

1. Read the right entry points.
2. Distinguish canonical truth from discussion/proposal/history.
3. Identify authority and provenance.
4. Avoid silently reconciling conflicts.
5. Leave behind evidence and promoted learning in the right place.
