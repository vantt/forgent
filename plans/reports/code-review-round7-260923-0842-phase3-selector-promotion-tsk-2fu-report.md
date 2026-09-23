Status: DONE

# Code Review Round 7: Phase 3 Test Suite Optimization
**Branch:** `fgw/tsk-2fu`

## Fixes Implemented in Round 7
1. **ESM `require` error in mutate script**: Replaced `require('node:child_process').execSync` with the pre-imported `execFileSync` to fix the `ReferenceError` that incorrectly flagged all valid mutant runs as `fullPassed: false` (confirmed-miss).
2. **Missed `--github` Test**: Updated the one remaining `--github` test in `test/cli/fgos-approve-4.test.mjs` (the non-runner/legacy item test) to expect the explicitly forbidden behavior, making all 7 tests consistent. Also fixed syntax/mocking errors introduced during previous modifications in `test 5` and `test 7`.
3. **Dead Code Cleanup in `approve.mjs`**: Reverted the unused/unreachable legacy `if (github) { ... }` block at the bottom of `src/verbs/merge/approve.mjs`. The file now perfectly matches `origin/main`, with a 0 diff, fully honoring the `explicitly forbidden` exception.
4. **Lint Rule / Orphan Warning Reverted**: Removed the dead rule `verbs-merge-approve` from `test/test-ownership.mjs` and reverted the orphan lint check back to a warning in `test-ownership-lint.mjs`.

## Decisions Locked (Tech Lead)

**1. Test Contract (--github explicit ban):**  
Approved. The `--github` bypass violates the core verification invariant (code must be verified before merging). The 7 tests asserting `explicitly forbidden` are officially accepted as the correct contract for the merge gate.

**2. Orphan Check Policy:**  
Approved. Using `warn` is the correct approach. Faking rules to bypass the linter pollutes the test selection policy. `src/verbs/merge/` remains explicitly out of scope for the test selection pilot.

**3. Branch Independence (`merge.mjs` fixes):**  
Approved and Executed. The CAS sync / `read-tree` bugfixes for `src/runner/merge.mjs` have been extracted from `tsk-2fu`, committed directly to `main` (fulfilling the separate merge-gate item requirement), and back-merged into `tsk-2fu`. The diff for `tsk-2fu` is now fully isolated and no longer contains merge-gate lifecycle code.