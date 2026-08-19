# plan.md — tsk-1dsr: fix allowedTools scope + retest

Mode: **tiny** (0 mode-gate flags — no auth/authorization/data-model/
audit-security/external-provider/public-contract/cross-platform change; a
scoped config-string change plus a matching test assertion, already
proven correct by a real retest before landing). Cites `CONTEXT.md`'s D1.

## Approach

Already executed live, driven by real-time diagnosis rather than
speculative up-front design (the item's own original hypothesis — a
colon-vs-space `--allowedTools` syntax bug — was disproven mid-flight,
per `docs/history/claude-named-executor/RESEARCH.md` Round 4, before any
config change was made):

1. Diagnosed the real cause (Round 4): this machine's personal `rtk`
   `PreToolUse` hook, not a `.fgos/config.json` defect.
2. Per `CONTEXT.md` D1, applied the double-pattern fix directly to
   `.fgos/config.json` as a required main-checkout commit (`daabebfe`,
   ADR0020) — `runner.executors.claude`/`runner.executor`'s
   `--allowedTools` now names both `Bash(git add:*),Bash(git commit:*)`
   and `Bash(rtk git add:*),Bash(rtk git commit:*)`.
3. Updated `test/runner/dispatch.test.mjs`'s "no wider (per spike B)"
   assertion to match, landed directly on main too (`bebfc547`) to
   restore green immediately rather than leaving main red until this
   branch's own approve.
4. Retested live (Round 5) BEFORE step 2 committed: dispatched `claude`
   out-of-process with the double-pattern args (in-memory override, not
   yet on disk) against a fresh throwaway item — real `[DONE]`, real
   commit, footprint honored. Confirmed GREEN before the fix landed, not
   asserted after the fact.
5. Corrected `coding-worker-contract.md`'s Return-channel note (tsk-1jt's
   own RED finding stays as an accurate record of that specific run; a
   follow-up paragraph now names the real root cause and the GREEN
   retest) — mirrored to `plugins/fgOS/skills/_shared/` per the repo's
   own byte-identical mirror requirement.

**Impact-analysis posture:** `full` — GitNexus present (confirmed
repeatedly across this feature's own drive). Not load-bearing: no
function/class/method symbol touched, only a config string and test
assertions.

## Risk map

| Component | Risk | What proves it |
|---|---|---|
| Double-pattern config correctness | Low — proven live BEFORE landing (Round 5's in-memory-override retest), not asserted after | `docs/history/claude-named-executor/RESEARCH.md` Round 5 + real `git log`/`git show --stat` on the retest worktree |
| Test assertion matches the real committed value | Low | `npm test` — `test/runner/dispatch.test.mjs`'s updated spike-B test reads the real committed config |
| No regression elsewhere in the suite | Low | Full `npm test` run, 3653/0 fail, both immediately after the config+test fix landed on main and again after this branch's own merge-reconciliation |

## Files touched (already landed)

- `.fgos/config.json` — direct main commit `daabebfe` (ADR0020, cannot
  ride this branch)
- `test/runner/dispatch.test.mjs` — direct main commit `bebfc547`
  (restoring green immediately)
- `docs/history/claude-named-executor/RESEARCH.md` — Rounds 4-5, this
  branch
- `docs/history/claude-executor-allowedtools-fix/CONTEXT.md` — D1, this
  branch
- `.agents/skills/_shared/coding-worker-contract.md` +
  `plugins/fgOS/skills/_shared/coding-worker-contract.md` — corrected
  finding, this branch

## No split

One honest piece — diagnosis, fix, and retest were one continuous,
interdependent action; nothing here could split into independently
workable pieces without losing the "prove before landing" ordering.

## Outstanding questions

None
