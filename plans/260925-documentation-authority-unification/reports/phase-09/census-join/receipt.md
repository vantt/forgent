# Census join rework receipt

Pin: `5820ca6780ff6eec28afe09a128ac95fcd11d06c` (HEAD at start). Authority: `w20-census-join-rework-brief.md`, L12-137 / L13-17, after `reviews/w20-census-settlement-review.{md,json}`. **Records rework complete; G2 remains `partial`, pending independent review.** One newly identified failure-branch occurrence is explicitly parked. No product test ran.

## Corrected owning-test joins

`settlement-decisions.json` is the source-bound input; `settlement.json` records each full test title, file, test-call line, source digest and evidence spans. All seven requested joins have a verified branch-taking caller, so none of these seven needed parking.

Let `F=test/helpers/failover-fixture.mjs`, `T=test/runner/execution/run-provider-failover.test.mjs`, and `L=test/runner/documentation-cutover-lease.test.mjs`.

| Id | Cited expression | Actual test and call chain |
|---|---|---|
| `pc-d-0446` | F:157, `llmAccounts && …` | T:491 → `setup` at T:492 with nonempty pool/accounts at T:494–497 → F:157 account-map branch, including login/home construction at F:158–160 |
| `pc-d-0448` | F:182, `summaryOf` | T:19 → `summaryOf` at T:51 → `unitDirOf` / `readJson` and `unit-summary.json` |
| `pc-d-0450` | F:188, panel seats | T:179 → `panel('u-panel-rotate')` at T:189 → nonempty `[1,2,3].map` at F:188 |
| `pc-d-0453` | F:202, assignments directory | T:331 → `unitRuns` at T:341 / 347 → unconditional F:202 construction, then existing-directory enumeration |
| `pc-d-0454` | F:202, same construction | T:360 → `unitRuns` at T:363 → F:202 before the existence/empty-result branch |
| `pc-d-0479`, `pc-d-0480` | L:37, returned `worktree` closure | L:67 → `f.worktree()` / `f.worktree('other')` at L:68 → closure body at L:37, including default branch `holder`; fixture construction alone is insufficient |

The receipt's former generic `llmAccounts` claim is replaced by the specific `pc-d-0446` chain above: **T:491 supplies the pool accounts; T:19 does not.**

Description/evidence corrections:

- `pc-d-0447` describes `attemptsOf`, called at T:501, not pool-account creation.
- `pc-d-0449` describes `selectedAccount` → F:184 `runFile` → F:183, called at **T:510**. The review suggested T:508; re-reading the pinned blob shows T:508 starts the next run, while T:510 calls `selectedAccount`.
- `pc-d-0924` describes and binds the JSON response return at `bin/fgos.mjs:3868`, not the acquire options at :3867. REJECT remains scalar response rendering.
- `pc-d-1101` binds the surviving `path.join(cwd, '.fgos')` at `src/setup/seat-binding-checks.mjs:30`. It supplies runtime/config state to `createSeatBindingClient`, not a documentation root; the expression is not absent. REJECT remains valid.

## Same-file helper/closure audit

`helper-audit.json` enumerates **129 rows: 116 JS helper rows and 13 Rust helper/subprocess rows**. It records the original named tests, pinned call-site evidence, branch review and corrections. The population is indirect same-file joins outside a lexical test callback, including the two ignored subprocess occurrences owned by their non-ignored parent and the explicit config-writer successor join `pc-d-0618` (test :235 → `setup` :236 → `writeProjectConfig` :85). Module imports/constants and direct lexical/template-title joins are not counted as indirect helpers. All three same-file joins with `currentLine: null` were checked; the other two successors (`pc-d-0396`, `pc-d-0678`) are directly inside their named tests.

**4 rows fixed:** the two requested worktree rows plus two additional rows. Equivalently, **127 other rows audited, 2 additional rows fixed**; the remaining 125 retain their joins.

- `pc-d-0245`: restrict `rawCli` to the test at `test/e2e/documentation-cutover-lease-hooks.test.mjs:155`: `f.setupLease()` :157 → `cli` :106 → `rawCli` :100 → body :96. The old broad fixture join also named :122, :688 and :713, which never invoke this closure.
- `pc-d-0288`: **owned park**, `test/event-store/migrate-cutover-grant.test.mjs:34`. The template is evaluated only in `hostScan`'s `assert.fail` arm. Its seven callers perform real baseline scans; clean returns at :30 and namespace-refusal skips at :31–32 never evaluate it. No test deliberately takes the cited failure arm. The park has no owning proofs in either `join.json` or `residue.json`.

