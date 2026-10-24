# test/runner/loop.test.mjs A/B: origin/main vs work/es-cutover tip

Date 2026-10-23 (Asia/Saigon). Test file only, no product code touched.

## Revisions
- A = origin/main = 2cab9c6f1316f073bf16307d8ee56294e72818df
- B = 9b5eae9dd8fe1fac9c1730dda8b6b5e896568be1 (origin/work/es-cutover tip). Coordinator changed B from 81e502247 mid-task.

## Setup
- Detached linked worktrees /home/vantt/projects/forgent-worktrees/ab-main and ab-branch; separate CARGO_TARGET_DIR per side on ext4 (ab-main-target, ab-branch-target).
- Node deps: none needed (package.json "dependencies" is empty); nothing installed or symlinked.
- Runner: scratchpad fr.mjs -> repo scripts/run-tests.mjs runSelectedTests, FGOS_TEST_FILE_TIMEOUT_MS=900000, session env vars unset.
- Warmed each side with test/cli/fgos-read.test.mjs (debug host built there); B re-warmed after switching to 9b5eae9dd.
- Aborted first attempt: A at 14:35 (296 s, 98 pass) then B at 81e502247 killed mid-run when the revision changed; discarded. The 4-run sequence below was restarted whole at 14:42.
- Load was already <3 at start (other lanes idle-ish); no other heavy work of mine in parallel.

## Runs (back to back)
| # | side | start | end | load1 start/end | wall | pass/fail |
|---|------|-------|-----|-----------------|------|-----------|
| 1 | A main | 14:42:01 | 14:47:02 | 1.73 / 1.56 | 301 s | 98 / 0 |
| 2 | B branch | 14:47:02 | 14:56:34 | 1.56 / 2.00 | 572 s | 99 / 0 |
| 3 | A main | 14:56:34 | 15:01:35 | 2.00 / 1.33 | 301 s | 98 / 0 |
| 4 | B branch | 15:01:35 | 15:11:09 | 1.33 / 1.90 | 574 s | 99 / 0 |

Ratio B/A: pair 1-2 = 1.90, pair 3-4 = 1.91. (B has one more test, 99 vs 98.)

## Conclusion
At equal low load (1.3-2.0) the branch is slower, about 1.9x: ~573 s vs 301 s, +272 s. The result is stable across both pairs (A 301/301, B 572/574), so it is not load drift. Both pass fully, and B is under the 600 s per-file limit but with only ~26 s margin (4.4%); any added load or test growth could cross it. Cause of the slowdown not diagnosed here.
