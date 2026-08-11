# RESEARCH: main-checkout lock TTL shorter than verify window (tsk-4l8)

## Round 1 (tsk-4l8, stage discovery)

**Asked:** is the item's own claimed mechanism (lock TTL 180s shorter than
the verify window it must cover, causing a living holder's lock to read as
free) already sufficiently grounded, or does an open question remain
before this item can proceed to `exploring`/`decompose`?

**Checked (repo, direct read, not summarized from memory):**
- `src/runner/main-checkout-lock.mjs:80` — `DEFAULT_TTL_MS = 3 * 60 * 1000`
  (180s). File's own header comment (lines 70-90) already documents this
  exact tension: "DEFAULT_TTL_MS's 3-minute window was sized for a
  DIFFERENT consumer's needs (mergeRunnerItem's long verify hold,
  merge.mjs:660, measured up to ~185s in practice)".
- `src/runner/main-checkout-lock.mjs:201-236` — `held = pidLive &&
  withinTtl` for a numeric-pid holder; `withinTtl = now - record.ts <=
  ttlMs`. Confirmed: a live holder (`pidLive === true`) still computes
  `held === false` once `now - record.ts > ttlMs`, with no age-refresh
  path for this case — the file's caller then treats the lock as free and
  unlinks it.
- `src/runner/merge.mjs:705` — `mergeRunnerItem` acquires the lock exactly
  once (`acquireMainCheckoutLock(fgosDir, { identity, ttlMs:
  DEFAULT_TTL_MS, releaseOnExit: true })`), before the first git call.
  Grepped the whole file for `refresh`/`heartbeat`/repeat `acquire` calls
  inside the merge-verify-commit path: none found — the only other
  `acquireMainCheckoutLock`-adjacent activity is the pre-commit hook's own
  acquisition at final `git commit` time, which refreshes only via D6
  self-recognition (same identity) and only fires AFTER `runGoalCheck`
  (line 877, inside `mergeRunnerItemLocked`) has already run to
  completion — i.e. no refresh happens *during* the verify hold itself.
- `plans/reports/project-instability-scan-260809-1608-ship-faster-
  stability-report.md:221-239` — independently reaches the identical
  mechanism (same three file:line citations) and reports a real
  measurement: `npm test` took **184.93s**, exceeding the 180s TTL.
  Explicitly dedupes against `tsk-4l8` ("supplies the mechanism that item
  was missing") and names the existing band-aids this bug is the root
  cause of (`merge.mjs:773-806` MERGE_HEAD guards, `tsk-18a`, `tsk-2j9`).

**Found (confirms item's own claim, no discrepancy):** every citation in
tsk-4l8's description checks out against the current repo state exactly as
written — same line numbers, same mechanism, same absence of a heartbeat.
The 184.93s measurement is corroborated by an independent report, not
self-reported by the item alone.

**Still open (not this item's investigation, but its next stage's job):**
whether/how to fix it (raise TTL further, add a heartbeat refresh during
`runGoalCheck`, or something else) is a design/scope decision, not a
grounding gap — left for `exploring`/`decompose`, per this skill's own
scope boundary (never architecture/product decisions here).

**Verdict:** `clear: true`. The item's own `verify` field ("chưa xác định
— P15 bổ sung") is left as-is — no real runnable command exists yet for
"investigate", and the item's own placeholder already defers this to a
later stage (P15).
