---
authoritative_for: fgos catchup's own successful moveWork to awaiting-approval appending a fresh event to the calling session's live .fgos/events shard, reopening the exact branch/main .fgos divergence ADR0020 requires be zero right before fgos approve runs, causing every approve after a successful catchup to fail with merge-conflict on that session's own shard; fixed by resolveFgosOnlyConflict restoring the trusted side instead of aborting
---

# A merge that manufactured its own next conflict

`tsk-tr9` diagnosed and confirmed the fix for a self-inflicted race: `fgos
catchup`'s own successful landing (`moveWork` to `awaiting-approval`)
appends a fresh event to the calling session's own live
`.fgos/events/<session-id>-*.jsonl` shard on the main checkout —
immediately reopening the exact branch/main `.fgos` divergence ADR0020
requires be zero, right before `fgos approve` runs against that same
branch.

## Reproduced deterministically, 12+ times

Discovered driving `tsk-2tmk` (a fully verified, otherwise ready-to-merge
item): every `fgos approve` attempt after a successful `fgos catchup`
failed with `reason: 'merge-conflict'` on exactly that session's own shard
path, reproduced 12+ times across ~2 hours. Not a content or test
regression — a race the catchup-then-approve sequence created against
itself.

## Why it was a real git conflict, not a false one to just suppress

A worker branch that at some point recorded a deletion of a
`merge=union` `.fgos/` shard (e.g. an earlier manual `git rm --cached`
recovery from an unrelated prior conflict) raises a genuine git
MODIFY/DELETE conflict the moment the same session's own subsequent
event-append grows that shard on the other side. A `merge=union` driver
never resolves a MODIFY/DELETE — deletion is never handled by a
content-merge driver, union or otherwise, regardless of attribute. So both
`performCatchUp` (target→branch) and `mergeRunnerItemLocked` (branch→main)
reported this as a genuine git conflict — manufactured entirely by the
calling session's own writes, since neither side has any legitimate claim
over the other's `.fgos` state at all (ADR0020).

## What shipped (landed before this item, confirmed here)

A new `resolveFgosOnlyConflict(repoRoot, keepRef)` helper: when a git-merge
conflict is confined ENTIRELY to `.fgos/` paths declared `merge=union`, it
resolves the conflict by restoring each conflicted path to `keepRef`'s own
committed version (main's for `approve`, target's for `catchup`) — or
removing it if `keepRef` never had it at all — instead of aborting. A
single non-`.fgos/` conflicted path, or a `.fgos/` path without the
`merge=union` attribute, leaves the conflict completely untouched and
returns `false`: the caller still treats it as a genuine, unresolved
conflict. Wired into both merge directions' conflict-catch blocks.

This extends `tsk-4gi`'s own restore-then-recheck protection — that
earlier fix only ever fires when `git merge` stages the conflicting
`.fgos/` path CLEANLY via its `merge=union` driver; `resolveFgosOnlyConflict`
covers the case where `git merge` itself THROWS a genuine conflict on that
same class of path.

## This item's own scope: confirm, not implement

By the time `tsk-tr9` was picked up for implementation, the real fix
(commit `10e44585`) had already landed. This item's own action was
narrower: confirm the fix and its two named regression tests
(`performCatchUp` and `mergeRunnerItem`, each reproducing the exact
modify/delete conflict against pre-fix code and confirming clean
resolution post-fix) actually cover the reported scenario — no source
change of its own.
