# Reclaim, pane labeling, and the closing report

Three mechanical calls this loop fires that are never gates — a stage
skill's own gate (`return`, `ask`) is the real gate; each of these three
is additive tracking or decoration around it.

## Reclaiming the role/holder ball

The role/holder axis is a third axis, orthogonal to `status`/`stage` — it
tracks who is actually holding the item (`implementer`, `reviewer`,
`researcher`, `advisor`, …) so that a session's real interactions
(consult a researcher, get something reviewed, ask a human, hand off a
scoped subtask) are checkable and loggable instead of staying implicit.
This axis only stays truthful if a session reclaims the ball before it
starts working an item whose most recent role-axis call was never closed
— most commonly a `review` call that a reject sent back to `doing`
without anyone formally returning it, or an `advise` call whose
`awaiting-human` park a prior session's `fgos answer` already resolved on
the status axis without the role axis following.

Every stage-skill this loop invokes carries its own reclaim block at its
own entry point, but that block is explicitly conditioned on "did NOT
arrive via this loop" — it assumes this loop already closes any dangling
call before invoking it. Step 7 in `loop-mechanics.md` is that other
half, written once, generically, off the domain's role-graph registry
rather than any coding-specific knowledge — the same discipline that
keeps the rest of this loop domain-neutral even though the skill's own
file name stays coding-specific.

Skipping this step is not hypothetical: it once left a holder set to
`reviewer` forever after a reject sent the item back to `doing`, and the
item then refused with a callstack-cap error on the third reject cycle,
because nothing ever closed the first open call.

## Pane labeling: the pinned execution-lane call site

This loop is where the execution lane labels its own pane, and it is the
only place that call belongs. Two reasons, both structural: this loop
knows the item id **earliest** — every launcher that drives a coding item
routes through here — and it sees **every stage change**, so one call
here replaces N launchers each having to remember one. An earlier version
of the discover-loop launcher carried its own optional rename call for
exactly this purpose; it does not any more, because it now reaches this
loop and inherits the call.

Calling it does not break this loop's "purely mechanical" hard rule:
invoking a capability-gated helper that no-ops is a mechanical action, not
a routing judgment. The loop never reads a result from it, never branches
on it, and never lets it fail the drive.

**The gate is not in this loop.** The rename helper itself queries the
pane-labeling capability and no-ops silently when no provider is
registered — see the `terminal` skill. That is what makes labeling
adapter-swappable: a future orchestrator is a different registered
provider, not an edit to this loop.

**Nothing may ever read a label back.** Labels exist for a person looking
at a screen; occupancy and "what is running" are engine state. This loop
writes one and never reads one.

A fresh claim also calls the same helper, at claim time — earlier than
this loop, and it covers the claim's own worktree-fallback branch where
this loop is never invoked at all. The two calls produce the same label
for the same id, so the overlap is redundant, never conflicting.

## Closing report: the drive's landing place on the item

Every stop in the loop records its own closing report on the item
(`fgos report <id> --text ... --stop-reason ...`) before reporting the
same thing to the caller. Same argument as the labeling call: invoking a
verb is mechanical, not a routing judgment, so it does not break the
"purely mechanical loop" hard rule.

**Why this exists at all.** A drive's closing report used to live in
exactly one place — the pane it ran in — and that made the pane precious.
It is the one artifact with no copy anywhere else: code is on the item's
own branch, decisions are in the event log, a parked question is in
`fgos ask --text`, documentation is under `docs/`. Recording it on the
item is what lets an orchestrator treat a finished pane as disposable and
reuse it, instead of a person having to sit and guard a terminal to read
a result before it scrolls away. An orchestrator plugin already reuses
finished worker panes; this call is the reason that is safe rather than
merely tolerable, so it is not optional decoration.

**One item, one landing place.** The report is written through the
decision log (`source: driver-report`), so `fgos show <id>` surfaces it
among that item's own history — no new event type, no new field. Read a
result with `fgos show <id>`; never require anyone to still have the pane
open.

**Never a gate.** Do not stop, retry, or branch on the outcome of the
call, and never let it change what is reported to the caller. If the verb
fails, report the stop to the caller anyway — losing the copy is strictly
better than losing the stop.

**Admin lane does not need it.** `merge`/`retro`/`cleanup` run as loops in
a fixed pane that is never split or reclaimed, so nothing overwrites their
output. This is an execution-lane call only, which is also why it belongs
in this loop: this loop is the one every coding flow passes through.
