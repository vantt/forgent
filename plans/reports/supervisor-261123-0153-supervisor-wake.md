# Supervisor wake 2026-11-23 01:53

## Queue

- `8327fddac133a39f` lane-freed (fg-server2): no plan is admissible, so it was closed with no action. `261122-1950-owner-communication-standard`
  is `ready` but its `blockedBy` lists four plans that are not done (heads-rotate, component-authority,
  component-authority-doors, orchestration-skeleton).
- `ff2d0e1395e34435` session-no-result (`run_unit-run-1795372626661-35cc8be4/producer/1_01`): this is the heads-rotate
  phase 4 unit window. The lead owns the result through `fgos request result c-69958-1795372626167` and is now
  checking it. Closed.
- `53d3ebecfeec4556` coordination-help (raised this wake): see the heads-rotate section below. It was closed after the lead resumed work.

## Running plans (leadsLive 3 of 4, lanes free 3)

- **261121-2109-component-authority**: phase 3 unit `c-16989-1795372350621` is still running and the lead is polling it.
  The unit had written nothing after 19 minutes. Its 35-minute runner limit ends it at about 02:08. The lead is busy,
  so I left it alone.
- **261122-0118-heads-stable-and-able**: phases 8, 9 and 10 are parked on dated measurement windows that end at
  2026-11-23 14:20 and 21:06. Phase 11 depends on them. The lead is idle, but its wait is verified and recorded in the
  phase table, so I left it alone.
- **261122-2307-heads-rotate-on-their-own**: the lead had been idle since 01:44. Its temp volume filled, so it lost the
  output of both full gate runs, and it asked whether it may delete its own scratch `cargo-out`. I raised a
  coordination-help event and told it through `session type` to delete `cargo-out`, then rerun `npm test` and
  `cargo test --workspace` with `CARGO_TARGET_DIR` and the gate output under `.fgos/runtime/tmp/`. The lead resumed
  and is checking ticket `c-69958-1795372626167`.

## Friction

- `fgos session type --text` put the text in the input box but did not submit it. A second `type` with a carriage
  return submitted it.

## Owed (reported by the heads-rotate lead, outside its footprint)

- The old p03 worktree `forgent-worktrees/261122-2307-heads-rotate-on-their-own-p03` (branch
  `heads-rotate-on-their-own/p03`) has eight uncommitted tracked edits. The lead says these were carried into
  `1cd8386c5`. No head holds `worktree remove`, so the owner has to discard it.
- `packages/run-supervisor/contracts/head-request.v1.json` does not list the new stop facts (crons, tasks, quota). This
  needs its own backlog item.
- A real status-line payload recording is still owed.

## Open owner question

- `q-rfxqncjrax`: who runs the account probe for Miu's quota. It blocks only moving Miu to a fresh account.
