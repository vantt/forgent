---
phase: 08
title: "Close: spec and docs lines handed to DOC (docs/ frozen), re-measure against the baseline, closing report, owner-machine guide complete"
status: pending
depends_on: [01, 02, 03, 04, 05, 06, 07]
parallel: "none"
effort: ~1d (plus DOC's own time after DOC Land)
net_size: "0 / 0 / 0"
---

# Phase 08 — Spec hand-off, re-measure, close

## Context

Per-layer loop steps 2 (Part A shape "written into the component's spec"), 7 (land) and 8 (re-measure) in the [HARDEN plan](../261021-1118-harden-low-layers-bottom-up/plan.md#the-per-layer-loop); `docs/` frozen for DOC's cutover (plan.md fact 5). Baseline: [research-261103-1212](../reports/research-261103-1212-harden-t4-baseline.md), main `e078ca201`. If phase 07 is still waiting on its answers, this phase closes the rest and leaves phase 07's lines marked open.

## Requirements

- **H-T4g, the docs list for DOC**, one board message plus a section in the closing report, each line with the commit that made it true:

| File | Line(s) on `fcd42ecdc` | Change | From phase |
|---|---|---|---|
| `docs/platform/run-supervisor/spec.md` | §2 / new subsection | Part A target shapes of arbitration §2 (approved 1a), with the Node budget (≤ 1 150, then ≤ 1 000 lines) | all |
| same | §3 `:77` | `supervisor-heartbeat.json` no longer written | 04 |
| same | §5.3 `:142` | binding wait = the three start budgets + 15 s (45 s) | 05 |
| same | §5.3 `:148` and §16 `:352` | idle counts letters on the screen only, not a `working` status (`16150dca1`, decision 58); the screen is sampled only while idle can come before the soft deadline (decision 59, 5a); a pane idle of 20 min never fires before the default 15 min soft deadline (B-13) | 04 |
| same | §6 receipt | `outboxResult`; `reason` names `terminal:blocked:*` at a deadline stop and `direct:blocked:*` for a direct exit | 02 |
| same | §7 steps | the route verifies; the Node entry keeps only the step environment and release-manifest checks | 05 |
| same | §8 `:205`, §9.1 `:252` | adopt closes a lock-without-envelope attempt from its intent; `legacy-run` is read-only | 07 |
| same | §11 error model, Supervisor row | Windows: the attempt lock is free once the supervisor is gone; the job held by the gate keeps the attempt; adopt refuses while the bound gate is not dead (B-1) | 01 |
| same | §14 `:306-330` | doctor rows: 4 rows, conditions per plan.md table; `legacy-attempts-stuck` gone | 01, 07 |
| same | §15 `:333` | `lock-scan` sentence goes (route contract no longer lists it) | 01 |
| `docs/specs/runner.md`, `docs/specs/distribution.md`, `docs/specs/reading-map.md`, `docs/platform/packaging-distribution/contracts/setup-doctor-registry.md` | every `legacy-attempts-stuck`, `process-containment`, `gate-kill-grace`, `cancel-wait`, `units-awaiting-resume` mention (`rg -n` list in the report) | row names and conditions | 01, 07 |
| `docs/platform/component-boundary.md` | rows Run Supervisor, Launch gate | Node budget, parts (adopt, steps launcher) | all |
| `docs/architecture-manifest.json` | `:254`, `:262` | rows of deleted files (if DOC did not let them land with their phase) | 01, 07 |
| `docs/backlog.md` | new row | H-T4c (trust store lost update, T5) | — |
| `docs/decisions/` / spec §16 | new decision lines | decision 59 answers as settled facts (Vietnamese, as §16 is) | all |

- **Re-measure** (loop step 8) on fg-server2, same load class as the baseline (state the load average): Rust crate src/test lines and test wall time; Node `src/run-supervisor` lines (outside `steps/`); Node `test/run-supervisor` tests and batch wall time; doctor rows and their per-row time; `attempt-step` import time; one direct and one pane seat launch time. Before/after table in the closing report.
- **Net size** per language of HARDEN commits of this layer (`git diff --stat` over each phase's merge, Rust test code counted as tests), against plan.md's estimates.
- **Closing report** `plans/reports/closing-<date>-harden-t4-run-supervisor.md` (name from `fgos convention name`): what landed (hashes), what is open (phase 07 if gated, H-T4a…g), the measured table, the received items answered.
- **Owner-machine guide** complete (one section per landed phase, Vietnamese, with rollback), linked from the board.
- Layer phase file `phase-05-t4-run-supervisor-launch-gate.md` and the HARDEN plan's phase row updated by the big lead (not by a lead).
- Board: HARDEN row and one `log.md` line.

## Files

**Create:** the closing report and the guide (under `plans/reports/`).

**Modify:** none in `src/`, `packages/` or `docs/` (DOC applies H-T4g after DOC Land; if DOC asks HARDEN to apply it, that is a separate commit after DOC Land).

**Delete:** each phase's private Cargo target and retired worktrees (after checking `CACHEDIR.TAG`, literal paths).

**Tests to retire:** none.

## Steps

1. Collect each phase's report; build the docs list with commits.
2. Re-measure; write the table.
3. Closing report; guide complete; board.
4. Send H-T4g to DOC; record H-T4a…f with their receivers (owner decision 8).

## Validation

- Every link in the closing report resolves; `fgos convention check -- <report paths>` clean.
- The measured table has a value for every baseline row or says why not.
- `df -h /` after target cleanup.

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| DOC Land slips past T4's close and the spec lags the code | H × L | The closing report carries H-T4g; T4 closes with it open, as T0–T3 did. |
| Re-measure under a different load than the baseline | M × M | State load; repeat at a quiet hour if above 4. |

## Rollback

Nothing to roll back (documents only).

## Done when

Closing report written and linked; guide complete; H-T4g with DOC; every hand-off recorded by its receiver or listed as waiting.
