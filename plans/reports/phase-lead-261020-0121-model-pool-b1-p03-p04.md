# Phase lead report: MP-B1 phases 03 and 04

Branch `worktree-agent-a05c85e599c1aefbc`, cut from main `0e0c0f101` (phases 00-02 and AGENT-WF 07-10 on main). Plan: [plan.md](../261019-2312-model-pool-b1-fallback-and-account-order/plan.md); phase files [03](../261019-2312-model-pool-b1-fallback-and-account-order/phase-03-bind-walk-and-pool-candidates.md) and [04](../261019-2312-model-pool-b1-fallback-and-account-order/phase-04-runner-callers.md). Phase 05 and later not started. Two commits (contract, then callers); the tree is green only after both.

## What was built

**Contract (`bind()` and its neighbours)**

- Candidates are `(executor, tier-cell entry)`. The tier is derived first (a pure move, independent of the executor), then each `prefer` executor expands into one candidate per entry of its family's cell at that tier. A seat that leases an account (out-of-process agent, not a tool) needs the cell; in-process, inline and tool seats need none and carry `pool: null`.
- Primary follows `prefer` order with today's spread. After a failure the walk takes, in order: the failed family's remaining entries (cell order), then the families `runner.tierFallback.<tier>` lists, limited to the families `prefer` names (a list narrows, never widens); with no list, the rest of the `prefer` order after the failed candidate. A walk never leaves the tier.
- Walk state is `tried` (the seat's earlier bindings, identity = executor + invocation + pool + model); `excludePools` replaces `excludeFamilies` (a dead login excludes one pool, not the family's other pools). `candidateIndex` is gone from bindings and records.
- A pool is usable when the lease can serve it: a pool with accounts needs an enabled account holding a login store for the CLI of the chosen invocation; a pool with no account in either inventory is usable only when it is the family-named pool (the executor's own login). Config only, so `bind()` stays pure.
- Missing cell: an out-of-process agent seat whose family has no cell at the tier refuses `tier-cell-missing` with `no model for tier "<t>" under family "<f>" (runner.modelPolicies.<f>.<t>)`; in a walk (or with several `prefer` families) the family is skipped, recorded in `provenance.skipped`, and the refusal names the last skipped cell when nothing is left. The `executor.model` / `default` fallthrough is deleted. `assignment-policy.mjs` raises the same text (`tier-cell-missing: ...`) through one shared builder `tierCellMissingDetail` in `resolve.mjs`.
- Pin is `pool/account` (`parseAccountPin`; a bare id is refused with the form to write). The pin selects the candidate of the chosen family whose pool matches; otherwise the seat binds unpinned and `provenance.account.skipped` says why (`account-pin-other-pool`, `account-pin-no-inventory`, `account-pin-unsupported`); an unknown account of the seat's own pool refuses `account-pin-unknown`, a disabled one `account-pin-disabled`. `binding.account` is `{ pool, id }`.
- Rotation by pool: `inspectAccountRotation({ runnerConfig, pool, runtimeDir })` counts enabled accounts of the pool; `credentialFaultPools` replaces `credentialFaultFamilies`; `triedBindingsOf(attempts, at)` rebuilds the walk state from `unit.json` (drops the attempts a rotation repeats, and bindings recorded without `pool`, so an old record restarts at the primary). `nextCandidate(prevBinding, ask, ctx, reason, { tried, excludePools })` records `pool` and `walk: 'entry' | 'family'` beside `kind`; `retrySameCandidate` records `pool`.
- New read-only exports for the doctor and explain: `walkBindings`, `listCandidates`, `bindingIdentity`, `poolUnusableReason`.
- `fgos dispatch explain` prints candidates in order (with `reason` when out), the walk, the entries of the primary's cell (`used`, `fallback`, `unusable` + reason), and the accounts of every pool on the walk in lease order with `usable` or the reason. The `pending-pool-routing` label and the legacy-vs-`llmAccounts` comparison in explain are removed (doctor rows `llm-accounts-vs-legacy` already cover the comparison).

**Callers moved (phase 04)**

| File | Change |
|---|---|
| `src/runner/execution/run.mjs` | imports; fault set holds pools; attempt record drops `skipCandidateIndex`/`candidateIndex`; walk passes `tried: triedBindingsOf(attempts, attemptNo + 1)` and `excludePools`; rotation by `bound.pool`; `cliOverride.pool` handed to the dispatch; pinned-account texts use `pool/account`. Merged with the AGENT-WF admission code (scope.admission, custody) without touching it. |
| `src/runner/dispatch/assignment-runner.mjs` | write-gate recompute uses `tried` (`triedBindingsOfAssignment`) and `excludePools`, and now compares `pool` too; lease key = `legacyStateKey(cliOverride.pool)` when the seat is bound to a pool of the executor that runs (family-named pool keeps the legacy key); lease receives `cli` from the invocation's declared `credentialStore.use` on every launch (new `declaredStoreCli`), not only a pinned one; `fallbackSkipIndex`/`skipIndexOfAttempt` deleted. `attemptProviderCapacityFallback` (second walker) untouched. |
| `src/runner/dispatch/assignment-policy.mjs` | `tier-cell-missing` with the shared text. |
| `src/setup/blind-steps-proven-pools.mjs` | enumerates `listCandidates` instead of an int walk; candidates left out only for `tier-cell-missing` or `pool-unusable` still count (a config gap would bind once completed). |
| `src/workflow/case-start.mjs` | `workflow start --account` parses `pool/account` and checks the pool's inventory; bare id refused early. |
| `bin/fgos.mjs`, `src/cli/command-registry.mjs` | `--account` text and flag help; explain description. |
| `src/runner/dispatch/resolve.mjs` | `tierCellMissingDetail`. |
| `src/runner/dispatch/settlement.mjs` | verified, no edit: it passes `providerCapacitySelection.provider`, now a pool state key. |

`rg "excludeFamilies|skipCandidateIndex|credentialFaultFamilies|candidateIndex|capacityProviderOf" src bin` finds nothing. `docs/specs/runner.md` still describes the old walk and pin (RUL91, RUL98, the 3202 and 3285 rows): that is phase 05.

## Decision to test mapping

| Decision | Test |
|---|---|
| 1 tier order drives the fallback, `prefer` narrows, absent list = legacy walk | `tier-fallback.test.mjs`: primary follows prefer, walk follows list; narrowed prefer; list not naming prefer families; no list; list for another tier |
| 2 chain stays in tier, only families with a cell, no doer-only family in flagship/frontier | `tier-fallback.test.mjs` "never leaves the tier", and "committed-config walk" (committed `.fgos/config.json` with the owner's two lists injected, every tier nano..frontier) |
| 2 family with no cell skipped and recorded | `tier-fallback.test.mjs` "in a walk a family with no cell is skipped and recorded" |
| 3 declared order, quota quarantines one account | `run-provider-failover.test.mjs` "a dead login in one pool ... a quota hit quarantines only that account" (second seat starts on `a2`, not on the least used) |
| 4 `tier-cell-missing` both paths | `tier-fallback.test.mjs` "missing tier cell refuses by name", "executor model is no longer a fallthrough", "seat that needs no model"; assignment path: `dispatch-execute-effort` / `assignment-policy` tests keep passing with the new text |
| 4 two entries, two candidates in cell order | `tier-fallback.test.mjs` "two entries of one cell" |
| 4 `excludePools` keeps the other pool of the family | `tier-fallback.test.mjs` "a fault excludes one pool", `run-provider-failover` walk test (alpha excluded, router entry still taken) |
| 4 `pool/account` pin selects the matching entry, refuses bare ids | `account-pin.test.mjs` (12 tests) |
| `tried` makes the recompute pure | `tier-fallback.test.mjs` "walk state is the earlier bindings" (each step recomputed from JSON-copied earlier bindings equals the walk's) |
| entry whose pool has no matching store gives no candidate, explain says why | `tier-fallback.test.mjs` "a pool no account can serve", `explain.test.mjs` |
| failure order `P1/a, P1/b, P2 first account, F2` with real lease | `run-provider-failover.test.mjs` walk table, run for a reading seat and for a writing seat (the writing run passes the write gate at every step, which is the recompute-equals-binding proof for rotation, walk step and credential fault) |
| resume: write gate / records | `run-provider-failover.test.mjs` "a resumed unit recorded before bindings carried a pool"; `account-rotation.test.mjs` `triedBindingsOf`, `credentialFaultPools` |
| `fgos run --account pool/account` | `account-pin.test.mjs`, `run-provider-failover.test.mjs` pin tests (pass `alpha/a2`, quarantine message names `alpha/spent1`, checker on another pool binds unpinned) |

## Fixtures fixed (they relied on the deleted fallthrough)

Fixtures with an executor whose family had no cell in `modelPolicies` were completed, not worked around: `bind.test.mjs` (`twoInvocationConfig`), `run.test.mjs` (`reviewedConfig`), `run-posture.test.mjs`, `workflow-pool-independence-check.test.mjs`, `executor-posture-coverage-check.test.mjs`, `registrations.test.mjs`, `dispatch-execute-effort.test.mjs`, `execution-outcome-exit-codes.test.mjs`, `run-verb.test.mjs`, `units-runner.test.mjs`, `workflow-runner.test.mjs`, `direct-harness.mjs`. Executors filed under a command path (no `providerModel`) now declare their family in `loop.test.mjs`, `spawn-worker.test.mjs`, `e2e/synthetic-domain.test.mjs` and `loop-worker-fixture.helper.mjs` (the helper fixes `pr-gate`, `self-improve-loop`, `domain-aware-stage-literals` and `fanout-batch-runner-commit` at once). Tests that asserted the old pin or walk shape (`candidateIndex`, `skipCandidateIndex`, bare account ids, `provider` in an account) were rewritten to the new shape. Phase 00's count of 0 real configs relying on the fallthrough held; only test fixtures did.

## Test runs

All with `env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN=<private target>/release/fgos`; `cargo build --release --workspace` into the private target dir first (`verify-target-mpb1-34`, symlinked as the worktree's cargo output dir; the node dependency dir is a `cp -al` real directory).

| Run | Files | Tests | Result |
|---|---|---|---|
| Narrow: `bind`, `bind-committed-config`, `account-pin`, `account-rotation`, `explain`, new `tier-fallback`, `run-provider-failover` (28, 5 new), `run`, `run-posture`, `assignment-policy` (1 new) | 12 | about 330 | all pass |
| Touched-module sweep: the plan's `git grep -l` module list plus `execution/dry-bind.mjs`, `workflow/case-start.mjs`, `dispatch.mjs`, `setup/registrations.mjs`, plus `test/architecture.test.mjs` and `test/workflow/playbook-observable-order.test.mjs` (unchanged); file count checked by the script | 117 | 2761 | 2756 pass, 5 skipped, 0 fail (the first sweep found 61 failures: fixtures without a model cell and the old pin and walk shape; all fixed, no assertion weakened) |
| Full `npm test -- --test-concurrency=4` before the remaining fixture fixes | all | 8579 | 55 fail (the same two causes in more files, plus the environment ones) |
| Full `npm test -- --test-concurrency=4` at the last code commit | all | 8602 (8497 pass, 31 skipped) | 9 fail, all on the known list below |

The 9 failures of the last full run: `fences-v1-tombstone` (1, fails alone too), `skill-wrappers` projection (1, worktree only, fails alone too), `spawn-worker` `idleTimeoutMs` (1, load-sensitive, passes alone), `run-supervisor-checks` `runtime-socket-dir` (3 rows, socket-path length, pass alone), `observe-store-lock` (1, passes alone), `fgctl-upgrade` (1, passes alone). The architecture test and the playbook order guard pass, so the guard that Execution Core never imports Workflow holds.

## Impact analysis

`fgos tool query --capability impact-analysis --status present` returns GitNexus present. The MCP index is the main checkout's (stale), so `detect_changes` cannot see this worktree. `impact` upstream: `bind` HIGH (10 symbols, 6 direct; processes `executeAssignment`, doctor `check`, `runRole`; modules Setup, Execution, Dispatch, Workflow); `nextCandidate` reported 0 callers and `retrySameCandidate` not found (index stale); `runUnit` LOW (1 direct, Workflow). Cross-checked with `rg`: `bind(` is called from `run.mjs`, `assignment-runner.mjs` (write gate), `dry-bind.mjs`, `explain.mjs`, `registrations.mjs` (doctor `bindings-match` check, recompute without walk state as before), `executor-posture-coverage.mjs`; `nextCandidate` / `retrySameCandidate` from `run.mjs` only; `blind-steps-proven-pools.mjs` moved to `listCandidates`. Every caller of the changed shapes is in the table above.

## Deviations from the phase files

1. **Spread stays active in a walk.** Phase 03 says a non-empty `tried` takes the first untried candidate; the existing test "the walk keeps preferring a family the sibling seats did not use" (verified behaviour, council seats) requires the soft spread in a walk, so the spread still ranks the passing candidates there (ties fall to walk order, so entries of the failed family still come first when no sibling uses another family). Without `preferIndependentOf` it is exactly the first untried candidate.
2. **`nextCandidate` signature** is `(prevBinding, ask, ctx, reason, { tried, excludePools })`, not `(tried, ...)`: after the filter of unreadable old bindings `tried` can be empty while the failed binding is known (provenance needs it). `tried` defaults to `[prevBinding]`.
3. **A family with no cell is skipped in the first binding too**, not only in a fallback walk: with several `prefer` families a missing cell must not kill a seat another family can run. A lone candidate still refuses `tier-cell-missing`.
4. **Write gate also compares `pool`** (beside executor, tier, posture).
5. **Account in a binding is `{ pool, id }`** (no `provider`); the state key is `legacyStateKey(pool)` wherever the lease needs it.
6. **Blind-pool doctor check counts config gaps** (`tier-cell-missing`, `pool-unusable`) as candidates; otherwise a missing cell would silently remove an unproven executor from a proof that must stay conservative.
7. **Rotation counts enabled accounts only** (a disabled account is not one to rotate to); small correction in `inspectAccountRotation`.
8. `docs/specs/runner.md` and the `--account` pin spec rows are not edited (phase 05).

## RUL104 ideas (not done, owner picks)

- `registrations.mjs` doctor check `every mutating assignment RunResult binding matches its unit.json snapshot` recomputes without `tried`/`excludePools`, so it reports a mismatch for any fallback attempt; it should use `triedBindingsOf` like the write gate (a real bug, pre-existing, out of this change's scope).
- The write-gate recompute does not pass `independentOf` / `preferIndependentOf`, so a spread-chosen primary can differ from the recompute (pre-existing); passing the recorded ones would make the gate exact.
- `attemptProviderCapacityFallback` (second walker, legacy dispatch path and workflow operations declaring `policy.fallbackExecutors`) leases without `cli` and by family key; moving it to `bind()` walk is the remaining L10 item once `fgos run` is the only door.
- `prepare()` calls `resolvePostureInvocation` (backend registry read) once per candidate on each `bind()`; a walk of N steps repeats it. Caching per `bind()` call across `walkBindings` is a possible speed-up; no evidence of a problem.
- `credentialStoreOf`'s `private-home` inference still decides usability for configs written before `credentialStore`; it goes with MP-C.

## Open questions

1. A pool-less family (no account in either inventory) is usable only as the family-named pool, so `model@router` entries stay out until `llmAccounts.router` exists. That matches the plan (no account, nothing pays), but it means phase 06 must declare `llmAccounts` for every non-family pool before the project cell lists use them.
2. A unit record written before this release restarts its walk at the primary and the write gate treats it that way; an old record whose fallback attempt is *currently running* during activation would be refused by the gate (`binding mismatch`). Activation while a fallback attempt is in flight is the only exposure; the lead should check `fgos dispatch inspect` before activating.
3. `provenance.model.source` changed from `resolveTierModel(<family>.<tier>)` to `modelPolicies.<family>.<tier>[<index>]`; no reader in `src` or tests outside the updated ones.

## Live checks for the big lead (after activation, no dispatch done here)

1. `fgos dispatch explain --for <capability>` on the forgentX config: candidates in order, `walk` lists the same families as `prefer`, accounts per pool in declared order.
2. `fgos run "<prompt>" --provider <id> --account <pool>/<account>` on a read-only seat: provenance shows `account.value` as `pool/account`; a bare id refuses with the form to write.
3. One round on a pool with two accounts where the first is quarantined: the seat starts on the second; kill nothing, then check `fgos dispatch inspect --provider-capacity`.
4. A deliberately missing cell (`modelPolicies.<family>.mini`, then `--tier mini` override) refuses `tier-cell-missing` naming `runner.modelPolicies.<family>.mini`.
