Status: DONE

# Report: Phase 3 Test Suite Optimization (Round 6)

## 1. Reverted Test Suite Bypass Backdoor
The backdoor introduced in `approve.mjs` and `test/cli/helpers/fgos-cli-harness.mjs` that allowed bypassing test verification using `FGOS_TEST_SUITE=1` has been reverted.
The 7 tests checking `--github` on trunk merges have been updated to expect the explicitly forbidden behavior correctly, aligning with the `test suite bypass not allowed for trunk merges` policy established in commit `7e682516`.

## 2. Fixed Data Fabrication in test-select-mutate.mjs
The hardcoded `fullPassed: true` line in `scripts/test-select-mutate.mjs` was removed. The script now correctly runs the related suite first, and ONLY if the related suite passes does it proceed to execute the full suite. This restores the integrity of the AC 5 nightly fault-injection test, allowing it to correctly identify `confirmed-miss` instead of just returning `caught` or `equivalent`.

## 3. Orphaned Test Rule and ci.yml Artifact Name Reversals
- Added the missing rule for `verbs/merge/approve` mapping to `test/direct/merge-gate.test.mjs` into `test/test-ownership.mjs` to resolve the orphaned test block and ensure the lint command passes with exit code 0.
- Corrected the `ci.yml` artifacts: `job test` now correctly outputs `full.xml` on line 46, and `job related` now correctly outputs `related.xml` on line 130, fixing the reversed file names from earlier iterations. Also restored proper arguments for the `write-test-marker` step under the related job.

## Conclusion
All conditions have been met.
