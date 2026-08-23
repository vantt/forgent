---
type: explanation
title: Why auto-launched herdr panes must be labeled before spawning claude, unlike person-triggered ones
tags: []
source_capture_ids: [tsk-2ja, tsk-57q]
---
# Why auto-launched herdr panes must be labeled before spawning `claude`, unlike person-triggered ones

(These worker tabs carried an earlier name when the work below landed;
the worker-slot item renamed them to `fg:workers-N`, the name used
throughout here. The quoted passages are reproduced verbatim from that
time.)

herdr-plugin's `fg:workers-N` launch pattern already had a working shape
for a person-triggered launch: the Discover button opens a pane, spawns
`claude '/fgOS:discover <id>'`, and the pane's own title/label arrives
*later*, written from inside the launched session itself once it starts
running. That ordering works fine when a person is watching and can see
the pane appear before it's labeled.

## Why the same ordering breaks for an unattended, auto-launched pane

`herdr-orchestrator`'s auto-discover launcher (`tsk-2ja`) fires from
`main.rs`'s existing poll tick, unattended — no person watches it happen.
The double-launch guard this mechanism relies on
(`has_labeled_pane`/`pane_scan.rs`) works by scanning existing pane
titles for a reserved label (`fgos-auto-discover-<id>`) *before* each
launch attempt, to avoid opening a second pane for the same item on the
next tick. If the label only arrives later — the person-triggered
button's own ordering — a window exists between "pane opened" and
"pane labeled" where the guard's own scan would find nothing yet, and a
second poll tick landing inside that window could launch a duplicate
pane for the same item.

## The fix: label first, then spawn

The auto-discover launcher (`open_auto_discover_pane`, `pick.rs`) writes
the pane's label via `herdr pane rename` immediately after opening the
pane, *before* `claude` is ever spawned inside it — closing the race the
person-triggered flow never had to close, because a person's own
attention filled the gap the automated case can't rely on. A pure
argv-sequence builder proves this ordering directly (rename lands before
run), rather than trusting it to hold by construction.

## The label namespace itself needed a second guard

`pane_scan.rs`'s existing `extract_task_id` — the function that reads a
pane's title back out as a task id for other purposes — had to be taught
to reject the new reserved `fgos-auto-*` label namespace explicitly.
Without that exclusion, a live auto-discover pane's own label
(`fgos-auto-discover-<id>`) could be misread elsewhere as if it were a
real task id, since the label's shape (containing the real id as a
substring) overlaps with what `extract_task_id` was built to parse.

## Failures are swallowed, not surfaced, by design

The poll tick's own readiness selection (an item at `stage === 'clarify'`
and `status === 'todo'`) wraps any launch failure — a cap refusal (per
`tsk-5lr`'s `MAX_AGENT_TABS`), a rename failure, a spawn failure — and
swallows it rather than surfacing an error. This matches the mechanism's
own nature: an unattended poll tick has nobody to report a failure to
mid-cycle; the safe behavior is to skip this tick's launch and let the
next tick retry, not to crash or block the poll loop over one failed
attempt.

## A sibling launcher needed new trait methods, not the same ones (`tsk-57q`)

`tsk-2ja`'s guard/launch machinery (`open_auto_discover_pane`,
`has_labeled_pane`) was built around a single-item shape: one work item
id, one dynamically-created `fg:workers-N` pane, one id-shaped title to
scan for. The auto-merge/retro/cleanup launcher (`tsk-57q`) doesn't fit
that shape at all — `/fgOS:merge-loop`/`/fgOS:retro-loop`/
`/fgOS:cleanup-loop` are pool-sweep verbs with no single item id to
launch against, and they target the *fixed*, already-resolved
`fg:operation` tab (`tsk-5lr`) rather than a dynamically-picked
`fg:workers-N` slot:

> "New `PaneOrchestrator`/`PaneRegistry` trait methods for the fixed-pane
> launch and fixed-title guard, since neither existing
> pick.rs/pane_scan.rs path fit a no-id pool-sweep verb or a non-id-shaped
> pane title."
> — real commit message, `55e4a4df`, branch `fgw/tsk-57q`

