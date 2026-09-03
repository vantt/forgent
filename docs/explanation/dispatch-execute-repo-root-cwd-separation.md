---
authoritative_for: dispatch execute --repo-root flag, cwd vs repoRoot separation, silent wrong-branch commit incident on tsk-5dnt
---

# `dispatch execute` had one `cwd` for two different jobs — now it has two

`tsk-43z` closed a real, high-severity bug: `dispatch.mjs execute`
(`executeExecutorCli`, `src/runner/dispatch/cli.mjs`) passed the *same*
`cwd` value used for main-checkout/config resolution straight through as
the spawned executor's own process `cwd`. This repo's own documented
convention for CLI-level dispatch (`AGENTS.md`'s Dispatch section,
`executor-dispatch-fallback.md`) said to pass `--dir`/`--cwd` = the main
checkout root, since `executeExecutorCli`'s config loading needs it.
Following that exact documented convention while dispatching a
worktree-backed coding item's Implement step out-of-process therefore
spawned the executor **inside the main checkout, not the item's own
`fgw/<id>` worktree.**

## Confirmed live — a silent wrong-branch commit, not a theoretical risk

Dispatching `fgos-coding-implement` for `tsk-5dnt` out-of-process via
`node src/runner/dispatch.mjs execute fgos-coding-implement --prompt-file
... --dir <main checkout>` (following the then-documented convention
exactly): the `agy`/`gemini` worker did the real, correct fix matching
the plan — but committed it as `47864e01` with parent `a60c4ad0` (main's
own history), never touching `fgw/tsk-5dnt` at all. **The commit silently
bypassed the item's own verify/return/approve pipeline and landed an
unreviewed change directly on the shared main branch.** Had to be
reverted (`git revert`, commit `4bc0de28`) and the fix redone in-process
to land it correctly.

## Root cause, confirmed by direct code read

The real runner loop's own `spawnWorker(work, cfg, cwd, opts)`
(`src/runner/loop.mjs`) is *always* called with the item's own resolved
worktree path as a separate third argument, decoupled from wherever
config gets loaded from — the correct shape. `executeExecutorCli`
already supported this same decoupling internally via its own optional
`repoRoot` parameter — but the CLI's own `execute` subcommand
(`runDispatchCli`) never wired any flag to `repoRoot`. It stayed
permanently `undefined` for every CLI-level `execute` call, so `cwd` and
`root` were always forced to the same value — the structural gap that
made the documented convention itself unsafe for worktree-backed items.

## Directly related to a lower-severity item — but treated as more urgent

Named as related to `tsk-fli` (`dispatch.mjs execute` has no `--work
<id>` flag to auto-resolve a work item's own prompt/context — the
natural place to also resolve the item's own worktree path). This item
was explicitly flagged as **higher urgency than `tsk-fli`'s own DX-
friction framing**, since the failure mode here is silent corruption of
the shared main branch, not just an awkward CLI.

## What shipped

A `--repo-root <path>` flag wired to `executeExecutorCli`'s `repoRoot`
parameter (`src/runner/dispatch/cli.mjs`). `AGENTS.md`'s Dispatch section
and `executor-dispatch-fallback.md` (all render copies) now state the
corrected convention explicitly: for a worktree-backed item, pass
`--cwd <worktree path>` and `--repo-root <main checkout path>` as two
**separate** flags — never pass the main checkout as `--dir` alone. The
old single-`--dir` convention is no longer safe guidance for a
worktree-backed dispatch.
