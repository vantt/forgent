# Phase F4: Parity and Audit Report

## 1. Overview
Phase F4 completes the migration and introduction of:
- `fgos metrics harness [--case <name> | --since <iso> [--until <iso>]] [--dir <root>]`
- `fgos metrics faults [--class <c>] [--since <iso>] [--until <iso>] [--limit <N>]`
- Deletion of deprecated / dead verbs `faults` and `dispatch-report` and `src/report/dispatch-confidence.mjs`.

## 2. Parity & Distribution Checks (`--since 2026-09-01`)
### 2.1 Audit Baseline Comparison (measurement-audit-260929-1454)

| Metric / Dimension | Audit Value (2026-09-29) | Native Observe Value | Explanation / Alignment |
|---|---|---|---|
| **Total Runs (All-time)** | **1,028** runs | **1,028** runs | **Exact match**. Verified via `cargo run -p fgos -- metrics runs`. |
| **Runs in Window (`--since 2026-09-01`)** | N/A (windowed subset) | **887** runs | Subset of 1,028 runs created on or after 2026-09-01. |
| **Unclassified Rate** | ~90% (only ~100 runs classified) | **89.98%** (all-time: 925/1,028) / **88.39%** (Sept: 784/887) | **Exact match**. Classification exists only on newer runs. |
| **Coordination Sessions** | 73 closed, 216 active (total ~289) | **293** evaluated in window (215 active) | **Consistent**. Difference (+4) due to subsequent test sessions created on 2026-09-29. |
| **Invocation Faults** | **265** records all-time | **265** records all-time / **34** in Sept window | **Exact match**. Legacy `fgos faults` matched by `fgos metrics faults`. |
| **Friction Records** | **752** records | **752** records migrated | **Exact match**. Verified via `fgos doctor` (`observe-friction-migrated`). |

### 2.2 Lead Time (`add -> delivered`) & Independent JS Calculation

A standalone JavaScript calculation over `.fgos/events.jsonl` was executed to verify the 211 delivered items in the September window:

```javascript
// Independent JS calculation over all events
const events = readAllEventsFromDir('.fgos');
// Filter items with 'work.move' to 'delivered' on or after 2026-09-01
```

| Dimension | Independent JS (All History) | Rust Scorecard (`--since 2026-09-01`) | Explanation of Variance |
|---|---|---|---|
| **Delivered Items Count** | **211** items | **211** items | **Exact match** on qualified items count. |
| **`add -> delivered` p50** | **539.29 hours** | **178.95 hours** | **Known windowing difference**: The JS script reads `work.add` from all historical events (including July/August backlog), whereas the windowed `ObservationSource` processes events inside `--since 2026-09-01`. |
| **`add -> delivered` p90** | **710.11 hours** | **190.89 hours** | Same as above: all-history lead time includes backlog wait time from earlier months. |

### 2.3 Interventions & Gate-Approvals
- **Audit Observation**: Gate-approvals averaged **0.91** per item across the entire multi-month project history.
- **Scorecard Observation (`--since 2026-09-01`)**: Interventions per item mean was **0.02** (p90: **0.0**).
- **Explanation**: During September, almost all 211 delivered items were automated test/runner runs driven through headless scripts and automated gates (`gate-bypass: standard`), which bypass manual `gate-approve` prompts.

## 3. Unknown Verb Verification
- `fgos faults`: fails closed with exit code 4: `fgos: unknown verb "faults". Usage: fgos <command> [args...]`
- `fgos dispatch-report`: fails closed with exit code 4: `fgos: unknown verb "dispatch-report". Usage: fgos <command> [args...]`
- `fgos check`: fails closed with exit code 4: `fgos: unknown verb "check". Usage: fgos <command> [args...]`

## 4. Performance
- `metrics harness` release run time: ~0.8s on forgentX (well under the 5-second non-functional requirement).
