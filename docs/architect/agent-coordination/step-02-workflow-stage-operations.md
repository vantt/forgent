# Step 02 - Workflow Stage Operations

Status: companion implementation plan
Date: 2026-08-27
Scope: workflow YAML operations, registry normalization, lookup helpers, and validation for coding feature workflow

## 1. Goal

Upgrade the coding feature workflow from:

```txt
stage -> one skill + one taskSpec
```

to:

```txt
stage -> primary operation + allowed operation set
```

without changing the current driver behavior first.

## 2. Current Evidence

Current files:

- `domains/coding/workflows/feature.yaml` declares `discovery`, `exploring`,
  `decompose`, `planning`, and `executing`.
- Each stage currently has at most one `skill` and one `taskSpec`.
- `src/state/workflow-stage-graphs.mjs` normalizes workflow YAML into
  `skillMap` and `taskSpecMap`.
- `bundleForStage()` returns one `{ skill, taskSpec }`.
- `domains/coding/task-specs/` already contains multiple task-shaped
  operations for planning and executing.

## 3. Data Shape

Extend stage entries with optional `operations`.

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
        policy:
          minTier: standard
          preferPersona: code-reviewer
          preferExecutor: claude
          fallbackExecutors:
            - pi
```

Field meanings:

- `id` - stable operation id, usually equal to task-spec id.
- `primary` - operation equivalent to the existing stage `skill`/`taskSpec`.
- `taskSpec` - task-spec file id under `domains/<domain>/task-specs/`.
- `role` - role expected to perform the operation.
- `reason` - handoff reason when the operation uses a roleGraph edge.
- `skills` - skills/capabilities needed by the actor.
- `policy` - optional execution hints; it does not replace dispatch
  governance or executor config.

Policy field meanings:

- `minTier` - minimum model tier/rigor for this operation.
- `preferPersona` - preferred agent-type/persona for this operation.
- `preferExecutor` - preferred executor id when assignment dispatch reaches
  runtime.
- `fallbackExecutors` - ordered executor ids to try when the preferred executor
  is unavailable or rejected by policy/governance.
- `visibility` - optional preference such as `headless` or `visible`; V1 should
  default to headless cli-spawn for proof stability.

Policy rule:

```txt
Operation policy is a hint layer, not a permanent provider binding.
```

Workflow YAML should declare only defaults that are true for the operation
itself. Work-item, assignment, and human/CLI overrides can specialize later.

## 4. Registry Changes

Touchpoint:

- `src/state/workflow-stage-graphs.mjs`

Changes:

1. `normalizeWorkflow()` preserves `operations` for each stage.
2. The normalized workflow gains `operationMap`.
3. `operationMap[stage]` is a frozen array.
4. Operation objects and nested `skills` arrays are frozen.
5. Existing `stages`, `stepMap`, `transitions`, `skillMap`, and `taskSpecMap`
   remain unchanged.

New helper:

```js
operationsForStage(domain, stage, options = {})
```

Rules:

- Resolve workflow through `resolveWorkflow(domain, kind)`.
- If explicit operations exist, return them.
- If not, synthesize one primary operation from `bundleForStage()`.
- If no skill and no taskSpec exist, return `[]`.
- Never throw for absent stage/config; return `[]`.

## 5. Coding Feature Operations

Initial explicit operation set:

```txt
discovery:
  judge-ambiguity                 -> primary, planner/discoverer, current default executor
  resolve-question                -> machine-only consult, researcher, gather ambiguity evidence, prefer pi/openai-codex:gpt-5.5

exploring:
  lock-decisions                  -> primary, planner, prefer claude/sonnet
  answer-question                 -> advise, advisor, prefer claude/sonnet
  resolve-question                -> consult, researcher, prefer pi/openai-codex:gpt-5.5

planning:
  shape-plan                      -> primary, planner, prefer claude/sonnet
  validate-plan                   -> review, reviewer, prefer claude/sonnet, critical -> opus
  scout-blast-radius              -> consult, researcher/tool, prefer gitnexus then pi
  resolve-question                -> consult, researcher, prefer pi/openai-codex:gpt-5.5

