# Phase 11: the `bridge:S5` doctor rows move into Rust

Start after: 07, 08 and 09 landed. Wave 5, parallel with 10. Never at the same time as 05 (both edit
`registrations.mjs`). Rules: [phase-lead-rules.md](phase-lead-rules.md). Facts: F5, F10. Worktree `erd-p11`, report slug
`erd-p11-doctor-rows`. Effort: 2.5d. Port recipe: S4 `plan.md` "Port recipe", doctor rows (re-read items 1-3, 5).

## Context

S4 left eight rows on the Node rows bridge labelled `bridge:S5` (F5). Seven read the executor model or the capability
section and move. The eighth, `seat-binding-route`, probes "exactly the binary the Node client would run", a rule only
a Node payload can apply (it ignores `FGOS_HOST_BIN` only when its own payload is the activation's, F10); a Rust
judge would be a twin of that resolution certifying a binary nobody uses, so it stays on the bridge with the Node
callers it serves, relabelled `bridge:S6a` (D15). The program's S4 item: move the step's rows, restore parity for
them, keep S4's fixtures.

## Requirements

1. Judges in `fgos-execution` `src/checks.rs` (pure), one per row, through ports: `runner-generated-paths`
   (`validateGeneratedPathsShape`, `dispatch/config.mjs:659`; the Node config load keeps its copy for S6a, declared twin,
   D7), `executor-confinement` (`registrations.mjs:2182`), `invocation-git-write-grants` (:2215),
   `capability-serves-valid` (:1916), `omp-natives-present` (`omp-natives-checks.mjs:54`; `omp --version` and the natives
   dir through a port), `agy-sub-homes-configured` (agy executors' sub-HOMEs from the executor model; the settings
   judgment reuses the packaging crate's agy reader if S4 moved it there, re-read item 3), `tool-registry-configured`
   (07's `tools.rs` posture).
2. Adapter `apps/fgos/src/wiring/doctor/execution.rs` registers the seven; registry
   `packages/distribution/contracts/doctor-registry.v1.json`: their `owner` `bridge:S5` -> `rust:execution`, `inRust`
   and the host's `NativeOwner` updated (exact-set tests pin them); `seat-binding-route` -> `bridge:S6a` with its
   description saying protocol 2 (the Node message too); the five hook-row descriptions that name the
   `node src/runner/dispatch.mjs decide` alias (10's list) name `fgos dispatch decide`.
3. Registry `layers` (`doctor-registry.v1.json:41-61` on S4): every module S5 keeps in Node gets its real step:
   `bind.mjs`, `seat-binding/client.mjs`, `dispatch/config.mjs`, `tool-providers.mjs`, `capability-config.mjs`,
   `shipped-catalog.mjs`, `patterns/retired-keys.mjs` -> `S6a` (or `S6b` where only Workflow reads them; the report
   says which); `agent-listing.mjs` per Req 4.
4. `agent-type-names-unique` (`bridge:S6a`, `registrations.mjs:1119-1123`, judge reads `listAgents().masked` :931 and
   agent shape problems): if its import closure on the post-09 tree has no S6a fact besides the listing, judge it in
   Rust with 08's `list`, move it too, and delete `src/runner/agent-listing.mjs` and its twin test (L10) once 10 has
   landed (the `agents` arm imports it until then; if 10 lands later, 12 deletes them); otherwise keep it and the twin,
   and say why.
5. Delete the Node bodies and registrations of the moved rows (`checkRunnerGeneratedPathsConfig`,
   `checkToolRegistryConfigured`, `checkCapabilityServesValid`, `checkExecutorConfinement`, `checkInvocationGitWriteGrants`,
   the omp and agy bodies wherever S4 left them) and imports that lose their last user (`toolProvidersOf` in
   `registrations.mjs:965`, `capabilityServesOf`).
6. Parity per row on S4's doctor fixtures with 09's runner (`id`, `status`, `passed`, `fix`, message bytes except
   volatile rows from S4's 00 report); table transitional, deleted in 12.

## Files

- Create: `packages/execution/rust/src/checks.rs`, `packages/execution/rust/tests/golden_checks.rs`,
  `packages/execution/contracts/checks.v1.json` (vectors recorded from the Node judges before they go),
  `apps/fgos/src/wiring/doctor/execution.rs`. The doctor parity table only on a local gate branch: the runner lives on the side branch `execution-read-door/parity-runner` (pushed, never landed): merge it into a LOCAL gate branch cut from this phase's head, add the table file(s) there, run `node scripts/run-tests.mjs test/rust-host/verb-parity.test.mjs` with `FGOS_TEST_PARITY_BASE` naming the staged pre-change release (recipe in `test/rust-host/harness.mjs`), put the counts in the report, and push the phase branch WITHOUT the runner and the tables (a pre-land gate, never part of a landed head) (D14).
- Modify: `packages/execution/rust/src/lib.rs`, `apps/fgos/src/wiring/doctor/mod.rs`,
  `packages/distribution/contracts/doctor-registry.v1.json`, `src/setup/registrations.mjs`, the S4-left omp/agy modules,
  `src/runner/execution/capability-config.mjs` (drop `capabilityServesOf` if unused), `apps/fgos/tests/cli_tests.rs` (one
  doctor case), `docs/architecture-manifest.json` (entries of deleted files), `test/suite-baseline.json`, mutation census.
- Delete: `src/setup/omp-natives-checks.mjs` (if S4 left it); per Req 4 possibly `src/runner/agent-listing.mjs` and
  `test/runner/agent-listing.test.mjs`.
- Tests retired (owner now): the moved rows' cases in `test/setup/checks-doctor-config.test.mjs`,
  `test/setup/visibility-checks.test.mjs` (imports `checkExecutorConfinement`/`checkInvocationGitWriteGrants`), and the
  files `rg -l "omp-natives|agy-sub-homes|executor-confinement|invocation-git-write|generated-paths|tool-registry-configured|capability-serves-valid" test`
  lists -> `golden_checks.rs` (judgment) and the registry exact-set tests (wiring). `test/seat-binding/route-doctor-check.test.mjs`
  stays (the row stays Node). Each named.
- Net size: about -400 Node, -350 Node test, +420 Rust lines.

## Acceptance

- No `bridge:S5` owner left; `seat-binding-route` is `bridge:S6a`; `layers` names no module as S5; exact-set tests and
  per-row parity green on the local gate branch (counts in the report); `fgos doctor` on this repo shows the moved rows with the base release's status.

## Risks / rollback

- A row's message bytes differ (M x L): parity names it; volatile rows per S4's list. Revert: the commit series.
