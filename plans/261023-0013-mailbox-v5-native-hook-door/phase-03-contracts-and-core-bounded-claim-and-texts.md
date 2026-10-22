---
phase: 3
title: "Contracts and core: adapter facts, keys, size-bounded claim, new texts"
status: pending
priority: P1
effort: "5h"
dependencies: [2]
---

# Phase 3: Contracts and core

## Goal

Encode the measured facts and the new policy keys in the two contracts, and teach the pure core two things:

- to claim only what fits an output bound, computed from the worst case;
- to render the texts V5 adds.

## Context

- Plan decisions 5, 6, 11 and 12.
- The core (`packages/mailbox/rust/core`, crate `fgos-mailbox-core`, serde only) owns the claim (`MailboxState::claim`, `src/delivery.rs:387`) and every model-facing text (`src/frame.rs`, `src/report.rs`, rendered from `packages/mailbox/contracts/frame.v1.txt`).
- The store's `hook::drain::begin` (`packages/mailbox/rust/store/src/hook/drain.rs:157`) calls `state.claim(key, generation, checkpoint, now, limits, ids)`.
- All numbers come from phase 2's report table (e) or from spec §12. Write the report path into each value's `source` text.

## Tests before (write them first and watch them fail)

| File (owning proof) | New test, named by its behaviour |
|---|---|
| `packages/mailbox/rust/store/tests/fixtures_contract.rs` | `every_drained_cli_names_its_hook_topology_shell_head_executables_and_output_bound` (a `direct` entry has a non-empty `headExecutables` and `hookShell: null`; a `one-shell-hop` entry has an absolute `hookShell` path, which pins the accepted shell; `measuredOn` is a subset of `testedAgainst`) |
| same | `the_limits_contract_holds_the_breaker_and_p95_keys_with_their_sources` |
| `packages/mailbox/rust/core/tests/delivery.rs` | `a_step_claim_takes_messages_in_order_only_while_their_worst_case_frames_fit_the_bound` |
| same | `a_message_whose_worst_case_frame_alone_exceeds_the_bound_stays_recorded_and_is_counted_as_too_large` (and later, smaller ones are still claimed) |
| same | `a_stop_claim_and_a_plain_step_claim_are_not_limited_by_a_bound` |
| `packages/mailbox/rust/core/tests/frame.rs` | `the_worst_case_frame_size_is_never_smaller_than_the_rendered_frame_of_a_hostile_body` (property: bodies of only `&`, only `<`, only newlines, mixed, at `maxBodyBytes`; the rendered length ≤ the computed bound for each) |
| `packages/mailbox/rust/core/tests/report.rs` | `the_too_large_pointer_names_the_count_and_the_claim_command`, `the_untested_and_unknown_version_clauses_follow_the_turn_sentence`, `the_record_error_text_says_try_once_more_later_and_do_not_loop` (review L2: `[record.error]` exists at `frame.v1.txt:68`; extend its wording only if it lacks the no-loop sentence) |

## Implementation

1. **`packages/mailbox/contracts/adapters.v1.json`.**
   - Add the `hookFacts` object of plan decision 5: one entry per drained CLI (`claude`, `codex`), with the four fields from phase 2 table (e) and `measuredOn` (the versions phase 2 ran). A later re-recording of a new version must re-measure these facts, and the recorder's report says so.
   - Add a top-level `"source"` line naming the phase 2 report.
   - Update the `description` text.
   - The store's `adapters::TestedClis` keeps the version list and gains a typed accessor `facts(cli) -> Option<&AdapterFacts>`. Exact shape: `AdapterFacts { topology, hook_shell: Option<PathBuf>, head_executables: Vec<String>, post_tool_use_max_bytes: Option<u64> }`.
   - Parsing rejects an unknown field, a `measuredOn` version missing from `testedAgainst`, a drained CLI without `hookFacts`, a `direct` entry without `headExecutables`, and a `one-shell-hop` entry without an absolute `hookShell`.
2. **`packages/mailbox/contracts/limits.v1.json`.**
   - Add `mailbox.hook.breaker.failures` (3, reader `hook`) and `mailbox.hook.breaker.pauseSec` (60, reader `hook`), both quoted from spec §12 and marked placeholders.
   - Add `mailbox.hook.p95TargetMs` (50, reader `harness`, owner 2026-10-20).
   - The two breaker keys sit under `mailbox.hook.breaker.*`, so they belong **inside** `HookCallLimits` (the `hook` object, `deny_unknown_fields` at `store/src/hook/limits.rs:31`) as `breaker: BreakerLimits { failures, pause_sec }`, not beside it.
   - The `harness` key has no Rust reader. The phase 4 loader drops every key whose reader is not `core` or `hook` **before** deserialising, so `p95TargetMs` never reaches `HookCallLimits`. Test support (`core/tests/common/support.rs:19-50`) gets the same filter.
3. **Core: worst-case frame size.**
   - Add `frame::worst_case_len(item_header, limits) -> usize`. It is the length of the filled `[message]` + `[message.reply]` sections with every header value at its escaped length, plus `5 × body_bytes + 2 × (body_bytes + 1)`: entity growth, plus a gutter `| ` on every line, and a body of only newlines doubles its line count.
   - Prove the inequality with the property test above. Do not derive a tighter formula without the test.
