# tsk-328 — merge-next/merge-loop lock-wait passthrough

## Feature boundary

`/fgOS:merge-next` and `/fgOS:merge-loop` invoke `fgos merge next` without
ever passing `--wait`/`--no-wait`/`--timeout` through. `fgos merge next`
already recurses into `approve`, which already supports an explicit
`--wait <ms>` ceiling on `.fgos/main-checkout.lock` contention (decoupled
from the lock's own TTL) — but nothing in the skill layer exposes that to
a caller. This item wires the passthrough into those two skills so a
person or an unattended loop hitting sustained lock contention can widen
the wait budget without hand-typing the raw CLI call.

`fgos catchup` is explicitly OUT of scope (D1) — it does not acquire
`.fgos/main-checkout.lock` at all in current code, so no override belongs
there.

The original ask's second half — evaluating whether
`docs/platform-foundations.md` L3's single-writer premise has crossed its
own named reopening threshold — is deferred to a separate future item
(D3), not built here.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | tsk-328's CLI fix narrows to wiring `--wait`/`--timeout` passthrough into the `/fgOS:merge-next` and `/fgOS:merge-loop` skill wrappers. `fgos merge next` already forwards `--wait`/`--no-wait`/`--timeout` to `approve` (`bin/fgos.mjs:1987-2028`); `approve` already calls `parseWaitFlags` (`bin/fgos.mjs:2727`) and `withLockRetry` (`src/runner/lock-wait.mjs`) with an explicit wall-clock `--wait` ceiling independent of the lock's own TTL (tsk-2rf/tsk-6c2/tsk-mgb). `fgos catchup` (`bin/fgos.mjs:3542-3708`) never calls `acquireMainCheckoutLock`/`withLockRetry` — its merge runs in an isolated ephemeral worktree on the item's own branch, landing only via `moveWork`; no shared-branch push happens there. `plugins/fgOS/skills/merge-next/SKILL.md:36` invokes `fgos merge next` with no wait/timeout passthrough, so the already-built CLI capability never reaches the callers that actually experience contention. |
| D2 | The originally reported "catchup timed out waiting on `.fgos/main-checkout.lock` (~150s)" is treated as a misattribution — the real timeout was almost certainly `fgos merge next`. `.fgos/main-checkout.lock`'s `DEFAULT_TTL_MS` is `3 * 60 * 1000` = 180000ms (`src/runner/main-checkout-lock.mjs:80`), matching the reported ~150s magnitude; `fgos catchup`'s case body has zero lock-acquire calls (confirmed by a targeted grep across its full body, `bin/fgos.mjs:3542-3708`). Not re-verified against the original night's session logs — disproportionate effort for a diagnostic detail a stronger code-level finding already supersedes. |
| D3 | tsk-328 scopes down to D1's mechanical fix only. The "evaluate whether L3's multi-writer premise needs reopening" half is deferred to a separate future item — a strategic assessment of a locked platform law (`docs/platform-foundations.md` L3) is a different nature of work than a CLI/skill passthrough fix and should not share one verify/review bar. Creating that follow-up item is left to whoever picks this up next, not done by this item. |

## Pinned terms

- **lock-wait budget** — the `--wait <ms>` ceiling on `.fgos/main-checkout.lock` acquisition retries (`src/runner/lock-wait.mjs`, `withLockRetry`), distinct from `--timeout`/`--no-timeout` (the verify/goal-check timeout, `resolveVerifyTimeoutMs`). Both exist today; this item's scope is only about the former reaching the skill layer.

## Scout evidence

- `bin/fgos.mjs:1987-2028` — `merge next` recurses into the same `approve` verb dispatch, forwarding `flags` as-is (no wait/timeout injected or stripped).
- `bin/fgos.mjs:2727-2728`, `src/cli/command-registry.mjs:501-504` — `approve`/`merge next` already document and implement `--wait`/`--no-wait`/`--timeout` passthrough.
- `src/runner/lock-wait.mjs` — `withLockRetry`'s explicit `waitMs` is a true wall-clock ceiling, independent of `remainingTtlMs` snapshot decay (tsk-2rf D1/D2), already covers the "starving waiter under a busy self-renewing holder" scenario the item's description names.
- `src/runner/main-checkout-lock.mjs:80` — `DEFAULT_TTL_MS = 180000` (3 min), matching the item's reported "~150s" figure closely enough to anchor D2.
- `bin/fgos.mjs:3542-3708` (`catchup` case, full body) — no `acquireMainCheckoutLock`/`withLockRetry` call anywhere; merges happen in `withMergeEphemeralWorktree` (`src/runner/worktree.mjs:776`, confirmed via GitNexus: calls `branchNameFor`, `git`, `createDetachedMergeWorktree` — no lock module in its call graph), landing state only via `moveWork` (`bin/fgos.mjs:3636`, `3706`).
- `src/state/events.mjs:50-51` — the separate `.fgos/events.lock` append-lock budget is `EVENTS_LOCK_TIMEOUT_MS = 2000`ms, too short to be the ~150s the item describes, ruling it out as an alternate explanation for D2.
- `plugins/fgOS/skills/merge-next/SKILL.md:36` — the skill wrapper's own `fgos merge next` invocation carries no wait/timeout flags.
- `grep` across `src/`, `plugins/`, `bin/` for `fgos catchup`/`catchup(` call sites — only the CLI registry entry and the case handler itself; no automated skill/loop caller exists today, consistent with D1's "catchup was never the contended one" finding.
- Impact-analysis posture: `full` — GitNexus present and freshly queried this session (`fgos tool query --capability impact-analysis --status present`, one provider, `status: present`); used above to confirm `withMergeEphemeralWorktree`'s call graph excludes the lock module.

## Canonical references

- `src/runner/lock-wait.mjs`
- `src/runner/main-checkout-lock.mjs`
- `bin/fgos.mjs` (`merge`, `catchup`, `approve` cases; `parseWaitFlags`)
- `plugins/fgOS/skills/merge-next/SKILL.md`
- `plugins/fgOS/skills/merge-loop/SKILL.md`
- `docs/platform-foundations.md` (L3 — referenced only as the deferred follow-up's own subject, not read/analyzed in depth by this item)

## Outstanding questions

None
