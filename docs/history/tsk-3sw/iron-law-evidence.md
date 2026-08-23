# Iron Law evidence — tsk-3sw

`classifyIronLaw` result (`src/evolve/iron-law.mjs`, computed against this
item's actual changed file set via `changedFiles`/`src/runner/merge.mjs`):

```json
{
  "required": true,
  "matchedFlags": ["auth", "schema"],
  "matchedModules": []
}
```

`required: true` — evidence below.

## Test command (this item's own `verify`)

```
npm test -- test/runner/dispatch.test.mjs && npm test
```

## Failing-test-first proof

The 6 new tests added to `test/runner/dispatch.test.mjs` for this item's
`agentType` capacity resolution were run against the PRE-change
`src/runner/dispatch.mjs` (temporarily reverted via `git stash push -- src/
runner/dispatch.mjs`, then restored via `git stash pop` — never a separate
branch or discarded work) to confirm they genuinely fail without this
item's implementation, not just pass trivially.

**Before (old code, `node --test test/runner/dispatch.test.mjs`):**

```
✖ resolveExecutorCommand resolves a kind:"task" capacity naming only agentType into the global executor's own command, args minus --model, plus --agent <agentType> (0.899027ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
  + actual - expected
    [
      '-p',
      ...
✔ resolveExecutorCommand resolves an agentType capacity identically whether fgosDir is given (cli-dispatch/spawnWorker-style) or omitted (task-dispatch/resolveCapacityCli-style) (0.212029ms)
✔ resolveExecutorCommand still prefers a capacity's own command/args over agentType when both are declared (judge-discovery's real shape) — agentType is never consulted (0.095689ms)
✔ resolveExecutorCommand falls through to executors.<tier>/global (unaffected) for a capacity with neither command/args nor agentType (0.054615ms)
✔ loadRunnerConfig accepts a "capacities.<id>" entry with a non-empty agentType (0.14784ms)
✖ loadRunnerConfig rejects a "capacities.<id>" entry whose agentType is not a non-empty string (0.210215ms)
  AssertionError [ERR_ASSERTION]: Missing expected exception (RunnerConfigError).
```

2 of 6 fail for real reasons: old `byCapacity` gate has no `agentType`
branch at all (falls through silently, producing the wrong args shape),
and old `validateCapacityShape` has no `agentType` field check at all (no
exception thrown for a malformed value). The other 4 pass even on old code
because they assert behavior this item does not change (existing
command/args precedence, existing fallback-with-neither-field shape,
and — for the fgosDir-equality test specifically — old code resolves an
agentType-only capacity the same [wrong] way regardless of `fgosDir`
too, so that particular assertion doesn't discriminate old vs new; it
still stands as real regression coverage going forward).

**After (this item's real code, same test file, same command):**

```
✔ resolveExecutorCommand resolves a kind:"task" capacity naming only agentType into the global executor's own command, args minus --model, plus --agent <agentType> (0.16277ms)
✔ resolveExecutorCommand resolves an agentType capacity identically whether fgosDir is given (cli-dispatch/spawnWorker-style) or omitted (task-dispatch/resolveCapacityCli-style) (0.294146ms)
✔ resolveExecutorCommand still prefers a capacity's own command/args over agentType when both are declared (judge-discovery's real shape) — agentType is never consulted (0.123793ms)
✔ resolveExecutorCommand falls through to executors.<tier>/global (unaffected) for a capacity with neither command/args nor agentType (0.072096ms)
✔ loadRunnerConfig accepts a "capacities.<id>" entry with a non-empty agentType (0.214507ms)
✔ loadRunnerConfig rejects a "capacities.<id>" entry whose agentType is not a non-empty string (0.195875ms)
```

Full suite (`npm test`) after this change: 2371 tests, 2366 pass, 0 fail,
5 skipped — no regression to any pre-existing case (`resolveExecutorConfig`
is a shared hub function per GitNexus's own live impact analysis at
`fgos-coding-validating`, CRITICAL risk by callgraph position; this change is
purely additive/opt-in, confirmed by the full suite staying green).
