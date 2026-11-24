---
id: p-tvwy24txpj
title: "One `spawn.rs` extension: caller-owned containment, an output cap and descriptor closing, which retires the three `run-bounded-child` door rows (process, priority normal; source: report `unit-261124-1035-p12b-bounded-child-stop.md` of the doors plan)"
status: proposed
priority: P2
area: process
created: 2026-11-24
---

# Why

The door row `run-bounded-child` and the two rows of its group retire when one `spawn.rs` extension lands. Today their `retiredBy` points to a report, not an owner. The report calls it a feature idea that waits for the owner (RUL104 (tốt hơn, không to hơn)).

# Done when

The owner decides whether to build it. If yes, a plan adds caller-owned containment, an output cap and descriptor closing to `spawn.rs`, and the three rows are removed. If no, the three rows record that decision as their reason.

# Notes

Report: `plans/261121-2110-component-authority-doors/reports/unit-261124-1035-p12b-bounded-child-stop.md`.
