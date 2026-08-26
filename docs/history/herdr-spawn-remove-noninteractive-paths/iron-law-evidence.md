# Iron Law Evidence — tsk-by0

## Classification

Item ID: `tsk-by0`
Classification result: `required: true`
Matched modules:
- `src/runner/dispatch/transport.mjs`
- `src/runner/dispatch/live-renderers/claude-stream-json.mjs`
- `src/runner/dispatch/live-renderers/pi-agent-session.mjs`

## Red Transcript (Pre-Fix)

Command: `node --test test/runner/herdr-spawn-adapter.test.mjs`

```text
✖ herdr-spawn adapter rejects invocation missing interactiveMode (497.417793ms)
✔ herdr-spawn adapter validates interactiveMode config shape (9.283793ms)
✔ herdr-spawn adapter interactiveMode execution: polls agent_status until idle, sends exitCommand, parses sentinel, strips double echo (2178.623469ms)
✔ herdr-spawn adapter interactiveMode handles timeout when agent_status stays working (117.899813ms)
✔ herdr-spawn adapter (LIVE): dispatch a real agy-herdr interactiveMode executor against real binaries (8128.824651ms)
ℹ tests 5
ℹ suites 0
ℹ pass 4
ℹ fail 1
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 11269.833905

✖ failing tests:

test at test/runner/herdr-spawn-adapter.test.mjs:21:1
✖ herdr-spawn adapter rejects invocation missing interactiveMode (497.417793ms)
  AssertionError [ERR_ASSERTION]: Missing expected rejection.
      at async TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-by0-0tfkEH/test/runner/herdr-spawn-adapter.test.mjs:23:3)
      at async Test.run (node:internal/test_runner/test:1332:7)
      at async startSubtestAfterBootstrap (node:internal/test_runner/harness:385:3) {
    generatedMessage: false,
    code: 'ERR_ASSERTION',
    actual: undefined,
    operator: 'rejects',
    diff: 'simple'
  }
```

## Green Transcript (Post-Fix)

Command: `node --test test/runner/herdr-spawn-adapter.test.mjs`

```text
✔ herdr-spawn adapter rejects invocation missing interactiveMode (3.065789ms)
✔ herdr-spawn adapter validates interactiveMode config shape (3.129805ms)
✔ herdr-spawn adapter interactiveMode execution: polls agent_status until idle, sends exitCommand, parses sentinel, strips double echo (2160.278585ms)
✔ herdr-spawn adapter interactiveMode handles timeout when agent_status stays working (118.190055ms)
✔ herdr-spawn adapter (LIVE): dispatch a real agy-herdr interactiveMode executor against real binaries (6615.849706ms)
ℹ tests 5
ℹ suites 0
ℹ pass 5
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 9232.135259
```
