---
type: how-to
title: How to extract a judge-only retry helper into a capacity-agnostic one
tags: [judge-executor, retry, capacity-dispatch, runner]
timestamp: 2026-08-01T10:10:37.000Z
source_capture_ids: [tsk-418-1]
---

# How to extract a judge-only retry helper into a capacity-agnostic one

`src/intake/judge-executor.mjs`'s `runJudgeExecutor` grew a bounded-retry
shape — a stricter-instruction suffix on retry, JSON-parse-or-retry — for
the intake judge calls (`judgeDiscovery`/`judgeDecompose`). The retry loop
itself had nothing judge-specific about it; only one line hardcoded it to
judge calls: `spawnAttempt`'s inner call to `resolveExecutorCommand` always
passed `tier: 'judge'`. That single hardcoded tier was the entire blast
radius blocking reuse by any other dispatch call site.

## Recipe

1. **Find the one hardcoded coupling point.** Read the retry loop and its
   spawn helper end to end. Usually only one call site actually pins the
   generic loop to its first caller — here, `spawnAttempt(cfg, model,
   prompt)` called `resolveExecutorCommand(cfg, { prompt, model, tier:
   'judge' })` with `'judge'` baked in, even though the loop above it
   (bounded attempts, stricter-prompt-on-retry, parse-or-retry) never
   referenced anything judge-specific.

2. **Thread the coupling point through as a parameter.** Give
   `spawnAttempt` a `tier` parameter instead of the literal, and give the
   retry loop itself `tier`/`maxAttempts` parameters instead of the
   module-level constant it read directly:

   ```js
   function spawnAttempt(cfg, model, prompt, tier) {
     const { command, args } = resolveExecutorCommand(cfg, { prompt, model, tier });
     // ...
   }

   export function runRetryingExecutor(cfg, model, prompt, stricterPrompt, { tier, maxAttempts }) {
     for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
       const result = spawnAttempt(cfg, model, attempt === 1 ? prompt : stricterPrompt, tier);
       // ... unchanged parse-or-retry body
     }
     return null;
   }
   ```

3. **Keep the original name as a thin wrapper, not a rewrite.** The
   original exported function keeps its exact name and signature, so its
   existing callers need zero changes — it just calls the new generic
   function with the values it always implicitly used:

   ```js
   export function runJudgeExecutor(cfg, model, prompt, stricterPrompt) {
     return runRetryingExecutor(cfg, model, prompt, stricterPrompt, {
       tier: 'judge',
       maxAttempts: MAX_JUDGE_ATTEMPTS,
     });
   }
   ```

4. **Prove zero behavior change with the existing test suite, not a new
   one.** A pure parameter-threading extraction like this has nothing new
   to test yet — the proof is that every existing caller's test still
   passes unchanged. Run the full suite touching the extracted function and
   its callers before treating the extraction as done:

   ```
   node --test test/intake/judge-executor.test.mjs test/intake/discovery.test.mjs test/intake/decompose.test.mjs
   ```

   112/112 passed here with no test edits, confirming the extraction really
   was behavior-preserving rather than just plausible-looking.

## Why this shape, not a bigger rewrite

A capacity-aware dispatch schema (`cfg.capacities.<id>`) was already being
generalized elsewhere in the same runner (`src/runner/dispatch.mjs`,
`resolveExecutorConfig`'s tier/executors/capacities precedence). It would
have been tempting to wire the new generic retry helper straight into that
capacities schema in the same pass. That was deliberately deferred to a
separate, dependent piece of work instead: the capacities schema wasn't yet
merged into this branch when the extraction happened, and bundling a
schema-dependent feature (an opt-in escalation-to-fallback step) with a
zero-risk parameter-threading refactor would have gated the safe change
behind the riskier one for no reason. Extract the generic shape first,
prove it costs nothing; add the new capability that depends on external
schema state as its own following step.
