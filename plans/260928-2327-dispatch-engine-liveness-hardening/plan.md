# Dispatch Engine Liveness Hardening

Status: PROPOSED — not started.
Created: 2026-09-28
Mode: high-risk (touches every real mutating dispatch path: admission,
per-cwd exclusivity, provider-account leasing, settlement)

Primary evidence:
`plans/reports/audit-260928-2318-dispatch-engine-stability-speed-simplicity-report.md`
(independent, probe-verified audit — 2 HIGH, 4 MEDIUM, 3 LOW stability
findings; 1 INFO Rust/Node verdict; live-probed against the real modules,
not just read statically). Read that report in full before touching any
phase below; this plan summarizes it but the report has the exact
file:line evidence and probe methodology every phase must respect.

## Objective

Every real gap this plan closes was found in the SAME class: a lock,
lease, or claim records one process (the runner) as "the holder," but the
work is actually done by a different, detached process (a supervisor or
worker) that the holder-check never looks at. The audit's own root-cause
finding (C2) is that liveness gets judged nine-plus different ways across
the dispatch engine, with no single, reused, correctly-built judge — and
that scatter is what produced three independently-reproduced stability
gaps (S1, S2, S3), not three unrelated bugs. This track fixes the root
cause first, then the gaps it caused, then the two secondary complexity
problems (permanent duplicate resolvers, a claim file no door can clear)
the same audit found along the way.

## Non-goals

- Not a rewrite of the dispatch engine's module boundary. The audit found
  44 files / ~26K LOC with three dominant files, but reducing that footprint
  is out of scope — this track fixes correctness gaps, not file layout.
  Rewriting `assignment-runner.mjs`/`operation-choice.mjs`/`herdr-round.mjs`
  wholesale is a different, much larger initiative if ever undertaken.
- Not a coordination-layer change. Everything here is `src/runner/dispatch/*`,
  `src/runner/main-checkout-lock.mjs`, `src/verbs/dispatch/*`, and the
  `dispatch.claim` touchpoints in `session-engine.mjs` — the audit's own
  declared scope. `fgos coordination *` verbs are untouched except where a
  fix (S5) requires coordinating with a door that already lives there
  (`coordination/recover.mjs`).
- Not deciding S4 (whether concurrent mutating Assignments may share a
  cwd) by writing code first. That is a product decision — see Phase 8.

## Phase 1 — Consolidate process liveness onto one judge (root cause, C2)

STATUS: MERGED (2026-09-28). integratedSha 647e23a5c068e1a0e8c16182d6606b6324596457,
testedSha 5b3d205c8 (unit/P1 tip), clean --no-ff auto-merge (ort), no
conflicts. Split design (pure judge with injected `isAlive` vs. the
control-plane probe staying in `run-lock.mjs`) per the Lead decision above
-- confirmed by implementer's own correct stop-before-guessing discipline,
independently re-verified by Lead against real source before deciding. 9
new tests (`test/runner/process-identity.test.mjs`), 42/42 targeted pass,
full suite 7991/0 fail on merged tree. None of the other 9+ liveness call
sites touched (explicitly out of scope). See
plans/260928-2327-dispatch-engine-liveness-hardening/reports/unit-P1-claude-only-execution-report.md.

### Work

