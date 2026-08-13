# Research: tsk-597 — porting-store race test flakes under machine load

## Round 1 — 2026-08-13 (fgos-researching, called from fgos-coding-discovering)

**Asked:** Mandatory rescan. Item's own 2026-08-12 update already confirms
the real product-side race (tsk-1jp) is fixed and landed, explicitly says
not to touch that again, and points at two closed siblings (tsk-3wn,
tsk-1u7) for the pattern to follow before choosing a direction. Confirm:
is tsk-1jp's fix really on `main`? What did tsk-3wn/tsk-1u7 actually do
(not just their description — their real diff)? Does either pattern
transfer directly to `test/state/porting-store.test.mjs`'s own race
tests?

**Checked:**
- `git log --oneline main -- src/state/porting-store.mjs` — confirmed
  `1d8ec953 fix(tsk-1jp): wrap porting-store's read-check-append in one
  lock scope` is on `main`'s history.
- `git show 1ab6e0a0` (tsk-3wn's real fix commit, full diff) —
  `test/state/events.test.mjs` only.
- tsk-1u7's own commit sequence (`git log --grep tsk-1u7`) — shows a
  REVERSED initial assumption ("reverse D1/D2 (D3/D4) — real TOCTOU race
  confirmed"): it started as an assumed test-sizing issue and turned out
  to be a genuine bug in `session.mjs`'s own lock create-vs-write
  sequence. Cited as a cautionary precedent, not a template to copy
  blindly.
- `test/state/porting-store.test.mjs:204-253` (the two race tests) and
  `raceAcrossProcesses` (lines 43-86) — read in full.
- `src/state/events.mjs:48-400` — `EVENTS_LOCK_TIMEOUT_MS = 2000`,
  `EventLogError`'s `category` contract (line 54-56: `'lock-timeout'` is
  one of a small, stable set), `withEventsLock` (no configurable timeout
  parameter exposed).
- Empirical baseline (this session, quiet machine): both race tests pass
  in ~350ms each — matches the item's own cited "344ms isolated run"
  figure closely.

**Found:**

1. **tsk-3wn's actual mechanism does not transfer directly.** tsk-3wn's
   test queued `N_PROC × N_APPEND = 800` serialized lock acquisitions
   against the SAME 2000ms-per-acquisition deadline — a real
   queue-depth-vs-budget mismatch, fixed by cutting to `8 × 15 = 120`
   (still a genuine stampede, ~5x headroom). `porting-store.test.mjs`'s
   own two race tests already use `N = 8` — a SINGLE round each (8 total
   acquisitions, not 800) — already at the same "8 real OS processes is
   the minimum for a genuine stampede" floor tsk-3wn's own fix
   established. There is no slack left to cut without weakening the
   test's own ability to expose the real interleaving tsk-1jp's fix
   guards against.

2. **tsk-1u7 is a cautionary tale, not a template**: it shows that an
   assumed-flaky concurrency test can hide a real bug. Its own resolution
   (fixing a genuine TOCTOU race in `session.mjs`) does not apply here —
   this item's own 2026-08-12 update already confirms, with a real commit
   citation, that the product-side race this test guards (tsk-1jp) is
   fixed; the remaining question is the TEST's own load-sensitivity, a
   narrower claim than tsk-1u7's.

3. **A safe, machine-considerate empirical test was not run.** This
   machine currently has another live session actively working
   (confirmed: `tsk-1yt` shows `status: doing`, and the earlier `pick`
   call for this very item waited ~137s on a real, held
   `main-checkout.lock`). Deliberately inducing heavy CPU/IO load to
   reproduce the flake would risk disrupting that session's own work —
   not attempted.

4. **A mechanical, already-available distinction exists between
   "genuine loss" and "environmental timeout".** `raceAcrossProcesses`'s
   child script already captures and forwards `err.category`
   (`porting-store.test.mjs:55`). The two race tests currently assert
   every losing racer's category is exactly `'validation'`
   (`addPorting`) or `'conflict'` (`movePorting`) — the categories a
   REAL race loss produces. `EventLogError('lock-timeout')`
   (`events.mjs:379`) is a categorically different, stable, distinct
   value — an environmental "the lock wasn't free within its budget"
   signal, never a statement about which racer legitimately won or lost.
   Today, a `'lock-timeout'` result would fail the test's own
   `assert.equal(f.category, 'validation', ...)` line — exactly the
   shape of failure the item's own report describes (single test red,
   nothing else, machine loaded, retry green).

5. **Arithmetic case for why this can happen even at N=8**: unlike
   tsk-3wn's queue-depth mismatch, the exposure here is plausibly
   PER-ACQUISITION time inflating under system-wide contention (disk I/O
   shared with other concurrent `npm test`/merge processes), not queue
   depth. 7 losing processes each retry-polling for a lock a slower
   winner is slow to release could plausibly approach the 2000ms ceiling
   under heavy load even with only 8 total acquisitions — this is
   supported by the item's own cited 162s-vs-47s (~3.4x) whole-suite
   slowdown figure, not verified by direct reproduction (finding 3).

**Verdict basis:** no product-judgment gap and no further product-code
fix needed (tsk-1jp already closed that). The fix: make the two race
tests tolerant of a `'lock-timeout'`-categorized result specifically —
retry the whole race (fresh temp dir) up to a small bounded count when
(and only when) that exact category appears among the results, never
when the failure is a genuine assertion violation (wrong success count,
wrong category for an expected loser). This is test-only, does not touch
`src/state/events.mjs`/`porting-store.mjs` (mirroring tsk-3wn's own
"production untouched" discipline), does not reduce `N` (preserving the
established stampede-minimum), and is mechanically distinct from "just
retry the red state" (fgos-coding-implement's own guidance against that)
because the retry trigger is a specific, already-defined, non-assertion
error category — not a blind re-run hoping for green.
