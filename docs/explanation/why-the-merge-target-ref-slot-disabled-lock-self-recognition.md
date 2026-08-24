---
type: explanation
title: Why the merge target-ref slot disabled lock self-recognition
tags: [merge, lock, self-recognition, concurrency, session-identity]
source_capture_ids: [tsk-1wr, tsk-70l]
authoritative_for: why withMergeTargetSlot passes allowSelfRecognition false while main-checkout.lock keeps self-recognition enabled
---
# Why the merge target-ref slot disabled lock self-recognition

`tsk-1wr`, a coverage-gap test for the target-ref merge lock introduced
by `tsk-xyr` (`docs/explanation/why-merge-was-a-single-lane-funnel-under-a-16-lane-dispatch-pipeline.md#d7-lock-merge-by-target-ref-not-a-global-concurrency-cap`).
It was submitted as "add a two-process test," and the test itself
surfaced a real design gap rather than just proving an existing claim.

## What the test proved

`withMergeTargetSlot` (`merge.mjs:768`) takes its identity from
`resolveWriterIdentity(fgosDir).id` (`session-identity.mjs:135-138`),
which returns the *env* session id when one is set — and every forked
child process inherits that value byte-identically. Measured directly:
two separate OS processes, different pids (`1527539` and `1527553`),
resolved to the identical identity `a43ed98f-...`, source `env`.

