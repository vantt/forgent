# Step 3 wave 1 expansion review, part p02

Author pin `ae141550c`, worktree `836cc0fe1`. I did not run the checker or any probe. I read the source whole at the pin (184 lines) and extracted the record with python (97 edges: 89 inventory + 8 added). I read the diff (26 hunks) with a word-level diff against the source. I extracted the pin's `docs` tree into scratch to read targets. I also compared every edge's disposition, target and anchor with the accepted pilot record of the sibling file `docs/specs/reading-map.md` (batch-040:11): 0 differences on every row the two files share. My own scan of the source for legacy roots, retiring basenames and tree-relative/directory forms found one uncovered reference (below).

## Verdict

| File | Set | Edges | Verdict |
|---|---|---:|---|
| `docs/reading-map.md` | batch-002 | 97 (32 patch, 31 preserve, 27 parked, 7 row-flip) | **rework** (1 missed reference) |

Per-set count: batch-002 patched stratum, 1 reviewed, 1 rework.

Prior defects: this file is not in the p01..p03 or u01..u04 reports as a defect file. The Related and carriage items they discuss for the sibling files (lines 19 and 124 `docs/specs/reading-map.md`) are correct here, see below.

## Outcome defects

1. **Missed reference, line 163 column 197, `contracts/`** (new rule L12-34(5), directory forms). The sentence "`README.md` là portal ghi nhận chuyển tiếp; `contracts/` lưu giữ hợp đồng lịch sử (`coordination-session.md`, `flow-definition.md`)" sits in the row for `docs/architect/agent-coordination/`. The record adds `README.md` (C154), `coordination-session.md` (C237) and `flow-definition.md` (C264) as added edges. It omits the backticked directory `contracts/`, which resolves from the area root to `docs/architect/agent-coordination/contracts/`. That directory exists at the pin, because its two files are named as targets in the sibling edges. The legacy scan list in `checks.coverage.legacyScan.candidates` has no entry for it, and there is no exclusion. Correction: add `author-r3-docs-reading-map-L163C197` as a parked edge, `description-rewrite` for both categories, with the same reason as its three siblings (08018 row, retired-engine tree, successor note `docs/platform/agent-coordination/history/retired-engine/`). It is the same disposition, so there is no change to the diff.

No other disposition, target, anchor or diff defect. Verified in particular:
- Related: L16 `docs/doc-governance.md` preserves (retained root). L19 `docs/specs/reading-map.md` (07953) parks as duplicate of the consumer itself, per L12-34(4). L124 "Merged from `docs/specs/reading-map.md`" (07963) preserves as lineage, with a successor note that does not name the edge's own path.
- Row flips 07955 (L36), 07958 to 07961 (L81-84, retained user roots keep their paths, status lead-in only) and 07969/07970 (L135, one whole row for both references) are whole-row Phase 9 flips. The replacement texts name files that exist (`packaging-distribution/spec.md`, `contracts/setup-doctor-registry.md`).
- Preserved retained paths all exist at the pin, and none has an alias entry in `docs/doc-registry.json`: doc-governance, README, platform-foundations, backlog, architecture-map (live until Phase 9), work-item-lifecycle-vision, distribution-vision, routing-handoff-contract, io-contract, coexistence, architecture-manifest.json, decisions/ and decisions/index.md, id-systems-audit, the two reference/how-to files, `docs/tutorials/`.
- Historical absence preserves 08037/08038 (`docs/history/phase-3-compound-learning...`): `git log` at the pin finds no history for either path, so "never existed" is true. The quoted markers ("path not present at this commit", "Truth correction ... git ls-tree") are in the source.
- Patch targets exist and anchors hold the cited claim:
  - 07977 `#33-dev-checkout-channel`.
  - 07992 `cli-io-contract.md#3-output-direction-unified-envelope`, 07993 `#7-machine-readable-verb-registry`.
  - 07994 and 08031 `work-state/spec.md#11-business-rules`: RUL60 at line 1089 and RUL45 at 1077 are inside §11.
  - 08008, 08009, 08016, 08017 `subcomponents/h-6979005beaf7/spec.md#business-rules`: RUL53, RUL93, RUL84 and RUL89 are at lines 90, 187, 178 and 183 under `## Business Rules`.
  - Whole-file area pointers (`runner/spec.md`, `claude-plugin/spec.md`, `agent-confinement/spec.md`, `observe/spec.md`, `decision-citation-drift/spec.md`) exist.
- Description truth on the patches I checked against targets:
  - 07996 (plugin row, "36 wrapper / 55 directories / `check` has no wrapper"): `claude-plugin/spec.md` states `check` is not shipped, claims no counts, and says it is a partial inventory. No contradiction.
  - 08011: the target line 34 states "8 falsification probes" and `confinement-attestation.v1` is at line 564. Match.
  - 07985: the target spec itself says the scan scope is `docs/backlog.md` + `docs/specs/*.md`. Consistent. The scan-default claim in 07984 parks separately on Step 5 parity.
