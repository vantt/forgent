---
item: tsk-2j9
timestamp: 2026-08-02T06:12:00.000Z
---

# Iron Law evidence: tsk-2j9

## Classification

`classifyIronLaw({ filesChanged, description })` against the item's final
diff (`fgw/tsk-2j9` vs. trunk `main`), computed the same way `approve`'s own
gate computes it (`src/evolve/iron-law.mjs`, `changedFiles` from
`src/runner/merge.mjs`):

```json
{"required":true,"matchedFlags":[],"matchedModules":["src/runner/merge.mjs"]}
```

`filesChanged`:
```json
["docs/history/tsk-2j9-merge-abort-missing-merge-head/CONTEXT.md","docs/history/tsk-2j9-merge-abort-missing-merge-head/plan.md","src/runner/merge.mjs","test/runner/merge.test.mjs"]
```

`src/runner/merge.mjs` matches the Iron Law's self-modifying-capable
`src/runner/` prefix rule.

## Test command

```
node --test test/runner/merge.test.mjs
```

## Failing-test-first proof

**Red** — the two new regression tests (`abortMergeIfPossible is a no-op
when there is no MERGE_HEAD...` and `abortMergeIfPossible still aborts a
real in-progress merge when MERGE_HEAD does exist`) against the pre-fix
code (`0a5f95c`, plan.md's commit, before the fix): ran in a disposable
detached worktree at that commit with the new test file copied in.

```
$ node --test test/runner/merge.test.mjs
file:///.../test/runner/merge.test.mjs:18
  abortMergeIfPossible,
  ^^^^^^^^^^^^^^^^^^^^
SyntaxError: The requested module '../../src/runner/merge.mjs' does not provide an export named 'abortMergeIfPossible'
    at #asyncInstantiate (node:internal/modules/esm/module_job:327:21)
    ...
ℹ tests 1
ℹ pass 0
ℹ fail 1
```

(The pre-fix module has no `abortMergeIfPossible` export at all — every
abort call site still runs `git(repoRoot, ['merge', '--abort'])`
unconditionally — so the new tests cannot even load, let alone pass. This
is itself the proof that the guard did not exist before this fix.)

**Green** — same command, same test file, against the fix (`ec875e8`):

```
$ node --test test/runner/merge.test.mjs
✔ abortMergeIfPossible is a no-op when there is no MERGE_HEAD (the tsk-2j9 no-op-merge case) — never throws "no merge to abort" (38.578337ms)
✔ abortMergeIfPossible still aborts a real in-progress merge when MERGE_HEAD does exist (48.623031ms)
...
ℹ tests 53
ℹ pass 53
ℹ fail 0
```

Full 53/53 green, including all pre-existing coverage for the 4 abort call
sites' unchanged error messages and outcomes on every already-covered case.
