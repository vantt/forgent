# Phase 2a fix: `doctor --fix --only <id>` judges only the named rows

## Why
Phase 2a (4259868c5) added `fgos doctor --fix --only <fix-id>` and moved the live mailbox harness
(`scripts/lib/mailbox-live-confined.mjs` `installHookThroughDoctor`) onto it. `--only` filters the fixes, but
`packages/distribution/rust/src/doctor.rs` `run()` still judges every registry row afterwards (119 rows, including the
Node bridge spawn). Measured by the lead on release 9e5ae72c in an empty `git init` project: 2.3 s unconfined. Inside
the confined sandbox under suite load it passes the 5000 ms `invokeHost` timeout, so
`test/scripts/mailbox-live-confined.test.mjs` (:247 and :414) fail with `Rust host timed out after 5000ms`
(`.fgos/runtime/tmp/suite-npm.log`, triage `plans/reports/triage-261124-0200-main-red-triage.md`). The cause is this
plan's change, so this plan fixes it.

## Rule
With `--fix --only <ids>`, the run executes those fixes and then judges only the rows whose `id` is one of `<ids>`
(in the registry a hook fix and the row it repairs share the id, e.g. `codex-hook-wired`). The report's `checks` holds
just those rows; `ok`, `--strict` and `next` follow from them. Without `--only` nothing changes. Do not raise the
harness timeout and do not add a test-only switch.

## Files it may write
packages/distribution/rust/src/doctor.rs, apps/fgos/src/wiring/doctor/mod.rs (only if the request help text needs
the new meaning), docs/platform/packaging-distribution/contracts/setup-doctor-registry.md (the `--only` sentence),
and the unit report `plans/261121-2110-component-authority-doors/reports/unit-261124-0225-p02a-fix-result.md`.

## Steps
1. In `run()`, when `options.only` is not empty, restrict the judged rows to those ids; keep registry order and the
   one-call-per-owner rule (so an `--only` naming only native rows never spawns the Node bridge).
2. Extend the owning test `only_runs_just_the_named_fixes_in_registry_order_and_refuses_what_it_cannot_honour` (or
   the nearest `--only` test in the same file) to assert that only the named rows are judged and that no bridge
   judge call is made when every named row is native. No new test file.
3. Update the one `--only` sentence in the setup-doctor-registry contract if it states the old behaviour.

## Verify
- `cargo test -p fgos-distribution` green (or name what the sandbox refused).
- Lead: `doctor --fix --only codex-hook-wired` in an empty project finishes well under 1 s and its `checks` lists one row;
  `node scripts/run-tests.mjs test/scripts/mailbox-live-confined.test.mjs` green.

## Report
End with `Status:` and a one-line `Summary:`.

## Fix unit 2 (review of 7a95c38c9, 2026-11-24 02:40)
The rule above was wrong: "a fix and the row it repairs share the id" holds only for the hook fixes. 14 of the 30
registered fixes repair rows with other ids (`git-wal-dir` -> `git-operation-journal`, `config-chmod` ->
`config-global-permissions`, `doc-locate-model-fetch` -> `doc-locate-model`, the `config-` group fixes, and
`lock-dirs`, `bin-discovery-cache`, `event-store-lock-dirs`, `git-driver-directories`). With the first fix,
`doctor --fix --only config-chmod --strict` judges no row and exits 0 even when the chmod failed.
Corrected rule: with `--fix --only <ids>`, judge the union of `RegistryFix::repairs` (already group-expanded) of the
named fixes, in registry order, one call per owner kind. Hook fixes have `repairs == [id]`, so the speed gain stays.
Steps:
1. `packages/distribution/rust/src/doctor.rs`: select rows by the named fixes' `repairs`, not by id.
2. Same owning test: assert a native-only `--only` judges its repaired row natively and never asks the bridge
   (`calls == ["fix fix-alpha", "judge alpha"]` or the file's equivalent), and that a fix whose repaired row has
   another id judges that row.
3. Contract sentence in `setup-doctor-registry.md` and the request help in `apps/fgos/src/wiring/doctor/mod.rs`:
   "the rows the named fixes repair".
4. `src/cli/command-registry.mjs` doctor `only` description: same meaning, no fix-id-equals-row-id claim.
5. `CHANGELOG.md` `## [Unreleased]`: amend the existing `doctor --fix --only` line to say it judges only the rows
   the named fixes repair. Do not add a second line.
