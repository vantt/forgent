# CONTEXT: --wait retry for main-checkout-lock CLI verbs (tsk-6c2)

## Feature boundary

Add automatic retry-with-backoff to the CLI verbs that call
`acquireMainCheckoutLock` (`bin/fgos.mjs`), so a `HELD` result is no longer
an immediate hard fail when the holder is likely to clear within the
lock's TTL. Wraps the existing primitive in a new helper
(`acquireMainCheckoutLockWithWait` or equivalent) — never edits
`src/runner/main-checkout-lock.mjs` or `tryAcquireOnce` itself.

Root cause this solves (confirmed in code,
`src/runner/main-checkout-lock.mjs:63-76`): the git pre-commit hook
acquires/refreshes `main-checkout.lock` on every commit and deliberately
never releases it itself — the lock's TTL (default 3 min) is the only
cleanup mechanism. Real-world gap between two commits of the same
workstream: ~2-3.5 min. So a `take`/`pick`/`merge`/`approve` run shortly
after another session's last commit routinely hits `HELD` even though
that session is done.

## Locked decisions

| ID | Decision |
|---|---|
| D1 | `--wait`-style retry applies **only to `take`, `pick`, `merge`, `approve`** — not `return`. Scout evidence: `return` (`bin/fgos.mjs:1524-1577`, both the branch-source and main-source paths) never calls `acquireMainCheckoutLock` — it only calls `releaseMainCheckoutLockIfOwn` to release a lock left over from an earlier `git commit` (refreshed by the pre-commit hook, not acquired by `return` itself). Confirmed by full-repo grep: the only 3 call sites of `acquireMainCheckoutLock` are `bin/fgos.mjs:2373` (the unrelated `unlock` verb), `src/runner/claim-port.mjs:101` (`claimWork`, used by `take`/`pick`), and `src/runner/merge.mjs:651` (`mergeRunnerItem`, used by `merge`/`approve`). There is nothing for a retry loop to hook into on `return` without adding a brand-new acquire call it doesn't have today — out of scope for this item. The item's original title/description (which listed `return` as a fifth verb) is superseded by this decision. |
| D2 | Proceed with this item now, despite `tsk-45y` (todo/clarify, undecided as of 2026-07-30) proposing a redesign where `.fgos` becomes per-worktree and independent of the main-checkout lock entirely. `research-260730-1133-open-lock-contention-items-survey.md` §7 recommendation #5 explicitly advises against building `--wait` before `tsk-45y` is decided, since if that redesign is accepted most of `--wait`'s value disappears (§6 impact matrix). Locked: build it now anyway, accepting that risk — no ETA exists on `tsk-45y`, and the short-term UX pain (routine `HELD` fails on back-to-back CLI runs) is real today. |
| D3 | The retry-with-backoff is **default ON** for `take`/`pick`/`merge`/`approve` — no flag is required to enable it. This reverses the item's original framing ("add flag `--wait[=<ms>]`", opt-in) per explicit user answer. A separate opt-out mechanism is needed for callers that want today's immediate-fail-on-`HELD` behavior (see assumption A1 below — naming left to planning/implementation, not locked here). |

## Pinned terms

- **HELD** / **AMBIGUOUS** / **ACQUIRED**: the three outcomes of
  `acquireMainCheckoutLock` as already defined in
  `src/runner/main-checkout-lock.mjs`. Unchanged by this item.
- **wait budget**: the maximum total time the retry loop spends re-calling
  `acquireMainCheckoutLock` before giving up, per the item's original
  formula — `min(remainingTtlMs read at the first HELD, an optional
  user-supplied override)`. With D3 (default ON), the override becomes
  optional tuning rather than the thing that turns retry on at all.

## Non-goals (confirmed, from `research-260730-1133-cli-wait-flag-main-checkout-lock-design.md` §5)

- Does not help a genuinely live, continuously-refreshed holder (a long
  operation that keeps touching the lock) — retry exhausts its budget and
  still fails. By design: this lock is not meant for long-running work.
