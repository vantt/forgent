# Step 00 - Team Dispatch V1 Overview

Status: implementation plan for the first stable team-dispatch slice
Date: 2026-08-27
Scope: first practical team dispatch slice over existing work, workflow/stage config, task-specs, skills, cli-spawn executors, and result evidence

## 1. Purpose

`orchestration-vocabulary-map.md` defines the full conceptual model:

```txt
Mission -> Work -> Workflow -> Stage -> Stage Protocol -> Stage Operation -> Assignment -> Dispatch -> Runtime -> Evidence -> Visibility
```

This document defines a smaller V1 implementation plan that keeps the same
boundaries without turning every concept into a separate subsystem. It starts
from the current codebase, where a workflow stage resolves to one primary
skill and often one primary task-spec.

V1 should build team dispatch with five practical objects:

```txt
Work
Flow operations
Assignment
Run
RunResult
```

## 2. What V1 Keeps Simple

V1 should not start with a mailbox, daemon, full AgentMessage protocol, or
mission lifecycle.

Instead:

- `work` remains the lifecycle authority already present in fgOS;
- workflow YAML grows `stage.operations` as an optional extension;
- one selected operation becomes an assignment;
- one execution attempt produces one RunResult containing runtime and evidence;
- Herdr remains optional visibility and is not required for team dispatch V1.

## 3. Current Codebase Starting Point

The current implementation already has the right foundation:

- `domains/coding/workflows/feature.yaml` declares the coding feature workflow.
- Each workflow stage currently carries one `skill` and often one `taskSpec`.
- `src/state/workflow-stage-graphs.mjs` normalizes workflow YAML into
  `stages`, `stepMap`, `skillMap`, and `taskSpecMap`.
- `bundleForStage(domain, stage, { kind })` returns one `{ skill, taskSpec }`.
- `fgos-coding-driving` drives one item by resolving the current position to
  one stage skill.
- `domains/coding/task-specs/` already contains more than one task-shaped
  operation across discovery, exploring, planning, and executing, including
  `judge-ambiguity`, `resolve-question`, `validate-plan`, `review-item`,
  `fix-verify-red`, `scout-blast-radius`, and `scoped-subtask`.
- `fgos-coding-discovering` already performs a real internal consult loop:
  it scouts ambiguity from claimed work context, calls `fgos-researching` as a
  researcher helper as many times as needed, logs each consult through
  `fgos handoff`, then applies a `clear` or `unclear` discovery verdict.
- `roleGraph` already declares legal consult/review/assist/advice edges, but
  only as legality checks. It does not define the complete operation set for
  a stage.

The gap is therefore narrow:

```txt
Current: stage -> one skill + one taskSpec
Needed:  stage -> primary operation + optional operation set
```

## 4. Core Boundaries

The implementation can stay small as long as these boundaries are preserved:

```txt
Work != Assignment
Stage != Operation
Role != Executor
Dispatch != Runtime Result
Visibility != Evidence
```

These boundaries are more important than the number of files or classes.

## 5. Flow Operations

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

## 6. Stage Protocol In V1

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

## 7. Assignment

When the driver or orchestrator chooses an operation, V1 creates an assignment.

Minimal assignment:

