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

Proposals remain subordinate to the surviving boundaries in [Vision](../vision.md). A current design frontier does not implicitly reopen an accepted boundary. The original [intent-preservation ledger](../history/retired-engine/files/intent-preservation-ledger.md#literal-snapshot) is dated preservation evidence, not current authority or an additional mandatory approval gate.

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

These snapshots record the retired coordination engine and its earlier design
frontier. Links into history preserve discussion and provenance; they do not
declare those contracts canonical or the engine delivered in the current release.

1. [Step 07: CoordinationSession, AdhocTask, And Planning Boundary](../history/retired-engine/files/proposals/step-07-coordination-session-adhoc-task.md#literal-snapshot)
   records the old session/planning discussion. Current inline validation is
   implemented in `src/runner/dispatch/execution-contract.mjs`; it is not waiting
   for acceptance of that retired proposal.
2. [Step 08: Standalone Coordination And Optional Protocols](../history/retired-engine/files/proposals/step-08-standalone-coordination-protocols.md#literal-snapshot)
   records the former coordination door and optional-protocol design, retired
   in 2180b4e72. Its [foundation baseline](../history/retired-engine/files/architecture/coordination-foundation-baseline.md#literal-snapshot),
   [CoordinationSession](../history/retired-engine/files/contracts/coordination-session.md#literal-snapshot)
   and [FlowDefinition](../history/retired-engine/files/contracts/flow-definition.md#literal-snapshot)
   links are historical evidence, not current runtime contracts.

## Related Architect-Level Intentions

- [Architecture Intent](../../../architect/architecture-intent.md) records wider,
  cross-component design intent; frozen legacy placement is not proof of current
  implementation.
- [Step 09: Group Thinking Substrate](../../../architect/proposals/step-09-group-thinking-substrate.md)
  records the earlier substrate proposal. Current named execution is defined by
  Workflow and CollaborationPattern owners, not the retired coordination door.
- [Step 10: Coding Domain Adoption Of The Coordination Foundation](../../../architect/proposals/step-10-coding-domain-adoption.md)
  records the earlier coding-adoption plan. Current coding operations and
  Workflow definitions must be checked in `domains/coding/`, not inferred from
  the old Step 08/ADR-010 proof sequence.
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
