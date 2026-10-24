# Imported documentation re-sync — authored and verified

**Status: done for the W11 author assignment; independent review pending. No gate acceptance or cutover.**

Input HEAD: `814c06f3dca5bebcc2521fac4ff31d0248b3660d`. `needsWrites: []`.
Read first: [W11 brief](../w11-import3-resume-brief.md), [machine receipt](receipt.json), [merge accounting](merge-accounting.json), [binding refresh](binding-refresh.json), [source bindings](../../../ledger/decisions/s18-import3-resync.json), [commands](checks-w11.json), [scanner proof](scanner-proof.json).

## Accounting and carriage

The existing import accounting is retained and refreshed: merge `571a996f5`, exact parents/base, **69 commits / 119 changed paths / 8 documentation paths**. All four incoming platform files have dual-frozen-extractor checks (**608 complete units**, sole effective incoming direct binding valid). No invented bindings on zero-bound incoming files. The phase contract already records their union obligation; it needed no further edit.

The original `source-triage.json` remains the immutable blocked-turn intake. All **24 units** are now carried or explicitly bound: confinement **18**, navigation **2**, Seat Binding **4**; **16 exact / 8 adapted**. `current-source-triage.json` reports zero unproven units. Existing holders were reused:

- Confinement: 9 probes, 10 with blind; complete §9.3 machine-private-root masking, `FGOS_CONFINED` caveat, limits/falsifier, rollout, settled facts and dated decision. Preserve the existing live-migration/invocation corrections and CTR011 correction; do not revive stale legacy assertions.
- Navigation: only the two imported entry lines changed in section 5. L11-25 transition banner, both knowledge routes and all prior truth/link corrections remain byte-preserved. No second detailed map.
- Seat Binding: global `rigorToTier` refusal and the dated removal of `dropRetiredGlobalKeys`; retain existing rebased links and the historical 2026-10-23 decision.

## Binding proof

The declared sorted compact UTF-8 JSON + LF recipe and self-inclusive heading ancestry are reused, with both unchanged frozen extractors. Full source units, input preimages and both neighbours are retained (long strings are digest-interned, not omitted).

**63 effective rows** refreshed across five existing generated shards: **33 content / 30 anchor-or-placement**. Every changed row is pending review. The frozen ownership reader also reads superseded direct claims: **11 stale origins** were materialized from their existing terminal overlays, and **11 explicit predecessor identities** refreshed so supersession chains remain intact. Original rows/identities are preserved in the proof. **171 other historical predecessors** remain untouched. No owning proof was edited or weakened. **314 current effective bindings** pass replay, including all 24 new source rows.

Every intake unit and its complete successor anchor is below; row number is its `sourceBindings` index. The JSON shard includes source/target digests, ancestry, content, placement, reason and complete changed-source-line witnesses for adaptations. Adapted does not mean independently approved.

