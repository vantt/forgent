# Supervisor wake 2026-11-23 07:18

## Queue

- `dd0eb99b6891350c` session-no-result for `run_unit-run-1795392760535-eee2c523/producer/1_01`. The unit settled at 00:15:34 with outcome `pass` (`.fgos/assignments/unit-run-1795392760535-eee2c523/unit-summary.json`); the event fired three seconds before settle. The run belongs to another session's `backlog-original-id` worktree, not a plan lead, and `fgos request result` returns `ticket-unknown` for this role. No action needed; marked handled.

## Plans

- Running: `261122-0118-heads-stable-and-able`, lead live. Phases 1-7 and 12 are done. Phase 9 is parked on a 24 h measure ending 2026-11-23 14:20; phases 8 and 10 on the window ending 2026-11-23 21:06; phase 11 depends on all of them. The lead's screen confirms the wait and names no run or land request in flight. A genuine timed wait, so the lead is left alone.
- Ready: `261122-1950-owner-communication-standard` is `admissible: false` (the listing excludes footprint overlap with the running plan). Not admitted; lanes free 4/4, leads live 1/4.
- 35 plan directories are unreadable by the plan listing (missing frontmatter, empty priority, no footprint column); none is running.

## Owner questions

- `q-rfxqncjrax` (who runs the account probe for Miu's quota) is still open, 10 h old; it blocks only Miu's account move.
