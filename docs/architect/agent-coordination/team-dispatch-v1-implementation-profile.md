# Team Dispatch V1 Implementation Profile

Status: simplified implementation profile for the full orchestration vocabulary
Date: 2026-08-27
Scope: first practical team dispatch slice over existing work, workflow/stage config, task-specs, skills, cli-spawn executors, and result evidence

## 1. Purpose

`orchestration-vocabulary-map.md` defines the full conceptual model:

```txt
Mission -> Work -> Workflow -> Stage -> Stage Protocol -> Stage Operation -> Assignment -> Dispatch -> Runtime -> Evidence -> Visibility
```

This document defines a smaller V1 implementation profile that keeps the same
boundaries without turning every concept into a separate subsystem.

V1 should build team dispatch with four practical objects:

```txt
Work
Flow operations
Assignment
JobResult
```

## 2. What V1 Keeps Simple

V1 should not start with a mailbox, daemon, full AgentMessage protocol, or
mission lifecycle.

Instead:

- `work` remains the lifecycle authority already present in fgOS;
- workflow YAML grows `stage.operations` as an optional extension;
- one selected operation becomes an assignment;
- one execution attempt produces one JobResult containing runtime and evidence;
- Herdr remains optional visibility and is not required for team dispatch V1.

## 3. Core Boundaries

The implementation can stay small as long as these boundaries are preserved:

```txt
Work != Assignment
Stage != Operation
Role != Executor
Dispatch != Runtime Result
Visibility != Evidence
```

These boundaries are more important than the number of files or classes.

## 4. Flow Operations

Current workflow declarations map a stage to one `skill` and often one
`taskSpec`.

V1 should reinterpret that pair as the stage's primary operation and add
optional `operations`.

Current shape:

```yaml
stages:
  - name: planning
    step: Divide
    skill: fgos-coding-planning
    taskSpec: shape-plan
```

V1-compatible shape:

```yaml
stages:
  - name: planning
    step: Divide
    skill: fgos-coding-planning
    taskSpec: shape-plan
    operations:
      - id: shape-plan
        primary: true
        taskSpec: shape-plan
        role: implementer
        skills:
          - fgos-coding-planning
      - id: validate-plan
        taskSpec: validate-plan
        role: reviewer
        reason: review
        skills:
          - fgos-coding-validating
      - id: scout-blast-radius
        taskSpec: scout-blast-radius
        role: researcher
        reason: consult
        skills:
          - fgos-researching
```

Executing stage example:

```yaml
stages:
  - name: executing
    step: Execute
    skill: fgos-coding-implement
    taskSpec: implement-item
    operations:
      - id: implement-item
        primary: true
        taskSpec: implement-item
        role: implementer
        skills:
          - fgos-coding-implement
      - id: review-item
        taskSpec: review-item
        role: reviewer
        reason: review
        skills:
          - fgos-coding-validating
      - id: fix-verify-red
        taskSpec: fix-verify-red
        role: implementer
        skills:
          - fgos-coding-implement
      - id: scoped-subtask
        taskSpec: scoped-subtask
        role: helper
        reason: assist
        skills:
          - fgos-coding-implement
```

If a stage has no `operations`, V1 synthesizes one primary operation from the
existing `skill` and `taskSpec`.

## 5. Stage Protocol In V1

V1 should not create a separate `StageProtocol` file.

The stage protocol is the combination of:

- `stage.operations`;
- the domain roleGraph;
- the stage transition graph;
- each task-spec's input/output/gates;
- driver logic that chooses among legal operations.

This gives bounded autonomy:

```txt
Graph/config = legality and available operations
Skill/soul   = judgment among legal operations
Driver       = enforcement and loop
Dispatcher   = execution broker
```

The graph should not encode every consult/review/verify/fix loop as a separate
FSM state. Those are operations inside the stage unless they need durable
lifecycle of their own.

## 6. Assignment

When the driver or orchestrator chooses an operation, V1 creates an assignment.

Minimal assignment:

