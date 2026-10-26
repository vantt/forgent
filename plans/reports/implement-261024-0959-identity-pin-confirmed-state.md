# Identity pin confirmed state (owner chose B, 2026-10-24)

Branch `ident/pin-confirm`, merged with origin/main first.

## Signatures
- `pins::PinState { Seen, Confirmed }` (serde lowercase, `Default = Seen`), re-exported `fgos_identity::PinState`.
- `Pin { v, machine_id, public_key, fingerprint, first_seen, state: PinState, confirmed_at: Option<String> }` (`confirmedAt` skipped when none).
- `pins::confirm(state_root: &Path, machine_id: &str, fingerprint: &str) -> Result<Pin, Refusal>`.
- `pins::record` now returns `Recorded::Same(Pin)` (carries the stored pin and its state).
- `Verified { machine_id, fingerprint, first_seen: bool, state: PinState }`.
- `Verb::Pins(PinsAction)`, `PinsAction { List, Forget { machine_id }, Confirm { machine_id, fingerprint } }` (replaces `Pins { forget }`; callers moved in the same change).

## Version decision
Kept `v: 1`: `Pin` has no `deny_unknown_fields`, so an older reader ignores `state` and `confirmedAt`; a file without `state` reads as `seen` (`#[serde(default)]`).

## Behaviour
- First sighting pins `seen`. `confirm` sets `confirmed` + `confirmedAt` (iso) only when the pin exists and its fingerprint equals the given one; already confirmed with same fingerprint returns the pin unchanged (no write).
- Refusals (exit 65): `pin-missing`, `fingerprint-mismatch` (detail names pinned and given fingerprints; state unchanged), `invalid-machine-id`. Missing `--fingerprint` (or `--fingerprint` without `--confirm`, or `--confirm` with `--forget`) is a flag error from the projector.
- Own machine (signature by own id and own key, already checked equal to the own key): `Verified.state = Confirmed`; its pin is created `seen` then confirmed through `pins::confirm`, so list shows it confirmed.
- `--forget` removes the pin; a later sighting is `seen`.
- Race: `confirm` and `forget` both take an registered holder-lock mutex `identity-pins` (`<stateRoot>/locks/identity-pins.lock`, machine scope, rank 80, taken through `LockScope`). `confirm` reads the pin inside the lock, then replaces durably (`replace_durably_with_mode`, 0600). A forget before it gives `pin-missing`; one after removes the confirmed file. First-sighting `record` stays create-once and needs no lock.

## JSON shapes
- `fgos identity pins --json` (identity.read): `{pins: [{v, machineId, publicKey, fingerprint, firstSeen, state, confirmedAt?}]}`.
- `fgos identity pins --confirm <id> --fingerprint <SHA256:..>` (identity.write): `{confirmed: <pin>}`.
- `--forget`: `{forgotten: <pin>}` (now with state).
- Doctor `identity-pinned-machines` stays informational: `N pinned (all confirmed | K seen, not yet confirmed: ids): id fingerprint; ...`. No row or fix added, so the setup-doctor registry list is unchanged.

## Files
Code: `packages/identity/rust/src/{pins,signing,provider,lib}.rs`, `apps/fgos/src/cli_projector.rs`, `src/setup/identity-checks.mjs`, `src/setup/registrations.mjs` (row description), `src/cli/command-registry.mjs`, `packages/host-runtime/contracts/command-routes.json` (`confirm`, `fingerprint` flags), contracts `identity.read.v1.json` / `identity.write.v1.json`.
Tests: `packages/identity/rust/tests/signing.rs` (+3 tests), `apps/fgos/tests/cli_tests.rs` (pins test extended and renamed), `test/setup/identity-checks.test.mjs`.
Docs: spec `docs/platform/identity/spec.md` (the pins text lives in section 5a, plus 7 and 10), I5 plan table, CHANGELOG (existing line amended). Census regenerated: `packages/git/contracts/mutation-census.v1.json`.

## Tests
- `cargo test -j4 -p fgos-identity`: pass (signing 10, all others pass).
- `cargo test -p fgos --test cli_tests identity`: 9 pass.
- npm: `command-routes`, `subcommand-flag-drift`, `fgos-help` 36/36 pass; `identity-checks` 5 pass, 2 fail identically on the untouched baseline (the `--fix` mint tests need the Node addon, absent from a checkout; confirmed with git stash).
- Proofs: first pin Seen; confirm matching gives Confirmed and later verify reports it; wrong fingerprint refused, state unchanged; missing pin refused; forget then new sighting Seen; pin file without state reads Seen; own machine Confirmed; confirm racing forget (8 rounds) never leaves a pin.

## Notes
- Spec section number: the pins text is in 5a, not 5.
- `cargo fmt --check` shows pre-existing diffs in untouched files; not changed.
