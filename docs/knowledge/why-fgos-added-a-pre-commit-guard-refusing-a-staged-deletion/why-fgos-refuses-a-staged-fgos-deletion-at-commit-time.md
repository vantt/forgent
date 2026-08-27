---
type: explanation
title: Why fgOS refuses a staged .fgos deletion at commit time
tags: [fgos, git, pre-commit, worktree, events-jsonl, stash]
source_capture_ids: [tsk-56u]
authoritative_for: why fgOS added a pre-commit guard refusing a staged deletion under .fgos/, and why git stash on the main checkout is a separate named hazard
framework: diataxis
mode: explanation
---
# Why fgOS refuses a staged `.fgos` deletion at commit time

`tsk-56u`. Two real near misses during the worker-slot batch, both on
shared state, neither guarded at the moment they actually happened.

## Near miss 1: `git add -A` in a worktree stages the live event log's deletion

Per ADR0020, a linked worktree never carries its own `.fgos/` — it is
stripped at creation. That is correct and deliberate. But it has a sharp
edge: every linked worktree's own `git status` therefore reports the
*whole* of `.fgos` as deleted (relative to the main checkout's tracked
state). A single ordinary `git add -A` followed by a commit, run from
inside that worktree, stages the deletion of `events.jsonl` and every
other tracked state file under `.fgos/`.

The existing protection — the `fgos-write-rejected` check — only fires
at *merge* time. The destructive commit itself was never refused; the
damage was only ever caught later, if at all, once that branch attempted
to land.

**The fix**: a pre-commit guard that inspects staged deletions
(`git diff --name-only --cached --diff-filter=D`) for any path equal to
`.fgos` or prefixed `.fgos/`, and refuses the commit outright. Scoped
specifically to *deletions* — a worktree can only ever stage a `.fgos`
deletion (it was `rmSync`'d, never recreated), never an addition or
modification, so narrowing to deletions loses no real coverage for this
hazard while leaving fgOS's own legitimate `.fgos` writes on the main
checkout (a separate, already-guarded case — see the "content-precedence
guard" note below) untouched.

## Near miss 2: `git stash` on the shared main checkout can roll back live state

The shared main checkout is where every session resolves its `fgos`
calls. Stashing there to clear a dirty tree can sweep
`.fgos/events.jsonl` into the stash along with everything else being
stashed — which does not just hide one file, it rolls the *whole*
repository's tracked state back to an older commit for as long as the
stash is held.

This happened for real during the batch: an `approve` run misread an
item as `doing` when it was actually `awaiting-approval`, because the
live event log had been stashed out from under it. It was recovered by
applying the stash back **by SHA**, deliberately not by popping it (the
stash stack is shared across every session and worktree — popping the
wrong entry, or popping when another session had since pushed its own
stash, risks stranding a different session's own state the same way).
Nothing was lost this time, but the near miss demonstrated the same
class of risk `git reset --hard` already carries on the main checkout.

## Why this needed a written warning, not just a guard

`AGENTS.md` already warned about a bare `git reset --hard` on the main
checkout for exactly this class of reason, and named `fgos
main-checkout-reset` as the safe alternative — but said nothing about
`git stash` or the `git add -A` case. A pre-commit guard can refuse the
first hazard mechanically; it structurally *cannot* refuse a stash (a
stash is not a commit, and a guard hook has no comparable hook point for
it). The stash hazard is closed the only way it can be — a named warning
in `AGENTS.md`, alongside the existing `reset --hard` warning, so a
session reads the same caution before reaching for either destructive
git primitive on the shared main checkout.

## The general shape: catch it at the moment it happens, not the moment it's discovered

Both fixes share the same underlying correction: the pre-existing
`fgos-write-rejected` check already caught a `.fgos` write violation, but
only at merge time — a real gap between when the damage happens (a
commit, a stash) and when anything notices. The new guard closes that
gap for the commit case by moving the check to commit time itself,
matching this repo's own precedent for content-precedence protection
under `.fgos/` (a separate, already-shipped guard refusing any staged
*modification*, `--diff-filter=M`, under `.fgos/` on the main/default
branch) — the same discipline, applied to the deletion shape this
item's two near misses actually exposed.
