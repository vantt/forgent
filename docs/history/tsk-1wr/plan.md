# plan.md — tsk-1wr: two-real-process proof for the merge target-ref slot

Mode: tiny

## What gap this closes

`docs/history/tsk-xyr/iron-law-evidence.md` discloses two gaps. This item
closes only the second, which is a real **coverage** gap rather than an
ordering one:

> every concurrency claim below is proven at the **unit/async level** (two
> `Promise`s racing the real lock files on a real disposable git repo …) —
> not with two genuinely separate OS processes invoking the real `fgos` CLI
> concurrently.

The first gap in that file (not failing-test-first) is an ordering fact about
history and no new test can change it. Out of scope here, and deliberately not
claimed as closed.

## Why it is worth a real test rather than an argument

`tsk-xyr` is a self-declared hard-gate data-loss item: it changes which lock
protects the `git branch -f` ref move that `tsk-46a`/`tsk-2cd` already lost
real work to. The evidence file argues the mechanism (`wx`-atomic create +
`link(2)`) cannot distinguish one process from two. That argument is
plausible, and it is still an argument — the whole point of a lock is the
cross-process case, and the identity the lock records is **not** the pid:
`resolveWriterIdentity` (`session-identity.mjs:135-138`) returns the *env*
session id when one is set, which two forked children inherit **identically**.
Two processes therefore contend under the same `identity`, a shape no
same-process test reproduces by construction.

## Approach

One new file, `test/runner/merge-target-slot-multiprocess.test.mjs`, forking
real child processes that each call `withMergeTargetSlot` against the same
`targetRef` on a shared disposable repo, plus a distinct-target control.

Harness follows `test/state/events.test.mjs`'s own fork pattern (child script
written into the test's `workDir`, children released together) — no new
technique invented here.

## Not reproducing the known flake class

`test/state/events.test.mjs`'s fork test is exactly what `tsk-3wn` had to fix
for load-sensitivity, and `tsk-597` is open on the same class in
`porting-store`. Three rules this file follows:

- **Two children, not twenty.** Mutual exclusion is a two-party property; N
  processes prove nothing extra and cost wall-clock linearly.
- **No wall-clock barrier and no fixed sleep.** Children synchronise on the
  lock's own outcome, and the parent waits on child exit, never a timeout.
- **Assert on outcome counts, never on timing.** "Exactly one acquired" holds
  whatever the scheduler does.

## Verify

```
node --test test/runner/merge-target-slot-multiprocess.test.mjs && npm test
```

Red before: the file does not exist, so `node --test` exits non-zero.

## Outstanding questions

None.
