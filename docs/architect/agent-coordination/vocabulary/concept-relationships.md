# Agent Coordination Concept Relationships

Document type: Vocabulary
Design status: Accepted
Implementation: Partial
Last reviewed: 2026-08-31
Canonical for: concept layering, ownership, and relationship rules

## Layer Map

```txt
Objective/lifecycle
  Mission (optional, proposed)       Work (durable lifecycle authority)
            \                         /
             -> CoordinationSession <-

Protocol definition
  Workflow -> Stage -> Stage Protocol -> Stage Operation
                                      -> TaskSpec
                                      -> Skill(s)
                                      -> Role
                                      -> policy hints

Coordination runtime
  CoordinationSession -> AdhocTask graph -> Assignment

Dispatch/runtime
  Assignment -> DispatchPlan -> Dispatcher -> Executor -> Run -> RunResult

Evidence/visibility
  RunResult -> Evidence / Artifact
  Run       -> Herdr visibility
```

Dashed/proposed concepts in prose are defined in
[Canonical Concepts](canonical-concepts.md) with explicit design status.

## Runtime Profiles

```txt
Work-attached
  Work
    -> optional CoordinationSession
      -> AdhocTask graph
        -> Assignment -> Run -> RunResult / Evidence
    -> outcome returned to Work driver

Standalone
  optional Mission
    -> CoordinationSession
      -> AdhocTask graph
        -> Assignment -> Run -> RunResult / Evidence
      -> Synthesis
```

The profiles share protocol, dispatch, runtime, and evidence machinery. They do
not share lifecycle authority.

## Ownership Rules

| Concern | Owner |
|---|---|
| Work status/stage/claim/approval/merge | Work engine verbs |
| Legal lifecycle transition | Workflow graph and Work driver |
| Legal operation in a stage/phase | Active protocol graph |
| Input/output/evidence contract | TaskSpec |
| Adaptive execution judgment | Skill, within hard constraints |
| Role responsibility | Protocol definition |
| Task dependencies/progress | CoordinationSession/AdhocTask runtime, proposed |
| Executor/provider/model/mechanism | Dispatch control plane |
| Runtime attempt | Run |
| Normalized claim and provenance | RunResult |
| Interactive visibility | Herdr |

## Creation Rules

- Normal intake creates Work.
- A Work driver may start a Work-attached CoordinationSession.
- An authorized standalone caller may start a session without Work.
- A validated task graph materializes AdhocTasks inside a session.
- Independent lifecycle candidates create child Work only through normal Work
  intake.
- An operation selection creates an Assignment request.
- Dispatch creates a Run for an Assignment.
- Runtime settlement produces one RunResult per Run.
- Synthesis reads accepted result/evidence refs; it does not create truth.

## Critical Non-Equivalences

```txt
Work != Mission
Work != AdhocTask
AdhocTask != Assignment
Assignment != Run
Run != RunResult
Role != Executor
Skill != TaskSpec
Stage Operation != Assignment
Herdr state != Evidence
Synthesis != Approval
Job != Assignment/Run/Task
```

## Lifecycle And Isolation

Lifecycle ownership and execution isolation are independent:

```txt
lifecycle: inherited | independent
isolation: shared | isolated
```

An inherited isolated task may use an ephemeral branch/worktree without
becoming Work. Independent child Work uses Work-owned durable isolation and
merge behavior.

## Coordination Rings

```txt
Strategic ring  = Orchestrator
Activation ring = Launcher
Flow ring       = Router + Driver
Execution ring  = Dispatcher
```

The rings are responsibility boundaries, not necessarily one process or module
per ring.
