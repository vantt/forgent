# tsk-43z — Iron Law failing-test-first evidence

`classifyIronLaw` result: `required: true`, `matchedModules:
["src/runner/dispatch/cli.mjs"]`, `matchedFlags: []`.

## Test command

`node --test test/runner/dispatch.test.mjs` (the item's own `verify`).

## Failing-before (real transcript excerpt, before this item's `cli.mjs` edit)

Captured by temporarily reverting `src/runner/dispatch/cli.mjs` to its
pre-fix state (`git checkout HEAD~1 -- src/runner/dispatch/cli.mjs`, HEAD
being the worker's own commit `58875895`) and running the new test the fix
itself added, against that pre-fix code:

```
✖ the "execute" CLI entry point honors --repo-root, decoupling spawn cwd from config root (325.113759ms)
  AssertionError [ERR_ASSERTION]: fgos-runner must run inside a git repository (cwd: /tmp/fgos-dispatch-test-XDlyCt): Command failed: git rev-parse --show-toplevel
  fatal: not a git repository (or any of the parent directories): .git

  1 !== 0

      at TestContext.<anonymous> (file:///.../test/runner/dispatch.test.mjs:3199:10)
```

Without the `repoRoot: flagValue('--repo-root')` wiring, `--repo-root` is
silently ignored: `executeExecutorCli`'s `root` resolution falls through to
`resolveMainCheckoutRoot(cwd) ?? resolveRepoRoot(cwd)` on the raw `cwd`
value (the test's isolated, non-git `worktreeDir`), which throws exactly
the "must run inside a git repository" error this transcript shows — the
real, live manifestation of the bug this item tracks: config/repo-root
resolution and spawn `cwd` were not decoupled.

## Passing-after (real transcript excerpt, after the fix)

`src/runner/dispatch/cli.mjs` restored to HEAD (`git checkout HEAD --
src/runner/dispatch/cli.mjs`), full file re-run:

```
ℹ tests 303
ℹ suites 0
ℹ pass 303
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 22546.940311
```

## What changed

`src/runner/dispatch/cli.mjs`'s `runDispatchCli`, `execute` case: added
`repoRoot: flagValue('--repo-root')` to the `executeExecutorCli(...)` call
options, next to the existing `cwd: flagValue('--cwd') ??
flagValue('--dir')` line — wiring a CLI flag onto `executeExecutorCli`'s
already-existing `repoRoot` parameter (previously reachable only from an
internal caller, `fanoutBatchExecutorCli`). A caller can now pass `--cwd
<worktree path> --repo-root <main checkout path>` as two separate, explicit
flags for a worktree-backed item's out-of-process dispatch, instead of a
single `--dir` value that silently collapsed both into the same path (the
root cause of the tsk-5dnt incident this item was opened for). Paired with
a doc correction in `AGENTS.md` and `core/skills/_shared/executor-dispatch-
fallback.md` (mirrored into `.agents/skills/_shared/` and
`plugins/fgOS/skills/_shared/` via `npm run build:skills`) instructing
callers to use the two explicit flags for a worktree-backed item.
