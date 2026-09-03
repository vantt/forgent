---
authoritative_for: pane-rename silently no-op inside a worktree-isolated session, worktree-isolation guard refuses an unresolved $PWD token, fix passes a resolved absolute path instead
---

# The pane-rename call silently stopped relabeling panes after the first stage — the isolation guard couldn't verify `$PWD`

`tsk-1ml` fixed a real, silent mechanism defeat: `fgos-coding-driving`'s
own documented pane-labeling call, prescribed by `loop-mechanics.md` Step
5 as `bash plugins/fgOS/skills/terminal/rename.sh "<id>" "$PWD"`, was
refused by the worktree-isolation guard on every single invocation made
from inside a worktree-isolated session.

## Confirmed live during `tsk-2y1`'s drive (2026-08-23)

The identical script ran successfully from the main checkout *before*
`EnterWorktree` (plain `/fgOS:pick` Step 3, no `$PWD` variable, an
absolute path argument instead) — but the same script invoked with the
literal `"$PWD"` token from inside the worktree-isolated session
(`fgos-coding-driving` Step 5, right before loading `fgos-coding-discovering`)
was refused: "this command is too complex to verify that it stays inside
the worktree." Likely cause: the guard cannot statically verify a path
hidden behind an unresolved shell variable, so it refuses generically
rather than attempting to resolve it.

## The practical effect — a mechanism silently defeated by its own hard rule

Per the pane-rename call's own hard rule (never stop, retry, or branch on
its result — decoration, never a gate), the drive itself continued
correctly. But the practical effect was that pane relabeling silently
no-op'd on every `fgos-coding-driving` Step 5 call made from inside a
worktree — i.e. every item, after its first `/fgOS:pick`-level rename,
never got its pane relabeled again as it moved through later stages,
defeating the whole point of the mechanism: a person watching herdr panes
could no longer tell which item/stage a pane was actually on past the
first stage.

## Two fix directions were named; the resolved-path one shipped

The item's own description named two options: (a) special-case this
specific `rename.sh` invocation shape in the isolation guard, or resolve
`$PWD` before the guard's complexity check runs; (b) have
`loop-mechanics.md`'s Step 5 pass an already-resolved absolute path
instead of the literal `$PWD` token. Option (b) shipped — the simpler,
narrower fix, leaving the guard itself untouched.

## What shipped

`loop-mechanics.md`'s Step 5 now substitutes the session's own
already-known absolute worktree path — the path `EnterWorktree` just
switched into, or the main-checkout root pre-`EnterWorktree` — for
`<path>`, instead of the unresolved `$PWD` shell variable:

```bash
bash plugins/fgOS/skills/terminal/rename.sh "<id>" "<path>"
```

Mirrored across all 4 skill copies (`.agents/`, `.claude/skills/`,
`domains/coding/skills/`, `plugins/fgOS/skills/`) — a follow-up commit
(`f78f32ad`) corrected the item's own plan mid-flight to make clear which
of those is the canonical source the others are generated from, before
the actual fix commit touched all 4 in one shot (the repo's own
generated-mirror convention this whole retro-loop session has repeatedly
relied on for other skill edits).

## Related, not a guard bypass

This item never proposed bypassing the worktree-isolation guard — it
removed the one thing the guard genuinely couldn't verify (an unresolved
shell variable) by supplying a value it could resolve statically.
