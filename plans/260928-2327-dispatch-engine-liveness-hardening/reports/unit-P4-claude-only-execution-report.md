# Phase 4 (Unit P4) — Claude-only execution report

Worktree `.claude/worktrees/dispatch-engine-liveness-p4-provider-capacity-stale-reclaim`,
branch `unit/P4`, base `main@dc18f6bc0`.

Fixes S3 (audit MEDIUM): `provider-capacity.mjs`'s `withFileLock` stale-reclaim
race lost a lease 17/25 trials under concurrent contention against a
pre-seeded stale lock (dead pid).

**This report supersedes an earlier version of itself.** Round 1's design
(re-read-before-unlink) was reported as fixed and passing, but Lead
independently reran the same test repeatedly and reproduced real failures
close to 50% of the time, then proved a genuine double-critical-section
entry directly with a marker-file probe (not just inferred from a lost
lease). Rounds 2 and 3 below are the real, final design — round 1's design
is kept in git history only, not carried forward here.

## Round 1 (superseded): re-read-before-unlink

Initial fix used `main-checkout-lock.mjs`'s re-read-before-unlink pattern:
re-read the lock file immediately before `unlinkSync`, only unlink if
content matched what was judged dead. Self-tested with an unsynchronized
race test and reported 0/15 failures — insufficient evidence, as Lead's
re-run demonstrated.

**Why it was actually unsafe**: re-reading before unlink narrows the race
but cannot close it, because `unlinkSync` itself has no compare-and-swap
semantics — it deletes whatever is CURRENTLY at the path when it runs,
regardless of what the caller most recently read. Two contenders can both
pass the "content still matches" check (neither has unlinked yet), then
both call `unlinkSync` — the second one to actually delete deletes
whichever fresh lock the first one's own reclaim-and-recreate had already
published, letting a third contender in concurrently. Root-caused with a
Lead-supplied marker-file exclusivity probe (an `fs.openSync(marker, 'wx')`
inside the critical section, using the SAME atomic primitive the lock
itself relies on) — this proved genuine double-holding directly,
independent of the state.json-loss symptom.

## Round 2: switch to a generation ledger (provably atomic)

Redesigned onto an append-only generation ledger — the same class of
pattern `run-lock.mjs` already proves correct for Run control-epoch
fencing, but **reimplemented locally** in `provider-capacity.mjs` rather
than imported, because `run-lock.mjs` is explicitly on this repo's own
banned-import list for `provider-capacity.mjs`
(`test/runner/dispatch-reconciliation-import-graph.test.mjs`'s
`BANNED_FILES`, which documents `provider-capacity.mjs` as a PROVEN LEAF
reachable from `reconcile.mjs`'s quarantine-clear action, required to have
"no further relative imports to walk"). Discovered this constraint by
reading the import-graph test directly before implementing, not by
guessing — confirmed the constraint is real and still holds after the
change (import-graph tests re-run, 42/42 pass, `provider-capacity.mjs`
still imports only `node:crypto`/`node:fs`/`node:os`/`node:path`/
`provider-adapter.mjs`/`process-identity.mjs`).

Mechanism: each acquisition publishes a NEW, higher-numbered generation
record via an EXCLUSIVE hard link (`fs.linkSync`, atomic — `EEXIST` if a
concurrent contender already published that exact number). The mutating
step itself is the arbiter of who wins, not a belief formed from an
earlier read, so there is no TOCTOU window. A dead holder is reclaimed by
simply publishing the next generation (never deleting the dead one); a
lost race means re-reading the ledger fresh and re-deciding against the
real winner.

