# tsk-in1-5 — Iron Law failing-test-first evidence

`classifyIronLaw` result (scoped to this leaf's own diff vs its target
`fgw/tsk-in1`, not the wider `main` trunk): `required: true`,
`matchedFlags: []`, `matchedModules: ["src/runner/dispatch.mjs"]`.

## Test command

Item's own verify: `npm test -- --grep 'http|adapter'` (Node's `--test`
does not actually support `--grep`, only `--test-name-pattern` — this
runs the full suite unfiltered, over-inclusive rather than a false pass,
same pre-existing imprecision noted on other items in this family).

## Failing-before (real transcript — `src/runner/dispatch.mjs` temporarily
checked out back to the parent commit's version, `test/runner/
dispatch.test.mjs` left at its new content)

```
ℹ tests 230
ℹ pass 222
ℹ fail 8
```

All 8 real failures are this item's own new coverage:

- `INVOCATION_VIA is exactly the CO CHE GOI axis (... "api" restored D13
  tsk-in1-5) — cli/task/mcp/api` — pre-fix `INVOCATION_VIA` was still
  `['cli', 'task', 'mcp']`, no `'api'`.
- `EXECUTOR_ADAPTERS registers exactly two adapters (D13, tsk-in1-5)` —
  pre-fix `EXECUTOR_ADAPTERS` still had only `cli-spawn`; `EXECUTOR_
  ADAPTERS.http` did not exist, so every `EXECUTOR_ADAPTERS.http(...)`
  call in the 5 tests below threw `TypeError: EXECUTOR_ADAPTERS.http is
  not a function`.
- `EXECUTOR_ADAPTERS.http makes a real GET request...`,
  `...sends method/headers/body verbatim...`, `...treats a non-2xx status
  as a normal result...`, `...throws DispatchError("worker-timeout")...`,
  `...throws DispatchError("worker-spawn-fail")...` — all 5 real requests
  against a real local `node:http` test server, all failing pre-fix for
  the same reason above (`httpAdapter` did not exist yet).
- `loadRunnerConfig accepts a "capacities.<id>.invocations[]" entry with
  "via":"api" and a non-empty "url"` — pre-fix `validateInvocationShape`
  rejected `via: "api"` outright (`INVOCATION_VIA` did not include it),
  so `loadRunnerConfig` threw `RunnerConfigError` instead of the expected
  `doesNotThrow`.

## Passing-after (real transcript, `dispatch.mjs` restored to the fix)

`test/runner/dispatch.test.mjs`: `tests 230 / pass 230 / fail 0`.

Full `npm test`: `tests 3372 / pass 3367 / fail 0` (5 skipped,
pre-existing, unrelated), `duration_ms 119651`.

## What changed

- `src/runner/dispatch.mjs`: generalized `EXECUTOR_ADAPTERS`' adapter
  function signature from `(command, args, cwd, opts)` to `(invocation,
  opts)` — `cliSpawnAdapter` now destructures `{command, args}` from
  `invocation` and `{cwd, timeoutMs, maxBuffer, onChunk, workId, tier,
  model}` from `opts` (moved `cwd` from its own positional arg into
  `opts`, since it is dispatch-level execution context, not
  invocation-specific data). Added `httpAdapter(invocation, opts)`,
  reading `method`/`url`/`headers`/`body` — a real `fetch()` call, timeout
  via `AbortController` throwing `DispatchError('worker-timeout', ...)`,
  network failure throwing `DispatchError('worker-spawn-fail', ...)`, a
  non-2xx status returned as a normal result (mirrors `cli-spawn`'s own
  "non-zero exit is not an error" stance, D3). Registered as
  `EXECUTOR_ADAPTERS.http`. `INVOCATION_VIA` regains `'api'` (dropped at
  D8 for 0 historical producers). `validateInvocationShape`'s Gate B1
  adds an `'api'` branch requiring a non-empty `url` (never `command`/
  `args`). Both real call sites (`spawnWorker`, `executeCapacityCli`)
  updated to the new `adapterFn({ command, args }, { cwd, ... })` shape.
  `resolveExecutorConfig`'s Gate B2/B3 (tsk-in1-4) are UNCHANGED — still
  cli-only; this item is a pluggability precedent, not a new production
  dispatch route.
- `test/runner/dispatch.test.mjs`: updated the existing `EXECUTOR_
  ADAPTERS`/`INVOCATION_VIA` assertions to the new values; added 5 real
  `httpAdapter` tests against a real local `node:http` test server (GET,
  POST with method/headers/body echoed back, non-2xx passthrough, timeout,
  network failure), plus 2 `loadRunnerConfig` tests for the new `via:
  "api"` shape (accept with `url`, reject without).
- Docs (AGENTS.md docs-gate, user-visible config-surface change):
  `CHANGELOG.md`, `docs/specs/runner.md` (new RUL66), `docs/reference/
  forgentx-tool-registry-configuration.md` (new "Adapters and
  `invocations[].via: "api"`" section) — updated in place, each noting
  explicitly that this is not yet wired into production dispatch.
