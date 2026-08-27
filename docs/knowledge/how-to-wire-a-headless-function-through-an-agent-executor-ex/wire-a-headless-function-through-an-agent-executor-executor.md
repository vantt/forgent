---
type: how-to
title: How to wire a headless function through an agent-executor executor
tags: []
timestamp: 2026-08-01T16:16:00.000Z
source_capture_ids: [tsk-2yp]
framework: diataxis
mode: how-to
---

# How to wire a headless function through an agent-executor executor

Use this when a plain function — not a prose skill, not `spawnWorker`'s own
cli-dispatch — already spawns a subprocess directly (e.g. via
`spawnSync`/`resolveExecutorCommand`) with a hardcoded `tier`, and you want
to give it an *optional* path to resolve through `executors.<id>` instead
(`.fgos/config.json`'s `runner.executors.<id>` > `executor` precedence,
`tsk-62v`; the intermediate `executors.<tier>` rung was retired at
tsk-in1-2 D6), while keeping today's behavior byte-identical when nothing
is configured.

This is distinct from
`docs/how-to/wire-a-skills-classify-step-through-an-agent-executor-executor.md`,
which covers a **task-dispatch** consumer (an in-session skill that shells
out via Bash to a resolve CLI). A headless function already imports and calls
`resolveExecutorCommand` (or a wrapper over it) directly — no CLI
resolve step, no skill-side branching.

## Real example (tsk-2yp)

`src/intake/judge-executor.mjs`'s `runJudgeExecutor` — called by
`judgeDiscovery`/`judgeDecompose` on every `fgos discover`/`fgos plan`
call — always called `resolveExecutorCommand(cfg, { prompt, model, tier:
'judge' })` with no `executorId`. Fix was pure signature threading, no new
mechanism:

- `spawnAttempt(cfg, model, prompt, tier, scoutCapture, executorId, fgosDir)`
  passes `executorId`/`fgosDir` straight into
  `resolveExecutorCommand(cfg, { prompt, model, tier, executorId, fgosDir })`.
- `runBoundedAttempts`/`runRetryingExecutor` thread the same two params
  through unchanged, to every attempt (base and escalation alike) —
  identical shape to how `scoutCapture` was already threaded.
- `runJudgeExecutor(cfg, model, prompt, stricterPrompt, scout, executorId,
  fgosDir)` gained two new trailing params.
- The two actual callers each pass their own hardcoded id:
  `judgeDiscovery` → `'judge-discovery'`, `judgeDecompose` →
  `'judge-decompose'`.

## Steps

1. **Find every function in the call chain between the public entry point
   and the actual `resolveExecutorCommand`/`spawnSync` call.** Thread
   `executorId` (and `fgosDir`, if the caller has a `.fgos/` dir in scope —
   see step 2) as new **trailing, optional** parameters through every one
   of them — never insert them in the middle of an existing positional
   list, since that breaks every existing caller silently. Every
   pre-existing call site that omits the new trailing params keeps
   resolving through the global `executor` exactly as before —
   `resolveExecutorConfig`'s own `executorId && cfg.executors?.[executorId]`
   guard is `undefined`-safe by construction.

2. **Pass `fgosDir` too when the caller already has the `.fgos/` dir in
   scope** — costs nothing extra to thread through. Note this no longer
   buys an automatic presence check: `resolveExecutorConfig` retired its
   own `executors.<executorId>` presence/staleness gate at `tsk-5tm-1` D1
   (predating tsk-in1-1's own `fgos tool register`→config-declared
   retirement) — a caller wanting that check now asks for it explicitly
   with `fgos tool query --status present` at its own call site (see
   `docs/reference/forgentx-tool-registry-configuration.md`). In tsk-2yp,
   both `resolveDiscovery(dir, id, cfg, role)` and
   `resolveDecompose(dir, id, cfg, role)` already had `dir` (the exact
   `.fgos/` path — the same value they pass to `listWork(dir)`) in scope at
   their own `judgeDiscovery`/`judgeDecompose` call sites, so this was a
   one-line addition, not new plumbing.

3. **Hardcode the executor id at the call site, not as a caller-supplied
   parameter**, when the function has a small, fixed set of real callers —
   mirrors `submit-assist-classify`'s own precedent. `judgeDiscovery` always
   passes `'judge-discovery'`; `judgeDecompose` always passes
   `'judge-decompose'`. Neither exposes the id as something a further-out
   caller chooses.

4. **Do not add `executors` entries to `.fgos/config.json` as part of
   this change**, unless an operator is actually ready to route to a real
   alternate backend right now. Every field involved
   (`executors.<executorId>`) is optional — omitting it entirely falls
   through to the global `executor`, so the wiring itself ships with zero
   behavior change. `tsk-2yp` shipped no config changes at all.

5. **Test the precedence and propagation directly against the function**,
   not against a skill's prose (unlike the task-dispatch how-to, a headless
   function's runtime behavior IS unit-testable normally). Real shape,
   `test/intake/judge-executor.test.mjs`:
   - a `cfg.executors.<id>` entry with its own `command`/`args` resolves
     ahead of the global `cfg.executor`;
   - a `executorId` with no matching `executors` entry falls through to
     the global `cfg.executor` unchanged;
   - a `kind: "cli"` executor with `fgosDir` given but not registered in
     the tool registry throws `RunnerConfigError`, propagating uncaught
     out of the function (fail-loud at this layer — a caller further out,
     e.g. `judgeDiscovery`, wraps its own call in `try/catch` for its own
     fail-safe reasons, unrelated to this mechanism);
   - the same `kind: "cli"` executor with `fgosDir` omitted resolves
     without the presence check, byte-identical to a plain `command`
     executor.

## Verification note (real, tsk-2yp)

Full suite (`npm test`) before this change: 2108 pass. After: 2112 pass, 0
fail — the 4 new tests above, no regressions. This item's own `fgos return`
verify (`npm test`, run for real against the actual working tree) also came
back green on the first attempt (`attempts: 1`, `errorClass: null`).

## Related

- `docs/explanation/agent-executor-executor-aware-dispatch.md` — why the
  executor mechanism exists and what each cluster item proved.
- `docs/how-to/wire-a-skills-classify-step-through-an-agent-executor-executor.md`
  — the task-dispatch (skill) counterpart to this how-to.
- `docs/history/agent-executor-judge-capacity-dispatch/CONTEXT.md` — the
  locked decisions (executor ids, `fgosDir` scope, no-config-change
  default) this item followed.