1. **Corrected scope (Lead, 2026-09-28, verified directly against real
   source before dispatch):** `src/runner/dispatch/process-identity.mjs`
   already exists, but it is NOT the judge — it is a deliberately thin,
   pure `fs`-only leaf exporting only the two raw primitives
   (`getBootId()`, `getProcessStartTime(pid)`), with an explicit,
   test-enforced import-graph constraint documented in its own header:
   any module importing it (including `run-lock.mjs`, itself banned from
   pulling in a process-control adapter per
   `test/runner/dispatch-reconciliation-import-graph.test.mjs`) never
   drags process-control code into its import graph. The actual JUDGE
   function the audit confirms is well-built
   (`resolveHolderLiveness`) currently lives in `run-lock.mjs:74-85`,
   built ON TOP OF `process-identity.mjs`'s primitives, not inside it.
   **Second correction (Lead, 2026-09-28, per implementer's own blocked
   report — verified directly before deciding):** the above framing was
   itself wrong on two counts, both confirmed against real source: (a)
   `resolveHolderLiveness` returns only `'held' | 'dead'`, never
   `'ambiguous'` — drop that third value from every description in this
   plan; (b) it is NOT pure — it calls `isProcessAlive(holder.pid)`
   (`run-lock.mjs:34-42`), which calls `process.kill(pid, 0)`, a real
   syscall the import-graph test's `BANNED_CALL_PATTERN`
   (`test/runner/dispatch-reconciliation-import-graph.test.mjs:89`)
   explicitly forbids inside the leaf's own invariant
   ("fs-only leaf: no child_process, no spawn/kill",
   `process-identity.mjs:1-8`). Moving `resolveHolderLiveness` in
   unchanged would violate that standing invariant, not just today's
   specific import-graph walk.
   **Decision: split the pure comparison judge from the impure liveness
   probe.** Promote into `process-identity.mjs` a function with an
   INJECTED liveness signal — e.g.
   `resolveHolderLiveness(holder, isAlive)` where `isAlive` is the
   caller-supplied boolean/result of ITS OWN local liveness probe (each
   call site keeps whatever `process.kill`-based or other probe it
   already has; `provider-capacity.mjs` already has its own local
   `isPidAlive`/`process.kill`, confirmed by the implementer against the
   import-graph test's own comment) — containing ONLY the bootId/
   startTime cross-check comparison logic, which has zero process-control
   dependency. `run-lock.mjs` keeps its own `isProcessAlive` exactly where
   it is, and its own `resolveHolderLiveness(holder)` becomes a thin
   backward-compatible wrapper: compute `isProcessAlive(holder.pid)`
   locally, then call the promoted general function with that result.
   Every existing importer of `run-lock.mjs`'s `resolveHolderLiveness`
   keeps working completely unchanged. This is a BETTER design than the
   original framing, not just a workaround: it correctly separates the
   data-plane concern (record comparison: pid-reuse detection via
   bootId+startTime, the actual inconsistency the audit's C2 finding
   names across "four holder judges with different semantics") from the
   control-plane concern (how do I know this specific pid is alive right
   now — legitimately caller-specific), and lets Phase 2-4 call sites
   that already have their OWN local liveness probe adopt the SAME
   correct comparison semantics without needing to also adopt a specific
   probe implementation.
2. Do NOT migrate every one of the 9+ call sites in one unit — that is
   disproportionate blast radius for one phase. Migrate only the ones
   Phases 2-4 below actually need (the per-cwd lock's string identity, the
   provider-capacity lock's pid-only identity). Leave the rest named as a
   real, explicit follow-up list in this phase's own closeout note — audit
   the full call-site list (`run-lock.mjs:34`, `cli-spawn-supervisor.mjs:68`,
   `confinement/cleanup.mjs:86`, `provider-capacity.mjs:332`,
   `main-checkout-lock.mjs:157`, `gateway-control.mjs:59`, `loop.mjs:205`,
   `session.mjs:69`, `state/events.mjs:262`, `state/runtime-coordination.mjs:36`)
   and confirm none of the NOT-migrated ones is silently broken by this
   phase's own changes.
3. Add direct unit tests for the consolidated judge covering: live pid,
   dead pid, pid reuse (same pid, different start time), unreadable start
   time, unreadable/missing bootId.

### Exit

A single, tested, correctly-built liveness judge exists and is proven
correct in isolation. Phases 2-4 consume it; this phase does not yet fix
any of S1/S2/S3 itself.

## Phase 2 — S1: admission sees the real worker, not just the runner

STATUS: MERGED (2026-09-28). integratedSha (P2 alone, pre-P3)
`a92bb68a3`, final combined integratedSha (post-P3 merge)
`58be9e527...` -- see "Phase 2/3 interaction finding" note after Phase 3
below, investigated and resolved before this status was recorded.
testedSha `9eb58a8d4` (unit/P2 tip). `isBoundProcessAlive` migrated onto
Phase 1's judge (closes a real bootId/reboot-detection gap the old local
impl lacked); new `isCliSpawnRunStillWorking` helper wired into both
admission's in-flight check and provider-capacity's lease reclaim. Proven
with a real SIGKILL probe -- Lead independently reverted the fix and
reran the same test, confirmed it genuinely fails without the fix before
restoring it. Full suite (P2 alone): 7994/0 fail. See
plans/260928-2327-dispatch-engine-liveness-hardening/reports/unit-P2-claude-only-execution-report.md.

### Work

1. `admitRunAttempt`'s in-flight check (`assignment-runner.mjs:873-887`,
   `inspectRunControl`) currently reads only the control holder (the
   runner). Extend it to also check the supervisor/worker bindings the
   supervisor itself publishes (`protected/bindings/*/supervisor.json`,
   `worker.json`, per `cli-spawn-supervisor.mjs:176-227`) using Phase 1's
   consolidated judge (`isBoundProcessAlive`'s own correct semantics,
   reused rather than re-implemented).
2. Apply the same fix to the provider-capacity lease reclaim
   (`provider-capacity.mjs:402`, `reclaimDeadLeases`) — a dead runner must
   not free a lease the live worker is still using.
3. Add a real test: SIGKILL a live runner process while its detached
   supervisor/worker keeps running (matching the audit's own live-probe
   shape), assert admission correctly refuses a second attempt.
4. Consider (design decision, not pre-decided here): recording the
   supervisor itself as the control holder once it binds, as an
   alternative/complementary fix the audit names — evaluate both and
   choose during implementation, evidenced against real code, not guessed
   in this plan.

### Exit

The audit's own live-probe scenario (SIGKILL holder, detached child
survives) no longer results in a second admitted attempt. Real test added
and green, not just a manual probe.

## Phase 3 — S2: per-cwd dispatch lock gets a heartbeat and real liveness

STATUS: MERGED (2026-09-28). integratedSha (P3 alone, on top of P2)
`58be9e5277a239b48d2e8bb514c9f3cb368a7e68` (this is also the final
combined P2+P3 tip on main), testedSha `d6b48eb90` (unit/P3 tip). Added
a heartbeat (`setInterval` calling the existing `renewMainCheckoutLockIfOwn`,
`unref()`'d, cleared in the existing `finally`) to the per-cwd lock in
`cli.mjs`, and routed the embedded pid+timestamp identity through Phase
1's judge (`main-checkout-lock.mjs`'s `tryAcquireOnce` string-identity
branch now calls `resolveHolderLivenessByIdentity` instead of TTL-only
freshness), fixing the misleading `held-by-live-other-pid` label for a
provably dead pid. Both audit-reproduced scenarios covered by real
process-based tests. See
plans/260928-2327-dispatch-engine-liveness-hardening/reports/unit-P3-claude-only-execution-report.md.

### Interaction finding: P2+P3 combined, not a regression in either

After merging P2 then P3 (`git merge --no-ff unit/P2`, then `git merge
--no-ff unit/P3`, final tree `58be9e527`), the combined suite surfaced
`fanoutBatchExecutorCli fires candidates in batch concurrently with
overlapping execution windows` (`test/runner/dispatch.test.mjs:6065`)
failing consistently (3/3 reruns, `1 !== 0`). P3's own implementer report
had already seen a similarly-named failure once and self-dismissed it as
flaky; Lead did not accept that dismissal without independent proof.

