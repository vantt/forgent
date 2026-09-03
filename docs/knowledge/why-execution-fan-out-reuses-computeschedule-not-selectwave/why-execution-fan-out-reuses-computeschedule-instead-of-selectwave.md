---
framework: diataxis
mode: explanation
---
# Why execution fan-out reuses `computeSchedule`, not `selectWave`, and stays a capability, not an entry point

`tsk-umc` designed **execution fan-out** — dispatching N real, full-
lifecycle child work items concurrently after a `decompose`, instead of
today's sequential one-at-a-time queue. This is the manually-proven
mechanism from the parallel-dispatch demo family
(`docs/how-to/compute-a-parallel-dispatch-wave-schedule.md`'s "Real-world
proof" section) turned into a default, self-triggering path instead of
something a person has to spawn Agent subagents by hand to exercise.

## Two distinct fan-out shapes, deliberately kept separate

`tsk-5kn` (the `clarify`/`discovery`/`exploring` stage split) already
named **fan-out A / gather**: inside *one* item, the research skill
splits a question into independent branches and fires parallel I/O
subagents that gather digests back — no lifecycle, nothing claimed.
`tsk-umc` is **fan-out B / execution**: *after* a decompose produces N
children, N workers dispatch concurrently, each one claiming and
actually building one child — a real execution worker, with a full
lifecycle (worktree, claim, verify, merge). These are two different
dispatch layers, fixed in two different places, with no dependency
between them — they can be built in parallel.

## Why children can just be dispatched as real work items — no new lifecycle-light category needed

`two-layer-dispatch`'s own design (`tsk-2t6`) gated a lighter, ephemeral
"exec packet" category (B2) behind real evidence of need. `tsk-umc`'s D1
confirms that gate stays shut here too: a decompose's children are
already real work items — real `rootTask`s, per the launcher
definition in decision 0026 — so dispatching N of them concurrently
*is* activating N real root tasks, not something requiring a new,
cheaper identity shape. The real cost of a child isn't in the
claim/verify/merge mechanics themselves — those already exist and work —
it's in the *post-hoc policy* around a child (7-day TTL, per-leaf
approval), which is a separate, already-scoped concern.

## Reusing `computeSchedule`, explicitly not `selectWave`

The wave-selection logic already exists in two places, and fan-out
deliberately picks the one that fits: `computeSchedule`
(`src/state/graph-metrics.mjs`) packs waves purely by footprint
non-overlap — the right axis for "how many of these can run at once
without touching the same files." `selectWave` (`loop.mjs`), by
contrast, packs by *root affinity* with a `maxRoots` cap — built for the
runner's own different question ("how many separate roots should I touch
per tick"). Fan-out's own candidate set is *one root's own leaves* — the
inverse shape `selectWave`'s cap was designed to bound — so reusing it
would squeeze the wave in exactly the wrong direction. Only
`computeSchedule` sits on the right axis for this problem.

## Automated, but only for leaves — the root gate stays human, on purpose

D2 locks an asymmetry: **leaves auto-approve**, but **the root gate stays
mandatory and human**, with the existing `gate-bypass` risk-keyword
exception untouched. This isn't a weaker safety story — a leaf's
approval gate is a *duplicate* gate one level down: a leaf merges into
`fgw/<root>`, never touching `main` directly, and its own `return` step
already ran verify before that merge happens. The root gate is the one
that actually protects `main`, and it keeps requiring a person exactly
as it does today.

## Two topologies for "children," resolved by reusing what already exists

D4 separates two real shapes children can take, both already supported
by existing mechanisms rather than needing new ones:

- **Case 1** — children split to run in parallel, but the *final* merge
  unit is still the parent (`fgw/<root>`) — already today's behavior.
- **Case 2** — children grow into independent, epic-linked items that
  merge *separately* onto `main` — handled by the existing `goalTier` +
  `targets` mechanism, since `targets` deliberately never routes through
  `resolveRoot`, so each target keeps its own independent root and
  merges on its own.

## Who claims, and why the parent never claims on a child's behalf

