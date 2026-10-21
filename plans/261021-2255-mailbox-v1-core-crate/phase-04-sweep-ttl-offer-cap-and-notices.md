---
phase: 4
title: "Lazy sweep: deadlines, offer cap, record TTL, notices lane, retention"
status: done
priority: P2
effort: "4h"
dependencies: [3]
---

# Phase 4: Lazy sweep: offer cap, record TTL, notices lane, retention, bounded counters

<!-- Updated: red-team 2026-10-21 - no binding pruning (decision 11, owner Q2); notices addressed to the sender's generation with TTL and a separate dedupe record (decision 9); two-tier counters (decision 14); body GC query moved to V2 (decision 16); offer-cap test starts near the cap -->

## Goal

With no daemon, whichever operation runs next applies every time rule: a message offered too often or pending too long becomes `refused` and its sender gets at most one notice per reason per window; old headers and bodies go away. The bounded counter type that phase 5 uses for refusals is introduced here (notices are its first user).

## Context links

- Spec §5.2 "The deadline is evaluated lazily" (line 243), §5.3 rows "Record TTL", "Redelivery" and the notices paragraph (line 274), §5.1 ("a stale instruction is never replayed into a stranger", line 176), §9 signal 2, §10 rows "Receiver process died", "A message is offered twice".
- Plan decisions 5, 9, 10, 11, 14 and owner questions Q1 (notices cap and window, provisional A) and Q2 (no pruning in V1).

## Start

Run the branch sync (plan.md § "Branch sync rule") and confirm the previous phases' tests are green on top of it before writing a new test.

## Design

- `src/counters.rs`:
  - `totals: BTreeMap<CounterReason, u64>` where `CounterReason` is a serde enum (kebab-case) with one variant per refusal and notice reason. It holds at most one entry per variant, is never evicted, and is what `status` (V7) reads for rates.
  - `by_party: BTreeMap<PartyKey, Party { count: u64, last_at: Timestamp }>`, where `PartyKey` is a `String` newtype rendered canonically as `<reason>|<from>|<to>`. A sender with no head is written as `unregistered` (decision 12). `bump` inserts or increments, then evicts the least recently bumped entry while `len > counters.maxKeys`. This is the per-sender and per-pair attribution of spec §9 signal 2, best effort under the bound.
  - `BoundedCounters::bump(reason, from, to, now, &Limits)` updates both tiers.
- `src/notices.rs`: `Notice { id, to: WriterKey, to_generation: Generation, reason: NoticeReason { RecordTtl, OfferCap }, about: MessageId, about_to: ShortName, created_at, state: Recorded | InFlight { token, deadline, generation } }`.
  - **Who gets it.** The addressee is the refused message's `(from, from_generation)`, never the sender's current generation.
  - **When it is created.** The following rules apply in order:
    1. The sender has no binding, or its current generation differs from `from_generation`. No notice is created; bump `notice-undeliverable`. A notice never reaches a different process (spec line 176).
    2. `notice_last[(to, reason)]` is within `notices.windowSec`. No notice is created; bump `notice-suppressed`. `notice_last` is a separate map with key `<to>|<reason>` (a `String` newtype). It is updated whenever a notice is created and is unaffected by delivery or removal. Its entries leave once they are older than the window.
    3. Otherwise the notice is appended and `notice_last` is set. If the address now holds more than `notices.cap` notices, the oldest is dropped and `notice-dropped` is bumped.
  - **What a notice never does.** Notices are never counted by the loop guard. They never wake anyone. They can never be replied to: phase 5 check 3 refuses any id that is not an offered message. They are never offered at `Stop` (phase 6).
- `src/sweep.rs` (completed). `sweep(&mut self, now, &Limits)` applies these steps in order:
  1. An `InFlight` message past its deadline becomes `Refused(OfferCap)` with a notice when `offers >= maxOffers`, and `Recorded` otherwise.
  2. An `InFlight` notice past its deadline is removed and bumps `notice-undelivered`. It is never offered again.
  3. A notice is removed and bumps `notice-expired` when it has waited longer than `record.ttlSec`, or when its `to_generation` is no longer its addressee's current generation.
  4. A `Recorded` message with `now - recorded_at > record.ttlSec` becomes `Refused(RecordTtl)` with a notice. This is also how mail for an older generation finally leaves (spec §10).
  5. For an `Offered` or `Refused` message:
     - its body reference is dropped (`body_kept = false`) `record.bodyRetentionSec` after `changed_at`;
     - its header is removed `max(loop.windowSec, record.ttlSec, record.bodyRetentionSec)` after `changed_at` (plan decision 5).
  6. `notice_last` entries older than `notices.windowSec` are removed.
