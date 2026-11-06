---
phase: 06
title: "Launch failure path: a launch refused before the handover gives back its private home and its pane; adopt of an intent-only attempt releases the pane by key"
status: pending
depends_on: [03, 05, 08, 11]
parallel: "none (assignment-runner.mjs, herdr-round.mjs, registrations.mjs chains; after 11 for registrations.mjs)"
effort: ~1d
net_size: "Node +15 / Rust +15 / tests +40 (estimate)"
---

# Phase 06 — Launch failure path (R-6, H-T4f)

## Context

Arbitration §2 received items "H-T4f + R-6" and §3 row R-6 + H-T4f (owning test "a refused pre-handover launch leaves no attempt home and no pane"); red-team R-6 (reasoned); T4 hand-off H-T4f. T4 P07 gave adopt the lock-without-envelope attempt through `attempt-intent.json` (decision 60, OQ-1a/OQ-2a): adopt publishes a v3 envelope from the intent and runs the ordinary steps, so `finalize-home` already runs for a killed controller; the pane is not released because the intent names no slot.

Code read on `4b116c27e`:
- Order in `executeAssignment`: intent `assignment-runner.mjs:1340` (`writeAttemptIntent`), private home `:1908` (`prepareConfinementForLaunch`), pane `:1948` (`prepareTerminalAttempt` → `herdr-round.mjs:415` allocate), envelope `:2034` (`writeAttemptFiles`), supervisor `:2053`.
- `finally` `:2119-2143`: removes the intent when a settled result exists without an envelope (`:2127`); `terminalPrep.abandon()` when not handed over (`:2131`) releases the pane, runs `cleanupTrust`, redacts a herdr worker home (`herdr-round.mjs:399-403`); nothing finalizes the bwrap attempt home made at `:1908` (the home holds a login copy).
- Intent: `src/run-supervisor/direct-launch.mjs:175-188` (`writeAttemptIntent`: no `slot`, no endpoint; steps from `attemptSteps`, `cleanup-trust` for terminal). Adopt: `packages/run-supervisor/rust/src/adopt.rs:365-421` (intent read, not-started close), `steps.rs:99,118-130` (`release-slot` builtin needs `envelope.slot.key`), `terminal_slot.rs:152` (`release`).
- Doctor: `credential-copies-retained` (`registrations.mjs:4815`) does not count a v2 home whose run has neither envelope nor intent (red-team R-6; arbitration §2 doctor rows).

## Requirements

- **Live failure path.** On any throw after `prepareConfinementForLaunch` and before the handover, the controller finalizes the attempt home through the one door (`finalizeAttemptHome`, descriptor-driven, so a renewed login is still staged first) before it removes the intent; the pane is released by `abandon()` as today. One order rule, stated in a comment: everything made before the envelope is given back by the `finally`, and the intent is removed only after that.
- **Killed controller.** The intent gains `terminal: { slot: { key, groupKey }, endpointEnv }`, published again (the intent is a mutable projection, T4 accepted "replaced under the lock") right before the pane is allocated; adopt's not-started close copies it into the envelope it publishes and adds `release-slot` to the steps for a terminal intent, so the existing builtin releases the pane by key. `contracts/attempt-intent.v1.json` gains the optional field (lead checks the adopt reader tolerates unknown fields today; if it refuses them, bump the contract version and say so in the formats table).
- **Doctor.** `credential-copies-retained` also counts a v2 home whose run directory has neither `envelope.json` nor `attempt-intent.json` (no door will ever finalize it), with the fix text naming the attempt.
- P01's row "a launch refused before the handover leaves no attempt home and no pane" (Node) and the intent-only adopt row (Rust) go green.

## Files

**Create:** none.

**Modify:**
- `src/runner/dispatch/assignment-runner.mjs` (`:1908-1960` the failure path, `:2119-2143` `finally`)
- `src/runner/dispatch/herdr-round.mjs` (publish the slot into the intent before `allocateAsync`, `:415`; or return it so the controller publishes it — one writer)
- `src/run-supervisor/direct-launch.mjs` (`writeAttemptIntent` `:175-188` accepts `terminal`)
- `packages/run-supervisor/rust/src/adopt.rs` (`:365-421`), `packages/run-supervisor/contracts/attempt-intent.v1.json`
- `src/setup/registrations.mjs` (`credential-copies-retained` counter)
- Tests: the P01 Node row's file, `packages/run-supervisor/rust/tests/adopt_matrix.rs` (intent-only terminal attempt: release-slot receipt present), `release_slot_step.rs` only if a helper is shared, `test/setup/credential-copies-retained-check.test.mjs`
- census

**Delete:** none.

**Tests to retire:** none; if an existing test asserted that a refused launch leaves its home for a later sweep, it asserted the defect: rewrite it to the new behaviour and name the P01 row as owner.

## Net size

Node: failure-path finalize +8, intent slot +5, doctor count +5 → about +15 (some lines move into P09's `buildLaunch`). Rust: adopt copies slot and adds the step +15. Tests: Node row +20, Rust row +15, doctor case +5 → +40.

## Steps

1. P01 rows; confirm red (Node: refused after home before pane; refused after pane before envelope. Rust: intent with terminal slot, lock free).
2. Controller `finally` order; Node row green.
3. Intent `terminal` field, adopt copy and `release-slot`; Rust row green over the fake herdr.
4. Doctor count; census.

## Validation (focused)

- FR the P01 Node file, `test/runner/assignment-dispatch.test.mjs test/run-supervisor/attempt-steps.test.mjs test/setup/credential-copies-retained-check.test.mjs test/run-supervisor/inspect-recover-adopt.test.mjs`
- `cargo test -p fgos-run-supervisor --test adopt_matrix --test release_slot_step --test steps_runner`
- msvc and darwin `cargo check -p fgos-run-supervisor`; clippy.

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| Finalizing the home on the failure path removes a login copy whose renewal was not yet staged | L × H | `finalizeAttemptHome` stages first and keeps the home on `keepHome` (existing rule); the failure path calls that door, never `rmSync`. |
| Publishing the intent twice opens a window where adopt reads the older intent | L × M | The second publish happens under the attempt lock, before allocation; adopt needs the lock free, so it cannot read between. |
| Releasing a pane by key that a person reused | L × M | Keys are attempt ids (`herdr-round.mjs:343-345`); `release-slot` refuses a slot it cannot prove (Retry). |

## Rollback

Revert the merge; re-activate the previous release. On disk: intents with a `terminal` field (old adopt ignores it, or refuses if strict — the lead's check decides which line goes into the guide).

## Done when

Both P01 rows green; doctor counts orphan v2 homes; landed with a pane smoke that is made to fail before the handover (scratch config), leaving no home and no pane; guide section written.

## Lead brief essentials

One order rule in the `finally`; use `finalizeAttemptHome` and the `release-slot` builtin, no new cleanup code. All plan.md lead rules apply.
