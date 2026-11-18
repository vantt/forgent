# Phase 7: Planner door, plan policy and addon bindings

This is an application plus the Node surface it shares with Work. It builds claims and edges from a
plan, calls the three packages and prints the verdict. The rules it applies are its own data, not the
referee's.

## Inputs

- The crates from phases 3 to 6 and the facts report from phase 1 (addon call cost, the door's final name).
- How an existing native verb is registered: `packages/convention/rust` with its rows in `packages/host-runtime/contracts/command-routes.json` and `command-manifest.json`, and the wiring in `apps/fgos/src/main.rs`.
- The addon's source layout (`packages/git/node-addon/src`: `lib.rs`, `canonical_json.rs`, `agent_protocol.rs`, `git/write_scope.rs` and others) and how `src/git/native.mjs` loads it.
- The plan phase-table reader in `packages/supervision/rust/src/portfolio.rs`, and `packages/supervision/contracts/plan-vocabulary.v1.json` (placement pattern for the policy file).
- `core/skills/_shared/plan-contract.md` sections 4 and 5 (the rules the plan policy must encode) and `docs/platform/work-state/contracts/cli-io-contract.md` (envelope).
- The tests that read the verb tables: `test/rust-host/command-routes.test.mjs`, `help-routes.test.mjs`, `internal-routes.test.mjs`, `test/helpers/command-manifest.mjs`, `test/cli/unknown-flag-rejection.test.mjs`.

## Files it may write

`apps/fgos/src/**` (one small hunk in `main.rs`, the adapter in its own module), `packages/git/node-addon/src/**` (new modules for `graph` and `resource-referee`, registered in `lib.rs`; the manifest edges were declared in phase 2), `packages/host-runtime/contracts/*`, `packages/supervision/contracts/plan-referee-policy.v1.json`, and the five verb-table test files above. The mutation census is not touched here.

## Steps

1. Write the addon bindings for `graph` and `resource-referee` next to the existing modules, so Work and the scripts call them in process (decision 16).
2. Write this repository's plan policy as data beside `plan-vocabulary.v1.json`: the floor plus declared waves valid, hot files alone in their wave (the list of hot files is data in this file), maximum wave width. The plan contract text is the source of every rule; there is no phase size rule because the table has no size column. Also write the shipped default policy: structural only, no hot-file list.
3. Add the verb (`--plan <dir>` reads the phase table through the portfolio reader; `--units <file.json>` takes the neutral shape; `--policy <file>` is explicit, trusted from the operator, tighten-only above the floor and never discovered from the plan directory). Input files must be regular files (symlinks refused), read with the numeric size bound of the contract, and errors never quote file content. A footprint entry that does not canonicalize is refused naming the node and the entry. Output through the standard envelope; exit non-zero on `reject`, zero with the findings otherwise. `--help` names who should call it and when.
4. Register the route and manifest rows and update the verb-table tests and their helper so the new verb has its help and route rows. Do not regenerate the mutation census here: phase 10 does it once for the whole branch.
5. One end-to-end test that runs the built binary on a hand-built bad plan directory (an overlapping pair, a phase with no footprint, a footprint entry `..`) and a hand-built good one, and checks the pair, the shared paths, the finding codes and the exit codes. It is the single wiring proof; the cases belong to phases 3 to 5. Running the door on this plan is a smoke check, not a proof.

## Verify

`cargo test -p fgos -p fgos-node-addon`, then `node --test test/rust-host/command-routes.test.mjs test/rust-host/help-routes.test.mjs test/rust-host/internal-routes.test.mjs test/cli/unknown-flag-rejection.test.mjs`, then run the door on this plan as a smoke check.

## Rollback

Revert the route, manifest, `main.rs` hunk, addon modules, policy file and test updates together; the packages stay unused.
