---
phase: 5
title: "Two processes contending, with the wait cap"
status: completed
depends_on: [4]
---

# Phase 5: Two processes contending, with the wait cap

## Context

- Spec §11 Core suite items marked V2: "two concurrent sends cannot spend one remaining allowance", "atomic claim under concurrent drains through the mutex", "two heads registering at once get distinct generations"; §8 item 7 ("The hook waits for the snapshot lock at most `mailbox.hook.lockWaitMs` ... and then skips this drain").
- S0 contention finding: an unlucky prober waited up to 1.26 s (no fairness in `lock_until`), so the wait cap must be enforced by the store, not assumed.
- Child runner and handshake from phase 4 (`tests/common/record.rs`).

## Requirements

No new production code is expected: this phase proves that the hold of phases 2-4 serializes real processes. If a test fails, the fix goes into the hold.

## Tests first — `tests/record_contention.rs` (owning file)

All numbers come from `limits.v1.json` through the `Limits`/`HookLimits` loader of `tests/common/record.rs` (phase 2).

| # | Test name | Setup and asserts |
|---|---|---|
| 1 | `two senders racing lose no update` | two registered recipients R1, R2 and two child senders S1, S2, **each registered under its own key with its own live process record before the start barrier, so they have distinct accounts** (unregistered senders share `~unregistered`, `core/src/counters.rs:15`) <!-- Updated: Red Team -->, started together (a start barrier file); each sends `session.budget` messages, alternating R1/R2 (so neither the loop guard `loop.maxPerWindow` nor the share `queue.perSender` is reached; the test asserts these preconditions from the limits before running). Final snapshot: exactly `2 x session.budget` headers, ids all distinct, each with its body |
| 2 | `two senders never spend one remaining wake allowance` | prepare an exchange between A and B at `wake.maxPerExchange - 1` effective wakes (driven through real sends at one `now`); two children send `wake:true` at once (one A->B, one B->A); exactly one outcome has `effective_wake` true and the snapshot's exchange count equals `wake.maxPerExchange` |
| 3 | `two drains never claim the same message` | `queue.cap` messages pending for one key at one generation; two children run `claim` (Checkpoint `Step`) concurrently; the two claimed id sets are disjoint and their union is all pending ids; the other got an empty claim or a disjoint remainder |
| 4 | `two heads registering at once get distinct generations` | a stored binding whose head is a killed child (judged `Dead`); two children with different live head records register the same key at once; each child writes its outcome and then blocks on its pipe, so the winner stays alive while the loser judges it (an exited child is `Dead`, `packages/process/rust/src/facts.rs:230-231`); the parent reads both outcomes and the snapshot before releasing and reaping them: exactly one `Replaced` at generation 2, the other `Conflict`, one binding at generation 2 <!-- Updated: Red Team --> |
| 5 | `a hold that cannot get the lock within the wait cap changes nothing` | a child holds the lock paused at `Locked` (before it reads) with the phase 4 handshake; the parent's hold with `Wait::Ms(hook.lock_wait_ms)` returns `lock-busy` with a reported wait of at least `hook.lock_wait_ms`; the snapshot bytes are unchanged **before** the child is released; after release (a byte on its pipe) the snapshot holds exactly the child's one change and nothing from the parent <!-- Updated: Red Team --> |

Test 5 asserts no upper time bound (a loaded machine would flake it); the lower bound plus the typed error is the behaviour.

## Steps

1. Write each test red only where possible (tests 1-4 are expected green on phase 2-4 code; write them, run them, and if green on the first run, break the hold locally (e.g. release before install) to see each fail, then restore — record that check in the commit message body, not in code).
2. Census, commit `test(mailbox): prove the record under two contending processes`.

## Gates

As phase 2; run the file three times in a row.

## Done when

Five tests green on a fresh main merge, three consecutive runs.

## Risk and rollback

- Test 4 needs a dead head record: spawn a child, take its record with `fgos_process::facts::identity_of(pid).expect(..).to_record()` (`facts.rs:50,285`; V3's `tests/head.rs:8-12` does the same for its own process with `self_identity()`), kill and reap it, then use that record. Never fabricate a pid.

## API drift

None (main `636df9d87`, unchanged since phase 4).

## Deviations

- No production code changed: every test passed against the hold of phases 2–4 on its first run.
- Test 1: the two senders are registered heads, so each has its own account. Their binding heads are opaque test text, not process records: a sender's head is never judged in this test, so a live record would add nothing.
- Test 3: `queue.cap` pending messages need `queue.cap / queue.perSender` registered senders, because one account may hold only `queue.perSender` of one recipient's queue.
- Test 4: the dead head is a real `sleep` process, read with `identity_of`, killed and reaped (shared helper `dead_head_record`). Each contender writes its outcome and parks; the parent reads both outcomes and the snapshot, then kills both children.
- Test 5: the child holds the lock parked at `Locked` and goes on only when the parent writes one byte to its stdin. The shared runner now always gives children a stdin pipe that the parent keeps. Holder-lock reports the timed-out wait as `Acquire::Timeout { waited_ms }`, and the test asserts `waited_ms >= mailbox.hook.lockWaitMs`.
- A shared start barrier: each child announces `<name>.ready` and waits for the parent's `start` file.

## Proof

- `cargo test -p fgos-mailbox --test record_contention`, three runs in a row: 6 passed each time (5 tests plus `child_entry`).
- `cargo test -p fgos-mailbox -p fgos-mailbox-core`: 176 passed.
- Breaking the hold to release the lock right after the read (before the install) failed tests 1–4. Over three runs, the lost-update test failed every time and each of the others failed at least twice. Dropping the reported wait from `lock-busy` failed test 5. The hold was restored after each check.

