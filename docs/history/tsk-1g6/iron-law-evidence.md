# Iron Law Evidence — tsk-1g6

## Classification

```json
{"required":true,"matchedFlags":[],"matchedModules":["bin/fgos.mjs"]}
```

## Failing Test Output (Red State)

Command run against test file with implementation unlinked:

```
$ node --test test/runner/dispatch.test.mjs

node:internal/modules/esm/resolve:271
    throw new ERR_MODULE_NOT_FOUND(
          ^

Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/home/vantt/projects/forgentX/.claude/worktrees/tsk-1g6-JCf4wJ/src/report/dispatch-confidence.mjs' imported from /home/vantt/projects/forgentX/.claude/worktrees/tsk-1g6-JCf4wJ/test/runner/dispatch.test.mjs
    at finalizeResolution (node:internal/modules/esm/resolve:271:11)
    at moduleResolve (node:internal/modules/esm/resolve:865:10)
    at defaultResolve (node:internal/modules/esm/resolve:992:11)
    at #cachedDefaultResolve (node:internal/modules/esm/loader:701:20)
    at #resolveAndMaybeBlockOnLoaderThread (node:internal/modules/esm/loader:721:38)
    at ModuleLoader.resolveSync (node:internal/modules/esm/loader:759:56)
    at #resolve (node:internal/modules/esm/loader:683:17)
    at ModuleLoader.getOrCreateModuleJob (node:internal/modules/esm/loader:603:35)
    at ModuleJob.syncLink (node:internal/modules/esm/module_job:163:33)
    at ModuleJob.link (node:internal/modules/esm/module_job:253:17) {
  code: 'ERR_MODULE_NOT_FOUND',
  url: 'file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-1g6-JCf4wJ/src/report/dispatch-confidence.mjs'
}

Node.js v24.18.0
✖ test/runner/dispatch.test.mjs (56.588143ms)
ℹ tests 1
ℹ suites 0
ℹ pass 0
ℹ fail 1
```

## Passing Test Output (Green State)

Command run with implementation restored:

```
$ node --test test/runner/dispatch.test.mjs

✔ classifyDispatchConfidence classifies legacy-signal token in local worker log (a) (18.364588ms)
✔ classifyDispatchConfidence classifies inferred when log exists with no token (b) (30.826409ms)
✔ classifyDispatchConfidence classifies missing when executor.dispatch event exists but log file is missing (c) (33.187135ms)
✔ classifyDispatchConfidence degrades to missing when log file is malformed/empty (d) (21.219698ms)
✔ classifyDispatchConfidence reports non-existent id plainly with zero dispatches (e) (16.237851ms)
✔ classifyDispatchConfidence classifies reported when event payload carries explicit outcome (27.661057ms)
ℹ tests 333
ℹ suites 0
ℹ pass 333
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 12284.429638
```
