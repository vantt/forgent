# HARDEN T3 part 04a: red tests for the Agent protocol and Observe defects

Lead report, 2026-10-24 20:01 (Asia/Saigon). Branch `harden/t3a-red-tests`, based on origin/main `359ef9bc1`.
Input: [arbitration](council-261024-1947-harden-t3a-arbitration.md) §4 item 1, plus the correctness and red-team seat reports.

No product code changed. Every test is named for the behaviour that should hold, so its name reads correctly once the defect is fixed.

## Commits

| Commit | Scope |
|---|---|
| `dd09aadcd` | `test(observe)`: friction, case and snapshot shard defects (+ census) |
| `e28cf4f9b` | `test(agent-protocol)`: outbox read and quota outcome defects (+ census) |
| `129230049` | `test(run-supervisor)`: provider limit settled from the agent's own screen text |

## Per test

Times are test run time only (crate already built). No cargo or node run took more than 3 minutes. The longest was the first observe build, about 7.5 s.

| # | Finding | File : test | Red reason observed (assertion) | Run time |
|---|---|---|---|---|
| 1a | B-O1 / RT-03 | `packages/observe/rust/src/friction.rs` : `an_invalid_utf8_line_is_skipped_and_the_good_records_of_its_shard_still_list` | `friction list must succeed: "stream did not contain valid UTF-8"` | <0.1 s |
| 1b | B-O1 / RT-03 | `friction.rs` : `an_invalid_line_never_makes_a_write_or_migrate_append_migrated_legacy_records_again` | `record appended the migrated legacy record again` (left 2, right 1) | <0.1 s |
| 2 | B-O2 / RT-04 | `friction.rs` : `a_record_after_a_torn_last_line_lists_with_the_earlier_good_record` | `record appended onto the torn line was swallowed: ["tsk-good"]` | <0.1 s |
| 3 | B-O3 | `friction.rs` : `migrate_appends_nothing_while_another_holder_has_the_store_lock` | `migrate appended while another holder had the store lock` (left 1, right 0) | 0.3 s (one 300 ms wait) |
| 4 | B-O4 | `friction.rs` : `a_resolve_at_the_same_instant_or_later_settles_the_record_whatever_the_stamp_precision` | `work:tsk-equal stays unsettled` (left 1, right 0); the second subject is a legacy stamp without millis against a `.500Z` resolve | <0.1 s |
| 5a | RT-05 | `friction.rs` : `a_symlinked_writer_shard_is_refused_and_its_target_never_changes` (unix) | `record wrote through a symlinked shard` | <0.1 s |
| 5b | RT-05 | `packages/observe/rust/src/case_journal.rs` : `a_symlinked_case_shard_is_refused_and_its_target_never_changes` (unix) | `open_case wrote through a symlinked shard` | <0.1 s |
| 5c | RT-05 | `packages/observe/rust/src/metrics_cli/snapshot.rs` : `a_symlinked_snapshot_shard_is_refused_and_its_target_never_changes` (new `#[cfg(all(test, unix))]` module; snapshot had no unit tests) | `snapshot wrote through a symlinked shard` | 0.2 s |
| 6a | RT-02 | `packages/agent-protocol/rust/tests/terminal_vectors.rs` : `a_fifo_named_like_a_result_is_never_read_and_both_outbox_reads_return_none_promptly` (unix) | left `(None, None)`, right `(Some(None), Some(false))`: both `newest_complete` and `newest_unreadable` still blocked after 2 s | 4.0 s red (2 s watchdog per call), ms once fixed |
| 6b | RT-02 | `terminal_vectors.rs` : `an_oversized_result_file_is_not_taken_as_complete` | `an oversized result was read whole and accepted` (left `Some(.../result-1.json)`) | about 0.1 s |
| 7 | RT-08 | `contracts/fixtures/terminal/{claude,codex,agy,pi,omp}/vectors.json`, run by `terminal_every_cli_vector_resolves_as_recorded` | `claude: "usage-limit-on-an-idle-screen-is-blocked-usage-limit"`: left `{"outcome":"needs-human"}`, right `{"outcome":"blocked","reason":"usage-limit"}` | 0.01 s |
| 8 | RT-01 (settle half) | `test/run-supervisor/attempt-steps.test.mjs` : "a terminal attempt stopped as needs-human is not a provider limit because the agent's own text on its screen mentions one" | `notStrictEqual` fails: actual `'provider-limit'`, with classification `failure: {family: provider, code: provider-limit}`. The runner note shows the screen was read: "Its screen ended with: I hit a rate limit earlier ..." | about 15 ms (file 1.5 s through `runChosenTests`) |

Run commands:
- `cargo test -p fgos-observe --lib`
- `cargo test -p fgos-agent-protocol`

Both used `CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/harden-t3a-red-tests-target`. Every other test in both crates stays green.

## Notes for the fixer

