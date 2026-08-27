# Agent Coordination Architecture

This folder groups the architecture notes for fgOS multi-agent coordination:
team strategy, work/flow vocabulary, dispatch control, runtime evidence, and
Herdr visibility.

## Reading Order

1. [orchestration-vocabulary-map.md](orchestration-vocabulary-map.md) - canonical terms and layer boundaries.
2. [dispatch-control-plane-redesign.md](dispatch-control-plane-redesign.md) - how one selected target resolves to
   executor, mechanism, governance, adapter, and result handling.
3. [team-dispatch-v1-implementation-profile.md](team-dispatch-v1-implementation-profile.md) - the small implementation
   profile for team dispatch through existing workflow config and cli-spawn.
4. [agent-team-dispatch-and-herdr-stability.md](agent-team-dispatch-and-herdr-stability.md) - Herdr stability, visibility,
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
fgOS dispatches jobs.
Executors perform assignments.
Herdr shows the job.
Evidence proves the outcome.
AgentMessage carries meaning between roles.
```
