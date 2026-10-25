---
phase: 6
title: "Effective wake, Stop drain, scripted loop replays"
status: done
priority: P2
effort: "4h"
dependencies: [5]
---

# Phase 6: Effective wake, Stop drain, scripted loop replays

<!-- Updated: red-team 2026-10-21 - Stop-block bound moved to V3 (decision 16); exchange keyed by accounting identity (decision 12); wake lifetime cap only for registered senders (owner Q3); driver-only assertion removed; snapshot test extended -->

## Goal

`send` computes the effective wake once, spending the exchange allowance in the same state change that records the message; a `Stop` checkpoint selects only messages whose effective wake is true; and the scripted pair of the loop test, replayed with no model, reproduces the measured numbers: wake dropped at message 6, depth refusal at message 8, wake lifetime cap at message 101.

## Context links

- Spec §5.1 row `wake` (line 206), §5.3 rows "Wake quota per exchange" and "Wake lifetime cap" (lines 267-268), §6.1 hook row (Stop drain and `mailbox.stopBlock.max`, line 311), §16 Q10 (D2), §17 rows "wake quota per exchange", "A Stop drains only wake:true", A2 "Effective wake".
- Measurement: `plans/reports/research-261020-1814-mailbox-real-agent-loop-test.md` §"Self-test cặp kịch bản" (lines 82-91) and its method (lines 58-65): two scripted agents always reply "thanks" with `--wake`; one turn advances the simulated clock 20 s; one message per turn; the simulator enforced nothing in mode OFF and recorded when each quota *would* first fire; it did not simulate the loop guard, queue cap or size cap; it modelled the wake lifetime cap as "effective wakes of one session to one recipient, never reset".

## Design (`src/wake.rs`, called from `send` after the policies pass)

- `exchanges: BTreeMap<PairKey, Exchange { last_at: Timestamp, wakes_spent: u32 }>`, `PairKey` a `String` newtype `<a>|<b>` of the two accounting identities sorted (phase 5: a sender with no head is `unregistered`, so rotating `from` cannot open fresh exchanges). Every recorded `Message` between the pair first starts a new exchange when none exists or `now - last_at >= wake.exchangeGapSec` (a gap below the value keeps the exchange), then updates `last_at = now`.
- If the sender asked for `wake`: dropped with `WakeDrop::ExchangeQuota` when `wakes_spent >= wake.maxPerExchange`; else, for a registered sender only (owner question Q3, provisional A), dropped with `WakeDrop::LifetimeCap` when the effective wakes recorded under `<from>@<generation>|<to>` (`wake_lifetime: BTreeMap<String newtype, u32>`, never reset; a new generation is a new key) ≥ `wake.lifetimeCap`; else `effective_wake = true`, `wakes_spent += 1`, lifetime count `+= 1`. All of this happens inside the same `send` call that appends the header, so a later nudge failure never gives the allowance back. A dropped wake never refuses the message (spec: "a lost message is worse than a late one"); `SendOutcome.wake_dropped` names the reason so the delivery report can say it (V3 composes the sentence).
- `eligible(header, Checkpoint::Stop)` = `Recorded` and `effective_wake`; notices are never eligible at `Stop`. `Step` takes everything. The sender's `wake` field is never read by `eligible` (only `effective_wake` is).
- Not here: the consecutive Stop-block bound (`mailbox.stopBlock.max`) is hook behaviour and lands at V3 with the payload fixtures (plan decision 16).
- Size: `exchanges` holds at most one entry per pair of accounting identities and `wake_lifetime` one per registered sender generation and recipient; neither grows with rotating `from` values.

## Start

Run the branch sync (plan.md § "Branch sync rule") and confirm the previous phases' tests are green on top of it before writing a new test.

## Tests before (red)

`tests/wake.rs` (owns: effective wake and the Stop drain):

1. *within one exchange the first maxPerExchange wake sends take effect and the next is recorded with its wake dropped* (nothing refused; `wake_dropped == ExchangeQuota`).
2. *a reply to a woken message wakes its requester within the quota* (both directions count against one allowance).
3. *a gap just under the exchange gap stays one exchange; a gap at the value starts a fresh allowance*.
4. *a one-way sender slower than the exchange gap is stopped by the wake lifetime cap, and a new sender generation starts a new count* (fresh `wake:true` sends every `exchangeGapSec + 1` s, recipient never replies so depth stays 0; send number `wake.lifetimeCap + 1` has `wake_dropped == LifetimeCap`).
5. *a wake:false send never takes effect*.
6. *a Stop claim takes only effective-wake messages; a dropped-wake message waits for the next step claim; notices wait too*.
7. *a sender with no head that rotates its from cannot open fresh exchanges* (two different unregistered `from` values share one exchange with the recipient and one allowance).

