# Phase 5: dev-host tests leave the real store alone

Added by lead:SUPERVISOR on 2026-11-27 under the owner's answer to q-apqmci34ry (fix the reds that block the release checks). Phase 4 proved one real red at main (event 2efcb8636c99ecf9, `reports/phase-04/result.md`): run-tests' store-leak guard fails because four tests spawn `scripts/run-rust-dev-host.mjs` against the repository root, and that door prunes the real `.fgos/runtime/dev-host/`, deleting run directories it did not create.

## Steps

1. Make the four tests (`test/rust-host/help-routes.test.mjs`, `test/rust-host/dev-host.test.mjs`, `test/scripts/run-rust-dev-host-staging.test.mjs`, `test/distribution/native-addon.test.mjs`) run the dev host against a temporary root, or make `scripts/run-rust-dev-host.mjs` prune only directories it created, whichever keeps the door's behaviour for real users unchanged. Fix production code or the fixture; never weaken the guard.
2. No unit runs cargo or the full suites; lead:SUPERVISOR runs the gate.

## Validation

`node scripts/run-tests.mjs` on the four files exits 0 with a stale directory planted in `.fgos/runtime/dev-host/` beforehand, and a full `npm test` from main exits 0. Evidence goes to `reports/phase-05/`.
