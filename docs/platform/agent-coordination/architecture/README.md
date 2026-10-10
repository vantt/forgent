# Agent Coordination Architecture

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

Complete pre-rework input: [historical snapshot](../history/retired-engine/files/architecture/README.md#literal-snapshot). This is preservation evidence, not a replacement for the current contract below.

## Migration Status

This directory has been promoted from
`docs/architect/agent-coordination/architecture/` during the platform
documentation migration.

Accepted architecture documents keep their authority. Runtime-recovery-family
documents that are marked as proposals or partial designs remain
proposal/partial even though they now live beside accepted architecture.
Current implemented claims must still line up with
[Implementation Alignment](../history/retired-engine/files/verification/implementation-alignment.md#literal-snapshot) and
the proof roots linked from
[Proof Preservation](../history/documentation-migration/proof-preservation.md).

## Documents

Read the [Agent Coordination Foundation Vision](../vision.md) before this
directory. Architecture refines that direction into accepted system boundaries.

1. [System Context](../history/retired-engine/files/architecture/system-context.md#literal-snapshot) defines system purpose and major
   authority boundaries.
2. [Coordination Foundation Baseline](../history/retired-engine/files/architecture/coordination-foundation-baseline.md#literal-snapshot)
   summarizes the accepted Step 00-08 shape promoted out of roadmap/proposal
   history.
3. [Protocol Model](protocol-model.md) defines declared and agent-led planning
   sources plus the hard/soft coordination model around Workflow, Stage,
   Operation, TaskSpec, Skill, and Role.
4. [Runtime Model](runtime-model.md) defines Assignment, dispatch, Run,
   RunResult, and evidence flow.
5. [Work Integration](work-integration.md) defines how coordination may attach
   to Work without becoming a second lifecycle authority.
6. [Dispatch Control Plane](dispatch-control-plane.md) defines the separation
   between semantic operation choice and execution infrastructure.
7. [Evidence And Results](evidence-and-results.md) defines outcome confidence
   and false-success boundaries.
8. [Visibility And Herdr](visibility-and-herdr.md) defines the observability
   boundary.
9. [RunHandle](run-handle.md) proposes the runtime-layer handle and recoverable
   work material: repository/runtime ports, a guard service, independent
   execution/attachment/observation facts, pending-command reconciliation and
   adapter-owned incarnation. In-cell takeover needs no worker checkpoint.
10. [Coordination Continuation And Recovery](../history/retired-engine/files/architecture/coordination-continuation-recovery.md#literal-snapshot)
    proposes evaluator-backed snapshots, a pure typed planner, idempotent apply
    and protocol-declared parent/child transfer through existing engine doors.
11. [Executor Fallback Activation And Health](executor-health-and-fallback.md)
    proposes activating the reserved `fallbackExecutors` on signal-ladder
    outcomes through the existing compiler; health observation store is the
    future of the same contract.
12. [Runtime Recovery And Work Continuity](runtime-recovery-design.md) is the
    proposed detailed-design entry point for documents 9-11: current identity
    mapping, ownership, local concurrency, long-horizon scope, rollout and the
    shared bug/proof matrix. It is not a fourth runtime component. Read it first
    when implementing or reviewing these proposals.

Documents 9–11 share one admission authority: the Run contract's
[Run Phases And Admission](../contracts/assignment-run-runresult.md#run-phases-and-admission).

## Runtime Recovery Principles

Shared by documents 9–11; each applies them without restating them.

- An observed incident never creates execution authority. Every new attempt
  needs a valid admission through the Run contract; a missing RunHandle,
  an expired retry-after, or a timeout grants nothing.
- Three guarantees stay distinct: control fencing (one controller per
  un-settled Run), result fencing (a superseded Run cannot publish the
  authoritative result), effect protection (owned by the operation adapter;
  no exactly-once promise).
- Facts before conclusions: worker result beats every runtime signal; a
  failed liveness read is `unknown`, never `absent`; delivery without
  acknowledgment is `unknown`, never "launch failed"; cancel requested is
  not worker stopped.
- Domain semantics and application ports first; wire/persistence schemas
  only at boundaries that are stored or exchanged. Existing semantic
  contracts (`liveness.mjs` ladder, `recovery.mjs` matrix, `run-retried`
  supersession, exclusive-create lock) are ported, not re-derived.
- Node/Rust coexistence: the runtime that spawned owns the state it wrote;
  the other reads; a reader that does not understand a `contract` version
  refuses explicitly.
- Default implementations are minimal and reuse repository primitives;
  unsupported future capabilities refuse explicitly; optional fields alone do
  not provide distributed leases, generic checkpoints or effect guarantees.
- Recoverable work does not require a worker-authored checkpoint. Deliberate
  protocol handoff and arbitrary crash takeover have different preconditions.
- Cell/session correlation belongs to the consuming track; neither replacing a
  worker nor opening a child session constitutes cell acceptance.

CoordinationSession's identity/persistence boundary and the shared
FlowDefinition graph/operation/policy IR are accepted per
[ADR-008](../history/retired-engine/files/decisions/ADR-008-coordination-session-and-mission-deferral.md#literal-snapshot)
and [ADR-009](../history/retired-engine/files/decisions/ADR-009-flow-definition-shared-ir-and-typed-profiles.md#literal-snapshot)
(schemas in [contracts/](../history/retired-engine/files/contracts/README.md#literal-snapshot)). The promoted Step 00-08
baseline is summarized in
[Coordination Foundation Baseline](../history/retired-engine/files/architecture/coordination-foundation-baseline.md#literal-snapshot).
Unaccepted extensions, including AdhocTask, AgentMessage, runtime topology
deviation, and broader group-cognitive protocol expansion, remain proposals or
architecture-wide intent until separately accepted.

