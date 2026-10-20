---
title: "Pool B1: per-tier family fallback, declared account order, lease/state/quarantine per pool"
description: "bind() walks a tier's declared family order and its cell entries; the lease keys accounts, state and quarantine by pool and ranks them in declared order; accounts pin as pool/account; a missing tier cell refuses by name. Config changes are proposed as a diff for the owner."
status: pending
priority: P1
effort: 36h
branch: plan/model-pool-b1-fallback-account-order
tags: [runner, bind, lease, fallback, model-pool, config]
created: 2026-10-19
---

# Pool B1: fallback order per tier, account order, pool-keyed lease

- **Implements:** [problem report](../reports/problem-261017-0022-model-tier-selection-misfit.md) 5.2 (decisions 3, 5, 7, 8), 5.3 (wave B1, wave-0 answers 1, 2, 6, 7) and both "Owner answers" sections (2026-10-19 23:07, 23:20).
- **Board row:** MP-B1 in the [program board](../261017-1313-fgos-platform-program-board/plan.md). Shape copied from the finished [B2 plan](../261019-0019-model-pool-b2-credential-store-confinement/plan.md).
- **Specs:** [runner.md](../../docs/specs/runner.md) RUL80, RUL91, RUL102, RUL103, RUL105. Component boundary: no change (a note goes in the docs phase).
- **Impact analysis:** GitNexus present, index may be stale. The lead runs `node .gitnexus/run.cjs analyze`, then `impact` upstream on the symbols in phase 00, and reports the blast radius. A zero result is cross-checked with `rg`.

## Owner decisions (settled, not re-opened)

1. Fallback order is declared per tier. A capability may only narrow it, never widen it.
2. Cross-family fallback is ON. Doer tiers (nano, standard, advanced) fall back to the cheap equivalent families: gemini, deepseek, z-ai (GLM), then claude, openai. Flagship and frontier fall back only to premium equivalent families: claude, openai, gemini (argon), xai. A walk never leaves its tier.
3. Account rotation follows the declared order: accounts of the same family first, in declared order, then the next family. This replaces least-lease / least-recently-used as the order.
4. Lease, state and quarantine are per pool; an account is pinned as `pool/account`; a missing tier cell refuses by name.

**Reversal triggers** (recorded in the spec in phase 05, checked in phase 07):
- (3) goes back to least-lease ranking if one account keeps hitting its quota window while others sit idle.
- (2)'s tier groups change when a family's model at a tier stops being equivalent (price or quality).

## What exists today (verified 2026-10-19, main `e25b0b73d`)

| Piece | Where | State |
|---|---|---|
| Cross-family fallback | `nextCandidate` `src/runner/execution/bind.mjs:611`, walks `prefer` after an int index | Already on (not gated by `allowCrossProvider`). Gap: order is per capability, not per tier |
| Account rotation on one candidate | `retrySameCandidate` `bind.mjs:652`; `inspectAccountRotation` `account-rotation.mjs:21` | Keyed by family-derived provider (`capacityProviderOf` `account-pin.mjs:17`) |
| Account order | `rankProviderAccounts` `src/runner/dispatch/provider-capacity.mjs:568` | Sticky, then fewest leases, then oldest `lastSelectedAt`, then hash |
| Lease / state / quarantine key | `provider` = `normalizeProviderFamily(family)` (`assignment-runner.mjs:1608`) | Per family, not per pool |
| Tier cell | `resolveTierCandidates` `src/runner/dispatch/resolve.mjs:141`, MP-A `tier-cell.mjs` | Lists and `model@pool` parse; only the family-named pool runs (`resolveTierModel`) |
| Missing cell | `bind.mjs:453-464` falls back to `executor.model` / `default`; `assignment-policy.mjs` throws | Two behaviours |
| Pool inventory | `readLlmAccounts` (MP-A, report only); lease reads `runner.providers.*.accounts` | Not connected |
| Login store per invocation | `credentialStoreOf` `provider-capacity.mjs:250` (B2) | Done; lease filters by `use` only when the CLI is pinned |

