# Why `checkMergeStillResolves` can false-positive after a root branch prune

`checkMergeStillResolves` (`src/state/cleanup-harness.mjs`) already
documents one known limitation: it does NOT catch a plain `git revert` —
an ancestor commit that was later reverted is still an ancestor, so the
ancestry check still reports `ok:true` even though the content is
logically gone. `tsk-577` found a second, opposite-shaped limitation of
the same ancestry-only check: content that is genuinely still on `main`
can be reported as `ok:false` ("commit ... is no longer reachable from
HEAD — the merge may have been force-pushed away or history rewritten").

## The mechanism

A leaf item merges into its root's own integration branch
(`fgw/<rootId>`) first; the root later merges into `main`. The leaf's own
`branchHeadAtReturn` field records a sha from partway through the root's
history — the point where the leaf merged in — not the root's final sha.
`checkMergeStillResolves` resolves a leaf's target ref as `fgw/<rootId>`
(per `tsk-1p9` D7's root-aware resolution) and checks that recorded sha's
ancestry against that ref.

Two things can independently make that check fail even though the
content is fine:

1. **History restructuring at the root's own merge into `main`.** If the
   root's merge into `main` doesn't preserve every individual commit as a
   direct ancestor (a squash-shaped merge, or a promote/restructure step),
   the leaf's mid-history sha is never a direct ancestor of `main` even
   though the final file content is genuinely there.
2. **The root branch itself gets pruned.** `loop.mjs`'s zero-ahead
   orphan-branch prune (`loop.mjs:391-393`) deletes any `fgw/<...>` branch
   once its `aheadCount` reaches `0` — meaning all of its content already
   landed elsewhere — with no awareness of whether an open leaf descendant
   still depends on that exact ref for its own `checkMergeStillResolves`
   check. Once `fgw/<rootId>` is gone, the ancestry check against it fails
   with "unknown revision", which the function's single generic `catch`
   reports identically to a genuine force-push loss — the two failure
   modes are indistinguishable from the caller's side.

## Real-world confirmation (tsk-577)

Found 2026-08-05 rerunning `assessCleanupReadiness` on 55 `status:cleanup`
items: 14 failed the merge check, not the 1 (`tsk-47e`) known at the start
of the same day. All 14 hit the identical `checkMergeStillResolves` error.
Two were directly verified as false positives via
`git cat-file -e HEAD:<path>` — the content
(`docs/reference/record-gate-approve-contract.md` for `tsk-19j-1`,
`docs/explanation/why-promote-preflight-uses-git-merge-tree-instead-of-a-real-merge.md`
for `tsk-3gx-1`) genuinely existed on `main`. `git branch --list` for all
5 affected roots (`fgw/tsk-3bn`, `fgw/tsk-3gx`, `fgw/tsk-19j`,
`fgw/tsk-1ni`, `fgw/tsk-3go`) confirmed none of those branches still
existed, while a session start ~10 hours earlier had not yet seen the
failure — the branches were pruned sometime in between (no log captured
the exact moment; `.fgos/logs` was empty for that window).

Left unaddressed, each of the 14 items would eventually park
`cleanup → blocked` incorrectly at its own TTL — a false-blocked signal
distinct from `tsk-1q1`'s earlier TTL-park bug (already fixed via
`tsk-4jf`), arriving through a different path (restructured/pruned
history, not a TTL race).

## The fix stays ancestry-based, not content-based

`tsk-577` fixed this at both ends rather than switching to a more
expensive content/diff comparison:

- **Source**: `loop.mjs`'s zero-ahead prune must skip deleting a root's
  `fgw/<rootId>` branch while that root still has open leaf descendants
  that might need it for their own merge check.
- **Symptom**: `checkMergeStillResolves` must tolerate an already-missing
  target ref for roots pruned before the source-side fix landed, instead
  of only preventing new occurrences.

A content/diff-based rewrite (comparing file contents directly instead of
commit ancestry) was considered and explicitly rejected as out of scope —
higher compute cost, and the ref-missing tolerance already resolves every
confirmed real-world case. The revert-after-merge limitation
`cleanup-harness.mjs`'s own docstring already names stays unchanged and
accepted; a root's own `branchHeadAtReturn` failing ancestry against
`HEAD` directly (independent of any ref deletion) was also confirmed out
of scope — `HEAD` itself is never pruned the way a named `fgw/<rootId>`
ref can be, and none of the 14 confirmed items needed that variant
addressed.

Full decision record:
`docs/history/tsk-577-cleanup-checkmergestillresolves-false-positive/CONTEXT.md`.
