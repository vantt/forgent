---
authoritative_for: catchup/approve structural deadlock when a root branch needs a real content-conflict manual merge, two irreconcilable .fgos precondition checks, merge=union fix later superseded by moving diagnostic logs to a gitignored bucket, tsk-1wk sharded-file follow-up, tsk-4gi implements the deferred option-b restore-before-reject
---

# A real structural deadlock — two guards required two different `.fgos` values, satisfiable by no snapshot at all

`tsk-2xg` fixed a genuine structural deadlock: `fgos catchup`/`approve`
had no path forward when a root branch simultaneously needed a real
catch-up merge with `main` (large drift) **and** had a genuine textual
content conflict (not just `.fgos/*`).

## The deadlock, precisely

`fgos catchup <id>` aborts entirely on any textual conflict (correct,
all-or-nothing by design) — forcing a manual `git merge main` to resolve
it. But a manual `git merge main` always pulls `.fgos/*` files that lack
a `merge=union` rule (like `events.jsonl` already had via `tsk-3wq`) into
the worker branch's own merge commit, because those files keep growing on
`main` as every `approve` call across every item can write to them.

Two existing guards then made **every** possible static snapshot fail:
the pre-commit hook (a worker branch's `.fgos/*` must not diverge from
that same commit's own first-parent) and `approve`'s own
`fgos-write-rejected` check (merging `fgw/<id>` into `main` must not
stage any `.fgos/*` diff against `main`'s current state) require **two
different** `.fgos` values simultaneously — satisfiable by neither
`main`'s value at the root-branch fork point, nor the value just before
the merge, nor `main`'s current value. Confirmed live on `fgw/tsk-3ve`
(2026-08-24): every one of the three candidate restore points was
refused by one guard or the other.

## What shipped

Direction (a) of the two proposed in the item's own text: `.gitattributes`
gained `merge=union` for the three remaining append-only diagnostic logs
that lacked it — `.fgos/approve-post-success-faults.jsonl`,
`.fgos/invocation-faults.jsonl`, `.fgos/main-checkout-guard-warnings.jsonl`
— matching the precedent `tsk-3wq` already established for
`events.jsonl`, plus a regression test reproducing the exact
`fgw/tsk-3ve` two-sided-drift-after-forced-restore deadlock.

## Superseded shortly after — not by a revert, but by removing the files from git entirely

A few days later, [`tsk-3tp`'s own diagnostic-logs migration](eventlog-sweep-checkpoint-redesign.md)
(commit `dcaa6dee`) moved all five diagnostic logs — the three this item
targeted, plus `changelog-nag-history.jsonl` and `entropy-history.jsonl`
(covered by a separate, later `merge=union` extension, `97d10ed1`) —
into the already-gitignored `.fgos/logs/` bucket, removing every
`merge=union` entry for them as dead weight. This is not a reversal of
this item's own reasoning: it's a stronger fix for the same root problem
one layer up — once these files are never git-tracked at all, `git
merge` never sees them, so no union rule is needed for them, or for
whatever else lands in that same bucket later. The repo's own
`.gitattributes` file documents this handoff directly in a comment at
its own top, naming both `tsk-2xg` and the later bucketing plan.

## Still valid and untouched

`.fgos/events.jsonl`'s own original `merge=union` (`tsk-3wq`) is
unaffected by either this item or its later supersession — the event log
itself stays git-tracked, unlike the diagnostic logs this item's own fix
targeted.

## A same-class gap in the new sharded layout — `tsk-1wk`

When [Tầng A's own event-log sharding](eventlog-tier-a-multifile-content-hash-redesign.md)
landed, `.gitattributes` covered the legacy `events.jsonl` (`tsk-3wq`) and
this item's own three diagnostic logs (`tsk-2xg`) with `merge=union`, but
not the new sharded per-writer `.fgos/events/*.jsonl` files Tầng A
introduced. `tsk-1wk` closed that gap: reproduced live while approving
[`tsk-3tp`](eventlog-sweep-checkpoint-redesign.md) — any session's own
live shard hit the identical append-conflict problem this item and
`tsk-3wq` had already solved for the old layout, causing `fgos catchup`
to report real conflicts on paths like
`.fgos/events/<writer-id>-<ts>.jsonl` during ordinary catchup/approve
cycles. Fixed by adding `.fgos/events/*.jsonl merge=union` to
`.gitattributes`, matching the existing precedent exactly — this rule
remains live and unaffected by the diagnostic-logs bucketing above, since
the sharded event-log files stay git-tracked (they are the event log
itself, not a diagnostic side-channel).

## The deferred half of this item's own original proposal, implemented later — `tsk-4gi`

This item's own original filed report proposed two fixes: (a)
`merge=union` in `.gitattributes` (what actually shipped above), and (b)
auto `git checkout --ours` for every `.fgos/*` path immediately after a
successful `git merge --no-commit`, before the staged-diff check — so a
**clean** union auto-resolution would never even reach the rejection
check. Only (a) shipped at the time; `mergeRunnerItemLocked`'s own
`fgos-write-rejected` check still fired on ANY staged `.fgos/` path after
a merge, whether it came from a genuine conflict or a clean `merge=union`
auto-resolution — since `main` sits under constant concurrent write load,
a long-lived branch's frozen `.fgos/*.jsonl` snapshot almost always
differs from `main`'s current growing copy by approve time, so this
tripped on nearly every approve for an old-lived branch. Confirmed live
blocking [`tsk-3tp`](eventlog-sweep-checkpoint-redesign.md)'s and
[`tsk-34o5`](dispatch-attestation-level-2-enforcement-halt.md)'s own
approve repeatedly, each requiring a manual `git checkout HEAD --
<path>` plus re-commit to work around.

`tsk-4gi` implemented option (b), narrowly: a new `isMergeUnionPath`
check (`git check-attr merge -- <path>`) restores a staged `.fgos/` path
to the **target's own pre-merge committed version** only when
`.gitattributes` genuinely declares `merge=union` for that exact path —
discarding whatever the union driver staged for it, then re-checking.
Deliberately *not* a blanket restore: `git checkout HEAD -- <path>` is
oblivious to *why* a path is staged, so applying it to every `.fgos/`
path would also silently discard a real, non-append-only `.fgos/` write
that happened to auto-merge cleanly (two edits on non-overlapping
lines) — exactly the write ADR0020's guard exists to catch, not
discard. Restricting the restore to genuinely `merge=union`-attributed
paths keeps that protection intact for everything else. Each path is
restored individually, not batched, because a path the branch introduced
for the first time (never on target's own `HEAD` at all) has no `HEAD`
pathspec to check out — `git checkout` throws and aborts its *entire*
batch on the first non-matching pathspec, which would silently restore
nothing at all rather than just skipping that one path.

Further follow-up items building on this same restore mechanism
(`tsk-4s6` and others) exist in later git history but are outside this
item's own scope — not detailed here.
