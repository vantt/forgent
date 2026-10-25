# Phase 9 dependency decisions

Source/check pin: **`c94545de5b45873cb2eb419f10124283fd730a2e`** (not final pin F). Authored records only; no cutover, independent acceptance or gate closure.

## Counts

| Decision | Entries |
| --- | ---: |
| moved | 3 |
| retained-in-place | 26 |
| retired | 4 |
| **Total** | **33** |

**Seven physical records; 75 other dependencies in those records are untouched.** All original `/parked` lists and every G9 `carriedBlocker` remain open and byte-identical. WORK/docsRef, registry exports, scan-set and unrelated backlog questions are not closed by pathname policy. No pair accounting.

## Reading the decisions

- `file` is the referenced document, `consumerFile` is the source operation. Each row below names its exact original `/parked/N`, not a family-level substitute.
- The 26 retained operands are 15 decision-index, 10 end-user-index and one architecture manifest. L12-96 overrides stale conservative proposals; generated contents/parity still need the authorized exports.
- The three moved operands are the same gateway YAML unit, not three file moves. Its five reader/co-change files and prepared patches are listed below. Both YAML copies are byte-identical at this pin.
- The four `retired` rows retire legacy clause ownership/pointers (or the obsolete js-yaml obligation), **not conserved behavior**. Three already have live candidate clauses and an existing bin patch. These are clause carries, not invented physical moves to destinations absent from the conservative move set. The fourth is superseded native-YAML maintenance.

## Every original dependency

### `tests-judgment-batch4.jsonl:2` (1)

| Pointer / id | Referenced file | Decision | Sources |
| --- | --- | --- | --- |
| `/parked/0` / `dynamic-016778` | `docs/architecture-manifest.json` | **retained-in-place** | S1 |

**`dynamic-016778`** — L12-96 explicitly retains this product manifest at its existing path; no consumer retarget or new default is needed. Drop the differing candidate manifest move, not the live architecture input. Keep the architecture reader and its owning assertions on the retained source.

### `tests-judgment-batch6.jsonl:1` (1)

| Pointer / id | Referenced file | Decision | Sources |
| --- | --- | --- | --- |
| `/parked/0` / `dynamic-017973` | `docs/enduser-docs-index.json` | **retained-in-place** | S1 |

**`dynamic-017973`** — L12-96 explicitly retains this product manifest at its existing path; no consumer retarget or new default is needed. End-user index contents still regenerate through the existing generator with the authorized registry export and post-move scan set; path retention proves no serialized-content parity.

### `cli-help-messages.jsonl:3` (4)

| Pointer / id | Referenced file | Decision | Sources |
| --- | --- | --- | --- |
| `/parked/2` / `reference-003646` | `docs/decisions/index.md` | **retained-in-place** | S2 |
| `/parked/3` / `reference-003651` | `docs/decisions/index.md` | **retained-in-place** | S2 |
| `/parked/8` / `author-s4-fix2-284fae1afd0a9579` | `docs/enduser-docs-index.json` | **retained-in-place** | S1 |
| `/parked/11` / `author-s67-command-registry-manifest-861` | `docs/enduser-docs-index.json` | **retained-in-place** | S1 |

**`reference-003646`, `reference-003651`** — L12-96 Q2 overrides the conservative move proposal: keep the generated decision projection at its existing path and drop the duplicate candidate, not the real index. The recorded reader/help/default/output retains its operand. State.decisions export and generator-content parity remain separate external obligations.

**`author-s4-fix2-284fae1afd0a9579`, `author-s67-command-registry-manifest-861`** — L12-96 explicitly retains this product manifest at its existing path; no consumer retarget or new default is needed. End-user index contents still regenerate through the existing generator with the authorized registry export and post-move scan set; path retention proves no serialized-content parity.

### `gateway-contract.jsonl:2` (3)

