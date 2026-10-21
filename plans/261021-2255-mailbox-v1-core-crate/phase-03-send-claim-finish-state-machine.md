---
phase: 3
title: "Send (plain), claim, emit, finish, inbox view"
status: done
priority: P2
effort: "4h"
dependencies: [2]
---

# Phase 3: Send (plain), claim, emit, finish, inbox view

## Goal

The delivery state machine of spec §5.2 works end to end in memory: `send` records a message for the recipient's current generation; a claim moves it to `in-flight` with an attempt token and a deadline; a finish with the right token and generation makes it `offered`; a missed deadline puts it back to `recorded` with its offer count raised. Policies come in phases 5 and 6; this phase records every resolvable send.

## Context links

- Spec §5.1 envelope table (lines 198-209), §5.2 states and "Claim, emit, finish" (lines 222-245), §6.1 `inbox` and hook rows, §10 rows "A dead head finishes late", "A message is offered twice".

## Design

- `src/envelope.rs`:
  - `Kind { Message, Notice }`.
  - `State { Recorded, InFlight { token: AttemptToken, deadline: Timestamp, generation: Generation }, Offered { at: Timestamp }, Refused { reason: RefusalReason, at: Timestamp } }` (`RefusalReason` starts with the sweep reasons of phase 4; send-time refusals are never stored, spec §5.3).
  - `Header { id, kind, from: WriterKey, from_generation: Option<Generation>, to: WriterKey, to_generation: Generation, reply_to: Option<MessageId>, depth: u32, wake: bool, effective_wake: bool, body_bytes: u64, body_kept: bool, recorded_at: Timestamp, changed_at: Timestamp, offers: u32, answered: bool, state: State }`. `from_generation` is `None` for a sender with no registered head (the runner, the `fgos` CLI). `wake` is the sender's immutable permission; `effective_wake` is what the nudge and the Stop drain read (set equal to `wake` in this phase; phase 6 computes it).
- `src/state.rs` (from phase 2) gains `messages: Vec<Header>` (all `Header` fields owned, enums serde enums); phases 4-6 add notices, counters, budget, lifetime and exchange records.
- `src/delivery.rs`:
  - `SendRequest { from: WriterKey, to: String, body: String, wake: bool, reply_to: Option<MessageId> }`. There is no `reply_by` field: the first slice refuses it at the verb (spec §5.1), and an absent field cannot be set.
  - `send(&mut self, req, now, &Limits, &mut dyn IdSource) -> Result<SendOutcome, Refusal>`: resolve `to` (phase 2), stamp `to_generation` from the binding and `from_generation` from the sender's binding if any, `depth = 0`, state `Recorded`. `SendOutcome { id, to: ShortName, to_generation, depth, reply_to, effective_wake, wake_dropped: Option<WakeDrop> }` (`wake_dropped` always `None` until phase 6). `Refusal` is one enum with a stable `code()` string per reason (phase 5 adds the policy reasons).
  - `Checkpoint { Stop, Step }`. `Step` stands for every checkpoint that drains all pending mail (`post-tool-use`, a prompt a person typed, `inbox --claim`); the CLI-event mapping is rung V3's. In this phase both variants select the same messages; phase 6 narrows `Stop`.
  - `claim(&mut self, key, generation, checkpoint, now, &Limits, &mut dyn IdSource) -> Claim`. Runs the deadline part of the sweep first. If `generation` is not the binding's current one, returns an empty claim and changes nothing. Otherwise takes, oldest first (`recorded_at`, then id), every `Recorded` message to `key` whose `to_generation` equals the current generation; sets `InFlight { token, deadline: now + inFlightTtlSec, generation }`, `offers += 1`. `Claim { token, items: Vec<ClaimedItem { id, kind, from_label, from_cli: Option<Cli>, sender_has_head: bool, attempt: u32 } > }`, where `attempt` is the new offer count (what the frame prints, spec §5.5). `from_label` is the sender binding's short name; for a sender with no binding it is `unregistered-` plus the first 8 characters of its key reduced to the name alphabet, so a peer can never be labelled as a head it is not or as the system (notices have their own tag, phase 7).
  - `finish(&mut self, key, generation, token, now) -> Finished { offered: Vec<MessageId>, ignored: Vec<MessageId> }`: for each message still `InFlight` with this token, it becomes `Offered` only when `generation` equals both the binding's current generation and the claim's generation; otherwise it is listed as ignored and **left unchanged**. An unknown token changes nothing.
  - `inbox(&self, key) -> Vec<MessageView>`: every message to `key` including in-flight ones. It takes `&self`; it cannot change state.