| Row | Source unit | Existing successor anchor | Carry |
|---:|---|---|---|
| 0 | `confinement-authority.md#unheaded-block-1` | `docs/platform/agent-confinement/spec.md#unheaded-block-1` | exact |
| 1 | `confinement-authority.md#spec-agent-confinement-authority` | `docs/platform/agent-confinement/spec.md#spec-agent-confinement-authority` | adapted |
| 2 | `confinement-authority.md#unheaded-block-2` | `docs/platform/agent-confinement/spec.md#unheaded-block-4` | adapted |
| 3 | `confinement-authority.md#92-hostread-blind-worker-mù-trước-run-state-của-peer` | `docs/platform/agent-confinement/spec.md#92-hostread-blind-worker-mù-trước-run-state-của-peer` | exact |
| 4 | `confinement-authority.md#unheaded-block-122` | `docs/platform/agent-confinement/spec.md#unheaded-block-55` | exact |
| 5 | `confinement-authority.md#unheaded-block-126` | `docs/platform/agent-confinement/spec.md#unheaded-block-59` | exact |
| 6 | `confinement-authority.md#93-machine-private-roots-thư-mục-riêng-của-máy-che-với-mọi-worker` | `docs/platform/agent-confinement/spec.md#93-machine-private-roots-thư-mục-riêng-của-máy-che-với-mọi-worker` | exact |
| 7 | `confinement-authority.md#unheaded-block-127` | `docs/platform/agent-confinement/spec.md#unheaded-block-60` | exact |
| 8 | `confinement-authority.md#unheaded-block-128` | `docs/platform/agent-confinement/spec.md#unheaded-block-61` | exact |
| 9 | `confinement-authority.md#unheaded-block-129` | `docs/platform/agent-confinement/spec.md#unheaded-block-62` | exact |
| 10 | `confinement-authority.md#10-lộ-trình-rollout-và-trạng-thái-hoàn-thành` | `docs/platform/agent-confinement/history/rollout-and-settled-facts.md#10-lộ-trình-rollout-và-trạng-thái-hoàn-thành` | exact |
| 11 | `confinement-authority.md#unheaded-block-130` | `docs/platform/agent-confinement/history/rollout-and-settled-facts.md#unheaded-block-3` | exact |
| 12 | `confinement-authority.md#113-behavior-probes` | `docs/platform/agent-confinement/spec.md#113-behavior-probes` | exact |
| 13 | `confinement-authority.md#unheaded-block-135` | `docs/platform/agent-confinement/spec.md#unheaded-block-66` | exact |
| 14 | `confinement-authority.md#12-quyết-định-của-proposal` | `docs/platform/agent-confinement/decisions/confinement-authority-decisions.md#12-quyết-định-của-proposal` | exact |
| 15 | `confinement-authority.md#unheaded-block-139` | `docs/platform/agent-confinement/decisions/confinement-authority-decisions.md#unheaded-block-3` | exact |
| 16 | `confinement-authority.md#13-kết-quả-giải-quyết-rủi-ro-và-các-tồn-đọng-mở-settled-facts-deferred-items` | `docs/platform/agent-confinement/history/rollout-and-settled-facts.md#13-kết-quả-giải-quyết-rủi-ro-và-các-tồn-đọng-mở-settled-facts-deferred-items` | adapted |
| 17 | `confinement-authority.md#unheaded-block-141` | `docs/platform/agent-confinement/history/rollout-and-settled-facts.md#unheaded-block-6` | adapted |
| 18 | `reading-map.md#reading-map-sản-phẩm` | `docs/reading-map.md#5-detailed-product-and-source-map` | adapted |
| 19 | `reading-map.md#unheaded-block-2` | `docs/reading-map.md#unheaded-block-16` | adapted |
| 20 | `seat-binding.md#9-chuyển-đổi-đã-xong-mã-chuyển-đổi-đã-gỡ` | `docs/platform/seat-binding/spec.md#9-chuyển-đổi-đã-xong-mã-chuyển-đổi-đã-gỡ` | exact |
| 21 | `seat-binding.md#unheaded-block-36` | `docs/platform/seat-binding/spec.md#unheaded-block-38` | exact |
| 22 | `seat-binding.md#d-adr0072-seat-binding-one-authority-for-agent-seat-choice-một-authority-cho-ghế-agent-project-thắng-tier-khai-trực-tiếp-supersede-phần-chọn-ghế-của-rul80-an-account-is-chosen-first-then-a-cli-rul91-a-person-may-pin-the-provider-account-of-a-unit-run-rul98-workflow-start-passes---timeout-and---account-to-each-unit-rul102-a-tier-cell-names-its-pool-one-family-has-one-executor-rul103-runnermaxtier-caps-every-seat-rul106-a-seat-walks-a-tier-declared-order-and-its-cell-entries` | `docs/platform/seat-binding/spec.md#d-adr0072-seat-binding-one-authority-for-agent-seat-choice-một-authority-cho-ghế-agent-project-thắng-tier-khai-trực-tiếp-supersede-phần-chọn-ghế-của-rul80-an-account-is-chosen-first-then-a-cli-rul91-a-person-may-pin-the-provider-account-of-a-unit-run-rul98-workflow-start-passes---timeout-and---account-to-each-unit-rul102-a-tier-cell-names-its-pool-one-family-has-one-executor-rul103-runnermaxtier-caps-every-seat-rul106-a-seat-walks-a-tier-declared-order-and-its-cell-entries` | adapted |
| 23 | `seat-binding.md#unheaded-block-60` | `docs/platform/seat-binding/spec.md#unheaded-block-62` | adapted |

