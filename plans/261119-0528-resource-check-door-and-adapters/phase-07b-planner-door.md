# Phase 7b: Planner door, plan policy and verb tables

> This phase belongs to the door plan `plans/261119-0528-resource-check-door-and-adapters`. Phases 1 to 7 and 7c are in plan A (`plans/261119-0030-resource-referee-graph-write-scope-stack`), whose decisions 1 to 28 apply.

This is an application. It builds claims and edges from a plan, calls the three packages and prints
the verdict. The rules it applies are its own data, not the referee's. It starts after plan A has landed, so the addon bindings of its phase 7 exist.

## Inputs

- The crates from phases 3 to 6 and the owner's answer on names.
- How an existing native verb is registered: `packages/convention/rust` with its rows in `packages/host-runtime/contracts/command-routes.json` and `command-manifest.json`, and the wiring in `apps/fgos/src/main.rs`.
- The plan phase-table reader in `packages/supervision/rust/src/portfolio.rs` (pure over text, no filesystem) and `packages/supervision/contracts/plan-vocabulary.v1.json` (placement pattern for the policy file).
- The only symlink-aware reader nearby: `packages/convention/rust/src/operations.rs` (about line 234).
- `core/skills/_shared/plan-contract.md` sections 4 and 5 and `docs/platform/work-state/contracts/cli-io-contract.md` (envelope).
- The tests that read the verb tables: `test/rust-host/command-routes.test.mjs`, `help-routes.test.mjs`, `internal-routes.test.mjs`, `test/helpers/command-manifest.mjs`, `test/cli/unknown-flag-rejection.test.mjs`.

## Files it may write

`apps/fgos/Cargo.toml` (edges to `supervision`, `write-scope`, `graph` and `resource-referee`, workspace crates only) and `Cargo.lock` (regenerated once for those edges), `apps/fgos/src/**` (one small hunk in `main.rs`, the adapter in its own module), `packages/host-runtime/contracts/*`, `packages/supervision/contracts/plan-referee-policy.v1.json`, `src/cli/command-registry.mjs` (the descriptions of the Work verbs whose meaning changes, and the new verb), and the verb-table test files above. The mutation census is not touched.

## Steps

0. Add the four path dependencies to `apps/fgos/Cargo.toml` and regenerate `Cargo.lock`; no external crate is added. Run `cargo build -p fgos --locked` afterwards.
1. Write the one shared input reader of decision 23 (open without following symlinks, regular file only, size cap, content-free errors) and apply it to the plan directory, `plan.md`, units files and policy files.
2. Write this repository's plan policy as data beside `plan-vocabulary.v1.json`: the floor plus declared waves valid, hot files alone in their wave (the list of hot files is data in this file), maximum wave width. The plan contract text is the source of every rule; there is no phase size rule because the table has no size column. Also write the shipped default policy: structural only, no hot-file list.
3. Add the verb (`--plan <dir>` reads the phase table through the portfolio reader; `--units <file.json>` takes the neutral shape; `--policy <file>` is explicit and replaces the default). A footprint entry that does not canonicalize is refused naming the node and the entry. The verdict echoes the policy path and sha256. Output through the standard envelope; exit non-zero on `reject`, zero with the findings otherwise. `--help` names who should call it and when.
4. Register the route and manifest rows, update the descriptions in `command-registry.mjs` and the verb-table tests and their helper so the new verb has its help and route rows. Do not regenerate the mutation census here.
5. One end-to-end test that runs the built binary on a hand-built bad plan directory (an overlapping pair, a phase with no footprint, a footprint entry `..`, a symlinked `plan.md`, an oversize file) and a hand-built good one, and checks the pair, the shared paths, the finding codes and the exit codes. It is the single wiring proof; the cases belong to phases 3 to 5. Running the door on this plan is a smoke check, not a proof.
6. Run the census scan without `--write-census` and list the changed entries against this phase's footprint.

## Verify

`cargo test -p fgos`, then `node --test test/rust-host/command-routes.test.mjs test/rust-host/help-routes.test.mjs test/rust-host/internal-routes.test.mjs test/cli/unknown-flag-rejection.test.mjs`, then run the door on this plan as a smoke check.

## Rollback

Revert the route, manifest, `main.rs` hunk, policy file and test updates together; the packages stay unused.
