# RESEARCH: unbounded `ps` calls inside the held global write lock

## Round 1 (tsk-13m, stage discovery)

**Checked:** `src/runner/session-identity.mjs` (`resolveWriterIdentity`,
`ppidOf`), `src/state/store.mjs` (all 3 call sites: `editWork`-shaped
patch at :362, `moveWork` at :524, `moveStage` at :765 — all inside
`withEventsLockAndRefresh`'s locked callback), `src/state/events.mjs:41-51`
(events-lock timeout sizing doc), `test/runner/session-identity.test.mjs`
(existing coverage and fake-`execFile` injection pattern).

**Confirms the item's own claim:** `ppidOf` (`session-identity.mjs:96-104`)
calls `execFile('ps', ['-o', 'ppid=', '-p', String(pid)], { encoding:
'utf8' })` with no `timeout` in the options object. `execFileSync`'s
default (the real `execFile` in production) is `timeout: undefined` — no
bound. `resolveWriterIdentity` walks up to `MAX_HOPS = 3` such calls, and
all 3 call sites that invoke it (`store.mjs:362`, `:524`, `:765`) do so
INSIDE the same `withEventsLockAndRefresh` closure that holds the single
cross-process `events.lock` — the "one door" every mutating verb funnels
through (`events.mjs`'s own header comment).

**The documented invariant this genuinely violates:** all 3 call sites'
own comments claim `resolveWriterIdentity` "never blocks the mutation
(D18)" (e.g. `store.mjs:360-361`). An unbounded `execFileSync` can hang
indefinitely if the `ps` binary itself hangs (D-state process, a
misbehaving `/proc`, a container pid-namespace edge case) — the
implementation does not actually guarantee what its own comment already
promises. This is the real, narrow bug: not a missing feature, a gap
between a written invariant and what the code actually does.

**Measured (item's own numbers, plans/reports/project-instability-scan-
260809-1608-ship-faster-stability-report.md):** 0.2ms when a session env
var is set (skips the `ps` path entirely), 31.7ms when absent (bare
terminal, git hook, CI) — the normal, non-hung 3-hop walk. `events.lock`'s
own 2s timeout is sized for "sub-millisecond to low-ms" holders
(`events.mjs:41-51`); a single hung `ps` call blocks the ONE process
holding the lock for as long as `ps` itself hangs, blocking every OTHER
`fgos` process waiting on that same lock behind it once their own 2s
acquire-timeout is reached.

**Walk-stops-on-first-failure (checked directly in `resolveWriterIdentity`,
:135-144):** the hop loop returns immediately the first time `ppidOf`
returns `null` (whether from `ps` exiting non-zero, being absent, or —
once a timeout is added — timing out). A single hung `ps` call therefore
costs at most ONE timeout period, never up to 3.

**Scope boundary vs the related item cited in this item's own
description:** `tsk-r87` already separately tracks the broader
"`events.lock`'s own hold-time budget (65-88ms measured body) vs its 2s
timeout being sized for sub-ms work" question — this item's own
description explicitly points at it ("Đi kèm bối cảnh... xem item
tsk-r87") rather than folding it in. This item stays scoped to the one
concrete, narrow gap: `ppidOf`'s `execFileSync` call has no timeout at
all, contradicting the already-documented D18 "never blocks" invariant.

**Fix shape confirmed safe:** `ppidOf`'s existing `try { ... } catch { return
null; }` already treats every `execFileSync` failure identically (ps
absent, non-zero exit, unparsable output) — a timeout-induced throw is
caught by this SAME existing catch, with zero new branching. Adding
`timeout: <ms>` to the options object is the whole fix; no restructuring
of where `resolveWriterIdentity` is called (inside vs. outside the lock)
is needed to satisfy D18's literal claim, and moving it would still not
bound `ps` itself — only a timeout does that regardless of position.

**Verdict:** `{clear: true, verify: "node --test test/runner/session-identity.test.mjs test/state/events.test.mjs && npm test"}`