```json
{
  "assignmentId": "asgn_tsk_abc_validate_plan_001",
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

## 8. Dispatch

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

## 9. RunResult

V1 should combine runtime result and evidence into one object.

```json
{
  "runId": "run_asgn_tsk_abc_validate_plan_001_01",
  "assignmentId": "asgn_tsk_abc_validate_plan_001",
  "executorId": "codex",
  "status": "done",
  "confidence": "verified",
  "runtime": {
    "exitCode": 0,
    "stdoutLog": ".fgos/assignments/asgn_tsk_abc_validate_plan_001/runs/01/stdout.log",
    "stderrLog": ".fgos/assignments/asgn_tsk_abc_validate_plan_001/runs/01/stderr.log"
  },
  "agentClaim": {
    "status": "done",
    "summary": "Plan is feasible with one missing test."
  },
  "evidence": {
    "changedFiles": [],
    "artifacts": [".fgos/assignments/asgn_tsk_abc_validate_plan_001/runs/01/result.json"],
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

## 10. Suggested Storage

V1 storage can be file-based:

```txt
.fgos/assignments/<assignment-id>/
  assignment.json
  runs/
    01/
      run.json
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

## 11. Execution Flow

Single-work flow:

```txt
1. Work is selected or claimed.
2. Router selects domain/workflow/stage.
3. Driver reads allowed stage operations.
4. Driver chooses an operation.
5. Operation becomes an assignment.
6. Dispatcher resolves execution.
7. cli-spawn runs the executor.
8. RunResult records runtime and evidence.
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

## 12. Detailed Implementation Plan

### Phase 0 - Characterize Current Behavior

Goal: prove the existing one-stage/one-skill behavior before changing it.

Work:

1. Add or identify tests showing `feature.yaml` currently normalizes
   `planning -> fgos-coding-planning / shape-plan`.
2. Add or identify tests showing `executing -> fgos-coding-implement /
   implement-item`.
3. Add or identify tests showing `bundleForStage` returns the existing
   `{ skill, taskSpec }` shape unchanged.
4. Confirm setup/doctor checks still validate every `taskSpecMap` entry.

Expected result:

```txt
No behavior change. Baseline is pinned.
```

### Phase 1 - Preserve `stage.operations`

Goal: let workflow YAML declare operations without affecting existing callers.

Code touchpoints:

- `src/state/workflow-stage-graphs.mjs`
- tests around workflow normalization / domain registry

Work:

1. Extend `normalizeWorkflow` to preserve optional `operations` per stage.
2. Freeze each operation object and nested `skills` array.
3. Store operations in a new `operationMap`, keyed by stage name.
4. Keep existing `skillMap` and `taskSpecMap` byte-compatible.
5. If a stage has no explicit `operations`, synthesize a primary operation from
   current `skill` and `taskSpec` only in the new helper, not by mutating loaded
   workflow data.

New helper target:

```js
operationsForStage(domain, stage, { kind })
```

Return shape:

```json
[
  {
    "id": "shape-plan",
    "primary": true,
    "taskSpec": "shape-plan",
    "role": "implementer",
    "skills": ["fgos-coding-planning"]
  }
]
```

Expected result:

```txt
Existing stage-skill routing continues to work.
New code can ask for all legal operations at a stage.
```

### Phase 2 - Add Coding Feature Operations

Goal: upgrade the coding feature workflow declaration while preserving the
current primary path.

File:

- `domains/coding/workflows/feature.yaml`

Work:

1. Add explicit `operations` under `discovery`, `exploring`, `planning`, and
   `executing`.
2. Mark the current `skill`/`taskSpec` pair as `primary: true`.
3. Add consult/review/assist operations that already have task-specs.
4. Do not add new task-spec files in this phase unless a missing operation is
   blocking the primary coding feature path.

Initial operation set:

```txt
discovery:
  judge-ambiguity
  resolve-question
  research-ambiguity          (alias over resolve-question / fgos-researching consult)

exploring:
  lock-decisions
  answer-question
  resolve-question

planning:
  shape-plan
  validate-plan
  scout-blast-radius
  resolve-question

executing:
  implement-item
  review-item
  fix-verify-red
  scoped-subtask
  scout-blast-radius
  resolve-question
```

Expected result:

```txt
The workflow now names the real task-shaped operations available inside each stage.
The primary driver path is unchanged.
```

### Phase 3 - Validate Operation References

Goal: prevent config drift once operations become real.

Code touchpoints:

- `src/setup/registrations.mjs`
- workflow-stage registry tests

Work:

1. Extend the existing task-spec resolution check to validate every
   `stage.operations[].taskSpec`.
2. Validate every operation `skills[]` entry against at least one registered
   agent-type skill, reusing the existing task-spec eligibility check pattern
   where possible.
3. Validate operation `role` against the domain `roleGraph.roles` when the
   domain declares a roleGraph.
4. Validate operation `reason` against at least one legal roleGraph edge for
   that stage when a reason is present.

Expected result:

```txt
Bad operation config fails doctor/setup checks before runtime.
```

### Phase 4 - Read Operations Without Driving Them

Goal: expose operation lookup to callers without changing the driver loop.

Work:

1. Add a read-only CLI/report surface if needed, for example:

   ```txt
   fgos workflow operations --domain coding --workflow feature --stage planning
   ```

2. Alternatively expose only a module helper at first if no CLI consumer exists.
3. Use this read surface in tests and docs to prove the operation set.

Expected result:

```txt
Operations are visible and testable, but no behavior changes yet.
```

### Phase 5 - Minimal Assignment Shape

Goal: turn one selected operation into a bounded assignment object.

Code touchpoints:

- new small module under `src/runner/dispatch/` or `src/runner/team/`
- prompt rendering path only if needed

Work:

1. Define an assignment shape with:
   - `assignmentId`;
   - `workId`;
   - `domain`;
   - `workflow`;
   - `stage`;
   - `operation`;
   - `role`;
   - `taskSpec`;
   - `objective`;
   - `contextRefs`;
   - `expectedOutputs`.
2. Add a pure builder that accepts `{ work, stage, operation }`.
3. Keep storage optional in this phase. A returned object is enough.

Expected result:

```txt
One selected stage operation can become a dispatchable assignment.
```

### Phase 6 - Dispatch One Assignment Through cli-spawn

Goal: run one assignment through existing dispatch infrastructure.

Work:

1. Start with a consult/review assignment that does not mutate repo state, such
   as `discovery.resolve-question`, `validate-plan`, or
   `scout-blast-radius`.
2. Render the assignment into the existing prompt style.
3. Resolve role/taskSpec/required skills to an agent persona when available.
4. Resolve executor through existing capability/executor config.
5. Run through `cli-spawn`, not Herdr.
6. Return the existing dispatch result plus assignment metadata.

Expected result:

```txt
The first operation-based assignment runs through Claude/Codex/agy without changing work lifecycle semantics.
```

### Phase 7 - RunResult Evidence

Goal: record runtime and evidence for each assignment execution.

Work:

1. Create `.fgos/assignments/<assignment-id>/runs/<attempt>/`.
2. Write `assignment.json`.
3. Tee stdout/stderr logs.
4. Write `exit.json`.
5. Snapshot git/artifact state before and after when the assignment may mutate
   repo state.
6. Write `result.json` with confidence.

Expected result:

```txt
The driver/orchestrator can decide next steps from evidence, not only narration.
```

### Phase 8 - Driver Uses Operations With Bounded Autonomy

Goal: allow the driver skill/soul to choose among legal operations in a stage.

Work:

1. Keep the existing primary operation as the default path.
2. Teach driver guidance to inspect allowed operations for the current stage.
3. Let the driver choose consult/review/verify/fix operations only when they
   are declared by the stage protocol.
4. Enforce no-progress and callstack caps as today.
5. Do not convert every internal operation into an FSM transition.

Expected result:

```txt
Planning and executing can run multiple task-shaped operations without exploding the stage graph.
```

### Phase 9 - Orchestrator/Launcher Team Slice

Goal: use operation assignments across more than one item.

Work:

1. Add a simple strategy profile such as `frontier-drain` or `review-gated`.
2. Orchestrator selects ready work or a small batch.
3. Launcher activates one item when needed.
4. Driver progresses the item through flow operations.
5. Results feed back into orchestrator decisions.

Expected result:

```txt
Team dispatch exists over current cli-spawn infrastructure without requiring Herdr or mailbox.
```

## 13. Suggested Plan Files

This implementation plan is split into focused companion files:

- `step-02-workflow-stage-operations.md` - workflow YAML and operation
  lookup.
- `step-03-assignment-runresult.md` - assignment, Run, and RunResult
  shape.
- `step-01-team-dispatch-v1-rollout.md` - staged rollout, verification, and
  backwards compatibility.

Each file can become a work item plan later without forcing the whole design to
land at once.

## 14. First Slice Recommendation

The first implementation slice should be:

```txt
Preserve operations in workflow normalization
Add operationsForStage()
Add operations to coding feature workflow
Validate operation taskSpecs/roles/skills
Do not change driver behavior yet
```

This gives immediate architecture value with low runtime risk.

The second slice should run exactly one operation assignment through cli-spawn,
preferably a non-mutating consult/review operation. Repo-changing implement/fix
operations should wait until RunResult evidence is present.

## 15. Implementation Order

1. Extend workflow normalization to preserve optional `operations`.
2. Add helper lookup for allowed operations at a domain/stage.
3. Synthesize primary operation from existing `skill` and `taskSpec` when no
   operations are declared.
4. Add coding feature workflow operations for planning and executing.
5. Add assignment shape and prompt rendering for one operation.
6. Run assignments through existing cli-spawn dispatch.
7. Write RunResult with runtime and evidence.
8. Only then add mission/thread orchestration.

## 16. Non-Goals

- Do not replace work lifecycle.
- Do not require every stage operation to become child work.
- Do not create a full AgentMessage protocol before assignments need it.
- Do not build Herdr visibility before cli-spawn execution is reliable.
- Do not hardcode every internal stage loop as an FSM transition.

## 17. Summary

The full model stays available for architecture clarity. V1 implements the
smallest useful slice:

```txt
Work + stage.operations + Assignment + Run + RunResult
```

That is enough to let one stage contain many task-shaped operations, let the
driver choose among them with bounded autonomy, and let the dispatcher execute
the chosen operation through Claude, Codex, agy, or other cli-spawn executors.

## 18. Detailed Task Plan For Step 00

Step 00 is the architecture-baseline task. Its purpose is not to implement team
dispatch yet. Its purpose is to make the first implementation slice obvious,
bounded, and testable from the current codebase.

### 18.1 Objective

Produce a reviewed implementation baseline for Team Dispatch V1:

```txt
Current code reality -> agreed vocabulary -> smallest safe implementation slices
```

The output of Step 00 should let the next work item start directly on
`step-02-workflow-stage-operations.md` without reopening the model.

### 18.2 Scope

In scope:

- confirm the current workflow/stage/task-spec behavior;
- confirm the V1 boundaries;
- confirm the first implementation slice;
- keep the full model and the simplified V1 model aligned;
- list exact source files, docs, and tests each later slice should touch;
- identify non-goals and deferred concepts.

Out of scope:

- changing workflow runtime behavior;
- adding `stage.operations` to production config;
- adding assignment execution;
- adding RunResult storage;
- changing driver behavior;
- changing Herdr behavior;
- adding mission/thread lifecycle.

### 18.3 Inputs

Read these first:

1. `docs/architect/agent-coordination/orchestration-vocabulary-map.md`
2. `docs/architect/agent-coordination/step-01-team-dispatch-v1-rollout.md`
3. `docs/architect/agent-coordination/step-02-workflow-stage-operations.md`
4. `docs/architect/agent-coordination/step-03-assignment-runresult.md`
5. `domains/coding/workflows/feature.yaml`
6. `domains/coding/registry.yaml`
7. `src/state/workflow-stage-graphs.mjs`
8. `src/setup/registrations.mjs`
9. `src/runner/dispatch/cli.mjs`
10. `src/runner/dispatch/resolve.mjs`
11. `src/runner/dispatch/prepare.mjs`
12. `domains/coding/skills/fgos-coding-driving/SKILL.md`
13. `domains/coding/task-specs/*.md`

### 18.3a Impact By Surface

Step 00 separates the implementation plan by surface so the first work item can
avoid accidental scope creep.

| Surface | What changes in V1 | First slice? | What must not change first |
|---|---|---|---|
| Harness / code | workflow normalization preserves operation metadata; lookup helper exposes operations; setup/doctor validates operation references | yes, Slice 1 | driver runtime, dispatch runtime, work lifecycle, status/stage FSM |
| Workflow / stage / taskSpec | `domains/coding/workflows/feature.yaml` gains per-stage `operations`; existing task-specs become the operation catalog | yes, Slice 1 | task-spec prose content unless validation proves a header is wrong |
| Prose / skill / doctrine | later skills learn to inspect allowed operations and choose consult/review/fix; doctrine docs explain policy and evidence boundaries | not in Slice 1, except docs | do not rewrite `fgos-coding-driving`, `fgos-routing`, `/fgOS:pick`, or `/fgOS:cook` until operation lookup exists |
| Config / provider policy | later assignment policy resolves persona/executor/tier/model hints; current runner config remains executor invocation authority | no, starts Slice 3a | do not add provider hardcoding to workflow runtime; do not flip Herdr executors into the default path |
| Runtime / dispatch | later assignment execution calls existing `decide`/`execute` and `cli-spawn`; RunResult captures evidence | no, starts Slice 4/5 | do not create a second dispatch command path |
| Visibility / Herdr | remains deferred until cli-spawn assignment execution and evidence are stable | no | do not trust pane status as success evidence |

Same information as a sequence:

```txt
Slice 1  -> Harness/code + workflow YAML validation only
Slice 2  -> Optional read-only surface for operation lookup
Slice 3  -> Assignment object, no execution required
Slice 3a -> Config/policy resolver, no new transport
Slice 4  -> Runtime dispatch through existing cli-spawn
Slice 5  -> RunResult/evidence storage
Slice 6  -> Prose/skill driver behavior changes
Slice 7  -> Orchestrator/team strategy
```

The most important line:

```txt
Slice 1 changes harness metadata loading and workflow declarations; it does not change how agents run.
```

### 18.4 Current Reality To Pin

Step 00 should explicitly confirm these facts:

1. `feature.yaml` currently maps each stage to one primary `skill` and often
   one primary `taskSpec`.
2. `normalizeWorkflow()` currently extracts `skillMap` and `taskSpecMap`, not
   an operation set.
3. `bundleForStage()` currently returns one `{ skill, taskSpec }`.
4. `fgos-coding-driving` currently loads one registry-selected skill for the
   current position.
5. `discovery` is not a no-collaboration stage. Its primary
   `judge-ambiguity` operation can synchronously consult researcher helpers to
   gather facts before applying `clear` or `unclear`.
6. `roleGraph` guards legal handoff edges but does not declare the complete
   operation set for a stage.
7. The task-spec directory already contains task-shaped operations that do not
   fit the current one-stage/one-task map cleanly.

### 18.5 Decisions To Lock

Step 00 should leave these decisions explicit:

1. `work` remains lifecycle authority.
2. `mission` remains optional and lightweight in V1.
3. `stage.operations` is the first implementation surface.
4. Existing `stage.skill` and `stage.taskSpec` remain the primary operation
   compatibility path.
5. `operationsForStage()` is read-only at first.
6. Driver behavior does not change in the first implementation slice.
7. Assignment execution starts with non-mutating consult/review operations.
8. Repo-mutating operations wait for RunResult evidence.
9. Herdr visibility waits until cli-spawn team dispatch is stable.
10. Full AgentMessage/mailbox remains deferred.

### 18.6 Deliverables

Step 00 deliverables:

1. Updated architecture overview, this file.
2. Updated folder README with the implementation sequence.
3. Companion plans for:
   - workflow stage operations;
   - assignment, Run, and RunResult;
   - rollout sequence.
4. A first-work-item recommendation that can be copied into the work ledger.
5. A verification checklist for the next implementation slice.

### 18.7 First Work Item To File

Recommended title:

```txt
Preserve and validate workflow stage operations for coding feature workflow
```

Recommended kind/risk:

```txt
kind: feature
risk: standard
```

Recommended scope:

```txt
src/state/workflow-stage-graphs.mjs
src/setup/registrations.mjs
domains/coding/workflows/feature.yaml
test coverage around workflow normalization/setup validation
```

Recommended non-scope:

```txt
driver behavior changes
assignment execution
RunResult storage
mission/thread lifecycle
Herdr visibility
provider routing behavior changes
```

### 18.8 Implementation Slices To File After Step 00

File follow-up work in this order:

1. **Workflow stage operations registry**
   - preserve `operations`;
   - add `operationMap`;
   - add `operationsForStage()`;
   - add coding feature operations;
   - validate taskSpec/role/skill/reason.

2. **Read-only operation surface**
   - expose operation lookup to humans/skills if a CLI consumer is useful;
   - otherwise keep module-only;
   - prove planning/executing operation lists.

3. **Assignment builder**
   - convert one selected operation into an assignment object;
   - refuse unknown operations;
   - keep storage optional.

4. **Dispatch policy resolver**
   - merge provider/model/tier/persona preferences from global, domain,
     workflow, stage, operation, role, persona, work, assignment, and human/CLI
     inputs;
   - union constraints and fail closed;
   - choose strongest required tier;
   - keep executor invocation truth in runner dispatch config.

5. **cli-spawn assignment execution**
   - start with `planning.validate-plan` or `planning.scout-blast-radius`;
   - do not mutate repo state;
   - return assignment metadata with dispatch result.

6. **RunResult evidence**
   - write `.fgos/assignments/<assignment-id>/runs/<attempt>/`;
   - capture stdout/stderr/exit;
   - classify confidence;
   - require evidence appropriate to operation mode.

7. **Driver operation choice**
   - let the driver inspect allowed operations;
   - keep primary operation as default;
   - enforce stage protocol and roleGraph legality.

8. **Team orchestration**
   - add a first strategy profile;
   - orchestrator selects N items or assignments;
   - launcher activates one work item when needed;
   - dispatcher executes concrete assignments.

### 18.9 Verification Checklist

Step 00 is complete when:

- the full conceptual model and simplified V1 model are both documented;
- every V1 step has a named doc file;
- the first implementation slice is clearly identified;
- current code touchpoints are listed;
- first-slice non-goals are explicit;
- no doc says Herdr is required for V1 team dispatch;
- no doc says mission replaces work;
- no doc says a stage is limited to one task and one skill.

### 18.10 Residual Risks

Known risks after Step 00:

1. The first implementation slice may reveal setup/doctor validation coupling
   that is stricter than the plan expects.
2. Some task-specs may need cleaner operation metadata before they can be used
   as stage operations.
3. Role-to-executor selection may need a small policy layer earlier than
   expected once assignments run through cli-spawn.
4. Consult/review assignments may need written result artifacts before
   RunResult exists.
5. Existing docs may still contain historical vocabulary such as `subTask`,
   `capacity`, or old `orchestrator` usage.

### 18.11 Stop Rule

Do not continue from Step 00 into implementation in the same work item unless
the implementation scope is explicitly narrowed to Slice 1:

```txt
operation registry only, no runtime behavior change
```

## 19. Detailed Scan Update: Harness, Skill, Prose, Dispatch

This section records the current repo surfaces Step 00 must account for before
the first implementation slice starts.

### 19.1 Engine / Harness Surfaces

These are the code-level mechanisms that currently move work through lifecycle,
workflow, dispatch, and result handling.

| Surface | Current role | Step 00 implication |
|---|---|---|
| `src/state/work.mjs` | Work item validation and defaults. | Do not add mission/assignment lifecycle here in V1. |
| `src/state/store.mjs` / event log | Durable work state authority. | Team dispatch must not create a second source of work truth. |
| `src/state/workflow-stage-graphs.mjs` | Loads domain registries and workflow YAML; normalizes stages, stepMap, transitions, skillMap, taskSpecMap; exposes `resolveWorkflow`, `skillForStage`, `bundleForStage`, `legalCallEdges`. | First implementation slice belongs here: preserve `stage.operations`, add `operationMap`, add `operationsForStage()`, keep existing APIs stable. |
| `src/state/stage-fsm.mjs` | Legal stage transitions. | Do not encode every consult/review/fix loop as a stage transition. Stage operations stay inside the stage. |
| `src/state/status-fsm.mjs` | Durable lifecycle status transitions. | Assignment/run execution must not move status unless existing work verbs do. |
| `src/state/handoff.mjs` | Pure legality guard for roleGraph calls. It answers whether a call is legal, not whether it is wise. | Operation validation can reuse the same boundary: config declares legal options; skill/soul chooses among them. |
| `src/state/runtime-coordination.mjs` | Runtime claim overlay and effective status. | Team dispatch should read this as work ownership/claim infrastructure, not mission state. |
| `src/runner/loop.mjs` | Automated runner loop over work items. | Later orchestrator work may use similar frontier logic, but Slice 1 should not change it. |
| `src/runner/root-affinity.mjs` / `worker-slots.mjs` | Runtime concurrency and grouping constraints. | Orchestrator strategy can later reuse these, but workflow operations do not need them. |
| `src/runner/worktree.mjs` / `claim-port.mjs` | Worktree-backed claim and isolation mechanics. | Repo-mutating assignment execution must wait for RunResult/evidence and correct worktree handling. |

Existing inventory report to preserve:

- `plans/reports/from-code-reviewer-to-planner-orchestration-dispatch-deepdive-260826-1346-orchestration-mechanism-inventory-report.md`

That report confirms three already-existing coordination families:

1. Native-first dispatch doctrine: implemented around `DispatchPlan`,
   governance/egress, `cli-spawn`, and `herdr-spawn`.
2. Multi-role team harness: implemented for `coding` through `roleGraph`,
   task-specs, handoff, and agent persona YAML.
3. Doing coordination: partly or fully implemented through
   `runtime-coordination.mjs`, even though older prose may still label parts
   of it as a design target.

Step 00 must treat that report as scan input, not as new authority. Where the
report and live code differ, live code plus tests win.

### 19.2 Domain Registry And Workflow Surfaces

Current coding domain files:

- `domains/coding/registry.yaml`
- `domains/coding/workflows/feature.yaml`
- `domains/coding/AGENTS.md`
- `domains/coding/task-specs/*.md`
- `domains/coding/skills/*/SKILL.md`

Current facts:

1. `domains/coding/registry.yaml` declares `roleGraph`, `worktreeBacked`,
   status labels, classification vocabulary, worker contract, default workflow,
   and `workflowFor`.
2. `domains/coding/workflows/feature.yaml` is the only concrete coding
   workflow file currently present.
3. `feature.yaml` currently declares:
   - stages: `discovery`, `exploring`, `decompose`, `planning`, `executing`;
   - per-stage `skill`;
   - per-stage `taskSpec` for most live stages;
   - transitions;
   - `statusSkills.retrospective`.
4. The current YAML shape does not declare `operations`.
5. `workflow-stage-graphs.mjs` already supports multiple workflows by loading
   `domains/<domain>/workflows/*.yaml`, but coding currently defaults to
   `feature`.

Step 00 conclusion:

```txt
The first code slice should extend workflow declarations, not invent a parallel registry.
```

### 19.3 Workflow/Stage Runtime Surface

Current helper behavior:

- `resolveWorkflow(domain, kind)` chooses a workflow using `workflowFor[kind]`
  or `defaultWorkflow`.
- `skillForStage(domain, stage)` reads the active domain-level `skillMap`.
- `bundleForStage(domain, stage, { kind })` resolves workflow first and returns
  exactly one `{ skill, taskSpec }`.
- `legalCallEdges(domain, stage, fromRole)` reads roleGraph edges for handoff
  legality.

Step 00 conclusion:

```txt
operationsForStage() should be a sibling helper, not a replacement for bundleForStage().
```

Required compatibility:

- `skillForStage()` behavior remains unchanged.
- `bundleForStage()` behavior remains unchanged.
- existing prompt building and worker dispatch stay byte-compatible when
  no operation is selected.

### 19.4 Driver Skill Surface

Current primary driver:

- `domains/coding/skills/fgos-coding-driving/SKILL.md`
- mirrored/generated plugin copy under `plugins/fgOS/skills/fgos-coding-driving/SKILL.md`

Current behavior:

1. The driver reads current item state fresh each iteration.
2. It resolves position from stage/status.
3. It loads exactly one skill from the registry for that position.
4. It does not move stage/status itself; loaded stage skills call engine verbs.
5. It checks always-on stops: human question, system block, natural finish,
   open children, no progress, and ceiling.
6. It reclaims role/holder before invoking stage skill.
7. It is explicitly a driver, not router.

Step 00 conclusion:

```txt
Do not change driver behavior in Slice 1.
```

Later driver-operation work must update both:

- the source domain skill under `domains/coding/skills/`;
- the distributed/plugin skill surface under `plugins/fgOS/skills/` if that
  tree is the shipped runtime surface for slash-command users.

### 19.5 Router / Launcher Prose Surfaces

Important prose entrypoints:

- `core/skills/fgos-routing/SKILL.md`
- `plugins/fgOS/skills/pick/SKILL.md`
- `plugins/fgOS/skills/cook/SKILL.md`

Current behavior:

1. `fgos-routing` orients by reading work state and routes a claimed item by
   domain/stage through `getDomain` and `skillForStage`.
2. `fgos-routing` already contains a prose-only split inside planning:
   planning-shaping vs planning-proving. It names validating as a layered
   session-side judgment, not a separate stage.
3. `pick` claims one item, enters its worktree when possible, and invokes
   `fgos-coding-driving`.
4. `cook` submits one task, queues resulting work/children, claims one id at a
   time, and invokes `fgos-coding-driving`.

Step 00 conclusion:

```txt
Router/launcher prose already has internal judgment around stages.
Stage operations formalize that existing reality instead of adding a new idea.
```

Slice 1 should not rewrite these prose surfaces. Later driver-operation slices
should update them only after `operationsForStage()` is implemented and tested.

### 19.6 Stage Skill Surfaces

Current coding stage skills:

- `fgos-coding-discovering`
- `fgos-coding-exploring`
- `fgos-coding-planning`
- `fgos-coding-validating`
- `fgos-coding-implement`
- `fgos-coding-knowledge`
- `fgos-coding-shaping`
- `fgos-coding-driving`

Current pattern:

- stage skills own the substantive work for their phase;
- they call engine verbs such as discover/plan/return instead of directly
  mutating state;
- several skills already perform internal consult/advise/review behavior by
  calling `fgos handoff` / `fgos handoff-return`;
- review/fix/verify loops are already present as prose and task-spec behavior,
  but not declared as a stage operation set.

Step 00 conclusion:

```txt
Stage operations should describe existing task-shaped actions already present in skill prose and task-specs.
```

The first implementation slice should not change skill execution. It should
make the available operation set visible and validated.

### 19.7 Task-Spec Catalog Surface

Current coding task-specs already form an operation catalog:

| Task-spec | Natural operation | Stage/position relationship |
|---|---|---|
| `judge-ambiguity` | decide whether discovery is clear or unclear | primary discovery operation |
| `resolve-question` | research/gather evidence for one narrowed ambiguity | discovery consult operation and reusable consult operation across stages |
| `lock-decisions` | produce `CONTEXT.md` and lock decisions | primary exploring operation |
| `shape-plan` | produce implementation plan | primary planning operation |
| `validate-plan` | reality-gate the plan | planning review/proving operation |
| `implement-item` | implement planned code/docs | primary executing operation |
| `review-item` | review diff/result and return approve/reject findings | executing review operation |
| `fix-verify-red` | fix failed verification | executing fix operation |
| `scoped-subtask` | helper executes a bounded subtask | executing assist operation |
| `scout-blast-radius` | research impact before edit | planning/executing consult operation |
| `answer-question` | answer product/decision question | exploring advise operation |
| `approve-merge` | approve/reject merge gate | post-return review/status operation |
| `compound-learn` | retrospective synthesis | retrospective status operation |

Step 00 conclusion:

```txt
The operation catalog mostly exists already as task-spec files.
V1 should connect workflow stages to that catalog explicitly.
```

### 19.8 Agent Roster / Persona Surface

Current agent roster:

- `src/runner/agent-roster.mjs`
- `core/agents/*.yaml`
- optional `domains/<domain>/agents/*.yaml`
- legacy `agents/*.yaml`

Current behavior:

1. `loadAgentDefs(cwd)` scans core agents first, then domain agents, then
   legacy agents.
2. First agent name wins deterministically.
3. Each agent definition exposes `name` and `skills`.
4. `readTaskSpecHeader()` reads `agent` and `requires-skill` fields from
   task-spec headers.
5. `resolveAgentTypeForTaskSpec()` chooses:
   - pinned `agent` first;
   - current agent if it satisfies all required skills;
   - first matching agent definition otherwise.

Step 00 conclusion:

```txt
Operation.skills should align with existing task-spec requires-skill and agent roster matching.
```

Do not introduce a second persona resolver in Slice 1. Operation validation can
reuse the same source data and semantics.

### 19.9 Dispatch Resolver / Execution Surface

Current dispatch files:

- `src/runner/dispatch/plan.mjs`
- `src/runner/dispatch/config.mjs`
- `src/runner/dispatch/resolve.mjs`
- `src/runner/dispatch/mechanism.mjs`
- `src/runner/dispatch/prepare.mjs`
- `src/runner/dispatch/cli.mjs`
- `src/runner/dispatch/transport.mjs`
- `src/runner/dispatch/result-ladder.mjs`
- `src/runner/dispatch.mjs`

Current behavior:

1. `executorIdForWork(work, stage)` resolves executor identity from
   `skillForStage(domain, stage)`.
2. `buildPrompt(work, feedback, stage)` renders the worker prompt and resolves
   a stage skill path with `skillForStage`.
3. `spawnWorker()` resolves executor/model/prompt/agent-type and calls the
   selected adapter.
4. `executeExecutorCli()` / `decideExecutorCli()` expose out-of-process and
   decision flows.
5. `compileDispatchPlan()` is the canonical dispatch decision object.
6. `transport.mjs` owns `cli-spawn`, `http`, and `herdr-spawn` adapter
   execution.
7. `result-ladder.mjs` preserves the current structured/legacy/unsignaled
   result behavior without adding a new confidence field in that helper.
8. `transport.mjs` enforces nested dispatch depth through
   `FGOS_DISPATCH_DEPTH` and rejects above `MAX_DISPATCH_DEPTH`.
9. `cli-spawn` runs with ignored stdin, stdout/stderr capture, process-group
   kill, timeout, idle timeout, max-buffer handling, and chunk teeing.
10. `herdr-spawn` creates a fresh pane per dispatch, runs an interactive
    command inside that pane, polls Herdr status, sends an exit command, waits
    for a sentinel, and closes the pane.
11. Herdr output is best-effort for interactive mode; lifecycle truth must
    come from durable work state and external evidence, not pane narration.

Step 00 conclusion:

```txt
Assignment execution should integrate after operation lookup, not before it.
```

Slice 1 should not change `executorIdForWork()`, `buildPrompt()`, or
`spawnWorker()`. Those become relevant when an operation is selected as an
assignment.

Runtime-specific implication:

```txt
Operations name what may be done; dispatch transport only runs the chosen executor.
```

This keeps the team model independent from the Codex/Agy/Claude/Herdr
transport details. A later runtime slice can decide whether an assignment uses
`cli-spawn`, `herdr-spawn`, or a headless/RPC adapter without changing the
workflow operation vocabulary.

### 19.10 Shared Worker Contract / Dispatch Fallback Prose

Important shared prose:

- `.agents/skills/_shared/coding-worker-contract.md`
- `plugins/fgOS/skills/_shared/coding-worker-contract.md`
- `.agents/skills/_shared/executor-dispatch-fallback.md`
- `plugins/fgOS/skills/_shared/executor-dispatch-fallback.md`

Current behavior:

1. The worker contract defines the prompt/stdout expectations for coding
   workers.
2. The executor-dispatch fallback fragment defines when a live skill may
   dispatch out-of-process instead of doing work inline.
3. Valid reasons to dispatch are: cheaper model, different provider, resource
   isolation, or parallel wall-clock reduction.
4. The fragment requires `decide` before `execute`.
5. It treats `in-process` handback, `out-of-process` execution, and unavailable
   fallback as distinct branches.
6. It warns against raw log flooding and relies on final JSON result lines.

Step 00 conclusion:

```txt
Team dispatch should reuse the decide/execute discipline instead of inventing a second executor path.
```

### 19.11 Setup / Doctor / Validation Surface

Current setup checks:

- validate domain `taskSpecMap` entries resolve to real task-spec files;
- validate task-spec `agent` / `requires-skill` references resolve to real
  agent definitions and skills;
- validate every open item uses a stage still registered by its domain;
- validate every stage across domain workflows resolves to a `skillMap` key,
  with explicit `null` allowed.

Concrete validation functions and checks:

| Check / helper | Current responsibility | Operation extension |
|---|---|---|
| `checkDomainTaskSpecsResolve()` | every `taskSpecMap` entry resolves to a real domain task-spec file | reuse path resolution for `operation.taskSpec` |
| `checkTaskSpecAgentClaimsResolve()` | every task-spec `agent` and `requires-skill` header resolves to known agent data | keep agent eligibility validation task-spec-centric |
| `checkWorkStageVocabulary()` | every open item sits at a live stage | no assignment-level lifecycle in Slice 1 |
| `findDomainWorkflowSkillMapGaps()` / `domain-workflow-skillmap-coverage` | every workflow stage has a `skillMap` key, including explicit `null` | add sibling operation coverage checks rather than mixing into this helper |

Step 00 conclusion:

```txt
Stage operation validation belongs beside existing setup/doctor validation.
```

First-slice validation should add operation checks without weakening existing
checks.

### 19.12 Tests To Inspect Before Implementation

Before Slice 1, inspect and extend tests in these areas:

- `test/runner/dispatch.test.mjs`
- `test/runner/herdr-spawn-adapter.test.mjs`
- `test/runner/loop.test.mjs`
- setup/doctor tests that cover `src/setup/registrations.mjs`
- workflow/domain registry tests, including `domain-workflow-skillmap`
  coverage if present
- architecture tests if imports are added between state/setup/runner layers

Expected new tests:

1. workflow normalization preserves explicit operations;
2. `operationsForStage()` returns explicit operations;
3. `operationsForStage()` synthesizes a primary operation when no explicit
   operations exist;
4. existing `bundleForStage()` output is unchanged;
5. bad operation taskSpec fails validation;
6. bad operation role fails validation;
7. bad operation skill fails validation;
8. bad operation reason fails validation when roleGraph declares no such edge.

### 19.13 CLI / Command Entrypoint Surface

Current command-facing doors related to team dispatch:

| Entrypoint | Current role | Step 00 implication |
|---|---|---|
| `/fgOS:pick` / `plugins/fgOS/skills/pick/SKILL.md` | claim and activate one item, then invoke the coding driver | launcher for one item |
| `/fgOS:cook` / `plugins/fgOS/skills/cook/SKILL.md` | submit/queue/claim one item and drive it end to end | launcher plus single-item execution loop |
| `fgos-routing` | route a claimed item by domain/stage | router prose must remain compatible with stage operations |
| `fgos-coding-driving` | stay with one item and repeatedly invoke the stage skill | later driver-operation slice, not Slice 1 |
| `node src/runner/dispatch.mjs decide` | compute native/out-of-process/unavailable dispatch plan | keep as the dispatch decision door |
| `node src/runner/dispatch.mjs execute` | execute a chosen executor or capability | later assignment runtime should reuse this door |
| `fgos-fanout` | fan out N child items through `/fgOS:pick` sessions | existing orchestrator precedent for N-item strategy |

Step 00 conclusion:

```txt
Team dispatch V1 should not create a second command path for executor dispatch.
```

The missing part is not a new CLI command. The missing part is a workflow
operation catalog that lets the driver/skill choose a bounded assignment before
calling the existing `decide` and `execute` doors.

### 19.14 Prose Drift And Naming Hazards

Known prose hazards from the current scan:

1. Older docs use `orchestrator` for what is now called `launcher`; newer docs
   use `orchestrator` for the outer N-item strategy ring.
2. `rootTask` / `subTask` are retired vocabulary but still appear in a few
   comments as historical context.
3. `claims:` appears in older agent/persona discussion, while live agent YAML
   and task-spec matching use `skills:` on agent definitions plus `agent:` and
   `requires-skill:` on task-spec headers.
4. `capacity` has been renamed to `executor`; historical paths may still
   contain `capacity` in their folder names.
5. `AgentMessage`, artifact store, assignment mailbox, and explicit
   `confidence` fields are still design targets unless a later slice adds a
   real consumer.

Step 00 rule:

```txt
Use current vocabulary in new docs and treat old names as historical aliases only when quoting old material.
```

### 19.15 Agent Provider Surface

Current persona/provider pieces:

- agent-type YAML names the persona and its skill eligibility;
- task-spec headers constrain who may execute an operation;
- dispatch config maps capability to executor/provider/model/adapter;
- `resolveAgentTypeForTaskSpec()` bridges task-spec eligibility to an agent
  definition;
- `compileDispatchPlan()` and transport decide whether that chosen execution is
  in-process, `cli-spawn`, `herdr-spawn`, or unavailable.

Step 00 conclusion:

```txt
Role, persona, executor, and provider are separate axes.
```

For team dispatch this matters because a single operation such as
`review-item` should be able to say:

- role: reviewer;
- task-spec: `review-item`;
- required skill: `fgos-coding-validating`;
- candidate persona: `code-reviewer`;
- candidate executor/provider: Claude, Codex, Agy, or another configured
  executor.

Slice 1 should only make the role/task-spec/skill part visible. Persona and
provider selection stays in the current dispatch resolver until a later
assignment runtime slice needs to expose it explicitly.

## 20. Revised Step 00 Output Checklist

Step 00 should be considered ready for implementation only when the next work
item can answer these questions without searching the whole repo again:

1. Which file loads workflow YAML?
2. Which helper currently maps stage to skill/taskSpec?
3. Which helper should expose operations?
4. Which YAML file should gain operations first?
5. Which checks must validate operations?
6. Which skills/prose must not change in Slice 1?
7. Which later slice may change driver behavior?
8. Which task-specs map to planning/executing operations?
9. Which dispatch functions must remain untouched in Slice 1?
10. Which tests prove backwards compatibility?
11. Which provider/model/tier policy fields are hints, which are constraints,
    and which use strongest-tier resolution?

## 21. Slice 1 Task Breakdown From Current Code

This is the concrete task breakdown for the first implementation work item.

### 21.1 Read And Pin

Read:

- `src/state/workflow-stage-graphs.mjs`
- `domains/coding/workflows/feature.yaml`
- `domains/coding/registry.yaml`
- `src/setup/registrations.mjs`
- relevant existing tests

Pin:

- `bundleForStage(coding, "planning")` returns `fgos-coding-planning` /
  `shape-plan`;
- `bundleForStage(coding, "executing")` returns `fgos-coding-implement` /
  `implement-item`;
- `skillForStage()` behavior is unchanged.

### 21.2 Add Registry Support

Implement:

- parse `stage.operations`;
- build `operationMap`;
- freeze operation data;
- export `operationsForStage()`;
- synthesize primary operation from `bundleForStage()` when explicit operations
  are absent.

Do not:

- change `skillForStage()`;
- change `bundleForStage()`;
- change `resolveWorkflow()`;
- change stage transitions.

### 21.3 Add Coding Feature Operations

Update:

- `domains/coding/workflows/feature.yaml`

Add operations for:

- discovery: `judge-ambiguity`, `resolve-question` for researcher consult /
  ambiguity evidence gathering;
- exploring: `lock-decisions`, `answer-question`, `resolve-question`;
- planning: `shape-plan`, `validate-plan`, `scout-blast-radius`,
  `resolve-question`;
- executing: `implement-item`, `review-item`, `fix-verify-red`,
  `scoped-subtask`, `scout-blast-radius`, `resolve-question`.

Leave `decompose` minimal unless implementation finds a concrete drain-only
operation need.

### 21.4 Add Validation

Update:

- `src/setup/registrations.mjs`

Validate:

- operation taskSpec resolves;
- operation role exists;
- operation skills resolve;
- operation reason matches a legal edge or is intentionally reasonless;
- only one primary operation exists per stage;
- primary operation does not contradict existing stage `skill`/`taskSpec`.

### 21.5 Verify

Run the focused tests added for:

- workflow normalization;
- operation helper;
- setup validation.

Then run the existing tests most likely affected:

```txt
node --test test/runner/dispatch.test.mjs
node --test test/runner/loop.test.mjs
```

If setup/doctor tests have a narrower file, run that too.

### 21.6 Done Criteria

Slice 1 is done when:

- operation metadata loads from workflow YAML;
- `operationsForStage()` works for explicit and synthesized stages;
- coding feature workflow names its operation set;
- bad operation config fails validation;
- existing stage skill/taskSpec behavior is unchanged;
- no driver behavior changes;
- no assignment execution exists yet.
