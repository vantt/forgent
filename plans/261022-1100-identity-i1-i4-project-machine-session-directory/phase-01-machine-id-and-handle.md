---
phase: 1
title: "Machine id and machine handle (rung I2)"
status: completed
priority: P1
effort: "5h"
dependencies: [0]
---

# Phase 01: Machine id and machine handle (I2)

## Goal
The one identity component, the crate `fgos-identity` in `packages/identity/rust` (renamed from Session Identity in phase 00), gains minting and reading the machine id; Event Store reads it through that crate; `fgos identity machine --json` prints the machine id, its handle and its alias, and `fgos identity machine --alias <name>` sets the alias.

## Facts (scout report §1, §3, §5; red-team findings 1, 4, 6, 7, 8, 12)
- Mint and reader live in `packages/event-store/rust/src/identity.rs:18` (`valid_machine_id`), `:25` (`machine_id`), `:74/:82` (`random_id`), `:187` (`mint_machine_id`, which uses `layout::branch_key`, `layout.rs:122`). The file is `<stateRoot>/machine-id` (`~/.local/state/fgos` on `fg-server`; spec section 4 says `~/.fgos` and is corrected here). No machine id exists yet on `fg-server`.
- `fixEventStoreMachineId` (`src/setup/event-store-fixes.mjs:18`) is not registered but `src/verbs/events/migrate.mjs:72` calls it, and `test/setup/event-store-{fixes,checks}.test.mjs` and the allowlist `test/architecture.test.mjs:1309` cover it.
- The `identity` route is declared `session-identity.resolve` (renamed `identity.writer` in phase 00), Read/Safe, contract `1.0.0` (`packages/host-runtime/rust/src/catalog.rs:51-60`; `command-routes.json:405-420`, no subcommands).
- Convention `identifiers[]` rows have one `first` and one `rest` class and a `reserved` denylist (`packages/convention/contracts/convention.rules.v1.json:94`); Rust reads them with `RuleSet::identifier` (`packages/convention/rust/src/rules.rs:276`).