D5 locks the claim protocol: **the parent pre-filters, the child claims
itself, the parent merges.** The parent uses existing pure functions
(`frontier`, `isResolvedStatus`) to avoid firing a dispatch at a child
that structurally can't be claimed — but that pre-check is only
*advisory*. The real authority is `claimWork` itself, invoked by each
child running `/fgOS:pick <id>` **unmodified** — no special "I was
fanned out" code path for a child to go through. This mirrors bee's own
"workers never self-select" discipline from one angle (the parent
decides *who* is a candidate) while keeping fgOS's own claim door as the
single real authority (the parent's filtering can be wrong and it costs
nothing — the child's own claim is what actually matters).

## How results get collected: read state, don't trust a report

D6: the parent gathers results by **reading real state and ranking
through the existing `merge` verb**, not through any new self-reported
completion protocol. The reasoning: an Agent's own return-to-caller
message is not the thing worth trusting — the state a child actually
wrote (via the same claim/verify/merge doors every item goes through) is
more reliable than any transcript the child could hand back, so the
collection step reads that instead of inventing a report format.

## A concurrency cap, and why it isn't the runner's own cap

D7 sets a hard cap: fan-out never fires more than **5** concurrent
Agents at once, even when more candidates are footprint-clear and ready.
This is deliberately a *different* number from the runner's own
`DEFAULT_MAX_LEAVES_PER_ROOT = 4` — that cap bounds a different thing
(the automated runner's own per-tick root touches); 5 is the interactive
path's own number, chosen independently rather than borrowed.

## Fan-out is a capability, never a new entry point

D8 is the design's central restraint: **no new `/fgOS:fanout` command.**
The single integration point is the existing place
`fgos-coding-driving` already stops and reports back an
anchored-by-open-children list — not something wired specially into
`/fgOS:cook` alone. Confirmed by scouting the caller table: `/fgOS:cook`,
`/fgOS:pick`, and three separate sweep skills all already receive the
same anchor report from that one shared stopping point, so hooking fan-
out in there covers every current *and future* caller automatically,
rather than requiring each of the repo's many `-loop`/`-next` skill
wrappers to be updated individually.

## A blocked sibling never cancels independent siblings

D9: if one leaf is `blocked`, its independent siblings still run to
completion — only a sibling that genuinely *depends* on the blocked one
is held back, and nothing in-flight gets cancelled. This needed no new
logic at all: the existing `deps-not-merged` claim guard already
enforces it mechanically — a blocked item never reaches `done`, so
anything depending on it structurally can never be claimed regardless of
what fan-out does, closing the case for free.

## Verify proves real overlap, not just that a skill file exists

D10's verify command doesn't just check that a fan-out skill exists — it
asserts a parent that decomposed into ≥2 footprint-disjoint children
produces ≥2 `work.move → doing` events from the *same run*, with
genuinely **overlapping** `doing` time windows, both children reaching
`awaiting-approval`, and zero human-question stops outside the root gate
itself. This proves the thing that actually matters — real concurrent
execution — rather than merely proving the mechanism was invoked.

## A real friction hit at the `clarify → decompose` door

The first `fgos discover` call on this item was genuinely rejected: the
first pass came back clear, but `judgeVerifySemanticCorrectness`
disagreed — the item had been submitted with a placeholder `verify`
string ("chưa xác định — P15 bổ sung"), not a real shell command, and
`fgos-coding-exploring`'s own rule only ever *captures* whatever verify an item
already carries rather than designing a new one itself. The judge was
right to catch this: an item submitted with a placeholder verify will
always be blocked at this door until a real person supplies a real
verify command — that's correct behavior, not a bug in the gate. A
person supplied the real `verify` (the D10 command above) via `fgos
answer` + `fgos edit --verify`, and the second `discover` call cleared
cleanly.

## What stayed deliberately unresolved for `fgos-coding-planning` to decide

Two implementer-level questions were named and left open rather than
guessed at during design: whether waves run strictly "wait for the whole
wave, then fire the next" (matching the existing runner's own
`Promise.allSettled` pattern) or "backfill a slot the moment one Agent
finishes" (which would need the 5-cap reinterpreted as a cap on
*in-flight* count rather than *wave size*); and the exact default tier
for leaf auto-approval within the existing `gate-bypass` levels scale.

## Follow-up finding (`tsk-4so`): the advisory verbs were already blind to any item not at `executing`

A bug found live while validating this very item family, not filed for
a new feature: `ready`, `conflicts`, and `computeSchedule` underneath
them were only ever looking at the `Execute` frontier, regardless of
what stage an item was actually at.

Three real symptoms confirmed on 2026-08-07: **(1)** the `ready` verb
calls `readyWork(dir)` without passing `step` at all — `fgos ready
--step Divide`, `--step Clarify`, and no flag at all all returned the
*same* 6-item set, silently swallowing the flag even though `frontier`
had already supported per-step filtering since `tsk-19j` D9. **(2)**
`footprintOverlap(view)` is defined as `footprintOverlapAmong
(frontier(view))` — the `conflicts` verb reported **0** overlapping
pairs at a moment when `tsk-4fg`, `tsk-59x`, and `tsk-1ug` (three items
from this very fan-out companion-fix family, all documented above) all
touched `bin/fgos.mjs`, two of them also touching
`test/cli/fgos.test.mjs` — a real overlap, reported by no tool at all.
**(3)** the direct, concrete consequence: three of fan-out's own children
(`tsk-ik3`, `tsk-1q2`, `tsk-66d`) sitting at stage `decompose` were
**invisible** to `fgos ready` — a person scanning the frontier the normal
way would never see them; only looking them up directly by id, or
running `fgos rollup tsk-umc`/`fgos list`, would surface them.

