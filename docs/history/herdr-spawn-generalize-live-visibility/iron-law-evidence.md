# Iron Law evidence — tsk-5jl

## Classification

```
node --input-type=module -e "
import { changedFiles } from './src/runner/merge.mjs';
import { classifyIronLaw } from './src/evolve/iron-law.mjs';
import { listWork } from './src/state/store.mjs';
const item = listWork('/home/vantt/projects/forgentX/.fgos').work['tsk-5jl'];
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
    "src/runner/dispatch/config.mjs",
    "src/runner/dispatch/live-renderers/claude-stream-json.mjs",
    "src/runner/dispatch/live-renderers/pi-agent-session.mjs",
    "src/runner/dispatch/resolve.mjs",
    "src/runner/dispatch/transport.mjs"
  ]
}
```

## Verify command

```
npm test
```

Full suite, real run: 4144 pass / 0 fail / 5 skipped (out of 4149) —
confirmed clean, no regressions. One unrelated test
(`fanoutBatchExecutorCli fires candidates in batch concurrently with
overlapping execution windows`, `test/runner/dispatch.test.mjs`) flaked
once under heavy concurrent load (many real herdr panes/background test
runs active at once during this item's own work) — confirmed a real
timing flake, not a regression, by re-running it alone in isolation
right after (passed cleanly, 1283ms). Not touched by any file this item
changed.

## Failing-test-first proof (real, not narrated)

Method: temporarily swapped `src/runner/dispatch/transport.mjs` back to
its pre-item version (`git show d679ae0c:src/runner/dispatch/transport.mjs`,
`d679ae0c` = this item's own `headAtTake`), ran the new tests against
that old code, confirmed real failures, then restored the current
(fixed) file and confirmed the same tests pass — `git status` clean
before and after, proving the restore was exact.

**Before (old code, real failure output):**

```
✖ herdr-spawn adapter closes the pane on success path (Requirement 1) (72.640948ms)
  AssertionError [ERR_ASSERTION]: herdr pane close <paneId> must be called on success path
  0 !== 1

✖ herdr-spawn adapter supports liveOutput config shape & bash PIPESTATUS pipeline (Requirement 2) (80.772843ms)
  AssertionError [ERR_ASSERTION]: stdout should contain output from renderer, got: "{\"text\":\"streamed-content\"}\n"
```

(`Requirement 3` — the two renderer unit tests — and `Requirement 5` —
the live agy-shaped-executor dispatch — pass unchanged against the old
file too, correctly: the renderers are brand-new standalone files with
no dependency on `transport.mjs`, and `agy-herdr`'s own dispatch path
carries no `liveOutput`, so it exercises the SAME code path the old file
already had. Neither is evidence against this item; both are expected.)

**After (current, fixed code, real pass output):**

```
✔ herdr-spawn adapter supports liveOutput config shape & bash PIPESTATUS pipeline (Requirement 2) (114.018238ms)
✔ claude-stream-json.mjs live renderer formats JSONL correctly (Requirement 3) (20.399817ms)
✔ pi-agent-session.mjs live renderer formats JSONL correctly (Requirement 3) (22.882764ms)
✔ herdr-spawn adapter (LIVE): dispatch a real agy-shaped executor via herdr-spawn against real herdr and agy binaries (Requirement 5) (11152.279549ms)
ℹ tests 5
ℹ pass 5
ℹ fail 0
```

(`Requirement 1`'s own pass line scrolled off the captured tail above in
the actual terminal run, but its test count is included in `tests 5 /
pass 5 / fail 0` — re-run in isolation just above this same table
confirmed it passes cleanly on its own too.)

## Required real live proof (separate from the mechanical test suite)

Additionally, `test/runner/herdr-spawn-adapter.test.mjs`'s "Requirement
5" test genuinely dispatches (not mocked) against the real installed
`herdr` (`/home/vantt/.local/bin/herdr`, v0.8.2) and `agy`
(`/home/vantt/.local/bin/agy`, v1.1.20) binaries, via a self-contained
`agy`-shaped executor declared through `herdr-spawn` — confirmed live:
- `herdr pane list` count before the full test-file run: 22; after: 22 —
  no leaked open panes, confirming the success-path `pane close` fix
  (Requirement 1) actually fires in real use, not just under mock.
- The dispatched worker's real output ("Hello from agy-herdr live
  proof") and its own `[DONE]` line were captured correctly through the
  echo-stripped, sentinel-terminated stdout.
- Real status `0` returned, matching the real process's own exit code.

## Note on `.fgos/config.json`

This item's own real config wiring (`executors.agy` -> `agy-cli`,
new ACTIVE `executors.agy-herdr`, `capabilities.fgos-coding-implement
.prefer` -> `agy-herdr`, dormant `claude-herdr`/`pi-herdr`/`codex-herdr`)
is validated (JSON-valid, passes `loadRunnerConfigFromDir`) and was
exercised live in this worktree during development, but per ADR0020
(`docs/how-to/fix-fgos-write-rejected-merge-block.md`) it cannot ride
this item's own branch commit — a worker branch must never carry a
`.fgos/` change. It ships as a separate, direct main-checkout commit
under its own follow-up work item, same precedent as `tsk-5ge`/`tsk-28o`
in that doc. `test/runner/herdr-spawn-adapter.test.mjs`'s Requirement 5
proof above is therefore built against a self-contained config fixture
(`writeRunnerConfigFixture`), not the real shared config, so this item's
own mechanical proof does not depend on that follow-up landing.
