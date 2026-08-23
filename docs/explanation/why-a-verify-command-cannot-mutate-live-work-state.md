# Why a `verify` command cannot itself mutate live work state

An item's `verify` field is meant to prove the item's own change is
correct — deterministic, safe to re-run any number of times, and blind to
whatever else is happening in the shared `.fgos/` store at the moment it
runs. `tsk-4j9-4`'s auto-decomposed verify command broke that assumption
outright: `node --test test/state/impact.test.mjs && node bin/fgos.mjs
merge next` — the second half is not a check, it is the real feature
being built, invoked directly against production data.

## What actually happened

`fgos return <id>` proves an item by running its `verify` command inside
an **ephemeral, disposable worktree** checked out at the branch's own
commit (`bin/fgos.mjs`'s `return` case, the "no cwd-clean requirement...
tree người là việc của người" branch) — never the caller's real main
checkout. `approve` (which `merge next` recurses into, per
`docs/history/merge-standardization/CONTEXT.md` D6) has its own
structural guard, `isMainWorktree(repoRoot)`, that refuses to run from
any worktree other than the true main checkout — correctly, since a merge
landing inside a throwaway ephemeral worktree would be silently
discarded the moment that worktree is removed.

Put those two together and the verify command was doomed by
construction: every time `return` proved `tsk-4j9-4`, it ran `merge next`
for real against the live `.fgos/` store, `merge next` picked whatever
real item happened to be ready at that moment, tried to `approve` it, and
`approve`'s own worktree guard refused — because the check itself was
running from exactly the kind of ephemeral worktree that guard exists to
reject. The observed failure:

> goal-check failed on branch "fgw/tsk-4j9-4" (exit 4)

This is not a flake and not something a retry fixes — it fails the same
way every time, for the same structural reason.

## Why this is safe, not silently damaging

Nothing was actually merged during the failed attempts: `approve`'s
worktree-identity guard runs *before any git mutation*, so the refusal
happens before a single command touches a real branch. Confirmed
empirically — every item that was `proposed`-and-ready at the time
(`doc-fgos-rollup-howto`, `str89-case-study-executing`, `tsk-1os`)
was unchanged afterward.

## The fix, and the general lesson

The verify command was edited directly (`fgos edit tsk-4j9-4 --verify
"node --test test/cli/fgos.test.mjs"`) to the real, comprehensive,
side-effect-free test suite already written and passing for this item —
a stronger check than the original, not a weaker one. This mirrors a
precedent already recorded elsewhere in this store (`tsk-5q5`: an
auto-generated verify/acceptance can be wrong or non-executable and gets
corrected via `fgos edit --verify`/`--acceptance` during
`fgos-coding-validating`/`fgos-coding-implement`, never invented from a guess, never
silently weakened).

The general rule this confirms: a `verify` command must exercise the
item's OWN change in isolation — never a live CLI invocation of the
actual feature against the shared, ever-changing production store it
operates on. If the feature being built is itself an action verb (here,
"merge the next ready item"), its test suite — built with hand-constructed
fixture state, exactly like every other verb's tests in this repo — is
the thing verify should run, not the verb itself pointed at real data.