- Does not touch `AMBIGUOUS` (corrupt/unparseable lock file) — that stays
  fail-closed per the primitive's existing D5; retry must not loop on it
  since there may be no TTL to bound against. `fgos-unlock` remains the
  only path out of `AMBIGUOUS`.
- Does not touch claim-level races (independent runner/dispatcher picking
  the same item — `tsk-49a`, separate item) — out of scope, orthogonal
  layer.
- Does not fix the lock-coverage gap in the `docs-index` verb (`tsk-1wn`,
  separate item) — that verb doesn't acquire the lock at all today, a
  different bug class ("missing lock" vs "lock contested").

## Dependency risk already encoded in state (not re-litigated here)

`tsk-3vo` (currently status `doing`, stage `clarify`) documents that
`return`/`approve`/`catchup` run verify with no default timeout, and
`return` only releases the lock *after* verify returns — so a hung verify
holds the lock until TTL expiry, opening a window for another writer to
acquire while the original holder is still actually alive. The item's own
`deps: ["tsk-3vo"]` already encodes "must land together with tsk-3vo" at
the state-machine level (this item cannot reach `executing`'s frontier
until `tsk-3vo` is done) — this is not a fresh product decision, just
confirmation that the existing dependency edge is the intended
enforcement mechanism, not something to duplicate in prose here.

## Scout paths and evidence cited

- `src/runner/main-checkout-lock.mjs:63-76` — DEFAULT_TTL_MS comment,
  root-cause confirmation.
- `src/runner/main-checkout-lock.mjs:269` — `acquireMainCheckoutLock`
  signature (non-blocking, single `wx`-create attempt + one reclaim
  check).
- `bin/fgos.mjs:1311-1425` (`take`), `1369-1425` (`pick`) — both route
  through `claimWork`.
- `bin/fgos.mjs:1426-1578` (`return`) — full case block read; confirmed
  no `acquireMainCheckoutLock` call on either the branch-source or
  main-source path, only `releaseMainCheckoutLockIfOwn` at lines 1558 and
  1576.
- `bin/fgos.mjs:1678` (`approve`), `1868`/`1942` (`mergeRunnerItem`
  call sites) — both merge paths (ephemeral worktree and repoRoot) go
  through `mergeRunnerItem`.
- `src/runner/claim-port.mjs:101` — `claimWork`'s own
  `acquireMainCheckoutLock` call, `releaseOnExit: true`.
- `src/runner/merge.mjs:651` — `mergeRunnerItem`'s own
  `acquireMainCheckoutLock` call, `releaseOnExit: true`.
- GitNexus `impact`/context lookups on `acquireMainCheckoutLock` and
  `mergeRunnerItem` confirmed the same caller sets independently.

## Canonical references

- `plans/reports/research-260730-1133-cli-wait-flag-main-checkout-lock-design.md`
  — full design note: mechanism, implementation sketch, tests needed,
  originally-unresolved questions (now resolved by D1-D3 above).
- `plans/reports/research-260730-1133-open-lock-contention-items-survey.md`
  — full survey of the 9 open lock/claim/worktree items, the `tsk-45y`
  fork, and the impact matrix behind D2.

## Outstanding — deferred to planning (implementer's call, not locked here)

- **A1 (assumption, not a locked decision)**: the opt-out flag name for
  restoring today's immediate-fail behavior (candidates: `--no-wait`,
  `--wait=0`). Pin whichever `fgos-coding-planning` finds least surprising
  against existing CLI flag conventions in `bin/fgos.mjs`.
- Backoff schedule (500ms → 1s → 2s, cap at 2s) — already specified in
  the item's own text; implementer detail, not re-litigated here.
- Exact retry-loop helper name/location and its unit tests — planning's
  job, not clarify's.
- Failure-message wording when the wait budget is exhausted and the lock
  is still `HELD`/`AMBIGUOUS` (the design report suggests it should state
  elapsed wait time, distinct from today's immediate-fail message) —
  acceptance-criteria-level detail for planning, not a clarify decision.
