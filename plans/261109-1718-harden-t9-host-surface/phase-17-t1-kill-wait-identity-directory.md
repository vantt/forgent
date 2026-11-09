---
phase: 17
title: "T1 fix: one kill-wait constant from the holder-lock crate; the identity crate judges its own shared directory"
status: pending
depends_on: ["none inside T9 (T1 is closed; this is a fix of a closed layer, decision 83)"]
parallel: "T1 slot, beside P02 (file-disjoint); P10's identity row switch waits for it"
effort: ~0.5d
net_size: "Node about -5 here (doctor's -40 is booked in P10); Rust about +40; tests: the directory judgement cases move from the doctor test to the identity crate, about 0 net (estimate)"
---

# Phase 17 - T1 fix: kill wait and identity directory (authority audit AU-03 part, AU-07 part)

**Authority moved:** (1) the predecessor kill wait (decision 12: one bound, 2000 ms) is decided once, in `packages/holder-lock` Rust; Node reads it, it does not restate it. (2) "is an entry of the shared identity directory dropped, foreign or renamed" is judged by the identity crate that writes the cache, not by a doctor row that parses the crate's private file.

## Context

- **Kill wait (AU-03).** `DEFAULT_KILL_WAIT_MS = 2000` is written in Node `src/holder-lock/protocol.mjs:18` (read by `src/holder-lock/index.mjs:198`, `src/run-supervisor/direct-launch.mjs:272`, `src/setup/holder-lock-checks.mjs`) and in Rust `packages/holder-lock/rust/src/port` (read by `route.rs:413`, `packages/event-store/rust/src/locks.rs`). Two copies of one fixed constant.
- **Identity directory (AU-07).** `checkIdentitySharedDirectory` (`src/setup/identity-checks.mjs:158-180`) reads the identity crate's private cache (`FGOS_FILE.IDENTITY_DIRECTORY`, `v: 1`, `entries`, `dropped`) and judges dropped, foreign and renamed entries itself. The crate (`packages/identity/rust`, `directory` feature) owns the cache shape.

## Requirements

1. Node takes the kill wait from the T0/T1 addon (decision 2: in-process binding) instead of its own literal; if the addon does not export it yet, one exported constant is added beside the existing holder-lock binding. `protocol.mjs` keeps the export name so its three readers do not change; the literal goes.
2. The identity crate answers the directory judgement (counts, dropped with reason and machine, foreign project ids, shared handles) through an **existing** identity route or the addon (step 1 names which). No new user verb (T9 non-goals, RUL104); if no existing route can carry it, stop and ask in the decision-question template.
3. P10 switches the doctor row to that answer; this phase does not edit `src/setup/identity-checks.mjs`.

## Files

**Modify:** `src/holder-lock/protocol.mjs`, the holder-lock addon binding (find by `rg -l "holder-lock" packages/*/node-addon native src/native`), `packages/identity/rust/src/*` (judgement function beside the cache writer), the identity route or addon export step 1 picks, the crate's tests.

**Delete:** the Node kill-wait literal.

**Tests to retire:** none here; the doctor's directory cases move to the crate's tests in P10's change, which names them.

## Steps

1. `rg -n "DEFAULT_KILL_WAIT_MS" src packages`; `rg -n "IDENTITY_DIRECTORY|dropped" packages/identity/rust/src src/setup`; pick the route or addon export for the judgement and record it.
2. Red: a crate test for each judgement case (dropped, foreign, shared handle, none); a Node test that `DEFAULT_KILL_WAIT_MS` equals the addon's value.
3. Implement; Node literal gone.

## Validation (focused)

`cargo test -p` the identity and holder-lock crates (names from `Cargo.toml`); FR `test/holder-lock/*`, `test/setup/identity-checks*.test.mjs` (unchanged, still green). Land gate; OPC glances (T1).

## Risks and rollback

| Risk | L x I | Mitigation |
|---|---|---|
| The addon is not loaded on a cold path that reads the constant | L x M | the readers already need the addon (holder-lock door); the test runs through the real loader |

Rollback: revert the merge commit.
