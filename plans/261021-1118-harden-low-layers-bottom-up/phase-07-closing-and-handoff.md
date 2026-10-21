---
phase: 07
title: "Closing report and handoff of T6–T9"
status: pending
depends_on: [06 closed]
effort: ~0.5d
---

# Phase 07 — Closing report and handoff of the layers above T5

## Requirements

1. **Closing report** (convention path): per layer T0–T5 the before/after table from that layer's own baseline (routes p50/p95, tests and wall time, LOC Rust/Node/test, doctor rows and conditions, backlog rows, parallel paths per job), measured net Δ of HARDEN commits vs the estimate, accepted/rejected findings with reasons, named owner-approved exceptions to "zero Node deciding logic in T0–T4", refuted hypotheses, the "proposed additions" the owner picked or not; whole-suite wall time re-measured against phase 00.
2. **One handoff table** for the out-of-scope layers — T6 Workflow (guide + case), T7 Work Lifecycle (WORK lane), T8 Skill/Domain, T9 Host & Surface (`bin/fgos.mjs`, gateway, herdr-dashboard) plus Packaging-Distribution (`fgctl`, `src/setup` 13 846 lines): per row, the items T0–T5 found there but did not own (e.g. host-runtime parts flagged at T0, the distribution canonical-JSON pair, herdr caller logic), the open owner decisions that touch it, and the main-SHA of the last measurement. Each layer measures its own baseline when its plan opens.
3. Board: HARDEN row → done with the report link; one log line.

## Files

- **Create:** one closing report with the handoff table (convention path).
- **Modify:** `plan.md` status, board row + log.
- **Delete:** none. **Tests to retire:** none.

## Net size

Node 0, Rust 0, tests 0.

## Done when

Report committed; owner has the T6–T9 inputs to decide the next plan.
