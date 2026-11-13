# Lead report: Run Result `provider` category and `infra-no-report`

Branch `harden/acct-b-p03` (worktree `/home/vantt/projects/forgent-worktrees/acct-b-p03`), base `origin/harden/acct-b-plan` `8b344810f`. Not landed: main frozen until `v0.2.0-rc.7`.

## Commits

| Commit | What |
|---|---|
| `bf2dfa92e` | red: Rust derive cases, compat-rule unit test, golden map `provider-limit -> provider`, legacy row 29, Node validator / seat outcome / settlement / scorecard assertions |
| `fd09894f5` | `derive_outcome` provider + no-report rules, `recorded_category_agrees`, addon `runResult.recordedCategoryAgrees`, Node validator + reader, `infraFailure`, `outcomeOfRunResult`, settlement fall-through, scorecard bucket, contract doc |
| `261c7e297` | rustfmt of the new code |

Every commit regenerates `packages/git/contracts/mutation-census.v1.json` (pre-commit guard); landing regenerates it again.

## What changed

- `derive_outcome` (`packages/run-result/rust/src/lib.rs`): after the `provider/blocked` rule, `failure {family: provider, code: provider-limit|paused-limit}` -> `provider`, reason by `failure.cause` (`quota` -> `provider-quota`, `credential` -> `provider-credential`, `provider` -> `provider-error`, else `provider-limit`). `failure.code == no-report` -> `infra/infra-no-report`. `provider-capacity-refused` and the lease-conflict code stay `infra`.
- `pub fn recorded_category_agrees(recorded, derived)`: equal, or `recorded == infra && derived == provider`. `derive_legacy_outcome` keeps the recorded outcome when equal, returns the derived outcome for the accepted split, else `outcome-contradicts-classification`.
- Addon `runResult.recordedCategoryAgrees` (`packages/git/node-addon/src/run_result.rs`). `validateRunResultV3` calls it instead of its own `!==` (and returns the `derivedOutcome` it computed); `interpretRunResult` gives an accepted split record its derived outcome, so Node reads it exactly as Rust does. No category rule lives in Node.
- Settlement `classifyEvidenceToOutcomeFacts` fall-through: no claim and no report -> `failure {family: unknown, code: no-report}`, `execStatus` completed, confidence `no-evidence`. A claim (`no-evidence` claims fall through too) or a report keeps `failure: null`; the done-claim-without-report branch is unchanged.
- Consumers (L10): `runOutcome.infraFailure = infra|provider|corrupt`; `outcomeOfRunResult`: `provider` -> `provider-limit`, the old `infra` + code arm stays for older records; scorecard `RunStatusBuckets.provider_limited` (`#[serde(default)]`); JSDoc enums list `provider`.
- Contract doc `docs/platform/agent-coordination/contracts/assignment-run-runresult.md` (Dispatch Operability Addendum): category list, `provider` reasons, `infra-no-report`, the compatibility rule. `component-boundary.md` lists no categories: untouched.

## Old v3 records (the high risk)

One Rust rule, both readers:

- Legacy row `29-v3-provider-limit-recorded-infra-before-the-provider-category` in `test/fixtures/run-outcome/legacy-derivation.json` is the real record of `unit-run-1794436407348-b2fc6cf2/producer/1/runs/01` (classification copied as written: `failure {provider, provider-limit, cause: provider}`, recorded `outcome {infra, infra-exec-failed}`). Expected `provider / provider-error`, `satisfied false`, `infraFailure true`.
  - Red (`/dev/shm/acct-b-p03-red-rust.log`): `29-...: category infra != provider`, `reason infra-exec-failed != provider-error` (with `recorded_category_agrees` stubbed as `==`, the row would be `outcome-contradicts-classification` once derive moves).
  - Red Node (`/dev/shm/acct-b-p03-red-node.log`): `Case 29-...: expected category "provider", got "infra"`.
  - Green: `test_legacy_derivation_fixture` (Rust, `/dev/shm/acct-b-p03-cargo-test.log`) and `legacy-derivation fixture suite` (`test/runner/run-outcome.test.mjs`, `/dev/shm/acct-b-p03-focused2.log`).
