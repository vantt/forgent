---
phase: 00
title: "T0 baseline + one-time whole-suite test investigation"
status: pending
depends_on: []
effort: ~2d
---

# Phase 00: T0 baseline + one-time whole-suite test investigation

## Context links

- [plan.md](plan.md) — loop, gates, size rule
- [proposal §4.7b](../reports/proposal-261021-0851-harden-review-criteria-and-method.md) — current numbers and the 5 hypotheses
- [TEST plan phases 2–3](../261020-1757-test-governance-port-inventory-and-slow-file-extraction/plan.md), [TEST phase 0–1 report](../reports/phase-lead-261020-1748-test-governance-rule-and-first-cleanup.md) (fresh profile, top-20 slow files, clone list)
- [rules-growth review](../reports/review-261021-1008-rules-that-grow-the-system.md) §1 numbers, R1, R6

## Requirements

Two outputs, both reports (paths from `fgos convention path --kind report … --json </dev/null`):

1. **T0 baseline** (loop step 1 for T0; every other layer measures its own when its council opens): p50/p95 cold/warm of the T0 call classes — liveness judge as called today (Node leaf), `fgos internal process-observe`, signal by identity, atomic write per contract class (phase 01 §B), canonical JSON — plus the identity mint for reference; T0 tests and wall time; LOC Rust/Node/test of the phase 01 inventory; open backlog rows touching process/liveness/atomic write; T0 doctor rows and setup steps. Record machine, load, main SHA.
2. **Whole-suite test investigation, once** (proposal §4.7b; owner 10:01: not repeated per layer):
   - wall time per file and per test; distribution of cost by kind: CLI/host spawn, `fgos init`, git repo creation, herdr/bwrap/real process, time-based waits;
   - separate runner causes (concurrency, machine-wide queue, per-file 600 s ceiling, per-test fixture rebuild) from test causes, by running the top files alone vs. in the suite under a recorded load;
   - test growth history since 2026-10-01 (266 added / 102 deleted per proposal): which plans/phases added files, how many retired a replaced mechanism's tests;
   - verdict per hypothesis H1–H5 (proposal §4.7b): confirmed / refuted / partial, with numbers. Refuted ones stay recorded;
   - check the 202 s baseline at `f38dfd1d0`: which machine, which load;
   - a ranked list of causes with numbers, and **one** proposal for the test-creation process (e.g. lead-brief gate "find the owning test, list tests to retire") handed to the TEST lane / rule-management lane — HARDEN does not build the mechanism.
   - a per-layer list (T0–T5) of test files, Node↔Rust duplicates and time-based waits, as input for each layer's tests table (each layer re-checks it on its own baseline).

## Coordination (before starting, non-blocking)

- One SendMessage to the TEST lane session (second machine; if no live session, the board TEST row): HARDEN measures the whole suite once with TEST's tools; TEST keeps rules + tooling and retires mirrors-Rust/contract-prose tests in its five ports; HARDEN reuses TEST's labels and counts only its own commits. Phase 00 does not wait for an answer.
- Reuse the TEST phase 0–1 fresh profile when it is from the same machine and ≤ 2 days old; re-measure only what is missing.
- Add HARDEN's rows to the board's "File chung dễ va" table (shared files listed in plan.md).

## Tools (reuse, no new script unless none fits)

`scripts/run-tests.mjs` (`npm test`), `scripts/test-timing.mjs` (env capture, wall/CPU/RSS), `scripts/test-proof-inventory.mjs`, `scripts/test-select-coverage-map.mjs`, `scripts/stress-test-files.mjs`, `scripts/measure-verify-cost.mjs`. Scratch output under `.fgos/runtime/tmp/harden-p00/`. A missing measurement that no script gives is done with a throwaway script in scratch, not committed.

## Files

- **Create:** two reports under `plans/reports/` (convention path). No code.
- **Modify:** none.
- **Delete:** none.
- **Tests to retire:** none here; the investigation produces each layer's candidate list.

## Net size

Node 0, Rust 0, tests 0 (measurement only).

## Steps

1. Message TEST; read the TEST phase 0–1 report; decide what to re-measure.
2. Record machine, Node, CPU count, load (`scripts/test-timing.mjs`). Run the full suite twice at different load; keep per-file JSON.
3. Run top-30 slow files alone; compare with in-suite time → runner vs test share.
4. Classify every test file by cost kind with `rg` over `test/` (spawn of `fgos`/host, `init`, `git init`, herdr/bwrap, `setTimeout`/`sleep`); join with timings.
5. `git log --diff-filter=A/D --since=2026-10-01 -- test/` grouped by plan/phase prefix in commit subjects.
6. T0 call-class latency: 30 cold + 30 warm runs each; record p50/p95 in absolute units (µs/ms).
7. Write both reports; update the HARDEN board row.

## Validation

- Every number cites its command and raw output path.
- Each H1–H5 has a verdict and the data behind it.
- T0 has a full baseline row; every other layer has its test-file list.

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| Suite timing noisy under load (1046–1316 s spread) | H × M | Two runs, load recorded, per-file comparison alone vs. in suite. |
| Duplicating TEST lane work | M × M | Message first; reuse its profile and labels; Δ counted on HARDEN commits only. |
| Investigation grows into fixing tests | M × M | Phase 00 fixes nothing; fixes go to the owning layer phase or to TEST. |

## Rollback

Reports only; nothing to revert.

## Done when

Both reports committed and linked from plan.md and the board HARDEN row; TEST lane messaged; board shared-file rows added.
