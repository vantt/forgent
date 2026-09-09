---
name: fgos-capability-dispatching
user-invocable: false
description: >-
  Awareness guidance for selecting canonical dispatch capabilities (e.g. code:implement) and asking decide-before-execute control plane decisions before implementing, changing, or building code, before code edits begin, whether or not an fgOS work item exists. Not for review-only, explanation-only, or read-only diagnosis requests.
---

# fgos-capability-dispatching

Teaches agents to use capability-aware dispatch activation across fgOS tasks.

This skill is the coding-domain activation gate; the vocabulary and doctrine
it applies are shared, not owned here. Full catalog:
[`../_shared/capability-catalog.md`](../_shared/capability-catalog.md).
Planning-time counterpart (assign a capability while decomposing a plan,
before any execution): [`../_shared/planning-capability-awareness.md`](../_shared/planning-capability-awareness.md).

## Capability grammar & catalog

A capability is a stable behavior promise or purpose used to query dispatch via `node src/runner/dispatch.mjs decide --for <PURPOSE>`.

Capabilities use either canonical generic identity (`advise`, `execute`) or canonical domain-scoped identity (`domain:capability`, e.g. `code:implement`).

- `code:implement` — Canonical coding implementation capability for executing code implementation units.
- `code:review` — Independent review of a coding implementation unit before merge.
- `code:test` — Author or run tests for a coding implementation unit.
- `code:debug` — Root-cause investigation of a coding defect.
- `code:refactor` — Behavior-preserving structural change to existing code.
- `advise` — Async product-decision consult.
- `execute` — Compliance-driven execution work.

Do not invent or infer unregistered capability names. A capability resolves
to whichever provider is actually registered for it — an agent executor,
or an MCP/tool provider such as `impact-analysis` → `gitnexus` — never
assume an agent-shaped hand-off (`capability-catalog.md`'s "Capability
execution guidance").

## Decide before execute

Before executing any independently executable unit, an agent MUST query dispatch using `node src/runner/dispatch.mjs decide --for <PURPOSE> [--has-live-task-access]`:

- If `decide` returns `mechanism: "unavailable"`, execute the unit inline in the current session.
- If `decide` returns `mechanism: "in-process"` or `"out-of-process"`, hand off or execute through the returned control plane instructions.

One independently executable unit triggers exactly one `decide --for <canonical-capability>` call. Primitive tools (`Read`, `Grep`, `Bash`, `WebSearch`) used directly inside an inline execution unit do NOT trigger recursive `decide` calls.
