---
phase: 19
title: "T4 fix: the run-supervisor adopt route answers whether an attempt is stuck and why; doctor stops parsing envelopes"
status: pending
depends_on: ["none inside T9 (T4 is closed; fix of a closed layer, decision 83)"]
parallel: "T4 slot, beside P05 (file-disjoint); P10's run-attempts-stuck row switch waits for it"
effort: ~0.75d
net_size: "Rust about +40; Node 0 here (doctor's -50 is booked in P10); tests: the stuck-judgement cases move from the doctor test to the run-supervisor crate, about 0 net (estimate)"
---

# Phase 19 - T4 fix: adopt answers "stuck, not adoptable, why" (authority audit AU-07 part)

**Authority moved:** "can adopt close this attempt, and if not why" is decided by the run-supervisor (Rust adopt, `packages/run-supervisor/rust/src/adopt.rs`), not by a doctor row that parses `envelope.json` and combines it with lock state.

## Context

`run-attempts-stuck` (`src/setup/run-supervisor-checks.mjs:188-221`) parses each attempt's `envelope.json` (`releaseGoneReason`, `:188`) to judge whether adopt can close it and combines that with lock state. The adopt route already has a `--probe` switch (`packages/run-supervisor/rust/src/route.rs:116-154`) that today answers only "this host serves the route at protocol 1".

## Requirements

1. The adopt route answers, read-only, for an attempt directory (or for all of a project's attempts): `{ stuck, adoptable, reason }` with the same reasons the doctor row produces today (`release-gone` cases and lock-held). It rides the existing route: a read-only mode of adopt or an extension of its `--probe` answer (step 1 picks; no new user verb, RUL104; stop and ask if neither fits).
2. The judgement code is Rust; the envelope parse leaves Node in P10's change.
3. No behaviour change of adopt itself.

## Files

**Modify:** `packages/run-supervisor/rust/src/adopt.rs`, `route.rs`, the crate's tests; the Node client of the route if it needs one read function (`rg -l "adopt" src/run-supervisor`).

**Delete:** nothing here; `releaseGoneReason` goes in P10.

**Tests to retire:** none here; P10 names the doctor cases that move into the crate's tests.

## Steps

1. Read `releaseGoneReason` and every reason it returns; read `adopt.rs` and `route.rs` `probe`; pick the mode; list callers of the route (`rg -n "adopt" src packages/run-supervisor/rust/src`).
2. Red: a crate test per reason (release gone, lock held, adoptable, not stuck).
3. Implement.

## Validation (focused)

`cargo test -p` the run-supervisor crate; a smoke on a built host against a staged stuck attempt. Land gate; TEST pinged (Rust test time budget, decision 76 a).

## Risks and rollback

| Risk | L x I | Mitigation |
|---|---|---|
| The read-only mode takes a lock adopt would take | L x H | the answer reads lock state through the existing probe, takes nothing; a test holds the lock during the probe |

Rollback: revert the merge commit.
