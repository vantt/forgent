---
phase: 5
title: "Config, Identity and Observe doctor rows in Rust"
status: pending
effort: 2d
wave: B
blockedBy: [3]
q3: "(a)"
---

# Phase 05: Config, Identity and Observe rows

Config already judges its rows in Rust (`packages/config/rust/src/doctor.rs`, contract
`packages/config/contracts/doctor-rows.v1.json`, `d2902fa0c`); Node only maps the findings
(`src/setup/config-checks.mjs:48, 55`). Identity's facts are the identity crate's. This phase calls both in process
and moves the two Observe rows to their crate.

Phase-lead rules: [plan.md](plan.md). Branch `rust-verb-migration-program/s4-p05`. Report slug `s4-p05-config-identity-observe-rows`.

## Rows and fixes (confirm against 00 F2)

- Config: the 15 contract rows (incl. `gateway-token-configured`), registered at `registrations.mjs:1985`; the 6
  `CONFIG_FIXES` (1986). The registry's config group entry points at the config contract; nothing is copied.
- Identity: `writer-identity-resolvable` (3690), `identity-machine-id` (3696), `identity-machine-key` (3703),
  `identity-ssh-keygen` (3710), `identity-project-id` (3716), `identity-shared-directory` (3722; the identity crate's
  own judgement since T9 P10); fixes at 3701, 3708. Judge `src/setup/identity-checks.mjs` (181; spawns the host for
  `probeIdentity`).
- Observe: `observe-dir-writable` (3643), `observe-host-resolvable` (3649), bodies in `registrations.mjs`; the read-only
  rule (no `.fgos/observe` created on the read path, doctor-readiness-only finding 4a) holds.

## Requirements

1. Config adapter: call `fgos_config::doctor` and its repairs in process (no `invokeHost`, no addon); row ids, order
   and texts from the config contract and its fixtures (`packages/config/contracts/fixtures/doctor.v1.json`).
2. Identity adapter: the crate's functions (mint, probe, shared directory) in process; the host spawn of
   `probeIdentity` is gone. `mintMachineId`/`mintMachineKey` (`src/util/identity-mint.mjs`) stay for `init` until 10.
3. Observe rows in `fgos-observe` (or the host adapter if the fact is the host's own resolution), with a test that a
   doctor run writes nothing under `.fgos/observe` in a repository with no fgOS setup.
4. Delete: `src/setup/config-checks.mjs`, `identity-checks.mjs`, the Observe bodies; their registrations.
5. Registry owners `rust:config`, `rust:identity`, `rust:observe`; debt entries out.
6. Parity: config rows on a project with a broken file, a legacy JSON config, a secret outside `private`; identity rows
   with and without a machine key and with `ssh-keygen` missing from PATH; Observe rows in a fresh repository.

## Test owners after the move

| Behaviour | Old proof | Owner now |
|---|---|---|
| config rows and fixes | `test/setup/config-checks.test.mjs` | `fgos-config` doctor tests over its fixtures (already the owner of the findings); adapter wiring: one host case |
| identity rows | `test/setup/identity-checks.test.mjs`, `writer-identity-doctor-check.test.mjs` | `wiring/doctor/identity.rs` tests; identity crate tests own the facts |
| Observe rows | `test/setup/observe-doctor-checks.test.mjs` | `wiring/doctor/observe.rs` tests |

## Files

- Create: `apps/fgos/src/wiring/doctor/{config.rs,identity.rs,observe.rs}`.
- Modify: `wiring/doctor/mod.rs`, the registry contract, `registrations.mjs`, crates only where a public function is
  missing, tests, baseline, manifest, census.
- Delete: as requirement 4.

## Gates

- fmt; clippy `-D warnings` on `fgos`, `fgos-config`, `fgos-identity`, `fgos-observe`; `cargo test` on them; msvc and darwin.
- `node scripts/run-tests.mjs test/rust-host/verb-parity.test.mjs test/setup/registrations.test.mjs test/config/config-door.test.mjs test/architecture.test.mjs`.

## Risk and rollback

- A config fix runs in a different order relative to another fix (M x H): 00 F9; registry order; parity of
  `doctor --fix` on a legacy-config project. Rollback: revert; rows return to the bridge.
