---
framework: diataxis
mode: explanation
---
# Why a work branch must never be `git checkout`'d directly on the main checkout

Twice, a session ran a direct `git checkout <fgw/branch>` on the main
checkout instead of going through `/fgOS:pick`'s worktree flow — first
onto `fgw/retro-loop-docs-260802`, later onto
`fgw/dispatch-terminology-rename-260803`.

## Why this mixes unrelated work

The main checkout is the one shared working tree every session's `fgos
<verb>` call resolves against (`git rev-parse --git-common-dir`).
Checking a work branch out there — instead of into its own isolated
`.claude/worktrees/<id>-*` directory — mixed that branch's tree with 14
unrelated retro-loop items still open in the backlog, plus code from
someone else's concurrent session.

## Mechanism, confirmed via reflog

> Reflog evidence (`git reflog show HEAD`, main checkout, captured
> 2026-08-03):
>
> ```
> HEAD@{29}: checkout: moving from main to fgw/retro-loop-docs-260802
> HEAD@{15}: checkout: moving from fgw/dispatch-terminology-rename-260803 to main
> ```
>
> Both moves are direct `git checkout` calls against the main checkout's
> own HEAD — never a `git worktree add`. `/fgOS:pick`'s own step 2
> (`fgos pick <id>`) always creates a dedicated worktree under
> `.claude/worktrees/<id>-*` and switches the session into it via
> `EnterWorktree`; it never leaves the main checkout's HEAD pointed at a
> work branch.

## Resolution

No data was lost. Both branches were untangled cleanly — everything that
had landed stayed intact, split back onto
`fgw/retro-loop-docs-260802` and `fgw/dispatch-terminology-rename-260803`
respectively. The only cost was cleanup time: separating the 14 unrelated
retro-loop items and someone else's code back out of the branch that
shouldn't have carried them.

## What to do instead

1. Never run `git checkout <fgw/branch>` (or any direct branch switch) on
   the main checkout. Every claimed item gets its own worktree via
   `/fgOS:pick`'s `EnterWorktree` step — that isolation is exactly what
   stops one branch's tree from mixing with another session's in-flight
   work.
2. When work needs to resume on an existing `fgw/*` branch, re-run
   `/fgOS:pick <id>` (which reuses the branch's own worktree, or
   recreates it) — never a bare `git checkout`.

## What was fixed vs. deliberately left open

A reminder note was added to `plugins/fgOS/skills/pick/SKILL.md` and
`plugins/fgOS/skills/cook/SKILL.md` (both worktree entry points) so a
session reads the warning before it can repeat the mistake. This item was
scoped as a documentation-only fix:

> No code or tooling fix — out of scope per this item's own locked
> decision; a `fgos doctor` check to detect this state was considered
> and explicitly deferred to a future item, not built here.

This is a different failure mode from `tsk-3au`'s destructive `git reset
--hard` incident (which happened as a *consequence* of a session drifting
back to the main checkout after this same kind of bypass) — that item
built a real code-level guard (`fgos main-checkout-reset`) because its
incident actually lost data; this one didn't, and stayed a documented
reminder per the same day's twin-incident precedent
(`docs/history/pick-cook-worktree-bypass-reminder/CONTEXT.md`, cited by
`tsk-3au`'s own decision record as the doc-reminder-only precedent it
deliberately went beyond).

## Update: a doc reminder alone wasn't enough (`tsk-4hkd`)

A follow-up item on the same incident reversed the "documentation only,
no code" scope above. The user explicitly rejected both a standalone
how-to write-up ("a doc nobody reads before making the mistake again")
and a `fgos doctor` check alone ("a check nobody remembers to run") —
the fix had to be automatic and unavoidable at the moment of risk:

> Deliverable is an automatic guard, not a doc or a doctor check: extend
> the existing `.githooks/pre-commit` hook (already wired via
> `core.hooksPath`, already guards main-checkout commits for the STR65
> lock) with one more refusal clause. Before allowing a commit: resolve
> `git rev-parse --git-dir` vs `git rev-parse --git-common-dir` for the
> checkout the hook is running in — equal means this IS the main
> checkout (a linked worktree's own copy of the same hook file resolves
> these to different paths, since `git worktree add` gives each worktree
> its own git-dir under `.git/worktrees/<name>`). If they're equal (main
> checkout) AND the current branch matches `^fgw/`, refuse the commit
> with a message pointing at `fgos pick <id>` and checking back out to
> the default branch. Linked worktrees are unaffected — they are
> supposed to live on a `fgw/*` branch; only the main checkout must
> never sit on one.

The guard lives in `.githooks/pre-commit`'s `main()`, as a second
`refuse(...)` branch alongside the existing STR65 lock check — no new
install/config surface, so it needed no `fgos doctor` check or `fgos
setup` merge entry (per `AGENTS.md`'s install/setup/doctor gate).

This closes the gap the doc-only fix left open: even with the reminder
note in `pick`/`cook`'s `SKILL.md`, a session could still bypass the
worktree flow by hand and mix branches — the pre-commit hook now refuses
the commit outright the moment it would happen, rather than relying on
the session having read the warning first.

## Related

- `docs/journals/260803-1612-main-checkout-direct-branch-checkout-tsk-4hk.md`
  — the incident journal entry (Date/Severity/Component/Status format).
- `docs/history/pick-cook-worktree-bypass-reminder/CONTEXT.md` — the
  first decision record, scoped to journal + reminder note only (`tsk-4hk`).
- `docs/history/prevent-main-checkout-fgw-branch-commit/CONTEXT.md` — the
  follow-up decision record that reversed that scope and built the real
  guard (`tsk-4hkd`).
- `docs/how-to/safely-reset-the-main-checkout.md` — the code-level guard
  `tsk-3au` built for the destructive-git-op consequence of this same
  kind of bypass.
- `plugins/fgOS/skills/pick/SKILL.md`, `plugins/fgOS/skills/cook/SKILL.md`
  — where the reminder note itself lives.
- `.githooks/pre-commit` — the `main()` refusal clause itself.
