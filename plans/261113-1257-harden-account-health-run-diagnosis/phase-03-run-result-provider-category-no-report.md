---
phase: 3
title: "Run Result: a provider limit has its own category; a seat that left no claim and no report is infra"
status: pending
depends_on: []
parallel: "wave 1 with P01 and P06; P04 waits for it (shared settlement.mjs)"
branch: harden/acct-b-p03
---

# P03 - `provider` category and `infra-no-report`

**Authority:** `fgos-run-result::derive_outcome` stays the one category authority (`packages/run-result/rust/src/lib.rs:24`); Node reaches it through the addon. Settlement only states facts (`failure`), never a category.

## Context (verified)

- `derive_outcome` (`lib.rs:24-75`): any failed/cancelled/unknown execution with failure family `provider|resource|unknown` is `infra` (`:52-60`), so `{family: provider, code: provider-limit}` is `infra-exec-failed` (incident #7 result).
- Claim-less exit-0 seat: `classifyEvidenceToOutcomeFacts` falls through to `{execStatus: completed, verdict: inconclusive, failure: null}` (`src/runner/dispatch/settlement.mjs:375-382`) -> `verdict-inconclusive` (unit 6067daf5 result).
- v3 readers check the recorded category against the derivation twice: Rust `derive_legacy_outcome` (`lib.rs:166-186`) and Node `validateRunResultV3` (`src/runner/dispatch/run-result.mjs:334-341`). Any old provider-limit record (recorded `infra`) would turn `contract-corrupt`; `readSettledResult` would then return null and settle could run again.
- Category consumers: `runOutcome` `infraFailure` (`run-result.mjs:1114`; reader `operation-choice.mjs:1798`), `outcomeOfRunResult` (`src/runner/execution/unit-run-history.mjs:32`; callers `unit-run-history.mjs:82`, `run.mjs:978`), observe scorecard buckets (`packages/observe/rust/src/scorecard.rs:210-219`), JSDoc enums `run-result.mjs:980,1045`, the golden-fixture map `packages/run-result/rust/tests/unit_result_fixtures.rs:14-23`.

## Requirements

1. `derive_outcome`: before the infra rule, `failure.family == provider && code in {provider-limit, paused-limit}` -> `provider`, reason by `failure.cause`: `quota` -> `provider-quota`, `credential` -> `provider-credential`, `provider` -> `provider-error`, absent -> `provider-limit`. `provider-capacity-refused` and the lease-conflict code stay `infra`.
2. `derive_outcome`: `failure.code == no-report` -> `infra`, reason `infra-no-report`.
3. Settlement: the claim-less fall-through (no claim file, not invalid, no external evidence) returns `failure {family: unknown, code: no-report}`; `execStatus` stays `completed`, confidence `no-evidence`. A done claim with no report (`:340-347`) is unchanged.
4. One compatibility rule, in Rust: `pub fn recorded_category_agrees(recorded, derived) -> bool` = equal, or `recorded == infra && derived == provider`. `derive_legacy_outcome` uses it and returns the derived outcome for the split case; the addon exposes it (`runResult.recordedCategoryAgrees`, `packages/git/node-addon/src/run_result.rs`) and `validateRunResultV3` calls it instead of its own `!==`.
5. Consumers move in this phase (L10): `infraFailure = infra|provider|corrupt`; `outcomeOfRunResult` maps `provider` -> `provider-limit` (old `infra` + provider-limit arm stays for records written before); scorecard gains `provider_limited`; JSDoc enums list `provider`.

## Files

- Modify: `packages/run-result/rust/src/lib.rs`, `packages/run-result/rust/tests/unit_result_fixtures.rs`, `packages/run-result/contracts/fixtures/unit-result.provider-limit.v1.json`, `packages/git/node-addon/src/run_result.rs`, `src/runner/dispatch/run-result.mjs`, `src/runner/dispatch/settlement.mjs` (only `classifyEvidenceToOutcomeFacts`), `src/runner/execution/unit-run-history.mjs`, `packages/observe/rust/src/scorecard.rs`, `test/fixtures/run-outcome/legacy-derivation.json`, `test/runner/run-result-v3-reader.test.mjs`, `test/runner/execution/unit-run-outcome.test.mjs`, `docs/platform/agent-coordination/contracts/assignment-run-runresult.md` (category list near `:274`), `docs/platform/component-boundary.md:76` only if it lists categories.
- Create / Delete: none.

## Owning proofs

| Behaviour | Owner |
|---|---|
| category of a classification (provider, no-report) | Rust unit tests beside `derive_outcome` in `lib.rs` (extend the existing `#[cfg(test)]` cases) and the golden map `unit_result_fixtures.rs` (`provider-limit` -> `provider`) |
| an old v3 provider-limit record reads as `provider`, not corrupt | new row in `test/fixtures/run-outcome/legacy-derivation.json` (driven by `lib.rs` legacy test and `test/runner/run-outcome.test.mjs:16`) |
| Node validator uses the Rust rule | extend `validateRunResultV3: rejects spoofed category` (`run-result-v3-reader.test.mjs:64`): spoof still rejected, recorded-infra provider-limit accepted |
| claim-less exit-0 seat settles `no-report` | extend the settlement case closest to it; read `rg -n "no-evidence" test/runner/assignment-dispatch.test.mjs` first and extend that case, no new file |
| `provider` category -> seat `provider-limit` | extend `unit-run-outcome.test.mjs:18` |
| scorecard bucket | extend the test at `scorecard.rs:645-680` |

Tests retired: none. Net size: about +45 Rust, +15 Node, fixtures +1 row; Node's own category comparison removed.

## Steps

1. Red: Rust derive cases, fixture map, legacy row. 2. `derive_outcome` + `recorded_category_agrees`; addon export. 3. Node validator, `infraFailure`, `outcomeOfRunResult`, settlement fall-through. 4. Scorecard. 5. Docs.

## Validation

`cargo test -p fgos-run-result -p fgos-observe`; `cargo build --release -p fgos-node-addon`; `node scripts/run-tests.mjs test/runner/run-outcome.test.mjs test/runner/run-result-v3-reader.test.mjs test/runner/execution/unit-run-outcome.test.mjs test/runner/assignment-dispatch.test.mjs test/run-supervisor/attempt-steps.test.mjs`; clippy.

## Risk / rollback

High item: old records. Mitigated by requirement 4 and its row; check with `fgos dispatch inspect` on one real old provider-limit run (`unit-run-1794436407348-b2fc6cf2`) through `npm run fgos:dev` before landing. Rollback: see plan.md (revert only before real runs wrote `provider`, or keep the reader rule).
