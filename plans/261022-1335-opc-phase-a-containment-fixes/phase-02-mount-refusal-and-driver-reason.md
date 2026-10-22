# Phase 02: mount refusal name and driver-choice reason (A3)

## Context

- **R3.** One unremountable host mount makes every `bwrap --dev-bind / /` fail.
- **HARDEN T1 phase 4** (RT-M11) makes `BwrapPidns::spawn_in` keep bwrap's stderr line through one diagnostic rerun in `end_failed_spawn`. The agreed name is `containment-mount-refused`, as a cause under `namespace-unavailable` (10-22).
- **The probe** `pidns_usable` (`containment/linux.rs` ≈ :45-63) caches `false` per process and `select` picks `linux-pgroup` silently (red-team F5). Doctor `process-containment` (`src/setup/run-supervisor-checks.mjs` ≈ :109) prints only `driver` and `level` from the host route `supervise`.

**Depends on:** HARDEN T1 phase 4 on main. Rebase onto it and never edit its lines in parallel.

## Requirements

1. When bwrap's stderr names a mount refusal ("Can't bind mount", "remount", or the exact patterns T1 records), the error reads `namespace-unavailable: containment-mount-refused: <bwrap line>`. No other port error changes.
2. The probe keeps the reason for its answer: bwrap missing, user namespace refused, or mount refused, with the bwrap line. `guarantee()` or the route's `containment` answer carries it as an optional field, `selectedBecause`.
3. Doctor `process-containment` prints the reason on Linux `best-effort`. A mount refusal reads as a fixable host problem, naming the mount from the line; the generic "user namespaces disabled" advice is not given then.
4. Git surfaces the port error text as the refusal cause. No new Git refusal name (I10).

## Files

- `packages/process/rust/src/containment/{mod,linux}.rs`: the probe reason and the classification of T1's captured line. T1's capture code is reused, not duplicated.
- The host route that answers `supervise`'s containment probe, adding the optional reason field.
- `src/setup/run-supervisor-checks.mjs`.
- `packages/process/contracts/containment.port.v1.json`: the `namespace-unavailable` causes and the optional `selectedBecause`.
- `CHANGELOG.md` `[Unreleased]`: doctor output changes.

## Steps

1. Run impact analysis on `select`, `pidns_usable` and `checkProcessContainment`.
2. Classify the refusal on top of T1's captured line.
3. Record the probe reason and carry it through the route.
4. Make doctor print the reason.
5. Tests:
   - extend T1's red test (`containment_bwrap.rs`, fixture `bwrap-refuses-mount.sh`) to assert the cause name;
   - add one doctor test for the reason line, in the file that owns `checkProcessContainment`'s tests.
6. Add the CHANGELOG line.

## Owning proof

T1's containment test owns the name. The doctor test owns the message.

## Gates

`cargo test -p fgos-process`, the doctor tests, then `fgos doctor` on this host. `npm run fgos:dev -- doctor` shows the driver plus its reason.

## Risk and rollback

- **Risk:** bwrap's wording changes between versions. Classification falls back to plain `namespace-unavailable` with the raw line, never to success.
- **Rollback:** revert.
