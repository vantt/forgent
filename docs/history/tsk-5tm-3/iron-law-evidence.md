# Iron Law evidence — tsk-5tm-3

`classifyIronLaw` result against the real committed diff (`trunk...fgw/tsk-5tm-3`):

```json
{"required":true,"matchedFlags":[],"matchedModules":["src/runner/dispatch.mjs"]}
```

## Test command

```bash
node --test test/runner/dispatch.test.mjs
```

(Full suite: `npm test` — 3253/3258 pass, 5 pre-existing unrelated skips.)

## Shape of this change

Unlike `tsk-5tm-1`/`tsk-5tm-2` (retirements), this item is a real
addition — a genuine bug-fix-shaped before/after: before, `execute` did
not exist and Flow A always handed back bare `{command,args}`; after,
`executeCapacityCli`/`execute` self-executes. The before/after contrast
swaps **`src/runner/dispatch.mjs`** (not the test file this time) back to
its pre-fix committed content and runs the real, already-committed test
file against it — the new tests import `executeCapacityCli`, which
genuinely does not exist on the old tree.

## Failing-before transcript

`src/runner/dispatch.mjs` swapped to its pre-tsk-5tm-3 committed content
(`git show 37b37b4e:src/runner/dispatch.mjs`, the tsk-5tm-2 merge commit),
the real (already-committed) test file run as-is:

```
file:///.../test/runner/dispatch.test.mjs:17
  executeCapacityCli,
  ^^^^^^^^^^^^^^^^^^
SyntaxError: The requested module '../../src/runner/dispatch.mjs' does not
provide an export named 'executeCapacityCli'
    at #asyncInstantiate (node:internal/modules/esm/module_job:327:21)
    at async ModuleJob.run (node:internal/modules/esm/module_job:431:5)

✖ test/runner/dispatch.test.mjs (36.023525ms)
ℹ tests 1
ℹ pass 0
ℹ fail 1
```

A clean, unambiguous failure: the entire test file fails to even load
against the pre-fix tree, because `executeCapacityCli` — the function 12
of this item's own new tests exercise — does not exist there. This is the
real, direct proof that `execute`'s self-execute/hand-back behavior is
new, not a pre-existing capability this item merely tests.

## Passing-after transcript

`src/runner/dispatch.mjs` restored to its committed (post-fix) content
(`git checkout -- src/runner/dispatch.mjs`), same test file:

```
ℹ tests 187
ℹ suites 0
ℹ pass 187
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

`git status --short` showed only the expected `.fgos/*` deletions (ADR0020
worktree artifact, never real) before this passing run — confirming it ran
against the real committed tree. Full `npm test` (3253/3258, 5
pre-existing unrelated skips) also green on the same committed tree.
