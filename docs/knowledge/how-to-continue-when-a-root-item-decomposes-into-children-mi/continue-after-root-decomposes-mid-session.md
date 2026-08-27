---
type: how-to
title: How to continue when a root item decomposes into children mid-session
tags: []
timestamp: 2026-07-28T00:00:00.000Z
source_capture_ids: [tsk-424]
framework: diataxis
mode: how-to
---

# How to continue when a root item decomposes into children mid-session

Use this when a session already `EnterWorktree`'d into a root item's
worktree (via `/fgOS:pick`) picks a child of that same root and needs to
switch, in the same session, into the child's own worktree.

## Before you start

- You need `fgos pick`'s worktree base fixed to live under
  `<repoRoot>/.claude/worktrees/` (tsk-424) — this is now the default for
  every `pick` claim, nothing extra to configure.
- The dogfood that surfaced the need for this (decision 0018, item
  `tsk-1wd` → `tsk-1wd-1`, 2026-07-28): a session `EnterWorktree`'d into
  the root's worktree fine (first switch, any location works), then
  picked the child, but the second `EnterWorktree` call into the child's
  worktree was refused by the harness — `".claude/worktrees" does not
  exist, so <path> cannot be a worktree managed by Claude Code` — because
  `pick` was creating worktrees under `os.tmpdir()/fgos-worktrees` at the
  time.

## Steps

1. Pick the child item exactly as you would any other item:

   ```
   /fgOS:pick <child-id>
   ```

2. Read the claim's `data.worktree.path` from the result. Since tsk-424,
   this always sits under `<repoRoot>/.claude/worktrees/<child-id>-<random>/`
   — the same location `EnterWorktree` itself uses for a session's own
   worktrees, so a second-or-later in-session switch is allowed.

3. Call `EnterWorktree` with that path. It succeeds the same way the
   first switch into the root did — no fallback, no new session, no
   manual `cd`/absolute-path workaround needed.

   Live-verified during tsk-424's own execution: a throwaway probe item
   was picked while the session was already switched into `tsk-424`'s own
   worktree, and the second `EnterWorktree` call into the probe's worktree
   under `.claude/worktrees/` succeeded on the first try.

## If it still fails

`EnterWorktree` genuinely refuses one different, unrelated case: starting
a **brand-new** worktree from a session that is *already* nested inside
another worktree *before* the claim happens at all (the STR83
"nested-at-start" limit). That case still needs the fallback
`plugins/fgOS/skills/pick/SKILL.md` step 3 describes — print the worktree
path and open a new session there. It is not the same limitation this doc
covers, and relocating `pick`'s worktree base does not change it.
