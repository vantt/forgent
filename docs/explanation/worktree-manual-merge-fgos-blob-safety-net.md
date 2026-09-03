---
authoritative_for: .fgos/ silently reverted during manual worktree merge conflict resolution, stagedFgosChangesOnWorkerBranch pre-commit guard
---

# Manually resolving a merge conflict in a worktree can silently revert `.fgos/` — now mechanically guarded

`tsk-5pb` closed a real data-loss incident: manually resolving a git
merge conflict inside an fgOS worktree (`fgw/<id>`) can silently revert
`.fgos/config.json`/`.fgos/events.jsonl` to stale pre-merge content,
producing a downstream `fgos approve` failure ("local changes would be
overwritten").

## The incident

Closing out `tsk-56w`'s root merge, `fgos approve` first failed on a
genuine content conflict (two concurrent sessions had independently
widened the same test assertion differently) — `fgos catchup` correctly
aborted, reserving the real conflict for a person, exactly as designed.
Resolving it by hand with `git merge --no-commit --no-ff main` inside the
worktree, git's own merge machinery **auto-staged `.fgos/config.json`/
`.fgos/events.jsonl` as Modified** (not Deleted) — even though ADR0020
keeps every fgOS worktree with these files physically absent, because git
must materialize a merged blob for any tracked file differing on both
sides of a merge, regardless of that stripped convention. Following the
usual "restore `.fgos/` to its stripped state" habit (`git restore
--staged .fgos/` + `rm`) reverted the merge's own recorded content for
those two files back to the feature branch's **stale pre-merge** blobs —
discarding the incoming `main`-side changes entirely, without anyone
realizing it at the time. The resulting commit then made a real `fgos
approve` fail a second time with the "local changes would be
overwritten" error. Recovery: `git checkout main -- .fgos/config.json
.fgos/events.jsonl`, committed separately, then `fgos catchup` + `fgos
approve` succeeded.

## Root cause

ADR0020's "keep `.fgos/` physically absent from every worktree"
convention had no documented or enforced rule for the case where git
*legitimately* needs to modify (not delete) one of those tracked blobs
during a real merge/rebase resolution. The only correct move is always
**take the merge target's committed version** — never revert to a
worker branch's pre-merge content — but nothing said so before this item.

## What shipped: a mechanical guard, not just documentation

Rather than a new merge-specific rule, this extends the existing
`tsk-56u` pre-commit guard (`.githooks/pre-commit`'s
`stagedFgosDeletions`, which already encoded the right principle — `.fgos/`
must never be staged as changed on a worker's checkout — but only for
Deleted diffs). `stagedFgosChangesOnWorkerBranch` is a sibling check,
**scoped to `fgw/*` branches specifically**, that refuses a commit if
ANY staged path under `.fgos/` changed — Added, Modified, Deleted, all of
it. No case-by-case "which side is right" judgment needed: neither side
is ever right for a `.fgos/` diff landing on a worker branch, full stop.

**Why branch-scoped, not the deletion guard's unconditional scope.** A
`.fgos/` *modification* is the main checkout's entire legitimate write
path — every `fgos <verb>` call and periodic sync commit modifies it
there by design. Scoping the new check to `git symbolic-ref --short -q
HEAD` starting with `fgw/` targets exactly the worker-branch case ADR0020
forbids, leaving the main checkout's normal operation untouched. No
`MERGE_HEAD` check is needed either — confirmed live that `git
symbolic-ref` reads the branch name correctly even mid-merge, so the rule
holds unconditionally on a worker branch regardless of whether the
current commit is a merge.

**A rejected alternative worth naming.** An earlier draft proposed a
`MERGE_HEAD`-comparison rule (pick a side based on merge state) — rejected
as proven backwards by real precedent (`tsk-3v2`) and an already-cited
how-to doc; it would have actively enforced the *wrong* resolution
direction had it shipped.

## Where the fix is documented for a person to follow

`AGENTS.md`'s `.fgos/` safety-net section now states the corrected rule
directly: any `.fgos/*` path staged as changed on a worker's `fgw/<id>`
branch — including one that reappears Modified because git's own merge
machinery materialized a blob — must be restored to that branch's own
prior content and dropped from the commit entirely, never resolved
toward either side of a conflict. See `docs/how-to/fix-fgos-write-
rejected-merge-block.md` for the full recovery recipe and
`docs/how-to/resolve-an-events-jsonl-merge-conflict.md` for the
`events.jsonl`-specific seq-contiguity angle.
