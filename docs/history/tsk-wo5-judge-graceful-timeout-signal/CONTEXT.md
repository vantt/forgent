# tsk-wo5: judge subprocess calls intermittently exceed caller's wall-clock budget

## Feature boundary

`fgos discover`/`fgos plan` route through `judgeDiscovery`,
`judgeVerifySemanticCorrectness`, and `judgeDecompose`
(`src/intake/discovery.mjs`, `src/intake/plan.mjs`), all of which share
`runJudgeExecutor` → `runRetryingExecutor` → `spawnAttempt`
(`src/intake/judge-executor.mjs`). `spawnAttempt` calls `spawnSync` —
fully blocking, zero stdout reaches the invoking CLI process until the
nested `claude -p` judge subprocess exits. An external caller with its own
wall-clock budget (e.g. an interactive session's ~120s default Bash tool
timeout) can kill the whole `fgos discover`/`fgos plan` process
mid-attempt, with no signal on either side about what happened.

Confirmed even the caller-supplied-verdict path is exposed: `fgos discover
--verdict clear --verify ...` skips `judgeDiscovery` entirely
(`discovery.mjs`'s `callerVerdict` branch), but still calls
`judgeVerifySemanticCorrectness` (`discovery.mjs:667`) whenever `verify` is
non-empty — this is the exact call the tsk-j7y repro hit.

This item's own bug text disagrees with itself on retry latency: the
general framing claims a retry "succeeds in a few seconds," but the cited
tsk-j7y repro says the retry succeeded "in under 4 minutes." D3 pins which
framing this item designs against.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | `verify` for this item proves behavior against a deterministically-slowed fake judge executor (a `cfg.executor.command` pointed at a Node script that sleeps before responding, same fake-executor pattern `test/intake/judge-executor.test.mjs` already uses), not an attempt to force the real intermittent cold-start latency to reproduce on demand. |
| D2 | Fix scope covers all three callers uniformly by fixing the shared `runJudgeExecutor`/`spawnAttempt` layer in `judge-executor.mjs` — not a single-caller patch. `judgeDiscovery`, `judgeVerifySemanticCorrectness`, and `judgeDecompose` all route through this one layer already, so a shared fix costs no more than a narrow one and leaves no caller with the same latent bug. |
| D3 | Acceptance criteria is graceful-degradation framing: the CLI must never silently block past a bounded window without some signal back to the caller. Root-latency investigation (why the nested `claude -p`/model-provider connection is sometimes slow) is out of this item's gate — that latency plausibly lives outside this repo's control, so it is not required for done. If planning's own investigation turns up a cheap root-cause fix along the way, that is a welcome bonus, not a requirement. |
| D4 | `verify` pins a specific committed test in `test/intake/judge-executor.test.mjs`, name: `"does not block past the caller bounded window without emitting a signal when the judge executor is slow"`. `fgos-coding-planning`/`fgos-coding-implement` must add exactly this test (or this decision gets updated if the name changes). Chosen after verify-dispute round 2 correctly rejected `npm test` as too generic — real command, `--test-name-pattern` targeted, only meaningful once the test exists (matches 0 tests / vacuous-pass today, by design until implemented). |

## Pinned terms

- **"silently block"** — the failure mode this item targets: the CLI process produces zero observable output/signal for a stretch that can exceed a typical external caller's own timeout budget, while still doing real work underneath.
- **"graceful degradation"** (D3) — the CLI surfaces *some* signal (not necessarily a fix to the underlying latency) before/instead of going silent past a bounded window; contrasted with root-latency elimination, which is out of scope here.

## Scout evidence

- `src/intake/judge-executor.mjs:189-206` (`spawnAttempt`) — `spawnSync`, `timeout: cfg?.timeoutMs` (dispatch.mjs default 900000ms), no chunked/streaming output.
- `src/runner/dispatch.mjs:895` (`runWorkerProcess`, unrelated worker-process path) — already has an async `spawn` + `onChunk` teeing pattern for exactly this "caller needs to see it's alive" problem; judge-executor.mjs has no equivalent today.
- `src/intake/discovery.mjs:520-604` — caller-supplied verdict (`--verdict clear`) skips `judgeDiscovery` but not `judgeVerifySemanticCorrectness` when `verify` is set (`discovery.mjs:667`) — confirms the tsk-j7y repro's exact code path.
- `src/intake/judge-executor.mjs:31` — `MAX_JUDGE_ATTEMPTS = 3`, no backoff between attempts, each bounded independently by `cfg.timeoutMs`.
- `test/intake/judge-executor.test.mjs:206`, `test/intake/judge-verify-second-pass-stability.test.mjs:49` — existing tests already fake `cfg.executor.command` as a Node script; a sleep-then-respond variant is a direct extension of an established pattern (supports D1).
- Impact-analysis gate (`fgos tool query --capability impact-analysis --status present`): GitNexus registered, `status: present`, but this session's own hook flagged the index stale (last indexed `251d0b5`) — **degraded**, not full. Blast radius on `judge-executor.mjs`'s real callers is not confirmed fresh; planning should re-check or cross-grep before relying on it.

## Canonical references

- `src/intake/judge-executor.mjs` — shared judge spawn/parse/retry layer (fix target, D2).
- `src/intake/discovery.mjs`, `src/intake/plan.mjs` — the three judge call sites.
- `src/runner/dispatch.mjs` (`runWorkerProcess`, `onChunk` teeing) — existing precedent for non-silent long-running subprocess output, for planning to evaluate as a possible shape (not mandated by this doc — implementation choice belongs to planning).
- `test/intake/judge-executor.test.mjs`, `test/intake/judge-verify-second-pass-stability.test.mjs` — fake-executor test pattern D1's verify approach extends.

## Deferred / out of scope

- Root-causing the nested `claude -p`/model-provider cold-start latency itself (D3) — not required for done; welcome if planning finds it cheap.
- Any judge caller beyond the three named (`judgeDiscovery`, `judgeVerifySemanticCorrectness`, `judgeDecompose`) — none others exist today per scout.
