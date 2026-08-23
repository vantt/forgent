# tsk-70l — plan

Mode: **high-risk**

Flags counted (fgos-routing Mode gate): **audit/security / data-loss**
(hard-gate — the bug this item closes is a real concurrent-write exclusion
hole on the shared main checkout; two independent processes wrongly
recognizing each other as "the same writer" can both write to the same
checkout at once, the exact class of corruption/lost-work risk `tsk-22c`
is suspected to be a symptom of); **existing covered behavior**
(`test/e2e/main-checkout-lock-hook.test.mjs`,
`test/runner/main-checkout-lock.test.mjs` already assert the two legitimate
reentrancy cases this fix must not regress); **weak proof around the area**
(impact-analysis posture is `degraded` — see below). One hard-gate flag
alone sets the lane; three real flags apply. `fgos graph --what-if` is not
run per-candidate here — see "Split decision" below, this item is not
splitting.

`fgos graph --json`: tsk-70l carries no deps and is not on the current
critical path (`topUnblock: []`) — this fix does not gate other queued
work, it closes a standing correctness hole. Ordering within this one item
(see "Order" below) is decided by the coupling between its pieces, not by
graph unblock metrics.

Impact-analysis capability gate (`fgos tool query --capability
impact-analysis --status present`): GitNexus registered and `present` but
its index is **stale** (last indexed `79fead3`) — **degraded**. Blast
radius on `merge.mjs`/`main-checkout-lock.mjs`/`.githooks/pre-commit` is
not confirmed fresh by the graph; treated as weak evidence below, backed
instead by the direct grep/read cross-checks already recorded in
`CONTEXT.md`'s Scout evidence section (per `CLAUDE.md`'s own gate note:
"a suspicious zero-result or 'not found' answer... is worth a quick
grep/rg cross-check" — done here, not skipped).

## Approach

Honors `CONTEXT.md` D1 (c-refined) exactly. Chosen path:

1. `merge.mjs:886`'s own `acquireMainCheckoutLock` call switches its
   `identity` from the plain session-id string
   (`resolveWriterIdentity(fgosDir).id`) to a pid-liveness-checkable form,
   mirroring `claim-port.mjs:105`'s existing `identity: process.pid` on
   this exact lock file. This alone lets `main-checkout-lock.mjs`'s
   existing numeric-identity branch (`main-checkout-lock.mjs:251-256`,
   `isPidAlive`) — already exercised today by `claim-port.mjs` on this
   same file — decide fanout-sibling-vs-crash-retry correctly, with no
   change to `tryAcquireOnce`'s self-recognition branch shape itself.
2. The `execFileSync('git', ['commit', ...], ...)` call in `merge.mjs`'s
   own `git()` helper (`merge.mjs:84`, `shell:false` — no shell hop, so
   the hook's own ppid chain is exactly hook→git→this node process, 2
   hops, confirmed by reading the actual invocation) passes an explicit
   env var on that one call's own `env` option carrying the current
   process's identity — never a `process.env` mutation, so it cannot leak
   into any other subprocess this session spawns later.
3. `.githooks/pre-commit` reads that env var first; if present, treats it
   as authoritative self-recognition (it is the direct, structurally
   guaranteed child of the process that holds the lock — no `ps` call
   needed). If absent (a bare human `git commit`, unrelated to any
   `fgos approve`), falls through to exactly today's session-id equality
   check — unchanged code path, so `test/e2e/main-checkout-
   lock-hook.test.mjs`'s existing assertions (solo commit, same-session
   back-to-back commit, different-identity exclusion, stale-lock
   reclaim) keep exercising the exact same logic they do today.

Rejected alternatives (already settled in `CONTEXT.md` D1, cited not
re-argued here): flag-only mirror of tsk-1wr's `778` fix at `886` alone
(regresses same-session crash-retry — traced concretely, not
theoretical); `ps`-based ancestor-pid walk (new external dependency on
the merge hot path for the agent-session population that never needs it
today); widening `tryAcquireOnce`'s self-recognition equality branch
(touches exclusion-critical logic for no benefit over the explicit-env
design).

