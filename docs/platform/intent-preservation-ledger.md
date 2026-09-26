# Platform Intent Preservation Ledger

```txt
Document type: Intent preservation ledger
Audience: Human reviewer, architect, maintainer, agent
Purpose: Preserve full platform intent across simplified implementation slices
Design status: Draft
Implementation status: Partial
Canonical: Proposed preservation surface; requires explicit acceptance
Owner: Platform documentation
Source type: Promoted from documentation-system discussion and existing area ledgers
Last reviewed: 2026-09-25
Related:
- docs/platform/vision.md
- docs/platform/platform-foundations.md
- docs/platform/component-boundary.md
- docs/doc-governance.md
```

## 1. Purpose

This ledger preserves platform intent that is bigger than the current
implementation slice.

fgOS often starts from a full intended shape, then ships smaller pieces first.
Those smaller pieces are allowed and often necessary. They must not become the
new accidental vision merely because a later agent reads only the simplified
implementation.

Use this ledger to keep the original direction visible until it is implemented,
explicitly superseded, or explicitly rejected.

## 2. Status Vocabulary

| Status | Meaning |
|---|---|
| `implemented` | The intent is implemented and has evidence. |
| `partial` | Some implementation exists, but the full intent is not satisfied. |
| `deferred-preserved` | Not implemented in the current slice, but still intended; current work must not preclude it. |
| `accepted-not-implemented` | Accepted design direction with no current implementation proof. |
| `superseded` | Replaced by an explicit accepted decision. |
| `rejected` | Explicitly abandoned by human decision with rationale. |
| `unknown` | Needs fresh scan or review before use. |

Silence, omission from a phase, or implementation inconvenience does not change
intent status.

## 3. Required Entry Shape

| Field | Meaning |
|---|---|
| `ID` | Stable platform-scoped id, `PF-I###`. |
| `Original intent` | The full intent that must not be lost. |
| `Source` | Vision, decision, discussion, or older source document. |
| `Status` | One status from §2. |
| `Current slice` | What exists or is currently planned. |
| `Must not preclude` | Constraint on simplified implementation. |
| `Revisit trigger` | When to reopen the full intent. |
| `Proof / evidence` | Links to implementation, verification, or decision evidence. |

## 4. Platform-Level Preserved Intents

