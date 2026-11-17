---
phase: 3
title: "Doctor engine, one registry, Node rows bridge; host doctor flips with every row bridged"
status: pending
effort: 3.5d
wave: A
blockedBy: []
flipAfter: [0]
q3: "answered (a)"
---

# Phase 03: Doctor engine, registry and bridge

`fgos doctor` moves to the host as one engine over one registry. In this phase **every** row is judged through the
Node rows bridge, so the report stays byte-equal to the base release while the shape changes underneath; phases
04-07 then move rows out of the bridge group by group, in parallel. The bridge is the one temporary path S4 adds
(D5); its size is the registry's bridge set, which 00's row table fixes and an exact-set test pins.

Phase-lead rules: [plan.md](plan.md). Branch `rust-verb-migration-program/s4-p03`. Report slug `s4-p03-doctor-engine`.

## Context

- Arm `bin/fgos.mjs:3547-3558`: `runDoctor(mainCheckoutRootOf(flags), { fix: Boolean(flags.fix) })` from
  `src/setup/checks.mjs` (a re-export of `registrations.mjs`); `--pretty` render and `exitCodeOf` at 3912-3927;
  `EXIT_OF.doctor` (`src/cli/verb-exit.mjs:14`).
- Registry and runner `src/setup/registrations.mjs:147-312`: `DOCTOR_CHECKS`, `registerCheck` (170; duplicate ids
  throw at 174; a throwing check becomes a failed row, 181-188), `createDoctorRun` (195, the per-run memo `once`),
  `registerFix` (239, `repairs`), `runFixes` (262), `runDoctor` (291-312). Rule text: contract §3
  (`setup-doctor-registry.md:49-63`) and pointer rows (64-79).
- Readers of the report: `init.rs:665` (`closing_block`), `:803` (`doctor_is_clean`), the CI consumer scripts,
  `test/rust-host/closing-block.test.mjs`. The host already prints `config check` with its own exit code
  (`apps/fgos/src/cli_presenter.rs:259-260`).
- A native verb may reach Node only through a real per-operation bridge (migration doc §7 item 4,
  `docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md:294-297`). `fgos internal` is the
  host's own namespace for routes the payload calls (`apps/fgos/src/main.rs:137-178`), so the bridge is not one. The host finds the Node payload only through the release manifest fields
  (`components.legacyNode.root`/`entry`, AGENTS.md "Legacy-Node CLI Ownership Boundary"; `apps/fgos/src/legacy_exec.rs:246-293`).

## Requirements

1. **Engine** `packages/distribution/rust/src/doctor.rs`: a row port (`id`, run with a per-run context whose shared
   facts are computed once, like `createDoctorRun().once`, and built after the fixes ran, as `runDoctor` does,
   `registrations.mjs:291-297`); status derivation (`fail` when not passed; `warn` for a
   passing `warning:` message; `skip` when the row says so; else `ok`); a failing row's `fix` (the registered fix's
   command `fgos doctor --fix` when a fix repairs it, else the row's `fixCommand`, else `null`); `ok`, `next` (each
   fix command once, registry order); `--fix` runs fixes first in exact registry order and reports `fixed[]` with a `changed` key always (additive; eight fixes report none today, so parity needs no per-id exception);
   `--strict`; the JSON envelope and the `--pretty` render (ANSI only on a terminal without `NO_COLOR`, as
   `src/setup/ansi.mjs`; there is no other text form, `bin/fgos.mjs:3912-3926`). One lenient serde type for the report
   (every field optional, unknown fields ignored), which `init.rs` `closing_block` and `doctor_is_clean` now read;
   the `fgctl` tests read golden doctor outputs of the base release through it (D3).
2. **Registry** `packages/distribution/contracts/doctor-registry.v1.json` (D2): every row and fix in run order with
   `id`, `description`, `owner`, `fixes`/`repairs`, `pointer`; config's rows as one group entry pointing at
   `packages/config/contracts/doctor-rows.v1.json`. In this phase every `owner` is `bridge:<step>` with the step from
   00's table (`bridge:S4` for rows 04-07 will move). Descriptions move here from `registerCheck` calls (one copy).
