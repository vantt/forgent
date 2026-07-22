---
type: explanation
title: Why the work-item lifecycle keeps status and stage separate, and what extending it costs
tags: [work-item, fsm, lifecycle, domain-model]
timestamp: 2026-07-22T00:00:00.000Z
source_capture_ids: []
---

# Why the work-item lifecycle keeps status and stage separate, and what extending it costs

fgOS's work items move through a small set of statuses (`todo`/`doing`/`proposed`/
`done`, ...) — but not everything a workflow needs to express answers the *same*
question those statuses answer. When a domain needed to say "this item needs
human clarification before starting," the temptation was to bolt on a 7th status
value. That was rejected: "needs clarification first" doesn't answer "where in
this attempt" the way `todo`/`doing`/`done` do — it answers a different question
entirely. Folding it into the same enum would have meant new transition edges
and re-validating every consumer that already matches on status.

The shape that was kept instead: a second, orthogonal field (`stage`, with values
like `clarify`/`executing`) that never touches the status FSM's own transition
table. This mirrors a pattern fgOS had already used twice before (`tier`, `mode`)
— when a new requirement answers a different question than an existing enum,
the fix is a new dimension, not a new value squeezed into the old one.

## Extending the domain still means auditing every consumer

Even with the right shape, adding a new value to an *existing* dimension (a new
stage, a new actor kind, a new status) is not free. The same failure shape has
recurred across multiple features: a stage value gets added to the schema/enum,
but some consumer — a settlement guard anchored to a literal `to === 'executing'`
check, a claim-reclaim routine (`startupReap`) that is blind to which actor kind
now holds a claim, a counter in the reporting layer — never learns about it,
because it matches on the literal string rather than reading the shared
constant. One audit pass at the time a new value is introduced is not enough,
either: a later slice that opens a new scope (a new stage, a new consumer) has
to re-run the same audit, because "already audited" from an earlier slice does
not cover a scope that didn't exist yet.

A related trap is easy to miss even when every consumer has been enumerated
correctly: comparing a per-domain lookup result directly against a lazily
defaulted field. If a lookup like "which stage does this domain map its Clarify
step to" can itself come back `undefined` for a domain with no such mapping,
and a freshly created item's own `stage` field is *also* `undefined` by design
until something sets it, then `undefined === undefined` is `true` — two
independently-absent values collide and the item gets swept into logic meant
only for domains that really do have that mapping. The fix is to normalize the
lookup result before comparing (treat "no mapping" as its own distinct case),
never to compare two optional values to each other directly.

## Adding a precondition is a bigger regression radius than adding a value

Adding a new *value* to the domain touches relatively few places. Adding a new
*precondition* that refuses a transition that used to be legal is a different
class of change: it invalidates every existing test that exercised the
now-refused path, not just the handful of call sites a risk map happened to
cite. The only reliable way to scope this is to run the whole suite and reroute
every failure, rather than trusting a fixed, illustrative list of "breakers" —
real instances have turned up breakers in files nobody expected to be in scope
at all.

Two structural rules go with this: a new precondition needs a genuine, reachable
way to satisfy it shipped in the same slice, before the gate goes live — a gate
with no path to green bricks the whole lifecycle, and quietly auto-advancing
past it makes the gate meaningless. And the precondition has to sit *after* any
existing optimistic-concurrency (CAS) check in the same transition, not before
it — otherwise a caller with a stale expected-state can get misdiagnosed by the
new gate instead of failing with the pre-existing, correct "conflict" outcome.

---

**Source:** `docs/history/learnings/critical-patterns.md` —
[20260720] "A cell that adds an FSM precondition refusing a previously-legal
transition is scoped to EVERY existing test reaching the gated end-state — not
the gate + one new test; cited breaker lists are illustrative" (feature
compound-learn-enduser-docs, slice 1);
[20260717] "A per-domain/per-config lookup that can return `undefined` must be
normalized BEFORE `===`-comparing it to a lazy-default field that can also be
`undefined`" (feature base-workflow-model);
[20260716] "Extending an existing domain → audit EVERY consumer before code"
(feature stage-decompose, with a 4th-occurrence addendum on base-workflow-model);
[20260716] "Lifecycle concept answering a DIFFERENT question → orthogonal
dimension, not a new status value" (feature stage-clarify).
