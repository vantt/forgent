# Step 01 - Team Dispatch V1 Rollout

Status: staged rollout plan
Date: 2026-08-27
Scope: safe sequence for moving from current coding workflow to operation-based team dispatch

## 1. Principle

Make operations visible before they drive behavior.

```txt
Declare -> validate -> read -> assign -> dispatch -> evidence -> drive
```

Each step should preserve the current primary path until the next layer is
tested.

## 1.1 Surface Ownership

| Slice | Harness/code | Workflow/stage/taskSpec | Prose/skill/doctrine | Config/policy | Runtime/dispatch |
|---|---|---|---|---|---|
| 1 | change | change | docs only | no | no |
| 2 | maybe read-only CLI | no | maybe read-only guidance | no | no |
| 3 | add assignment builder | no | no | no | no |
| 3a | add policy resolver | maybe read policy hints | no | change | no new transport |
| 4 | use existing dispatch APIs | no | no | read existing config | change through `cli-spawn` only |
| 5 | add RunResult writer | no | no | no | add evidence/result storage |
| 6 | no new registry shape | no | change driver/stage skill guidance | read policy | use assignments |
| 7 | orchestrator strategy | no | strategy guidance | read policy | dispatch assignments |

First-slice boundary:

```txt
Slice 1 touches workflow loader/validation and feature workflow YAML only.
It does not change driver behavior, provider routing, executor config, or Herdr.
```

## 2. Slice 1 - Operation Registry Only

Goal: add operation metadata without runtime behavior change.

Work:

- preserve `stage.operations` in workflow normalization;
- add `operationsForStage()`;
- add coding feature operations;
- validate operation taskSpec/role/skill/reason references.

Runtime impact:

```txt
none
```

Verification:

- unit tests for normalization and helper lookup;
- setup/doctor validation tests;
- existing dispatch/driver tests unchanged.

Exit criteria:

```txt
Current stage.skill/taskSpec path behaves exactly as before.
operationsForStage() exposes the richer operation set.
```

## 3. Slice 2 - Read-Only Operation Surface

Goal: make operation sets inspectable by humans and skills.

Options:

- a small CLI read surface;
- a JSON report command;
- or module-only helper if no CLI consumer exists yet.

Preferred CLI shape if needed:

```txt
fgos workflow operations --domain coding --workflow feature --stage planning --json
```

Verification:

- planning stage lists `shape-plan`, `validate-plan`, `scout-blast-radius`,
  `resolve-question`;
- executing stage lists `implement-item`, `review-item`, `fix-verify-red`,
  `scoped-subtask`, `scout-blast-radius`, `resolve-question`.

Exit criteria:

```txt
The driver can see allowed operations without inventing them.
```

## 4. Slice 3 - Assignment Builder

Goal: convert one selected operation into a bounded assignment.

Start with:

```txt
planning.validate-plan
```

Work:

- build assignment object;
- render assignment prompt;
- keep storage optional unless execution starts in the same slice.

Verification:

- assignment includes work/domain/workflow/stage/operation/role/taskSpec;
- unknown operation refuses;
- taskSpec path resolves.

Exit criteria:

```txt
One operation can become one assignment without creating child work.
```

## 5. Slice 3a - Dispatch Policy Resolver

Goal: resolve provider/model/tier/persona preferences before runtime execution.

Work:

- add an effective policy helper for assignments;
- merge global/domain/workflow/stage/operation/role/persona/work/assignment/CLI
  policy inputs;
- treat constraints, preferences, and rigor differently;
- keep executor invocation truth in existing runner dispatch config.

Merge rules:

```txt
constraints = union, fail closed
executor/provider = highest-specificity preference
tier = strongest required tier
model = resolved from provider policy after provider+tier
literal model = assignment or human/CLI override only
governance = final gate
```

Verification:

- `validate-plan` defaults to reviewer/code-reviewer/claude/standard;
- high-risk work can raise review to critical;
- assignment override can prefer `pi` over operation default;
- governance still rejects disallowed egress;
- existing `execute --for` and work dispatch behavior remains unchanged when
  no assignment policy is present.

Exit criteria:

```txt
An assignment has an effective execution policy before DispatchPlan is compiled.
```

## 6. Slice 4 - cli-spawn Assignment Execution

Goal: run one non-mutating assignment through existing dispatch.

Preferred first operation:

```txt
validate-plan
```

or:

```txt
scout-blast-radius
```

Work:

- choose executor through existing dispatch config;
- run through cli-spawn;
- capture stdout/stderr/exit;
- return assignment metadata with dispatch result.