executing:
  implement-item                  -> primary, implementer, prefer agy-cli/gemini-3.6-flash-medium
  review-item                     -> review, reviewer, prefer claude/sonnet, critical -> opus
  fix-verify-red                  -> fix, debugger/implementer, prefer claude for diagnosis or agy-cli for bounded edits
  scoped-subtask                  -> assist, helper, prefer agy-cli or pi
  scout-blast-radius              -> consult, researcher/tool, prefer gitnexus then pi
  resolve-question                -> consult, researcher, prefer pi/openai-codex:gpt-5.5
```

`decompose` remains compatibility/drain-only unless a separate decision says it
needs explicit operations.

## 6. Validation

Touchpoint:

- `src/setup/registrations.mjs`

Checks:

1. Every `operation.taskSpec` resolves to a real task-spec file.
2. Every `operation.role` exists in `roleGraph.roles` when a roleGraph exists.
3. Every `operation.skills[]` is provided by at least one registered agent-type.
4. Every `operation.reason`, when present, matches at least one legal roleGraph
   edge at that stage.
5. Every stage has at most one `primary: true` operation.
6. If a stage has existing `skill`/`taskSpec`, its primary operation must not
   contradict them.
7. Every `policy.preferExecutor` and `policy.fallbackExecutors[]`, when present,
   names a configured executor or is skipped until the policy resolver slice.
8. Every `policy.preferPersona`, when present, names a known agent-type.
9. Every `policy.minTier`, when present, uses the existing model-policy tier
   vocabulary.

## 7. Tests

Minimum tests:

1. Existing `bundleForStage(coding, planning)` still returns
   `fgos-coding-planning` and `shape-plan`.
2. `operationsForStage(coding, planning)` returns `shape-plan`,
   `validate-plan`, `scout-blast-radius`, and `resolve-question`.
3. A workflow with no explicit operations synthesizes a primary operation.
4. A bad operation taskSpec fails setup/doctor validation.
5. A bad operation role fails validation.
6. A bad operation reason fails validation when roleGraph is present.
7. A malformed operation policy fails validation.
8. Operation policy is preserved but does not affect `bundleForStage()`.

## 8. Rollout Rule

This slice must not change runtime driving behavior.

The driver may keep loading the same primary stage skill. The new operation
lookup exists so the next slice can choose operations deliberately.

## 9. Independent Code Review Prompt

Use this prompt to review Step 02 independently after implementation:

```txt
Review the workflow stage operations implementation.

Scope:
- Confirm implementation follows docs/architect/agent-coordination/step-02-workflow-stage-operations.md.
- Focus on workflow YAML normalization, operation lookup, validation, and compatibility.
- Do not review assignment execution or driver autonomy unless the implementation unexpectedly changes them.

Read:
- docs/architect/agent-coordination/step-02-workflow-stage-operations.md
- docs/architect/agent-coordination/orchestration-vocabulary-map.md
- domains/coding/workflows/feature.yaml
- domains/coding/registry.yaml
- domains/coding/task-specs/*.md
- src/state/workflow-stage-graphs.mjs
- src/setup/registrations.mjs
- related tests for workflow normalization, setup/doctor validation, and dispatch/driver compatibility

Check:
- `stage.operations` is preserved in normalized workflow data.
- `operationsForStage()` returns explicit operations when declared.
- `operationsForStage()` synthesizes one primary operation from existing `skill`/`taskSpec` when operations are absent.
- Existing `skillForStage()` and `bundleForStage()` behavior is unchanged.
- Coding feature workflow declares operations for discovery, exploring, planning, and executing.
- Discovery `resolve-question` remains machine-only consult/evidence gathering, not human clarification.
- Validation catches bad taskSpec, role, skill, reason, duplicate primary, malformed policy, and primary-operation contradictions.
- Operation policy metadata is preserved but does not change executor selection in this slice.

Findings format:
- Lead with compatibility regressions, bad validation gaps, config drift, or missing tests.
- Include file/line references.
- If no issues, say so and list residual risk.
```
