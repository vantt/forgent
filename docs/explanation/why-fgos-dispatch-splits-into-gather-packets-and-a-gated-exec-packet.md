# Why fgOS dispatch splits into gather packets, with a second exec-packet shape kept gated

`tsk-2t6` designed a second, lighter way to split work in fgOS. Until
this design, fgOS had exactly one way to split work: every piece became
a full work item — stage FSM, pull door (`/fgOS:pick`), status pool,
retrospective, cleanup. That's the right shape for real, independently
claimable work. It is the wrong shape for a note that just needs to
carry a clear, self-contained instruction down to an agent or process,
get a result back, and disappear — never becoming its own administrative
task.

## The axis that decides everything: does the dispatched work write a file?

Two candidate shapes were compared, distinguished by exactly one
question:

- **Gather packet (B1)** — read/synthesize only. No file writes, no id,
  no state. Returns a digest. Fits `discover`'s scout work and
  `validating`'s reality-check — work that only needs to come back with
  an answer, never with a commit.
- **Exec packet (B2)** — the child actually **writes code**, so it still
  needs an id to reserve/attest/commit/merge back into the parent
  branch. But that id would be ephemeral and scoped to the parent: no
  stage FSM, no pull door, no status pool, no retro/cleanup — it dies
  when the parent is done.

This mirrors a real precedent from bee (the upstream framework fgOS has
studied before): bee already separates two dispatch tiers — `AGENTS.md`
rule 12 fans out gathering work as I/O workers that return digests, while
its `bee-swarming` CLI-gather path explicitly has "no reservation, no
cap, no result.json — stdout IS the digest." bee's own `cell` concept
(an ephemeral, feature-scoped unit) is deliberately *not* the same thing
as its backlog item — two separate books: `.bee/cells/` (ephemeral,
pruned when the feature closes) versus `.bee/backlog.jsonl` (real PBI
events). The boundary bee draws is the same one this design adopts:
dispatched work that writes a file or mutates git needs an identity to
claim/reserve/cap/commit/merge against; dispatched work that only reads
and reports back needs none of that machinery at all.

## Why B2 (the file-writing shape) stays gated, not shipped

This is the single most consequential decision in the set (D4): B2 is
real, useful, and designed in detail — but it stays gated. No third
category is introduced between a full work item (`rootTask`) and an
existing dispatch `executor` until two specific conditions both hold:
`tsk-3xd` (a real prerequisite fix to how children carry directive
prose) had to land first, and there had to be at least two real,
observed cases of a parent genuinely needing a child to write a file too
small to justify its own full work item.

The first condition was satisfied on 2026-08-06. The second is
deliberately evidence-gated rather than assumed — B2 is a real
architectural addition (a new identity shape, a new lifecycle-free
category) and the design explicitly refuses to ship it speculatively.
Building the mechanism before real cases demand it would be exactly the
kind of premature abstraction this repo's own YAGNI stance warns
against — a plausible-sounding capability nobody has actually needed
twice yet.

## What did ship: dispatch reframed as a two-tier tree, not three discrete kinds

Rather than "three kinds of dispatch" as a flat enumeration, the design
locks dispatch as two layers (L1 decides *what and who*, L2 infers
*how*) as a two-tier tree, not two independent axes: does this unit of
work carry a real lifecycle, and — only when it does not — is its prompt
pre-registered ahead of time or composed at the moment of dispatch. A
unit that carries a real lifecycle can never land on the second question,
so the two questions are not independent. L2 is deliberately never called a
"launcher" — a naming discipline to avoid implying a central
scheduler that doesn't exist.

Concretely, the parts that shipped:

- **A fourth valid reason to dispatch a step out of the current session**
  ("runs in parallel / shortens wall-clock time"), added alongside the
  existing reasons — recorded once and shared via
  `_shared/executor-dispatch-fallback.md` so every consuming skill reads
  the same list rather than each re-deriving its own.
- **An ad-hoc executor layer** — a runtime-composed prompt packet, as
  opposed to only ever dispatching against a pre-registered, fixed
  template. A dynamic packet carries six required fields (`id`, `goal`,
  `inputs`, `boundary`, `expected shape`, `return contract`). Its `id` is
  a *reference* id shaped `<scope>#p<n>` — structurally invalid as a real
  work-item id, since `#` breaks the work-item `ID_PATTERN` — deliberately
  never a lifecycle id, keeping D4's gate intact even at the naming
  level. `<scope>` resolves to the currently claimed work item, or a
  short writer-identity fallback when there isn't one; the counter `n`
  lives in the composing session's own memory, never a counter file —
  a persistent counter file would have quietly reopened the very gate D4
  locks shut.
- **No self-declared "am I dispatch-ready" flag.** Whether a packet is
  ready to dispatch is derived from existing mechanical signals (real
  prose, a runnable `verify`, a real `footprint`) — never a
  `selfSufficient` field a caller could set and be wrong about.
- **Provider/tier selection stays a shared prose fragment a consuming
  skill includes, never a subprocess judge** — it returns only
  `provider`/`tier`, never a mechanism of its own. Its fail-safe
  direction is deliberately the *inverse* of the packet-field
  requirement above: a missing required packet field blocks dispatch
  outright, but a failed tier judgment still dispatches anyway, using
  the default tier — silence in provider selection is not treated as
  seriously as silence in the packet contract itself. Whichever
  provider/tier is actually used gets recorded, never left implicit.
  Full smart-tier provider selection is real, deferred future work — the
  packet reserves empty `provider`/`tier` slots now specifically because
  reserving the slot is cheap today and retrofitting it later would not
  be.

All three follow-on implementation pieces (the parallelism reason, the
ad-hoc executor packet shape, and the per-dispatch provider/tier
judgment) were delivered as three separate items — `tsk-2sl`, `tsk-2k1`,
`tsk-503` — chained by `mergeAfter` rather than bundled into one, since
all three touch the same shared fragment file and benefit from landing
in a defined order without blocking each other's own review.

## Where the detailed write-up lives

This item's own required doc deliverable was a `docs/distillery/`
deep-dive update (`parallel-decomposition-and-merge.md`) plus a
`porting-log.md` row — the specific write-needs-identity-vs-read-only
axis and the "a cell is not a backlog item" distinction, cross-referenced
against bee's own fan-out cost-tiering rubric. That distillery content is
the detailed technical comparison against bee; this document is the
narrower "why does fgOS's own dispatch design look like this" explanation
for a reader who wants the decision, not the upstream comparison.

Full decision record (D1-D12), and the full multi-round design
discussion this was distilled from: `docs/history/two-layer-dispatch/CONTEXT.md`
and `DISCUSSION.md`. The doctrine this design layers on top of without
superseding: `docs/decisions/0026-vision-orchestrator-roottask-capacity-native-vs-cli-spawn.md`.
