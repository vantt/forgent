# Shared fragment: capability matching

Intent and execution doctrine for the fgOS capability system. This fragment
forms the steering half of an awareness cluster:

- [`capability-catalog.md`](./capability-catalog.md) — catalog of canonical capabilities and promises.
- [`capability-matching.md`](./capability-matching.md) (this fragment) — understands intent, writes Units, and invokes Workflow runner / `fgos-run`.
- [`planning-capability-awareness.md`](./planning-capability-awareness.md) — decomposes plans into units without pinning infrastructure.
- [`executor-dispatch-fallback.md`](./executor-dispatch-fallback.md) — executes `decide-before-execute` and handles dispatch.

## Three questions in order: Q0 / Q1 / Q2

Every task prompt passes through three sequential questions. An agent must never invert this sequence by asking Q2 before Q0 or Q1:

| Step | Question | Essence | Doctrine |
|---|---|---|---|
| **Q0** | Need dispatch, or execute inline? | Activation | **Default inline.** An unconfigured capability returns `mechanism: unavailable` from `decide` and executes inline. Five valid reasons justify configuring an executor. |
| **Q1** | What kind of work is this? | Steering | Agent reads intent, determines required task capability (`domain:verb` or canonical generic), writes Unit blocks, and routes to `fgos-run` or Workflow runner. |
| **Q2** | Which executor, tier, or persona? | Binding | Evaluated via `fgos dispatch decide --for <capability>` immediately before execution. The control plane directs execution; capability selection never resolves infrastructure. |

## Understanding intent and writing Units

Instead of declaring ambiguous runtime heuristics, an agent inspects user intent and structural task requirements directly. When structuring work into plans or executable tracks, the agent expresses work as concrete execution Units (`src/runner/execution/unit.mjs`):

- **Canonical Capability:** Each unit declares exactly one canonical capability (e.g. `code:implement`, `code:review`, `advise`, `execute`) derived directly from the task's required behavior.
- **Unit Boundaries:** A unit defines clear `objective`, inputs (`reads`), outputs (`writes`), and acceptance criteria.
- **G2 Constraint (No Infrastructure Pinning):** Units and plans must never pin infrastructure (`executor`, `provider`, `model`, `tier`, `invocation`, `prefer`, `overrides`). Infrastructure binding is exclusively resolved at execution time via Dispatch.
- **Invoking Runner:** Execution is driven through `fgos-run` and the Workflow runner, running each declared unit through its lifecycle.

## Default inline and the five dispatch reasons

Executing inline within the current session is the platform default: when no executor is configured for a capability, `decide` answers `unavailable` and the unit executes inline in the live session.

Five valid reasons justify configuring an executor for a capability in project configuration (or passing an ad-hoc refinement):

1. **Cheaper model:** A lightweight tier is sufficient for a well-bounded, routine task.
2. **Stronger model:** The unit's required rigor exceeds the current session's model capability.
3. **Different provider:** Provider diversity, credential isolation, or quota management mandates another engine (e.g. Gemini, OpenAI, Claude).
4. **Confinement & isolation:** Hard filesystem sandboxing, read-only guarantees, or clean worktree isolation is required.
5. **Parallel execution:** Running independent units concurrently to shorten wall-clock time (Ship Faster, priority #1 in `AGENTS.md`).

An agent never decides the mechanism itself (`AGENTS.md`): it queries `decide --for <capability>` once before execution. When `decide` returns `unavailable`, the unit executes inline.

## Architectural boundaries

- **Unit vs. Workflow:** A capability selects an executor or tool for one independent execution unit. A Workflow (or CollaborationPattern) coordinates multi-actor, multi-step collaboration across units.
- **No infrastructure pinning in plans:** Plans declare canonical capability names only. Never pin an executor, provider, model, or tier in a plan.
- **No double decide:** `decide` is called once per unit immediately before execution (`decide-before-execute`), never during planning and execution.
- **No Work entity conversion:** A capability is a routing signal, never a Work item, lifecycle stage, or flow step.
