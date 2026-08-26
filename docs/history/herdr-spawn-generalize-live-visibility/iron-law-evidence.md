# Iron Law Evidence: tsk-5jl

## Iron Law Classification

Command:
```bash
node --input-type=module -e "
import { changedFiles } from './src/runner/merge.mjs';
import { classifyIronLaw } from './src/evolve/iron-law.mjs';
const id = process.argv[1];
const description = process.argv[2];
console.log(JSON.stringify(classifyIronLaw({ filesChanged: changedFiles('.', { id }), description })));
" "tsk-5jl" "Generalize herdr-spawn executor adapter (src/runner/dispatch/transport.mjs::herdrSpawnAdapter) so ANY agent CLI (claude, agy, codex, pi) can be launched via a real herdr pane purely by config, achieving two goals simultaneously: (1) live TTY visibility matching each CLI's real streaming behavior, (2) correct synchronous {status,stdout} result returned to the dispatch ladder, with the pane auto-closed once truly done."
```

Result:
```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": [
    "src/runner/dispatch/config.mjs",
    "src/runner/dispatch/live-renderers/claude-stream-json.mjs",
    "src/runner/dispatch/live-renderers/pi-agent-session.mjs",
    "src/runner/dispatch/resolve.mjs",
    "src/runner/dispatch/transport.mjs"
  ]
}
```

## Failing-Test-First Proof

### Scoped Test Command
```bash
node --test test/runner/herdr-spawn-adapter.test.mjs
```

### Pre-Implementation Failure (RED)
Running `node --test test/runner/herdr-spawn-adapter.test.mjs` against pre-implementation `src/` (stashing `d17db5dc` changes in `src/`):

```
✖ herdr-spawn adapter closes the pane on success path (Requirement 1) (67.628731ms)
  AssertionError [ERR_ASSERTION]: herdr pane close <paneId> must be called on success path
  
  0 !== 1
  
      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-5jl-uzgC4o/test/runner/herdr-spawn-adapter.test.mjs:877:10)

✖ herdr-spawn adapter supports liveOutput config shape & bash PIPESTATUS pipeline (Requirement 2) (71.14705ms)
  AssertionError [ERR_ASSERTION]: stdout should contain output from renderer, got: "{\"text\":\"streamed-content\"}\n"
      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-5jl-uzgC4o/test/runner/herdr-spawn-adapter.test.mjs:922:10)

ℹ tests 25
ℹ pass 23
ℹ fail 2
```

### Post-Implementation Pass (GREEN)
Running `node --test test/runner/herdr-spawn-adapter.test.mjs` against restored implementation code:

```
✔ herdr-spawn adapter closes the pane on success path (Requirement 1) (97.474595ms)
✔ herdr-spawn adapter supports liveOutput config shape & bash PIPESTATUS pipeline (Requirement 2) (125.618043ms)
✔ claude-stream-json.mjs live renderer formats JSONL correctly (Requirement 3) (22.777868ms)
✔ pi-agent-session.mjs live renderer formats JSONL correctly (Requirement 3) (23.208981ms)
✔ herdr-spawn adapter (LIVE): dispatch via real agy-herdr executor against real herdr and agy binaries (Requirement 5) (4915.301455ms)
ℹ tests 25
ℹ pass 25
ℹ fail 0
```

### Real Binary Proof Result (Requirement 5)
```json
{
  "mechanism": "out-of-process",
  "status": 0,
  "signal": null,
  "stdout": "Hello from agy-herdr live proof\n\n[DONE]\n➜  live-proof-qBXdOX",
  "stderr": "",
  "tier": "light",
  "model": "gemini-3.6-flash-medium",
  "paneId": "wS:pVX",
  "verifiedSha": "ff6c122ff2cac168688651ba67b7764c72512baf",
  "provider": "agy",
  "command": "agy"
}
```
