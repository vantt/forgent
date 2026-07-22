---
type: explanation
title: Design safeguards in fgOS's runner — anti-loop breakers, model-judgment fail-safes, and guard ordering
tags: [runner, anti-loop, guard-ordering, execution-safety]
timestamp: 2026-07-22T00:00:00.000Z
source_capture_ids: []
---

# Design safeguards in fgOS's runner — anti-loop breakers, model-judgment fail-safes, and guard ordering

## A fix has to be re-checked against what the runner does today

The runner's anti-loop circuit breaker exists to stop a stuck item from
looping forever. A fix proposed against a specific finding (the breaker was
unreachable under some condition) had already been diagnosed and a specific
change proposed — but before applying it, re-reading the runner's current
source (rather than the state it was in when the finding was written) turned
up that a sibling change had, in the meantime, moved the runner from
dispatching one item at a time to dispatching several concurrently, where a
halt now stops the *whole batch* rather than just the one item that tripped
it. Applying the originally proposed fix unchanged would have silently
introduced a new "one flaky item halts everything" behavior that nobody had
evaluated. The rule this settles: before applying any proposed fix to
already-reviewed code, check whether the code has moved since the review was
done, and if it has, re-verify both the finding and the fix against current
source — a fix's text can stay literally correct while the consequence of
applying it changes entirely underneath it.

## The runner's first model-judgment call had to be exhaustively fail-safe

The runner makes calls to a model for at least one kind of decision that is a
genuine judgment call, not a dispatched worker whose output gets independently
goal-checked afterward. Because there's no independent check downstream for
this kind of call, the function wrapping it (spawn the model, parse its
output, decide) was built to fold every possible failure shape — a spawn
error, a non-zero exit, unparsable output, a wrong-typed field — into the same
safe default, so that no version of "the model call went wrong" can propagate
an unsafe or malformed decision further into the runner. This was proven not
by reasoning about the code or a narrow spike, but by an end-to-end scenario
that fed genuinely malformed output through the real binary — the specific
failure mode a hand-written unit test tends not to generate on its own,
because it requires actually simulating the model behaving badly rather than
assuming it behaves as documented.

## Relocating one guard can silently reorder another

fgOS's CLI verbs sometimes carry more than one structural guard on the same
code path. Fixing a bug where one guard was being skipped by an early-return
branch (a structural check that should run before a `--github`-specific branch
returns early, but didn't) looked like a one-line hoist: move that guard above
the branch. That fix was correct for the path the bug was found on, but a
second guard already sat *below* the same branch, specifically for the
non-github, local path — and that second guard's relative position to the
first mattered for callers that never enter the `--github` branch at all.
Hoisting only the first guard would have flipped the two guards' order for
every local caller, changing which check produces the first failure message.
The rule: when relocating a check to run earlier than a conditional
early-return branch, list every other check positioned near that branch and
verify the relocation's effect on every call path that does *not* enter the
branch, not only the one the fix was written for. If two checks must move
together to preserve their relative order for the paths that skip the branch,
they get relocated as one unit.

---

**Source:** `docs/history/learnings/critical-patterns.md` —
[20260718] "Before applying a review finding's proposed fix, check whether the
touched code drifted since the review's frozen head commit" (feature
phase2-p1-breaker-inert-fix);
[20260716] "First headless model-judgment call — exhaustive fail-safe, proven
via real garbage-output e2e" (feature stage-clarify);
[20260718] "Relocating a guard past a conditional early-return branch can
silently reorder OTHER guards for call paths that never enter that branch"
(feature approve-worktree-guard-github-fix).
