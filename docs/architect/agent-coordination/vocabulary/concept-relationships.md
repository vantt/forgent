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

Planning and constraints (composable)
  Agent-led runtime planning -----------\
  optional Coordination Protocol -------+-> semantic execution contract
  Workflow -> Stage -> Stage Operation -/       -> TaskSpec or validated inline contract
  optional domain/organization harness --------> enrichment / validation

Coordination runtime
  CoordinationSession -> optional AdhocTask graph -> Assignment

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
      -> optional declared protocol / agent-led planning / domain harness
      -> zero, one, or many AdhocTasks
        -> Assignment -> Run -> RunResult / Evidence
    -> outcome returned to Work driver

Standalone
  optional Mission
    -> CoordinationSession
      -> agent-led or optional declared protocol planning
      -> zero, one, or many AdhocTasks
        -> Assignment -> Run -> RunResult / Evidence
      -> Synthesis
```

The profiles share planning-contract, dispatch, runtime, and evidence machinery
and may share declared protocols when selected. They do not share lifecycle
authority.

## Ownership Rules

| Concern | Owner |
|---|---|
| Work status/stage/claim/approval/merge | Work engine verbs |
| Legal lifecycle transition | Workflow graph and Work driver |
| Legal operation in a stage/phase | Active protocol graph |
| Legal dynamic execution | Foundation policy plus validated inline execution contract |
| Input/output/evidence contract | TaskSpec or validated inline Assignment contract |
| Adaptive execution judgment | Skill, within hard constraints |
| Role responsibility | Declared protocol or validated dynamic execution contract |
| Dynamic planning proposal | Coordinator agent/Skill, within policy and budget |
| Domain plan/resource/evidence validation | Selected domain/organization harness |
| Task dependencies/progress | CoordinationSession/AdhocTask runtime, proposed |
| Executor/provider/model/mechanism | Dispatch control plane |
| Runtime attempt | Run |
| Normalized claim and provenance | RunResult |
| Interactive visibility | Herdr |

## Creation Rules

- Normal intake creates Work.
- A Work driver may start a Work-attached CoordinationSession.
- An authorized standalone caller may start a session without Work.
- A session may lower directly to one Assignment or materialize validated
  AdhocTasks from a declared or dynamically proposed graph.
- Independent lifecycle candidates create child Work only through normal Work
  intake.
- A declared operation selection or validated inline execution contract creates
  an Assignment request.
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
Coordination Protocol != CoordinationSession requirement
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
