# tsk-12o — RESEARCH.md

## Round 1 (2026-08-24, discovery stage)

**Asked:** confirm the reproduction technique for reaching sync-root's
defensive outcome guard (`src/verbs/merge/sync-root.mjs:147-167`, tsk-4hj
D4) with `mergeRunnerItem`'s `'merge-failed-unclassified'` outcome
specifically through sync-root's own CLI call path (not just at the
`mergeRunnerItem` unit level, already covered by
`test/runner/merge.test.mjs:468,697`), and confirm a real verify command
for the regression test to add.

**Checked:**

- `src/verbs/merge/sync-root.mjs:147-167` (read directly) — the guard
  (unchanged since tsk-3df's own research): `if (result.outcome !==
  'merged')` sets `errorClass: 'sync-root-unhandled-outcome'`, returns
  `{ outcome: 'blocked', reason: result.outcome, ... }`.
- `src/runner/merge.mjs:1180-1270` (read directly) — `mergeRunnerItem`'s
  own merge attempt: `git(repoRoot, ['merge', '--no-commit', '--no-ff',
  branch])`. On throw, it checks `classifyDecisionIndexCollision` (only
  matches when exactly one unmerged path exists and it is
  `docs/decisions/0000-index.md`), then `mergeHeadExists(repoRoot)`
  (`genuineConflict`). If neither branch matches, it returns
  `{ outcome: 'merge-failed-unclassified', branch, error: {message,
  stderr, status} }` — this is the fallback for "the merge attempt threw,
  but it's neither the known decision-index-collision shape nor a real
  git conflict (no MERGE_HEAD)".
- `test/runner/merge.test.mjs:459-486` (read directly) — the exact
  real-world reproducer for this outcome at the unit level: a stray
  UNTRACKED file already sitting at the exact path the incoming branch's
  own new commit introduces makes `git merge --no-commit --no-ff` fail
  with "The following untracked working tree files would be overwritten
  by merge" (exit 128) WITHOUT ever creating `MERGE_HEAD` — a real,
  unmocked git behavior, not a simulated one.
- `src/verbs/merge/sync-root.mjs:250-251` and
  `src/runner/merge.mjs:176-182,211-218` (read directly) — sync-root's own
  CLI-level pre-check, `isMainTreeClean(repoRoot, ownFileSet)`, where
  `ownFileSet = buildOwnFileSet(runnerOwnDiff, item.footprint)` and
  `runnerOwnDiff = ironLawForItem(...).filesChanged` = `git diff
  --name-only trunk...branch` (`src/runner/iron-law-gate.mjs:57-59`,
  `src/runner/merge.mjs:364-378`) — i.e. exactly the LEAF file paths the
  branch's own commit touches, never their parent directories.
  `isFgosOnlyStatusLine` (`src/runner/merge.mjs:157-167`) tolerates any
  dirty status line whose path is NOT in `ownFileSet`. This means: an
  untracked file collision at the SAME leaf path the branch's commit
  introduces (e.g. `<rootId>-produced.txt`, `makeDriftedRoot`'s own
  produced-file shape) is refused EARLIER by this pre-check
  (`test/cli/fgos-merge.test.mjs`'s existing `'sync-root-dirty'` test,
  exit 4 "is not clean") and never reaches `mergeRunnerItem` at all — the
  unit-level reproducer above cannot be reused verbatim through
  sync-root's own CLI call path.
- **Empirically confirmed** (real git, no mocking, scratch repo outside
  this checkout): if the branch's own new commit adds a NESTED file
  (`somedir/leaf.txt`), `ownFileSet` contains only `somedir/leaf.txt` —
  never the parent directory name `somedir` itself. Placing an untracked
  plain FILE (not a directory) at path `somedir` on the target checkout
  passes `isMainTreeClean`'s pre-check (that exact status line's path,
  `somedir`, is not in `ownFileSet`), then `git merge --no-commit --no-ff`
  fails with the exact same "untracked working tree files would be
  overwritten" (naming `somedir`), exit 128, MERGE_HEAD never created —
  reaching `mergeRunnerItem` and reproducing
  `'merge-failed-unclassified'` through sync-root's real CLI call path.
- `test/cli/fgos-merge.test.mjs:1123-1158` (existing
  `'merge-blocked-other-item'` regression test) and
  `test/cli/fgos-merge.test.mjs:1160-1189` (existing
  `'lock-lost-mid-merge'` regression test, tsk-3df) — both reused as the
  structural template: `makeDriftedRoot`
  (`test/cli/helpers/fgos-cli-harness.mjs:605`) to stand up the drifted
  root/branch, then assert `outcome: 'blocked'`, `reason:
  '<the-outcome-string>'`, a `frictions` entry with `errorClass:
  'sync-root-unhandled-outcome'`, main's HEAD unchanged, and no `merged`
  decision recorded.

**Verify (real, run and green):**

```
node --test --test-name-pattern="merge-failed-unclassified" test/cli/fgos-merge.test.mjs
```

Full-file regression run also green: `node --test test/cli/fgos-merge.test.mjs`
(61/61 pass, including the new test alongside the two existing
adjacent-outcome guard tests it was modeled on).

**Verdict:** clear. The reproduction technique is proven (real git, not
mocked), does not collide with the pre-existing dirty-tree guard test's
own coverage, and the regression test has been written and passes. No
open question remains.
