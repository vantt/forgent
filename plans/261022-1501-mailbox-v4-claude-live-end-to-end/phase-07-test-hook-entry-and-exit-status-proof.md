---
phase: 7
title: "Test-only entry mailbox-test-hook and the exit-status proof"
status: pending
depends_on: [6]
live_calls: 0
---

# Phase 7: Test-only entry `mailbox-test-hook` and the exit-status proof

## Why

Spec §14 V4 row: a cargo example binary of `fgos-mailbox`, run by `claude -p --settings <file>`, is the hook entry until V5's host route exists; it is never installed and is not a product door. The row also asks for the exit-status proof "by running the example binary": exit 0 under a panic, a failed write, a timeout and malformed stdin.

## Files

- Create `packages/mailbox/rust/store/examples/mailbox-test-hook.rs`. Module doc first, in plain words: test-only, never installed, not a product door; run by the live suite and by `tests/test_hook_entry.rs`; every behaviour lives in the library (plan decision 1). Grammar (each flag at most once; a repeated flag is a usage error, exit 2): <!-- Updated: red-team - no repeated flags -->
  ```text
  mailbox-test-hook hook --cli claude|codex --event stop|post-tool-use --fgos-dir <dir> --project <name> --topology direct|one-shell-hop [--log <file>] [--fault panic-in-render]
  mailbox-test-hook send --fgos-dir <dir> [--wake] [--reply-to <id>] --to <name> <body>
  mailbox-test-hook inbox --fgos-dir <dir>
  ```
  - `hook`:
    1. append an `enter` line to `--log` (time, cli, event, pid) **first**, so "the hook ran" never depends on how the call ends; <!-- Updated: red-team - enter line first -->
    2. `shell::silence_panics()`; `shell::arm_budget(hook.budget_ms, || append a "budget-exit" line)`;
    3. limits (core `Limits` and `HookLimits`) from the embedded `limits.v1.json`, turned into the `mailbox` config section by the helper the V2 cost example uses (`#[path = "../../core/tests/common/support.rs"] mod support;` and `support::config_section`), so no second contract reader exists; no file read at run time;
    4. ancestry from `std::os::unix::process::parent_id()` and process facts (`identity_of`, `/proc/<pid>/comm`); topology from `--topology` (the live harness passes what phase 2 found);
    5. resolver: `claude`: writer from `fgos_session_identity::resolve_current(Some(fgos_dir))`, accepted only when it is a session id, head from `claude_head::find_head` with `$HOME/.claude/sessions`; `codex` (**feasibility demo only**, plan decision 8, labelled in the code): writer from the payload's `session_id`, head = the topology's head position (Codex has no session file). The drain's own `WriterMismatch` check still runs;
    6. `shell::run` over the real stdin and stdout; append the outcome line (the outcome without body text, elapsed ms); `exit(0)`.
  - `--fault panic-in-render`: wraps stdout in a writer that panics on its first write. It exists only in this test binary (plan decision 10) and drives the library's panic catch through a real process.
  - `send` / `inbox`: `from` from `resolve_current(Some(fgos_dir))` (attribution only, spec §5.1); `verbs::send`, `verbs::inbox`; prints the answer; exit 0 when recorded or listed, 1 when refused or the record failed, 2 on a usage error.
  - `--fgos-dir` must exist (the record refuses otherwise); the example creates nothing outside it.
- Create `packages/mailbox/rust/store/tests/test_hook_entry.rs` (new boundary: the process). It finds the example next to the test binary (`current_exe()` → `../examples/mailbox-test-hook`) and **fails** with "build it first: `cargo build -p fgos-mailbox --example mailbox-test-hook`; a plain `cargo test -p fgos-mailbox` builds examples" when it is missing; it never skips. The phase's proof command is the whole-crate `cargo test`, which builds examples (validated: `target/debug/examples/mailbox-record-cost` is produced by `cargo test` runs). <!-- Updated: red-team - proof command builds the example -->

## Tests (one wiring proof per exit path; the behaviours are owned by `hook_shell.rs`, phase 6, and V3's `hook_payloads.rs`)

The test process is the head: it writes `<tmp>/home/.claude/sessions/<its pid>.json` naming a writer key, and runs the example with `HOME=<tmp>/home`, `CLAUDE_CODE_SESSION_ID=<key>`, the other session-identity variables removed, `--topology direct`, and a fresh `.fgos` under a temporary directory. The payload is the V3 Claude fixture for the event (`tests/common/mod.rs` constants); the writer key is that fixture's placeholder `session_id`, so `WriterMismatch` passes. Cases that need pending mail first run the entry once (registration), then the example's `send` to the registered name. If phase 2 chose topology B, one more case runs the entry through `sh -c '<example> …; :'` (a shell that does not exec) with `--topology one-shell-hop`.

1. `the_entry_exits_zero_and_prints_nothing_on_malformed_stdin`.
2. `the_entry_exits_zero_on_a_failed_stdout_write_and_leaves_the_claim_unfinished` — stdout is `/dev/full`.
3. `the_entry_exits_zero_when_stdin_never_closes_and_the_budget_passes` — stdin is a pipe the test keeps open; the child exits 0 no sooner than `budgetMs` and before twice `budgetMs` (both read from the contract), the log has `enter` and `budget-exit` lines, nothing claimed.
4. `the_entry_exits_zero_and_prints_nothing_after_a_panic_and_leaves_the_claim_unfinished` — `--fault panic-in-render`, one pending message.
5. `the_entry_delivers_through_a_real_process_and_exits_zero` — one pending message: exit 0, stdout is one JSON document, the message is `offered`. The shape itself is owned by V3's `hook_payloads.rs`; this test checks only the wiring. <!-- Updated: red-team - no second copy of owned proofs; verbs test dropped -->

## Proof

```bash
free -g | awk '/Mem:/{print $7}'     # >= 8
CARGO_BUILD_JOBS=4 cargo test --locked -p fgos-mailbox -- --test-threads=4   # builds the example, runs every test
cargo clippy --locked -p fgos-mailbox --all-targets -- -D warnings
cargo fmt -p fgos-mailbox -- --check
```

Green on fresh main. Commit `test(mailbox): a test-only hook entry for the live suite, with its exit-status proof`; census; sync; push.

## Risk

- `print!` in the example: the crate-level `deny(print_stdout)` is set in `src/lib.rs` and applies to the library only; if clippy flags the example anyway, write through `std::io::stdout().lock()`.
- Test 3 takes `budgetMs` (8 s) of wall time; it runs once.
