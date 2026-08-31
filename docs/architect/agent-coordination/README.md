# Agent Coordination Documentation

Document type: Portal
Design status: Accepted
Implementation: Partial
Last reviewed: 2026-08-31
Canonical for: navigation only

## Purpose

This documentation describes how fgOS coordinates agents across providers,
models, tiers, roles, capabilities, and execution mechanisms while preserving
Work lifecycle authority and evidence integrity.

The documentation is organized by authority. Canonical vocabulary and accepted
architecture are separated from proposals, implementation roadmaps,
verification evidence, playbooks, and history.

Read [Documentation Governance](documentation-governance.md) before changing
definitions, statuses, or document placement.

## Start Here

### Understand The System

1. [Vocabulary](vocabulary/README.md)
2. [System Context](architecture/system-context.md)
3. [Protocol Model](architecture/protocol-model.md)
4. [Runtime Model](architecture/runtime-model.md)
5. [Work Integration](architecture/work-integration.md)
6. [Dispatch Control Plane](architecture/dispatch-control-plane.md)
7. [Evidence And Results](architecture/evidence-and-results.md)
8. [Visibility And Herdr](architecture/visibility-and-herdr.md)

### Implement Or Review Current Contracts

1. [Workflow Stage Operation Contract](contracts/workflow-stage-operation.md)
2. [Assignment, Run, And RunResult Contract](contracts/assignment-run-runresult.md)
3. [Architecture Decisions](decisions/README.md)
4. [Team Dispatch V1 Verification](verification/team-dispatch-v1/index.md)

### Continue The Design Discussion

1. [Step 07: CoordinationSession And AdhocTask](proposals/step-07-coordination-session-adhoc-task.md)
2. [Step 08: Standalone Coordination Protocols](proposals/step-08-standalone-coordination-protocols.md)
3. [Team Communication Protocol V1](proposals/team-communication-protocol-v1.md)
4. [Dispatch Control Plane Redesign](proposals/dispatch-control-plane-redesign.md)

## Documentation Areas

| Area | Authority | Contents |
|---|---|---|
| [`vocabulary/`](vocabulary/README.md) | Canonical terminology | Terms, relationships, aliases, reserved/deprecated vocabulary. |
| [`architecture/`](architecture/README.md) | Accepted design | System boundaries, responsibilities, trust model, and invariants. |
| [`contracts/`](contracts/README.md) | Accepted behavior | Machine-visible schemas, normalization, validation, state, and evidence rules. |
| [`decisions/`](decisions/README.md) | Accepted decisions | ADRs with context, decision, and consequences. |
| [`proposals/`](proposals/README.md) | Non-canonical | Discussion drafts and target designs awaiting approval. |
| [`roadmap/`](roadmap/README.md) | Implementation sequence | Numbered Steps, files, tests, rollout, and acceptance plans. |
| [`verification/`](verification/README.md) | Conformance evidence | Traceability, tests, negative cases, review, red-team, and live proof. |
| [`playbooks/`](playbooks/README.md) | Engineering bootstrap only | Manual coordinator/doer/reviewer workflows and fallback procedures; never a runtime dependency. |
| [`history/`](history/README.md) | Non-canonical history | Brainstorms, superseded plans, and pre-migration source material. |

## Current Accepted Baseline

Team Dispatch V1 currently establishes:

- Work as the sole delivery lifecycle authority;
- Workflow Stage Operations with `stage.skill`/`stage.taskSpec` primary
  compatibility;
- operation normalization, lookup, and setup/doctor validation;
- Assignment as semantic request;
- governed dispatch and CLI-spawn execution;
- Run as one attempt and RunResult as normalized outcome/evidence;
- driver selection of bounded legal Stage Operations;
- Work-attached adoption for selected planning/executing operations;
- Herdr as visibility rather than truth;
- Job reserved for a future scheduler.

## Active Design Frontier

The next design frontier remains intentionally non-canonical:

```txt
Step 07
  CoordinationSession
  AdhocTask graph
  planning materialization
  lifecycle versus isolation
  Work integration and branch topology

Step 08
  Work-independent coordination
  research / consult / brainstorm / debate
  leader-worker and peer communication
  protocol graph and synthesis
  migration of the mission-lite prototype
```

Step 07 and Step 08 are discussion drafts. Their proposed entities and schemas
must not be treated as accepted contracts until promoted according to
[Documentation Governance](documentation-governance.md).

## Core Invariants

```txt
Work owns delivery lifecycle.
Protocol definition constrains legal operations.
Assignment carries semantic intent.
Dispatch governs execution infrastructure.
Run records one attempt.
RunResult records normalized outcome and evidence.
Herdr provides visibility only.
```

## Maintenance Rules

- Update vocabulary before introducing a new canonical term.
- Record durable boundary decisions with an ADR.
- Keep numbered Steps in roadmap/proposals, not canonical architecture.
- Keep prompts out of architecture and contracts.
- Keep test/live-run output in verification.
- Mark historical sources as non-canonical instead of deleting rationale.
- Check all local links after moving documents.
