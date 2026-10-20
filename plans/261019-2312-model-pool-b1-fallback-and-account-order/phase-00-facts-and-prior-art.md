# Phase 00: facts, prior art, baseline (no code)

**Status: done (2026-10-19).** Findings: [phase lead report](../reports/phase-lead-261019-2323-model-pool-b1-p00-p02.md), section "Phase 00 facts".

## Context

- [plan.md](plan.md) design D1-D8; [problem report](../reports/problem-261017-0022-model-tier-selection-misfit.md) 5.2, 5.3.
- Report path: `fgos convention path --json` (never hand-built); the lead's brief carries it.

## Prior art (answered, re-verified by `git log -S`, 2026-10-19)

| Question | Answer |
|---|---|
| Did a per-tier fallback order or a declared account order exist? | No. `git log -S` on `tierFallback` and `fallbackOrder` finds nothing. Least-lease then least-recently-used is the order since `ec6a0745d` (rotator slice 1), hardened in `e37f8225d`. |
| Where did seat failover come from? | `1de852877` (fail a seat over to another account of its provider, then another provider), documented in `13e723e94`. `excludeFamilies` and `nextCandidate` date from there. |
| Is cross-family fallback gated by `allowCrossProvider`? | No: that flag is egress permission only (report 5.1). Decision 2 needs no switch, only a declared order. |
| Reused from MP-A / B2 | `tier-cell.mjs` parser, `readLlmAccounts`, `legacyStateKey`, `explain`, doctor `model-pool-*` checks; `credentialStoreOf` and `providerCapacityForInvocation` (`provider-capacity.mjs:250,264`). |
| Missing | Pool-keyed lease, walk over cell entries, tier order, pool-based fault exclusion, `pool/account` pin, one missing-cell rule. |
| MP-COST overlap | Out of scope: spend signal (Q2), per-capability ceilings, in-process lead model. Only touch point is open question 1 in the plan. |

## Facts to settle (each answer goes in the phase report with `file:line`)

1. **Landing state.** Are AGENT-WF 07-08 on main (`git log main -- src/runner/execution/run.mjs`)? Has holder-lock P09 rewritten the lock block of `provider-capacity.mjs` (`:372-420`)? Sets the order of phase 04.
2. **Second walker.** Is `attemptProviderCapacityFallback` (`assignment-runner.mjs:1013`, walks `compiledPlan.policy.executorPreference`) reachable from `runUnit` / `fgos run`, or only from the legacy dispatch path? Reachable: phase 04 moves it onto the `tried` walk. Not reachable: note it, leave it.
3. **Who relies on the missing-cell fallthrough** (`bind.mjs:453-464`, `executor.model` or `default`): list every family x tier with no cell, across `.fgos/config.json`, `~/.fgos/config.json`, and the project configs of mdview and mcp-skill-hub, plus tests. Output: a table the owner sees before phase 04 lands.
4. **Source kind and files for a derived account.** Consumers of `source.kind` and `source.files`: `provider-account-probe.mjs:38-41`, `provider-credential-probe.mjs:59-75`, `provider-credential-renewal.mjs:499-500,1077`, `herdr-round.mjs:283-289`, `drivers/bwrap.mjs:68-77`, `registrations.mjs:4484`. Prove the derivation rule of phase 02 (`use: codex` is `codex-home`; any other `use` is `home-files` with the `files` its invocations declare) gives each of them what they read today for the pool `openrouter` (pi).
5. **Config merge level.** When project `modelPolicies.<family>` exists, does it replace the global family or merge per tier? (Decides how phase 06 writes cells.)
6. **Old-release safety.** Run the previous activated release's config loader on a config carrying `runner.tierFallback`; it must load. Also confirm the lists and `@` forms load there (MP-A shipped them).
7. **`--account` callers**: enumerate every reader and writer of the account pin (`resolveAccountPin` `account-pin.mjs:31`, `bind.mjs:414`, `bin/fgos.mjs` run and workflow start, `src/workflow/runner.mjs`, `command-registry.mjs`, skills and docs text). Count and list.
8. **Old unit records.** Which `unit.json` fields carry the old walk state (`candidateIndex`, `skipCandidateIndex`; `run.mjs:920-923`). Decide the read rule: unreadable state restarts the walk at the primary.
9. **Council seats.** Where does a single critique seat get its own tier (workflow preset seat list, `core/workflows`, the architecture panel skill)? Feeds open question 2.
10. **Integer-like keys.** `rg` the three configs for digit-only account ids (expected none).

## Steps

1. Baseline: run the test files named in the plan's Definition of done as an array (check the count), then record the known failures with `CLAUDE_CODE_SESSION_ID` unset.
2. GitNexus: `analyze`, then `impact` upstream on `bind`, `nextCandidate`, `retrySameCandidate`, `rankProviderAccounts`, `acquireProviderAccountLease`, `quarantineProviderAccount`, `credentialFaultFamilies`, `inspectAccountRotation`, `resolveAccountPin`, `resolveTierModel`, `resolveTierCandidates`. Report callers and risk; HIGH or CRITICAL goes to the lead before phase 03.
3. Answer facts 1-10; write the phase report.

## Output and gate

A report with the answers and the reliers table. Phase 01 and 02 start when facts 1, 4, 5, 6 are answered. Phase 04 starts only after the owner has seen the table from fact 3.

## Risk / rollback

Read-only; nothing to roll back. Risk: GitNexus index stale (cross-check with `rg`).
