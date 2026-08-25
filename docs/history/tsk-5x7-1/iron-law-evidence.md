# Iron Law Evidence — tsk-5x7-1

## Item Details
- **Item ID:** `tsk-5x7-1`
- **Description:** `Fix decide --for reading capabilities.prefer, plus a minimal canonical DispatchPlan`
- **Classification Result:**
  ```json
  {
    "required": true,
    "matchedFlags": [],
    "matchedModules": [
      "src/runner/dispatch.mjs",
      "src/runner/dispatch/cli.mjs",
      "src/runner/dispatch/plan.mjs"
    ]
  }
  ```

## Failing Test First (RED Transcript)

Command executed prior to restoring implementation files:
```bash
node src/runner/dispatch.mjs decide --for fgos-coding-implement --dir "$PWD"
node --test test/runner/dispatch.test.mjs
```

### Transcript Excerpt (RED)

```
$ node src/runner/dispatch.mjs decide --for fgos-coding-implement --dir "$PWD"
{"mechanism":"unavailable","configured":false}

$ node --test test/runner/dispatch.test.mjs
file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-5x7-1-Soti6S/test/runner/dispatch.test.mjs:25
  compileDispatchPlan,
  ^^^^^^^^^^^^^^^^^^^
SyntaxError: The requested module '../../src/runner/dispatch.mjs' does not provide an export named 'compileDispatchPlan'
    at #asyncInstantiate (node:internal/modules/esm/module_job:327:21)
    at async ModuleJob.run (node:internal/modules/esm/module_job:431:5)
    at async node:internal/modules/esm/loader:643:26
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:101:5)

Node.js v24.18.0
✖ test/runner/dispatch.test.mjs (56.91863ms)
ℹ tests 1
ℹ suites 0
ℹ pass 0
ℹ fail 1
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 61.985448
```

## Passing Verification (GREEN Transcript)

Command executed after restoring implementation files (`git checkout HEAD -- src/runner/dispatch.mjs src/runner/dispatch/cli.mjs src/runner/dispatch/plan.mjs`):
```bash
node src/runner/dispatch.mjs decide --for fgos-coding-implement --dir "$PWD" | grep -q '"executorId":"agy"' && node --test test/runner/dispatch.test.mjs
```

### Transcript Excerpt (GREEN)

```
$ node src/runner/dispatch.mjs decide --for fgos-coding-implement --dir "$PWD" | grep -q '"executorId":"agy"' && node --test test/runner/dispatch.test.mjs
✔ decideExecutorCli resolves --for via capabilities.<name>.prefer returning executorId, out-of-process, configured:true (0a fix) (0.934042ms)
✔ compileDispatchPlan builds a canonical DispatchPlan for all four selector forms (0b) (0.238051ms)
✔ logExecutorDispatch writes governance payload into executor.dispatch event generically (0c) (18.860962ms)
ℹ tests 322
ℹ suites 0
ℹ pass 322
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 12119.626351
```
