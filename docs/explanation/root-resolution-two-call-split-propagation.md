---
authoritative_for: root=$(git rev-parse ...) worktree-guard refusal, two-separate-tool-calls note propagation to fgos-coding-driving/loop-mechanics.md and fgos-coding-discovering
---

# The `root=$(...)` worktree-guard workaround note reaches its last two skill files

`tsk-jyn` closed a real coverage gap: the piped one-liner `root=$(git
rev-parse --path-format=absolute --git-common-dir | xargs dirname)` —
prescribed verbatim for resolving the main-checkout root across at least
5 coding-domain skill files — is refused live by the same Claude Code
worktree-isolation guard `tsk-38w` already tracks (see [that
workaround](../how-to/handle-worktree-guard-refusal-of-compound-dispatch-command.md)),
just at a different call site (`fgos-coding-driving`'s own Step 1, not
`dispatch.mjs execute`).

## Confirmed live

Driving `tsk-2vn` through `fgos-coding-driving`'s own Step 1, the exact
command from `loop-mechanics.md` (lines 18-20) was refused — "This
session is isolated in the worktree ..., but this command is too complex
to verify that it stays inside the worktree" — forcing a manual split
into 2 separate Bash calls (bare `git rev-parse`, then the `node list`
call with a literal `--dir` path substituted in) every single iteration.

## An earlier fix existed, but missed two files

`tsk-3rg` (delivered) had already fixed this exact glued-`root=$(...)`
pattern in 4 sibling skills — `fgos-coding-exploring`,
`fgos-coding-planning`, `fgos-coding-implement`, `fgos-coding-
validating` — adding a "run as two SEPARATE tool calls, never pasted
together" note plus a literal-path-substitution instruction at each
file's first `root=$(...)` occurrence. `fgos-coding-driving/loop-
mechanics.md` and `fgos-coding-discovering` were never in `tsk-3rg`'s own
touched-file list, and confirmed still carrying the bare, unguarded
pattern with no such note.

## What shipped

The exact same note `tsk-3rg` already used, extended verbatim in wording
and shape to the 2 remaining files — `.agents/skills/fgos-coding-
discovering/SKILL.md` and `.agents/skills/fgos-coding-driving/
references/loop-mechanics.md` — across every render copy
(`.agents/skills/`, `plugins/fgOS/skills/`, `domains/coding/skills/`).

## Why the guard itself is out of scope, again

`tsk-38w` had already independently confirmed (a `rg 'too complex to
verify'` search returning zero hits in this repo's own `src/`) that the
worktree-isolation guard is a Claude Code harness built-in, not
something this repo can change. The actionable fix, for both `tsk-38w`'s
own scope and this item, is always the same shape: document the safe
workaround at every affected call site, never attempt to alter the
guard itself.
