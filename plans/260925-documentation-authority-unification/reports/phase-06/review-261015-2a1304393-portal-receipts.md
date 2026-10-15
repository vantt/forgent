# Review: reissued portal classification receipts (s6-final)

Reviewer: reviewer:claude-session:a4954387@2026-10-14
Author session: codex-session:unit-run-1792026600994-509241c8@2026-10-15
Receipt commit: ec08072e26949676703446c99a1229abc6793901
Review mode: ordinary
Request commit: 798b08e25
Content commit: 2a1304393b9b284ad9566b6542ba78554f54b100

## Scope and method

Request: `review-request-261015-2a1304393-portal-receipts.md` (2 receipts in `ledger/candidate-classifications-whole-system-portal-evidence-rework.json`), read at worktree HEAD 798b08e25 (read only). Ordinary receipt review; no sensitivity result is claimed or needed. All rows are in the sample because the population is 2. Both receipts are for `docs/platform/README.md`, section 2 Area Registry, and class `candidate-native-content`.

Checks:
- Receipt file: identical blob at `ec08072e2` and at HEAD (sha256 c6fd1776...), no change since the receipt commit; `ec08072e2` is an ancestor of `2a1304393` and of `798b08e25`; evidence commit `5f0403a00` is an ancestor of `ec08072e2`. Artifact authorSession equals the shard authorSession `codex-session:unit-run-1792026600994-509241c8@2026-10-15`, both differ from this reviewer.
- Shown text: with `buildConservationUnitLookup` from `scripts/check-doc-inventory-gates.mjs` at both `2a1304393` and `798b08e25`, each receipt finds its unit by anchor and unit digest, the shown text equals the receipt `shownText` exactly, and sha256 of that text equals `shownTextDigest` (4 of 4 lookups). `docs/platform/README.md` is blob `24916921...` at `5f0403a00`, `ec08072e2`, `2a1304393` and `798b08e25`, so the unit did not move between evidence and review.
- Bound to the live successor IDs: the working registry has `claim_1898cdaf...` for `#2-area-registry` (source digest 6c0e5ff7...) and `claim_51d4658b...` for `#unheaded-block-6` (source digest 3d92f338...), both live. `claim_ec78621f...` (the old block-6 ID the second receipt names as predecessor) is an identity gap with a different digest, so it is not used as the binding. The two pending refs in `s6-whole-system-portal-evidence-rework.json` carry receipt commit `ec08072e2`, `reviewStatus: pending` and no approval identity. The 13 other portal refs are in the other shard and are not touched.
- Gate acceptance for `candidate-native-content` (`check-doc-inventory-gates.mjs`, `acceptedCandidateClassifications`, the `receipt.class === 'candidate-native-content'` branch around line 1127): evidence `finding` is `true-and-current`; commit is a 40-hex ancestor of the receipt commit; each citation and each command input path matches `^(src|apps|core|bin|scripts|test)/`, has a 40-hex blob, and `git rev-parse` of that blob is equal at the evidence commit and at the review commit. I confirmed `scripts/check-doc-candidate-status.mjs` (789bb33e), `scripts/generate-doc-inventory.mjs` (a52981ff) and `apps/fgos/src/cli_projector.rs` (fbc44236) have exactly the cited blobs at `5f0403a00`, `ec08072e2`, `2a1304393` and `798b08e25`. Both commands have exit code 0, a non-empty `inputs` list and `outputDigest` equal to sha256 of the output text. The evidence digest, sha256 of `JSON.stringify(currentEvidence)`, is `5a8c56135a4eff5373020cbea094a5d868d4eb64b96418710b2119e4420bdaa0` for both receipts, the value in the table below. The gate only mechanically checks the code-prefix inputs; the `dataInputs` (README, owner-answers, convention rules, `operations.rs`, the archived plan) are not gate-verified, so I verified them myself next.
- Replay: I extracted both recorded commands and ran them from the worktree root at HEAD (read-only, stdout to scratch). Both exit 0 and the output is byte identical to the recorded output (sha256 97c1da10... and 2544e413...).
- Substance against the unit text: all 33 relative link targets in the portal exist (`missing: []`, which covers every route in the table, the proposal, `convention/spec.md` and the four `../architect/**` destinations); `convention` is described as implemented executable naming and placement authority with no document-body health rules, and the replay shows `convention_name`, `convention_path`, `check_paths` and `classify` implemented in `packages/convention/rust/src/operations.rs` and the rules file has only the shapes `name-template` and `placement-glob`; `archive/plans/260825-1841-knowledge-registry/plan.md` exists with `status: completed` and names foundation commit `5c948d2a4`, which is an ancestor of HEAD, while the old `plans/260825-1841-knowledge-registry/plan.md` is absent (so the line 51 path correction is right); `plans/260925-documentation-authority-unification/plan.md` exists.

Class: `candidate-native-content` is right and navigation would be wrong. The table is not only routing: it asserts that convention is an implemented executable authority, that the knowledge-registry foundation is implemented, and that the unification plan is the proposed active migration plan. A25/A27 item 3 in `owner-answers.md` says collection-index units use navigation only when they route; descriptive sentences need a content receipt. The class is in the gate's allowed list.

## Receipt verdicts

| Claim | Class | Verdict | Unit digest | Shown text digest | Note | Evidence digest |
|---|---|---|---|---|---|---|
| claim_1898cdafa7835d675526173d39eb5cd2 | candidate-native-content | ok | 6c0e5ff7b8c03d54f72f23c45545a41354cca61c384e8cf6bc2766381c185d66 | f5c1667c7fdb67315d2494ac0726098261794fc00f205d99f5b60214c199a21f | deep: Area Registry section including its table is true and current at HEAD; shown text and digest equal the live unit, evidence commands replay byte for byte, all link targets and the archived knowledge-registry plan exist, convention operations and rule shapes match the convention row, content class is right because the rows assert implemented and proposed status, not only routes | 5a8c56135a4eff5373020cbea094a5d868d4eb64b96418710b2119e4420bdaa0 |
| claim_51d4658b154804b82dbce0587b17efc0 | candidate-native-content | ok | 3d92f33871d4b07cd755cc9f55e0b304d041662961e79dcdbe15658d7700dbd2 | 3d92f33871d4b07cd755cc9f55e0b304d041662961e79dcdbe15658d7700dbd2 | deep: table block is bound to the live successor ID, not the old gap ID claim_ec78621f; same section text and evidence as the heading receipt, the archive path in the documentation-system row is current and the old plan path is absent, no unbuilt mechanism is called built | 5a8c56135a4eff5373020cbea094a5d868d4eb64b96418710b2119e4420bdaa0 |

## Notes

- Weak spot, not a rework: the two code citations are loose proof. `scripts/check-doc-candidate-status.mjs` lines 1-69 only supply the link-target helper, and `cli_projector.rs` lines 75-86 is the `convention.query` projection, which shows the convention verb is wired but not the claims of the table. The real proof is in the two replayed commands. The statement that `plan.md` is the "proposed active H1 migration plan" is checked only as a file that exists, not as a status; that is a status label and is also stated in `plan.md`, so I accept it here.
- This receipt covers section 2 only. Line 59 of the same README (decision surface table, with the legacy phase numbering of R6-3) is a different unit and is not accepted by these rows.
- The old accepted receipts for these units stay history only; nothing here is carried from them.

Unresolved: none.

Status: DONE
