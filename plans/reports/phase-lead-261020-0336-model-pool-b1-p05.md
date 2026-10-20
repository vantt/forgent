# Phase lead report: MP-B1 phase 05

Branch `worktree-agent-a0717ddd5f41fee31`, cut from main `d01e8468a` (phases 00-04 on main, plus the board note `f1a2c9341`). Plan: [plan.md](../261019-2312-model-pool-b1-fallback-and-account-order/plan.md); phase file [05](../261019-2312-model-pool-b1-fallback-and-account-order/phase-05-spec-changelog-doctor-rows.md), marked done. Phases 06 and 07 not started. Commits: bug fix, doctor wording, spec and changelog, citation gloss fix, this report.

## Bug fix: doctor `mutating-assignment-binding-snapshot`

Cause: `checkMutatingAssignmentBindingSnapshot` (`src/setup/registrations.mjs`) bound each recorded result with no walk state, so every attempt after the first (`<round>-fb<n>`, a walk step) was recomputed as the primary and reported as a mismatch. It could also pass a wrong binding on a fallback attempt that happened to equal the primary (the new second test fails on the old code for that reason).

Fix: one helper `walkStateOf(unitRecord, { role, round, assignmentId })` in `src/runner/execution/account-rotation.mjs` returns `{ tried, excludePools }` from the attempt chain in `unit.json` (it is the old write-gate pair `triedBindingsOfAssignment` plus `attemptBoundAt` plus `credentialFaultPools`, moved, not copied). The write gate in `assignment-runner.mjs` and the doctor check both call it; the two private gate helpers are deleted. The doctor derives `role` and the base `round` from the assignment path (`<unit>/<role>/<round>[-fb<n>]`, the `-fb<n>` suffix stripped) because `unit.json` keys the chain by `<role>/<round>`. The check still compares `executor` only (a record written before bindings carried `pool` would otherwise fail on `pool`).

Tests (`test/setup/observe-doctor-checks.test.mjs`, real `bind()` over a two-family config, a `unit.json` and one `result.json` per attempt):
- a fallback attempt whose binding is the walk's second step passes the check;
- a fallback attempt whose recorded binding differs from the walk still fails, naming round `1-fb1`.
Both new tests fail on the previous code (checked by reverting the one argument), the existing mismatch test still passes. The write-gate path is covered by the existing `run-provider-failover.test.mjs` writing-seat walk (every step passes the gate), which ran green after the move.

## Spec changes (`docs/specs/runner.md`), each claim checked against code

New **RUL106** (after RUL105) and a decision record at the end (no id: the same pattern as the controller-death record, "id assigned when recorded in state"). Claims and the code they were read from:

