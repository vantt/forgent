# Step 06 - Work-Attached Team Dispatch Adoption

Status: implementation plan after Step 05
Date: 2026-08-28
Scope: use operation-aware team dispatch on real Work items in planning and executing, with conservative rollout and live evidence checks

## 1. Goal

Move Team Dispatch V1 from tested infrastructure into real coding-domain
workflow usage.

Adoption means:

```txt
real Work item
real stage
declared operation
Assignment
RunResult
driver decision
existing Work lifecycle verb
```

It does not mean every interaction becomes an Assignment.

## 2. Prerequisites

- Step 04 complete.
- Step 05 complete for `planning.validate-plan`.
- `fgos doctor` Team Dispatch checks pass:
  - `task-specs-resolve`;
  - `agent-claims-resolve`;
  - `domain-workflow-operations-coverage`;
  - dispatch decide hook wired;
  - config not stale.
- Existing primary Work path remains green.

## 3. Adoption Order

### Slice 6.1: Planning Validate-Plan On One Real Item

Use `planning.validate-plan` because it is read-only and bounded.

Files likely touched:

- driver/loop operation-choice code from Step 05;
- test fixtures for a planning-stage item with docsRef and plan.md;
- no workflow YAML change expected.

Acceptance:

- one real planning item can run reviewer Assignment;
- result is `reported` or a conservative stop;
- no direct Work lifecycle movement happens inside the reviewer Assignment.

### Slice 6.2: Executing Review-Item

Use `executing.review-item` after a candidate implementation exists.

Acceptance:

- review Assignment reads diff/verify evidence refs;
- reviewer writes findings or approve verdict;
- driver uses verdict to choose approve path, reject/fix path, or stop;
- review result alone does not merge.

### Slice 6.3: Executing Scout-Blast-Radius

Use `executing.scout-blast-radius` before risky edits.

Acceptance:

- researcher Assignment writes blast-radius report;
- degraded/inactive impact-analysis posture is explicit;
- driver treats report as `reported`, not `verified`;
- implementation still requires normal verify/return.

### Slice 6.4: Executing Scoped-Subtask

Use `executing.scoped-subtask` only when the footprint is independent.

Acceptance:

- helper Assignment declares expected touched files;
- helper result must be `verified`;
- driver refuses to proceed if helper touched undeclared or overlapping files;
- child Work is still preferred when the helper needs independent lifecycle.

## 4. Governance Rules During Adoption

- Do not allow Assignment execution to bypass `dispatch decide`.
- Do not let CLI override model/provider bypass egress governance.
- Do not trust Herdr pane status.
- Do not advance Work from `inferred` unless a human/driver explicitly accepts
  the evidence in a later hardened rule.
- Do not auto-retry more than once without a new reason.

## 5. Evidence Requirements By Operation

| Operation | Minimum acceptable confidence | Additional requirement |
|---|---|---|
| `validate-plan` | `reported` | structured verdict and feasibility matrix artifact |
| `review-item` | `reported` | structured approve/reject findings tied to diff/verify refs |
| `scout-blast-radius` | `reported` | named files/symbols and search/graph posture |
| `resolve-question` | `reported` | direct answer, citations, remaining uncertainty |
| `scoped-subtask` | `verified` | post-run changed files or commit; verify evidence |
| `fix-verify-red` | `verified` | changed files plus rerun failing verify |

## 6. Tests

Add integration-style tests with fake executors:

- planning validate-plan happy path;
- planning validate-plan no-evidence stop;
- executing review-item reject routes to fix operation;
- executing scout-blast-radius report does not mutate Work;
- scoped-subtask requires changed-file evidence;
- governance-blocked executor returns a stop, not success;
- Herdr/visibility fields do not affect confidence.

Run:

```bash
node --test test/runner/assignment-runresult.test.mjs
node --test test/runner/assignment-dispatch.test.mjs
node --test test/runner/loop.test.mjs
node --test test/e2e/runner-loop.test.mjs
node bin/fgos.mjs doctor
```

If full doctor is red for unrelated repo-state issues, record the unrelated
checks and require the Team Dispatch checks to pass.

## 7. Live Usage Script

Pick a low-risk docs or test-only Work item.

Required starting state:

- Work item is at `stage: planning`;
- `docsRef` exists;
- `plan.md` exists and is committed;
- item has no open child blockers.

Manual run:

```bash
node bin/fgos.mjs workflow operations --stage planning
node src/runner/dispatch.mjs decide --assignment <assignment-id> --has-live-task-access
node src/runner/dispatch.mjs execute --assignment <assignment-id> --cwd <worktree> --repo-root <main-root>
```

Expected evidence:

- `.fgos/assignments/<assignment-id>/assignment.json`;
- `.fgos/assignments/<assignment-id>/runs/01/run.json`;
- `dispatch-plan.json`;
- `agent-result.json`;
- `evidence.json`;
- `result.json`.

Expected driver behavior:

- `reported READY` can feed the existing planning edge;
- `no-evidence` stops;
- `failed` stops;
- `blocked` routes by blocker type;
- Work status/stage changes only through existing engine verbs.

## 8. Adoption Completion Criteria

Step 06 is done when at least two real Work-attached operations have been used:

1. one read-only operation, preferably `planning.validate-plan`;
2. one executing-stage operation, preferably `review-item` or
   `scout-blast-radius`.

For each operation, preserve:

- command transcript;
- assignment/run/result files;
- driver decision;
- final Work state;
- any rollback or manual intervention.

## 9. Rollback

Disable operation-aware driver selection and fall back to primary stage skill
path. Do not delete stored assignment/run evidence; it remains useful for
audit.