- Rule proof: `a_recorded_category_agrees_only_when_equal_or_infra_recorded_before_the_provider_category` (not symmetric; `provider` recorded over derived `infra` is still a lie).
- Node wiring proof: `validateRunResultV3: rejects spoofed category` now also asserts the recorded-`infra` provider limit validates with no reasons and a recorded `verdict` still fails.
- Live check through the working tree (`npm run fgos:dev -- dispatch inspect --run "run_unit-run-1794436407348-b2fc6cf2/producer/1_01" --json`, `/dev/shm/acct-b-p03-inspect.log`): `inspectionStatus resolved`, phase `settled`, no `corrupt`/`contractCorrupt`, `outcome {category: provider, reason: provider-error}`. `result.json` untouched (sha256 `5e01219f...e619`, mtime 2026-11-12 05:33). `readSettledResult` returns the record (not null), so settle never runs again.

## Gates

| Gate | Result | Log |
|---|---|---|
| Focused: 70 files (every test reading `run-result.mjs`/`settlement`/`unit-run-history` doors, all `test/runner/execution/**`, `attempt-steps`, architecture, doc-health, citation drift) | 1359 pass, 0 fail | `/dev/shm/acct-b-p03-focused2.log` |
| `cargo fmt --all --check` | clean | `/dev/shm/acct-b-p03-fmt2.log` |
| `cargo clippy -p fgos-run-result -p fgos-observe -p fgos-node-addon --all-targets -D warnings` | clean | `/dev/shm/acct-b-p03-clippy.log` |
| `cargo test -p fgos-run-result -p fgos-observe -p fgos-node-addon` | all ok | `/dev/shm/acct-b-p03-cargo-test.log` |
| `cargo check` msvc / aarch64-apple-darwin (same crates) | ok / ok | `/dev/shm/acct-b-p03-check-*.log` |
| `git-one-door-scan --root .` | 0 undeclared (unchanged) | - |
| Full `npm test` (no COOK HOLD on the board) | 8861 tests, 8830 pass, 0 fail, 31 skipped, no ERROR lines | `/dev/shm/acct-b-p03-full1.log` |
| `git diff --stat origin/harden/acct-b-plan...HEAD` | 14 files, +243 -31, no unexpected deletions | - |

## Size

Production: Rust +40 (derive rules, compat rule, legacy arm, addon door, bucket), Node +17 net (Node's own `!==` category comparison removed). Tests: Rust +55, Node +17, fixture +1 row (49 lines JSON), golden fixture +`cause`. Docs +13. `run-result.mjs` 1139 lines (budget 1150).

## Tests retired

None. Two incidental category assertions in `test/runner/assignment-runresult.test.mjs` (`does not count pre-existing dirty files as run evidence`, `no-op executor and pre-existing dirty file must produce no-evidence`) moved `verdict` -> `infra`: a claim-less no-op seat is now `infra-no-report`; same strength, their own behaviour (dirty files are not evidence) unchanged. The claim-less owning case is `executeAssignment produces status: no-evidence when executor exits zero without producing report artifacts` in that file (the phase pointed at `assignment-dispatch.test.mjs`, which has no claim-less exit-0 case; `rg no-evidence` there finds only a claimed round).

## Proposed CHANGELOG line

- "`fgos metrics runs` and run results now name a provider limit as its own category (`provider`), and a seat that ended without writing its result or report is counted as an infrastructure failure (`infra-no-report`), not as an inconclusive verdict. Run results written before keep reading as they did, never as corrupt."

## Authority

- `fgos-run-result` stays the one category authority: `derive_outcome` and `recorded_category_agrees` live there; Node calls both through the addon. Settlement states only the fact (`failure.code: no-report`).
- Deviation from the file list: `test/runner/assignment-runresult.test.mjs` edited (owning claim-less case lives there; two incidental assertions had to follow). `packages/git/contracts/mutation-census.v1.json` regenerated per the updated brief.

## Lessons

- A recorded-category cache needs a reader rule the moment a derivation splits a category; put it in the crate that derives, and make the Node reader return the derived outcome too, or Node and Rust read the same old record differently.
- The real on-disk record makes the best legacy row: copying the classification of `unit-run-1794436407348-b2fc6cf2` proved the exact shape (with `cause`) that exists in the field.
- The `no-evidence` claim status also reaches the settlement fall-through, so "no claim" must be tested explicitly there, not assumed from reaching the last return.
- The pre-commit census guard fires on any touched Rust or Node file holding git sites; regenerate before the first commit to save a refused commit.
