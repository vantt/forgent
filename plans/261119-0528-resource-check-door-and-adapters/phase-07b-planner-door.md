# Phase 7b: Planner door, default policy and verb tables

> This phase belongs to the door plan `plans/261119-0528-resource-check-door-and-adapters`. Phases 1 to 7 and 7c are in plan A (`plans/261119-0030-resource-referee-graph-write-scope-stack`), whose decisions 1 to 31 apply.

This is an application. It builds claims and edges from a plan, calls the packages and prints the
verdict. It waits for phase 8b: it must read tables through the reader that keeps every glob.

## Inputs

- The packages of plan A, landed, the verb name decision (plan A decisions 10, 26) and the phase-table reader fixed in phase 8b.
- How an existing native verb is registered: `packages/convention/rust` with its rows in `packages/host-runtime/contracts/command-routes.json` and `command-manifest.json`, and the wiring in `apps/fgos/src/main.rs`.
- `packages/durable-file/rust/src/beneath.rs` (`open_beneath(root, relative)`: refuses absolute paths and `..`, returns `Ok(None)` for a missing file, `read(max)` takes the cap), which `apps/fgos` already depends on.
- `core/skills/_shared/plan-contract.md` sections 4 and 5 and `docs/platform/work-state/contracts/cli-io-contract.md` (envelope).
- The tests that read the verb tables: `test/rust-host/command-routes.test.mjs`, `help-routes.test.mjs`, `internal-routes.test.mjs`, `test/helpers/command-manifest.mjs`, `test/cli/unknown-flag-rejection.test.mjs`.

## Files it may write

`apps/fgos/Cargo.toml` (edges to `supervision`, `write-scope`, `graph` and `resource-referee`, workspace crates only) and `Cargo.lock` (regenerated once for those edges), `apps/fgos/src/**` (one small hunk in `main.rs`, the adapter in its own module), `packages/host-runtime/contracts/*`, `src/cli/command-registry.mjs` (the descriptions of the Work verbs whose meaning changes, and the new verb), the generated verb tables, and the verb-table test files above. The mutation census is not touched.

## Steps

0. Step zero of plan A decision 24, then add the four path dependencies to `apps/fgos/Cargo.toml` and regenerate `Cargo.lock`; no external crate is added. Run `cargo build -p fgos --locked` afterwards.
1. Read every input through `open_beneath` and its capped read with the roots of plan A decision 23: the directory for `--plan <dir>` (strip a trailing slash first), the file's parent for `--units` and `--policy` (an empty parent means the current directory); use the revision as the policy identity. Write no reader of your own. A missing file, a symlink, a non-regular file and an oversize file are refused by name; a missing or unreadable policy file is a refusal and never falls back to the default.
2. Print every value taken from an input file (entries, shared paths, ids, dependency ids, the policy path, the plan directory name, evidence) through one escaping function (control characters escaped, length capped); errors never quote file content raw. A plan with zero phases is a blocking finding, never `accept`.
3. Write the shipped default policy as data inside the door: the floor plus declared layers valid (plan A decisions 11, 12). This repository ships no policy file.
4. Add the verb (`--plan <dir>` reads the phase table through the reader of phase 8b; `--units <file.json>` takes the units shape of plan A's `resource-referee.v1.json`; `--policy <file>` is explicit and replaces the default, never the floor). A footprint entry that does not canonicalize and an unknown claim space are refused naming the node and the entry. The verdict echoes the policy identity and the lexical and `readOnly` caveats in human output and in `--json`. Output through the standard envelope; exit non-zero on `reject`, zero with the findings otherwise. `--help` names who should call it and when.
5. Register the verb in `command-registry.mjs` and update its descriptions, then regenerate the route and manifest rows with `node scripts/export-command-selectors.mjs` (never edit the generated JSON by hand) and verify with its `--check`; update the verb-table tests and their helper so the new verb has its help and route rows. Do not regenerate the mutation census here.
6. Own the door's input-refusal cases: missing file, symlinked root (with and without a trailing slash), symlinked leaf, FIFO, oversize file, a policy file that is missing or unreadable, a bare file name in the current directory (must work), a plan with no table, and a control character in an id. One end-to-end test runs the built binary on a hand-built bad plan directory (an overlapping pair, `questions_*.rs` against `questions_a.rs` in one wave, a phase with no footprint, a footprint entry `..`) and a hand-built good one, and checks the pair, the shared paths, the finding codes and the exit codes. It is the single wiring proof; the rule cases belong to plan A's phases 3 to 5. Running the door on a real plan is a smoke check, not a proof.
7. List the census entries this phase changed against its footprint (plan A decision 14).

## Verify

`cargo test -p fgos`, then `node --test test/rust-host/command-routes.test.mjs test/rust-host/help-routes.test.mjs test/rust-host/internal-routes.test.mjs test/cli/unknown-flag-rejection.test.mjs`, then run the door on a real plan as a smoke check.

## Rollback

Revert the route, manifest, `main.rs` hunk and test updates together; the packages stay unused.
