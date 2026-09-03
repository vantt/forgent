---
framework: diataxis
mode: explanation
---
# Why `acquireMainCheckoutLock`'s release-on-exit is opt-in, never the default

`.fgos/main-checkout.lock` (`src/runner/main-checkout-lock.mjs`) is held two
different ways by two different kinds of caller, and those two ways want
opposite behavior when the holding process exits.

## The two callers, and why they disagree

`.githooks/pre-commit` acquires (or refreshes) the lock on every `git
commit` against a real main checkout, and — by design — never releases it
itself. TTL expiry (`DEFAULT_TTL_MS`, 3 minutes) is the *only* intended way
that lock ever clears after a commit. A session that commits several times
in a row refreshes the same lock each time; the lock is meant to survive
each individual commit's own hook process exiting normally in between.

`claimWork` (`src/runner/claim-port.mjs`) and `mergeRunnerItem`
(`src/runner/merge.mjs`) hold the lock for the opposite reason: their own
job is genuinely *over* once their process exits, so releasing the lock
immediately — including on a crash or `SIGINT`/`SIGTERM` — is strictly
better than making the next writer wait out the TTL for no reason.

## What went wrong when release-on-exit was the default

The first implementation of this item (tsk-45z) registered
`process.on('exit'/'SIGINT'/'SIGTERM', ...)` unconditionally inside
`acquireMainCheckoutLock`'s `ACQUIRED` branch, on the assumption that
Node's `exit` event only fires on a crash. It does not — `exit` fires for
*every* process termination, including a clean, successful
`process.exit(0)`. Since `.githooks/pre-commit` calls `process.exit(0)`
immediately after a successful acquire, the unconditional handler deleted
the very lock the hook had just written, the moment the hook process
exited — on every single commit.

Running the real test suite (`npm test`) surfaced this immediately as three
genuine e2e failures in `test/e2e/main-checkout-lock-hook.test.mjs`:

```
✖ a git commit is refused when a fresh lock is held under a different identity (concurrent session)
  AssertionError [ERR_ASSERTION]: Expected "actual" to be strictly unequal to: 0

✖ a commit inside a real detached git worktree writes the lock at the worktree's own .fgos, not under its hooks directory
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  false !== true

✖ a commit still succeeds after the identity shape change, and the lock records a usable token
  Error: ENOENT: no such file or directory, open '/tmp/fgos-main-checkout-hook-e2e-repo-W6FuHa/.fgos/main-checkout.lock'
```

The third failure is the clearest signature: the lock file was gone
(`ENOENT`) immediately after a commit that should have left it in place for
the TTL window.

This is not a hypothetical risk — it recreates exactly the STR65
concurrent-writer race the lock exists to prevent. If release-on-exit fired
between two commits of the *same* session, a second session's commit could
slip into that now-unlocked gap.

## The fix: `releaseOnExit`, opt-in, default `false`

`acquireMainCheckoutLock(dir, { ..., releaseOnExit = false })` only
registers the `exit`/`SIGINT`/`SIGTERM` listeners when the caller explicitly
opts in. `.githooks/pre-commit` never passes it, preserving its intentional
lingering-lock design. `claimWork` and `mergeRunnerItem` both pass
`releaseOnExit: true`, since their own job really is over when their
process exits.

A caller that opts in must also route its own cleanup through the returned
`release()` closure — not the raw `releaseMainCheckoutLock(dir)` function —
because `release()` is what unregisters the crash-safety listeners too.
`claimWork`'s own `finally` originally called the raw function directly;
left uncorrected, that would leak three listeners per claim in a
long-running process (like the fgOS runner) that claims many items in
sequence.

## The regression test that pins this down

`test/runner/main-checkout-lock.test.mjs` now asserts the opt-in contract
directly, by name:

> "acquire does NOT register exit/SIGINT/SIGTERM listeners by default
> (releaseOnExit omitted) — required for `.githooks/pre-commit`'s
> intentional lingering-lock design"

and its mirror:

> "a held lock acquired WITHOUT releaseOnExit survives the holding process
> exiting normally (the `.githooks/pre-commit` contract)"

Both exist specifically so a future change to this default can't silently
reintroduce the same regression without a test noticing first.
