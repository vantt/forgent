---
phase: 12
title: "Test structure: each seat decision proven once (Rust golden), Node seat tests prove only what the facade adds; failover decisions proven on the pure answer with three real launches kept; pre-admission refusals never launch; exec budget counted at the client; the failover skip fails where bwrap is claimed; executor-posture-coverage folds into seat-binding-dry-bind"
status: pending
depends_on: [10, 11]
parallel: "none (wave 7)"
effort: ~1.5d
net_size: "Node −85 / Rust 0 / tests −1 100 (estimate; golden JSON +0 to +100 not counted)"
---

# Phase 12 — Test structure and doctor fold

## Context

Design principle 8 (one proof per behaviour, lowest layer that observes it; a boundary above gets one wiring proof). Arbitration §2 Seat Binding ("Node seat tests keep only what the facade adds (executor facts, account view, refusal mapping, herdr transport choice): about 64 → 20 in `bind.test.mjs`, cases missing from golden move into golden"), §2 doctor rows (`seat-binding-dry-bind` absorbs `executor-posture-coverage`, same three outcomes and messages, one bind pass), §3 Tests row (failover decisions on the pure `answerProviderLimit` with 3 real-launch tests kept; pre-admission refusals of `run.test.mjs` in a file that never launches; `exec-budget` counted at the client call site; `failover-fixture.mjs:39` skip fails the gate when the platform claims bwrap). S-3 (splitting the slow files for parallelism) is TEST's (H-T5a); this phase moves only the pre-admission refusals. Memory: the suite feels bloated; retire tests of removed or duplicated behaviour instead of porting them.

Code and tests read on `4b116c27e`:
- Rust owning proof: `packages/seat-binding/rust/tests/golden.rs:4` over `packages/seat-binding/contracts/seat-binding.golden.v1.json` (82 cases).
- Node seat tests (lines/tests): `test/runner/execution/bind.test.mjs` 1 023/64, `bind-committed-config.test.mjs` 163/8, `bind-tier-composition.test.mjs` 16/1, `tier-fallback.test.mjs` 190/9, `seat-policy.test.mjs` 99/5, `explain.test.mjs` 129/6, `test/runner/tier-fallback-config.test.mjs`, `test/runner/tier-cell.test.mjs` 223/21, `test/setup/seat-binding-dry-bind.test.mjs` 361/18; `test/seat-binding/client.test.mjs` 170/14 (replays the golden base through the host: the wiring proof), `test/seat-binding/exec-budget.test.mjs` 55/1 (a full `runUnit` panel to count execs, 6.6 s, `:36`).
- Failover: `test/runner/execution/run-provider-failover.test.mjs` 550/29 (real confined launches, 111-124 s), fixture `test/helpers/failover-fixture.mjs:30-38` (`SKIP` when `/usr/bin/bwrap` cannot run; the whole file goes green on such a machine), also used by `exec-budget.test.mjs` and `run-resume-order.test.mjs`.
- `test/runner/execution/run.test.mjs` 2 516/89 (each `runUnit` with `confinement: { backend: 'bwrap' }` launches a seat; refusals before admission need none).
- Doctor: `src/setup/registrations.mjs:3889-3910` (`seat-binding-dry-bind`, `blind-steps-use-proven-pools`, `executor-posture-coverage`), modules `src/setup/seat-binding-checks.mjs` (110), `src/setup/executor-posture-coverage.mjs` (125), test `test/setup/executor-posture-coverage-check.test.mjs` 294/11.
- Client exec site: `src/seat-binding/client.mjs:107-121` (host resolve and `spawnSync`; `hotLockDepth()` check).

## Requirements