| Pointer / id | Referenced file | Decision | Sources |
| --- | --- | --- | --- |
| `/parked/0` / `reference-000200` | `docs/contracts/fgos-gateway-api-v1.yaml` | **moved** → `docs/platform/herdr-web-dashboard/contracts/fgos-gateway-api-v1.yaml` | S3, S4, S5 |
| `/parked/1` / `dynamic-000767` | `docs/contracts/fgos-gateway-api-v1.yaml` | **moved** → `docs/platform/herdr-web-dashboard/contracts/fgos-gateway-api-v1.yaml` | S3, S4, S5 |
| `/parked/2` / `dynamic-000768` | `docs/contracts/fgos-gateway-api-v1.yaml` | **moved** → `docs/platform/herdr-web-dashboard/contracts/fgos-gateway-api-v1.yaml` | S3, S4, S5 |

**`reference-000200`, `dynamic-000767`, `dynamic-000768`** — L12-96 explicitly chooses the sole herdr-web-dashboard CTR010 contract. Both copies are byte-identical at this pin. Co-cut both actual readers, their in-file fixtures and all three maintained code citation consumers; remove the old duplicate only at authorized cutover. Preserve gateway-yaml claim carries and CTR010 identity; final-pin full-chain recompose/review and runtime proof remain owed.

### `runtime-judgment-part-22.jsonl:13` (10)

| Pointer / id | Referenced file | Decision | Sources |
| --- | --- | --- | --- |
| `/parked/3` / `reference-000232` | `docs/specs/runner.md` | **retired** | S6, S7, S8, S9, S10 |
| `/parked/4` / `reference-000235` | `docs/architect/knowledge-registry-redesign.md` | **retired** | S6, S7, S11, S12, S13 |
| `/parked/5` / `reference-000236` | `docs/architect/knowledge-registry-redesign.md` | **retired** | S6, S7, S14, S15, S16 |
| `/parked/23` / `dynamic-001360` | `docs/decisions/index.md` | **retained-in-place** | S2 |
| `/parked/24` / `dynamic-001361` | `docs/decisions/index.md` | **retained-in-place** | S2 |
| `/parked/25` / `dynamic-001363` | `docs/decisions/index.md` | **retained-in-place** | S2 |
| `/parked/33` / `dynamic-001454` | `docs/enduser-docs-index.json` | **retained-in-place** | S1 |
| `/parked/40` / `author-seam8-output-2071` | `docs/decisions/index.md` | **retained-in-place** | S2 |
| `/parked/41` / `author-seam8-output-2074` | `docs/decisions/index.md` | **retained-in-place** | S2 |
| `/parked/42` / `author-seam8-output-3029` | `docs/enduser-docs-index.json` | **retained-in-place** | S1 |

**`reference-000232`** — Retire the incorrect runner-spec attribution, not session participation or merge isolation. L12-96 family 16 and the existing s11 carry conserve the exact rule in the named live candidate contract. The sentence was never found in the alleged old spec; its real origin is the return-guard research. Reuse carries/pointer-patches.json bin delta and compose it with the other bin owners at F.

**`reference-000235`** — Retire the legacy redesign citation as a live rule owner, not the rule. L12-96 family 15 and the s11 carry bind §7.4 Attestation to the maintained knowledge-registry contract, not the proposal snapshot. Reuse the existing bin pointer patch; retain currentPath-only attestation, alias refusal and the HEAD gate. Registry end-user paths/exports are not changed by this decision.

**`reference-000236`** — Retire the legacy redesign citation as a live rule owner, not the rule. L12-96 family 15 and the s11 carry bind §8 Producer Enforcement to the maintained knowledge-registry contract, not the proposal snapshot. Reuse the existing bin pointer patch; retain currentPath-only attestation, alias refusal and the HEAD gate. Registry end-user paths/exports are not changed by this decision.

