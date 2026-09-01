# Agent Coordination Contracts

Document type: Index
Design status: Accepted
Implementation: Partial
Last reviewed: 2026-09-01
Canonical for: navigation across accepted behavioral contracts

Read the [Agent Coordination Foundation Vision](../vision.md) first. Contracts
define exact behavior beneath it and cannot make Work or a predeclared protocol
universally mandatory.

## Contracts

1. [Workflow Stage Operation](workflow-stage-operation.md) defines operation
   normalization, lookup, references, validation, and compatibility behavior.
2. [Assignment, Run, And RunResult](assignment-run-runresult.md) defines semantic
   request, execution attempt, normalized outcome, and evidence boundaries.
3. [CoordinationSession](coordination-session.md) defines the CoordinationSession
   manifest/event schema, storage layout, one-way session-to-Assignment
   membership, and recovery rules.
4. [FlowDefinition](flow-definition.md) defines the shared graph/operation/policy
   IR and the Workflow/CoordinationProtocol typed-profile schemas.

AdhocTask, generalized AgentMessage, and the full standalone protocol runtime
remain proposals and are not listed as accepted contracts. The accepted
direction for a future validated inline Assignment contract is in the Vision
and Assignment contract; its field-level schema remains unaccepted.
