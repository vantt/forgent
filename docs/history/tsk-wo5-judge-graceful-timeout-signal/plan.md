Mode: standard

Lane decided per `fgos-routing`'s Mode-gate (direct-entry fallback — no
prior Orient handoff this session). Flags counted: **existing covered
behavior** (yes — `judge-executor.mjs` is shared by 3 callers with
dedicated existing test suites, `test/intake/judge-executor.test.mjs` +
`test/intake/judge-verify-second-pass-stability.test.mjs`), **weak proof
around the area** (yes — impact-analysis gate below reads `degraded`). 2
flags → **standard**. No hard-gate flag applies (no auth/data-loss/
audit-security/external-provider-addition/validation-removal) → not
high-risk. Not a single yes/no spike question.

## Impact-analysis posture

`fgos tool query --capability impact-analysis --status present`: GitNexus
registered, `status: present`, but this session's own hook flagged the
index stale (last indexed `251d0b5`). Per `CLAUDE.md`'s gate: **degraded**
— every check below still runs, but blast-radius evidence on
`judge-executor.mjs`'s real callers is not confirmed fresh; cross-checked
manually instead (see Approach — grep confirms exactly 3 callers of
`runJudgeExecutor`/`judgeVerifySemanticCorrectness`, matching CONTEXT.md's
scout).

## Approach

**Chosen path**: give the `judge` tier its own bounded per-attempt timeout,
distinct from and shorter than the global `cfg.timeoutMs` (900000ms
default, dispatch.mjs:236) that `spawnAttempt` currently uses unconditionally
(judge-executor.mjs:194, `timeout: cfg?.timeoutMs`). When a judge attempt
would otherwise run past that bound (the intermittent cold-start case this
item reports), `spawnSync`'s own `timeout` option already kills it cleanly
and `runBoundedAttempts` already treats that as an immediate non-retry
failure (judge-executor.mjs:267: `result.error || result.status !== 0` →
`return null`, no retry) — which every caller already turns into an
existing, defined fail-safe outcome (`judgeVerifySemanticCorrectness`
folds `null`/wrong-shape into `{agrees: false, reason:
DEFAULT_VERIFY_DISAGREE_REASON}`; `judgeDiscovery`/`judgeDecompose` fold a
`null` verdict into their own existing unclear/invalid fail-safe paths).
**This means the graceful-degradation mechanism (D3) already exists in
this codebase — the only missing piece is a bound short enough that it
fires before a typical external caller's own wall-clock budget does**,
instead of the current unconditional 900000ms, which is far longer than
any interactive caller would ever wait.

Rejected alternative: convert `spawnAttempt` from `spawnSync` to the async
`spawn` + `onChunk` heartbeat pattern `dispatch.mjs`'s `runWorkerProcess`
already uses (see CONTEXT.md's canonical references). Rejected because (a)
the CLI's own stdout contract for `fgos discover`/`fgos plan` is a
single JSON envelope (`{"contract":"fgos.v1", ..., "data": {...}}`) that
callers parse whole — any heartbeat line on stdout would break that
contract; heartbeat-on-stderr-only would not actually help the reported
symptom, since an external wall-clock Bash-tool-style timeout (the kind
this item's own repro hit) is a flat deadline, not reset by stream
activity; and (b) it is materially more code (new streaming/parsing path)
for no behavior D3 actually asked for — D3 only requires a bound, not a
heartbeat.

**Files touched**:
- `src/intake/judge-executor.mjs` — `spawnAttempt` resolves a judge-specific
  timeout instead of the bare global `cfg?.timeoutMs`.
- `test/intake/judge-executor.test.mjs` — new test (D4's pinned name).

**Order**: (1) add the bounded-timeout resolution + fallback default in
`judge-executor.mjs`, (2) add the D4 test proving a slow fake executor gets
cut off within the new bound and produces the existing clean fail-safe
outcome rather than hanging to the old 900000ms ceiling. `fgos graph
tsk-wo5 --json` shows this item as an isolated size-1 component — no
cross-item dependency ordering applies.

## Risk map

| Component | Risk | Proof point (for fgos-coding-validating) |
|---|---|---|
| Judge-specific timeout default value | Medium — too short risks false-negatives on a genuinely-slow-but-real judge call (turns a slow success into a spurious disagree/unclear); too long doesn't fix the reported symptom | `fgos-coding-validating` should confirm the chosen default sits comfortably below common external caller budgets (the item's own repro cites a ~120s caller ceiling) while staying above the item's own cited real-world latencies (repro: succeeded "in under 4 minutes" on manual retry — so a bound near that number would still fail the original caller; the fix's job per D3 is a clean fast signal, not guaranteeing the slow case fits under 120s) |
| Backward compatibility of `cfg.timeoutMs`-only configs | Low — every existing runner config already sets the required global `cfg.timeoutMs` (dispatch.mjs:574 validation); adding a judge-specific override with a sane built-in default changes nothing for a config that doesn't set it | none needed beyond existing `judge-executor.test.mjs` coverage staying green |
| Shared-layer blast radius (D2: all 3 callers) | Medium (impact-analysis degraded) | `fgos-coding-validating` should grep-confirm (not just trust GitNexus's stale index) that `judgeDiscovery`, `judgeDecompose`, and `judgeVerifySemanticCorrectness` are the only 3 callers of `runJudgeExecutor`, so the fix's blast radius claim is grounded in a fresh check, not the stale graph |

## Concrete cases to prove against

- Fast/normal judge response (well under the bound) — behavior unchanged from today.
- Judge response exactly at the bound — no flaky off-by-one hang.
- Judge response past the bound (the reported symptom) — attempt is killed by fgos's own timeout, not an external caller; the existing null/fail-safe path fires; no retry loop extends the wait further (per `runBoundedAttempts`' existing "non-parse failure never retries" rule — MAX_JUDGE_ATTEMPTS's retry-on-parse-failure branch does not apply to a timeout kill).
- A config that never sets a judge-specific timeout — falls back to a sane built-in default, not to the unbounded global `cfg.timeoutMs`.

## Assumptions

- Root-latency cause (why the nested `claude -p` process is sometimes slow to connect) stays genuinely uninvestigated here, per CONTEXT.md D3 — not re-litigated.
- The exact numeric default for the judge-specific bound is an implementation choice within this plan's remit (not a CONTEXT.md gap) — `fgos-coding-validating` proves it is reasonable, not that a specific number was pre-approved.

## Split decision

No split. One coherent, small code change (a bounded timeout resolution in
one shared function) plus its one pinned test (D4) — splitting a
standard-lane, single-file-plus-test change into separate items would be
pure process overhead with no independent-workability benefit.