**`dynamic-001360`, `dynamic-001361`, `dynamic-001363`, `author-seam8-output-2071`, `author-seam8-output-2074`** — L12-96 Q2 overrides the conservative move proposal: keep the generated decision projection at its existing path and drop the duplicate candidate, not the real index. The recorded reader/help/default/output retains its operand. State.decisions export and generator-content parity remain separate external obligations.

**`dynamic-001454`, `author-seam8-output-3029`** — L12-96 explicitly retains this product manifest at its existing path; no consumer retarget or new default is needed. End-user index contents still regenerate through the existing generator with the authorized registry export and post-move scan set; path retention proves no serialized-content parity.

### `setup-doctor-roots.jsonl:21` (13)

| Pointer / id | Referenced file | Decision | Sources |
| --- | --- | --- | --- |
| `/parked/1` / `reference-003816` | `docs/decisions/index.md` | **retained-in-place** | S2 |
| `/parked/6` / `dynamic-014318` | `docs/enduser-docs-index.json` | **retained-in-place** | S1 |
| `/parked/7` / `dynamic-014329` | `docs/enduser-docs-index.json` | **retained-in-place** | S1 |
| `/parked/8` / `dynamic-014330` | `docs/enduser-docs-index.json` | **retained-in-place** | S1 |
| `/parked/9` / `dynamic-014334` | `docs/decisions/index.md` | **retained-in-place** | S2 |
| `/parked/10` / `dynamic-014335` | `docs/decisions/index.md` | **retained-in-place** | S2 |
| `/parked/11` / `dynamic-014336` | `docs/decisions/index.md` | **retained-in-place** | S2 |
| `/parked/12` / `dynamic-014337` | `docs/decisions/index.md` | **retained-in-place** | S2 |
| `/parked/13` / `dynamic-014343` | `docs/decisions/index.md` | **retained-in-place** | S2 |
| `/parked/14` / `dynamic-014344` | `docs/decisions/index.md` | **retained-in-place** | S2 |
| `/parked/36` / `author-s4-fix2-2a45460821f48dec` | `docs/enduser-docs-index.json` | **retained-in-place** | S1 |
| `/parked/37` / `author-s4-fix2-a8e9503a9eafcad1` | `docs/enduser-docs-index.json` | **retained-in-place** | S1 |
| `/parked/38` / `author-s4-fix2-70cc3f725650c613` | `docs/decisions/index.md` | **retained-in-place** | S2 |

**`reference-003816`, `dynamic-014334`, `dynamic-014335`, `dynamic-014336`, `dynamic-014337`, `dynamic-014343`, `dynamic-014344`, `author-s4-fix2-70cc3f725650c613`** — L12-96 Q2 overrides the conservative move proposal: keep the generated decision projection at its existing path and drop the duplicate candidate, not the real index. The recorded reader/help/default/output retains its operand. State.decisions export and generator-content parity remain separate external obligations.

**`dynamic-014318`, `dynamic-014329`, `dynamic-014330`, `author-s4-fix2-2a45460821f48dec`, `author-s4-fix2-a8e9503a9eafcad1`** — L12-96 explicitly retains this product manifest at its existing path; no consumer retarget or new default is needed. End-user index contents still regenerate through the existing generator with the authorized registry export and post-move scan set; path retention proves no serialized-content parity.

### `generators-skills-and-support.jsonl:66` (1)

| Pointer / id | Referenced file | Decision | Sources |
| --- | --- | --- | --- |
| `/parked/0` / `author-s4-08912b8301b10321` | `docs/specs/distribution.md` | **retired** | S6, S7, S17, S18, S19, S20, S21, S22 |

**`author-s4-08912b8301b10321`** — The old family-18 carry has been superseded, not promoted as an executable js-yaml upgrade instruction. Current backlog marks p-8d04c7f1 done because the vendored file is deleted; the candidate decision explicitly keeps the former procedure historical and points current YAML maintenance to the native contract and upgrade record. G9 row 46 already retires this removed binding. Do not replay the old backlog pointer patch or clear the unrelated surviving STR70a/STR62 owner question.

