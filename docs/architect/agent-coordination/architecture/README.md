# Agent Coordination Architecture

Document type: Index
Design status: Accepted
Implementation: Partial
Last reviewed: 2026-09-01
Canonical for: navigation across accepted architecture

## Documents

Read the [Agent Coordination Foundation Vision](../vision.md) before this
directory. Architecture refines that direction into accepted system boundaries.

1. [System Context](system-context.md) defines system purpose and major
   authority boundaries.
2. [Protocol Model](protocol-model.md) defines declared and agent-led planning
   sources plus the hard/soft coordination model around Workflow, Stage,
   Operation, TaskSpec, Skill, and Role.
3. [Runtime Model](runtime-model.md) defines Assignment, dispatch, Run,
   RunResult, and evidence flow.
4. [Work Integration](work-integration.md) defines how coordination may attach
   to Work without becoming a second lifecycle authority.
5. [Dispatch Control Plane](dispatch-control-plane.md) defines the separation
   between semantic operation choice and execution infrastructure.
6. [Evidence And Results](evidence-and-results.md) defines outcome confidence
   and false-success boundaries.
7. [Visibility And Herdr](visibility-and-herdr.md) defines the observability
   boundary.

CoordinationSession's identity/persistence boundary and the shared
FlowDefinition graph/operation/policy IR are accepted per
[ADR-008](../decisions/ADR-008-coordination-session-and-mission-deferral.md)
and [ADR-009](../decisions/ADR-009-flow-definition-shared-ir-and-typed-profiles.md)
(schemas in [contracts/](../contracts/README.md)). Unaccepted extensions,
including the full CoordinationSession runtime, AdhocTask, and the broader
standalone protocol catalog, remain in [proposals](../proposals/README.md).
