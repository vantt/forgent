# Step 01 - Team Dispatch V1 Rollout

Status: staged rollout plan
Date: 2026-08-27
Scope: safe sequence for moving from current coding workflow to operation-based team dispatch

## 1. Purpose

Step 00 defines the V1 architecture target:

```txt
Work
Flow operations
Assignment
Run
RunResult
```

This document turns that target into independently reviewable work slices.
Each slice must preserve the current primary path until the next layer has
tests and rollback instructions.

The rollout rule is:

```txt
Declare -> validate -> read -> assign -> policy -> dispatch -> evidence -> drive -> orchestrate
```

The first implementation slice should make operations visible and validated.
It must not make the driver choose operations, run assignments, add Herdr
visibility, create mission lifecycle, or introduce a queue/scheduler.

## 2. Current Starting Point

The current codebase already has these surfaces:

- `domains/coding/workflows/feature.yaml` declares the coding feature workflow.
- `domains/coding/registry.yaml` declares the coding `roleGraph` roles, legal
  call edges, stage labels, and workflow selection.
- `domains/coding/task-specs/*.md` already defines task-shaped contracts for
  discovery, exploring, planning, executing, review, consult, assist, and fix
  work.
- Some task-spec prose still distinguishes function from roleGraph holder.
  Before runtime dispatch, operation `role` must be reconciled with each
  task-spec's execution contract.
- `domains/coding/skills/fgos-coding-driving/SKILL.md` is the mechanical loop
  that resolves the current position to one stage skill, invokes it, and
  re-reads state.
- `domains/coding/skills/fgos-coding-discovering/SKILL.md` already proves a
  machine-alone consult loop: discovery can call `fgos-researching`, log
  `handoff --reason consult`, and then apply `clear` or `unclear` without
  asking the human directly.
- `src/state/workflow-stage-graphs.mjs` normalizes workflow YAML into stage,
  step, transition, skill, taskSpec, and operation lookup data.
- `src/setup/registrations.mjs` owns setup/doctor validation for registry,
  task-spec, agent-type, and operation drift.
- `src/runner/dispatch/*.mjs` owns dispatch config, executor resolution,
  mechanism choice, prompt preparation, transport adapters, DispatchPlan, and
  current result normalization.
- `src/runner/loop.mjs` remains the single-work runner path and must keep its
  current work lifecycle semantics.
- `src/state/stage-fsm.mjs`, `src/state/status-fsm.mjs`, `src/state/handoff.mjs`,
  and `src/state/runtime-coordination.mjs` own stage transitions, status
  transitions, role-call legality, and runtime claims.

The narrow gap is:

```txt
Current: stage -> one skill + one taskSpec
Needed:  stage -> primary operation + optional operation set
```

## 3. Vocabulary And Boundary Rules

Use these terms consistently:

- `Work` is the lifecycle authority.
- `Assignment` is the semantic request to one role/executor/tool.
- `Run` is one runtime attempt to execute an assignment.
- `RunResult` is the normalized result and evidence from a run.
- `Job` is reserved for a future queue/scheduler design. Do not use it for V1
  objects, ids, files, tests, or examples.
- Discovery is machine-alone. It may consult machine helpers for facts and
  evidence. It must not ask the human directly; unresolved product ambiguity
  routes to exploring.

Keep these separations intact:

```txt
Work != Assignment
Stage != Operation
Role != Executor
Dispatch != RunResult
Visibility != Evidence
```

## 4. Dependency Order

The dependency order is strict unless an implementation plan explicitly proves
a slice can be split further:

1. Slice 1: preserve and validate operation metadata.
2. Slice 2: expose operations read-only.
3. Slice 3: build Assignment from one selected operation.
4. Slice 3a: resolve effective assignment dispatch policy.
5. Slice 4: execute one non-mutating assignment through existing cli-spawn.
6. Slice 5: write Run and RunResult evidence.
7. Slice 6: let the coding driver choose declared/legal operations.
8. Slice 7: coordinate multiple items or assignments above the driver.

Do not start Slice 4 before Slice 3a has a minimal policy resolver. Do not
start Slice 6 before Slice 5 can distinguish `reported`, `verified`,
`inferred`, `no-evidence`, and `failed`.

## 5. Surface Ownership

