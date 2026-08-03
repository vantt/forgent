# Main Checkout Checked Out Directly Onto a Work Branch Instead of a Worktree

**Date**: 2026-08-03 16:12
**Severity**: Medium (process, no data lost)
**Component**: Session workflow discipline (`/fgOS:pick`'s `EnterWorktree` flow, bypassed by hand)
**Status**: Resolved

## What Happened

Twice, a session ran a direct `git checkout <fgw/branch>` on the main
checkout instead of going through `/fgOS:pick`'s worktree flow — first onto
`fgw/retro-loop-docs-260802`, later onto
`fgw/dispatch-terminology-rename-260803`. Because the main checkout is the
one shared working tree every session's `fgos <verb>` calls resolve against
(`git rev-parse --git-common-dir`), checking a work branch out there —
instead of into its own isolated `.claude/worktrees/<id>-*` directory —
mixed that branch's tree with 14 unrelated retro-loop items still open in
the backlog, plus code from someone else's concurrent session.

## Technical Details

Reflog evidence (`git reflog show HEAD`, main checkout, captured
2026-08-03):

```
HEAD@{29}: checkout: moving from main to fgw/retro-loop-docs-260802
HEAD@{15}: checkout: moving from fgw/dispatch-terminology-rename-260803 to main
```

Both moves are direct `git checkout` calls against the main checkout's own
HEAD — never a `git worktree add`. `/fgOS:pick`'s own step 2 (`fgos pick
<id>`) always creates a dedicated worktree under `.claude/worktrees/<id>-*`
and switches the session into it via `EnterWorktree`; it never leaves the
main checkout's HEAD pointed at a work branch.

## Resolution

Both branches were untangled with no data loss: everything that had landed
stayed intact, split cleanly back onto `fgw/retro-loop-docs-260802` and
`fgw/dispatch-terminology-rename-260803`. The only cost was cleanup time —
separating the 14 unrelated retro-loop items and someone else's code back
out of the branch that shouldn't have carried them.

## Lessons Learned

1. Never run `git checkout <fgw/branch>` (or any direct branch switch) on
   the main checkout. Every claimed item gets its own worktree via
   `/fgOS:pick`'s `EnterWorktree` step — that isolation is exactly what
   stops one branch's tree from mixing with another session's in-flight
   work.
2. When work needs to resume on an existing `fgw/*` branch, re-run
   `/fgOS:pick <id>` (which reuses the branch's own worktree, or recreates
   it) — never a bare `git checkout`.
3. A reminder note was added to `plugins/fgOS/skills/pick/SKILL.md` and
   `plugins/fgOS/skills/cook/SKILL.md` (both worktree entry points) so a
   session reads this warning before it can repeat the mistake.

## Next Steps

- [x] Reminder note added to `pick`/`cook` `SKILL.md`.
- [ ] No code or tooling fix — out of scope per this item's own locked
      decision (`docs/history/pick-cook-worktree-bypass-reminder/CONTEXT.md`
      D2); a `fgos doctor` check to detect this state was considered and
      explicitly deferred to a future item, not built here.
