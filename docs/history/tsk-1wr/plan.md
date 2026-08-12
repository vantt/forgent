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

None as originally scoped (the coverage-gap test above). One new question
surfaced once the test went live and is answered in the addendum below.

## Addendum (2026-08-12): the red test surfaced a real design question, now answered

Running the file did not just close the coverage gap — the fourth test came
back genuinely RED against real code, not flaky: `withMergeTargetSlot`'s
identity is `resolveWriterIdentity`'s env-derived session id
(`session-identity.mjs:135-138`), which every forked child inherits
byte-identically, and `main-checkout-lock.mjs`'s self-recognition branch
(`record.pid === identity`, D6) treats that as "the same writer returning" —
so two genuinely separate OS processes sharing one session id do not
exclude each other for the same target ref.

**Is this a real scenario, not just a theoretical one?** Yes — this
session's own subagent fanout hit the same-shaped bug independently
(unpinned subagents inheriting one session id, fixed by assigning each a
distinct `BEE_SESSION_ID`), and `fgos-fanout`'s documented behavior (batch
`Agent` dispatch, auto-approve of sibling leaves sharing one root/target)
is exactly the shape that would trigger it here too.

**Locked decision: targeted fix, not a wider identity-model change.**
`acquireMainCheckoutLock`/`tryAcquireOnce` gained `allowSelfRecognition`
(default `true` — every existing caller is byte-identical). `withMergeTargetSlot`
passes `allowSelfRecognition: false`. Safe because this lock is always
released in the same call that acquired it (`finally` in `withMergeTargetSlot`),
so there is no legitimate same-identity re-entry to protect for this call site —
unlike `main-checkout.lock`'s own use (a session refreshing across several
back-to-back operations), which keeps its existing behavior untouched.
Rejected: switching the slot to per-process identity — the item's own text
already flagged that `isPidAlive`/stale-reclaim assume a numeric identity,
a wider blast radius for a narrower gain.

The four-test file now passes 4/4 against the fix. Full suite green
(see Iron Law evidence). Branch caught up with `main` (merge, not rebase —
the branch already carries its own commits) before the fix, since `main`
had moved well past this branch's original fork point.
