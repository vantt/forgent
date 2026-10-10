# Agent Coordination Proposals

```txt
Document type: Collection index
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

Complete pre-rework input: [historical snapshot](../history/retired-engine/files/proposals/README.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.

All proposals remain subordinate to the surviving Agent Coordination foundation boundaries in [Vision](../vision.md). A current design frontier does not implicitly reopen an accepted boundary. Before narrowing it, reconcile the original intent in the [preservation ledger](../intent-preservation-ledger.md). This restores the live introduction; the historical snapshot retains its original wording.

## Migration Status

This target directory preserves the proposal frontier from
`docs/architect/agent-coordination/proposals/`. A target-path copy does not
promote its design: the status of every frontier source remains governed by
[Proposal Status](../history/documentation-migration/proposal-status.md).


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

1. [Step 07: CoordinationSession, AdhocTask, And Planning Boundary](../history/retired-engine/files/proposals/step-07-coordination-session-adhoc-task.md#literal-snapshot)
   is historical discussion. CoordinationSession, runtime boundaries, and
   Work authority decisions were promoted; AdhocTask and generalized inline
   execution-contract schema remain unaccepted/deferred.
2. [Step 08: Standalone Coordination And Optional Protocols](../history/retired-engine/files/proposals/step-08-standalone-coordination-protocols.md#literal-snapshot)
   is historical discussion for the delivered standalone coordination surface.
   Read [Coordination Foundation Baseline](../history/retired-engine/files/architecture/coordination-foundation-baseline.md#literal-snapshot),
   [CoordinationSession](../history/retired-engine/files/contracts/coordination-session.md#literal-snapshot), and
   [FlowDefinition](../history/retired-engine/files/contracts/flow-definition.md#literal-snapshot) for canonical design.

## Related Architect-Level Intentions

- [Architecture Intent](../../../architect/architecture-intent.md) preserves the wider
  design intent behind deferred architecture capabilities. Its first active
  thread covers group-thinking/problem-solving capability and sits at
  `docs/architect/` because the concern spans Agent Coordination, Work Driver,
  Dispatch/Run, Run Result Evaluation, and the Coding Domain adoption track.
- [Step 09: Group Thinking Substrate](../../../architect/proposals/step-09-group-thinking-substrate.md)
  discusses the standalone, no-Work group-thinking substrate expansion. The
  first useful proof fixture is a Master Coordination style loop with external
  driver authority, bounded optional rounds, recheck, and disposition.
- [Step 10: Coding Domain Adoption Of The Coordination Foundation](../../../architect/proposals/step-10-coding-domain-adoption.md)
  discusses bringing the existing coding domain onto the Step 08 foundation:
  duplicate-mechanism inventory, seams, the foundation capabilities coding
  still needs, and a candidate step sequence gated on ADR-010 §5's proof.
- [Component Authority Boundary Map](../../../architect/proposals/component-authority-boundary-map.md)
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
