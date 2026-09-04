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

## The two-flag fix didn't close the gap — it only relocated it (`tsk-322`)

`tsk-43z` made `--repo-root` and `--cwd` separately *passable*, but never
made `--cwd` *required* once `--repo-root` is present. `tsk-322`
reproduced the identical symptom (a genuinely correct, successful
`agy`/`herdr-spawn` implementation landing on the shared main checkout
instead of the caller's worktree branch — commit `26d16fbd`, confirmed
via `git branch --all --contains <sha>` returning only `main`) from a
caller that passed `--repo-root <main checkout>` but **omitted `--cwd`**,
letting it silently default to `execute`'s own `process.cwd()`.
`fanoutBatchExecutorCli`'s own internal call to the same dispatch layer
always passes both `cwd: wtPath` and `repoRoot: root` — this incident's
caller only passed one of the two, and nothing in the CLI enforced the
pair.

Root cause not confirmed at synthesis time — left as two live hypotheses
for whoever picks this up: (a) the `herdr-spawn`/`agy` adapter resolves
its own working directory from `repoRoot` rather than the passed `cwd`
once `repoRoot` is present, or (b) `execute`'s own `--repo-root` handling
silently drops or overrides an unset `--cwd` instead of defaulting it to
the real `process.cwd()`. Also flagged as possibly the same underlying
`agy` defect surfacing a third time — [[project_agy_cwd_bug_wrong_worktree_commit]]
documents `agy` ignoring an *explicitly passed* `cwd` once before
(2026-08-17, via `spawnWorker`/`cliSpawnAdapter`, landed on a different
item's branch that time), and `tsk-5cr`/`tsk-5fn` (filed the same day as
this item) are two more `agy`-herdr dispatch-location/completion bugs —
three in one day was enough to flag `agy`/herdr as a dispatch backend for
a broader reliability audit before further real-scale reliance, not yet
scheduled as of this write-up.

**Suggested fix directions, not yet implemented:** require `--cwd`
whenever `--repo-root` is passed and the two differ, or refuse to run a
worker against the bare repo root at all when dispatched from an isolated
worktree context; confirm whether the `herdr-spawn` adapter's own spawn
call actually honors `cwd` independent of `repoRoot`.

## Same family, different symptom: correct commit, wrong `verifiedSha` metadata (`tsk-22bm`)

`tsk-22bm` reproduced a third variant while driving `tsk-10n` via
`/fgOS:cook`: `dispatch.mjs execute` called with no `--repo-root` and no
`--cwd` at all (from inside `fgw/tsk-10n`'s own cwd). This time the
worker's real commit (`f2c475b1`) landed correctly on the right branch —
**not** the wrong-location symptom above. But the JSON result's own
`verifiedSha` field read `21966be3...`, which turned out to be `main`'s
own HEAD at read time (an unrelated concurrent commit), not an ancestor
of `fgw/tsk-10n` at all.

The existing safety net held: `fgos-coding-implement`'s own hard rule to
independently confirm the worker's commit (`git log -1`/`git
status`/`git cat-file`) rather than trust `verifiedSha` on faith caught
the bad metadata before `fgos return --worker-verified-sha` could be
called with it. `tsk-22bm` treated this as confirm-only — no code
changed. It shipped `RESEARCH.md` (committed at discovery) as the full
deliverable, tracing `verifiedSha`'s bad-HEAD computation to the same
upstream `repoRoot`-vs-`cwd` resolution confusion documented above, and
left one question explicitly still open: whether `fgos return` itself
validates a passed `--worker-verified-sha` against the real branch tip
before accepting it, or would silently accept a mismatched sha if a
caller skipped the independent check — not confirmed as part of this
item, noted for whoever picks it up next.
