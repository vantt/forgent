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

Owner 2026-11-22 18:27: this deletion runs immediately after (not later in the queue). Plan it now so it is ready the moment its blockers (261122-0118-heads-stable-and-able, then s6a phase 22) are done.

Counts from lead:S6A at phase 21 close (2026-11-22 19:10, after s6/p21-facades):
- src/runner/{dispatch,execution} and src/run-supervisor hold 89 files.
- 11 are still reached from product code: the facades (assignment-layout, config, confinement/authority, unit-run-record, unit-summary, execution/bind); cancel-registry, until 0118 makes head-stop and rotate await the host cancel op; and the definition.mjs twins (write-scope, run-timeout, outcome, legacy-seat-read).
- 78 files (about 26.1k lines) have no product importer. 145 test files import them (133 of them *.test.mjs), plus scripts/lib/mailbox-live-confined.mjs and scripts/record-mailbox-hook-fixtures.mjs.
- The facade slice moved those Node bodies into *-twin.mjs files beside their modules, so the deletion is mechanical.
