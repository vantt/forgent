# Step 05 - Coding Driver Operation Choice

Document type: Roadmap
Design status: Superseded
Superseded by: `../../architecture/protocol-model.md` and `../../architecture/runtime-model.md`
Implementation: Implemented
Last reviewed: 2026-08-31
Canonical for: implementation history only
Original date: 2026-08-28
Scope: make the coding-domain driver select declared stage operations and consume hardened RunResults without replacing Work lifecycle semantics

## 1. Goal

Teach the coding driver to choose legal stage operations when the current stage
needs team collaboration.

The driver should remain a lifecycle driver, not an orchestrator:

```txt
driver reads Work
driver sees current stage
driver chooses one legal operation
driver executes or invokes it
driver consumes evidence
driver either loops, stops, or calls an engine verb
```

## 2. Prerequisite

Step 04 must be complete. The driver must not consume Assignment RunResults
until false-success and missing-artifact paths are hardened.

## 3. Non-Goals

- Do not create Mission lifecycle.
- Do not create child Work for every secondary operation.
- Do not make Herdr truth.
- Do not replace `fgos-coding-driving` with a new router.
- Do not remove primary `stage.skill/taskSpec` compatibility.

## 4. Files To Touch

Expected prose/skill files:

- `domains/coding/skills/fgos-coding-driving/SKILL.md`
- `domains/coding/skills/fgos-coding-planning/SKILL.md`
- `domains/coding/skills/fgos-coding-validating/SKILL.md`
- `domains/coding/skills/fgos-coding-implement/SKILL.md`
- `domains/coding/skills/fgos-coding-discovering/SKILL.md`
- relevant references under `domains/coding/skills/*/references/`

Expected code files:

- `src/runner/loop.mjs` only if the runtime loop itself gets operation choice
  hooks;
- `src/runner/dispatch/assignment.mjs`;
- `src/runner/dispatch/assignment-runner.mjs`;
- possibly a new small module such as
  `src/runner/dispatch/operation-choice.mjs`.

Expected tests:

- `test/runner/assignment-dispatch.test.mjs`
- `test/runner/assignment-runresult.test.mjs`
- `test/runner/loop.test.mjs`
- `test/skills/*` tests that pin skill prose behavior if present.

## 5. Operation Choice Helper

Add one pure helper before wiring any stage skill:

```js
chooseStageOperation({
  work,
  stage,
  domain,
  workflow,
  availableOperations,
  driverIntent,
  lastRunResult,
  contextSignals
})
```

Initial V1 can be deterministic and conservative. It does not need LLM
judgment.

Suggested return shape:

```json
{
  "operation": "validate-plan",
  "reason": "plan-written-needs-reality-check",
  "dispatch": "assignment",
  "stop": false
}
```

Allowed alternatives:

```json
{
  "operation": "shape-plan",
  "reason": "primary-stage-owner-work",
  "dispatch": "direct-stage-skill",
  "stop": false
}
```

```json
{
  "operation": null,
  "reason": "awaiting-human",
  "dispatch": null,
  "stop": true
}
```

The helper must not mutate Work, create assignments, or spawn executors.

## 6. Initial Deterministic Rules

### 6.1 Discovery

Default:

```txt
discovery -> judge-ambiguity primary path
```

Use researcher Assignment only when the discovery owner identifies a concrete
bounded evidence gap. Discovery must not ask the human directly.

If the result is:

- `reported` with clear evidence: owner may incorporate it and decide
  `clear`/`unclear`;
- `no-evidence`: retry once or route to `unclear`;
- `failed`: stop as system block;
- `blocked`: route to `unclear` if the blocker is product ambiguity, otherwise
  stop as system block.

### 6.2 Planning

Default:

```txt
planning -> shape-plan primary path
```

Once plan.md exists and contains no outstanding planning-authoring gap, choose:

```txt
planning.validate-plan -> reviewer Assignment
```

`validate-plan` result handling:

- `reported` with verdict `READY`: driver may proceed to the existing
  `fgos plan` engine call path;
- `reported` with `READY WITH CONSTRAINTS`: driver may proceed only if
  constraints are written into plan.md or the gate accepts them;
- `reported` with `NOT READY - RETURN TO PLANNING`: invoke planning again;
- `no-evidence`: do not move stage; request a proper validation artifact or
  retry once;
- `failed`: stop with error category;
- `blocked`: if product input needed, route to exploring/advisor; otherwise
  stop.

