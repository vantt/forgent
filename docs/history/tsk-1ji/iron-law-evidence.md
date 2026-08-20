# Iron Law Evidence — tsk-1ji

## Matched Modules
- `src/state/store.mjs`
- `src/runner/claim-port.mjs`
- `src/runner/merge.mjs`

## Verification Command
`node --test test/state/events-jsonl-truncation-guard.test.mjs test/runner/claim-port.test.mjs test/runner/merge.test.mjs`

## Test Output
```
✔ claimWork reads the event log fully 3 times per call, not 6 or 7 (tsk-3jh dedupe + tsk-49e incremental snapshot)
✔ claimWork invokes runOpportunisticMainCheckoutChecks non-blockingly and succeeds even when truncation guard detects a break
✔ runOpportunisticMainCheckoutChecks D1: records warning on truncation break into main-checkout-guard-warnings.jsonl without throwing
✔ runOpportunisticMainCheckoutChecks D2: commits stale-and-dirty events.jsonl when timestamp gap >= intervalSec
ℹ tests 129
ℹ suites 0
ℹ pass 129
ℹ fail 0
```
