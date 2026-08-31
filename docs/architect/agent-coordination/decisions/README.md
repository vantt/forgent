# Agent Coordination Architecture Decisions

Document type: Index
Design status: Accepted
Implementation: Active
Last reviewed: 2026-08-31
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

ADR-006 and ADR-007 extract the Step 07 MVP boundary accepted on 2026-08-31;
the remaining Step 07 questions (session/ledger, task graph, mutation and
isolation, planning materialization, nested Work topology) stay in the
proposal's discussion checkpoints.

Other discussion-stage schema and implementation choices from Step 07 and
Step 08 must not be added here until explicitly accepted. They also must not reopen or
contradict Vision decisions without changing the Vision first.
