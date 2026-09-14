# Platform Intent Preservation Ledger

```txt
Document type: Intent preservation ledger
Audience: Human reviewer, architect, maintainer, agent
Purpose: Preserve full platform intent across simplified implementation slices
Design status: Draft
Implementation status: Partial
Canonical: Yes, after review
Owner: Platform documentation
Source type: Promoted from documentation-system discussion and existing area ledgers
Last reviewed: 2026-09-14
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

| ID | Original intent | Status | Current slice | Must not preclude | Revisit trigger |
|---|---|---|---|---|---|
| PF-I001 | fgOS supports development of other projects and business-base workflows, not only dogfooding itself. | partial | Current repo dogfoods fgOS heavily while global fgOS is also used by other projects. | Do not optimize documentation or runtime shape only for self-development convenience. | Any area design chooses a cheaper path for fgOS itself that slows projects using fgOS. |
| PF-I002 | Humans remain present for judgment, review, and architectural approval while agents handle repeatable work. | partial | Documentation governance and discussion scratchpads support human review. | Do not make generated docs, hidden state, or agent-only conventions the only source of design truth. | Any workflow cannot be reviewed by a human without chat history. |
| PF-I003 | Small implementation slices must preserve the larger intended architecture. | partial | This ledger and area ledgers track deferred-preserved intent. | Do not treat a simplified slice as the final design unless a decision explicitly says so. | Any rewrite or implementation plan narrows an accepted vision. |
| PF-I004 | The documentation system is a human-readable decision surface, not only an agent memory store. | partial | `docs/README.md`, `reading-map.md`, governance, related links, and heading rules exist. | Do not accept docs that are complete for agents but hard for humans to navigate and approve. | Any new area migration creates canonical docs without readable portal, related links, status, and proof. |

## 5. Area Ledgers

| Area | Ledger | Notes |
|---|---|---|
| Agent coordination | [../architect/agent-coordination/intent-preservation-ledger.md](../architect/agent-coordination/intent-preservation-ledger.md) | Existing mature ledger; target migration should preserve it. |
| Host invocation | [../architect/host-invocation-routing/documentation-standardization-plan.md](../architect/host-invocation-routing/documentation-standardization-plan.md) | Plan requires creating `docs/platform/host-invocation/intent-preservation-ledger.md`. |
| Packaging-distribution | planned | Should be added if future implementation slices narrow the accepted packaging vision. |

## 6. Related Files

| Relationship | File |
|---|---|
| platform vision | [vision.md](vision.md) |
| platform laws | [platform-foundations.md](platform-foundations.md) |
| component boundary map | [component-boundary.md](component-boundary.md) |
| documentation governance | [../doc-governance.md](../doc-governance.md) |