This is the "MISS a user would worry about" class of bug — a real
capability quietly not doing its job, discovered by working the same
feature family it happened to affect, not a coincidence: the fan-out
companion items above were exactly the kind of pre-`executing`-stage
churn that made the blind spot observable. Confirmed explicitly *not*
affecting fan-out's own real dispatch mechanism, though — fan-out's own
children are generated straight at stage `executing`
(`decompose.mjs:1008`), so the actual fan-out dispatch path never
touches this blind spot; only advisory tooling looking at earlier-stage
items (`clarify`/`decompose`) was affected.

## Implementation (`tsk-66d`): wiring fan-out into the shared anchor-report contract, not a new command

The final integration piece implemented D8's "capability, not entry
point" design decision directly: the contract for what a caller must do
with an `anchored-by-open-children` report lives in exactly one place —
`fgos-coding-driving`'s own `SKILL.md` — and `/fgOS:cook` was made the
first concrete caller to actually act on it, replacing what had been a
quick fix of pushing each child id onto the front of a sequential queue.

**This item's own highest-named risk**: `fgos-coding-driving`'s caller
table lists **five** callers that all read this same contract —
`/fgOS:cook`, `/fgOS:pick`, and three sweep skills (clarify/planning/
execution). The item required listing all five explicitly and stating,
for each one, whether its behavior changed or not — not just fixing
`/fgOS:cook` and assuming the rest were fine by omission. Four of the
five inherit the contract but were deliberately **not** modified in this
item; if `fgos-coding-validating`'s own reality check judged that an oversight
rather than a real scope boundary, the item's own scope would have had
to widen — flagged explicitly as an open question in its plan rather
than silently decided either way.

`scripts/verify-fanout-overlap.mjs` — the script D10's own verify
command depends on, proving real time-overlapping `doing` windows from
`.fgos/events.jsonl` — was placed in this same item specifically because
only once fan-out is actually wired into a real caller does genuine
overlap exist to measure; the script couldn't have been meaningfully
written any earlier in the sequence.

## Implementation (`tsk-ik3`): `computeSchedule` gains an explicit candidate-set parameter

The design above already named a "candidate set" the wave selector
draws from — case 1 uses `children(parent)`, case 2 uses a milestone's
`targets`, the runner uses the whole frontier: one selector function,
three different input sets. `tsk-ik3` implemented that parameter
directly on `computeSchedule` itself, rather than adding a second
function or a wrapper.

**Backward compatibility was locked as a hard requirement, not a nice-
to-have**: a call with no candidate set supplied must keep behaving
exactly as it does today — packing waves over the *entire* frontier.
This isn't a temporary compatibility shim to be removed later; it's the
genuinely correct default for both case 2 and the runner's own existing
usage, which never pass a narrowed candidate set at all.

This item is also where "reuse `computeSchedule`, not `selectWave`"
(explained above) got its concrete caller-scoping proof: with
`impact-analysis` sitting in a **degraded** posture at the time (GitNexus
present but its index behind current `HEAD`), the item's own scout
step didn't trust GitNexus alone — it cross-checked with a real repo-wide
`grep`/`rg` to find `computeSchedule`'s actual known caller
(`src/state/store.mjs:1100`), following this repo's own gate rule that a
degraded impact-analysis posture requires a grep-based cross-check
before its answers are trusted.

## Companion fix (`tsk-4fg`, D3): `fgos list` needed a view lever, not a model change

Fan-out amplifies a real UX gap that already existed before it: real
usage measured on `.fgos` (2026-08-07) showed `fgos list`'s default view
rendering 237 rows, of which 59 (25%) were children showing up as flat
individual rows, and 153 rows (65%) were purely a post-merge cleanup-TTL
queue with no distinguishing signal — `fgos list` only ever had two
modes (default, which hides `done`/`wontfix`, and `--all`, which hides
nothing), no filter by status, no grouping of children under their
parent, and no way to collapse the TTL queue at all.

