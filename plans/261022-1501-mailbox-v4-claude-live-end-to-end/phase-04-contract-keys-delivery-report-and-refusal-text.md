---
phase: 4
title: "Contract keys, delivery report, refusal and inbox text"
status: pending
depends_on: [1]
live_calls: 0
---

# Phase 4: Contract keys, delivery report, refusal and inbox text

## Why

- `send` must answer `recorded` plus one sentence saying when the recipient will see the message (spec §5.2, §6.1, §6.2), and a refused send must say why and, for a policy refusal, "do not retry; ask your user" (§5.3). No such text exists: `frame.v1.txt` holds only the frame and the notices.
- `inbox` (read-only) prints the address's pending items; no text exists for it.
- The hook shell (phase 6) needs its whole-hook budget and a stdin byte bound from the contract, never from a constant (the limits contract: "neither crate has a numeric constant or a default").

## Files

- Modify `packages/mailbox/contracts/frame.v1.txt`: add sections, never change an existing one:
  - `[report.recorded]`: `recorded {{id}} for {{to}}` (one line).
  - `[report.turn]`: `queued: it sees it at its next tool call.` (spec §6.2 wording).
  - `[report.turn.wake]`: `queued: it sees it at its next tool call or when its turn ends.` (spec §6.2).
  - `[report.wake-dropped.exchange-quota]`: `The wake quota of this exchange is used up; it will see this at its next checkpoint.` (spec §5.3 wording).
  - `[report.wake-dropped.lifetime-cap]`: `The wake lifetime cap toward this recipient is reached; it will see this at its next checkpoint.`
  - Refusals, five sections, not one per code (the core's `Refusal` already has a stable `code()`; spec §5.3 fixes only the "do not retry" duty and two wordings): <!-- Updated: red-team - fewer refusal sections -->
    - `[refusal.policy]`: `Refused: {{code}} ({{limit}}). Do not retry; ask your user.` for `session-budget`, `lifetime-cap`, `too-deep`, `queue-full`, `sender-share-full`;
    - `[refusal.loop]`: `Refused: loop ({{limit}}). This looks like a loop, check with your user. Do not retry.` (spec §5.3 wording);
    - `[refusal.too-large]`: `Refused: too-large (at most {{limit}} bytes). Send a path or link instead.` (spec §5.1 `body`);
    - `[refusal.name]`: `Refused: {{code}}. Candidates: {{candidates}}.` for `unknown-name` and `ambiguous-name` (an empty list prints `none`);
    - `[refusal.argument]`: `Refused: {{code}}.` for `group`, `self`, `reply-to-not-offered`, `sender-key-too-long`.
    `{{limit}}` is the variant's own fields written as `name=value` pairs in field order (for example `max_per_window=12 window_sec=600`), produced by one function in `report.rs`; no number is typed into the contract.
  - `[inbox.empty]`: `No pending mail.`; `[inbox.line]`: `{{id}} {{kind}} from={{from_label}} state={{state}} offers={{offers}}`, where `{{state}}` is `in-flight` when `MessageView.in_flight` is true and `recorded` otherwise (`inbox()` returns only those two, plus notices); `[inbox.no-address]`: `This session has no mailbox address yet; it gets one at its first hook.` <!-- Updated: red-team - inbox line matches MessageView -->
  - Update the file's header comment: the placeholder list and "the one source of every text the mailbox puts in front of a model" now covers the send answer and the inbox listing.
- Create `packages/mailbox/rust/core/src/report.rs`; export from `lib.rs`:
  - `pub fn delivery_report(outcome: &SendOutcome) -> String` — `[report.recorded]`, then `[report.turn.wake]` when `outcome.effective_wake`, else `[report.turn]`, then the wake-dropped line when `outcome.wake_dropped` is set. Doc comment: every drained CLI is tier `turn` in V4 (plan decision 5).
  - `pub fn refusal_text(refusal: &Refusal) -> String`.
  - `pub fn inbox_text(items: Option<&[MessageView]>) -> String` (`None`: the caller has no address).
  - All three fill through `frame.rs`'s existing one-pass `fill` and its header escape for every inserted value (make `fill`/`section` `pub(crate)`; no second filler).
- Create `packages/mailbox/rust/core/tests/report.rs` (new module, so a new test file).
- Modify the core test that proves every contract section exists (`rg -n "frame_sections" packages/mailbox/rust/core/tests`) so it lists the new sections; it stays the owner of "every section exists".
- Modify `packages/mailbox/contracts/limits.v1.json`: add `mailbox.hook.budgetMs` (`reader: hook`, 8000, ms, "whole-hook failure ceiling, not a target", source `spec §12`, status "placeholder, unmeasured") and `mailbox.hook.maxReadBytes` (`reader: hook`, 1048576, bytes, "largest foreign JSON document the hook reads: its stdin payload and the CLI's own session file; a larger one is refused (stdin: quiet Malformed; session file: no head)", source "borrowed from packages/terminal-control/rust/src/route.rs MAX_STDIN, the repository's only bound on a foreign input read", status "placeholder, borrowed, unmeasured"). One key for both reads because both are the same kind of input (a JSON document another program wrote, read once per hook call) and no measurement separates them; a session file is a few hundred bytes (read 2026-10-22), so the bound only matters against a hostile or corrupt file. <!-- Updated: red-team - key named for what it bounds -->
- Modify `packages/mailbox/rust/store/src/hook/limits.rs`: rename `LockWaitLimits` to `HookCallLimits` (it no longer holds only the lock wait), fields `lock_wait_ms`, `budget_ms`, `max_read_bytes`; move every caller in the crate and its tests (L10: no alias left behind).
- Modify the store's `tests/limits_contract.rs` (owner of "every hook key in the contract is read by `HookLimits`") for the two keys.

## Tests first (each title names the behaviour)

`core/tests/report.rs`:

1. `a_send_without_an_effective_wake_reports_recorded_and_its_next_tool_call`
2. `a_send_with_an_effective_wake_reports_its_next_tool_call_or_the_end_of_its_turn`
3. `a_send_whose_wake_the_exchange_quota_dropped_says_so_and_still_reports_recorded`
4. `a_send_whose_wake_the_lifetime_cap_dropped_says_so`
5. `each_refusal_code_renders_from_its_section_and_policy_refusals_say_do_not_retry` (one table over every send-refusal code: which section, `{{limit}}` text, and "Do not retry" exactly for the policy and loop sections)
6. `a_name_refusal_lists_the_candidates_through_the_header_escape` (a candidate with `<`, `"` and a newline comes out escaped)
7. `an_inbox_listing_has_one_line_per_pending_item_with_its_state_and_says_no_pending_mail_when_empty`

Then make them pass. The existing frame tests must stay green unchanged except the section list.

## Proof

```bash
CARGO_BUILD_JOBS=4 cargo test --locked -p fgos-mailbox-core -p fgos-mailbox -- --test-threads=4
cargo clippy --locked -p fgos-mailbox-core -p fgos-mailbox --all-targets -- -D warnings
cargo fmt -p fgos-mailbox-core -p fgos-mailbox -- --check
```

Green on fresh main. Commit `feat(mailbox): render the send answer, refusals and the inbox listing from the frame contract`; census; sync; push.

## Risk

- The wording is a first draft: V6 measures the frame wording with real models; these sentences go to the sender, whose behaviour after a refusal was measured once (spec §5.3: 14 of 14 forced refusals ended with no retry, with the "do not retry" text present). Changing the wording later edits only the contract.