- `src/sweep.rs` (first part): `in-flight` past its deadline returns to `Recorded` (offers already counted). Phase 4 adds the offer cap, TTL and notices.

## Start

Run the branch sync (plan.md § "Branch sync rule") and confirm the previous phases' tests are green on top of it before writing a new test.

## Tests before (red), owning file `tests/delivery.rs`

1. *a sent message is recorded for the recipient's current generation*.
2. *claim then finish with the same token and generation offers the message*.
3. *a finish with a wrong token is ignored and changes nothing*.
4. *a finish after the deadline sweep and a second claim is ignored* (first claim A, deadline passes, claim B, finish A → ignored; finish B → offered).
5. *a lost finish yields a duplicate offer with attempt 2* (claim, no finish, past deadline, claim again: same id, `attempt == 2`; the test asserts the duplicate window, not exactly-once).
6. *mail for generation 1 is never claimed by generation 2* (send, head replaced Dead → generation 2, claim by generation 2 is empty, the message stays `Recorded`).
7. *a finish from generation 1 after a takeover is ignored* (claim by generation 1, takeover, finish with generation 1 → ignored, state still `InFlight`).
8. *a claim by a stale generation returns nothing and changes nothing*.
9. *inbox lists recorded and in-flight mail and leaves the state equal* (`clone()` before, `assert_eq!` after).
10. *a send to an unknown name is refused and adds no header* (the message body naming a real head is ignored: "a name inside message text is never used"). The assertion is "no header, notice or body reference added", not "state equal": from phase 5 on, a refused attempt counts toward the budget and bumps a counter, and the store installs the snapshot after a refusal too (plan "Architecture").

## Refactor

Keep `claim` and `finish` free of policy branches; selection by checkpoint is one function (`eligible(header, checkpoint)`) that phase 6 extends.

## Tests after / regression gate

```bash
git fetch origin && git merge --no-edit origin/main   # branch sync rule (plan.md); proof counts only on a fresh main
cargo test -p fgos-mailbox-core --locked
cargo clippy -p fgos-mailbox-core --all-targets --locked -- -D warnings
cargo fmt -p fgos-mailbox-core -- --check
node scripts/git-one-door-scan.mjs --write-census
```

## Acceptance criteria

- The 10 tests pass, and `tests/snapshot.rs` (phase 2) is extended with a message in each state; phases 1-2 tests still pass.
- `inbox` takes `&self` (compile-time read-only) and test 9 holds.
- One commit: `feat(mailbox): record, claim, emit and finish messages with attempt tokens and generations`.

## Risks

- A finish that partly matches (some items moved by a sweep): handled per message, never all-or-nothing, so a stale part never blocks the live part.
- Unbounded growth is not handled yet: phase 4 (TTL, retention) and phase 5 (queue cap) bound it.

## Implementation notes (2026-10-21)

- Deviations (smallest correct fix):
  - The state enum is `MessageState` (a type named `State` would shadow the `state` module's role and read ambiguously next to `MailboxState`).
  - `Claim.token` is `Option<AttemptToken>`: no token is minted when nothing is claimed, so an empty claim needs no finish.
  - A claim checks the caller's generation before the clock and the sweep, so a stale claim changes nothing (test 8 compares the whole state).
  - Claim order is the recording order (the header list is append-only and `recorded_at` never goes back, thanks to the clock high-water mark). The planned tie-break "then id" is dropped: ids are opaque hex of different lengths and do not order.
  - `inbox` lists only mail to the key's current generation; mail of an older generation is never shown to a new process (spec §5.1 "never replayed into a stranger").
  - `finish` also requires the header's recipient to be the finishing key, so a token cannot finish mail addressed to another head.
  - Added proof: `tests/delivery.rs` *a sender with no head is labelled unregistered and can never pass for a head* owns the `from_label` rule, which had no owning test in the plan.
  - `tests/snapshot.rs` gains offered, in-flight and recorded messages; a refused message is first reachable through the sweep and is added in phase 4.
- `send` takes no `SendOutcome.wake_dropped` yet; phase 6 adds the field with its type `WakeDrop` rather than carrying an always-`None` placeholder now.
