# plan.md — tsk-4sr

Mode: tiny

## Approach

**Chosen path:** in `src/runner/dispatch/cli.mjs`'s `decideExecutorCli`
(the `--work <id>` door), the call to `resolveExecutorAndOverrides(cfg,
executorId)` at line `:695` recomputes the exact same result the earlier
call at line `:668` already produced (same `cfg`, same `executorId`,
reached only when `:668`'s own block ran and left `executorId` unchanged).
Bind `:668`'s own return value to a local, and reuse it at `:695` instead
of calling the function a second time — a pure, local memoization inside
one `decideExecutorCli` invocation. Honors D1
(`docs/history/tsk-4sr/CONTEXT.md`).

**Alternatives rejected:**
- A per-process/module-level cache over `.fgos/config.json` reads, or over
  `resolveExecutorAndOverrides` results across separate CLI/hook
  invocations — rejected per D1: every invocation path (`decide`/`execute`
  CLI subcommands, the `dispatch-decide-hook.mjs` PreToolUse hook) runs in
  a fresh `node` process, so cross-invocation memory-caching cannot
  survive between calls. This was the item's original proposal; ruled out
  during `exploring`.
- Caching keyed by file mtime on disk — out of scope; D1 confirms no
  config-file caching is being pursued at all, on any layer.

**Risk map:**
| Component | Risk | What proves it |
|---|---|---|
| `decideExecutorCli`'s `--work` door | low — pure memoization, no behavior change (both calls already return identical values for identical inputs) | existing test suite covering `dispatch.mjs`'s `--work` resolution path passes unchanged; a targeted regression assertion (see Verify) confirms `resolveExecutorAndOverrides` is called once, not twice, for a `--work` invocation |

Impact-analysis posture: `full` (GitNexus registered and `present`,
queried fresh this session via `fgos tool query --capability
impact-analysis --status present`) — informational only, no proof point
here leans on blast-radius evidence since the change is a single local
variable binding inside one function, not a cross-module edit.

**Files touched:** `src/runner/dispatch/cli.mjs` only (the `:668`/`:695`
block inside `decideExecutorCli`). No other file needs a change — this is
a single-file, single-function fix.

**Order:** N/A — one file, one change, no sequencing needed. `tsk-4sr`
has no `deps` and does not appear in `fgos graph --json`'s
`criticalPath`/`topUnblock` (confirmed this session) — nothing else in
the backlog is waiting on this item or vice versa.

## Shape

Single pass-through change, no split. In `decideExecutorCli`:

```js
if (!executorId && workIdArg) {
  // ...
  const workResolved = resolveExecutorAndOverrides(cfg, executorId);
  const hasExplicitExecutor = workResolved.configured;
  if (!hasExplicitExecutor) {
    // ... unchanged
  }
}
// ...
const { executor, configured } = executorId === /* the work-resolved id */
  ? workResolved
  : resolveExecutorAndOverrides(cfg, executorId);
```

(Exact variable threading left to Execute — the shape above is the
directive, not a literal patch; the binding must only be reused when the
`:695` call's own `executorId` is provably the same value `:668` already
resolved, never a general "skip the call" shortcut that could silently
reuse a stale result for a different `executorId` on some other door.)

## Outstanding questions

None