| ID | Original intent | Source | Status | Current slice | Must not preclude | Revisit trigger | Proof / evidence |
|---|---|---|---|---|---|---|---|
| PF-I001 | fgOS supports development of other projects and business-base workflows, not only dogfooding itself. | `AGENTS.md` D-ADR0035 | partial | Current repo dogfoods fgOS heavily while global fgOS is also used by other projects. | Do not optimize documentation or runtime shape only for self-development convenience. | Any area design chooses a cheaper path for fgOS itself that slows projects using fgOS. | `docs/specs/platform-foundations.md` decision history |
| PF-I002 | Humans remain present for judgment, review, and architectural approval while agents handle repeatable work. | `docs/platform/vision.md`; `docs/doc-governance.md` | partial | Documentation governance and discussion scratchpads support human review. | Do not make generated docs, hidden state, or agent-only conventions the only source of design truth. | Any workflow cannot be reviewed by a human without chat history. | Current portals, discussion records, and approval gates |
| PF-I003 | Small implementation slices must preserve the larger intended architecture. | Documentation-system discussion and area intent ledgers | partial | This ledger and area ledgers track deferred-preserved intent. | Do not treat a simplified slice as the final design unless a decision explicitly says so. | Any rewrite or implementation plan narrows an accepted vision. | This ledger plus area ledgers |
| PF-I004 | The documentation system is a human-readable decision surface, not only an agent memory store. | `docs/doc-governance.md`; full-horizon proposal | partial | `docs/README.md`, `reading-map.md`, governance, related links, and heading rules exist. | Do not accept docs that are complete for agents but hard for humans to navigate and approve. | Any migration creates canonical docs without readable portal, related links, status, and proof. | Existing portal/read-map structure |
| PF-I005 | Maintained platform authority converges under one topology rooted at `docs/platform/**`; legacy platform roots do not remain permanent competing authority. | `proposals/documentation-system-unification.md` H1 | accepted-not-implemented | Several promoted/candidate platform areas coexist with legacy/current and root authority sources. | Candidate transformation may be area-by-area, but no new area may silently flip authority or instruct readers to guess between roots. | Repository-wide inventory and conservation gate are complete and atomic normalization is ready. | `plans/260925-documentation-authority-unification/plan.md` |
| PF-I006 | The Knowledge and Documentation Engine is a durable, multi-profile authority for document, claim, decision, provenance, lifecycle, graph, and read-model truth. | Full-horizon proposal H2; historical registry discussion | deferred-preserved | `tsk-28x` provides topic/doc lifecycle, aliases, projections, and writer gates for a narrower Diataxis slice. | Do not replace the event-sourced foundation with a parallel registry or bind migration identity only to paths/Diataxis. | Platform authority cutover completes, or maintenance friction justifies earlier profile generalization without blocking cutover. | `src/state/knowledge-registry.mjs`; `plans/260825-1841-knowledge-registry/` |
| PF-I007 | The Agent Context Engine remains a separate derived component that compiles effective instructions, decisions, ownership, and budgeted task-scoped reading plans. | Full-horizon proposal H3 | deferred-preserved | Instruction composition/projection and decision index are partial seeds; no context packet compiler exists. | Retain area, authority, source, relationship, decision-lineage, and digest seams; generated context never becomes canonical. | Canonical platform corpus and minimum graph/decision reduction can support deterministic selection. | `core/instructions/**`; `docs/decisions/index.md` |
| PF-I008 | Documentation production history separates immutable origin, append-only contributions, generation, verification, freshness, and canonical authority. | Full-horizon proposal §4; OKF v0.2 distillation | deferred-preserved | Existing frontmatter and registry capture parts of provenance. | Never infer canonicality from agent/human authorship or `verified` alone; stable source ids survive reorder and migration. | Multi-profile registry schema or contribution intake is designed. | `docs/distillery/sources/okf.md`; current registry events/schema |
| PF-I009 | Executable proof may bind sanctioned computations/checks, typed parameters, receipts, and deterministic attesters without agents improvising proof definitions. | Full-horizon proposal; OKF v0.2 distillation | deferred-preserved | No general documentation-proof runtime exists; verification is path/test/evidence-link based. | Preserve evidence references; do not invent a premature receipt ABI, attester ABI, or sandbox. | A recurring claim needs rerunnable mechanical proof and justifies a runtime contract. | `docs/distillery/sources/okf.md`; existing verification artifacts |
| PF-I010 | User/end-user knowledge and platform authority are distinct profiles inside one governed system, not physically or semantically conflated. | Full-horizon proposal H1/H2 boundary | deferred-preserved | `docs/knowledge/**` is registry-backed while user legacy roots and split platform authority remain. | Platform cutover classifies user relationships without folding user material into specs/architecture; program completion requires explicit user topology. | Platform cutover stabilizes and H2 profile topology opens. | `docs/knowledge/**`; `docs/doc-registry.json`; active H1 plan |

## 5. Area Ledgers

| Area | Ledger | Notes |
|---|---|---|
| Agent coordination | [agent-coordination/intent-preservation-ledger.md](agent-coordination/intent-preservation-ledger.md) | Target ledger is the routed current surface; legacy ledger remains inventory input until H1 cutover. |
| Host invocation | [host-invocation-routing/intent-preservation-ledger.md](host-invocation-routing/intent-preservation-ledger.md) | Existing target ledger; preserve source lineage from the legacy standardization plan. |
| Packaging-distribution | planned | Should be added if future implementation slices narrow the accepted packaging vision. |
| Documentation system | [proposals/documentation-system-unification.md](proposals/documentation-system-unification.md) | Full-horizon proposal; active H1 plan is `plans/260925-documentation-authority-unification/plan.md`. |

## 6. Related Files

| Relationship | File |
|---|---|
| platform vision | [vision.md](vision.md) |
| platform laws | [platform-foundations.md](platform-foundations.md) |
| component boundary map | [component-boundary.md](component-boundary.md) |
| documentation governance | [../doc-governance.md](../doc-governance.md) |