| Slice | Purpose | Code/config surfaces | Doc/skill surfaces | Runtime impact |
|---|---|---|---|---|
| 1 | operation registry only | `domains/coding/workflows/feature.yaml`, `src/state/workflow-stage-graphs.mjs`, `src/setup/registrations.mjs`, normalization/setup tests | Step 02 | none |
| 2 | read-only operation surface | optional CLI/report facade, `operationsForStage()` callers, tests | optional CLI docs | none |
| 3 | Assignment builder | new small assignment module under `src/runner/dispatch/` or `src/runner/team/`, prompt tests | Step 03 | none unless explicitly paired with Slice 4 |
| 3a | policy resolver | dispatch policy helper, runner config readers, resolver tests | policy notes in Step 03 | no new transport |
| 4 | cli-spawn assignment execution | `src/runner/dispatch/cli.mjs`, `prepare.mjs`, `resolve.mjs`, `plan.mjs`, `transport.mjs`, fake executor tests | none required | one non-mutating assignment can run |
| 5 | RunResult evidence | assignment storage writer, result classifier, dispatch result bridge, filesystem tests | Step 03 | writes `.fgos/assignments/` |
| 6 | driver operation choice | `fgos-coding-driving`, stage skills, `src/state/handoff.mjs` guard use, loop tests | driver/stage skill guidance | driver may dispatch legal operations |
| 7 | team orchestration | orchestrator/launcher strategy layer, runner selection tests | strategy guidance | multiple assignments/items coordinated |

## 6. Slice 1 - Operation Registry Only

Purpose: add operation metadata and validation without changing runtime
behavior.

Exact code/config surfaces:

- `domains/coding/workflows/feature.yaml`
  - Add `operations` under `discovery`, `exploring`, `planning`, and
    `executing`.
  - Mark the current `skill`/`taskSpec` pair as `primary: true`.
  - Leave `decompose` compatibility/drain-only unless a later decision gives it
    explicit operations.
- `src/state/workflow-stage-graphs.mjs`
  - Preserve `stage.operations`.
  - Produce `operationMap`.
  - Freeze operation arrays, operation objects, nested `skills`, and nested
    policy arrays.
  - Add or keep `operationsForStage(domain, stage, { kind })`.
  - Keep `skillMap`, `taskSpecMap`, `bundleForStage()`, and `skillForStage()`
    compatible.
- `src/setup/registrations.mjs`
  - Validate operation task-specs, roles, skills, reasons, duplicate primary
    operations, dispatch mode, policy vocabulary, and primary-operation
    contradictions.
- Tests:
  - `test/state/workflow-stage-graphs.test.mjs`
  - `test/setup/registrations.test.mjs`
  - setup/doctor coverage that checks the registered validation hook.

Must not change:

- No driver behavior change.
- No executor/provider routing change.
- No assignment files.
- No `.fgos/assignments/` writes.
- No Herdr use.
- No mission/thread/mailbox.
- No stage/status FSM edge changes.
- No child work creation.

Verification commands:

```bash
node --test test/state/workflow-stage-graphs.test.mjs
node --test test/setup/registrations.test.mjs
node --test test/runner/dispatch.test.mjs
```

Useful manual checks:

```bash
node -e "import('./src/state/workflow-stage-graphs.mjs').then(({operationsForStage}) => console.log(operationsForStage('coding','planning').map(o => o.id)))"
node -e "import('./src/state/workflow-stage-graphs.mjs').then(({bundleForStage}) => console.log(bundleForStage('coding','planning')))"
```

Rollback strategy:

- Revert only the `operations` entries in `feature.yaml`, the
  `operationMap`/`operationsForStage()` additions, and the operation validation
  tests.
- Since no runtime behavior may depend on operations in this slice, rollback
  should restore the previous one-stage/one-skill path without data migration.

Done criteria:

```txt
bundleForStage(coding, planning) still returns fgos-coding-planning / shape-plan.
operationsForStage(coding, planning) exposes shape-plan, validate-plan, scout-blast-radius, resolve-question.
Bad operation config fails setup/doctor validation.
Human-only operations are visible but not dispatchable through cli-spawn.
No dispatch/driver test changes are required except compatibility assertions.
```

## 7. Slice 2 - Read-Only Operation Surface

Purpose: make operation sets inspectable by humans, tests, and future driver
logic before any behavior uses them.

Exact code/config surfaces:

