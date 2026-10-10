# Agent Coordination Architecture Decisions

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

Complete pre-rework input: [historical snapshot](../history/retired-engine/files/decisions/README.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.

## Migration Status

This directory was promoted from the frozen legacy decision tree. Complete
input text remains in the preserved historical snapshots. Current titles,
scope and implementation notes have been corrected after independent review;
there is no claim that every current ADR is verbatim or that this index
replaces individual decisions.

## Accepted Decisions

The [foundation vision](../vision.md) distinguishes surviving principles from
historical engine decisions. Current implementation evidence governs which
parts of a retained ADR still apply; this index does not revive retired runtime.

1. [ADR-001: Work Owns Delivery Lifecycle](ADR-001-work-lifecycle-authority.md)
2. [ADR-002: Preserve Workflow Step Primary Operation Compatibility](ADR-002-stage-operation-compatibility.md)
3. [ADR-003: Separate Assignment, Run, And RunResult](ADR-003-assignment-run-runresult-separation.md)
4. [ADR-004: Reserve Job For A Future Scheduler](ADR-004-reserve-job.md)
5. [ADR-005: Herdr Is Visibility, Not Evidence](ADR-005-herdr-visibility-only.md)
6. [ADR-006: Assignment Provenance And Normalized Execution-Contract Snapshot](ADR-006-assignment-provenance-and-contract-snapshot.md)
7. [ADR-007: Domain Harness Seam And Non-Driving Inline Evidence](ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md)
8. [ADR-011: Dispatch Owns Lifecycle; Receiver Writes Receipt](ADR-011-dispatch-owns-lifecycle-receiver-writes-receipt.md)

Historical decisions, not current session/IR authority:

- [ADR-008: CoordinationSession And Mission Deferral](../history/retired-engine/files/decisions/ADR-008-coordination-session-and-mission-deferral.md#literal-snapshot)
- [ADR-009: FlowDefinition Shared IR And Typed Profiles](../history/retired-engine/files/decisions/ADR-009-flow-definition-shared-ir-and-typed-profiles.md#literal-snapshot)
- [ADR-010: Interactive/Headless Parity And Work Isolation](../history/retired-engine/files/decisions/ADR-010-interactive-headless-parity-and-work-isolation.md#literal-snapshot)

Their Step 07/08 acceptance and proof records describe the engine at that time,
not the current runtime after retirement in 2180b4e72. Surviving parity/isolation
obligations require current implementation evidence; historical proof does not
make CoordinationSession, FlowDefinition or Cohort Planner current entities.
The [original intent ledger](../history/retired-engine/files/intent-preservation-ledger.md#literal-snapshot)
preserves that provenance without acting as today's approval gate.

Other discussion-stage schema and implementation choices from Step 07 and
Step 08 must not be added here until explicitly accepted. They also must not reopen or
contradict Vision decisions without changing the Vision first.
