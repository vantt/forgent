# Supervisor wake 2026-11-23 08:05

## Outcome

No owner question is pending. The queue held one event, and it is now handled. No plan was admitted, because all 4 lanes are held (`lanes.free` is 0) and neither ready plan is admissible.

## Events

| id | kind | action |
|---|---|---|
| 7cce548d60b830bc | session-no-result | Handled. Unit `unit-run-1795395043624-5933223b` is orchestration-skeleton phase 10. Its gemini producer hit provider-limit at 01:02Z. This is the same runner failover binding fault that the 08:02 wake routed. The new evidence was sent to `lead:SUPERVISOR` (forgent-a3, live). |

| 3e5af365287caf52 | session-idle (lead:SUPERVISOR session, not a head) | Handled. That session went idle after it answered. |
| b56d673d5d93be93, cab9fad63511db62 | coordination-help (261123-0726) | Handled. `lead:SUPERVISOR` diagnosed the fault in `plans/reports/debugger-261123-0805-runner-recheck-ignores-account-view.md` (73b4490f3). When a mutating unit is rechecked, the runner binds again without the account quarantine overlay. Account gemini/tetnu is quarantined for quota until about 09:02, so every unit that the quarantine moved to deepseek is refused at the recheck. Action: hold writing units until the quarantine ends, and do not make deepseek the primary provider. The code fix waits on the owner's go, which is routed through the secretary. |

## Resume rule

The first wake after 09:02 (check with `fgos dispatch inspect --provider-capacity`) restarts 261123-0726 phases 1 and 3 from their kept briefs and worktrees, and checks orchestration-skeleton p10 and p12. Neither lead was typed into: the 261123-0726 lead is already parked idle, and the skeleton lead is busy.

## Running plans

- `261122-0056-orchestration-skeleton`: the lead is live and busy, polling its wave-1 tickets. It routed p12 to a provider that has capacity.
- `261122-0118-heads-stable-and-able`: the plan waits on timed measurement windows that end at 14:20 and 21:06 today. This is a verified wait.
- `261123-0726-contract-check-in-confined-heads`: the lead is idle on a verified external wait. Phases 1 and 3 are parked on the runner fault, and their worktrees and fix briefs are kept.

## Open

- The runner recheck fix plan waits on the owner, routed through the secretary.
- `fgos questions show q-tvhmli3fns` is refused from this confined head (git-floor-probe-failed, read-only file system). `fgos questions` lists no open question.
