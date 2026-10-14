# Code review: sync lane (`syncBase` / `fgos run --sync`)

Reviewed: `git diff main...996cd913c` (feat(runner): merge a unit's sync base before the worker...). Mid-review HEAD moved to 66a878516 (units-file refusal; not in scope). The RUL97 spec text and CHANGELOG line exist only as uncommitted working-tree edits.

Tests run (all with `env -u CLAUDE_CODE_SESSION_ID`):
- run-sync.test.mjs: 11/11 pass
- run-verb.test.mjs: 21/21
- commit-unit-work, run, partial-writes, unit: 119/119
- assignment-dispatch, assignment-runresult, evidence-attribution, cli-spawn-reconciliation: 144/144

I also ran one probe (below) against both this branch and `main` source extracted with `git archive`.

## HIGH

### H1. Settlement evidence change regresses units with no syncBase: a worker edit that only touches a human's in-scope WIP now passes with nothing committed
`src/runner/dispatch/settlement.mjs:714-716`, `:312`

`editedInScopeDirt` applies to every writing seat that has `dirtyBeforeSnapshots`, not only seats resolving a sync merge. Run-unit preflight excludes `preExistingInScope` from the runner commit. The result is that a worker which only rewrites a file that was already dirty at launch:
- now settles `verified` / `pass`,
- has its commit return `no-changes` (`run.mjs` only fails a round when the commit status is `failed`),
- leaves the worker's write sitting uncommitted on top of the person's WIP.

Probe, run on both sources: a linked worktree, a committed `docs/page.md` locally modified to "human wip", and a unit with `writes: ['docs']` and no syncBase. The worker rewrites `docs/page.md`.
- main: `execution-failure` (inconclusive)
- this branch: `pass`, commit `{"status":"no-changes","preExistingInScope":["docs/page.md"]}`, worktree ` M docs/page.md`

The same settlement path also serves `fgos dispatch`/work-item writing assignments, so the change reaches further than runUnit. No existing test covers this; all 144 settlement-adjacent tests stay green.

Fix: limit the extra evidence to the paths the runner itself left for the seat. One way is to give the assignment an explicit list (e.g. `assignment.syncConflicts`, set from `unitRecord.sync.conflicts` while `status === 'conflicted'`) and filter `findMutatedDirtyBeforeFiles` by that list instead of by `declaredWrites`. Add a regression test that is the probe above, run with no syncBase.

## MEDIUM

### M1. Concluding the merge can be refused by the repo's own pre-commit hook whenever the base changed tracked `.fgos/` (fgOS repo, `fgw/*` worktrees)
`src/runner/execution/commit-unit-work.mjs:427` (`takeBaseSide`), `:446`, `:520`. Hook: `.githooks/pre-commit` `stagedFgosChangesOnWorkerBranch` / `stagedFgosDeletions`.

Runner commits run the main checkout's hooks. On an `fgw/*` branch the hook refuses any staged `.fgos/` path. It also refuses any staged `.fgos/` deletion on every branch, and `takeBaseSide` uses `git rm` when the base deleted the path. In this repo main touches `.fgos/events.jsonl` constantly, so syncing main into an `fgos pick` worktree stages `.fgos/` changes:
- Clean merge: the commit throws, the merge is aborted, and the run reports a generic `git-error` / `execution-failure`.
- Conflicted merge: `finishSyncMerge` reports `git-error` and the merge stays open. Every commit-only resume then hits the same hook, so the run can never get past it from inside fgOS.

The worktrees `createWorktree` makes also have `.fgos/` removed from disk, and the merge writes those files back into the worker worktree. The "base side" policy here conflicts with ADR0020/tsk-5pb ("worker branches must never commit changes under .fgos/").

I have not reproduced this with the hook installed; it is inferred from the hook source. Please confirm it with a fixture that wires `.githooks`. Then either:
- name the hook refusal as its own reason (e.g. `hook-refused`) instead of `git-error`, or
- decide what `.fgos/` should be in a sync merge for `fgw/*` (keep ours / drop from the merge), as catch-up's `fgos-write-rejected` does.

### M2. Conflicted paths widen `writeScope` for the rest of the unit run, not just the merge round
`src/runner/execution/unit-sync.mjs:76`. Read by `run.mjs:588` (assignment.writes, which drives confinement) and `run.mjs:675` (commit scope).

Once the merge is concluded, a conflicted path outside the declared `writes` (e.g. `README.md` for a `writes: ['docs']` unit) stays writable for every later producer round in a reviewed/loop pattern, and on resumes. The runner commits any later edit to it. Example: the reviewer says "also tidy README", round 2 rewrites `README.md`, and the runner commits it even though the user never declared it.

Fix: keep the extra paths in `sync.conflicts` and add them to the seat's scope only while `sync.status === 'conflicted'`, or record them separately and drop them after `finishSyncMerge`.

### M3. A sync-only unit passes without running the unit or capability `verify`
`src/runner/execution/unit-sync.mjs:60,80`; `run.mjs` early return (around 923-931).

A clean merge of a broken base, or a base that breaks this branch, reports `pass` and is never verified. `performCatchUp`, the prior art this cites, runs the goal check before committing. Also, the `results: []` return gives `--json` readers no `data.results[-1]` (AGENTS.md documents `data.results[-1].commit`).

This depends on intended behaviour: either run `verify` after a sync-only merge, or document the pass as "merged, not verified" in RUL97.

### M4. `merged-outside` / resume `done` accepts any commit containing `sync.sha` without checking what it holds
`commit-unit-work.mjs:499`; `unit-sync.mjs:41-44`.

Say a person concludes the open merge with `git commit -a`, sweeping in unrelated dirty, out-of-scope files. The runner records `sync.commit = { by: 'outside' }`, commits the rest of the round, and passes. Nothing compares that commit's parents or files against `sync.head` and `conflicts ∪ mergeStaged`, which `finishSyncMerge` does for its own commit.

Low likelihood (a human action), but it is the one path that skips the committed-set check. At minimum, run the same parents/files check and report a mismatch, as `committed-set-mismatch` does.

## LOW

### L1. "No markers left" is the only proof a conflict was resolved, and it is weak in both directions
`commit-unit-work.mjs:322`, `pathsWithConflictMarkers`.

- **Concluded without a real resolution:**
  - binary conflicts (never read),
  - modify/delete conflicts (git writes no markers),
  - a worker that deletes the `<<<<<<<` and `>>>>>>>` lines but leaves `=======` with both sides.

  All of these conclude with whatever is on disk. For example, a binary conflict is committed as "ours" if the worker touches any other in-scope file and passes.
- **Refused forever:** a file that legitimately has `<<<<<<< ` at the start of a line (merge-test fixtures, git docs) is refused on every resume. The only way out is concluding by hand (M4 path). A custom `conflict-marker-size` attribute is also missed.

Consider comparing against the file as it was at launch (it must have changed), and naming binary and modify/delete conflicts in the brief.

### L2. `unscopable-conflict-path` misses leading/trailing whitespace
`commit-unit-work.mjs:429`.

`canonicalizeWriteEntry` trims entries, so a conflicted path `" a.txt"` turns into scope `a.txt` (a different file). Add a `p !== p.trim()` check (also `?` / `[` if the glob matcher treats them as globs).

### L3. A crash after a clean merge commit but before recording the result is recorded as `up-to-date`
`commit-unit-work.mjs:411-418` adopt path.

On resume MERGE_HEAD is gone, so `isAncestor(sha)` gives `up-to-date` with `head` set to the merge commit, and no `commit` record. Harmless to git state, but the provenance is wrong.

### L4. If `commitWork()` throws, `sync.status='merged'` is never persisted
`unit-sync.mjs` `commitRoundWithSync`. The status is mutated in memory before `commitWork()`, and `persistUnitRecord` runs only after it returns. A throw (as opposed to a returned failure) skips the persist. Resume self-heals through `assertSyncResumable` → `done`, but labels the merge `by: 'outside'` although the runner made it.

### L5. The refusal for a stray open merge does not say who owns it
`run.mjs` `preflightRefusal`. A merge left open by an abandoned sync run gets "this run did not start; finish or abort it". Naming the owning `unitRunId` (scan for unit.json with `sync.sha === MERGE_HEAD` and a matching worktree) would point the user to `--resume` instead of `--abort`.

### L6. Docs not committed
RUL97 in `docs/specs/runner.md` and the CHANGELOG line exist only in the working tree. They must be committed with the lane (L5 Q6, CHANGELOG gate).

## Unchanged-behaviour check for units without syncBase
- `preflightUnitWorktree`: when `sync` is null, the `own` set is empty, so `foreignStaged` and `preExistingInScope` are the same as before.
- New: a writing seat refuses any open merge (`foreignMerge`), and `commitUnitWork` refuses `merge-in-progress`. Before, a merge with conflicts was refused as `foreign-staged-index`, but an open merge with an empty staged diff would have been concluded silently by the agent's commit. This change is a strict safety gain and is covered by the "merge someone else left" test.
- Settlement: regressed, see H1.

## Trust-boundary notes
- The sync sha is resolved through the trusted gitdir before the run exists, and resume never re-reads the ref. `isSyncRef` blocks options and revision expressions.
- The worker controls only the content of the conflicted files. `finishSyncMerge` stages only `sync.conflicts`, checks the index against `conflicts ∪ mergeStaged`, then checks the parents and the committed set.
- If a worker replaces a conflicted path with a symlink, the symlink is committed (lstat skips the marker check). That is the same exposure the ordinary commit path has, nothing new.

## Unresolved questions
1. Is a sync-only pass meant to skip `verify` (M3)?
2. Should conflicted paths outside `writes` stay writable after the merge concludes (M2)?
3. Can any pattern run two writing seats in parallel over one open merge? If so, `commitRoundWithSync` has no lock around `finishSyncMerge`.
