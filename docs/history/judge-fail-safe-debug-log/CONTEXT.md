# judge fail-safe debug log (tsk-5d2)

## Feature boundary

`judgeDiscovery` (src/intake/discovery.mjs) and `judgeDecompose`
(src/intake/plan.mjs) both call the shared retry core in
src/intake/judge-executor.mjs. Both are designed to never throw: any
failure folds into a generic fail-safe verdict (`{clear: false, question:
DEFAULT_UNCLEAR_QUESTION}` for discovery; the analogous unclear/invalid
shape for decompose). Today that fold-in is total — the real cause (an
exception, a non-zero/timeout exit, exhausted parse retries, or a
parsed-but-wrong-shape verdict) is discarded, with nothing recorded
anywhere. This item adds a debug-only logging channel that captures which
distinct fail-safe branch fired and why, without changing the verdict any
caller receives.

Confirmed live repro: `fgos discover tsk-sq9` (2026-08-02, 15:16:59 →
15:20:29, ~3.5min, under the 900000ms timeoutMs) returned the generic
unclear fallback with no `researchToolCallCount`/`impactScore` — a
fail-safe branch fired, not a real model judgement. `tsk-sq9`'s own record
carries no `docsRef`.

## Fail-safe branches (distinct, not merged)

- **A — outer `catch{}`** (discovery.mjs:455-457 / decompose.mjs's
  analogous catch): a synchronous exception anywhere in the judge
  function's try body (e.g. `modelForTier` throwing on an unresolvable
  tier). Message/stack currently discarded entirely.
- **B1 — non-parse exit** (judge-executor.mjs `runBoundedAttempts`):
  `result.error` (spawn failure/timeout) or `result.status !== 0` on any
  single attempt → returns `null` immediately, no retry. stderr/exit
  code/signal are computed by `spawnSync` but never read.
  `result.error` (spawn failure) or `result.status !== 0` on any attempt.
- **B2 — parse-exhausted**: all `MAX_JUDGE_ATTEMPTS` (3) attempts return
  stdout that fails `parseVerdict` (prose/refusal, not a JSON object) →
  `null` after 3 tries. Each attempt's raw stdout is discarded.
- **B3 — shape-invalid**: an attempt parses to a plain object, but the
  discovery/decompose-level shape check on that object fails (for
  discovery: `typeof verdict.clear !== 'boolean'`) — distinct from B1/B2
  because a real parsed object existed; discovery.mjs's `!verdict || ...`
  check currently treats it identically to B1/B2's `null`.

(The `escalateTier` path in `runRetryingExecutor` exists but neither
`judgeDiscovery` nor `judgeDecompose` ever sets it today — not reachable
through either caller, out of scope.)

## Locked decisions

- **D1 — log location: `.fgos/logs/<id>-judge-fail.log`.** Mirrors the
  existing sole-writer convention in src/runner/worker-log.mjs
  (git-ignored, append-only, `resolveLogsDir`, never throws) rather than
  `docs/history/<docsRef>/` (the scout-notes.md pattern named as an
  example in the original task text). Evidence: `tsk-sq9`, the exact repro
  case, carries no `docsRef` — a docsRef-gated log would never have fired
  for the case this item exists to debug. `.fgos/logs/` needs no docsRef
  and is already the canonical operational-log location (per this repo's
  own `.fgos/logs` convention). A new narrow writer function is added
  (mirroring `appendWorkerLog`'s shape: one file per item id, append-only,
  best-effort, never throws) rather than reusing `worker-log.mjs`'s
  existing `<workId>.log` file — a judge-fail debug trace is a different
  concern from worker dispatch stdout/stderr (same "narrow sibling facade
  per concern" reasoning the D3 SIBLING FACADE comment in store.mjs
  already established), and reusing the exact same filename risks
  colliding with a real worker dispatch log for the same id.
- **D2 — scope: both `judgeDiscovery` and `judgeDecompose`.** Both share
  the identical fail-safe code path in judge-executor.mjs
  (`runRetryingExecutor`/`runBoundedAttempts`) — fixing only one caller
  would leave `judgeDecompose` exactly as blind as today for the same
  underlying branches, and there is no behavioral reason to diverge.
- **D3 — per-branch reason tag required.** Each log entry names which
  branch fired (`reason: outer-exception` / `reason: non-parse-exit` /
  `reason: parse-exhausted` / `reason: shape-invalid`) plus that branch's
  own detail (A: error message + stack; B1: exit status/signal/spawn
  error/stderr; B2: each attempt's raw stdout, truncated; B3: the parsed
  object, stringified). A generic undifferentiated dump would not satisfy
  the task's own requirement to distinguish "model genuinely stuck" from
  "bug/timeout/parse-fail repeating."

## Non-goals / deferred

- No change to the verdict shape any caller (session `discover`/`decompose`
  verb, runner sweep) receives — the fail-safe contract for normal callers
  is unchanged.
- No hard cap on research tool calls (discussion point 4 in tsk-4rd,
  already deferred there) — out of scope here.
- Escalation-path (`escalateTier`) logging not needed — unreachable from
  either caller today.
- Whether to eventually also expose `researchToolCallCount`/attempt count
  in the log is left to `fgos-coding-planning`'s own judgment on how much detail
  the implementation adds per branch — not a locked product decision here,
  the reason tag (D3) is the only mandatory content.

## Canonical references

- src/intake/discovery.mjs (`judgeDiscovery`, `resolveDiscovery`)
- src/intake/plan.mjs (`judgeDecompose`)
- src/intake/judge-executor.mjs (`runJudgeExecutor`, `runRetryingExecutor`,
  `runBoundedAttempts`, `spawnAttempt`, `parseVerdict`)
- src/runner/worker-log.mjs (existing `.fgos/logs/` sole-writer pattern,
  `appendWorkerLog`)
- src/state/store.mjs (SIBLING FACADE comment, D3/D4 rationale for a
  narrow facade per concern)

## Impact-analysis capability posture

`fgos tool query --capability impact-analysis --status present` returned
provider `gitnexus` (kind mcp) present — impact-analysis: **full**.
Informational only; this skill does not gate on it.
