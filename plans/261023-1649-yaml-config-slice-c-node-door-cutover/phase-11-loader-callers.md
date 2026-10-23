# Phase 11: Callers of the runner loaders (mechanical)

Depends on 10. Suggested executor: haiku (renames and the two `existsSync` replacements), sonnet review of the diff. Shared file: none of the board's rows except `src/runner/dispatch/cli.mjs` (SEAT and COOK read it; post first). `bin/fgos.mjs` is **excluded**: phase 15 owns it.

## Context

About 20 call sites use `ensureRunnerConfigForDir` or `loadRunnerConfigFromDir` (`rg` at planning: `bin/fgos-runner.mjs:99`, `src/runner/operation-choice.mjs:2307`, `src/runner/fanout-batch.mjs:51`, `src/workflow/runner.mjs:365`, `src/workflow/case-start.mjs:232,279`, `src/runner/dispatch/assignment-runner.mjs:444,1073`, `src/runner/dispatch/cli.mjs:241,389,846,1015`; `run.mjs` moved to phase 10 with its `stripConfigComments` use). Two further sites decide a root with `fs.existsSync(path.join(wtRoot, '.fgos', 'config.json'))` (`cli.mjs:384`, `:841`): bypass readers 5 of the spec's seven.

## Files it may touch

`bin/fgos-runner.mjs`, `src/runner/{operation-choice,fanout-batch}.mjs`, `src/workflow/{runner,case-start}.mjs`, `src/runner/dispatch/{assignment-runner,cli}.mjs`, and the tests that name these functions in their imports or mocks (phase 00 list).

## Design

- Each call becomes `loadRunnerConfigForDir(dir)` (phase 10). No call site changes what it does with the result.
- `cli.mjs:384,841`: `fs.existsSync(path.join(wtRoot, '.fgos', 'config.json'))` becomes `projectConfigPresent(wtRoot)` from the facade (true for a `config.yaml`, a legacy `config.json`, or a tombstone: a tombstoned file means "this worktree has a config of its own to look at"; the expected behaviour is pinned by the existing test of that code path, phase 00 names it).
- `fanout-batch.mjs:53` also reads `workerSlots.ceiling` through `readSharedConfigOrEmpty(root)`: it moves in this phase (the file is this phase's), with the same outcome rule as phase 12's ceiling readers.
- `bin/fgos-runner.mjs` prints nothing new; its old stderr line about a created default is already gone with the loader.

## Steps

1. Merge `origin/main`; take the exact list from `rg -n "ensureRunnerConfigForDir|loadRunnerConfigFromDir" src bin scripts --glob '*.mjs'` after phase 10 and exclude `bin/fgos.mjs`.
2. Rename; replace the two `existsSync` calls and the ceiling read; run the tests of each touched module through the launcher, then the directories `test/runner test/workflow test/cli` sequentially after `free -g`.
3. `rg -n "ensureRunnerConfigForDir|loadRunnerConfigFromDir" src scripts test --glob '*.mjs'` finds only `bin/fgos.mjs` (phase 15) and nothing else.

## Owning proofs

The existing tests of each module, moved; no new case.

## Risk / rollback

Mechanical; one commit per directory so a revert is local. Rolls back with phase 10.
