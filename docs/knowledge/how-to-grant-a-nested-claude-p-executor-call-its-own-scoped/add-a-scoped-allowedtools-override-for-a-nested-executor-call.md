---
type: how-to
title: How to grant a nested `claude -p` executor call its own scoped `allowedTools`
tags: [runner, judge-executor, allowedTools, security]
timestamp: 2026-07-31T00:00:00.000Z
source_capture_ids: [tsk-62d]
framework: diataxis
mode: how-to
---
# How to grant a nested `claude -p` executor call its own scoped `allowedTools`

> **Superseded (tsk-in1-2 D6):** this recipe's whole mechanism —
> `cfg.executors.<role>`, a synthetic-role lookup ahead of the global
> `cfg.executor` — is retired (0 live entries left; `runner.executors.judge`
> had itself already migrated to `runner.executors.judge` before this,
> per `tsk-5ge`, and was later removed outright as dead, per `tsk-4w4`).
> `cfg.executors` is now an unvalidated, unread field — steps 1/3/4's own
> code/config/test excerpts below no longer do anything if followed
> verbatim. The modern equivalent for scoping `allowedTools` to one call
> site: give that call site its own `executors.<executorId>` entry with
> an explicit `command`/`args` (the same executor-block shape), and pass
> that id as `resolveExecutorCommand`'s `executorId` — see `docs/how-to/
> wire-a-headless-function-through-an-agent-executor-executor.md`. Kept
> below as the historical record of `tsk-62d`'s own reasoning (step 5's
> "what almost went wrong" lesson — read the resolver's real signature and
> callers before adding a parallel dimension — still holds regardless of
> which mechanism is live).

`tsk-62d` needed `judgeDiscovery`/`judgeDecompose` (`src/intake/discovery.mjs`,
`src/intake/plan.mjs`) to run one extra tool (`rg`, for a bounded scout
pass) that the shared worker `allowedTools`
(`Bash(git add:*),Bash(git commit:*)`, `dispatch.mjs`'s
`DEFAULT_RUNNER_CONFIG`) never grants. Both call sites resolve their spawn
args through the same `resolveExecutorCommand` (`dispatch.mjs`) the real
worker (`spawnWorker`) uses — widening the shared `allowedTools` string
would have widened it for the worker too. Use this recipe instead of adding
a new config dimension.

## 1. Check whether the generic per-tier override already covers you

`resolveExecutorConfig(cfg, tier)` (`dispatch.mjs`) already resolves
`cfg.executors[tier]` ahead of `cfg.executor` — and it never validates that
`tier` is a real tier name (`light`/`standard`/`heavy`). `validateRunnerConfigShape`
validates every key of `cfg.executors` generically too. That means any
string works as a lookup key, including one that names a CALL SITE instead
of a tier:

> ```js
> function resolveExecutorConfig(cfg, tier) {
>   const perTier = cfg && cfg.executors && typeof cfg.executors === 'object' ? cfg.executors[tier] : undefined;
>   const executor = perTier ?? (cfg && cfg.executor);
>   ...
> }
> ```
> — `src/runner/dispatch.mjs`

Before adding a new parameter/dimension to `resolveExecutorCommand` for
your own use case, check whether your call site already omits `tier`
entirely (most non-worker call sites do) — if so, you can reuse this exact
mechanism for free.

## 2. Pass a synthetic role string as `tier`

```js
// src/intake/judge-executor.mjs
const { command, args } = resolveExecutorCommand(cfg, { prompt, model, tier: 'judge' });
```

No change to `dispatch.mjs` is needed. A config with no `cfg.executors.judge`
block falls back to `cfg.executor`, byte-identical to before your change —
this fallback is what makes the change safe to ship without every operator
config needing to opt in.

## 3. Add the override block to `.fgos/config.json`'s `runner` section

```json
"executors": {
  "judge": {
    "command": "claude",
    "args": ["-p", "{prompt}", "--model", "{model}", "--permission-mode", "acceptEdits",
      "--allowedTools", "Bash(rg:*),Bash(git add:*),Bash(git commit:*)"]
  }
}
```

Add only the tool(s) your call site actually needs on top of the base set —
this is a security boundary (RUL6, `docs/specs/runner.md`), not a
convenience flag.

## 4. Verify

```
npm test test/intake/judge-executor.test.mjs
```

Cover both directions explicitly — the override winning, and the
absent-safe fallback — rather than trusting the generic mechanism by
inspection alone:

> ```
> ✔ runJudgeExecutor resolves through cfg.executors.judge when present, ahead of the base cfg.executor
> ✔ runJudgeExecutor falls back to the base cfg.executor when cfg.executors.judge is absent
> ```
> — `test/intake/judge-executor.test.mjs`

## What almost went wrong

The original plan for this item proposed adding a whole new `role`
parameter to `resolveExecutorCommand`/`resolveExecutorConfig`, parallel to
`tier` — caught at `fgos-coding-validating`'s "smaller path" reality-gate check by
actually reading `resolveExecutorConfig` and `judge-executor.mjs`'s existing
call (`resolveExecutorCommand(cfg, { prompt, model })`, no `tier` passed at
all): the generic lookup already did everything the new parameter was for.
Read the resolver's real signature and its real callers before adding a
parallel dimension to it — a "new capability" is sometimes just an unused
extension point that already exists.

Real capture from closing this item:

> ```json
> "actual":{"outcome":"awaiting-approval","passed":true,"attempts":1,"errorClass":null,"aheadCount":4}
> ```
> — real `work.outcome` capture, id `tsk-62d`

## Related

- `docs/history/tsk-62d-judge-scout-capability/CONTEXT.md` — locked
  decisions (D1-D5): why a Skill artifact was rejected for the scout
  capability itself, and why the config-based override (not hard-coded
  args) was chosen.
- `docs/history/tsk-62d-judge-scout-capability/plan.md` — the "smaller
  path" revision this recipe is drawn from, plus the full risk map.
- `docs/specs/runner.md` RUL6 — the minimal-`allowedTools` security stance
  this recipe's step 3 is bound by.
