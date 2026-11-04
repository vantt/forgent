# HARDEN T4 Rust test time (fgos-run-supervisor)

Branch `harden/t4-rust-test-time` (worktree harden-t4-rust-test-time), one commit, not pushed. Machine fg-server2, 2026-11-04.

## Result
Crate `cargo test -p fgos-run-supervisor`: 72.9 s (closing report, load 1.9) -> 53.9 s then 49.9 s, 49.8 s (load 1.2 to 1.6, same band). Target 50 s: met at the line. Same 149 tests, every assertion kept.

## Per test (run alone with --exact, load 1.5 to 2.7)
| Test | Before | After | What it waited on / change |
|---|---|---|---|
| gate_pid1 `a_long_attempt_with_many_orphans_accumulates_no_zombies` | 19.1 s | ~7.7 s (binary) | noisy agent spreads 200 orphans over `--run-ms` 30000 (2 per 250 ms) until >150 distinct pids seen. `--run-ms` now 10000 (5 per 250 ms). Same churn threshold, tighter reaping pressure |
| fake_herdr `only_new_words_...never_a_spinner_or_a_clock` | 19.0 s | 10.9 s | `idle_ms` 6000 -> 3000 (envelope field); progress loop 20 -> 10 writes of 500 ms (5 s, still more than an idle period). Spinner-only phase then idles at 3 s |
| fake_herdr `a_pane_that_cannot_be_read_is_blind_time...` | 16.3 s | 10.4 s | `idle_ms` 3000, `soft_ms` 10000 (was 6000 / 16000): blind stretch still about 2x idle |
| fake_herdr `a_deadline_stop_names_a_provider_stop...` (4 parallel runs) | 12.3 s | 6.3 s | `soft_ms` 12000 -> 6000 |
| fake_herdr `a_fifo_named_like_a_result...hard_ceiling` | 9.1 s | ~6 s | `ceiling_in_ms` 9000 -> 6000 (supervisor killed at 3.5 s) |
| gate_portable `the_hard_ceiling_is_enforced_with_no_supervisor_left` | 6.5 s | ~4.5 s | ceiling +6 s -> +4 s, absolute-ceiling assert 5500 -> 3500 ms (same relation: ceiling minus 0.5 s) |

Binary times after: gate_pid1 7.7, fake_herdr 11.9 (parallel inside), gate_portable about 4.5, supervise_portable 4.4, rest 3.4 or less.

## Stays, and why
- fake_herdr `a_pane_whose_shell_never_becomes_ready...` 10.2 s: waits the code's `DEFAULT_SHELL_READY_TIMEOUT_MS`, hardcoded in `terminal_slot.rs`, not read from any envelope/config; shortening needs a production knob. Inherent. It also floors the binary (it runs in parallel with the rest).
- fake_herdr `a_pane_that_disappears...` 8.2 s, `a_supervisor_killed_after_the_brief...` 6.5 s, `a_launch_that_proves_nothing...` 5.4 s: adapter/poll timings in code, and the 3.5 s sleep that lets the confirm loop run once (P06 reasoning). Not touched.
- gate_pid1 and gate_portable grace tests (`grace_ms` 10000 / 1500 / 3000): the kill-grace tests assert the real grace elapses; kept.

## Gates (all on the changed tree)
Crate tests green twice; clippy -D warnings clean; msvc and aarch64-apple-darwin `cargo check --tests` clean; git-one-door-scan 0 undeclared. `cargo fmt --all --check` reports one diff in `apps/fgos/src/wiring/mailbox_remote.rs:275` that is already on origin/main and not mine (left alone; my three files are formatted).

Unresolved: whoever owns `mailbox_remote.rs` should run `cargo fmt`. Making the shell-ready timeout configurable would take 10 s more off a single test but adds a production knob (owner decision).
