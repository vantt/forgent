---
phase: 5
title: "Send policies and bounded refusal counters"
status: done
priority: P2
effort: "5h"
dependencies: [4]
---

# Phase 5: Send policies and bounded refusal counters

<!-- Updated: red-team 2026-10-21 - reply link always derived (decision 6); lifetime cap counts attempts (decision 3); shared unregistered sender bounds every per-sender map (decision 12, owner Q3); queue counts only the current generation (decision 13); flood test asserts the serialised size -->

## Goal

`send` enforces every refusal policy of spec §5.3 in one fixed order and derives the reply link and the chain depth itself. A refused message is never recorded. Each refusal is counted in the bounded counters, and every per-sender record is bounded, so neither a loop, a flood of refusals, nor a rotating `from` can grow the snapshot without bound.

## Context links

- Spec §5.1 ("`from` is attribution, not authority", line 194), §5.3 table and "What actually brakes a loop" (lines 255, 259-274), §5.4 reply link (line 278), §10 rows "Two agents answer each other without end", "A flood fills the queue", "A refused send floods the record", §11 core suite (the A, B, C, A counterexample; "a flood of refused sends leaves the snapshot size bounded").
- Plan decisions 3, 4, 6, 12, 13 and owner question Q3.

## Start

Run the branch sync (plan.md § "Branch sync rule") and confirm the previous phases' tests are green on top of it before writing a new test.

## Design (`src/policy.rs`, called from `send`)

**Accounting identity.** `account(from)` returns the sender's key when `from` names a binding. Otherwise it returns the fixed identity `unregistered` (decision 12). The header still records the real `from` for attribution. The budget, the loop guard, the per-sender share, the counters' party key and (phase 6) the exchange all use the accounting identity, so every per-sender map holds at most one entry per binding plus one.

**Before any check**, the attempt is appended to `budget[account]`, a `VecDeque<Timestamp>` of at most `session.budget + 1` entries. Entries older than `human.fallbackWindowSec` are dropped, so refused attempts count (spec §5.3). The attempt also increments `lifetime[account@generation]` for a registered sender. A sender with no head is exempt from the lifetime caps under owner question Q3, provisional A. `lifetime` uses a `String` newtype key `<key>@<generation>` and is never reset; a new generation simply has a new key.

The checks then run in order. The first check that fails wins: nothing is recorded, and `counters.bump(reason, account, resolved_to)` runs.

| # | Check | Refusal `code()` |
|---|---|---|
| 1 | `to` is a group (phase 2) | `group` |
| 2 | `to` is unknown or ambiguous (phase 2) | `unknown-name` / `ambiguous-name` |
| 3 | the caller's `reply_to` names no `Offered` `Message` sent by the recipient to the sender (a notice id never qualifies) | `reply-to-not-offered` |
| 4 | `body.len() > maxBodyBytes` (bytes, UTF-8) | `too-large` |
| 5 | attempts by `account` in the last `human.fallbackWindowSec` > `session.budget` | `session-budget` |
| 6 | registered sender: attempts by `(from, from_generation)` > `session.lifetimeCap` (the current attempt is already counted; never reset) | `lifetime-cap` |
| 7 | derived depth > `chain.maxDepth` | `too-deep` |
| 8 | `Message` headers from `account` to `to` with `recorded_at` inside `loop.windowSec` ≥ `loop.maxPerWindow`; no sender is exempt | `loop` |
| 9 | pending (`Recorded` + `InFlight`) to the recipient's **current generation** ≥ `queue.cap` | `queue-full` |
| 10 | pending from `account` to the recipient's current generation ≥ `queue.perSender` | `sender-share-full` |

**Reply link, always derived** (spec §5.4, decision 6). The parent is the most recently offered, unanswered `Message` from the recipient to the sender, if one exists. Then `depth = parent.depth + 1`, or 0 when there is no parent. When a message is recorded, its parent's `answered` becomes true. The caller's hint is validated by check 3 and stored as `reply_to_hint` for display only. It never selects the parent and never changes the depth. Depth is stored when the message is appended, so removing an ancestor's header later never changes it.

**Refusals.** `Refusal` gains these variants. Each carries what the verb prints (the cap, the candidates) and its `code()`. The text intent "do not retry; ask your user" is rendered by the verb at V5, not stored. **A refusal changes state** (the budget entry, the lifetime count and the counters). The store installs the snapshot after `Err` as well as after `Ok` (plan "Architecture").

## Tests before (red), owning file `tests/policies.rs`

