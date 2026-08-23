# Research: tsk-4m4 — is the CONTEXT.md premise still current?

## Round 1 — 2026-08-13 (fgos-researching, called from fgos-coding-discovering)

**Asked:** This item is old ("[MUST khi bắt đầu]" note: created a while
ago, codebase has changed since — mandatory rescan before proceeding,
confirm description/verify still match reality, judge relevance or close
as wontfix/superseded). CONTEXT.md (`docs/history/verify-judgment-at-
clarify/CONTEXT.md`, 2026-08-05, cherry-picked from commit `06ee9a8` on
branch `fgw/tsk-5ov`) describes a two-branch inconsistency in
`resolveDiscovery` (`lockedContext` skips a verify judge entirely,
`callerVerdict` falls through to it) and cites 5 measured disputes each
costing "roughly 90 seconds to 4 minutes" of real subprocess model time.
Given a separate, unrelated redesign (`coding-planning-validating-gate-
redesign`) retired the `planApprove` gate since this was written (found
during tsk-14a's own research), does the CORE premise — the judge itself,
its cost, and the inconsistency — still hold today?

**Checked:**
- `src/intake/discovery.mjs` (current `resolveDiscovery`, in full).
- `src/intake/verify-pattern-check.mjs` (current `judgeVerifySemanticCorrectness`,
  in full — the function CONTEXT.md's own citations point at).
- `src/intake/plan.mjs:743-752` (the per-child call site
  CONTEXT.md's own `decompose.mjs:703` citation now resolves to).

**Found:**

1. **The two-branch inconsistency is still structurally present**, just at
   different line numbers than CONTEXT.md cites (the file has grown/moved
   since 2026-08-05): the `lockedContext` branch (`discovery.mjs:300-331`)
   returns early via `moveStage`+`return` at line 330, calling no judge at
   all. The `callerVerdict` branch (`discovery.mjs:280-299`) builds a
   verdict object and does NOT return — it falls through to
   `if (verdict.clear)` at line 392, which calls
   `judgeVerifySemanticCorrectness(verdict.verify)` at line 403 whenever a
   non-empty `verdict.verify` string is present. Confirmed identical shape
   to what CONTEXT.md describes, current line numbers only.

2. **The judge itself is NOT what CONTEXT.md describes it as, and this is
   the load-bearing finding.** `verify-pattern-check.mjs`'s own header
   (lines 1-17) states plainly: this file is "mechanical-only replacement
   for the retired `judgeVerifySemanticCorrectness` LLM second-pass
   (tsk-1x3 D17, `docs/history/fanout-and-delegation-rubric/CONTEXT.md`)".
   The old function ran an LLM-fallback subprocess
   (`runJudgeExecutor`) for any case the mechanical branch didn't already
   catch — **that subprocess branch is retired, every consumer of it is
   gone (tsk-1x3 D9)**. What remains, and what current code actually
   calls under the same exported name, is a single regex check for ONE
   specific documented footgun (`docs/how-to/avoid-vacuous-pass-with-node-
   test-test-name-pattern.md`'s Node `--test` + TAP-reporter grep trap,
   `verify-pattern-check.mjs:19-38`). It returns `{agrees: true}`
   unconditionally for every proposed `verify` that doesn't match that one
   narrow pattern — no subprocess call, no semantic judgment, no
   `title`/`kind`/`risk`/`tier` context read at all.

   This directly contradicts CONTEXT.md's own cost claim ("each dispute is
   a real subprocess model call, observed at roughly 90 seconds to 4
   minutes") and its "structurally near-certain to fail" framing. Both
   were true of the OLD judge (`judge-executor.mjs`'s `runJudgeExecutor`),
   retired by tsk-1x3 for unrelated reasons (native-first dispatch waste,
   not this item's own concern) sometime after CONTEXT.md was written. The
   5-dispute evidence table in CONTEXT.md is real *history* against a judge
   that no longer runs.

3. **`resolvePlan`'s per-child call site still exists** (`plan.mjs:752`,
   `secondPass: judgeVerifySemanticCorrectness(child.verify)`) — same
   function, same conclusion: cheap and narrow, not the expensive
   subprocess CONTEXT.md's "once per child" framing implies.

4. **The "Known adjacent hole" is unaffected by this drift** — confirmed
   independently, on tsk-14a's own branch, that `resolvePlan`'s
   pass-through path (`plan.mjs:543`, ex-`decompose.mjs:542`) still stamps
   `planApproveVerify` (`?? work.verify`) with zero correctness check of
   any kind, mechanical or otherwise. This part of CONTEXT.md's own
   description is still accurate today.

**What this changes for tsk-4m4's own scope:** the ORIGINAL cost/benefit
case for moving verify-judgment out of `clarify`/`discovery` was "a real,
expensive, sometimes-wrong LLM dispute runs on a placeholder that cannot
possibly be a real command yet." That case is now materially weaker: the
actual judge running today is a near-zero-cost, narrow, mechanical
pattern check that agrees with almost everything by construction (it only
disagrees on one specific documented shell-grep footgun). The remaining
real defect is narrower than described: (a) the two-branch
*inconsistency* itself still exists (one path checks a narrow pattern,
the other skips it, for no stated reason) and (b) the "Known adjacent
hole" (zero check on the executing-bound pass-through verify) is fully
real and unaffected by any of this drift.

**Open:** whether the residual, much-smaller defect (b) plus the
inconsistency (a) still justifies this item's own originally-proposed
FIX — a contract-level move of "verify correctness ownership" to
`validateApprove`/`resolvePlan`'s per-child check — or whether the
now-negligible cost of the mechanical check means the smaller, previously
rejected fallback (CONTEXT.md's own closing paragraph: "removing the
second pass from `resolveDiscovery` only... touches no contract") is now
the *more* honest fit, or whether the item should be re-scoped to just
the adjacent hole (b) — which is orthogonal to the cost argument entirely
and the one piece of original scope with no drift. This is a real product
scope judgment (which of three directions, given the premise that
justified the largest one has weakened), not a fact this round can
resolve by reading more code.