- Prefer no config changes.
- If a CLI is justified, add a narrow read-only command such as:

  ```txt
  fgos workflow operations --domain coding --workflow feature --stage planning --json
  ```

- If no CLI consumer exists yet, keep this slice as a module-only helper and
  test `operationsForStage()` directly.

Must not change:

- No stage skill invocation logic.
- No dispatch execution.
- No assignment builder.
- No policy resolution.
- No writes to `.fgos/`.

Verification commands:

```bash
node --test test/state/workflow-stage-graphs.test.mjs
node --test test/setup/registrations.test.mjs
```

If a CLI is added, add a CLI test proving:

- planning lists `shape-plan`, `validate-plan`, `scout-blast-radius`,
  `resolve-question`;
- executing lists `implement-item`, `review-item`, `fix-verify-red`,
  `scoped-subtask`, `scout-blast-radius`, `resolve-question`;
- absent stage returns an empty list or a clear validation envelope, not a
  thrown stack trace.

Rollback strategy:

- Remove only the read-only CLI/report facade and its tests.
- Keep Slice 1 metadata and validation, because later slices can still use the
  module helper.

Done criteria:

```txt
Allowed operations are inspectable without the caller inventing them.
The read surface is pure/read-only.
```

## 8. Slice 3 - Assignment Builder

Purpose: convert one selected stage operation into a bounded semantic
Assignment.

Preferred first operation:

```txt
planning.validate-plan
```

Exact code surfaces:

- Add a small pure module, preferably one of:
  - `src/runner/dispatch/assignment.mjs`; or
  - `src/runner/team/assignment.mjs` if a team namespace already exists at
    implementation time.
- Read operation metadata through `operationsForStage()`.
- Resolve task-spec paths through `resolveTaskSpecPath()`.
- Do not import the runner loop.
- Do not mutate work state.

Assignment must include at least:

- `assignmentId`;
- `workId`;
- `domain`;
- `workflow`;
- `stage`;
- `operation`;
- `role`;
- `reason` when present;
- `taskSpec`;
- `skills`;
- declared `policy` when present;
- `objective`;
- `contextRefs`;
- `expectedOutputs`.

Must not change:

- Assignment is not Work.
- Assignment must not receive `tsk-*` ids.
- No child work is created.
- No lifecycle state changes.
- No process spawn unless Slice 4 is explicitly included.
- No mailbox or AgentMessage protocol.

Verification commands:

```bash
node --test test/runner/assignment.test.mjs
node --test test/state/workflow-stage-graphs.test.mjs
```

Minimum tests:

- building from `planning.validate-plan` copies role/taskSpec/skills/policy;
- `planning.validate-plan` is blocked from runtime dispatch until task-spec
  prose agrees it is a reviewer Assignment;
- `answer-question` remains visible as `human-only` and is not converted into a
  cli-spawn Assignment;
- unknown stage or operation refuses;
- missing taskSpec refuses;
- generated id uses `asgn_*`;
- generated prompt uses refs instead of embedding large docs.

Rollback strategy:

- Remove the assignment module and tests.
- No `.fgos/` data migration is needed if this slice stayed pure.

Done criteria:

```txt
One declared operation can become one Assignment object.
No work lifecycle state changes because an Assignment was built.
```

## 9. Slice 3a - Dispatch Policy Resolver

Purpose: resolve provider/model/tier/persona preferences before runtime
execution while keeping executor invocation truth in existing runner config.

Exact code/config surfaces:

- New policy helper near assignment/dispatch code.
- Read existing runner config through the established dispatch config loader.
- Reuse `MODEL_POLICY_TIERS`, `modelForTier()`, `resolveExecutorAndOverrides()`,
  and governance checks where possible.
- Do not hardcode provider-specific command shapes in workflow YAML.

Policy input order:

```txt
Global defaults
-> Domain defaults
-> Workflow defaults
-> Stage defaults
-> Operation / taskSpec defaults
-> Role defaults
-> Persona defaults
-> Work-item policy
-> Assignment explicit policy
-> Human / CLI explicit override
-> Governance gate
```

Resolution rules:

- constraints accumulate and fail closed;
- executor/provider preference uses the most specific value;
- fallback executor list uses the most specific list that exists, with
  deterministic order;
