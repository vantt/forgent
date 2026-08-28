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

### 3.1 Exact Schema Proposal

`stage.operations` is an optional array on a workflow stage entry. In V1 it is
stage-local metadata, not a global operation registry.

Canonical operation shape:

```yaml
operations:
  - id: validate-plan
    primary: false
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
      visibility: headless
```

Required fields:

- `id` - non-empty string, unique within the stage's operation list.
- `taskSpec` - non-empty string for V1 coding operations. It should resolve to
  `domains/<domain>/task-specs/<taskSpec>.md`.
- `role` - non-empty string when the domain declares `roleGraph.roles`.
- `skills` - array of skill/capability names. It may be empty only for a
  synthesized compatibility operation where the stage has no skill.

Optional fields:

- `primary` - boolean. At most one operation per stage may set `true`.
- `reason` - roleGraph handoff reason, required for cross-role consult/review/
  advise/assist operations and omitted for the current role's primary operation.
- `policy` - inert execution hints preserved for later policy resolution.

Allowed `policy` fields in V1:

```yaml
policy:
  minTier: lightweight | standard | creative | analytical | critical
  preferPersona: <agent-type name>
  preferExecutor: <runner executor id>
  fallbackExecutors:
    - <runner executor id>
  visibility: headless | visible
```

V1 should not add provider command templates, literal model names, prompt text,
timeouts, filesystem paths, or secrets to workflow operation policy. Those
belong to assignment policy, CLI/human overrides, or runner config.

### 3.2 Normalized Operation Shape

`normalizeWorkflow()` should preserve the operation fields without interpreting
runtime policy:

```js
{
  id: 'validate-plan',
  primary: false,
  taskSpec: 'validate-plan',
  role: 'reviewer',
  reason: 'review',
  skills: Object.freeze(['fgos-coding-validating']),
  policy: Object.freeze({
    minTier: 'standard',
    preferPersona: 'code-reviewer',
    preferExecutor: 'claude',
    fallbackExecutors: Object.freeze(['pi']),
    visibility: 'headless',
  }),
}
```

Normalization rules:

- Preserve explicit operations under `workflow.operationMap[stage]`.
- Freeze every operation array.
- Freeze every operation object.
- Freeze `skills`.
- Freeze `policy`.
- Freeze `policy.fallbackExecutors`.
- Do not inject synthesized operations into `operationMap`.
- Do not rewrite `stage.skill` or `stage.taskSpec`.
- Do not resolve executor/provider/model at normalization time.

### 3.3 Compatibility With Existing `skill` And `taskSpec`

Existing callers must keep working:

```js
bundleForStage('coding', 'planning')
// -> { skill: 'fgos-coding-planning', taskSpec: 'shape-plan' }
```

Compatibility behavior:

- `skillForStage()` reads the same `skillMap` as before.
- `bundleForStage()` reads the same `skillMap` and `taskSpecMap` as before.
- A stage's explicit primary operation must agree with the existing
  `stage.skill`/`stage.taskSpec` pair.
- If a stage has no explicit `operations`, `operationsForStage()` synthesizes
  one primary operation from `bundleForStage()`.
- The synthesized operation is returned by the helper only. It is not written
  back into normalized workflow data.
- A stage with `skill` but no `taskSpec` synthesizes `taskSpec` as the stage
  name only for operation-read compatibility. Validation must not pretend a
  missing task-spec file exists unless that synthesized operation becomes a
  declared operation.

Synthesis example for `decompose` today:

```json
{
  "id": "decompose",
  "primary": true,
  "taskSpec": "decompose",
  "role": "implementer",
  "skills": ["fgos-coding-planning"]
}
```

Because `decompose` is compatibility/drain-only, this synthetic operation is a
read surface, not an instruction to add `domains/coding/task-specs/decompose.md`
or dispatch it in V1.

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
- Accept either a domain name or an already resolved domain object.
- Accept `options` as `{ kind }` or the existing string shorthand when that
  convention is already present beside `bundleForStage()`.
- Return frozen arrays so callers cannot mutate registry state.

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

Expected coding feature operation declarations:

