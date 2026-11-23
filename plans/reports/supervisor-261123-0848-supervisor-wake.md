# Supervisor wake 2026-11-23 08:48

## Events

- `1d16398249ecba04` session-no-result for `run_unit-run-1795397599763-31f5da62/producer/1_01`. This is the deepseek rerun of phase 1 of 261123-0821-runner-recheck-replays-account-view. It failed with an infra error after about ten minutes and made no edits. The lead saw it and is already running the last untried executor, glm (ticket `c-5527-1795398259060`). The lead is busy and owns the follow-up, so the event is handled.
- `32f0279463d65db6` lane-freed on fg-server2. The lane pool has 3 free lanes, but the lead pool is full (`leadsLive` 4 of `maxLeads` 4), so nothing was admitted. Handled.

## Admission

- 261123-0828-head-stop-rotation-bad-measure stays `ready` and admissible. It goes first on the next wake with a free lead slot.

## Running plans

| Plan | Lead | State |
|---|---|---|
| 261121-2110-component-authority-doors | live, idle | Wave 1 waits for gemini's quarantine to lift at 09:03; the lead's timer shell is still running, so the wait is verified. The unsubmitted prompt text "don't wait, run with --provider claude now" is unchanged and left alone. |
| 261122-0118-heads-stable-and-able | live, idle | Phases 8 to 11 are parked on measure windows ending 14:20 and 21:06, recorded in the phase table. |
| 261123-0726-contract-check-in-confined-heads | live, idle | Phases 1 and 3 are parked on the runner binding mismatch until 0821 lands. |
| 261123-0821-runner-recheck-replays-account-view | live, busy | Phase 1 rerun on glm in progress. |

## Owner questions

None open.