Investigation (git-worktree bisection under matched current system load,
one throwaway worktree per commit: `26d912092` pre-P1-close, `a92bb68a3`
P2-only, `d6b48eb90` P3-only) showed all three PASS in isolation — the
failure requires P2 **and** P3 together. Reading `fanout-batch.mjs`
confirmed a `fired[].status !== 0` reflects the real subprocess's real
exit code, not a thrown lock error (a lock refusal instead produces a
`'blocked'` result kind via `cli.mjs`'s own `DispatchError('dispatch-in-
flight', ...)` on `HELD`/`AMBIGUOUS` — confirmed by direct read, so
neither Phase 2's admission check nor Phase 3's per-cwd lock is the
direct cause). Root cause, confirmed by an isolated reproduction in
`/tmp` (two concurrent `git commit --allow-empty` calls against one
shared temp repo): the test fixture's own design has two subprocesses
racing on the SAME repo's `.git/index.lock` — one commit succeeds, the
other fails with `fatal: Unable to create '.../.git/index.lock': File
exists` (exit 128), which is exactly the failure signature reproduced.

Disposition: **not a regression** in either phase's production dispatch-
lock/liveness logic — a pre-existing test-fixture flaw (two concurrent
candidates sharing one git repo in this specific test's own setup) that
P2+P3's combined legitimate added latency (binding-check I/O, heartbeat
scheduling) shifted just enough, under current heavy system load, to
land inside the pre-existing race window. Filed as a named follow-up
(fix the fixture to give each concurrent candidate its own temp repo)
rather than blocking this track — tracked as a deferred item, not
re-opened as a Phase 2/3 defect.

### Work

1. `executeExecutorCli`'s per-cwd lock (`cli.mjs:879-887`,
   `dispatch--<cwd>.lock`, `ttlMs: timeoutMs`) currently uses a bare string
   identity (`${pid}:${Date.now()}:${rand}`) judged by TTL only.
2. Add a heartbeat during the run using the already-existing
   `renewMainCheckoutLockIfOwn` (`main-checkout-lock.mjs:513+`, currently
   only consumed by `merge.mjs`) so a long-running dispatch doesn't lose
   its own lock before finishing.
3. Parse the embedded pid+timestamp at acquire time and route it through
   Phase 1's judge instead of TTL-only freshness, so a dead-pid holder is
   correctly identified immediately rather than blocking for the full TTL
   (audit's own repro: `held-by-live-other-pid` on a pid that's actually
   dead).
4. Fix the misleading status label the audit found (`held-by-live-other-pid`
   reported for a dead pid).
5. Add a real test reproducing both audit probes: (a) holder A alive
   mid-run loses the lock to B once TTL elapses; (b) a dead-pid holder
   blocks correctly identified as dead, not held for the full TTL.

### Exit

Both audit-reproduced scenarios (live holder losing the lock early; dead
holder blocking unnecessarily) are fixed and covered by a real test.

## Phase 4 — S3: provider-capacity lock stale-reclaim no longer loses writes

STATUS: MERGED (2026-09-29), after 1 rejected round. unit/P4
`58613b1c4`, integratedSha `3c8d518cb`.

