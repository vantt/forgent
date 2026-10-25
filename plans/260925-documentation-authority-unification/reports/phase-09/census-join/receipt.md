# Census join locator correction receipt

## Current correction

Pin: `608a4ada5f195b0d0b9d3568a71b8dde4954aacb` (HEAD at this turn's start). Authority: L13-20.3 and `../w23-register-corrections-brief.md`. `join.py` no longer falls back to an arbitrary first evidence span when re-pinned: it uses an explicit, evidence-validated `correctedLocator`, otherwise the newest same-file witness by Git ancestry (author's primary-span order only within one witness pin). No same-file witness, incomparable witnesses, invalid correction or source-digest drift fails loudly. The returned pin remains the actual evidence pin, never falsely relabelled as current.

The three recorded W21 corrections are restored: **pc-d-1101 :30**, **pc-d-0924 :3868**, **pc-d-0449 :184**, all at `5820ca678`. Generic newest-witness selection also refreshes 22 other historical locators to their already-recorded later evidence; all old evidence spans are retained. This changes locator metadata, not dispositions or proof ownership. The three source-bound corrections are explicit in `settlement-decisions.json`, whose sourceCommit is re-pinned; no ledger, review or product file changes.

Replay remains **1,126 ids = 779 proof joins + 289 unchanged grade REJECTs + 54 settlement REJECTs + 4 citations**, zero residue. Both join runs are byte-identical in stdout/stderr and all five generated packets (`join.json`, `residue.json`, `settlement.json`, `citation-bindings.json`, `pointer-patches.json`). The four unapplied comment retargets now have an explicit G2 F-chain duty in the generated gate register; their hashes are not claimed as applied. No final-pin delta rescan or F proof is claimed.

Current commands/exits (`P=plans/260925-documentation-authority-unification/reports/phase-09`):

| Command | Exit | Evidence |
|---|---:|---|
| `python3 -B P/census-join/citations.py --pin 608a4ada5f195b0d0b9d3568a71b8dde4954aacb` | 0 | `locator-proof.json`; 4 citations, 5 bindings, 8 zero-fuzz forward/rollback patch replays |
| `python3 -B P/census-join/join.py --pin 608a4ada5f195b0d0b9d3568a71b8dde4954aacb`, twice | 0 / 0 | `locator-proof.json`, identical output hashes |
| `python3 -B P/census-join/test_locators.py` | 0 | `../g0join/tests.json`; 3 owning record-only tests |
| `python3 -B P/g0join/test_join.py` | 0 | `../g0join/tests.json`; 10 owning record-only tests |
| `python3 -B P/g0join/join.py --pin 608a4ada5f195b0d0b9d3568a71b8dde4954aacb`, twice | 1 / 1 | Expected honest verdict gaps, not a census failure; `../g0join/receipt.md` |
| `python3 -B P/gate-reconcile/reconcile.py`, twice | 0 / 0 | `../gate-reconcile/corrections-proof.json` |
| `python3 -B P/gate-reconcile/verify.py` | 0 | Record integrity only; volatile checkedAtHead restored |
| `python3 -B P/gate-reconcile/controls.py` | 0 | 14 rejecting controls, all original controls retained |
| `git diff --check` | 0 | Whitespace proof |

Final replay and metadata/disposition assertions are in `../gate-reconcile/corrections-proof.json`. The initial generator attempt exited 1 on a stale G5 external-list consumer after ownerItems separation; that consumer was migrated and the duty preserved (`../gate-reconcile/corrections-attempts.json`). Impact-analysis remains degraded/unqueried under the no-fgOS-CLI/no-MCP boundary. All Node children inherit `--no-addons`; Python uses `-B`; citation scratch is tempfile-only under `/tmp/fgos-work/` and removed. No product tests/suite, native addons, Git writes, pair accounting, lifecycle calls, preview service or out-of-scope writes. `needsWrites: []`.

## Historical catch-up

The following receipt remains historical at cf13e2bd; its old pin references and claims are not this turn's replay.

Pin: `cf13e2bd22ce390344837560b35b41adf7da1238` (HEAD at catch-up start). Authority: `w21-register-catchup-brief.md`, L12-137 / L13-17–19. W20 reviews the settlement and citations; W21 A independently approves the caller/description rework. **G2 is met-local with zero open original-census judgments** after the L13-19.1 REJECT ruling below, not final-met. No product test ran. The detailed caller audit below remains historical at `5820ca6780ff6eec28afe09a128ac95fcd11d06c`; source bytes for its files are unchanged at the current pin.

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
- `pc-d-0288`: **confirmed REJECT / non-document rendering**, under `owner-answers.md` **L13-19.1**, superseding the W21 A approved owned park. Locator: `cf13e2bd22ce390344837560b35b41adf7da1238:test/event-store/migrate-cutover-grant.test.mjs:34`, the `hostScan` helper's `assert.fail` message template. It renders only when the test fails, after clean returns at :30 and namespace-refusal skips at :31–32. It is neither a document citation nor data read by a product path. Adding a deliberately failing test would add nothing. The decision and settlement carry this reason and source-bound evidence; `join.json` has no owning proofs for this REJECT, and `residue.json` is empty. No owner action remains on this row and no product test was added or executed.

