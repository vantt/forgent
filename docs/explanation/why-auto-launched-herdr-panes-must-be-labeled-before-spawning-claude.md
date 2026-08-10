---
type: explanation
title: Why auto-launched herdr panes must be labeled before spawning claude, unlike person-triggered ones
tags: []
source_capture_ids: [tsk-2ja]
---
# Why auto-launched herdr panes must be labeled before spawning `claude`, unlike person-triggered ones

herdr-plugin's `fg:agents-N` launch pattern already had a working shape
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

## Related

- `docs/history/stage-status-driving-coordination/plan.md`
  (herdr-orchestrator section) — full plan for the auto-discover
  launcher and its sibling pieces.
- `docs/how-to/launch-claude-in-a-new-herdr-pane-from-a-plugin.md` — the
  person-triggered launch pattern this mechanism extends, where the
  label-after-spawn ordering is safe because a person is watching.
