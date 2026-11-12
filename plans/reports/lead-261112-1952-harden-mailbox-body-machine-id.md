# HARDEN lead report: mailbox body-mirror test and machine id

## Cause
Release run 43217604774 (tag v0.2.0-rc.6), job `suite / cargo (workspace)`, failed in
`apps/fgos/src/wiring/mailbox_body.rs` test
`a_body_is_read_from_the_senders_mirror_and_a_missing_ref_or_blob_is_expired`:
`Err(event-store-unavailable ... machine id missing)` instead of `Ok(Body)`.

Call chain: `BodyMirror::resolve` (first call) -> `event_store_clone::open(main)` ->
`fgos_event_store::identity::machine_id(configured, state_root)`. The id is the clone's git config
`fgos.machineid` when set, else `fgos_identity::machine::read(<state root>)`, where the state root
comes from `fgos_holder_lock::state_root()` (FGOS_STATE_ROOT, FGOS_STATE_HOME, XDG_STATE_HOME,
HOME). The test set no config, so it read the host's minted id: green on fg-server2, `Missing` on a
clean runner. Reproduced red locally with HOME and XDG_* on an empty dir.

Production is right: a missing id stays `event-store-unavailable`. No env switch, no fallback id.

## Fix
- `mailbox_body.rs` test: `git config fgos.machineid reader-abcdef` in the scratch repo, the id
  door's own input. All assertions kept (Body, Malformed, Expired x2, bad machine id).
- `apps/fgos/tests/cli_tests.rs`: two tests that set 0o700 modes through `std::os::unix` are now
  `#[cfg(unix)]`. The Windows job of holder-lock-cross-platform (run 43217604616) runs
  `cargo test -p fgos`, compiled this file and failed on it (E0433/E0599), so this was fixed here
  rather than opened as a backlog row. msvc `cargo check -p fgos --all-targets` is now clean.
- `packages/git/contracts/mutation-census.v1.json` regenerated (pre-commit census guard).

## Tests that drive `event_store_clone::open` / `BodyMirror`
- unit, `mailbox_body.rs`: the fixed test; the rotation test builds an `EventStoreClone` by hand.
- `apps/fgos/tests/mailbox_sync_child.rs`, `mailbox_routes.rs`, `cli_tests.rs`: write
  `state/machine-id` into their own state root already (hermetic).
- Whole `fgos` crate run with HOME, XDG_CONFIG/DATA/STATE_HOME on an empty dir: all green.

## Gates
fmt, clippy `-D warnings` (fgos), `cargo test -p fgos` under empty HOME, msvc bins+all-targets,
aarch64-apple-darwin all-targets check green. `cargo test --workspace` had one load flake,
`fgos-process` spawn_mapped (open fd 22); green alone.

## Open (not mine)
The macOS job of run 43217604616 fails separately: "native random identity driver unavailable"
(Unsupported) in `fgos` tests on macOS. Needs its own item; macOS is supported per owner.

## Authority
None found.

## Lessons
- A test passing on the dev box can hide ambient identity; run new Event Store tests under an empty
  HOME before landing.
- Check every workflow that compiles a test file, not only the one that failed (Windows crate job
  was red for a second reason).