- **Seat tests to facade wiring.** For every Node seat test: if it proves a ranking/tier/pin/independence/account/walk/cap decision, find the golden case that proves the same row; if none, add the case to the golden JSON (Rust `golden.rs` proves it) and retire the Node test; if it proves what the facade adds (`executorFacts`, `accountViewOf`, refusal mapping to Node errors, herdr transport choice, replay, timeouts, skills), keep it. Target `bind.test.mjs` about 20 tests; the other seat files shrink or go by the same rule. The report has one row per retired test: what it asserted → the golden case name (or the kept Node test) that now asserts it (RT-P13).
- **Failover on the pure answer.** The rotation, walk, lease-conflict, pinned, ceiling and partial-write decisions are proven as table cases on `answerProviderLimit` (exported by P10) in `test/runner/execution/` (the owning file of `account-rotation`/the run's failover module, or a new file only if none fits). Three real-launch cases stay in `run-provider-failover.test.mjs` as wiring: a dead login, a usage limit, partial writes. The other launch cases retire, each naming its table case.
- **Pre-admission refusals.** Cases of `run.test.mjs` that refuse before admission (config, unit shape, repository, port missing, pins) move to one file that never launches (name by convention), unchanged in assertions; `run.test.mjs` keeps the launching cases.
- **Exec budget at the client.** "One host exec per bind, none under a lock" is asserted at the client call site (`client.test.mjs`: count `spawnSync` calls through the client's injected spawn, and the in-lock refusal it already owns); `exec-budget.test.mjs` retires (its panel count becomes: one bind per seat, per walk step, per lease conflict, proven on `answerProviderLimit` cases plus the client count).
- **Failover skip.** `failover-fixture.mjs` no longer skips silently where the platform claims bwrap: when the machine backend registry (or the `bwrap-available` doctor fact the lead finds the tests can read) says bwrap is available and `bwrapUsable()` fails, the fixture throws a named error; it skips only where the platform does not claim bwrap (stated in the skip reason). No env switch.
- **Doctor fold.** `executor-posture-coverage` becomes a section of `seat-binding-dry-bind` over the same bind pass: same three outcomes (posture-unavailable for a core capability: fail; no pool: warn; other refusal: fail) and the same messages; `executor-posture-coverage.mjs` and its registration go; its test cases move into `seat-binding-dry-bind.test.mjs` (the ones not already there). The doctor table in the report shows each condition and its new row. CHANGELOG line (row id gone).

## Files

**Create:** the pre-admission refusals test file; the `answerProviderLimit` table cases file only if no existing file owns the module.

**Modify:** `packages/seat-binding/contracts/seat-binding.golden.v1.json`; the Node seat test files above; `test/runner/execution/run-provider-failover.test.mjs`; `test/runner/execution/run.test.mjs`; `test/helpers/failover-fixture.mjs`; `test/seat-binding/client.test.mjs`; `src/setup/seat-binding-checks.mjs`; `src/setup/registrations.mjs` (`:3889-3910`); `test/setup/seat-binding-dry-bind.test.mjs`; `docs/architecture-manifest.json`; `CHANGELOG.md`; doctor docs that list the row (`rg -n executor-posture-coverage docs`).

**Delete:** `src/setup/executor-posture-coverage.mjs`; `test/setup/executor-posture-coverage-check.test.mjs` (after its cases move); `test/seat-binding/exec-budget.test.mjs`; retired cases (listed in the report).

**Tests to retire:** as above; every retirement names its new owner (golden case, kept Node test, `answerProviderLimit` table case, client count case, `seat-binding-dry-bind` case). Nothing is retired whose behaviour no named test still asserts.

## Net size

Node: posture module −125, fold into seat-binding checks +40 → −85. Tests: seat tests about −700, failover launch cases about −300 (table cases +80), exec-budget −55, posture test −294 (+100 moved), pre-admission move 0 → about −1 100 (Node test lines; golden JSON rows not counted).

## Steps

1. Inventory: one row per Node seat test with its decision and golden case; send the table to the big lead before deleting (it is the review artifact for RT-P13).
2. Golden additions; `cargo test -p fgos-seat-binding --test golden`.
3. Retire Node seat tests per the table.
4. `answerProviderLimit` table; retire launch cases; keep three.
5. Pre-admission file; exec count at the client; fixture skip rule.
6. Doctor fold; CHANGELOG; docs list.

## Validation (focused)

- `cargo test -p fgos-seat-binding`.
- FR `test/runner/execution/bind.test.mjs test/runner/execution/bind-committed-config.test.mjs test/runner/execution/tier-fallback.test.mjs test/runner/execution/seat-policy.test.mjs test/runner/execution/explain.test.mjs test/runner/tier-fallback-config.test.mjs test/runner/tier-cell.test.mjs test/seat-binding/client.test.mjs test/setup/seat-binding-dry-bind.test.mjs test/runner/execution/run-provider-failover.test.mjs test/runner/execution/run.test.mjs test/runner/execution/run-resume-order.test.mjs test/setup/checks.test.mjs` plus the new files.
- Before/after: test count and summed time of the layer's Node test set (baseline §2.2: 2 435 tests, 669 s file by file); the failover file under 20 s.

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| A retired Node seat test was the only proof of a facade fact | M × H | Inventory table reviewed before deletion; facade facts are kept by rule. |
| `answerProviderLimit` cases pass while the wiring around it regresses | M × M | Three real-launch cases stay; P10 already ran the full failover file after extraction. |
| The fixture now fails on a developer machine where bwrap is claimed but broken | M × L | That is the intent (a green run there proved nothing); the error names the fix (`fgos doctor` `bwrap-available`). |
| Doctor fold loses a message | L × M | Messages copied verbatim; `checks.test.mjs` row list updated. |

## Rollback

Revert the merge; re-activate the previous release. No on-disk change; doctor row id returns with the old release.

## Done when

Inventory table published; seat tests at facade wiring; failover table plus three launches; exec count at the client; skip rule; doctor fold; measured before/after test count and time; landed; guide section written.

## Lead brief essentials

Inventory before deletion; golden owns decisions; never retire a behaviour without a named owner. All plan.md lead rules apply.