Reuse: the existing pinned settlement layer supports explicit owning-test overrides, confirmed REJECTs and owned parks, including explicitly listed corrections of same-file automatic joins. Unrelated ids still fail. The REJECT update now clears superseded automatic proofs, just as the park branch already did: no false branch-owning test is retained on 0288. `additionalDrift` stays 4; the two audit corrections stay separate. No scanner grammar or product mechanism was added.

## Census and historical custody

All **1,126 ids / 140 files** are retained: **779 owning-test joins + 289 unchanged grade confirmations + 54 settlement REJECTs + 4 citation joins = 1,126**; **zero owned parks/open original judgments**. The original 187 dispositions are unchanged in number: 134 joined, 49 REJECT, four citation joins. The four additional drifted grades remain REJECT. Two separate helper corrections bring the settlement packet to **193 rows**.

The four citation bindings and unapplied comment patches were reproduced at this pin using unchanged `citations.py`; only pin metadata changed. W20 B independently approved their holders and zero-fuzz retargets. Their existing packet fields still say `reviewStatus: pending` / `independentApproval: false` because the generator does not mint approval; the review is linked by the gate register. Shared-file composition remains at F; no code patch is applied or runtime parity claimed. Historical `post-pin-literals.json` / `post-pin-dynamics.json` remain at `3d0169f39`; no fresh delta or final-F coverage is claimed. Original grade records and ledgers were not edited. The gate register is generated only by `gate-reconcile/reconcile.py`.

Historical custody: the prior rework added the `25e8842d3dcc2e359dc930de086484629a275357` entry to `archive/receipt.json /postMeasurementEdits`; W21 A approved it. This catch-up makes **no archive write**. Likewise `helper-audit.json`, old `replay.json`, `receipt.json` and the other earlier verification artifacts retain their historical pins; current replay evidence is `gate-reconcile/catchup-proof.json`.

## Proofs

Let `P=plans/260925-documentation-authority-unification/reports/phase-09`. Current exact argv, exits, stdout/stderr and output hashes are in **`gate-reconcile/catchup-proof.json`**.

| Command | Exit | Evidence |
|---|---:|---|
| `python3 -B P/census-join/join.py --pin cf13e2bd22ce390344837560b35b41adf7da1238` — final run 1 | 0 | catch-up log |
| Same command — final run 2 | 0 | stdout, stderr and all five join/citation outputs byte-identical |
| `python3 -B P/g5/check.py --pin b57e79625` | 0 | byte-identical to `g5/check-b57e79625.json`; 31 controls |
| `python3 -B P/gate-reconcile/verify.py` | 0 | current `gate-reconcile/verification.json`; volatile `checkedAtHead` restored afterward |
| `python3 -B P/gate-reconcile/controls.py` | 0 | current `gate-reconcile/controls.json`; positive proof and 10 rejecting controls |
| `python3 -B P/census-join/citations.py --pin cf13e2bd22ce390344837560b35b41adf7da1238` | 0 | existing generator; every join also runs its `--check` and eight zero-fuzz forward/rollback replays |
| Record assertions after final replay | 0 | zero residue; all 54 settlement REJECTs have empty proofs; expected status counts |

To reproduce from the repository root, first regenerate the existing citation packet with the command above, then run the pinned join twice with `NODE_OPTIONS=--no-addons`; compare `join.json`, `residue.json`, `settlement.json`, `citation-bindings.json`, `pointer-patches.json`, stdout and stderr. These are the five outputs recorded by hash in the catch-up proof. No delta rescan or final-F claim is made.

An initial pair of joins exited 0 and matched byte-for-byte, but a subsequent record assertion caught stale automatically inferred proofs on 0288's new REJECT. The existing REJECT update now clears them. The final two runs above and the empty-proof assertions prove that correction; the initial wrapper exited 1 and is disclosed separately in the catch-up log, not counted as passing evidence.

Prior art: `bade6b6b3` introduced the join, `b25dadae2` pin/delta custody, `4e49c3008` the settlement layer, `408078b9a` citation bindings, and `25aa41510` branch-taking corrections approved by W21. Reused the Node-bundled Acorn locator, Rust grammar, original register/grades and gate verifier/controls. Impact-analysis: **degraded/unqueried** under the no-fgOS-CLI/no-MCP boundary; direct source/history review was used. No git mutation, fgOS/lifecycle command, pair accounting, product test/suite, native addon, docs/source/test/ledger edit or preview service. Every Node descendant inherited `--no-addons`. Scratch tempfile directories were confined to `/tmp/fgos-work/` and removed. `needsWrites: []`.
