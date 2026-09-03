# Agent Coordination Documentation Governance

Document type: Policy
Design status: Accepted
Implementation: Active
Last reviewed: 2026-08-31
Canonical for: document taxonomy, authority, metadata, and maintenance rules

## Purpose

This policy keeps design truth separate from proposals, delivery plans,
verification evidence, operating instructions, and historical records.

## Document Types

| Type | Purpose | Normative |
|---|---|---|
| Vision | Highest-level product identity, foundation boundaries, and direction. | Yes. |
| Portal | Top-level navigation and reading paths. | No. |
| Policy | Documentation authority and maintenance rules. | Yes, for documentation. |
| Index | Navigation within one documentation area. | No. |
| Vocabulary | Canonical names, definitions, aliases, and concept relationships. | Yes, for terminology. |
| Architecture | Accepted system boundaries, responsibilities, and invariants. | Yes. |
| Contract | Accepted machine-facing or behavioral interface. | Yes. |
| Proposal | Design under discussion or review. | No. |
| ADR | Durable record of one accepted or rejected architecture decision. | Yes for accepted decisions. |
| Roadmap | Time-ordered implementation sequence and acceptance plan. | No new architecture authority. |
| Verification | Tests, live proof, traceability, and conformance evidence. | Evidence, not design authority. |
| Playbook | Engineering bootstrap, maintenance, or manual fallback procedure. | Operational only; never product runtime authority. |
| History | Superseded, exploratory, or implementation-era source material. | No. |

## Required Metadata

Every maintained Markdown design document should identify:

```txt
Document type: <type>
Design status: Discussion | Proposed | Accepted | Superseded | N/A
Implementation: Not started | Partial | Implemented | Verified | Drifted | Active | N/A
Last reviewed: YYYY-MM-DD
Canonical for: <subject or "nothing">
```

Optional metadata:

```txt
Supersedes: <document links>
Superseded by: <document links>
Related: <document links>
```

Design status and implementation state are independent. An accepted contract
may be only partially implemented; an implemented prototype may still embody a
discussion-stage design.

## Authority Order

When documents disagree, use this order:

1. accepted Vision for product identity, foundation boundaries, and direction;
2. accepted ADR for a specific decision within the Vision;
3. accepted contract for machine-visible behavior;
4. accepted architecture document;
5. canonical vocabulary for term meaning;
6. proposal;
7. roadmap;
8. playbook;
9. verification or history as evidence of what happened.

The Vision is not a substitute for exact schemas or state rules. ADRs and
contracts refine it, but they cannot silently make a Vision capability
mandatory, optional, or impossible in the opposite direction.

An implementation mismatch does not silently rewrite the design. Mark the
implementation state `Drifted`, then reconcile code or amend the accepted
decision explicitly.

## Source-Of-Truth Rules

- Define a term only in `vocabulary/`; other documents link to it.
- Put product identity and foundation-versus-domain boundaries in `vision.md`.
- Put durable system boundaries in `architecture/`, not numbered steps.
- Put exact schemas and state/evidence rules in `contracts/`.
- Keep unresolved alternatives in `proposals/` until accepted.
- Record accepted choices and rejected alternatives in `decisions/`.
- Roadmaps may reference architecture and contracts but must not redefine them.
- Test output and live proof belong in `verification/`.
- Prompt templates and team execution procedures belong in `playbooks/`.
- Runtime Skills/prose belong in `core/skills/` or `domains/<domain>/skills/`,
  with TaskSpecs and protocol/workflow configuration beside their runtime
  ownership layer; they must not depend on documentation playbooks.
- Historical documents must state that they are non-canonical.

## Change Rules

- A canonical term change that affects boundaries requires an ADR or an update
  to the ADR that owns the decision.
- A change to product identity or the foundation/domain boundary updates the
  Vision first, then reconciles every affected downstream document.
- An accepted contract change requires compatibility and migration notes.
- Proposal approval requires extracting accepted content into canonical docs;
  do not merely relabel the entire proposal as accepted.
- Superseded files remain searchable in `history/` when they contain useful
  rationale or implementation evidence.
- Cross-links must be checked after every move or rename.
