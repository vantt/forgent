---
id: dispatch-decide-door
kind: procedure
owner: core
scope: repo
mode: append
specificity: 10
title: Dispatch Decide Door
description: Run fgos dispatch decide before every dispatch out of the current turn, never choose the mechanism yourself, and act on each of the three results
lifecycle: live
valid_from: 2026-11-26
related:
  - "[[run-door-contract]]"
  - "[[capability-routing-rules]]"
---

# Dispatch Decide Door

For routing checks, `fgos dispatch decide` computes the execution mechanism and executor via `bind()` (`src/runner/execution/bind.mjs`).

**Before dispatching any task out of the current turn — a work item, a registered executor, an ad-hoc task, or your own direct Agent/Task-tool call — run `fgos dispatch decide` first. Never decide the mechanism yourself.** A `PreToolUse` hook enforces this on Agent/Task-tool calls: it delegates to `bind()` and refuses the call when the answer comes back as anything other than `in-process`.

For your own Agent/Task call, the hook is that decide; an explicit `decide --needs-soul` beforehand is allowed, never required: it runs `decide --for <subagent type> --needs-soul --has-live-task-access` for every call, and an unregistered name answers `in-process` under `--needs-soul`. A fan-out of Task calls therefore needs no further decide round trip and no purpose check of its own.

Decide once per dispatch, immediately before execution, never during planning. A batch entry that re-confirms the mechanism inside the same dispatch is that dispatch's own bind check, not a second decide.

Four ways to call `decide`, for four different situations:

- `decide <executorId>` — you already know the exact executor name (e.g. `judge-discovery`).
- `decide --for <purpose>` — you know what JOB you need done (e.g. `judge`), but not which executor serves it.
- `decide --work <id> [--stage <stage>]` — you have a real work item and want it dispatched.
- `decide --for <label> --needs-soul` — you are about to fire an Agent/Task tool yourself, with no executor or work item to name.

Add `--has-live-task-access` when you already have the Agent/Task tool in your own tool manifest. This is always your own self-declaration — never probed from the environment, never guessed.

Three possible `mechanism` results, each needing a different response:

- **`"unavailable"`** — nothing serves this. NOT an error: do it inline yourself, and report nothing.
- **`"in-process"`** — call it yourself, with your own live capability: pass the returned agentType to your Agent/Task tool, or call the returned mcpTool directly. Dispatch cannot do this for you — it has neither an Agent/Task tool nor an MCP client of its own. When neither field is returned, use whichever agent type you would have used by default.
- **`"out-of-process"`** — run `fgos run "<prompt>" --provider <executorId> --capability <purpose> [--writes <paths> --worktree <linked-worktree>]` (or `fgos run --unit <file>`), passing the same capability `decide` was asked for (the run door's defaults: `run-door-contract`). `--provider` takes agent executors only: when the decided executor is a `kind: "tool"` executor, `fgos run` refuses it, so call that tool directly instead. Never run the resolved command yourself through Bash: `fgos run` binds, runs and settles the Unit and records its provenance under `.fgos/assignments/<unitRunId>/`, so there is nothing to log by hand. With `--json` read the result at `data.results[-1].runResult.agentClaim.summary` and `data.results[-1].commit`.

Every result also carries `configured: true|false`, additive `reasonCodes: [...]`, and optional `blockedReason` (e.g. when blocked by governance policy) — `false` means nothing is configured for that name or job, and the answer came from the default.

A skill that dispatches should not re-derive any of this: it calls the doors above and in `run-door-contract`. `../_shared/executor-dispatch-fallback.md` (canonical source `core/skills/_shared/executor-dispatch-fallback.md`) is named only for its pattern. `.agents/skills/` and `plugins/fgOS/skills/` are generated render surfaces carrying source headers, rebuilt with `npm run build:skills`; never edit them by hand. For fgOS thin wrappers, `.claude/skills` contains generated wrappers only; it has no `_shared` directory of its own.