## Design (one door each, no new mechanism beyond the decisions)

- **D1 Candidates are (family, cell entry).** `bind()` expands each family into one candidate per usable cell entry `{executor, invocation, model, pool}`. A pool is usable when one of its `llmAccounts` holds a store matching an invocation's `credentialStore.use` (config-only, so `bind()` stays pure).
- **D2 Primary follows `prefer` order exactly as today** (council seats rely on different leading families; spread logic is untouched). **After a failure the walk continues** with the failed family's remaining cell entries, then the other families in the tier's declared order, limited to families `prefer` names (narrow, never widen). A tier with no declared list walks `prefer` order after the failed candidate, as today.
- **D3 Walk state is the seat's earlier bindings** (`tried`), replacing the int `skipCandidateIndex`; credential faults exclude the faulty pool (`excludePools`), replacing `excludeFamilies` (wave-0 answer 6). Both are derivable from `unit.json`, so the write gate recomputes the same binding. Every caller moves in the same change (L10).
- **D4 One lease door.** `provider` arguments of `provider-capacity.mjs` become the pool's state key (`legacyStateKey(pool)`, already exists, so pool `openai` keeps key `openai-codex`). A cell entry without `@` is the family-named pool, so existing configs keep their keys. Accounts come from `llmAccounts.<pool>` when declared, else from `runner.providers` (transition read, removed by MP-C: every workspace on a release that reads `llmAccounts`, then `runner.providers` deleted from global config).
- **D5 Ranking** = sticky assignment first, then `Object.keys` order of the pool's accounts, skipping quarantined, `disabled` and accounts with no store for the invocation's `use`. Integer-like account ids are refused (JS would reorder them).
- **D6 Pin** `pool/account` replaces the bare id; the pin selects the candidate whose pool matches, otherwise the seat binds unpinned with the reason recorded (as today for another family).
- **D7 Missing cell** refuses `tier-cell-missing` naming `modelPolicies.<family>.<tier>`; the `executor.model` / `default` fallthrough is deleted; `assignment-policy.mjs` raises the same reason. Applies to out-of-process agent seats only.
- **D8 Tier order key** `runner.tierFallback.<tier>: [family, ...]` (family = `modelPolicies` key, so GLM is `z-ai`). Old releases ignore the unknown runner key; the lists go in the project config first.

## Phases and dependencies

| Phase | Content | Needs | h | Files owned |
|---|---|---|---|---|
| [00](phase-00-facts-and-prior-art.md) | Baseline, impact, facts, prior art, collisions | none | 2 | no code |
| [01](phase-01-config-contract-tier-fallback.md) | `tierFallback` shape, validator, helper, doctor check | 00 | 4 | `config.mjs`, `resolve.mjs`, `model-pool-checks.mjs`, `registrations.mjs` (one row) |
| [02](phase-02-pool-lease-and-declared-order.md) | Pool state key, `llmAccounts` source, declared-order ranking, id rule | 00 | 7 | `provider-capacity.mjs`, `llm-accounts.mjs` |
| [03](phase-03-bind-walk-and-pool-candidates.md) | Candidate expansion, `tried`/`excludePools`, missing-cell refusal, pool-based rotation, pin parse, explain | 01, 02 | 8 | `bind.mjs`, `account-rotation.mjs`, `account-pin.mjs`, `explain.mjs`, `dry-bind.mjs` |
| [04](phase-04-runner-callers.md) | Move every caller of the changed contracts | 03, AGENT-WF 07-08 landed | 8 | `run.mjs`, `assignment-runner.mjs`, `assignment-policy.mjs`, `blind-steps-proven-pools.mjs`, CLI/workflow `--account` text |
| [05](phase-05-spec-changelog-doctor-rows.md) | Spec, CHANGELOG, doctor/explain rows | 04 | 3 | `docs/specs/runner.md`, `CHANGELOG.md`, `registrations.mjs` |
| [06](phase-06-config-proposal-for-owner.md) | Config diff for the owner (global and project) | 05, release active | 3 | `.fgos/config.json`, `~/.fgos/config.json` (owner approval first) |
| [07](phase-07-post-activation-proof.md) | Real rounds, board row, reversal-trigger watch | 06 | 1 | board row only |

