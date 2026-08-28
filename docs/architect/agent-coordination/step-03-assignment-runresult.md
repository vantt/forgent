# Step 03 - Assignment, Run, And RunResult

Status: companion implementation plan
Date: 2026-08-27
Scope: selected stage operation to assignment, cli-spawn run metadata, and result evidence

## 1. Goal

Turn one selected stage operation into a dispatchable assignment and record the
execution result with enough evidence for a driver or orchestrator to decide
the next step.

V1 keeps this file-based and local. No mailbox, daemon, or full AgentMessage
protocol is required.

## 2. Assignment Shape

Minimal assignment:

```json
{
  "assignmentId": "asgn_tsk_abc_validate_plan_001",
  "workId": "tsk-abc",
  "domain": "coding",
  "workflow": "feature",
  "stage": "planning",
  "operation": "validate-plan",
  "role": "reviewer",
  "taskSpec": "validate-plan",
  "policy": {
    "minTier": "standard",
    "preferPersona": "code-reviewer",
    "preferExecutor": "claude",
    "fallbackExecutors": ["pi"]
  },
  "objective": "Validate the plan against repo reality",
  "contextRefs": ["docs/history/tsk-abc/plan.md"],
  "expectedOutputs": ["verdict", "findings if blocked"]
}
```

Rules:

- Assignment is semantic. It is not a run and not a work item.
- Assignment may reference a work item but does not own lifecycle.
- Assignment becomes child work only when it needs independent lifecycle,
  approval, merge, or backlog visibility.
- Assignment id uses the assignment namespace, not the work namespace.
- `tsk-*` remains reserved for lifecycle work.

## 2.1 ID Creation

Step 03 must add exactly one assignment id creator before any assignment files
are written.

Suggested helper:

```js
createAssignmentId({ workId, stage, operation, existingIds })
```

Recommended V1 shape:

```txt
asgn_<safe-work-id>_<safe-operation-id>_<n>
```

Example:

```txt
asgn_tsk_abc_validate_plan_001
```

Rules:

- deterministic prefix from work id and operation id;
- numeric suffix increments on collision under `.fgos/assignments/` or the assignment
  store;
- no random id in V1 unless concurrency proves suffix allocation insufficient;
- no `tsk-*` prefix;
- no `msg_*` or `trace_*` until those layers have real writers.

Run ids are derived only when execution starts:

```txt
run_<assignment-id>_<attempt>
```

Example:

```txt
run_asgn_tsk_abc_validate_plan_001_01
```

## 3. Assignment Builder

Suggested module:

```txt
src/runner/team/assignment.mjs
```

Pure helpers:

```js
buildAssignment({ work, domain, workflow, stage, operation, objective, contextRefs })
assignmentPrompt(assignment)
```

Builder responsibilities:

1. Generate a stable assignment id through the assignment id helper.
2. Copy work/domain/workflow/stage identity.
3. Copy operation id, role, taskSpec, reason, and skills.
4. Copy operation policy as declared policy, without resolving provider/model
   yet.
5. Keep context refs as refs, not embedded large content.
6. Produce a prompt payload compatible with existing cli-spawn dispatch.

### 3.1 Effective Dispatch Policy

Before execution, resolve a concrete effective policy for the assignment.

Suggested helper:

```js
resolveAssignmentDispatchPolicy({
  globalPolicy,
  domainPolicy,
  workflowPolicy,
  stagePolicy,
  operationPolicy,
  rolePolicy,
  personaPolicy,
  workPolicy,
  assignmentPolicy,
  cliOverride,
})
```

Resolution order:

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

Rules:

- constraints are accumulated and cannot be weakened;
- executor/provider preference uses the most specific value;
- fallback executors preserve most-specific ordering;
- tier uses the strongest required tier;
- model name is resolved from provider/model policy after executor/provider and
  tier are known;
- literal model names are accepted only from assignment or human/CLI override;
- governance may reject the final choice.

Example effective policy:

```json
{
  "role": "reviewer",
  "persona": "code-reviewer",
  "executorPreference": ["claude", "pi"],
  "providerModel": "claude",
  "tier": "standard",
  "model": "sonnet",
  "visibility": "headless",
  "constraints": {
    "requiresSkills": ["fgos-coding-validating"],
    "carries": ["repo-content"]
  }
}
```

V1 implementation rule:

```txt
Resolve policy before dispatch, but let existing dispatch config remain the source of executor invocation truth.
```

## 4. Dispatch Integration

V1 should start with one non-mutating operation:

```txt
planning.validate-plan
```

or:

```txt
planning.scout-blast-radius
```

Dispatch path:

```txt
assignment
  -> taskSpec/skill/role metadata
  -> effective dispatch policy
  -> capability or executor selection
  -> DispatchPlan
  -> governance
  -> cli-spawn
  -> RunResult
```

