# Shared fragment: capability matching

Demand-side matching doctrine for the fgOS capability system. This fragment
forms the steering half of a four-fragment awareness cluster
(`docs/history/agent-coordination-foundation/plan.md`):

- [`capability-catalog.md`](./capability-catalog.md) — catalog of canonical capabilities, promises, and `serves` attributes.
- [`capability-matching.md`](./capability-matching.md) (this fragment) — derives `DemandFacts` and matches against `serves` to steer capability and execution form.
- [`planning-capability-awareness.md`](./planning-capability-awareness.md) — decomposes plans into units without pinning infrastructure.
- [`executor-dispatch-fallback.md`](./executor-dispatch-fallback.md) — executes `decide-before-execute` and handles dispatch.

## Three questions in order: Q0 / Q1 / Q2

Every task prompt passes through three sequential questions. An agent must never invert this sequence by asking Q2 before Q0 or Q1:

| Step | Question | Essence | Doctrine |
|---|---|---|---|
| **Q0** | Need dispatch, or execute inline? | Activation | **Default inline.** An unconfigured capability returns `mechanism: unavailable` from `decide` and executes inline. Five valid reasons justify configuring an executor. |
| **Q1** | What kind of work is this? | Steering | Agent reads intent, declares `DemandFacts`, and matches against catalog `serves` to select canonical capability and execution form. |
| **Q2** | Which executor, tier, or persona? | Binding | Evaluated via `fgos dispatch decide --for <capability>` immediately before execution. The control plane directs execution; matching never resolves infrastructure. |

## DemandFacts: declaring demand

Machines do not parse ambiguous prose to guess capabilities. The agent inspects user intent and declares eight structured `DemandFacts`:

1. `outputKind` (open string) — Artifact kind promised: `change`, `verification`, `finding`, `decision`.
2. `domain` (open string) — Subject domain: `code`, `docs`, `config`, etc., or empty for domain-neutral work.
3. `mutates` (boolean) — Whether execution modifies files or persistent project state.
4. `behaviorPreserving` (boolean, optional) — Whether code changes preserve existing behavior (distinguishes refactor from implementation).
5. `needsIndependentReview` (boolean) — Whether independent adversarial review or multi-role quorum is required (determines protocol form).
6. `hasPlanOrTrack` (boolean) — Whether execution targets an authored plan or named implementation track (determines plan mode).
7. `size` (`TIERS`: `light` / `standard` / `heavy`, per `src/state/work.mjs:161`) — Work granularity. Judges execution shape and decomposition — never pins model or provider.
8. `rigor` (`RIGOR_VALUES`: `low` / `standard` / `high` / `critical`, per `src/runner/rigor.mjs`) — Evaluation rigor. Pass-through metadata for Q2 binding; not used for Q1 capability steering.

## Matching rules: serves-based, not keyword spotting

Matching evaluates declared `DemandFacts` against the `serves` attributes declared by catalog entries in `capability-catalog.md`:

- **Attribute satisfaction:** A capability matches if every attribute specified in its `serves` definition is satisfied by the declared `DemandFacts`.
- **Wildcard matching:** An attribute not declared in a capability's `serves` definition matches any value.
- **Specificity wins:** When multiple capabilities match, the capability satisfying the greatest number of specific attributes is selected.
- **Ties and misses:** If no capability matches, or if competing capabilities tie on specificity, matching yields `capability: null` with `form: inline`. The event is logged as a miss along with eligible candidates, and execution proceeds inline.
- **Meaning over keywords:** Capability matching is strictly about what the unit serves and requires, never keyword spotting on words like "implement", "fix", or "review" in the prompt.
- **Agent overrides:** An agent may override a matched capability if domain context warrants it, provided an explicit reason is recorded. Overrides are logged (`source: override`).

## Default inline and the five dispatch reasons

Executing inline within the current session is the platform default: when no executor is configured for a capability, `decide` answers `unavailable` and the unit executes inline in the live session.

Five valid reasons justify configuring an executor for a capability in project configuration (or passing an ad-hoc refinement):

1. **Cheaper model:** A lightweight tier is sufficient for a well-bounded, routine task.
2. **Stronger model:** The unit's required `rigor` exceeds the current session's model capability (governed by `rigor`, never by `size`).
3. **Different provider:** Provider diversity, credential isolation, or quota management mandates another engine (e.g. Gemini, OpenAI, Claude).
4. **Confinement & isolation:** Hard filesystem sandboxing, read-only guarantees, or clean worktree isolation is required.
5. **Parallel execution:** Running independent units concurrently to shorten wall-clock time (Ship Faster, priority #1 in `AGENTS.md`).

An agent never decides the mechanism itself (`AGENTS.md`): it derives the canonical capability from declared `DemandFacts` and queries `decide --for <capability>` once before execution. When `decide` returns `unavailable`, the unit executes inline.

## Promotion triggers for new domain capabilities

Capabilities represent durable behavior promises, not file-extension silos. General prose, documentation updates, and compliance tasks are served by generic `execute`.

A new domain capability (e.g. `docs:write`) is promoted to the canonical catalog only upon empirical trigger:

1. Repeated agent overrides away from `execute` in execution logs demonstrate a recurring distinct behavior promise; OR
2. A project registers a dedicated executor serving exclusively that domain.

## Architectural boundaries

- **Unit vs. Protocol:** A capability selects an executor or tool for one independent execution unit. A coordination protocol coordinates multi-actor, multi-step collaboration across units.
- **No infrastructure pinning in plans:** Plans declare canonical capability names only. Never pin an executor, provider, model, or tier in a plan.
- **No double decide:** `decide` is called once per unit immediately before execution (`decide-before-execute`), never during planning and execution.
- **No Work entity conversion:** A capability is a routing signal, never a Work item, lifecycle stage, or flow step.
