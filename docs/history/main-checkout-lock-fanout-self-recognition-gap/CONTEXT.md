# tsk-70l — main-checkout-lock self-recognition sibling gap on the root→main merge path

## Feature boundary

`merge.mjs:886`'s `acquireMainCheckoutLock` call (the non-`targetSlot`
branch of `mergeRunnerItem`, reached only when `item.parent` is `null` —
root items merging directly onto trunk via `approve`/`sync-root`, e.g.
tsk-51m/tsk-kv3/tsk-60h) does not pass `allowSelfRecognition:false`, unlike
the sibling call at `merge.mjs:778` (`withMergeTargetSlot`) that tsk-1wr
already fixed the same way. Because the lock's identity is an
env-inherited session id (`resolveWriterIdentity`, `session-identity.mjs`),
two genuinely independent OS processes that share an inherited session id
(subagent fanout running two root→main merges concurrently) read as "the
same writer" at line 886 and do not exclude each other — a real
concurrent-write hole on the main checkout. Suspected unexplained root
cause of tsk-22c (`git commit --no-edit` exit 9, verify passed, index.lock
suspected held by another process).

Fix the identity/self-recognition mechanism at this one call site so two
independent processes sharing an inherited session id are excluded from
each other, without regressing either of the two legitimate reentrancy
cases this lock currently protects via session-id self-recognition:
(a) the nested pre-commit hook, spawned as a child of the process holding
this lock, refreshing it as part of the same operation; (b) the same
session retrying its own crashed attempt (a `SIGKILL`/OOM kill that
`releaseOnExit`'s `exit`/`SIGINT`/`SIGTERM` listeners cannot catch,
`main-checkout-lock.mjs:334-349`) before the lock's TTL (`n` = 3 min,
`main-checkout-lock.mjs:102`) elapses.

