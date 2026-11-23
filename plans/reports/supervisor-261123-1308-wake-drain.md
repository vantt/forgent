# Supervisor wake drain, 2026-11-23 13:08

No owner question was pending when this wake started (`fgos questions`: none).

## Events

| id | kind | action | state |
|---|---|---|---|
| b06fcd6e1835e8f5 | session-no-result (`unit-run-1795413223974-2bc7a2b1` producer 1_01) | The unit belongs to doors plan phase 1. It settled `pass` on the deepseek/thehive fallback (fb2) after a gemini lease-conflict. The empty attempts were fallback hops. | handled |
| 76d102e29b77275a | session-no-result (same unit, 1-fb1_01) | Same as above. | handled |
| bd70b53245b9c1bb | coordination-help (gate held at 6d0f6b92c) | The doors lead is already retrying its phase-1 land. The runner lead has no plan land pending; it is running phase-2 tests. | handled |
| 82a692cd784e9a4f | coordination-help (supervisor restart after the OOM; trunk npm test for 261123-0726 criterion 5 deferred) | lead:SUPERVISOR asked for it to stay open, but `supervisor done` refuses an open event. It was closed; lead:SUPERVISOR still owns scheduling that run. | handled |
| 608d8e922f54a240 | coordination-help (raised this wake) | The heads lead was idle since 12:52, with plan.md and reports/land-gate-restore.md uncommitted after the gate was held. It was nudged to land them. It resumed work. | handled |

## Running plans

- 261121-2110-component-authority-doors: lead live and busy, retrying the phase-1 land against `merge-slot-busy`.
- 261122-0118-heads-stable-and-able: lead live and now landing its two files. Phase 9's measure ends at 14:20 today.
- 261123-0726-contract-check-in-confined-heads: lead live and busy, retrying the phase-1 land after rustc was OOM-killed at 12:57.
- 261123-0821-runner-recheck-replays-account-view: lead live, phase 2. A Cargo build is running in a scratch target at -j 2 because the shared targets are read-only from its sandbox. npm test follows.

## Admission

No admission: `leadsLive` 4 is above `maxLeads` 2. `261123-0828-head-stop-rotation-bad-measure` is `ready` and admissible, and it waits for a lead slot.

## Friction

- `fgos session type` types the text but does not submit it; a second `--text $'\r'` was needed. An earlier lead:SUPERVISOR message to the heads lead sat unsent in its prompt for the same reason.
- Memory pressure: the runner lead's from-scratch Cargo build and the pending npm test overlap with the OOM pattern (p-6htu2ae64o). lead:SUPERVISOR schedules the heavy runs.