```json
{
  "assignmentId": "a-123",
  "workId": "tsk-abc",
  "stage": "planning",
  "operation": "validate-plan",
  "role": "reviewer",
  "taskSpec": "validate-plan",
  "objective": "Validate the plan against repo reality",
  "contextRefs": ["docs/history/tsk-abc/plan.md"],
  "expectedOutputs": ["review verdict", "findings if blocked"]
}
```

An assignment is not a work item. It becomes child work only if it needs its
own lifecycle, claim, approval, merge, or backlog visibility.

## 7. Dispatch

V1 dispatch receives an assignment or existing work target and uses the
existing dispatch control plane:

```txt
assignment/work target
  -> capability / role / taskSpec resolution
  -> DispatchPlan
  -> executor
  -> cli-spawn
```

Initial executors should prefer deterministic headless paths:

- Codex through `codex exec --json` or the most stable non-interactive mode;
- Claude through headless/streaming output mode;
- agy through stable prompt mode rather than fragile interactive TUI injection.

Herdr visibility can be added after cli-spawn team dispatch is stable.

## 8. JobResult

V1 should combine runtime result and evidence into one object.

```json
{
  "assignmentId": "a-123",
  "executorId": "codex",
  "status": "done",
  "confidence": "verified",
  "runtime": {
    "exitCode": 0,
    "stdoutLog": ".fgos/jobs/a-123/stdout.log",
    "stderrLog": ".fgos/jobs/a-123/stderr.log"
  },
  "agentClaim": {
    "status": "done",
    "summary": "Plan is feasible with one missing test."
  },
  "evidence": {
    "changedFiles": [],
    "artifacts": [".fgos/jobs/a-123/result.json"],
    "tests": []
  }
}
```

Confidence values:

- `verified` - structured claim plus external evidence;
- `reported` - structured claim without external evidence, acceptable for consult-only assignments;
- `inferred` - no structured claim, but external evidence shows real effect;
- `no-evidence` - process settled but no useful proof exists;
- `failed` - timeout, nonzero exit, invalid result, or explicit failure.

## 9. Suggested Storage

V1 storage can be file-based:

```txt
.fgos/jobs/<assignment-id>/
  assignment.json
  stdout.log
  stderr.log
  exit.json
  result.json
  evidence.json
```

Mission storage can remain optional until team runs need durable threads:

```txt
.fgos/missions/<mission-id>/
  mission.json
  thread.jsonl
  assignments/
```

## 10. Execution Flow

Single-work flow:

```txt
1. Work is selected or claimed.
2. Router selects domain/workflow/stage.
3. Driver reads allowed stage operations.
4. Driver chooses an operation.
5. Operation becomes an assignment.
6. Dispatcher resolves execution.
7. cli-spawn runs the executor.
8. JobResult records runtime and evidence.
9. Driver decides the next operation or stage outcome.
10. Router handles flow boundary crossing if needed.
```

Team flow:

```txt
1. Orchestrator applies a strategy across N items.
2. Launcher activates one selected work item when needed.
3. Driver handles that item through its flow.
4. Orchestrator may also create ad-hoc consult/review/debate assignments.
5. Dispatcher executes each concrete assignment.
6. Results and evidence feed back to driver and orchestrator.
```

## 11. Implementation Order

1. Extend workflow normalization to preserve optional `operations`.
2. Add helper lookup for allowed operations at a domain/stage.
3. Synthesize primary operation from existing `skill` and `taskSpec` when no
   operations are declared.
4. Add coding feature workflow operations for planning and executing.
5. Add assignment shape and prompt rendering for one operation.
6. Run assignments through existing cli-spawn dispatch.
7. Write JobResult with runtime and evidence.
8. Only then add mission/thread orchestration.

## 12. Non-Goals

- Do not replace work lifecycle.
- Do not require every stage operation to become child work.
- Do not create a full AgentMessage protocol before assignments need it.
- Do not build Herdr visibility before cli-spawn execution is reliable.
- Do not hardcode every internal stage loop as an FSM transition.

## 13. Summary

The full model stays available for architecture clarity. V1 implements the
smallest useful slice:

```txt
Work + stage.operations + Assignment + JobResult
```

That is enough to let one stage contain many task-shaped operations, let the
driver choose among them with bounded autonomy, and let the dispatcher execute
the chosen operation through Claude, Codex, agy, or other cli-spawn executors.