Out of scope: `merge.mjs:778` (`withMergeTargetSlot`) — already correctly
excludes self-recognition and needs no change, since that lock is always
released within the same call that acquired it (no legitimate re-entry to
protect there, per tsk-1wr's own reasoning). `claim-port.mjs:105`
(`claimWork`) — already uses a numeric `process.pid` identity on this same
lock file and is unaffected by anything here. Any change to the general
`allowSelfRecognition` default or to `tryAcquireOnce`'s self-recognition
branch shape itself — this fix changes what identity `886` presents and
adds a narrow, explicit recognition channel for the nested hook, but does
not touch the self-recognition equality logic in `main-checkout-lock.mjs`.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Fix mechanism is **(c-refined)**: switch `merge.mjs:886`'s own acquire identity to a pid-liveness-checkable form (mirroring `claim-port.mjs:105`'s `identity: process.pid`, already used on this exact lock file) instead of the plain session-id string, so `isPidAlive` (`main-checkout-lock.mjs:133-140`) can distinguish a live fanout sibling (real exclusion — different, live pid) from a crashed same-session holder (immediate reclaim — different, dead pid) — a distinction plain session-id string equality cannot make, since string-identity holders have no liveness probe (`main-checkout-lock.mjs:257-267`, TTL is the only signal). The nested pre-commit hook recognizes its own parent (the process holding the lock, currently alive and waiting on the commit) via an **explicit env var set only on the specific `execFileSync` call that spawns `git commit`** (`merge.mjs:84`/`:1255`, `shell:false` — no intermediate shell hop), never a global `process.env` mutation. Rejected: a `ps`-based ancestor-pid walk (reusing `session-identity.mjs`'s existing best-effort fallback authoritatively) — it would put `ps` availability on the commit hot path for every root→main merge, specifically for the agent/subagent-session population that today never reaches that fallback at all (agent sessions always carry `BEE_SESSION_ID`/`CLAUDE_CODE_SESSION_ID`); a missing/restricted `ps` would break every root→main merge, a worse failure mode than the bug being fixed. Rejected: a flag-only mirror of tsk-1wr's `allowSelfRecognition:false` fix at `886` with no other change — traced concretely to regress the legitimate same-session crash-retry case (b) above, since `allowSelfRecognition:false` skips the equality check entirely rather than substituting a liveness check, so a genuine same-session retry would wait out the full TTL instead of resuming immediately. Rejected: widening `tryAcquireOnce`'s self-recognition equality branch itself to parse a composite identity — touches the one piece of exclusion-critical logic this fix can avoid touching, for no benefit over the explicit-env-channel design. |

## Pinned assumptions (deferred to `fgos-coding-planning`)

- Exact shape of the pid-liveness identity at `886` (bare `process.pid`
  like `claim-port.mjs`, or a `sessionId:pid` composite) is an
  implementation choice for planning — either satisfies D1, since the
  liveness distinction only needs the pid component to be independently
  `isPidAlive`-checkable.
- The env var's name, and the precise mechanism for scoping it to only the
  `execFileSync(['commit', ...])` call (not leaking into other subprocess
  calls in the same session) is an implementation choice for planning. The
  constraint from D1 is: it must be passed via that call's own `env`
  option, never a `process.env` assignment that could leak to unrelated
  child processes spawned later in the same session.
- Whether the hook falls back to today's plain session-id equality check
  when the new env var is absent (e.g. a human directly running
  `git commit` on the main checkout, unrelated to any `fgos approve`) is an
  implementation choice, but must preserve that case's existing behavior
  unchanged — no test currently covering it should need to change.
- PID-reuse (ABA) on the newly-liveness-checked identity is an accepted,
  already-precedented risk (see Scout evidence) — traced to a bounded,
  self-healing false-exclusion (extra wait up to `n`, no double-write
  possible), never a safety violation. No mitigation beyond what
  `isPidAlive`/TTL already provide is required; planning does not need to
  design around it further.

## Pinned terms

- **root→main merge path** — `merge.mjs:886`'s branch of `mergeRunnerItem`,
  reached when `item.parent === null` (`approve`/`sync-root` merging a root
  item's own branch directly onto trunk). Distinct from the **leaf→parent
  path**, which acquires the target's own slot lock (`778`) instead and is
  unaffected by this item.
- **self-recognition** — `main-checkout-lock.mjs:246`'s `allowSelfRecognition
  && record.pid === identity` branch: when a caller's own identity matches
  the existing lock record, treat this acquire as a refresh of its own
  lock rather than contention with a rival holder.
- **fanout sibling** — two independent OS processes, spawned concurrently
  (e.g. by `fgos-fanout` or an orchestrator batch), that inherit the same
  env session id and therefore present the same string identity to
  `main-checkout.lock` today.

## Scout evidence and references

- `src/runner/merge.mjs:768-803` (`withMergeTargetSlot`, tsk-1wr's already-
  fixed sibling call) and `:805-899` (`mergeRunnerItem`, the `targetSlot`
  branch at `:844-846` vs. the root→main branch at `:848-899` this item
  fixes).
- `src/runner/main-checkout-lock.mjs:206-300` (`tryAcquireOnce` — self-
  recognition branch at `:246`, numeric-vs-string liveness handling at
  `:251-268`), `:133-140` (`isPidAlive`), `:334-349` (`releaseOnExit`'s
  documented `exit`/`SIGINT`/`SIGTERM`-only coverage).
- `src/runner/claim-port.mjs:97-119` (`claimWork` — already uses
  `identity: process.pid` on this exact lock file today; comment at
  `:98-104` explains why `ttlMs` is required given the hook's own lingering
  string-identity record).
- `src/runner/session-identity.mjs:1-40` — env-session-id resolution
  (agent sessions) vs. the ancestor-pid-walk fallback (bare terminals
  only, documented best-effort, `MAX_HOPS = 3`).
- `docs/history/tsk-1wr/plan.md:87-102` — the "Locked decision" this item
  partially revisits: `778`'s fix was scoped narrowly and deliberately left
  `886`/main-checkout.lock's general session-refresh behavior untouched, a
  scope decision for that item, not a proof that touching `886` is unsafe.
- `docs/history/session-claim-liveness/CONTEXT.md` D1/D2 — a separate,
  later feature that explicitly names `main-checkout-lock.mjs`'s
  `isPidAlive`-based auto-reclaim, fail-closed on ambiguity, as the
  precedent it mirrors (rejecting PID-liveness for its *own* different
  resource — a worktree, not a lock file — not because PID-liveness itself
  is unsafe).
- `test/e2e/main-checkout-lock-hook.test.mjs:178-193` — the existing e2e
  test protecting the same-session-back-to-back-commit case; exercises the
  hook directly via raw `git commit`, never `merge.mjs:886`, confirming a
  fix scoped to `886` cannot regress it.
- Impact-analysis capability gate (`fgos tool query --capability
  impact-analysis --status present`): GitNexus registered and `present`,
  but its index is stale (last indexed `79fead3`, per this session's own
  environment) — **degraded**: blast radius on `merge.mjs`/
  `main-checkout-lock.mjs`/`.githooks/pre-commit` is not confirmed fresh by
  the graph; this gap should be named plainly in the plan/verify note
  rather than treated as full coverage.

## Outstanding questions

None
