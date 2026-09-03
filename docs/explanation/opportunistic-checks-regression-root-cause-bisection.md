---
authoritative_for: tsk-oet opportunistic checks 7-test regression, git-worktree bisection technique, wrong root-cause attribution corrected from tsk-6al to tsk-1ji, FGOS_DISABLE_OPPORTUNISTIC_CHECKS fix
---

# The real regression root cause — found by bisection, not by the item's own initial report

`tsk-oet` is the item that actually fixed the 7-test `npm test`
regression [`tsk-5k1` later verified as already resolved](opportunistic-checks-test-regression-fgos-oet.md).
Its own value beyond the fix itself: the item's **own submitted
description misattributed the root cause**, and discovery-stage research
found and proved the real one before any code was written.

## The wrong initial attribution

The item was submitted with title/description blaming commit `88619f23`
(`tsk-6al`, "skip redundant verify in fgos return when worker already
verified sha") for the regression.

## How the correct root cause was found — real git-worktree bisection

Discovery research did not trust the submitted attribution — it tested
it directly:

1. Reproduced all 7 failures against current `main`.
2. Read `88619f23`'s actual diff: it only wraps existing verify logic in
   an `if (isWorkerVerified) {...} else { <unchanged original code> }`
   branch, gated on a `--worker-verified-sha` flag none of the 4 failing
   test files pass — meaning their code path through that commit is
   byte-identical to before it.
3. **Bisected empirically**: created a real detached worktree at
   `88619f23` itself (`git worktree add --detach <tmp> 88619f23`),
   installed dependencies, ran the same 4 test files there — **all 171
   tests passed, 0 failures.** This directly falsified the submitted
   attribution: commit `88619f23` alone does not cause the regression.
4. Walked forward one commit to `5439eaa2` ("feat(state): add
   opportunistic truncation guard and periodic commit for
   events.jsonl (tsk-1ji)") and repeated the same worktree-bisection —
   **5 of 7 failures reproduced there** (the other 2 were just a test-
   file naming drift, not a real discrepancy).

## The actual mechanism

[`tsk-1ji`'s own `runOpportunisticMainCheckoutChecks`](events-jsonl-opportunistic-truncation-check.md)
carried two unconditional side effects on *whatever `repoRoot` it was
handed* — including a self-contained test fixture repo, with **no guard
distinguishing the real fgOS main checkout from any other repo it's
pointed at**:

- **D1** — writes/advances a new tracked file
  (`.fgos/events-jsonl.truncation-guard.json`) whenever the truncation
  check reports ok, appearing as an unexpected dirty path in every test
  asserting "only `.fgos/events.jsonl` is dirty."
- **D2** — if `.fgos/events.jsonl` is dirty and its last real commit is
  ≥900s old (or never committed — the common case for a freshly-
  initialized test fixture), runs a **real `git add` + `git commit`**
  directly against `repoRoot`, actually advancing `HEAD` — caught by
  every SHA-comparison assertion (`gitHead(cwd) === mainHeadBefore`) in
  the failing tests.

`tsk-1ji`'s own verify scope (`claim-port.test.mjs` + `merge.test.mjs`
only) never covered the 4 files this broke — how the regression landed
on `main` unnoticed. The item's own declared `deps: ["tsk-6al"]` did not
correspond to the real cause and was not a real blocker.

## The fix

An env-var opt-out gate: `runOpportunisticMainCheckoutChecks` now returns
immediately when `process.env.FGOS_DISABLE_OPPORTUNISTIC_CHECKS ===
'1'`, without touching or reverting the function's default (on)
behavior — `tsk-1ji`'s periodic-checkpoint feature stays exactly as
locked. `package.json`'s own `"test"` script was prefixed with
`FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1`, opting out every test file by
default. The two test files that exist specifically to exercise the real
feature (`events-jsonl-truncation-guard.test.mjs`,
`claim-port.test.mjs`'s own dedicated test) locally unset the var so they
keep proving the real feature still fires.
