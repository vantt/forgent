# CONCLUSION — tsk-5k1

## Summary

This work item (`tsk-5k1`) addresses a regression where opportunistic `main` checkout checks caused test failures under certain test invocations. As documented in `docs/history/tsk-5k1/RESEARCH.md:30-31` and `docs/history/tsk-5k1/plan.md:28-31`, this issue is already fully resolved by commit `8607438e` (`fix(state): add opt-out gate for opportunistic main checkout checks (tsk-oet)`), which landed prior to `tsk-5k1`'s branch head (`c6f486d6`). No further source code changes are required.

## Evidence & Citations

1. **Opt-out gate implementation:**
   - `src/state/events-jsonl-truncation-guard.mjs:209`: `runOpportunisticMainCheckoutChecks` starts with an opt-out check (`if (process.env.FGOS_DISABLE_OPPORTUNISTIC_CHECKS === "1") return;`), as cited in `docs/history/tsk-5k1/RESEARCH.md:24-29` and `docs/history/tsk-5k1/plan.md:25-27`.

2. **Package test script configuration:**
   - `package.json:27`: The `test` script is configured as `"test": "FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/**/*.test.mjs'"`, ensuring all standard `npm test` invocations set `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1` (cited in `docs/history/tsk-5k1/RESEARCH.md:40-42` and `docs/history/tsk-5k1/plan.md:28-31`).

3. **Commit history:**
   - Commit `8607438e` (`fix(state): add opt-out gate for opportunistic main checkout checks (tsk-oet)`) introduced the env var gate on `main` before `tsk-5k1`'s branch point (`c6f486d6`), as cited in `docs/history/tsk-5k1/RESEARCH.md:30-31,43-44` and `docs/history/tsk-5k1/plan.md:30-31`.

4. **Empirical verification:**
   - Tests `test/cli/fgos-claim.test.mjs`, `test/cli/fgos-read.test.mjs`, and `test/cli/fgos-return.test.mjs` pass 218/218, and `test/e2e/runner-loop.test.mjs` passes 15/15 when run with `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1` via `npm test` (cited in `docs/history/tsk-5k1/RESEARCH.md:57-62` and `docs/history/tsk-5k1/plan.md:33-36`).

## Conclusion

No source code changes are needed for `tsk-5k1`. The item is confirmed resolved and ready for closure.
