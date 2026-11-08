---
phase: 09
title: "Seat pin rule: an account pin applies only to a seat whose first choice is already in that pool; it never moves a seat to another family; other seats run unpinned with the reason in their provenance"
status: pending
depends_on: ["01 landed (command-registry.mjs, last step only)", "lead question Q-1 answered before landing"]
parallel: "wave 2, with 04, 05, 06, 07, 08; crate work may start now"
effort: ~0.5d
net_size: "Node 0 / Rust +5 / tests −5 (estimate; golden JSON not counted)"
---

# Phase 09 — Seat pin rule (Q3 a = B-5 crate part = R-6)

## Context

Owner decision 71 (3a): "a run-level `--account` pin never moves a seat to another pool; seats it cannot serve run unpinned and `workflow status` shows each seat's account (one condition in the seat-binding crate, golden vectors updated)". Seat Binding is a T5 component and HARDEN owns T5 (arbitration §3: OPC not needed). The Workflow half (dry bind deleted, `seatProviders` account) is P05.

Code read on `595faa273`:
- `packages/seat-binding/rust/src/rank.rs:489-541`: when any survivor is in the pinned pool, survivors are narrowed to that pool (the move); else a skip `account-pin-other-pool` (`:542-546`). `natural_first` is computed just above (`:483-487`).
- Golden: `packages/seat-binding/contracts/seat-binding.golden.v1.json:2476` "an account pin selects its pool's survivors and pins the account", `:2506`, `:2525`; runner `packages/seat-binding/rust/tests/golden.rs`.
- Node: `src/runner/execution/bind.mjs:397` reads the `account-pin-other-pool` skip; `test/runner/execution/account-pin.test.mjs:77` "a pin selects the entries its pool serves, so it can move the seat to the family that pool belongs to" (`:90` asserts the skip).
- Help: `command-registry.mjs:1570` (`fgos run --account`: "pins each seat whose chosen model entry is served by that pool … Refused before the unit run exists when no seat takes it") and `:2403` (`workflow start --account`: "Seats whose chosen model is served by another pool run unpinned").
- Embedded by `apps/fgos` (`apps/fgos/Cargo.toml`) — the host rebuild carries it.
- Spec: `docs/platform/seat-binding/spec.md` (account pin section; lead finds the line).

## Requirements

1. In `rank.rs`, the pin applies only when the seat's first survivor (its choice before the pin) is in the pinned pool: then narrow and pin as today (inventory, disabled and login checks unchanged); otherwise leave survivors unchanged and record `account-pin-other-pool` for that seat. No other rule changes.
2. Golden vectors: the `:2476` case keeps its meaning for a first choice inside the pool; add "a pin never moves a seat whose first choice is in another pool" and "a lone seat whose first choice is in another pool is not pinned" (the `fgos run --account` case, plan fact 9; its expected value follows Q-1).
3. `account-pin.test.mjs:77` retired (behaviour removed; owner: the new golden vector); `bind.mjs` unchanged unless the skip text needs a new reason (lead proves with `rg`).
4. Help text `:1570` and `:2403` state the rule in one sentence each (no "moves"). The `fgos run --account` consequence (a lone seat whose first choice is in another pool: today moved, after the change unpinned and refused at the door, `unit-run-start.mjs:192`) is lead question Q-1 to the owner: with answer (a) the CHANGELOG names both doors and the `--provider` route; with answer (b) the crate takes the pin's source and the `fgos run` case keeps moving (the phase grows by the Rust and vector lines Q-1 states). The phase lands only after the answer.
5. Spec line in the Seat Binding spec (written here; DOC told in P15).

## Files

**Create:** none.

**Modify:** `packages/seat-binding/rust/src/rank.rs`, `packages/seat-binding/contracts/seat-binding.golden.v1.json`, `test/runner/execution/account-pin.test.mjs`, `src/cli/command-registry.mjs` (two lines, after P01 lands), `docs/platform/seat-binding/spec.md` (one line), `CHANGELOG.md`.

**Delete:** the narrowing branch for a seat whose first choice is outside the pool.

**Tests to retire:** `account-pin.test.mjs:77` → owner: golden vector "a pin never moves a seat whose first choice is in another pool".

**Cross-lane one-liners:** none.

## Net size

Rust about +5; golden JSON +2 cases (not counted); tests −15 +10 → about −5; Node 0.

## Steps

1. Red: add the two golden vectors; `cargo test -p fgos-seat-binding --test golden` fails. (Crate work may start before Q-1 is answered; the lone-seat vector's expected value follows the answer.)
2. The condition in `rank.rs`; green.
3. Node test retire; `rg -n "account-pin-other-pool" src test` check.
4. After P01 lands: help text lines; CHANGELOG; spec line.

## Validation

- `cargo test -p fgos-seat-binding`, `cargo clippy -p fgos-seat-binding --all-targets -- -D warnings`, `cargo fmt --all --check`, `cargo check -p fgos-seat-binding -p fgos --target x86_64-pc-windows-msvc` and `--target aarch64-apple-darwin` (private `CARGO_TARGET_DIR` on ext4).
- FR `test/runner/execution/account-pin.test.mjs test/runner/execution/bind.test.mjs test/setup/seat-binding-dry-bind.test.mjs test/workflow/units-runner.test.mjs` (lead confirms names).

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| `fgos run --account` users relied on the move (RT-25) | M × M | Owner question Q-1 before landing; CHANGELOG and guide name the outcome |
| A panel loses a seat's pin silently | L × M | P05's `seatProviders` shows account or skip reason per seat |

## Rollback

Revert; re-activate the previous release (host carries the crate). No on-disk change.

## Done when

Golden green; Rust land gate incl. msvc and aarch64-apple-darwin; smoke on fg-server2: `fgos workflow start delphi --account <pool/acct>` (or `fgos run --account … --provider …` read-only) shows only in-pool seats pinned; guide section written.

## Lead brief essentials

One condition; vectors first. All plan.md lead rules apply.
