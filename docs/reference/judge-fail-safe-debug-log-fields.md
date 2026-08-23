# judge fail-safe debug log

`judgeDiscovery` (`src/intake/discovery.mjs`) and `judgeDecompose`
(`src/intake/plan.mjs`) both call the shared retry core in
`src/intake/judge-executor.mjs`. Both are designed to never throw: any
failure folds into a generic fail-safe verdict (`{clear: false, question:
DEFAULT_UNCLEAR_QUESTION}` for discovery; the analogous unclear/invalid
shape for decompose). That fold-in used to be total — the real cause was
discarded with nothing recorded anywhere. A debug-only logging channel
now captures which distinct fail-safe branch fired and why, without
changing the verdict any caller receives.

## Log location

`.fgos/logs/<id>-judge-fail.log`

> Mirrors the existing sole-writer convention in
> `src/runner/worker-log.mjs` (git-ignored, append-only, `resolveLogsDir`,
> never throws) rather than `docs/history/<docsRef>/` (the scout-notes.md
> pattern). Evidence: `tsk-sq9`, the exact repro case, carries no
> `docsRef` — a docsRef-gated log would never have fired for the case
> this item exists to debug. A new narrow writer function was added
> (mirroring `appendWorkerLog`'s shape: one file per item id,
> append-only, best-effort, never throws) rather than reusing
> `worker-log.mjs`'s existing `<workId>.log` file — a judge-fail debug
> trace is a different concern from worker dispatch stdout/stderr, and
> reusing the exact same filename risks colliding with a real worker
> dispatch log for the same id.

## Scope

Both `judgeDiscovery` and `judgeDecompose` — both share the identical
fail-safe code path in `judge-executor.mjs`
(`runRetryingExecutor`/`runBoundedAttempts`), so fixing only one caller
would leave the other exactly as blind as before for the same underlying
branches.

## Fail-safe branches (distinct, not merged)

| Branch | Where | Trigger | Captured detail |
|--------|-------|---------|------------------|
| A — outer `catch{}` | discovery.mjs:455-457 / decompose.mjs's analogous catch | a synchronous exception anywhere in the judge function's try body (e.g. `modelForTier` throwing on an unresolvable tier) | error message + stack |
| B1 — non-parse exit | `judge-executor.mjs` `runBoundedAttempts` | `result.error` (spawn failure/timeout) or `result.status !== 0` on any single attempt → returns `null` immediately, no retry | exit status/signal/spawn error/stderr |
| B2 — parse-exhausted | same | all `MAX_JUDGE_ATTEMPTS` (3) attempts return stdout that fails `parseVerdict` (prose/refusal, not a JSON object) → `null` after 3 tries | each attempt's raw stdout, truncated |
| B3 — shape-invalid | discovery/decompose-level shape check | an attempt parses to a plain object, but the shape check fails (for discovery: `typeof verdict.clear !== 'boolean'`) — distinct from B1/B2 because a real parsed object existed | the parsed object, stringified |

The `escalateTier` path in `runRetryingExecutor` exists but neither
`judgeDiscovery` nor `judgeDecompose` ever sets it — not reachable
through either caller, out of scope for this log.

## Required log entry content (per branch)

Each log entry names which branch fired plus that branch's own detail:

- `reason: outer-exception` (A)
- `reason: non-parse-exit` (B1)
- `reason: parse-exhausted` (B2)
- `reason: shape-invalid` (B3)

> A generic undifferentiated dump would not satisfy the task's own
> requirement to distinguish "model genuinely stuck" from "bug/timeout/
> parse-fail repeating."

## Non-goals

- No change to the verdict shape any caller (session `discover`/
  `decompose` verb, runner sweep) receives — the fail-safe contract for
  normal callers is unchanged.
- No hard cap on research tool calls — out of scope here.
- Escalation-path (`escalateTier`) logging — unreachable from either
  caller today.

## Confirmed live repro

`fgos discover tsk-sq9` (2026-08-02, 15:16:59 → 15:20:29, ~3.5min, under
the 900000ms `timeoutMs`) returned the generic unclear fallback with no
`researchToolCallCount`/`impactScore` — a fail-safe branch fired, not a
real model judgement. `tsk-sq9`'s own record carries no `docsRef`.

Full decision record: `docs/history/judge-fail-safe-debug-log/CONTEXT.md`.

## Related fix (`tsk-wo5`): a graceful signal before the caller's own timeout kills the process

The fail-safe branches above cover what gets logged once a judge call
*finishes* (successfully or via a fail-safe fold). `tsk-wo5` addressed a
different, earlier failure mode in the same shared layer: `spawnAttempt`
(`judge-executor.mjs`) calls the nested `claude -p` judge subprocess via
`spawnSync` — fully blocking, zero output reaches the invoking CLI
process until that subprocess exits. Reproduced twice on `tsk-j7y`:
`fgos discover tsk-j7y --verdict clear --verify ...` was killed at 120s
by an external caller's own wall-clock budget (an interactive session's
default Bash tool timeout), then a retry of the *exact same call*
succeeded in under 4 minutes with no code/state change in between — the
underlying judgment logic was correct and eventually fast, but the CLI
gave the external caller zero signal that it was still doing real work.

This exposure wasn't limited to a full `judgeDiscovery` call: even the
caller-supplied-verdict path (`fgos discover --verdict clear --verify
...`, which skips `judgeDiscovery` entirely) still calls
`judgeVerifySemanticCorrectness` whenever `verify` is non-empty — the
exact call the `tsk-j7y` repro hit.

**Fix scope**: all three callers (`judgeDiscovery`,
`judgeVerifySemanticCorrectness`, `judgeDecompose`) share this same
`runJudgeExecutor`/`spawnAttempt` layer already, so the fix landed once
at the shared layer rather than patched per caller — the same "fix the
shared primitive, not each call site" shape the fail-safe logging above
already followed.

**What "fixed" means here, deliberately**: the acceptance criterion is
graceful degradation, not eliminating the underlying latency. The CLI
must never silently block past a bounded window without emitting *some*
signal back to the caller — root-causing why the nested `claude -p`/
model-provider connection is sometimes slow to respond was explicitly
ruled out of scope, since that latency plausibly lives outside this
repo's own control. `src/runner/dispatch.mjs`'s `runWorkerProcess`
already had an async `spawn` + `onChunk` teeing pattern solving the same
"caller needs to see it's still alive" problem for worker processes —
cited as existing precedent for planning to evaluate, not a mandated
exact shape.

Verified against a deterministically-slowed *fake* judge executor (a
`cfg.executor.command` pointed at a script that sleeps before
responding, extending the same fake-executor pattern
`judge-executor.test.mjs` already used) — not an attempt to force the
real intermittent cold-start latency to reproduce on demand, since that
latency is inherently non-deterministic.