Verification:

- fake executor e2e test;
- one live/manual dry run if needed;
- no work lifecycle transition happens only because the assignment ran.

Exit criteria:

```txt
A review/consult operation can be executed as an assignment.
```

## 7. Slice 5 - RunResult Evidence

Goal: make result trust explicit.

Work:

- create `.fgos/assignments/<assignment-id>/runs/<attempt>/`;
- write assignment/runtime/result/evidence files;
- classify confidence;
- require result artifact for consult/review;
- require git/artifact evidence for repo-mutating operations.

Verification:

- `reported` for consult result with artifact;
- `no-evidence` for empty settled process;
- `inferred` for git delta without structured claim;
- `failed` for timeout/nonzero.

Exit criteria:

```txt
Drivers and orchestrators can consume evidence instead of terminal narration.
```

## 8. Slice 6 - Driver Operation Choice

Goal: allow the coding driver to choose among legal operations.

Work:

- update driver guidance to inspect allowed operations;
- keep primary operation as default;
- allow consult/review/verify/fix only when declared in operations and legal by
  roleGraph;
- preserve no-progress stop and callstack caps.

Verification:

- planning can choose validate/consult before advancing;
- executing can choose review/fix/verify loops without new FSM states;
- illegal operation refuses before dispatch.

Exit criteria:

```txt
One stage can run multiple task-shaped operations safely.
```

## 9. Slice 7 - Team Orchestration

Goal: coordinate more than one item or assignment.

Work:

- add a simple strategy profile, such as `review-gated` or `frontier-drain`;
- orchestrator selects N items or assignments;
- launcher activates one selected work item;
- dispatcher handles operation assignments;
- RunResult feeds back to orchestrator.

Verification:

- one orchestrated sequence runs planner/reviewer/verifier style operations;
- no agent bypasses dispatcher to spawn another agent;
- no mission lifecycle is required yet.

Exit criteria:

```txt
Team dispatch exists over cli-spawn before Herdr visibility is added.
```

## 10. Deferred

Defer until evidence from the earlier slices shows a need:

- full mission lifecycle;
- full AgentMessage protocol;
- mailbox;
- Herdr-visible run execution;
- auto-ranking across providers;
- reusable global operation registry.

## 11. Recommended First Work Item

Title:

```txt
Preserve and validate workflow stage operations for coding feature workflow
```

Scope:

```txt
workflow-stage-graphs.mjs
domains/coding/workflows/feature.yaml
setup/doctor validation
tests
```

Non-scope:

```txt
assignment execution
RunResult storage
driver behavior changes
Herdr
mission/thread
```

## 12. Independent Code Review Prompt

Use this prompt to review Step 01 independently after the staged rollout plan
is implemented:

```txt
Review the Team Dispatch V1 rollout implementation.

Scope:
- Confirm implementation follows docs/architect/agent-coordination/step-01-team-dispatch-v1-rollout.md.
- Review slice boundaries and make sure later-slice behavior did not leak into earlier slices.
- Focus on sequencing, compatibility, and rollback safety.

Read:
- docs/architect/agent-coordination/step-01-team-dispatch-v1-rollout.md
- docs/architect/agent-coordination/step-00-team-dispatch-v1-overview.md
- docs/architect/agent-coordination/step-02-workflow-stage-operations.md
- docs/architect/agent-coordination/step-03-assignment-runresult.md
- src/state/workflow-stage-graphs.mjs
- src/setup/registrations.mjs
- src/runner/dispatch/cli.mjs
- src/runner/dispatch/resolve.mjs
- src/runner/dispatch/prepare.mjs
- domains/coding/workflows/feature.yaml
- domains/coding/skills/fgos-coding-driving/SKILL.md

Check:
- Slice 1 changes only workflow loader/validation and workflow YAML metadata.
- Slice 2 is read-only if implemented.
- Slice 3 builds Assignment without creating child work or changing work lifecycle.
- Slice 3a resolves policy without hardcoding provider choices into workflow runtime.
- Slice 4 uses existing cli-spawn dispatch instead of introducing a second dispatch path.
- Slice 5 writes RunResult/evidence and does not trust terminal narration as success.
- Slice 6 lets the driver choose only declared/legal operations.
- Slice 7 keeps orchestrator strategy above driver/dispatcher and does not require mission lifecycle.

Findings format:
- Lead with boundary violations, behavioral regressions, missing tests, or unclear rollback risk.
- Include file/line references.
- If no issues, say so and list residual risk.
```
