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

This directory has been promoted from
`docs/architect/agent-coordination/decisions/` during the platform
documentation migration. ADR IDs, titles, decisions, consequences, and
implementation notes are preserved; this index does not merge ADRs into a
summary replacement.

## Accepted Decisions

The [Agent Coordination Foundation Vision](../vision.md) records accepted
direction decisions V-001 through V-012 above the specific ADRs below.

1. [ADR-001: Work Owns Delivery Lifecycle](ADR-001-work-lifecycle-authority.md)
2. [ADR-002: Preserve Stage Primary Operation Compatibility](ADR-002-stage-operation-compatibility.md)
3. [ADR-003: Separate Assignment, Run, And RunResult](ADR-003-assignment-run-runresult-separation.md)
4. [ADR-004: Reserve Job For A Future Scheduler](ADR-004-reserve-job.md)
5. [ADR-005: Herdr Is Visibility, Not Evidence](ADR-005-herdr-visibility-only.md)
6. [ADR-006: Assignment Provenance And Normalized Execution-Contract Snapshot](ADR-006-assignment-provenance-and-contract-snapshot.md)
7. [ADR-007: Domain Harness Seam And Non-Driving Inline Evidence](ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md)
8. [ADR-008: CoordinationSession As V1 Recovery Root, One-Way Assignment Membership, And Mission Deferral](../history/retired-engine/files/decisions/ADR-008-coordination-session-and-mission-deferral.md#literal-snapshot)
9. [ADR-009: Versioned FlowDefinition As Shared Graph/Operation/Policy IR With Typed Profiles](../history/retired-engine/files/decisions/ADR-009-flow-definition-shared-ir-and-typed-profiles.md#literal-snapshot)
10. [ADR-010: Interactive/Headless Capability Parity And Domain-Owned Work Isolation](../history/retired-engine/files/decisions/ADR-010-interactive-headless-parity-and-work-isolation.md#literal-snapshot)

ADR-006 and ADR-007 extract the Step 07 MVP boundary accepted on 2026-08-31;
the remaining Step 07 questions (task graph, mutation and isolation, planning
materialization, nested Work topology) stay in the proposal's discussion
checkpoints. ADR-008, ADR-009, and ADR-010 extract the Step 08 Phase 00
checkpoint decisions accepted on 2026-09-01
(see [Intent Preservation Ledger](../history/retired-engine/files/intent-preservation-ledger.md#literal-snapshot)). As of
Step 08's close (Phase 07, P07.2), the runtime these three ADRs name --
CoordinationSession, the shared FlowDefinition kernel, consult/research/Group
Cognition, Cohort Planner, and interactive/headless capability parity -- is
implemented and live-proved; see each ADR's own `Implementation` line and the
plan's own final Deferral Audit
(`docs/architect/agent-coordination/verification/step-08-standalone-coordination/deferral-audit.md`)
for what remains `deferred-preserved` (Mission, additional frameworks,
organization overlays, AgentMessage, AdhocTask, provider scoring/router,
telemetry, herdr, and Work-attached mutation).

Other discussion-stage schema and implementation choices from Step 07 and
Step 08 must not be added here until explicitly accepted. They also must not reopen or
contradict Vision decisions without changing the Vision first.
