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
already real work items — real `rootTask`s, per the orchestrator
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
`fgos-exploring`'s own rule only ever *captures* whatever verify an item
already carries rather than designing a new one itself. The judge was
right to catch this: an item submitted with a placeholder verify will
always be blocked at this door until a real person supplies a real
verify command — that's correct behavior, not a bug in the gate. A
person supplied the real `verify` (the D10 command above) via `fgos
answer` + `fgos edit --verify`, and the second `discover` call cleared
cleanly.

## What stayed deliberately unresolved for `fgos-planning` to decide

Two implementer-level questions were named and left open rather than
guessed at during design: whether waves run strictly "wait for the whole
wave, then fire the next" (matching the existing runner's own
`Promise.allSettled` pattern) or "backfill a slot the moment one Agent
finishes" (which would need the 5-cap reinterpreted as a cap on
*in-flight* count rather than *wave size*); and the exact default tier
for leaf auto-approval within the existing `gate-bypass` levels scale.

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

Full decision record (D1-D10), the ten-round shaping discussion, and the
existing infrastructure inventory this design deliberately reused rather
than rebuilt: `docs/history/execution-fanout/CONTEXT.md` and
`DISCUSSION.md`. Related: `docs/history/fanout-and-delegation-rubric/`
(the fan-out A/B boundary), `docs/history/two-layer-dispatch/` (the
exec-packet gate this item confirmed stays shut), and
`docs/decisions/0026` (the orchestrator/rootTask definition this design
relies on directly).