01 and 02 run in parallel (disjoint files). **03 and 04 land as one unit**: 03 changes the contract, 04 moves its callers, and the tree is only green after both (separate commits, one merge). 04 waits for AGENT-WF 07-08 because it edits `run.mjs` (see Collisions).

## Collisions

- **AGENT-WF 07-08** (running; `run.mjs`, `unit.mjs`, `patterns/reviewed.mjs`, `bin/fgos.mjs`, `case-admission-port`). MP-B1 touches `run.mjs` only in phase 04 (3 spots: `:654`, `:920-923`, `:1014-1029`), never `unit.mjs` or `reviewed.mjs`. Phases 01-03 touch none of AGENT-WF's files and may land first. If 07-08 are still open when 03 is ready, 04 starts on a branch cut after they land.
- `src/setup/registrations.mjs`, `CHANGELOG.md`, `docs/specs/runner.md`: shared board files; small separate commits (phase 01 adds one registry row, phase 05 the rest).
- `provider-capacity.mjs`: phase 02 edits the rank, inventory and selection blocks (`:271`, `:568-660`), not the lock block (`:372-420`) owned by holder-lock P09 (phase 00 re-checks).
- MP-COST (not planned): spend tracking (Q2), per-capability ceilings, in-process lead model. Out of scope; the one touch point is the ceiling question below.

## Test matrix

| Level | What | Where |
|---|---|---|
| Unit | decision 1: tier order drives fallback, `prefer` narrows, absent list = legacy walk | new `test/runner/execution/tier-fallback.test.mjs`, `bind.test.mjs` |
| Unit | decision 2: every tier's chain stays in-tier, families without a cell are skipped and recorded | same + `bind-committed-config.test.mjs` |
| Unit | decision 3: declared order, sticky kept, quarantined/disabled/no-store skipped, integer id refused | `provider-capacity.test.mjs` |
| Unit | decision 4: separate state per pool, fault excludes one pool, legacy key kept, `pool/account` pin, missing cell refusal in both paths | `provider-capacity.test.mjs`, `account-pin.test.mjs`, `bind.test.mjs`, `assignment-dispatch.test.mjs` |
| Integration | seat fails: account a, then b, then next entry, then next family (real lease, temp runtime dir) | `run-provider-failover.test.mjs`, `account-rotation.test.mjs` |
| Integration | write gate recompute equals the original binding after each walk step | `assignment-dispatch.test.mjs` |
| Doctor | `tier-fallback` check, shared rows | `test/setup/model-pool-checks.test.mjs` |
| Real | one confined round per changed path (phase 07) | `npm run fgos:dev -- run ...` |

## Risk (likelihood x impact)

| Phase | Risk | L x I | Mitigation |
|---|---|---|---|
| 02 | Pool key differs from a legacy key, so two releases lease one account | L x M | Family-named pool keeps its legacy key; only a new pool name gets a new key; phase 06 flips pools only after release activation |
| 02 | Declared order piles every parallel seat on account 1 | M x M | Owner chose it; reversal trigger (3); `inspect` shows lease counts |
| 03/04 | Unit records written before the release carry the old walk state | L x M | Unreadable walk state restarts the walk at the primary; test with a recorded old `unit.json` |
| 03/04 | Missing-cell refusal breaks a project whose executor relied on `executor.model` | M x H | Phase 00 counts reliers across all configs on the machine; refusal only for out-of-process agent seats; list goes to the owner before 04 lands |
| 04 | Merge conflict in `run.mjs` with AGENT-WF | M x M | Sequence after 07-08 |
| 06 | A new key in global config read by an older release | L x H | Only `llmAccounts.openrouter` and string model values go global; `tierFallback`, lists and `@` stay in the project config |

