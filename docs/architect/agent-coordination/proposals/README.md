# Agent Coordination Proposals

Document type: Index
Design status: Discussion
Implementation: Partial
Last reviewed: 2026-09-02
Canonical for: nothing; proposals must be promoted into architecture/contracts/ADRs

All proposals are subordinate to the
[Agent Coordination Foundation Vision](../vision.md). They resolve open design
shape and may not reopen its accepted foundation boundaries implicitly.
Before narrowing an active proposal, reconcile it with the
[Intent Preservation Ledger](../intent-preservation-ledger.md).

## Active Proposals

1. [Dispatch Control Plane Redesign](dispatch-control-plane-redesign.md) contains
   the detailed target and implementation-era findings behind the canonical
   dispatch summary.
2. [Team Communication Protocol V1](team-communication-protocol-v1.md) proposes
   role-to-role message and operation doctrine.

## Promoted History

These proposals are no longer the active design frontier. Their accepted parts
have been promoted into architecture, contracts, and ADRs; their unresolved
parts remain explicitly deferred.

1. [Step 07: CoordinationSession, AdhocTask, And Planning Boundary](step-07-coordination-session-adhoc-task.md)
   is historical discussion. CoordinationSession, runtime boundaries, and
   Work authority decisions were promoted; AdhocTask and generalized inline
   execution-contract schema remain unaccepted/deferred.
2. [Step 08: Standalone Coordination And Optional Protocols](step-08-standalone-coordination-protocols.md)
   is historical discussion for the delivered standalone coordination surface.
   Read [Coordination Foundation Baseline](../architecture/coordination-foundation-baseline.md),
   [CoordinationSession](../contracts/coordination-session.md), and
   [FlowDefinition](../contracts/flow-definition.md) for canonical design.

## Related Architect-Level Intentions

- [Architecture Intent](../../architecture-intent.md) preserves the wider
  design intent behind deferred architecture capabilities. Its first active
  thread covers group-thinking/problem-solving capability and sits at
  `docs/architect/` because the concern spans Agent Coordination, Work Driver,
  Dispatch/Run, Run Result Evaluation, and the Coding Domain adoption track.
- [Step 09: Group Thinking Substrate](../../proposals/step-09-group-thinking-substrate.md)
  discusses the standalone, no-Work group-thinking substrate expansion. The
  first useful proof fixture is a Master Coordination style loop with external
  driver authority, bounded optional rounds, recheck, and disposition.
- [Step 10: Coding Domain Adoption Of The Coordination Foundation](../../proposals/step-10-coding-domain-adoption.md)
  discusses bringing the existing coding domain onto the Step 08 foundation:
  duplicate-mechanism inventory, seams, the foundation capabilities coding
  still needs, and a candidate step sequence gated on ADR-010 §5's proof.
- [Component Authority Boundary Map](../../proposals/component-authority-boundary-map.md)
  is the parallel architect-level authority/layout draft for cross-component
  placement and forbidden dependencies.

## Promotion Rule

Approving a proposal means extracting:

- term changes into `vocabulary/`;
- durable boundaries into `architecture/`;
- exact behavior into `contracts/`;
- accepted choices and rejected alternatives into `decisions/`;
- implementation sequence into `roadmap/`.

Do not relabel an entire mixed proposal as canonical.
