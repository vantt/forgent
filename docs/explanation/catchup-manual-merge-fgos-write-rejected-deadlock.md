---
authoritative_for: catchup/approve structural deadlock when a root branch needs a real content-conflict manual merge, two irreconcilable .fgos precondition checks, merge=union fix later superseded by moving diagnostic logs to a gitignored bucket, tsk-1wk sharded-file follow-up
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