## Definition of done

- `npm test` green except the known main failures (3 git-floor 2.34, `fences-v1-tombstone`); rerun with `CLAUDE_CODE_SESSION_ID` unset before calling anything a regression.
- Big lead runs every test importing a touched module: `git grep -l -e provider-capacity.mjs -e dispatch/llm-accounts.mjs -e execution/bind.mjs -e account-rotation.mjs -e account-pin.mjs -e execution/explain.mjs -e execution/run.mjs -e assignment-runner.mjs -e assignment-policy.mjs -e blind-steps-proven-pools.mjs -e dispatch/config.mjs -e dispatch/resolve.mjs -e model-pool-checks.mjs -- test` into an array, check the file count, then the full suite.
- `rg "excludeFamilies|skipCandidateIndex|credentialFaultFamilies" src bin` finds nothing; the only reader of `runner.providers.*.accounts` is the marked transition read in `provider-capacity.mjs`.
- `fgos dispatch explain --for <capability>` prints the walk (entries, pool, accounts in declared order, usable or why not); `fgos doctor` green on the committed config.
- Real rounds at phase 07 `completed-pass`, with the pool and account in provenance.

## Rollback

Each phase is its own commit. 01 and 02 revert alone. 03+04 revert as a pair. Config stays valid on the old code (phase 06 keeps old fields until the release is active; `tierFallback` is ignored by older releases). Phase 06 revert restores the config backup the lead takes first.

## Open questions for the owner

1. **Ceiling `advanced` for code has no mechanism.** What: the config proposal says code runs at ceiling `advanced`; `resolveTierCeiling` (`bind.mjs:126`) only has a global `maxTier` that a capability's own rigor can raise, and no rigor maps to `advanced` (`rigorToTier` is nano/standard/flagship/frontier). Cause: per-capability ceilings are the MP-COST item, not planned. Options: (a) set global `maxTier: advanced`: every capability without its own rigor is capped, councils keep theirs (cost: a cook path at rigor high on `review` or `advise` drops from flagship to advanced); (b) leave ceilings to MP-COST, code runs at the tier its rigor maps to (standard, so deepseek flash, not pro) (cost: owner's "code gets pro" not met); (c) approve a small MP-COST slice: a per-capability default tier (cost: a new field, outside B1). Recommendation: (b) for B1, and approve (c) as its own item; (a) is too broad. Scope: phase 06 only; B1 code does not change.
2. **The one frontier critique seat has no home in runner config.** Capability rigor sets the tier for all seats of a capability. Where a single critique seat gets `frontier` is a workflow-preset question (phase 00 finds the file). Recommendation: set it in the council preset seat list; phase 06 shows that diff separately.
3. **Primary vs fallback order (a choice inside decision 1).** Primary stays in `prefer` order and only the fallback after a failure uses the tier order. Alternative: tier order everywhere, which would make every capability lead with the same family and lose council diversity (architecture critique leads with xai, synthesis with claude). Recommendation: as planned. Scope: B1 design D2.

## Big-lead decisions on the open questions (2026-10-19 23:30)

1. **(b).** Code runs at the tier its rigor maps to, `standard`: gemini flash, deepseek v4.1-flash, GLM, sonnet. That is exactly the owner's list for code ("gemini-flash, deepseek-flash, glm-flash, sonnet"); "deepseek-pro in advanced" placed the pro model in the `advanced` cell, it did not ask code to run on pro. No `maxTier` change; per-capability ceilings stay with MP-COST. Reversal: if the owner wants code on `advanced` cells, that is the MP-COST per-capability default tier item.
2. The frontier critique seat lives in the council preset's seat list (phase 06 shows that diff separately).
3. As planned (D2): primary in `prefer` order, fallback after a failure in the tier's declared order. Reversal: if one family keeps failing first for a capability, narrow its `prefer` rather than reorder primaries globally.
