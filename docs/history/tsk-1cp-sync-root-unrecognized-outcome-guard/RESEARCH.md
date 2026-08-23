# tsk-1cp — RESEARCH.md

## Round 1 (2026-08-11, stage discovery)

**Asked:** is the item's own goal — track/trace the `sync-root` defensive
guard against unrecognized `mergeRunnerItem` outcomes, independently of
tsk-4hj — already clear enough to proceed, and what is the real evidence
behind it?

**Checked (repo, `fgw/tsk-4hj` branch — the guard is committed there,
not yet on `main`; tsk-1cp `deps: ["tsk-4hj"]`, currently `awaiting-
approval`):**

- Guard code: `bin/fgos.mjs:3404` (branch `fgw/tsk-4hj`), inside the
  `sync-root` verb's `runAndReport` path — `if (result.outcome !== 'merged')`
  raises `errorClass: 'sync-root-unhandled-outcome'` and returns
  `{ outcome: 'blocked', reason: result.outcome, ... }` instead of falling
  through to the success block and reporting `{ outcome: 'synced' }` for a
  merge that never completed. Commit `fc59e7d9` (`fix(tsk-4hj): distinguish
  a pre-existing MERGE_HEAD from another item's merge`).
- Test: `test/cli/fgos.test.mjs:6374` (branch `fgw/tsk-4hj`) —
  `'sync-root never reports outcome "synced" when mergeRunnerItem returns
  an outcome it does not explicitly handle -- proves the defensive guard
  closes the false-success gap D4 found'`.
- Fail-before/pass-after proof already recorded: `docs/history/tsk-4hj-
  stale-merge-head-misclassified-as-conflict/iron-law-evidence.md`
  (branch `fgw/tsk-4hj`) shows this exact test failing against the
  pre-fix `bin/fgos.mjs` (`git show HEAD~2:bin/fgos.mjs`) with
  `AssertionError: expected 'merge-blocked-other-item', got
  'merge-conflict'`, then passing after the fix.
- Decision trail: tsk-4hj's own decision log (`fgos show tsk-4hj`) records
  `"D4: sync-root's runAndReport gets a defensive unrecognized-outcome
  guard (found during validating's reality gate)"` — confirms the guard
  was a scope addition discovered mid-tsk-4hj, matching this item's own
  description that the bug predates tsk-4hj (tsk-18a's own
  `merge-failed-unclassified` addition already missed this call site) but
  became sharper-edged once tsk-4hj added `merge-blocked-other-item`.
- `main`/tsk-1cp's own worktree (branch `fgw/tsk-1cp`, based on
  `ea8d58c4`) does NOT yet contain any of this — confirmed via `git diff
  main fgw/tsk-4hj --stat`. This is expected: tsk-4hj is still
  `awaiting-approval`, not merged.

**Found:** every claim in the item's own description is independently
verifiable against the `fgw/tsk-4hj` branch and its own docs/tests — no
external library or unfamiliar concept involved, purely a within-repo
cross-reference. Nothing here needs external search.

**Still open (not a blocker to `clear` — deferred to planning/execution):**
tsk-4hj's actual merge commit SHA on `main` is not yet known (still
`awaiting-approval`); this item's own deliverable (a standalone record
under `docs/history/tsk-1cp-sync-root-unrecognized-outcome-guard/`) can be
drafted now with the branch-relative citations above, then have the real
merge commit SHA filled in once `fgos merge`/approve lands tsk-4hj on
`main` — this is squarely `fgos-coding-exploring`'s/`fgos-coding-planning`'s call, not
this skill's.

**Verdict:** `clear` — verify: `node --test test/cli/fgos.test.mjs`
(the real test that already proves the guard, cited above; will pass once
tsk-4hj's commits are present, i.e. after tsk-4hj merges to `main` and this
item's own worktree catches up).
