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
  cwd) by writing code first. That is a product decision — see Phase 6.

## Phase 1 — Consolidate process liveness onto one judge (root cause, C2)

### Work

1. Build (or promote, if `process-identity.mjs` already has the right
   shape per the audit's own recommendation) a single module exporting
   one record shape `{pid, bootId, startTime}` and one judge function
   returning `live | dead | ambiguous` — using the SAME semantics as the
   audit's own comparison table (unreadable-start-time handling, pid-reuse
   detection via bootId+startTime, matching `resolveHolderLiveness`'s
   already-correct behavior at `run-lock.mjs:74-85`, since the audit
   confirms that one is well-built).
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
