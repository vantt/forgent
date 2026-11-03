---
phase: 04
title: "Supervisor folds: one watch tick (S4), no heartbeat file (S6), one start-refusal writer and one peer_uid (S13), terminal /proc readers onto T0 facts (S5), pane screen sampled only while idle can come first (5a), agent-writable files read through the bounded reader, the 30 s real wait out of the crate tests"
status: pending
depends_on: [01, 02, 03]
parallel: "wave 2, with phase 05 (disjoint files)"
effort: ~1.5d
net_size: "Node 0 / Rust −69 / tests 0 (estimate)"
---

# Phase 04 — Supervisor folds and pane sampling

## Context

[plan.md](plan.md) ownership table (this phase owns `supervise.rs`, `supervise/terminal.rs`, `go_channel.rs` after phases 02 and 03); arbitration §3 rows S4, S5, S6, S13, speed B-6; decision 59 answer 5a (RT4-08); approved hostile-input rule (arbitration §2) and planner finding RT-P7; RT-P9, RT-P16.

Code read on `fcd42ecdc` (lines move after phase 02; re-read before editing):
- Two watch loops repeat the AGENT-frame read with the `agent-binding.json` publish, the heartbeat and the "gate outlived grace → `kill_all`" escalation: `supervise.rs:479-541` (`watch_gate`) and `supervise/terminal.rs:368-424` (`Sup::tick`). The terminal loop has no output-limit cause; nothing says whether on purpose.
- Heartbeat: `HEARTBEAT_EVERY` `supervise.rs:169`, writers `:515-517` and `terminal.rs:390-393`, `write_atomic` `supervise.rs:261-267` (its only user). No reader in `src`, `bin`, `apps` or another crate; asserted at `tests/supervise_lifecycle.rs:62` and `tests/supervise_portable.rs:54`.
- Start refusal written twice: `record_start_refusal` `supervise.rs:290-302` and `not_started` `:383-391`. `peer_uid` three times: `supervise/terminal.rs:164-173`, `gate/unix.rs:150-163`; `peer_cred` `terminal.rs:176-183`.
- Terminal `/proc` readers: `parent_of` `terminal.rs:270-274`, `within` `:277-289`, `namespace_init_under` `:293-306` (`/proc/<pid>/status` NSpid, `/proc/<root>/task/<root>/children`). T0 has `facts::relation_of` and `facts::relations` (`process facts.rs:443-451`); no namespace fact.
- Pane screen sample once a second whenever `idle` is set (`terminal.rs:397-406`, `SCREEN_SAMPLE_EVERY` `:57`); pane idle is 20 min (`herdr-round.mjs:58` `PANE_IDLE_TIMEOUT_MS`), the default soft deadline 15 min (`assignment-runner.mjs:1263`), so with defaults idle can never fire first and the sampling is spent.
- Agent-writable files opened with a blocking, link-following `File::open`/`read_to_string`: `capture_digest` `supervise.rs:76-89`, `read_gate_exit` `:96-99`, `CaptureTail::active` `:242-259`. In a confined attempt the capture files and `gate-exit.json` are bind-mounted files the agent cannot replace (`direct-launch.mjs:97-110`); on a best-effort driver it can (`mkfifo` over the path).
- `UnreadableWait::expired` hard-codes 30 000 ms (`terminal.rs:608-624`, the literal at `:620`); the unit test `unreadable_wait_requires_unchanged_bytes_and_consecutive_idle_polls` (`:739-`) owns the rule with a fake clock; `tests/supervise_terminal_fake_herdr.rs:364` `an_idle_agent_with_unchanged_invalid_result_stops_and_releases_custody` waits it for real (36 s).

## Requirements