- tier resolves to the strongest required tier;
- provider/model policy resolves after executor/provider and tier are known;
- literal model names are accepted only from Assignment or human/CLI override;
- governance remains final and may reject the resolved policy.

Must not change:

- Existing `execute --for` behavior for work/ad-hoc dispatch.
- Existing `executorIdForWork()` stage-skill resolution.
- Existing runner config schema unless a minimal optional assignment policy
  namespace is explicitly reviewed.
- Existing `resolveExecutorCommand()` invocation truth.

Verification commands:

```bash
node --test test/runner/dispatch.test.mjs
node --test test/runner/assignment-policy.test.mjs
```

Minimum tests:

- `validate-plan` defaults to reviewer/code-reviewer/claude/standard when
  declared that way;
- high-risk Work can raise review rigor;
- Assignment override can prefer `pi` over operation default;
- CLI/human override wins over Assignment preference;
- governance rejects disallowed egress after resolution;
- literal model override is rejected unless it comes from Assignment or
  human/CLI input.

Rollback strategy:

- Remove the assignment policy helper and tests.
- Leave operation policy metadata in YAML because it remains inert until a
  runtime caller uses the resolver.

Done criteria:

```txt
An Assignment has a normalized effective policy before DispatchPlan compilation.
Existing work dispatch remains unchanged when no Assignment policy is present.
```

## 10. Slice 4 - cli-spawn Assignment Execution

Purpose: run one non-mutating Assignment through the existing dispatch control
plane.

Preferred first operations:

```txt
planning.validate-plan
planning.scout-blast-radius
discovery.resolve-question
```

Exact code surfaces:

- `src/runner/dispatch/cli.mjs`
- `src/runner/dispatch/prepare.mjs`
- `src/runner/dispatch/resolve.mjs`
- `src/runner/dispatch/plan.mjs`
- `src/runner/dispatch/transport.mjs`
- fake executor tests in `test/runner/dispatch.test.mjs` or a focused
  assignment dispatch test file.

Integration shape:

```txt
Assignment
  -> taskSpec/skill/role metadata
  -> effective dispatch policy
  -> DispatchPlan
  -> existing governance
  -> existing cli-spawn adapter
  -> raw dispatch result plus assignment metadata
```

Must not change:

- No parallel transport path beside existing dispatch adapters.
- No Herdr dependency.
- No repo-mutating first operation.
- No Work stage/status transition only because an Assignment ran.
- No trust in terminal narration as done.
- No queue/scheduler object.

Verification commands:

```bash
node --test test/runner/dispatch.test.mjs
node --test test/runner/assignment-dispatch.test.mjs
```

Minimum tests:

- fake executor receives an assignment prompt;
- stdout/stderr/exit are captured;
- dispatch result includes assignment metadata;
- nonzero exit returns a failed runtime result rather than changing Work;
- timeout returns failed runtime metadata with captured partial output;
- Work item status/stage remains unchanged after a consult/review assignment.

Rollback strategy:

- Remove assignment-specific CLI entry points and adapter plumbing.
- Keep Assignment builder and policy resolver if they remain pure.
- No stored RunResult rollback is required until Slice 5.

Done criteria:

```txt
One non-mutating operation runs through cli-spawn as an Assignment.
The same dispatch governance chokepoints remain in control.
```

## 11. Slice 5 - RunResult Evidence

Purpose: make result trust explicit and durable enough for drivers and
orchestrators.

Exact code surfaces:

- Add Run/RunResult writer near assignment dispatch code.
- Bridge current dispatch result ladder into V1 confidence values.
- Reuse stdout/stderr capture from `src/runner/dispatch/transport.mjs`.
- Snapshot git state only where repo mutation is possible.
- Keep existing `.fgos/logs/` worker logs unchanged; Assignment run logs live
  under `.fgos/assignments/`.

Storage layout:

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

Must not change:

- Do not store under the reserved future queue/scheduler namespace.
- Do not rename current worker logs.
- Do not make Herdr pane status prove success.
- Do not mark success only because a process exited zero.
- Do not require repo git delta for read-only consult/review operations.

Verification commands:

```bash
node --test test/runner/assignment-runresult.test.mjs
node --test test/runner/dispatch.test.mjs
```

Minimum tests:

- `reported` for consult/review with structured claim and worker-produced
  result/report artifact;
- `verified` for structured claim plus external proof;
- `inferred` for git/artifact evidence without structured claim;
- `no-evidence` for settled process with no worker-produced result/report
  artifact and no useful external proof;
