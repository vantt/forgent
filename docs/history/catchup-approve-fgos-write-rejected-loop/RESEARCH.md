# Research: tsk-2f6 — catchup/approve deadlock on `.fgos/*` drift past fork point

## Round 1 — 2026-08-21 (discovery stage)

**Asked:** does the repo's actual current code back up tsk-2f6's claimed
mechanism — `performCatchUp` merging inside a `.fgos/`-stripped ephemeral
worktree always freezes the WORKER branch's `.fgos/*` content instead of
adopting main's newer content, `approve`'s check unconditionally rejects
ANY `.fgos/*` diff regardless of which side caused it, and `catchup.mjs`
has no repeat/loop detection — and is a fix for this already documented
somewhere?

**Checked (repo search, all read directly, not from memory):**

1. `src/runner/merge.mjs:1393` `performCatchUp` — confirmed: runs `git
   merge --no-commit --no-ff target` inside `withMergeEphemeralWorktree`'s
   detached checkout, then on success commits directly (`git commit -m
   'catch-up: ...'`). No `.fgos/*`-diff check anywhere in this function —
   unlike `mergeRunnerItemLocked` below, it stages and commits whatever
   the merge produced without inspecting it for `.fgos/*` paths.
2. `src/runner/worktree.mjs:573` (`finishWorktreeSetup`, called by
   `createDetachedMergeWorktree` right after `git worktree add --detach`)
   — confirmed: `fs.rmSync(path.join(worktreePath, '.fgos'), { recursive:
   true, force: true })`, a raw filesystem delete, not `git rm`. This
   leaves the worktree's own git index (freshly populated by the `git
   worktree add --detach` checkout, one index per worktree) still tracking
   `.fgos/*` as present with the branch tip's committed content — i.e. an
   uncommitted local *deletion* relative to that worktree's own index,
   present BEFORE `performCatchUp`'s `git merge` call ever runs.
3. `src/runner/merge.mjs:1226-1227` (`mergeRunnerItemLocked`, the function
   `approve` uses to merge an item branch into the main checkout) —
   confirmed: `stagedPaths = git diff --name-only --cached`, `fgosPaths =
   stagedPaths.filter(p => p === '.fgos' || p.startsWith('.fgos/'))`, `if
   (fgosPaths.length > 0)` → abort merge, return `{ outcome:
   'fgos-write-rejected', ... }`. This check makes no distinction between
   "the item branch's own commit changed this path" and "the item branch
   is just behind, main changed this path after the branch's fork point" —
   any staged `.fgos/*` diff at all is rejected, confirming the item's
   claim #2 exactly.
4. `src/verbs/merge/catchup.mjs` (120 lines) — grepped for
   retry/repeat/counter/threshold/loop: only hits are comments describing
   *why* catchup itself is safe to retry blindly for an unrelated reason
   (another item's in-progress merge, not a `.fgos/*` conflict). No
   repeat-counter or same-diff-detection exists anywhere in this file,
   confirming the item's claim #3 (no loop/repeat-block detection).
5. `docs/how-to/fix-fgos-write-rejected-merge-block.md` — **exists
   already** (25KB, 6 real documented precedents: tsk-n4i-1, tsk-5vf,
   tsk-4eu, tsk-5ge, tsk-53n, tsk-3v2), heavily cross-referenced from 15+
   other docs/history plan.md files. Its own "Before you start" section
   frames the *cause* differently from tsk-2f6: "This only happens because
   your item's branch (`fgw/<id>`) somehow committed a change under
   `.fgos/` — usually because a fix touched the live event log directly
   and got committed like ordinary source code." This is the WORKER
   directly writing `.fgos/*`, not catchup indirectly carrying main's
   drift forward. None of its 6 cited precedent ids overlap with a
   catchup-driven mechanism as far as this round found — the doc's fix
   steps (strip the `.fgos/*` diff back out of the branch's own commit,
   re-verify, re-merge) assume a ONE-TIME worker mistake, not a mechanism
   that reproduces the SAME diff again after the fix is applied.

**Open gap — the actual git-level mechanism is not yet confirmed:**

Reasoning through steps 1-2 above (not yet verified by reproduction):
when `target` (main) has changed a `.fgos/*` path since the item branch's
merge-base, `git merge --no-commit --no-ff target` in the ephemeral
worktree has to write that path's new content into a working tree that
already has an *uncommitted local deletion* of that same path (from the
`fs.rmSync` strip, step 2). Standard git merge behavior refuses this
outright — "error: Your local changes to the following files would be
overwritten by merge... Aborting" — a preflight failure with no
`MERGE_HEAD` created at all. If that is what actually happens here,
`performCatchUp`'s own `catch { conflicted = true }` block would then try
`git diff --name-only --diff-filter=U` (empty, no real conflict) and `git
merge --abort` (which itself would fail with "There is no merge to
abort", since no real merge ever started) — and per the code at
`merge.mjs:1430-1434`, that abort failure is re-thrown as an unhandled
error, not returned as any of `performCatchUp`'s four defined outcomes.

This predicted failure mode (a thrown error) does not obviously match
tsk-2f6's own claimed symptom (a silent merge success that keeps the
WORKER branch's frozen content, repeating identically 3x per the
described `tsk-3ti` incident). Either the reasoning above is missing
something about how `git merge` treats a worktree-local index vs a raw
`fs.rmSync`'d path, or the real mechanism runs through a different code
path than `performCatchUp` (not yet located), or the observed "identical
diff 3x" came from something upstream of `performCatchUp` re-populating
`.fgos/*` in a way this round hasn't found yet (e.g. `resync-worktree`,
`fgos pick`'s reclaim path, or the merge's own `runGoalCheck` touching
`.fgos/`). This round did not reproduce the scenario live (no sandbox
main/worker branch pair was constructed) — that reproduction is the one
concrete thing still needed to close this gap.

**Verdict (round 1):** unclear — claims #1, #2, and #4 (doc exists but
targets a different cause) are confirmed directly from the repo; the
causal mechanism connecting catchup's merge to a *repeating, identical*
`.fgos/*` staged diff at `approve` time is not yet confirmed against
actual git behavior, and the one directly-relevant existing doc's own
framing does not cover this mechanism.

## Round 2 — 2026-08-21 (same session, user directed broader
reinvestigation instead of waiting on a person)

**Asked:** two things — (a) does `performCatchUp`'s merge actually crash
or silently freeze stale content when main changes a `.fgos/*` path after
the item branch's fork point (the open gap Round 1 left), reproduced live
rather than reasoned about; (b) what does the real `tsk-3ti` event-log
history actually show, since that incident is the item's own cited
evidence and is fully readable from `.fgos/events.jsonl` — no need to
guess when the ground truth is in this repo's own store.

**Checked — live reproduction (real `fgos` CLI, throwaway git-backed
fixtures under `/tmp`, not the live repo):**

1. Single drift: item branch cut from main, main advances
   `.fgos/config.json` once after the fork point (branch itself never
   touches it), item sits `blocked` (`integration-drift`). Ran the real
   `fgos catchup <id>` — **succeeded cleanly**, `outcome: "merged"`, git's
   own message: `"Automatic merge went well; stopped before committing as
   requested"`. No crash, no "local changes would be overwritten" refusal,
   despite the `.fgos/` raw-`fs.rmSync` strip Round 1 flagged as the
   suspect mechanism. Then ran the real `fgos approve <id>` on the result
   — **also succeeded cleanly**, `outcome` `delivered`, no
   `fgos-write-rejected`.
2. Double drift: same setup, but main advances `.fgos/config.json` a
   SECOND time between catchup landing and approve running (simulating
   the realistic fast-moving-main/periodic-checkpoint case). **Also
   succeeded cleanly end to end**, no rejection at any step.

   Both reproductions REFUTE Round 1's open hypothesis (a thrown
   "MERGE_HEAD missing" crash) and REFUTE the item's own original theory
   (catchup silently freezes the worker's stale content) for the simplest,
   most direct construction of "main advances a `.fgos/*` path after the
   branch's fork point." Ordinary one-sided drift is not a bug — catchup
   and approve both adopt it correctly.

**Checked — the real `tsk-3ti` event-log history (`.fgos/events.jsonl`,
`grep tsk-3ti`, read directly, not summarized from the item's own prose):**

`tsk-3ti` is a ROOT item (decomposed into children `tsk-3ti-1/2/3/5/7/10`,
integration branch `fgw/tsk-3ti`) — a materially different topology from
both reproductions above (root/children merge, not a flat single-branch
item). Its own friction trail, in order, on 2026-08-20:

- `07:28:47` blocked `integration-drift`, friction `errorClass:
  merge-conflict`: `"git merge --no-commit --no-ff fgw/tsk-3ti
  conflicted"` — a REAL textual conflict (not `.fgos/`-related at all).
- `07:39:09` resumed to `awaiting-approval` (branchHeadAtReturn
  `db2c3555`) — the conflict got resolved somehow, branch head moved.
- `07:39:19` blocked again, reason `merge-failed-unclassified`, friction:
  `"git merge --no-commit --no-ff fgw/tsk-3ti failed without a real
  conflict (exit 128): error: Your local changes to the following files
  would be overwritten by merge: .fgos/events.jsonl ... Aborting"` — this
  is `mergeRunnerItemLocked`'s merge on the MAIN checkout hitting a
  genuinely DIRTY main (uncommitted `.fgos/events.jsonl`) at that exact
  moment — the exact scenario
  `docs/history/events-jsonl-merge-abort-truncation-gap/RESEARCH.md`
  Round 5 already reproduced and documented (concurrent-write race on the
  shared main checkout, Problem #1 from
  `plans/reports/investigation-260821-1050-eventlog-loss-merge-speed-root-cause-report.md`)
  — already known, not new.
- `07:42:28` resumed to `awaiting-approval` again (same branch head
  `c905a10a`).
- `07:43:04` blocked, reason **`fgos-write-rejected`**, friction: `"fgw/
  tsk-3ti staged a change under .fgos/ (.fgos/config.json,
  .fgos/events.jsonl.backup-tsk-1lv-4-dedup-fix-20260817); merge aborted,
  main unchanged — ADR0020"` — the item's own two cited paths, confirmed
  verbatim from the real log.
- `07:48:03` resumed to `awaiting-approval` (SAME branch head `c905a10a` —
  nothing about the branch actually changed).
- `07:48:04` blocked again, **identical** reason and **identical** friction
  detail (same 2 paths) — repeat #2.
- `07:56:45` resumed to `awaiting-approval` (SAME branch head `c905a10a`
  again).
- `07:56:46` blocked again, **identical** reason and friction detail —
  repeat #3. This is the exact "lặp lại y hệt 3 lần" the item describes,
  now traced to its real cause below.
- `08:01:17` resumed to `awaiting-approval` with a NEW branch head
  (`c3b0de89`, different from `c905a10a` for the first time) — something
  actually changed on the branch this time — and this attempt held:
  `tsk-3ti`'s final record shows `mergedSha: 897bc2da...`, `mergedInto:
  main`.

**Found — the real mechanism, not the theorized one:** `fgw/tsk-3ti`'s own
commit genuinely carried `.fgos/config.json` and a dedup-fix backup file
(`.fgos/events.jsonl.backup-tsk-1lv-4-dedup-fix-20260817`) — this is
precisely the scenario
`docs/how-to/fix-fgos-write-rejected-merge-block.md` already documents
("your item's branch somehow committed a change under `.fgos/`"), not
`performCatchUp` silently freezing stale content from an unrelated main
drift. The filename (`dedup-fix`) strongly suggests these files were
created as a side effect of resolving the EARLIER real conflict at
`07:28:47`/re-verify failure at `07:39:19` — a manual or session-driven
fix that swept `.fgos/` changes into the branch's own commit (e.g. via a
broad `git add -A` during conflict resolution), not something
`performCatchUp`'s ordinary merge path does on its own (both live
reproductions above confirm the ordinary path adopts drift cleanly with
no committed `.fgos/*` diff left behind). The 3x identical repeat happened
because the SAME uncorrected branch head (`c905a10a`) was resubmitted to
`approve` three times in a row without anyone actually removing the
offending `.fgos/*` paths from that commit in between — `catchup` was
never even the tool that fixed it in the end; something (a person,
following the existing playbook's steps 3-4: strip the path back out,
amend, re-commit) finally produced the new head at `08:01:17` that let it
through.

**Revised verdict: clear.** The item's original theory (`performCatchUp`
freezing stale worker content against advancing main) does not hold —
confirmed both by live reproduction (2 clean end-to-end runs) and by the
real cited incident's own event log (a different, already-documented
cause: the worker branch's own committed `.fgos/*` diff). What remains
genuinely real and still unaddressed, narrower than the item's original
scope:

- `catchup.mjs` has no repeat-counter / same-diff-detection (confirmed
  Round 1) — a session can retry `return`/`approve` against an unchanged,
  still-offending branch head indefinitely with no signal that nothing
  changed between attempts.
- The `fgos-write-rejected` friction message never points at the existing
  `docs/how-to/fix-fgos-write-rejected-merge-block.md` playbook — a
  session hitting this cold (as tsk-3ti's own session did, 3 times) has
  no in-band pointer to the already-written fix, costing real debug time
  exactly as the item's own description reports.
## Round 3 — 2026-08-21 (same session, user asked to resolve the
remaining open question rather than defer it)

**Asked:** why did `fgw/tsk-3ti` end up with `.fgos/config.json` + the
dedup-fix backup file committed on its own branch in the first place?

**Checked (real commit graph, `git log`/`git show`/`git cat-file` against
this repo's own history, not the item description's prose):**

1. `git show --stat` on `c905a10a` (the SECOND catchup commit, 07:42:28,
   real `performCatchUp`-generated message `"catch-up: merge main into
   fgw/tsk-3ti"`) shows only `.fgos/events.jsonl` changed (667 insertions).
   `git cat-file -e c905a10a:.fgos/events.jsonl.backup-tsk-1lv-4-dedup-fix-20260817`
   → missing. `git cat-file -e 9705d55d:...` (that commit's own merge
   target, main's tip at the time) → **exists**. So the second catchup's
   own merge genuinely dropped a file main had newly added.
2. Reproduced the "main adds a brand-new file under `.fgos/`, branch never
   had it, run `fgos catchup`" shape directly (3rd live sandbox
   reproduction) — the new file WAS correctly picked up and committed,
   approve passed clean. So an ordinary, single automated catchup does not
   drop new files either. The drop is specific to tsk-3ti's real history,
   not a general property of `performCatchUp`.
3. Traced `db2c3555` (the FIRST catchup commit, 07:39:09, right after the
   `07:28:47` real merge-conflict block) — its own message is
   **`"Merge branch 'main' into fgw/tsk-3ti"`**, git's own unmodified
   default merge-commit message. Every fgOS code path that runs `git
   merge` (`grep`'d across `src/runner/merge.mjs` and
   `src/verbs/merge/*.mjs`) always passes `--no-commit` and then commits
   with an explicit `-m` of its own choosing — none of them would ever
   leave git's default message in place. `db2c3555` could not have been
   created by any code path in this repo.

**Found:** `db2c3555` was created by a human (or a session) running a raw
`git merge main` directly against `fgw/tsk-3ti`, outside `fgos catchup`
entirely, to resolve the real conflict from `07:28:47` by hand. Whatever
happened during that manual conflict resolution is what left the branch
missing the dedup-fix backup file main already had — a one-off,
unauditable consequence of bypassing the tool during an emergency, not a
reproducible defect in `performCatchUp`/`mergeRunnerItemLocked`'s own
merge logic (both of which this round and Round 2 already proved handle
ordinary drift, including brand-new files, cleanly when driven through
`fgos catchup` end to end).

**Resolved, no code fix needed for this question.** The existing
`docs/how-to/fix-fgos-write-rejected-merge-block.md` playbook already
covers "the branch somehow has a `.fgos/` commit" recovery regardless of
how that commit got there — it does not need a cause-specific branch for
"a human merged by hand." This closes the item's one remaining open
question; nothing here changes the scope already locked in Round 2.
