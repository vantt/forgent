# REVIEW-FINDINGS — tsk-1qn (review of tsk-5tm's shipped dispatch unification)

Reviewed the code that actually shipped in `mergedSha
e774207b20729a197c55b4aa51532ca77502790f` (tsk-5tm parent + its 6 children,
per `RESEARCH.md` round 1's file list) against every one of `CONTEXT.md`'s
D1-D12. **Result: no bug found.** Every decision checked below matches the
shipped code exactly; no fix was made.

## Per-decision verification

| D-ID | Decision | Verified against | Result |
|---|---|---|---|
| D1 | retire `needs` from `capacities.<id>` | `src/runner/dispatch.mjs:579` comment confirms retirement; `.fgos/config.json`'s 3 capacity entries (`judge-discovery`, `judge-decompose`, `agy`) carry no `needs` key | matches |
| D2 | name it "executor", registry uses `invocations[]` | `.fgos/config.json`'s `agy` capacity carries `"invocations": [{"via":"cli","adapter":"cli-spawn",...}]` | matches |
| D4 | generalize dispatch around "task"; `fgos-fanout` consults the decision protocol | `.agents/skills/fgos-fanout/SKILL.md` calls `node src/runner/dispatch.mjs decide --work <id> --has-live-task-access` per candidate before firing an Agent, with an explicit fallback when `agentType` is absent from the result | matches |
| D5 | `dispatch.mjs` self-executes for the adapter-resolvable case, hands back only for native/in-process | `executeCapacityCli` (`dispatch.mjs:1478`) + the `execute` CLI subcommand (`dispatch.mjs:~1671`): `mechanism === 'in-process'` hands back `{mechanism,agentType,prompt}`, every other case self-executes via `EXECUTOR_ADAPTERS[adapter]` and returns the real result | matches |
| D6 | remove capacity `gather` | zero matches for `'gather'`/`"gather"` in `dispatch.mjs` or `.fgos/config.json` | matches |
| D9 | provider-keyed `modelPolicies`, 5-tier vocab, `rigorOverrides` | `modelForTier` (`dispatch.mjs:758`) resolves `cfg.modelPolicies[providerModel][policyTier]`, `policyTier = rigorOverrides[tier] ?? DEFAULT_TIER_TO_POLICY[tier]`; `.fgos/config.json`'s `modelPolicies.claude` carries all 5 tiers (lightweight/standard/creative/analytical/critical), `agy` capacity carries `rigorOverrides` | matches |
| D11 | registry keeps top-level key `capacities` (not renamed to `executors`) | `.fgos/config.json`'s `runner.capacities` — literal key unchanged | matches |
| D7 | defer the dispatch contract out of `AGENTS.md` until `execute`/`--work` ship | `grep` for `dispatch.mjs`/`execute <capacityId>`/`decide --work` across `AGENTS.md`: zero matches — still deferred, correctly | matches (deferral honored) |
| D12 | shared prose helper documents the 3 sub-parts as one fragment | `.agents/skills/_shared/capacity-dispatch-fallback.md` Step B documents `execute`'s self-execute/hand-back contract; the `--work`/`decide` direction is documented in `fgos-fanout/SKILL.md` directly (D12(iii), per `plan.md`'s own D9/D5/D4 footprint note) | matches |
| D2/D3/D8/D10 | naming/vocab/no-fix decisions (executor vs backend terminology, for/needs axes, ad-hoc task rename, judge collision harmless) | lower-risk, prose/naming only — spot-read, consistent with `CONTEXT.md` | matches |

## Regression floor

`npm test` (`node --test 'test/**/*.test.mjs'`): **3338 tests, 3333 pass, 0
fail, 5 skipped** — confirmed twice this session (once in `RESEARCH.md`
round 1, once again after this review pass with no code changes in between).

## Conclusion

tsk-5tm's own pre-merge friction (two blocked merge attempts, `verify-miss`/
integration-drift, per `fgos show tsk-5tm --json`'s `friction.recent`) was
already resolved before the final merge landed — the fix-up commits
(`6f7e43f0`, `d40935a8`, `399f3bda`, `6e37e720`) are already part of
`mergedSha e774207b`. No further code change is needed. This item returns
with a documentation-only diff (this review's own findings + the plan/
research trail) and a green `npm test`.