- Parks:
  - 08012: the §13.1 recipe is not a section in live `agent-confinement/spec.md` (only a pointer at line 602). It is held in `history/rollout-and-settled-facts.md` line 51, so carry is the true blocker.
  - 08013 to 08015: no live architect-portal or domainization successor. `docs/platform/domainization/` holds only `architecture/domainization.md`, a "Source snapshot retained" carrier. `docs/platform/system-architecture/` holds only history.
  - 08019 and its 5 added edges: the facts hold. `legacy-cli-transition.md` and `external-provider-protocol.md` exist under `architecture/`, and `rust-cli-and-proof-components-plan.md` is absent as a file.
  - 07997/07998: the port is 4170, not 8788.
  - GAP-02 parks (07965, 07981, 08004, 08007, 08028, 08029) match the accepted treatment.
  - 08003 and 07972: parked as description rewrites (L12-34(7)).
- Contextual exclusions in `legacyScan` (L61 `vision.md`, `platform-foundations.md`; L141 repository `README.md`): `docs/platform/vision.md` and `docs/platform/platform-foundations.md` exist, so the exclusions are true. The excluded `README.md` is the repository README.

## Record-text notes (not rework)

- `descriptionTruth` for 08020 and 07977 reuses the packaging channel assessment written for 07976 (it never mentions host-invocation routing). For 08020 it marks "5 tệp" as `matches`, while sibling 08019 records that the 5-file list does not match the candidate layout. Contradictory text inside one record.
- `descriptionTruth` for 08011: counts dimension says `not-asserted`, but the source claims "8 falsification probes" (it matches the target). The assessment text cites §6.2 and `executor.for`, which belong to another edge.
- 08019 and siblings say `host-invocation-provider-routing.md` "became" `architecture/provider-routing.md`. Provider-routing.md is 4.7 KB against a 22.9 KB source, so it is a split, not a rename. This is wording only, because the disposition is a park either way.
- 08000 (L157) carries the "stale absence description in the whole migration status unit" sentence from the L81 unit. That sentence does not describe line 157.
- 07953 reason hedges: "is the consumer itself or already listed". It is the consumer itself.
- 07982 successor note is correct, but the quoted line range "dòng 28-32" has drifted. The orchestrator/launcher chain is at lines 30-32 of `docs/knowledge/decisions-index/decision-record.md`, and lines 28-32 of `docs/decisions/index.md` now hold ADR0005/0008/0020.

## Lead-judgment questions

- **08020 (L164 C596, patch to `packaging-distribution/spec.md`)** is a patch on a row whose other six edges (08019 plus five added) park as description-rewrite because the "5 tệp" list is false. L12-32(3) says same-row edges share the disposition. The same patch/park split was accepted in the pilot (batch-040, r3-g01 considered only 08019 against its five siblings), and the target `packaging-distribution/spec.md` only mentions host-invocation as a boundary (lines 218, 279). Decide whether 08020 should park with its row (my reading of L12-32(3)) or stay as the pilot-accepted patch. If it parks, drop the L164 hunk from the diff.
- **07977 (L142)** leaves the legacy heading label `§Dev checkout shell helpers` after the new `#33-dev-checkout-channel` anchor. The target heading is "3.3 Dev Checkout Channel". The label is informal, like `§envelope` and `§sổ verb` kept after their patches. Same shape accepted in the pilot, so I did not count it as an outcome defect.
- **08030 (L175, `src/state/impact.mjs`)** patches to whole-file `work-state/spec.md`. `### Triage Verb` (line 958, anchor `triage-verb`) states the impact ranking claim nearly verbatim. Whole-file matches the pilot-accepted treatment of the same row, so I left it. The same question applies to the locator-free runner rows (08021 to 08027, 08032, 08033, 08040), where narrower holders exist in the runner candidate carriers.
- **Status prose without a path token** (L23-24 "The legacy source remains retained for provenance until consumer cutover", L128-129 "The retained legacy map remains a provenance pointer until consumer cutover") will be stale after Phase 9 retires `docs/specs/reading-map.md`. No path token, so outside this scan scope. Worth a line in the Phase 9 packet.
- **`docs/decisions/` descriptions (L144, L157):** the retained directory now holds only `index.md` (the narrative corpus was retired). The preserves are correct for the path, but the glosses "hồ sơ quyết định dài hạn" and "decision records" are stale. Left for the A45 description-rewrite packet.

Status: DONE_WITH_CONCERNS
Summary: docs/reading-map.md (97 edges) is rework on one missed reference (`contracts/` at L163 C197, a directory form under the new L12-34(5) rule). Every other disposition, target, anchor and diff hunk checked out, with five Lead-judgment questions, mainly 08020.
