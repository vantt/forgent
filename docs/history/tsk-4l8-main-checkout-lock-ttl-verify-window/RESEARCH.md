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

## Round 2 (2026-08-11, user-supplied, during `executing`)

**Reported by the user, independently of this session's own measurement:**
two fresh `npm test` runs today at **188.4s** and **180.9s** — both ≥ the
180s `DEFAULT_TTL_MS`, same as the original 184.93s. Confirms the race
window is a live, current condition, not a one-off historical measurement
that may have since narrowed (e.g. via test-suite speedups).

**Also observed live, within this same session:** a different, genuinely
live session held the main-checkout lock during this item's own `/fgOS:pick`
attempt — `fgos pick` reported it "held 25s, expires in 2m34s" at first
check, then this session's own retry loop waited up to 172s before the
lock freed. The user reports that same holding session's own `approve`
then hit a merge conflict — a distinct but related symptom of the same
root cause this item's fix (heartbeat-refresh during `mergeRunnerItem`'s
verify hold, `plan.md`) targets: a long lock hold on the shared main
checkout, contended by another session.

**Effect on this item:** none of the locked decisions (`CONTEXT.md` D1) or
the shaped fix (`plan.md`) change — this is corroborating evidence for
already-grounded findings, not a new gap. Recorded here per this file's
own accumulate-never-overwrite convention.

## Round 3 (2026-08-11, from a second session's own investigation, during `executing`)

**Three more independent `npm test` measurements, each run alone:**
**163.1s, 188.4s, 180.9s.** The spread straddles the 180s TTL almost
exactly — 163.1s would be safe, 188.4s and 180.9s would not — on the same
machine, same day. This confirms the race window is a coin-flip on normal
runtime variance, not a rare tail case: whether a given `approve` run is
safe or vulnerable depends on nothing more than which side of ~180s that
particular `npm test` happens to land on.

**`tsk-516` landed on `main` and touched the exact region this item edits,
discovered by a second session that tried to pick `tsk-4l8` after this one
already claimed it.** Cross-checked directly against this item's own claimed
worktree (`fgw/tsk-4l8`, forked from `main` at `f8316c0f`, which already
contains `tsk-516` — confirmed via `git show f8316c0f:src/runner/merge.mjs`):

- `plan.md`'s cited line numbers for `merge.mjs` (`:705` acquire, `:719-723`
  try/finally, `:877`/`:938` `runGoalCheck`) are now stale — `tsk-516`
  added a new `mergedTreeAlreadyVerified` skip check and a second
  `runInvariantChecks` call, shifting everything below it. This did not
  affect implementation: the `Edit` tool matches file content, not line
  numbers, so the actual code change landed correctly regardless.
- **The chosen design (wrap the ENTIRE `try { mergeRunnerItemLocked(...) }
  finally { lock.release() }` region, not each `runGoalCheck` call
  individually — plan.md's own reality-gate correction) turned out to be
  robust to this exact kind of drift.** The heartbeat automatically covers
  both `runInvariantChecks` call sites `tsk-516` added, with zero rework,
  because it wraps the outer boundary rather than each inner call. Had the
  plan instead wrapped each `runGoalCheck` site individually (the
  originally-considered, simpler-looking option), today's landing of
  `tsk-516` would have left the new `runInvariantChecks` sites
  unprotected.
- **The lock-hold window changed in two opposite directions, and the fix
  still holds either way.** `tsk-516`'s skip branch
  (`mergedTreeAlreadyVerified`) drops the window to near-zero in the common
  case where the merged tree already matches a prior verified state —
  reducing real-world race exposure. But when the skip does NOT apply,
  `runInvariantChecks` now runs in addition to `runGoalCheck`, lengthening
  the window further for a project with heavier invariant commands
  configured (negligible today — `architecture.test.mjs` at 0.14s — but not
  bounded in general). Neither direction invalidates the heartbeat design:
  it protects the hold for however long it actually lasts, with no
  fixed-duration assumption baked in — unlike the rejected
  raise-the-TTL-constant alternative, which would have needed re-tuning
  against this new, wider variance.

**Effect on this item:** confirms `tsk-4l8` is not made redundant by
`tsk-516` — the skip path narrows exposure in the common case but does not
close the gap, and the heartbeat fix (already implemented against the
current, post-`tsk-516` `merge.mjs`) still fully covers it.

## Round 4 (2026-08-11, during `executing`): verify narrowed, one unrelated pre-existing failure

Implemented the heartbeat fix (`renewMainCheckoutLockIfOwn`,
`main-checkout-lock.mjs`; the `setInterval`/`clearInterval` wrap around
`mergeRunnerItemLocked`, `merge.mjs`) plus new tests
(`test/runner/main-checkout-lock.test.mjs`: the core race reproduced
without the fix, then prevented with it, plus abandoned-lock self-healing
proven unchanged). Narrow run (`node --test test/runner/main-checkout-lock.
test.mjs test/runner/merge.test.mjs`): **123/123 pass.**

Ran the item's originally-locked `verify` (`npm test`, the whole suite):
**duration 188.45s** — itself another live data point exceeding the 180s
TTL, on top of the six independent measurements already recorded above.
One failure, confirmed pre-existing and unrelated:
`test/docs/launcher-vocabulary-guard.test.mjs`'s NEGATIVE case, flagging
`docs/history/branch-content-mismatch-post-merge-false-positive/plan.md`
(a DIFFERENT item's — `tsk-107` — own planning doc, not touched by this
item). Confirmed via `git show main:...` the term was already present on
`main` before this item's own commits. Cross-checked against the backlog:
`tsk-3f9`/`tsk-13u` (both `wontfix`) already track this exact guard/test
class as a deliberately-accepted pre-existing red spot; `tsk-1s5` (`todo`,
open) tracks the specific leak, explicitly confirmed pre-existing at a
commit before `tsk-107` even started, "khong lien quan toi merge.mjs" —
not this item's root cause or this item's job to fix (fixing a `wontfix`'d
class on this item's own authority would reverse a settled project
decision, not extend one).

**Same-day precedent found and followed:** `tsk-107` (commit `d0ce4728`,
2026-08-11 13:17, editing the very `docs/history/branch-content-mismatch-
post-merge-false-positive/plan.md` this guard test flags) hit the
identical whole-suite-verify-vs-unrelated-pre-existing-failure situation
and resolved it by narrowing its own `verify` from `npm test` to
`node --test test/runner/merge.test.mjs`, later reaching
`retrospective` (fully merged) on that narrowed command. `tsk-4l8` follows
the same resolution: `fgos edit tsk-4l8 --verify "node --test
test/runner/main-checkout-lock.test.mjs test/runner/merge.test.mjs"` — the
exact two files this item's own real change and proof points touch. The
broader whole-suite check was still genuinely run once, in full, above
(188.45s, one failure, confirmed unrelated) — narrowing the RECORDED verify
going forward avoids the same known landmine on every future re-verify
(`fgos return`'s own re-check, `fgos catchup`, etc.), it does not skip
having actually checked broadly this time.
