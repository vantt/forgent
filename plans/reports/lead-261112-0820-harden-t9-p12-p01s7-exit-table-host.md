# HARDEN T9 P01 Step 7 and P12 rest: one exit-code table for the Node shell and the Rust host

Branch `harden/t9-p12-exit-table`, based on `0b529fcf7`. OPC reviewed `88abba615` (MERGE on condition of a green full read); the table then moved to `packages/host-runtime/contracts/` (paths only) per the coordinator and OPC.

## Change
- **Table.** `packages/host-runtime/contracts/exit-codes.v1.json`: `version 1`, `ok 0`, `unexpected 1`, `categories` (precondition 2, conflict 3, validation 4, corrupt-log 5, lock-timeout 7, session-fail 8, merge-fail 9, not-found 4). Values equal the old `EXIT_CODES`; 6 stays the runner's busy status. Listed in `package.json` `files`; staging proofs in `test/rust-host/release-tree.test.mjs` and `test/install-packaging.test.mjs`.
- **Node reader.** `src/cli/exit-codes.mjs` (kernel leaf, manifest row) exports `EXIT_CODES`. Callers moved, old path deleted: `bin/fgos.mjs`, `bin/fgos-runner.mjs`, `src/runner/loop.mjs`, and ten tests (`lock`, `fgos-merge`, `catchup`, `approve-fixtures`, `execution-outcome-exit-codes`, the CLI harness and others). `src/state/store.mjs` no longer exports `EXIT_CODES`.
- **`categoryOf` stays with `StoreError`** (`src/state/store-error.mjs`, still re-exported by `store.mjs`). Deviation from Step 7's text: `src/verbs/merge/approve.mjs` (Work) calls it, and the architecture guard forbids `src/verbs` importing `src/cli`; the category is a property of the error, the exit status is the shell's. `StoreError` stays too (about twenty Work callers, no reason to move).
- **Rust reader.** `apps/fgos/src/exit_codes.rs` embeds the file (`ok()`, `unexpected()`, `validation()`, `code_of()`). `main.rs`: every `process::exit` literal (unknown verb, sub-command, native flag, stdin overflow, and the 0/1 sites) reads it. `wiring/mailbox_verbs.rs` and its unsupported stub: the `EXIT_*` consts are gone, same 0/1/4.
- **Echo.** `ECHO_PROVIDER_DESCRIPTOR` and the `EchoProvider` registration left `main.rs`; `packages/host-runtime` is untouched (its catalog keeps the fixture for its own tests).
- **Node `version` arm** and its `resolveCliVersionInfo` import deleted; the registry entry stays, marked `nativeOnly` like `gate-bypass`, because the route table and the help manifest derive from the registry. `resolveCliVersionInfo` stays (doctor row). The entry allowlist in `test/architecture.test.mjs` lost `src/cli/version.mjs` and gained the new leaf. `fgos --help --json` therefore changes in one place: the `version` entry now carries `nativeOnly: true`.
- Docs: `cli-io-contract.md` section 4, `architecture-map.md` CTR001, `implementation-pointers.md`, the participant contract; CHANGELOG line.

## Tests (red first)
- `test/cli/exit-code-table.test.mjs`: Node reader equals every category of the file; no literal exit status in `main.rs` or the mailbox verbs. `apps/fgos/src/exit_codes.rs`: the Rust reader agrees with the file on every category (file read from disk independently of the embedded copy). Both red before the change (commit `466f93b10`: missing module, missing functions). The two readers share one file, so they agree by construction; each test proves its reader exposes every category and no stray literal remains.
- `main.rs`: no `test.*` operation in the production composition; shown red with the descriptor put back.
- Re-pointed: `fgos-version.test.mjs` (now unit proofs of the version record; the verb's output is owned by `apps/fgos/tests/cli_tests.rs` native version tests), `unknown-flag-rejection.test.mjs` (probe verb `decision-index`; the host half at its line 100 owns `version --dir`), `test/rust-host/harness.mjs` coverage cases (`version` -> `workflow list`).
- Gates: fmt, clippy `-D warnings` (fgos), `cargo test -p fgos -p fgos-distribution` green, msvc and aarch64-apple-darwin `cargo check` ok (one pre-existing `envelopes` dead-code warning on msvc). Full `npm test` on the final tip: 8759 tests, 1 fail (V7n addendum, known), no run-tests ERROR lines. The first full run also failed `mailbox-live-confined` (known load flake) and the harness case above (my miss, fixed).

## Before / after
| | before | after |
|---|---|---|
| literal exit statuses in `main.rs` | 12 `process::exit(0|1|4)` | 0, all read the table |
| literal `EXIT_*` consts in mailbox verbs | 3 (+1 in the stub) | 0 |
| copies of the category -> status map | Node `store-error.mjs` + Rust literal `4` + gateway mirror | one JSON file, two readers (gateway mirror unchanged, see Authority) |
| echo provider in the host composition | wired | absent |
| Node `version` arm / static `version.mjs` import in the entry | present | deleted |
| host overhead per legacy call (verify half, landed `dc29c054f`, 15 interleaved runs, median) | 51.4 ms | 32.3 ms (about -19 ms; no cache) |
Host overhead was not re-measured: this change adds one `OnceLock` JSON parse at first exit and touches no verify path.

Callers of `EXIT_CODES` in Work code (mechanical import only): none besides tests. `src/verbs/merge/approve.mjs` keeps its `categoryOf` import unchanged.

## Not done / hand-offs
- Step 8 census of `test/cli` was not in this task.
- `apps/fgos-gateway/src/gateway.rs` and `ports.rs` still say `src/state/store.mjs`'s `EXIT_CODES` in comments and hold their own reverse map (2..9 -> category). P14 owns that file: make it read the table or fix the comments.
- TEST (`forgent-f8`) ping goes through `forgent-6a`.

## Authority
- Error category -> exit status: now one table in `packages/host-runtime/contracts/`, read by Node (`src/cli/exit-codes.mjs`) and the host (`exit_codes.rs`). Outcome statuses stay in Execution (`outcome-exit.mjs`).
- Still held twice: the gateway's `ErrorCategory::from_exit_code` (adds `busy` 6). Belongs in the table (a `busy` entry would also make the runner's `EXIT_BUSY` read it); P14 owns the file.
- The Rust host's other exit paths (`legacy_exec.rs` exits 1 and `128 + sig`, the `mailbox_sync`/`mailbox_hook` `exit(0)`) are still literal; outside the files this task named.

## Lessons
- `git commit` here refuses when the one-door census differs from the staged Rust files; every `cargo fmt` after `--write-census` shifts lines and needs another regeneration. Run fmt first, then the census, then commit.
- Marking a registry entry `nativeOnly` is a surface change (help manifest, a harness that spawned it through Node): grep the test harnesses for the verb name, not only `test/cli`.
- A shared contract file placed under `src/` is caught by review; put machine contracts under `packages/<area>/contracts/` from the start and add the `files` entry and a staging proof in the same change.
- `zsh` does not word-split `$v`; use `bash -c` for loops of verbs.