- `failed` for timeout, nonzero exit, invalid result, or explicit failure;
- failure still writes `run.json`, logs, `exit.json`, `result.json`, and
  `evidence.json`.
- control-plane `result.json` alone never counts as evidence for `reported` or
  `verified`.

Rollback strategy:

- Disable assignment execution from writing new run directories.
- Keep existing work dispatch and worker logs untouched.
- Existing `.fgos/assignments/` directories are append-only artifacts and can
  be ignored by earlier slices; no Work state migration should be needed.

Done criteria:

```txt
RunResult captures runtime, agent claim, evidence, status, and confidence.
Drivers can consume evidence instead of terminal prose.
```

## 12. Slice 6 - Driver Operation Choice

Purpose: allow the coding driver to choose among declared/legal operations
inside a stage.

Exact code/doc surfaces:

- `domains/coding/skills/fgos-coding-driving/SKILL.md`
- stage-owner skill docs for discovery, exploring, planning, validating, and
  executing when their operation choice rules need prose updates
- `src/state/handoff.mjs` or callers around it for legality checks
- `src/runner/loop.mjs` only if the actual loop needs a new assignment
  dispatch hook
- tests covering driver operation choice and handoff legality

Behavior rules:

- Keep the primary operation as default.
- Choose consult/review/assist/fix only when declared in `stage.operations`.
- Check roleGraph legality before dispatching an operation that crosses roles.
- Preserve no-progress stops.
- Preserve callstack caps.
- Do not convert every operation into a stage FSM transition.
- Discovery remains machine-alone and routes unresolved ambiguity to exploring.

Must not change:

- Work remains lifecycle authority.
- No direct human question from discovery.
- No driver bypass around dispatcher to spawn another agent.
- No stage graph expansion for ordinary review/consult/fix loops.
- No automatic approve/merge.

Verification commands:

```bash
node --test test/state/handoff.test.mjs
node --test test/runner/loop.test.mjs
node --test test/runner/assignment-dispatch.test.mjs
```

Minimum tests:

- planning can choose `validate-plan` before advancing to executing;
- planning can choose declared consult operations;
- executing can choose review/fix/assist loops without a new FSM state;
- undeclared operation refuses before dispatch;
- illegal roleGraph edge refuses before dispatch;
- discovery `resolve-question` remains machine-only evidence gathering.

Rollback strategy:

- Revert driver/stage-skill guidance and dispatch hook.
- Leave operation registry, Assignment builder, policy resolver, and RunResult
  storage available but unused by the driver.

Done criteria:

```txt
The driver can run multiple task-shaped operations within one stage.
Only declared/legal operations are dispatchable.
```

## 13. Slice 7 - Team Orchestration

Purpose: coordinate more than one Work item or Assignment above the single-item
driver.

Exact code/doc surfaces:

- Orchestrator or launcher strategy module, if one already exists by then.
- `src/runner/loop.mjs` only for selection/activation seams already present.
- Assignment dispatch API from earlier slices.
- RunResult reader/index if orchestration needs to summarize results.
- Strategy docs for profiles such as `review-gated` or `frontier-drain`.

Behavior rules:

- Orchestrator selects Work or Assignment candidates.
- Launcher activates one selected Work item when needed.
- Driver remains responsible for progressing one Work item through its flow.
- Dispatcher remains responsible for executing Assignments.
- RunResult feeds back into the orchestrator's next choice.

Must not change:

- No mission lifecycle requirement.
- No mailbox requirement.
- No queue/scheduler object.
- No provider auto-ranking.
- No agent bypasses dispatcher to start another agent directly.
- Herdr remains optional visibility only.

Verification commands:

```bash
node --test test/runner/loop.test.mjs
node --test test/runner/dispatch.test.mjs
node --test test/runner/team-orchestration.test.mjs
```

Minimum tests:

- one `review-gated` sequence runs planner/reviewer/verifier-style operations;
- orchestration does not create child Work unless explicitly requested;
- a failed/no-evidence RunResult prevents false success;
- no mission/thread storage is required for the sequence.

Rollback strategy:

- Disable or remove the strategy profile.
- Keep lower-level Assignment dispatch and RunResult storage intact.
- Because Work remains lifecycle authority, rolling back orchestration should
  not require Work event rewrites.

