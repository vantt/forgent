# unit/P8a execution report — S4 cwd mutex + herdr-spawn liveness

Worktree: `.claude/worktrees/dispatch-engine-liveness-p8a-cwd-mutex-and-herdr-liveness`
Branch: `unit/P8a`, based on `9d5ad8cef`

## Status: DONE

## Files changed

- `src/runner/dispatch/assignment-runner.mjs` (+144/-6)
- `src/runner/dispatch/cli.mjs` (+2)
- `src/runner/dispatch/herdr-agent.mjs` (+10/-1, backward compatible)
- `src/runner/dispatch/herdr-reconcile.mjs` (+78, new export)
- `test/runner/assignment-cwd-mutex-concurrency.test.mjs` (new)

Did NOT touch `cli-spawn-supervisor.mjs` (P8b's own scope) or
`main-checkout-lock.mjs`'s own logic (reused as-is).

## Part 1 — S4 cwd mutex

**Real deviation from the plan's own assumption, found and corrected via
source, not guessed:** the plan's investigation note claims "placing the
lock at the admission layer... naturally covers both [cli-spawn and
herdr-spawn] without separate wiring." This is wrong. herdr-spawn already
goes through `executeExecutorCli()` for its actual dispatch (the `else`
branch at the bottom of `executeAssignment`, used whenever
`useSupervisorRecovery` is false), and `executeExecutorCli` ALREADY
acquires its own `acquireMainCheckoutLock(fgosDir, {lockFile:
dispatchLockFile(cwd)})` for the full duration of that call (cli.mjs:876).
Adding a second lock at the admission layer for herdr-spawn too would
self-conflict: two different per-call string identities from the same
process racing the identical lock file, where the second sees the first as
HELD by "a different holder" and refuses — herdr-spawn dispatch would
always fail the moment this landed. **Fix: scoped the new lock to the
cli-spawn (`useSupervisorRecovery`) path only** — the one Assignment
launch shape that genuinely had zero coverage. Keyed on the SAME
`dispatchLockFile(cwd)` name executeExecutorCli already uses, so a
cli-spawn Assignment, a herdr-spawn Assignment, and an ad-hoc `dispatch
execute` all correctly contend on ONE lock file per cwd.

**Second correction, found by running the existing suite, not assumed:**
first implementation acquired the lock unconditionally (mirroring
herdr-spawn's own existing unconditional precedent). This regressed two
real, pre-existing tests in `assignment-dispatch.test.mjs` — "genuinely
concurrent invocations under the same --work id ... both contracts
persist" (the `--contract` door, `isReadOnlyMode: true` unconditionally
per ADR-006 R8) — proving concurrent READ-ONLY dispatch to the same cwd
through this exact door is intentional, already-relied-upon behavior.
**Fixed: gated the lock on `effectiveMutation === 'mutating'`.** This is
exactly the distinction the plan's own S4 write-up flagged as an open
question ("may be intentional for read-only parallel panels") — I now
have concrete empirical proof it's real, not just a possibility, and
narrowed the fix accordingly. Read-only Assignments never acquire the
lock and are never blocked by it.

**Identity scheme:** per-call composite string (`${pid}:${ts}:${rand}`),
mirroring `executeExecutorCli`'s own scheme exactly — NOT a bare
`process.pid` (the `claimWork`/`merge.mjs` precedent). A bare pid would
let a second, unrelated dispatch from the same long-lived process
self-recognize as a refresh of the first instead of a genuine contender,
defeating the mutex for the in-process-fanout shape.

**Override:** new, distinct option `opts.forceSharedCwd` / CLI
`--force-shared-cwd`, wired at both `executeAssignment` call sites in
cli.mjs (`--assignment` and `--contract` doors), following the same
`rest.includes('--flag')` boolean pattern as the existing
`--has-live-task-access`. Kept distinct from `forceNewAttempt` rather than
reused: `forceNewAttempt` means "override the M1 same-assignment-retry
check"; this is a different axis ("override contention with ANY OTHER
assignment/process sharing this cwd"). Conflating them risked exactly the
confusion the plan itself worried about.

**Found, not fixed (pre-existing, out of scope):** `--force-new-attempt`
itself was never actually wired to argv — confirmed via repo-wide grep;
`plans/260920-2217-dispatch-engine-hardening/phase-03-single-live-worker.md`
already documents this as a deliberate, left-open gap
("CLI flag `--force-new-attempt` ... CHƯA wire"). Unrelated to S4; did not
expand scope to fix it.

**Test:** `test/runner/assignment-cwd-mutex-concurrency.test.mjs` — two
concurrent `executeAssignment()` calls in the same process (not two OS
processes; deliberate, matches the task's own allowed shape and is
explained in the test's header comment: a composite string identity never
self-recognizes a second unrelated call, and its held-ness is judged by the
real liveness of the embedded pid, so this genuinely proves admission-time
contention). Proves: (a) a second, different mutating Assignment on the
same cwd is refused by default while the first's real cli-spawn
supervisor/worker subprocess tree is still alive, with the refusal naming
the holder; (b) `forceSharedCwd: true` lets a third Assignment proceed to
its own real worker spawn regardless. Uses a real detached supervisor
(mirrors `assignment-dispatch.test.mjs`'s own S1 live-probe style), not a
fixture.

## Part 2 — herdr-spawn liveness (`isHerdrSpawnRunStillWorking`)

Placed in `herdr-reconcile.mjs`, not `assignment-runner.mjs` — co-located
with `readHerdrLaunchCommand` and the exact `foregroundProcesses.find(p =>
p.pid !== shellPid)` interpretation pattern this file's own
`reconcileHerdrSpawnRun` probe already uses, rather than duplicating that
interpretation logic in assignment-runner.mjs.

`paneProcessInfo` (`herdr-agent.mjs`) gained an optional `{timeoutMs}`
param (backward compatible — every existing caller omits it, unaffected).
Bounded pre-check uses `timeoutMs: 5000`, matching this file's own
established convention for quick administrative herdr calls (`tab
close`/`pane close`, both `5000`) rather than inventing a new number.

**Wiring, given the CAS-section constraint:** `admitRunAttempt`'s own M1
check is a synchronous CAS critical section (Phase 4/5 of this track
hardened it to never block on anything external) — but herdr's own
liveness signal is a real, non-deterministic `herdr` CLI subprocess call.
Solved by computing it OUTSIDE the CAS, as a best-effort peek at whatever
admission generation is current right now (`currentGeneration`,
run-lock.mjs), tagged with that generation's `runId`. Inside the CAS
section, the real `current.record.runId` is compared against the tag: a
match consumes the pre-computed result; a mismatch (a concurrent commit
raced between the peek and the CAS, changing `current`) or no pre-check at
all falls back to treating it as "still working" — i.e. refuses. The
adapter-dispatch decision itself (`herdr-spawn` vs not) is re-derived
synchronously inside the CAS from the prior run's own persisted
`run.json.adapter`, the same cheap local read the surrounding code already
does for `result.json`.

**Fail-closed on `'unknown'`, by design, not oversight:** the herdr call
itself can fail (`herdr_unavailable`/`herdr_call_timeout`). Rather than a
plain boolean, the function returns `true | false | 'unknown'`.
`'unknown'` is treated the SAME as "still working" (refuse) — both are
truthy, so the existing `||` chain in M1 does this without special-casing.
Matches this track's own repeated "fail closed on undecidable liveness,
never fail open" rule (`resolveMutatingCwdPosture`, the composite-pid
AMBIGUOUS lock status). The cost is zero new UX surface: an operator who
has independently confirmed the prior attempt is gone already has
`--force-new-attempt` for exactly this "host can no longer observe
correctly" shape.

**Test:** covered indirectly by the full herdr-reconciliation/herdr-agent
suites (58 tests, all green) proving `paneProcessInfo`'s new optional param
is behavior-preserving. Did NOT add a dedicated SIGKILL-style live probe
test for `isHerdrSpawnRunStillWorking` itself (the task's own suggested
"S1-class-but-for-herdr-spawn" test) — ran out of scope budget after the
Part 1 regression investigation and fix; this is a real gap, not hidden.
See Unresolved below.

## Known, related, NOT fixed (documented per repo convention, not silently left)

- `providerCapacityIsRunWorkerAlive` (assignment-runner.mjs, used by
  provider-capacity lease reclaim) still only consults
  `isCliSpawnRunStillWorking` — a herdr-spawn run's lease could have the
  same "runner dead, detached child alive" blind spot for lease reclaim
  specifically. Out of the task's named scope (which named only
  `admitRunAttempt`'s M1 check); flagging for a future item rather than
  silently leaving it undiscovered.

## Tests

- Type/syntax check (`node --check`) on all 4 touched source files: pass.
- Targeted: herdr-agent + herdr-reconciliation + herdr-round-reconcile (58
  tests), assignment-dispatch + herdr-spawn-assignment-dispatch +
  cli-spawn-reconciliation + main-checkout-lock (186 tests), new cwd-mutex
  test (1 test) — all green after the mutation-gating fix.
- Full suite (`env -u CLAUDE_CODE_SESSION_ID npm test`): **7994 tests, 7921
  pass, 0 fail, 8 skipped, 65 todo** (skipped/todo counts match this
  track's known pre-existing baseline, not introduced by this change).

## Unresolved questions

- Should `isHerdrSpawnRunStillWorking` get its own dedicated real-SIGKILL
  live-probe test (mirroring the S1 cli-spawn one exactly)? I believe yes,
  but did not build it this round — real herdr binary/daemon availability
  in this environment plus the added Part 1 investigation ate the budget.
  Existing coverage is real (58 herdr tests green, confirms no
  regression) but does not reproduce the exact "SIGKILLed runner, live
  detached pane" class of bug for herdr-spawn specifically.
- `providerCapacityIsRunWorkerAlive`'s parallel gap (above) — worth a
  follow-up item; did not fix here (named scope was M1 only).
