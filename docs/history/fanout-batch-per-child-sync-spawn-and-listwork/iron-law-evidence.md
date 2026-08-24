# Iron Law evidence — tsk-2ewi

`classifyIronLaw` against the real committed diff (`30123dec`, `fgw/tsk-2ewi`) returned `required: true`:

```json
{
  "filesChanged": [
    "src/runner/dispatch/cli.mjs",
    "test/runner/dispatch.test.mjs"
  ],
  "classification": {
    "required": true,
    "matchedFlags": [],
    "matchedModules": [
      "src/runner/dispatch/cli.mjs"
    ]
  }
}
```

## Test command

```
node --test test/runner/dispatch.test.mjs
```

## Passing-after proof

Real transcript against the actual committed fix:

```
$ node --test test/runner/dispatch.test.mjs
✔ fanoutBatchExecutorCli returns slotsFull when worker slots ceiling is full (17.498757ms)
✔ fanoutBatchExecutorCli trims candidates to free slots when ceiling is configured (17.889967ms)
✔ fanoutBatchExecutorCli: real end-to-end out-of-process fire -- pick/execute/return actually complete via subprocess calls to the real bin/fgos.mjs (314.502351ms)
✔ fanoutBatchExecutorCli fires candidates in batch concurrently with overlapping execution windows (2961.323352ms)
ℹ tests 312
ℹ suites 0
ℹ pass 312
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 14106.97022
```
