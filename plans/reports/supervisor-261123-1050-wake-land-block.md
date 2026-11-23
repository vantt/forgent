# Supervisor wake 2026-11-23 10:50

## What blocks every land

Local `main` is at `369906c4e`. `origin/main` is at `4c0524b64`. Commit `369906c4e` was left by Land `land-3689269-1795400075015143607-2`. Its writer, pid 3689246, is no longer running. Because of that commit, every `fgos land` is refused with `land-target-ahead` or `resource-recovery-required`. This happened again on this wake (ticket `c-4097964-1795405768371`).

My confinement cannot run `fgos git status` or `fgos git recover` because the file system is read-only. I sent both commands by SendMessage to the unconfined peer `forgent-a3`, which I believe is lead:SUPERVISOR. No reply has arrived yet. Owner question `q-7x7b33ekew` asks for the same recover.

## Events

- 16 events marked handled. These were session-no-result rows, lane-freed rows, the lead:SUPERVISOR idle row, and the parked-wave note from authority-doors.
- 5 land-block events were marked handled after the escalation. They are `33925771a54fc301`, `8ae23a0fe9195f83`, `11ea78162a7d58e7`, `51a71a561b9519a7` and `04798b5a2765e26e`.
  - They could not stay open: `fgos supervisor done` refuses open events, and this session has no inbox to receive the peer's reply.
  - Owner question `q-7x7b33ekew` keeps the issue tracked, and the leads re-raise if the block persists.
  - The next wake must check `git rev-parse main origin/main`. If they match and main is clean, land the authority-doors footprint lines.
- 4 more routine rows were handled: two session-no-result and two lane-freed.
- New detail: `369906c4e` is the authority-doors lead's own unpushed park-note commit. The main checkout also holds an uncommitted `plan.md` with the lead's note plus my footprint lines, which causes `main-checkout-dirty-overlap`.

## Running plans

| Plan | State |
|------|-------|
| 261121-2110 component-authority-doors | Phase 1 is parked on the land block. Phases 2, 3 and 5 wait on owner questions `q-swxkda2x5r` and `q-3iylevstr2`. I added the footprint lines `apps/fgos/src/main.rs` and `test/cli/subcommand-flag-drift.test.mjs` (`q-sieckdvccb` option A, decided by lead:SUPERVISOR) to `plan.md`. They are not committed yet because of the land block. |
| 261123-0821 runner-recheck-replays-account-view | Phase 1 branch `p01b` @ `7d3b31a03` is ready. It is parked on the land block. |
| 261123-0726 contract-check-in-confined-heads | Phase 1 branch `p01b` @ `3a9ab48bc` is ready. It is parked on the land block. |
| 261122-0118 heads-stable-and-able | Timed measurement windows end at 14:20 and 21:06 today. This is a genuine wait. |

## Admission

`261123-0828-head-stop-rotation-bad-measure` can be admitted. It is not admitted because 4 of 4 leads are live.

## Open questions

- The owner, or lead:SUPERVISOR, needs to run `fgos git recover`. If the recover keeps the Land because its writer is dead, the owner decides what happens to `369906c4e` on main.