**First version of round 2 still pruned old generations** (best-effort
delete of every generation strictly below the one just won, to bound this
high-frequency lock's directory growth) — and Lead's own continued
real-load reproduction found this pruning caused a NEW race: a slow
contender that computed `nextEpoch = N` long ago, then got CPU-preempted
before its own `fs.linkSync` call actually ran, could wake up after epoch
N was won, released, superseded, AND pruned — and its now-stale
`fs.linkSync` for epoch N succeeds again (the path is free), granting a
second, phantom lock concurrently with the real current holder. Confirmed
via the same marker-file trace technique, full event log captured (see
"Investigation" below).

## Round 3 (final): no pruning, matching run-lock.mjs's own invariant exactly

Removed generation pruning entirely. An epoch number, once published, is
NEVER deleted or reused — matching `run-lock.mjs`'s own documented
invariant ("nothing here ever unlinks or overwrites a published record")
exactly, which exists for precisely this reason, not as a style choice.
This makes a stale contender's belated `fs.linkSync` for an old epoch
number always correctly fail `EEXIST` (the record is still there) instead
of spuriously succeeding.

Also fixed a second, independent bug found during the same investigation:
`currentGeneration`'s own `readdirSync` (list) then per-file `readFileSync`
(read) are two separate steps with real wall-clock time between them — if
this process is preempted in that gap while pruning was still active,
every name in its stale listing could vanish, and the original code
read "everything I listed is now gone" as "the ledger is empty," letting
the caller fall back to `nextEpoch = 1` and re-win a long-forgotten epoch
number. Fixed by re-listing whenever every named candidate turns out to
have vanished, rather than concluding "empty" (a genuinely empty ledger
never has candidates to begin with, so this only ever triggers on a real
race). Kept this fix even after removing pruning: nothing in the acquire/
release path deletes a generation anymore, so this branch is not currently
load-bearing, but it makes `currentGeneration` correct regardless of that
external invariant holding, and protects any future maintenance code that
might delete old generations out-of-band (see trade-off below).

**Named, deferred trade-off** (not silently accepted): this lock's
directory now grows by one small JSON record per acquisition, unbounded,
for the life of a host — unlike `run-lock.mjs`'s own per-Run scope, which
is naturally bounded by Run lifetime. At realistic dispatch volumes
(roughly one acquire/release pair per dispatched Run, plus occasional
quarantine ops) this is a slow, low-priority disk-hygiene concern, not a
correctness one. A separate, out-of-band maintenance sweep (e.g. a future
`fgos doctor` fix action, deleting only generations both non-current AND
older than a conservative age floor far beyond any realistic scheduling
delay) would be safe to add later without reopening either race above, but
is out of this phase's scope and not implemented here. Documented in code
comments at the exact point future maintainers would need it.

Also closed the audit's own C2 gap named for this lock ("pid-only, no
start time"): every generation record carries `holder.processStartTime`
(Phase 1's `getProcessStartTime`), and dead-holder judgment routes through
Phase 1's consolidated `resolveHolderLiveness` judge — a pid reused by an
unrelated process is correctly judged dead. Same treatment applied to
lease records (`reclaimDeadLeases`): lease writes now carry
`processStartTime`, and `pidDead` routes through the same judge. A lease
written before this fix (no `processStartTime`) reproduces the exact
pre-fix behavior via the judge's own documented fallback (alive pid, no
recorded start time → `held`).

## Investigation method (both rounds 2 and 3's bugs)

Both remaining bugs were found the same way, after round 1's marker-probe
technique proved its own value: instrumented a temporary, env-var-gated
(`PC_TRACE`) trace call at every state-changing step (`READ`, `WON-LINK`,
`LINK-LOST`, `ENTER-CRITICAL`, `EXIT-CRITICAL`, `RELEASED`) directly in the
real production module, then reproduced failures under artificial heavy
CPU load (20-30 concurrent `yes > /dev/null` processes on a 16-core
machine, pushing load average to 8-25) to widen the preemption windows
these bugs depend on. Captured full `hrtime`-ordered event logs for actual
violations (not synthetic), reconstructed the exact interleaving by hand
for each, then removed all tracing before committing. Neither bug was
findable by static re-reading alone — both required this empirical,
trace-and-reproduce loop.

## Tests (`test/runner/provider-capacity.test.mjs`)

1. **Pid-reuse unit test**: a lease recorded against a currently-live pid
   (this test process) but a fabricated, non-matching `processStartTime`
   is correctly reclaimed rather than mistaken for the same holder (gated
   on `HAS_PROC_START_TIME`, matching `process-identity.test.mjs`'s own
   Linux-only gating convention).
2. **State.json-loss race test** (the audit's own probe shape): 10 trials ×
   10 real forked child processes calling the real
   `acquireProviderAccountLease` against one pre-seeded stale lock. Asserts
   every `selected` contender's lease persists in the final `state.json`.
   Needed two adjustments to reproduce reliably against the ORIGINAL bug
   rather than passing vacuously (both discovered empirically): an explicit
   ready/go IPC barrier to close fork/import startup jitter (unsynchronized
   ~13% vs. synchronized 67%, matching the audit's own 68%), and keeping
   contenders alive past acquisition (a short-lived child exiting
   immediately makes its own pid look dead to Phase 2's unrelated
   `reclaimDeadLeases`, a false failure).
3. **Direct marker-file exclusivity test** (added per Lead's explicit
   request, as a PERMANENT part of the suite, not a one-off debug script):
   15 trials × 10 contenders, same synchronized-start real-process shape,
   but each contender's own critical section (passed to the newly
   `export`ed `withFileLock`) attempts an exclusive marker-file create
   BEFORE doing any work and records a violation on `EEXIST`. This proves
   exclusivity directly, independent of whatever `fn` happens to do,
   catching a regression the state.json-based test alone might miss.

## Verification against real pre-fix/pre-round-3 code (not assumed)

- Round 1 (superseded): informally verified 10/15 (67%) failures pre-fix vs.
  0/15 post-fix at the time, matching the audit's 68% — but this
  measurement did not survive Lead's own independent, repeated re-run,
  which is exactly why this repo's discipline treats self-reports as data,
  not proof.
- Round 2 (pruning bug): reproduced under artificial CPU stress directly
  against the actual committed test file — 1/5, then more, consistent
  failures once heavy load was applied; a clean marker-file trace of a real
  epoch-1/epoch-5 concurrent-holder violation captured and included in the
  investigation.
- Round 3 (final): reran the exact same committed test file under the same
  heavy-stress technique — **0/65 failures** across three separate stress
  batches (30 + 15 + 20 attempts, load average 8–25 on 16 cores, `yes`-based
  CPU saturation) — a large jump from round 2's reproducible failures under
  identical conditions. Also reran 10× at baseline (no artificial stress):
  0/10 failures.

## Test results (final, round 3)

- Targeted file (`test/runner/provider-capacity.test.mjs`): 19/19 pass
  (17 pre-existing + 1 pid-reuse unit test + 2 real-process race tests).
- Cross-check (`process-identity.test.mjs`,
  `dispatch-reconciliation-import-graph.test.mjs`,
  `run-lock-identity.test.mjs`): 42/42 pass — confirms
  `provider-capacity.mjs`'s import graph is unchanged from round 1 (still
  only `process-identity.mjs`, never `run-lock.mjs`) and its own
  proven-leaf status in the reconcile.mjs import-graph test still holds.
- Full suite (`env -u CLAUDE_CODE_SESSION_ID npm test`): **8002 tests, 7929
  pass, 0 fail**, 8 skipped, 65 todo — run twice in a row, both clean.

## Files modified

- `src/runner/dispatch/provider-capacity.mjs` — full generation-ledger
  redesign of `withFileLock`'s reclaim mechanism (`currentGeneration`,
  `acquireGenerationLock`, `releaseGenerationLock`, `readGenerationFile`,
  `writeFsyncedTemp`, `removeBestEffort`); `providerCapacityStatePaths`'s
  `lockPath` field renamed `lockDir` (directory, not a file — no external
  consumer relied on the old field name; verified via repo-wide grep);
  `inspectProviderCapacityLock` rewritten for the new ledger shape,
  preserving its exact external `{present, lockPath, holderPid,
  holderAlive}` contract for `registrations.mjs`'s `checkProviderCapacityLockStale`
  doctor check (not touched, out of file-ownership scope, verified
  compatible by re-reading its consumption); `reclaimDeadLeases` and lease-
  record writes migrated onto `resolveHolderLiveness` + `processStartTime`;
  `withFileLock` now `export`ed (was private) for the direct marker-file
  test.
- `test/runner/provider-capacity.test.mjs` — 3 new/updated tests: pid-reuse
  unit test, state.json-loss race test (updated for the new `lockDir`
  generation-file seeding shape), and the new direct marker-file
  exclusivity test.

No other files touched (`assignment-runner.mjs`, `session-engine.mjs`,
`reconciliation-planner.mjs`, `settlement.mjs`, `coordination/store.mjs`,
`cli.mjs`, `main-checkout-lock.mjs`, `registrations.mjs` all left exactly
as the constraint required).

## Unresolved questions / follow-ups

- The unbounded generation-directory growth trade-off (named above) is a
  real, deferred item — worth a backlog row if this repo wants it tracked
  formally, not implemented in this phase.
- No genuinely uncertain design fork remains open; the run-lock.mjs-import
  constraint and the pruning-vs-correctness trade-off were both resolved
  by direct evidence (the import-graph test's own text; the marker-file
  traces), not guessed.