## Design
- **One component, no new crate** (owner 2026-10-22: "1 component thôi, đã cấp phát ở mọi mức độ rồi thì không cần 2 authority"). The existing crate grows modules `text`, `machine`, later `session`, `project`, `directory`; the writer-id rule (`resolve.rs`) stays as the local part of the session identity. Layering (design principle 2): its existing host provider (`provider.rs`, the only user of `fgos-host-runtime`) moves behind a default cargo feature `provider`; Event Store depends on the crate with `default-features = false`, so the event log and the node addon never pull the host runtime. Observe keeps the default.
- **Moved down, not copied.** `random_id` (128-bit hex from `/dev/urandom`) and the slug rule (`branch_key`'s character loop) move to `fgos_identity::text::{random_hex128, slug}`. Event Store's `branch_key` becomes `slug` plus its own 128-byte cap and `valid_slug`; its `random_id` and `seal.rs:31` call `random_hex128`. `valid_machine_id`, the reader and `mint_machine_id` move to `fgos_identity::machine`; Event Store keeps `machine_id(config_value, state_root)` as its ref-name rule (git-config `fgos.machineId` override, else the identity machine id) and maps identity errors to its own `ErrorCode`s, so `packages/event-store/contracts/result-codes.v1.json` does not change.
- **One validator, one owning proof.** `valid_machine_id` is the only machine-id check; there is no Convention `machine-id` kind (the format already has an owner). Owning test: `packages/identity/rust/tests/machine.rs`. The duplicate validity cases in `packages/event-store/rust/tests/registry_identity_layout.rs:127-139` and `review_fixes.rs:136-140` are deleted in the same change; the mint cases in `packages/event-store/rust/tests/setup_identity.rs` move to `tests/machine.rs`.
- **One mint door.** `fixEventStoreMachineId` stays (its caller `migrate.mjs` and its tests stay) and becomes a one-line call of the identity mint through the existing N-API `mint_event_store_machine_id` (`packages/git/node-addon/src/event_store.rs:601`), which now calls `fgos_identity::machine::mint` through Event Store's re-export. The new registered fix `identity-machine-id` calls the same function. No second implementation; the N-API moves to an identity addon module after HARDEN T1 phase 6 lands (board row).
- **Machine handle.** The alias in `<stateRoot>/machine-alias` if set; else the id without its last `-<6>` suffix, cut to 40 characters, with a leading `m-` when it starts with a digit. Convention kind `machine-handle` (first `a-z`, rest `a-z0-9-`, max 40) checks both. `fgos identity machine --alias <name>` writes the alias atomically (`fgos_durable_file`). The roster step after landing checks by hand that the three handles differ; phase 05 automates it.
- **Doctor.** Check `identity-machine-id`: pass when present and valid; **warn** (not fail) when absent, naming `fgos doctor --fix`, so fixture and CI state roots without an id stay green. Fix `identity-machine-id` mints.
- **Route.** The route `identity` gets `"subcommands": true` with per-subcommand `subcommand_flags` (pattern of `convention`, `command-routes.json:121-136`). Owner stays `packages/identity/rust`. Operations: bare `identity` keeps its operation, renamed `identity.writer` in phase 00 (Read/Safe), so the doctor row and the hook keep their contract; new `identity.read` (Read/Safe: `machine`, later `project`, `session`, `resolve`, `list`) and `identity.write` (Write: `machine --alias`, later `project --init/--new`, `session --register/--role`, `list --prune`). `IdentityProvider` stays in `provider.rs`, now behind the `provider` feature, and gains the subcommands.

## Files
- Create: `packages/identity/rust/{src/text.rs,src/machine.rs,src/errors.rs,tests/machine.rs}`, `packages/identity/contracts/identity.read.v1.json`, `identity.write.v1.json`, `src/setup/identity-checks.mjs`, `test/setup/identity-checks.test.mjs`.
- Modify (Rust): `Cargo.toml` (member), `Cargo.lock`, `packages/event-store/rust/{Cargo.toml,src/identity.rs,src/layout.rs,src/seal.rs}`, `packages/event-store/rust/tests/{setup_identity.rs,registry_identity_layout.rs,review_fixes.rs}`, `packages/identity/rust/{Cargo.toml,src/lib.rs,src/provider.rs}`, `packages/host-runtime/contracts/{command-routes.json,command-route-annotations.json}`, `packages/host-runtime/rust/src/catalog.rs`, `apps/fgos/{Cargo.toml,src/main.rs,src/cli_projector.rs,tests/cli_tests.rs}`, `packages/convention/contracts/convention.{rules,golden}.v1.json`.
- Modify (Node, tests): `src/setup/event-store-fixes.mjs`, `src/event-store/native.mjs:168` (only if the N-API name changes; it does not), `src/setup/registrations.mjs`, `test/setup/checks.test.mjs:104-115` (expected ids), `test/setup/event-store-fixes.test.mjs`, `test/architecture.test.mjs` (the new Event Store edge), `test/rust-host/command-routes.test.mjs`.
- Modify (docs): `docs/platform/identity/spec.md` (sections 3, 4, 5), `docs/platform/event-store/spec.md` (machine id row: minted by Identity), `docs/platform/packaging-distribution/contracts/setup-doctor-registry.md:133`, `docs/specs/distribution.md` row 7, `docs/architecture-manifest.json`, `docs/platform/component-boundary.md`, `CHANGELOG.md`.

## Steps
1. Board: post one `IDENT` line to HARDEN listing every T1-shared file this phase edits (`Cargo.lock`, `apps/fgos/src/main.rs`, `command-routes.json`, `registrations.mjs`, `session-identity/rust/src/lib.rs`, `provider.rs`, `session-identity/rust/Cargo.toml`, `docs/platform/session-identity/spec.md`, manifest, component-boundary). Whoever lands second rebases and reviews semantics (board rule).
2. Create the library, move `text`, `machine` and their tests; point Event Store at it; run `cargo test -p fgos-identity -p fgos-event-store` and `node scripts/run-tests.mjs test/architecture.test.mjs` before going on.
3. Add the provider feature, routes, operations and the `machine` subcommand with `--alias`; update projector and CLI tests.
4. Register check and fix; re-point `fixEventStoreMachineId`; update docs and CHANGELOG.

## Verification
- `cargo test -p fgos-identity -p fgos-event-store -p fgos-convention -p fgos-identity -p fgos`
- `node scripts/run-tests.mjs test/setup test/event-store test/rust-host/command-routes.test.mjs test/architecture.test.mjs`
- `npm run fgos:dev -- doctor </dev/null` warns `identity-machine-id` absent; `npm run fgos:dev -- doctor --fix </dev/null` mints once; a second run passes with no change; `npm run fgos:dev -- identity machine --json </dev/null` prints id, handle and alias; `--alias owner` then changes only the handle.
- `npm run fgos:dev -- identity --json </dev/null` returns the same `id` and `source` as `fgos identity --json` on the activated release.

## Risk and rollback
- Event Store is dormant, so moving its mint carries no live data risk. A minted `<stateRoot>/machine-id` stays valid for both owners because the format does not change. Rollback: revert the phase commit.