Done criteria:

```txt
Team dispatch exists over cli-spawn before Herdr visibility is added.
```

## 14. Deferred

Defer until evidence from earlier slices proves a need:

- full mission lifecycle;
- full AgentMessage protocol;
- mailbox;
- Herdr-visible run execution;
- queue/scheduler and any `job` object;
- provider auto-ranking;
- reusable global operation registry;
- broad renames of existing dispatch terms.

## 15. Recommended First Work Item

Title:

```txt
Preserve and validate workflow stage operations for coding feature workflow
```

Scope:

```txt
domains/coding/workflows/feature.yaml
src/state/workflow-stage-graphs.mjs
src/setup/registrations.mjs
test/state/workflow-stage-graphs.test.mjs
test/setup/registrations.test.mjs
```

Non-scope:

```txt
assignment execution
RunResult storage
driver operation choice
Herdr
mission/thread/mailbox
queue/scheduler/job
stage/status FSM changes
```

Review prompt if the first slice needs refinement:

```txt
Review only Slice 1 of Team Dispatch V1.

Confirm that workflow operation metadata is preserved, validated, and exposed
without changing runtime behavior. Look for compatibility regressions in
bundleForStage(), skillForStage(), taskSpecMap, setup/doctor validation, and
the coding feature workflow's primary stage path. Treat any driver dispatch,
Assignment storage, RunResult writing, Herdr integration, mission/thread, or
queue/scheduler behavior as out of scope unless it accidentally changed.
```

## 16. Independent Code Review Prompt

Use this prompt to review Step 01 independently after the staged rollout plan
is implemented:

```txt
Review the Team Dispatch V1 rollout implementation.

Scope:
- Confirm implementation follows docs/architect/agent-coordination/step-01-team-dispatch-v1-rollout.md.
- Review slice boundaries and make sure later-slice behavior did not leak into earlier slices.
- Focus on sequencing, compatibility, and rollback safety.
- Do not review mission lifecycle, AgentMessage/mailbox, Herdr visibility, queue/scheduler jobs, or provider auto-ranking unless the implementation unexpectedly adds them.

Read:
- docs/architect/agent-coordination/step-00-team-dispatch-v1-overview.md
- docs/architect/agent-coordination/step-01-team-dispatch-v1-rollout.md
- docs/architect/agent-coordination/step-02-workflow-stage-operations.md
- docs/architect/agent-coordination/step-03-assignment-runresult.md
- docs/architect/agent-coordination/orchestration-vocabulary-map.md
- docs/architect/agent-coordination/dispatch-control-plane-redesign.md
- docs/architect/agent-coordination/agent-team-dispatch-and-herdr-stability.md
- domains/coding/workflows/feature.yaml
- domains/coding/registry.yaml
- domains/coding/task-specs/*.md
- domains/coding/skills/fgos-coding-driving/SKILL.md
- domains/coding/skills/fgos-coding-discovering/SKILL.md
- src/state/workflow-stage-graphs.mjs
- src/setup/registrations.mjs
- src/runner/dispatch/*.mjs
- src/runner/loop.mjs
- src/state/*fsm*.mjs
- src/state/handoff.mjs
- src/state/runtime-coordination.mjs
- related tests for workflow normalization, setup/doctor validation, dispatch, loop, and assignment/runresult if present

Check:
- Slice 1 changes only workflow loader/validation, feature workflow metadata, and tests.
- Slice 2 is read-only if implemented.
- Slice 3 builds Assignment without creating child Work or changing Work lifecycle.
- Slice 3a resolves policy without hardcoding provider choices into workflow runtime.
- Slice 4 uses existing cli-spawn dispatch instead of introducing a second dispatch path.
- Slice 5 writes RunResult/evidence and does not trust terminal narration as success.
- Slice 6 lets the driver choose only declared/legal operations.
- Slice 7 keeps orchestrator strategy above driver/dispatcher and does not require mission lifecycle.
- Reserved queue/scheduler vocabulary and storage names do not appear in V1 implementation artifacts.
- Discovery remains machine-alone and routes unresolved human/product ambiguity to exploring.

Findings format:
- Lead with boundary violations, behavioral regressions, missing tests, vocabulary drift, or unclear rollback risk.
- Include file/line references.
- If no issues, say so and list residual risk.
```
