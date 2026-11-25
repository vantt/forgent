---
id: p-uojivokdqy
title: The Rust assignment-tree walks (run-result lib.rs, run-supervisor adopt_scan.rs) move onto the engine layout
status: proposed
priority: P2
area: runner
created: 2026-11-25
---

# Why

Plan 261122-2108 phase 11 deleted the Node run-directory lister and closed the door row `list-run-directories.yaml`, but two Rust walks of the assignment tree still read the old layout by hand: `packages/run-result` (`lib.rs`) and `packages/run-supervisor` (`adopt_scan.rs`). The door row's `retiredBy` needs this row's id.

# Done when

Both walks list run directories through the engine layout's one door, the hand-written walks are deleted, and `list-run-directories.yaml` names this row in `retiredBy` and then closes.

# Notes

Raised by the lead of plan 261122-2108 in supervisor event e80d75b71a5dc06d (2026-11-25). Not blocking that plan.