## Conserved clauses and superseded obligation

| Original id | Successor clause | Treatment |
| --- | --- | --- |
| `reference-000232` | `docs/platform/runner/contracts/conserved-dispatch-doctrine.md#session-participation-and-merge-isolation` | Conserved rule; retire the incorrect attribution; existing bin patch S28. |
| `reference-000235` | `docs/platform/work-state/contracts/knowledge-registry.md#74-attestation` | Conserved attestation rule; existing bin patch S28. |
| `reference-000236` | `docs/platform/work-state/contracts/knowledge-registry.md#8-producer-enforcement` | Conserved producer gate; existing bin patch S28. |
| `author-s4-08912b8301b10321` | `docs/platform/packaging-distribution/decisions/vendored-yaml-parser.md#upgrade-and-advisory-procedure` | Historical successor only; current maintenance follows the native YAML contract, not the retired vendored procedure. |

## Gateway readers and prepared patches

The R26 unit includes all six runtime reader slots plus its citation/fixture co-changes; its exact operation ids are in JSON. Basename-only type/test comments are not extra file readers. Historical package-parser observations remain history.

| Reader / co-change file | Existing prepared body |
| --- | --- |
| `apps/fgos-gateway/Cargo.toml` — maintained contract citation co-cut; not a runtime file reader | S23 |
| `apps/fgos-gateway/src/gateway.rs` — runtime contract read and in-file test fixture co-cut | S24 |
| `apps/fgos-gateway/src/mcp.rs` — runtime contract read and in-file test fixture co-cut | S25 |
| `apps/fgos-gateway/web/src/api/client.ts` — maintained contract citation co-cut; not a runtime file reader | S26 |
| `apps/fgos-gateway/web/src/api/types.ts` — maintained contract citation co-cut; not a runtime file reader | S27 |

The existing session/attestation source-only bin patch is S28. It is a delta, not a license to overwrite other bin owners. The already-retired js-yaml backlog row needs **no new patch**; the historical backlog patch must not be replayed for that removed row.

## Proposals and remaining work

**leadDecisionProposed: 0.** Every path or clause outcome is already settled by L12-96, the existing s11 conserved holders, or the later explicit native-YAML supersession. This packet resolves the local policy question; it does not perform the cutover or grant semantic acceptance.

- Lead integrates the five referenced gateway body patches with the full shared-file chain at F, whole-file digest guarded, preserving CTR010 and gateway-yaml claim carries; rerun owning HTTP/MCP fixture and actual-read proofs after the move.
- Lead integrates the existing carries bin pointer delta with the other prepared bin bodies at F; final-pin drift reopens source bindings, not already settled path policy.
- Retain the three manifest paths, regenerate contents through owning generators and verify against the authorized bounded exports. WORK/registry export dependencies remain external and unchanged.
- Archive refs/partition are a plan-evidence custody design at their own historical pin. Rebuild at F; do not interpret archive records as permission to remove product inputs.
- The superseded js-yaml backlog binding has no live patch to apply. Preserve the separate backlog-owner replacement question; do not replay stale whole-file patches.

Archive partition covers the seven source record files as proposed archived evidence, with pre-freeze gate input retention. It partitions this plan, not the docs tree. Evidence: S29, S30, S31, S32, S33. Rebuild it at F; archive publication is outside this task.

## Source locators

All citations below resolve at the source pin; JSON stores SHA-256 for each cited blob and exact JSON pointers or quotes. Numeric source lines are explanatory only; the checker authenticates bytes and selectors.

