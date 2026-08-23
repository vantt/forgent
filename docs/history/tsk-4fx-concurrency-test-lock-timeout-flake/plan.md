# tsk-4fx — plan.md

Mode: small

Flag count: 0 (auth, authorization, data model, audit/security, external
systems, public contracts, cross-platform — none apply). Two test files,
one shared helper function duplicated across them, no gray areas about
what to change — but real engineering judgment was needed to pick which
of the item's two offered fix directions is actually achievable inside
the declared footprint (RESEARCH.md Round 1), which is why this is
`small` rather than `tiny`.

## Approach

Add an optional `batchSize` parameter to `raceAcrossProcesses` (defined
identically in both `test/state/store.test.mjs` and
`test/state/porting-store.test.mjs`), defaulting to `nProcesses` — byte-
identical behavior for every existing call site unless a caller opts in.
Chunk the `nProcesses` child-process fleet into sequential batches of
`batchSize`, each batch synchronized to its own `Atomics.wait` start
instant exactly as today, awaited to completion before the next batch
starts. Pass a smaller `batchSize` (4) at the two confirmed-flaky
"DIFFERENT ids" call sites only (`store.test.mjs:674`,
`porting-store.test.mjs:248`).

**Why this is real, not cosmetic** (RESEARCH.md Round 1): `acquireEventsLock`'s
2s deadline (`src/state/events.mjs:361`) is computed fresh per individual
lock-acquisition attempt, not once for the whole test. The failure mode
is one single attempt, among hundreds, landing in a window where too many
sibling processes are simultaneously retrying the same lock (or the
machine is too CPU-starved to schedule this process's retries often
enough) to succeed inside 2s. Fewer processes contending AT THE SAME
INSTANT directly lowers that odds, without changing the total operation
count (480 for the store test, 240 for the porting-store test — same as
today) or the cross-process race semantics under test (each batch is
still genuine concurrent OS-process racing).

**Alternatives rejected:**
- Scaling `EVENTS_LOCK_TIMEOUT_MS` (`src/state/events.mjs:50`) itself, or
  adding an override parameter to `acquireEventsLock`/`withEventsLock` —
  rejected. This item's own declared `footprint` is the two test files
  only; `src/state/events.mjs` is a global, load-bearing production
  default (its own comment: "short enough that a truly stuck/deadlocked
  path surfaces as a clear lock-timeout error instead of hanging a CLI
  command indefinitely") used by every mutation in the repo. Changing it
  is a materially wider, riskier change than what this item scoped
  itself to, and the item's own text offers a second option ("serialise
  the cases") that fully resolves the flake without touching it.
- Reducing `N_EDITS`/`IDS_PER_PROC` (lowering total volume) instead of
  batching — rejected. The existing code comment at `store.test.mjs:677`
  already documents that this exact tuning was tried before ("a higher
  N_PROC*N_EDITS was tried and caused genuine lock-timeout contention
  unrelated to the refreshView race this test targets") — the volume is
  already at the tuned-down floor for what the refreshView race itself
  needs to reproduce reliably; lowering it further risks losing the
  original regression coverage (tsk-1q5) rather than fixing the flake.
- A test-level catch-and-retry wrapper around a `lock-timeout` error
  specifically — rejected as a more invasive, less targeted change than
  reducing peak contention directly, and it would mask a REAL future
  regression in a way that looks identical to a benign flake (both
  produce the same error category) unless a bounded retry count is
  chosen carefully; batching removes the root mechanical cause instead
  of catching its symptom.

**Risk map:**

| Component | Risk | What proves it |
|---|---|---|
| `raceAcrossProcesses` (both files) + the two flaky call sites | light | Default `batchSize = nProcesses` keeps every other call site (both "SAME id" tests, never observed failing) byte-for-byte unchanged — no new risk introduced there. `npm test` full suite green proves the two "DIFFERENT ids" tests keep passing their own real assertions (no lost writes) with batching in place, not just that they stop timing out. |

No medium/high risk items — pure test-code change, no production path,
no new production dependency.

**Impact-analysis posture:** `full` — GitNexus is present and fresh
(re-indexed earlier this session, per tsk-5zg's own plan.md check on
this same session). `impact({target: "raceAcrossProcesses", direction:
"upstream"})` on both copies confirms each is called only from within its
own defining file (`store.test.mjs` / `porting-store.test.mjs`) — no
external importer, so blast radius is fully contained to the two files
already in scope.

## Shape

Single piece, no split — one helper-function change duplicated
identically in two files, plus a one-line call-site change in each. No
new file, no new test needed (the existing two "DIFFERENT ids" tests
already assert the correctness property; this change only needs to prove
they now pass reliably, which `npm test`'s own green run demonstrates
directly — running under whatever load level a session happens to have
at verify time).

Verify: `npm test` (unchanged from discovery — the item's own recorded
verify already covers this: a full green run proves both that the
flaky tests now pass and that nothing else regressed).

## Outstanding questions

None