| Claim | Checked against |
|---|---|
| candidates are `(executor, invocation, pool, model)`, one per cell entry in cell order; `provenance.model.source` = `modelPolicies.<f>.<t>[<i>]`; in-process/inline/tool seats `pool: null` | `bind.mjs` `prepare` (`candidates.push`, `modelSource`) |
| primary in `prefer` order with soft spread; spread stays in a walk | `bind.mjs` first-binding loop (`spreadRequested`, `familyUse`), `walkOrder` |
| walk order: failed family's remaining entries, then `tierFallback.<tier>` limited to `prefer` families, else rest of `prefer`; never leaves tier | `bind.mjs` `walkOrder` (`tierFallbackOf`, `sameFamily`, `candidates.slice(lastIndex + 1)`); the candidate list is built at one tier |
| `tierFallback` shape, validator, reader, doctor `tier-fallback` | `config.mjs` `validateTierFallbackShape`, `resolve.mjs` `tierFallbackOf`, `model-pool-checks.mjs` `checkTierFallback`; the doer/premium groups are stated as configuration, not code, because the code enforces only the tier boundary and narrowing |
| walk state = `tried`; `excludePools`; retry on another account is not a step; `walkStateOf` the one door; write gate compares executor, pool, tier, posture; old records restart at the primary | `account-rotation.mjs` `triedBindingsOf`, `credentialFaultPools`, `walkStateOf`; `assignment-runner.mjs` gate (`recomputed.pool` comparison) |
| pool usable rule (accounts need an enabled account with a store for the CLI, no-account pool only as the family-named pool), `pool-unusable` | `bind.mjs` `poolUnusableReason`, `rejectionOf` |
| `tier-cell-missing` text, one builder for `bind()` and the assignment policy; fallthrough deleted; skip and `provenance.skipped` with several `prefer` families; lone candidate refuses | `resolve.mjs` `tierCellMissingDetail`; `bind.mjs` `rejectionOf` and `skipped`; `assignment-policy.mjs:451` |
| state key `legacyStateKey(pool)` (`openai` is `openai-codex`); family-named pool keeps its key | `llm-accounts.mjs` `legacyStateKey`; `assignment-runner.mjs` `boundPool` / `providerCapacityProvider` |
| transition read of `runner.providers.*.accounts`, removal condition | `provider-capacity.mjs` `providerAccountInventory` (comment states the same condition) |
| declared order, sticky first, quarantined and disabled skipped, `lastSelectedAt` still written, digits-only id refused | `provider-capacity.mjs` `rankProviderAccounts`, id check at `:160`; `llm-accounts.mjs:90` |
| lease gets the CLI from the launched invocation's declared store (pinned, else first `cli` invocation) | `assignment-runner.mjs` `declaredStoreCli`, `leaseCli` |
| `inspectAccountRotation` counts enabled accounts of the pool | `account-rotation.mjs:21` |
| pin `pool/account`, bare id refused, skip reasons, `{ pool, id }`, `workflow start --account` | `account-pin.mjs` `parseAccountPin`, `resolveAccountPin`; `bind.mjs:553`; `case-start.mjs` (phase 04 report) |
| both reversal triggers; primary-order reversal note | plan.md owner decisions and big-lead decision 3 |
| not changed: second walker, `independentOf` missing in the gate, ceilings and spend tracking | phase 03/04 report, `assignment-runner.mjs` gate call |

