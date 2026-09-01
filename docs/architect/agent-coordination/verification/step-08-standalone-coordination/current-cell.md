# Current Cell

Cell: P00.1
Status: in-progress
Owner: Doer (pending dispatch)
Last updated: 2026-09-01
Next action: doer

## Goal

Promote the maintainer-approved Step 08 checkpoint decisions into accepted
canonical docs: new ADR(s) for CoordinationSession/FlowDefinition/parity,
contracts for CoordinationSession persistence/recovery and FlowDefinition/
profile schemas, architecture/vocabulary/spec updates, and decision
reconciliation. No runtime code in this cell.

## Non-Goals

Dispatch/policy code (P00.2), CLI wiring (P00.3), any `src/runner/
coordination/**` module, Work lifecycle code, protocol config.

## Must Read

- `plans/260901-1542-step08-standalone-coordination/plan.md` (Locked Product
  Decisions)
- `plans/260901-1542-step08-standalone-coordination/phase-00-canonical-contracts-and-dispatch-prerequisites.md`
  (R1-R4, Files, Tests First, Proofs And Exit)
- `plans/reports/reviewer-260901-1403-GH-07-step08-pre-plan-architecture-review.md`
  (H1 SessionActor; M7 one-way ledger; M8 drop `purpose`; M4/M5/L1)
- `docs/architect/agent-coordination/decisions/ADR-006-*.md`,
  `ADR-007-*.md` (read only, do not edit in place)
- `docs/architect/agent-coordination/vocabulary/canonical-concepts.md`
- `docs/architect/agent-coordination/architecture/{protocol-model,work-integration,dispatch-control-plane}.md`
- `docs/architect/agent-coordination/documentation-governance.md` (metadata/authority rules)
- `docs/specs/reading-map.md`, `docs/specs/runner.md` (Assignment/coordination area)

## May Inspect

`docs/architect/agent-coordination/**`, `docs/specs/**`,
`plans/260831-1637-step07-inline-assignment-mvp/plan.md` (stale row only).

## Do Not Touch

`src/**`, `test/**`, `domains/**`, ADR-006/007 body text (annotate via new
ADR only), any file outside `docs/`.

## Tests First

N/A (doc-only cell) — link/metadata checks only where repository precedent
exists (documentation-governance.md Required Metadata block on every new/
changed canonical doc).

## Acceptance

Per phase-00 "Proofs And Exit": accepted docs contain no unresolved choice
needed by Phase 01; R1-R4 fully covered; pre-plan corrections (SessionActor,
one-way ledger, drop `purpose`, phase order 8.0->8.2->8.1->8.3) reflected.

## Bug Taxonomy

Silently promoting proposal prose to normative without extraction; reopening
ADR-006/007 by editing in place instead of a new ADR; leaving `Participant`
naming collision (H1) unresolved; missing compatibility/rejected-alternatives
sections; stale cross-links after doc moves.

## Trace Update

Proof Matrix, Commands, Gaps in `P00.1.md`.
