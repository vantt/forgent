---
phase: 6
title: "Q2 pruning, the dead-binding consequence and the handle bound"
status: completed
depends_on: [5]
---

# Phase 6: Q2 pruning, the dead-binding consequence and the handle bound

## Context

- Owner Q2 (2026-10-21), spec §17: prune only when the head is judged `Dead`, idle past `record.ttlSec`, and no header or notice names it; pruning calls `forget_key`; a later registration starts at generation 1.
- Core: `MailboxState::forget_key` (`core/src/forget.rs:26-38`), `Binding.{last_seen, last_drain_at, head, handle}` (`core/src/registry.rs:31-55`), `RegisterRefusal` (`:84-121`), `register` (`:129`).
- Store: `head::judge_stored` (`store/src/head.rs:22-41`) holds the only liveness judgement; `judge_here` (`packages/process/rust/src/facts.rs:242`).
- Plan decisions 3, 9, 10; owner question Q2 (provisional default: keep resolution as is).
- V1 risks: "dead bindings stay addressable" and the review's M3 (`key@1` reuse; closed in V1 by `forget_key`) and the request to bound `head` and `handle`.

## Requirements

1. `head::stored_liveness(&Binding) -> Liveness` extracted from `judge_stored`; `judge_stored` calls it (no second judgement).
2. `src/record/prune.rs`: `prune(state, now, limits) -> Vec<WriterKey>`: for each binding with `stored_liveness == Dead`, idle per decision 9, and named by no header (`from`/`to`) and no notice (`to`/`about_to`), call `forget_key`. Called by the hold only when the bytes already differ (decision 3), before the final serialization.
3. Core: `RegisterRefusal::HandleTooLong` (code `handle-too-long`) when `handle` is longer than `frame.max_header_chars` characters, checked with the key bound before any change; the `limits.v1.json` meaning text of `mailbox.frame.maxHeaderChars` gains "and of a binding's handle".

## Tests first

`tests/record_prune.rs` (owning file for pruning):

| # | Test name | Asserts |
|---|---|---|
| 1 | `a dead idle binding that nothing names is forgotten by the next writing hold` | binding of a killed child (record taken as in phase 5 test 4), `now` past `last_seen + record.ttlSec`, no headers; a writing hold (another head's registration) removes it; `binding(key)` is `None`; registering the key again in a later hold gives `Created` at `Generation::FIRST` (one wiring assertion: that every record of the key goes is owned by the core's `forgetting_a_key_removes_every_record_of_it_and_a_later_registration_starts_clean_at_generation_1`, `core/tests/registry.rs:430`) <!-- Updated: Red Team --> |
| 3 | `a live binding is never pruned however idle` | the head is the test process itself; nothing removed |
| 4 | `a dead binding still named by a header is kept` | one retained header from it; kept until the header retires; pruned by the first writing hold after the header horizon |
| 5 | `a dead binding not yet idle is kept` | `now` within `record.ttlSec` |
| 6 | `a hold that writes nothing prunes nothing` | prunable binding present; a no-mail claim hold leaves the snapshot bytes unchanged |
| 7 | `a dead binding stays addressable while a header names it` | documents the Q2 consequence (owner Q2 default) as a store fact only: a send to the dead binding's name is recorded (not refused as unknown) and the binding survives the writing hold. The later TTL refusal is the core's (`core/tests/sweep.rs:53`), not repeated here <!-- Updated: Red Team -->. If the owner picks option (b), this test changes |

`core/tests/registry.rs` (owning file for registration), one new case:

| 8 | `a handle longer than the header bound is refused before any change` | `register` with a handle of `max_header_chars + 1` chars returns `HandleTooLong`; state equal to before; exactly `max_header_chars` is accepted |

## Steps

1. Test 8 red; core change; green (`cargo test -p fgos-mailbox-core`).
2. Extract `stored_liveness`; V3's `tests/head.rs` stays green unchanged.
3. Tests 1-7 red; implement `prune` and its call in the hold; green.
4. Census, commit `feat(mailbox): prune dead idle bindings under the owner's rule and bound the handle`.

## Gates

As phase 2, plus `cargo test -p fgos-mailbox-core`.

## Done when

All seven tests are green on a fresh main merge.

## Risk and rollback

- Pruning judges every binding on writing holds: phase 7 measures its cost with many dead bindings. If it is large, record it for the owner; do not add a cadence key (a new number).

## API drift

None (main `636df9d87`, unchanged since phase 4).

## Owner decision Q2 option B (2026-10-22), applied here

It replaces the provisional default (a) and planned test 7 ("a dead binding stays addressable while a header names it"):

- Core: `SendRequest` gains `dead_keys: BTreeSet<WriterKey>`. Name resolution at `send` (the recipient and the label a refusal is counted under) skips those bindings, both as matches and as candidates. `MailboxState::resolve(query)` stays and delegates to the same implementation with an empty set.
- Store: `Record::send` replaces `dead_keys` with its own judgement, made inside the hold: every binding judged through `head::stored_liveness`.
- Owning proof (core): `tests/names.rs` :: `a_name_whose_only_binding_is_judged_dead_is_unknown_and_a_shared_prefix_resolves_to_the_live_head`.
- Wiring proof (store): `tests/record_prune.rs` :: `a_send_never_resolves_a_name_to_a_binding_the_store_judges_dead`, which replaces planned test 7.
- Recorded in branch spec §17.

## Deviations

- `hold` and `hold_observed` now take `now` and `limits` (deferred from phase 2 as recorded there): `hold(wait, now, limits, mutate)`. All 25 test call sites pass the time and limits their closure uses.
- `SendRequest` gained a field rather than `send` a parameter: four test constructors change instead of about 40 call sites, and the core stays pure.
- `head::stored_liveness` and the registering judgement share one private `liveness_of`. V3's `tests/head.rs` passes unchanged.
- The idle rule takes `max(last_seen, last_drain_at)`, and "named" means any retained header (`from`, `to`) or notice (`to`, `about_to`).
- The prune runs after the closure, only when the bytes already differ, and the snapshot is re-encoded only when something was forgotten.
- Order of work: `prune.rs` was written before `tests/record_prune.rs`, so those tests were green on their first run. Their proof that they bite is the mutants below. The two core tests (handle bound, Q2(b)) went red first.
- The dead head is a real `sleep` process, killed and reaped (`dead_head_record`, from phase 5).

## Proof

- `cargo test -p fgos-mailbox -p fgos-mailbox-core`: 184 passed. `tests/record_prune.rs` has 6 tests; the core gained 2.
- Mutants: 12 tried, 11 killed.
  - Killed (`record_prune`): no prune; the "named" rule ignored; the idle rule ignored or off by one; the liveness ignored; prune run before the no-write comparison; no dead keys passed to `send`.
  - Killed (core): the dead keys not skipped in resolution; the handle bound off by one in either direction.
  - Survived: ignoring notices in the "named" rule. It is equivalent under the contract values: a notice is about a refused message whose header names the same two keys and is kept 7 days, longer than any notice lives (at most `record.ttlSec`). The check stays because the owner's rule names notices.

## Later change

Review fixes H1, L1, L2, L3 (2026-10-22): exact names of dead heads are refused, not passed on; the prune's notice clause is removed and its last-drain clause proven; pruning keeps other heads' wake counts; a send judges liveness once. See phase 8, "Review fixes".