This is explicitly a **view** gap, not a model gap: it doesn't touch D4
of `two-layer-dispatch` or decision 0026 — nothing about what a child
*is* changes, only how the list surface renders it. Fan-out makes the
gap materially worse, though, not just theoretically worse: once a
decompose that splits well routinely produces N children running
concurrently, N grows sharply, and every one of them would otherwise add
its own flat row to the default view. This is why this fix was locked to
merge before or alongside `tsk-umc` itself, rather than as an
independent, unordered cleanup.

**The fix**: collapse children out of the flat list, replacing them with
a progress indicator on the parent's own row (e.g. `tsk-38t 3/8`) —
reusing the same counting `fgos rollup` already computes, just surfaced
one layer up into the list view itself, rather than inventing a new
computation. The explicit constraint that made this safe: removing
children from the flat list *must* be paired with that parent-row
indicator, or the ability to see cluster progress at a glance is lost
entirely, not just moved.

## Second companion fix (`tsk-59x`): leaf `cleanup` TTL should be short/zero, not the same 7 days as a root

Today's `cleanup`-stage TTL (`DEFAULT_CLEANUP_TTL_DAYS = 7`) is global
config for every item, per an explicit prior decision (D7 of
`docs/history/work-item-status-delivered-retrospective-cleanup/`) — that
decision's own comment names the reasoning plainly: "the cleanup-stage
TTL is global config, not per-item/per-domain (YAGNI — no demonstrated
need yet)."

Fan-out demonstrates the need that decision was waiting for. Measured
against real `.fgos` data (2026-08-07): children already made up 25% of
the open list before fan-out even shipped; 0 of 99 items in the cleanup
pool had cleared their TTL, meaning nothing could be pruned yet and 0
worktrees had been reclaimed — roughly 2GB held **structurally** for the
full 7 days regardless of whether any of it was still needed. The real
cost of one leaf sitting in that queue: 5-6 status transitions, a median
of 2 human-role touches, a full 7-day cleanup residency, and a ~20MB
worktree — multiplied by N, with N about to grow sharply once fan-out is
actually dispatching multiple children concurrently.

**The topology argument for why a leaf's TTL can safely be much
shorter**: a leaf's own branch becomes redundant the moment it merges
into `fgw/<root>` — its content now lives on a branch that will
necessarily outlive it (the root, not yet merged to `main`). Deleting the
leaf's branch early loses nothing real; deleting the *root's* branch
early is what would actually lose something. This is the same
underlying reasoning `docs/explanation/why-checkmergestillresolves-can-
false-positive-after-a-root-branch-prune.md` documents from the opposite
angle — a root branch pruned too early is the dangerous direction,
never a leaf.

This item's own description carried an explicit prerequisite before
touching the code: **read the original TTL decision record first** — the
real evidence justifying a shorter leaf TTL now doesn't mean skipping
understanding why the global 7-day default existed in the first place.

## Third companion fix (`tsk-1ug`): `fgos rollup` learns to read `targets`, not just `parent`

The last remaining gap for D4's case 2 (an epic-shaped cluster using
`goalTier` milestone + `targets`, each target merging independently onto
`main`): `fgos rollup` only ever filtered by `w.parent === id`, so a
cluster organized via `targets` had no progress view at all —
`rollup`'s own accounting never looked at that field.

The fix confirmed something already true architecturally rather than
requiring a new one: `targets` (from `str67-goal-directed-planning` D2)
is defined as "the set of items this item considers part of it," and
deliberately never routes through `resolveRoot` the way `parent` does —
each target keeps its own independent root and merges on its own onto
`main`. The separation between *lineage* (who considers what part of
what) and *merge topology* (which branch actually merges where) already
existed as this second edge type — nothing about decision 0012's typed-
edge model needed to change. The only real gap was that `rollup` simply
never read the second edge at all.

Fixed by having `rollup` also read and report on `targets`, alongside
its existing `parent`-based accounting — giving case-2 clusters the same
progress visibility case-1 (decomposed, `parent`-linked) clusters already
had. `docs/how-to/close-out-a-goaltier-milestone-after-all-targets-are-
done.md` already documented the reader-facing side of this exact
capability (its own "Watch out for" section on reading
`targetDoneCount`/`targetTotalCount` separately from the children-based
`doneCount`/`totalCount` pair) — this item is the implementation behind
that documented behavior.

Full decision record (D1-D10), the ten-round shaping discussion, and the
existing infrastructure inventory this design deliberately reused rather
than rebuilt: `docs/history/execution-fanout/CONTEXT.md` and
`DISCUSSION.md`. Related: `docs/history/fanout-and-delegation-rubric/`
(the fan-out A/B boundary), `docs/history/two-layer-dispatch/` (the
exec-packet gate this item confirmed stays shut), and
`docs/decisions/0026` (the launcher/rootTask definition this design
relies on directly).