- **Calls.** `send`, `claim` and `register` call `sweep` first (plan decision 10). Bindings are never removed in V1 (decision 11, owner Q2).
- **Notices in `claim`.** `claim` (phase 3) also takes this address's `Recorded` notices for its current generation at a `Step` checkpoint, using the same token. `finish` removes an offered notice.

## Tests before (red)

`tests/sweep.rs` (owns: time rules, notices lane, retention):

1. *an in-flight message whose deadline passes at the last allowed offer is refused with one notice to its sender*. Start from a message already offered `maxOffers − 1` times. Phase 3's duplicate-window test owns the return to `recorded`; this test owns the cap.
2. *a recorded message older than the record TTL is refused with a notice*.
3. *a refused message whose sender has no head, or a newer generation, creates no notice and counts it*.
4. *a second notice of the same reason to the same sender inside the window is suppressed even after the first was offered and finished*.
5. *the notices lane drops its oldest notice when it overflows*.
6. *an unfinished notice is never offered again, and an undelivered notice expires after the record TTL*.
7. *the body reference goes after body retention and the header after the longest window*.

`tests/counters.rs` (owns: the bound and the totals):

8. *the per-party counters keep at most maxKeys entries and evict the least recently bumped, while the per-reason totals are never evicted*.

`tests/snapshot.rs`: extend phase 2's round-trip state with notices, `notice_last` and both counter tiers (no new test).

## Refactor

Each sweep step is one private function. `sweep` lists them in order so the whole order is readable in one place.

## Tests after / regression gate

```bash
git fetch origin && git merge --no-edit origin/main   # branch sync rule (plan.md); proof counts only on a fresh main
cargo test -p fgos-mailbox-core --locked
cargo clippy -p fgos-mailbox-core --all-targets --locked -- -D warnings
cargo fmt -p fgos-mailbox-core -- --check
node scripts/git-one-door-scan.mjs --write-census
```

## Acceptance criteria

- The 8 new tests pass and the extended snapshot test passes. Earlier tests still pass.
- No sweep step reads a field outside `MailboxState` and `Limits`. No step removes a binding.
- One commit: `feat(mailbox): sweep deadlines, record TTL and retention lazily with a bounded notices lane`. Push it to the branch.

## Risks

- **Dead heads' bindings are never retired in V1.** Owner question Q2 is answered before V2, where liveness is available.
- **Notices for a sender with no head (the runner, the CLI) are dropped by design and counted.** `status` (V7) shows the count.

## Implementation notes (2026-10-21)

- Deviations (smallest correct fix):
  - `sweep` takes `&mut dyn IdSource` (`sweep(now, &Limits, ids)`): a notice gets a fresh id, and plan decision 2 forbids minting ids anywhere but `IdSource`. `send`, `claim` and `register` already hold one.
  - A notice's reason is the existing `RefusalReason` (same two variants as the planned `NoticeReason`; one type, not two). `Notice.about_to` is the recipient's `WriterKey`; the claim turns it into a label (`ClaimedItem.notice.about_to`), so the counters can attribute notice events to the same accounting identities as refusals.
  - `ClaimedItem` gains `notice: Option<NoticeFacts { reason, about, about_to }>` (`Some` exactly for a notice) so phase 7 can render a notice from a `ClaimedItem` as planned. A notice's `from_label` is `mailbox`, which no head can take (every short name is `<project>-<cli>-<suffix>`).
  - Notices are claimed only at `Step` already in this phase (the plan states it here; phase 6 narrows `Stop` for messages).
  - The sweep's refusals (`record-ttl`, `offer-cap`) are counted too: they are refusal reasons and spec §9 signal 2 counts refusals per reason.
  - `register` runs the sweep after the judgement check, so a mismatched judgement still changes nothing (phase 2 test 6).
  - `BoundedCounters` orders eviction by a bump sequence number, so "least recently bumped" stays exact when timestamps tie.
  - The account helper (`MailboxState::account`, shared `unregistered` identity of decision 12) lands here because the counters need it; phase 5 reuses it.
- Test 7 parts the two retention rules with ordinary configuration: `record.bodyRetentionSec` set to the contract's `loop.windowSec` value, so the body goes before the header; a second half checks that with the contract values both go at the same instant.
