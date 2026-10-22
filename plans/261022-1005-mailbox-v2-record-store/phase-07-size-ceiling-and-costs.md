---
phase: 7
title: "Size ceiling and costs against S0"
status: completed
depends_on: [6]
---

# Phase 7: Size ceiling and costs against S0

## Context

- Spec §14 V2 row: "the size ceiling. Costs are compared with the S0 numbers (about 10 ms per write, `fsync` dominated)"; §8 item 7 (hook p95 target 50 ms on the no-mail path, `mailbox.hook.p95TargetMs`); §9 signal 8 (record size).
- S0 report `plans/reports/research-261020-1612-mailbox-s0-hook-and-record-costs.md` §3: H3 one cycle p50 10.29 / p95 11.02 ms at N=0/10/50 headers for one address; 100 addresses x 50 headers (808,801 bytes) p50 13.43 / p95 28.31 ms; read+parse 2.2 ms, build+serialize 0.6 ms at that size; machine Linux 7.0, 24 cores, ext4 on NVMe.
- V1 plan risks: "the 50 ms hook measurement must include a steady-state snapshot holding a week of headers at the §12 limits".
- Owner question Q1 (provisional default: measure and report, no core change).

## The ceiling, derived (no new number)

Header horizon `K = max(loop.windowSec, record.ttlSec, record.bodyRetentionSec)` (`core/src/sweep.rs` `retire_settled_messages`). A registered head generation can be accepted at most `session.lifetimeCap` times in its life (`core/src/policy.rs` lifetime check), so it leaves at most `session.lifetimeCap` (200) headers. The shared `~unregistered` identity has no lifetime cap (owner Q3, spec §5.3) and can be accepted at most `session.budget` times per `human.fallbackWindowSec`, so it can leave at most <!-- Updated: Red Team: the saturated sender is the unregistered identity -->

`H_sender = session.budget x ceil(K / human.fallbackWindowSec) + session.budget`

retained headers (the last term covers the window straddling the horizon). With the contract values: 20 x 1008 + 20 = 20,180. The snapshot's header total is at most `H_sender` for the unregistered identity plus `session.lifetimeCap` per registered head generation that sent within `K`, plus bindings, notices (`notices.cap` per address), counters (`counters.maxKeys` per-party plus per-reason totals) and the budget, lifetime, exchange and wake-lifetime entries of live keys.

## Tests first — `tests/record_ceiling.rs` (owning file for the ceiling)

| # | Test name | Asserts |
|---|---|---|
| 1 | `one saturated sender stops growing at the derived header ceiling` | one hold builds the steady state in memory with core calls: an unregistered sender (a writer key with no binding, accounted as `~unregistered`) sends `session.budget` per window to two recipients alternately (loop guard and share preconditions asserted from limits), recipients claim and finish each window; time advances by `human.fallbackWindowSec` per window through `now` for `K` plus two windows. Asserts: the header count never exceeds `H_sender` and is equal at the last two windows (steady); the installed snapshot reads back equal |
| 2 | `refused sends never grow the snapshot` | not repeated here: owned by the core's bounded-counter test (V1, `core/tests/counters.rs`); this row exists only to say so |

If test 1 runs longer than about 60 s in debug, see the plan's risk "Ceiling test runtime"; the assertion stays.

## The cost example — `examples/mailbox-record-cost.rs`

