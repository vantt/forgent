# Iron Law evidence — tsk-10j

## Classification

```
node --input-type=module -e "
import { changedFiles } from './src/runner/merge.mjs';
import { classifyIronLaw } from './src/evolve/iron-law.mjs';
import { listWork } from './src/state/store.mjs';
const item = listWork('/home/vantt/projects/forgentX/.fgos').work['tsk-10j'];
const filesChanged = changedFiles('/home/vantt/projects/forgentX', item);
console.log(JSON.stringify(classifyIronLaw({ filesChanged, description: item.description }), null, 2));
"
```

Result (real, against the actual committed `trunk...branch` diff):

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": [
    "src/runner/dispatch/cli.mjs",
    "src/runner/dispatch/config.mjs",
    "src/runner/dispatch/resolve.mjs",
    "src/runner/dispatch/transport.mjs"
  ]
}
```

## Verify command

```
npm test
```

Full suite, real run: 4151 pass / 0 real fail / 5 skipped (out of 4157).
One unrelated test (`cliSpawnAdapter kills the whole process GROUP on
timeout...`, `test/runner/dispatch.test.mjs`) flaked once under
concurrent system load during the full run — confirmed a real timing
flake, not a regression, by re-running it alone in isolation right after
(passed cleanly, ~812ms). Not touched by any file this item changed.

Re-verify after recovering from a system-wide inode-exhaustion incident
(unrelated to this item's own code — `df -ih /` had hit 100%/0 free
during the prior verify attempt, causing real `ENOSPC` failures across
~466 unrelated tests; confirmed recovered at 12% used / 27M free before
re-running): full suite, real run, 4152 pass / 0 fail / 5 skipped (out of
4157) — clean, no flakes this time.

## Failing-test-first proof (real, not narrated)

Method: temporarily swapped all four changed files
(`cli.mjs`/`config.mjs`/`resolve.mjs`/`transport.mjs`) back to their
pre-item versions (`git show 605358bf:<path>`, `605358bf` = this item's
own `headAtTake`), ran the new `interactiveMode` tests against that old
code, confirmed real failures, then restored the current (fixed) files
and confirmed the same tests pass — `git status` clean before and after,
proving the restore was exact.

**Before (old code, real failure output — all four new tests fail):**

```
✖ herdr-spawn adapter validates interactiveMode config shape
  AssertionError: Missing expected exception. (config.mjs has no
  interactiveMode validator yet)

✖ herdr-spawn adapter interactiveMode execution: polls agent_status
  until idle, sends exitCommand, parses sentinel, strips double echo
  Error [DispatchError]: executor timed out after 5000ms for work
  "interactive-item".

✖ herdr-spawn adapter interactiveMode handles timeout when agent_status
  stays working
  AssertionError: expected errorClass 'worker-timeout', got
  'worker-spawn-fail' (herdrSpawnInteractiveAdapter does not exist yet
  in the old transport.mjs, so this dispatches through the wrong path
  entirely)

✖ herdr-spawn adapter (LIVE): dispatch a real agy-herdr interactiveMode
  executor against real binaries
  Error [DispatchError]: executor timed out after 60000ms for work
  "test-agy-herdr-interactive".
```

**After (current, fixed code, real pass output):**

```
✔ herdr-spawn adapter validates interactiveMode config shape
✔ herdr-spawn adapter interactiveMode execution: polls agent_status
  until idle, sends exitCommand, parses sentinel, strips double echo
✔ herdr-spawn adapter interactiveMode handles timeout when agent_status
  stays working (115.626956ms)
✔ herdr-spawn adapter (LIVE): dispatch a real agy-herdr interactiveMode
  executor against real binaries (5527.704565ms)
ℹ tests 4
ℹ pass 4
ℹ fail 0
```

## Real bugs found via live testing (not caught by mocks alone)

Three genuinely distinct real bugs surfaced only by dispatching against
the actually-installed `herdr`+`agy` binaries, each independently
confirmed and fixed:

1. **Invocation threading gap (pre-existing, also affects tsk-5jl's
   `liveOutput`).** `executeExecutorCli`/`spawnWorker` (`cli.mjs`)
   destructured only `{command, args, env, adapter, provider}` from
   `resolveExecutorCommand`'s return and passed only `{command, args,
   env}` to the adapter — `interactiveMode` (and the pre-existing
   `liveOutput`) never reached `herdrSpawnAdapter` through the real
   production dispatch path, only through a test calling the adapter
   directly. Confirmed live: the dispatched worker silently fell through
   to the OLD (non-interactive script) path and hung until the JS
   timeout. Fixed both call sites.
2. **Missing terminal `agent_status` value.** Live polling found herdr
   reports at least two distinct "finished" states — `"idle"` (a longer
   response) and `"done"` (a short single-line response) — confirmed
   both are stable end states, not one transitioning to the other. The
   original code checked only `"idle"`, leaving short responses hanging.
3. **Exit/echo race condition.** Typing the `exitCommand` and the
   completion-sentinel echo back-to-back (no gap) sent the echo text to
   `agy` itself before it had actually torn down (confirmed live: `agy`
   takes on the order of ~1s to print its own conversation-resume hint
   and exit) — the echo was swallowed as chat input and the sentinel
   never printed, until the adapter's own timeout fired. Fixed by polling
   (bounded, best-effort) until the pane's own reported foreground agent
   is gone before sending the echo.

## Accepted scope decision (not a defect)

`stdout` for `interactiveMode` dispatches is BEST-EFFORT ONLY, confirmed
via a fourth live finding: `agy`'s own full-screen redraw on `/exit`
means herdr's `recent-unwrapped` scrollback capture does not reliably
retain conversation content from before that screen clear (confirmed via
a real captured `wait-output` response containing only the post-exit
shell prompt and echo, with the actual response text already gone from
the "recent" window) — a genuine structural difference from the headless
(`-p`) path's plain, never-cleared transcript, not a stripping-logic bug.
Presented to the person live; decision: accept best-effort stdout, keep
the two guarantees this path actually promises (real exit code, pane
auto-close) as the bar, per the item's own test assertion (`res.status
=== 0` only, not a stdout-content check for this specific live test).
