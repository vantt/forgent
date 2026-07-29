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
stage, a new role kind, a new status) is not free. The same failure shape has
recurred across multiple features: a stage value gets added to the schema/enum,
but some consumer — a settlement guard anchored to a literal `to === 'executing'`
check, a claim-reclaim routine (`startupReap`) that is blind to which role kind
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

## Two edges landing on the same status can still mean different things — a fix needs a positive marker, not an inference from the shared value

`status` answers "where in this attempt" on purpose (see above) — but that
also means two structurally different transitions can legally land an item
on the exact same status value, and code reacting to that value later has
no way to tell them apart unless something explicit says so.

A claim held through `clarify`/`decompose` (`status: doing`) is released
back to `todo` the instant the item reaches `executing`
(`releaseClaimOnExecuting`, the claim-lock §3b lifecycle: "a pick claim
held through clarify/decompose... is released back to todo the moment the
root actually reaches executing... so pick <id> can re-claim it for the
executing phase"). A rejected item (`proposed -> todo`) and a verify-fail
park also land an item at `todo` with its branch still alive — reject
"never touches/deletes the branch... the item's own commit REMAINS on
main untouched." All three are, from the outside, "status todo, branch
already exists" — indistinguishable by shape alone.

A fix that needed to treat the first case specially (preserve a
claim-time marker across the release so a later reclaim doesn't lose
credit for work already committed) was first drafted to key off "does the
item already carry that marker" — which is exactly the same shape as the
undefined-vs-undefined collision above: inferring "why is this todo" from
data that multiple different edges populate identically. Validated
against the actual retake code path, this would have silently defeated a
DIFFERENT edge's deliberate safety property — the reject/verify-fail
retake path recomputes that same marker specifically to force new,
provable work before the item can complete again; preserving it whenever
present would have let an already-rejected attempt's own old commits
satisfy that check with nothing new done.

The fix that actually holds: tag the ONE edge that needs the special
behavior with an explicit marker on its own transition event, and have
the reader check for that literal marker — never infer intent from the
status value (or from "does a related field happen to be set already")
that other, semantically different edges also produce. The same
"orthogonal dimension, not an inferred value" instinct that justified
`stage` as its own field over a new status applies one level down, at the
level of a single transition's payload.

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
dimension, not a new status value" (feature stage-clarify);
[20260729] "Two edges landing on the same status value still need a
positive marker to tell apart, never an inference from the shared status
— a naive fix based on 'is this field already set' would have defeated a
DIFFERENT edge's deliberate anti-cheat gate" (feature
claim-reclaim-branchhead-reset, `docs/history/claim-reclaim-branchhead-reset/CONTEXT.md`
D2/D3, item tsk-2zv).