3. **Bridge** (D5), contract `packages/distribution/contracts/doctor-bridge.v1.json`: request
   `{ phase: "fix"|"check", ids: [...], dir }`, response `{ fixed?: [...], rows: [{ id, passed, status?, message,
   fixCommand?, detail? }] }` or a refusal. Node side: `src/setup/doctor-bridge.mjs`, a payload module run as a
   script (D5), reads the request from stdin and runs `runBridged(request)` from `src/setup/checks.mjs` over the
   existing bodies (no ordering or status logic in Node any more); no verb, no route, no `bin/fgos.mjs` arm.
   Host side `apps/fgos/src/wiring/doctor/bridge.rs`: starts it through `legacy_exec.rs`'s payload resolution and
   spawn, moved into one function both callers use and which verifies the release payload once per host process,
   not on every call (environment, manifest fields only, signal forwarding through
   the same `CHILD_PID` path); the child gets a fresh recursion guard and an inherited one does not stop it; one call
   per consecutive bridged fix segment in registry order and one for all bridged checks (D5); a deadline from 00 F21
   kills the process tree; the module routes any stdout write of a body to stderr and prints one JSON line per
   result, so a crash keeps the results of fixes already run; stderr is truncated into the refusal text; it writes no
   fault or lifecycle record. Node missing, a failed bridge or a timeout turns each bridged row into `fail` with the
   cause, `fix: null`, and one `next` entry naming the cause. A release-tree test asserts the module is in the payload;
   host tests cover the environment, the guard set on the parent, a hang, Ctrl-C (no orphan), a stray stdout write and
   Node missing.
4. **Host verb**: operation `doctor.run` in `CATALOG`; provider and projector (`--fix`, `--strict`, `--pretty`,
   `--dir` with the main-checkout policy of `mainCheckoutRootOf`, F5); D11 answer type carrying `data` and `exit`,
   with `config check` moved onto it; `native: true`; annotation; regenerate both route files.
5. **Delete**: the doctor arm, `runDoctor`, `createDoctorRun`'s status logic, `EXIT_OF.doctor`, the doctor half of the
   `--pretty` renderer (the `ansi.mjs` import stays for `setup` until 11); `registrations.mjs` keeps `registerCheck` /
   `registerFix` as the body map only (no descriptions, no order); the Node tests whose behaviour the engine now owns.
6. **Exact-set tests**: Rust: the registry's ids equal the host's adapters plus the bridge set; Node: the bridged ids
   of the registry equal the body map's ids (`test/setup/registrations.test.mjs` becomes this test; it already checks
   the contract inventory against the live registry).
7. **Parity**: the doctor table (00's fixtures, every row) host-with-everything-bridged vs base release: equal except
   the accepted child process. A test shows `doctor` in a repository with no fgOS setup writes nothing and starts no
   lifecycle child (owner today: `test/setup/checks-doctor-config.test.mjs`; owner after: one host case).
8. **`doors` rows**: "doctor readiness registry" (patterns `registerCheck\(`, `registerFix\(`, `DOCTOR_CHECKS`, the
   Rust registration fn; allowed `packages/distribution/rust/src/doctor.rs`, `apps/fgos/src/wiring/doctor/`; debt
   `src/setup/registrations.mjs` and each Node body module, reason "bridged rows of <step> layers"; each later phase
   removes its entries), "Node rows bridge" (patterns `doctor-bridge`, `runBridged`; allowed `bridge.rs`,
   `src/setup/doctor-bridge.mjs`, `src/setup/checks.mjs`; `retiredBy` S7), "no Node from the native packaging verbs"
   (patterns: a `node` spawn, `legacy_exec::`, a legacy verb spawn; allowed `apps/fgos/src/legacy_exec.rs` and
   `wiring/doctor/bridge.rs`, plus a named allowance for the hook rows' probe of the project shim (`hook dispatch-decide`,
   `hook main-checkout-delete-guard`, `hook mailbox`: the shim is spawned, not Node, with the guard removed); scanned paths include `apps/fgos/src/wiring/doctor/**` and `wiring/{init,uninstall,wire_agents}.rs`).
