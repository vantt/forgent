# Phase 15 — Watcher timer schedule and doctor row

Adds the third per-project OS timer, `watcher-tick`, beside `mailbox-sync` and `account-probe`, and the `watcher-timer` doctor row and fix that watch it. The timer runs `fgos watcher tick`; the verb itself is wired in phase 16. Rust only.

## Inputs
Step 0: re-grep every line below. Other plans touch `doctor-registry.v1.json` and `timer.rs` neighbours; a moved name is fixed in the phase, a changed decision (PS-13) stops it with `NEEDS_CONTEXT`.
- `packages/distribution/rust/src/timer.rs`: `enum Schedule` (:33, two variants), `Schedule::ALL` (:68, `[Schedule; 2]`), and the per-schedule `match` tables: `name`, `label`, `marker`, `stem_prefix`, `service_description`, `timer_description`, `schedule_of` (:117), `command` (:141), `service_vars` (:173), `off`, `no_scheduler`, `orphan`, `active`, `broken`, `removed`. The test helper `on()` (:1062) and `Schedule::ALL` loops (:1255-1465) must cover the new variant.
- `schedule_of` reads the effective project config (`found_of`, :808). A new key is read the same way: `/watcher/enabled` and `/watcher/activeIntervalSec` (keys registered in phase 4: `core/config-standard/watcher.yaml`).
- `apps/fgos/src/wiring/doctor/mailbox.rs`: `ROWS`, `FIXES` (:16-17), `judge`/`fix` match arms (:30-41), and the group-equality test (:353). `doctor/mod.rs:221` already lists `mailbox::GROUP`; no new group.
- `packages/distribution/contracts/doctor-registry.v1.json`: `inRust.rows` (:20), `inRust.fixes`, `rows[]` entries (:446-455) and `fixes[]` entries (:869-875).
- `docs/platform/packaging-distribution/spec.md:586-587`: the "today's registered checks/fixes" lists name every timer row.
- `plans/261118-1045-project-supervisor/reports/spike-timer-head-start.md` (phase 2): the service environment a timer needs so the watcher can start the supervisor head. If it is missing, stop with `BLOCKED`.

## Footprint
`packages/distribution/rust/src/timer.rs`, `apps/fgos/src/wiring/uninstall.rs` (its schedule-id test lists every timer; added 2026-11-18), `apps/fgos/src/wiring/doctor/mailbox.rs`, `apps/fgos/src/wiring/doctor/mod.rs`, `packages/distribution/contracts/doctor-registry.v1.json`, `docs/platform/packaging-distribution/spec.md`.

## Steps
1. Add `Schedule::WatcherTick`; grow `ALL` to three. Fill every `match` table: name `watcher-tick`, marker `fgos-managed: watcher-timer`, stem prefix `fgos-watcher`, texts that say the timer wakes the watcher, which decides nothing.
2. `schedule_of`: `None` unless `/watcher/enabled` is `true`; interval = `/watcher/activeIntervalSec` (positive integer). The tick itself skips work during idle (PS-13), so the unit uses the active interval only.
3. `command`: `watcher tick --dir <projectRoot>` (same `Word::Named` shape as the other two).
4. `service_vars`: the environment the spike result lists (at least PATH from `probe_path`, plus whatever it proves a head start needs). Put each variable in one place; do not copy `probe_path`.
   Survival: render the setting the spike proved keeps a started head alive after the oneshot unit exits (`render_systemd` writes `Type=oneshot` at `:356` with the default `KillMode=control-group`): `KillMode=process` for the watcher unit only, or a `systemd-run --user --scope` wrapper in the start adapter if that is what the spike proved (then nothing changes here and the report says so). The launchd plist gets the equivalent the spike's macOS note names.
5. Doctor: add `watcher-timer` to `ROWS`, `FIXES`, both match arms and the group-equality test in `mailbox.rs`; add the row and fix to `doctor-registry.v1.json` in `rows`, `fixes`, `inRust.rows` and `inRust.fixes`, owner `rust:packaging`, with a description that matches the registry style. Update a count in `doctor/mod.rs` only if it pins the mailbox group's rows (`rg -n "mailbox-sync-timer" apps/fgos`); the file is in this phase's footprint for that edit alone (phase 16 writes it in the next wave).
6. Windows: the `no_scheduler` arm (`timer.rs:187`) of `WatcherTick` says supervision does not run on this platform (no timer scheduler); the row warns with that text, never fails.
7. Update the two lists in `packaging-distribution/spec.md:586-587` with `watcher-timer`.
8. Tests, in `timer.rs`: extend the existing per-schedule loops to the new variant (they already prove render on both platforms, off-when-disabled, orphan removal, stale/missing/disabled states). Add one test that pins the rendered command, the survival setting and the config keys that turn it on. No second copy of the loop cases.

## Verify
- `cargo test -p fgos-distribution timer` passes, with the watcher unit rendered for `linux` and `darwin`.
- `cargo test -p fgos doctor` passes (registry and group equality).
- `cargo clippy -p fgos-distribution -p fgos -- -D warnings` clean.
- `cargo check -p fgos-distribution --target aarch64-apple-darwin` passes if that target is installed.
- `rg -n "watcher-timer" packages/distribution/contracts/doctor-registry.v1.json apps/fgos/src/wiring/doctor/mailbox.rs` shows row, fix and arms.

## Rollback
On a machine that already has the unit, set `watcher.enabled` false and run `fgos doctor --fix` first (the marker lets the fix remove only the unit fgOS wrote). Then revert the phase merge commit; after a revert the schedule is gone from `ALL`, so doctor can no longer remove a leftover unit.
