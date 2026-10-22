---
phase: 1
title: "Machine id and machine handle (rung I2)"
status: pending
priority: P1
effort: "4h"
dependencies: []
---

# Phase 01: Machine id and machine handle (I2)

## Goal
A new crate `fgos-identity` owns minting and reading the machine id; Event Store reads it through that crate; `fgos identity machine --json` prints the machine id, its handle and its alias on every machine.

## Facts (scout report §1, §3, §5)
- The mint and reader live in `packages/event-store/rust/src/identity.rs:18` (`valid_machine_id`), `:25` (`machine_id`), `:187` (`mint_machine_id`); the file is `<stateRoot>/machine-id` (`~/.local/state/fgos` here, not `~/.fgos`; spec section 4 is corrected in this phase).
- The setup fix `src/setup/event-store-fixes.mjs:18` and the check body `src/setup/event-store-checks.mjs:54,62` are dormant (not registered). No machine id exists yet on `fg-server`.
- Convention exposes identifiers only through Rust (`RuleSet::identifier`, `packages/convention/rust/src/rules.rs:276`); a kind is an `identifiers[]` row with `first`, `rest`, `maxLength`.
- HARDEN T1 phase 6 (pending) edits `packages/git/node-addon/{Cargo.toml,src/lib.rs}`, `packages/session-identity/rust/{Cargo.toml,src/proc_tree.rs}`, `src/util/session-identity.mjs`, `docs/architecture-manifest.json`, `docs/platform/component-boundary.md`. This phase touches none of the first five; the last two get one row each, announced on the board first.

## Design
- `packages/identity/rust` (crate `fgos-identity`): module `machine` with `valid_machine_id`, `read_machine_id(state_root)`, `mint_machine_id(state_root, hostname)` moved verbatim from Event Store (same format, same atomic `install_once_with_mode`, same errors mapped to identity error codes).
- Machine handle = the hostname slug part of the id (the id without its last `-<6>` suffix), unless an alias is set in `<stateRoot>/machine-alias` (one line, a Convention `machine-handle` identifier). Uniqueness across machines is checked in phase 05; until then `fgos identity machine` also prints the full id so a reader can disambiguate.
- Event Store: its `identity.rs` drops the three implementations and keeps only `pub use fgos_identity::machine::{valid_machine_id, read_machine_id as machine_id_file, mint_machine_id}` so its internal callers and the node addon keep compiling without touching `node-addon/Cargo.toml` (one implementation, L10; the re-export is removed with the N-API move after T1 phase 6). `machine_id(config_value, state_root)` stays in Event Store as the ref-name rule: git-config override, else the identity machine id. The git-config override `fgos.machineId` stays an Event Store concern (it names the published ref per clone, event-store spec section 447) and is renamed in prose to "ref name override"; identity's machine id ignores it. The N-API `mint_event_store_machine_id` (`packages/git/node-addon/src/event_store.rs:601`) keeps its name until T1 phase 6 lands and calls `fgos_event_store` which forwards to `fgos_identity`; moving it to an identity addon module is an item for after phase 6 (recorded in the board row, not done here, because `node-addon/Cargo.toml` and `lib.rs` belong to T1 now).
- Setup and doctor: register check `identity-machine-id` (present and valid) and fix `identity-machine-id` (mint) in a new `src/setup/identity-checks.mjs`, through `registerCheck`/`registerFix` in `src/setup/registrations.mjs`. Delete the dormant `fixEventStoreMachineId` and the `event-store-machine-id` missing-id branch (the ref-shared warning stays in Event Store's dormant body).
- Convention kinds: `machine-id` (first `a-z0-9`, rest `a-z0-9-`, max 63) and `machine-handle` (first `a-z`, rest `a-z0-9-`, max 40) in `packages/convention/contracts/convention.rules.v1.json`, with golden cases.
- Verb: route `identity` gains `"subcommands": true`; the `identity` route's owner becomes `packages/identity/rust` (one authority). The provider moves from `fgos_session_identity::IdentityProvider` to `fgos_identity::IdentityProvider`, whose bare form calls `fgos_session_identity::resolve_current` and returns the same `{id, source}` plus additive fields (phase 02). `machine` subcommand returns `{machineId, handle, alias, source: "state-root"}`.

## Files
- Create: `packages/identity/rust/{Cargo.toml,src/lib.rs,src/machine.rs,src/provider.rs,src/errors.rs,tests/machine.rs}`, `packages/identity/contracts/identity.machine.v1.json`, `src/setup/identity-checks.mjs`, `test/setup/identity-checks.test.mjs`.
- Modify: `Cargo.toml` (member), `packages/event-store/rust/{Cargo.toml,src/identity.rs}` and its callers that import the moved names, `packages/event-store/rust/tests/setup_identity.rs` (moved cases go to `packages/identity/rust/tests/machine.rs`), `src/setup/event-store-{checks,fixes}.mjs`, `src/event-store/native.mjs:168`, `src/setup/registrations.mjs`, `packages/convention/contracts/convention.{rules,golden}.v1.json`, `packages/host-runtime/contracts/command-routes.json` (+ annotations), `apps/fgos/{Cargo.toml,src/main.rs,src/cli_projector.rs,tests/cli_tests.rs}`, `packages/session-identity/rust/src/provider.rs` (deleted; its descriptor and golden move to the identity crate), `docs/platform/identity/spec.md` (sections 3, 4, 5), `docs/platform/event-store/spec.md` (machine id row), `docs/platform/session-identity/spec.md` section 4 (route owner), `docs/architecture-manifest.json`, `docs/platform/component-boundary.md`, `docs/specs/distribution.md` row 7, `CHANGELOG.md`.

## Steps
1. Board: post a line naming the two shared files (manifest, component-boundary) and the deleted `session-identity/rust/src/provider.rs`, addressed to HARDEN.
2. Move the three functions with their tests; make Event Store call them; `cargo test -p fgos-identity -p fgos-event-store`.
3. Add the Convention kinds and goldens; the crate checks the id and alias through `RuleSet::identifier`.
4. Move the provider and route; add `machine`; update the projector and CLI tests.
5. Register check and fix; delete the dormant Event Store mint fix; update docs and CHANGELOG.

## Verification
- `cargo test -p fgos-identity -p fgos-event-store -p fgos-convention -p fgos`
- `node scripts/run-tests.mjs test/setup/identity-checks.test.mjs test/event-store test/rust-host/command-routes.test.mjs test/architecture.test.mjs`
- `npm run fgos:dev -- doctor --fix </dev/null` mints the id once; a second run reports pass without change; `npm run fgos:dev -- identity machine --json </dev/null` prints it.
- `npm run fgos:dev -- identity --json </dev/null` still returns the same `id` and `source` as before.

## Risk and rollback
- Event Store is dormant, so moving its mint carries no live data risk. Rollback is a revert of the phase commit; a minted `<stateRoot>/machine-id` stays valid for both owners because the format does not change.