9. **D4 test** in `test/architecture.test.mjs`: labels follow the facts report's section 4 rule, not a plain import
   closure (which misclassified rows): expand only `src/setup` modules, honour the manifest `tierExceptions` edges,
   take an explicit S5 file list, and keep `domain-registry-compiled` and `capability-serves-valid` as named entries
   the test knows; the label equals the highest step reached, and a bridged row with no Node-only layer left fails
   ("move it"). Negative cases in the report.

## Test owners after the move

| Behaviour | Old proof | Owner now |
|---|---|---|
| status, `ok`, `next`, fix attribution, `--strict`, `--fix` order | `test/setup/registrations.test.mjs`, `doctor-strict-exit.test.mjs`, `test/cli/verb-exit.test.mjs` (doctor line) | `doctor.rs` unit tests |
| registry inventory | `registrations.test.mjs` | the two exact-set tests |
| doctor leaves a non-fgOS repository untouched | `checks-doctor-config.test.mjs` | one host case (`cli_tests.rs` or the harness) |
| fresh project run, on every OS | `doctor-fresh-run.test.mjs` (named by `ci.yml:91` as the doctor proof on every OS) | the same file, unchanged: the CLI harness follows the route table, so it now drives the host; it is the one wiring proof |
| tests that read `DOCTOR_CHECKS` or descriptions (about 30, many through `test/setup/helpers/setup-checks-harness.mjs:22, 43`) | their files | each listed in the report: a row-body test keeps reading the body map; a description or order assertion moves to the registry contract's test |
| closing block reads the report | `init.rs` tests, `closing-block.test.mjs` | unchanged, over the shared type |

## Files

- Create: `packages/distribution/rust/src/doctor.rs`, the two contracts, `apps/fgos/src/wiring/doctor/{mod.rs,bridge.rs}`,
  `src/setup/doctor-bridge.mjs`, `test/rust-host/parity-cases/doctor.cases.mjs` (deleted by 12).
- Modify: `packages/distribution/rust/src/{lib.rs,init.rs}`, `apps/fgos/src/{main.rs,cli_projector.rs,cli_presenter.rs,legacy_exec.rs}`,
  `apps/fgos/src/wiring/mod.rs`, `packages/host-runtime/rust/src/{catalog.rs,contracts.rs}`,
  `packages/config/rust/src/provider.rs` (D11), `test/setup/helpers/setup-checks-harness.mjs`, annotations,
  `src/cli/command-registry.mjs`, generated routes, `bin/fgos.mjs`, `src/setup/{checks,registrations}.mjs`,
  `src/cli/verb-exit.mjs`, the tests above, `test/suite-baseline.json`, `docs/architecture-manifest.json`, census.
- Delete: the Node tests the table names (as they empty).

## Gates

- fmt; clippy `-D warnings` on `fgos`, `fgos-distribution`, `fgos-host-runtime`, `fgctl`; `cargo test -p fgos -p fgos-distribution -p fgos-host-runtime -p fgctl`; msvc and darwin.
- `node scripts/run-tests.mjs test/rust-host/verb-parity.test.mjs test/setup/registrations.test.mjs test/rust-host/closing-block.test.mjs test/rust-host/fgctl-init-preflight-tail.test.mjs test/rust-host/command-routes.test.mjs test/cli/subcommand-flag-drift.test.mjs test/cli/unknown-flag-rejection.test.mjs test/cli/verb-exit.test.mjs test/architecture.test.mjs test/setup/git-mutation-census.test.mjs`
  plus every test that imports `src/setup/checks.mjs` or `registrations.mjs` (`rg -l` on both).

## Risk and rollback

- The report drifts (M x H): parity per row before the arm is deleted; the shared report type for the closing block.
- The bridge spawn fails in a release (M x H): resolved only through the manifest fields; the PATH `node`-missing case
  in `cli_tests.rs` shows the doctor still answers.
- Rollback: revert the phase; the Node arm returns; nothing on disk changed.
