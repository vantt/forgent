# CONTEXT: pre-commit hook's main-checkout-lock hold time

Item: `tsk-1d9`. Written retroactively (same structural gap as `tsk-49u`'s
own CONTEXT.md — `clarify` jumps straight to `decompose`, `fgos-coding-exploring`
never runs).

## Locked decisions

- **D0.** The item's own framing ("the hook never releases the lock, so
  every commit blocks pick/take up to 180s") is literally true but its
  implied fix — mirror `claimWork`'s `releaseOnExit: true` — was checked
  against `src/runner/main-checkout-lock.mjs:283-297` and rejected: that
  comment documents, by name (`tsk-45z` D2, self-recognition D6), that the
  hook must NEVER release on exit. Releasing immediately would let a
  different session's `pick`/`take` (which also acquires this lock, e.g.
  via `git worktree add` touching the same checkout's shared `.git`
  metadata) interleave between two commits of the SAME working session —
  reopening the exact STR65 index-clobbering race this lock exists to
  prevent (`docs/history/str65-worktree-isolation-enforcement/CONTEXT.md`).
  Per the project's own "Verified Decisions" rule, this is not reversed
  without new evidence.

- **D1.** New evidence the original `tsk-45z` design didn't have (from the
  scan report, `plans/reports/project-instability-scan-260809-1608-ship-
  faster-stability-report.md` finding 1): measured commit cadence over the
  last 60 commits (median gap 95s, 68% under the 180s TTL) means the lock
  sits warm roughly 2/3 of active-work time — real cross-session blocking
  cost. Finding 5 separately measured a legitimate `mergeRunnerItem` verify
  taking 184.9s, already exceeding the SAME 180s `DEFAULT_TTL_MS` the hook
  uses. One shared TTL constant is serving two consumers with genuinely
  different real-duration needs: the hook (commit-to-commit protection,
  should be short) and the merge/verify path (`src/runner/merge.mjs:660`,
  needs minutes). This is new context that changes the tradeoff `tsk-45z`
  originally weighed, even though it doesn't change the "never release on
  exit" conclusion itself.

- **D2.** Presented three options to a person (session `AskUserQuestion`):
  split the TTL (short hook-specific default, unchanged long default for
  merge/verify), lower the shared TTL globally and accept finding 5's
  regression risk, or stop for deeper investigation first. Chosen: **split
  the TTL** — respects D0's protection intent, addresses D1's measured
  cost, and never touches `claim-port.mjs`/`merge.mjs`, which keep using
  the existing `DEFAULT_TTL_MS` (180s) exactly as before.

- **D3.** Traced every caller of `acquireMainCheckoutLock`
  (`grep -rn "acquireMainCheckoutLock(" src .githooks bin` — 4 sites,
  cross-checked since GitNexus's index is stale, `impact-analysis:
  degraded`): `claim-port.mjs:103` and `merge.mjs:660` both pass
  `DEFAULT_TTL_MS` explicitly and `releaseOnExit: true` — untouched by this
  change. `bin/fgos.mjs:4104` (an unlock-adjacent check) also passes
  `DEFAULT_TTL_MS` explicitly — untouched. Only `.githooks/pre-commit`'s
  own `resolveTtlMs()` falls back to a constant when
  `FGOS_MAIN_CHECKOUT_LOCK_TTL_MS` is unset — that fallback is the one
  thing this item changes, from `DEFAULT_TTL_MS` to a new, hook-specific
  `HOOK_TTL_MS`. The existing env var already fully overrides either
  value at runtime (confirmed: `test/e2e/main-checkout-lock-hook.test.mjs`
  already exercises `FGOS_MAIN_CHECKOUT_LOCK_TTL_MS` at both `100`ms and
  `15*60*1000`ms) — no new escape hatch needed.

- **D4.** `HOOK_TTL_MS` chosen as **20 seconds** — a judgment call, not
  empirically derived from the report's cadence data (that median-gap-95s
  figure spans all 60 commits regardless of identity, conflating
  same-session sequences with different-session handoffs; no cleaner
  same-session-only figure was available). 20s is long enough to cover a
  typical "stage a few files, commit, stage a few more, commit" sequence
  within one shell/agent turn, and ~9x shorter than the current 180s,
  cutting the measured blocking cost substantially. Accepted, named
  tradeoff: a same-session pause longer than 20s between commits still
  narrows the self-recognition protection window (D0) to that same 20s,
  down from 180s — thinner than before, not eliminated, and tunable further
  via the existing `FGOS_MAIN_CHECKOUT_LOCK_TTL_MS` env var if 20s proves
  wrong in practice.

- **D5.** Before implementing, found `DEFAULT_TTL_MS`'s own comment
  (`main-checkout-lock.mjs:63-80`, commit `1dabb6b`) cites measured real
  inter-commit gaps of ~2-3.5 minutes from
  `docs/history/str65-worktree-isolation-enforcement/reports/validation-
  phase1.md` as the reason the shared TTL can't safely go much below 3
  minutes — apparently in tension with D4's 20s figure. Tried to verify
  what that gap actually measured; the referenced report no longer exists
  anywhere in git history (`git log --all --diff-filter=A -- "*validation-
  phase1*"` returns nothing). Raised this directly with a person rather
  than guess past a dated, committed safety comment — confirmed (session
  `AskUserQuestion`): that 2-3.5min figure was not measuring the same
  thing D4's 20s figure covers (not same-session sequential-commit gaps).
  D4's 20s value stands as originally chosen.

## Outstanding questions

None
