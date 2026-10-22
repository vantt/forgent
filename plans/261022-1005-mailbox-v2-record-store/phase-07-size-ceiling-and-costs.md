---
phase: 7
title: "Size ceiling and costs against S0"
status: pending
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
