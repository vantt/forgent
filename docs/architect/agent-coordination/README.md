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
7. [team-communication-protocol-v1.md](team-communication-protocol-v1.md) - role-to-role communication protocol for
   stage operations, assignments, claims, and evidence.
8. [step-04-assignment-runresult-hardening.md](step-04-assignment-runresult-hardening.md) - harden assignment execution so
   RunResult confidence cannot false-pass from stale or missing evidence.
9. [step-05-coding-driver-operation-choice.md](step-05-coding-driver-operation-choice.md) - make the coding driver choose
   legal stage operations without replacing the Work lifecycle.
10. [step-06-work-attached-team-adoption.md](step-06-work-attached-team-adoption.md) - adopt team dispatch on real
   work-attached planning/executing scenarios.
11. [step-07-mission-lite-brainstorm-debate.md](step-07-mission-lite-brainstorm-debate.md) - introduce mission-lite
   read-only brainstorming/debate after Work-attached evidence is stable.
12. [agent-team-dispatch-and-herdr-stability.md](agent-team-dispatch-and-herdr-stability.md) - Herdr stability, visibility,
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

## Post-Merge Implementation Track

The merged V1 baseline has enough code to inspect and execute assignments, but
the next work should harden evidence before broader adoption:

```txt
Step 04: prevent false-success RunResults.
Step 05: teach the coding driver to choose declared operations.
Step 06: use the operation path on real Work-attached scenarios.
Step 07: only then try mission-lite brainstorming/debate without Work.
```
