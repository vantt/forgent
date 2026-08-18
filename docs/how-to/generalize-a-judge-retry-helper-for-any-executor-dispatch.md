---
type: how-to
title: How to extract a judge-only retry helper into a executor-agnostic one
tags: [judge-executor, retry, executor-dispatch, runner, escalation]
timestamp: 2026-08-01T10:10:37.000Z
source_capture_ids: [tsk-418-1, tsk-418-2, tsk-418]
---

# How to extract a judge-only retry helper into a executor-agnostic one

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
   node --test test/intake/judge-executor.test.mjs test/intake/discovery.test.mjs test/intake/plan.test.mjs
   ```

   112/112 passed here with no test edits, confirming the extraction really
   was behavior-preserving rather than just plausible-looking.

## Why this shape, not a bigger rewrite

A executor-aware dispatch schema (`cfg.executors.<id>`) was already being
generalized elsewhere in the same runner (`src/runner/dispatch.mjs`,
`resolveExecutorConfig`'s tier/executors/executors precedence). It would
have been tempting to wire the new generic retry helper straight into that
executors schema in the same pass. That was deliberately deferred to a
separate, dependent piece of work instead: the executors schema wasn't yet
merged into this branch when the extraction happened, and bundling a
schema-dependent feature (an opt-in escalation-to-fallback step) with a
zero-risk parameter-threading refactor would have gated the safe change
behind the riskier one for no reason. Extract the generic shape first,
prove it costs nothing; add the new capability that depends on external
schema state as its own following step.

## Adding an opt-in escalation-to-fallback-tier step on top

Once `runRetryingExecutor` exists (above), a executor can opt into falling
back to a different executor when its own attempts are exhausted — without
touching any external config schema at all, since the fallback is just
another parameter passed at the call site.

1. **Let the base-attempt loop stay a single black box that returns
   `null`.** The base loop already collapses two different failure origins
   — exhausting parse-shaped retries, and an immediate spawn-error/non-zero-
   exit/timeout that never got to retry at all — into the same bare `null`.
   That collapse is what makes escalation trivial to bolt on: a wrapper that
   only checks "did the base attempts return null" automatically covers
   both origins, with no failure-type field to thread through first.

2. **Add `escalateTier`/`escalateModel` as optional keys on the same
   options object the base call already takes**, never a new function
   parameter position — existing callers that never pass them see no
   behavior change:

   ```js
   export function runRetryingExecutor(
     cfg, model, prompt, stricterPrompt,
     { tier, maxAttempts, escalateTier, escalateModel },
   ) {
     const verdict = runBoundedAttempts(cfg, model, prompt, stricterPrompt, tier, maxAttempts);
     if (verdict !== null) return verdict;
     if (!escalateTier) return null;

     const result = spawnAttempt(cfg, escalateModel ?? model, stricterPrompt, escalateTier);
     if (result.error || result.status !== 0) return null;
     const escalated = parseVerdict(result.stdout);
     return escalated.parsed ? escalated.verdict : null;
   }
   ```

3. **Make the escalation attempt single-shot, not its own retry loop.** One
   attempt against the fallback tier, using the already-stricter prompt
   (the base attempts already established this call needs a clean-JSON
   push) — not a second bounded-attempts loop. If the fallback also fails,
   the whole call returns `null`, exactly like today.

4. **Prove it with a non-judge executor, as a test double — no real second
   consumer required.** Reusability is provable without wiring in a second
   production call site: write a test that calls `runRetryingExecutor`
   directly (not through `runJudgeExecutor`) with its own made-up tier and
   `escalateTier`, using fake executor scripts exactly like the existing
   judge tests do. This is enough to demonstrate the helper is genuinely
   executor-agnostic; wiring a real second executor (e.g. a submit-time
   classification step) in for production is separate, later work with its
   own scope and its own config.

5. **Re-run the existing suite unchanged, plus the new escalation tests.**
   `runJudgeExecutor` never passes `escalateTier`, so every pre-existing
   judge test stays green with zero edits — that is itself part of the
   proof that escalation is additive, not a behavior change to the
   judge-only path.

## Closing out the decomposed root item

Both pieces above were built as separate work items (`tsk-418-1`,
`tsk-418-2`) under one parent (`tsk-418`), sharing the parent's own
`fgw/tsk-418` branch. Once both children were `done`, the root itself still
needed its own claim → verify → return → compound-learn → approve cycle
(it does not close itself automatically just because its children
finished) — real capture: `aheadCount: 58` at return time, `passed: true`,
confirming the branch had genuinely advanced since the root's own claim.
Along the way, the root's return also had to absorb two unrelated pieces of
concurrent main-branch churn before it could pass: a real merge conflict in
`judge-executor.mjs` itself against `tsk-g18`'s independent scout-notes
persistence work (reconciled by threading both features' new parameters —
`tier`/`escalateTier` from this feature, `scoutCapture` from tsk-g18's —
through the same `spawnAttempt`/`runBoundedAttempts` call chain rather than
picking one side), and a separate pre-existing bug in `fgos return`'s own
disposable verify worktree (missing `node_modules`, already tracked and
fixed by another concurrent session as `tsk-2vd`) that had nothing to do
with this feature's own diff.
