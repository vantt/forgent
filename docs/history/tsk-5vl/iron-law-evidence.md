# tsk-5vl — Iron Law failing-test-first evidence

`classifyIronLaw` result: `required: true`, `matchedModules: ["bin/fgos.mjs"]`, `matchedFlags: []`.

## Test command

`node --test test/cli/fgos.test.mjs` (the item's own recorded `verify`).

## Failing-before (real transcript excerpt, before this item's `bin/fgos.mjs` edit)

`bin/fgos.mjs`'s `catchup` handler still reading `const repoRoot =
process.cwd();` — the new regression test spawns `catchup` with the
process `cwd` set to the item's own linked worktree and `--dir` pointed
at the main checkout, reproducing the exact reported bug:

```
✖ catchup succeeds when invoked with cwd inside the item's own linked worktree and --dir pointed at the main checkout (tsk-5vl regression guard) (498.72681ms)
  AssertionError [ERR_ASSERTION]: catchup from inside the item's own worktree unexpectedly failed: fgos: no runner config found — detected "claude" on PATH; wrote a default (executor: claude) at /tmp/fgos-cli-uKvisf/.fgos/config.json#runner; edit .fgos/config.json by hand to change.
  Automatic merge went well; stopped before committing as requested
  fatal: Cannot force update the current branch.
```

The last line is the literal git error tsk-5vl reported.

## Passing-after (real transcript excerpt, after the fix)

```
✔ catchup succeeds when invoked with cwd inside the item's own linked worktree and --dir pointed at the main checkout (tsk-5vl regression guard) (472.357913ms)
✔ catchup on a branch that already contains the target reports outcome "already-caught-up", still runs verify, and bounces blocked -> awaiting-approval without creating a commit (484.374243ms)
✔ catchup on an already-caught-up branch whose verify is RED stays blocked and reports verify-fail, without attempting a merge --abort that has no merge to abort (452.29056ms)
```

Full `test/cli/fgos.test.mjs` suite after the fix:

```
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

## What changed

`bin/fgos.mjs`'s `case 'catchup'` — `const repoRoot = process.cwd();`
replaced with `const repoRoot = path.dirname(dir);`, the same pattern
`tsk-k8u` already proved correct for `take`/`pick`. This keeps
`withMergeEphemeralWorktree`'s own `git branch -f` (`src/runner/
worktree.mjs:809`) targeting the stable main checkout instead of
whatever the invoking session's shell `cwd` happens to be, so `catchup`
now works correctly when called from inside the item's own linked
worktree instead of crashing with git's "Cannot force update the current
branch". `sync-root`/`approve` were explicitly descoped from this item
(CONTEXT.md D2) after `fgos-coding-validating` found they carry deliberate,
incident-documented worktree-refusal guards `catchup` never had — filed
separately as `tsk-4uj`.

`.claude/skills/fgos-coding-implement/SKILL.md`'s Return-step hard rule also
gained a `blocked`-specific branch: for an item already `blocked` (e.g.
`approve`'s post-merge verify-fail rollback), `return` structurally
refuses (`status: doing` precondition), so the rule now names `fgos
catchup <id>` as the correct recovery verb, citing RUL33/RUL34
(`docs/specs/work-state.md`).