1. *a body at the size cap is recorded and one byte more is refused, recording nothing*.
2. *a reply is linked to the recipient's last offered unanswered message even when the caller omits reply_to*. The reply gets depth 1 and the parent is marked answered; the next fresh send gets depth 0.
3. *a reply_to hint is refused unless it names a message the recipient offered to the sender, and a valid hint never lowers the derived depth*. The hint cases are: one that was not offered, one naming a notice, and one naming an older answered message at depth 0 while the derived parent is at depth 5. In the last case the new message has depth 6.
4. *a linked chain is refused one step past the depth cap*. Depths 0..=maxDepth are recorded and the next message is refused `too-deep`.
5. *refused attempts count toward the session budget and the window frees it again*.
6. *the lifetime cap counts refused attempts, is never reset by time, and a new sender generation starts a new count*.
7. *the loop guard refuses the next message between one ordered pair inside the window, for every sender*. A sender with no head is included, and senders with no head that rotate their `from` share one guard.
8. *a full queue refuses the newest message and keeps the old ones; one sender cannot take more than its share; leftover mail for a replaced generation does not count*.
9. *a flood of refused sends from rotating identities leaves the snapshot size bounded*. Run 10 000 refused sends with 10 000 distinct `from` values and a mix of reasons. Assert that the length of `serde_json::to_vec(&state)` is at most the length measured after the first 100 refusals plus a fixed margin, that no header was added, and that the per-reason totals equal 10 000. Phase 4 test 8 owns the eviction rule; this test owns the spec §11 property "a flood of refused sends leaves the snapshot size bounded".
10. *the A, B, C, A cycle keeps depth 0, never trips the loop guard and is stopped by a lifetime cap*. This is the spec §11 counterexample with spec values:
    - three registered heads send A→B, B→C, C→A;
    - each hop is a fresh `wake:false` message sent 60 s after the previous one;
    - each recipient claims and finishes before its own next send.

    Assert depth 0 on every recorded message and zero `loop` and `session-budget` refusals. Assert that the first refusal is A's send number `lifetimeCap + 1`, which is message number `3 × lifetimeCap + 1` overall (601 with the §12 value), with code `lifetime-cap`. A faster cycle is stopped by the loop guard instead; test 7 owns that behaviour, so it is not repeated here.

`tests/snapshot.rs`: extend the round-trip state with `budget`, `lifetime` and `answered`/`reply_to_hint` (no new test).

## Refactor

`send` reads as: sweep → account → count attempt → `policy::check(...)?` → derive link → record → (phase 6) effective wake. Each numbered check is one small function in `policy.rs`.

## Tests after / regression gate

```bash
git fetch origin && git merge --no-edit origin/main   # branch sync rule (plan.md); proof counts only on a fresh main
cargo test -p fgos-mailbox-core --locked
cargo clippy -p fgos-mailbox-core --all-targets --locked -- -D warnings
cargo fmt -p fgos-mailbox-core -- --check
node scripts/git-one-door-scan.mjs --write-census
```

## Acceptance criteria

- The 10 new tests pass and earlier tests pass. Phase 3's test 10 already asserts "no header added", so the budget and counter changes do not affect it.
- No refusal path appends a header, notice or body reference.
- The order of checks in the code matches the table above and plan decision 4.
- One commit: `feat(mailbox): enforce size, depth, budget, lifetime, loop and queue policies at send`. Push it to the branch.

## Risks

- **The check order decides which reason a sender sees.** The order is fixed here and recorded in the spec in phase 8 so the verb text at V5 matches.
- **Senders with no head share one budget.** The runner and the CLI can therefore crowd each other out. This is accepted for the first slice, because no consumer uses them yet (spec §16 Q3). It is revisited with owner question Q3.
- **Test 10 runs about 600 sends.** It must finish in under a second, with no sleeps.

## Implementation notes (2026-10-21)

- Deviations (smallest correct fix):
  - The accounting identity is a `String` newtype `Account` (it keys the `budget` map); `LifetimeKey` is the `<key>@<generation>` newtype.
  - A refusal at checks 1-2 is counted under the recipient label `unresolved`, never the typed text, which has no length bound and would let a flood of long names grow the counters.
  - When two candidate parents were offered at the same instant, the later one in recording order is the parent (`(offered at, position)` maximum).
  - Phase 4's notices-overflow test sent eleven pending messages from one sender to one recipient, which the queue share (check 10) now refuses at the eleventh. Its fixture now spreads the messages over two recipients; what it asserts is unchanged.
  - The flood test's margin is 128 bytes: only decimal digits may grow (the per-reason totals and the times held in the budget window and the counters).
- Refusal codes and the check order match the table above and plan decision 4; `Refusal::reason()` maps each to its `CounterReason`.