`main-checkout-lock.mjs`'s self-recognition branch (`record.pid ===
identity` at line 238) treats a matching identity as "the same writer
returning" and grants the lock again. Combined with the identity
collision above, two genuinely separate processes sharing one session id
did not exclude each other for the same merge target — the exact
guarantee the target-ref lock exists to provide.

Three of the four new tests
(`test/runner/merge-target-slot-multiprocess.test.mjs`) passed straight
away (isolation by target ref, lock filename, release on process death).
The fourth came back genuinely red against real code — not flaky.

## Why this was a real gap, not a theoretical one

This was not written off as an edge case: the same investigating
session's own subagent fanout had independently hit the identical shape —
unpinned subagents inheriting one session id, fixed there by assigning
each a distinct `BEE_SESSION_ID`. `fgos-fanout`'s own documented
behavior (batch `Agent` dispatch, auto-approve of sibling leaves sharing
one root/target) is exactly the shape that would trigger this bug for
real merges too.

## Was this a bug in `tsk-xyr` itself, or scope creep into a design question?

Neither, by careful reading. A scan of every locked decision across
`tsk-51m` and `tsk-xyr`'s own `DISCUSSION.md`/`plan.md`/`CONTEXT.md`
found no statement that two merges from the *same* session should
exclude each other — the parallelism the design targeted was always
per-target-ref, implicitly *between different sessions*. `tsk-xyr` had
also reused self-recognition consciously (its own `plan.md:79`: "same
stale reclaim, same self-recognition, same TTL semantics — only the
filename varies"), so this was never a design defect in the original
item — it was a genuinely new question the new coverage exposed for the
first time.

## The fix: narrow the change to the one call site that needed it

`acquireMainCheckoutLock`/`tryAcquireOnce` gained an
`allowSelfRecognition` option, defaulting to `true` — every existing
caller stays byte-identical. `withMergeTargetSlot` is the one caller
that passes `allowSelfRecognition: false`.

This is safe specifically for this call site because the target-ref slot
is always released in the same call that acquired it (`finally` inside
`withMergeTargetSlot`) — there is no legitimate case where the *same*
logical writer needs to re-enter its own held slot mid-operation, so
disabling self-recognition here costs nothing real. `main-checkout.lock`
keeps self-recognition enabled precisely because its own use case is
different: a single session refreshing the lock across several
back-to-back operations, where the same identity genuinely does need to
re-acquire what it already holds.

**Rejected alternative**: moving the slot to per-process identity
instead of per-session. Rejected because `isPidAlive`/the existing
stale-reclaim logic already assume a numeric pid-shaped identity — a
wider blast radius across the whole lock module for a narrower actual
gain than the one-flag, one-call-site fix above.

## The sibling gap on the root→main path (`tsk-70l`), and why a bare flag flip was rejected

`tsk-1wr`'s own fix only touched `withMergeTargetSlot` (`merge.mjs:778`).
A sibling call site, `merge.mjs:886`'s `acquireMainCheckoutLock` — the
branch `mergeRunnerItem` uses when `item.parent` is `null` (a root
merging directly into `main` via `sync-root`/`approve`, no ephemeral
worktree, e.g. `tsk-51m`/`tsk-kv3`/`tsk-60h`) — never got
`allowSelfRecognition: false`. `tsk-1wr`'s own plan addendum had
deliberately left this path's self-recognition on, reasoning that this
particular lock is used for one session refreshing across several
back-to-back operations (a pre-commit hook's child `git commit` process
recognizing its own parent as a legitimate same-session re-acquire).

But every root item in the very same `tsk-51m` batch — `tsk-51m`,
`tsk-kv3`, `tsk-60h` — is exactly `parent: null`, routing through this
exact unguarded path. Two independent root→main `approve`/`sync-root`
calls (real, separate OS processes, not one session refreshing itself)
sharing one inherited session id — the same fanout-inheritance shape
`tsk-1wr`'s own addendum had already called "not just theoretical" —
would self-recognize as the same writer and fail to exclude each other,
risking two processes writing to the shared main checkout at once. This
is suspected as the previously-unexplained root cause behind `tsk-22c`
(a `git commit --no-edit` failure, exit 9, verify already passed,
suspected `index.lock` held by another process) — a decision link was
attached at post-batch audit time, though only `tsk-22c`'s own
blind-release half (`releaseMainCheckoutLockIfOwn`) had been fixed there;
this self-recognition half needed its own design, not a one-line patch.

**Why simply mirroring `tsk-1wr`'s flag was rejected.** A bare
`allowSelfRecognition: false` at line 886 would regress the legitimate
same-session case `tsk-1wr` had preserved on purpose: that flag skips
the equality check entirely rather than substituting anything smarter,
so a genuine same-session crash-retry (the pre-commit hook re-entering
its own held lock) would wait out the full TTL instead of resuming
immediately — trading one bug for a different, worse one on the hot
path every root→main merge takes.

**Locked fix**: replace the plain session-id-string identity on this
lock with a **pid-liveness-checkable** identity, mirroring the pattern
`claim-port.mjs`'s own `identity: process.pid` already uses on this same
lock file. `isPidAlive` can then tell a live fanout sibling (a different,
live pid — real exclusion) apart from a crashed same-session holder (a
different, dead pid — immediate reclaim is still safe) — a distinction a
bare string-identity equality check structurally cannot make. The nested
pre-commit hook recognizes its own parent specifically through an
explicit env var set *only* on the one `execFileSync` call that spawns
`git commit` (`shell: false`, no intermediate shell hop) — never a
global `process.env` mutation that could leak the recognition signal
somewhere it shouldn't apply.

**Rejected alternatives**: a `ps`-based ancestor-pid walk (would put
`ps` availability on the hot path for every root→main merge, specifically
for the agent/subagent population that already always carries a
`BEE_SESSION_ID`/`CLAUDE_CODE_SESSION_ID` and today never needs that
fallback at all — a missing/restricted `ps` would break every merge, a
worse failure mode than the bug being fixed); and widening
`tryAcquireOnce`'s own self-recognition equality branch to parse a
composite identity (touches exclusion-critical logic this fix can avoid
touching entirely, for no benefit over the explicit env-channel design).

## Verification shape

The fix is proven failing-test-first: the fourth multiprocess test was
red against the real (unfixed) code before the `allowSelfRecognition`
change, and 4/4 green after. The branch was caught up with `main` via a
real merge (not a rebase — it already carried its own commits) before
landing, since `main` had moved well past the branch's original fork
point by the time this surfaced.
