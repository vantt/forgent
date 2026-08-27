---
type: explanation
title: Why `/fgOS:discover-next` shrank to a picker
source_capture_ids: [tsk-lya]
framework: diataxis
mode: explanation
---
# Why `/fgOS:discover-next` shrank to a picker

`/fgOS:discover-next` used to claim the item it picked, dispatch
`fgos-coding-driving` itself, and compute its own ceiling — the same
kind of hand-rolled sequencing `/fgOS:retro-next` carried before its own
shrink (`docs/explanation/why-retro-next-shrank-to-a-launcher.md`). This
left it duplicating logic the shared launcher tier already owned, with
no way to inherit that tier's own park/anchor/no-progress fixes without
a separate re-implementation in `discover-next`'s own copy.

## What changed (`tsk-lya`, D10)

`discover-next` now does exactly one job: pick the next
`stage:discovery`/`stage:exploring` item via `pickNextDiscoverItem`
(`src/state/discover-pool.mjs`), then hand the picked id straight to
`/fgOS:discover <id>`. It no longer claims the item, dispatches
`fgos-coding-driving`, or computes a ceiling itself — `/fgOS:discover`,
the launcher one tier down, owns all of that for whichever stage the
picked item is actually at. This is the "picker hands off to a
launcher" shape, distinct from `retro-next`'s own "launcher hands off to
the driver directly" shape one level lower — two adjacent tiers, each
doing exactly one job, per the same `0029` D17 vocabulary
(`launcher`/`driver`/`orchestrator`) already governing the sibling case.

From the landed skill's own prose (`plugins/fgOS/skills/discover-next/
SKILL.md`):

> this command picks, claims, and hands off — it does not itself claim +
> dispatch `fgos-coding-driving` + compute a ceiling anymore.
> `/fgOS:discover` (the launcher one tier down) owns all of that for
> whichever stage the picked item is actually at.

## The item also split off a stranded pool: `plan-next` + `plan-loop`

Before this item, the `planning` pool (with its legacy `decompose`
alias) had no dedicated `<root>-next`/`<root>-loop` pair of its own —
four such pairs already existed (`cleanup`, `discover`, `merge`,
`retro`), and `planning`'s pool was still riding along inside
`discover-next` as a historical leftover from before an earlier item
(`tsk-2b0`) split the bottom tier. `tsk-lya` gave `planning` its own
pair, generated with the correct rename already applied
(`decompose → planning`, per the family rename decision D11 named on
the same item) rather than being born under the old, now-inconsistent
name and needing a second rename pass later.

## The item also carried two real prose-accuracy fixes

`discover/SKILL.md`'s own description had drifted from what actually
runs: it attributed Socratic reasoning to `fgos-exploring` in three
places (including the frontmatter description loaded into every
session), and a separate line claimed `nextDiscoveryEdge` only "errors"
rather than genuinely handling all three stages. Both were corrected as
part of the same item rather than filed separately, since they were
discovered while rewriting the surrounding prose this item was already
touching.

## Real cost: a merge conflict, resolved before delivery

Landing `tsk-lya` alongside its sibling pieces on the same parent branch
(`fgw/tsk-2mt`) hit one real conflict: `git merge --no-commit --no-ff
fgw/tsk-lya into fgw/tsk-2mt` aborted on first attempt, parent branch
left unchanged. This resolved before the item's own outcome recorded as
`awaiting-approval`/passed on attempt 1 — the same "real friction during
concurrent merge, not a defect in the change itself" pattern its sibling
piece `tsk-30v` (the cluster's own DoD) also hit landing on the same
parent branch around the same time.

## A known follow-up gap this item did not close

`docs/how-to/process-the-next-clarify-or-decompose-item-with-discover-
next.md` still describes `discover-next`'s pre-`tsk-lya` mechanics —
running `fgos discover`/`fgos plan` as a raw CLI subprocess and
classifying by exit code — which no longer matches the picker's real
behavior above (delegating to `/fgOS:discover`, relaying its stop line
rather than reading a process exit code). Reconciling that how-to doc
was not part of this item's own footprint and is left as a real,
observed gap rather than silently papered over.