- **S4.** One shared step for both loops covers: reading AGENT frames and publishing `agent-binding.json` once, and the stop escalation (after `grace + GATE_STOP_SLACK`, `kill_all` retried each tick until `Ok`, as `37a1aa794` made both do). The causes stay per mode; one line states that a terminal attempt has no output budget because it has no capture files. Behaviour unchanged: the existing lifecycle tests own it.
- **S6.** Both heartbeat writers, `HEARTBEAT_EVERY`, `write_atomic` (and `os::create_private` if nothing else uses it: `rg -n create_private packages/run-supervisor`) and the two assertions go.
- **S13.** One function publishes `start-refused.json` (`record_start_refusal` with `run_dir`, `attempt_id`, `code`, `why`); `not_started` calls it. `peer_uid` (and `peer_cred` if the gate needs it) lives once in `go_channel.rs`; both copies go in this phase (L10).
- **S5 (supervisor half).** `parent_of`/`within` use `facts::relation_of`; the children of the pane root come from `facts::relations()`; the namespace test comes from one new T0 fact (the pid's `NSpid` list, read from `/proc/<pid>/status` on Linux, `None` elsewhere). Zero `/proc` reads left in `packages/run-supervisor/rust/src`.
- **5a.** The once-a-second screen sample runs only while the idle deadline can come before the soft deadline: `idle_left = idle − last_active.elapsed()`, `soft_left` from `soft_at`; sample iff there is no soft deadline or `idle_left < soft_left`. The drive loop's own screen reads keep feeding `note_screen`. Pane idle stays 20 min. A pure function decides, with a unit test (the owning proof).
- **Hostile-input rule in the supervisor.** `capture_digest`, `read_gate_exit` and `CaptureTail::active` open through the bounded, no-follow, non-blocking reader the protocol's `FsOutbox` already uses (reuse it; if it is private to `fgos-agent-protocol` or `fgos-durable-file`, make it public there, the lowest layer that owns it). A non-regular file reads as absent; a capture file too large is digested up to a cap and named so in the receipt. First reproduce on `linux-pgroup` (a FIFO in place of `stdout.log` makes the receipt never appear); if it does not reproduce, record why and stop this item.
- **Speed B-6 (supervisor).** RT-P16: if `UnreadableWait`'s 30 s can be driven through an existing clock seam in the integration harness, keep the integration case and drive it; otherwise retire it (below).

## Files

**Create:** none.

**Modify:**
- `packages/run-supervisor/rust/src/supervise.rs`, `supervise/terminal.rs`, `go_channel.rs`, `gate/unix.rs` (the `peer_uid` copy only), `supervise/unix.rs` and `supervise/windows.rs` (only if `create_private` goes)
- `packages/process/rust/src/facts.rs` and `platform/linux.rs` (the namespace fact), or the reader's home crate (`packages/agent-protocol` / `packages/durable-file`) if its opener must become public
- Tests: `tests/supervise_lifecycle.rs:62`, `tests/supervise_portable.rs:54`, `tests/supervise_terminal_fake_herdr.rs`, the `terminal.rs` unit tests (5a), one capture-FIFO case in the test that owns direct receipts (`supervise_lifecycle.rs`), the process crate's fact tests
- census

**Delete:** heartbeat writers, `HEARTBEAT_EVERY`, `write_atomic`; the second start-refusal writer; `peer_uid`/`peer_cred` copies outside `go_channel.rs`; `parent_of`, `within`'s `/proc` read, `namespace_init_under`'s `/proc` reads.

**Tests to retire:**
- The two heartbeat assertions (`supervise_lifecycle.rs:62`, `supervise_portable.rs:54`): behaviour removed (no reader existed).
- `supervise_terminal_fake_herdr.rs::an_idle_agent_with_unchanged_invalid_result_stops_and_releases_custody`, unless driven through a clock seam (RT-P16): the 30 s rule is owned by `terminal.rs` unit `unreadable_wait_requires_unchanged_bytes_and_consecutive_idle_polls`; "a stop with a named reason releases custody and keeps the pane" by `supervise_terminal_fake_herdr.rs::an_attempt_that_cannot_go_on_closes_the_captured_pane_and_names_why`. The only part neither asserts is the receipt string `terminal:result-unreadable`; the lead adds that one assertion to the unit test's caller or names it as lost in the report.

## Net size

Rust: S4 −35, S6 −10, S13 −20, S5 −30 (+10 in T0), 5a +8, hostile-input +8 → about −69. Tests: heartbeat −2, unreadable integration −20, 5a unit +12, FIFO wiring +10 → about 0.

## Steps

1. Re-read `supervise.rs` and `terminal.rs` on main after phases 02 and 03 landed; find the owning tests (lifecycle and fake-herdr files own the loops; `terminal.rs` unit tests own the rules).
2. S6 and S13 (mechanical), then S4 under the green lifecycle tests.
3. S5: T0 namespace fact first (`cargo test -p fgos-process`), then the supervisor.
4. 5a with its unit test; re-run `only_new_words_on_the_screen…` and `a_pane_that_cannot_be_read_is_blind_time…`.
5. Hostile-input: reproduce, then route the three reads through the reader.
6. B-6 (RT-P16), timed before and after.
7. msvc and darwin checks; clippy; census.

## Validation (focused)

- `cargo test -p fgos-run-supervisor --lib --test supervise_lifecycle --test supervise_portable --test supervise_terminal_fake_herdr --test supervise_crash --test supervise_guard --test gate_terminal_socket --test adopt_matrix`
- `cargo test -p fgos-process` (and `-p fgos-agent-protocol` / `-p fgos-durable-file` if the reader moved)
- `cargo check -p fgos-run-supervisor -p fgos-process --target x86_64-pc-windows-msvc` and `--target aarch64-apple-darwin`; clippy `-D warnings`
- FR `test/run-supervisor/terminal-cutover.test.mjs test/run-supervisor/terminal-groups.test.mjs test/run-supervisor/direct-cutover.test.mjs`
- `rg -n '"/proc|supervisor-heartbeat|fn peer_uid' packages/run-supervisor/rust/src` → one `peer_uid` in `go_channel.rs`, nothing else
- `supervise_terminal_fake_herdr` wall time before/after.

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| The shared tick changes the order of cancel, deadline and escalation checks | M × M | Keep the order of each loop; lifecycle and fake-herdr tests own it; diff the order in the review. |
| 5a stops sampling and idle later becomes possible (a long attempt whose soft deadline is far) | L × M | The decision re-runs every tick from the live clocks; the unit test covers both sides of the boundary. |
| Reader made public in a lower crate grows its API | L × L | One function, already used; no new behaviour. |
| A namespace fact on non-Linux returns `None` and the terminal gate tuple is not found | L × M | Non-Linux already uses the pane root (`terminal.rs:262-266`); unchanged. |

## Rollback

Revert the merge; re-activate the previous release. No on-disk format change except that `supervisor-heartbeat.json` is no longer written (nothing reads it).

## Done when

One watch step, no heartbeat, one refusal writer, one `peer_uid`, no `/proc` read in the crate, 5a's unit test green, the three agent-writable reads bounded (or the non-repro recorded), fake-herdr binary faster; landed with a pane-seat smoke and a guide section.

## Lead brief essentials

Delete list above. Find the owning test before writing a new one. Reproduce the FIFO case before fixing it. Δ-lines per language and fake-herdr wall time. All plan.md lead rules apply.