Do not start with `implement-item` or `fix-verify-red`; repo-mutating operations
need evidence capture first.

## 5. RunResult Shape

Minimal RunResult:

```json
{
  "runId": "run_asgn_tsk_abc_validate_plan_001_01",
  "assignmentId": "asgn_tsk_abc_validate_plan_001",
  "workId": "tsk-abc",
  "executorId": "codex",
  "policy": {
    "persona": "code-reviewer",
    "tier": "standard",
    "model": "sonnet",
    "executorPreference": ["claude", "pi"]
  },
  "status": "done",
  "confidence": "reported",
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
    "gitBefore": "abc",
    "gitAfter": "abc",
    "changedFiles": [],
    "artifacts": [".fgos/assignments/asgn_tsk_abc_validate_plan_001/runs/01/result.json"],
    "tests": []
  }
}
```

Confidence:

- `verified` - claim plus external evidence;
- `reported` - structured claim, acceptable for consult/review when an artifact
  exists;
- `inferred` - no structured claim, but git/artifact evidence exists;
- `no-evidence` - process settled but no useful proof exists;
- `failed` - timeout, nonzero exit, invalid result, or explicit failure.

## 6. Run Storage

Suggested storage:

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

Rules:

- Always write `assignment.json` before execution.
- Always write `runs/<n>/run.json` before process spawn.
- Always write `runs/<n>/exit.json` after process settlement.
- Always write `runs/<n>/result.json`, even for failure.
- For repo-mutating operations, snapshot git state before and after.
- For consult/review operations, require at least a result artifact.

## 7. Tests

Minimum tests:

1. Build assignment from `planning.validate-plan`.
2. Build assignment from `executing.review-item`.
3. Assignment id uses `asgn_*`, not `tsk-*`.
4. Repeated assignment id allocation increments suffix without overwriting an
   existing assignment directory.
5. Refuse unknown operation.
6. Refuse operation whose taskSpec does not resolve.
7. cli-spawn fake executor writes stdout/stderr/exit/result files.
8. Consult assignment with result artifact classifies as `reported`.
9. Work assignment with git delta classifies as `inferred` or `verified`.
10. Settled process with no result artifact and no git delta classifies as
   `no-evidence`.
11. Work risk or assignment policy can raise tier above operation default.
12. Assignment/human executor override wins over operation preference but still
    fails when governance rejects it.
13. Literal model override is rejected unless it comes from assignment or
    human/CLI input.

## 8. Rollout Rule

The first assignment dispatch should not mutate repo state. Prove the
assignment, Run, and RunResult path with consult/review before
implementation/fix operations.

## 9. Independent Code Review Prompt

Use this prompt to review Step 03 independently after implementation:

```txt
Review the Assignment, Run, and RunResult implementation.

Scope:
- Confirm implementation follows docs/architect/agent-coordination/step-03-assignment-runresult.md.
- Focus on assignment construction, policy resolution inputs, cli-spawn integration, run metadata, result storage, and evidence classification.
- Do not review full mission lifecycle, AgentMessage/mailbox, Herdr visibility, or autonomous driver behavior unless the implementation unexpectedly adds them.

Read:
- docs/architect/agent-coordination/step-03-assignment-runresult.md
- docs/architect/agent-coordination/step-01-team-dispatch-v1-rollout.md
- docs/architect/agent-coordination/dispatch-control-plane-redesign.md
- docs/architect/agent-coordination/agent-team-dispatch-and-herdr-stability.md
- src/runner/dispatch/cli.mjs
- src/runner/dispatch/resolve.mjs
- src/runner/dispatch/prepare.mjs
- src/runner/dispatch/result parsing or adapter modules touched by the implementation
- any new src/runner/team/* or src/runner/assignment/* modules
- tests covering assignment building, cli-spawn fake executor, run storage, and confidence classification

Check:
- Assignment is semantic and does not become lifecycle work.
- Assignment ids use `asgn_*`; work ids stay `tsk-*`.
- Run ids are created only when execution starts and use `run_<assignment-id>_<attempt>`.
- Assignment storage uses `.fgos/assignments/<assignment-id>/assignment.json`.
- Run storage uses `.fgos/assignments/<assignment-id>/runs/<attempt>/`.
- `run.json`, stdout/stderr logs, `exit.json`, `result.json`, and `evidence.json` are written consistently, including failures.
- Consult/review operations can classify as `reported` only with a result artifact.
- Repo-mutating operations require git/artifact evidence before `verified`.
- Settled processes with no useful proof become `no-evidence`, not success.
- Policy overrides respect specificity while constraints fail closed and governance remains final.
- Execution goes through existing cli-spawn dispatch, not a parallel transport path.

Findings format:
- Lead with false-success risks, lifecycle leaks, evidence gaps, policy/governance bypasses, storage bugs, or missing tests.
- Include file/line references.
- If no issues, say so and list residual risk.
```
