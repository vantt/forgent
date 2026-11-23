# Supervisor wake 2026-11-23 07:58

## Queue

- `ff8fa47717d2ab41` session-idle, ref `39631fb7-…` resolves to the unconfined `lead:SUPERVISOR` session (alive). It is not a head or a lead, and no request of mine is waiting on it, so there was nothing to do. Marked handled.

## Admission

- Lanes are full: 4 of 4 held (`fgos slots`), and 3 of 4 leads are live.
- Two plans are `ready`, but neither is admissible: `261121-2110-component-authority-doors` and `261122-1950-owner-communication-standard`. The owner order recorded in `775c7ce03` puts the orchestration skeleton before owner-communication. Nothing was admitted.

## Running plans

- `261122-0056-orchestration-skeleton`: the lead is busy. Wave-1 units p01, p03, p10, p11 and p12 are running (tickets c-1823, c-1835, c-1849, c-1647, c-1861), and the lead is waiting for them to settle. A message about the status line is queued in its pane, typed by someone other than this supervisor.
- `261123-0726-contract-check-in-confined-heads`: the lead is busy. Phase 3 passed its unit and is in review, and phase 1's ticket c-1705 is still running.
- `261122-0118-heads-stable-and-able`: the lead is idle on verified waits. Phase 9's measure ends at 14:20, phases 8 and 10 end at 21:06, and phase 11 waits on 8, 9 and 10. All of this is recorded in the phase table (`b7fed7aad`).

## Concern

- The heads-stable lead's prompt box holds an unsent draft: "Phase 9 window closed at 14:20; write the after report". At 07:58 this is false, because the window closes at 14:20 today. If someone sends it early, phase 9's after-measure would be cut short. I did not type into the pane, because no open event names that session as stuck.
