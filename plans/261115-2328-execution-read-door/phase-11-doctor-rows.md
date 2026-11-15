# Phase 11: the eight `bridge:S5` doctor rows move into Rust

Start after: 05, 07 and 09 landed. Wave 5, parallel with 10. Rules: [phase-lead-rules.md](phase-lead-rules.md).
Facts: F5. Worktree `erd-p11`, report slug `erd-p11-doctor-rows`. Effort: 2.5d. Port recipe: S4 `plan.md` "Port
recipe", doctor rows (re-read items 1-3, 5).

## Context

S4 left eight rows on the Node rows bridge labelled `bridge:S5` (F5): they read the executor model or the capability
section. The program's S4 item for S5: move them into Rust, remove them from the bridge, restore the parity runner for
them and keep S4's doctor fixtures.

## Requirements

1. Judges in `fgos-execution` `src/checks.rs` (pure), one function per row, reading the runner section and machine
   facts through ports: `runner-generated-paths` (`validateGeneratedPathsShape`, `dispatch/config.mjs:659`, which the
   Node config load keeps for S6a: declared twin against shared vectors, D7), `executor-confinement`
   (`registrations.mjs:2182`), `invocation-git-write-grants` (:2215), `capability-serves-valid` (:1916; after 05 only
   the generic rows carry `serves`), `omp-natives-present` (`omp-natives-checks.mjs:54`; `omp --version` and the
   natives dir through a port), `agy-sub-homes-configured` (agy executors' sub-HOMEs from the executor model; the
   settings judgment reuses the packaging crate's agy reader if S4 moved it there, re-read item 3),
   `tool-registry-configured` (07's `tools.rs` posture), `seat-binding-route` (the activation host answers
   `internal seat-binding --protocol 2` `ladder`; same host resolution as `resolveSeatBindingHost`).
2. Adapter `apps/fgos/src/wiring/doctor/execution.rs` registers the eight rows; registry
   `packages/distribution/contracts/doctor-registry.v1.json`: each `owner` `bridge:S5` -> `rust:execution`, `inRust`
   and the host's `NativeOwner` list updated (exact-set tests pin them); descriptions unchanged.
3. Delete the Node bodies and registrations: `checkRunnerGeneratedPathsConfig`, `checkToolRegistryConfigured`,
   `checkCapabilityServesValid`, `checkExecutorConfinement`, `checkInvocationGitWriteGrants`, `checkSeatBindingRoute`
   (`registrations.mjs`), the omp and agy bodies wherever S4 left them, and imports that lose their last user
   (`toolProvidersOf` in `registrations.mjs:965`, `capabilityServesOf`, `resolveSeatBindingHost` if unused).
4. Parity per row on S4's doctor fixtures with the restored runner (`id`, `status`, `passed`, `fix`, message bytes
   except volatile rows from S4's 00 report); transitional, deleted in 12.

## Files

- Create: `packages/execution/rust/src/checks.rs`, `packages/execution/rust/tests/golden_checks.rs`, `packages/execution/contracts/checks.v1.json` (vectors, recorded from
  the Node judges before they are deleted), `apps/fgos/src/wiring/doctor/execution.rs`.
- Modify: `packages/execution/rust/src/lib.rs`, `apps/fgos/src/wiring/doctor/mod.rs`,
  `packages/distribution/contracts/doctor-registry.v1.json`, `src/setup/registrations.mjs`, the S4-left omp/agy modules,
  `src/runner/execution/capability-config.mjs` (drop `capabilityServesOf` if unused), `apps/fgos/tests/cli_tests.rs`
  (one doctor case), `docs/architecture-manifest.json` (entries of deleted files), `test/suite-baseline.json`, mutation census.
- Delete: `src/setup/omp-natives-checks.mjs` (if S4 left it), `test/seat-binding/route-doctor-check.test.mjs`.
- Tests retired (owner now): the eight rows' cases in `test/setup/checks-doctor-config.test.mjs`,
  `test/setup/visibility-checks.test.mjs` (imports `checkExecutorConfinement`/`checkInvocationGitWriteGrants`), and the files
  `rg -l "omp-natives|agy-sub-homes|executor-confinement|invocation-git-write|generated-paths|tool-registry-configured|capability-serves-valid|seat-binding-route" test`
  lists -> `golden_checks.rs` (judgment) and the registry exact-set tests (wiring). Each named.
- Net size: about -450 Node, -400 Node test, +450 Rust lines.

## Acceptance

- No `bridge:S5` owner left in the registry; exact-set tests green; parity green per row; `fgos doctor` on this repo
  shows the eight rows with the same status as the base release.

## Risks / rollback

- A row's message bytes differ (M x L): parity names it; volatile rows per S4's list. Revert: the commit series (the
  registry owners revert with it).
