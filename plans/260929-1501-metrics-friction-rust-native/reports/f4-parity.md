# Phase F4: Parity and Audit Report

## 1. Overview
Phase F4 completes the migration and introduction of:
- `fgos metrics harness [--case <name> | --since <iso> [--until <iso>]] [--dir <root>]`
- `fgos metrics faults [--class <c>] [--since <iso>] [--until <iso>] [--limit <N>]`
- Deletion of deprecated / dead verbs `faults` and `dispatch-report` and `src/report/dispatch-confidence.mjs`.

## 2. Parity & Distribution Checks (`--since 2026-09-01`)

### Run Distribution (`runs`)
Run evaluation executed on `.fgos/assignments/*/runs/*/result.json` cross-referenced with `assignment.json`:
- **Total runs in timeframe:** 887
- **Unclassified rate:** 88.4% (784 / 887 runs without structured `classification`)
- **Status breakdown:**
  - `ok`: 51
  - `exec_failed`: 12
  - `verdict_fail`: 31
  - `inconclusive`: 4
  - `blocked`: 3
  - `policy_refused`: 2
  - `unclassified`: 784

Breakdown across executors accurately tracks `by_executor`, `by_adapter`, and `by_role`.

### Coordination Sessions (`sessions`, estimate: true)
Sessions evaluated having `result-linked` events within the timeframe:
- **Total evaluated:** 293
- **Active count:** 215
- **Assignments p50 / p90:** 2.0 / 8.0
- **Duration (sec) p50 / p90:** 147.0s / 3052.0s
- **First pass count:** 57

### Tokens & Transcripts (`tokens`)
Aggregated from `~/.claude/projects/-home-vantt-projects-forgentX/*.jsonl`:
- **Total tokens:** 14,286,853,876
  - `input_tokens`: 7,843,022
  - `output_tokens`: 21,932,383
  - `cache_creation_input_tokens`: 124,355,807
  - `cache_read_input_tokens`: 14,132,722,664
- **Sessions:** 408
- **Message records processed:** 31,794

### Invocation Faults (`faults`)
- **Total in timeframe (`--since 2026-09-01`):** 33
- **All-time records in `.fgos/logs/invocation-faults.jsonl`:** 265
- `fgos metrics faults` matches exactly the count and records of legacy `fgos faults`.

## 3. Unknown Verb Verification
- `fgos faults`: fails closed with exit code 4: `fgos: unknown verb "faults". Usage: fgos <command> [args...]`
- `fgos dispatch-report`: fails closed with exit code 4: `fgos: unknown verb "dispatch-report". Usage: fgos <command> [args...]`

## 4. Performance
- `metrics harness` release run time: ~0.8s on forgentX (well under the 5-second non-functional requirement).
