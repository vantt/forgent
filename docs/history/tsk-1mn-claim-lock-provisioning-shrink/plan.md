# plan: tsk-1mn — shrink claimWork's main-checkout.lock hold across npm ci

Mode: standard

Flag count/lane: 1 explicit flag (existing covered behavior — `claim-port.mjs`
and `worktree.mjs` both carry extensive live test suites, see Verify below)
plus story-sized behavior: this changes the lock-hold boundary of the
single choke-point every `pick`/`take --id` claim goes through
(`claim-port.mjs`'s own header: "the 'one door' for claiming work"). No
hard-gate flag (auth/data-loss/audit-security/external-provider/removed-
validation) applies — the report itself rates this "severity: medium",
distinct from tsk-18k's heavier "data loss" framing, and item's own
`tier`/`risk` (`standard`/`standard`) already match. Standard lane, not
tiny/small, given the behavioral change sits on a critical, widely-used
path even though the diff itself is small.

Direct-entry fallback (`fgos-coding-planning` step 1): this item entered
`planning` straight from a `clear` discovery verdict — no `fgos-routing`
Orient pass ran and no `CONTEXT.md`/exploring round exists. The item's own
description (coupling note) plus `RESEARCH.md` round 1 stand in for
`CONTEXT.md` here, same shape as tsk-18k.

## Impact-analysis posture

`fgos tool query --capability impact-analysis --status present` → gitnexus
`present`, but the indexed snapshot is still 172 commits behind HEAD
(unchanged since tsk-18k's own check minutes earlier) — **degraded**, not
full, per `CLAUDE.md`'s gate. Cross-checked with a plain `grep -rn
"acquireMainCheckoutLock" src/runner/loop.mjs` (RESEARCH.md round 1, finding
1): no match, confirming the runner's own dispatch worktree path never
holds this lock. This round GitNexus's own `impact` call-graph flows for
`acquireMainCheckoutLock` (`ClaimWork`, `WithMergeTargetSlot`) actually
AGREED with the grep — unlike tsk-18k's false negative, no discrepancy this
time, but the posture is still recorded as degraded (stale index is stale
regardless of whether this particular query happened to line up).

## Approach

One change: thread an optional `beforeProvision` callback through
`createWorktree`/`createClaimWorktree` (`worktree.mjs`), fired at the exact
boundary between "git setup against `repoRoot`" (already complete by then)
and "`.fgos/` strip + `provisionDependencies`" (touches only the isolated
worktree directory, never `repoRoot`). `claimWork` (`claim-port.mjs`) passes
`() => lockResult.release()` — safe because `release()` is idempotent
(tsk-45z), so the function's own outer `finally { lockResult.release(); }`
stays in place unconditionally as the safety net for every other exit path.

**Why shrink, not heartbeat** (RESEARCH.md round 1, finding 2): a
timer-based heartbeat — the fix `withMergeTargetSlot` already uses for its
own async hold — cannot work here at all. `provisionDependencies` runs via
`execFileSync`, fully synchronous, blocking the whole event loop; nothing,
including a `setInterval` callback, can fire during it. Shrinking the hold
is the only fix that actually closes the TTL-starvation gap Finding 2
describes.

**Why this exact seam is safe** (RESEARCH.md round 1, finding 3): every
`repoRoot`-touching git operation `createClaimWorktree` makes (`git
branch`, `git worktree add`, `relocateOrphanedCheckout`) already completes
before `finishWorktreeSetup` is ever called — confirmed by reading
`createWorktree`'s own body. `finishWorktreeSetup` itself (`.fgos/` strip +
provisioning) touches only the new worktree's own directory, never
`repoRoot`'s `.git/index` — the exact resource `main-checkout-lock.mjs`'s
own header names as this lock's actual protection target. Releasing right
at that boundary is a direct consequence of what each operation touches,
not a judgment call.

**Scope boundary, explicitly not touched** (RESEARCH.md round 1, findings 4
and 5): `resyncClaimWorktree` (the reattach path) never calls
`provisionDependencies` at all — not this bug's path. `createDetachedMergeWorktree`
(the merge flow's ephemeral worktree) also calls `finishWorktreeSetup`, but
its own lock hold (`withMergeTargetSlot`) is async and already has a working
heartbeat — no gap to close there, and the new `beforeProvision` param
defaults to a no-op so that call site (and `createDispatchWorktree`, the
runner's own dispatch path, which never held this lock in the first place)
stays byte-identical. Proven by a dedicated new test (Shape below).

## Risk map

| Component | How risky | Proof point |
|---|---|---: |
| `createWorktree`'s new `beforeProvision` seam | Medium — a new optional param threaded through a widely-reused primitive (`createClaimWorktree`, `createDispatchWorktree`, `createDetachedMergeWorktree` all call `createWorktree`/share `finishWorktreeSetup`) | New test: `beforeProvision` fires exactly once, after all repoRoot git setup (branch existence checked at call time), strictly before `node_modules` exists — deterministic ordering assertion, no timing guesswork |
| Every existing caller that does NOT pass `beforeProvision` | Low — default is a no-op (`beforeProvision?.()`), so omitting it is byte-identical to before this item | New test: `createWorktree` with no `beforeProvision` still provisions correctly (regression guard); full existing `createDetachedMergeWorktree`/merge suite (`test/runner/merge.test.mjs`, `worktree-callsite-wrapper.test.mjs`) reruns unchanged |
| `claimWork`'s own lock-release wiring | Low — `lockResult.release()` is already idempotent (tsk-45z), so an early call plus the existing outer `finally` call is provably safe, no new double-release surface | Full existing `claim-port.test.mjs` isolate:true suite (14+ cases, including the two `createClaimWorktree`-failure revert tests) reruns unchanged against the new call shape |

## Shape

Single piece, no split — one seam, one caller wiring it, already
implemented and verified.

Verify (already synced onto the item at discovery, real and runnable):
```
node --test test/runner/worktree.test.mjs test/runner/claim-port.test.mjs
```

Cases already covered: ordering contract (beforeProvision before
provisioning, after git setup), no-callback byte-identical regression, full
existing isolate:true claimWork suite (concurrent reclaim, worker-slot
ceiling, createClaimWorktree-failure revert, branch-take, blocked→doing),
full existing createWorktree/createDetachedMergeWorktree suite untouched by
the default no-op.

## Outstanding questions

None