| Stage | Operation | Primary | TaskSpec | Role | Reason | Skills |
|---|---|---:|---|---|---|---|
| `discovery` | `judge-ambiguity` | yes | `judge-ambiguity` | `implementer` | omitted | `fgos-coding-discovering` |
| `discovery` | `resolve-question` | no | `resolve-question` | `researcher` | `consult` | `fgos-researching` |
| `exploring` | `lock-decisions` | yes | `lock-decisions` | `implementer` | omitted | `fgos-coding-exploring` |
| `exploring` | `answer-question` | no | `answer-question` | `advisor` | `advise` | `fgos-coding-exploring` |
| `exploring` | `resolve-question` | no | `resolve-question` | `researcher` | `consult` | `fgos-researching` |
| `planning` | `shape-plan` | yes | `shape-plan` | `implementer` | omitted | `fgos-coding-planning` |
| `planning` | `validate-plan` | no | `validate-plan` | `reviewer` | `review` | `fgos-coding-validating` |
| `planning` | `scout-blast-radius` | no | `scout-blast-radius` | `researcher` | `consult` | `fgos-researching` |
| `planning` | `resolve-question` | no | `resolve-question` | `researcher` | `consult` | `fgos-researching` |
| `executing` | `implement-item` | yes | `implement-item` | `implementer` | omitted | `fgos-coding-implement` |
| `executing` | `review-item` | no | `review-item` | `reviewer` | `review` | `fgos-coding-validating` |
| `executing` | `fix-verify-red` | no | `fix-verify-red` | `implementer` | omitted | `fgos-coding-implement` |
| `executing` | `scoped-subtask` | no | `scoped-subtask` | `helper` | `assist` | `fgos-coding-implement` |
| `executing` | `scout-blast-radius` | no | `scout-blast-radius` | `researcher` | `consult` | `fgos-researching` |
| `executing` | `resolve-question` | no | `resolve-question` | `researcher` | `consult` | `fgos-researching` |

Discovery rule:

```txt
Discovery is machine-alone.
```

`discovery.resolve-question` means a machine consult for ambiguity evidence. It
must not become a human-facing question path. If discovery cannot settle the
item from machine evidence, `judge-ambiguity` returns `unclear` and routes the
Work item to `exploring`, where human/product clarification belongs.

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
10. Every operation id is unique within its stage.
11. Every operation item is an object, not a string or array.
12. `skills`, when present, is an array of strings.
13. `policy.fallbackExecutors`, when present, is an array of strings.
14. `policy.visibility`, when present, is either `headless` or `visible`.

Validation should fail setup/doctor loudly for declared operation drift.
Validation should not fail because a synthesized compatibility operation's
implicit taskSpec does not exist; synthesized operations are not declared
workflow config.

Validation must not:

- resolve a provider/model;
- spawn an executor;
- write `.fgos/`;
- create Assignment, Run, or RunResult data;
- add a second lifecycle system beside Work.

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
9. Duplicate operation ids fail validation.
10. `operationsForStage()` returns frozen explicit operations.
11. `operationsForStage()` returns a frozen synthesized primary operation for a
    no-operations stage with existing `skill`.
12. `operationsForStage()` returns `[]` for an absent stage and for a domain
    stage with no skill/taskSpec.
13. Discovery operations include no human-facing advise path.
14. Existing dispatch tests still pass without assignment behavior.

Useful verification commands:

```bash
node --test test/state/workflow-stage-graphs.test.mjs
node --test test/setup/registrations.test.mjs
node --test test/runner/dispatch.test.mjs
```

Manual smoke checks:

```bash
node -e "import('./src/state/workflow-stage-graphs.mjs').then(({operationsForStage}) => console.log(operationsForStage('coding','executing').map(o => o.id).join('\\n')))"
node -e "import('./src/state/workflow-stage-graphs.mjs').then(({bundleForStage}) => console.log(JSON.stringify(bundleForStage('coding','executing'))))"
```

## 7.1 Edge Cases

Cover these explicitly:

- stage has explicit empty `operations: []` - return an empty explicit list,
  not a synthesized operation;
- stage is absent - return `[]`;
- domain is absent - fold through the existing default-domain behavior and do
  not throw;
- `kind` selects a workflow without operation metadata - synthesize from that
  workflow's `skillMap`/`taskSpecMap`;
- primary operation omits `skills` while stage `skill` exists - validation
  should reject or require the stage skill to be represented;
- primary operation points to a different `taskSpec` from `stage.taskSpec` -
  validation rejects;
- operation has `reason: review` at a stage whose roleGraph has no review edge -
  validation rejects;
- operation policy names an unknown `minTier` - validation rejects;
- operation policy names a literal model - validation rejects because literal
  models are not part of the workflow schema.

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
