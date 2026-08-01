# tsk-4iv-1 — Iron Law evidence

`classifyIronLaw` (`src/evolve/iron-law.mjs`), run against this item's real
changed-file set (`changedFiles`, `src/runner/merge.mjs`) after the
implementation commit:

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": ["bin/fgos.mjs"]
}
```

Changed files: `bin/fgos.mjs`, `docs/history/fgos-uninstall/CONTEXT.md`,
`docs/history/fgos-uninstall/plan.md`, `src/cli/command-registry.mjs`,
`src/setup/git-hooks.mjs`, `test/setup/uninstall-wiring.test.mjs`. The gate
trips on the `bin/fgos.mjs` module match — fgOS's own CLI entry point,
self-modifying by definition.

Verify command: `node --test test/setup/uninstall-wiring.test.mjs`

## Failing-test-first proof

Reconstructed with a real detached `git worktree add` at
`9f76e8b4c2a8bda22abe5867bbaab9edb717ecfc` (the commit immediately before
the implementation), copying only the new test file onto that
pre-implementation tree and running it there — never fabricated or
paraphrased.

**Before (pre-implementation tree + new test only) — real failure:**

```
file:///tmp/tmp.5vm9Sy76WD/test/setup/uninstall-wiring.test.mjs:18
import { uninstallGitHooks } from '../../src/setup/git-hooks.mjs';
         ^^^^^^^^^^^^^^^^^
SyntaxError: The requested module '../../src/setup/git-hooks.mjs' does not provide an export named 'uninstallGitHooks'
    at #asyncInstantiate (node:internal/modules/esm/module_job:327:21)
    at async ModuleJob.run (node:internal/modules/esm/module_job:431:5)
    at async node:internal/modules/esm/loader:643:26
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:101:5)

Node.js v24.18.0
✖ test/setup/uninstall-wiring.test.mjs (29.067236ms)
ℹ tests 1
ℹ pass 0
ℹ fail 1
```

**After (implementation commit `2e06530`) — real pass:**

```
✔ uninstallGitHooks unwires and deletes .githooks/pre-commit + the now-empty dir when hooksPath is exactly .githooks (17.031787ms)
✔ uninstallGitHooks leaves a custom hooksPath completely untouched (12.59834ms)
✔ uninstallGitHooks is a no-op when hooksPath was never set (16.214367ms)
✔ uninstall with no --yes refuses (exit 4) and touches nothing (174.560897ms)
✔ uninstall --yes unwires hooks, reports (never deletes) the shell-rc source line, and leaves .fgos/config.json byte-identical (162.725008ms)
ℹ tests 5
ℹ pass 5
ℹ fail 0
```
