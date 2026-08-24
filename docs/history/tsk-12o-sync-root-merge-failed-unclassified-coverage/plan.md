# tsk-12o — plan.md

Mode: tiny

**Flags counted (fgos-routing Mode gate):** 0 — auth: no, authorization:
no, data model: no, audit/security: no, external systems: no, public
contracts: no, cross-platform: no, existing covered behavior: no (adds a
NEW test, changes no existing test's assertions), weak proof around the
area: no (the guard's own shape and outcome list are already fully
documented by tsk-3df's RESEARCH.md), multi-domain: no. Single domain
(coding), single file touched, one test added — the "couple of files, one
direct task" tiny bar.

## Approach

**Chosen path.** Add one CLI-level regression test to
`test/cli/fgos-merge.test.mjs`, placed directly between the two existing
adjacent-outcome guard tests it is modeled on
(`'sync-root never reports outcome "synced"...'` for
`merge-blocked-other-item`, at line 1123, and `'sync-root outcome guard
catches lock-lost-mid-merge...'` for `lock-lost-mid-merge`, tsk-3df, at
line 1160) — same fixture family (`makeDriftedRoot`,
`test/cli/helpers/fgos-cli-harness.mjs:605`), same assertion shape
(`outcome: 'blocked'`, `reason: '<outcome-string>'`, a `frictions` entry
with `errorClass: 'sync-root-unhandled-outcome'`, HEAD unchanged, item
status untouched, no `merged` decision recorded).

**Reproduction technique (the actual design decision this plan makes,
per RESEARCH.md Round 1).** The item's own description suggested reusing
`makeDriftedRoot`'s "verify-injection technique" (the mechanism
`lock-lost-mid-merge`'s test uses: a `verify` command that corrupts state
mid-merge) — but `merge-failed-unclassified` is produced at the `git
merge --no-commit --no-ff` step itself, BEFORE `verify` ever runs, so that
literal mechanism does not apply here. RESEARCH.md's own real-git-backed
finding is what this plan actually follows instead: an untracked file
collision at the exact DIRECTORY path the branch's own new nested file
needs to create (never the leaf path itself, which the CLI's own
pre-existing `isMainTreeClean`/`ownFileSet` dirty-tree guard already
refuses earlier — proven by the existing `'sync-root-dirty'` test right
above in the same file). `makeDriftedRoot` is still reused as the base
fixture (root item + branch scaffold); the nested-file commit and the
untracked-directory-path collision are added on top of it in the test
body, the same way the existing `'sync-root-conflict'`/`'sync-root-dirty'`
tests already layer extra git ops onto `makeDriftedRoot`'s own output.

**Alternatives rejected.**
- *Reuse the exact `verify`-corruption mechanism as literally named in the
  item description* — rejected: `merge-failed-unclassified` is returned
  before `verify` (the goal-check) ever runs (`src/runner/merge.mjs`'s own
  merge-attempt `catch` block, lines ~1213-1270, all precede
  `runGoalCheck` at line ~1183, which only runs after `outcome !==
  'merged'`'s guard has already returned early for every other outcome).
  Confirmed by reading the function's control flow directly.
- *Place the untracked file at the branch's own leaf path
  (`<rootId>-produced.txt`), mirroring the unit-level test verbatim* —
  rejected: proven (both by reading `isMainTreeClean`'s `ownFileSet`
  logic and by a live scratch-repo git reproduction) to trip the
  CLI-level dirty-tree pre-check first, never reaching `mergeRunnerItem`
  at all — this is exactly what the existing `'sync-root-dirty'` test
  already asserts for that same shape.
- *Simulate `classifyDecisionIndexCollision`'s own `resolveErr` throw
  path* — rejected: requires forcing an internal fs/git read to throw,
  not a clean, deterministic, real-world-shaped reproduction; the
  untracked-directory-collision path is a genuine git behavior, not a
  forced internal failure.

**Risk map.** Light. The change is additive-only (one new `test(...)`
block); no production code path is touched. The only risk is the new test
itself being flaky or accidentally asserting on the wrong outcome — closed
by having already run it (both in isolation and as part of the full file)
and confirmed green, see Proof below.

**Files touched.** `test/cli/fgos-merge.test.mjs` only (plus this
`docs/history/` pair).

## Shape

One `test(...)` block added to `test/cli/fgos-merge.test.mjs`, immediately
after the existing `'sync-root never reports outcome "synced"...'`
(`merge-blocked-other-item`) test and before the existing
`'sync-root outcome guard catches lock-lost-mid-merge...'` (tsk-3df) test:

1. `initGitCwdMain()` + `fgos init`.
2. `makeDriftedRoot(cwd, 'sync-root-merge-failed', { verify: 'true' })` —
   standard drifted-root fixture (root item `status: doing`, branch
   `fgw/sync-root-merge-failed` carrying one commit that adds
   `sync-root-merge-failed-produced.txt`).
3. Checkout the branch again, add a SECOND commit that introduces a nested
   file `sync-root-merge-failed-dir/leaf.txt`, checkout `main`.
4. Write an untracked file AT THE DIRECTORY PATH ITSELF
   (`sync-root-merge-failed-dir`, a plain file, not a directory) on `main`.
5. Call `run(cwd, ['sync-root', 'sync-root-merge-failed'])`.
6. Assert: exit 0; `outcome: 'blocked'`; `reason:
   'merge-failed-unclassified'`; `outcome !== 'synced'`; `git rev-parse
   --verify MERGE_HEAD` throws (never created); main's HEAD unchanged; the
   root's own top-level produced file never landed on main; the stray
   untracked file survives untouched; item status stays `doing`; a
   `frictions` entry with `errorClass: 'sync-root-unhandled-outcome'`
   exists; no `merged` decision recorded.

This has already been written and verified during discovery-stage
research (RESEARCH.md Round 1) — this Shape section documents the same
change already sitting in the worktree, not a future one.

## Assumptions

None material — the reproduction technique is proven by direct evidence
(RESEARCH.md Round 1), not assumed.

## Outstanding questions

None.