- **1a: naming the bad line.** The test asserts only that `list` returns the good records. Today `friction list` returns a bare JSON array, so it has no place to name a skipped line. Eval's `list` has an `invalid` field for this. Once the shard door picks a shape for friction, extend 1a to assert the named line.
- **1b covers three paths.** It covers `record`, `resolve` and `friction migrate` (through `friction_cli::dispatch`). The test does not care whether a write fails closed or skips the bad line; it only counts migrated copies, reading the bytes so the bad line cannot hide them.
  - The test still calls `record` and `resolve` with `legacy_sources`.
  - If the fix removes that argument from the write path (arbitration §2.2 / §4.3), drop it from the calls. The `migrate` assertion stays.
- **3: lock shape.** The test holds the store lock on the test thread and runs `migrate` on another thread. It checks the shard after 300 ms, then releases the lock and expects exactly one copy. This fits either fix shape:
  - `migrate` takes the lock itself;
  - `migrate` takes a guard argument.
- **6b: cap constant.** The test writes a valid JSON object of 16 MiB + 1 byte (`OVERSIZED_RESULT_BYTES`). The fix should define `MAX_RESULT_BYTES` at or below 16 MiB, and may then reference it in the test.
- **7: the vector change is a contract change.** It rewrites the existing `usage-limit-on-an-idle-screen-is-needs-human` vector of every CLI. I did not add a second, contradicting vector. The fix (L10, same change) must also update:
  - `terminal-outcomes.v1.json` (`blocked.reason.enum`, and drop `wire.usageLimit`);
  - `test/run-supervisor/contracts-terminal.test.mjs:113`, which pins the enum to `['trust-dialog','login']`;
  - the `TerminalBlock` enum and the supervisor's receipt reason.

  Until the fix lands, the whole vector test is red at claude's case, which hides any later vector failures in that one test. This depends on the owner's answer to Q1.
- **8: the fake pane.** The test adds a `terminal` option to the `attempt()` fixture (mode, `agentProtocol.mode`, `slot.key`). A `paneShows()` helper turns the fixture release's empty `bin/fgos` into a script that answers `internal terminal-control read` with the scripted screen.
  - When T4 deletes the screen re-read, the test stays valid. It asserts only `classification.failure.code !== 'provider-limit'`.
  - It hands over to T4 with the settle fix.

## Item 8: first version passed for the wrong reason (fixed in a follow-up commit)

The coordinator ran it in the staged environment and it passed 11/11. Cause, found with temporary debug prints (since removed):

- `paneScreenOf` (`settle-attempt.mjs:84-95`) caught `terminal-control-no-host-binary: cannot run .../release/bin/fgos (EACCES)` and returned `''`.
- That happened because `workspace()` creates `bin/fgos` as an empty, non-executable file. `fs.writeFileSync(..., { mode: 0o755 })` applies `mode` only when it creates a file, so the fake host stayed non-executable.
- With an empty screen, `terminalAdapterOutcome` returned `blocked`, and the test passed vacuously.

The fix is in the test only: `paneShows` now runs `fs.chmodSync(host, 0o755)` after the write. With that, the screen is read and matches `/rate limit/i` (`settle-attempt.mjs:105`, `:127`), and the attempt settles as `provider-limit`. The defect exists as the red-team described.

Run with: `node --input-type=module -e "import {runChosenTests} from './scripts/run-tests.mjs'; runChosenTests(['test/run-supervisor/attempt-steps.test.mjs'])"`, using this worktree's `CARGO_TARGET_DIR` and with `$HOME/.cargo/bin` on PATH. Result: 10 pass, 1 fail (this test).

## Could not reproduce or run


- **The B-A1 screen-changed case** (arbitration §4.1, third bullet) was not in the assigned list and was not written.
- **RT-02's supervisor half** (the watch loop stalling) was not written. The protocol-level FIFO test is its owning proof. The supervisor is T4's crate.

## Found on the way (pre-existing, not caused by these tests)

- **An existing test is flaky on main.** `friction::tests::test_friction_record_resolve_lifecycle` fails on unmodified `359ef9bc1` in 4 of 6 runs of `cargo test -p fgos-observe --lib friction::tests`.
  - The `record` and `resolve` calls land in the same millisecond. The shard showed both at `2026-10-24T12:57:21.797Z`.
  - So `rank` still lists the record. This is B-O4's equal-stamp defect.
  - It goes green with the B-O4 fix. Until then, any lane running the observe suite can see this red.

Status: DONE_WITH_CONCERNS
Summary: 14 red tests reproduce B-O1–B-O4, RT-02, RT-03–RT-05, RT-08 and RT-01's settle half. Every test, the Node one included, was run and fails on its stated assertion.
Concerns/Blockers:
- The RT-08 vector change is a contract change that depends on owner Q1.
- The existing friction lifecycle test is already flaky on main because of B-O4.