`tests/snapshot.rs`: extend the round-trip state with `exchanges` and `wake_lifetime` (no new test).

`tests/scripted_pair.rs` (owns: the replay of the measured numbers; one driver, three runs). The driver: heads A and B registered; message *i* is sent at `20 × (i − 1)` s by A for odd *i* and B for even *i*, body "thanks", `wake: true`, no `reply_to` (the link is derived); before replying, the replying head claims at a `Step` checkpoint and finishes.

8. *with the spec values a woken thanks-loop loses its wake at message 6 and then stops*: the driver only gives the recipient a turn when the last message took effect as a wake. Assert messages 1-5 have effective wake, message 6 is recorded with `wake_dropped == ExchangeQuota`, no refusal happened and the `session-budget` counter was never bumped (the measurement: "session budget never fired").
9. *with the spec values a busy thanks-loop is refused for depth at message 8*: the driver gives each recipient a turn every time (both agents busy, draining at each step). Assert depths 0..=6 for messages 1-7 and message 8 refused `too-deep`.
10. *the wake lifetime cap first fires at message 101*: same driver as test 9, with the configuration the measurement had: the spec values except `chain.maxDepth`, `wake.maxPerExchange` and `loop.maxPerWindow` set to `u32::MAX` (the simulator did not enforce depth or the exchange quota while counting the lifetime cap, and did not model the loop guard). Assert messages 1-100 take effect as wakes and message 101, A's 51st wake to B, is recorded with `wake_dropped == LifetimeCap`. These three values are ordinary configuration passed through the production code path, the same kind of value an owner can set in config; no code branch exists for the test.

## Refactor

`send` ends with `wake::effective(...)`; nothing else in the crate reads `header.wake` except the delivery view (V3 reports both fields).

## Tests after / regression gate

```bash
git fetch origin && git merge --no-edit origin/main   # branch sync rule (plan.md); proof counts only on a fresh main
cargo test -p fgos-mailbox-core --locked
cargo clippy -p fgos-mailbox-core --all-targets --locked -- -D warnings
cargo fmt -p fgos-mailbox-core -- --check
node scripts/git-one-door-scan.mjs --write-census
```

## Acceptance criteria

- 10 new tests pass with the contract values (tests 1-9) and the stated configuration (test 10), plus the extended snapshot test; test 1 owns the quota rule and tests 8-10 own the reproduction of the measured numbers (spec §14 V1 row asks for both); the numbers 6, 8 and 101 are asserted literally, citing the measurement report in the test's doc comment.
- `rg -n '\.wake\b' packages/mailbox/rust/core/src` shows no read of `wake` in `eligible` or in claim selection.
- One commit: `feat(mailbox): spend the wake quota at send and drain only effective wakes at Stop`; push it to the branch.

## Not in this phase

- "Two concurrent sends cannot spend one remaining allowance": needs two processes and the mutex, rung V2 (spec §11).
- The nudge reading the effective field: the nudge is rung V3/V5; it gets `effective_wake` from `SendOutcome` and the header.

## Implementation notes (2026-10-21)

- The replays reproduce the measured numbers literally: wake dropped at message 6 (`ExchangeQuota`, no refusal, `session-budget` never bumped), depths 0..=6 then `too-deep` at message 8, and with the measurement's configuration `LifetimeCap` first at message 101.
- Deviations (smallest correct fix):
  - The exchange key is the `String` newtype `ExchangeKey`, the wake lifetime key `WakeLifetimeKey` (`<from>@<generation>|<to>`); the recipient part is its key (a recipient always has a binding).
  - A fresh exchange starts when `now >= last_at + exchangeGapSec` (a gap at the value starts a new allowance, as test 3 states), compared in milliseconds.
  - `tests/snapshot.rs`: its in-flight message now carries `wake`, because a `Stop` claim takes only effective wakes; the test also asserts that `exchanges` and `wake_lifetime` hold entries.
- `rg -n '\.wake\b' packages/mailbox/rust/core/src` shows only `limits.wake.*` and the request's `wake` at `send`; `eligible` reads `effective_wake` only.
