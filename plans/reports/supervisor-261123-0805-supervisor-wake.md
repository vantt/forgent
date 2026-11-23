# Supervisor wake 2026-11-23 08:05

## Outcome

No owner question is pending. The queue held one event, and it is now handled. No plan was admitted, because all 4 lanes are held (`lanes.free` is 0) and neither ready plan is admissible.

## Events

| id | kind | action |
|---|---|---|
| 7cce548d60b830bc | session-no-result | Handled. Unit `unit-run-1795395043624-5933223b` is orchestration-skeleton phase 10. Its gemini producer hit provider-limit at 01:02Z. This is the same runner failover binding fault that the 08:02 wake routed. The new evidence was sent to `lead:SUPERVISOR` (forgent-a3, live). |

The coordination-help events from the 08:02 wake are no longer on the queue. `lead:SUPERVISOR` has not replied yet: no fix commit has landed and the mailbox is empty.

## Running plans

- `261122-0056-orchestration-skeleton`: the lead is live and busy, polling its wave-1 tickets. It routed p12 to a provider that has capacity.
- `261122-0118-heads-stable-and-able`: the plan waits on timed measurement windows that end at 14:20 and 21:06 today. This is a verified wait.
- `261123-0726-contract-check-in-confined-heads`: the lead is idle on a verified external wait. Phases 1 and 3 are parked on the runner fault, and their worktrees and fix briefs are kept.

## Open

- `lead:SUPERVISOR` must send a diagnosis and fix for the runner binding mismatch (exit 4: "binding mismatch: recomputed gemini/gemini does not match assignment deepseek/thehive"). Once it is fixed, the next wake resumes 261123-0726 phases 1 and 3 and orchestration-skeleton p10 and p12.
- `fgos questions show q-tvhmli3fns` is refused from this confined head (git-floor-probe-failed, read-only file system). `fgos questions` lists no open question.
