# judge fail-safe debug log

`judgeDiscovery` (`src/intake/discovery.mjs`) and `judgeDecompose`
(`src/intake/decompose.mjs`) both call the shared retry core in
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
