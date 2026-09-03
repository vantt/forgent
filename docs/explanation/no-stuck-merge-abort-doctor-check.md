---
authoritative_for: git merge --abort itself failing, main checkout stuck half-aborted, no-stuck-merge-abort doctor check, fgos main-checkout-reset --sha --confirm
---

# `git merge --abort` can itself fail — a doctor check now catches the stuck result

`tsk-40a` closed a distinct, empirically-confirmed failure class: `git
merge --abort` can itself fail and leave the shared main checkout stuck
in a broken, half-aborted git state — a different failure shape from the
silent data-loss mechanism [`tsk-1ji`](events-jsonl-opportunistic-truncation-check.md)
had already closed (availability/stuck-state, not silent loss).

## Found empirically, not speculated

Discovered during `tsk-1ji`'s own validating pass (Round 5, fixture 2),
reproduced against a real throwaway git fixture: `abortMergeIfPossible`
(`src/runner/merge.mjs`) runs `git merge --abort` whenever `MERGE_HEAD`
exists — one call site fires specifically when the merge staged a change
under `.fgos/` (the `merge=union` driver path for
`.fgos/events.jsonl`). The real repro: stage a merge touching
`.fgos/events.jsonl` via the union driver, then append a further
uncommitted line to `events.jsonl` on top of that staged content
(simulating a concurrent `appendEvent` landing in the same window), then
run `git merge --abort`. **The abort itself failed** with exit 128
(`error: Entry 'events.jsonl' not uptodate. Cannot merge.` /
`fatal: Could not reset index file to revision 'HEAD'`), leaving
`MERGE_HEAD` and a half-reset index behind on disk. The existing
try/catch wraps this into a thrown `MergeError`, but nothing recovered
the broken git state — every subsequent `fgOS` verb needing the main
checkout's working tree could be blocked until a human manually ran
`git merge --abort`/`git reset --merge` by hand.

## Confirmed distinct from an adjacent item

Named as related but genuinely different from `tsk-2qp`'s lock-scope bug
(adjacent, attached as a dependency): `tsk-2qp` describes a
self-recovering-via-retry symptom (a lost lock mid-merge, retry
succeeds); this item describes a **persistent** broken half-aborted state
that does not self-resolve on retry.

## What shipped — detect-only, never auto-mutate

A `no-stuck-merge-abort` doctor check/fix pair
(`src/setup/registrations.mjs`). The check inspects `MERGE_HEAD` on the
main checkout and fails when one is present, naming the exact recovery
command. **The fix deliberately never mutates git state itself** — it
always returns `changed: false`, printing the same recovery command
(`fgos main-checkout-reset --sha <sha> --confirm`) rather than running
it. Rationale recorded directly in the fix's own comment: unattended
automation must never mutate the shared main checkout's git plumbing
without a human reviewing real `git status` first — the same detect-and-
warn-never-block philosophy `tsk-24e`'s D1 already established for the
truncation guard, applied here to a different failure class.

## What's still open

Discovery's own stated question — how often this can realistically
trigger in production — is not answered by this item; the fix is a
detection/diagnosis improvement (turning a confusing downstream git
error into a plain, named doctor finding), not a guarantee this
particular failure mode is now rare or prevented.
