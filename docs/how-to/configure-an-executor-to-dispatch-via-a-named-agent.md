---
type: how-to
title: How to configure a executor to dispatch via a named agent instead of a raw command
tags: []
timestamp: 2026-08-03T09:41:35.301Z
source_capture_ids: [tsk-3sw]
---

# How to configure a executor to dispatch via a named agent instead of a raw command

Use this when you want a `kind:"task"` executor in `.fgos/config.json`'s
`runner.executors` to run as a specific Claude Code agent persona
(`.claude/agents/<name>.md`) — instead of writing out that agent's own
`command`/`args` by hand, or instead of routing the prompt through the
plain global executor.

## Before you start

- This is Claude-only for now (`tsk-3sw` D1) — the executor's resolved
  executor `command` must already be `claude` (the project's own global
  `executor.command`). Multi-provider agent-dispatch (`agy`/Codex each have
  their own, differently-shaped mechanism) is `tsk-53h`'s separate,
  later scope — not available through this field yet.
- This assumes the agent definition you want to name already exists at
  `.claude/agents/<name>.md`, with whatever `model:`/`tools:` frontmatter
  you want that persona to run with.

## Steps

1. **Add `agentType` to the executor entry — no `command`/`args` needed.**
   In `.fgos/config.json`'s `runner.executors.<id>`:

   ```json
   "executors": {
     "my-executor": {
       "kind": "task",
       "agentType": "code-simplifier"
     }
   }
   ```

   `agentType` must be a non-empty string (`validateExecutorEntryShape`
   rejects an empty one with a `RunnerConfigError`, the same way an
   invalid `model`/`allowCrossProvider` value already does).

2. **Know what actually gets resolved.** `resolveExecutorConfig`
   synthesizes a real executor block via `buildAgentTypeExecutor`
   (`src/runner/dispatch.mjs`): it takes the resolved global `executor`'s
   own `command`/`args` template **as-is** — never a hardcoded literal —
   strips the `'--model','{model}'` pair, and appends `'--agent',
   <agentType>`. Given this repo's own default executor
   (`-p {prompt} --model {model} --permission-mode acceptEdits
   --allowedTools "Bash(git add:*),Bash(git commit:*)"`), a executor
   naming `agentType: "code-simplifier"` resolves to:

   ```
   claude -p <prompt> --permission-mode acceptEdits --allowedTools "Bash(git add:*),Bash(git commit:*)" --agent code-simplifier
   ```

   No `--model` flag at all — this is deliberate (D2): the named agent
   definition's own pinned `model:` frontmatter wins, unmodified by
   whatever `tier`/model the dispatching work item carries. If your
   project customized the global executor's own `--allowedTools`/
   `--permission-mode`, that customization carries through unchanged —
   `buildAgentTypeExecutor` reads it from the resolved `cfg.executor`,
   never from a separate default.

3. **A executor naming BOTH `agentType` and its own `command`/`args`
   still resolves to its own `command`/`args`** — `agentType` is only
   consulted when the executor declares neither `command` nor `adapter`
   of its own. This is the same precedence a real, already-committed
   executor (`judge-discovery`, `kind:"task"` with its own explicit
   `command`/`args`) already relies on, unaffected by this field's
   addition.

4. **This works identically whether the executor is dispatched headlessly**
   (`spawnWorker`, the `fgos-runner` loop) **or from an in-session skill**
   (`node src/runner/dispatch.mjs decide <executorId>` to learn the
   mechanism, then `execute <executorId>` to actually run it) — both call
   the same `resolveExecutorConfig`, so an `agentType`-only executor
   resolves the same real command/args either way.

## Why this exists

Before this field, a `kind:"task"` executor with no own `command`/`args`
silently fell through to the plain global executor — `kind:"task"` was
declared vocabulary with zero real differentiation from `kind:"cli"`. This
field is the first real way to say "dispatch this specific executor as
this specific Claude Code agent persona" through config alone, without
hand-writing that persona's own `--agent`/`--allowedTools`/`--model`
argv shape into every executor that wants it.

## Verification note (real, `tsk-3sw`)

Full suite (`npm test`) before this change: 2365 tests. After: 2371 tests,
2366 pass, 0 fail, 5 skipped — 6 new tests, no regressions. This item's own
`fgos return` verify (`npm test -- test/runner/dispatch.test.mjs && npm
test`, run for real against the actual working tree) came back green on
the first attempt (`attempts: 1`, `errorClass: null`). GitNexus's own live
impact analysis on `resolveExecutorConfig` (the shared function this field
extends) reported **CRITICAL** risk by callgraph position (8 impacted
symbols across the headless runner loop, both judge functions, and
`resolveExecutorCli`) — the change stayed purely additive/opt-in
(confirmed: zero existing executor in this repo declared `agentType`
before this item), so the full suite staying green is the real proof the
CRITICAL callgraph position never translated into an actual regression.

## Related

- `docs/explanation/agent-executor-executor-aware-dispatch.md` — why the
  executor mechanism exists as a whole, and this field's place in it.
- `docs/how-to/wire-a-skills-classify-step-through-an-agent-executor-executor.md`
  / `docs/how-to/wire-a-headless-function-through-an-agent-executor-executor.md`
  — the sibling how-tos for wiring a *consumer* (a skill or a function)
  through an existing executor; this doc is about configuring the executor
  itself.
- `docs/history/agent-executor-capacity-kind-task-resolution/CONTEXT.md` /
  `plan.md` (`tsk-3sw`) — the locked decisions (D1 Claude-only scope, D2
  omit `--model`) and the shape this field followed.
- `tsk-53h` — the separate, later item that will generalize `agentType`
  beyond Claude, once a real non-Claude consumer exists.
