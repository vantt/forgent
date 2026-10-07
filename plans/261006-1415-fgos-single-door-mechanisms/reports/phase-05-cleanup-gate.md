# Phase05 final cleanup gate — explicitly approved and executed

Verified pre-cleanup hygiene implementation committed on `feat/single-door-execution` as `f053de033`. Original planning worktree/main user edits and main activation untouched. Guard final acceptance: 495/495 tests, all16 existing consumers plus9 new behavioral cases, three separate actual-git smoke scenarios. Review initially found staged comment-decoy bypass; corrected using trusted HEAD declaration ranges and hardened staged hunks; narrow re-review correct, confidence0.97. Historical first green493 and initial red7/4/3 remain in test report.

GitNexus hook symbol unavailable (UNKNOWN), main index stale20commits. Direct execution index lookup failed because worktree unregistered; `detect-changes` successfully ran with explicit execution `GIT_DIR`/`GIT_WORK_TREE` and existing main graph, measuring correct staged201files/88indexed symbols/0reported processes/LOW. Treat zero-process/LOW as degraded graph output, not complete new-symbol coverage; exact current callers and behavioral suites supplied the acceptance evidence. Staged literal credential scan across raw diff returned no matches.

## Preservation proof

No existing `pre-root-junk-cleanup` ref found. Created annotated tag with the accepted command at pre-cleanup HEAD `f053de033`. Actual `git ls-tree --name-only pre-root-junk-cleanup` includes every one of the30 names below and the case-study note. At gate creation, no deletions had been performed and root inventory was45 tracked files:14keep +30delete +1move, with no unexpected entries.

## Exact tracked deletion set

```
count.cjs
debug_args.cjs
debug_spec.cjs
dump.cjs
fix_assignment.cjs
fix_herdr.cjs
fix_herdr2.cjs
fix_openSession.cjs
fix_openSession2.cjs
fix_openSession3.cjs
fix_openSession4.cjs
fix_openSession5.cjs
fix_openSession6.cjs
fix_openSession_safe.cjs
fix_test_legacy.cjs
fix_tests.cjs
openSession.txt
original.txt
reverse.patch
rewrite_store.cjs
store_refactor.cjs
test_atomics.mjs
test_concurrency.cjs
test_concurrency.log
test_concurrency2.cjs
test_concurrency2.log
test_herdr.cjs
test_regex.cjs
timed-executor.mjs
timed-executor2.mjs
```

Remeasured exact-name search under `src`, `bin`, `scripts`, `test`: only historical git-status data rows in `test/fixtures/run-outcome/legacy-derivation.json` and `test/fixtures/run-result/real-shapes/09-*.json`, `10-*.json`; no code consumers/imports. Preserve those data rows, then run the two actual fixture readers after deletion.

## D2 destination and byte preservation

Move unchanged `tsk-1op-case-study-note.md` to `docs/history/live-fgos-pick-case-study/CONTEXT.md`. Existing history uses feature-named directories with `CONTEXT.md`; no matching destination collision. Explicit owner D2 preservation overrides the old note's suggestion to delete it after closing the original item. This is the documented narrow exception to the separate documentation-authority migration; its worktree untouched.

## Commands after confirmation

`git rm -- <the exact30 names above>` in execution checkout; create the named history directory and move the unchanged note with `git mv`. Run fixture consumers and commit deletion/move separately from the already-committed guard. No force-tag, no blanket clean, no main integration/push.

`output.txt` is absent in execution checkout. Main `/home/vantt/projects/forgentX/output.txt` re-read: `produced by worker` plus newline,19bytes, untracked/ignored. The tag cannot preserve it. Delete only with explicit G1 approval including that main-only artifact; otherwise retain and record intentional exclusion. No other main file is eligible.

## Approved execution

Owner selected **Dọn đủ theo plan** at the explicit G1 final confirmation.
Executed `git rm` for precisely the30 approved tracked names. Specialized
file rename preserved the case-study bytes and Git staging recorded the
relocation; `git show pre-root-junk-cleanup:tsk-1op-case-study-note.md | cmp - docs/history/live-fgos-pick-case-study/CONTEXT.md`
exited0. Deleted only the expressly approved main `output.txt`, anchored by its
latest unchanged content snapshot. No other main file or activation changed.

After deletion, the two requested fixture consumers passed10/10 tests,
including all17 historical outcome cases. Actual `git ls-files -- ':(top,glob)*'`
returned exactly the14-file keep set; no scratch root entries remain in the
execution index. Preservation tag remains untouched. Cleanup commit remains
separate from the pre-cleanup hygiene/guard commit.
