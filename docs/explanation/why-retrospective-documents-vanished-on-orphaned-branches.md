# Why retrospective documents vanished on orphaned branches

`tsk-3ts` started from a scan finding 36 of 182 recorded `docPath` values
pointing at files absent from the tree — end-user documents that
`fgos-coding-compounding` had tagged as written, but that did not actually exist
on disk. The source request that opened the item:

> Retro-loop sweep ghi tai lieu end-user len work branch roi de mo coi,
> trong khi outcome record van len main - 34 tai lieu bien mat am tham.

## The root cause was a write path, not a merge accident

The `retrospective` status exists to produce end-user documentation (D11
of `work-item-status-delivered-retrospective-cleanup`). But by the time a
document may legitimately be written, the item's branch has **no
remaining merge door**: `fgos compound` requires status `retrospective`
(downstream of `delivered`), and `approve` refuses any item not at
`awaiting-approval`. A document written to the item's own branch at that
point has no normal path back to main — not the ADR0020 `.fgos/` merge
refusal, and not the later branch rewrites that eventually orphaned the
commits. Those were downstream effects of a structural gap, not the
cause.

Three commits carried the documents into that gap:

- `c7a3282` "chore(fgos): retro-loop sweep - synthesize 14 retrospective
  items" — 14 files, never on main
- `1835c10d` "chore(fgos): retro-loop sweep - synthesize 12 more
  retrospective items" — 12 files, never on main
- `52e84193` "chore(fgos): retro-loop sweep - synthesize final 5
  retrospective items" — 8 files, never on main

Meanwhile `.fgos/events.jsonl` and `.fgos/entropy-history.jsonl` — in the
very same commits — reached main through a separate state-sync path. So
the outcome record's tag survived while the document it named did not.
34 of the 36 missing files were later recovered from those three orphaned
commits (commit `d955217`). One (`docs/how-to/check-main-checkout-lock-
status-before-retrying.md`, from `tsk-5z2`) was in no commit at all — it
had to be regrown from source material, not restored. One more was a
stale path left over from a file rename, not an actual loss.

## Why the write-then-tag order made the loss undetectable

`fgos-coding-compounding`'s own step order made the gap invisible while it was
happening: step 3 wrote the document at a cwd-relative path, and step 4
tagged it — meaning the tag necessarily preceded (or at best coincided
with) a file that had already been written wherever the session
happened to be standing, "often still inside the item's worktree right
after its own `return`." Step 5 ("confirm the close") checked that the
document existed on disk — which passed for all 34 stranded files,
because they did exist, just in the worktree that was about to become
unreachable. A `fgos doctor`-style check was rejected as the fix for the
same reason: doctor is opt-in, and a guard nobody remembers to run is not
a guard.

## The fix: write first, tag second, fail closed at the tag

Three decisions closed the gap:

- **Write location is no longer tied to where the session stands.** The
  document is always written and committed at the main checkout, resolved
  the same way `.fgos/` state already is
  (`git rev-parse --path-format=absolute --git-common-dir | xargs
  dirname`), regardless of whether the invoking session is inside a
  worktree.
- **The step order inverted.** The document is written and committed at
  the main checkout *before* `fgos compound` records its tag — not after.
  This turns "a tag exists ⟹ its document exists on main" from something
  checked (too late, and only informally) into something structurally
  impossible to violate.
- **`fgos compound` refuses at the door.** It now rejects a `--doc-path`
  whose file is not present *and committed* at the main checkout's
  `HEAD` — untracked and staged-only files are rejected the same as
  absent ones:

  ```
  compound: --doc-path "<path>" is not committed at the main checkout's
  HEAD ("<repoRoot>") — write and commit the document there before
  tagging it.
  ```

This mode was chosen deliberately over cheaper alternatives: validating
only at the skill's own "confirm the close" step was rejected because
that step is prose, not an enforced door — the same class of gap that let
all 34 documents through in the first place. Opening a new merge door for
`delivered`/`retrospective` items was rejected as a lifecycle change out
of proportion to the defect, though it would remain the honest answer if
post-merge worktree reuse is ever wanted as a first-class capability.

## What this doesn't cover

The `cleanup` stage's own defects (a separate family, `tsk-1q1` and its
children) are out of scope here. Whether `docPath` should follow a file
rename is deferred — one stale path out of 155 distinct paths did not
justify a general rename-tracking mechanism on its own. And a `doctor`
sweep over historical records remains a possible later addition, not a
substitute for the fail-closed check above.
