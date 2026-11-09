---
phase: 21
title: "T5 fix: Seat Binding is the one authority for binding facts: provenance passes through Dispatch unchanged, one provider family, one account-usable judgement"
status: pending
depends_on: ["06 landed (dispatch/cli.mjs, unit-run-start.mjs writer order)", "20 landed (run.mjs writer order)"]
parallel: "T5 slot, second wave: beside P22 if still open (file-disjoint); before P07"
effort: ~1d
net_size: "Node about -65 (provenance -30, family -20, account -15); Rust 0; tests about 0 (moved to the owning tests) (estimate)"
---

# Phase 21 - T5 fix: Seat Binding owns provenance, family and account usability (authority audit AU-15 High, AU-16, AU-18)

**Authority moved:** bind / Seat Binding (T5) is the one writer of provenance labels, the one answer to "which provider family", and the one plan-time judge of "is this account usable"; Dispatch executes a binding and never relabels it; the lease stays only as the time-of-use guard.

## Context

- **AU-15 (High, observed 2026-11-09).** bind writes provenance (`src/runner/execution/bind.mjs:36,433`); `dispatchBound` (`src/runner/execution/run.mjs:841-847`) hands bind's own choices to Dispatch as `cliOverride`; `effectiveDispatchPolicy` (`src/runner/dispatch/plan.mjs:55-168`) labels them `{ scope: 'cliOverride' }`; `assignment-runner.mjs:342,605,639-644,877,1246` re-reads `cliOverride`. The four-seat run recorded `cliOverride` as the source of `model` and `tier` although only `--effort` was passed.
- **AU-16.** `deriveProviderFamily` (`src/runner/dispatch/resolve.mjs:148`) returns the declared value (`openai`); `normalizeProviderFamily` (`src/runner/dispatch/provider-adapter.mjs:77`) maps `openai`, `openai-codex`, `codex` to `openai-codex`. bind and Seat Binding's independence use the first; leasing and capacity use the second; `executor-governance.mjs`, `src/runner/execution/explain.mjs`, `src/setup/model-pool-checks.mjs` and `src/setup/registrations.mjs` (`:2155` on `308c314a0`) pick one each.
- **AU-18 (Low).** `assertPinnedAccountsUsable` (`src/runner/execution/account-pin.mjs:44-56`) judges usability from `inspectProviderCapacity(...).healthy`, while the Rust rank (`packages/seat-binding/rust/src/rank.rs:893-916`) judges it from the view bind builds; `unit-run-start.mjs` already computes `simulateUnitBindings`.

## Requirements

1. **Provenance (AU-15).** `dispatchBound` passes `binding: bound` with its provenance; `effectiveDispatchPolicy` takes a bound input and copies provenance unchanged (closed list from COOK §4: `cli`, `unit`, `policy`, `default`, `fallback`); `assignment-runner.mjs` reads the binding, not `cliOverride`. `cliOverride` remains only for the `fgos dispatch` path (`src/runner/dispatch/cli.mjs`) if that path still takes user flags; otherwise it goes.
2. **Family (AU-16).** One `familyOf(executor)` in Seat Binding's launch view returns the normalised key; `deriveProviderFamily` and `normalizeProviderFamily` become one (the other name deleted); every caller moves in this change (L10), including the two setup readers (board chain on `registrations.mjs`). COOK's `binding.family` carries this value.
3. **Account usable (AU-18).** `assertPinnedAccountsUsable` reads the seat refusal from the `simulateUnitBindings` result `unit-run-start.mjs` already computes; its own capacity predicate goes.
4. Behaviour change only where the record was wrong: provenance labels in new run records; a project executor declaring `codex` now counts as the same family as `openai-codex` for independence (CHANGELOG line).

## Files

**Modify:** `src/runner/execution/run.mjs` (`dispatchBound`), `src/runner/dispatch/plan.mjs`, `src/runner/dispatch/assignment-runner.mjs`, `src/runner/dispatch/cli.mjs` (the `cliOverride` site), `src/runner/dispatch/resolve.mjs`, `src/runner/dispatch/provider-adapter.mjs`, `src/runner/execution/bind.mjs`, `src/runner/dispatch/{provider-capacity,llm-accounts,provider-account-probe,executor-governance}.mjs`, `src/runner/execution/explain.mjs`, `src/setup/model-pool-checks.mjs`, `src/setup/registrations.mjs` (family caller only; board chain), `src/runner/execution/account-pin.mjs`, `src/runner/execution/unit-run-start.mjs` (hand the simulation to the pin check), owning tests `test/runner/dispatch/plan*`, the family and account-pin tests (`rg -l "normalizeProviderFamily|deriveProviderFamily|assertPinnedAccountsUsable" test`), `CHANGELOG.md`.

**Delete:** the relabelling in `effectiveDispatchPolicy`; one of the two family functions; the second account predicate.

**Tests to retire:** a case that asserts `cliOverride` provenance for a bound run is changed to the bind label (behaviour was wrong; named in the commit body); family cases of the deleted function move to `familyOf`'s test.

## Steps

1. Enumerate callers with `file:line` (`rg -n "cliOverride|deriveProviderFamily|normalizeProviderFamily|assertPinnedAccountsUsable" src bin scripts test`; list ten, give the total).
2. Red: a bound run whose only flag is `--effort` records `model` and `tier` with bind's label (fails today); `familyOf('codex') === familyOf('openai')`; a pinned account the simulation refuses is refused with the seat refusal code.
3. Implement in three commits (provenance, family, account), each green.

## Validation (focused)

FR `test/runner/dispatch/*`, `test/runner/execution/{bind,run,account-pin,unit-run-start}*`, `test/setup/model-pool-checks*`; a four-seat smoke on a built host reading provenance. Land gate; COOK reviews against §4.

## Risks and rollback

| Risk | L x I | Mitigation |
|---|---|---|
| A family change regroups existing accounts | M x M | leasing already uses the normalised key; only independence changes; CHANGELOG and guide line |
| `fgos dispatch` path loses user overrides | L x M | step 1 decides whether that path still has user flags; its tests stay |

Rollback: revert the merge commit (records written meanwhile keep the bind labels, which readers accept).
