# Phase 11: Close the Node-twin debt the deletion leaves

Capability: `code:implement`.

Moved here from the doors plan (`plans/261121-2110-component-authority-doors`, row 12c and
`phase-12c-node-twins-after-dead-closure.md`, withdrawn there by its lead), by owner decision D22 in
`plans/discussions/ds-wqsrwmiier-harden-next-round/DISCUSSION.md`. That row folded the doors plan's phases 3a2, 3b,
3c, 3d and the Node part of 3e. It waited for this plan's phase 8, because phase 8 deletes the dead files under
`src/runner/dispatch/` and `src/runner/execution/` and closes the model rows it empties. Running it here keeps one
deleter for those files. It starts only when phase 8 is on this plan's integration line, and it closes what phase 8
does not reach.

## Inputs

- Door rows `decide-a-dispatch.yaml`, `derive-executor-facts.yaml`, `tool-lookup-by-capability.yaml`,
  `list-run-directories.yaml`, `footprint-write-scope-overlap-rule.yaml` and `global-fgos-directory.yaml` under
  `packages/component-authority/model/doors/`.
- The doors plan's withdrawn phase files, read for detail (all under `plans/261121-2110-component-authority-doors/`):
  `phase-03a2-delete-write-scope-port.md`, `phase-03b-tool-lookup-by-capability.md`,
  `phase-03c-derive-executor-facts.md`, `phase-03d-decide-a-dispatch.md`, `phase-03e-global-fgos-directory.md`.
- `phase-08-delete-source.md` of this plan, and its branch.

## Files it may write

The phase table row in `plan.md` is the list: the write-scope port and its two tests, the `packages/write-scope`
crate, `src/runner/capability-config.mjs` and `src/runner/agent-listing.mjs` with their tests, the agents-vector
recorder and its two helpers, `test/setup/packaged-definitions.test.mjs`, the run-dirs vector fixture,
`test/suite-baseline.json`, the mutation census, the six door rows above, `test/architecture.test.mjs`, the
`write-scope` and `runner` specs, and `reports/node-twin-debt.md` of this plan.

## Steps

1. List what phase 8 left. For each door row above, record which `debt` entries point at files that no longer
   exist, and remove them. A row phase 8 already closed needs nothing more.
2. **Write-scope port.** If `src/runner/dispatch/write-scope.mjs` survived phase 8: confirm
   `rg -l "write-scope\.mjs" src bin scripts` lists only the port, move any case that the `packages/write-scope`
   tests lack into them, then delete the port, its test and the parity test. Clear the
   `footprint-write-scope-overlap-rule` debt.
3. **Executor facts.** Remove `capabilityConfinementOf` from `src/runner/capability-config.mjs` once no product
   caller is left; the executor-model vectors already replay it on `executor_model.rs`. Move the release-tier
   judgement in `test/setup/packaged-definitions.test.mjs` and the vector recorder onto the Rust
   `agent-type-names-unique` judgement. Then delete `agent-listing.mjs`, its test, the recorder and its helper.
4. **Run directories (Node listers only).** Prune the Node-only `openAttempts` rows of
   `test/rust-host/fixtures/run-dirs-vectors.json`. Two Rust walks stay as named debt:
   `packages/run-result/rust/src/lib.rs` and `packages/run-supervisor/rust/src/controller/adopt_scan.rs`. Their
   survivor (the engine's assignment layout) needs a crate move first, so their `retiredBy` names a backlog row minted
   with `fgos identity mint backlog` and written by the secretary. Do not write the backlog row; name it in the report.
5. For every row left with no debt, remove it from `NAMED_DOOR_DEBT`. Regenerate the census
   (`node scripts/git-one-door-scan.mjs --write-census`) and update `test/suite-baseline.json`. Write one
   decision-history line per area spec (`write-scope`, `runner`) naming each deleted path and its last SHA.
6. Write `reports/node-twin-debt.md`: each row, what was removed, what stays and who retires it.

## Verify

- `node --test test/architecture.test.mjs test/setup/git-mutation-census.test.mjs test/runner/capability-config.test.mjs test/setup/packaged-definitions.test.mjs`
  passes, except a test the report shows red on `main` too.
- `cargo test -p <execution crate> -p <write-scope crate>` is green; take the package names from each `Cargo.toml`.
- `NAMED_DOOR_DEBT` holds none of `decide a dispatch`, `derive executor facts`, `tool lookup by capability` or
  `the footprint and write-scope overlap rule`.

## Rollback

Revert the phase's commit. The deleted twin and its debt entry come back together.
