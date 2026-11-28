# Measure before the change: one live tick on fg-server2

Phase 1 of plan 261128-2236 (criterion 1, D1). Measured on fg-server2 against its live Event Store on
2026-11-28 15:46Z by the supervisor; figures from `plans/reports/supervisor-261128-2248-wake-drain.md`
§ "Phase 1 figures".

**Verdict: the raise loop is the dominant cost. It takes at least 63% of a full tick and, at the median fold time,
all of it. Detection takes under 0.5%.**

## Inputs

| Figure | Value | Source |
|---|---|---|
| F, one full fold of the `project` stream | 6.83 s, 6.45 s, 3.67 s; median 6.45 s, fastest 3.67 s | `fgos supervisor queue --json`, three runs, wall time (each run is `Queue::unhandled` -> `fold`, the same read one raise makes) |
| Detection, all definitions in one call | 8.29 s | `fgos metrics query --def core/watcher/definitions --since <now-1d> --json`, one run, wall time |
| R, raise calls per tick | 328 | DISCUSSION §5, 2026-11-28 19:27 (definition answers). Not re-measured: the tick query below returned a count only. |
| Full tick wall time | 1913 s and 1767 s (latest two ticks) | DISCUSSION §5, 2026-11-28 19:25 (watcher journal). Not re-measured. |
| Ticks in the last 3 h | 7 | `fgos metrics query --kind fgos.watcher.tick --since <now-3h> --json` (0.79 s). Count only: `--by ts` was refused ("not a declared attr") and `--latest-per kind` was refused, so per-tick raised, duplicate and outcome fields were not read. |

## Per step

| Step | Wall time | Share of a 1767-1913 s tick | How measured |
|---|---|---|---|
| Detection | 8.29 s | 0.4-0.5% | measured directly (above) |
| Raise loop | 328 x F = 1204 s (fastest F) to 2116 s (median F) | 63-68% at fastest F; at median F the product exceeds the whole tick | R x F |
| Wake and the rest | tick - detection - raise loop: at most about 700 s at fastest F, about 0 at median F | 0-37% | subtraction |

The median product exceeding the tick is expected: each `fgos supervisor queue` run also pays a process start and
the CLI's own work, so a fold inside the tick costs somewhat less than F. The tick itself implies about
(1913 - 8.29) / 329 = 5.8 s per fold, between the fastest and the median run.

## Queue reads in the raise step

R = 328 folds of the whole `project` stream for the raise step (one per `Queue::raise`, `queue.rs:216` -> `fold` at
`:327`), plus one fold for the wake's `unhandled`: 329 full stream reads per tick.

## Gaps

- R and the tick wall times come from DISCUSSION §5, not from this measurement: the tick metric query could not
  return per-tick fields with the doors that exist today. The 7-tick count in 3 h (about 26 min apart) agrees with
  the journal's 20-32 min ticks.
- `fgos metrics query` answered from the supervisor's confined session without an `ask`, unlike the plan's Host
  steps table assumed.

raise loop dominant: yes (at least 63% of the tick; 1204-2116 s of a 1767-1913 s tick)
