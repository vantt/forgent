---
phase: 3
title: "Core: Stop-block count; same-head and refused registrations change nothing; body-missing frame"
status: pending
priority: P2
effort: "3h"
dependencies: [1]
---

# Phase 3: Core: Stop-block count; same-head and refused registrations change nothing; body-missing frame

## Goal

This phase makes three small changes to `fgos-mailbox-core`. All three are needed so the hook can be correct and cheap.

1. **Stop-block count.** Each binding carries the number of consecutive Stop blocks that were written and finished, plus one mutator that records the outcome of a Stop (plan decisions 7 and 8). The bound itself stays out of the core.
2. **Registrations that change nothing.**
   - A registration by the same head makes no mutation. Today it sets `last_seen`.
   - A refused registration (`Conflict`, `Deferred`, `JudgementMismatch`, `KeyTooLong`) makes no mutation. Today `register` sweeps first, and the sweep moves `last_now` forward and may expire claims.

   Change 2 keeps row 2 of the four-row table in one place, the core (plan decision 5). It also keeps the hook's no-mail path free of writes. The red-team traced `register` sweeping before it refuses (`packages/mailbox/rust/core/src/registry.rs:134` before `:151-152`), and the same-head branch setting `last_seen` (`registry.rs:143-148`).

3. **A frame for a message whose body is missing** (plan decision 3). The contract `packages/mailbox/contracts/frame.v1.txt` gains a section `[message.body-missing]`, and the core gains `pub fn render_message_body_missing(item: &ClaimedItem, limits: &Limits) -> String`. That frame is the ordinary message frame with one fixed line in place of the gutter-prefixed body: "The text of this message could not be read; ask the sender to send it again." Its wording is measured with the rest of the frame at V6. All frame text stays in the contract, and the existing frame test (`tests/frame.rs`, which checks that every section exists) covers the new section.

## Files (all on the branch, crate `fgos-mailbox-core`)

- **`src/registry.rs`:**
  - `Binding` gains `pub stop_blocks: u32`, a required field with no serde default. `create` sets it to 0, and the `Dead` takeover sets it to 0.
  - In `register`, the order becomes:
    1. the key-length check;
    2. the judgement-mismatch check;
    3. if `judged.same_head`, return `Refreshed` with no mutation;
    4. if `Alive`, return `Conflict`; if `Unknown`, return `Deferred`;
    5. only then, `sweep` and create or replace.
  - `last_seen` is set only by create and by replace. Keep the field: it records "registered or replaced at", and V2 pruning may read it.
- **`src/delivery.rs`:**
  - Add `impl MailboxState { pub fn note_stop(&mut self, key: &WriterKey, generation: Generation, blocked: bool) -> bool }`.
  - It changes nothing and returns `false` when no binding exists, or when `generation` is not the binding's current one.
  - `blocked == true` adds 1, saturating. `blocked == false` sets the count to 0.
  - The return value says whether anything changed, so a pass when the count is already 0 reports no change.
- **`src/state.rs`:** `SNAPSHOT_SCHEMA_VERSION` goes from 1 to 2.
- **`src/frame.rs` and `packages/mailbox/contracts/frame.v1.txt`:** add the `[message.body-missing]` section and `render_message_body_missing`; export the function from `src/lib.rs`. It reuses `fill`, `escape_header` and the `[message.reply]` logic of `render_message`. Do not copy them.

## Tests first