Round 1 (`b9b366047`, re-read-before-unlink, matching
`main-checkout-lock.mjs`'s pattern) was NOT merged: implementer's own
report claimed the race test passed 0/15, but Lead independently reran
the same unmodified test 4x and got a genuine ~50% failure rate, then
went further than trusting the assertion failure and instrumented
`withFileLock` with an `fs.openSync(markerPath, 'wx')` exclusivity marker
(same atomic O_EXCL primitive the lock itself relies on) and captured
real `MARKER-VIOLATION` events — two distinct pids both held the critical
section on the same lockPath at once. Root cause: `unlinkSync` has no
compare-and-swap semantics, so no amount of re-reading before it closes
the window; narrows but does not eliminate, exactly as the implementer's
own round-1 code comment had already (correctly) admitted.

Round 2 (`58613b1c4`, MERGED): replaced the single lock file with an
append-only generation ledger (each acquisition publishes a new,
higher-numbered record via exclusive `fs.linkSync`, so the mutating step
itself is the sole arbiter of who wins, matching `run-lock.mjs`'s own
proven pattern — reimplemented locally rather than imported, since
`provider-capacity.mjs` is a declared proven-leaf in this repo's own
import-graph test). Found and fixed two further real bugs during the same
round via trace-and-reproduce-under-artificial-CPU-stress: a
`currentGeneration` TOCTOU on `readdir`-then-read, and a pruning step that
reopened epoch-number reuse (both root-caused with direct marker-file
traces, not assumed). Final design never prunes or reuses a published
generation number — an explicitly named, deferred disk-hygiene trade-off,
not a silently accepted one. The marker-file exclusivity check is now a
permanent test (`withFileLock` exported for it), not just a one-off Lead
debug script. Lead independently reran both race tests 6x under 20
artificial CPU-stress processes (0 failures) and the full suite twice
(8002 tests, 0 fail) before merging. See
plans/260928-2327-dispatch-engine-liveness-hardening/reports/unit-P4-claude-only-execution-report.md.

### Work

1. `withFileLock` (`provider-capacity.mjs:262-301`) reads a holder pid,
   judges it dead, and unlinks with no re-check of current content before
   unlinking — the exact race the audit reproduced 17/25 trials.
2. Fix using the same pattern `main-checkout-lock.mjs`'s own
   `tryAcquireOnce` already uses (re-read-before-unlink, `:308-319`) or the
   stronger link-publish+generation pattern from `run-lock.mjs` — audit
   flags the former as adequate, the latter as "better"; choose during
   implementation with real reasoning, not guessed here.
3. Add pid start-time (via Phase 1's judge) to the lock and lease records,
   closing the "pid-only, no start time" gap the audit's own C2 table
   names for this specific lock.
4. Add a real test reproducing the audit's own probe shape (concurrent
   contenders against a pre-seeded stale lock with a dead pid), asserting
   zero lost leases — matching the audit's own control-run result (0/25)
   as the target, not the broken 17/25.

### Exit

The audit's own reproduction (17/25 trials losing a lease) drops to 0 under
the same test shape.

## Phase 5 — S5: `dispatch.claim` gets a real identity or gets removed

STATUS: MERGED (2026-09-29). unit/P5 `3ee9b52ea`, integratedSha
`2b3752628`. Decision:
DELETE (confirmed via fresh code reading -- `dispatch.claim`'s in-flight
role is genuinely subsumed by Phase 2's `admitRunAttempt`/
`isCliSpawnRunStillWorking`, and the underlying claim file is always
0 bytes in production, matching the audit's S5 finding exactly). Deleted
`session-engine.mjs`'s two claim writers and reconciliation-planner.mjs's
`clear-assignment-claim`/`planClearAssignmentClaim`/
`applyClearAssignmentClaim`/`assignmentClaimFile`.

Deleting it surfaced a real, empirically-proven (not assumed) second
invariant `dispatch.claim` was also silently enforcing: "first settlement
is final" for a coordination-engine Assignment's FRESH (non-retry)
dispatch, which two real concurrent OS processes can otherwise both pass
admission for once the first settles fast enough. A plain re-check right
before dispatch does not close this window (proven with a real repro, not
theoretical) -- the fix has to live in the same CAS critical section
`admitRunAttempt` already uses, which lives in `assignment-runner.mjs`
(out of Phase 5's originally-declared file ownership). Implementer
escalated to kongming for the design fork rather than guessing; Lead
authorized a narrow, additive, opt-in-only change to `admitRunAttempt`
(a new `refuseIfSettled` option, zero effect on any existing caller that
doesn't pass it) since assignment-runner.mjs's actual owners (Phase 2,
Phase 6) are both already merged onto the base this unit branched from,
and the only other phase in flight (Phase 4) doesn't touch that file --
the original file-ownership constraint no longer reflected the real
conflict surface by the time this came up.

Fork 2 (found only after implementing Fork 1, via the same DAG-
concurrency cross-process test still failing differently): `refuseIfSettled`
alone wasn't enough -- two real processes can both reach admission before
EITHER has acquired real run control (a separate, later step inside
`executeAssignment`), so neither's admission sees the other as in-flight.
Escalated to kongming again; its answer avoided two worse options (a new
marker file needing its own clearing door; a session-lock pre-check that
is just a disguised race) in favor of stamping the admitting process's
own identity (`admittedBy`, reusing the already-existing
`buildRunControlHolder`) into the SAME atomic CAS record `admitRunAttempt`
already commits, and treating "admitter still alive, no real control
record yet" as a live signal -- gated to fire only when
`!priorControl.controlEpoch`, so it can never conflict with or go stale
against the real control ledger once one exists. Both refusal codes
translate back to the exact `CoordinationError` shape/message the retired
claim files used to throw, so every existing consumer (`dag-scheduler.mjs`'s
`outcomeFor`, any `instanceof CoordinationError` check) needed zero changes.

Lead independently read the CAS/liveness logic and the error-translation
boundary against real source (confirmed `buildRunControlHolder`'s shape
matches what `resolveHolderLiveness` expects, confirmed the M1 in-flight
check's widening only ever ADDS refusal coverage for a window that was
previously an open gap, never narrows an existing safe path). Reran the
cross-process race test ~120 times under heavy artificial CPU stress
(20-25 concurrent `yes` processes); it failed twice
(`test/runner/coordination-dag-concurrency.test.mjs:662`, "identical
concurrent writers"). Did not accept this as a P5 regression without
proof: traced the failure to `replay.mjs`'s own "assignment-created event
has no corresponding assignmentRefs entry" self-heal ordering check -- a
file Phase 5 never touches -- and reproduced the IDENTICAL failure
signature, at a comparable rate (2/80), against pre-Phase-5 main under
the same stress. Confirmed pre-existing, unrelated to this phase; filed
as a named follow-up (event-log/assignmentRefs write-ordering race in
`session-engine.mjs`'s session-creation self-heal path, surfaced by this
track's own stress-testing discipline, not introduced by it), not
reopened against P5. Full suite green (7995 tests, 0 fail). See
plans/260928-2327-dispatch-engine-liveness-hardening/reports/unit-P5-claude-only-execution-report.md.

Residual, out of this phase's file-ownership scope, noted by the
implementer and not yet fixed: `src/verbs/dispatch/recover.mjs`,
`src/cli/command-registry.mjs`'s CLI help text,
`src/verbs/dispatch/reconcile.mjs`'s own refusal-message example list,
and two docs
(`docs/how-to/operate-dispatch-runtime-inspection-and-reconciliation.md`,
`docs/specs/runner.md`) still name the retired `clear-assignment-claim`
action. Harmless (a plain "unsupported action" refusal now, not a
half-working door) but worth a follow-up doc/CLI-help pass.

### Work

This phase requires a decision, not just a fix — the audit found the
mechanism is currently a "two half-mechanisms" dead end (a 0-byte claim
file with no production writer for its content, refused by every door
that could clear it, with `admitRunAttempt` already named in code comments
as its intended replacement — but Phase 2 shows that replacement was
itself incomplete until this track's own Phase 2 lands).

1. **Decide, evidenced against Phase 2's actual fix**: now that
   `admitRunAttempt`'s in-flight check genuinely covers the
   supervisor/worker gap (Phase 2), is `dispatch.claim` fully redundant
   (delete it + `clear-assignment-claim` + every refusal path that
   references it), or does it still serve a distinct purpose Phase 2
   doesn't cover? Read the real code fresh before deciding — don't assume
   the audit's own tentative "either way" framing picks the answer for
   you.
2. If removed: delete `session-engine.mjs`'s two claim writers (`:509`,
   `~:4494`), `clear-assignment-claim` (`reconciliation-planner.mjs:371-434`),
   and update every refusal message that currently points at a
   non-working door.
3. If kept: give it a real identity (`{pid, startTime, bootId}` via Phase
   1's judge) so `holder()` can actually distinguish live from dead, and
   make at least one real door (likely `coordination/recover.mjs`, which
   the audit found never clears it today) actually able to clear a
   session-owned claim.

### Exit

No refusal message in the dispatch/coordination doors points at a
mechanism that cannot actually resolve the refusal — either the mechanism
is gone, or it genuinely works end to end, verified with a real test that
SIGKILLs a session dispatch before `result.json` exists and confirms
recovery is actually possible afterward.

## Phase 6 — S6 + S8: atomic writes and settlement ordering

STATUS: MERGED (2026-09-29). unit/P6 `91cc7679e` merged onto main,
integratedSha `9b4a03819`. Both `assignment.json` writers
(`assignment-runner.mjs`, `coordination/store.mjs`) switched to the
existing `publishImmutableProof` atomic primitive (fsynced temp +
exclusive hard link) instead of a bare `writeFileSync` guarded only by
`!existsSync` — a crash mid-write now leaves the file cleanly absent
instead of permanently bricking the Assignment as unreadable garbage.
Did not physically merge the two writer call sites (they live in
different layers with different surrounding logic — read-back/freeze in
one, a documented crash-recovery re-entry guard in the other); closed the
actual "two broken primitives" duplication by having both call the same
existing atomic one instead. `commitRunSettlement` now recognizes when
the current control generation was already settled by this exact
caller's own token+epoch and completes/rehydrates the retry instead of
refusing it as superseded forever — reordering the two writes was
evaluated and rejected with real evidence (would let a superseded
controller win the publish race before its own settlement CAS could
refuse it; the existing TOCTOU test exists to catch exactly that
regression class). 3 new tests, each fault-injecting the real crash
window against the real production module. Lead independently read all 4
touched files against the report's claims (confirmed
`publishImmutableProof`'s hard-link semantics and `settleRunControl`'s
real record shape match exactly) and reran the full suite after
supplying the worktree's missing Rust build-output symlink: 8002 tests,
0 fail — the implementer's own reported 51 rust-host failures were a
pre-existing environment gap in that worktree, not a regression. See
plans/260928-2327-dispatch-engine-liveness-hardening/reports/unit-P6-claude-only-execution-report.md.

### Work

1. `assignment.json` is written non-atomically in two separate places
   (`assignment-runner.mjs:1264`, `coordination/store.mjs:1052`), both
   guarded by `!existsSync` only — a crash mid-write permanently bricks
   the Assignment id (the reader hard-fails forever on unreadable content).
   Switch both to the same atomic-publish pattern already used correctly
   for `result.json`/`run.json` (`publishImmutableProof`,
   `writeJsonAtomic` in `markRunSettled`). Consider merging the two
   writers into one, since having two for one file is itself a real
   simplicity gap the audit names in passing.
2. `settleRunControl` publishes the `settled` control generation
   (`settlement.mjs:321`) BEFORE `publishImmutableProof(result.json)`
   (`:330`) — a crash in that two-syscall window leaves control `settled`
   with no `result.json`, and the audit confirms both `acquireRunControl`
   and `repair-projection` then get stuck (can neither resume nor repair).
   Reorder so `result.json` publishes first, control-settlement second —
   or make control-settlement itself recoverable from a missing
   `result.json` in that specific state. Choose based on which is the
   smaller real diff, evidenced during implementation.
3. Add real tests: a torn/interrupted `assignment.json` write no longer
   permanently bricks the Assignment; a crash between control-settlement
   and result-publication is recoverable.

### Exit

Both audit-named atomicity/ordering gaps are closed with real tests
proving recovery from a simulated crash at the exact window each finding
names.

## Phase 7 — C1 + C3: retire or authorize the shadow binders

STATUS: MERGED (2026-09-29). unit/P7 `df527cb5d`, integratedSha
`0c324681b`. Real investigation (grepped ~800 historical production
dispatch stderr logs under `.fgos/assignments/*/runs/*/stderr.log`, plus
a live empirical re-check against the current config) found the 4 shadow
binders split cleanly, not a uniform answer:

- `resolveVerifiedRedirectExecutor` and `resolveVerifiedAssignmentModel`:
  structurally guaranteed to never diverge (both sides call the identical
  underlying primitive — `stablePoolIndex`/`resolvePolicyTierModel` — over
  identical inputs). Retired outright; callers now use the direct
  primitive. Lead independently confirmed the new caller-side formula is
  byte-identical to the old shadow-verified one by reading both against
  real source.
- `resolveVerifiedPlacementModel` and `resolveVerifiedProviderArgs`: real
  historical divergence (126 confirmed hits, dated 2026-09-18, root-caused
  to a since-fixed config gap; empirically zero against every
  currently-registered executor today). Kept in shadow mode per the
  audit's own high-risk flag on retiring before divergence is proven
  zero. Durable local telemetry added
  (`recordShadowBinderDivergence` → `.fgos/dispatch/shadow-binder-divergence.jsonl`,
  surfaced by a new `shadow-binder-divergence` doctor check, correctly
  registered per this repo's own install/setup/doctor gate) replacing the
  previous ephemeral-stderr-only visibility, plus a dated `docs/backlog.md`
  row (`tsk-p7-shadow-binders`, target 2026-10-31) enumerating 5 concrete
  divergence classes each needing a decided winner + a matrix test before
  retiring.

C3: `executeExecutorCli` called the full `resolveAssignmentDispatchPolicy`
only to reach its two governance throws, discarding the rest. Extracted
`resolveExecutorProvider`/`resolveExecutorGovernance` as shared exports
that `resolveAssignmentDispatchPolicy` now also calls internally —
confirmed as real dedup, not duplicate logic under new names, by reading
its updated call sites directly — preserving the exact original
governance-throw ordering relative to other validation errors (verified
in source, explicitly called out in the implementer's own comment on why
this matters). `cfg.models` dual-keying (item 3) folded into the same
backlog row as enumerated class (d): confirmed dormant for this repo's
own config, live for external consumers.

Consulted kongming before implementing, which caught a real mistake in
the initial plan (a same-provider-redirect ternary in
`assignment-runner.mjs`'s `policyForActualExecutor` that would have been
wrongly flattened) before it landed — Lead independently verified the
final code preserves that exact ternary rather than collapsing it. Full
suite green (7993 tests, 0 fail); Lead reran the directly-touched test
files (280 tests) plus dispatch/assignment-dispatch (472 tests) and the
full suite independently before merging. See
plans/260928-2327-dispatch-engine-liveness-hardening/reports/unit-P7-claude-only-execution-report.md.

### Work

This phase requires a decision the audit explicitly flags as unmade: five
"self-verifying" shadow binders (`resolveVerifiedPlacementModel`,
`resolveVerifiedRedirectExecutor`, `resolveVerifiedAssignmentModel`,
`resolveVerifiedProviderArgs` — `placement-policy.mjs:280,453,502` plus one
more, 6 real call sites: `cli.mjs:312`, `cli.mjs:827`,
`assignment-policy.mjs:472`, `assignment-runner.mjs:309`,
`assignment-runner.mjs:355`, `transport.mjs:185`) have computed the same
decision twice since 2026-09-16 with no retirement plan, silently keeping
the legacy answer on divergence.

1. **Decide** (needs real investigation, not guessed here): pull
   divergence telemetry if any exists (the shadow binders warn on stderr
   when they disagree — check whether that's logged/counted anywhere
   durable). If divergence is genuinely at or near zero, retire the legacy
   path and make PlacementPolicy authoritative. If real divergence exists,
   investigate why before choosing either side blindly.
2. Also resolve C3 while touching this same area: `cli.mjs:842-861` calls
   `resolveAssignmentDispatchPolicy` and discards its result except for
   validation throws — the model still comes from the legacy path, and a
   THIRD resolver (`decideExecutorDispatchMechanism`, `:702`) decides the
   mechanism separately. One door currently runs three resolvers with only
   one actually feeding the output; consolidate to the minimum real count
   once the shadow-binder decision above is made (the two problems share
   the same root file and are worth fixing in the same pass, not two
   separate ones).
3. Also fix the `cli.mjs:802-815` comment's own admitted issue: `cfg.models`
   is keyed by *work* tier in one reader and *policy* tier in another —
   "two genuinely incompatible legacy shapes under one config key." This
   needs its own real fix or an explicit, evidenced decision to leave it
   (with a backlog row, so it isn't re-discovered as a fresh mystery next
   time).

### Exit

Either the legacy resolution path is removed (with real divergence
evidence backing that call) or an explicit, dated retirement plan is
recorded in `docs/backlog.md` — the audit's own point that "no retirement
entry" is itself part of the finding. `resolveAssignmentDispatchPolicy`'s
result is either genuinely consumed or the redundant call is removed.

## Phase 8 — Decision gates (no code until answered)

Two real product/architecture questions the audit surfaced but correctly
did not answer unilaterally:

1. **S4 — are concurrent mutating Assignments on one cwd intended?**
   `acquireMainCheckoutLock` is only called from `executeExecutorCli`
   (`cli.mjs:880`); the Assignment cli-spawn default path skips it
   entirely, so two Assignments (or an Assignment plus an ad-hoc `dispatch
   execute`) can mutate the same cwd concurrently today with each run's
   evidence attribution able to absorb the other's writes. This may be
   intentional for read-only parallel panels, but the audit found no rule
   excluding concurrent MUTATING Assignments on one cwd specifically. This
   is a product decision for the user, not something to code around.
2. **C4 — who owns "process supervision" now that the Rust host has its
   own supervisor?** The Rust host does not currently duplicate dispatch
   decisions (verdict: one engine, thin wrapper — `command-routes.json`
   confirms `dispatch` is 100% `legacy-cli`), but
   `packages/host-runtime/rust/src/providers/external_process/supervisor.rs`
   (855 lines) already duplicates `cli-spawn-supervisor.mjs` (1208 lines)
   in shape (bounded capture, deadlines, crash mapping, cancellation
   grace) with zero current consumers. It becomes a REAL second
   implementation the moment any operation (including dispatch) is ever
   routed `native` instead of `legacy-cli`. This ownership boundary should
   be written down before that happens, not discovered after a real
   divergence ships. Check whether the R1 kernel track's own notes already
   answer this (the audit did not find an answer in the specs it checked)
   before escalating as a genuinely open question.

### Exit

Both questions have an explicit, recorded answer (a plan.md decision note
here, and/or a `docs/decisions/` entry if this repo's own convention calls
for one at this level) before any phase above that depends on either
answer proceeds. Phase 5's own decision (delete vs. give `dispatch.claim`
a real identity) does NOT depend on these two; phases can otherwise
proceed independently of this phase's own timing except where noted.

STATUS: DECIDED (2026-09-29), unit/P8, implementation in progress. Both
gates discussed at length with the user (not guessed) before recording.

SUB-UNIT STATUS:
- **unit/P8b-rust MERGED** (2026-09-29). `e589577c1`, integratedSha
  `a8fb5fc7b`. Rust `providers/external_process` supervisor renamed to
  `BoundInvocationSupervisor`/`bound_invocation_supervisor.rs`; both
  re-export layers updated consistently; zero remaining old-name
  references confirmed via full-repo grep. `docs/decisions/` D-ADR0043
  recorded via this repo's own `fgos decision write`/`decision-index`
  (hand-authored `docs/decisions/*.md` corpus is retired, tsk-1lv-4) --
  first write landed without its D-ADR id number (a formatting miss,
  caught and superseded with a corrected entry after confirming 0043 was
  free of collision against the real highest existing id, 0042). Lead
  independently reran `cargo build --workspace` and `cargo test
  --workspace`: clean, 177/177 pass. See
  plans/260928-2327-dispatch-engine-liveness-hardening/reports/unit-P8b-rust-claude-only-execution-report.md.
- **unit/P8a MERGED** (2026-09-29). `00f632be5`, integratedSha
  `7b6eca608`. S4 mutex scoped to the `cli-spawn` adapter only (a real,
  evidenced correction to this plan's own assumption -- herdr-spawn
  already gets `acquireMainCheckoutLock` coverage via its existing
  `executeExecutorCli()` call chain, confirmed by Lead tracing that call
  chain directly in `assignment-runner.mjs:2702`; a second lock there
  would self-conflict). Gated on `effectiveMutation === 'mutating'`
  (another real correction: an unconditional lock regressed two
  pre-existing tests proving concurrent read-only dispatch to the same
  cwd is intentional). New `--force-shared-cwd` override, distinct from
  `--force-new-attempt` (different axis, per this plan's own note above).
  `isHerdrSpawnRunStillWorking` added and wired into `admitRunAttempt`'s
  M1 check via a pre-CAS peek tagged with the exact runId it was computed
  for, failing closed (treated as still-working) on both an `'unknown'`
  herdr-probe result and a stale/mismatched peek. Lead independently
  traced the self-conflict claim against real source, reran the new
  real-subprocess concurrency test directly (pass), reran
  main-checkout-lock + assignment-dispatch (161/161) and every herdr
  suite (101/101, 1 skipped) plus the full suite (7994 tests, 0 fail)
  before merging. Two related gaps flagged by the implementer, not fixed
  here (named, not silently dropped): `--force-new-attempt` itself was
  never wired to a CLI flag (pre-existing, unrelated to this phase); no
  dedicated SIGKILL-probe test exists yet for
  `isHerdrSpawnRunStillWorking` specifically, and
  `providerCapacityIsRunWorkerAlive` (lease reclaim) has the same
  cli-spawn-only blind spot for herdr-spawn as M1 did before this phase.
  See
  plans/260928-2327-dispatch-engine-liveness-hardening/reports/unit-P8a-claude-only-execution-report.md.

**Remaining for this track's own close:** the JS-side rename of
`cli-spawn-supervisor.mjs` to reflect `detached-run-supervisor`
vocabulary (P8b's other half, deferred until P8a merged since both touch
`assignment-runner.mjs` -- now unblocked).

**S4 decision: extend `acquireMainCheckoutLock` to the shared Assignment
admission path, as a mutex with a visible-holder refusal and an explicit
override -- NOT an absolute ban on mutating the main checkout.** An
earlier draft of this decision (rejected by the user) proposed adopting
`resolveMutatingCwdPosture`'s existing HARD rule (`execution-contract.mjs`
-- "mutating dispatch must never target the main checkout", already
enforced for the narrower inline/declared-operation dispatch path) for
the general path too. Correctly rejected: sometimes a real Assignment
must mutate the main checkout, and an unconditional ban would block that.
The right precedent instead is `acquireMainCheckoutLock` itself (already
used by `claimWork`/`executeExecutorCli`/`withMergeTargetSlot`) -- verified
via source (`main-checkout-lock.mjs:422`) to already be per-`dir`, not a
single global lock, so it generalizes to any cwd without new design. It
does not forbid anything; it serializes concurrent mutating access to the
SAME cwd and makes the conflict visible (refusal names the holder pid/age/
remaining TTL) exactly the way this track's own `--force-new-attempt`
precedent already works for the analogous same-Assignment-retry case. A
speculative "passive fgos doctor visibility check" idea was raised and then
explicitly withdrawn -- not evidence-based, nothing observed calls for it;
the lock's own refusal message already provides the needed visibility as
a side effect, unlike S1-S3 this gap has no real production reproduction,
only a code-audit-found theoretical one.

Investigation while discussing S4 surfaced that `admitRunAttempt` is
called from a SHARED admission path used by BOTH the `cli-spawn` and
`herdr-spawn` adapters (`assignment-runner.mjs:2173`'s own
`needsAssignmentLaunchContext` check) -- so placing the lock at the
admission layer (not adapter-specific code) naturally covers both
without separate wiring.

**New finding, folded into this phase (user's own call, not deferred to a
separate backlog row): herdr-spawn has no equivalent to Phase 2's own S1
fix.** `isCliSpawnRunStillWorking` (Phase 2) reads local supervisor/worker
binding files + `process.kill(pid,0)` -- fast, local, deterministic,
never fails for a reason other than "process is/isn't there".
herdr-spawn's own liveness signal, `paneProcessInfo` (`herdr-agent.mjs:246`),
SPAWNS A REAL `herdr` CLI SUBPROCESS with its own `timeoutMs` and can fail
with `herdr_unavailable`/`herdr_call_timeout` -- a structurally different,
non-deterministic-availability probe that cannot be safely called inline
inside `admitRunAttempt`'s own synchronous CAS critical section (this
track's own Phase 4/5 hardened that section specifically to never block on
anything external). This means a SIGKILLed herdr-spawn runner whose pane/
agent is still alive (herdr's whole design point: the pane deliberately
outlives the runner, same as cli-spawn's detached worker) is invisible to
admission today -- the same CLASS of bug S1 fixed for cli-spawn, unaddressed
for herdr-spawn because this track never touched it.

**Both cli-spawn's and herdr-spawn's own liveness checks are two
implementations of the same underlying role, not two unrelated
mechanisms**: "is the detached run this admission decision cares about
still doing real work, independent of whether the process that dispatched
it is still alive?" Naming this role `detached-run-supervisor` (see C4
below) frames S1's own fix and this new herdr-spawn gap as the SAME
interface with two adapter-specific implementations:
- `isCliSpawnRunStillWorking` (existing, unchanged) -- local fs-binding
  implementation for the `cli-spawn` adapter.
- `isHerdrSpawnRunStillWorking` (new, this phase's own scope) -- herdr
  pane-query implementation for the `herdr-spawn` adapter, calling
  `paneProcessInfo` OUTSIDE `admitRunAttempt`'s own CAS critical section
  (a bounded, best-effort pre-check whose RESULT is carried into the
  section, the same shape `isCliSpawnRunStillWorking` already uses --
  never the live herdr call itself inside the lock).

**C4 decision: record the real architectural split as vocabulary, not "one
engine vs a duplicate."** Investigation (reading `invocation_service.rs`,
`operation_provider_router.rs`, `providers/external_process/{supervisor,
adapter,registry}.rs`, `apps/fgos/src/legacy_exec.rs`, and this repo's own
`docs/platform/host-invocation-routing/architecture/invocation-kernel.md`)
found THREE mechanisms, not two, and no live conflict today:
1. `apps/fgos/src/legacy_exec.rs` -- the real, current Node-compat bridge
   for the 73 `legacy-cli` routes. Already documented as a deliberate,
   temporary bypass ("Legacy CLI routes bypass the kernel... keep bypass
   behavior until each selector migrates", invocation-kernel.md) -- not an
   open question.
2. `packages/host-runtime/rust/src/providers/external_process/*`
   (~1700 lines: supervisor.rs, adapter.rs, registry.rs) -- a real,
   already-implemented, already-tested generic `OperationProvider` for
   "verb backed by an external CLI process", going through the kernel's
   real `InvocationService` pipeline (admit/route/grant/invoke/record).
   Zero current consumers (only 2 `native` routes exist -- `gate-bypass`,
   `version` -- and neither uses it). This IS the sanctioned mechanism for
   the user's own stated future direction (components may ship their own
   CLI, Rust preferred but not required) -- not dead code to delete.
   Confirmed via its own header ("Spawns and supervises the provider
   process ONLY at invocation time") and short default deadlines
   (`startup_timeout: 2000ms`, `request_timeout: 5000ms`) that this is
   scoped to a SHORT, request/response-style, invocation-bound external
   call (an RPC-shaped call over a framed `fgos.component.v1` protocol,
   `frame_codec`) -- confirmed via source it has NO detach/process-group/
   session logic at all (`grep` for `detach|setsid|process_group` in
   `supervisor.rs`: no matches).
3. `src/runner/dispatch/cli-spawn-supervisor.mjs` (Node, 1208 lines) -- a
   different concern entirely: supervises a long-running (potentially
   many minutes) AGENT/EXECUTOR run for an Assignment, deliberately
   DETACHED so the run survives the crash of whatever dispatched it
   (confirmed via source: `startSupervisorProcess`'s own detached spawn,
   PGID-based kill, immutable receipt publication, supervisor/worker
   binding files Phase 2 later reads back).

(2) and (3) are not competing implementations of the same role -- they
answer different questions ("run a short RPC-shaped call tied to this
invocation's own lifetime" vs. "run a long agent job that must outlive its
own caller"). The audit's "will become a real duplicate" framing was
about (1) being gradually SUPERSEDED by (2) as routes migrate to `native`
(sequential replacement, per the kernel doc's own stated plan), not (2)
and (3) colliding.

**Vocabulary decided** (to be recorded in `docs/decisions/` and used going
forward, named after the load-bearing axis -- lifecycle/detachment -- not
current content, so the names stay correct if either mechanism's real use
case shifts later):
- **`detached-run-supervisor`** -- the role `cli-spawn-supervisor.mjs`
  fills: a supervised run that is deliberately detached and must survive
  the crash of whatever dispatched it. Two known implementations today:
  `isCliSpawnRunStillWorking` (cli-spawn adapter) and the new
  `isHerdrSpawnRunStillWorking` (herdr-spawn adapter, this phase).
- **`bound-invocation-supervisor`** -- the role `supervisor.rs`
  (`providers/external_process/*`) fills: a supervised external-process
  call bound to one invocation's own lifetime, never detached, never
  expected to outlive its caller.
- The decision note itself must anchor on this lifecycle test (detached
  + crash-surviving vs. bound + caller-lifetime), not on "agent" vs.
  "RPC" content labels, so a future reuse of either mechanism for
  different content is judged by the right property.

**Rename, in scope for this phase (user's own call, done now rather than
deferred):** `cli-spawn-supervisor.mjs` and its adapter-specific exported
symbols renamed to reflect `detached-run-supervisor`; `supervisor.rs`
(and its module path under `providers/external_process/`) renamed to
reflect `bound-invocation-supervisor`. Use this repo's own `rename` tool
(GitNexus) per this project's own instruction ("NEVER rename symbols with
find-and-replace"), not a manual find-and-replace. 16 real JS import
sites + 7 real Rust reference sites confirmed via source before starting
(not a guess at blast radius).

## Verification strategy

Every phase above requires a REAL test reproducing the audit's own
probe shape (not a synthetic/fake-executor-only test that could hide a
real production bug the way this track's own predecessor found happening
elsewhere in this repo). Where the audit ran a live probe against the real
module (S1, S2, S3), the corresponding phase's own test must exercise the
SAME real module, not a mock. `env -u CLAUDE_CODE_SESSION_ID npm test`
must stay green throughout; this is a correctness-critical area of the
platform every other track in this repo depends on, so no phase merges
without independent Lead (or equivalent) re-verification against real
source and real command output — self-reports are data, not proof, per
this repo's own established discipline.

## Risk map

| Risk | Level | Proof point |
|---|---|---|
| Phase 1's consolidated judge subtly changes semantics for a call site not migrated in Phases 2-4 | medium | Phase 1's own exit criteria requires confirming every NOT-migrated call site is unaffected before closing |
| Phase 2/3/4 fixes change real dispatch timing/behavior other tracks depend on | high | this repo has many concurrent tracks using dispatch daily; every phase needs the full suite green plus a real-world smoke dispatch before merge, not just unit tests |
| Phase 5's deletion path (if chosen) breaks a caller this plan didn't find | medium | grep the whole repo for `dispatch.claim`/`clear-assignment-claim` references before deleting anything, not just the files the audit named |
| Phase 7's shadow-binder retirement removes the "keep legacy on divergence" safety net before real divergence is actually at zero | high | Phase 7's own exit criteria requires real telemetry evidence, not an assumption, before retiring anything |

## Unresolved questions (do not guess — resolve at Phase 8, or earlier if a dependent phase needs it sooner)

- S4: product decision on concurrent mutating Assignments sharing a cwd.
- C4: process-supervision ownership between the Node and Rust supervisors.
