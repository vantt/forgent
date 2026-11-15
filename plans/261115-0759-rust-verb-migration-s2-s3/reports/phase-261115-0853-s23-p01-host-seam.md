# Phase 01 report: shared host seam

Branch `rust-verb-migration-program/s23-p01`, head `de8222c64`. Status: DONE_WITH_CONCERNS.

## What changed
- **Categorised refusal.** `CategorisedRefusal` in `packages/host-runtime/rust/src/contracts.rs` takes a category from `exit-codes.v1.json` and fails at construction if the table lacks it. `present_outcome` prints `fgos: <message>` and exits with the category's code; it writes no fault record. A projector error is `ProjectError::Refused(...)` or `Failed(String)`; the eight existing verbs still return `Failed`, so their exit is unchanged.
- **Parser-only reading.** `PRE_DOOR_NATIVE_VERBS` replaces `LENIENT_ROOT_VERBS` with the same eight names, pinned by an exact-set test, and lives in `routing.rs` (the lower layer; `invocation_doors.rs` imports it). For a verb off the list the sub-command is `positional[0]`, a flag name is the whole token and `--dir` is the parsed flag; a bare `--dir` is the empty path, which the root door refuses as Node does. The `=` cut, `sub_word` and `named_dir` apply only to the eight.
- **Child faults.** `Doors::leave(&Entered, &Ended)` records an `event-store-child` fault with the failure text when a child fails; a silent non-zero exit records nothing, as in Node. New `doors` row "classify a failed Event Store child" (allowed `invocation_doors.rs`, debt `bin/fgos.mjs`).
- **Root reads.** `GitDriver::topology_at` no longer builds a driver; the disk-only topology read uses no driver state, so `read_repo_facts` and the Node addon cannot recreate a removed state root. `resolve_topology(&self)` stays as a thin delegate to a private `topology_on_disk` (`refs.rs` is outside the phase file list).
- **Parity entry.** A `release:<description.json>` entry runs a staged release's host with its own environment, applied last so a case cannot repoint it. `parityBaseEntrySpec()` reads `FGOS_TEST_PARITY_BASE`. The recipe is in the harness header. The runner is not on `main`.

## Gates
fmt and clippy `-D warnings` clean on `fgos`, `fgos-host-runtime`, `fgos-git`, `fgos-node-addon`; `cargo test -p fgos -p fgos-host-runtime -p fgos-git` green; msvc and darwin `cargo check` green; census regenerated, 0 undeclared. Focused Node tests green (harness, help-routes, envelope-contract, exit-code-table, unknown-flag-rejection, invocation-fault-log, background-seal, triggers, paths, architecture, git-mutation-census, command-routes, subcommand-flag-drift, instruction-registry). A scratch second path for `event-store-child` fails the architecture test, then was removed. A throwaway parity run (base `6dadc6b00` against this tree, 3 cases) passed.

## Proposed `## [Unreleased]` line
Verbs the host serves natively now exit with the Node CLI's category (2, 4 or 7) and text when they refuse a call. A missing or unknown sub-command, a `--flag=value` spelling or a bare `--dir` is read by the one shared parser, as the Node CLI reads it. A removed state root is no longer recreated by a root read.

## Retired test -> owner now
| retired test | owner now |
|---|---|
| `the_dir_a_native_verb_names_keeps_its_two_spellings_and_a_trailing_bare_flag_names_nothing` (`invocation_doors.rs`) | `the_project_a_call_names_follows_the_reading_of_its_verb` (`routing.rs`), which also adds the shared-parser spelling |
| `only_the_listed_native_verbs_take_the_lenient_root_arm` | kept under the same name, asserting the exact eight-name set |

## Concerns
1. `LENIENT_ROOT_VERBS` is still named in `docs/platform/git/spec.md:1108` and `docs/platform/host-invocation-routing/spec.md:216`; left for the close-phase docs pass.
2. The phase 00 report was not read: F1 and F15 are unchecked against the topology change.
