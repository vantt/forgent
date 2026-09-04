---
authoritative_for: fgos main-checkout-reset's safety guard (assertSafeMainCheckoutReset, src/runner/main-checkout-reset-guard.mjs) only checking working-tree dirtiness before allowing `git reset --hard <sha>` on the shared main checkout, never whether target sha is behind already-committed work; the real 2026-08-26 incident where two concurrent sessions' commits were silently discarded on a clean tree with zero ancestor check; and the ancestor/commit-loss check added to close that gap
---

# A clean tree isn't a safe tree — the main-checkout-reset guard only checked one of the two ways to lose work

`tsk-1ck` fixed a gap in `assertSafeMainCheckoutReset`
(`src/runner/main-checkout-reset-guard.mjs`), the safety guard for
`fgos main-checkout-reset`'s `git reset --hard <sha>` on the shared main
checkout. Before this item, the guard only asked one question: is the
working tree dirty? If the tree was clean, the reset was permitted
unconditionally — even without `--confirm` — with zero check for whether
`--sha` was behind real, already-**committed** commits.

## The real incident that exposed it (2026-08-26, ~13:44–13:49 UTC)

Two concurrent sessions each committed directly to the shared main
checkout on top of merge commit `16e9cff4`: one a `.fgos/config.json` flip
(`6c5538cb`), the other a `src/runner/dispatch/cli.mjs` +
`test/runner/dispatch.test.mjs` refactor (`26d16fbd`). ~38 seconds after
the second commit landed, something reset main back to `16e9cff4` (git
reflog: `reset: moving to 16e9cff4` at 13:49:04 UTC), discarding both
commits from main entirely. Both were recoverable only because they were
still dangling git objects, not yet garbage-collected — pure luck of
timing, not a designed safety net. The `.fgos/config.json` commit was
recovered via `git cherry-pick 6c5538cb` (now `1ffc61a0`); the other
session's `26d16fbd` was deliberately left untouched, per the user's
explicit choice not to touch another session's work without their own
context.

The engine's own truncation-guard caught a *side effect* of this on
`.fgos/events.jsonl` (`.fgos/logs/main-checkout-guard-warnings.jsonl`
logged content-mismatch/regressed entries at 13:55:49 UTC, permanently
losing this session's own `tsk-3vz` submit/edit/move events, seq 62–64)
— but nothing caught or prevented the loss of the two real *source*
commits themselves. That truncation-guard is scoped specifically to
`.fgos/events.jsonl` (the already-investigated
`docs/history/events-jsonl-git-tracked-truncation/` class, `tsk-cgg`),
not to arbitrary tracked source commits on the shared main checkout.

It could not be determined from available logs whether the destructive
reset was invoked via `fgos main-checkout-reset --sha 16e9cff4`
specifically, or a raw `git reset --hard 16e9cff4` bypassing fgos
entirely (`AGENTS.md` warns against the latter only in prose, not enforced
by any hook). Either way, the guard as it existed would not have blocked
either path once the tree was clean.

## Why this was a second incident of the same underlying habit

`tsk-3au`'s own `main-checkout-reset` verb was built specifically to
prevent "a session running `reset --hard` after checking only the 3 files
it meant to touch, discarding other in-flight sessions' work" (per the
guard file's own header comment) — but its actual check only defended
against **uncommitted** work. This incident is a broader, more severe
variant: two sessions' already-**committed** work getting discarded by a
reset to a stale/captured sha, the exact case the guard's own stated
purpose implied it should catch but didn't.

## What shipped

`assertSafeMainCheckoutReset` (`src/runner/main-checkout-reset-guard.mjs`)
gained a `lostCommitCount`/`lostCommits` parameter alongside the existing
`dirty`/`confirmed` — the caller (the `main-checkout-reset` CLI verb,
`bin/fgos.mjs`) now computes how many committed commits ahead of the
target sha would be discarded, not just whether the tree is dirty. Without
`--confirm`, the guard now refuses in three cases: dirty tree with lost
commits, dirty tree alone, or a clean tree that would still discard
committed commits — the exact gap this incident exposed. Each refusal
names the commit count and the target sha in its error message, not just
"uncommitted changes."

Two pre-existing `fgos-claim` tests (`test/cli/fgos-claim.test.mjs`) that
asserted the *old* unsafe behavior (reset past committed commits on a
clean tree, no `--confirm`, no error) were fixed to assert the new safe
behavior instead — not weakened or skipped.

`docs/how-to/safely-reset-the-main-checkout.md` was updated to describe
the ancestor/commit-loss check alongside the pre-existing dirty-tree
check.

## Explicitly left open

The suggestion to consider whether a *raw* `git reset --hard` on the main
checkout (bypassing `fgos main-checkout-reset` entirely) should be caught
by a git hook — not just warned against in `AGENTS.md` prose — was raised
but left for discovery/planning to judge on a future item; this item's own
scope was the guard's decision logic and its two callers, confirmed
pass-through with no further split per the item's own `plan.md` Approach.
