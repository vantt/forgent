---
authoritative_for: fgos return's ephemeral branch-source verify worktree never stripping checked-out .fgos/, ADR0020 exemption check failure, deterministic not flaky, discovered while driving tsk-34o5
---

# The one worktree `createWorktree`'s `.fgos/` strip never reached — because it wasn't made by `createWorktree`

`tsk-26r` fixed a deterministic (not flaky) test failure in `fgos
return`'s own branch-source re-verify path: its ephemeral, detached
`tmpWorktree` (`git worktree add --detach`) never stripped its
checked-out `.fgos/` tracked files the way `createWorktree`
(`src/runner/worktree.mjs:573`) already does per ADR0020.

## Found while driving an unrelated item

Discovered while driving [`tsk-34o5`](dispatch-attestation-level-2-enforcement-halt.md)
(the attestation-guard implementation) — that item's own implementation
was complete and verified green (199/199) when run directly, yet
deterministically failed the exact same suite when it went through
`return`'s branch-source re-verify path. Reproduced 3/3 times against
that same verified-green implementation, confirming an environment bug
in `return`'s own ephemeral-worktree setup rather than a flake in
`tsk-34o5`'s own code.

## The mechanism

Because `.fgos/` is git-tracked in this repo, `git worktree add --detach`
checks out whatever `.fgos/` content existed at `branchHead` — a snapshot
already stale the moment `main` records another event, and one this
disposable verify worktree had no legitimate reason to read or write in
the first place (mirroring `createWorktree`'s own `finishWorktreeSetup`
rationale for stripping it there). Left in place, that checked-out copy
deterministically tripped `test/cli/fgos-return.test.mjs`'s own
main-checkout-cleanliness / `.fgos`-dirty-tree exemption checks (three
specific pre-existing assertions) for any item whose verify happened to
route through this particular path — even though the identical verify
command passed reliably everywhere else.

## What shipped

`bin/fgos.mjs`'s branch-source re-verify path now strips `.fgos/` from
the ephemeral `tmpWorktree` right after checkout and before verify runs —
the exact same strip `createWorktree` already performs for every normal
worker worktree, applied here for the first time to this one previously
uncovered ephemeral case. A regression test proves the ephemeral
worktree never carries a checked-out `.fgos/`, matching how every other
worker worktree already behaves. A separate, unrelated pre-existing
git-hash mismatch in the suite's own FIRST-pick test was noted directly
in the commit history as unrelated to this fix, not folded into scope.
