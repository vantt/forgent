# Seat binding route: host calls and wall time, before and after

Scope: requirement 7 of phase 09. "Before" is the Node code of `9979a0de0` (the head before the route moved to
protocol 2), counted by reading it. "After" is measured: a logging wrapper stood in for the host
(`FGOS_HOST_BIN`), timed each `fgos internal seat-binding` process (spawn to exit, debug build of this tree) and
counted lines; two rounds, the second is quoted when they differ. Wall times of "facade" include the Node side
(spawn, JSON in, JSON out).

## Per op, after

| Op (Node facade) | host calls | host process wall | facade wall |
|---|---|---|---|
| `bind` (one seat) / `bindWorkSeat` | 1 | 6-8 ms | 16-19 ms |
| `explainSeat` (binding + whole walk chain) | 1 | 10-11 ms | 21 ms |
| `preflightOf` (agent CLI check) | 1 | 6 ms | 16-18 ms |
| `digest` (replay) | 1 | 6 ms | 14-15 ms |
| `plan` (dispatch, binding selectors) | 1 | 4-6 ms | 12-18 ms |

## Per scenario

| Scenario | before (calls) | after (calls) | note |
|---|---|---|---|
| `fgos run` seat bind | 1 `bind` | 1 `bind` | unchanged |
| `fgos run` start, agent CLI refusal | 0 (in process) | 1 `preflight` per run start | new, about 6 ms |
| `fgos run` start, each pinned account | 0 (in process) | 1 `preflight` per pin (`assertPinnedAccountsUsable`) | new, about 6 ms per pin |
| replay of a committed binding | 1 `bind` (digest in process) | 2: `digest` then `bind` | one call added, about 6 ms |
| `explain` with a walk chain of n steps | 1 + n `bind` (one per step, the last one stops the walk) | 1 `explain` | n calls fewer; at about 7 ms a call, a 3-step chain goes from about 28 ms to about 10 ms of host time (before is derived from the per-call time, not re-run) |
| dispatch `--for` purpose with its own prefer pool | 1 `bind` (the seat); policy reads that binding | 1 `plan` (the answer carries the binding; no second bind) | unchanged |
| dispatch `--for` purpose, registered, no prefer pool and no executor | 0 | 1 `plan` | the decision moved to the host, so one call is new |
| dispatch `--for` unregistered purpose | 0 | 1 `plan` | same |
| dispatch `--for` purpose naming a registered executor | 1 `bind` (policy) | 2: `plan` then `bind` | one more; see open item |
| dispatch executor id, assignment, Work-hint selectors | 1 `bind` (policy; executor id measured) | 1 `bind` | unchanged; these selectors stay in Node and spawn nothing else |

The plan op answer carries `binding` whenever a seat was bound for the purpose (a purpose with a prefer pool of its
own), and `plan.mjs` reads the policy from it: no second bind.

## Open

A purpose that names a registered executor and has no prefer pool of its own is decided by `plan` without a seat
being bound, so the policy still binds once for its tier and model: two calls where Node made one. Closing it means
the route binding the policy seat (its ask is built from the operation, role and pin that only the Node caller holds)
or the policy moving to Rust; neither is in this phase.