Sentences that stopped being true, handled by reference (not rewritten) in the decision-bearing text, and corrected in place only where the text is current-behaviour description:
- RUL80 "an unpinned lease picks among all accounts as before": superseded note (the lease now always gets the CLI from the launched invocation's store).
- RUL91 bare id, `{ provider, id }`, `capacityProviderOf`, "`fgos workflow start` has no `--account`": superseded note.
- RUL98 `--account <id>` and the `runner.providers.*.accounts` lookup: superseded note.
- RUL102 "another pool never run until the lease routes pools" and the `executor.model` / CLI-default fallthrough: superseded note.
- The area description under RUL102: "The lease, account pins and credential provisioning still read `runner.providers` only" corrected in place (it is a state description); the doctor list now names `tier-fallback`; the `explain` description lost `pending-pool-routing` and the two-inventory display and now matches the command (candidates with reasons, walk, primary's cell entries, accounts in lease order).
- The failover paragraph under Business Rules (account rotation then `nextCandidate`): corrected in place to pool and tier-walk wording.
- Data dictionary row 1 gained `tierFallback`; row 1b says which inventory a pool reads and that account order is key order; the code-pointer row for `account-pin.mjs` names `parseAccountPin` and drops `capacityProviderOf`.
- ADR records 0051 item 1 and 0058 items 2, 3 and 6 are not edited (superseded only by a new record): the new decision record states that it supersedes them.

`No component-boundary change` is written in RUL106 and in the decision record (bind decides candidates, the lease decides accounts). `docs/platform/component-boundary.md` was not touched.

## CHANGELOG

Phases 01-04 had already added the entries for declared account order, the tier walk, `pool/account`, and `tier-cell-missing` (two `[Unreleased]` lines); they were read against the code and stand. One line added: the doctor binding-snapshot fix and the reworded `model-policy-pools` and `llm-accounts-vs-legacy` messages.

## Doctor and explain rows

- `tier-fallback` (phase 01) already registered; its row is in the doctor how-to table.
- `model-policy-pools`: message now says the walk skips a pool entry until the pool has an enabled account holding a login store for the CLI of the invocation (it no longer says "cannot run until the pool has accounts"); registration description adds that a pool with no account is skipped. The check logic is unchanged (id unchanged; it still tests only that the pool is declared in `llmAccounts`, since the store match needs an invocation and `fgos dispatch explain` shows it per candidate).
- `llm-accounts-vs-legacy`: wording says the lease reads `llmAccounts` for a declared pool and `runner.providers` for the rest; id and logic unchanged.
- `src/cli/command-registry.mjs`: the explain and `--account` descriptions were already updated in phase 04; read against `explain.mjs`, no edit needed.
- `docs/how-to/install-fgos-in-a-project-and-use-doctor.md` rows for both checks updated to the new messages.

## Test runs

All with `env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN=$CARGO_TARGET_DIR/release/fgos` and the private cargo dir (`verify-target-mpb1-5`, symlinked; node dependency dir is a `cp -al` real directory); `cargo build --release --workspace` finished green.

| Run | Files | Tests | Result |
|---|---|---|---|
| `test/setup/observe-doctor-checks.test.mjs` | 1 | 18 (2 new) | all pass; the two new tests fail on the old doctor code |
| Sweep: every test importing `account-rotation`, `assignment-runner`, `model-pool-checks`, `setup/registrations`, `execution/bind`, `provider-capacity`, `llm-accounts`, `execution/run`, `dispatch.mjs`, plus `test/architecture.test.mjs`, `test/docs/*.test.mjs`, `test/setup/*.test.mjs` (count checked by the script) | 138 | 2947 | 2941 pass, 5 skipped, 1 fail: `skill-wrappers` projection (worktree-only, known) |
| Full `npm test -- --test-concurrency=4` (before the citation fix below) | all | 8621 (8516 pass, 31 skipped) | 9 fail: `fences-v1-tombstone`, `skill-wrappers` projection (known), `spawn-worker` idle timeout, `dev-host` distinct targets, `run-supervisor-checks` socket-dir (4 rows) (the last three pass alone: 52 of 52), and **one real failure of mine**: `test/scripts/check-decision-citation-drift.test.mjs` flagged five rule citations in my spec notes with no gloss |
| After the gloss fix: `test/scripts/*.test.mjs` plus `test/docs/*.test.mjs` | 6+ | 557 | all pass |

The citation guard lives under `test/scripts`, which my first sweep (`test/docs`, `test/setup`, `test/architecture`) did not include; the full run caught it. Fix: every `RUL<n>` cited in the new notes and in RUL106 now carries its one-line gloss, as the guard requires (commit `docs(runner): gloss the rule citations in the superseded notes`).

## Deviations

1. The doctor check was fixed with a helper moved into `account-rotation.mjs`, not by importing the gate's private function (it was private and in the dispatch layer); the gate now imports the same helper, so there is one definition. The registrations module now imports `account-rotation.mjs` (no architecture guard fired).
2. The doctor check still compares `executor` only, not `pool`/`tier`/`posture` as the gate does (old results without `pool` would fail); "recompute exactly as the gate" is met for the inputs (walk state), not for the compared fields.
3. The decision record has no `D-ADR` id: no work item or `fgos decision` call was made (instruction), the heading says the id is assigned at landing, as an earlier record does.
4. CHANGELOG: no new line for the four behaviours (they were added in phases 01-04 and verified); only the doctor lines were added.

## Open questions

1. The decision record needs a `fgos decision` entry at landing (the big lead or owner).
2. `model-policy-pools` could use `poolUnusableReason` per candidate to name a pool whose accounts have no matching store; that is a new check surface, left to the owner (RUL104 idea; `explain` already shows it).
3. Phase 04's open exposure stands: do not activate while a fallback attempt of an old unit record is in flight (`fgos dispatch inspect`).