4. **Core: bounded claim, one claim door.** `MailboxState::claim` keeps its signature: it has 51 call sites, 4 outside tests (`store/src/hook/drain.rs:233`, `store/examples/mailbox-record-cost.rs:85, :431, :463`). `Checkpoint` (`core/src/delivery.rs:150`) gains a third variant, `BoundedStep(u64)`.
   - **Every equality test on `Checkpoint` changes first** (red team RT11), because `BoundedStep` must behave like `Step` for eligibility:
     - `delivery.rs:258` (`notice_eligible`, `== Checkpoint::Step`);
     - `delivery.rs:276` (`eligible`, `== Checkpoint::Step || effective_wake`);
     - `store/src/hook/drain.rs:236` and `:251` (`== Checkpoint::Stop`).

     They become methods: `Checkpoint::takes_all_pending()` (true for `Step` and `BoundedStep`) and `Checkpoint::is_stop()`. Grep `Checkpoint::` again after the change: no `==` on it remains.
   - `Step` keeps today's meaning, every pending item. `inbox --claim` and all existing tests use it.
   - `BoundedStep(n)` walks eligible items in today's order and **skips** an item whose `worst_case_len` alone exceeds `n − pointer_len` (counted in `too_large`), continuing with later items. It stops when the next fitting item would push the running sum (plus joining blank lines) past `n − pointer_len`, where `pointer_len` is the rendered length of `[message.too-large-for-channel]` at its largest count. Unclaimed items stay `recorded`: no offer count change, no state change.
   - `Claim` gains `too_large: u32`.
   - Notices count like messages, with their own section length.
   - `Stop` is never bounded: the `Stop` reason is not truncated (V4 L3b).
   - **Extra tests:** `a_notice_is_claimed_under_a_bounded_step`; `a_too_large_oldest_message_does_not_block_smaller_later_ones`; `the_pointer_line_fits_inside_the_bound`.
5. **Core: texts.** Add `[message.too-large-for-channel]`, `[report.untested-version]` and `[report.version-unknown]` to `frame.v1.txt`. Render them:
   - `frame::too_large_pointer(count)`;
   - `delivery_report(outcome, version: VersionClause, limits)`, with `VersionClause::{Tested, Untested(String), Unknown}`. Every existing caller passes `Tested` until phase 4 wires the real value.

   These sections are additive, so `frame.v1.txt` keeps version 1. `tests/frame.rs`'s section list is extended.
6. **Store: `begin` passes the bound.** At `PostToolUse` it passes `Checkpoint::BoundedStep(facts.post_tool_use_max_bytes)`. A CLI with no measured bound is quiet with the new reason `QuietReason::NoStepBound` before it claims anything at a step, so it prints neither mail nor a pointer; its mail waits for Stop or `inbox --claim`. A Stop passes `Checkpoint::Stop` as today.
   - `render_reply` appends the pointer line when `too_large > 0` and at least one item was claimed.
   - When `too_large > 0` and nothing was claimed, the reply is the pointer line alone, in the CLI's shape. There is no finish ticket, and the snapshot is unchanged except for the existing `last_drain_at` rule.
   - Owning proof in `tests/hook_payloads.rs`: one new case per behaviour, using the recorded Claude and Codex `PostToolUse` fixtures.
7. **Refactor:** none. The new variant is additive; only `begin` uses it.

## Tests after

- `cargo test -p fgos-mailbox-core` and `cargo test -p fgos-mailbox --test fixtures_contract --test hook_payloads` are green.
- No existing assertion is weakened. `hook_payloads.rs` cases that deliver at a step now run with the recorded bound, and their small fixture bodies fit it; if one does not, the test says so and uses a body that fits, never a larger bound.

## Regression gate

```bash
cd /home/vantt/projects/forgent-mailbox || exit 1
CARGO_BUILD_JOBS=4 timeout 1800 cargo test --locked -p fgos-mailbox-core -p fgos-mailbox -- --test-threads=4
echo "exit=$?"
cargo clippy --locked -p fgos-mailbox-core -p fgos-mailbox --all-targets -- -D warnings && cargo fmt -p fgos-mailbox-core -p fgos-mailbox -- --check
```

## Shared files

None. The changes stay inside `packages/mailbox`. The census is regenerated for the changed `.rs` files.

## Risks

- **The pointer line repeats at every tool call** while an oversize message waits, until the agent runs `inbox --claim`. Stopping that repeat would need per-message state in the snapshot, which means a schema change. The repeat is accepted, stated in spec §6.1, and observed in phase 8 L1 if the live content triggers it (it should not: benign content stays small).

- **A smaller bound starves a long message at steps.** By design, such a message reaches the model through Stop (when it has effective wake) or through `inbox --claim` after the pointer line. A `wake:false` message larger than the bound waits for the agent to follow the pointer. Phase 9 writes this into spec §6.1.
- **The worst-case formula is conservative.** At the measured bound (around 10–13 KB), a body of up to roughly 1.5–2 KB always fits. Typical peer messages are far smaller (V4 demos: under 300 bytes). This is noted, not tuned.

## Todo

- [ ] Write the failing tests
- [ ] Update the contracts and parse them
- [ ] Add the core worst-case size and the bounded claim
- [ ] Add the texts
- [ ] Pass the bound in `begin` and add the pointer reply
- [ ] Run the gate; regenerate the census; sync and push
