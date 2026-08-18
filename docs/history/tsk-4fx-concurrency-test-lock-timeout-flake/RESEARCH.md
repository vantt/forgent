# tsk-4fx — RESEARCH.md

## Round 1 (2026-08-13)

**Asked:** Where does the fixed 2000ms events-lock timeout the item names
actually live — is it a test-side value, or baked into production code?
Which exact tests are "the four"? Is there an existing scalable-retry
pattern to reuse?

**Checked:**
- `grep -n "2000" test/state/store.test.mjs test/state/porting-store.test.mjs`
  → **no hits**. The 2000ms value is NOT a test-side constant.
- `grep -rn "2000\|lockTimeoutMs\|LOCK_TIMEOUT" src/state/*.mjs` →
  `src/state/events.mjs:50`: `const EVENTS_LOCK_TIMEOUT_MS = 2000;`, used
  as the default `timeoutMs` for `acquireEventsLock`
  (`events.mjs:357`) and threaded through `withEventsLock`
  (`events.mjs:400-406`), the shared critical-section helper
  `store.mjs`'s `addWork`/`editWork`/`moveWork`/`moveStage` all use. No
  caller anywhere passes an override — `withEventsLock(logPath, fn)`
  takes no options — and there is no env var override
  (`grep -n "process.env" src/state/events.mjs` → no hits). The comment
  at `events.mjs:41-48` documents this as a deliberate design constant:
  "2s is generous headroom for genuine contention... yet short enough
  that a truly stuck/deadlocked path surfaces as a clear 'lock-timeout'
  error instead of hanging a CLI command indefinitely." This is a global,
  load-bearing production default used by every mutation in the repo, not
  a scoped test knob.
- **This item's own declared footprint is `test/state/store.test.mjs` and
  `test/state/porting-store.test.mjs` only** — `src/state/events.mjs` is
  not in it. Changing the global production constant would be a
  materially different, much wider-blast-radius change than what the
  item scoped itself to.
- The item's own fix direction offers TWO options, not one required path:
  "make the lock acquisition budget in these tests scale... OR serialise
  the cases that contend for the same events lock." The second option is
  fully achievable inside the declared footprint with zero production
  changes.
- "The four" — `grep -n "^test(.*[Cc]oncurrent"` on both files finds SIX
  concurrent tests total (3 per file): two "racing the SAME id" tests
  (small `N=6`, real fork()'d OS processes, `raceAcrossProcesses` in each
  file) and one "concurrent ... calls on DIFFERENT ids" test (much
  higher volume: `store.test.mjs:674` — `N_PROC=16`, `N_EDITS=30` = 480
  total lock acquisitions; `porting-store.test.mjs:248` — `N_PROC=16`,
  `IDS_PER_PROC=15` = 240 total). The item's own decision log (added
  today, 2026-08-13) concretely reproduces exactly these two
  "DIFFERENT ids" tests with real before/after timing (930ms/988ms
  isolated vs 5.2s/6.9s under load) — the highest-volume tests, and the
  ones a fresh incident actually named. The two lower-volume "SAME id"
  tests (`N=6`) were not reproduced as failing in either round of
  evidence; "up to four" in the item's original description is an upper
  bound observed in an earlier full-suite run, not a confirmed-every-time
  count.
- `raceAcrossProcesses` (defined identically in both files,
  `store.test.mjs:48-86` / `porting-store.test.mjs:35-...`) synchronizes
  ALL `nProcesses` child OS processes to start at the exact same instant
  (`Atomics.wait` to a shared `startAt` timestamp) — this is what
  maximizes SIMULTANEOUS contention against the one shared `events.lock`
  file. `acquireEventsLock`'s deadline (`events.mjs:361`,
  `Date.now() + timeoutMs`) is computed fresh per individual acquisition
  attempt, not once for the whole test — so the failure mode is: at some
  single one of the 480 (or 240) total lock acquisitions, too many
  processes are simultaneously retrying the SAME lock at that instant (or
  the machine is too CPU-starved to schedule this process's retries
  often enough) for that one attempt to succeed inside its own 2s window.
  Reducing how many processes contend for the lock AT THE SAME TIME
  (without changing the total operation count, so the race semantics
  being tested are unchanged) directly reduces the odds of any single
  attempt exceeding budget — this is the "serialise the cases that
  contend for the same events lock" the item names, applied as
  batching the child-process start rather than firing all N at once.
- No existing scalable/adaptive-retry helper pattern found elsewhere in
  `test/` for this kind of budget (`rg -n "adaptive|scalingRetry|retry.*contention" test/` →
  no hits) — nothing to reuse; the batching approach above is the
  smallest change that stays inside the declared footprint.

**Found:** Fix direction: add an optional `batchSize` parameter to
`raceAcrossProcesses` in both files (default `nProcesses`, so the two
existing lower-volume "SAME id" tests — which have never been observed
failing — are byte-for-byte unaffected), then pass a smaller batch size
(e.g. `4`) specifically at the two confirmed-flaky "DIFFERENT ids" call
sites. This lowers peak simultaneous lock contention without changing
total operation count or the cross-process race semantics under test,
stays entirely inside the item's own declared footprint, and requires no
production code change.

**Still open:** Nothing — this closes the item's only open question. The
choice between the item's two offered fix directions is resolved by
evidence (footprint mismatch + no override hook for direction 1), not a
coin flip between equally valid options.

## Verdict

`clear` — `verify: "npm test"`
