# Phase 7: Planner door and plan policy

This is an application. It builds claims and edges from a plan, calls the three packages and
prints the verdict. The rules it applies are its own data, not the referee's.

## Inputs

- The crates from phases 3 to 6 and the facts report from phase 1 (how Node calls Rust, the door's final name).
- How an existing native verb is registered: `packages/convention/rust` with its rows in `packages/host-runtime/contracts/command-routes.json` and `command-manifest.json`, and the wiring in `apps/fgos/src/main.rs`.
- The plan phase-table reader in `packages/supervision/rust/src/portfolio.rs`, and `packages/supervision/contracts/plan-vocabulary.v1.json` (placement pattern for the policy file).
- `core/skills/_shared/plan-contract.md` sections 4 and 5 (the rules the plan policy must encode) and `docs/platform/work-state/contracts/cli-io-contract.md` (envelope).

## Files it may write

`apps/fgos/src/**` (one small hunk in `main.rs`, the adapter in its own module), `packages/host-runtime/contracts/*`, and `packages/supervision/contracts/plan-referee-policy.v1.json`. The mutation census is not touched here.

## Steps

1. Write this repository's plan policy as data beside `plan-vocabulary.v1.json`: no cycles, no dangling dependencies, claims declared, declared waves valid, hot files alone in their wave (the list of hot files is data in this file), maximum wave width. The plan contract text is the source of every rule; there is no phase size rule because the table has no size column. Also write the shipped default policy, which is structural only and carries no hot-file list.
2. Add the verb (`--plan <dir>` reads the phase table through the portfolio reader; `--units <file.json>` takes the neutral shape; `--policy <file>` replaces the default policy). Input files are read with a size bound and refused beyond the contract `limits` by name. Output through the standard envelope; exit non-zero on `reject`, zero with the findings otherwise. `--help` names who should call it and when.
3. Register the route and manifest rows. Do not regenerate the mutation census here: phase 10 does it once for the whole branch.
4. One end-to-end test that runs the built binary on a throwaway plan directory with an overlapping pair and a phase with no footprint, and checks the pair, the shared paths, the finding codes and the exit code. It is the single wiring proof; the cases belong to phases 3 to 5.

## Verify

`cargo test -p fgos` for the new test, then run the door on this very plan (it must not reject).

## Rollback

Revert the route, manifest, `main.rs` hunk and policy file together; the packages stay unused.
