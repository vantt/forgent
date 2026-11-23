# Supervisor wake 2026-11-23 08:36

## Events

- `7321d1e05d7f1110` session-no-result for `run_unit-run-1795397475407-bce4a860/producer/1_01`. The unit belongs to the lead of 261123-0821-runner-recheck-replays-account-view. Its claude worker was blocked by its headless sandbox because cargo, python and perl needed approvals it could not get, so the worker reverted its edits. The lead already saw this and is rerunning the unit with `--provider deepseek` (ticket `c-3196-1795397599371`). The lead is busy and owns the follow-up, so the event is handled.

## Admission

- The lead pool is full (`leadsLive` 4 of `maxLeads` 4). 261123-0828-head-stop-rotation-bad-measure is `ready` and admissible, but it waits for a free lead slot. It goes first on the next wake that has a free slot.

## Running plans

| Plan | Lead | State |
|---|---|---|
| 261121-2110-component-authority-doors | live, idle | Wave 1 waits for gemini's quarantine to lift at 09:03. A timer is running in the lead's shell. The prompt line holds the unsubmitted text "don't wait, run with --provider claude now"; its author is unknown, so it was left alone. |
| 261122-0118-heads-stable-and-able | live, idle | Phases 8 to 11 are parked on measurement windows that end at 14:20 and 21:06. The prompt line holds the unsubmitted text "Phase 9 window closed at 14:20; write the after report". That text is premature at 08:36, so it was left unsubmitted. |
| 261123-0726-contract-check-in-confined-heads | live, idle | Phases 1 and 3 are parked on the runner binding mismatch, a wait recorded in the phase table. They resume once 0821 lands. |
| 261123-0821-runner-recheck-replays-account-view | live, busy | Phase 1 is running; the rerun on deepseek is in progress. |

## Owner questions

None open.
