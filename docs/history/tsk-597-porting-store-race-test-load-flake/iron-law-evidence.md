# Iron Law evidence — tsk-597

`classifyIronLaw` result against the committed diff
(`git diff main...HEAD -- test/state/porting-store.test.mjs`):

```json
{"required":true,"matchedFlags":["kiểm toán"],"matchedModules":[]}
```

(The `matchedFlags` hit is the same incidental "kiểm toán" phrase match
already surfaced at the `validateApprove` gate — the item's own text
mentions a prior audit/review round, not the work itself touching an
audit system; confirmed with the user before proceeding.)

## Failing-test-first proof

The real defect only manifests under genuine heavy machine load, which
this session did not induce directly — another live session is actively
using this shared machine (see `RESEARCH.md`/`plan.md`'s own constraint
note). Instead, mirroring `tsk-3wn`'s own "temporarily strip the
mechanism, prove the failure, revert" methodology: `src/state/
events.mjs`'s `EVENTS_LOCK_TIMEOUT_MS` (normally `2000`) was temporarily
lowered to simulate contention pressure without loading the machine,
calibrated by direct experiment to a value (`30`ms) that discriminates
cleanly between the unbatched (before) and batched (after) versions of
the two target tests — reverted immediately after, confirmed via `git
diff src/state/events.mjs` showing no diff.

Command each run: `node --test test/state/porting-store.test.mjs
--test-name-pattern "SAME id|SAME expectedStatus"`.

**Before** (batching diff reverse-applied via `git apply -R`,
`EVENTS_LOCK_TIMEOUT_MS = 30`):

- Run 1: `addPorting` race **FAILED** (`category: 'lock-timeout'`),
  `movePorting` race passed.
- Run 2: `addPorting` race passed, `movePorting` race **FAILED**
  (`category: 'lock-timeout'`).

Matches the item's own real-incident shape exactly: a single race test
red with `category`/`errorClass` pointing at a lock-acquisition timeout,
not a logic assertion — genuinely flaky, not deterministic, exactly as
`tsk-31lz`'s own observed incident (red once, clean retry) describes.

**After** (batching diff re-applied, matching the committed state
exactly, same `EVENTS_LOCK_TIMEOUT_MS = 30`):

- Run 1: both target tests passed.
- Run 2: both target tests passed.
- Run 3: both target tests passed.

3/3 clean vs 2/2 unbatched runs each producing a lock-timeout failure, at
the identical simulated-contention setting — direct evidence the
`batchSize: 4` change reduces peak simultaneous lock contention enough to
clear the same budget the unbatched version was missing.

Full `npm test` (production `EVENTS_LOCK_TIMEOUT_MS = 2000` restored, all
3180 tests) also green after re-applying and reverting the timeout —
3175 pass, 0 fail, 5 skipped (unrelated, pre-existing).
