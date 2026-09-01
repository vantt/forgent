# Agent Coordination Architecture Decisions

Document type: Index
Design status: Accepted
Implementation: Active
Last reviewed: 2026-09-01
Canonical for: decision-record navigation

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
8. [ADR-008: CoordinationSession As V1 Recovery Root, One-Way Assignment Membership, And Mission Deferral](ADR-008-coordination-session-and-mission-deferral.md)
9. [ADR-009: Versioned FlowDefinition As Shared Graph/Operation/Policy IR With Typed Profiles](ADR-009-flow-definition-shared-ir-and-typed-profiles.md)
10. [ADR-010: Interactive/Headless Capability Parity And Domain-Owned Work Isolation](ADR-010-interactive-headless-parity-and-work-isolation.md)

ADR-006 and ADR-007 extract the Step 07 MVP boundary accepted on 2026-08-31;
the remaining Step 07 questions (task graph, mutation and isolation, planning
materialization, nested Work topology) stay in the proposal's discussion
checkpoints. ADR-008, ADR-009, and ADR-010 extract the Step 08 Phase 00
checkpoint decisions accepted on 2026-09-01
(see [Intent Preservation Ledger](../intent-preservation-ledger.md)); the
remaining Step 08 runtime (consult/research/Group Cognition implementation,
Cohort Planner, communication topology enforcement) stays in the proposal's
discussion checkpoints and roadmap.

Other discussion-stage schema and implementation choices from Step 07 and
Step 08 must not be added here until explicitly accepted. They also must not reopen or
contradict Vision decisions without changing the Vision first.
