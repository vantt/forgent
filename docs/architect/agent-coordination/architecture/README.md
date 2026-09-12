# Agent Coordination Architecture

Document type: Index
Design status: Accepted
Implementation: Partial
Last reviewed: 2026-09-11
Canonical for: navigation across accepted architecture

## Documents

Read the [Agent Coordination Foundation Vision](../vision.md) before this
directory. Architecture refines that direction into accepted system boundaries.

1. [System Context](system-context.md) defines system purpose and major
   authority boundaries.
2. [Coordination Foundation Baseline](coordination-foundation-baseline.md)
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
10. [Coordination Continuation And Recovery](coordination-continuation-recovery.md)
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
[ADR-008](../decisions/ADR-008-coordination-session-and-mission-deferral.md)
and [ADR-009](../decisions/ADR-009-flow-definition-shared-ir-and-typed-profiles.md)
(schemas in [contracts/](../contracts/README.md)). The promoted Step 00-08
baseline is summarized in
[Coordination Foundation Baseline](coordination-foundation-baseline.md).
Unaccepted extensions, including AdhocTask, AgentMessage, runtime topology
deviation, and broader group-cognitive protocol expansion, remain proposals or
architecture-wide intent until separately accepted.