The label-before-spawn ordering and the reserved-namespace guard this
doc describes both still apply — `fgos-auto-merge`/`fgos-auto-retro`/
`fgos-auto-cleanup` are fixed, non-id-shaped labels in the same reserved
`fgos-auto-*` namespace `tsk-2ja`'s `extract_task_id` exclusion already
covers. What's new is the launch/scan *mechanism* itself: a no-id,
fixed-pane variant sitting alongside the id-shaped, dynamic-pane variant,
rather than one mechanism trying to serve both shapes. Each of the three
toggles (`autoMerge`/`autoRetro`/`autoCleanup`) also stayed confirmed
non-conflicting with the human-gate policy wall
(`stage-status-driving-coordination/CONTEXT.md` D9) by construction — this
launcher only ever shells out to the existing `/fgOS:merge-loop` command,
never touching `bin/fgos.mjs`'s `approve`/`merge` cases or `store.mjs`'s
`moveWork` directly.

## The two mechanisms collapsed back into one (`tsk-3fk`)

The section above ends with "a no-id, fixed-pane variant sitting alongside
the id-shaped, dynamic-pane variant, rather than one mechanism trying to
serve both shapes." That split did not survive contact with the next
requirement, and the fixed-pane half was retired.

What went away specifically is **pane resolution by geometry**: the design
where the left pane of `fg:operation` is always the merge-loop slot and the
right pane is always the retro/cleanup slot, resolved by x-coordinate. In
its place, `fg:operation`'s panes became **on-demand, one per active
loop** — split a pane, rename it to `fgos-auto-merge` / `fgos-auto-retro` /
`fgos-auto-cleanup`, *then* spawn `claude`. That is precisely the
label-before-spawn sequence this page already describes for auto-discover.

The `fg:operation` **tab** is unaffected — it is still found-or-created by
label. Only the by-geometry pane resolution inside it was retired.

So the label-before-spawn ordering and the reserved `fgos-auto-*` namespace
were never the part that needed two variants. The only real difference
between the two launchers is what the label says — an id for a worker pane,
a fixed loop name for an operation pane. Once pane *placement* stopped
being special, the second mechanism had nothing left to do.

### The mutual exclusion was an artifact of the fixed slot

Retro and cleanup used to be arbitrated: only one of them could run at a
time, chosen by priority. That was never a product rule about retro and
cleanup — it existed *only* because both were forced to share the single
fixed "right" slot.

With a pane per active loop, both toggles being on simultaneously is valid
and expected. The arbitration machinery
(`choose_right_pane_loop`/`pick_right_pane_loop`/`RightPaneLoop`) became
dead code to delete, not constraints to keep designing around.

This is the reusable observation: when a layout constraint disappears, look
for the *behavior* rules that were only ever standing in for it. An
arbitration rule with no reason left to exist will keep working, silently,
and keep looking intentional.

### Closing a pane stopped conflicting with the layout

The same removal resolved a conflict that had been blocking `--autoClose`
here. `/fgOS:terminal-close`'s real `herdr pane close` could not be used on
a fixed operation-tab pane, because closing one would strand the tab in its
own documented "tab exists, fewer than 2 panes" unsupported state.

That was fixed by removing the invariant, not by avoiding the close. Each
of the three loop skills now takes the same optional trailing `--autoClose`
token that `/fgOS:pick` and `/fgOS:discover` already parse, and calls
`/fgOS:terminal-close` as its literal last action — but **only on a genuine
natural-finish stop** (frontier empty). Never on a block, an Iron Law trip,
a no-progress read, or a same-id-blocked-twice stop: on any error the pane
stays open so a person can see what happened.

### A cap, and rewritten tests

`fg:operation` holds at most 4 concurrent panes. A launch beyond the cap is
refused and swallowed on the same swallow-and-retry-next-tick convention
auto-discover's own cap already uses — skip this tick, try again next, no
error surfaced. Today's three loop types fit with headroom for one more;
the constant is a locked product decision, not a value derived from the
current loop count.

The tests that asserted the fixed-2-pane shape were rewritten rather than
left green. A passing test for a retired design is worse than no test: it
reports that a shape nothing implements any more is still guaranteed.

## Related

- `docs/history/stage-status-driving-coordination/plan.md`
  (herdr-orchestrator section) — full plan for the auto-discover
  launcher and its sibling pieces.
- `docs/how-to/launch-claude-in-a-new-herdr-pane-from-a-plugin.md` — the
  person-triggered launch pattern this mechanism extends, where the
  label-after-spawn ordering is safe because a person is watching.
