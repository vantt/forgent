# Why `fgos add` items landed permanently at stage `executing`, with no path back

`tsk-621` found that every item created via `fgos add` skipped
`fgos-coding-exploring`/`fgos-coding-planning`/`fgos-coding-validating` entirely and
permanently — not temporarily, and with no way to recover once it
happened.

## The mechanism

`fgos add` never sets an item's `stage` field at all. `fgos submit` (the
public intake door) does stamp an entry stage
(`stageForStep(domain, 'Clarify')`), but `add`'s own comment made the
omission explicit and deliberate: "No `--stage` flag: omitting stage
already resolves per-domain via the existing lazy default." A missing
`stage` field reads lazily as `executing` wherever it's consumed
(`frontier.mjs`, `store.mjs`) — by design (an earlier decision, D8),
never actually written onto the record.

That lazy default is harmless for an item that's genuinely meant to
start at `executing`. It's a trap for one that isn't, because the coding
domain's stage graph has exactly three forward edges —
`clarify→executing`, `clarify→decompose`, `decompose→executing` — and
**none of them lead into `clarify` or `decompose`**. Once an item is
sitting at `executing` (even by lazy default, never explicitly written),
there is no registered transition back. `fgos edit` can't rescue it
either: `stage` is deliberately excluded from `EDITABLE_FIELDS`, so
`moveStage`/`transitionStage` — the only functions that can change stage
— only ever accept the three forward edges above, and the engine itself
has no mechanism to manufacture a fourth.

## Why this wasn't a rare edge case

`fgos-coding-planning/SKILL.md`'s own step 4 — the *current, active* instruction
every split follows today — teaches splitting a task by calling `fgos add
--parent <id> --footprint ...`, with no `--stage` option at all. This
isn't a historical accident affecting old items only; it fires on every
real split. Confirmed with a live count: 26 items created via `add`
were sitting at implicit `stage: executing` at the time this was found,
including three children (`tsk-2sl`/`tsk-2k1`/`tsk-503`) of `tsk-2t6`
that surfaced the bug directly — a terminal handoff from
`fgos-coding-shaping` describing an `exploring → planning` transition
the children could never actually go through, since they'd never touched
`clarify` in the first place.

## The fix: change the default going forward, never add a back-edge

Two decisions, deliberately kept separate:

**Going forward (D1/D2)**: `add` gains an explicit `--stage` flag for a
caller that genuinely wants to start at `executing`, and `add`'s lazy
default changes from implicit `executing` to `clarify` — mirroring
`submit`'s own existing default contract instead of inventing a second
one. This closes the gap for every *new* item created after the fix
ships, regardless of caller.

**For the 26 already-stuck items (D3)**: a one-time data fix, explicitly
**never** a new permanent back-edge added to the stage graph. This
distinction — fix the default, don't add a recovery transition — was the
central design call.

## Why a back-edge was considered and rejected

A back-edge into `clarify` looked like the obvious recovery mechanism
for the already-stuck items, since fixing the default alone does nothing
for items created before the fix. It was rejected for several compounding
reasons:

- **`stage` (macro lifecycle position) and `status` (micro FSM state —
  `doing`/`awaiting-approval`/etc.) are orthogonal by design.** No
  existing invariant defends an in-flight claimed item — `status: doing`,
  with real code and commits already sitting on its own branch — from
  being yanked backward mid-build if a back-edge existed. A stage demotion
  on a half-built item has no clean semantics: what happens to work
  already in progress against the stage it's being pulled out of?
- **Gate-approve records are append-only.** `contextApprove`/
  `planApproved` gate records never get un-set. A back-edge would leave
  `fgos show` displaying an item with an *already-approved* gate sitting
  at an earlier stage than that approval implies — a contradiction
  nothing in the system auto-resolves.
- **A back-edge is a new permanent contract surface for a bounded,
  finite problem.** 26 stuck items is a one-time backlog, not a
  recurring need — D1/D2 already stop the underlying default from
  recurring. Adding a permanent "stage can move backward" exception to
  the FSM (new tests, a new case every stage-aware skill would need to
  account for) to fix a fixed-size backlog was judged not worth the
  ongoing complexity it would leave behind.

## Scoping the one-time fix down further: only 1 of 26 items actually qualified

Of the 26 stuck items, only those whose `status` was still
`todo`/`doing`/`awaiting-approval` were even candidates for the one-time
fix (D4) — the other 23 were already `delivered`/`cleanup`/
`retrospective`: built, approved, and past `executing` in the *status*
lifecycle already. Correcting their historical `stage` field would have
had zero practical effect, since nothing would ever route them through
`fgos-routing` again regardless of what `stage` said.

That left 3 candidates (`tsk-503` at `todo`, `tsk-2k1` at `doing`,
`tsk-2sl` at `awaiting-approval`). D5 narrowed further: only `tsk-503`
(not yet dispatched at all) actually got the fix. `tsk-2k1` and
`tsk-2sl` were left alone — the same reasoning D3 already used against a
back-edge applied here too: touching an item mid-build, or one already
sitting for merge review, risks more than a stale `stage` field is
worth, and correcting it now has no practical forward effect for either
one.

**Even that narrowed fix turned out moot at execution time (D6)**:
`tsk-503` self-resolved to `delivered` via a concurrent session working
the same shared backlog before this item's own execution reached it —
landing in the same "already past executing, no practical effect"
bucket the other 23 were already ruled out under. No supersede/re-add
was ultimately performed on any of the 26.

Full decision record: `docs/history/add-stage-default-gap/CONTEXT.md`
(D1-D6).

## A related but distinct gap (`tsk-4zj`): even a correctly-defaulted stage was invisible on read

`tsk-621` above fixed the *mechanism* — which lane an item lands in.
`tsk-4zj` found a separate problem with *visibility*: even once `stage`
correctly reads lazily as `executing` for an item that never had it
explicitly written, `fgos list` (and every other read surface — `ready`,
`show`, `triage`, `rollup`) returned the record with **no `stage` key at
all** for such an item. Confirmed live on the same three items
(`tsk-2sl`/`tsk-2k1`/`tsk-503`) that surfaced `tsk-621`: nothing in any
read surface's output told a person or an agent that these items were
sitting at `executing`, having skipped `clarify`/`decompose`/
`validating` entirely.

The development-UX consequence: a genuinely large decision — this item
will never pass through a reality check — was being communicated purely
through the **absence** of a field. An absent field communicates nothing
at all; a reader has no way to distinguish "this item's stage was never
computed" from "this item is fine, nothing to see here."

**The fix stays scoped to the read layer only**, deliberately not
touching the write-side lazy-default (D8) `tsk-621`'s own fix left
alone: every read surface now renders the *derived* effective stage
instead of leaving it blank — distinguishing an explicit `executing`
from an implicit one (e.g. "executing (default, not stated)") — while
the storage layer keeps the exact same absent-stays-absent contract it
already had. This is a read-layer projection change, not a write-layer
default change, so it doesn't reopen or interact with D8 at all.

The two items are related but answer different questions: `tsk-621` is
about the *mechanism* that assigns an item's lane; `tsk-4zj` is about
whether that lane, once assigned, is actually visible to whoever reads
the item afterward. Full decision record:
`docs/history/read-surface-effective-stage/CONTEXT.md`.
