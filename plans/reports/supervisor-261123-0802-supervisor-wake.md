# Supervisor wake 2026-11-23 08:02

## Outcome

No owner question is pending. The queue had 9 events: 7 are handled and 2 coordination-help events stay open while `lead:SUPERVISOR` diagnoses a runner fault. No plan was admitted, because all 4 lanes are held and neither ready plan is admissible.

## Events

| id | kind | action |
|---|---|---|
| d8e221db05a9865a, 0ae6b12adf61a243, fd53a008f228de7a, b1209305a40aa0e3, 83f83950f8992690 | session-no-result | Handled. These are the failed producer attempts that the two coordination events below cover. |
| 93438fb597922e86, 9e956bee7a6f66e5 | lane-freed | Handled. No plan is admissible, and the lanes show 4 of 4 held. |
| b068b0c68167e3df | coordination-help (orchestration-skeleton) | Open. Routed to `lead:SUPERVISOR` (forgent-a3). |
| 0d234d8e6256532d | coordination-help (contract-check-in-confined-heads) | Open. Same fault, routed in the same message. |

## Runner fault

Since about 08:01, every `fgos run --writes` unit fails with exit 4: "binding mismatch: recomputed gemini/gemini(-lite) does not match assignment deepseek/thehive". The first producer hits a gemini capacity refusal. The runner then fails over to fallback `1-fb1` (deepseek/thehive), and its own binding recheck refuses that fallback. The fault reproduces with and without `--provider`, and it lies outside both plan footprints.

Evidence:
- unit runs: unit-run-1795395043849-d25ed627, unit-run-1795395618677-6377aee7
- tickets: c-31242-1795395663600, c-31646-1795395672795, c-32009-1795395681906

## Running plans

- `261122-0056-orchestration-skeleton`: the lead is live and busy, waiting on wave-1 tickets. It is rerouting one phase to a provider with capacity.
- `261122-0118-heads-stable-and-able`: phases 8 to 11 are parked on timed measurement windows that end at 14:20 and 21:06 on 2026-11-23. This is a verified wait, so the lead was left alone.
- `261123-0726-contract-check-in-confined-heads`: the lead is live and has parked phases 1 and 3 because of the runner fault. Phase 3 review blockers are being fixed.

## Open

- `lead:SUPERVISOR` must reply with a diagnosis and a fix route. The secretary needs a backlog row for the runner fault. When the fault is fixed, the next wake resumes the parked phases of 261123-0726.
