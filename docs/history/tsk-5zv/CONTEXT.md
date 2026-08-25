# CONTEXT — tsk-5zv: main-checkout lock release/retry gaps

## Feature boundary

Close the remaining gaps in `.fgos/main-checkout.lock`'s release/retry
discipline (STR65) at the three settling points that still leave a session's
own lock hanging or hard-fail on contention instead of following the
already-proven `tsk-45z` pattern (release-early) or the already-proven
take/pick pattern (retry-with-backoff). This is a targeted extension of an
existing, working discipline to the few call sites that never got it — no new
locking mechanism, no TTL/hook/contract change.

In scope: `case 'compound'` and `case 'cleanup'` (bin/fgos.mjs — add the
release-early call), and `src/runner/promote-engine.mjs:73`
(`retargetMember`'s `mergeRunnerItem` call — add the `withLockRetry` wrap).

Out of scope: `approve`/`sync-root` (already fixed — see D1), any change to
`main-checkout-lock.mjs`'s own TTL/heartbeat/release internals, per-path or
batched-commit locking alternatives (already evaluated and rejected in the
item's own description, no new evidence to reopen them).

## Locked decisions

| D-ID | Quyết định |
|---|---|
| D1 | fix-step-3 targets promote-to-component (src/runner/promote-engine.mjs:73), not approve -- approve/sync-root already wrap mergeRunnerItem in withLockRetry (approve.mjs:129, sync-root.mjs:105); promote-to-component still calls mergeRunnerItem directly with lockRoot:repoRoot (same shared-lock contention), zero retry wrapping. |
| D2 | keep tsk-5zv as one item, do not split -- all three fix points (case compound, case cleanup, promote-to-component) are the same bug class (a settling point that never releases/retries the shared main-checkout lock) and share one verify/review surface. |

## Pinned terms

- **Release-early** — calling `releaseMainCheckoutLockIfOwn(dir,
  resolveWriterIdentity(dir).id)` at a main-sourced item's own settling point
  (a status move that ends this session's need for the checkout), instead of
  waiting out `HOOK_TTL_MS` (20s self-expiry, `src/runner/main-checkout-lock.mjs:131`).
  Identity-checked — only removes the lock when it is still recorded under
  the calling session's own identity (never a blind unlink).
- **Retry-with-backoff (`withLockRetry`)** — `src/runner/lock-wait.mjs`'s
  wrapper that retries an operation that throws `MergeError{code:'lock-held'}`
  with backoff instead of hard-failing immediately. `take`/`pick`
  (bin/fgos.mjs:2978,3051) and, as of this round's research,
  `approve`/`sync-root` (`src/verbs/merge/approve.mjs:129`,
  `src/verbs/merge/sync-root.mjs:105`) already use it by default via each
  use case's own `runMerge` wrapper.
- **Settling point** — the exact call in a verb's implementation where an
  item's status/stage move becomes durable (a `moveWork`/`addOutcome` call
  that is not going to be retried within the same invocation).

## Scout evidence

Full round-1 research trail with every `file:line` citation:
`docs/history/tsk-5zv/RESEARCH.md`. Summary of
what it confirmed against the current repo (not just the item's description
text, which had drifted on one point):

- `case 'return'` (bin/fgos.mjs:3069) already calls
  `releaseMainCheckoutLockIfOwn` at both its settling points
  (bin/fgos.mjs:3385 verify-pass, bin/fgos.mjs:3414 verify-fail) — the
  `tsk-45z` pattern this item's fix mirrors.
- `case 'compound'` (bin/fgos.mjs:1601-1640) settles via `addOutcome` at
  bin/fgos.mjs:1638 with no release call anywhere in the case.
- `case 'cleanup'` (bin/fgos.mjs:1527-1577) settles at
  `moveWork(...to:'blocked')` (bin/fgos.mjs:1559) and
  `moveWork(...to:'done')` (bin/fgos.mjs:1575), no release call at either.
- `approveUseCase` (`src/verbs/merge/approve.mjs:119-129`) and
  `syncRootUseCase` (`src/verbs/merge/sync-root.mjs:39-105`) both already
  wrap their `mergeRunnerItem` calls in `withLockRetry` by default — this
  item's description predates that fix (comments there cite "tsk-5k4"; no
  matching commit title found in `git log`, likely landed inside a
  squash-merged batch).
- `promote-engine.mjs:73` (`retargetMember`, called from
  `case 'promote-to-component'`, bin/fgos.mjs:3495) calls `mergeRunnerItem`
  with `lockRoot: repoRoot` — even though the merge itself runs against an
  ephemeral worktree, the LOCK it contends for is the same shared
  main-checkout lock approve/sync-root used to hard-fail on — and it has
  zero `withLockRetry` wrapping. This is the one remaining exposed site.
- `src/runner/merge.mjs:747-748` — the lock-held error shape from
  `mergeRunnerItem` is already documented as `withLockRetry`-compatible,
  confirming no shape mismatch blocks wrapping `promote-engine.mjs:73` the
  same way `approve.mjs`/`sync-root.mjs` already do.

Impact-analysis capability posture (`fgos tool query --capability
impact-analysis --status present`): `full` (GitNexus present) — but
`bin/fgos.mjs` is a known zero-indexed-`Function`-symbol file even on a
fresh reindex (CLAUDE.md's own gate note, confirmed again this round: a
`withLockRetry` query returned only its test-file caller, missing all four
real `bin/fgos.mjs` call sites). Every claim above was cross-checked with a
direct `rg`/`Read` pass on the actual file content, never trusted from a
GitNexus result on this specific file.

## Canonical references

- `docs/history/tsk-5zv/RESEARCH.md` — full
  research trail, round 1.
- `src/runner/main-checkout-lock.mjs` — the lock's own release/TTL
  mechanics (untouched by this fix).
- `src/runner/lock-wait.mjs` — `withLockRetry`.
- `src/verbs/merge/approve.mjs`, `src/verbs/merge/sync-root.mjs` — the
  already-fixed reference implementation this fix's `promote-to-component`
  half mirrors.

## Outstanding questions

None