## Risk map

| Component | Risk | Proof point (fgos-coding-validating) |
|---|---|---|
| `merge.mjs:886` identity switch | High — this is the actual exclusion mechanism; getting the identity type/liveness semantics wrong either reopens the fanout hole or introduces a new false-exclusion | A test exercising two independent OS processes (real `child_process.fork`/spawn, not two in-process calls) sharing an inherited session id, concurrently calling the `886` code path, asserting the second one is genuinely refused while the first holds it |
| Crash-retry reclaim | Medium — this is the case the naive flag-only fix broke; must reclaim promptly on a dead pid, not wait out the full TTL | A test that acquires the lock under a real pid, kills that pid (or simulates a dead-pid record the way `main-checkout-lock.test.mjs`'s existing liveness tests already do), and asserts a same-session retry succeeds immediately rather than waiting `n` |
| Hook self-recognition via explicit env var | High — this is the coupling point; if the env var isn't correctly scoped/read, the hook self-deadlocks on every real root→main merge | `test/e2e/main-checkout-lock-hook.test.mjs`'s existing suite must stay green unmodified (proves the fallback path is untouched), plus one new case: a real nested merge→commit→hook flow (not a raw standalone `git commit`) asserting the hook succeeds while `886`'s lock is held |
| Env var scoping (no leak to other subprocesses) | Medium — a `process.env` mutation instead of a scoped `execFileSync` `env` option would leak the marker into unrelated child processes spawned later in the same session | Code-level check during `fgos-coding-implement`: the env var must appear only in the specific `execFileSync` call's own `env` option, never assigned onto `process.env` — not a runtime-observable regression easily caught by a test alone, called out explicitly so review doesn't miss it |
| PID-reuse (ABA) on the new liveness check | Low, accepted (`CONTEXT.md` Pinned assumptions — traced to a bounded, self-healing false-exclusion, precedented by `claim-port.mjs`/`session-claim-liveness` design) | No new proof point required beyond the existing `isPidAlive`/TTL tests already covering this pattern elsewhere |

## Files touched, in order

1. `src/runner/main-checkout-lock.mjs` — only if the pid-liveness identity
   shape needs a small accommodation (e.g. a helper to build the composite
   identity); the self-recognition branch itself is not touched (D1).
2. `src/runner/merge.mjs:886` (identity) and the `git()` call site around
   `:1255` (env var on the `commit` invocation) — the core fix.
3. `.githooks/pre-commit` — read the new env var first, fall back to
   existing behavior.
4. `test/runner/main-checkout-lock.test.mjs` / `test/e2e/main-checkout-
   lock-hook.test.mjs` — new cases per the risk map; existing cases must
   stay green unmodified.

This order follows the coupling, not `fgos graph`'s unblock metric (this
item has no children to compare candidates across): the lock/identity
layer must exist before `merge.mjs` can use it, `merge.mjs` must pass the
env var before the hook can read it, and tests come last against the real
landed behavior.

## Split decision

No split. The three pieces above (identity switch, env-var handoff, hook
read) are not independently workable or independently mergeable — landing
the identity switch without the hook update self-deadlocks every real
root→main merge, and landing the hook update without the identity switch
does nothing (the env var would just always match trivially under the
current string-identity scheme). This is one coherent fix that must be
verified as a whole; proceeds as itself.

## Proof surface

Verify: `npm test` — full suite, not a narrowed subset. Justification:
`existing covered behavior` is a counted flag (this fix directly touches
`main-checkout-lock.mjs`/`merge.mjs`/`.githooks/pre-commit`, shared
infrastructure with existing e2e coverage in
`test/e2e/main-checkout-lock-hook.test.mjs`, `test/e2e/self-improve-loop
.test.mjs`, and `claim-port.mjs`'s own callers), and the risk map above
names regressions that a narrowed test run would not reliably catch
(the coupling between `886` and the hook specifically needs the full e2e
layer, not just the unit-level `main-checkout-lock.test.mjs`).

## Outstanding questions

None