| Test | File | Behaviour | Proof status |
|---|---|---|---|
| `a_blocked_stop_adds_one_and_a_passing_stop_returns_the_count_to_zero` | new `tests/stop_blocks.rs` | The count goes 0 → 1 → 2, and a pass sets it back to 0. A pass at 0 reports no change | new |
| `a_stop_noted_by_an_older_generation_changes_nothing` | `tests/stop_blocks.rs` | After a `Dead` takeover, `note_stop(key, gen1, true)` returns `false` and the state is unchanged | new |
| `a_takeover_starts_the_new_generation_with_no_blocks` | `tests/stop_blocks.rs` | A count of 2 on generation 1, then a `Dead` replacement, gives generation 2 with a count of 0 | new |
| `registering_the_same_head_again_changes_nothing_and_does_not_bump` | `tests/registry.rs` | **Replaces** `registering_the_same_head_again_refreshes_last_seen_and_does_not_bump` (`tests/registry.rs:42`). The outcome is `Refreshed` at generation 1, and the state equals the state before the call. The behaviour changed by plan decision 5, so the old assertion `last_seen == t(200)` is retired | rewritten: the behaviour itself changed |
| `a_clock_that_steps_back_is_treated_as_the_last_time_seen` | `tests/registry.rs:276` | **Retargeted.** A same-head registration no longer moves `last_now`. The test now steps the clock back across a `Dead` takeover (a registration that does write) and asserts `last_seen == last_now == t(1000)` | retargeted. Its behaviour ("a clock that steps back never moves time backwards") still exists, on the writing path |
| `a_conflicting_or_deferred_registration_changes_nothing_not_even_the_clock` | `tests/registry.rs` | A pending in-flight claim whose deadline has passed, then a `Conflict` registration and a `Deferred` registration at a later `now`, leave the state equal to before (no sweep, no `last_now` move) | new. It extends the existing conflict and deferred tests' "binding untouched" to the whole state |
| `a_message_whose_body_is_missing_gets_the_contract_line_and_keeps_its_header_and_reply` | `tests/frame.rs` | The frame keeps the header and the reply line of `render_message`, and has the body-missing line in place of the body. A hostile `from_label` is still escaped | new frame section |
| extend `a_state_with_every_field_populated_survives_a_json_round_trip_from_an_owned_string_unchanged` | `tests/snapshot.rs` | `populated_state()` sets a non-zero `stop_blocks` | V1 rule: every phase that adds a field extends this test |

## Steps

1. Sync (plan.md).
2. Write and rewrite the tests (red).
3. Implement, and bump the schema version. Run `cargo test --locked -p fgos-mailbox-core`; it must be green.
4. Run `cargo clippy --locked -p fgos-mailbox-core --all-targets -- -D warnings`.
5. Regenerate the census. Commit `feat(mailbox): count Stop blocks per head and keep same-head and refused registrations write-free`. Sync, run the proof, push.

## Deviations (implementation lead, 2026-10-22, against V1 as closed at `35079dce3`)

V1's final review changed the core API this phase was written against:

- **One render door instead of a third entry point.** V1 replaced `render_message`/`render_notice` with one `render(item, body: &str, limits)` over `ClaimedItem { what: ClaimedWhat::Mail | Notice }` (review M6). Instead of adding `render_message_body_missing`, `render`'s body becomes `Option<&str>`: `None` renders the `[message.body-missing]` section in place of the gutter-prefixed body, which is exactly the shape M6 proposed. A notice ignores the body. The frame test is extended on that door. Phase 6 then calls `render(item, bodies(&item.id).as_deref(), limits)` for every item.
- **Schema version stays 1.** V1 retired `Header.kind` without a bump because no version-1 snapshot was ever persisted and V2 is not built (spec §17, 2026-10-22). The same holds for `Binding.stop_blocks`: nothing outside tests ever wrote a snapshot. `stop_blocks` is a required field and `Binding` denies unknown fields, so a snapshot written before this change is refused at deserialization rather than misread. The acceptance line "a version-1 snapshot is refused as `UnsupportedOlder`" is therefore retired; the round-trip test carries the new field. V2 freezes version 1 when it first persists.
- **`register` order.** V1 added `drop_generation_records` on the `Dead` takeover and the key alphabet check in `WriterKey::new`. The new order is: key length, judgement mismatch, same head (no mutation), `Alive` → `Conflict`, `Unknown` → `Deferred`, and only then `sweep` and create or replace. The takeover also resets `stop_blocks` to 0.
- **Test keys** follow the writer-key alphabet `[A-Za-z0-9._-]` (V1 L3).
- **Body-missing line placement.** The line is contract text, so it takes the place of `{{body}}` without the body gutter; its only filled value is `{{from}}`, escaped like every header value. Its wording: "The text of this message could not be read; ask {{from}} to send it again."
- **Result.** `cargo test --locked -p fgos-mailbox-core`: 92 passed (87 after phase 1, plus the three `stop_blocks` tests, the conflict-or-deferred test and the body-missing frame test; the same-head test was rewritten in place and the clock test retargeted).

## Acceptance criteria

- The new, rewritten and retargeted tests are green.
- The commit message names the retired assertion and the test that now owns the behaviour (design principle 8).
- An old version-1 snapshot is refused as `UnsupportedOlder`.
- The core holds no `stopBlock` number: `rg -n 'stop_block|stopBlock' packages/mailbox/rust/core/src` finds only the field and `note_stop`.

## Risks

- This changes a row of the signed registration table (spec §5.1, row 2). The meaning is unchanged: the same head, no bump. Only the side effect on `last_seen` is dropped. Phase 7 amends the spec on the branch and records the change as an agent decision, not an owner one.
- V2 may already be planned against schema version 1. Phase 7 states the bump in the hand-off.