Do not let `validate-plan` itself call `fgos plan` once it is running as a
reviewer Assignment. The lifecycle driver owns the engine verb.

### 6.3 Executing

Default:

```txt
executing -> implement-item primary path
```

Use secondary operations only for bounded cases:

- `scout-blast-radius`: before editing a risky symbol when impact is unknown;
- `scoped-subtask`: independent helper work with non-overlapping footprint;
- `review-item`: after a candidate implementation or returned diff needs
  review;
- `fix-verify-red`: after a specific verify/review failure is known.

Result handling:

- mutating helper work requires `verified`;
- read-only review/research can feed driver judgment at `reported`;
- `inferred` is inspection-only until a human/driver confirms;
- `no-evidence` never advances Work;
- failed or blocked stops or routes according to blocker type.

## 7. Skill Doctrine Updates

### 7.1 Driving Skill

Add a section:

```txt
Operation-aware loop
```

It should say:

- the driver first checks lifecycle stops and ceilings exactly as today;
- then it resolves `operationsForStage`;
- primary operation keeps the old direct stage-skill path;
- secondary operation creates an Assignment only when the stage skill or
  deterministic rule selects it;
- Assignment result is evidence input, not lifecycle movement;
- only engine verbs move Work.

### 7.2 Planning Skill

Reword the handoff to validating:

```txt
Before Step 05 adoption, load fgos-coding-validating directly as the
compatibility path. After Step 05 adoption, the driver should represent this as
planning.validate-plan reviewer Assignment and the driver owns the eventual
fgos plan call.
```

### 7.3 Validating Skill

Reconcile role prose:

- When running as direct compatibility path, validating may be same-session
  implementer function.
- When running as `planning.validate-plan` Assignment, it is a reviewer-role
  operation.
- The reviewer Assignment must not call `fgos plan`; it writes verdict
  artifacts only.

### 7.4 Implement Skill

Add explicit mapping:

```txt
consult -> scout-blast-radius or resolve-question Assignment
assist  -> scoped-subtask Assignment
review  -> review-item Assignment
fix     -> fix-verify-red operation, usually direct implementer path
advise  -> async advisor path, not cli-spawn unless explicitly supported
```

## 8. Code Wiring Strategy

Keep the first code slice narrow:

1. Add operation-choice helper and unit tests.
2. Add driver support for `planning.validate-plan` only.
3. Keep discovery and executing prose-updated but not runtime-wired in the same
   slice unless tests prove the planning path stable.

Reason:

```txt
planning.validate-plan is read-only, bounded, and already has a clear
RunResult artifact contract after Step 04.
```

## 9. Tests

Required tests:

```bash
node --test test/runner/assignment-runresult.test.mjs
node --test test/runner/assignment-dispatch.test.mjs
node --test test/runner/loop.test.mjs
node --test test/cli/fgos-workflow.test.mjs
```

Add focused tests:

- driver chooses primary path when no plan.md exists;
- driver chooses `validate-plan` when plan.md exists and validation is due;
- `validate-plan` `no-evidence` does not call `fgos plan`;
- `validate-plan` `READY` with `reported` allows existing planning edge path;
- `validate-plan` invalid operation is refused;
- `dispatch: human-only` operation is not executed;
- discovery still cannot ask human directly.

## 10. Acceptance Criteria

Step 05 is done when:

- coding driver can choose at least one secondary operation;
- Work lifecycle remains owned by existing engine verbs;
- primary stage path still works unchanged;
- `planning.validate-plan` can run as reviewer Assignment;
- reviewer Assignment writes RunResult artifacts and never moves Work directly;
- driver consumes RunResult confidence conservatively;
- tests prove `no-evidence` and `failed` cannot advance stage/status;
- skill prose and task-spec prose no longer contradict role ownership.

## 11. Manual Scenario

Use one planning-stage Work item with a committed `plan.md`.

Expected path:

1. Driver reads Work at `stage: planning`.
2. Driver sees plan exists and selects `validate-plan`.
3. Driver builds Assignment attached to the Work id.
4. Driver executes Assignment.
5. Reviewer writes `agent-result.json` with verdict.
6. Driver reads RunResult.
7. If `reported` and verdict READY, driver invokes the existing `fgos plan`
   path.
8. If `no-evidence`, driver stops without moving Work.

## 12. Rollback

Rollback only the operation-choice wiring. Keep Step 04 evidence hardening and
read-only operation surfaces.
