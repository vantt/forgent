---
type: explanation
title: How fgOS's event log is allowed to evolve without breaking replay
tags: [event-log, replay, state-layer, backward-compat]
timestamp: 2026-07-22T00:00:00.000Z
source_capture_ids: []
---

# How fgOS's event log is allowed to evolve without breaking replay

`0001-event-log-la-su-that.md` establishes the doctrine: the append-only event
log is the truth, and any derived state (a view, a store, a graph) is a
rebuildable projection that never writes back. Practice building on top of that
doctrine has settled a concrete set of rules for *how* the log and its
projections are allowed to change shape over time, once real committed history
exists that can't be rewritten.

## The allowlist has two faces, not one

Every view in fgOS is built by folding events through an explicit allowlist —
the fold function destructures exactly the keys it knows about, on purpose,
so a stray field can never leak into the view silently. That discipline has a
face that's easy to remember (the read side, the replay fold) and a face that
is just as necessary but easier to forget (the write side): the function that
turns a command into an event also destructures its own known fields before
appending, with no `...rest` catch-all. A new field stamped onto a work item
has to be added to *both* sides in the same change. Fixing only the read side
while the write side still drops the field on the floor is worse than it
looks: the field never reaches the log at all, so the "corrected" read side has
nothing to fold — the bug moves upstream instead of disappearing. (This
concern is specific to the *destructure* path; a fold that spreads the whole
event payload wholesale survives a rebuild on its own, with no allowlist edit
needed — but it's still worth checking which shape a given event actually
uses before assuming the allowlist pattern even applies.)

## Adding a field to the persisted view without breaking pinned snapshots

fgOS keeps two things that both look like "the view": the pure in-memory fold
result (pinned by whole-view snapshot tests and a backward-compatibility
contract that expects the fold to reproduce a known-old shape exactly), and
the on-disk file that a separate write step produces from that fold result. A
derived-only field — something computed at persistence time, like a revision
marker, rather than something carried by an event — belongs exclusively in the
on-disk write step. Stamping it onto the pure fold's own return value instead
would break every test pinned to that fold's exact shape. Keeping the fold pure
and deterministic, and adding the derived field only where it's written to
disk, keeps both the snapshot tests and the on-disk deep-equal checks green at
the same time.

## Evolving a log that's already committed

Two shapes of change are safe on a log with real history behind it: a new
event *type* is additive (old readers that don't know about it simply don't
fold it), and a new view *key* has to be lazy — absent from the view until an
event actually populates it, never initialized to an empty default up front.
An eagerly-initialized key breaks any test that does an exact structural
comparison against an older, known-good view shape. Wherever a value like this
gets written, it should be written at one choke point that every code path —
including failure paths, not only the success path — passes through, so there
is exactly one place that can drift instead of several call sites that could
each drift independently.

## Concurrency at the log's write door

The log's on-disk lock exists specifically to stop two concurrent writers from
producing a duplicated or gapped sequence number. Because the failure mode
this guards against is a tight timing race, a single failing run of a
concurrency test — especially one observed while another session is visibly
active in the same checkout — is not on its own proof of a real regression:
the honest way to tell load-induced flakiness apart from an actual break is to
re-run the same test in isolation and re-run the full suite once contention
has settled, and record both results as the evidence, rather than either
declaring victory on the first green run or silently shrugging off the first
red one.

---

**Source:** `docs/history/learnings/critical-patterns.md` —
[20260716] "Field mới stamp lên work item → CÙNG cell phải sửa allowlist fold +
test," with its 2026-07-17 addendum on the write-side destructure (feature
pr-lifecycle);
[20260718] "Adding a field to the persisted state view must keep the FOLD
RETURN byte-identical" (feature work-graph-intelligence, slice 3);
condensed entry "Tiến hóa nhật ký đã-commit: event type additive + view key
LAZY" (feature phase-3-compound-learning, 2026-07-15);
[20260718] "A single test-run failure in the events.lock fork-race test, under
a heavy CONCURRENT multi-session load, is not proof of a regression" (feature
store-atomic-rmw).
