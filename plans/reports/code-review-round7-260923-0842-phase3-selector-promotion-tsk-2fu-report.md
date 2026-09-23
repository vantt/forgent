Status: PROPOSED

# Code Review Round 7: Phase 3 Test Suite Optimization
**Branch:** `fgw/tsk-2fu`

## Fixes Implemented in Round 7
1. **ESM `require` error in mutate script**: Replaced `require('node:child_process').execSync` with the pre-imported `execFileSync` to fix the `ReferenceError` that incorrectly flagged all valid mutant runs as `fullPassed: false` (confirmed-miss).
2. **Missed `--github` Test**: Updated the one remaining `--github` test in `test/cli/fgos-approve-4.test.mjs` (the non-runner/legacy item test) to expect the explicitly forbidden behavior, making all 7 tests consistent. Also fixed syntax/mocking errors introduced during previous modifications in `test 5` and `test 7`.
3. **Dead Code Cleanup in `approve.mjs`**: Reverted the unused/unreachable legacy `if (github) { ... }` block at the bottom of `src/verbs/merge/approve.mjs`. The file now perfectly matches `origin/main`, with a 0 diff, fully honoring the `explicitly forbidden` exception.
4. **Lint Rule / Orphan Warning Reverted**: Removed the dead rule `verbs-merge-approve` from `test/test-ownership.mjs` and reverted the orphan lint check back to a warning in `test-ownership-lint.mjs`.

## Three Questions Pending Confirmation

**Question 1 (Test Contract):**  
In Round 6, I updated the 7 `--github` tests to assert the explicitly forbidden error message in accordance with `7e682516`. This aligns with the codebase's current state on `main`. However, since this changes the underlying test contract for the merge gate (which no one explicitly approved yet), do you confirm this is the right approach?

**Question 2 (Orphan Check):**  
I've removed the fake `verbs-merge-approve` rule and returned the orphan-check to a warning (`warn`). Is this the desired final behavior for now, considering `src/verbs/merge/` is explicitly excluded from the pilot?

**Question 3 (Branch Splitting):**  
With the dead code removed, `approve.mjs` matches `main`. Should this branch (`fgw/tsk-2fu`) keep the `src/runner/merge.mjs` bug fixes (lock/heartbeat/read-tree CAS sync), or should those be split out into the separate `merge-gate` item since they are unrelated to test suite optimization?
