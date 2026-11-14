# F0 phase 05: invocation-fault record, Rust writer and shared contract

Branch `rust-verb-migration-program/f0-p05`, base `286017771` (head of `rust-verb-migration-program/f0`).

## What landed on the branch

- `packages/observe/rust/src/invocation_fault.rs` (new, about 480 lines, half of it tests): `argv_shape`, `log_path`, `record(&FaultInput) -> Option<PathBuf>`, plus the private capped append. Declared from `lib.rs`.
- `test/rust-host/fixtures/invocation-fault-vectors.json` (new): 13 argv-shape rows, 6 path-choice rows, and the record key order. Rust unit tests and `test/observe/invocation-fault-log.test.mjs` both read it.
- `test/observe/invocation-fault-log.test.mjs`: the argv-shape cases now loop over the vector rows (owner of those cases: the vector table); added a path-choice test and a key-order test over the same file. The one non-array argv assertion stays in Node because Rust cannot receive it.
- `packages/git/contracts/mutation-census.v1.json`: regenerated with `--write-census` (the pre-commit hook refuses the commit otherwise; it hashes every Rust file). Not in the phase file list, but generated, not hand-edited.
- No change to `src/observe/invocation-fault-log.mjs`: every vector row already passes against Node, so no Node fix was needed.

## Behaviour of the Rust writer

- Same record and key order as Node: `ts, faultClass, verb, message, cwd, argv, writer`.
- Path: the resolved store if it exists, else the main checkout's existing `.fgos` (read from disk through `fgos_git::main_checkout_root`, no Git process), else `None`. Never creates `.fgos/`; only `logs/` below an existing store.
- Appends one whole line under `O_APPEND`, file 0600 (created 0600 and re-chmodded on unix; no-op elsewhere). Past 1 MiB the oldest half of the lines goes through a 0600 temp file and a rename.
- `message` has every `--name=value` word reduced to `--name=<len>` (quote and trailing punctuation around the word are kept). The Node writer does not do this; that leak stays the separate item named in the plan.
- Lengths count UTF-16 code units, as Node does, and a vector row pins it.

## Where the facts changed the phase text

- The facts report (U4) found no Rust capped append, so it is implemented once in this module, as the phase allowed. `shard.rs` has no 0600 or cap and was left alone.
- The facts report says the capped-append helper has three Node callers (`invocation-fault-log`, `approve-fault-log`, `provider-capacity`). This phase does not move any of them. The contract here covers only the fault record; `provider-capacity` stays on the Node leaf until tier 5.
- The phase names no `doors` row (phase 08 owns them), so no `doors` entry or debt was added here. Phase 08 must carry a twin row for the capped append as well as the fault log, as the facts report says. The existing `verb manifest projection` row is unaffected, and the architecture test passes.
- `writerError`: `fgos_identity::resolve_current` cannot fail, so the Rust record never carries it. Node keeps it for a missing host binary. The vector key order covers the common keys only.

## Gates (all green)

- `cargo fmt --all --check`; `cargo clippy -p fgos-observe --all-targets -- -D warnings`; `cargo test -p fgos-observe` (52 unit tests plus integration tests, 8 new in this module).
- `cargo check -p fgos-observe` for `x86_64-pc-windows-msvc` and `aarch64-apple-darwin`.
- `node scripts/run-tests.mjs` on: `invocation-fault-log`, `friction-client`, `fgos-logs-bucket`, `architecture`, `git-mutation-census` (85 pass); and `subcommand-flag-drift` (reads `observe/rust/src`) plus `doc-health` (28 pass).
- One-door scan: 0 undeclared sites, counts unchanged by the new file (no Git spawn, main checkout through `fgos_git`).
- Not run, by instruction: full `npm test`, `cargo test --workspace`.

## Suggested `[Unreleased]` line

None needed: nothing calls the Rust writer yet and no user-visible behaviour changes. When the host starts recording (phase 08), the line is: "Faults in a malformed `fgos` call that the Rust host catches are now recorded in `.fgos/logs/invocation-faults.jsonl`, like the Node CLI's."

## Authority

- **The log path is spelled three times in Rust-visible code**: `src/state/fgos-file-registry.mjs:42` (Node registry), the new `invocation_fault.rs` (`LOG_DIR`/`LOG_FILE`), and the existing reader `packages/observe/rust/src/sources/invocation_faults.rs:31-34`, which joins `.fgos/logs/invocation-faults.jsonl` by hand. The reader is in the same crate and should take the path from the writer module's constants. Not changed here (outside the phase's file list); phase 08 or a follow-up should do it.
- **Fault record contract**: held in two writers by design, with the vector file as the single contract. The vector file is the authority; the Node module comment and the Rust module doc both point to it.

## Lessons

- A command line that spells the VCS directory (even inside a heredoc) is blocked by the scout hook; write such files with the editor tool, not the shell.
- The pre-commit census hash covers every Rust file, so a new Rust file always needs `--write-census` (with `CARGO_TARGET_DIR` exported, since the scan compiles Rust) before the commit, and any later edit to that file needs it again.
- The shared fixture helper `initFixtureRepo` always plants `.fgos/locks`, so it cannot build a "main checkout without a store" row; the Node path test uses plain `git init`.
- `private(OpenOptions::new()...)` style helpers must take `&mut OpenOptions`, since the builder methods return `&mut`.

Status: DONE
Summary: Rust fault-record writer with a shared vector contract is on `rust-verb-migration-program/f0-p05`, all listed gates green. Node writer needed no change.
