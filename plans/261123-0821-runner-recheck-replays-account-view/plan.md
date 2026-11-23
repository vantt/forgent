---
contract: plan-v1
title: "The mutating-unit recheck replays the bind-time account view instead of re-binding without it"
status: done
lead: head:lead-forgent-261123-0821-runner-494d8
priority: P1
base: 805beabb809bc225727bbb2f587632f1cacdadbb
blockedBy: []
footprint:
  - plans/261123-0821-runner-recheck-replays-account-view/**
  - packages/execution/engine/src/assignment_runner/**
  - packages/execution/engine/src/unit_run/**
  - packages/execution/engine/src/planning/bind_facade.rs
  - packages/execution/engine/tests/assignment_runner.rs
  - packages/execution/engine/tests/unit_run.rs
  - packages/execution/contracts/assignment-runner/legality.v1.json
  - apps/fgos/src/wiring/unit_run_host/**
  - docs/platform/runner/contracts/executor-model.md
  - docs/platform/runner/subcomponents/h-6979005beaf7/spec.md
source:
  - plans/discussions/ds-f4ocn3oiex-runner-recheck-replays-account-view/DISCUSSION.md
  - p-drfxqdzzon
created: 2026-11-23
---

# The mutating-unit recheck replays the bind-time account view

## Outcome

A writing unit whose binding was shaped by account state passes the mutating recheck. For example, a quarantine
removed gemini's only account, so the seat bound deepseek/thehive. The recheck feeds the bind the same account
state the run bind read, at the same time. It reaches the same answer the run bind did, and it never reads live
lease state. If the quarantine ends between the bind and the recheck, nothing changes. When the recorded state cannot
reproduce the `bindingInput.accountViewDigest` the bind recorded, the recheck refuses by name and never re-binds
silently.

## Facts (written at d2f0cbe66)

- Cause, proven read-only: `plans/reports/debugger-261123-0805-runner-recheck-ignores-account-view.md` (73b4490f3).
  The run bind reads the live overlay. `Run::bind_with` (`packages/execution/engine/src/unit_run/run.rs:1227`) passes
  `{ runtimeDir, assignmentId }` to the host port `Host::bind` (`packages/execution/engine/src/unit_run/host.rs:183`).
  The real host then builds a `LeaseOverlay` (`apps/fgos/src/wiring/unit_run_host/accounts.rs:85-116`) that calls
  `read_account_state_overlay(assignment_id, now)` (`packages/execution/engine/src/accounts/state.rs:638`). The recheck
  binds with `accounts: None` (`packages/execution/engine/src/assignment_runner/legality.rs:318-323`), so
  `overlay_of` (`packages/execution/engine/src/planning/bind_facade.rs:169`) has nothing to read and the comparison at
  `legality.rs:340-366` refuses.
- The bind records only a digest of the view. `packages/execution/rust/src/bind.rs:709-718` computes `accountView`
  and `accountViewDigest`. `BindingInput` (`packages/seat-binding/rust/src/model.rs:686-696`) is "the replayable,
  non-secret subset ... no account facts", so it keeps the digest and leaves out the view. Nothing in `unit.json` can
  rebuild the view today. Replaying the view means recording the bind's input somewhere the recheck reads.
- The view depends on `now`: `account_view` keeps a quarantine only while `quarantinedUntil > now`
  (`packages/execution/rust/src/accounts.rs:564`), and the overlay reader uses `now` too. The recheck binds with
  `now = 0` (`legality.rs:325`). Each attempt records `boundAt` (`run.rs:1743`, ISO), but at record time, not at the
  bind's own `now`.
- The contract currently says a replay reads the config alone: `docs/platform/runner/contracts/executor-model.md:139-141`
  ("without it the account view is the config alone, which is what a replay and `explain` read"). This plan changes
  that sentence.
- The Node twin `src/runner/dispatch/assignment-runner.mjs:~305-345` has the same gap. Only tests import it now. Owner
  decision B of 2026-11-22 (`docs/platform/runner/decisions/h-36d872fbb0e5.md:2069`) classes it as the dead Node
  closure, and draft plan `261122-2108-delete-dead-node-execution-closure` (backlog `p-24xw2cwdvo`) deletes it
  together with `test/golden-recorders/**`. `fgos run` uses the Rust path.
- `legality.v1.json` was recorded from the Node twin by `test/golden-recorders/assignment-runner.recorder.mjs`. No test
  or script reruns that recorder, and the vectors have not changed since the port (456c64595, f09b13eb3).

## Prior art reused, and what was missing

Reused:

- the existing replay rule and its named refusals: `binding-replay-snapshot-missing` and
  `binding-replay-config-mismatch` (`legality.rs:280-298`). The new refusals follow that pair.
- the `AccountStateSource` port and `BindContext.accounts` (`bind_facade.rs:66-76`). The recheck passes a source
  that returns the recorded overlay, so no new bind entry is needed.
- the existing `Host::bind` port, with its return value widened. No new port.
- the attempt record in `unit.json`, which already carries `boundAt` and `configHash`.
- `walk_state_of`, unchanged.
- the vector file and its Rust driver (`packages/execution/engine/tests/assignment_runner.rs`).

Missing: a record of the account state the bind consumed and of the `now` it read that state at. `git log
-S accountViewDigest` shows the digest has been there since 4372c6fe0 and 6ff59e075, and no code ever replayed it.

## Approach

**Chosen:** record the bind's account input on the attempt, and have the recheck replay it.

1. `Host::bind` returns the binding together with the overlay it read and the `now` it read it at. The run adds
   `accountState: { at: <epoch ms>, overlay: <the overlay as read> }` to the attempt next to `boundAt`, but only when
   the overlay is non-empty. An empty overlay is the same input as the config alone, so it needs no record. Old records
   and the existing unit-run vectors keep their shape.
2. Before the recheck binds, it reads `accountState` from the same recorded attempt it already reads `configDigest`
   from. It binds with `accounts: Some(<a source returning the recorded overlay>)` and `now = accountState.at`.
   Without the record, it binds with `accounts: None` and `now = 0`, as today.
3. When the recorded `bindingInput.accountViewDigest` is present, the recheck compares it with the recomputed one
   before it compares bindings:
   - The digests differ and the attempt had `accountState`: refuse with `binding-replay-account-view-mismatch`. The
     machine's login inventory or the record changed.
   - The digests differ and the attempt had no `accountState`: refuse with `binding-replay-account-view-missing`.
   - A record with no recorded digest (written before the digest existed) skips this check, which is today's behaviour.
4. The binding comparison, the pinned-executor check and every other refusal stay as they are.

**Rejected:**

- Recheck with the live overlay. It fails the stated case: a quarantine that ends between the bind and the recheck
  produces a mismatch. The discussion's direction rules it out.
- Put the view into `bindingInput`. That would break the seat-binding contract's deliberate rule "no account facts" in
  a binding that travels into the assignment, and it would also change `packages/seat-binding`. The attempt record is
  runner-owned and already holds account facts (`binding.account`, `leaseAccount`).
- Record the computed view instead of the overlay. Passing a pre-computed view would need a new bind entry that skips
  `account_view`. With the overlay, the bind recomputes the view from the committed config and the machine's
  inventory, so the digest comparison is a real reproduction check and not just an integrity check on the record.
- Fix the Node twin as well. It is dead code with no production caller (fact above), and its deletion already has its
  own plan. Editing it would also collide with running plan `261121-2110-component-authority-doors`, whose footprint
  holds `src/runner/dispatch/**`. Under L10 and design principle 1, the gap goes with the twin when it is deleted. The
  new vectors are written by hand into `legality.v1.json` and marked as Rust-owned, as the phase file says.

Laws honoured: L10 (no second recheck path; the one gate gains its missing input), design principle 8 (one owning
proof, in the existing vector file and driver), and RUL104 (no new port, verb or mechanism; one record field and two
refusal codes).

## Acceptance criteria

1. `cargo test -p fgos-execution-engine --test assignment_runner` is green. `legality.v1.json` holds new cases that
   the driver replays:
   - (a) a binding to deepseek/thehive, made while the recorded overlay quarantined gemini's only account, is
     accepted. Its `quarantinedUntil` is earlier than the wall clock and later than `accountState.at`, so a quarantine
     that ended before the recheck is covered.
   - (b) the same attempt with an altered recorded overlay is refused with code `binding-replay-account-view-mismatch`.
   - (c) the same binding with no `accountState` is refused with code `binding-replay-account-view-missing`.
2. `cargo test -p fgos-execution-engine --test unit_run` is green. In one owning case, a writing seat bound under a
   non-empty overlay records `accountState { at, overlay }` on its attempt, and a seat bound under an empty overlay
   records none.
3. `cargo test --workspace` and `npm test` are green on the combined tree.
4. `rg -n "accounts: None" packages/execution/engine/src/assignment_runner/legality.rs` finds no hit on the recheck
   path, or only the fallback branch for a record with no `accountState`.
5. `docs/platform/runner/contracts/executor-model.md` and `docs/platform/runner/subcomponents/h-6979005beaf7/spec.md`
   say that the write gate replays the recorded account state and names the two refusals.
   `node scripts/plan-contract-check.mjs --plan plans/261123-0821-runner-recheck-replays-account-view` passes.
6. Live check after release: the next writing unit bound while an account is quarantined passes the recheck. Evidence
   is `fgos dispatch inspect --provider-capacity` showing the quarantine, plus the unit's `unit.json` attempt carrying
   `accountState`. Backlog `p-drfxqdzzon` closes with this plan.

## Non-goals

- Making deepseek primary. The owner keeps the cheap families in fallback.
- Changing the quarantine policy, the walk, the lease, or the seat-binding crate's `BindingInput`.
- Fixing the Node twin `src/runner/dispatch/assignment-runner.mjs` or rerunning its golden recorder. Deleting it is
  `261122-2108-delete-dead-node-execution-closure`.
- The write gate's existing gap with `preferIndependentOf` (`h-36d872fbb0e5.md:1710`).

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Record the bind-time account state and replay it in the recheck](phase-01-record-and-replay-account-state.md) | - | packages/execution/engine/src/assignment_runner/, packages/execution/engine/src/unit_run/, packages/execution/engine/src/planning/bind_facade.rs, packages/execution/engine/tests/assignment_runner.rs, packages/execution/engine/tests/unit_run.rs, packages/execution/contracts/assignment-runner/legality.v1.json, apps/fgos/src/wiring/unit_run_host/, docs/platform/runner/contracts/executor-model.md, docs/platform/runner/subcomponents/h-6979005beaf7/spec.md | 1 | done |
| 2 | [Integration and close](phase-02-integration-and-close.md) | 1 | plans/261123-0821-runner-recheck-replays-account-view/ | 2 | done |

Phase notes:

- Phase 1: landed `2b903592c` (branch p01b @ `9447e2cd7`); land gates green;
  [report](reports/lead-261123-1033-phase-01-parked-on-land-recovery.md).
- Phase 2: the 11:07 units c-72536 and c-74587 were refused by the binding mismatch on the release that predated
  `2b903592c`. On release `df57ddfcd609` the live check passed: unit-run-1795414231355-8ed8aba7 bound deepseek/thehive
  under a gemini quarantine, recorded `accountState`, and committed. The workspace run found a compile break phase 1
  left in `apps/fgos/src/wiring/unit_run_host/tests/mod.rs`, fixed and landed as `280c484ab`. Acceptance 1, 2, 4, 5
  and 6 pass. Acceptance 3 was run by lead:SUPERVISOR at `deaedf06d` (contains both commits): cargo 4301 passed, 1
  pre-existing red (`head_request` contract verbs); npm 7883 of 7923 passed, 12 red, none in the runner recheck
  (`plans/261123-0726-contract-check-in-confined-heads/reports/npm-test-full.md`).
  [report](reports/lead-261123-1322-phase-02-integration-gate.md)

Contract check, done by hand and by `node scripts/plan-contract-check.mjs`: phase 2 sits in a later wave than phase 1,
which it depends on, and each wave holds one phase, so no two phases share a footprint. Phase 1 is one leader's work,
under a day. The fix, its proof and its docs move together so that a tree with phase 1 alone is complete.

**Cross-plan footprint:** no overlap with the running plans `261121-2110-component-authority-doors`,
`261122-0118-heads-stable-and-able`, `261123-0726-contract-check-in-confined-heads` or
`261123-0815-head-status-line-ak-land`. Two files were left out on purpose:

- `src/runner/dispatch/**` (the Node twin; see Non-goals).
- `CHANGELOG.md`, which `261121-2110-component-authority-doors` (running) holds. Supervision admission
  (`packages/supervision/rust/src/portfolio.rs`) admits no plan that overlaps a running one, and this P1 fix should not
  wait for that plan to finish. The line for `## [Unreleased]` is "Fixed: a writing unit bound while an account was
  quarantined is no longer refused by the write gate with a binding mismatch; the gate replays the account state the
  bind read." Phase 2 hands that line to the supervisor, who adds it once `CHANGELOG.md` is free.

Draft plan `261122-2108-delete-dead-node-execution-closure` shares `packages/execution/contracts/**`. It is a draft,
and when it deletes the recorder it must keep the Rust-owned legality cases this plan adds (named in Risks).

## Owner questions

None. The discussion settled the direction, and the evidence settled the remaining choices (what to record, and the
Node twin).

- `q-7x7b33ekew` (phase 01, land blocked by a foreign pending Land `land-3689269-1795400075015143607-2`): closed on the
  owner's order 2026-11-23 11:01, handled and no longer needed. lead:SUPERVISOR ran `fgos git recover`, lands settled,
  and phase 1 then landed as `2b903592c` (`plans/reports/supervisor-261123-1050-land-stranded-local-main-recovered.md`).

## Risks and rollback

- **The digest might not reproduce for an honest record.** The bind's `now` and the overlay's `now` could differ, or
  the inventory could be read differently. Proof point: acceptance case (a) has to pass with the overlay recorded by
  the real run path (acceptance 2), not only with a hand-made one. If the digest does not reproduce, phase 1 stops and
  reports; it does not loosen the digest check.
- **Trust in `unit.json`.** A worker can write `unit.json`, so it could forge `accountState` together with the
  digest. The forged state can only pick a binding the committed config can reach under some account state, because
  the config digest and the executor comparison still hold. That matches the trust the record already gets for
  `configDigest` and the walk, so the plan adds no new mechanism for it. A later hardening could compare against the
  lease receipt's `accountViewDigest` (`accounts/state.rs:823`); that is listed here as an idea only.
- **Unit-run vectors.** Recording only a non-empty overlay keeps the existing unit-run records and vectors as they
  are. If a vector does change, phase 1 updates that vector's expected record. It does not skip the field.
- **Recorder rerun.** If someone reruns `assignment-runner.recorder.mjs` before `261122-2108` deletes it, the
  hand-written legality cases are lost. Phase 1 marks them in the vector file, and phase 2 reports the risk to the
  supervisor for `261122-2108`.
- **Rollback:** revert phase 1's merge commit. Attempts that already carry `accountState` are ignored by the old code,
  and the old recheck behaviour (refusing quarantine-shaped bindings) comes back.

## Outstanding questions

None