- **S1** — `plans/260925-documentation-authority-unification/reports/phase-08/owner-answers.md` — line 1378: - Retain `docs/enduser-docs-index.json` (family 7); its content regeneration remains family 2's separate obligation. Retain `docs/architecture-manifest.json` (family 22) and drop its differing candidate copy from the move set at Step 7.
- **S2** — `plans/260925-documentation-authority-unification/reports/phase-08/owner-answers.md` — line 1368: Keep `docs/decisions/index.md` as the generated projection. Family **6's 51 parks become preserve at Step 7**, with this ruling as witness; drop the duplicate candidate `docs/knowledge/decisions-index/decision-record.md` from the move set at that step. Family 3 still needs Q1's `state.decisions` export and generator parity; retaining the output path does not prove its contents.
- **S3** — `plans/260925-documentation-authority-unification/reports/phase-08/owner-answers.md` — line 1379: - Move `docs/contracts/fgos-gateway-api-v1.yaml` to the herdr-web-dashboard contract; repoint `gateway.rs`, `mcp.rs` and tests and delete the duplicate at cutover (families 12 and 21), preserving CTR010 identity and the `gateway-yaml-*` carry obligations.
- **S4** — `plans/260925-documentation-authority-unification/reports/phase-08/step-05-cutover-move-set.json` — JSON pointer `/paths/993`
- **S5** — `plans/260925-documentation-authority-unification/reports/phase-08/step-05-proposed-move-read-units.json` — JSON pointer `/units/4`
- **S6** — `plans/260925-documentation-authority-unification/reports/phase-08/owner-answers.md` — line 1381: - Carry the **44 missing claims verbatim** into live holders at Step 7 / Phase 9: families 14 (13), 15 (12), 16 (11) and 18 (8). Bind exact passages and holders at Step 7, then apply carriage and pointer patches at cutover; rendered copies follow core sources. No locked law changes.
- **S7** — `plans/260925-documentation-authority-unification/phase-09-atomic-platform-authority-cutover.md` — line 138: 6. delete maintained files under `docs/specs/**` and `docs/architect/**` only
- **S8** — `plans/260925-documentation-authority-unification/reports/phase-09/carries/claim-carries.json` — JSON pointer `/claims/32`
- **S9** — `plans/260925-documentation-authority-unification/ledger/decisions/s11-preflip-carries.json` — JSON pointer `/conservedClaims/32`
- **S10** — `docs/platform/runner/contracts/conserved-dispatch-doctrine.md` — line 23: ## Session Participation And Merge Isolation
- **S11** — `plans/260925-documentation-authority-unification/reports/phase-09/carries/claim-carries.json` — JSON pointer `/claims/15`
- **S12** — `plans/260925-documentation-authority-unification/ledger/decisions/s11-preflip-carries.json` — JSON pointer `/conservedClaims/15`
- **S13** — `docs/platform/work-state/contracts/knowledge-registry.md` — line 210: ### 7.4 Attestation
- **S14** — `plans/260925-documentation-authority-unification/reports/phase-09/carries/claim-carries.json` — JSON pointer `/claims/16`
- **S15** — `plans/260925-documentation-authority-unification/ledger/decisions/s11-preflip-carries.json` — JSON pointer `/conservedClaims/16`
- **S16** — `docs/platform/work-state/contracts/knowledge-registry.md` — line 226: ## 8. Producer Enforcement
- **S17** — `plans/260925-documentation-authority-unification/reports/phase-09/carries/claim-carries.json` — JSON pointer `/claims/38`
- **S18** — `plans/260925-documentation-authority-unification/ledger/decisions/s11-preflip-carries.json` — JSON pointer `/conservedClaims/38`
- **S19** — `docs/backlog.md` — line 71: - [p-8d04c7f1] Watch js-yaml security advisories (the vendored file is deleted; every YAML parse is the pinned Rust crate under RUL107 (a third-party crate under a component contract is pinned exactly with an upgrade record and acceptance tests) and RUL108 (every YAML parse goes through the native door)) — done
- **S20** — `docs/platform/packaging-distribution/decisions/vendored-yaml-parser.md` — line 28: fallback, vendored js-yaml bundle or bundle-hash test to maintain.
- **S21** — `plans/260925-documentation-authority-unification/reports/phase-09/g9/judgments.json` — JSON pointer `/rows/46`
- **S22** — `docs/platform/packaging-distribution/decisions/vendored-yaml-parser.md` — line 19: ## Upgrade And Advisory Procedure
- **S23** — `plans/260925-documentation-authority-unification/reports/phase-09/g9/recomposed.json` — JSON pointer `/specs/54`
- **S24** — `plans/260925-documentation-authority-unification/reports/phase-09/g9/recomposed.json` — JSON pointer `/specs/55`
- **S25** — `plans/260925-documentation-authority-unification/reports/phase-09/g9/recomposed.json` — JSON pointer `/specs/56`
- **S26** — `plans/260925-documentation-authority-unification/reports/phase-09/g9/recomposed.json` — JSON pointer `/specs/59`
- **S27** — `plans/260925-documentation-authority-unification/reports/phase-09/g9/recomposed.json` — JSON pointer `/specs/61`
- **S28** — `plans/260925-documentation-authority-unification/reports/phase-09/carries/pointer-patches.json` — JSON pointer `/patches/13`
- **S29** — `plans/260925-documentation-authority-unification/phase-09-atomic-platform-authority-cutover.md` — line 145: 8. regenerate projections and indexes;
- **S30** — `plans/260925-documentation-authority-unification/reports/phase-09/archive/design.md` — line 19: No product module or test is retired.
- **S31** — `plans/260925-documentation-authority-unification/reports/phase-09/archive/audit/partition.json.gz` — JSON pointer `/counts`
- **S32** — `plans/260925-documentation-authority-unification/reports/phase-09/archive/audit/gate-retention.json.gz` — JSON pointer `/schedule`
- **S33** — `plans/260925-documentation-authority-unification/reports/phase-08/step-05-cutover-move-set.json` — JSON pointer `/sourceNotes`

