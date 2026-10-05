# `--dir` pointing at another project than the cwd: warning

## Decision: warn, do not refuse

- Cause (code): `--dir` becomes `mainRoot` (storage) in `src/workflow/runner.mjs` (`prepareWorkflowRun`, `resolveResumeTarget`) and `runUnit`, while the workers' `cwd`/worktree comes from `resolveGitRoots(process.cwd())` unless `--worktree` is passed. So `--dir` moves state only; workers start in the caller's project. That reproduces the 2026-10-05 mdview round that ended `blocked`.
- Why not a refusal: `--worktree <project>` is an explicit, working way to combine foreign storage with the right worker directory, so the pair is not always wrong; `--dir` is documented as the main-checkout/storage selector (AGENTS.md dispatch convention); and a refusal would break any existing automation that starts from a non-project cwd. The warning exempts exactly the cases that are fine: `--worktree` given, same repository (linked worktrees), one project nested in the other, either side not a git repository.
- `fgos doctor` was not touched: it does not report cwd/`--dir` context.

## Change

- `src/workflow/dir-guard.mjs` (new): `dirDiffersFromCwdWarning`, `checkDirDiffersFromCwd` (prints one stderr line immediately, before the work), `attachDirWarning` (adds `warnings: [{code: 'dir-differs-from-cwd', message, fix}]`). Fix text: `cd <X> first and run fgos from there (or pass --worktree <X>)`.
- `bin/fgos.mjs`: `workflow start|answer|resume` (detached and `--foreground`) and `run` (not `run record`, not `workflow status`) call the check. The detached child is `workflow resume --foreground` and already carries `FGOS_WORKFLOW_ADVANCE_DETACHED=1`, which the guard honors, so it does not warn again; advance-lock/detach code is unchanged.
- Help text for `--dir` in `src/cli/command-registry.mjs`, one paragraph in `docs/specs/runner.md` (next to the workflow detach paragraph), one line in `CHANGELOG.md` `[Unreleased]`.

## Tests

`test/cli/dir-differs-from-cwd.test.mjs` (hermetic temp git repos, 8 tests): warns for another repo with a fix; silent for same dir, linked worktree, nested repo, no `--dir`, `--worktree`, non-git dirs, detached-child env; CLI `workflow start --foreground` from another project gives a single stderr line plus `warnings` in output and still stores state under `--dir`; silent from inside the project; detached start warns once and `advance.log` has no second warning; `resume`/`answer` warn before acting; `run` warns while `run record` and `workflow status` do not.
Run: `env -u CLAUDE_CODE_SESSION_ID node --test test/cli/dir-differs-from-cwd.test.mjs test/cli/run-verb.test.mjs test/cli/fgos-workflow.test.mjs test/cli/command-registry.test.mjs test/cli/fgos-help.test.mjs` all green (the fixtures' plan run ends `failed` without a runner config; the tests assert only on the warning behavior). Full suite not run.

## Unresolved

- Detached `workflow start` from the wrong project still starts the (doomed) run after warning; only the warning, as asked.
