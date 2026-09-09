# Shared fragment: planning capability awareness

Global planning-awareness prose, kept beside its dispatch counterpart
[`executor-dispatch-fallback.md`](./executor-dispatch-fallback.md) as one
coherent shared instruction cluster
(`docs/history/agent-coordination-foundation/plan.md`), not hidden inside
one domain's own planner. Both fragments share the same vocabulary,
defined in [`capability-catalog.md`](./capability-catalog.md).

```text
planning awareness (this fragment):
  identify the canonical capability for each independent execution unit

dispatch awareness (executor-dispatch-fallback.md):
  decide-before-execute for that capability immediately before execution
```

Any domain planner — coding or otherwise — specializes this shared
cluster; it does not redefine its routing doctrine. A stranger agent
should be able to read this fragment plus the catalog and know what to
write into a plan, without first loading a coding-domain skill.

## The rule

When a plan decomposes into independently executable units:

```text
decompose a plan into execution units
→ assign one canonical capability to each independent unit
  (pick from capability-catalog.md; generic or domain:capability)
→ use capability boundaries as a decomposition signal
  (units needing different capabilities are a hint to split;
  this is a signal, not a forced splitting rule)
→ leave executor/provider/model/tier selection to execution time
  (that is `decide`'s job, at the moment the unit is actually run —
  see executor-dispatch-fallback.md)
```

An **execution unit** is a piece of work with a clear enough
objective/boundary/output to be carried out inline or handed to an
executor. It is not automatically a Work item, a lifecycle stage, or a
flow step — capability annotation is a planning-time signal, never a
Work-schema field, and never itself a reason to create, split, or
transition a Work item.

## What a plan writes down

- Exactly one canonical capability per independently executable unit,
  spelled exactly as it appears in `capability-catalog.md` (no invented
  names, no paraphrase).
- Nothing about which provider, model, tier, or executor will carry it
  out. `prefer`/executor selection is a live-config/execution-time
  concern (`resolveExecutorAndOverrides`, `decide`), never a plan
  artifact — a plan that pins an executor has leaked an execution-time
  decision into a planning-time document.
- A unit whose capability is not yet registered gets flagged as
  unresolved rather than assigned a guessed name — see
  `capability-catalog.md`'s "Registering a new capability" section.

## What a plan does not do

- It does not decide `unavailable` / `in-process` / `out-of-process` —
  that is `decide`'s job, asked immediately before the unit executes
  (`decide-before-execute`, in `executor-dispatch-fallback.md`). Calling
  `decide` twice for the same unit — once while planning, again right
  before execution — is not this doctrine; `decide-before-dispatch` is
  legacy terminology for an already-superseded activation point, not a
  second gate alongside `decide-before-execute`.
- It does not turn "needs its own capability" into "must become its own
  Work item, phase, or child." Splitting stays a judgment call; a
  capability boundary is evidence for that judgment, not a rule that
  mechanically forces it.
- It does not assume every capability resolves to an agent-shaped
  executor — some resolve to an MCP/tool provider or another adapter
  (`capability-catalog.md`'s "Capability execution guidance" section).

## Example

A plan with two independently executable units — implement a fix, then
have it reviewed — writes:

```text
- unit: apply the fix to src/foo.mjs
  capability: code:implement
- unit: independent review of the fix
  capability: code:review
```

Neither line names a provider, model, or executor. At execution time,
whichever session picks up each unit runs
`node src/runner/dispatch.mjs decide --for code:implement`
(respectively `code:review`) and acts on whatever mechanism comes back.

## Static harness (P3)

A read-only lint against this exact convention exists at
`src/report/capability-plan-lint.mjs`
(`lintPlanCapabilityAnnotations(text, registeredCapabilities)`): given a
plan's text, it checks that every `- unit:`/`capability:` block names one
syntactically valid, registered (or explicitly `unresolved`) capability
and pins no `executor`/`provider`/`model`/`tier`. It reads text and
returns findings — it writes nothing, and nothing calls it automatically
yet (no execution-boundary guard exists; P3 gates that on real, observed
dogfood non-compliance, not on this fragment's own say-so). Point a plan
that adopts this literal convention at it directly.

## For domain planners

The coding planner (`fgos-coding-planning`) is one specialization of this
shared cluster: it maps coding implementation units to `code:implement`
(and, where a unit is independently reviewable/testable, to `code:review`/
`code:test`). Any other domain's planning surface — including a
Work-independent, plan-driven track resumed through `fgos-plan-loop`, or
a future non-coding domain planner — reads this same fragment and the
same catalog; neither this fragment nor the catalog is coding-specific.
