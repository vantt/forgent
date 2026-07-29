---
type: explanation
title: How fgOS isolates concurrent sessions, and why the event log's write door blocks instead of backing off
tags: [multi-session, concurrency, worktree, crash-recovery]
timestamp: 2026-07-22T00:00:00.000Z
source_capture_ids: []
---

# How fgOS isolates concurrent sessions, and why the event log's write door blocks instead of backing off

fgOS supports multiple concurrent sessions against the same checkout by
isolating each one into its own git worktree. Two design facts fall directly
out of that choice, and a third is a general safety property any code
manipulating a worktree needs.

## `.fgos/events.jsonl` is git-tracked, on purpose

By convention, fgOS's own event log file is committed into the repository,
not left untracked. That single fact has real consequences for anything that
creates, checks out, or tears down a session's worktree: `git worktree add`
checks tracked content out into the new worktree exactly as HEAD has it, and
`git worktree remove` behaves differently depending on whether the paths it
touches are tracked or not at that moment. Code that manages session
worktrees has to be tested against fixtures that mirror this exact
tracked-vs-untracked layout for the paths it actually manipulates — a test
passing against a generic, freshly initialized git repo with no tracked state
at those paths is not evidence it will behave correctly against a real fgOS
checkout, because the tracked state is exactly what changes `worktree add`/
`remove`/`checkout`'s behavior.

## The event log's single write door has to block, not back off

Every mutating verb in fgOS funnels through one function that appends to the
event log. That gives it a reliability requirement stricter than most other
locks in the system: it must eventually succeed, because silently skipping a
write would mean an action the user thinks happened never reached the log at
all. That's a materially different failure semantics than, say, a top-level
dispatch loop's own lock, which can safely back off and simply skip a turn if
it can't acquire it immediately.

This distinction matters specifically when reusing an existing lock/retry
primitive by name. The underlying mechanism — atomic-create plus stale-owner
reclaim — is safe to reuse across call sites. The *policy* wrapped around it
(blocking versus non-blocking, how long to wait, whether the caller retries at
all) is not something to copy from a superficially similar-looking sibling by
name; it has to be re-derived from the new caller's own failure semantics
every time. Naming a precedent by its function name, without reading what
specific property makes it correct for its own original call site, is exactly
how a non-blocking lock ends up copied onto a caller that actually needed a
blocking one.

## A crash mid-operation needs a real kill test, not just a fixture

Any code path that touches git/filesystem bookkeeping for a worktree or
session and that can be interrupted partway through — not just fail cleanly at
a defined boundary — needs at least one test that sends a real kill signal to
a real process mid-operation. A fixture that only feeds in already-partial
data can prove the classification logic is correct, but it can't reproduce
what an actual crash does to git and filesystem state at the moment of
interruption. A bug in orphaned-checkout handling shipped through both a
review pass and unit-test coverage and surfaced only once an actual
kill-mid-operation rehearsal was run — the gap between "logic looks right on a
constructed fixture" and "survives a real interruption" is exactly the kind a
synthetic fixture can't close.

## A two-syscall lock create (open, then write the identity) has an empty-file window an atomic-looking primitive doesn't close

`events.lock`'s create step looked atomic — `fs.openSync(lockPath, 'wx')`
uses the same O_CREAT|O_EXCL exclusivity as its sibling locks
(`runner.lock`, `sessions.lock`, `main-checkout.lock`) — but it wrote the
holder's identity in a *separate* `fs.writeSync` call right after. Between
those two syscalls, the lock file exists but is still empty. A competitor
that loses the create race and reads the file in that exact window sees
unparseable (NaN) content, which the stale-holder-reclaim logic — correctly
designed to treat a dead/garbage holder as reclaimable — can't tell apart
from an actually-stale lock. It unlinks a lock a live process still holds,
and both processes go on to believe they hold it: the identical
duplicate-seq corruption the lock exists to prevent in the first place,
just reopened through a different door.

This reproduced empirically at the same scale that made it worth building
this lineage of locks safe in the first place: 0/5 failures at 6 concurrent
processes, 3/5 failures at 20. Low natural concurrency can make a real,
reproducible race window look like it isn't there — proving a lock correct
against today's typical concurrency is not the same claim as proving it
correct at the concurrency the system is actually meant to support.

The fix generalizes past this one call site: write the holder's identity to
a per-attempt temp file first, then `fs.linkSync` it onto the lock path
instead of `open('wx')` + a separate write. `link()` only ever exposes the
destination fully-written or not-yet-existing — there is no intermediate
state for a competitor to observe, so the empty-file misread is closed
structurally rather than patched with a retry or a wider timeout. Any
future lock in this same create-then-write-identity shape should default
to the write-then-link pattern rather than the separate open-then-write one,
even though the older shape reads as "atomic" at a glance — the atomicity
of the *create* was never the missing piece; the gap was between create and
content being fully present.

---

**Source:** `docs/history/learnings/critical-patterns.md` —
[20260717] "A test fixture for git-worktree/checkout-touching code must
mirror the TARGET repo's real tracked-vs-gitignored layout" (feature
fgos-multi-session-checkout);
[20260717] "'Mirror X' reuses the mechanism, never the policy" (feature
fgos-multi-session-checkout);
condensed entry "Đường crash-recovery phải có test giết-thật" (feature
phase-2-routing, 2026-07-14);
`docs/history/events-lock-concurrency-race/plan.md` — real race confirmed
and fixed at `962eb6b` (feature tsk-3ld, 2026-07-29).
