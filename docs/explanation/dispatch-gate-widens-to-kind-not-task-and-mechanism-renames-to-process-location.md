---
title: Why the dispatch gate widened to `kind !== 'task'` and mechanism values renamed to process location
---

# Why the dispatch gate widened to `kind !== 'task'` and mechanism values renamed to process location

## Two problems, one item (tsk-592, tsk-5td D13/D16)

### The gate predicate was too narrow

`dispatch.mjs`'s presence-check and cross-provider-check gate used `kind
=== 'cli'` to decide which executors got checked. That predicate quietly
let every other non-`task` kind — `mcp`, `skill`, `http`, `binary` —
dispatch with **zero** presence check and **zero** cross-provider check.
The fix widens the gate to `kind !== 'task'`: everything that isn't a
plain in-session task now gets gated, instead of only the one kind
(`cli`) that happened to exist when the gate was first written.

### The mechanism value names described the wrong thing

The `mechanism` value returned by dispatch decision logic used
`native`/`cli-spawn`. Both names described the *wrong axis*:
- `native` named a *style* ("native" to what?).
- `cli-spawn` named a *means* (spawning via the CLI) — but D13 already
  locked what `mechanism` is actually supposed to answer: **where the
  provider runs relative to the calling process** (in-process vs.
  out-of-process). Neither old name said that. The rename makes the
  values say the thing the field was already defined to mean:
  `in-process` / `out-of-process`.

## Why this had to happen now, not later

`tsk-49o` was about to add a second adapter (`sandboxed-cli-spawn`) to
`EXECUTOR_ADAPTERS`. Today, `EXECUTOR_ADAPTERS` has exactly one key, and
that key's own string (`cli-spawn`) happens to collide with the
`mechanism` value of the same name — two different concepts sharing one
string, invisible only because there was still just one adapter to
compare against. The moment `tsk-49o` landed a second adapter, that
collision would have become a real, hard-to-diagnose ambiguity between
"which adapter" and "which mechanism." Renaming now, before the second
adapter exists, closes the ambiguity while it's still free to fix.

A related, not-yet-landed item (`tsk-6db`, giving `agy` its own
recognized native mechanism) made the case sharper still: under the old
naming, that item would have had to ask "native *to which provider*?" —
a question `in-process`/`out-of-process` never has to ask, since process
location doesn't depend on which provider is running.

## Why the rename counts as breaking, and what that required

Changing the returned strings is a breaking change for every consumer
comparing against the literal `'native'`/`'cli-spawn'` values — not just
`dispatch.mjs` itself. The fix required grepping every comparison site,
including the `dispatch.mjs decide` CLI's own JSON output
(`{"mechanism": ...}`) and `.claude/skills/_shared/executor-dispatch-fallback.md`
Step B.5, which branches on exactly these two strings. All of these had
to move to the new values in the same change — a rename that misses one
comparison site doesn't fail loudly, it just makes that one site branch
on a string that no longer appears anywhere in the real output.

## Sequencing with related work

This item was sequenced to land before or together with `tsk-2ie5`,
since `tsk-2ie5` is expected to be the first item to create a executor
`kind` outside `cli` — exactly the case the widened gate exists to catch.
Landing the gate widening first (or alongside) means that first
non-`cli` executor is gated from the moment it exists, rather than
repeating the same silent-gap history this item itself was fixing.
