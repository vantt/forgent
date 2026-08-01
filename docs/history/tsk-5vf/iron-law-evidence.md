# Iron Law evidence — tsk-5vf

`classifyIronLaw` (`src/evolve/iron-law.mjs`), run over this item's own change
set (`changedFiles` against the item's real commits):

```json
{
 "required": true,
 "matchedFlags": [],
 "matchedModules": [
  "bin/fgos.mjs",
  "src/runner/dispatch.mjs"
 ]
}
```

Test command (the same one run at step 3, and the first leg of the item's own
`verify`):

```
node --test test/runner/dispatch.test.mjs
```

## Failing before

Captured by restoring every touched implementation file to the parent commit
(`git show 3a7dc88:...` for `src/runner/dispatch.mjs`, `src/config/global-config.mjs`,
`src/setup/registrations.mjs`, `src/setup/checks.mjs`, `bin/fgos.mjs`,
`bin/fgos-runner.mjs`) and deleting the new `src/config/shared-config-file.mjs`,
while leaving the test file (which already imports the new
`loadRunnerConfigFromDir`/`ensureRunnerConfigForDir` exports) unchanged, then
running the command above unchanged:

```
file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-5vf-CxLDbI/test/runner/dispatch.test.mjs:11
  ensureRunnerConfigForDir,
  ^^^^^^^^^^^^^^^^^^^^^^^^
SyntaxError: The requested module '../../src/runner/dispatch.mjs' does not provide an export named 'ensureRunnerConfigForDir'
    at #asyncInstantiate (node:internal/modules/esm/module_job:327:21)
    at async ModuleJob.run (node:internal/modules/esm/module_job:431:5)
    at async node:internal/modules/esm/loader:643:26
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:101:5)

Node.js v24.18.0
✖ test/runner/dispatch.test.mjs (47.765174ms)
ℹ tests 1
ℹ suites 0
ℹ pass 0
ℹ fail 1
```

The whole file fails to even load, not just the new assertions — before this
item, `loadRunnerConfigFromDir`/`ensureRunnerConfigForDir` do not exist at
all; the shared config file (`.fgos/config.json`) and the registry-driven
assembler consuming it are both net-new.

## Passing after

Every touched file restored to its committed content (confirmed
`git diff --stat HEAD` empty for all six before rerunning), same command,
same test file:

```
ℹ tests 67
ℹ suites 0
ℹ pass 67
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 748.289402
```

## No regression in the modules the gate flagged

```
node --test test/cli/fgos.test.mjs      → ℹ tests 463   ℹ pass 463   ℹ fail 0
node --test test/architecture.test.mjs  → ℹ tests 3     ℹ pass 3     ℹ fail 0
npm test                                → ℹ tests 2026  ℹ pass 2021  ℹ fail 0  ℹ skipped 5
```
