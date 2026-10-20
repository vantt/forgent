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
2. **One task → the one-liner.** Run it as one Unit straight from the prompt:
   ```sh
   fgos run "<prompt>" [--provider <id>[,<id>...]] [--persona <name>] [--capability <c>] [--rigor <r>] [--effort <level>]
   fgos run "<prompt>" --writes <path>[,<path>...] --worktree <linked-worktree> [--pattern code-change] [--input <path>[,<path>...]] [--verify "<cmd>"]
   ```
   Without `--writes` the Unit is read-only (sandboxed). `--writes` needs a linked worktree (create one with `fgos worktree create <path> --branch <name>` or `fgos worktree create <path> --detach`); from the main checkout it is refused before anything runs. `--provider` is a soft preference that `bind()` tries first and fails over from; `--capability` defaults to `execute`. `--input` hands the Unit repo-relative files to read; `--verify` is the command a reviewed run executes after each producing round (the preset pins none, so a reviewed run without `--verify` says it verified nothing).
3. **Several tasks → `--units`.** Formulate the **Unit** objects (schema: `src/runner/execution/unit.mjs`):
   - `id`: descriptive kebab-case identifier (a safe branch-name segment)
   - `objective`: concise semantic description of what must be done
   - `capability`: domain:verb (e.g. `docs:write`, `code:implement`)
   - `rigor`: `low` | `standard` | `high` | `critical`
   - `writes`: list of repo-relative paths or `*`/`**` globs the unit may modify (empty = read-only)
   - `dependsOn`: array of prerequisite unit IDs
   - `pattern`: `solo` | `reviewed` | `panel` (optional, defaults to config rule)
   - `verify` (optional): shell command a reviewed unit runs after each producing round; `skills` (optional): skill names the work needs, served only by executors whose `supports.skills` lists them
   - `prefer` / `persona` (optional, ad-hoc Units only): a soft executor preference and a persona name
4. Save Units to a temporary or workspace YAML file (`{ id?, title?, units: [...] }` or a list) and start them through the Workflow runner:
   ```sh
   fgos workflow start --units <units-file.yaml> [--effort <level>]
   ```
   A writing Unit that depends on exactly one writing Unit starts from that Unit's branch; nothing is merged automatically (`fgos workflow status` lists `writeBranches`).

### Mode B: AgentKit Plan Execution
When the user asks to run a plan, a phase ("run phase 2"), or a phase range ("run phase 1..3"), the plan is an input you read, not something the runner translates:
1. Read the plan and the phase files as artifacts. Verify the phase's units with plan-lint:
   ```sh
   fgos plan-lint <planPath> --phase <N> --json
   ```
2. Choose a bounded wave of Units for the phase yourself (what can run now, in what order, what each one may write) and run them through one of the two doors:
   ```sh
   fgos run "<objective>" --writes <paths> --worktree <linked-worktree>
   fgos workflow start --units <file> [--foreground]
   ```
   `--units` takes a YAML or JSON list of Units, one step per Unit, ordered by each Unit's `dependsOn`.
   `start` returns at once with the `workflowRunId` and a `detached` block; the run continues in a
   detached process. Read progress with `fgos workflow status <workflowRunId>` (or pass `--foreground`
   to wait in place); `fgos workflow answer` and `fgos workflow resume` return the same way. Do not treat
   the output of `start`, `answer` or `resume` as the final state.
3. Each Unit runs via `fgos run` in its own isolated worktree; the runner commits the Unit's declared `writes` on that worktree's branch and merges nothing (`fgos workflow status` lists `writeBranches`). `fgos workflow start --plan` no longer exists; a later conductor skill (`fgos-cook`) will own whole-plan execution on a case.

---

## 2. Human Review Gates & Question Batching

When a workflow step declares a human gate (`gate: { kind: "human" }`) or when an owner review is required:
1. The Workflow runner parks at the gate with outcome `parked` and records the pending question(s).
2. `fgos-run` gathers **all open questions across all parked steps** into a single structured batch; each question follows the decision-question template (`../_shared/decision-question.md`).
3. The user answers all questions in one interaction.
4. Answers are recorded via:
   ```sh
   fgos workflow answer <workflowRunId> --step <stepId> --answer "<response>"
   ```
5. The runner resumes execution automatically.

---

## 3. Execution Invariants

- **G2 Non-Infrastructure:** Units, presets, plans, and driver prompts never pin executors, providers, models, tiers, or invocations; an ad-hoc Unit (one-liner `--provider`, `prefer` in a `--units` file) may carry a soft `prefer` that `bind()` tries first and fails over from. Only a human `--override` pins; everything else is resolved by `bind()`.
- **Runner Commits, Worker Does Not:** A writing Unit's brief lists its write scope; the worker edits files and stops, never running `git add`/`git commit`. After a passing round the runner commits only paths inside the Unit's `writes` (subject from the first line of the worker's `summary`); a path the worker needs outside that scope goes in `needsWrites`, not on disk.
- **G7 Herdr Default:** All out-of-process unit runs default to spawning in a watched `herdr` terminal pane when herdr is available, falling back to `cli` when headless.
- **Fail-Closed Mutating Gate:** Every file mutation runs strictly inside an isolated linked git worktree matching the Unit run specification.
- **Honest Outcomes:** Reviewer findings are tracked as `findings`, not execution failures, and fix rounds are bounded by the collaboration pattern.

---

## 4. Reviewing a Change That Touches Tests

Every behaviour has one owning proof (AGENTS.md L5 question 5, design principle 8 **One proof**). Whoever reviews a Unit's result, or accepts a lead's report, checks these four lines and returns a finding for each one that fails; a report that adds tests without reasons, or deletes a mechanism without a retired list, is not accepted:

1. **Every new test file:** why not the existing file for this module? Only a new module or a new boundary gets a new file.
2. **Every new test:** its title names the behaviour in plain words (no task ids), the owning proof was searched for (`rg` the behaviour's words and the symbol), and the report gives the reason no existing test proves it.
3. **Every deleted or replaced mechanism:** its tests are retired in the same change and listed, each with the test that now owns the behaviour or the statement that the behaviour is gone.
4. **Every Node test in a Rust-ported area** (git, holder-lock, event-store, run-supervisor, terminal-control): it is the one route proof for its port or a Node-only behaviour, never a copy of a case a Rust test owns.

The report quotes the `suite:` line `npm test` prints (files, `test()` calls, wall time against `test/suite-baseline.json`).
