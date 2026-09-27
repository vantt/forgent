---
name: fgos-capability-dispatching
user-invocable: false
description: >-
  Awareness guidance for selecting canonical dispatch capabilities (e.g. code:implement) after declared DemandFacts indicate mutates: true in domain: code, and calling decide-before-execute once per unit to let the control plane resolve whether to delegate or execute inline (default unavailable). Not for read-only diagnosis, explanation, or keyword-based triggering.
---

# fgos-capability-dispatching

Teaches agents to use capability-aware dispatch activation across fgOS tasks.

This skill is the coding-domain activation gate; the vocabulary and doctrine
it applies are shared, not owned here. Full catalog:
[`../_shared/capability-catalog.md`](../_shared/capability-catalog.md).
Demand-side steering and matching rules:
[`../_shared/capability-matching.md`](../_shared/capability-matching.md).
Planning-time counterpart (assign a capability while decomposing a plan,
before any execution): [`../_shared/planning-capability-awareness.md`](../_shared/planning-capability-awareness.md).

## Capability grammar & catalog

A capability is a stable behavior promise or purpose used to query dispatch via `node src/runner/dispatch.mjs decide --for <PURPOSE>`.

Capabilities use either canonical generic identity (`advise`, `execute`, `review`) or canonical domain-scoped identity (`domain:capability`, e.g. `code:implement`).

- `code:implement` — Canonical coding implementation capability for executing code implementation units (`serves`: change, code, mutates).
- `code:review` — Independent review of a coding implementation unit before merge (`serves`: finding, code, mutates: false).
- `code:test` — Author or run tests for a coding implementation unit (`serves`: verification, code).
- `code:debug` — Root-cause investigation of a coding defect (`serves`: finding, code).
- `code:refactor` — Behavior-preserving structural change to existing code (`serves`: change, code, mutates, behaviorPreserving).
- `advise` — Async product-decision consult (`serves`: decision, mutates: false).
- `execute` — Compliance-driven execution work (`serves`: change, mutates).
- `review` — Independent read-only review of non-code artifacts (`serves`: finding, mutates: false).

Do not invent or infer unregistered capability names. A capability resolves
to whichever provider is actually registered for it — an agent executor,
or an MCP/tool provider such as `impact-analysis` → `gitnexus` — never
assume an agent-shaped hand-off (`capability-catalog.md`'s "Capability
execution guidance").

## Default inline and decide before execute

Execution defaults to running inline within the current session: when no executor is configured for a capability, `decide` returns `mechanism: unavailable` and the unit runs inline.

When declared `DemandFacts` specify `mutates: true` within `domain: code` (e.g. `code:implement` or `code:refactor`), query dispatch before executing using `node src/runner/dispatch.mjs decide --for <PURPOSE> [--has-live-task-access]`:

- If `decide` returns `mechanism: "unavailable"`, execute the unit inline in the current session.
- If `decide` returns `mechanism: "in-process"` or `"out-of-process"`, hand off or execute through the returned control plane instructions.

Never decide the mechanism yourself (`AGENTS.md`). Five valid reasons justify configuring an executor for a capability in project configuration (cheaper model, stronger model by rigor, different provider, confinement/isolation, or parallel execution). One independently executable unit triggers at most one `decide --for <canonical-capability>` call. Primitive tools (`Read`, `Grep`, `Bash`, `WebSearch`) used directly inside an inline execution unit do NOT trigger recursive `decide` calls.
