# Shared fragment: capability catalog

Canonical dispatch-capability vocabulary for the whole repo, not just the
coding domain. Read this fragment alongside its two siblings, which
together form one shared awareness cluster (`docs/history/agent-coordination-foundation/plan.md`):

- [`planning-capability-awareness.md`](./planning-capability-awareness.md)
  — when authoring a plan, assign one canonical capability to each
  independently executable unit.
- [`executor-dispatch-fallback.md`](./executor-dispatch-fallback.md) —
  when executing a unit, ask `decide` for its capability before acting
  (`decide-before-execute`).

This file answers a narrower question both of those depend on: **what is
a valid canonical capability name, and what does each registered one
mean?**

## What a capability is

A capability is a stable behavior promise or purpose — never a task
instance, a Work item, a lifecycle stage, a skill name, or an executor
name. It is the string a caller passes to
`node src/runner/dispatch.mjs decide --for <capability>` to ask the
control plane which mechanism (`unavailable` / `in-process` /
`out-of-process`) should carry out one independently executable unit.

## Generic vs. domain-scoped identity

Two canonical shapes are valid:

- **Generic capability** — no domain prefix, used when the behavior
  promise is not specific to one domain's artifacts (e.g. `advise`,
  `execute`).
- **Domain-scoped capability** — `domain:capability`, used when the
  behavior promise only makes sense against one domain's own artifacts
  (e.g. `code:implement` — coding execution against source files).

### Choosing between them

- If the unit's output is domain-specific (source diffs, marketing copy,
  a design doc), use `domain:capability`.
- If the unit's output is domain-agnostic (a yes/no consult, a generic
  compliance-execution pass with no domain-shaped artifact), use the
  generic form.
- Never invent a third shape (no task-name-as-capability, no
  `capability@version`, no free-text purpose string). A caller that needs
  a capability not yet in this catalog reports the gap instead of
  minting one ad hoc — see "Registering a new capability" below.

## Registered catalog

| Capability | Shape | Meaning | Typical provider |
|---|---|---|---|
| `advise` | generic | Async product-decision consult — value comes from disagreement, never changes state, one question/one answer. | agent executor |
| `execute` | generic | Compliance-driven work — value comes from following a plan, changes files, must pass verify. | agent executor |
| `code:implement` | domain-scoped | Coding implementation — write/change source to satisfy a spec. | agent executor |
| `code:review` | domain-scoped | Independent review of a coding implementation unit before merge. | agent executor |
| `code:test` | domain-scoped | Author or run tests for a coding implementation unit. | agent executor |
| `code:debug` | domain-scoped | Root-cause investigation of a coding defect. | agent executor |
| `code:refactor` | domain-scoped | Behavior-preserving structural change to existing code. | agent executor |
| `impact-analysis` | generic | Code-graph blast-radius lookup (upstream/downstream callers, affected flows). | MCP/tool provider (this repo's live config maps it to `gitnexus`, `kind: "tool"`, `via: "mcp"`) |
| `pane-labeling` | generic | Write a session/task id onto a terminal pane's label for a human watching a screen. | adapter (herdr-only today) |

Every entry above is either already registered in
`src/setup/registrations.mjs`'s `DEFAULT_CAPABILITY_SLOTS` or already
live in `.fgos/config.json`'s `runner.capabilities`. Do not treat this
table as exhaustive forever, and do not treat it as a place to pre-invent
capabilities nobody has asked `decide` for yet (P2-runtime: extend only
by observed frequency).

## Capability execution guidance: not agent-only

`decide` resolves a capability to whichever provider is actually
registered for it — an agent executor (`kind: "agent"`), an MCP or other
tool provider (`kind: "tool"`, e.g. `impact-analysis` → `gitnexus` via
`invocations: [{ via: "mcp", ... }]`), or another registered adapter
(`pane-labeling`). Nothing in the resolver (`src/runner/dispatch/resolve.mjs`'s
`resolveExecutorAndOverrides`) special-cases agent-shaped executors —
resolution is the same lookup regardless of `kind`. A caller must never
assume a capability implies an Agent/Task-tool hand-off; read the
resolved `mechanism` and, when relevant, the executor's own `kind`/`via`
before deciding how to act on it.

## Catalog entries never pin provider/model/executor

A catalog entry (`DEFAULT_CAPABILITY_SLOTS`, or a live project's
`runner.capabilities`) may carry `description`/`aliases`/`prefer`/
`overrides`, but the catalog's *canonical identity* — the name itself —
never encodes a provider, model, tier, or executor. `prefer` names which
registered executor currently serves a capability in one project's live
config; it is a deployment/config concern, not part of the capability's
own identity, and a plan must never write it down (see
`planning-capability-awareness.md`).

## Ontology boundary: research is a skill, not a capability

`fgos-researching` is a skill/workflow — it turns an unresolved question
into a grounded finding. It is never itself a capability name, and no
catalog entry called `research` (or similar) should ever be registered.
When a research question genuinely needs a dispatched capability (for
example a code-graph blast-radius lookup), it asks `decide` for the
concrete capability that answers it — `impact-analysis` today; browser/web
lookups and repository search stay primitive tool calls
(`WebSearch`/`WebFetch`/`Grep`) made inline inside the research unit,
which per `executor-dispatch-fallback.md`'s activation doctrine are never
themselves independently executable units and never trigger a `decide`
call on their own.

Coordinating several research contributions across agents is a
group-thinking concern (`fgos-group-thinking`), not a reason to invent a
capability either — see that skill's own doc for the split.

## Registering a new capability

1. Confirm real, observed demand — a caller already needs `decide --for
   <name>` to resolve something, not a hypothetical future need.
2. Add the name to `DEFAULT_CAPABILITY_SLOTS` in
   `src/setup/registrations.mjs` with a one-line `description`, no
   `prefer`/`overrides` (a curated default never pins an executor).
3. Add one row to the table above.
4. Only after step 2 lands does `fgos setup`/`fgos doctor` discover the
   slot; a capability with no registered default is invisible to both.
