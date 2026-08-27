# Agent Coordination Architecture

This folder groups the architecture notes for fgOS multi-agent coordination:
team strategy, work/flow vocabulary, dispatch control, runtime evidence, and
Herdr visibility.

## Reading Order

1. [orchestration-vocabulary-map.md](orchestration-vocabulary-map.md) - canonical terms and layer boundaries.
2. [dispatch-control-plane-redesign.md](dispatch-control-plane-redesign.md) - how one selected target resolves to
   executor, mechanism, governance, adapter, and result handling.
3. [step-00-team-dispatch-v1-overview.md](step-00-team-dispatch-v1-overview.md) - the small implementation
   profile for team dispatch through existing workflow config and cli-spawn.
4. [step-01-team-dispatch-v1-rollout.md](step-01-team-dispatch-v1-rollout.md) - staged rollout from current code to team dispatch.
5. [step-02-workflow-stage-operations.md](step-02-workflow-stage-operations.md) - workflow operations schema, lookup, and validation.
6. [step-03-assignment-runresult.md](step-03-assignment-runresult.md) - assignment, run, and RunResult execution evidence.
7. [agent-team-dispatch-and-herdr-stability.md](agent-team-dispatch-and-herdr-stability.md) - Herdr stability, visibility,
   and evidence discipline for interactive/visible execution.

## Core Map

```txt
Mission -> Work -> Workflow -> Stage -> Stage Protocol -> Stage Operation -> Assignment -> Dispatch -> Runtime -> Evidence -> Visibility
```

## Coordination Rings

```txt
Strategic ring  = Orchestrator
Activation ring = Launcher
Flow ring       = Router + Driver
Execution ring  = Dispatcher
```

## Principle

```txt
fgOS dispatches runs.
Executors perform assignments.
Herdr shows the run.
Evidence proves the outcome.
AgentMessage carries meaning between roles.
```

## First Implementation Slice

Start with [step-02-workflow-stage-operations.md](step-02-workflow-stage-operations.md):

```txt
Preserve operations in workflow normalization.
Add operationsForStage().
Add operations to coding feature workflow.
Validate operation taskSpecs, roles, skills, and reasons.
Keep driver behavior unchanged.
```
