# main-checkout-lock TOCTOU race — locked decisions

Item: `tsk-2tm`. Bug: `tryAcquireOnce()` (`src/runner/main-checkout-lock.mjs:135-218`)
creates a fresh lock in two separate syscalls — `fs.openSync(lockPath, 'wx')`
then a later `fs.writeSync(fd, ...)` (lines 137-142) — leaving a real window
where the file exists on disk with zero/partial bytes. The self-recognition
refresh branch (line 165) writes non-atomically too: `fs.writeFileSync`
truncate-in-place, not write-then-publish. A reader (`claimWork`) landing in
either window sees unparseable content, `parseLockContent()` returns `null`,
and `acquireMainCheckoutLock` fail-closes to AMBIGUOUS even though no writer
is genuinely contending. Observed in production: `/fgOS:pick tsk-3lx`
(2026-08-03 08:37:42) hit AMBIGUOUS with no `lockAgeMs` suffix — matching the
unparseable-content branch (line 157-158), not the missing-ttlMs branch
(line 183, which does carry `lockAgeMs`) — 91s after an automated commit at
08:36:11 inside the 3-minute TTL window, where the correct outcome would
have been HELD.

## Feature boundary

Fix the write-side race in `src/runner/main-checkout-lock.mjs` only, for
both paths that populate the lock file: the fresh-create path
(`tryAcquireOnce` lines 137-142) and the self-recognition refresh path
(line 165). No behavior change to `parseLockContent`, `inspectMainCheckoutLock`,
`releaseMainCheckoutLock(IfOwn)`, or `forceReclaimAmbiguousLock` — their
existing AMBIGUOUS/HELD/stale semantics are correct and untouched; only the
window that produces a *false* AMBIGUOUS on a torn read closes.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Fix scoped to `src/runner/main-checkout-lock.mjs` only. The header comment (lines 7-14) names three sibling locks sharing the same wx-atomic-create lineage (`loop.mjs`'s `acquireRunnerLock`, `session.mjs`'s `acquireSessionsLock`, `events.mjs`'s `acquireEventsLock`) but the item's own title/description name only this file. Sibling locks are explicitly out of scope for tsk-2tm — if the same torn-read race exists there, it is a separate future item, not silently bundled into this one. |
| D2 | The fix must eliminate the torn-read window for BOTH the fresh-create path and the self-recognition refresh path (both cited in the bug description) — fixing only one leaves the other producing the same false-AMBIGUOUS failure mode. |
| D3 | The fix must NOT weaken the existing mutual-exclusion guarantee: two processes racing to create a genuinely NEW lock must still result in exactly one ACQUIRED and one EEXIST/retry outcome (today's `wx`-create semantics). This is a correctness constraint on the fix, not a prescribed technique — the concrete mechanism (e.g. write-to-temp-then-publish vs. a single pre-serialized `wx` write) is `fgos-coding-planning`'s call. |
| D4 | Acceptance requires a regression test in `test/runner/main-checkout-lock.test.mjs` that proves the eliminated window (e.g. a reader observing the lock file mid-acquire never sees unparseable/partial content), run via `node --test test/runner/main-checkout-lock.test.mjs`, plus the full suite (`npm test`) green. No existing test in that file currently covers this race (scouted: existing tests cover ACQUIRED/HELD/AMBIGUOUS/reclaim/release outcomes on already-settled lock files, never a read concurrent with an in-progress write). |

## Scout evidence cited

- `src/runner/main-checkout-lock.mjs:135-218` (`tryAcquireOnce`) — the two-step
  create (137-142) and non-atomic refresh (165).
- `src/runner/main-checkout-lock.mjs:1-45` — module header naming the shared
  wx-atomic-create lineage (`loop.mjs`, `session.mjs`, `events.mjs`) and D5/D6
  divergences (AMBIGUOUS-on-unparseable, ttlMs, self-recognition).
- `src/runner/main-checkout-lock.mjs:113-125` (`parseLockContent`) — empty or
  partial content parses to `null`, treated as AMBIGUOUS, never free/stale.
- `test/runner/main-checkout-lock.test.mjs` — existing coverage (57-420+),
  confirmed no concurrent-read-during-write case exists today.
- `src/runner/claim-port.mjs`, `src/runner/merge.mjs`, `src/runner/lock-wait.mjs`
  — callers of `acquireMainCheckoutLock`, confirming `claimWork` is the real
  reader that hit the production AMBIGUOUS.
- `.fgos/gate-bypass.json` — `{"level":"standard"}`; item `tier: light` is
  covered by `standard` (D5, `docs/history/gate-bypass/CONTEXT.md`).
- `fgos tool query --capability impact-analysis --status present` — GitNexus
  registered and `present`: impact-analysis posture is **full**. `fgos-coding-planning`/
  `fgos-coding-validating`/`fgos-coding-implement` must run `impact()` on
  `tryAcquireOnce`/`acquireMainCheckoutLock` before editing, per `CLAUDE.md`'s
  gate.

## Outstanding questions

None — no unstated product decision remains open. Implementation technique
(D3's "how", test shape beyond D4's proof requirement) is `fgos-coding-planning`'s
job.