Park owner: **Documentation integration Lead / independent census reviewer (L13-17)**. Before F, independently rejudge this assertion-message occurrence as non-document rendering, or bind a genuine branch-owning test. No product test was added or executed.

Reuse: the existing pinned settlement layer already supports explicit owning-test overrides and owned parks. Its admission check now also admits an explicitly listed correction of an existing same-file automatic join; unrelated ids still fail. The existing park update clears superseded automatic proofs. `additionalDrift` stays 4; the two audit corrections are counted separately, not relabeled as grade drift. No scanner grammar or product mechanism was added.

## Census and historical custody

All **1,126 ids / 140 files** are retained: **779 owning-test joins + 289 unchanged grade confirmations + 53 settlement REJECTs + 4 citation joins + 1 owned park = 1,126**. The original 187 dispositions are unchanged in number: 134 joined, 49 REJECT, four citation joins. The four additional drifted grades remain REJECT. Two separate helper corrections bring the settlement packet to **193 rows**.

The four citation bindings and unapplied comment patches were reproduced at this pin using the unchanged `citations.py`; only their pin metadata changed. They remain pending review/shared-file composition, not applied code edits or runtime proofs. Historical `post-pin-literals.json` / `post-pin-dynamics.json` remain at `3d0169f39`; no fresh delta or final-F coverage is claimed. Original grade records, register and ledgers were not edited.

`archive/receipt.json` changes **only `postMeasurementEdits`**, adding commit `25e8842d3dcc2e359dc930de086484629a275357` and its exact receipt-status/proof-summary changes after the Lead measurement. Existing historical sandbox custody and all other fields remain unchanged.

## Proofs

Let `P=plans/260925-documentation-authority-unification/reports/phase-09`. `replay.json` contains exact argv, stdout/stderr, output hashes, the output-only adapter source and historical replay custody.

| Command | Exit | Evidence |
|---|---:|---|
| `python3 -B P/census-join/join.py --pin 5820ca6780ff6eec28afe09a128ac95fcd11d06c` — final run 1 | 0 | `replay.json` |
| Same command — final run 2 | 0 | stdout, stderr and all three outputs (`join.json`, `residue.json`, `settlement.json`) byte-identical |
| `python3 -B P/gate-reconcile/verify.py` through the output-only scratch adapter | 0 | `gate-verification.json`; unchanged checker, real input reads and read-only git |
| `python3 -B P/gate-reconcile/controls.py` through the same adapter | 0 | `gate-controls.json`; positive proof and all 9 rejecting controls |
| `python3 -B P/census-join/citations.py --pin 5820ca6780ff6eec28afe09a128ac95fcd11d06c --check` | 0 | byte-identical bindings/patches, eight zero-fuzz forward/rollback replays |
| Record assertions after final replay | 0 | `replay.json /recordAssertions`: requested owners, separate counts, empty proofs on the park |
| `git diff --check` and scoped artifact validation | 0 | `validation.json` |

The adapter executes each unmodified gate script with `runpy` as `__main__`, redirecting **only its final result write** to a tempfile; the emitted bytes are copied into `census-join`. It changes no check, input, assertion or git behavior. This avoids even a transient out-of-scope write. The existing `gate-reconcile/verification.json` and `controls.json`, including volatile fields, remain byte-identical; their preserved hashes are in `replay.json`. G2 remains `partial` in the untouched register.

One earlier join attempt correctly rejected the review-suggested T:508 evidence line; it was corrected to T:510. A subsequent record inspection found and removed stale automatic proofs from the new park; the final two runs and empty-proof assertions cover that correction. These attempts are disclosed separately in `replay.json`, not counted as the final deterministic proof.

Prior art: `bade6b6b3` introduced the join, `b25dadae2` added pin/delta custody, `4e49c3008` added the settlement layer, and `408078b9a` bound citations. Reused the Node-bundled Acorn locator, existing Rust grammar, original register/grades and gate verifier/controls. Impact-analysis: **degraded/unqueried**, because the brief forbids fgOS CLI and no impact-analysis MCP is exposed; direct source/history review was used. No Git mutation, fgOS/lifecycle command, pair accounting, product suite/test, native addon, docs/source/test/ledger/register edit or preview service. Every Node child in the proofs inherited `--no-addons` and a scratch `process.dlopen` block. Scratch was restricted to tempfile directories under `/tmp/fgos-work/` and removed. `needsWrites: []`.
