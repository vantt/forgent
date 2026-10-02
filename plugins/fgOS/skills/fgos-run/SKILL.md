---
name: fgos-run
user-invocable: false
description: >-
  Single execution driver for all domains: runs free-form requests, AgentKit plans,
  or specific phases through the Workflow runner and P1 Execution Core.
---

# fgos-run — Single Execution Driver

`fgos-run` is the thin driver for executing work across all domains. It does not own scheduling, merging, or execution mechanics directly — it delegates completely to the **Workflow runner** (`src/workflow/runner.mjs`) and the **P1 Execution Core** (`src/runner/execution/run.mjs`).

---

## 1. Input Modes

### Mode A: Free-form Prompt / Natural Language Task
When the user gives a natural language task or ad-hoc request:
1. Understand intent, scope, and affected files.
2. Formulate one or more **Unit** objects adhering to the Unit schema (`src/runner/execution/unit.mjs`):
   - `id`: descriptive kebab-case identifier
   - `objective`: concise semantic description of what must be done
   - `capability`: domain:verb (e.g. `docs:write`, `code:implement`)
   - `rigor`: `low` | `standard` | `high` | `critical`
   - `writes`: list of repo-relative paths the unit is allowed to modify (empty = read-only)
   - `dependsOn`: array of prerequisite unit IDs
   - `pattern`: `solo` | `reviewed` | `panel` (optional, defaults to config rule)
3. Save Units to a temporary or workspace YAML file.
4. Start execution through the Workflow runner:
   ```sh
   fgos workflow start --units <units-file.yaml>
   ```

### Mode B: AgentKit Plan Execution
When the user asks to run a plan, a phase ("run phase 2"), or a phase range ("run phase 1..3"):
1. Verify phase units via plan-lint:
   ```sh
   fgos plan-lint <planPath> --phase <N> --json
   ```
2. Launch execution via the Workflow runner:
   ```sh
   fgos workflow start --plan <planPath>
   ```
3. The Workflow runner automatically translates phases into DAG steps, schedules units according to `dependsOn`, executes each unit via `fgos run` in its own isolated worktree, and integrates changes cleanly using pure git.

---

## 2. Human Review Gates & Question Batching

When a workflow step declares a human gate (`gate: { kind: "human" }`) or when an owner review is required:
1. The Workflow runner parks at the gate with outcome `parked` and records the pending question(s).
2. `fgos-run` gathers **all open questions across all parked steps** into a single structured batch.
3. The user answers all questions in one interaction.
4. Answers are recorded via:
   ```sh
   fgos workflow answer <workflowRunId> --step <stepId> --answer "<response>"
   ```
5. The runner resumes execution automatically.

---

## 3. Execution Invariants

- **G2 Non-Infrastructure:** Units, plans, and driver prompts MUST NOT pin executors, providers, models, tiers, or invocations. Those are resolved solely by `bind()`.
- **G7 Herdr Default:** All out-of-process unit runs default to spawning in a watched `herdr` terminal pane when herdr is available, falling back to `cli` when headless.
- **Fail-Closed Mutating Gate:** Every file mutation runs strictly inside an isolated linked git worktree matching the Unit run specification.
- **Honest Outcomes:** Reviewer findings are tracked as `findings`, not execution failures, and fix rounds are bounded by the collaboration pattern.