## Prepared scanner shards

Only the `appliedToDocs === false` guard and explicit `preparedPendingApply` metadata were added. No extraction, mapping, binding or missing-unit algorithm changed. Live old rows stay effective:

- W8: **44 operative rows**, plus **44 historical lookup entries**.
- W9: **90 operative rows**.

The scratch proof reuses the existing composition replay and its three exact predecessor/relocation/history specs, with `--fuzz=0`, per-step rollback and full byte-exact rollback. An **unflagged** shard pointing at a missing holder still fails **exit 1 / ENOENT**, without replacing the output. After physical composition and marking only scratch flags applied, the scan reads the relocated history and exits 0; **all 134 operative overlay targets/digests/hashes/ancestries resolve independently**.

**Scope limitation, not hidden green:** that composed global scan conservatively reports **2 changed-unit gaps** in README/repo-layout-vision because its unchanged source-binding join does not inherit `sourcePath` through supersession. Final-pin source-join materialization belongs to the composition owner. This turn does not change that algorithm or claim a whole-cutover verdict. The actual live-tree scan required by this import has **33 files / 0 missing current units / 0 missing changed units**.

## Verification and limits

Replays: `python3 -B .../import3/run-checks.py`, `python3 -B .../import3/resync.py --check`, and `python3 -B .../import3/verify.py` (all paths relative to the plan reports). Full argv, environment, stdout/stderr and exits are in `checks-w11.json`; scratch child outputs are captured before cleanup. Earlier author attempts and corrections are listed in `receipt.json.additionalCommands`; original W10 records are preserved, not called current proof.

| Check | Result |
|---|---|
| Current source/binding conservation | 0; 24 source units, 314 effective bindings |
| Scanner negative/composed boundary probes | 0; unflagged ENOENT rejected, 134 composed overlays resolve; residual above |
| Live drift scan + `--check` | 0 / 0; no missing units |
| Unchanged `rebind/rebind.py --check` | 0; drift 0 |
| Both `ownership.mjs` and `audit-ownership.mjs` recipes | 0 each; failing rows empty, no new double ownership |
| Combined `phase-08/audit-report.py` | **1**; only its two `checks.mjs` children fail before a verdict, as below |
| Legacy ratchet | 0; 997 legacy files |
| Owning ratchet single test | 0; **28 passed / 0 failed / 0 skipped**, release host set, session env unset |
| Evidence relocation `--before` | **Not run**: it calls `inspectRepo → ensureScriptAddon`, which requires a native addon; W11 forbids loading one for this check |
| Current joins / scope / JSON / Python syntax / whitespace | 0 |

Exactly the three authorized exception digests were refreshed, naming `571a996f5` in the existing `mainMergeAccounting` format. Original rationale/kind/approval fields, all other exceptions, allowances and baseline remain unchanged. Previous accounting is authenticated at the exact input HEAD. Digest accounting is not content approval.

### Audit native diagnostic (disclosed)

The mandatory unchanged audit wrapper also invokes `checks.mjs`. That child imports the production `trackedPlatformDocs` reader, which **loaded the existing cached addon** through its normal door. It then refused at the native Git floor probe on the read-only live state root (`git-floor-probe-failed`, EROFS). Both child stderr streams are retained in `checks-w11.json.subcommandOutputs`; neither produced a checks verdict, so this is **not** described as check A failing. No Cargo/build output or new staging attempt was observed, no explicit addon preload/build was requested, and no runtime artifact was inspected or cleaned. The separately required ownership proofs passed. The evidence relocation checker itself was never invoked.

## Handoff

Independent review remains owed for the changed bindings/materialized origins; final-pin composition source joins and combined checks verdict remain with their owners. No repository `git add`/`commit` or other Git write, fgOS CLI/lifecycle verb, broad suite, pair accounting, owner/progress/gate-state edit, live prepared-flag change, main landing or authority flip. All scratch is confined to `/tmp/fgos-work/w11-import3/` and removed at handback. `impact-analysis: degraded/unqueried` under the no-CLI brief; no product symbol changed. No preview service started within this confined write scope.