A release-built program run by hand (`cargo run --release -p fgos-mailbox --example mailbox-record-cost -- <parent-dir-on-ext4> <scenario>`), never in `cargo test`. It creates its own fresh `.fgos` under the parent, refuses a parent that already holds a `.fgos`, and removes what it created when done, so it can never write synthetic state into a live project (the mailbox root must not appear in a project before the confinement hidden-roots prerequisite, spec §8 item 6) <!-- Updated: Red Team -->. For each scenario: 3 warm-up runs then 50 measured holds (S0's method), p50/p95/max in ms, plus snapshot bytes and header count. Each measured hold is the real `Record` API in a real directory on the same filesystem class as S0 (ext4 on NVMe; state it).

| Scenario | Population | Hold measured |
|---|---|---|
| `s0-one` | one address, 50 headers (S0 H3 N=50) | one send (write); one no-mail claim hold (no write) |
| `s0-hundred` | 100 addresses x 50 headers (S0 H3 second row) | same |
| `week-one` | test 1's steady state for one sender | send; no-mail claim; claim+finish pair (a drain with mail, two holds) |
| `week-grid` | `week-one` plus 1, 10 and 100 registered head generations each at `session.lifetimeCap` headers (a measurement grid, not a policy value) | no-mail claim |
| `dead-bindings` | `week-one` plus 100 dead bindings named by headers (not prunable) | registering hold; claim+finish pair (pruning judges every binding on each writing hold) |
| `contended` | `s0-one` with a second process looping sends | no-mail claim hold; report acquire, critical section and release separately (release runs `settle_release`, bounded only by `DEFAULT_KILL_WAIT_MS`) <!-- Updated: Red Team --> |

Every policy value comes from `limits.v1.json`; the populations above are S0's own, or derived from the ceiling.

## Report

Path: `fgos convention path --kind report --type research --slug mailbox-v2-record-costs --json` (run when the phase starts; never hand-built). Content: the table above with S0 side by side, the machine and filesystem, the snapshot bytes per header, what dominates (lock acquire, read, parse, serialize, fsync, prune, lock release), and a one-line verdict per scenario against S0 and against the 50 ms hook target. Evidence-linked: the example's commit and the exact command lines.

## Steps

1. Test 1 red (no steady-state builder yet); write it; green (the store and core already bound it; a red result here is a real finding, report it before changing anything).
2. Write the example; run all scenarios; write the report.
3. Add the measured numbers to owner question Q1 in `plan.md` whatever they are (keep the provisional default); state plainly that `hook.lockWaitMs` bounds only the lock poll, not the hook's wall time.
4. Census, commit `test(mailbox): bound the retained headers and measure record costs`; the report commits with it.

## Gates

As phase 2, plus `fgos convention check --all --json` with no violation naming the report and `cargo build --release -p fgos-mailbox --example mailbox-record-cost`.

## Done when

Test 1 is green on a fresh main merge and the report states every scenario with S0 beside it.

## Risk and rollback

- Numbers on a loaded machine: record the load average beside each run (S0 did).
- This phase changes no policy, whatever the numbers.

## API drift

None (main `636df9d87`).

## Deviations

- Windows are `human.fallbackWindowSec + 1` s apart, not `human.fallbackWindowSec`. The budget and the loop guard count an attempt until more than their window has passed (`Timestamp::is_past` is strict), so at exactly 600 s the previous window's sends still count and the 13th message to one recipient would be refused. The test asserts that `loop.windowSec` equals `human.fallbackWindowSec` before relying on it.
- The ceiling test runs in 15.3 s in debug, so the plan's fallback (a smaller population) was not needed. It asserts that the count never exceeds `H_sender` (20,180; the steady value is 20,140) and is equal in the last two windows, and that the installed snapshot reads back equal to the state built.
- Each measured hold of the example starts from the population's snapshot, put back untimed, because the plan's populations are fixed and a send adds a header. The contended row runs against a record that the second process keeps changing.
- The example times each `Step` through the hold's observer and reports the p50 of each step's share. The claim+finish rows are two holds and are not split.
- The example adds one row the plan did not list: `dead-bindings send`, the cost of owner Q2 option B's judgement of every binding at `send`.
- The example reads the limits through the tests' shared loader (`#[path]` to `core/tests/common/support.rs`), the same one door the store's tests use.

## Result against the coordinator's stop rule

- The one-sender steady week (record only): no-mail p95 42.5 ms, under 50 ms. With 10 registered heads at their lifetime cap: p95 49.5 ms. With 100: p95 64.2 ms, over 50 ms.
- The host's own cost per call comes on top of these numbers.
- Per the coordinator's instruction (a steady-state no-mail read over 50 ms is owner Q1), no lever was picked, and the lane stops after this phase and reports. Phase 8 is not run.

## Proof

- `cargo test -p fgos-mailbox --test record_ceiling`: 1 passed (15.3 s, debug).
- Mutant: doubling the core's header retention fails it ("20200 headers > ceiling 20180").
- `cargo build --release -p fgos-mailbox --example mailbox-record-cost` builds; the run exited 0.
- Report: `plans/reports/research-261022-1145-mailbox-v2-record-costs.md`.

## Plan decision 3 reversed (plan owner (agent), 2026-10-22, after this phase's first run)

The first run showed the no-write byte comparison, which re-encodes the whole state, to be about half of a no-mail hold at a week of headers.

- Core: `Finished` gains `changed`, set when any item carried the token. The owning proofs are the core's finish tests, extended: `claim_then_finish_…` (changed) and `a_finish_with_a_wrong_token_…` (not changed).
- Store: the hold's closure returns a `ReportsChange`, implemented for these results:
  - `Claim` (`changed`) and `Finished` (`changed`);
  - `Registered` (not `Refreshed`) and `Result<Registered, RegisterRefusal>` (refusals change nothing);
  - `Result<SendOutcome, Refusal>` (always: the attempt is counted);
  - the drain's `Begun` (`state_changed`);
  - `Reported<T>` (`changing`/`unchanged`), for a closure that runs several core operations.
- An unchanged hold returns before any encode or comparison. No path without a core flag remains, so the byte comparison is gone.
- `snapshot::read` returns the state only.
- Tests:
  - phase 2's test 2 is rewritten as `a_hold_writes_exactly_when_its_change_reports_one`. A reported change is written even when the bytes would be equal, which the old comparison could not do.
  - new: `each_core_answer_writes_exactly_when_it_changed_the_state` (same head again, refused registration, unmatched finish and quiet unchanged drain write nothing; real finish and quiet changed drain write).
- Mutants: 9 tried, 9 killed. Store, run against `record_snapshot`: always write, `Refreshed` written, refused registration written, `Finished` always / never written, `Begun` always / never written. Core: `Finished.changed` always true. Never write was killed by the whole store suite.
- Order of work: the implementation came before the new test cases. The mutants are their proof.
- Recorded in branch spec §17 and §6.4, and in `plan.md` decision 3.

## Re-run (after the reversal)

| No-mail claim hold, p50 / p95 | Before | After |
|---|---|---|
| week-one | 29.95 / 42.53 | 22.63 / 36.83 |
| week-grid 10 heads | 38.28 / 49.46 | 17.18 / 36.01 |
| week-grid 100 heads | 58.02 / 64.15 | 44.11 / 49.68 |
| if `bodyRetentionSec` = 86400 (measurement only) | | 2.17 / 2.20 |

The record's own no-mail hold is now under 50 ms p95 in every week population measured; the host's own cost per call still comes on top. The added example row, `week-one-1d`, changes no contract value. The report's re-run section has every row.

