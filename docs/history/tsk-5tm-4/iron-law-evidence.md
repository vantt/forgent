# Iron Law evidence — tsk-5tm-4

`classifyIronLaw` result against the real committed diff (`trunk...fgw/tsk-5tm-4`):

```json
{"required":true,"matchedFlags":[],"matchedModules":["src/runner/dispatch.mjs"]}
```

## Test command

```bash
node --test test/runner/dispatch.test.mjs
```

(Full suite: `npm test` — 3261/3266 pass, 5 pre-existing unrelated skips.)

## Shape of this change

A real addition, same shape as `tsk-5tm-3`: before, `capacities.<id>.invocations[]`
did not exist as a recognized shape and `INVOCATION_VIA` was not
exported. The before/after contrast swaps `src/runner/dispatch.mjs` back
to its pre-fix committed content and runs the real, already-committed
test file against it.

## Failing-before transcript

`src/runner/dispatch.mjs` swapped to its pre-tsk-5tm-4 committed content
(`git show 82d98580:src/runner/dispatch.mjs`, the tsk-5tm-3 merge
commit), the real (already-committed) test file run as-is:

```
file:///.../test/runner/dispatch.test.mjs:30
  INVOCATION_VIA,
  ^^^^^^^^^^^^^^
SyntaxError: The requested module '../../src/runner/dispatch.mjs' does not
provide an export named 'INVOCATION_VIA'
    at #asyncInstantiate (node:internal/modules/esm/module_job:327:21)
    at async ModuleJob.run (node:internal/modules/esm/module_job:431:5)

✖ test/runner/dispatch.test.mjs (40.662349ms)
ℹ tests 1
ℹ pass 0
ℹ fail 1
```

A clean, unambiguous failure: the whole test file fails to load against
the pre-fix tree, because `INVOCATION_VIA` — the export the 8 new tests
in this item exercise (directly, or via `validateCapacityShape`/
`resolveExecutorConfig` accepting the new `invocations[]` shape) — does
not exist there.

## Passing-after transcript

`src/runner/dispatch.mjs` restored to its committed (post-fix) content
(`git checkout -- src/runner/dispatch.mjs`), same test file:

```
ℹ tests 195
ℹ suites 0
ℹ pass 195
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

`git status --short` showed only the expected `.fgos/*` deletions (ADR0020
worktree artifact, never real) before this passing run — confirming it ran
against the real committed tree. Full `npm test` (3261/3266, 5
pre-existing unrelated skips) also green on the same committed tree.
