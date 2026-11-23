# Supervisor wake 0909

## Queue (9 events, all handled)

- `plan-no-progress` on 261123-0726-contract-check-in-confined-heads (raised 00:39 UTC): stale. The lead committed `5ed8f9004` at 09:08 +07 and is retrying the phase 3 land, so it is making progress. Closed.
- Five `session-no-result` events: unit runs of live, busy leads. The contract-check p01 and doors p01 runs passed. The doors p02 and p03 runs were blocked and those phases are already parked on q-swxkda2x5r. The runner-recheck p01 run was blocked, and its lead is polling a later ticket, c-15753. Each lead reads its own results. Closed.
- Two `lane-freed` events: no admission was possible, because 4 of 4 leads are live. Closed.
- `coordination-help` on component-authority-doors: phase 1 is parked on q-6rdolvgvz2. That question is already with the owner, and the lead is busy with compile fix unit c-16925. Closed.

## Running plans

| plan | lead | state |
|---|---|---|
| 261121-2110-component-authority-doors | live, busy | phase 1 compile fix in progress; phases 2 and 3 parked on q-swxkda2x5r; phase 1 land waits on q-6rdolvgvz2 |
| 261122-0118-heads-stable-and-able | live, idle | verified wait: phase 9's measure window ends 14:20 today, and phases 8 and 10 end 21:06 |
| 261123-0726-contract-check-in-confined-heads | live, busy | phase 3 land retry in flight |
| 261123-0821-runner-recheck-replays-account-view | live, busy | phase 1 waiting on ticket c-15753 |

## Held

- 261123-0828-head-stop-rotation-bad-measure is ready and admissible, but no lead slot is free (4 of 4). It gets admitted on the first wake with a free slot.

## Observation

- The input box of the heads-stable lead holds unsent text: "Phase 9 window closed at 14:20; write the after report". It is 09:09 now, so that statement is false until 14:20. No event names this session, so I did not type into it. If the text gets submitted early, the lead could write the after report before the window closes.
