# Research log — tsk-5zv

## Round 1 — 2026-08-24 (discovery stage, fgos-researching)

**Asked:** verify tsk-5zv's description claims against the CURRENT repo (the
description text is untrusted/may be stale) — root cause, the two missing
release call sites, and the claimed take/pick-vs-approve retry asymmetry.

**Checked:** `src/runner/main-checkout-lock.mjs`, `src/util/session-identity.mjs`,
`bin/fgos.mjs`, `src/verbs/merge/approve.mjs`, `src/verbs/merge/sync-root.mjs`,
`src/runner/promote-engine.mjs`, `src/runner/merge.mjs` — all via direct
`rg`/`Read` on the current working tree (no external lookup needed, everything
is local). GitNexus's `impact-analysis` capability is `present`, but per the
CLAUDE.md gate note `bin/fgos.mjs` is a known zero-indexed-symbol file even on
a fresh reindex — cross-checked its one query result (`withLockRetry` callers)
against a direct grep, which found the real call sites GitNexus missed.

**Found:**

1. **Confirmed** — `HOOK_TTL_MS = 20 * 1000` self-expiry, `src/runner/main-checkout-lock.mjs:131`.
2. **Confirmed** — `resolveWriterIdentity` reads `FGOS_SESSION_ID` then legacy
   `CLAUDE_CODE_SESSION_ID`, `src/util/session-identity.mjs:66,134`.
3. **Confirmed, line numbers drifted slightly** — `case 'return'` (bin/fgos.mjs:3069)
   calls `releaseMainCheckoutLockIfOwn(dir, resolveWriterIdentity(dir).id)` at
   both its own settling points: verify-pass → `awaiting-approval`
   (bin/fgos.mjs:3385, description cited :3373) and verify-fail → `blocked`
   (bin/fgos.mjs:3414, description cited :3402). Same tsk-45z pattern the
   description describes.
4. **Confirmed, gap still real** — `case 'compound'` (bin/fgos.mjs:1601-1640,
   description cited ~1589-1628) settles via `addOutcome` at bin/fgos.mjs:1638
   with **no** `releaseMainCheckoutLockIfOwn` call anywhere in the case.
5. **Confirmed, gap still real** — `case 'cleanup'` (bin/fgos.mjs:1527-1577,
   description cited ~1515-1565) settles at both `moveWork(...to:'blocked')`
   (bin/fgos.mjs:1559) and `moveWork(...to:'done')` (bin/fgos.mjs:1575) with
   **no** `releaseMainCheckoutLockIfOwn` call at either point.
6. **CONTRADICTS the description — the claimed asymmetry is partially
   already fixed.** `approveUseCase` (`src/verbs/merge/approve.mjs:119-129`)
   already wraps its `mergeRunnerItem` calls in `withLockRetry` by default
   (`runMerge = (mergeFn) => (noWait ? mergeFn() : withLockRetry(mergeFn, { waitMs }))`,
   used at approve.mjs:552,725) — the exact same pattern as take/pick
   (bin/fgos.mjs:2978,3051). `syncRootUseCase`
   (`src/verbs/merge/sync-root.mjs:39-108`) has the identical `runMerge`
   wrapper. Inline comments at both sites ("tsk-5k4: withLockRetry must wrap
   the call that can actually throw") show this was already fixed as its own
   piece of work, sometime after tsk-5zv's description was written — no
   commit titled with "tsk-5k4" or "withLockRetry" was found in `git log`,
   so the fix likely landed inside a squash-merged batch, but the current
   source is unambiguous.
   **However, `promote-to-component` (bin/fgos.mjs:3495 →
   `src/runner/promote-engine.mjs:73`) still calls `mergeRunnerItem` directly
   with no `withLockRetry` wrapping at all** — the asymmetry the description
   worried about is real, just not where it said: it's `promote-to-component`
   that's still exposed, not `approve`/`sync-root`.
7. **Confirmed, line number exact** — `src/runner/merge.mjs:747-748`: "so
   `withLockRetry` (lock-wait.mjs), which already retries any
   `code:'lock-held'` throw with backoff, transparently covers this too".

**Still open:** none of the 7 points are unresolved as evidence gaps, but
point 6 means the description's proposed fix step 3 ("wire approve through
withLockRetry ... closing the asymmetry") is **already done** for approve and
sync-root, and needs re-scoping to `promote-to-component` instead. This is a
scope decision (which fix items are still in scope, whether promote-to-component
even needs it since it merges in an ephemeral worktree rather than the shared
main checkout — worth checking before assuming the same fix applies) that a
person should make, not something this stage decides for them.
