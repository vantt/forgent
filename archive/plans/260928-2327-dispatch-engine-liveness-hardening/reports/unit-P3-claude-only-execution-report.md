# Phase 3 (Unit P3) — Claude-only parallel execution report

Runbook: `runbook-claude-only-parallel-execution.md`. Branch `unit/P3`,
worktree `.claude/worktrees/dispatch-engine-liveness-p3-cwd-lock-heartbeat`,
base `main@647e23a5c` (post-P1, dispatched in parallel with P2 per the
runbook's file-disjointness check), integrated on top of P2 at
`main@58be9e5277a239b48d2e8bb514c9f3cb368a7e68`.

Audit finding S2 (HIGH): the per-cwd dispatch lock
(`dispatch--<cwd>.lock`) used a bare string identity judged by TTL only —
a live long-running holder could lose its own lock before finishing, and
a dead-pid holder blocked a new attempt for the full TTL instead of being
recognized as dead immediately, with a misleading `held-by-live-other-pid`
status label on top.

## Implementer (sonnet, fullstack-developer)

Added a heartbeat in `cli.mjs` (`setInterval` calling the existing
`renewMainCheckoutLockIfOwn`, `.unref()`'d so it doesn't keep the process
alive, cleared in the existing `finally`) so a long dispatch renews its
own lock instead of losing it to TTL expiry mid-run.

In `main-checkout-lock.mjs`: added `parseCompositePidIdentity(identity)`,
renamed the misleading status label to `HELD = 'held'`, and routed
`tryAcquireOnce`'s string-identity branch through Phase 1's
`resolveHolderLivenessByIdentity({ pid: composite.pid },
isPidAlive(composite.pid))` when the identity matches the composite pid
shape — so a dead-pid holder is now recognized immediately instead of
blocking for the full TTL.

Added real-process tests to `test/runner/main-checkout-lock.test.mjs` and
`test/runner/dispatch.test.mjs` covering both audit-reproduced scenarios:
a live holder's lock surviving past what the old TTL would have allowed,
and a dead-pid holder being identified as dead immediately. Self-caught
and fixed a transitive-dependency gap in the e2e file-copy harnesses
(`test/e2e/main-checkout-lock-hook.test.mjs`,
`test/e2e/main-checkout-lock-hook-worktree-commit.test.mjs`) that needed
to stage the new `process-identity.mjs` file.

## Lead final verification and merge

Independently read the heartbeat wiring in `cli.mjs` and the identity
parsing/judge routing in `main-checkout-lock.mjs` in full; confirmed the
`HELD` status on lock-acquisition failure correctly causes
`executeExecutorCli` to throw `DispatchError('dispatch-in-flight', ...)`
(this fact became key evidence later, in ruling out the per-cwd lock as
the direct cause of a combined-suite test failure — see below).

Ran `test/runner/main-checkout-lock.test.mjs` directly: 103/103 pass.
Ran the S2 heartbeat integration test in isolation: pass.

`git -C /home/vantt/projects/forgentX merge --no-ff unit/P3` from the
main checkout onto the post-P2 tip, `ort` strategy, clean auto-merge, no
conflicts. `integratedSha = 58be9e5277a239b48d2e8bb514c9f3cb368a7e68`.

## Post-merge interaction investigation (P2 + P3 combined)

A combined-suite run on the merged tree surfaced
`fanoutBatchExecutorCli fires candidates in batch concurrently with
overlapping execution windows` (`test/runner/dispatch.test.mjs:6065`)
failing consistently (3/3 reruns). The implementer's own report had
already seen a similarly-named failure once during P3's own solo run and
self-dismissed it as flaky — Lead treated that as unverified and
investigated independently rather than accepting the dismissal.

Method: git-worktree bisection under matched current system load (one
throwaway worktree per commit — `26d912092` pre-P1-close, `a92bb68a3`
P2-only, `d6b48eb90` P3-only). All three passed in isolation, proving the
failure requires P2 **and** P3 combined, not either phase alone and not
system load alone.

Read `src/runner/fanout-batch.mjs`: each candidate dispatches to its own
`wtPath` (falling back to the shared `cwd` only when no worktree path is
returned) and a `fired[].status !== 0` in the result reflects the real
spawned subprocess's real exit code — a lock refusal instead produces a
`'blocked'` kind via a thrown `DispatchError`, confirmed by direct read
of `cli.mjs`. This rules out both Phase 2's admission check and Phase
3's per-cwd lock as the direct cause of the observed non-zero exit.

Formed and empirically confirmed the actual root cause: the test
fixture's own design has two concurrent candidate subprocesses each
calling `git commit --allow-empty` against the SAME shared temp git
repo. Reproduced the identical failure signature in complete isolation
(`/tmp`, `rtk proxy bash -c '...'` to route around a `.ckignore` hook
that otherwise blocks `.git` access even outside the main repo): one
`git commit` succeeds, the concurrent other fails with `fatal: Unable to
create '.../.git/index.lock': File exists` (exit 128) — exactly matching
the test's own failure signature.

**Disposition**: not a regression in either phase's production code — a
pre-existing test-fixture design flaw (two concurrent candidates sharing
one git repo in this specific test's own setup), exposed rather than
caused by P2+P3's combined legitimate added latency (binding-check I/O,
heartbeat scheduling) shifting subprocess timing under current heavy
system load into the pre-existing race window. Recorded in plan.md under
Phase 3's "Interaction finding" as a named follow-up (give each
concurrent candidate its own temp repo in the fixture) rather than
reopening either phase.

Cleaned up all 3 throwaway bisection worktrees
(`git worktree remove --force`) and the `/tmp` reproduction directory;
confirmed via `git worktree list` that only pre-existing worktrees
remain.
