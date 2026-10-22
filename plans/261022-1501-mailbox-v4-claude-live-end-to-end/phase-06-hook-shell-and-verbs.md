---
phase: 6
title: "Hook shell and the send and inbox verbs"
status: done
depends_on: [4, 5]
live_calls: 0
---

# Phase 6: Hook shell and the `send` and `inbox` verbs

## Why

`hook/drain.rs` (V3) is three infallible steps; its module doc lists the shell duties V4 builds (spec §6.1 shell duties, §8 item 7): check the caller, take hold 1 and `begin`, read the bodies and `render_reply`, **write and flush stdout, and only after a successful write** take hold 2 and `finish`, exit 0 in every case. `send` and the read-only `inbox` (spec §6.1; the V4 row lists `inbox`) answer from the record. Plan decision 1: all of it is library code so V5's host entry wires the same functions. `inbox --claim` is **not** built in V4: the V4 row and the live suite use only the read-only `inbox`; `--claim` lands with the product verbs at V5. <!-- Updated: red-team - inbox --claim cut from V4 -->

## Files

- Create `packages/mailbox/rust/store/src/hook/shell.rs` (export from `hook/mod.rs`):
  - `pub struct Resolved { pub writer: WriterKey, pub head: HeadFacts }`, produced by a resolver parameter `&dyn Fn(&[u8]) -> Result<Resolved, NoHead>`: the entry decides how the writer and head are found (Claude: session identity's writer plus `claude_head::find_head`; the example's Codex resolver: the payload's `session_id` plus the same topology rule). The shell never names a CLI.
  - `pub fn run(input: ShellInput, stdin: &mut dyn Read, stdout: &mut dyn Write) -> ShellOutcome`, where `ShellInput` carries the adapter, event, project, record, limits, tested list, clock, the `Ancestry` and `Topology` (phase 5) and the resolver. In this order:
    1. read stdin bounded by `hook.max_read_bytes` (`take(max + 1)`): over the cap is quiet `Malformed`, nothing else read;
    2. resolve the writer and head; failure is quiet (`HeadUnknown`, with the `NoHead` cause in the outcome);
    3. re-read the topology's head position from process facts and `head::caller_is_head`; false is quiet, the record is not opened;
    4. hold 1 (`Record::hold`, `Wait::Ms(hook.lock_wait_ms)`) running `begin`; the closure also collects each claimed message's `Header.body_bytes` from the state it just changed (`ClaimedItem` carries no size; spec §6.4: the size is read in the same hold that claimed it). A `RecordError` (lock busy, unreadable, newer) is quiet and prints nothing. A claim is emitted only when the hold returned `Ok` (its install happened; a warning after the rename still counts as written);
    5. read each claimed body with `Record::body(id, body_bytes, limits)` outside the mutex, then `render_reply`;
    6. set the "write started" flag (below), `write_all`, `flush`; on any error return without finishing (the claim expires and the mail is offered again: spec §5.2 duplicate window);
    7. hold 2 running `finish`; its error is a warning in the outcome, never output.
  - The whole body runs under `std::panic::catch_unwind`; a panic yields `panicked: true` and nothing further written.
  - `pub fn silence_panics()` (an empty panic hook, so a panic writes nothing to stderr) and `pub fn arm_budget(budget: Duration, on_exit: impl FnOnce())`: a thread that, when the whole-hook budget passes, calls `on_exit` (the example writes its "budget-exit" log line there) and then `std::process::exit(0)` — **unless the write has started**, in which case it lets the write finish (a cut-off stdout would hand the CLI a truncated JSON document with exit 0, which is worse than a late one; the CLI's own hook timeout still bounds it). Both are documented as entry-only: only an entry's `main` calls them, never `run`. <!-- Updated: red-team - the watchdog never cuts stdout mid-write -->
  - `ShellOutcome` holds what an entry logs: the quiet reason or the claimed ids, `state_written`, `stdout_written`, the finish result, warnings, `panicked`. It carries no body text.
- Create `packages/mailbox/rust/store/src/verbs.rs` (export from `lib.rs`):
  - `pub fn send(record, req: SendRequest, wait, now, limits) -> SendAnswer { text: String, recorded: bool }` over `Record::send`; text from the core's `delivery_report` or `refusal_text` (phase 4); a `RecordError` answers with its `code()`, `recorded: false`.
  - `pub fn inbox(record, key, wait, now, limits) -> String`: one hold whose closure returns `Reported::unchanged(…)` of `state.inbox(key)` (and whether the key has a binding), so it never writes; text from `inbox_text`.
- Create `packages/mailbox/rust/store/tests/hook_shell.rs` and `tests/verbs.rs` (new modules). Reuse `tests/common/record.rs` (`TempFgos`, `read_state`, `key`, `T0`) and the V3 payload fixtures through the constants in `tests/common/mod.rs`; no second fixture loader.

## Tests first

`tests/hook_shell.rs` (heads are real child processes the test spawns; the ancestry is built from process facts):

1. `a_claimed_frame_is_on_stdout_while_the_message_is_still_in_flight_and_offered_after_the_finish` — the test's writer reads the snapshot at the moment of the write and sees `in-flight`; after `run`, `offered`.
2. `a_failed_stdout_write_never_finishes_and_the_message_is_offered_again_after_its_deadline` — writer returns an error; the message stays `in-flight`; a second `run` after `inFlightTtlSec` offers it with `attempt="2"` in the frame.
3. `a_payload_one_byte_over_the_read_cap_is_quiet_and_leaves_the_snapshot_unwritten`.
4. `a_caller_that_is_not_the_head_drains_nothing_and_opens_no_record` — the snapshot is still absent afterwards when it was absent before.
5. `a_record_error_makes_the_hook_quiet_and_print_nothing` — the snapshot replaced by one of a newer schema version (the `RecordError` arm a busy lock also takes). The busy lock stays owned by V2's `record_contention.rs` `a_hold_that_cannot_get_the_lock_within_the_wait_cap_changes_nothing`.
6. `a_panic_while_writing_is_caught_prints_nothing_more_and_leaves_the_claim_unfinished` — a writer that panics.
7. `the_budget_watchdog_waits_for_a_started_write_and_exits_otherwise` — `arm_budget` exercised in a child process of the test (it exits the process): a child whose write has started finishes it; a child blocked before the write exits 0 at the budget with its `on_exit` run. Use a short budget passed in by the test; the product value stays in the contract.

`tests/verbs.rs`:

8. `send_records_the_message_and_answers_with_the_delivery_report`.
9. `a_refused_send_records_no_message_and_answers_with_the_refusal_text` (self-send, the cheapest refusal to build).
10. `inbox_lists_pending_mail_with_its_state_and_never_writes_the_snapshot` — snapshot bytes and mtime unchanged; a key with no binding gets the no-address text.

Behaviour already owned elsewhere is not re-proven: the change-report write rule (V2 `record_snapshot.rs`), the drain's quiet reasons and shapes (V3 `hook_payloads.rs`), the policies (core).

## Proof

`CARGO_BUILD_JOBS=4 cargo test --locked -p fgos-mailbox --test hook_shell --test verbs -- --test-threads=4`, then the whole crate, clippy (`-D warnings`; the crate's `deny(print_stdout)` stays: the shell writes through the `Write` it is given) and fmt, green on fresh main. Commit `feat(mailbox): the hook shell writes before it finishes, and send and inbox answer from the record`; census; sync; push.

## Risk

- `arm_budget` exiting while hold 2 runs: the kernel releases the lock with the process and the install is atomic (V2 `record_crash.rs`); the claim then expires and repeats, which the frame already says may happen.
- `catch_unwind` needs `AssertUnwindSafe`; the record and the state are not used after a panic.

## Done on the branch (implementation lead, 2026-10-22)

- `cargo test --locked -p fgos-mailbox --test hook_shell --test verbs -- --test-threads=4`: 8 (7 behaviours and the `child_entry` dispatcher the watchdog test runs as a child) + 3 passed; whole store crate 111 passed; clippy (`-D warnings`) and fmt clean.

### Deviations

- The resolver is `Fn(&[u8], &Ancestry) -> Result<Resolved, NoHead>`: the finder needs the ancestry. `ShellInput` also carries an `ancestry` reader (called before the resolver and again before hold 1) and the `write_started` flag the watchdog shares; `arm_budget` takes that flag.
- Quiet reasons of the shell itself are `shell::Quiet` (`Drain(QuietReason)`, `NoAncestry`, `NoHead(NoHead)`, `NotTheHead`, `Record(code)`); a payload over the read cap is `Drain(Malformed)`.
- `verbs::inbox` returns `Result<String, &'static str>` (the record's error code), so the entry can exit 1 when the record failed; `verbs::send` answers a record failure with its code, as planned.
