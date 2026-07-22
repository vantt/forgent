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

---

**Source:** `docs/history/learnings/critical-patterns.md` —
[20260717] "A test fixture for git-worktree/checkout-touching code must
mirror the TARGET repo's real tracked-vs-gitignored layout" (feature
fgos-multi-session-checkout);
[20260717] "'Mirror X' reuses the mechanism, never the policy" (feature
fgos-multi-session-checkout);
condensed entry "Đường crash-recovery phải có test giết-thật" (feature
phase-2-routing, 2026-07-14).
