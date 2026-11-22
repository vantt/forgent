---
id: p-24xw2cwdvo
title: "Delete the dead tier-5 Node execution modules and their tests left after plan s6a phase 21 (execution, priority high; source: owner decision 2026-11-22 18:23, option B)"
status: proposed
priority: P1
area: execution
created: 2026-11-22
---

# Why

Owner decision 2026-11-22 18:23 (option B of lead:S6A's question): phase 21 of plan 261118-1341-s6a-execution-tier-rust stops after the tail facades. Every production caller then reaches Execution only through the door, but about 80 Node files in src/runner/dispatch, src/runner/execution and src/run-supervisor stay behind, with only tests importing them, plus about 170 test files that test them directly. Under L10 (add through the door, not alongside it), the rest of a replaced mechanism that cannot go in the same change gets its own item. This is that item.

# Done when

Those Node modules are deleted, and every retired test names the Rust test that now owns its behaviour (design principle 8), or states that the behaviour was removed. No production or test import of the deleted paths remains. `npm test` and `cargo test --workspace` are green.

# Notes

Order: right after plan 261122-0118-heads-stable-and-able lands, since its files (head-start, head-request, rotate, head-stop) hold the last tail. lead:S6A's facades make the deletion mechanical. Watch disk and memory: run one suite at a time and keep cargo builds inside one worktree.
