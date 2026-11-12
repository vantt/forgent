# Lead report: packaging P06, `fgctl init` closing block

Branch `harden/pkg-p06-init-closing-block`, from origin/main `e69ece15d`.

## What changed
- `run_tail` (`packages/distribution/rust/src/init.rs`) now runs `fgos init`, `fgos doctor --fix`, then `fgos doctor --json`. The last result goes through the pure `closing_block`:
  - ok: `Ready: fgOS <tag> active (<digest12>)` and `Next: fgos run "<prompt>"`, exit 0. An already-current run says `Ready: already up to date at <digest12> (fgOS <tag>)`.
  - not ok: `<N> checks need you:` and one numbered line per failing check, `<id>: <fix command>` (or its message when only a person can fix it); exit 2, `precondition` from the exit-code table (`InitError::NotReady`, `exit_status()`). The release stays activated and the transaction is marked `ready-degraded` (the contract's "tail incomplete after publish").
  - output that is not a doctor result is an error, never a guess.
  - `fgos` is typed bare when the launcher directory (beside `fgctl`) is on PATH, otherwise by its absolute path.
- `init`, `upgrade`, `repair` share the block (7 `run_tail` call sites take a `TailOutcome`). A `fgctl upgrade` that ends not-ready still refreshes the machine `fgctl` (4 lines in the `upgrade` arm of `apps/fgctl/src/main.rs`).
- `fgctl verify` prints `verified <digest12>`. `fgctl status` ends with one line (`active <digest12>`, quarantined with the fix, or `no active release ...; run fgctl init`) through `status_result_line` (2 lines in the `status` arm of `main.rs`, approved).
- Intermediate steps (`init`, `doctor --fix`) are captured; on failure their output goes to stderr (it went to stdout before). Their success output is not shown: it is a 100-row JSON envelope.
- Callers moved: `scripts/ci-external-consumer.{sh,ps1}` and `scripts/git/e3-bench.mjs` accept an init or upgrade that activated and ended on the not-ready list. The `rust-host` init and upgrade suites read the same way through `activated()` and `runFgctl` in `test/rust-host/fgctl-init-fixture.mjs`. The `git_wal_activation_gate` fixture host now answers `doctor --json`.
- Docs: CHANGELOG line, and the tail sentence in `contracts/setup-doctor-registry.md`.

## Decisions
1. **Unresolved question 4 (the two header-only config files).** Only the `setup` arm wrote them; the config spec section 6 names `fgctl init` / `fgos init` as the door. Moved: `createConfigFiles` in `src/verbs/state/init.mjs` (run by `initStoreUseCase`, i.e. the tail's `fgos init`). Deleted from the `setup` arm with its four result fields and its pretty line; the `initConfigFile` import left `bin/fgos.mjs`. No new mechanism, no new doctor row or fix. A refusal (confined session, unwritable home) comes back as `config.warning` and never fails init: nothing reads these files, they are what a person edits. After init alone nothing else is required, so the README can drop `fgos setup` (P07).
2. **`apps/fgctl/src/main.rs`**: the status arm edit was approved by the big lead. The `upgrade` arm edit (refresh after a not-ready upgrade) is a consequence of the non-zero exit and is 4 lines. After OPC's review: `InitError::exit_status()` maps `NotReady` to the table's `precondition` (2), other errors stay 1; the Rust exit-code reader moved from `apps/fgos/src/exit_codes.rs` into `fgos-host-runtime` (`exit_codes.rs`, one reader for host and fgctl, old file deleted, `apps/fgos/src/main.rs` imports it); a `ready_facts` failure after an ok doctor marks the transaction `ready-degraded` like the other arm.
3. **Q-B** kept: `fgos doctor` exits 0; init reads `ok`.
4. `--yes` does not exist on `fgctl init` (it never prompts); the acceptance run is without it.

## Proof
- Unit (`init.rs`): ok block, already-current, no tag, numbered list with fix or message, singular, malformed output, bare vs absolute `fgos`, short digest, status line. Seen red (compile) then green.
- Wiring (`test/rust-host/closing-block.test.mjs`, one release copy whose payload answers `doctor --json` with a canned result): ok gives exit 0, two lines, `complete`, and a second run says `already up to date`; not ok gives exit 2, the exact list, `ready-degraded`, activation kept; the `verify` line; the `status` last line. Why new: no test read the tail's output. This file was written after the code, so it was not seen red.
- Retired, behaviour moved to `test/state/init-config-files.test.mjs`: `fgos setup creates a header-only config.yaml ...`, `fgos setup leaves an existing legacy config.json alone ...`, `fgos setup run twice does not rewrite ...`.
- Gates: `cargo fmt --all --check`, `cargo clippy -p fgos-distribution -p fgctl --all-targets -D warnings`, `cargo test -p fgos-distribution -p fgctl`, msvc and `aarch64-apple-darwin` `cargo check`: green (the msvc dead-code warnings in `init.rs` tests and `shim.rs` predate this change). Rust-host init, upgrade, stage and closing-block files: green. Architecture, doc-health, first-run-guide, setup config: green. Citation drift: only the known document-identity red. One-door census regenerated (0 undeclared).

## Scratch-HOME run (this machine, PATH without agent CLIs, local-only repo, `fgctl init --from <release>`)
Before (per the phase): silent, exit 0, 5 failing checks. After:
```
4 checks need you:
  1. trust-store-readable: trust store at <HOME>/.claude.json is unreadable: ENOENT ...
  2. agent-cli-project-trusted: codex config <HOME>/.codex/config.toml (openai/codex-herdr) has no entry for <project>; ... add to that file: [projects."<project>"] trust_level = "trusted" ...
  3. confinement-probe-freshness: ... bwrap: execvp node: No such file or directory
  4. confinement-blind-read: ... exec: node: not found
```
Exit 2, stderr `Error: not ready: the checks listed above need you`. Rows 3 and 4 come from my stripped PATH (node outside the sandbox). Rows 1 and 2 are real findings: with no agent CLI on the machine the doctor still fails the Claude trust store and the Codex project trust, so a clean machine cannot reach `ok` from init alone. They are agent-readiness rows (P01 family, in `registrations.mjs`); not changed here (hot file, no row of my own). The Ready path is proven by the canned-doctor wiring test, not by a live clean machine.

## Net size (estimate, then measured)
- Rust production: est. +90; measured about +230 (block 110, facts and launcher command 70, tail steps 50), plus main.rs +8/-1.
- Node: est. 0; src +24 (`init.mjs`), bin -13 net.
- Tests: est. +50; measured +133 (wiring), +59 (init config), +95 (Rust unit), +25 (fixture), -57 retired.
- Scripts +23/-10; docs +2.

## Authority
- The readiness verdict is the doctor's (`ok`, per-row `status`, `fix`). The closing block only reads it; nothing in `fgctl` re-derives a verdict.
- The header-only config files had two holders (the `setup` arm, and the config spec naming init). Now one: the `fgos init` use case in `src/verbs/state/init.mjs`, calling the config door's `init`.
- Agent-readiness rows that fail on a machine with no agent CLI (`trust-store-readable`, `agent-cli-project-trusted`) judge declared executors, not installed CLIs. The lower fact (which CLIs exist) is P01's bind check; those rows belong behind it. Told to the big lead for P01.

## Lessons
- A focused `run-tests` does not rebuild the release `fgctl`; a stale binary made one suite fail for the wrong reason. Run `cargo build --locked --release -p fgos -p fgctl -p fgos-node-addon` after a Rust edit, before a rust-host file.
- A stub host that exits 0 and prints nothing was a hidden contract (`git_wal_activation_gate`); a new reader of a tail's output finds every such stub by running `cargo test -p fgctl`, not by grep.
- Making the exit code mean readiness moves every activation proof onto "activated" instead of "exit 0"; one `activated()` in the shared fixture was cheaper than editing about 90 assertions.
- Write the canned-payload wiring test before the code; here it came after and was never seen red.