## Verification and limits

Run from repo root: `python3 -B plans/260925-documentation-authority-unification/reports/phase-09/g9/check_phase9_decisions.py --pin c94545de5b45873cb2eb419f10124283fd730a2e`.

**Actual check: exit 0 / `status: pass`**, 33 entries, 26 retained / 3 moved / 4 retired, zero proposals, 41 pinned files checked, five moved reader/co-change files, 75 other dependencies untouched. `git diff --check` also exits 0. Only the three granted new files appear in `git status --short`.

The checker independently extracts all 33 original dependencies (including the session dependency phrased “Phase 9 must”), rejects missing/duplicate/extra rows, checks physical record hashes, exact evidence blobs/quotes/pointers and every structured cited file at the pin, checks moved destinations against the existing move set, compares gateway copy bytes and joins the complete owning R26 reader/co-change set to prepared body patches. It reads the archive partition without rewriting it.

**14 negative controls pass:** each real checker CLI invocation exits 1 for a missing entry, duplicate entry, wrong pointer, nonexistent cited path, bad citation digest, absent quote, nonexistent JSON pointer, existing destination outside the move set, missing moved reader, missing moved patch, wrong retained file, wrong clause successor, wrong physical record hash and wrong pin. Controls use `--decisions` with mutated copies in one unique `tempfile.TemporaryDirectory` below `/tmp/fgos-work/`; the directory is removed on exit, and the base is removed only if this turn created it and it remains empty. The first control wrapper exited 1 before running any control because the base directory did not exist; the corrected wrapper safely creates the base and all 14 controls pass. No test-only branch or production check is bypassed.

Prior art reused: L12-96 park-family resolutions, conservative R26 move/read units, s11 clause bindings, existing carries pointer deltas and G9 whole-file recomposition. No new product mechanism. **impact-analysis: degraded** (fgOS CLI forbidden; no impact-analysis MCP available); this adds a standalone records checker and edits no existing symbols. No product tests, native addons, lifecycle, Git writes, live docs/ledgers, state/secrets or preview service were used.
